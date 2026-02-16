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
        bgClass: 'bg-indigo-50 group-hover/link:bg-indigo-100',
        iconClass: 'text-indigo-500 group-hover/link:text-indigo-600',
        ringClass: 'ring-indigo-200',
    },
    {
        label: '배차 신청',
        href: '/dispatch',
        icon: Car,
        color: 'amber',
        bgClass: 'bg-amber-50 group-hover/link:bg-amber-100',
        iconClass: 'text-amber-500 group-hover/link:text-amber-600',
        ringClass: 'ring-amber-200',
    },
    {
        label: '회의실 예약',
        href: '/reservation',
        icon: DoorOpen,
        color: 'purple',
        bgClass: 'bg-purple-50 group-hover/link:bg-purple-100',
        iconClass: 'text-purple-500 group-hover/link:text-purple-600',
        ringClass: 'ring-purple-200',
    },
    {
        label: '연차 신청',
        href: '/vacation-mgmt',
        icon: Calendar,
        color: 'emerald',
        bgClass: 'bg-emerald-50 group-hover/link:bg-emerald-100',
        iconClass: 'text-emerald-500 group-hover/link:text-emerald-600',
        ringClass: 'ring-emerald-200',
    },
    {
        label: '게시판',
        href: '/board/notice',
        icon: MessageSquare,
        color: 'rose',
        bgClass: 'bg-rose-50 group-hover/link:bg-rose-100',
        iconClass: 'text-rose-500 group-hover/link:text-rose-600',
        ringClass: 'ring-rose-200',
    },
    {
        label: '주간현황',
        href: '/weekly-status',
        icon: BarChart3,
        color: 'cyan',
        bgClass: 'bg-cyan-50 group-hover/link:bg-cyan-100',
        iconClass: 'text-cyan-500 group-hover/link:text-cyan-600',
        ringClass: 'ring-cyan-200',
    },
] as const;

export default function QuickLinksWidget({ data: _data, size }: QuickLinksWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const gridCols = isSmall ? 'grid-cols-2' : isLarge ? 'grid-cols-6' : 'grid-cols-3';

    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-slate-100">
                        <Zap size={14} className="text-slate-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">자주 쓰는 메뉴</h4>
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
                                p-2 rounded-xl border border-stone-100
                                hover:border-stone-200 hover:shadow-md
                                transition-all duration-200
                                hover:scale-[1.03] active:scale-[0.98]
                                bg-gradient-to-br from-white to-stone-50/50
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
                            <span className="text-[10px] font-bold text-slate-600 group-hover/link:text-slate-800 transition-colors text-center leading-tight">
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
