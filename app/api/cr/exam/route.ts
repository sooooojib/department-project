import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: List upcoming exams
export async function GET(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        const payload = token ? await decrypt(token) : null;
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const exams = await prisma.exam.findMany({
            where: { date: { gte: new Date() } },
            include: {
                course: { select: { id: true, code: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { date: 'asc' },
        });

        return NextResponse.json({ exams }, { status: 200 });
    } catch (error) {
        console.error('Exam GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create an exam (CR only, with conflict prevention)
export async function POST(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        const payload = token ? await decrypt(token) : null;
        if (!payload || payload.role !== 'CR') {
            return NextResponse.json({ message: 'Forbidden: Only CRs can schedule exams.' }, { status: 403 });
        }

        const { title, courseId, date } = await req.json();
        if (!title || !courseId || !date) {
            return NextResponse.json({ message: 'Title, courseId, and date are required.' }, { status: 400 });
        }

        const examDate = new Date(date);
        const examDateEnd = new Date(examDate.getTime() + 2 * 60 * 60 * 1000); // assume 2hr window

        // Conflict check: any booked ScheduleSlot overlapping this time
        const conflictingSchedule = await prisma.scheduleSlot.findFirst({
            where: {
                status: 'BOOKED',
                startTime: { lt: examDateEnd },
                endTime: { gt: examDate },
            },
        });

        if (conflictingSchedule) {
            return NextResponse.json(
                { message: 'Conflict: There is already a class scheduled during this time.' },
                { status: 409 }
            );
        }

        // Conflict check: another exam on the same day for the same course
        const dayStart = new Date(examDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(examDate);
        dayEnd.setHours(23, 59, 59, 999);

        const conflictingExam = await prisma.exam.findFirst({
            where: {
                courseId,
                date: { gte: dayStart, lte: dayEnd },
            },
        });

        if (conflictingExam) {
            return NextResponse.json(
                { message: 'Conflict: An exam for this course is already scheduled on this day.' },
                { status: 409 }
            );
        }

        const exam = await prisma.exam.create({
            data: {
                title,
                courseId,
                date: examDate,
                createdById: payload.userId,
            },
            include: {
                course: { select: { code: true, name: true } },
            },
        });

        return NextResponse.json({ message: 'Exam scheduled successfully.', exam }, { status: 201 });
    } catch (error) {
        console.error('Exam POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
