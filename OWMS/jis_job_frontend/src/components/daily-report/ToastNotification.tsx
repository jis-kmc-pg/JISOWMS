'use client';

import { Check, Plus } from 'lucide-react';

interface ToastNotificationProps {
    show: boolean;
    message: string;
}

export default function ToastNotification({ show, message }: ToastNotificationProps) {
    const isError = message.includes('실패') || message.includes('초과');

    return (
        <div className={`fixed top-24 right-10 z-[200] transition-all duration-500 transform ${show ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
            <div className="bg-white/90 backdrop-blur-xl border border-stone-200 px-6 py-4 rounded-2xl shadow-2xl shadow-slate-200/50 flex items-center space-x-4 min-w-[280px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isError ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {isError ? (
                        <Plus size={20} className="rotate-45" />
                    ) : (
                        <Check size={20} />
                    )}
                </div>
                <div>
                    <p className="text-slate-800 font-bold text-sm">{message}</p>
                    <p className="text-slate-500 text-[11px] font-medium mt-0.5">시스템 알림 메시지입니다.</p>
                </div>
            </div>
        </div>
    );
}
