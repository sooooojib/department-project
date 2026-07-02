import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload || payload?.user?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const requests = await prisma.user.findMany({
            where: {
                semesterStatus: 'PENDING',
                role: { in: ['STUDENT', 'CR'] }
            },
            select: {
                id: true,
                name: true,
                studentId: true,
                requestedYear: true,
                requestedSemester: true,
                semesterStatus: true,
                createdAt: true,
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ requests }, { status: 200 });
    } catch (error) {
        console.error('Admin Semester Requests GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
