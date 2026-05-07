import DashboardCard from '@/components/DashboardCard';
import ProgressBar from '@/components/ProgressBar';
import prisma from '@/lib/prisma';
import { startOfToday, endOfToday, format } from 'date-fns';

export default async function StudentDashboard() {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    // Fetch today's booked schedule slots
    const todayClasses = await prisma.scheduleSlot.findMany({
        where: {
            status: 'BOOKED',
            startTime: {
                gte: todayStart,
                lte: todayEnd,
            }
        },
        include: {
            teacher: true,
        },
        orderBy: {
            startTime: 'asc',
        }
    });

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Dashboard</h1>
                <button className="flex items-center space-x-2 bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Time period: This semester</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <DashboardCard
                    title="Average Attendance"
                    value="82.4%"
                    icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    trend="5.2%" trendPositive={true}
                />
                <DashboardCard
                    title="Assignments Due"
                    value="4"
                    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    trend="1.0%" trendPositive={false}
                />
                <DashboardCard
                    title="Counseling Bookings"
                    value="1"
                    icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    trend="0.5%" trendPositive={true}
                />
                <DashboardCard
                    title="Pending Feedback"
                    value="2"
                    icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    trend="1.2%" trendPositive={false}
                />

                {/* The "Add data" equivalent button card */}
                <button className="bg-slate-50/50 p-5 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-semibold text-[13px] uppercase tracking-wide">Register Course</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Classes Today widget replacing the Academic Graph */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Classes & Exams Today</h2>
                        <div className="flex space-x-4 text-xs font-bold text-slate-500">
                            <div className="flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {format(todayStart, 'MMMM d, yyyy')}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {todayClasses.length > 0 ? (
                            <div className="space-y-4">
                                {todayClasses.map((classSlot) => (
                                    <div key={classSlot.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-100/50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                {format(new Date(classSlot.startTime), 'HH:mm')}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-800 text-[15px] group-hover:text-emerald-700 transition-colors">
                                                    {classSlot.title || 'Class Session'}
                                                </h3>
                                                <p className="text-sm text-slate-500 mt-0.5">
                                                    Prof. {classSlot.teacher.name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
                                                <span>{format(new Date(classSlot.startTime), 'h:mm a')}</span>
                                                <span>-</span>
                                                <span>{format(new Date(classSlot.endTime), 'h:mm a')}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-slate-400">
                                <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm font-medium">No classes scheduled for today.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Secondary panel imitating Donut Chart area */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Current Course Status</h2>
                    <div className="space-y-6">
                        <ProgressBar label="CS101 - Intro to Computer Science" value={85} colorClass="bg-purple-500" />
                        <ProgressBar label="MTH201 - Linear Algebra" value={92} colorClass="bg-emerald-500" />
                        <ProgressBar label="ENG105 - Composition" value={45} colorClass="bg-blue-400" />
                        <ProgressBar label="PHY101 - Physics" value={65} colorClass="bg-amber-400" />
                        <ProgressBar label="HIS102 - World History" value={78} colorClass="bg-pink-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}
