'use client';

import React, { useMemo } from 'react';
import { FileBarChart, TrendingUp } from 'lucide-react';

interface TeamEntry {
    teamName?: string;
    deptName?: string;
    deptId?: number;
    total?: number;
    completed?: number;
    entryRate?: number;
}

interface CompanyReportRateWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function getBarColor(rate: number): { gradient: string; text: string; bg: string } {
    if (rate >= 80) return { gradient: 'from-emerald-400 to-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' };
    if (rate >= 60) return { gradient: 'from-indigo-400 to-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' };
    if (rate >= 40) return { gradient: 'from-amber-400 to-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' };
    return { gradient: 'from-rose-400 to-rose-500', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' };
}

export default function CompanyReportRateWidget({ data, size }: CompanyReportRateWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const companyEntryRate = data?.entryRate ?? data?.companyRate ?? 0;
    const teams: TeamEntry[] = data?.teams ?? data?.departments ?? data?.data ?? [];

    // 비율 계산 및 정렬 (높은 순)
    const sortedTeams = useMemo(() => {
        return [...teams]
            .map((t) => ({
                name: t?.teamName ?? t?.deptName ?? '미배정',
                total: t?.total ?? 0,
                completed: t?.completed ?? 0,
                rate: t?.entryRate ?? (t?.total && t.total > 0 ? Math.round(((t?.completed ?? 0) / t.total) * 100) : 0),
            }))
            .sort((a, b) => b.rate - a.rate);
    }, [teams]);

    const avgRate = companyEntryRate > 0
        ? companyEntryRate
        : sortedTeams.length > 0
            ? Math.round(sortedTeams.reduce((s, t) => s + t.rate, 0) / sortedTeams.length)
            : 0;

    const maxRate = sortedTeams.length > 0 ? Math.max(...sortedTeams.map(t => t.rate)) : 100;
    const barScale = maxRate > 0 ? 100 / Math.max(maxRate, 1) : 1;

    const trendUp = sortedTeams.length >= 2
        ? sortedTeams[0].rate >= sortedTeams[sortedTeams.length - 1].rate
        : avgRate > 0;

    const displayCount = isSmall ? 0 : isLarge ? 8 : 6;

    // Small: 전사 보고율% + 트렌드 표시
    if (isSmall) {
        const colors = getBarColor(avgRate);
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-sm">
                            <FileBarChart size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">업무보고 작성률</p>
                            <p className={`text-2xl font-black tabular-nums ${colors.text}`}>
                                {avgRate}<span className="text-xs font-bold text-slate-400 ml-0.5">%</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                            <TrendingUp size={14} className={trendUp ? 'text-emerald-500' : 'text-rose-500 rotate-180'} />
                            <span className={`text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                전사 평균
                            </span>
                        </div>
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
                        <FileBarChart size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">부서별 업무보고 작성률</h4>
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-xs font-bold text-indigo-600 tabular-nums">전사 {avgRate}%</span>
                </div>
            </div>

            {/* 수평 막대 차트 영역 */}
            <div className="flex-1 min-h-0 overflow-auto">
                {sortedTeams.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-4">
                        <FileBarChart size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">보고 데이터가 없습니다</p>
                    </div>
                ) : (
                    <div className={isLarge ? 'grid grid-cols-2 gap-x-4 gap-y-1.5' : 'space-y-1.5'}>
                        {sortedTeams.slice(0, displayCount).map((team, idx) => {
                            const colors = getBarColor(team.rate);
                            const avgPosition = avgRate * barScale;

                            return (
                                <div key={`${team.name}-${idx}`} className="group/bar">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/bar:text-indigo-600 transition-colors">
                                                {team.name}
                                            </span>
                                            {team.total > 0 && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    ({team.completed}/{team.total}건)
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-xs font-black tabular-nums ${colors.text}`}>
                                            {team.rate}%
                                        </span>
                                    </div>
                                    <div className="relative h-2.5 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-700 ease-out relative`}
                                            style={{ width: `${Math.max(team.rate * barScale, 2)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                                        </div>
                                        {/* 전사 평균 참조선 */}
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-indigo-400/60"
                                            style={{ left: `${avgPosition}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
