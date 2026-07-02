'use client';

import { useState, useEffect } from 'react';

type Course = {
    id: string;
    code: string;
    name: string;
};

type Student = {
    id: string;
    name: string;
    identifier: string;
};

type AttendanceRecord = {
    studentId: string;
    student: Student;
    status: 'PRESENT' | 'ABSENT';
};

export default function AttendanceTable({
    assignedCourses = [],
    todaySlots = [],
    isAdmin = false,
}: {
    assignedCourses?: Course[];
    todaySlots?: { id: string; title: string | null; startTime: string; endTime: string }[];
    isAdmin?: boolean;
}) {
    const today = new Date().toISOString().split('T')[0];

    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [sessionCode, setSessionCode] = useState<string | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');

    // Fetch students when a course is selected
    useEffect(() => {
        if (!selectedCourseId) {
            setStudents([]);
            setRecords([]);
            setSessionCode(null);
            setIsSessionActive(false);
            return;
        }

        const fetchStudents = async () => {
            setLoadingStudents(true);
            try {
                const res = await fetch(`/api/users?courseId=${selectedCourseId}`);
                if (res.ok) {
                    const data = await res.json();
                    const fetched: Student[] = (data.students || []).map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        identifier: s.studentId || s.email || s.phone || '',
                    }));
                    setStudents(fetched);
                    setRecords(fetched.map(s => ({ studentId: s.id, student: s, status: 'ABSENT' })));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingStudents(false);
            }
        };

        const fetchSession = async () => {
            try {
                const res = await fetch(`/api/attendance/session?courseId=${selectedCourseId}&date=${today}`);
                if (res.ok) {
                    const data = await res.json();
                    setSessionCode(data.code);
                    setIsSessionActive(data.isActive);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchStudents();
        fetchSession();
    }, [selectedCourseId]);

    const handleToggleSession = async () => {
        if (!selectedCourseId) return;
        try {
            const action = isSessionActive ? 'deactivate' : 'activate';
            const res = await fetch('/api/attendance/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: selectedCourseId, date: today, action })
            });
            if (res.ok) {
                const data = await res.json();
                setSessionCode(data.code);
                setIsSessionActive(data.isActive);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = (studentId: string) => {
        setRecords(prev => prev.map(rec =>
            rec.studentId === studentId
                ? { ...rec, status: rec.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
                : rec
        ));
    };

    const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
        setRecords(prev => prev.map(rec => ({ ...rec, status })));
    };

    const handleSaveClass = async () => {
        if (!selectedCourseId) return;
        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: selectedCourseId,
                    date: today,
                    records: records.map(r => ({ studentId: r.studentId, status: r.status }))
                })
            });

            if (res.ok) {
                setMessage('Class saved! Attendance recorded and class counted.');
                setMessageType('success');
            } else {
                const err = await res.json();
                setMessage(err.message || 'Failed to save class.');
                setMessageType('error');
            }
        } catch (error) {
            setMessage('An unexpected error occurred.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!selectedCourseId) return;
        window.location.href = `/api/teacher/attendance-export?courseId=${selectedCourseId}`;
    };

    return (
        <div className="space-y-6">
            {/* Step 1 — Course Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                <h2 className="text-base font-bold text-slate-800 mb-1">Select a Course</h2>
                <p className="text-sm text-slate-500 mb-4">Choose one of your assigned courses to manage attendance.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assignedCourses.length === 0 && (
                        <p className="text-sm text-slate-400 col-span-3">No courses assigned to you yet.</p>
                    )}
                    {assignedCourses.map(c => (
                        <button
                            key={c.id}
                            onClick={() => { setSelectedCourseId(c.id); setMessage(''); }}
                            className={`flex flex-col items-start text-left px-5 py-4 rounded-xl border-2 transition-all ${
                                selectedCourseId === c.id
                                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                    : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-white'
                            }`}
                        >
                            <span className="text-sm font-extrabold text-slate-800">{c.code}</span>
                            <span className="text-xs text-slate-500 mt-0.5 leading-snug">{c.name}</span>
                            {selectedCourseId === c.id && (
                                <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Selected</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2 — Attendance Table (only after course selected) */}
            {selectedCourseId && (
                (() => {
                    // Admins bypass the schedule check. Teachers must have a slot whose title includes the courseId/code.
                    const hasClassToday = isAdmin || todaySlots.some(slot => 
                        slot.title?.includes(selectedCourseId) || 
                        assignedCourses.find(c => c.id === selectedCourseId)?.code && slot.title?.includes(assignedCourses.find(c => c.id === selectedCourseId)!.code)
                    );

                    if (!hasClassToday) {
                        return (
                            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col items-center justify-center p-16 text-center">
                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-zinc-800 mb-2">No Class Scheduled Today</h3>
                            </div>
                        );
                    }

                    return (
                        <div className="bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden">

                    {/* Live Code Panel */}
                    <div className="p-8 bg-zinc-900 border-b border-zinc-200 flex flex-col items-center justify-center space-y-4">
                        <h3 className="text-xl font-bold text-white">Live Attendance Code</h3>
                        {isSessionActive && sessionCode ? (
                            <div className="text-7xl font-extrabold tracking-widest text-emerald-400 bg-emerald-950/50 px-16 py-8 rounded-3xl border border-emerald-500/30">
                                {sessionCode}
                            </div>
                        ) : (
                            <div className="text-xl font-medium text-zinc-500 italic py-6">
                                Code generation is currently inactive
                            </div>
                        )}
                        <button
                            onClick={handleToggleSession}
                            className={`px-8 py-3 text-lg font-semibold rounded-xl shadow-sm transition-colors ${
                                isSessionActive
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            {isSessionActive ? 'Deactivate Code' : 'Generate & Activate Code'}
                        </button>
                    </div>

                    {/* Header row */}
                    <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900">Mark Attendance</h3>
                            <p className="text-sm text-zinc-500">
                                Select students who are present &mdash;&nbsp;
                                <span className="font-semibold text-emerald-600">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1.5 px-4 py-2 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium rounded-md shadow-sm transition-colors text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export Excel
                            </button>
                            <button
                                onClick={handleSaveClass}
                                disabled={loading}
                                className={`px-5 py-2 text-white font-semibold rounded-md shadow-sm transition-colors text-sm ${loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                {loading ? 'Saving...' : '💾 Save Class'}
                            </button>
                        </div>
                    </div>

                    {/* Success/Error message */}
                    {message && (
                        <div className={`p-4 text-sm font-medium text-center ${messageType === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                            {message}
                        </div>
                    )}

                    {/* Mark all row */}
                    <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-end gap-2">
                        <button onClick={() => handleMarkAll('PRESENT')} className="text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-md transition-colors">Mark All Present</button>
                        <button onClick={() => handleMarkAll('ABSENT')} className="text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors">Mark All Absent</button>
                    </div>

                    {/* Student table */}
                    <div className="overflow-x-auto">
                        {loadingStudents ? (
                            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Loading students…</div>
                        ) : (
                            <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">ID / Email</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                    {records.map((record) => (
                                        <tr key={record.studentId} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{record.student.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{record.student.identifier}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => toggleStatus(record.studentId)}
                                                    className="text-zinc-600 hover:text-emerald-600 bg-zinc-100 hover:bg-emerald-50 px-3 py-1 rounded-md transition-colors"
                                                >
                                                    Toggle
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {records.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-sm text-zinc-400">
                                                No students enrolled in this course yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                    );
                })()
            )}
        </div>
    );
}
