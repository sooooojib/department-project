import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: List all courses (accessible by all authenticated users)
export async function GET(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        const payload = token ? await decrypt(token) : null;
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const courses = await prisma.course.findMany({
            select: { id: true, code: true, name: true, description: true, credit: true, year: true, semester: true },
            orderBy: { code: 'asc' },
        });

        return NextResponse.json({ courses }, { status: 200 });
    } catch (error) {
        console.error('Courses GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
