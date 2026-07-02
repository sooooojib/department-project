import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';

export async function DELETE(
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

        // Prevent admin from deleting themselves
        if (id === payload?.user?.id) {
            return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 403 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Admin User DELETE error:', error);
        return NextResponse.json({ message: 'Internal server error or user not found' }, { status: 500 });
    }
}
