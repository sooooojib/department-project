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

        const { action } = await req.json();
        if (action !== 'APPROVE' && action !== 'REJECT') {
            return NextResponse.json({ message: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 });
        }

        // Fetch user first to get the requested values
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                requestedYear: true,
                requestedSemester: true,
                semesterStatus: true,
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.semesterStatus !== 'PENDING') {
            return NextResponse.json({ message: 'No pending request found for this user' }, { status: 400 });
        }

        if (action === 'APPROVE') {
            if (user.requestedYear === null || user.requestedSemester === null) {
                return NextResponse.json({ message: 'Requested year or semester is missing' }, { status: 400 });
            }

            await prisma.user.update({
                where: { id },
                data: {
                    year: user.requestedYear,
                    semester: user.requestedSemester,
                    semesterStatus: 'APPROVED',
                    requestedYear: null,
                    requestedSemester: null,
                }
            });

            return NextResponse.json({ message: 'Semester request approved successfully' }, { status: 200 });
        } else {
            // REJECT
            await prisma.user.update({
                where: { id },
                data: {
                    semesterStatus: 'REJECTED',
                    requestedYear: null,
                    requestedSemester: null,
                }
            });

            return NextResponse.json({ message: 'Semester request rejected successfully' }, { status: 200 });
        }
    } catch (error) {
        console.error('Admin Semester Approval action error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
