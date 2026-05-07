import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: Fetch available slots (Student View) or created slots & requests (Teacher View)
export async function GET(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        const payload = token ? await decrypt(token) : null;
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const view = url.searchParams.get('view');

        // If Student or CR requesting all available slots
        if (payload.role === 'STUDENT' || payload.role === 'CR' || view === 'available') {
            const slots = await prisma.counselingSlot.findMany({
                where: {
                    // Only fetch slots that don't have an APPROVED request
                    requests: {
                        none: { status: 'APPROVED' }
                    },
                    startTime: { gte: new Date() } // Future slots only
                },
                include: { teacher: { select: { id: true, name: true } } },
                orderBy: { startTime: 'asc' }
            });
            return NextResponse.json({ slots }, { status: 200 });
        }

        // If Teacher requesting their own slots and pending requests
        if (payload.role === 'TEACHER') {
            const slots = await prisma.counselingSlot.findMany({
                where: { teacherId: payload.userId },
                include: {
                    requests: {
                        include: { student: { select: { id: true, name: true, email: true } } },
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { startTime: 'asc' }
            });
            return NextResponse.json({ slots }, { status: 200 });
        }

        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create a Slot (Teacher) or Request a Slot (Student)
export async function POST(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        const payload = token ? await decrypt(token) : null;
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // TEACHER: Creates a new available time slot
        if (payload.role === 'TEACHER') {
            const { startTime, endTime } = body;
            if (!startTime || !endTime) return NextResponse.json({ message: 'Missing times' }, { status: 400 });

            const slot = await prisma.counselingSlot.create({
                data: {
                    teacherId: payload.userId,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime)
                }
            });
            return NextResponse.json({ message: 'Slot created', slot }, { status: 201 });
        }

        // STUDENT or CR: Requests an existing slot (CR can book on behalf of a student)
        if (payload.role === 'STUDENT' || payload.role === 'CR') {
            const { slotId, purpose, studentId } = body;
            if (!slotId || !purpose) return NextResponse.json({ message: 'Missing fields' }, { status: 400 });

            // CR can book on behalf of another student; students book for themselves
            const bookerStudentId = (payload.role === 'CR' && studentId) ? studentId : payload.userId;

            // Ensure slot isn't already approved for someone else
            const existingApproved = await prisma.counselingRequest.findFirst({
                where: { slotId, status: 'APPROVED' }
            });

            if (existingApproved) {
                return NextResponse.json({ message: 'This slot has already been booked.' }, { status: 409 });
            }

            const request = await prisma.counselingRequest.create({
                data: {
                    slotId,
                    studentId: bookerStudentId,
                    purpose
                }
            });
            return NextResponse.json({ message: 'Request submitted', request }, { status: 201 });
        }

        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// PATCH: Approve or Reject a Student's Request (Teacher)
export async function PATCH(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        const payload = token ? await decrypt(token) : null;
        if (!payload || payload.role !== 'TEACHER') {
            return NextResponse.json({ message: 'Forbidden. Only teachers can manage requests.' }, { status: 403 });
        }

        const { requestId, status } = await req.json();
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        // Transaction ensures atomicity. If approving, we reject all competing requests for the same slot.
        const result = await prisma.$transaction(async (tx) => {
            const request = await tx.counselingRequest.findUnique({
                where: { id: requestId },
                include: { slot: true }
            });

            if (!request) throw new Error('Request not found');
            if (request.slot.teacherId !== payload.userId) throw new Error('Unauthorized for this slot');

            // Find if slot is already approved to someone else
            if (status === 'APPROVED') {
                const approvedCheck = await tx.counselingRequest.findFirst({
                    where: { slotId: request.slotId, status: 'APPROVED' }
                });

                if (approvedCheck && approvedCheck.id !== requestId) {
                    throw new Error('Slot already approved to another student');
                }

                // If we approve this one, we must reject all others for the same slot to prevent overlap
                await tx.counselingRequest.updateMany({
                    where: { slotId: request.slotId, id: { not: requestId }, status: 'PENDING' },
                    data: { status: 'REJECTED' }
                });
            }

            const updatedRequest = await tx.counselingRequest.update({
                where: { id: requestId },
                data: { status }
            });

            // Note: In an extended system, trigger an email notification to the student here.

            return updatedRequest;
        });

        return NextResponse.json({ message: `Request ${status.toLowerCase()}`, request: result }, { status: 200 });

    } catch (error: any) {
        const message = error.message || 'Internal error';
        const statusCode = message.includes('already approved') ? 409 : 500;
        return NextResponse.json({ message }, { status: statusCode });
    }
}
