import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ role: null }, { status: 200 });

        const payload = await decrypt(token);
        return NextResponse.json({
            role: payload?.role || null,
            userId: payload?.userId || null
        }, { status: 200 });
    } catch {
        return NextResponse.json({ role: null }, { status: 200 });
    }
}
