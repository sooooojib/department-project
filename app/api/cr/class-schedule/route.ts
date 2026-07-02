import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
                const session = await getServerSession(authOptions);
        if (!session || session?.user?.role !== 'CR') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { courseId, teacherId, date, startTime, endTime, roomNumber } = await req.json();

        // Get course code
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return NextResponse.json({ message: 'Invalid course' }, { status: 400 });

        const title = `${course.code} - ${course.name} | Room: ${roomNumber}`;

        // Create Date objects combining the date and time strings properly
        // e.g. date: "2024-05-10", startTime: "14:30" => "2024-05-10T14:30:00"
        const startDateTime = new Date(`${date}T${startTime}:00`);
        const endDateTime = new Date(`${date}T${endTime}:00`);

        // Enforce that CR can ONLY assign classes for exactly the next day
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        if (startDateTime < tomorrowStart || startDateTime > tomorrowEnd) {
            return NextResponse.json({ message: 'Classes can only be scheduled exactly for the next day.' }, { status: 400 });
        }

        const slot = await prisma.scheduleSlot.create({
            data: {
                teacherId: teacherId,
                startTime: startDateTime,
                endTime: endDateTime,
                status: 'BOOKED',
                bookedById: session?.user?.id,
                title: title
            }
        });

        return NextResponse.json({ message: 'Class scheduled successfully', slot }, { status: 201 });
    } catch (error) {
        console.error('CR Class Schedule POST error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH: Edit an existing class slot (CR only)
export async function PATCH(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
                const session = await getServerSession(authOptions);
        if (!session || session?.user?.role !== 'CR') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { slotId, courseId, teacherId, date, startTime, endTime, roomNumber } = await req.json();
        if (!slotId) return NextResponse.json({ message: 'Slot ID is required' }, { status: 400 });

        const existing = await prisma.scheduleSlot.findUnique({ where: { id: slotId } });
        if (!existing) return NextResponse.json({ message: 'Slot not found' }, { status: 404 });
        if (existing.bookedById !== session?.user?.id) {
            return NextResponse.json({ message: 'Forbidden: you did not create this slot' }, { status: 403 });
        }

        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return NextResponse.json({ message: 'Invalid course' }, { status: 400 });

        const newTitle = `${course.code} - ${course.name} | Room: ${roomNumber}`;
        const startDateTime = new Date(`${date}T${startTime}:00`);
        const endDateTime = new Date(`${date}T${endTime}:00`);

        // Allow editing only for tomorrow's class
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        if (startDateTime < tomorrowStart || startDateTime > tomorrowEnd) {
            return NextResponse.json({ message: 'Can only reschedule to tomorrow.' }, { status: 400 });
        }

        const updated = await prisma.scheduleSlot.update({
            where: { id: slotId },
            data: {
                teacherId,
                startTime: startDateTime,
                endTime: endDateTime,
                title: newTitle,
            },
        });

        return NextResponse.json({ message: 'Class updated successfully', slot: updated }, { status: 200 });
    } catch (error) {
        console.error('CR Class Schedule PATCH error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove a class slot (CR only, must be the creator)
export async function DELETE(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
                const session = await getServerSession(authOptions);
        if (!session || session?.user?.role !== 'CR') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { slotId } = await req.json();
        if (!slotId) return NextResponse.json({ message: 'Slot ID is required' }, { status: 400 });

        const existing = await prisma.scheduleSlot.findUnique({ where: { id: slotId } });
        if (!existing) return NextResponse.json({ message: 'Slot not found' }, { status: 404 });
        if (existing.bookedById !== session?.user?.id) {
            return NextResponse.json({ message: 'Forbidden: you did not create this slot' }, { status: 403 });
        }

        await prisma.scheduleSlot.delete({ where: { id: slotId } });

        return NextResponse.json({ message: 'Class deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('CR Class Schedule DELETE error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
