import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import ScheduleClientPage from './page.client';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {


    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const slots = await prisma.scheduleSlot.findMany({
        include: {
            teacher: { select: { id: true, name: true } },
            bookedBy: { select: { id: true, name: true } }
        },
        orderBy: { startTime: 'asc' }
    });

    // Formatting dates to ISO strings for safe serialization across server-client boundary
    const serializedSlots = slots.map(slot => ({
        ...slot,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
    }));

    const allTeachers = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        select: { id: true, name: true, phone: true }
    });

    return (
        <ScheduleClientPage
            initialSlots={serializedSlots}
            sessionRole={session?.user?.role}
            userId={session?.user?.id as string}
            allTeachers={allTeachers}
        />
    );
}
