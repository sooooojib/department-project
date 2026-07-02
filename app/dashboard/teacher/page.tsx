import DashboardCard from '@/components/DashboardCard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { format, startOfToday, endOfToday, startOfTomorrow, endOfTomorrow } from 'date-fns';
import TeacherClassesExamsWidget from '@/components/TeacherClassesExamsWidget';

export default async function TeacherDashboard() {
    const payload = await getServerSession(authOptions);

    let classes: any[] = [];
    let assignedCourses: any[] = [];
    let exams: any[] = [];
    let pendingReqs = 0;
    let classLabel = "Today's Classes";

    if (payload?.user?.id) {
        const now = new Date();
        const currentHour = now.getHours();
        
        let targetDateStart, targetDateEnd;
        if (currentHour >= 5 && currentHour < 17) {
            targetDateStart = startOfToday();
            targetDateEnd = endOfToday();
            classLabel = "Today's Classes";
        } else {
            targetDateStart = startOfTomorrow();
            targetDateEnd = endOfTomorrow();
            classLabel = "Tomorrow's Classes";
        }

        classes = await prisma.scheduleSlot.findMany({
            where: {
                teacherId: payload?.user?.id,
                status: 'BOOKED',
                startTime: { gte: targetDateStart, lte: targetDateEnd },
                NOT: { title: { startsWith: 'Attendance:' } }
            },
            orderBy: { startTime: 'asc' }
        });

        exams = await prisma.exam.findMany({
            where: {
                course: {
                    teachers: { some: { id: payload?.user?.id } }
                },
                date: { gte: startOfToday() }
            },
            include: { course: { select: { code: true, name: true } } },
            orderBy: { date: 'asc' },
            take: 10
        });

        pendingReqs = await prisma.counselingRequest.count({
            where: {
                slot: { teacherId: payload?.user?.id },
                status: 'PENDING'
            }
        });

        assignedCourses = await prisma.course.findMany({
            where: {
                teachers: { some: { id: payload?.user?.id } }
            },
            orderBy: { code: 'asc' }
        });
    }

    // A helper to assign a random realistic room number based on the ID hash
    const getRoomNumber = (id: string) => {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const building = ['A', 'B', 'C', 'Science Complex', 'Main Hall'][hash % 5];
        const room = (hash % 400) + 101;
        return `${building} - Room ${room}`;
    };

    const serialisedClasses = classes.map(c => ({
        id: c.id,
        title: c.title,
        startTime: c.startTime.toISOString(),
        endTime: c.endTime.toISOString(),
        room: getRoomNumber(c.id),
    }));

    const serialisedExams = exams.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        room: getRoomNumber(e.id),
        course: { code: e.course.code, name: e.course.name },
    }));

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Professor Dashboard</h1>
                <button className="flex items-center space-x-2 bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Time period: This Month</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard
                    title="Pending Counseling"
                    value={pendingReqs.toString()}
                    icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    trend="Requires action" trendPositive={false}
                />
                <DashboardCard
                    title="Feedback Received"
                    value="18"
                    icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    trend="5.5%" trendPositive={true}
                />
                <DashboardCard
                    title="Classes Taught"
                    value={classes.length.toString()}
                    icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 pb-8 items-start">
                <TeacherClassesExamsWidget 
                    classes={serialisedClasses} 
                    exams={serialisedExams} 
                    classLabel={classLabel} 
                />

                {/* Courses Assigned - ~33% width */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <h2 className="text-lg font-bold text-slate-800">Courses Assigned</h2>
                    </div>

                    {assignedCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p className="font-medium">No courses assigned yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {assignedCourses.map((course) => (
                                <div key={course.id} className="group relative flex flex-col p-5 border border-slate-100 border-t-4 border-t-emerald-500 bg-slate-50 hover:bg-white hover:border-x-emerald-200 hover:border-b-emerald-200 hover:shadow-md transition-all rounded-xl">
                                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-snug">{course.code}</h3>
                                    <p className="text-sm font-medium text-slate-500 mb-3">{course.name}</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 uppercase text-[10px] tracking-wider mb-0.5 font-bold">Credit</span>
                                            <span className="text-sm font-bold text-black">{course.credit?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 uppercase text-[10px] tracking-wider mb-0.5 font-bold">Type</span>
                                            <span className="text-sm font-bold text-black">{course.type || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 uppercase text-[10px] tracking-wider mb-0.5 font-bold">Semester</span>
                                            <span className="text-sm font-bold text-black">Y{course.year} S{course.semester}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
