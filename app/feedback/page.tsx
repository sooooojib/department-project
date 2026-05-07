'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FeedbackCard from '@/components/FeedbackCard';

export default function FeedbackPage() {
    const router = useRouter();
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR' | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchContext = async () => {
            try {
                // We need to fetch the logged-in user's role and data. 
                // We'll create a quick proxy to get our session or just fetch feedbacks and infer.
                // For a robust app, we'd have a /api/auth/me endpoint.
                // Let's rely on the feedback endpoint logic since it checks roles.

                const [fbRes, teacherRes] = await Promise.all([
                    fetch('/api/feedback'),
                    fetch('/api/users?role=TEACHER') // We will need to create this simple endpoints
                ]);

                if (fbRes.ok) {
                    const data = await fbRes.json();
                    setFeedbacks(data.feedbacks);

                    // A quick hack to infer role if we don't have a /me endpoint:
                    // If we see 'student' objects in all feedbacks, we are likely a teacher or admin 
                    // Let's do a proper check below using headers if possible.
                }

                if (teacherRes.ok) {
                    const data = await teacherRes.json();
                    setTeachers(data.users || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchContext();
        // Read role from cookie/localstorage or wait for a `/me` endpoint
        // For now, we will add a role-check endpoint to make this fluid.
    }, []);

    const fetchRole = async () => {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            setRole(data.role);
        }
    };

    useEffect(() => {
        fetchRole();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId: selectedTeacher, rating, comment, isAnonymous }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Failed to submit feedback');
                return;
            }

            setSuccess('Feedback submitted successfully!');
            setSelectedTeacher('');
            setRating(5);
            setComment('');
            setIsAnonymous(false);

            // Refresh feedback list
            const fbRes = await fetch('/api/feedback');
            if (fbRes.ok) {
                const updated = await fbRes.json();
                setFeedbacks(updated.feedbacks);
            }

        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-pulse h-10 w-32 bg-zinc-200 rounded"></div></div>;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-10 relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Department Feedback & Ratings</h1>
                    <p className="mt-1 font-medium text-[15px] text-slate-500">Confidential feedback system for continuous improvement.</p>
                </div>
            </div>

            {(role === 'STUDENT' || role === 'CR') && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10"></div>
                    <h2 className="text-xl font-bold text-emerald-900 mb-6">Submit Feedback</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
                        {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm">{success}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Select Teacher</label>
                                <select
                                    required
                                    className="w-full border border-zinc-300 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={selectedTeacher}
                                    onChange={e => setSelectedTeacher(e.target.value)}
                                >
                                    <option value="" disabled>Choose a teacher...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Rating (1-5)</label>
                                <select
                                    className="w-full border border-zinc-300 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={rating}
                                    onChange={e => setRating(Number(e.target.value))}
                                >
                                    {[5, 4, 3, 2, 1].map(num => (
                                        <option key={num} value={num}>{num} Stars</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Comments</label>
                            <textarea
                                className="w-full border border-zinc-300 rounded-md p-3 h-32 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                placeholder="Write your constructive feedback here..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={isAnonymous}
                                    onChange={e => setIsAnonymous(e.target.checked)}
                                />
                                <span className="text-zinc-700 font-medium">Submit Anonymously</span>
                            </label>

                            <button
                                type="submit"
                                disabled={submitting || !selectedTeacher}
                                className={`px-6 py-3 rounded-md text-white font-medium ${submitting || !selectedTeacher ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow active:scale-95 transition-all'}`}
                            >
                                {submitting ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-zinc-800 border-b pb-2">
                    {(role === 'STUDENT' || role === 'CR') ? 'Your Submitted Feedback' : 'Received Feedback'}
                </h2>

                {feedbacks.length === 0 ? (
                    <p className="text-zinc-500 italic bg-white p-8 rounded-xl border border-dashed border-zinc-300 text-center">No feedback records found.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {feedbacks.map(fb => (
                            <FeedbackCard key={fb.id} feedback={fb} viewerRole={role || 'STUDENT'} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
