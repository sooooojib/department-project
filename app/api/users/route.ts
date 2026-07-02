import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const roleQuery = searchParams.get('role');
        const courseId = searchParams.get('courseId');

        // Fetch students enrolled in a specific course (year/semester match)
        if (courseId) {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { year: true, semester: true }
            });

            if (!course || !course.year || !course.semester) {
                return NextResponse.json({ students: [] }, { status: 200 });
            }

            const rawStudents = await prisma.user.findMany({
                where: {
                    role: { in: ['STUDENT', 'CR'] },
                    year: course.year,
                    semester: course.semester
                },
                select: { id: true, name: true, email: true, studentId: true, phone: true },
                orderBy: { name: 'asc' }
            });

            const students = rawStudents.map(s => ({
                id: s.id,
                name: s.name,
                studentId: s.studentId,
                email: s.email,
                phone: s.phone,
            }));

            return NextResponse.json({ students }, { status: 200 });
        }

        let users: { id: string; name: string; identifier: string; }[] = [];

        if (roleQuery === 'TEACHER') {
            const rawUsers = await prisma.user.findMany({
                where: { role: 'TEACHER' },
                select: { id: true, name: true, email: true, phone: true },
                orderBy: { name: 'asc' }
            });

            users = rawUsers.map(u => ({
                id: u.id,
                name: u.name,
                identifier: u.email || u.phone || ''
            }));
        }

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error('Users GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
