// Async Server Component — fetches attendance metrics and upcoming exam count.
// Wrapped in a <Suspense> boundary in page.tsx so it streams in without blocking.

import DashboardCard from '@/components/DashboardCard';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { endOfToday } from 'date-fns';

interface Props {
    userId: string;
    year: number | null;
    semester: number | null;
}

export default async function MetricsCards({ userId, year, semester }: Props) {
    const todayEnd = endOfToday();

    // Get courses for the student's semester (needed for attendance filter)
    const courses = (year && semester)
        ? await prisma.course.findMany({
            where: { year, semester },
            select: { id: true },
          })
        : [];

    const courseIds = courses.map(c => c.id);

    // Fetch all metrics in parallel
    const [studentAttendances, upcomingExams, counselingBookings, pendingFeedback] = await Promise.all([
        courseIds.length > 0
            ? prisma.attendance.findMany({
                where: {
                    studentId: userId,
                    session: { courseId: { in: courseIds } },
                },
                select: { status: true },
              })
            : Promise.resolve([]),
        (year && semester)
            ? prisma.exam.findMany({
                where: {
                    date: { gt: todayEnd },
                    course: { year, semester },
                },
                select: { id: true },
              })
            : Promise.resolve([]),
        // Count counseling requests made by this student
        prisma.counselingRequest.count({
            where: { studentId: userId },
        }),
        // Count pending feedback (unreplied) for this student
        prisma.feedback.count({
            where: {
                studentId: userId,
                reply: null,
            },
        }),
    ]);

    const totalSessions = studentAttendances.length;
    const presentSessions = studentAttendances.filter(r => r.status === 'PRESENT').length;
    const averageAttendance = totalSessions > 0
        ? `${Math.round((presentSessions / totalSessions) * 1000) / 10}%`
        : '0%';

    return (
        <>
            <DashboardCard
                title="Average Attendance"
                value={averageAttendance}
                icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <DashboardCard
                title="Counseling Bookings"
                value={counselingBookings}
                icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
            <DashboardCard
                title="Pending Feedback"
                value={pendingFeedback}
                icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
            <DashboardCard
                title="Upcoming Exams"
                value={upcomingExams.length}
                icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
            {/* Counseling link */}
            <Link
                href="/counseling"
                className="bg-slate-50/50 p-5 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-center"
            >
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-semibold text-[13px] uppercase tracking-wide">Counseling</span>
            </Link>
        </>
    );
}
