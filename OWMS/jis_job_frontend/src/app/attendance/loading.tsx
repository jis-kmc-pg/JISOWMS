export default function AttendanceLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-14 bg-slate-200 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
