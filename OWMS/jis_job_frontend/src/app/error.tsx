'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-md w-full text-center">
                <div className="bg-rose-50 p-3 rounded-xl inline-block mb-4">
                    <AlertCircle className="text-rose-600" size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                    오류가 발생했습니다
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                    페이지를 불러오는 중 문제가 발생했습니다.
                    <br />
                    다시 시도해 주세요.
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
