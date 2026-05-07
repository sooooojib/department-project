import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { identifier, password, name, role } = await req.json();

        if (!identifier || !password || !name) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (role === 'ADMIN') {
            return NextResponse.json(
                { message: 'Cannot create administrator accounts here.' },
                { status: 403 }
            );
        }

        const userRole = role && ['STUDENT', 'TEACHER', 'CR'].includes(role)
            ? role
            : 'STUDENT';

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
            role: userRole,
        };

        if (userRole === 'STUDENT' || userRole === 'CR') {
            createData.studentId = identifier;
            // Optionally, we could accept an explicit email separately, but for now we'll rely on the identifier payload
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

        const newUser = await prisma.user.create({
            data: createData,
        });

        // Generate JWT
        const token = await encrypt({
            userId: newUser.id,
            role: newUser.role as any,
        });

        // Create response with cookie
        const response = NextResponse.json(
            { message: 'Signup successful', user: { id: newUser.id, identifier, name, role: newUser.role } },
            { status: 201 }
        );

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return response;
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
