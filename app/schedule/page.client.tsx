'use client';

import { useState, useEffect, useCallback } from 'react';
import Calendar from '@/components/Calendar';
import { format, isToday, isBefore, startOfDay, addDays } from 'date-fns';
import { CalendarDays, ClipboardList, Plus, GraduationCap, Pencil, Trash2, Clock, BookOpen, AlertTriangle, X } from 'lucide-react';
import WhatsAppNotifier from '@/components/WhatsAppNotifier';

interface Exam {
    id: string;
    title: string;
    date: string;
    course: { id: string; code: string; name: string };
}

interface Course {
    id: string;
    code: string;
    name: string;
    year?: number;
    semester?: number;
    teachers?: { id: string; name: string }[];
}

interface ClassSlot {
    id: string;
    title: string | null;
    startTime: string;
    endTime: string;
    status: string;
    teacher: { id: string; name: string };
    bookedById: string | null;
}

export default function ScheduleClientPage({
    initialSlots,
    sessionRole,
    userId,
    allTeachers = []
}: {
    initialSlots: any[];
    sessionRole: string;
    userId: string;
    allTeachers?: any[];
}) {
    const [slots, setSlots] = useState<ClassSlot[]>(initialSlots);
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
    
    // Edit Exam modal state
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [editExamTitle, setEditExamTitle] = useState('');
    const [editExamCourseId, setEditExamCourseId] = useState('');
    const [editExamDate, setEditExamDate] = useState('');
    const [editExamMsg, setEditExamMsg] = useState('');
    const [editExamLoading, setEditExamLoading] = useState(false);
    const [examTab, setExamTab] = useState<'upcoming' | 'past'>('upcoming');
    const [pastExamDateFilter, setPastExamDateFilter] = useState('');
    const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
    const [deleteExamLoading, setDeleteExamLoading] = useState(false);

    const formatToLocalDateString = (dateObj: Date | string) => {
        const d = new Date(dateObj);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // CR direct class scheduling state
    const [classCourseId, setClassCourseId] = useState('');
    const [classTeacherId, setClassTeacherId] = useState('');
    const [classDate, setClassDate] = useState('');
    const [classStartTime, setClassStartTime] = useState('');
    const [classEndTime, setClassEndTime] = useState('');
    const [classRoom, setClassRoom] = useState('');
    const [classMsg, setClassMsg] = useState('');
    const [classLoading, setClassLoading] = useState(false);

    // Edit class modal state
    const [editingSlot, setEditingSlot] = useState<ClassSlot | null>(null);
    const [editCourseId, setEditCourseId] = useState('');
    const [editTeacherId, setEditTeacherId] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editRoom, setEditRoom] = useState('');
    const [editMsg, setEditMsg] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Delete confirm state
    const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // CR class lists tab state
    const [classTab, setClassTab] = useState<'tomorrow' | 'past'>('tomorrow');
    const [pastDateFilter, setPastDateFilter] = useState('');

    // CR slot booking modal state (legacy click-to-book for AVAILABLE slots)
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [bookingCourseId, setBookingCourseId] = useState('');
    const [bookingRoom, setBookingRoom] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const isCR = sessionRole === 'CR';
    const isTeacher = sessionRole === 'TEACHER';

    // --- Date helpers ---
    const tomorrowStart = startOfDay(addDays(new Date(), 1));
    const tomorrowDateStr = format(tomorrowStart, 'yyyy-MM-dd');

    // Booked slots: CR sees what they booked, Teacher sees what they teach
    const bookedSlots = slots.filter(s => {
        if (s.status !== 'BOOKED') return false;
        // Hide internal attendance tally records
        if (s.title && s.title.startsWith('Attendance:')) return false;
        
        if (isCR) return s.bookedById === userId;
        if (isTeacher) return s.teacher.id === userId;
        return false;
    });
    
    const now = new Date();
    
    // A class is "tomorrow" (active) if the current time is before 5:00 PM on the day of the class.
    const getDeadline = (startTime: string) => {
        const d = new Date(startTime);
        d.setHours(17, 0, 0, 0); // 5:00 PM on the day of the class
        return d;
    };

    const pastClassesAll = bookedSlots.filter(s => now >= getDeadline(s.startTime));
    const tomorrowClasses = bookedSlots
        .filter(s => now < getDeadline(s.startTime))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
    const pastClasses = pastClassesAll
        .filter(s => !pastDateFilter || format(new Date(s.startTime), 'yyyy-MM-dd') === pastDateFilter)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Generate routine data for WhatsApp notifier from tomorrow's classes
    const tomorrowRoutineData = tomorrowClasses.map(c => {
        let code = 'N/A';
        let name = c.title || 'Class Session';
        if (name.includes(' - ')) {
            const parts = name.split(' - ');
            code = parts[0];
            name = parts.slice(1).join(' - ');
        }
        // Remove room from course name if it exists
        if (name.includes(' | Room: ')) {
            name = name.split(' | Room: ')[0];
        }

        const course = courses.find(cr => cr.code === code);
        const semesterStr = course && course.year && course.semester ? ` (${course.year}.${course.semester})` : '';

        return {
            id: c.id,
            courseName: name + semesterStr,
            courseCode: code,
            time: `${format(new Date(c.startTime), 'h:mm a')} - ${format(new Date(c.endTime), 'h:mm a')}`,
            teacherId: c.teacher.id,
        };
    });

    // Split exams into upcoming and past
    const visibleExams = exams.filter(ex => {
        if (isCR) return true;
        if (isTeacher) {
            const course = courses.find(c => c.id === ex.course.id);
            return course?.teachers?.some(t => t.id === userId);
        }
        return false;
    });

    const upcomingExams = visibleExams
        .filter(ex => new Date(ex.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pastExamsAll = visibleExams
        .filter(ex => new Date(ex.date) <= now);
    const pastExams = pastExamsAll
        .filter(ex => !pastExamDateFilter || format(new Date(ex.date), 'yyyy-MM-dd') === pastExamDateFilter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate routine data for WhatsApp notifier from upcoming exams
    const upcomingExamRoutineData = upcomingExams.flatMap(exam => {
        const course = courses.find(c => c.id === exam.course.id);
        if (!course || !course.teachers || course.teachers.length === 0) return [];
        
        const semesterStr = course.year && course.semester ? ` (${course.year}.${course.semester})` : '';

        return course.teachers.map(teacher => ({
            id: `${exam.id}-${teacher.id}`,
            courseName: `${exam.course.name}${semesterStr} (${exam.title})`,
            courseCode: exam.course.code,
            time: format(new Date(exam.date), 'h:mm a'),
            teacherId: teacher.id,
        }));
    });

    const refreshSlots = useCallback(async () => {
        const res = await fetch('/api/schedule');
        if (res.ok) {
            const data = await res.json();
            setSlots(data.slots);
        }
    }, []);

    // Auto-cleanup: delete booked slots that are beyond tomorrow (further future)
    const cleanupFutureBeyondTomorrow = useCallback(async (allSlots: ClassSlot[]) => {
        const dayAfterTomorrow = addDays(tomorrowStart, 1);
        const toDelete = allSlots.filter(
            s => s.status === 'BOOKED' &&
                s.bookedById === userId &&
                !isBefore(new Date(s.startTime), dayAfterTomorrow)
        );
        for (const slot of toDelete) {
            await fetch('/api/cr/class-schedule', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotId: slot.id }),
            });
        }
        if (toDelete.length > 0) await refreshSlots();
    }, [userId, tomorrowStart, refreshSlots]);

    // Derive available professors from the currently selected class course
    const availableProfessors = courses.find(c => c.id === classCourseId)?.teachers ?? [];
    const editAvailableProfessors = courses.find(c => c.id === editCourseId)?.teachers ?? [];

    const fetchExamData = async () => {
        const [examRes, courseRes] = await Promise.all([
            fetch('/api/cr/exam'),
            fetch(isCR ? '/api/courses?crSemester=true' : '/api/courses'),
        ]);
        if (examRes.ok) { const d = await examRes.json(); setExams(d.exams || []); }
        if (courseRes.ok) { const d = await courseRes.json(); setCourses(d.courses || []); }
    };

    useEffect(() => {
        if (isCR || isTeacher) {
            fetchExamData();
        }
        if (isCR) {
            // Run cleanup after initial load
            cleanupFutureBeyondTomorrow(initialSlots);
        }
        if (!isCR) {
            fetch('/api/courses').then(r => r.ok && r.json()).then(d => setCourses(d?.courses || []));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionRole]);

    // ── Legacy slot handlers (for non-CR calendar, AVAILABLE slots) ──
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

    // ── Exam handlers ──
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
                setExamTitle(''); setExamCourseId(''); setExamDate('');
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

    const handleEditExamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExam) return;
        setEditExamMsg('');
        setEditExamLoading(true);
        try {
            const res = await fetch('/api/cr/exam', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingExam.id, title: editExamTitle, courseId: editExamCourseId, date: editExamDate }),
            });
            const d = await res.json();
            if (res.ok) {
                setEditingExam(null);
                await fetchExamData();
            } else {
                setEditExamMsg(`✗ ${d.message || 'Failed to update exam.'}`);
            }
        } catch {
            setEditExamMsg('✗ Network error.');
        } finally {
            setEditExamLoading(false);
        }
    };

    const startEditExam = (ex: Exam) => {
        setEditingExam(ex);
        setEditExamTitle(ex.title);
        setEditExamCourseId(ex.course.id);
        setEditExamDate(formatToLocalDateString(ex.date));
        setEditExamMsg('');
    };

    // Cancel is no longer needed globally, we use modal


    const handleDeleteExam = async (examId: string) => {
        setDeleteExamLoading(true);
        try {
            const res = await fetch('/api/cr/exam', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: examId }),
            });
            if (res.ok) {
                setDeletingExamId(null);
                await fetchExamData();
            }
        } catch { /* silent */ }
        finally {
            setDeleteExamLoading(false);
        }
    };

    // ── Class schedule handlers ──
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
                setClassCourseId(''); setClassTeacherId(''); setClassDate('');
                setClassStartTime(''); setClassEndTime(''); setClassRoom('');
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

    const openEditSlot = (slot: ClassSlot) => {
        setEditingSlot(slot);
        // Parse title: "CODE - Name | Room: XYZ"
        const roomMatch = slot.title?.match(/Room:\s*(.+)$/);
        setEditRoom(roomMatch ? roomMatch[1].trim() : '');
        setEditDate(format(new Date(slot.startTime), 'yyyy-MM-dd'));
        setEditStartTime(format(new Date(slot.startTime), 'HH:mm'));
        setEditEndTime(format(new Date(slot.endTime), 'HH:mm'));
        setEditCourseId('');
        setEditTeacherId(slot.teacher.id);
        setEditMsg('');
    };

    const handleEditSlotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSlot) return;
        setEditMsg('');
        setEditLoading(true);
        try {
            const res = await fetch('/api/cr/class-schedule', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slotId: editingSlot.id,
                    courseId: editCourseId || null,
                    teacherId: editTeacherId,
                    date: editDate,
                    startTime: editStartTime,
                    endTime: editEndTime,
                    roomNumber: editRoom,
                }),
            });
            const d = await res.json();
            if (res.ok) {
                setEditMsg('✓ Class updated!');
                setTimeout(() => { setEditingSlot(null); setEditMsg(''); }, 800);
                await refreshSlots();
            } else {
                setEditMsg(`✗ ${d.message || 'Failed to update.'}`);
            }
        } catch {
            setEditMsg('✗ Network error.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        setDeleteLoading(true);
        try {
            const res = await fetch('/api/cr/class-schedule', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotId }),
            });
            if (res.ok) {
                setDeletingSlotId(null);
                await refreshSlots();
            }
        } catch { /* silent */ }
        finally {
            setDeleteLoading(false);
        }
    };

    const inputCls = "w-full h-11 px-4 rounded-xl text-sm text-slate-800 border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all";
    const btnCls = "px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50";

    // ── Reusable class card for the list ──
    const ClassCard = ({ slot, showActions }: { slot: ClassSlot; showActions: boolean }) => {
        const isPast = isBefore(new Date(slot.startTime), new Date());
        return (
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors group ${
                isPast
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-emerald-50 border-emerald-100 hover:border-emerald-300'
            }`}>
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-xs ${
                    isPast ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                }`}>
                    <span className="text-[10px] font-semibold">{format(new Date(slot.startTime), 'MMM')}</span>
                    <span className="text-lg leading-none">{format(new Date(slot.startTime), 'd')}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{slot.title || 'Class Session'}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(slot.startTime), 'h:mm a')} – {format(new Date(slot.endTime), 'h:mm a')}
                        <span className="mx-1 text-slate-300">·</span>
                        Prof. {slot.teacher.name}
                    </p>
                </div>
                {showActions && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => openEditSlot(slot)}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                            title="Edit"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setDeletingSlotId(slot.id)}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // ── Reusable exam card for the list ──
    const ExamCard = ({ exam, showActions }: { exam: Exam; showActions: boolean }) => {
        const isPast = new Date(exam.date) <= new Date();
        return (
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors group ${
                isPast
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-emerald-50 border-emerald-100 hover:border-emerald-300'
            }`}>
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-xs ${
                    isPast ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                }`}>
                    <span className="text-[10px] font-semibold">{format(new Date(exam.date), 'MMM')}</span>
                    <span className="text-lg leading-none">{format(new Date(exam.date), 'd')}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{exam.course.code} - {exam.course.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(exam.date), 'h:mm a')}
                        <span className="mx-1 text-slate-300">·</span>
                        {exam.title}
                    </p>
                </div>
                {showActions && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => startEditExam(exam)}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                            title="Edit"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setDeletingExamId(exam.id)}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 relative">

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">
                        {isCR ? 'Schedule Management' : isTeacher ? 'My Schedule' : 'Department Schedule'}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium text-[15px]">
                        {isTeacher && 'Manage and view your assigned class slots and exams.'}
                        {isCR && 'Manage class slots and schedule exams for your class.'}
                        {sessionRole === 'STUDENT' && "View your professor's availability and booked class slots."}
                        {sessionRole === 'ADMIN' && "View the entire department schedule."}
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            {(isCR || isTeacher) && (
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

            {/* ── CLASS SCHEDULE TAB ── */}
            {((!isCR && !isTeacher) || activeTab === 'classes') && (
                <div className={`grid grid-cols-1 ${isCR ? 'xl:grid-cols-2' : isTeacher ? 'max-w-4xl' : 'gap-6'} gap-6`}>

                    {/* LEFT: Assign New Class Form (CR ONLY) */}
                    {isCR && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-emerald-50/60">
                                <Plus className="w-4 h-4 text-emerald-600" />
                                <h2 className="font-bold text-slate-800 text-[15px]">Assign New Class</h2>
                                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    Tomorrow only
                                </span>
                            </div>
                            <div className="p-6">
                                <p className="text-xs text-slate-500 mb-5">
                                    Directly schedule a class for a specific course, teacher, and room.
                                </p>
                                <form onSubmit={handleClassSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Course</label>
                                        <select
                                            value={classCourseId}
                                            onChange={e => {
                                                setClassCourseId(e.target.value);
                                                setClassTeacherId('');
                                            }}
                                            required
                                            className={inputCls}
                                        >
                                            <option value="">Select a course...</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Professor</label>
                                        <select
                                            value={classTeacherId}
                                            onChange={e => setClassTeacherId(e.target.value)}
                                            required
                                            disabled={!classCourseId || availableProfessors.length === 0}
                                            className={`${inputCls} disabled:opacity-60 disabled:cursor-not-allowed`}
                                        >
                                            {!classCourseId
                                                ? <option value="">Select a course first...</option>
                                                : availableProfessors.length === 0
                                                    ? <option value="">No professors assigned to this course</option>
                                                    : <>
                                                        <option value="">Select a professor...</option>
                                                        {availableProfessors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </>
                                            }
                                        </select>
                                        {classCourseId && availableProfessors.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1 font-medium">⚠ No professor is assigned to this course yet.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Date <span className="text-slate-400 font-normal">(tomorrow)</span></label>
                                        <input
                                            className={inputCls}
                                            type="date"
                                            value={classDate}
                                            onChange={e => setClassDate(e.target.value)}
                                            required
                                            min={tomorrowDateStr}
                                            max={tomorrowDateStr}
                                        />
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

                    {/* RIGHT: Class lists — Tomorrow's Classes + Past Classes */}
                    {(isCR || isTeacher) ? (
                        <div className="space-y-5">
                            
                            {/* Class Lists Tab Switcher */}
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
                                <button
                                    onClick={() => setClassTab('tomorrow')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                        classTab === 'tomorrow'
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <CalendarDays className="w-4 h-4" />
                                    Tomorrow
                                    <span className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${classTab === 'tomorrow' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                        {tomorrowClasses.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setClassTab('past')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                        classTab === 'past'
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Past
                                    <span className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${classTab === 'past' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200 text-slate-500'}`}>
                                        {pastClasses.length}
                                    </span>
                                </button>
                            </div>

                            {/* Tomorrow's Classes */}
                            {classTab === 'tomorrow' && (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-emerald-50/40">
                                        <CalendarDays className="w-4 h-4 text-emerald-600" />
                                        <h2 className="font-bold text-slate-800 text-[15px]">Tomorrow's Classes</h2>
                                    </div>
                                    <div className="p-5">
                                        {tomorrowClasses.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                                <CalendarDays className="w-9 h-9 mb-2 text-slate-300" />
                                                <p className="text-sm font-medium">No classes assigned for tomorrow.</p>
                                                <p className="text-xs text-slate-300 mt-1">Use the form to schedule one.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {tomorrowClasses.map(slot => (
                                                    <ClassCard key={slot.id} slot={slot} showActions={isCR} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Past Classes */}
                            {classTab === 'past' && (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                                        <BookOpen className="w-4 h-4 text-slate-500" />
                                        <h2 className="font-bold text-slate-800 text-[15px]">Past Classes</h2>
                                        <div className="ml-auto flex items-center gap-2">
                                            <label className="text-xs font-semibold text-slate-500">Filter Date:</label>
                                            <input 
                                                type="date" 
                                                className="h-8 px-2 rounded-md text-xs text-slate-800 border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                                                value={pastDateFilter}
                                                onChange={e => setPastDateFilter(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        {pastClasses.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                                <BookOpen className="w-9 h-9 mb-2 text-slate-300" />
                                                <p className="text-sm font-medium">No past classes on record.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                                {pastClasses.map(slot => (
                                                    <ClassCard key={slot.id} slot={slot} showActions={false} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* WhatsApp Notifier for Tomorrow's Classes (CR Only) */}
                            {isCR && classTab === 'tomorrow' && (
                                <div className="mt-6">
                                    <WhatsAppNotifier teachers={allTeachers} assignedRoutines={tomorrowRoutineData} />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Non-CR: show calendar */
                        <div className="space-y-4">
                            <Calendar
                                slots={slots}
                                role={sessionRole as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR'}
                                userId={userId}
                                onSlotClick={handleSlotClick}
                                onBookSlot={handleBookSlot}
                                onCreateSlot={handleCreateSlot}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ── EDIT CLASS MODAL ── */}
            {editingSlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-emerald-50/60">
                            <Pencil className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-bold text-slate-800 text-[15px]">Edit Class</h3>
                            <button onClick={() => setEditingSlot(null)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-500 font-medium border border-slate-100">
                                Currently: <span className="text-slate-700 font-semibold">{editingSlot.title}</span>
                            </div>
                            <form onSubmit={handleEditSlotSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                                    <select value={editCourseId} onChange={e => { setEditCourseId(e.target.value); setEditTeacherId(''); }} className={inputCls}>
                                        <option value="">Keep current course</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                                    </select>
                                </div>
                                {editCourseId && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Professor</label>
                                        <select value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)} required className={inputCls}>
                                            <option value="">Select professor...</option>
                                            {editAvailableProfessors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date <span className="text-slate-400 font-normal">(tomorrow only)</span></label>
                                    <input className={inputCls} type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required min={tomorrowDateStr} max={tomorrowDateStr} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                                        <input className={inputCls} type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                                        <input className={inputCls} type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Room Number</label>
                                    <input className={inputCls} type="text" placeholder="e.g. 302" value={editRoom} onChange={e => setEditRoom(e.target.value)} required />
                                </div>

                                {editMsg && (
                                    <p className={`text-sm font-medium ${editMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {editMsg}
                                    </p>
                                )}

                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setEditingSlot(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editLoading} className={`flex-1 ${btnCls} justify-center flex items-center gap-2`}>
                                        <Pencil className="w-4 h-4" />
                                        {editLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DELETE CONFIRM MODAL ── */}
            {deletingSlotId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-[16px]">Delete Class?</h3>
                                <p className="text-sm text-slate-500 mt-1">This will permanently remove this class from tomorrow's schedule. This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletingSlotId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteSlot(deletingSlotId)}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legacy Click-to-Book Modal (AVAILABLE slots for CRs) */}
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
                            <select value={bookingCourseId} onChange={e => setBookingCourseId(e.target.value)} className={inputCls}>
                                <option value="">Select course...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Room Number</label>
                            <input type="text" placeholder="e.g. 302" value={bookingRoom} onChange={e => setBookingRoom(e.target.value)} className={inputCls} />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setSelectedSlot(null)} className="px-4 py-2 font-medium text-slate-500 hover:text-slate-700">Cancel</button>
                            <button onClick={handleConfirmBooking} disabled={!bookingCourseId || !bookingRoom || bookingLoading} className={`${btnCls} bg-emerald-600 hover:bg-emerald-700`}>
                                {bookingLoading ? 'Assigning...' : 'Assign Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EXAM SCHEDULE TAB ── */}
            {(isCR || isTeacher) && activeTab === 'exams' && (
                <div className={`grid grid-cols-1 ${isCR ? 'xl:grid-cols-2' : 'max-w-4xl'} gap-6`}>

                    {/* Exam scheduling form (CR ONLY) */}
                    {isCR && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-purple-50/60">
                                <GraduationCap className="w-4 h-4 text-purple-600" />
                                <h2 className="font-bold text-slate-800 text-[15px]">
                                    Schedule Exam
                                </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-slate-500 mb-5">
                                Set an exam for your class. The system will notify students on their dashboards.
                            </p>
                            <form onSubmit={handleExamSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course <span className="text-slate-400 font-normal">(Your semester only)</span></label>
                                    <select value={examCourseId} onChange={e => setExamCourseId(e.target.value)} required className={inputCls}>
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
                                        min={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
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
                )}

                    {/* RIGHT: Exam lists — Upcoming Exams + Past Exams */}
                    <div className="space-y-5">

                        {/* Exam Lists Tab Switcher */}
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
                            <button
                                onClick={() => setExamTab('upcoming')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    examTab === 'upcoming'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <GraduationCap className="w-4 h-4" />
                                Upcoming
                                <span className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${examTab === 'upcoming' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {upcomingExams.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setExamTab('past')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    examTab === 'past'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                Past
                                <span className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${examTab === 'past' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200 text-slate-500'}`}>
                                    {pastExams.length}
                                </span>
                            </button>
                        </div>

                        {/* Upcoming Exams */}
                        {examTab === 'upcoming' && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-purple-50/40">
                                    <GraduationCap className="w-4 h-4 text-purple-600" />
                                    <h2 className="font-bold text-slate-800 text-[15px]">Upcoming Exams</h2>
                                </div>
                                <div className="p-5">
                                    {upcomingExams.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                                            <ClipboardList className="w-10 h-10 mb-3 text-slate-300" />
                                            <p className="text-sm font-medium">No upcoming exams scheduled.</p>
                                            <p className="text-xs text-slate-300 mt-1">Use the form to schedule one.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {upcomingExams.map(ex => (
                                                <ExamCard key={ex.id} exam={ex} showActions={isCR} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* WhatsApp Notifier for Upcoming Exams (CR Only) */}
                        {isCR && examTab === 'upcoming' && (
                            <div className="mt-6">
                                <WhatsAppNotifier teachers={allTeachers} assignedRoutines={upcomingExamRoutineData} />
                            </div>
                        )}

                        {/* Past Exams */}
                        {examTab === 'past' && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                                    <BookOpen className="w-4 h-4 text-slate-500" />
                                    <h2 className="font-bold text-slate-800 text-[15px]">Past Exams</h2>
                                    <div className="ml-auto flex items-center gap-2">
                                        <label className="text-xs font-semibold text-slate-500">Filter Date:</label>
                                        <input 
                                            type="date" 
                                            className="h-8 px-2 rounded-md text-xs text-slate-800 border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                                            value={pastExamDateFilter}
                                            onChange={e => setPastExamDateFilter(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="p-5">
                                    {pastExams.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                                            <BookOpen className="w-10 h-10 mb-3 text-slate-300" />
                                            <p className="text-sm font-medium">No past exams on record.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                            {pastExams.map(ex => (
                                                <ExamCard key={ex.id} exam={ex} showActions={false} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* Edit Exam Modal */}
            {editingExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-0 max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/40">
                            <div className="flex items-center gap-3 text-emerald-700">
                                <Pencil className="w-5 h-5" />
                                <h2 className="font-bold text-lg">Edit Exam Schedule</h2>
                            </div>
                            <button onClick={() => setEditingExam(null)} className="p-2 rounded-xl hover:bg-emerald-100 text-slate-400 hover:text-emerald-700 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-500 font-medium border border-slate-100">
                                Currently: <span className="text-slate-700 font-semibold">{editingExam.title}</span>
                            </div>
                            <form onSubmit={handleEditExamSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                                    <select value={editExamCourseId} onChange={e => setEditExamCourseId(e.target.value)} required className={inputCls}>
                                        <option value="">Keep current course</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Title</label>
                                    <input
                                        className={inputCls}
                                        type="text"
                                        value={editExamTitle}
                                        onChange={e => setEditExamTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date &amp; Time</label>
                                    <input
                                        className={inputCls}
                                        type="datetime-local"
                                        value={editExamDate}
                                        onChange={e => setEditExamDate(e.target.value)}
                                        required
                                    />
                                </div>

                                {editExamMsg && (
                                    <p className={`text-sm font-medium ${editExamMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {editExamMsg}
                                    </p>
                                )}

                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setEditingExam(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editExamLoading} className={`flex-1 ${btnCls} justify-center flex items-center gap-2`}>
                                        <Pencil className="w-4 h-4" />
                                        {editExamLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Exam Confirmation Modal */}
            {deletingExamId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h2 className="font-bold text-lg text-slate-800">Delete Exam?</h2>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">
                            Are you sure you want to delete this exam? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingExamId(null)}
                                disabled={deleteExamLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteExam(deletingExamId)}
                                disabled={deleteExamLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deleteExamLoading ? 'Deleting...' : 'Delete Exam'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
