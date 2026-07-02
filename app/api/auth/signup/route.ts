import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        let { identifier, email, name, role } = await req.json();

        if (!identifier || !email || !name) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Make student IDs all caps
        if (role === 'STUDENT' || role === 'CR') {
            identifier = identifier.toUpperCase();
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: 'Invalid email address format' },
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
                    { email: email },
                    { studentId: identifier },
                    { phone: identifier },
                ]
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email or identifier already exists' },
                { status: 409 }
            );
        }

        // Check if a signup request already exists for this email
        const existingRequest = await prisma.signupRequest.findFirst({
            where: { email: email }
        });

        if (existingRequest) {
            if (existingRequest.status === 'PENDING') {
                return NextResponse.json(
                    { message: 'A pending request with this email already exists' },
                    { status: 409 }
                );
            } else {
                // If there's an old REJECTED or APPROVED request, delete it so they can submit a new one
                await prisma.signupRequest.delete({
                    where: { id: existingRequest.id }
                });
            }
        }

        // Create the pending SignupRequest
        const newRequest = await prisma.signupRequest.create({
            data: {
                name,
                email,
                role: userRole as any,
                identifier,
            },
        });

        return NextResponse.json(
            { message: 'Signup request submitted for admin approval', requestId: newRequest.id },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
