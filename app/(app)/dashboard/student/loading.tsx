// Shown immediately when the sidebar Dashboard link is clicked.
// Matches the exact layout of the real dashboard so the transition feels seamless.

export default function StudentDashboardLoading() {
    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-pulse">

            {/* ── Header row ── */}
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 w-52 bg-slate-200 rounded-lg" />
                <div className="h-9 w-36 bg-slate-200 rounded-lg" />
            </div>

            {/* ── SemesterSelector placeholder ── */}
            <div className="h-14 w-full bg-slate-100 rounded-xl border border-slate-200" />

            {/* ── Metrics grid — 5 columns ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
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

                {/* 5th cell — counseling link placeholder */}
                <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-5" style={{ minHeight: '100px' }}>
                    <div className="h-8 w-8 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                </div>
            </div>

            {/* ── Bottom 3-column section ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

                {/* Classes & Exams widget skeleton */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col lg:col-span-1">
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

                {/* Courses widget skeleton — spans 2 cols */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col lg:col-span-2">
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
            </div>
        </div>
    );
}
