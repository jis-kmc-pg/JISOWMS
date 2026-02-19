'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Car, DoorOpen, Calendar, MessageSquare, BarChart3, Zap } from 'lucide-react';

interface QuickLinksWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

const QUICK_LINKS = [
    {
        label: '업무보고 작성',
        href: '/daily-report',
        icon: FileText,
        color: 'indigo',
        bgClass: 'bg-indigo-50 dark:bg-indigo-900/30 group-hover/link:bg-indigo-100 dark:group-hover/link:bg-indigo-900/50',
        iconClass: 'text-indigo-500 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400',
        ringClass: 'ring-indigo-200 dark:ring-indigo-800',
    },
    {
        label: '배차 신청',
        href: '/dispatch',
        icon: Car,
        color: 'amber',
        bgClass: 'bg-amber-50 dark:bg-amber-900/30 group-hover/link:bg-amber-100 dark:group-hover/link:bg-amber-900/50',
        iconClass: 'text-amber-500 group-hover/link:text-amber-600 dark:group-hover/link:text-amber-400',
        ringClass: 'ring-amber-200 dark:ring-amber-800',
    },
    {
        label: '회의실 예약',
        href: '/reservation',
        icon: DoorOpen,
        color: 'purple',
        bgClass: 'bg-purple-50 dark:bg-purple-900/30 group-hover/link:bg-purple-100 dark:group-hover/link:bg-purple-900/50',
        iconClass: 'text-purple-500 group-hover/link:text-purple-600 dark:group-hover/link:text-purple-400',
        ringClass: 'ring-purple-200 dark:ring-purple-800',
    },
    {
        label: '연차 신청',
        href: '/vacation-mgmt',
        icon: Calendar,
        color: 'emerald',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/30 group-hover/link:bg-emerald-100 dark:group-hover/link:bg-emerald-900/50',
        iconClass: 'text-emerald-500 group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400',
        ringClass: 'ring-emerald-200 dark:ring-emerald-800',
    },
    {
        label: '게시판',
        href: '/board/notice',
        icon: MessageSquare,
        color: 'rose',
        bgClass: 'bg-rose-50 dark:bg-rose-900/30 group-hover/link:bg-rose-100 dark:group-hover/link:bg-rose-900/50',
        iconClass: 'text-rose-500 group-hover/link:text-rose-600 dark:group-hover/link:text-rose-400',
        ringClass: 'ring-rose-200 dark:ring-rose-800',
    },
    {
        label: '주간현황',
        href: '/weekly-status',
        icon: BarChart3,
        color: 'cyan',
        bgClass: 'bg-cyan-50 dark:bg-cyan-900/30 group-hover/link:bg-cyan-100 dark:group-hover/link:bg-cyan-900/50',
        iconClass: 'text-cyan-500 group-hover/link:text-cyan-600 dark:group-hover/link:text-cyan-400',
        ringClass: 'ring-cyan-200 dark:ring-cyan-800',
    },
] as const;

export default function QuickLinksWidget({ data: _data, size }: QuickLinksWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const gridCols = isSmall ? 'grid-cols-2' : isLarge ? 'grid-cols-6' : 'grid-cols-3';

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700">
                        <Zap size={14} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">자주 쓰는 메뉴</h4>
                </div>
            </div>

            {/* 링크 그리드 */}
            <div className={`flex-1 min-h-0 grid ${gridCols} ${isSmall ? 'gap-1.5' : isLarge ? 'gap-2' : 'gap-2'}`}>
                {QUICK_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`
                                group/link flex flex-col items-center justify-center
                                p-2 rounded-xl border border-stone-100 dark:border-slate-700
                                hover:border-stone-200 dark:hover:border-slate-600 hover:shadow-md
                                transition-all duration-200
                                hover:scale-[1.03] active:scale-[0.98]
                                bg-gradient-to-br from-white dark:from-slate-800 to-stone-50/50 dark:to-slate-700/30
                            `}
                        >
                            {/* 아이콘 원형 */}
                            <div className={`
                                p-2 rounded-xl mb-1.5 transition-all duration-200
                                ${link.bgClass}
                                group-hover/link:shadow-sm
                            `}>
                                <Icon
                                    size={isSmall ? 16 : isLarge ? 22 : 18}
                                    className={`transition-all duration-200 ${link.iconClass} group-hover/link:scale-110`}
                                />
                            </div>

                            {/* 라벨 */}
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 group-hover/link:text-slate-800 dark:group-hover/link:text-slate-100 transition-colors text-center leading-tight">
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
