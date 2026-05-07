import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const payload = await decrypt(token);
        if (!payload || (payload.role !== 'STUDENT' && payload.role !== 'CR')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const roleQuery = searchParams.get('role');

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
