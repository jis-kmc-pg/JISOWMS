'use client';

import React from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';

interface VacationStat {
    name: string;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
    usageRate: number;
    // API 응답 호환 필드 (vacation.service getAdminStats)
    total?: number;
    used?: number;
    remaining?: number;
}

interface TeamVacationTableWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function getUsageColor(rate: number) {
    if (rate > 80) return { bar: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', label: '높음' };
    if (rate > 50) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: '보통' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: '양호' };
}

export default function TeamVacationTableWidget({ data, size }: TeamVacationTableWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const stats: VacationStat[] = Array.isArray(data)
        ? data
        : (data?.stats ?? data?.members ?? data?.data ?? data?.items ?? []);

    // 전체 요약
    const totalUsed = stats.reduce((s, m) => s + (Number(m.usedDays) || 0), 0);
    const totalAll = stats.reduce((s, m) => s + (Number(m.totalDays) || 0), 0);
    const avgRate = totalAll > 0 ? Math.round((totalUsed / totalAll) * 100) : 0;

    // ── Small: 컴팩트 리스트 (이름 + 바만, max 4) ──
    if (isSmall) {
        const displayStats = stats.slice(0, 4);
        const moreCount = stats.length - displayStats.length;
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-indigo-500" />
                        연차 현황
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                        {stats.length}명
                    </span>
                </div>

                {stats.length === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 font-medium">데이터 없음</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto space-y-1.5">
                        {displayStats.map((member, idx) => {
                            const total = Number(member.totalDays ?? member.total) || 0;
                            const used = Number(member.usedDays ?? member.used) || 0;
                            const rate = Number(member.usageRate) || (total > 0 ? Math.round((used / total) * 100) : 0);
                            const usage = getUsageColor(rate);

                            return (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700 w-14 truncate flex-shrink-0">
                                        {member.name}
                                    </span>
                                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${usage.bar}`}
                                            style={{ width: `${Math.min(rate, 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-black tabular-nums ${usage.text} w-8 text-right flex-shrink-0`}>
                                        {rate}%
                                    </span>
                                </div>
                            );
                        })}
                        {moreCount > 0 && (
                            <p className="text-[10px] text-slate-400 text-center">+{moreCount}명 더</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ── Medium: 이름 + 잔여 + 바 (max 6) ──
    if (!isLarge) {
        const displayStats = stats.slice(0, 6);
        const moreCount = stats.length - displayStats.length;
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-indigo-500" />
                        팀 연차 현황표
                    </h4>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                            평균 {avgRate}%
                        </span>
                    </div>
                </div>

                {stats.length === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 font-medium text-center">
                            연차 데이터가 없습니다
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto -mx-1">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="text-left px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        이름
                                    </th>
                                    <th className="text-center px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        잔여
                                    </th>
                                    <th className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left min-w-[100px]">
                                        사용률
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayStats.map((member, idx) => {
                                    const total = Number(member.totalDays ?? member.total) || 0;
                                    const used = Number(member.usedDays ?? member.used) || 0;
                                    const remaining = Number(member.remainingDays ?? member.remaining) || (total - used);
                                    const rate = Number(member.usageRate) || (total > 0 ? Math.round((used / total) * 100) : 0);
                                    const usage = getUsageColor(rate);

                                    return (
                                        <tr
                                            key={idx}
                                            className={`border-b border-stone-50 transition-colors hover:bg-stone-50 ${
                                                idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'
                                            }`}
                                        >
                                            <td className="px-2 py-1.5">
                                                <span className="font-bold text-slate-700">{member.name}</span>
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                <span className={`font-bold tabular-nums ${
                                                    remaining <= 3 ? 'text-rose-600' : 'text-slate-600'
                                                }`}>
                                                    {remaining}
                                                </span>
                                                <span className="text-slate-400 text-[10px] ml-0.5">일</span>
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${usage.bar} transition-all duration-500`}
                                                            style={{ width: `${Math.min(rate, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-black tabular-nums min-w-[28px] text-right ${usage.text}`}>
                                                        {rate}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {moreCount > 0 && (
                            <p className="text-[10px] text-slate-400 font-bold text-center py-1">+{moreCount}명 더</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ── Large: 전체 테이블 (max 8) ──
    const displayStats = stats.slice(0, 8);
    const moreCount = stats.length - displayStats.length;
    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-indigo-500" />
                    팀 연차 현황표
                </h4>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                        <TrendingUp size={10} className="inline mr-0.5" />
                        평균 {avgRate}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                        {stats.length}명
                    </span>
                </div>
            </div>

            {stats.length === 0 ? (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-xs text-slate-400 font-medium text-center">
                        연차 데이터가 없습니다
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-auto -mx-1">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-stone-100">
                                <th className="text-left px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    이름
                                </th>
                                <th className="text-center px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    총연차
                                </th>
                                <th className="text-center px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    사용
                                </th>
                                <th className="text-center px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    잔여
                                </th>
                                <th className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left min-w-[100px]">
                                    사용률
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayStats.map((member, idx) => {
                                const total = Number(member.totalDays ?? member.total) || 0;
                                const used = Number(member.usedDays ?? member.used) || 0;
                                const remaining = Number(member.remainingDays ?? member.remaining) || (total - used);
                                const rate = Number(member.usageRate) || (total > 0 ? Math.round((used / total) * 100) : 0);
                                const usage = getUsageColor(rate);

                                return (
                                    <tr
                                        key={idx}
                                        className={`border-b border-stone-50 transition-colors hover:bg-stone-50 ${
                                            idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'
                                        }`}
                                    >
                                        <td className="px-2 py-1.5">
                                            <span className="font-bold text-slate-700">{member.name}</span>
                                        </td>
                                        <td className="px-2 py-1.5 text-center">
                                            <span className="font-bold text-slate-600 tabular-nums">{total}</span>
                                            <span className="text-slate-400 text-[10px] ml-0.5">일</span>
                                        </td>
                                        <td className="px-2 py-1.5 text-center">
                                            <span className="font-bold text-indigo-600 tabular-nums">{used}</span>
                                            <span className="text-slate-400 text-[10px] ml-0.5">일</span>
                                        </td>
                                        <td className="px-2 py-1.5 text-center">
                                            <span className={`font-bold tabular-nums ${
                                                remaining <= 3 ? 'text-rose-600' : 'text-slate-600'
                                            }`}>
                                                {remaining}
                                            </span>
                                            <span className="text-slate-400 text-[10px] ml-0.5">일</span>
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${usage.bar} transition-all duration-500`}
                                                        style={{ width: `${Math.min(rate, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-black tabular-nums min-w-[28px] text-right ${usage.text}`}>
                                                    {rate}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {moreCount > 0 && (
                        <p className="text-[10px] text-slate-400 font-bold text-center py-1">+{moreCount}명 더</p>
                    )}
                </div>
            )}
        </div>
    );
}
