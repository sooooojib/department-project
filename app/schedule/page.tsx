import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ScheduleClientPage from './page.client';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) redirect('/login');

    const session = await decrypt(token);
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

    return (
        <ScheduleClientPage
            initialSlots={serializedSlots}
            sessionRole={session.role}
            userId={session.userId as string}
        />
    );
}
