'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface ClassSlot {
    id: string;
    title: string | null;
    startTime: string;
    endTime: string;
    room: string;
}

interface Exam {
    id: string;
    title: string;
    date: string;
    room: string;
    course: { code: string; name: string };
}

interface Props {
    classes: ClassSlot[];
    exams: Exam[];
    classLabel: string;
}

export default function TeacherClassesExamsWidget({ classes, exams, classLabel }: Props) {
    const [mainTab, setMainTab] = useState<'classes' | 'exams'>('classes');

    return (
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative min-h-[400px] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Class and Exam</h2>
                <a href="/schedule" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                    View full calendar &rarr;
                </a>
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
                    Class
                    {classes.length > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                            mainTab === 'classes' ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                            {classes.length}
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
                    Exam
                    {exams.length > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                            mainTab === 'exams' ? 'bg-white text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                            {exams.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Classes Tab Content */}
            {mainTab === 'classes' && (
                <div className="flex-1 flex flex-col">
                    <div className="mb-4">
                        <span className="inline-block px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                            {classLabel}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1">
                        {classes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
                                <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm font-medium">No classes scheduled.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {classes.map((slot) => (
                                    <div key={slot.id} className="group relative flex flex-col p-4 border border-slate-100 bg-emerald-50/40 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all rounded-xl">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <span>Scheduled</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">{format(new Date(slot.startTime), 'MMM d')}</p>
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-800 mb-1 leading-snug truncate">{slot.title || 'Untitled Class Session'}</h3>

                                        <div className="mt-auto pt-3 space-y-1.5">
                                            <div className="flex items-center text-[13px] font-medium text-slate-500">
                                                <svg width="14" height="14" className="mr-1.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                                            </div>
                                            <div className="flex items-center text-[13px] font-medium text-slate-500">
                                                <svg width="14" height="14" className="mr-1.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                {slot.room}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Exams Tab Content */}
            {mainTab === 'exams' && (
                <div className="flex-1 flex flex-col overflow-y-auto pr-1">
                    {exams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-slate-400">
                            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm font-medium">No upcoming exams assigned.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {exams.map((ex) => (
                                <div key={ex.id} className="p-4 rounded-xl border border-slate-100 bg-red-50/40 hover:bg-white hover:border-red-200 hover:shadow-md transition-all flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                                        <span className="text-[10px] font-semibold">{format(new Date(ex.date), 'MMM')}</span>
                                        <span className="text-base leading-tight">{format(new Date(ex.date), 'd')}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-800 text-sm group-hover:text-red-700 transition-colors truncate">
                                            {ex.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                                            <span className="font-bold text-slate-600">{ex.course.code}</span>
                                            <span className="text-slate-300">·</span>
                                            <span className="truncate max-w-[120px]">{ex.course.name}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                            <span className="flex items-center">
                                                <svg width="12" height="12" className="mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {format(new Date(ex.date), 'h:mm a')}
                                            </span>
                                            <span className="flex items-center">
                                                <svg width="12" height="12" className="mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                {ex.room}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
