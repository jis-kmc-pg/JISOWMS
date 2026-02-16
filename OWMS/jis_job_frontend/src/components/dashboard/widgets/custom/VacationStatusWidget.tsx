'use client';

import React, { useMemo } from 'react';
import { Calendar, Palmtree } from 'lucide-react';

interface VacationStatusWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

export default function VacationStatusWidget({ data, size }: VacationStatusWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const totalDays = data?.totalDays ?? data?.total ?? 0;
    const usedDays = data?.usedDays ?? data?.used ?? 0;
    const remainingDays = data?.remainingDays ?? data?.remaining ?? (totalDays - usedDays);

    const isEmpty = totalDays === 0 && usedDays === 0 && remainingDays === 0;

    // SVG 도넛 계산
    const { circumference, usedOffset, remainingArc, usedPercent } = useMemo(() => {
        const radius = 56;
        const c = 2 * Math.PI * radius;
        const pct = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;
        const usedArc = (pct / 100) * c;
        const remArc = c - usedArc;
        return {
            circumference: c,
            usedOffset: c - usedArc,
            remainingArc: remArc,
            usedPercent: Math.round(pct),
        };
    }, [totalDays, usedDays]);

    // 도넛 SVG 렌더링 헬퍼
    const renderDonut = (wrapperSize: number) => (
        <div className="relative" style={{ width: wrapperSize, height: wrapperSize }}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="12" fill="none" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={0}
                    className="transition-all duration-1000 ease-out" opacity={0.2} />
                <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="12" fill="none" strokeLinecap="round"
                    strokeDasharray={`${circumference - (circumference * usedPercent / 100)} ${circumference}`}
                    strokeDashoffset={0} className="transition-all duration-1000 ease-out" />
                <circle cx="64" cy="64" r="56" stroke="#f43f5e" strokeWidth="12" fill="none" strokeLinecap="round"
                    strokeDasharray={`${(circumference * usedPercent / 100)} ${circumference}`}
                    strokeDashoffset={-(circumference - (circumference * usedPercent / 100))}
                    className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">잔여</span>
                <span className="text-xl font-black text-emerald-600 tabular-nums leading-tight">
                    {remainingDays}
                </span>
                <span className="text-[9px] font-bold text-slate-300">/ {totalDays}일</span>
            </div>
        </div>
    );

    // 3개 미니 통계 박스 렌더링 헬퍼
    const renderStatBoxes = () => (
        <div className="w-full grid grid-cols-3 gap-2">
            <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100/60 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">총연차</span>
                </div>
                <p className="text-base font-black text-slate-600 tabular-nums">
                    {totalDays}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">일</span>
                </p>
            </div>
            <div className="bg-rose-50/60 rounded-xl p-2 border border-rose-100/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">사용</span>
                </div>
                <p className="text-base font-black text-rose-600 tabular-nums">
                    {usedDays}
                    <span className="text-[10px] font-bold text-rose-400 ml-0.5">일</span>
                </p>
            </div>
            <div className="bg-emerald-50/60 rounded-xl p-2 border border-emerald-100/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">잔여</span>
                </div>
                <p className="text-base font-black text-emerald-600 tabular-nums">
                    {remainingDays}
                    <span className="text-[10px] font-bold text-emerald-400 ml-0.5">일</span>
                </p>
            </div>
        </div>
    );

    // 사용률 바 렌더링 헬퍼
    const renderUsageBar = () => (
        <div className="w-full mt-2 pt-2 border-t border-stone-100">
            <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                <span>사용률</span>
                <span className="tabular-nums">{usedPercent}%</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden relative">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{
                        width: `${Math.min(usedPercent, 100)}%`,
                        background: usedPercent > 80
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : usedPercent > 50
                                ? 'linear-gradient(90deg, #10b981, #f59e0b)'
                                : 'linear-gradient(90deg, #10b981, #34d399)',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden group relative">
            {/* 배경 장식 */}
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Palmtree size={60} className="text-emerald-600" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-emerald-50">
                        <Calendar size={14} className="text-emerald-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">연차 현황</h4>
                </div>
            </div>

            {isEmpty ? (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="p-3 rounded-2xl bg-slate-50 mb-2">
                        <Calendar size={24} className="text-slate-200" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">연차 정보가 없습니다</p>
                </div>
            ) : isSmall ? (
                /* Small: stat boxes + usage bar */
                <div className="flex-1 min-h-0 overflow-auto flex flex-col">
                    {renderStatBoxes()}
                    {renderUsageBar()}
                </div>
            ) : isLarge ? (
                /* Large: 도넛 왼쪽 + stat boxes 오른쪽, 가로 배치 */
                <div className="flex-1 min-h-0 overflow-auto flex flex-col">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                            {renderDonut(100)}
                        </div>
                        <div className="flex-1">
                            {renderStatBoxes()}
                        </div>
                    </div>
                    {renderUsageBar()}
                </div>
            ) : (
                /* Medium: 도넛(90px) 왼쪽 + stat boxes 오른쪽, 가로 배치 */
                <div className="flex-1 min-h-0 overflow-auto flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            {renderDonut(90)}
                        </div>
                        <div className="flex-1 grid grid-cols-1 gap-1.5">
                            <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100/60 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">총연차</span>
                                <span className="ml-auto text-sm font-black text-slate-600 tabular-nums">
                                    {totalDays}<span className="text-[10px] font-bold text-slate-400 ml-0.5">일</span>
                                </span>
                            </div>
                            <div className="bg-rose-50/60 rounded-lg p-2 border border-rose-100/50 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">사용</span>
                                <span className="ml-auto text-sm font-black text-rose-600 tabular-nums">
                                    {usedDays}<span className="text-[10px] font-bold text-rose-400 ml-0.5">일</span>
                                </span>
                            </div>
                            <div className="bg-emerald-50/60 rounded-lg p-2 border border-emerald-100/50 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">잔여</span>
                                <span className="ml-auto text-sm font-black text-emerald-600 tabular-nums">
                                    {remainingDays}<span className="text-[10px] font-bold text-emerald-400 ml-0.5">일</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    {renderUsageBar()}
                </div>
            )}
        </div>
    );
}
