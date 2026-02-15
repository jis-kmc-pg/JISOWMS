export default function BoardLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-5 bg-slate-200 rounded w-12 animate-pulse" />
                            <div className="h-5 bg-slate-200 rounded flex-1 animate-pulse" />
                            <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
