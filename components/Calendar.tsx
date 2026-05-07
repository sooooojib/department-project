'use client';

import { format } from 'date-fns';

interface CalendarProps {
    slots: any[];
    role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR';
    onSlotClick?: (slot: any) => void;
    // Legacy support for Schedule module
    userId?: string;
    onBookSlot?: (slotId: string, title: string) => Promise<void>;
    onCreateSlot?: (startTime: string, endTime: string) => Promise<void>;
}

export default function Calendar({ slots, role, onSlotClick }: CalendarProps) {
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

    return (
        <div className="space-y-6">
            {sortedDates.map((dateStr) => (
                <div key={dateStr} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50">
                    <h3 className="font-bold text-zinc-800 mb-4 pb-2 border-b">
                        {format(new Date(dateStr), 'EEEE, MMMM do')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {grouped[dateStr].map((slot: any) => {
                            const startTime = format(new Date(slot.startTime), 'h:mm a');
                            const endTime = format(new Date(slot.endTime), 'h:mm a');

                            // For teachers, determine if this slot is already booked/approved
                            // Supports both CounselingSlot (requests) and ScheduleSlot (status)
                            const isApproved = slot.status === 'BOOKED' || (slot.requests && slot.requests.some((r: any) => r.status === 'APPROVED'));

                            let boxClass = "border rounded-xl p-4 transition-all shadow-sm ";
                            
                            if (isApproved) {
                                // RED for approved / booked
                                boxClass += "bg-red-50 border-red-200 ";
                            } else {
                                // GREEN for available
                                boxClass += "bg-emerald-50 border-emerald-200 ";
                                // CRs can click available slots to book, Teachers can click to view
                                if (role === 'CR' || role === 'TEACHER') {
                                    boxClass += "cursor-pointer hover:-translate-y-1 hover:shadow-emerald-100 hover:bg-emerald-100";
                                }
                            }

                            return (
                                <div key={slot.id} className={boxClass} onClick={() => {
                                    if ((role === 'CR' && !isApproved) || role === 'TEACHER' || role === 'STUDENT') {
                                        onSlotClick?.(slot);
                                    }
                                }}>
                                    <div className="font-semibold text-zinc-900">{startTime} - {endTime}</div>
                                    <div className="text-sm mt-1 mb-2">
                                        {(role === 'STUDENT' || role === 'CR') && <span className="text-emerald-700 font-medium">Prof. {slot.teacher?.name}</span>}
                                        {role === 'TEACHER' && isApproved && <span className="text-red-700 font-medium font-mono text-xs px-2 py-0.5 bg-red-100 rounded">BOOKED</span>}
                                        {role === 'TEACHER' && !isApproved && <span className="text-emerald-700 font-medium font-mono text-xs px-2 py-0.5 bg-emerald-100 rounded">AVAILABLE</span>}
                                    </div>

                                    {/* Quick stat for teachers indicating pending requests */}
                                    {role === 'TEACHER' && !isApproved && slot.requests?.length > 0 && (
                                        <div className="text-xs text-amber-600 font-medium">
                                            {slot.requests.filter((r: any) => r.status === 'PENDING').length} pending request(s)
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
