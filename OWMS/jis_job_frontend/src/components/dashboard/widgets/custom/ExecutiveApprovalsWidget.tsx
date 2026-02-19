'use client';

import React from 'react';
import { Shield, Clock, User, ChevronRight } from 'lucide-react';

interface PendingItem {
    id?: number;
    userName?: string;
    name?: string;
    type?: string;
    vacationType?: string;
    startDate?: string;
    createdAt?: string;
}

interface ExecutiveApprovalsWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getUrgencyStyle(count: number) {
    if (count === 0) {
        return {
            badge: 'bg-emerald-500',
            glow: 'shadow-emerald-500/30',
            text: 'text-emerald-600',
            label: '처리 완료',
            headerAccent: 'from-emerald-500 to-emerald-600',
        };
    }
    if (count <= 5) {
        return {
            badge: 'bg-amber-500',
            glow: 'shadow-amber-500/30',
            text: 'text-amber-600',
            label: '확인 필요',
            headerAccent: 'from-amber-500 to-orange-500',
        };
    }
    return {
        badge: 'bg-rose-500',
        glow: 'shadow-rose-500/30',
        text: 'text-rose-600',
        label: '긴급 처리',
        headerAccent: 'from-rose-500 to-rose-600',
    };
}

export default function ExecutiveApprovalsWidget({ data, size }: ExecutiveApprovalsWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const items: PendingItem[] = Array.isArray(data) ? data : (data?.items ?? data?.requests ?? data?.data ?? []);
    const pendingCount = data?.pendingCount ?? data?.count ?? items.length;
    const displayCount = isSmall ? 0 : isLarge ? 7 : 5;
    const topItems = items.slice(0, displayCount);
    const urgency = getUrgencyStyle(pendingCount);

    // Small: 대기 건수 대형 배지
    if (isSmall) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-sm">
                            <Shield size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">결재 대기</p>
                            <p className={`text-xs font-bold ${urgency.text}`}>{urgency.label}</p>
                        </div>
                    </div>
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-xl ${urgency.badge} shadow-lg ${urgency.glow} ${
                            pendingCount > 0 ? 'animate-pulse' : ''
                        }`}
                    >
                        <span className="text-lg font-black text-white tabular-nums">{pendingCount}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                        <Shield size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">중요 결재 대기</h4>
                </div>
                <div
                    className={`flex items-center justify-center w-9 h-9 rounded-xl ${urgency.badge} shadow-md ${urgency.glow} ${
                        pendingCount > 0 ? 'animate-pulse' : ''
                    }`}
                >
                    <span className="text-base font-black text-white tabular-nums">{pendingCount}</span>
                </div>
            </div>

            {/* 대기 항목 리스트 */}
            <div className="flex-1 min-h-0 overflow-auto">
                {topItems.length > 0 ? (
                    <div className="space-y-1.5">
                        {topItems.map((item, idx) => (
                            <div
                                key={item?.id ?? idx}
                                className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-slate-700/50 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group/item"
                            >
                                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                    <User size={12} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                        {item?.userName ?? item?.name ?? '이름 없음'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                                        {item?.type ?? item?.vacationType ?? '결재'}
                                        {item?.startDate ? ` \u00B7 ${formatDate(item.startDate)}` : ''}
                                        {item?.createdAt && !item?.startDate ? ` \u00B7 ${formatDate(item.createdAt)}` : ''}
                                    </p>
                                </div>
                                {isLarge && (
                                    <div className="text-right flex-shrink-0 mr-0.5">
                                        {item?.createdAt && (
                                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                                                신청: {formatDate(item.createdAt)}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <ChevronRight
                                    size={12}
                                    className="text-slate-300 dark:text-slate-500 group-hover/item:text-slate-500 dark:group-hover/item:text-slate-400 transition-colors flex-shrink-0"
                                />
                            </div>
                        ))}

                        {pendingCount > topItems.length && (
                            <p className="text-center text-[10px] text-indigo-500 font-bold mt-1">
                                +{pendingCount - topItems.length}건 더보기
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-4">
                        <Clock size={24} className="text-slate-200 dark:text-slate-600 mb-1.5" />
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">대기 중인 결재가 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
}
