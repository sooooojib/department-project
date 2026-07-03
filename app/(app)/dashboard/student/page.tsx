import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import SemesterSelector from '@/components/SemesterSelector';

import MetricsCards from './_components/MetricsCards';
import ClassesSection from './_components/ClassesSection';
import CoursesSection from './_components/CoursesSection';

// ── Skeleton fallbacks (inline, no extra files needed) ──────────────────────

function MetricsSkeleton() {
    return (
        <>
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between animate-pulse"
                    style={{ minHeight: '100px' }}
                >
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="h-4 w-4 bg-slate-200 rounded" />
                        <div className="h-3 w-28 bg-slate-200 rounded" />
                    </div>
                    <div className="flex items-end space-x-3">
                        <div className="h-8 w-16 bg-slate-200 rounded" />
                        <div className="h-4 w-10 bg-slate-100 rounded" />
                    </div>
                </div>
            ))}
            {/* Counseling link placeholder */}
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-5 animate-pulse" style={{ minHeight: '100px' }}>
                <div className="h-8 w-8 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-200 rounded" />
            </div>
        </>
    );
}

function ClassesSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col animate-pulse">
            <div className="flex gap-2 mb-5">
                <div className="h-8 w-24 bg-slate-200 rounded-full" />
                <div className="h-8 w-24 bg-slate-100 rounded-full" />
            </div>
            <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-slate-200 rounded" />
                        <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CoursesSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col lg:col-span-2 animate-pulse">
            <div className="h-5 w-48 bg-slate-200 rounded mb-6" />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col pb-4 mb-4 border-b border-slate-100 last:border-0 last:mb-0">
                    <div className="flex justify-between items-center mb-1">
                        <div className="h-4 w-20 bg-slate-200 rounded" />
                        <div className="h-4 w-12 bg-slate-100 rounded" />
                    </div>
                    <div className="h-3 w-3/4 bg-slate-100 rounded mb-3" />
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-slate-200 rounded-full" style={{ width: `${60 + i * 10}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Page shell — only blocks on session + user row ──────────────────────────

export default async function StudentDashboard() {
    // Only the minimum blocking work: auth + user profile for the header/SemesterSelector
    const payload = await getServerSession(authOptions);
    const userId = payload?.user?.id;

    if (!userId) {
        return (
            <div className="p-8 text-center text-red-500 font-semibold">
                Session expired. Please log in again.
            </div>
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            year: true,
            semester: true,
            requestedYear: true,
            requestedSemester: true,
            semesterStatus: true,
        },
    });

    if (!user) {
        return (
            <div className="p-8 text-center text-red-500 font-semibold">
                User profile not found.
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
            {/* ── Header — renders instantly ── */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[26px] font-extrabold text-[#111827] tracking-tight">Student Dashboard</h1>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 font-semibold shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                        {user.year && user.semester
                            ? `Year ${user.year} Sem ${user.semester}`
                            : 'Unassigned'}
                    </span>
                </div>
            </div>

            {/* ── SemesterSelector — renders instantly (client component, no DB) ── */}
            <SemesterSelector
                currentYear={user.year}
                currentSemester={user.semester}
                requestedYear={user.requestedYear}
                requestedSemester={user.requestedSemester}
                semesterStatus={user.semesterStatus}
            />

            {/* ── Metrics grid — streams in independently ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Suspense fallback={<MetricsSkeleton />}>
                    <MetricsCards
                        userId={userId}
                        year={user.year}
                        semester={user.semester}
                    />
                </Suspense>
            </div>

            {/* ── Bottom section — two independent streams ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                <Suspense fallback={<ClassesSkeleton />}>
                    <ClassesSection year={user.year} semester={user.semester} />
                </Suspense>

                <Suspense fallback={<CoursesSkeleton />}>
                    <CoursesSection
                        userId={userId}
                        year={user.year}
                        semester={user.semester}
                    />
                </Suspense>
            </div>
        </div>
    );
}
