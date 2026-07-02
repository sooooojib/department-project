'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProgressBar from '@/components/ProgressBar';

interface Course {
    id: string;
    code: string;
    name: string;
    type: string | null;
}

interface AttendanceStat {
    total: number;
    present: number;
    percentage: number;
}

interface Props {
    courses: Course[];
    attendanceMap: Record<string, AttendanceStat>;
}

const COLORS = ['bg-purple-500', 'bg-emerald-500', 'bg-blue-400', 'bg-amber-400', 'bg-pink-400', 'bg-indigo-500'];

function CourseRow({ course, idx }: { course: Course; idx: number; stat: AttendanceStat }) {
    return null; // handled inline below
}

export default function CoursesWidget({ courses, attendanceMap }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (expanded) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, [expanded]);

    const preview = courses.slice(0, 3);
    const hasMore = courses.length > 3;

    const renderCourse = (course: Course, idx: number) => {
        const colorClass = COLORS[idx % COLORS.length];
        const stats = attendanceMap[course.id] || { total: 0, present: 0, percentage: 100 };
        const progressLabel = stats.total > 0
            ? `Attendance (${stats.present}/${stats.total} classes)`
            : 'Attendance (No classes conducted)';

        return (
            <div key={course.id} className="flex flex-col border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800 text-[14px]">{course.code}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                        course.type === 'Major' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                        {course.type || 'Major'}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-1">{course.name}</p>
                <ProgressBar label={progressLabel} value={stats.percentage} colorClass={colorClass} />
            </div>
        );
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Current Semester Courses</h2>
                <div className="flex-1 space-y-6">
                    {preview.map((course, idx) => renderCourse(course, idx))}
                </div>

                {hasMore && (
                    <button
                        onClick={() => setExpanded(true)}
                        className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Show all {courses.length} courses
                    </button>
                )}
            </div>

            {/* Expanded Modal via Portal */}
            {expanded && mounted && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6"
                    onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
                    style={{ touchAction: 'none' }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">All Courses</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{courses.length} courses enrolled</p>
                            </div>
                        </div>

                        {/* Modal Body (Explicit Scroll Container) */}
                        <div 
                            className="overflow-y-auto px-6 py-5 space-y-6 bg-white"
                            style={{ maxHeight: 'calc(100vh - 200px)' }}
                        >
                            {courses.map((course, idx) => renderCourse(course, idx))}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setExpanded(false)}
                                className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
