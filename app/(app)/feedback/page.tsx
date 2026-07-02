'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import FeedbackCard from '@/components/FeedbackCard';

export default function FeedbackPage() {
    const router = useRouter();
    const { data: feedbacksData, mutate: mutateFeedbacks, isLoading: loadingFeedbacks } = useSWR('/api/feedback', fetcher);
    const { data: teachersData, isLoading: loadingTeachers } = useSWR('/api/users?role=TEACHER', fetcher);
    const { data: sessionData, isLoading: loadingRole } = useSWR('/api/auth/session', fetcher);

    const feedbacks = feedbacksData?.feedbacks || [];
    const teachers = teachersData?.users || [];
    const role = sessionData?.user?.role || null;
    const loading = loadingFeedbacks || loadingTeachers || loadingRole;

    // Form state
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [filterMode, setFilterMode] = useState<'ALL' | 'REPLIED' | 'NOT_REPLIED'>('ALL');



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            let attachmentUrl = null;

            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                
                if (!uploadRes.ok) throw new Error('Failed to upload file');
                const uploadData = await uploadRes.json();
                attachmentUrl = uploadData.url;
            }

            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId: selectedTeacher, rating, comment, isAnonymous, attachmentUrl }),
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
            setFile(null);

            // Refresh feedback list
            mutateFeedbacks();

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
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
                                    {teachers.map((t: any) => (
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

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                        checked={isAnonymous}
                                        onChange={e => setIsAnonymous(e.target.checked)}
                                    />
                                    <span className="text-zinc-700 font-medium text-sm">Submit Anonymously</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 hover:text-emerald-700 transition-colors">
                                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    {file ? <span className="text-emerald-600 truncate max-w-[150px]">{file.name}</span> : 'Attach File'}
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                    <h2 className="text-2xl font-bold text-zinc-800">
                        {(role === 'STUDENT' || role === 'CR') ? 'Your Submitted Feedback' : 'Received Feedback'}
                    </h2>
                    
                    <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setFilterMode('ALL')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterMode === 'ALL' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilterMode('REPLIED')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterMode === 'REPLIED' ? 'bg-white text-emerald-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                        >
                            Replied
                        </button>
                        <button 
                            onClick={() => setFilterMode('NOT_REPLIED')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterMode === 'NOT_REPLIED' ? 'bg-white text-amber-600 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                        >
                            Not Replied
                        </button>
                    </div>
                </div>

                {(() => {
                    const filtered = feedbacks.filter((fb: any) => {
                        if (filterMode === 'REPLIED') return !!fb.reply || !!fb.replyAttachmentUrl;
                        if (filterMode === 'NOT_REPLIED') return !fb.reply && !fb.replyAttachmentUrl;
                        return true;
                    });

                    if (filtered.length === 0) {
                        return <p className="text-zinc-500 italic bg-white p-8 rounded-xl border border-dashed border-zinc-300 text-center">No feedback records found for this filter.</p>;
                    }

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filtered.map((fb: any) => (
                                <FeedbackCard key={fb.id} feedback={fb} viewerRole={role || 'STUDENT'} onReplySubmitted={() => mutateFeedbacks()} />
                            ))}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
