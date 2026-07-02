import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt, SessionPayload } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const payload = await decrypt(token);
        if (!payload || (payload.role !== 'STUDENT' && payload.role !== 'CR')) {
            return NextResponse.json({ message: 'Only students and CRs can submit feedback' }, { status: 403 });
        }

        const { teacherId, rating, comment, isAnonymous, attachmentUrl } = await req.json();

        if (!teacherId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ message: 'Valid teacher ID and rating (1-5) are required' }, { status: 400 });
        }

        // Verify the student has attended at least one class taught by this teacher
        const hasAttendedClass = await prisma.attendance.findFirst({
            where: {
                studentId: payload.userId,
                status: 'PRESENT',
                session: {
                    course: {
                        teachers: {
                            some: {
                                id: teacherId
                            }
                        }
                    }
                }
            }
        });

        if (!hasAttendedClass) {
            return NextResponse.json({ 
                message: 'You can only submit feedback for teachers if you have been present in at least one of their classes.' 
            }, { status: 403 });
        }

        const feedback = await prisma.feedback.create({
            data: {
                studentId: payload.userId,
                teacherId,
                rating,
                comment,
                attachmentUrl,
                isAnonymous: Boolean(isAnonymous),
            },
        });

        return NextResponse.json({ message: 'Feedback submitted successfully', feedback }, { status: 201 });
    } catch (error) {
        console.error('Feedback POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const payload = await decrypt(token);
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        let feedbacks;

        if (payload.role === 'ADMIN') {
            // Admins see all feedback with full student visibility
            feedbacks = await prisma.feedback.findMany({
                include: {
                    student: { select: { id: true, name: true, email: true } },
                    teacher: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else if (payload.role === 'TEACHER') {
            // Teachers see only their feedback
            const rawFeedbacks = await prisma.feedback.findMany({
                where: { teacherId: payload.userId },
                include: {
                    student: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Anonymize the data for the teacher if the student requested it
            feedbacks = rawFeedbacks.map(fb => {
                if (fb.isAnonymous) {
                    return {
                        ...fb,
                        student: { id: 'anonymous', name: 'Anonymous Student', email: 'anonymous@hidden.com' }
                    };
                }
                return fb;
            });
        } else if (payload.role === 'STUDENT' || payload.role === 'CR') {
            // Students and CRs see only the feedback they have submitted
            feedbacks = await prisma.feedback.findMany({
                where: { studentId: payload.userId },
                include: {
                    teacher: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            return NextResponse.json({ message: 'Role not authorized to view this feedback' }, { status: 403 });
        }

        return NextResponse.json({ feedbacks }, { status: 200 });
    } catch (error) {
        console.error('Feedback GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const payload = await decrypt(token);
        if (!payload) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { feedbackId } = body;

        if (!feedbackId) {
            return NextResponse.json({ message: 'Feedback ID is required' }, { status: 400 });
        }

        const existing = await prisma.feedback.findUnique({ where: { id: feedbackId } });
        if (!existing) {
            return NextResponse.json({ message: 'Feedback not found' }, { status: 404 });
        }

        let updatedFeedback;

        if (payload.role === 'TEACHER') {
            if (existing.teacherId !== payload.userId) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
            }
            
            const { reply, replyAttachmentUrl } = body;
            updatedFeedback = await prisma.feedback.update({
                where: { id: feedbackId },
                data: {
                    reply,
                    replyAttachmentUrl: replyAttachmentUrl !== undefined ? replyAttachmentUrl : existing.replyAttachmentUrl,
                    repliedAt: new Date(),
                },
            });
        } else if (payload.role === 'STUDENT' || payload.role === 'CR') {
            if (existing.studentId !== payload.userId) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
            }
            
            const { rating, comment, isAnonymous, attachmentUrl } = body;
            updatedFeedback = await prisma.feedback.update({
                where: { id: feedbackId },
                data: {
                    rating: rating || existing.rating,
                    comment: comment !== undefined ? comment : existing.comment,
                    isAnonymous: isAnonymous !== undefined ? Boolean(isAnonymous) : existing.isAnonymous,
                    attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existing.attachmentUrl,
                },
            });
        } else {
            return NextResponse.json({ message: 'Unauthorized role for editing' }, { status: 403 });
        }

        return NextResponse.json({ message: 'Feedback updated successfully', feedback: updatedFeedback }, { status: 200 });
    } catch (error) {
        console.error('Feedback PATCH error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

