import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload || payload?.user?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        const { courseIds } = await req.json();

        if (!Array.isArray(courseIds)) {
            return NextResponse.json({ message: 'courseIds must be an array' }, { status: 400 });
        }

        // Verify the user is actually a TEACHER
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'TEACHER') {
            return NextResponse.json({ message: 'User is not a teacher or not found' }, { status: 404 });
        }

        // Update the user's courses using `set` to replace exactly what they have
        await prisma.user.update({
            where: { id },
            data: {
                courses: {
                    set: courseIds.map(courseId => ({ id: courseId }))
                }
            }
        });

        return NextResponse.json({ message: 'Courses assigned successfully' }, { status: 200 });
    } catch (error) {
        console.error('Admin Assign Courses POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
