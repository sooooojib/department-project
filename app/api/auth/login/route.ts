import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { identifier, password } = await req.json();

        if (!identifier || !password) {
            return NextResponse.json(
                { message: 'Identifier and password are required' },
                { status: 400 }
            );
        }

        // Find the user by abstract identifier
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { studentId: identifier },
                    { phone: identifier },
                ]
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT
        const token = await encrypt({
            userId: user.id,
            role: user.role as any,
        });

        // Create response with secure HTTP-only cookie
        const response = NextResponse.json(
            {
                message: 'Login successful',
                user: {
                    id: user.id,
                    identifier, // Can be studentId, phone, or email
                    name: user.name,
                    role: user.role
                }
            },
            { status: 200 }
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
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
