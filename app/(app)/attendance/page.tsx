import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { startOfToday, endOfToday } from 'date-fns';
import AttendanceTable from '@/components/AttendanceTable';
import StudentAttendanceForm from '@/components/StudentAttendanceForm';
import StudentAttendanceDashboard from '@/components/StudentAttendanceDashboard';
import CRAttendanceDownload from '@/components/CRAttendanceDownload';

async function getSession() {
    return await getServerSession(authOptions);
}

// Ensure dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (session?.user?.role === 'STUDENT' || session?.user?.role === 'CR') {
        const user = await prisma.user.findUnique({
            where: { id: session?.user?.id },
            select: { year: true, semester: true }
        });

        const isAssigned = !!(user?.year && user?.semester);

        const courses = isAssigned
            ? await prisma.course.findMany({
                where: { year: user.year, semester: user.semester },
                select: { id: true, code: true, name: true }
            })
            : [];

        const attendances = await prisma.attendance.findMany({
            where: { studentId: session?.user?.id },
            include: { session: { include: { course: true } } },
            orderBy: { session: { date: 'desc' } }
        });

        const serialisedAttendances = attendances.map(a => ({
            id: a.id,
            status: a.status,
            session: {
                date: a.session.date.toISOString(),
                course: {
                    id: a.session.course.id,
                    name: a.session.course.name,
                    code: a.session.course.code,
                }
            }
        }));

        return (
            <div className="min-h-screen p-8 bg-zinc-50">
                <div className="max-w-5xl mx-auto space-y-8">
                    <StudentAttendanceForm courses={courses} isAssigned={isAssigned} />
                    <StudentAttendanceDashboard courses={courses} attendances={serialisedAttendances} />
                    
                    {session?.user?.role === 'CR' && (
                        <CRAttendanceDownload courses={courses} />
                    )}
                </div>
            </div>
        );
    }

    // Role is TEACHER or ADMIN — fetch their assigned courses
    const assignedCourses = session?.user?.role === 'TEACHER'
        ? await prisma.course.findMany({
            where: { teachers: { some: { id: session?.user?.id } } },
            select: { id: true, code: true, name: true },
            orderBy: { code: 'asc' }
          })
        : await prisma.course.findMany({
            select: { id: true, code: true, name: true },
            orderBy: { code: 'asc' }
          });

    // Check whether the teacher has any real booked class today
    const todaySlots = session?.user?.role === 'TEACHER'
        ? await prisma.scheduleSlot.findMany({
            where: {
                teacherId: session?.user?.id,
                status: 'BOOKED',
                startTime: { gte: startOfToday(), lte: endOfToday() },
                NOT: { title: { startsWith: 'Attendance:' } }
            },
            select: { id: true, title: true, startTime: true, endTime: true },
            orderBy: { startTime: 'asc' }
          })
        : [];

    const serialisedTodaySlots = todaySlots.map(s => ({
        id: s.id,
        title: s.title,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
    }));

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 relative">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Course Administration</h1>
                    <p className="mt-1 font-medium text-[15px] text-slate-500">Select a course to manage attendance and record class sessions.</p>
                </div>
            </div>

            {session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN' ? (
                <AttendanceTable assignedCourses={assignedCourses} todaySlots={serialisedTodaySlots} isAdmin={session?.user?.role === 'ADMIN'} />
            ) : (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                    <h2 className="text-xl font-semibold text-zinc-900 mb-4">CR Summary View</h2>
                    <p className="text-zinc-600 mb-6">As a Class Representative, you can view the exported attendance status but cannot modify the live roster.</p>
                </div>
            )}
        </div>
    );
}
