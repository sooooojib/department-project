import DashboardCard from '@/components/DashboardCard';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export default async function TeacherDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const payload = token ? await decrypt(token) : null;

    let classes: any[] = [];
    let pendingReqs = 0;

    if (payload?.userId) {
        classes = await prisma.scheduleSlot.findMany({
            where: {
                teacherId: payload.userId,
                status: 'BOOKED',
            },
            orderBy: { startTime: 'asc' },
            take: 6
        });

        pendingReqs = await prisma.counselingRequest.count({
            where: {
                slot: { teacherId: payload.userId },
                status: 'PENDING'
            }
        });
    }

    // A helper to assign a random realistic room number based on the ID hash
    const getRoomNumber = (id: string) => {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const building = ['A', 'B', 'C', 'Science Complex', 'Main Hall'][hash % 5];
        const room = (hash % 400) + 101;
        return `${building} - Room ${room}`;
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Dashboard</h1>
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

            <div className="pt-2">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden min-h-[400px]">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <h2 className="text-lg font-bold text-slate-800">My Class Schedule</h2>
                        <a href="/schedule" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">View full calendar &rarr;</a>
                    </div>

                    {classes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="font-medium">No classes scheduled yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {classes.map((slot) => (
                                <div key={slot.id} className="group relative flex flex-col p-5 border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all rounded-xl">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span>Scheduled</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">{format(new Date(slot.startTime), 'MMM d, yyyy')}</p>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-snug">{slot.title || 'Untitled Class Session'}</h3>

                                    <div className="mt-auto pt-4 space-y-2">
                                        <div className="flex items-center text-sm font-medium text-slate-500">
                                            <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                                        </div>
                                        <div className="flex items-center text-sm font-medium text-slate-500">
                                            <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {getRoomNumber(slot.id)}
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
