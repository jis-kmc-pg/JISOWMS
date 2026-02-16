'use client';

import React, { useMemo } from 'react';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TeamAttendance {
    deptName?: string;
    teamName?: string;
    rate?: number;
    dates?: { date: string; rate: number }[];
    attendanceRate?: number;
    totalDays?: number;
    presentDays?: number;
}

interface DeptAttendanceStatsWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function getRateStyle(rate: number): { bar: string; text: string; bg: string; border: string } {
    if (rate >= 90) return { bar: 'from-emerald-400 to-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (rate >= 70) return { bar: 'from-amber-400 to-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { bar: 'from-rose-400 to-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
}

export default function DeptAttendanceStatsWidget({ data, size }: DeptAttendanceStatsWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const rawData: TeamAttendance[] = Array.isArray(data) ? data : (data?.data ?? data?.stats ?? data?.teams ?? []);

    const teams = useMemo(() => {
        return rawData.map(item => {
            const name = item.teamName ?? item.deptName ?? '알 수 없음';

            // rate가 직접 있으면 사용, 아니면 dates에서 평균 계산
            let rate: number;
            if (item.rate !== undefined && item.rate !== null) {
                rate = item.rate;
            } else if (item.attendanceRate !== undefined && item.attendanceRate !== null) {
                rate = item.attendanceRate;
            } else if (item.dates && item.dates.length > 0) {
                rate = Math.round(item.dates.reduce((s, d) => s + (d.rate ?? 0), 0) / item.dates.length);
            } else {
                rate = 0;
            }

            return { name, rate: Math.round(rate) };
        }).sort((a, b) => b.rate - a.rate);
    }, [rawData]);

    const avgRate = teams.length > 0
        ? Math.round(teams.reduce((s, t) => s + t.rate, 0) / teams.length)
        : 0;

    const maxRate = teams.length > 0 ? Math.max(...teams.map(t => t.rate)) : 0;
    const minRate = teams.length > 0 ? Math.min(...teams.map(t => t.rate)) : 0;

    // 지각 수 계산 (데이터에서 가져오거나 0)
    const lateCount = data?.lateCount ?? data?.late ?? 0;

    return (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-violet-50 rounded-xl">
                        <Clock size={14} className="text-violet-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">부서 근태 통계</h4>
                </div>
                {!isSmall && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-xl border border-violet-100">
                        <span className="text-[10px] font-bold text-violet-400 uppercase">평균</span>
                        <span className={`text-lg font-black tabular-nums ${
                            avgRate >= 90 ? 'text-emerald-600' : avgRate >= 70 ? 'text-amber-600' : 'text-rose-600'
                        }`}>{avgRate}%</span>
                    </div>
                )}
            </div>

            {/* Small: 핵심 숫자만 표시 (출석률, 지각 수) */}
            {isSmall ? (
                <div className="flex-1 flex items-center justify-around gap-2">
                    <div className="text-center">
                        <p className={`text-lg font-black tabular-nums ${
                            avgRate >= 90 ? 'text-emerald-600' : avgRate >= 70 ? 'text-amber-600' : 'text-rose-600'
                        }`}>{avgRate}%</p>
                        <p className="text-[10px] font-bold text-slate-400">출석률</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black tabular-nums text-rose-600">{lateCount}</p>
                        <p className="text-[10px] font-bold text-slate-400">지각</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black tabular-nums text-violet-600">{teams.length}</p>
                        <p className="text-[10px] font-bold text-slate-400">팀 수</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* 팀별 바 차트 */}
                    <div className="flex-1 min-h-0 overflow-auto space-y-1.5">
                        {teams.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-4">
                                <Clock size={24} className="text-slate-200 mb-2" />
                                <p className="text-xs text-slate-400 font-medium">근태 데이터가 없습니다</p>
                            </div>
                        ) : (
                            teams.slice(0, isLarge ? 7 : 5).map((team, idx) => {
                                const style = getRateStyle(team.rate);
                                const diff = team.rate - avgRate;
                                return (
                                    <div key={idx} className="group/row">
                                        <div className="flex items-center gap-3">
                                            {/* 팀명 */}
                                            <span className={`text-xs font-bold text-slate-700 truncate flex-shrink-0 group-hover/row:text-violet-600 transition-colors ${isLarge ? 'w-28' : 'w-20'}`}>
                                                {team.name}
                                            </span>

                                            {/* 바 */}
                                            <div className="flex-1 relative">
                                                <div className={`bg-stone-100 rounded-lg overflow-hidden ${isLarge ? 'h-5' : 'h-4'}`}>
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${style.bar} rounded-lg transition-all duration-700 ease-out relative`}
                                                        style={{ width: `${Math.max(team.rate, 2)}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                                {/* 평균 라인 */}
                                                <div
                                                    className="absolute top-0 h-full w-px bg-violet-400 opacity-50"
                                                    style={{ left: `${avgRate}%` }}
                                                >
                                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-violet-400 rounded-full" />
                                                </div>
                                            </div>

                                            {/* 비율 + 차이 */}
                                            <div className="flex items-center gap-1.5 flex-shrink-0 w-20 justify-end">
                                                <span className={`text-sm font-black tabular-nums ${style.text}`}>
                                                    {team.rate}%
                                                </span>
                                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                                    diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : 'text-slate-400'
                                                }`}>
                                                    {diff > 0 ? <TrendingUp size={10} /> : diff < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                                                    {diff > 0 ? '+' : ''}{diff}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </>
            )}
        </div>
    );
}
