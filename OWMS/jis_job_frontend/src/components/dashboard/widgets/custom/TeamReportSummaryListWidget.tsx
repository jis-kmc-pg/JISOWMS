'use client';

import React from 'react';
import { ClipboardList, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface DayEntry {
    date: string;
    dayOfWeek: string;
    users: {
        id: number | string;
        name: string;
        department?: string;
        status: string;
    }[];
}

interface TeamReportSummaryListWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

const DAY_LABELS = ['월', '화', '수', '목', '금'];

function getStatusDot(status?: string) {
    switch (status?.toUpperCase()) {
        case 'DONE':
        case 'SUBMITTED':
        case '완료':
        case '제출':
            return {
                color: 'bg-emerald-500',
                ring: 'ring-emerald-200',
                icon: <CheckCircle2 size={10} className="text-white" />,
                label: '완료',
            };
        case 'MISSING':
        case 'NOT_SUBMITTED':
        case '미제출':
        case '미작성':
            return {
                color: 'bg-rose-500',
                ring: 'ring-rose-200',
                icon: <XCircle size={10} className="text-white" />,
                label: '미작성',
            };
        default:
            return {
                color: 'bg-stone-300',
                ring: 'ring-stone-200',
                icon: <MinusCircle size={10} className="text-white" />,
                label: '-',
            };
    }
}

function isDone(status?: string): boolean {
    const s = status?.toUpperCase();
    return s === 'DONE' || s === 'SUBMITTED' || s === '완료' || s === '제출';
}

export default function TeamReportSummaryListWidget({ data, size }: TeamReportSummaryListWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const days: DayEntry[] = Array.isArray(data) ? data : (data?.days ?? data?.data ?? data?.items ?? []);

    // 유저별로 요일 데이터 집계
    const userMap = new Map<string, { id: string | number; name: string; department?: string; statuses: Record<string, string> }>();

    days.forEach((day) => {
        const dayLabel = day.dayOfWeek ?? '';
        (day.users ?? []).forEach((user) => {
            const key = String(user.id ?? user.name);
            if (!userMap.has(key)) {
                userMap.set(key, {
                    id: user.id,
                    name: user.name,
                    department: user.department,
                    statuses: {},
                });
            }
            userMap.get(key)!.statuses[dayLabel] = user.status;
        });
    });

    const members = Array.from(userMap.values());

    // 요일 라벨: API 에서 넘어온 dayOfWeek 목록 또는 기본 월~금
    const availableDays = days.length > 0
        ? days.map(d => d.dayOfWeek).filter(Boolean)
        : DAY_LABELS;
    const displayDays = availableDays.length > 0 ? availableDays : DAY_LABELS;

    // ── Small: "이름 3/7 | 이름 3/7" 인라인 칩 형태 (전원 표시) ──
    if (isSmall) {
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <ClipboardList size={14} className="text-indigo-500" />
                        업무보고 요약
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                        {members.length}명
                    </span>
                </div>

                {members.length === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 font-medium text-center">
                            데이터 없음
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto">
                        <div className="flex flex-wrap gap-1">
                            {members.map((member, idx) => {
                                const completedCount = displayDays.filter(day => isDone(member.statuses[day])).length;
                                const allDone = completedCount === displayDays.length;

                                return (
                                    <span
                                        key={member.id ?? idx}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border ${
                                            allDone
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : completedCount === 0
                                                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                    : 'bg-stone-50 text-slate-600 border-stone-200'
                                        }`}
                                    >
                                        {member.name}
                                        <span className={`tabular-nums font-black ${
                                            allDone ? 'text-emerald-500' : completedCount === 0 ? 'text-rose-500' : 'text-slate-500'
                                        }`}>
                                            {completedCount}/{displayDays.length}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Medium: 2열 그리드 + 요일 도트 (전원 표시) ──
    if (!isLarge) {
        const dotSize = 'w-4 h-4';
        const colWidth = '24px';

        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <ClipboardList size={14} className="text-indigo-500" />
                        팀원 업무보고 요약
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                        {members.length}명
                    </span>
                </div>

                {members.length === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 font-medium text-center">
                            업무보고 데이터가 없습니다
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto -mx-1">
                        {/* 테이블 헤더 */}
                        <div className="sticky top-0 z-10 bg-white">
                            <div className="grid items-center gap-1 px-2 py-1 border-b border-stone-100"
                                 style={{ gridTemplateColumns: `1fr repeat(${displayDays.length}, ${colWidth})` }}>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    이름
                                </span>
                                {displayDays.map((day, idx) => (
                                    <span key={idx} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        {day}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 전원 표시 */}
                        <div className="space-y-0">
                            {members.map((member, idx) => {
                                const completedCount = displayDays.filter(day => isDone(member.statuses[day])).length;
                                const allDone = completedCount === displayDays.length;

                                return (
                                    <div
                                        key={member.id ?? idx}
                                        className={`grid items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                                            allDone
                                                ? 'bg-emerald-50/40 hover:bg-emerald-50'
                                                : 'hover:bg-stone-50'
                                        }`}
                                        style={{ gridTemplateColumns: `1fr repeat(${displayDays.length}, ${colWidth})` }}
                                    >
                                        <div className="min-w-0 flex items-center gap-1">
                                            <p className="text-[11px] font-bold text-slate-700 truncate">
                                                {member.name}
                                            </p>
                                            <span className={`text-[9px] font-black tabular-nums flex-shrink-0 ${
                                                allDone ? 'text-emerald-500' : 'text-slate-400'
                                            }`}>
                                                {completedCount}/{displayDays.length}
                                            </span>
                                        </div>
                                        {displayDays.map((day, dIdx) => {
                                            const dot = getStatusDot(member.statuses[day]);
                                            return (
                                                <div key={dIdx} className="flex justify-center" title={`${day} - ${dot.label}`}>
                                                    <div
                                                        className={`${dotSize} rounded-full ${dot.color} ring-1 ${dot.ring} flex items-center justify-center`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Large: 넓은 테이블 + 아이콘 도트 (전원 표시) ──
    const dotSize = 'w-5 h-5';
    const colWidth = '32px';

    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ClipboardList size={14} className="text-indigo-500" />
                    팀원 업무보고 요약
                </h4>
                <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                    {members.length}명
                </span>
            </div>

            {members.length === 0 ? (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-xs text-slate-400 font-medium text-center">
                        업무보고 데이터가 없습니다
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-auto -mx-1">
                    {/* 테이블 헤더 */}
                    <div className="sticky top-0 z-10 bg-white">
                        <div className="grid items-center gap-1.5 px-2 py-1.5 border-b border-stone-100"
                             style={{ gridTemplateColumns: `1fr repeat(${displayDays.length}, ${colWidth}) 48px` }}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                이름
                            </span>
                            {displayDays.map((day, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                    {day}
                                </span>
                            ))}
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                합계
                            </span>
                        </div>
                    </div>

                    {/* 전원 표시 */}
                    <div className="space-y-0.5">
                        {members.map((member, idx) => {
                            const completedCount = displayDays.filter(day => isDone(member.statuses[day])).length;
                            const allDone = completedCount === displayDays.length;

                            return (
                                <div
                                    key={member.id ?? idx}
                                    className={`grid items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                                        allDone
                                            ? 'bg-emerald-50/40 hover:bg-emerald-50'
                                            : 'hover:bg-stone-50'
                                    }`}
                                    style={{ gridTemplateColumns: `1fr repeat(${displayDays.length}, ${colWidth}) 48px` }}
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-700 truncate">
                                            {member.name}
                                        </p>
                                    </div>
                                    {displayDays.map((day, dIdx) => {
                                        const dot = getStatusDot(member.statuses[day]);
                                        return (
                                            <div key={dIdx} className="flex justify-center" title={`${day} - ${dot.label}`}>
                                                <div
                                                    className={`${dotSize} rounded-full ${dot.color} ring-2 ${dot.ring} flex items-center justify-center transition-transform hover:scale-110`}
                                                >
                                                    {dot.icon}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="text-center">
                                        <span className={`text-xs font-black tabular-nums ${
                                            allDone ? 'text-emerald-500' : 'text-slate-500'
                                        }`}>
                                            {completedCount}/{displayDays.length}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
