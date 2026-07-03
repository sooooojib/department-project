// Async Server Component — fetches today's schedule slots and exams.
// Wrapped in a <Suspense> boundary in page.tsx.

import ClassesExamsWidget from '@/components/ClassesExamsWidget';
import prisma from '@/lib/prisma';
import { startOfToday, endOfToday, format } from 'date-fns';

interface Props {
    year: number | null;
    semester: number | null;
}

export default async function ClassesSection({ year, semester }: Props) {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    // Run all three fetches in parallel
    const [todayClasses, todayExams, upcomingExams] = await Promise.all([
        prisma.scheduleSlot.findMany({
            where: {
                status: 'BOOKED',
                startTime: { gte: todayStart, lte: todayEnd },
            },
            include: { teacher: true },
            orderBy: { startTime: 'asc' },
        }),
        (year && semester)
            ? prisma.exam.findMany({
                where: {
                    date: { gte: todayStart, lte: todayEnd },
                    course: { year, semester },
                },
                include: { course: { select: { code: true, name: true } } },
                orderBy: { date: 'asc' },
              })
            : Promise.resolve([]),
        (year && semester)
            ? prisma.exam.findMany({
                where: {
                    date: { gt: todayEnd },
                    course: { year, semester },
                },
                include: { course: { select: { code: true, name: true } } },
                orderBy: { date: 'asc' },
              })
            : Promise.resolve([]),
    ]);

    // Resolve attendance slot titles to course names
    const attendanceCourseIds = todayClasses
        .map(c => {
            if (!c.title) return null;
            const parts = c.title.split(':');
            return parts[0] === 'Attendance' ? parts[1] : null;
        })
        .filter((id): id is string => Boolean(id));

    const attendanceCourses = attendanceCourseIds.length > 0
        ? await prisma.course.findMany({
            where: { id: { in: attendanceCourseIds } },
            select: { id: true, code: true, name: true },
          })
        : [];

    const attendanceCourseMap = Object.fromEntries(attendanceCourses.map(c => [c.id, c]));

    const serialisedClasses = todayClasses.map(c => {
        let title = c.title || 'Class Session';
        if (title.startsWith('Attendance:')) {
            const courseId = title.split(':')[1];
            const course = attendanceCourseMap[courseId];
            title = course ? `${course.code} - ${course.name}` : 'Class Session';
        }
        return {
            id: c.id,
            title,
            startTime: c.startTime.toISOString(),
            endTime: c.endTime.toISOString(),
            teacher: { name: c.teacher.name },
        };
    });

    const serialisedTodayExams = todayExams.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        course: { code: e.course.code, name: e.course.name },
    }));

    const serialisedUpcomingExams = upcomingExams.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        course: { code: e.course.code, name: e.course.name },
    }));

    return (
        <ClassesExamsWidget
            todayClasses={serialisedClasses}
            todayExams={serialisedTodayExams}
            upcomingExams={serialisedUpcomingExams}
            todayLabel={format(todayStart, 'MMMM d, yyyy')}
        />
    );
}
