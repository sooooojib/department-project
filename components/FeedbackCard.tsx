import { formatDistanceToNow } from 'date-fns';

interface FeedbackCardProps {
    feedback: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string | Date;
        student?: { name: string; email: string };
        teacher?: { name: string };
        isAnonymous: boolean;
    };
    viewerRole: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR';
}

export default function FeedbackCard({ feedback, viewerRole }: FeedbackCardProps) {
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

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    {renderStars(feedback.rating)}
                    <h4 className="mt-2 font-medium text-zinc-900">
                        {(viewerRole === 'STUDENT' || viewerRole === 'CR') ? `To: ${feedback.teacher?.name}` : `From: ${feedback.student?.name}`}
                    </h4>
                    {viewerRole === 'ADMIN' && feedback.isAnonymous && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 mt-1">Submitted Anonymously</span>}
                </div>
                <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">{timeAgo}</span>
            </div>

            <p className="text-zinc-700 italic border-l-4 border-emerald-400 pl-4 bg-zinc-50/50 p-3 rounded-r-md">
                {feedback.comment || <span className="text-zinc-400">No comment provided.</span>}
            </p>
        </div>
    );
}
