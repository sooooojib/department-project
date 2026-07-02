import React, { useMemo } from 'react';
import { MessageCircle, Clock, BookOpen, AlertCircle } from 'lucide-react';

export interface Teacher {
    id: string;
    name: string;
    phone: string | null;
}

export interface AssignedRoutine {
    id: string;
    courseName: string;
    courseCode: string;
    time: string;
    teacherId: string;
}

interface WhatsAppNotifierProps {
    teachers: Teacher[];
    assignedRoutines: AssignedRoutine[];
}

export default function WhatsAppNotifier({ teachers, assignedRoutines }: WhatsAppNotifierProps) {
    // 1. Group assigned routines by teacherId
    const groupedRoutines = useMemo(() => {
        return assignedRoutines.reduce((acc, routine) => {
            if (!acc[routine.teacherId]) {
                acc[routine.teacherId] = [];
            }
            acc[routine.teacherId].push(routine);
            return acc;
        }, {} as Record<string, AssignedRoutine[]>);
    }, [assignedRoutines]);

    // 2. Filter teachers who have NO assigned routines
    const assignedTeachers = useMemo(() => {
        return teachers.filter(teacher => groupedRoutines[teacher.id]?.length > 0);
    }, [teachers, groupedRoutines]);

    // 3. Helper to format and encode the WhatsApp message
    const getWhatsAppLink = (teacher: Teacher, routines: AssignedRoutine[]) => {
        if (!teacher.phone) return '#';

        // Clean phone number (remove all non-numeric characters except +)
        let cleanPhone = teacher.phone.replace(/[^\d+]/g, '');

        // Format Bangladeshi local numbers
        if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
            cleanPhone = '88' + cleanPhone;
        }

        // Format message
        let msg = `Hello Prof. ${teacher.name},\n\nHere is your assigned class routine:\n\n`;
        
        routines.forEach((r, idx) => {
            msg += `${idx + 1}. ${r.courseCode} - ${r.courseName}\n   Time: ${r.time}\n\n`;
        });
        
        msg += `Please let us know if you need any adjustments.\n\nBest regards,\nYour Class Representative`;

        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    };

    if (assignedTeachers.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-zinc-100 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-4 text-emerald-600">
                    <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-zinc-900 font-medium mb-1">No Notifications Needed</h3>
                <p className="text-zinc-500 text-sm">There are no teachers assigned to any routines yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mt-8">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-zinc-900">Notify Teachers</h2>
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                    Send automated WhatsApp schedules to assigned teachers.
                </p>
            </div>

            <div className="divide-y divide-zinc-100">
                {assignedTeachers.map(teacher => {
                    const routines = groupedRoutines[teacher.id];
                    const waLink = getWhatsAppLink(teacher, routines);
                    const canSend = Boolean(teacher.phone && teacher.phone.trim() !== '');

                    return (
                        <div key={teacher.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors">
                            <div>
                                <h3 className="font-medium text-zinc-900">{teacher.name}</h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-500">
                                    <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md">
                                        <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                                        {routines.length} class{routines.length !== 1 ? 'es' : ''}
                                    </span>
                                    {!canSend && (
                                        <span className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded-md font-medium">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Missing Phone Number
                                        </span>
                                    )}
                                </div>
                            </div>

                            <a
                                href={canSend ? waLink : undefined}
                                target={canSend ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className={`
                                    inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                                    ${canSend 
                                        ? 'bg-[#25D366]/10 text-[#075E54] hover:bg-[#25D366] hover:text-white shadow-sm' 
                                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                    }
                                `}
                                onClick={(e) => {
                                    if (!canSend) e.preventDefault();
                                }}
                            >
                                <svg 
                                    viewBox="0 0 24 24" 
                                    className="w-4 h-4 fill-current" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                </svg>
                                {canSend ? 'Send WhatsApp' : 'Cannot Send'}
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
