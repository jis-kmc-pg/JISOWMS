'use client';

import React from 'react';
import { Users, Home, MapPin, Calendar, Activity } from 'lucide-react';

interface TeamAttendanceWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

interface StatusCard {
    label: string;
    count: number;
    icon: React.ReactNode;
    smallIcon: React.ReactNode;
    color: string;
    bg: string;
    ring: string;
}

export default function TeamAttendanceWidget({ data, size }: TeamAttendanceWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const members = data?.members ?? data?.data ?? [];
    const kpi = data?.kpi ?? data?.summary ?? {};

    // members에 status 필드가 있는지 확인
    const hasStatusField = Array.isArray(members) && members.some((m: { status?: string }) => !!m.status);

    // 각 상태별 인원 계산: members 배열에서 직접 세거나, kpi 에서 가져옴
    const countByStatus = (statuses: string[]) => {
        if (!hasStatusField || !Array.isArray(members) || members.length === 0) return 0;
        return members.filter((m: { status?: string }) =>
            statuses.some(s => m.status?.toUpperCase() === s.toUpperCase())
        ).length;
    };

    // /metrics/dashboard (TEAM) → members에 upcomingLeave만 있는 경우 휴가자 수 계산
    const countOnLeaveFromUpcoming = () => {
        if (!Array.isArray(members) || members.length === 0) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return members.filter((m: { upcomingLeave?: { startDate?: string; endDate?: string; status?: string }[] }) => {
            if (!Array.isArray(m.upcomingLeave) || m.upcomingLeave.length === 0) return false;
            return m.upcomingLeave.some(v => {
                if (v.status && v.status !== 'APPROVED') return false;
                const start = v.startDate ? new Date(v.startDate) : null;
                const end = v.endDate ? new Date(v.endDate) : null;
                if (!start) return false;
                const startDay = new Date(start); startDay.setHours(0, 0, 0, 0);
                const endDay = end ? new Date(end) : null; if (endDay) endDay.setHours(23, 59, 59, 999);
                return startDay <= today && (!endDay || endDay >= today);
            });
        }).length;
    };

    const totalEmployees = Number(kpi?.totalEmployees ?? kpi?.deptMembers ?? members?.length ?? 0);

    // 휴가: kpi → members.status → members.upcomingLeave 순
    const statusLeave = countByStatus(['LEAVE', 'VACATION', '휴가']);
    const upcomingLeave = countOnLeaveFromUpcoming();
    const todayOnLeave = Number(kpi?.todayOnLeave ?? (statusLeave > 0 ? statusLeave : upcomingLeave));

    // 출근/재택/외근: status 필드가 있으면 정확히, 없으면 총원 - 휴가 = 출근으로 추정
    const atOffice = Number(
        kpi?.atOffice ?? kpi?.present ?? (hasStatusField
            ? countByStatus(['OFFICE', 'PRESENT', '출근', '근무'])
            : Math.max(totalEmployees - todayOnLeave, 0))
    );
    const remote = Number(
        kpi?.remote ?? kpi?.wfh ?? (hasStatusField ? countByStatus(['REMOTE', 'WFH', '재택', '재택근무']) : 0)
    );
    const fieldWork = Number(
        kpi?.fieldWork ?? kpi?.outside ?? (hasStatusField ? countByStatus(['FIELD', 'OUTSIDE', '외근']) : 0)
    );
    const onLeave = todayOnLeave;

    const cards: StatusCard[] = [
        {
            label: '출근',
            count: atOffice,
            icon: <Users size={18} />,
            smallIcon: <Users size={14} />,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
            ring: 'ring-emerald-100 dark:ring-emerald-800/30',
        },
        {
            label: '재택',
            count: remote,
            icon: <Home size={18} />,
            smallIcon: <Home size={14} />,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            ring: 'ring-blue-100 dark:ring-blue-800/30',
        },
        {
            label: '외근',
            count: fieldWork,
            icon: <MapPin size={18} />,
            smallIcon: <MapPin size={14} />,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/30',
            ring: 'ring-amber-100 dark:ring-amber-800/30',
        },
        {
            label: '휴가',
            count: onLeave,
            icon: <Calendar size={18} />,
            smallIcon: <Calendar size={14} />,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-900/30',
            ring: 'ring-rose-100 dark:ring-rose-800/30',
        },
    ];

    const hasData = totalEmployees > 0 || cards.some(c => c.count > 0);

    // ── Small: 아이콘 + 숫자만 한 줄에 4개 미니 뱃지 ──
    if (isSmall) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Activity size={14} className="text-indigo-500" />
                        근태 현황
                    </h4>
                </div>

                {!hasData ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">데이터 없음</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <div className="flex items-center gap-2 w-full">
                            {cards.map((card) => (
                                <div
                                    key={card.label}
                                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl ${card.bg}`}
                                >
                                    <span className={card.color}>{card.smallIcon}</span>
                                    <span className={`text-lg font-black tabular-nums ${card.color}`}>
                                        {card.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Large: 한 줄에 4개 확장 카드 + 퍼센트 ──
    if (isLarge) {
        const totalActive = atOffice + remote + fieldWork + onLeave;
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Activity size={14} className="text-indigo-500" />
                        팀 근태 현황
                    </h4>
                    {totalEmployees > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-stone-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                            총 {totalEmployees}명
                        </span>
                    )}
                </div>

                {!hasData ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium text-center">
                            근태 데이터가 없습니다
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 grid grid-cols-4 gap-2">
                        {cards.map((card) => {
                            const pct = totalActive > 0 ? Math.round((card.count / totalActive) * 100) : 0;
                            return (
                                <div
                                    key={card.label}
                                    className={`relative overflow-hidden p-3 rounded-xl ${card.bg} ring-1 ${card.ring} hover:ring-2 transition-all group/card`}
                                >
                                    <div className="relative">
                                        <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center mb-2 ring-1 ${card.ring} group-hover/card:scale-110 transition-transform`}>
                                            {card.icon}
                                        </div>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className={`text-2xl font-black tabular-nums ${card.color}`}>
                                                {card.count}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">명</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">
                                            {card.label}
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-1">
                                            <div className="flex-1 h-1 bg-white/60 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${card.bg.includes('emerald') ? 'bg-emerald-400' : card.bg.includes('blue') ? 'bg-blue-400' : card.bg.includes('amber') ? 'bg-amber-400' : 'bg-rose-400'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className={`text-[10px] font-black tabular-nums ${card.color}`}>
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ── Medium: 2x2 그리드 ──
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Activity size={14} className="text-indigo-500" />
                    팀 근태 현황
                </h4>
                {totalEmployees > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-stone-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                        총 {totalEmployees}명
                    </span>
                )}
            </div>

            {!hasData ? (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium text-center">
                        근태 데이터가 없습니다
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className={`relative overflow-hidden p-3 rounded-xl ${card.bg} ring-1 ${card.ring} hover:ring-2 transition-all group/card`}
                        >
                            <div className="relative flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center ring-1 ${card.ring} group-hover/card:scale-110 transition-transform flex-shrink-0`}>
                                    {card.icon}
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className={`text-xl font-black tabular-nums ${card.color}`}>
                                            {card.count}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 dark:text-slate-400">명</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {card.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
