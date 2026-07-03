// Async Server Component — fetches semester courses + per-course attendance map.
// Wrapped in a <Suspense> boundary in page.tsx.

import CoursesWidget from '@/components/CoursesWidget';
import prisma from '@/lib/prisma';

interface Props {
    userId: string;
    year: number | null;
    semester: number | null;
}

export default async function CoursesSection({ userId, year, semester }: Props) {
    if (!year || !semester) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Current Semester Courses</h2>
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center h-full">
                    <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-sm font-semibold text-slate-600">No Active Enrollment</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Register your semester above to see your courses here.</p>
                </div>
            </div>
        );
    }

    const [courses, studentAttendances] = await Promise.all([
        prisma.course.findMany({
            where: { year, semester },
            orderBy: { code: 'asc' },
        }),
        prisma.attendance.findMany({
            where: {
                studentId: userId,
                session: {
                    course: { year, semester },
                },
            },
            include: { session: true },
        }),
    ]);

    if (courses.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Current Semester Courses</h2>
                <div className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold text-slate-500">Syllabus Unpopulated</p>
                    <p className="text-xs text-slate-400 mt-1">No courses found matching Year {year} Semester {semester}.</p>
                </div>
            </div>
        );
    }

    // Build attendance map per course
    const attendanceMap = courses.reduce((acc, course) => {
        const records = studentAttendances.filter(a => a.session.courseId === course.id);
        const total = records.length;
        const present = records.filter(r => r.status === 'PRESENT').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
        acc[course.id] = { total, present, percentage };
        return acc;
    }, {} as Record<string, { total: number; present: number; percentage: number }>);

    const serialisedCourses = courses.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
    }));

    return (
        <CoursesWidget
            courses={serialisedCourses}
            attendanceMap={attendanceMap}
        />
    );
}
