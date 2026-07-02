'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface Course {
    id: string;
    code: string;
    name: string;
}

interface Attendance {
    id: string;
    status: string;
    session: {
        date: string;
        course: Course;
    };
}

interface Props {
    courses: Course[];
    attendances: Attendance[];
}

export default function StudentAttendanceDashboard({ courses, attendances }: Props) {
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

    const filteredAttendances = selectedCourseId === 'all'
        ? attendances
        : attendances.filter(a => a.session.course.id === selectedCourseId);

    const totalClasses = filteredAttendances.length;
    const presentCount = filteredAttendances.filter(a => a.status === 'PRESENT').length;
    const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-3xl font-bold text-zinc-900">My Attendance</h1>
                    
                    {courses.length > 0 && (
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        >
                            <option value="all">All Courses</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.code} - {course.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex-1 text-center">
                        <p className="text-emerald-800 text-sm font-medium">Attendance Rate</p>
                        <p className="text-4xl font-bold text-emerald-600 mt-2">{percentage}%</p>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl flex-1 text-center">
                        <p className="text-zinc-600 text-sm font-medium">Classes Attended</p>
                        <p className="text-4xl font-bold text-zinc-900 mt-2">{presentCount} / {totalClasses}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-200">
                        {filteredAttendances.map((rec) => (
                            <tr key={rec.id} className="hover:bg-zinc-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                                    {format(new Date(rec.session.date), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                    {rec.session.course.name} ({rec.session.course.code})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                        rec.status === 'PRESENT'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                    }`}>
                                        {rec.status.toLowerCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredAttendances.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center">
                                    <p className="text-sm font-medium text-zinc-500">No attendance records found</p>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {selectedCourseId === 'all' 
                                            ? "You don't have any attendance records yet."
                                            : "You don't have any attendance records for this specific course."}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
