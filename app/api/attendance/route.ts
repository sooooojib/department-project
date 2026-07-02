import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
                const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        // Parse search params for specific course if needed
        const url = new URL(req.url);
        const courseId = url.searchParams.get('courseId');

        if (session?.user?.role === 'STUDENT' || session?.user?.role === 'CR') {
            // Students only see their own attendance
            const attendances = await prisma.attendance.findMany({
                where: {
                    studentId: session?.user?.id,
                    ...(courseId && { session: { courseId } }),
                },
                include: {
                    session: { include: { course: true } },
                },
                orderBy: { session: { date: 'desc' } }
            });
            return NextResponse.json({ attendances });
        } else {
            // Teachers, Admins, CRs can see all attendance for a course session (read-only for CR)
            const rawSessions = await prisma.attendanceSession.findMany({
                where: { ...(courseId && { courseId }) },
                include: {
                    course: true,
                    records: {
                        include: { student: { select: { id: true, name: true, email: true, studentId: true, phone: true } } }
                    }
                },
                orderBy: { date: 'desc' }
            });

            // Map the output to send 'identifier' uniformly for the frontend
            const sessions = rawSessions.map(session => ({
                ...session,
                records: session.records.map(r => ({
                    ...r,
                    student: {
                        id: r.student.id,
                        name: r.student.name,
                        identifier: r.student.studentId || r.student.email || r.student.phone || ''
                    }
                }))
            }));

            return NextResponse.json({ sessions });
        }
    } catch (error) {
        console.error('Attendance fetch error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
                const session = await getServerSession(authOptions);
        if (!session || (session?.user?.role !== 'TEACHER' && session?.user?.role !== 'ADMIN')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { courseId, date, records } = await req.json();

        if (!courseId || !date || !Array.isArray(records)) {
            return NextResponse.json({ message: 'Invalid data payload' }, { status: 400 });
        }

        // Upsert Session (prevents recreating a session for the same day/course)
        const attendanceSession = await prisma.attendanceSession.upsert({
            where: {
                courseId_date: {
                    courseId,
                    date: new Date(date),
                }
            },
            update: {},
            create: {
                courseId,
                date: new Date(date)
            }
        });

        // Upsert all attendance records. This acts as the physical duplicate prevention.
        // Even if the teacher submits twice, the uniqueness of [sessionId, studentId] 
        // will just update the status safely instead of duplicating elements.
        const upsertPromises = records.map((record) =>
            prisma.attendance.upsert({
                where: {
                    sessionId_studentId: {
                        sessionId: attendanceSession.id,
                        studentId: record.studentId
                    }
                },
                update: {
                    status: record.status // 'PRESENT' or 'ABSENT'
                },
                create: {
                    sessionId: attendanceSession.id,
                    studentId: record.studentId,
                    status: record.status
                }
            })
        );

        await Promise.all(upsertPromises);

        // Record this as a taught class for dashboard tally
        // We create a ScheduleSlot entry (BOOKED) for this teacher/course/date
        const slotStart = new Date(date);
        slotStart.setHours(8, 0, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(9, 0, 0, 0);

        // Find existing slot for this teacher+course+date to avoid duplicates
        const existingSlot = await prisma.scheduleSlot.findFirst({
            where: {
                teacherId: session?.user?.id,
                title: { contains: courseId },
                startTime: { gte: new Date(new Date(date).setHours(0,0,0,0)), lt: new Date(new Date(date).setHours(23,59,59,999)) }
            }
        });

        if (!existingSlot) {
            await prisma.scheduleSlot.create({
                data: {
                    teacherId: session?.user?.id,
                    startTime: slotStart,
                    endTime: slotEnd,
                    status: 'BOOKED',
                    title: `Attendance:${courseId}`,
                    bookedById: session?.user?.id,
                }
            });
        }

        return NextResponse.json({ message: 'Attendance marked successfully' }, { status: 200 });

    } catch (error) {
        console.error('Attendance sumbit error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
