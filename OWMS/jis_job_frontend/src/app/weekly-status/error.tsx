'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function WeeklyStatusError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="p-6">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
                <div className="bg-rose-50 p-3 rounded-xl inline-block mb-4">
                    <AlertCircle className="text-rose-600" size={28} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">
                    주간 업무 현황을 불러올 수 없습니다
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                    데이터를 가져오는 중 문제가 발생했습니다.
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <RefreshCw size={16} />
                    다시 시도
                </button>
            </div>
        </div>
    );
}
