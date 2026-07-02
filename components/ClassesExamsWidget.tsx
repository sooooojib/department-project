'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface ClassSlot {
    id: string;
    title: string | null;
    startTime: string;
    endTime: string;
    teacher: { name: string };
}

interface Exam {
    id: string;
    title: string;
    date: string;
    course: { code: string; name: string };
}

interface Props {
    todayClasses: ClassSlot[];
    todayExams: Exam[];
    upcomingExams: Exam[];
    todayLabel: string;
}

export default function ClassesExamsWidget({ todayClasses, todayExams, upcomingExams, todayLabel }: Props) {
    const [mainTab, setMainTab] = useState<'classes' | 'exams'>('classes');
    const [examSubTab, setExamSubTab] = useState<'today' | 'upcoming'>('today');

    return (
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative min-h-[400px] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Classes &amp; Exams Today</h2>
                <div className="flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                    {todayLabel}
                </div>
            </div>

            {/* Main Tab Bar: Classes | Exams */}
            <div className="flex gap-3 mb-5">
                <button
                    onClick={() => setMainTab('classes')}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        mainTab === 'classes'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Classes
                    {todayClasses.length > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                            mainTab === 'classes' ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                            {todayClasses.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setMainTab('exams')}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        mainTab === 'exams'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Exams
                    {todayExams.length > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                            mainTab === 'exams' ? 'bg-white text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                            {todayExams.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Classes Tab Content */}
            {mainTab === 'classes' && (
                <div className="flex-1 overflow-y-auto pr-1">
                    {todayClasses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-slate-400">
                            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm font-medium">No classes scheduled for today.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayClasses.map((classSlot) => (
                                <div key={classSlot.id} className="p-4 rounded-xl border border-slate-100 bg-emerald-50/40 flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                                        <span className="text-[10px]">{format(new Date(classSlot.startTime), 'MMM')}</span>
                                        <span className="text-base leading-tight">{format(new Date(classSlot.startTime), 'd')}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-800 text-[15px] group-hover:text-emerald-700 transition-colors truncate">
                                            {classSlot.title || 'Class Session'}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {format(new Date(classSlot.startTime), 'h:mm a')} – {format(new Date(classSlot.endTime), 'h:mm a')}
                                            <span className="mx-0.5 text-slate-300">·</span>
                                            Prof. {classSlot.teacher.name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Exams Tab Content */}
            {mainTab === 'exams' && (
                <div className="flex-1 flex flex-col">
                    {/* Exam Sub-tabs */}
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => setExamSubTab('today')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                examSubTab === 'today'
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
                            }`}
                        >
                            Today&apos;s Exams
                            {todayExams.length > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    examSubTab === 'today' ? 'bg-white text-emerald-600' : 'bg-red-100 text-red-600'
                                }`}>
                                    {todayExams.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setExamSubTab('upcoming')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                examSubTab === 'upcoming'
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
                            }`}
                        >
                            Upcoming Exams
                            {upcomingExams.length > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    examSubTab === 'upcoming' ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {upcomingExams.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Today's Exams */}
                    {examSubTab === 'today' && (
                        <div className="flex-1 overflow-y-auto pr-1">
                            {todayExams.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-slate-400">
                                    <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-sm font-medium">No exams scheduled for today.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayExams.map((ex) => (
                                        <div key={ex.id} className="flex items-center gap-4 p-4 rounded-xl bg-red-50/60 border border-red-100 hover:border-red-200 transition-colors">
                                            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                                                <span className="text-[10px] font-semibold">{format(new Date(ex.date), 'MMM')}</span>
                                                <span className="text-base leading-tight">{format(new Date(ex.date), 'd')}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{ex.course.code} – {ex.course.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {format(new Date(ex.date), 'h:mm a')}
                                                    <span className="mx-0.5 text-slate-300">·</span>
                                                    {ex.title}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 border border-red-200 uppercase tracking-wide">
                                                Today
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upcoming Exams */}
                    {examSubTab === 'upcoming' && (
                        <div className="flex-1 overflow-y-auto pr-1">
                            {upcomingExams.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-slate-400">
                                    <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-sm font-medium">No upcoming exams.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingExams.map((ex) => (
                                        <div key={ex.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-200 transition-colors">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                                                <span className="text-[10px] font-semibold">{format(new Date(ex.date), 'MMM')}</span>
                                                <span className="text-base leading-tight">{format(new Date(ex.date), 'd')}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{ex.course.code} – {ex.course.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {format(new Date(ex.date), 'EEE, MMM d · h:mm a')}
                                                    <span className="mx-0.5 text-slate-300">·</span>
                                                    {ex.title}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
