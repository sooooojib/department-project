import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const session = await decrypt(token);
        if (!session || session.role !== 'CR') {
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

        const slot = await prisma.scheduleSlot.create({
            data: {
                teacherId: teacherId,
                startTime: startDateTime,
                endTime: endDateTime,
                status: 'BOOKED',
                bookedById: session.userId,
                title: title
            }
        });

        return NextResponse.json({ message: 'Class scheduled successfully', slot }, { status: 201 });
    } catch (error) {
        console.error('CR Class Schedule POST error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
