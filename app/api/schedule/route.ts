import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const session = await decrypt(token);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');

        let whereClause: any = {};

        if (start && end) {
            whereClause = {
                startTime: { gte: new Date(start) },
                endTime: { lte: new Date(end) }
            };
        }

        // If the user is a teacher, they might only want to see their own slots. 
        // For simplicity and a shared calendar view, we'll return all slots, 
        // but let the frontend filter, or we could filter here.
        // If we want a strict "teacher only sees theirs" view:
        // if (session.role === 'TEACHER') { whereClause.teacherId = session.userId; }

        const slots = await prisma.scheduleSlot.findMany({
            where: whereClause,
            include: {
                teacher: { select: { id: true, name: true } },
                bookedBy: { select: { id: true, name: true } }
            },
            orderBy: { startTime: 'asc' }
        });

        return NextResponse.json({ slots });
    } catch (error) {
        console.error('Schedule GET error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const session = await decrypt(token);
        // Only Teachers can OPEN slots
        if (!session || session.role !== 'TEACHER') {
            return NextResponse.json({ message: 'Forbidden: Only teachers can set availability' }, { status: 403 });
        }

        const { startTime, endTime } = await req.json();
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            return NextResponse.json({ message: 'End time must be after start time' }, { status: 400 });
        }

        // CONFLICT PREVENTION: Server-side validation
        // Check if the teacher already has a slot that overlaps with the requested time.
        // Overlap math: ExistingStart < NewEnd AND ExistingEnd > NewStart
        const overlappingSlots = await prisma.scheduleSlot.findMany({
            where: {
                teacherId: session.userId,
                startTime: { lt: end },
                endTime: { gt: start }
            }
        });

        if (overlappingSlots.length > 0) {
            return NextResponse.json({ message: 'Time slot overlaps with an existing slot' }, { status: 409 });
        }

        const newSlot = await prisma.scheduleSlot.create({
            data: {
                teacherId: session.userId,
                startTime: start,
                endTime: end,
                status: 'AVAILABLE'
            }
        });

        return NextResponse.json({ message: 'Availability added', slot: newSlot }, { status: 201 });
    } catch (error) {
        console.error('Schedule POST error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const session = await decrypt(token);
        // Only CRs and Admins can BOOK slots
        if (!session || (session.role !== 'CR' && session.role !== 'ADMIN')) {
            return NextResponse.json({ message: 'Forbidden: Only CRs can book slots' }, { status: 403 });
        }

        const { slotId, title } = await req.json();

        if (!slotId || !title) {
            return NextResponse.json({ message: 'Slot ID and Title are required' }, { status: 400 });
        }

        // CONCURRENCY HANDLING & TRANSACTION-SAFE BOOKING
        // We do not just do a `findUnique` followed by an `update`. 
        // We do a targetted atomic update that ONLY succeeds if the status is STILL 'AVAILABLE'.
        // If two CRs click "Book" at the same exact millisecond, database row locks ensure that 
        // the second query will fail to find a row where `status: 'AVAILABLE'`, throwing a Prisma error.

        const bookedSlot = await prisma.scheduleSlot.update({
            where: {
                id: slotId,
                status: 'AVAILABLE' // Atomic condition: effectively "Update if and only if currently Available"
            },
            data: {
                status: 'BOOKED',
                bookedById: session.userId,
                title: title
            }
        });

        return NextResponse.json({ message: 'Slot booked successfully', slot: bookedSlot }, { status: 200 });

    } catch (error: any) {
        // Prisma will throw an error (P2025: Record to update not found) if the slot doesn't exist 
        // OR if the `status: 'AVAILABLE'` atomic condition failed (meaning someone else grabbed it).
        if (error.code === 'P2025') {
            return NextResponse.json({ message: 'Slot is no longer available or does not exist.' }, { status: 409 });
        }

        console.error('Schedule PUT error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
