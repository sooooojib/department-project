'use client';

import { format } from 'date-fns';

interface CalendarProps {
    slots: any[];
    role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR';
    onSlotClick?: (slot: any) => void;
    currentUserId?: string | null;
    // Legacy support for Schedule module
    userId?: string;
    onBookSlot?: (slotId: string, title: string) => Promise<void>;
    onCreateSlot?: (startTime: string, endTime: string) => Promise<void>;
}

export default function Calendar({ slots, role, onSlotClick, currentUserId }: CalendarProps) {
    if (!slots || slots.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl border border-dashed border-zinc-300 text-center text-zinc-500">
                No slots available to display.
            </div>
        );
    }

    // Grouping slots logically by Date
    const grouped = slots.reduce((acc: any, slot: any) => {
        const dateStr = format(new Date(slot.startTime), 'yyyy-MM-dd');
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(slot);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const futureDates = sortedDates.filter(d => d >= todayStr);
    const pastDates = sortedDates.filter(d => d < todayStr).sort((a, b) => b.localeCompare(a));

    const renderDateGroup = (dateStr: string, isPast: boolean) => (
        <div key={dateStr} className={`bg-white p-6 rounded-2xl shadow-sm border ${isPast ? 'border-slate-200 bg-slate-50' : 'border-emerald-50'}`}>
            <h3 className={`font-bold mb-4 pb-2 border-b ${isPast ? 'text-slate-600' : 'text-zinc-800'}`}>
                {format(new Date(dateStr), 'EEEE, MMMM do')}
            </h3>
            <div className="flex flex-wrap gap-4">
                {grouped[dateStr].map((slot: any) => {
                    const startTime = format(new Date(slot.startTime), 'h:mm a');
                    const endTime = format(new Date(slot.endTime), 'h:mm a');

                    // Check if the current user has a request on this slot
                    const myRequest = slot.requests?.find((r: any) => r.studentId === currentUserId);
                    const isMineApproved = myRequest?.status === 'APPROVED';
                    const isMineRequested = myRequest?.status === 'PENDING';

                    // Check if someone ELSE has an approved booking
                    const isBookedByOther = slot.requests?.some((r: any) => r.status === 'APPROVED' && r.studentId !== currentUserId);

                    // For any user, was this slot booked at all?
                    const isBookedAtAll = slot.status === 'BOOKED' || slot.requests?.some((r: any) => r.status === 'APPROVED');

                    let boxClass = 'border rounded-xl p-4 transition-all shadow-sm flex-1 min-w-[280px] max-w-[400px] ';

                    if (isPast) {
                        boxClass += 'bg-slate-100 border-slate-200 opacity-80 ';
                    } else {
                        if (isMineApproved) {
                            boxClass += 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 ';
                        } else if (isMineRequested) {
                            boxClass += 'bg-amber-50 border-amber-200 ';
                        } else if (isBookedByOther || (role === 'TEACHER' && isBookedAtAll)) {
                            boxClass += 'bg-zinc-100 border-zinc-200 opacity-60 ';
                        } else {
                            boxClass += 'bg-emerald-50 border-emerald-200 ';
                            if (role === 'CR' || role === 'TEACHER' || role === 'STUDENT') {
                                boxClass += 'cursor-pointer hover:-translate-y-1 hover:shadow-md hover:bg-emerald-100';
                            }
                        }
                    }

                    const isClickable = !isPast && (role === 'TEACHER' || (!isMineApproved && !isMineRequested && !isBookedByOther));

                    return (
                        <div key={slot.id} className={boxClass} onClick={() => { if (isClickable) onSlotClick?.(slot); }}>
                            <div className="font-semibold text-zinc-900">{startTime} - {endTime}</div>
                            <div className="text-sm mt-1 mb-2 flex flex-wrap items-center gap-2">
                                {(role === 'STUDENT' || role === 'CR') && (
                                    <span className={`font-medium ${isPast ? 'text-slate-600' : 'text-emerald-700'}`}>
                                        Prof. {slot.teacher?.name}
                                    </span>
                                )}

                                {isPast ? (
                                    isBookedAtAll ? (
                                        <span className="text-emerald-800 font-semibold font-mono text-xs px-2 py-0.5 bg-emerald-200 rounded-full">
                                            Successful Counsel
                                        </span>
                                    ) : (
                                        <span className="text-slate-600 font-medium font-mono text-xs px-2 py-0.5 bg-slate-200 rounded-full">
                                            Not Booked
                                        </span>
                                    )
                                ) : (
                                    // Future labels
                                    (role === 'STUDENT' || role === 'CR') ? (
                                        <>
                                            {isMineApproved && <span className="text-emerald-800 font-semibold font-mono text-xs px-2 py-0.5 bg-emerald-200 rounded-full">✓ You've booked this!</span>}
                                            {isMineRequested && <span className="text-amber-700 font-medium font-mono text-xs px-2 py-0.5 bg-amber-100 rounded-full">⏳ Request Pending</span>}
                                            {isBookedByOther && <span className="text-zinc-500 font-medium font-mono text-xs px-2 py-0.5 bg-zinc-200 rounded-full">Unavailable</span>}
                                            {!isMineApproved && !isMineRequested && !isBookedByOther && <span className="text-emerald-700 font-medium font-mono text-xs px-2 py-0.5 bg-emerald-100 rounded-full">Available</span>}
                                        </>
                                    ) : (
                                        <>
                                            {isBookedAtAll
                                                ? <span className="text-red-700 font-medium font-mono text-xs px-2 py-0.5 bg-red-100 rounded-full">BOOKED</span>
                                                : <span className="text-emerald-700 font-medium font-mono text-xs px-2 py-0.5 bg-emerald-100 rounded-full">AVAILABLE</span>
                                            }
                                        </>
                                    )
                                )}
                            </div>

                            {!isPast && isMineApproved && (role === 'STUDENT' || role === 'CR') && (
                                <p className="text-xs text-emerald-700 font-medium mt-1">Your session is confirmed. See you there! 🎉</p>
                            )}
                            {!isPast && isMineRequested && (role === 'STUDENT' || role === 'CR') && (
                                <p className="text-xs text-amber-600 font-medium mt-1">Awaiting teacher approval.</p>
                            )}
                            {!isPast && role === 'TEACHER' && !isBookedAtAll && slot.requests?.length > 0 && (
                                <div className="text-xs text-amber-600 font-medium">
                                    {slot.requests.filter((r: any) => r.status === 'PENDING').length} pending request(s)
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {futureDates.map(d => renderDateGroup(d, false))}
            
            {pastDates.length > 0 && (
                <div className="mt-12 pt-8 border-t border-dashed border-slate-300">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Past Counseling</h2>
                    <div className="space-y-6 opacity-80">
                        {pastDates.map(d => renderDateGroup(d, true))}
                    </div>
                </div>
            )}
        </div>
    );
}
