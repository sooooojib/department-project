'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, startOfToday, endOfToday } from 'date-fns';
import DashboardCard from '@/components/DashboardCard';
import ProgressBar from '@/components/ProgressBar';

// ── Types ──────────────────────────────────────────────────────────────────── //
interface ScheduleSlot {
    id: string;
    title?: string;
    startTime: string;
    endTime: string;
    status: 'AVAILABLE' | 'BOOKED';
    teacher: { id: string; name: string };
}

interface Exam {
    id: string;
    title: string;
    date: string;
    course: { code: string; name: string };
}

// ── Main Dashboard ─────────────────────────────────────────────────────────── //
export default function CRDashboard() {
    const [todayClasses, setTodayClasses] = useState<ScheduleSlot[]>([]);
    const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
    const [counselingCount, setCounselingCount] = useState(0);
    const [feedbackCount, setFeedbackCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        const todayStart = startOfToday();
        const todayEnd = endOfToday();

        try {
            const [slotsRes, examRes, counselRes, fbRes] = await Promise.all([
                fetch(`/api/schedule?start=${todayStart.toISOString()}&end=${todayEnd.toISOString()}`),
                fetch('/api/cr/exam'),
                fetch('/api/counseling'),
                fetch('/api/feedback'),
            ]);

            if (slotsRes.ok) {
                const d = await slotsRes.json();
                setTodayClasses((d.slots || []).filter((s: ScheduleSlot) => s.status === 'BOOKED'));
            }
            if (examRes.ok) {
                const d = await examRes.json();
                setUpcomingExams(d.exams || []);
            }
            if (counselRes.ok) {
                const d = await counselRes.json();
                setCounselingCount((d.slots || []).length);
            }
            if (fbRes.ok) {
                const d = await fbRes.json();
                setFeedbackCount((d.feedbacks || []).length);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Today's exams
    const todayExams = upcomingExams.filter(ex => {
        const examDate = new Date(ex.date);
        return examDate >= startOfToday() && examDate <= endOfToday();
    });

    // Combined today items count for stat card
    const todayExamsCount = todayExams.length;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">

            {/* ── Page Header ── */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">CR Dashboard</h1>
                <button className="flex items-center space-x-2 bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Time period: This semester</span>
                </button>
            </div>

            {/* ── Stat Cards (5-column grid matching student dashboard) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <DashboardCard
                    title="Classes Today"
                    value={todayClasses.length}
                    icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    trend="3.1%"
                    trendPositive={true}
                />
                <DashboardCard
                    title="Exams Today"
                    value={todayExamsCount}
                    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    trend="1.0%"
                    trendPositive={false}
                />
                <DashboardCard
                    title="Counseling Bookings"
                    value={counselingCount}
                    icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    trend="0.5%"
                    trendPositive={true}
                />
                <DashboardCard
                    title="Pending Feedback"
                    value={feedbackCount}
                    icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    trend="1.2%"
                    trendPositive={false}
                />

                {/* Register Course dashed button card */}
                <button className="bg-slate-50/50 p-5 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-semibold text-[13px] uppercase tracking-wide">Register Course</span>
                </button>
            </div>

            {/* ── Main Two-Column Area ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

                {/* ── Classes & Exams Today (wide panel) ── */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Classes &amp; Exams Today</h2>
                        <div className="flex space-x-4 text-xs font-bold text-slate-500">
                            <div className="flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {format(startOfToday(), 'MMMM d, yyyy')}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {todayClasses.length === 0 && todayExams.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-slate-400">
                                <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm font-medium">No classes scheduled for today.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Class slots */}
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

                                {/* Today's exams */}
                                {todayExams.map((ex) => (
                                    <div key={ex.id} className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 border border-purple-100 hover:border-purple-300 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            {ex.course.code}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 text-[15px] truncate">{ex.title}</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">{ex.course.name}</p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-100 border border-purple-200 text-purple-700 shrink-0">
                                            Exam
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Upcoming Exams Side Panel (mirrors "Current Course Status" slot) ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Upcoming Exams</h2>

                    {upcomingExams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                            <svg className="w-10 h-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p className="text-sm font-medium text-center">No upcoming exams.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {upcomingExams.slice(0, 6).map((ex) => {
                                // Use days until exam as a "completion" proxy for the progress bar
                                const daysUntil = Math.max(0, Math.ceil((new Date(ex.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                                const urgency = Math.max(10, 100 - daysUntil * 5); // closer = higher bar
                                const colors = ['bg-purple-500', 'bg-emerald-500', 'bg-blue-400', 'bg-amber-400', 'bg-pink-400', 'bg-red-400'];
                                const colorClass = colors[upcomingExams.indexOf(ex) % colors.length];
                                return (
                                    <div key={ex.id}>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-medium text-zinc-700 truncate max-w-[70%]">
                                                {ex.course.code} – {ex.title}
                                            </span>
                                            <span className="text-xs font-semibold text-zinc-500 shrink-0 ml-2">
                                                {format(new Date(ex.date), 'MMM d')}
                                            </span>
                                        </div>
                                        <ProgressBar
                                            label=""
                                            value={urgency}
                                            colorClass={colorClass}
                                        />
                                    </div>
                                );
                            })}
                            {upcomingExams.length > 6 && (
                                <p className="text-xs text-slate-400 text-center pt-1">
                                    +{upcomingExams.length - 6} more exams
                                </p>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
