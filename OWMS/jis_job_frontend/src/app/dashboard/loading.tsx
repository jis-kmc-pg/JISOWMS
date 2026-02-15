export default function DashboardLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200">
                        <div className="h-4 bg-slate-200 rounded w-20 animate-pulse mb-3" />
                        <div className="h-8 bg-slate-200 rounded w-16 animate-pulse" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-stone-200 h-64 animate-pulse" />
                <div className="bg-white p-6 rounded-2xl border border-stone-200 h-64 animate-pulse" />
            </div>
        </div>
    );
}
