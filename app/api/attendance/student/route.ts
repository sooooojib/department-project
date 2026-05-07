import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const session = await decrypt(token);
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ message: 'Forbidden: Students only' }, { status: 403 });
        }

        const { courseId, date, code } = await req.json();

        if (!courseId || !date || !code) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const attendanceSession = await prisma.attendanceSession.findUnique({
            where: {
                courseId_date: {
                    courseId,
                    date: new Date(date)
                }
            }
        });

        if (!attendanceSession) {
            return NextResponse.json({ message: 'No attendance session found for this date.' }, { status: 404 });
        }

        if (!attendanceSession.isActive) {
            return NextResponse.json({ message: 'The attendance submission window is currently closed.' }, { status: 400 });
        }

        if (attendanceSession.code !== code.toUpperCase()) {
            return NextResponse.json({ message: 'Invalid attendance code.' }, { status: 400 });
        }

        // Upsert the attendance record
        await prisma.attendance.upsert({
            where: {
                sessionId_studentId: {
                    sessionId: attendanceSession.id,
                    studentId: session.userId
                }
            },
            update: {
                status: 'PRESENT'
            },
            create: {
                sessionId: attendanceSession.id,
                studentId: session.userId,
                status: 'PRESENT'
            }
        });

        return NextResponse.json({ message: 'Attendance marked as PRESENT successfully!' }, { status: 200 });

    } catch (error) {
        console.error('Student attendance submission error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
