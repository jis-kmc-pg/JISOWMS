'use client';

import React, { useMemo } from 'react';
import { ClipboardCheck, CheckCircle2, AlertCircle, FileText, CalendarRange } from 'lucide-react';

interface WeeklyReportStatusWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

interface DayEntry {
    date: string;
    dayName: string;
    hasJob: boolean;
    workType: string;
    isToday: boolean;
}

interface WeekSummary {
    dateRange: string;
    totalDays: number;
    completedDays: number;
    isComplete: boolean;
    rate: number;
}

/**
 * API /reports/my-status 는 평일 10일치 배열을 반환:
 * [{ date, dayName, hasJob, workType, isToday }, ...]
 * 이번주 5일 + 차주 5일로 분리하여 표시
 */
function parseWeeksFromArray(entries: DayEntry[]): { thisWeek: WeekSummary; nextWeek: WeekSummary } {
    // 이번주 = 앞 5일, 차주 = 뒤 5일
    const thisWeekDays = entries.slice(0, 5);
    const nextWeekDays = entries.slice(5, 10);

    const summarize = (days: DayEntry[]): WeekSummary => {
        const totalDays = days.length;
        const completedDays = days.filter(d => d.hasJob).length;
        const isComplete = totalDays > 0 && completedDays >= totalDays;
        const rate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        const dateRange = days.length > 0
            ? `${formatShortDate(days[0].date)}~${formatShortDate(days[days.length - 1].date)}`
            : '';
        return { dateRange, totalDays, completedDays, isComplete, rate };
    };

    return {
        thisWeek: summarize(thisWeekDays),
        nextWeek: summarize(nextWeekDays),
    };
}

function formatShortDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
        return dateStr;
    }
}

export default function WeeklyReportStatusWidget({ data, size }: WeeklyReportStatusWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const { thisWeek, nextWeek } = useMemo(() => {
        // API가 배열을 반환하는 경우 (실제 형식)
        if (Array.isArray(data) && data.length > 0) {
            return parseWeeksFromArray(data);
        }
        // 혹시 객체 형태로 오는 경우 (thisWeek/nextWeek)
        if (data?.thisWeek || data?.currentWeek || data?.nextWeek) {
            const extract = (raw: any): WeekSummary => {
                if (!raw) return { dateRange: '', totalDays: 0, completedDays: 0, isComplete: false, rate: 0 };
                const totalDays = raw.totalDays ?? raw.total ?? 0;
                const completedDays = raw.completedDays ?? raw.completed ?? 0;
                return {
                    dateRange: raw.date ?? raw.dateRange ?? '',
                    totalDays,
                    completedDays,
                    isComplete: totalDays > 0 && completedDays >= totalDays,
                    rate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
                };
            };
            return {
                thisWeek: extract(data.thisWeek ?? data.currentWeek),
                nextWeek: extract(data.nextWeek ?? data.next_week),
            };
        }
        return {
            thisWeek: { dateRange: '', totalDays: 0, completedDays: 0, isComplete: false, rate: 0 },
            nextWeek: { dateRange: '', totalDays: 0, completedDays: 0, isComplete: false, rate: 0 },
        };
    }, [data]);

    const isEmpty = thisWeek.totalDays === 0 && nextWeek.totalDays === 0;

    const weeks = [
        { label: '이번주', data: thisWeek, icon: ClipboardCheck },
        { label: '차주', data: nextWeek, icon: CalendarRange },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                        <FileText size={14} className="text-indigo-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">주간업무 작성현황</h4>
                </div>
            </div>

            {isEmpty ? (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 mb-2">
                        <ClipboardCheck size={24} className="text-slate-200" />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">주간업무 현황 정보가 없습니다</p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-auto flex flex-row gap-2">
                    {weeks.map(({ label, data: weekData, icon: Icon }) => {
                        const complete = weekData.isComplete;

                        return (
                            <div
                                key={label}
                                className={`
                                    flex-1 p-3 rounded-xl border transition-all duration-200
                                    hover:shadow-md cursor-default
                                    ${complete
                                        ? 'bg-gradient-to-br from-emerald-50/60 dark:from-emerald-900/20 to-white dark:to-slate-800 border-emerald-200/60 dark:border-emerald-800/40'
                                        : 'bg-gradient-to-br from-amber-50/40 dark:from-amber-900/20 to-white dark:to-slate-800 border-amber-200/50 dark:border-amber-800/40'
                                    }
                                `}
                            >
                                {/* 카드 헤더 */}
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`
                                            p-1 rounded-lg
                                            ${complete ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}
                                        `}>
                                            <Icon size={12} className={complete ? 'text-emerald-600' : 'text-amber-600'} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{label}</span>
                                    </div>
                                    {weekData.dateRange && (
                                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 tabular-nums">
                                            {weekData.dateRange}
                                        </span>
                                    )}
                                </div>

                                {/* 상태 아이콘 + 라벨 */}
                                {isSmall ? (
                                    <div className="flex items-center gap-2">
                                        <div className={`
                                            p-1 rounded-full transition-colors
                                            ${complete ? 'bg-emerald-100/80 dark:bg-emerald-900/40' : 'bg-amber-100/80 dark:bg-amber-900/40'}
                                        `}>
                                            {complete ? (
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                            ) : (
                                                <AlertCircle size={14} className="text-amber-500" />
                                            )}
                                        </div>
                                        <span className={`
                                            text-xs font-black tracking-wide
                                            ${complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
                                        `}>
                                            {complete ? '작성완료' : '미작성'}
                                        </span>
                                        {weekData.totalDays > 0 && (
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 tabular-nums ml-auto">
                                                {weekData.completedDays}/{weekData.totalDays}일
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {/* Medium/Large: 상태 아이콘 + 텍스트 */}
                                        <div className="flex flex-col items-center py-2">
                                            <div className={`
                                                p-2 rounded-full mb-1.5 transition-colors
                                                ${complete ? 'bg-emerald-100/80 dark:bg-emerald-900/40' : 'bg-amber-100/80 dark:bg-amber-900/40'}
                                            `}>
                                                {complete ? (
                                                    <CheckCircle2 size={22} className="text-emerald-500" />
                                                ) : (
                                                    <AlertCircle size={22} className="text-amber-500" />
                                                )}
                                            </div>
                                            <span className={`
                                                text-sm font-black tracking-wide
                                                ${complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
                                            `}>
                                                {complete ? '작성완료' : '미작성'}
                                            </span>
                                        </div>

                                        {/* 작성 일수 상세 */}
                                        {weekData.totalDays > 0 && (
                                            <div className="mt-1.5 pt-1.5 border-t border-stone-100/80 dark:border-slate-600/50">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                                                    <span>작성일</span>
                                                    <span className="tabular-nums">{weekData.completedDays}/{weekData.totalDays}일</span>
                                                </div>
                                                <div className="h-1.5 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                                                            complete ? 'bg-emerald-400' : 'bg-amber-400'
                                                        }`}
                                                        style={{
                                                            width: `${Math.min(weekData.rate, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
