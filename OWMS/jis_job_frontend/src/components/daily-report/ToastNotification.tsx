'use client';

import { Check, Plus } from 'lucide-react';

interface ToastNotificationProps {
    show: boolean;
    message: string;
}

export default function ToastNotification({ show, message }: ToastNotificationProps) {
    const isError = message.includes('실패') || message.includes('초과');

    return (
        <div className={`fixed top-20 sm:top-24 right-3 sm:right-10 left-3 sm:left-auto z-[200] transition-all duration-500 transform ${show ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-stone-200 dark:border-slate-600 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 flex items-center space-x-3 sm:space-x-4 sm:min-w-[280px]">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 ${isError ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500'}`}>
                    {isError ? (
                        <Plus size={20} className="rotate-45" />
                    ) : (
                        <Check size={20} />
                    )}
                </div>
                <div>
                    <p className="text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm">{message}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-medium mt-0.5 hidden sm:block">시스템 알림 메시지입니다.</p>
                </div>
            </div>
        </div>
    );
}
