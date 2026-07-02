import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { cookies } from 'next/headers';
import { hash } from 'bcryptjs';

export async function GET(req: Request) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload || payload?.user?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const rawUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                studentId: true,
                role: true,
                createdAt: true,
                courses: {
                    select: {
                        id: true,
                        code: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map it so we have a consistent 'identifier' for the table
        const users = rawUsers.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role,
            identifier: u.email || u.studentId || u.phone || 'N/A',
            studentId: u.studentId, // <-- Include this
            createdAt: u.createdAt,
            courses: u.courses || []
        }));

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error('Admin Users GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload || payload?.user?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { identifier, password, name, role } = await req.json();

        if (!identifier || !password || !name || !role) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Admins can create any role.
        const userRole = ['STUDENT', 'TEACHER', 'CR', 'ADMIN'].includes(role) ? role : 'STUDENT';

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { studentId: identifier },
                    { phone: identifier },
                ]
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this identifier already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 10);

        // Determine which field to put the identifier in
        let createData: any = {
            name,
            password: hashedPassword,
            role: userRole as any,
        };

        if (userRole === 'STUDENT' || userRole === 'CR') {
            createData.studentId = identifier;
            if (identifier.includes('@')) {
                createData.email = identifier;
            }
        } else {
            // TEACHER or ADMIN
            if (identifier.includes('@')) {
                createData.email = identifier;
            } else {
                createData.phone = identifier;
            }
        }

        const newUser = await prisma.user.create({ data: createData });

        return NextResponse.json(
            { message: 'User created successfully', user: { id: newUser.id } },
            { status: 201 }
        );
    } catch (error) {
        console.error('Admin Users POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
