'use client';

import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TeamEntryRate {
    teamName: string;
    total: number;
    completed: number;
    entryRate: number;
}

interface DeptReportComparisonWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function getBarColor(rate: number): { bar: string; bg: string; text: string } {
    if (rate >= 80) return { bar: 'from-emerald-400 to-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' };
    if (rate >= 60) return { bar: 'from-amber-400 to-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' };
    return { bar: 'from-rose-400 to-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' };
}

function getRankBadge(index: number): string {
    if (index === 0) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (index === 1) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (index === 2) return 'bg-orange-100 text-orange-600 border-orange-200';
    return 'bg-stone-50 text-stone-400 border-stone-200';
}

export default function DeptReportComparisonWidget({ data, size }: DeptReportComparisonWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const overallRate: number = data?.entryRate ?? data?.overallRate ?? 0;
    const rawTeams: TeamEntryRate[] = data?.teams ?? data?.data ?? data?.stats ?? [];

    const sortedTeams = useMemo(() => {
        return [...rawTeams]
            .map(t => ({
                teamName: t.teamName ?? '알 수 없음',
                total: t.total ?? 0,
                completed: t.completed ?? 0,
                entryRate: t.entryRate ?? 0,
            }))
            .sort((a, b) => b.entryRate - a.entryRate);
    }, [rawTeams]);

    const avgRate = sortedTeams.length > 0
        ? Math.round(sortedTeams.reduce((s, t) => s + t.entryRate, 0) / sortedTeams.length)
        : 0;

    return (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <BarChart3 size={14} className="text-indigo-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">팀별 업무보고 작성률 비교</h4>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100 ${isSmall ? 'hidden' : ''}`}>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">평균</span>
                    <span className={`text-lg font-black tabular-nums ${
                        avgRate >= 80 ? 'text-emerald-600' : avgRate >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>{avgRate}%</span>
                </div>
            </div>

            {/* 팀별 비교 바 차트 */}
            <div className={`flex-1 min-h-0 overflow-auto space-y-1.5`}>
                {sortedTeams.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                        <BarChart3 size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">데이터가 없습니다</p>
                    </div>
                ) : isSmall ? (
                    /* Small: 컴팩트 인라인 바 (팀명 + 퍼센트) */
                    sortedTeams.slice(0, 3).map((team, idx) => {
                        const colors = getBarColor(team.entryRate);
                        return (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700 w-16 truncate flex-shrink-0">
                                    {team.teamName}
                                </span>
                                <div className="flex-1 h-4 bg-stone-100 rounded overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${colors.bar} rounded transition-all duration-700 ease-out`}
                                        style={{ width: `${Math.max(team.entryRate, 2)}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-black tabular-nums flex-shrink-0 ${colors.text}`}>
                                    {team.entryRate}%
                                </span>
                            </div>
                        );
                    })
                ) : (
                    /* Medium / Large: 풀 바 차트 */
                    sortedTeams.slice(0, isLarge ? 7 : 5).map((team, idx) => {
                        const colors = getBarColor(team.entryRate);
                        const diff = team.entryRate - avgRate;
                        return (
                            <div key={idx} className="group/row">
                                <div className="flex items-center gap-3">
                                    {/* 순위 배지 */}
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border flex-shrink-0 ${getRankBadge(idx)}`}>
                                        {idx + 1}
                                    </span>

                                    {/* 팀명 */}
                                    <span className={`text-sm font-bold text-slate-700 truncate flex-shrink-0 group-hover/row:text-indigo-600 transition-colors ${isLarge ? 'w-28' : 'w-20'}`}>
                                        {team.teamName}
                                    </span>

                                    {/* 프로그레스 바 */}
                                    <div className={`flex-1 bg-stone-100 rounded-lg overflow-hidden relative ${isLarge ? 'h-5' : 'h-4'}`}>
                                        <div
                                            className={`h-full bg-gradient-to-r ${colors.bar} rounded-lg transition-all duration-700 ease-out relative`}
                                            style={{ width: `${Math.max(team.entryRate, 2)}%` }}
                                        >
                                            {/* 쉬머 이펙트 */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                        </div>
                                        {/* 바 위에 건수 표시 */}
                                        {team.total > 0 && (
                                            <span className="absolute inset-0 flex items-center px-2.5 text-[10px] font-bold text-slate-500">
                                                {team.completed}/{team.total}건
                                            </span>
                                        )}
                                    </div>

                                    {/* 퍼센트 + 트렌드 */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0 w-20 justify-end">
                                        <span className={`text-sm font-black tabular-nums ${colors.text}`}>
                                            {team.entryRate}%
                                        </span>
                                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                            diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : 'text-slate-400'
                                        }`}>
                                            {diff > 0 ? <TrendingUp size={10} /> : diff < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                                            {diff > 0 ? '+' : ''}{diff}
                                        </span>
                                    </div>

                                    {/* Large: 추가 팀 상세 정보 */}
                                    {isLarge && team.total > 0 && (
                                        <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 w-16 text-right">
                                            {team.completed}/{team.total}건
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

        </div>
    );
}
