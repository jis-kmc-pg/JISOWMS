import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-md w-full text-center">
                <p className="text-6xl font-black text-indigo-600 mb-2">404</p>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                    페이지를 찾을 수 없습니다
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                    요청하신 페이지가 존재하지 않거나 이동되었습니다.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Home size={16} />
                    홈으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
