import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';

// GET: List courses. For CR with ?crSemester=true, only return courses matching their semester.
export async function GET(req: Request) {
    try {
                const payload = await getServerSession(authOptions);
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const crSemester = url.searchParams.get('crSemester') === 'true';

        let whereClause: any = {};

        if (crSemester && payload?.user?.role === 'CR') {
            const user = await prisma.user.findUnique({
                where: { id: payload?.user?.id },
                select: { year: true, semester: true },
            });
            if (user?.year && user?.semester) {
                whereClause = { year: user.year, semester: user.semester };
            }
        }

        const courses = await prisma.course.findMany({
            where: whereClause,
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                credit: true,
                year: true,
                semester: true,
                teachers: { select: { id: true, name: true } },
            },
            orderBy: { code: 'asc' },
        });

        return NextResponse.json({ courses }, { 
            status: 200,
            headers: {
                'Cache-Control': 's-maxage=60, stale-while-revalidate'
            }
        });
    } catch (error) {
        console.error('Courses GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
