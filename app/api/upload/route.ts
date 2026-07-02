import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
                        const payload = await getServerSession(authOptions);
        if (!payload || !['TEACHER', 'STUDENT', 'CR'].includes(payload?.user?.role)) {
            return NextResponse.json({ message: 'Only authorized users can upload files' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });
        
        const filePath = path.join(uploadDir, safeFilename);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${safeFilename}`;

        return NextResponse.json({ url: fileUrl }, { status: 201 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
