'use client';

import React, { useMemo } from 'react';
import { CalendarDays, Sun } from 'lucide-react';

interface VacationStat {
    name: string;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
}

interface DeptVacationStatsWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

export default function DeptVacationStatsWidget({ data, size }: DeptVacationStatsWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const rawStats: VacationStat[] = Array.isArray(data) ? data : (data?.stats ?? data?.data ?? data?.items ?? []);

    const stats = useMemo(() => {
        return rawStats.map(item => ({
            name: item.name ?? '알 수 없음',
            totalDays: item.totalDays ?? 0,
            usedDays: item.usedDays ?? 0,
            remainingDays: item.remainingDays ?? 0,
        }));
    }, [rawStats]);

    const totalUsed = stats.reduce((s, d) => s + d.usedDays, 0);
    const totalRemaining = stats.reduce((s, d) => s + d.remainingDays, 0);
    const totalDays = stats.reduce((s, d) => s + d.totalDays, 0);
    const overallUsageRate = totalDays > 0 ? Math.round((totalUsed / totalDays) * 100) : 0;

    return (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                        <CalendarDays size={14} className="text-emerald-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">부서 연차 사용 통계</h4>
                </div>
                {!isSmall && (
                    <span className="text-xs font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                        사용률 {overallUsageRate}%
                    </span>
                )}
            </div>

            {/* 팀/개인별 리스트/차트 */}
            <div className="flex-1 min-h-0 overflow-auto space-y-1.5">
                {stats.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                        <Sun size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">연차 데이터가 없습니다</p>
                    </div>
                ) : isSmall ? (
                    /* Small: 컴팩트 리스트 (팀명 + 사용률%) */
                    stats.slice(0, 3).map((item, idx) => {
                        const usageRate = item.totalDays > 0
                            ? Math.round((item.usedDays / item.totalDays) * 100)
                            : 0;
                        return (
                            <div key={idx} className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                                <span className={`text-xs font-black tabular-nums flex-shrink-0 ${
                                    usageRate >= 80 ? 'text-rose-500' : usageRate >= 50 ? 'text-amber-500' : 'text-emerald-600'
                                }`}>
                                    {usageRate}%
                                </span>
                            </div>
                        );
                    })
                ) : (
                    /* Medium / Large: 바 차트 */
                    stats.slice(0, isLarge ? 7 : 5).map((item, idx) => {
                        const usageRate = item.totalDays > 0
                            ? Math.round((item.usedDays / item.totalDays) * 100)
                            : 0;
                        const usedWidth = item.totalDays > 0
                            ? (item.usedDays / item.totalDays) * 100
                            : 0;
                        const remainingWidth = item.totalDays > 0
                            ? (item.remainingDays / item.totalDays) * 100
                            : 0;

                        return (
                            <div key={idx} className="group/row">
                                {/* 이름 + 사용률 */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-slate-700 group-hover/row:text-indigo-600 transition-colors truncate">
                                        {item.name}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {item.usedDays}/{item.totalDays}일
                                        </span>
                                        <span className={`text-xs font-black tabular-nums ${
                                            usageRate >= 80 ? 'text-rose-500' : usageRate >= 50 ? 'text-amber-500' : 'text-emerald-600'
                                        }`}>
                                            {usageRate}%
                                        </span>
                                    </div>
                                </div>

                                {/* 스택 바 (사용 + 잔여) */}
                                <div className={`bg-stone-100 rounded-lg overflow-hidden flex ${isLarge ? 'h-5' : 'h-4'}`}>
                                    {/* 사용분 (인디고) */}
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 transition-all duration-700 ease-out relative"
                                        style={{ width: `${usedWidth}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                    </div>
                                    {/* 잔여분 (그린) */}
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-300 to-emerald-400 transition-all duration-700 ease-out relative"
                                        style={{ width: `${remainingWidth}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                    </div>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>

        </div>
    );
}
