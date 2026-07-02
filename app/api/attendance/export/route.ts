import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        const session = await getServerSession(authOptions);
        if (!session || session?.user?.role === 'STUDENT') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const url = new URL(req.url);
        const courseId = url.searchParams.get('courseId');

        if (!courseId) {
            return new NextResponse('Course ID is required', { status: 400 });
        }

        // Pull the data formatted for the CSV
        const sessions = await prisma.attendanceSession.findMany({
            where: { courseId },
            include: {
                course: true,
                records: {
                    include: { student: { select: { id: true, name: true, email: true, studentId: true, phone: true } } }
                }
            },
            orderBy: { date: 'asc' }
        });

        if (sessions.length === 0) {
            return new NextResponse('No attendance data available for export', { status: 404 });
        }

        let csvContent = "Course Name,Session Date,Student Name,Student Identifier,Status\n";

        sessions.forEach((sess) => {
            const formattedDate = sess.date.toISOString().split('T')[0];
            const courseName = sess.course.name.replace(/,/g, ''); // prevent csv comma breaking

            sess.records.forEach((record) => {
                const studentName = record.student.name.replace(/,/g, '');
                const studentIdentifier = record.student.studentId || record.student.email || record.student.phone || 'N/A';
                const status = record.status;

                // Add the assembled row directly to the master string
                csvContent += `${courseName},${formattedDate},${studentName},${studentIdentifier},${status}\n`;
            });
        });

        // Format as a downloadable file via HTTP headers
        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename="attendance_report_${courseId}.csv"`);

        return new NextResponse(csvContent, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Export error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
