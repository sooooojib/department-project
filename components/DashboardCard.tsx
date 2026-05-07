export default function DashboardCard({
    title,
    value,
    icon,
    trend,
    trendPositive = true,
}: {
    title: string;
    value: string | number;
    icon: string;
    trend?: string;
    trendPositive?: boolean;
}) {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 mb-4">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} />
                </svg>
                <h3 className="text-[13px] font-bold text-slate-500 tracking-wide uppercase">{title}</h3>
            </div>

            <div className="flex items-end space-x-3">
                <div className="text-3xl font-bold text-slate-800 leading-none">{value}</div>

                {trend && (
                    <div className={`flex items-center text-sm font-semibold pb-0.5 ${trendPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trendPositive ? (
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        )}
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
}
