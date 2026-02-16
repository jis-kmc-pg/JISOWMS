'use client';

import React from 'react';
import { ClipboardCheck } from 'lucide-react';

interface ApprovalItem {
    id?: string | number;
    title?: string;
    requestor?: string;
    requestorName?: string;
    type?: string;
    date?: string;
    createdAt?: string;
    status?: string;
}

interface PendingApprovalsWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

export default function PendingApprovalsWidget({ data, size }: PendingApprovalsWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const count = Number(data?.count ?? data?.pendingCount ?? (typeof data === 'number' ? data : 0));
    const items: ApprovalItem[] = data?.items ?? data?.list ?? data?.data ?? [];

    // 긴급도별 색상
    const getUrgencyStyle = (n: number) => {
        if (n === 0) {
            return {
                gradient: 'from-emerald-500 to-emerald-600',
                iconBg: 'bg-emerald-400/30',
                countColor: 'text-white',
                ringColor: 'ring-emerald-300',
                subtitleColor: 'text-emerald-100',
                badgeColor: 'bg-emerald-400/20 text-emerald-100',
                badgeLabel: '처리 완료',
            };
        }
        if (n <= 3) {
            return {
                gradient: 'from-amber-500 to-orange-500',
                iconBg: 'bg-amber-400/30',
                countColor: 'text-white',
                ringColor: 'ring-amber-300',
                subtitleColor: 'text-amber-100',
                badgeColor: 'bg-amber-400/20 text-amber-100',
                badgeLabel: '승인 필요',
            };
        }
        return {
            gradient: 'from-rose-500 to-rose-600',
            iconBg: 'bg-rose-400/30',
            countColor: 'text-white',
            ringColor: 'ring-rose-300',
            subtitleColor: 'text-rose-100',
            badgeColor: 'bg-rose-400/20 text-rose-100',
            badgeLabel: '긴급 처리 필요',
        };
    };

    const style = getUrgencyStyle(count);

    // ── Small: 큰 숫자 + "건" 뱃지만 ──
    if (isSmall) {
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide truncate">
                        승인 대기
                    </p>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
                        <ClipboardCheck size={14} />
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div className={`w-full rounded-xl bg-gradient-to-br ${style.gradient} py-3 flex items-center justify-center gap-1.5 relative overflow-hidden`}>
                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
                        <span className={`text-3xl font-black tabular-nums ${style.countColor} ${count > 0 ? 'animate-pulse' : ''}`}>
                            {count}
                        </span>
                        <span className="text-base font-bold text-white/70">건</span>
                    </div>
                </div>
            </div>
        );
    }

    // ── Medium: 대기 건수 카드 (compact) ──
    if (!isLarge) {
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        승인 대기함
                    </p>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
                        <ClipboardCheck size={14} />
                    </div>
                </div>

                {/* 메인 카운트 카드 */}
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div className={`relative w-full rounded-2xl bg-gradient-to-br ${style.gradient} p-4 flex flex-col items-center justify-center overflow-hidden`}>
                        {/* 배경 데코 원 */}
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />

                        {/* 아이콘 */}
                        <div className={`relative w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center mb-2 ring-2 ${style.ringColor}`}>
                            <ClipboardCheck size={20} className="text-white" />
                        </div>

                        {/* 카운트 숫자 */}
                        <div className="relative flex items-baseline gap-1">
                            <span
                                className={`text-4xl font-black tabular-nums ${style.countColor} ${
                                    count > 0 ? 'animate-pulse' : ''
                                }`}
                            >
                                {count}
                            </span>
                            <span className="text-lg font-bold text-white/70">건</span>
                        </div>

                        {/* 부제 */}
                        <p className={`relative text-xs font-bold mt-1 ${style.subtitleColor}`}>
                            연차 승인 대기
                        </p>

                        {/* 상태 뱃지 */}
                        <div className={`relative mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${style.badgeColor}`}>
                            {style.badgeLabel}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Large: 전체 상세 + 요청자 정보 ──
    const displayItems = items.slice(0, 8);
    const moreItemCount = items.length - displayItems.length;
    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    승인 대기함
                </p>
                <div className="flex items-center gap-1.5">
                    <div className={`px-2.5 py-0.5 rounded-lg bg-gradient-to-r ${style.gradient} text-white text-[10px] font-black`}>
                        {count}건 대기
                    </div>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
                        <ClipboardCheck size={14} />
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
                {/* 좌측: 카운트 카드 */}
                <div className="w-36 flex-shrink-0">
                    <div className={`relative w-full rounded-xl bg-gradient-to-br ${style.gradient} p-3 flex flex-col items-center justify-center overflow-hidden h-full`}>
                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
                        <div className={`relative w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center mb-2 ring-2 ${style.ringColor}`}>
                            <ClipboardCheck size={18} className="text-white" />
                        </div>
                        <div className="relative flex items-baseline gap-0.5">
                            <span className={`text-3xl font-black tabular-nums ${style.countColor} ${count > 0 ? 'animate-pulse' : ''}`}>
                                {count}
                            </span>
                            <span className="text-base font-bold text-white/70">건</span>
                        </div>
                        <p className={`relative text-[10px] font-bold mt-1 ${style.subtitleColor}`}>
                            연차 승인 대기
                        </p>
                    </div>
                </div>

                {/* 우측: 대기 목록 */}
                <div className="flex-1 overflow-y-auto">
                    {displayItems.length > 0 ? (
                        <div className="space-y-1.5">
                            {displayItems.map((item, idx) => {
                                const requestor = item.requestorName ?? item.requestor ?? '미지정';
                                const dateStr = item.date ?? item.createdAt;
                                const formattedDate = dateStr
                                    ? new Date(dateStr).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
                                    : '';

                                return (
                                    <div
                                        key={item.id ?? idx}
                                        className="flex items-center gap-2 p-2 bg-stone-50/70 rounded-lg border border-stone-100 hover:bg-white hover:border-indigo-200 transition-all"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                            {requestor.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-slate-700 truncate">
                                                {item.title ?? item.type ?? '승인 요청'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[9px] text-slate-500">{requestor}</span>
                                                {formattedDate && (
                                                    <span className="text-[9px] text-slate-400">{formattedDate}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 flex-shrink-0">
                                            대기
                                        </span>
                                    </div>
                                );
                            })}
                            {moreItemCount > 0 && (
                                <p className="text-[10px] text-slate-400 font-bold text-center">+{moreItemCount}건 더</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center h-full">
                            <p className="text-xs text-slate-400 font-medium text-center">
                                {count > 0 ? `${count}건의 승인 요청이 있습니다` : '대기 중인 승인이 없습니다'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
