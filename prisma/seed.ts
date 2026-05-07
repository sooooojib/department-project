import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient({});

async function main() {
    const hashedPassword = await hash('password123', 10);

    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@example.com' },
        update: {},
        create: {
            email: 'teacher@example.com',
            name: 'Test Teacher',
            password: hashedPassword,
            role: 'TEACHER',
        },
    });

    const student = await prisma.user.upsert({
        where: { email: 'student@example.com' },
        update: {
            studentId: '23423413',
        },
        create: {
            email: 'student@example.com',
            studentId: '23423413',
            name: 'Test Student',
            password: hashedPassword,
            role: 'STUDENT',
        },
    });

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            phone: 'admin123',
            name: 'System Admin',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log('Seeded database with test users:', { teacher, student });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
