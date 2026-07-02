import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { sendApprovalEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const { action } = await req.json(); // 'approve' or 'reject'
        const params = await props.params;
        const requestId = params.id;

        const signupRequest = await prisma.signupRequest.findUnique({
            where: { id: requestId },
        });

        if (!signupRequest || signupRequest.status !== 'PENDING') {
            return NextResponse.json({ message: 'Request not found or already processed' }, { status: 404 });
        }

        if (action === 'reject') {
            await prisma.signupRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' },
            });
            return NextResponse.json({ message: 'Request rejected successfully' });
        }

        if (action === 'approve') {
            // 1. Generate random password
            const rawPassword = 'eduportal-' + crypto.randomBytes(4).toString('hex');
            
            // 2. Hash password
            const hashedPassword = await hash(rawPassword, 10);

            // 3. Create User
            let createData: any = {
                name: signupRequest.name,
                email: signupRequest.email,
                password: hashedPassword,
                role: signupRequest.role,
            };

            const userRole = signupRequest.role;
            const identifier = signupRequest.identifier;

            if (userRole === 'STUDENT' || userRole === 'CR') {
                createData.studentId = identifier;
            } else {
                // TEACHER or ADMIN - check if identifier is email (unlikely if they provided email in signup, but could be phone)
                if (identifier !== signupRequest.email) {
                    createData.phone = identifier;
                }
            }

            // Check if user already exists (edge case if they were added manually)
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: signupRequest.email },
                        { studentId: identifier },
                        ...(createData.phone ? [{ phone: createData.phone }] : [])
                    ]
                }
            });

            if (existingUser) {
                return NextResponse.json({ message: 'A user with this email or identifier already exists in the system' }, { status: 409 });
            }

            const newUser = await prisma.user.create({
                data: createData,
            });

            // 4. Update Request Status
            await prisma.signupRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' },
            });

            const emailResult = await sendApprovalEmail(
                signupRequest.email,
                signupRequest.name,
                signupRequest.role,
                signupRequest.email,
                rawPassword
            );

            if (!emailResult.success) {
                console.error("Failed to send email, but user was created.");
                // We return a 200, but inform the client that email failed
                return NextResponse.json({ 
                    message: 'User approved and created, but failed to send email. Password is: ' + rawPassword 
                });
            }

            return NextResponse.json({ message: 'User approved and email sent successfully' });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error processing signup request:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
