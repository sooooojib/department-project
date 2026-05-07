'use client';

import { useState, useEffect } from 'react';

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
    courseId,
    initialStudents = []
}: {
    courseId: string,
    initialStudents?: Student[]
}) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<AttendanceRecord[]>(
        initialStudents.map(s => ({ studentId: s.id, student: s, status: 'ABSENT' }))
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [sessionCode, setSessionCode] = useState<string | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch(`/api/attendance/session?courseId=${courseId}&date=${date}`);
                if (res.ok) {
                    const data = await res.json();
                    setSessionCode(data.code);
                    setIsSessionActive(data.isActive);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchSession();
    }, [courseId, date]);

    const handleToggleSession = async () => {
        try {
            const action = isSessionActive ? 'deactivate' : 'activate';
            const res = await fetch('/api/attendance/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, date, action })
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

    const handleSubmit = async () => {
        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    date,
                    records: records.map(r => ({ studentId: r.studentId, status: r.status }))
                })
            });

            if (res.ok) {
                setMessage('Attendance saved successfully!');
            } else {
                setMessage('Failed to save attendance.');
            }
        } catch (error) {
            setMessage('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.location.href = `/api/attendance/export?courseId=${courseId}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden">
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
            <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-900">Mark Attendance</h3>
                    <p className="text-sm text-zinc-500">Select students who are present.</p>
                </div>

                <div className="flex gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                    <button
                        onClick={() => handleExport()}
                        className="px-4 py-2 border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 font-medium rounded-md shadow-sm transition-colors text-sm"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-4 py-2 text-white font-medium rounded-md shadow-sm transition-colors text-sm ${loading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                        {loading ? 'Saving...' : 'Save Roster'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 text-sm font-medium text-center ${message.includes('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-end gap-2">
                <button onClick={() => handleMarkAll('PRESENT')} className="text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-md transition-colors">Mark All Present</button>
                <button onClick={() => handleMarkAll('ABSENT')} className="text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors">Mark All Absent</button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Student</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-200">
                        {records.map((record) => (
                            <tr key={record.studentId} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{record.student.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{record.student.identifier}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${record.status === 'PRESENT'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                        }`}>
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
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500">
                                    No students found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
