import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AttendanceTable from '@/components/AttendanceTable';
import StudentAttendanceForm from '@/components/StudentAttendanceForm';

async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return await decrypt(token);
}

// Ensure dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (session.role === 'STUDENT') {
        const courses = await prisma.course.findMany({
            select: { id: true, code: true, name: true }
        });

        const attendances = await prisma.attendance.findMany({
            where: { studentId: session.userId },
            include: { session: { include: { course: true } } },
            orderBy: { session: { date: 'desc' } }
        });

        const totalClasses = attendances.length;
        const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
        const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

        return (
            <div className="min-h-screen p-8 bg-zinc-50">
                <div className="max-w-5xl mx-auto space-y-8">
                    <StudentAttendanceForm courses={courses} />

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2">My Attendance</h1>
                        <div className="flex gap-4 mt-6">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex-1 text-center">
                                <p className="text-emerald-800 text-sm font-medium">Attendance Rate</p>
                                <p className="text-4xl font-bold text-emerald-600 mt-2">{percentage}%</p>
                            </div>
                            <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl flex-1 text-center">
                                <p className="text-zinc-600 text-sm font-medium">Classes Attended</p>
                                <p className="text-4xl font-bold text-zinc-900 mt-2">{presentCount} / {totalClasses}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-zinc-200">
                                {attendances.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-zinc-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                                            {rec.session.date.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                            {rec.session.course.name} ({rec.session.course.code})
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${rec.status === 'PRESENT'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {attendances.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-sm text-zinc-500">
                                            You have no attendance records yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // Role is TEACHER, CR, or ADMIN
    // Fetch a course. For a real app, this would be selected via UI.
    // For this boilerplate, we'll grab the first course, or create a mock one.
    let course = await prisma.course.findFirst();
    if (!course) {
        course = await prisma.course.create({
            data: { code: 'CS101', name: 'Intro to Computer Science' }
        });
    }

    const rawStudents = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, email: true, studentId: true, phone: true }
    });

    const students = rawStudents.map(s => ({
        id: s.id,
        name: s.name,
        identifier: s.studentId || s.email || s.phone || '',
    }));

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Course Administration</h1>
                    <p className="mt-1 font-medium text-[15px] text-slate-500">Managing attendance for {course.name} ({course.code})</p>
                </div>
            </div>

            {session.role === 'TEACHER' || session.role === 'ADMIN' ? (
                <AttendanceTable courseId={course.id} initialStudents={students} />
            ) : (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                    <h2 className="text-xl font-semibold text-zinc-900 mb-4">CR Summary View</h2>
                    <p className="text-zinc-600 mb-6">As a Class Representative, you can view the exported attendance status but cannot modify the live roster.</p>
                    <a
                        href={`/api/attendance/export?courseId=${course.id}`}
                        className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                    >
                        Download Full Class Summary (CSV)
                    </a>
                </div>
            )}
        </div>
    );
}
