'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface SemesterSelectorProps {
    currentYear: number | null;
    currentSemester: number | null;
    requestedYear: number | null;
    requestedSemester: number | null;
    semesterStatus: string | null;
}

export default function SemesterSelector({
    currentYear,
    currentSemester,
    requestedYear,
    requestedSemester,
    semesterStatus,
}: SemesterSelectorProps) {
    const router = useRouter();
    const [year, setYear] = useState('1');
    const [semester, setSemester] = useState('1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dismissedAlert, setDismissedAlert] = useState(false);
    const [isEditing, setIsEditing] = useState(
        !currentYear || !currentSemester || semesterStatus === 'REJECTED'
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/student/semester-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, semester }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit request');
            }

            setSuccess('Semester request submitted successfully!');
            setIsEditing(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const getRomanYear = (yr: number) => {
        const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        return years[yr - 1] || `${yr} Year`;
    };

    const getRomanSemester = (sem: number) => {
        const semesters = ['1st Semester', '2nd Semester'];
        return semesters[sem - 1] || `${sem} Semester`;
    };

    // If request is pending
    if (semesterStatus === 'PENDING' && !isEditing) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">Semester Registration Pending</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Your request to enroll in <span className="font-semibold text-slate-900">{getRomanYear(requestedYear!)} · {getRomanSemester(requestedSemester!)}</span> is awaiting administrator approval.
                        </p>
                    </div>
                </div>
                <div className="text-xs text-amber-700 font-semibold px-3 py-1.5 rounded-full bg-amber-100/50 border border-amber-200">
                    PENDING APPROVAL
                </div>
            </div>
        );
    }

    // If request was approved and not editing
    if (currentYear && currentSemester && !isEditing) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">Active Enrollment</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            You are currently assigned to <span className="font-semibold text-slate-900">{getRomanYear(currentYear)} · {getRomanSemester(currentSemester)}</span>.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-emerald-700 font-semibold px-3 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200">
                        ACTIVE
                    </div>
                    <button
                        onClick={() => {
                            setYear(currentYear.toString());
                            setSemester(currentSemester.toString());
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 bg-white transition-all shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Request Change
                    </button>
                </div>
            </div>
        );
    }

    // Input form (Editing / First Time / Rejected)
    const handleDismissRejection = async () => {
        setDismissedAlert(true);
        if (semesterStatus === 'REJECTED') {
            try {
                await fetch('/api/student/semester-request', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'DISMISS_REJECTION' })
                });
                router.refresh();
            } catch (err) {
                console.error('Failed to dismiss rejection', err);
            }
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-base">Select Your Semester</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Choose the year and semester you are currently attending to access your course syllabus, class schedule, and exams.
                    </p>
                </div>
            </div>

            {semesterStatus === 'REJECTED' && !dismissedAlert && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 text-red-700 text-sm relative">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold">Request Rejected:</span> Your previous request to join a semester was declined. Please verify and submit again.
                        </div>
                    </div>
                    <button 
                        onClick={handleDismissRejection}
                        className="text-red-400 hover:text-red-700 transition-colors mt-0.5"
                    >
                        ✕
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Row 1: Year + Semester selects */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm bg-slate-50 font-medium"
                        >
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>

                    <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Semester</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm bg-slate-50 font-medium"
                        >
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                        </select>
                    </div>
                </div>

                {/* Row 2: Action buttons */}
                <div className="flex gap-3 justify-center">
                    {currentYear && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                handleDismissRejection();
                            }}
                            className="h-11 px-6 font-bold text-sm text-emerald-700 border border-emerald-300 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex-shrink-0"
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>

            {error && (
                <p className="text-xs font-semibold text-red-500 mt-2">{error}</p>
            )}
            {success && (
                <p className="text-xs font-semibold text-emerald-600 mt-2">{success}</p>
            )}
        </div>
    );
}
