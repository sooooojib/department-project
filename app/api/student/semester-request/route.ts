import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload || (payload?.user?.role !== 'STUDENT' && payload?.user?.role !== 'CR')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload?.user?.id },
            select: {
                year: true,
                semester: true,
                requestedYear: true,
                requestedSemester: true,
                semesterStatus: true,
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Student Semester Request GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload || (payload?.user?.role !== 'STUDENT' && payload?.user?.role !== 'CR')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { year, semester } = await req.json();

        // Basic validation
        const parsedYear = parseInt(year);
        const parsedSemester = parseInt(semester);

        if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 4 || isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 2) {
            return NextResponse.json({ message: 'Invalid Year or Semester. Year must be 1-4, Semester must be 1-2.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: payload?.user?.id },
            data: {
                requestedYear: parsedYear,
                requestedSemester: parsedSemester,
                semesterStatus: 'PENDING',
            },
            select: {
                id: true,
                requestedYear: true,
                requestedSemester: true,
                semesterStatus: true,
            }
        });

        return NextResponse.json({ message: 'Semester request submitted successfully', user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error('Student Semester Request POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload || (payload?.user?.role !== 'STUDENT' && payload?.user?.role !== 'CR')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { action } = await req.json();

        if (action === 'DISMISS_REJECTION') {
            const updatedUser = await prisma.user.update({
                where: { id: payload?.user?.id },
                data: {
                    semesterStatus: null,
                },
                select: {
                    id: true,
                    semesterStatus: true,
                }
            });
            return NextResponse.json({ message: 'Rejection dismissed', user: updatedUser }, { status: 200 });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Student Semester Request PATCH error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
