'use client';

import { useState } from 'react';

interface Course {
    id: string;
    code: string;
    name: string;
}

interface Props {
    courses: Course[];
}

export default function CRAttendanceDownload({ courses }: Props) {
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 mt-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Download Attendance Sheet</h2>

            {courses.length > 0 ? (
                <div className="flex flex-col gap-4 items-start">
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full sm:w-auto flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    >
                        <option value="" disabled>Select a course...</option>
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.code} - {course.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex justify-center w-full">
                        <a
                            href={selectedCourseId ? `/api/cr/attendance-export?courseId=${selectedCourseId}` : '#'}
                            className={`block w-full px-6 py-3 font-medium rounded-lg shadow-sm transition-colors text-center ${
                                selectedCourseId
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                            }`}
                            onClick={(e) => {
                                if (!selectedCourseId) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            Download Full Class Summary (Excel)
                        </a>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
                    No courses are currently assigned to your semester.
                </div>
            )}
        </div>
    );
}
