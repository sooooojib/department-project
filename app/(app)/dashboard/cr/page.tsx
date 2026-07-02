import DashboardCard from '@/components/DashboardCard';
import ProgressBar from '@/components/ProgressBar';
import ClassesExamsWidget from '@/components/ClassesExamsWidget';
import CoursesWidget from '@/components/CoursesWidget';
import prisma from '@/lib/prisma';
import { startOfToday, endOfToday, format } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import SemesterSelector from '@/components/SemesterSelector';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CRDashboard() {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    // Authenticate user
    const payload = await getServerSession(authOptions);
    const userId = payload?.user?.id;

    if (!userId) {
        return (
            <div className="p-8 text-center text-red-500 font-semibold">
                Session expired. Please log in again.
            </div>
        );
    }

    // Fetch user semester info (CR is also a student)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            year: true,
            semester: true,
            requestedYear: true,
            requestedSemester: true,
            semesterStatus: true,
        }
    });

    if (!user) {
        return (
            <div className="p-8 text-center text-red-500 font-semibold">
                User profile not found.
            </div>
        );
    }

    // Fetch today's booked schedule slots
    const todayClasses = await prisma.scheduleSlot.findMany({
        where: {
            status: 'BOOKED',
            startTime: { gte: todayStart, lte: todayEnd },
        },
        include: { teacher: true },
        orderBy: { startTime: 'asc' },
    });

    // Fetch semester-specific courses (student functionality)
    const courses = (user.year && user.semester)
        ? await prisma.course.findMany({
            where: { year: user.year, semester: user.semester },
            orderBy: { code: 'asc' },
          })
        : [];

    // Fetch CR's own attendance records for those courses
    const studentAttendances = await prisma.attendance.findMany({
        where: {
            studentId: userId,
            session: {
                courseId: { in: courses.map(c => c.id) }
            }
        },
        include: { session: true }
    });

    // Per-course attendance map
    const attendanceMap = courses.reduce((acc, course) => {
        const records = studentAttendances.filter(a => a.session.courseId === course.id);
        const total = records.length;
        const present = records.filter(r => r.status === 'PRESENT').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
        acc[course.id] = { total, present, percentage };
        return acc;
    }, {} as Record<string, { total: number; present: number; percentage: number }>);

    // Global average attendance
    const totalSessions = studentAttendances.length;
    const presentSessions = studentAttendances.filter(r => r.status === 'PRESENT').length;
    const averageAttendance = totalSessions > 0
        ? `${Math.round((presentSessions / totalSessions) * 1000) / 10}%`
        : '100%';

    // Today's exams for the CR's semester
    const todayExams = (user.year && user.semester)
        ? await prisma.exam.findMany({
            where: {
                date: { gte: todayStart, lte: todayEnd },
                course: { year: user.year, semester: user.semester }
            },
            include: { course: { select: { code: true, name: true } } },
            orderBy: { date: 'asc' },
          })
        : [];

    // Upcoming exams (after today) for the CR's semester
    const upcomingExams = (user.year && user.semester)
        ? await prisma.exam.findMany({
            where: {
                date: { gt: todayEnd },
                course: { year: user.year, semester: user.semester }
            },
            include: { course: { select: { code: true, name: true } } },
            orderBy: { date: 'asc' },
          })
        : [];

    // Available counseling slots count
    const counselingCount = await prisma.counselingSlot.count({
        where: {
            startTime: { gte: new Date() },
            requests: { none: { status: 'APPROVED' } }
        }
    });

    // Replace internal attendance slot titles with course names when needed
    const attendanceCourseIds = todayClasses
        .map((c) => {
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

    const attendanceCourseMap = Object.fromEntries(attendanceCourses.map(course => [course.id, course]));

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

    const serialisedAttendanceMap = Object.fromEntries(
        Object.entries(attendanceMap).map(([k, v]) => [k, v])
    );

    const serialisedCourses = courses.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
    }));

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">

            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">CR Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5 font-medium">Class Representative · Student view</p>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 font-semibold shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                        {user.year && user.semester
                            ? `Year ${user.year} Sem ${user.semester}`
                            : 'Unassigned'}
                    </span>
                </div>
            </div>

            {/* Semester Selector (same as student) */}
            <SemesterSelector
                currentYear={user.year}
                currentSemester={user.semester}
                requestedYear={user.requestedYear}
                requestedSemester={user.requestedSemester}
                semesterStatus={user.semesterStatus}
            />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <DashboardCard
                    title="Average Attendance"
                    value={averageAttendance}
                    icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    trend="5.2%" trendPositive={true}
                />
                <DashboardCard
                    title="Classes Today"
                    value={todayClasses.length}
                    icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    trend="3.1%" trendPositive={true}
                />
                <DashboardCard
                    title="Counseling Slots"
                    value={counselingCount}
                    icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    trend="0.5%" trendPositive={true}
                />
                <DashboardCard
                    title="Upcoming Exams"
                    value={upcomingExams.length}
                    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    trend="1.0%" trendPositive={false}
                />
                {/* CR-specific: Schedule classes link */}
                <Link
                    href="/schedule"
                    className="bg-slate-50/50 p-5 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-center"
                >
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-semibold text-[13px] uppercase tracking-wide">Schedule Classes</span>
                </Link>
            </div>

            {/* Main two-column area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

                {/* Classes & Exams Today — tabbed widget */}
                <ClassesExamsWidget
                    todayClasses={serialisedClasses}
                    todayExams={serialisedTodayExams}
                    upcomingExams={serialisedUpcomingExams}
                    todayLabel={format(todayStart, 'MMMM d, yyyy')}
                />

                {/* Semester Courses with attendance */}
                {user.year && user.semester ? (
                    courses.length > 0 ? (
                        <CoursesWidget courses={serialisedCourses} attendanceMap={serialisedAttendanceMap} />
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                            <h2 className="text-lg font-bold text-slate-800 mb-6">Current Semester Courses</h2>
                            <div className="text-center py-12 text-slate-400">
                                <p className="text-sm font-semibold text-slate-500">Syllabus Unpopulated</p>
                                <p className="text-xs text-slate-400 mt-1">No courses found for Year {user.year} Semester {user.semester}.</p>
                            </div>
                        </div>
                    )
                ) : (
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
                )}
            </div>
        </div>
    );
}
