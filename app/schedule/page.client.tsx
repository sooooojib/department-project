'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import { format } from 'date-fns';
import { CalendarDays, ClipboardList, Plus, GraduationCap } from 'lucide-react';

interface Exam {
    id: string;
    title: string;
    date: string;
    course: { code: string; name: string };
}

interface Course {
    id: string;
    code: string;
    name: string;
}

export default function ScheduleClientPage({
    initialSlots,
    sessionRole,
    userId
}: {
    initialSlots: any[];
    sessionRole: string;
    userId: string;
}) {
    const [slots, setSlots] = useState(initialSlots);
    const [error, setError] = useState('');

    // CR exam scheduling state
    const [activeTab, setActiveTab] = useState<'classes' | 'exams'>('classes');
    const [exams, setExams] = useState<Exam[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [examTitle, setExamTitle] = useState('');
    const [examCourseId, setExamCourseId] = useState('');
    const [examDate, setExamDate] = useState('');
    const [examMsg, setExamMsg] = useState('');
    const [examLoading, setExamLoading] = useState(false);

    // CR direct class scheduling state
    const [teachers, setTeachers] = useState<any[]>([]);
    const [classCourseId, setClassCourseId] = useState('');
    const [classTeacherId, setClassTeacherId] = useState('');
    const [classDate, setClassDate] = useState('');
    const [classStartTime, setClassStartTime] = useState('');
    const [classEndTime, setClassEndTime] = useState('');
    const [classRoom, setClassRoom] = useState('');
    const [classMsg, setClassMsg] = useState('');
    const [classLoading, setClassLoading] = useState(false);

    // CR slot booking modal state (legacy click-to-book)
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [bookingCourseId, setBookingCourseId] = useState('');
    const [bookingRoom, setBookingRoom] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const isCR = sessionRole === 'CR';

    const refreshSlots = async () => {
        const res = await fetch('/api/schedule');
        if (res.ok) {
            const data = await res.json();
            setSlots(data.slots);
        }
    };

    const fetchExamData = async () => {
        const [examRes, courseRes, teacherRes] = await Promise.all([
            fetch('/api/cr/exam'),
            fetch('/api/courses'),
            fetch('/api/users?role=TEACHER'),
        ]);
        if (examRes.ok) { const d = await examRes.json(); setExams(d.exams || []); }
        if (courseRes.ok) { const d = await courseRes.json(); setCourses(d.courses || []); }
        if (teacherRes.ok) { const d = await teacherRes.json(); setTeachers(d.users || []); }
    };

    useEffect(() => {
        if (isCR) { fetchExamData(); }
        // Fetch courses for non-CR if needed, but CR needs it for booking
        if (!isCR) {
            fetch('/api/courses').then(r => r.ok && r.json()).then(d => setCourses(d.courses || []));
        }
    }, [isCR]);

    const handleCreateSlot = async (startTime: string, endTime: string) => {
        setError('');
        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startTime, endTime })
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.message || 'Failed to create slot (overlap detected).');
            } else {
                await refreshSlots();
            }
        } catch {
            setError('An unexpected error occurred.');
        }
    };

    const handleBookSlot = async (slotId: string, title: string) => {
        setError('');
        try {
            const res = await fetch('/api/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotId, title })
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.message || 'Failed to book slot. It may have been taken by another CR.');
            } else {
                await refreshSlots();
            }
        } catch {
            setError('An unexpected error occurred.');
        }
    };

    const handleSlotClick = (slot: any) => {
        if (isCR && slot.status === 'AVAILABLE') {
            setSelectedSlot(slot);
        }
    };

    const handleConfirmBooking = async () => {
        const course = courses.find(c => c.id === bookingCourseId);
        if (!course) return;
        const title = `${course.code} - ${course.name} | Room: ${bookingRoom}`;
        setBookingLoading(true);
        await handleBookSlot(selectedSlot.id, title);
        setBookingLoading(false);
        setSelectedSlot(null);
        setBookingRoom('');
        setBookingCourseId('');
    };

    const handleExamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setExamMsg('');
        setExamLoading(true);
        try {
            const res = await fetch('/api/cr/exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: examTitle, courseId: examCourseId, date: examDate }),
            });
            const d = await res.json();
            if (res.ok) {
                setExamMsg('✓ Exam scheduled successfully!');
                setExamTitle('');
                setExamCourseId('');
                setExamDate('');
                await fetchExamData();
            } else {
                setExamMsg(`✗ ${d.message || 'Failed to schedule exam.'}`);
            }
        } catch {
            setExamMsg('✗ Network error.');
        } finally {
            setExamLoading(false);
        }
    };

    const handleClassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setClassMsg('');
        setClassLoading(true);
        try {
            const res = await fetch('/api/cr/class-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    courseId: classCourseId, 
                    teacherId: classTeacherId, 
                    date: classDate, 
                    startTime: classStartTime, 
                    endTime: classEndTime, 
                    roomNumber: classRoom 
                }),
            });
            const d = await res.json();
            if (res.ok) {
                setClassMsg('✓ Class scheduled successfully!');
                setClassCourseId('');
                setClassTeacherId('');
                setClassDate('');
                setClassStartTime('');
                setClassEndTime('');
                setClassRoom('');
                await refreshSlots();
            } else {
                setClassMsg(`✗ ${d.message || 'Failed to schedule class.'}`);
            }
        } catch {
            setClassMsg('✗ Network error.');
        } finally {
            setClassLoading(false);
        }
    };

    const inputCls = "w-full h-11 px-4 rounded-xl text-sm text-slate-800 border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all";
    const btnCls = "px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50";

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 relative">

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">
                        {isCR ? 'Schedule Management' : 'Department Schedule'}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium text-[15px]">
                        {sessionRole === 'TEACHER' && 'Set your availability below. Students will see green blocks.'}
                        {sessionRole === 'CR' && 'Manage class slots and schedule exams for your class.'}
                        {sessionRole === 'STUDENT' && "View your professor's availability and booked class slots."}
                    </p>
                </div>
            </div>

            {/* CR Tab Switcher */}
            {isCR && (
                <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('classes')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'classes'
                                ? 'bg-white text-emerald-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <CalendarDays className="w-4 h-4" />
                        Class Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('exams')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'exams'
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Exam Schedule
                    </button>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-500 rounded-xl font-medium shadow-sm">
                    {error}
                </div>
            )}

            {/* ── CLASS SCHEDULE TAB (or non-CR view) ── */}
            {(!isCR || activeTab === 'classes') && (
                <div className={`grid grid-cols-1 ${isCR ? 'xl:grid-cols-3' : 'gap-6'} gap-6`}>
                    
                    {/* CR Class Scheduling Form */}
                    {isCR && (
                        <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-emerald-50/60">
                                <Plus className="w-4 h-4 text-emerald-600" />
                                <h2 className="font-bold text-slate-800 text-[15px]">Assign New Class</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-xs text-slate-500 mb-5">
                                    Directly schedule a class for a specific course, teacher, and room.
                                </p>
                                <form onSubmit={handleClassSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Course</label>
                                        <select value={classCourseId} onChange={e => setClassCourseId(e.target.value)} required className={inputCls}>
                                            <option value="">Select a course...</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Professor</label>
                                        <select value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)} required className={inputCls}>
                                            <option value="">Select a professor...</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                                        <input className={inputCls} type="date" value={classDate} onChange={e => setClassDate(e.target.value)} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                                            <input className={inputCls} type="time" value={classStartTime} onChange={e => setClassStartTime(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                                            <input className={inputCls} type="time" value={classEndTime} onChange={e => setClassEndTime(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Room Number</label>
                                        <input className={inputCls} type="text" placeholder="e.g. 302" value={classRoom} onChange={e => setClassRoom(e.target.value)} required />
                                    </div>

                                    {classMsg && (
                                        <p className={`text-sm font-medium ${classMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {classMsg}
                                        </p>
                                    )}

                                    <button type="submit" disabled={classLoading} className={`${btnCls} bg-emerald-600 hover:bg-emerald-700 w-full justify-center flex items-center gap-2`}>
                                        <CalendarDays className="w-4 h-4" />
                                        {classLoading ? 'Assigning...' : 'Assign Class'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                    
                    <div className={isCR ? "xl:col-span-2 space-y-4" : "space-y-4"}>
                        {isCR && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 text-sm text-emerald-800 font-medium">
                                Scheduled classes will appear on the calendar below. You can also click a <span className="font-bold">green block</span> to book a pre-set availability slot.
                            </div>
                        )}
                        <Calendar
                            slots={slots}
                            role={sessionRole as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR'}
                            userId={userId}
                            onSlotClick={handleSlotClick}
                            onBookSlot={handleBookSlot}
                            onCreateSlot={handleCreateSlot}
                        />
                    </div>
                </div>
            )}

            {/* Booking Modal (Legacy Click-to-Book) */}
            {selectedSlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <h3 className="font-bold text-xl text-slate-800">Assign Class</h3>
                        
                        <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p><strong>Date:</strong> {format(new Date(selectedSlot.startTime), 'EEEE, MMMM do, yyyy')}</p>
                            <p><strong>Time:</strong> {format(new Date(selectedSlot.startTime), 'h:mm a')} - {format(new Date(selectedSlot.endTime), 'h:mm a')}</p>
                            <p><strong>Prof:</strong> {selectedSlot.teacher?.name}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Course</label>
                            <select
                                value={bookingCourseId}
                                onChange={e => setBookingCourseId(e.target.value)}
                                className={inputCls}
                            >
                                <option value="">Select course...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Room Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 302"
                                value={bookingRoom}
                                onChange={e => setBookingRoom(e.target.value)}
                                className={inputCls}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setSelectedSlot(null)}
                                className="px-4 py-2 font-medium text-slate-500 hover:text-slate-700"
                            >Cancel</button>
                            <button 
                                onClick={handleConfirmBooking}
                                disabled={!bookingCourseId || !bookingRoom || bookingLoading}
                                className={`${btnCls} bg-emerald-600 hover:bg-emerald-700`}
                            >
                                {bookingLoading ? 'Assigning...' : 'Assign Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EXAM SCHEDULE TAB (CR only) ── */}
            {isCR && activeTab === 'exams' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* Exam scheduling form */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-purple-50/60">
                            <Plus className="w-4 h-4 text-purple-600" />
                            <h2 className="font-bold text-slate-800 text-[15px]">Schedule New Exam</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-slate-500 mb-5">
                                Set an exam for your class. The system will notify students on their dashboards.
                            </p>
                            <form onSubmit={handleExamSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course</label>
                                    <select
                                        value={examCourseId}
                                        onChange={e => setExamCourseId(e.target.value)}
                                        required
                                        className={inputCls}
                                    >
                                        <option value="">Select a course...</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Title</label>
                                    <input
                                        className={inputCls}
                                        type="text"
                                        placeholder="e.g. Midterm Exam, Final Exam"
                                        value={examTitle}
                                        onChange={e => setExamTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date &amp; Time</label>
                                    <input
                                        className={inputCls}
                                        type="datetime-local"
                                        value={examDate}
                                        onChange={e => setExamDate(e.target.value)}
                                        required
                                    />
                                </div>

                                {examMsg && (
                                    <p className={`text-sm font-medium ${examMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {examMsg}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={examLoading}
                                    className={`${btnCls} bg-purple-600 hover:bg-purple-700 w-full justify-center flex items-center gap-2`}
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    {examLoading ? 'Scheduling...' : 'Schedule Exam'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Upcoming exams list */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                            <GraduationCap className="w-4 h-4 text-slate-500" />
                            <h2 className="font-bold text-slate-800 text-[15px]">Upcoming Exams</h2>
                            <span className="ml-auto text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                                {exams.length} total
                            </span>
                        </div>
                        <div className="p-6">
                            {exams.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                                    <ClipboardList className="w-10 h-10 mb-3 text-slate-300" />
                                    <p className="text-sm font-medium">No exams scheduled yet.</p>
                                    <p className="text-xs text-slate-300 mt-1">Use the form to schedule your first exam.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                    {exams.map(ex => (
                                        <div
                                            key={ex.id}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 border border-purple-100 hover:border-purple-300 transition-colors"
                                        >
                                            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                {ex.course.code.slice(0, 4)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{ex.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{ex.course.name}</p>
                                                <p className="text-xs text-purple-600 font-medium mt-1">
                                                    {format(new Date(ex.date), 'EEEE, MMM d · h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}
