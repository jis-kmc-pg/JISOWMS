'use client';

import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
    show: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const variantConfig = {
    danger: {
        icon: Trash2,
        iconBg: 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400',
        confirmBtn: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 hover:shadow-rose-500/30',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400',
        confirmBtn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 hover:shadow-amber-500/30',
    },
    info: {
        icon: Info,
        iconBg: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400',
        confirmBtn: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20 hover:shadow-indigo-500/30',
    },
};

export default function ConfirmDialog({
    show,
    title,
    description,
    confirmLabel = '확인',
    cancelLabel = '취소',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!show) return;

        // 열릴 때 확인 버튼에 포커스
        confirmRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, onCancel]);

    if (!show) return null;

    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={onCancel}
        >
            <div
                className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 text-center overscroll-contain"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon size={24} aria-hidden="true" />
                </div>
                <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                        {description}
                    </p>
                )}
                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        onClick={onConfirm}
                        className={`flex-1 ${config.confirmBtn} py-3 rounded-xl font-bold text-white transition-colors shadow-lg text-sm`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
