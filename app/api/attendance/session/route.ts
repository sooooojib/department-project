import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function GET(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
                const session = await getServerSession(authOptions);
        if (!session || (session?.user?.role !== 'TEACHER' && session?.user?.role !== 'ADMIN')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const url = new URL(req.url);
        const courseId = url.searchParams.get('courseId');
        const dateStr = url.searchParams.get('date');

        if (!courseId || !dateStr) {
            return NextResponse.json({ message: 'Missing courseId or date' }, { status: 400 });
        }

        const attendanceSession = await prisma.attendanceSession.findUnique({
            where: {
                courseId_date: {
                    courseId,
                    date: new Date(dateStr)
                }
            }
        });

        if (!attendanceSession) {
            return NextResponse.json({ code: null, isActive: false });
        }

        return NextResponse.json({ 
            code: attendanceSession.code, 
            isActive: attendanceSession.isActive 
        });

    } catch (error) {
        console.error('Fetch session error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
                const session = await getServerSession(authOptions);
        if (!session || (session?.user?.role !== 'TEACHER' && session?.user?.role !== 'ADMIN')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { courseId, date, action } = await req.json();

        if (!courseId || !date || (action !== 'activate' && action !== 'deactivate')) {
            return NextResponse.json({ message: 'Invalid data payload' }, { status: 400 });
        }

        const isActive = action === 'activate';
        const code = isActive ? generateRandomCode() : null;

        const attendanceSession = await prisma.attendanceSession.upsert({
            where: {
                courseId_date: {
                    courseId,
                    date: new Date(date),
                }
            },
            update: {
                isActive,
                ...(isActive ? { code } : {}) // Keep old code or nullify it? Actually, better to generate a new one if activating.
            },
            create: {
                courseId,
                date: new Date(date),
                isActive,
                code
            }
        });

        // If deactivating, we might want to clear the code, but let's keep it in DB for history if needed,
        // although here we are updating it. For now, we update `isActive` to false. 
        // If they activate again, a new code is generated.

        return NextResponse.json({ 
            message: `Session ${isActive ? 'activated' : 'deactivated'} successfully`,
            code: attendanceSession.code,
            isActive: attendanceSession.isActive
        }, { status: 200 });

    } catch (error) {
        console.error('Session update error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
