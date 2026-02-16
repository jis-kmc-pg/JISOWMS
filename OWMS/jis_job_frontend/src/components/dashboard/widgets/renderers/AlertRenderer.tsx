'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

interface AlertConfig {
    checkKey: string;
    okMessage: string;
    warnMessage: string;
    icon: string;
}

interface AlertRendererProps {
    title: string;
    config: AlertConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
}

export default function AlertRenderer({ title, config, data }: AlertRendererProps) {
    const isOk = Boolean(data?.[config.checkKey]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = LucideIcons as any;
    const Icon = (icons[config.icon] || LucideIcons.AlertCircle) as React.ComponentType<{ size?: number; className?: string }>;
    const message = isOk ? config.okMessage : config.warnMessage;

    return (
        <div className={`relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
            isOk
                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50'
                : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/50'
        }`}>
            {/* 배경 데코 서클 */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${
                isOk ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />
            <div className={`absolute -right-2 -bottom-8 w-16 h-16 rounded-full opacity-5 ${
                isOk ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />

            <div className="relative p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                        <h3 className={`text-lg font-black mt-2 ${isOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {message}
                        </h3>
                        {/* 상태 인디케이터 */}
                        <div className="flex items-center gap-2 mt-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isOk
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}>
                                {isOk ? (
                                    <>
                                        <CheckCircle2 size={12} />
                                        정상
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        확인 필요
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className={`p-3.5 rounded-2xl ${
                        isOk
                            ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600'
                            : 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600'
                    }`}>
                        <div className={!isOk ? 'animate-pulse' : ''}>
                            <Icon size={26} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
