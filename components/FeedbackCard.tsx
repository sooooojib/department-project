'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Paperclip, Reply, FileText, CheckCircle2, Edit3, X } from 'lucide-react';

interface FeedbackCardProps {
    feedback: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string | Date;
        student?: { name: string; email: string };
        teacher?: { name: string };
        isAnonymous: boolean;
        attachmentUrl?: string | null;
        reply?: string | null;
        replyAttachmentUrl?: string | null;
        repliedAt?: string | Date | null;
    };
    viewerRole: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR';
    onReplySubmitted?: () => void;
}

export default function FeedbackCard({ feedback, viewerRole, onReplySubmitted }: FeedbackCardProps) {
    // Shared states
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Form states (used for both reply and edit)
    const [textInput, setTextInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [rating, setRating] = useState<number>(feedback.rating);
    const [isAnonymous, setIsAnonymous] = useState<boolean>(feedback.isAnonymous);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < rating ? 'fill-current' : 'text-zinc-300'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    const dateStr = new Date(feedback.createdAt);
    const timeAgo = formatDistanceToNow(dateStr, { addSuffix: true });

    // Open forms with initial values
    const handleOpenReply = () => {
        setTextInput('');
        setFile(null);
        setRating(feedback.rating);
        setIsAnonymous(feedback.isAnonymous);
        setError('');
        setIsEditing(false);
        setIsReplying(true);
    };

    const handleOpenEdit = () => {
        if (viewerRole === 'TEACHER') {
            setTextInput(feedback.reply || '');
        } else {
            setTextInput(feedback.comment || '');
        }
        setFile(null);
        setRating(feedback.rating);
        setIsAnonymous(feedback.isAnonymous);
        setError('');
        setIsReplying(false);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsReplying(false);
        setIsEditing(false);
        setTextInput('');
        setFile(null);
        setRating(feedback.rating);
        setIsAnonymous(feedback.isAnonymous);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isStudent = viewerRole === 'STUDENT' || viewerRole === 'CR';
        const hasValidChange = textInput.trim() || file || (isStudent && isEditing && rating !== feedback.rating);

        if (!hasValidChange) {
            setError('Please provide a message, a file, or change the rating.');
            return;
        }

        setSubmitting(true);
        setError('');
        
        try {
            let uploadedFileUrl = null;

            // 1. Upload file if exists
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                
                if (!uploadRes.ok) throw new Error('Failed to upload file');
                const uploadData = await uploadRes.json();
                uploadedFileUrl = uploadData.url;
            }

            // 2. Prepare payload based on role and action
            const payload: any = { feedbackId: feedback.id };
            
            if (viewerRole === 'TEACHER') {
                payload.reply = textInput;
                if (uploadedFileUrl) payload.replyAttachmentUrl = uploadedFileUrl;
            } else {
                payload.rating = rating;
                payload.comment = textInput;
                payload.isAnonymous = isAnonymous;
                if (uploadedFileUrl) payload.attachmentUrl = uploadedFileUrl;
            }

            // 3. Submit
            const res = await fetch('/api/feedback', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save changes');

            setIsReplying(false);
            setIsEditing(false);
            setTextInput('');
            setFile(null);
            setRating(feedback.rating);
            setIsAnonymous(feedback.isAnonymous);
            if (onReplySubmitted) onReplySubmitted();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 hover:shadow-md transition-shadow flex flex-col h-full relative group">
            
            {/* Edit Button (Top Right) */}
            {!isEditing && !isReplying && (
                <div className="absolute top-4 right-4">
                    {((viewerRole === 'STUDENT' || viewerRole === 'CR') || (viewerRole === 'TEACHER' && (feedback.reply || feedback.replyAttachmentUrl))) && (
                        <button 
                            onClick={handleOpenEdit}
                            className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full hover:bg-emerald-100 transition-colors"
                            title={viewerRole === 'TEACHER' ? 'Edit reply' : 'Edit feedback'}
                        >
                            <Edit3 className="w-4 h-4 inline-block mr-1" />
                            {viewerRole === 'TEACHER' ? 'Edit Reply' : 'Edit Feedback'}
                        </button>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start mb-4 pr-10">
                <div>
                    {renderStars(feedback.rating)}
                    <h4 className="mt-2 font-medium text-zinc-900">
                        {(viewerRole === 'STUDENT' || viewerRole === 'CR') ? `To: ${feedback.teacher?.name}` : `From: ${feedback.student?.name}`}
                    </h4>
                    {viewerRole === 'ADMIN' && feedback.isAnonymous && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 mt-1">Submitted Anonymously</span>}
                </div>
                <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full whitespace-nowrap">{timeAgo}</span>
            </div>

            <div className="flex-grow">
                {/* Student Comment Display (hide if student is editing) */}
                {!(isEditing && (viewerRole === 'STUDENT' || viewerRole === 'CR')) && (
                    <>
                        <p className="text-zinc-700 italic border-l-4 border-emerald-400 pl-4 bg-zinc-50/50 p-3 rounded-r-md mb-4 whitespace-pre-wrap">
                            {feedback.comment || <span className="text-zinc-400">No comment provided.</span>}
                        </p>

                        {feedback.attachmentUrl && (
                            <a 
                                href={feedback.attachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-md text-sm text-zinc-700 hover:bg-zinc-200 transition-colors mb-4 w-fit"
                            >
                                <FileText className="w-4 h-4" />
                                Student Attachment
                            </a>
                        )}
                    </>
                )}
            </div>

            {/* Teacher Reply Display (hide if teacher is editing) */}
            {(feedback.reply || feedback.replyAttachmentUrl) && !(isEditing && viewerRole === 'TEACHER') && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-indigo-800 font-semibold text-sm">
                        <Reply className="w-4 h-4" />
                        <span>Teacher's Reply</span>
                        {feedback.repliedAt && (
                            <span className="text-xs font-normal text-indigo-400 ml-auto">
                                {formatDistanceToNow(new Date(feedback.repliedAt), { addSuffix: true })}
                            </span>
                        )}
                    </div>
                    {feedback.reply && <p className="text-sm text-indigo-900 mb-3 whitespace-pre-wrap">{feedback.reply}</p>}
                    
                    {feedback.replyAttachmentUrl && (
                        <a 
                            href={feedback.replyAttachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-indigo-200 rounded-md text-sm text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            View Attached File
                        </a>
                    )}
                </div>
            )}

            {/* Teacher Reply Button */}
            {viewerRole === 'TEACHER' && !feedback.reply && !feedback.replyAttachmentUrl && !isReplying && !isEditing && (
                <button 
                    onClick={handleOpenReply}
                    className="mt-4 w-fit flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                    <Reply className="w-4 h-4" />
                    Write a Reply
                </button>
            )}

            {/* Shared Form (Edit or Reply) */}
            {(isReplying || isEditing) && (
                <form onSubmit={handleSubmit} className="mt-4 p-4 border border-zinc-200 rounded-xl bg-zinc-50 space-y-3 relative shadow-inner">
                    <button 
                        type="button" 
                        onClick={handleCancel}
                        className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <label className="block text-sm font-semibold text-zinc-700">
                        {viewerRole === 'TEACHER' ? (isEditing ? 'Edit your reply' : 'Your Reply') : (isEditing ? 'Edit your feedback' : 'Your Feedback')}
                    </label>

                    {viewerRole !== 'TEACHER' && isEditing && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Rating</label>
                                <select
                                    value={rating}
                                    onChange={(e) => setRating(Number(e.target.value))}
                                    className="w-full border border-zinc-300 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    {[5, 4, 3, 2, 1].map(num => (
                                        <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 rounded-md border border-zinc-300 p-3">
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-zinc-700">Submit Anonymously</span>
                            </div>
                        </div>
                    )}

                    <textarea 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="w-full border border-zinc-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                        placeholder="Type your message..."
                    />

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 mb-1">
                            {isEditing ? 'Replace Attached File (Optional)' : 'Attach File (Optional)'}
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-300 rounded-md cursor-pointer hover:bg-zinc-100 text-sm font-medium text-zinc-700 transition-colors">
                                <Paperclip className="w-4 h-4" />
                                {file ? 'Change File' : 'Choose File'}
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                            {file && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> {file.name}</span>}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 rounded-md transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={submitting || !(textInput.trim() || file || ((viewerRole === 'STUDENT' || viewerRole === 'CR') && isEditing && rating !== feedback.rating))}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
