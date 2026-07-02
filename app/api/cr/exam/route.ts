import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';

// GET: List upcoming exams
export async function GET(req: Request) {
    try {
                const payload = await getServerSession(authOptions);
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const exams = await prisma.exam.findMany({
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
                const payload = await getServerSession(authOptions);
        if (!payload || payload?.user?.role !== 'CR') {
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
                createdById: payload?.user?.id,
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

// PUT: Update/Edit an exam (CR only, with conflict prevention)
export async function PUT(req: Request) {
    try {
                const payload = await getServerSession(authOptions);
        if (!payload || payload?.user?.role !== 'CR') {
            return NextResponse.json({ message: 'Forbidden: Only CRs can edit exams.' }, { status: 403 });
        }

        const { id, title, courseId, date } = await req.json();
        if (!id || !title || !courseId || !date) {
            return NextResponse.json({ message: 'Exam ID, title, courseId, and date are required.' }, { status: 400 });
        }

        const existingExam = await prisma.exam.findUnique({
            where: { id },
        });

        if (!existingExam) {
            return NextResponse.json({ message: 'Exam not found.' }, { status: 444 });
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
                NOT: { id },
            },
        });

        if (conflictingExam) {
            return NextResponse.json(
                { message: 'Conflict: An exam for this course is already scheduled on this day.' },
                { status: 409 }
            );
        }

        const updatedExam = await prisma.exam.update({
            where: { id },
            data: {
                title,
                courseId,
                date: examDate,
            },
            include: {
                course: { select: { code: true, name: true } },
            },
        });

        return NextResponse.json({ message: 'Exam updated successfully.', exam: updatedExam }, { status: 200 });
    } catch (error) {
        console.error('Exam PUT error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove an exam (CR only)
export async function DELETE(req: Request) {
    try {
                const payload = await getServerSession(authOptions);
        if (!payload || payload?.user?.role !== 'CR') {
            return NextResponse.json({ message: 'Forbidden: Only CRs can delete exams.' }, { status: 403 });
        }

        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ message: 'Exam ID is required.' }, { status: 400 });
        }

        const existingExam = await prisma.exam.findUnique({
            where: { id },
        });

        if (!existingExam) {
            return NextResponse.json({ message: 'Exam not found.' }, { status: 404 });
        }

        // Optional: Check if the CR is the one who created it, or if any CR can delete
        if (existingExam.createdById !== payload?.user?.id) {
            return NextResponse.json({ message: 'Forbidden: You did not schedule this exam.' }, { status: 403 });
        }

        await prisma.exam.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Exam deleted successfully.' }, { status: 200 });
    } catch (error) {
        console.error('Exam DELETE error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

