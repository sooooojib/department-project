'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import { format } from 'date-fns';

export default function CounselingPage() {
    const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR' | null>(null);
    const [slots, setSlots] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [selectedSlot, setSelectedSlot] = useState<any>(null); // For active modal
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Teacher slot creation
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');

    const fetchData = async () => {
        try {
            const roleRes = await fetch('/api/auth/me');
            if (roleRes.ok) {
                const { role: userRole } = await roleRes.json();
                setRole(userRole);
            }

            const slotsRes = await fetch('/api/counseling');
            if (slotsRes.ok) {
                const { slots: data, currentUserId: uid } = await slotsRes.json();
                setSlots(data);
                if (uid) setCurrentUserId(uid);
            }
        } catch (err) {
            console.error('Failed to load counseling data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const handleSlotClick = (slot: any) => {
        // Students/CR: only allow clicking on available slots they haven't already booked
        if (role === 'STUDENT' || role === 'CR') {
            const myRequest = slot.requests?.find((r: any) => r.studentId === currentUserId);
            const isBookedByOther = slot.requests?.some((r: any) => r.status === 'APPROVED' && r.studentId !== currentUserId);
            if (!isBookedByOther && !myRequest) {
                setSelectedSlot(slot);
            }
        }
        if (role === 'TEACHER') {
            setSelectedSlot(slot);
        }
    };

    const submitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/counseling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotId: selectedSlot.id, purpose }),
            });

            if (res.ok) {
                showMessage('success', 'Counseling request submitted!');
                setSelectedSlot(null);
                setPurpose('');
                fetchData();
            } else {
                const { message: err } = await res.json();
                showMessage('error', err || 'Failed to request slot');
            }
        } catch {
            showMessage('error', 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateSlot = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent opening slots in the past
        if (new Date(newStartTime) < new Date()) {
            showMessage('error', 'Cannot create a slot in the past.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/counseling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startTime: newStartTime, endTime: newEndTime }),
            });
            if (res.ok) {
                showMessage('success', 'Available slot created!');
                setNewStartTime('');
                setNewEndTime('');
                fetchData();
            } else {
                showMessage('error', 'Failed to create slot');
            }
        } catch {
            showMessage('error', 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const manageRequest = async (requestId: string, newStatus: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this request?`)) return;

        try {
            const res = await fetch('/api/counseling', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: newStatus }),
            });

            if (res.ok) {
                showMessage('success', `Request marked as ${newStatus}`);
                fetchData();
                setSelectedSlot(null); // Close modal
            } else {
                const { message: err } = await res.json();
                showMessage('error', err || `Failed to update to ${newStatus}`);
            }
        } catch {
            showMessage('error', 'Network error');
        }
    };

    if (loading) return <div className="p-10 text-center text-zinc-500">Loading counseling portal...</div>;

    // A simple list view component to render the requests inside the teacher Modal
    const TeacherModalContent = ({ slot }: { slot: any }) => {
        const isApproved = slot.requests.some((r: any) => r.status === 'APPROVED');
        return (
            <div className="space-y-4">
                <h3 className="font-bold border-b pb-2">Slot Management</h3>
                <p className="text-sm text-zinc-600">
                    {format(new Date(slot.startTime), 'MMM do, h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                </p>

                {isApproved ? (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl text-center border border-red-200">
                        <strong className="block mb-1">Booked by: {slot.requests.find((r: any) => r.status === 'APPROVED').student.name}</strong>
                        This slot is closed. All other requests were automatically rejected.
                    </div>
                ) : (
                    <div>
                        <h4 className="font-medium text-zinc-800 mb-2 mt-4">Pending Requests ({slot.requests.filter((r: any) => r.status === 'PENDING').length})</h4>
                        {slot.requests.length === 0 && <p className="text-zinc-500 text-sm">No requests for this time block yet.</p>}

                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {slot.requests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                                <div key={req.id} className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-zinc-900">{req.student.name}</p>
                                            <p className="text-xs text-zinc-500">{req.student.email}</p>
                                        </div>
                                    </div>
                                    <p className="my-2 text-sm italic text-zinc-700">"{req.purpose}"</p>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => manageRequest(req.id, 'APPROVED')} className="flex-1 bg-emerald-600 text-white py-1.5 rounded text-sm hover:bg-emerald-700">Approve</button>
                                        <button onClick={() => manageRequest(req.id, 'REJECTED')} className="flex-1 bg-zinc-200 text-zinc-800 py-1.5 rounded text-sm hover:bg-zinc-300">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 relative">
            {/* Global Notification Toast */}
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-xl text-white font-medium ${message.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Counseling Schedule</h1>
                    {role === 'CR' && (
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Book a counseling slot with a teacher. Click an available block on the calendar below.
                        </p>
                    )}
                </div>
            </div>

            {role === 'TEACHER' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Offer New Slot (Start Time)</label>
                        <input
                            type="datetime-local"
                            className="w-full border border-zinc-300 rounded-md p-2 focus:ring-emerald-500"
                            value={newStartTime} onChange={e => setNewStartTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Slot End Time</label>
                        <input
                            type="datetime-local"
                            className="w-full border border-zinc-300 rounded-md p-2 focus:ring-emerald-500"
                            value={newEndTime} onChange={e => setNewEndTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                    </div>
                    <button
                        onClick={handleCreateSlot}
                        disabled={!newStartTime || !newEndTime || submitting}
                        className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Open Slot
                    </button>
                </div>
            )}

            {/* The shared Calendar UI */}
            <Calendar slots={slots} role={role || 'STUDENT'} onSlotClick={handleSlotClick} currentUserId={currentUserId} />

            {/* MODAL / OVERLAY */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                        <button
                            onClick={() => setSelectedSlot(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700"
                        >
                            ✕
                        </button>

                        {(role === 'STUDENT' || role === 'CR') && (
                            <form onSubmit={submitRequest} className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-xl text-zinc-900 mb-1">Request Counseling</h3>
                                    <p className="text-zinc-600 text-sm">
                                        {format(new Date(selectedSlot.startTime), 'EEEE, MMM do (h:mm a)')} with Prof. {selectedSlot.teacher?.name}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">Purpose of visit</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            value={purpose}
                                            onChange={e => setPurpose(e.target.value)}
                                            onFocus={(e) => {
                                                const dropdown = e.target.nextElementSibling;
                                                if (dropdown) dropdown.classList.remove('hidden');
                                            }}
                                            onBlur={(e) => {
                                                const dropdown = e.target.nextElementSibling;
                                                if (dropdown) setTimeout(() => dropdown.classList.add('hidden'), 200);
                                            }}
                                            placeholder="Search or type a reason..."
                                            className="w-full border border-zinc-300 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                        <div className="hidden absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {['Academic Advising', 'Research Discussion', 'Mental Pressure', 'Class Issue', 'Career Guidance', 'Other']
                                                .filter(r => r.toLowerCase().includes(purpose.toLowerCase()))
                                                .map(reason => (
                                                    <div
                                                        key={reason}
                                                        className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-zinc-700"
                                                        onClick={() => setPurpose(reason)}
                                                    >
                                                        {reason}
                                                    </div>
                                                ))}
                                            {['Academic Advising', 'Research Discussion', 'Mental Pressure', 'Class Issue', 'Career Guidance', 'Other']
                                                .filter(r => r.toLowerCase().includes(purpose.toLowerCase())).length === 0 && (
                                                <div className="px-4 py-2 text-sm text-zinc-500 italic">
                                                    Custom reason will be used
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button type="button" onClick={() => setSelectedSlot(null)} className="px-5 py-2 text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting || !purpose} className="px-5 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50">Confirm Booking</button>
                                </div>
                            </form>
                        )}

                        {role === 'TEACHER' && (
                            <TeacherModalContent slot={selectedSlot} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
