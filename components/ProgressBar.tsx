export default function ProgressBar({
    label,
    value,
    max = 100,
    colorClass = 'bg-emerald-500'
}: {
    label: string;
    value: number;
    max?: number;
    colorClass?: string;
}) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="mb-4">
            <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-zinc-700">{label}</span>
                <span className="text-sm font-semibold text-zinc-900">{Math.round(percentage)}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}
