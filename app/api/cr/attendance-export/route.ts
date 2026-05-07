import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: Download attendance as CSV (CR only, read-only)
export async function GET(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        const payload = token ? await decrypt(token) : null;
        if (!payload || payload.role !== 'CR') {
            return NextResponse.json({ message: 'Forbidden: Only CRs can export attendance.' }, { status: 403 });
        }

        const url = new URL(req.url);
        const courseId = url.searchParams.get('courseId');

        // Fetch all attendance sessions (optionally filtered by course)
        const sessions = await prisma.attendanceSession.findMany({
            where: courseId ? { courseId } : {},
            include: {
                course: true,
                records: {
                    include: {
                        student: {
                            select: { name: true, studentId: true, email: true },
                        },
                    },
                },
            },
            orderBy: { date: 'asc' },
        });

        // Build CSV rows
        const rows: string[] = [
            'Course Code,Course Name,Session Date,Student Name,Student ID,Status',
        ];

        for (const session of sessions) {
            for (const record of session.records) {
                const dateStr = new Date(session.date).toLocaleDateString('en-GB');
                const studentId = record.student.studentId || record.student.email || 'N/A';
                rows.push(
                    `"${session.course.code}","${session.course.name}","${dateStr}","${record.student.name}","${studentId}","${record.status}"`
                );
            }
        }

        const csv = rows.join('\n');

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="attendance.csv"',
            },
        });
    } catch (error) {
        console.error('Attendance export error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
