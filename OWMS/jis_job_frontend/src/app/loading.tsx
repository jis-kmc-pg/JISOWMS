export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 mb-4" />
            <p className="text-sm font-medium text-slate-500">로딩 중...</p>
        </div>
    );
}
