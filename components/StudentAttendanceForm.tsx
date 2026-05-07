'use client';

import { useState } from 'react';

export default function StudentAttendanceForm({ courses }: { courses: { id: string, code: string, name: string }[] }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [courseId, setCourseId] = useState(courses[0]?.id || '');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        
        try {
            const res = await fetch('/api/attendance/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, date, code })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setMessageType('success');
                setMessage(data.message || 'Attendance marked successfully!');
                setCode('');
                // Optionally reload page to update the table
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessageType('error');
                setMessage(data.message || 'Failed to mark attendance.');
            }
        } catch (error) {
            setMessageType('error');
            setMessage('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (courses.length === 0) return null;

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Submit Live Attendance</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Course</label>
                    <select
                        required
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Attendance Code</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. A7B9X2"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg font-mono text-center tracking-widest uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !code}
                        className={`w-full sm:w-auto px-8 py-2.5 font-medium rounded-lg text-white transition-colors ${
                            loading || !code ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                    >
                        {loading ? 'Submitting...' : 'Submit Code'}
                    </button>
                </div>
            </form>

            {message && (
                <div className={`mt-4 p-4 rounded-lg text-sm font-medium ${
                    messageType === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}
