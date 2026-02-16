'use client';

import React from 'react';
import { Users, UserCheck, Palmtree, Briefcase } from 'lucide-react';

interface DeptHeadcountWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

interface StatCard {
    label: string;
    value: number;
    icon: React.ReactNode;
    bgColor: string;
    iconBg: string;
    textColor: string;
    borderColor: string;
}

export default function DeptHeadcountWidget({ data, size }: DeptHeadcountWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const totalEmployees = data?.kpi?.deptMembers ?? data?.kpi?.totalEmployees ?? data?.totalEmployees ?? data?.total ?? 0;
    const todayOnLeave = data?.kpi?.todayOnLeave ?? data?.todayOnLeave ?? data?.onLeave ?? 0;
    const onFieldWork = data?.kpi?.onFieldWork ?? data?.onFieldWork ?? data?.fieldWork ?? 0;
    const atWork = Math.max(totalEmployees - todayOnLeave - onFieldWork, 0);

    const cards: StatCard[] = [
        {
            label: '총원',
            value: totalEmployees,
            icon: <Users size={16} className="text-slate-600" />,
            bgColor: 'bg-slate-50/80',
            iconBg: 'bg-slate-100',
            textColor: 'text-slate-700',
            borderColor: 'border-slate-200',
        },
        {
            label: '출근',
            value: atWork,
            icon: <UserCheck size={16} className="text-emerald-600" />,
            bgColor: 'bg-emerald-50/50',
            iconBg: 'bg-emerald-100',
            textColor: 'text-emerald-700',
            borderColor: 'border-emerald-200',
        },
        {
            label: '휴가',
            value: todayOnLeave,
            icon: <Palmtree size={16} className="text-rose-500" />,
            bgColor: 'bg-rose-50/50',
            iconBg: 'bg-rose-100',
            textColor: 'text-rose-600',
            borderColor: 'border-rose-200',
        },
        {
            label: '외근',
            value: onFieldWork,
            icon: <Briefcase size={16} className="text-amber-600" />,
            bgColor: 'bg-amber-50/50',
            iconBg: 'bg-amber-100',
            textColor: 'text-amber-600',
            borderColor: 'border-amber-200',
        },
    ];

    const attendanceRate = totalEmployees > 0 ? Math.round((atWork / totalEmployees) * 100) : 0;

    return (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 rounded-xl">
                        <Users size={14} className="text-slate-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">부서 전체 인원 현황</h4>
                </div>
                {!isSmall && (
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                        attendanceRate >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                        출근율 {attendanceRate}%
                    </span>
                )}
            </div>

            {/* Small: 인라인 숫자 3개 (총원/출근/휴가) */}
            {isSmall ? (
                <div className="flex-1 flex items-center justify-around gap-2">
                    {cards.slice(0, 3).map((card, idx) => (
                        <div key={idx} className="text-center">
                            <p className={`text-lg font-black tabular-nums ${card.textColor}`}>
                                {card.value}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">{card.label}</p>
                        </div>
                    ))}
                </div>
            ) : isLarge ? (
                /* Large: 확장 카드 1행 + 퍼센트 바 */
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                    <div className="grid grid-cols-4 gap-2">
                        {cards.map((card, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all hover:scale-[1.02] ${card.bgColor} ${card.borderColor}`}
                            >
                                <div className={`p-1.5 rounded-lg flex-shrink-0 ${card.iconBg}`}>
                                    {card.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                                    <p className={`text-xl font-black tabular-nums ${card.textColor}`}>
                                        {card.value}
                                        <span className="text-xs font-bold text-slate-400 ml-0.5">명</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* 출근율 퍼센트 바 */}
                    <div className="mt-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-500">출근율</span>
                            <span className={`text-sm font-black tabular-nums ${
                                attendanceRate >= 80 ? 'text-emerald-600' : 'text-amber-600'
                            }`}>{attendanceRate}%</span>
                        </div>
                        <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                    attendanceRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'
                                }`}
                                style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* Medium: 기존 2x2 카드 그리드 */
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
                    {cards.map((card, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all hover:scale-[1.02] ${card.bgColor} ${card.borderColor}`}
                        >
                            <div className={`p-1.5 rounded-lg flex-shrink-0 ${card.iconBg}`}>
                                {card.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                                <p className={`text-xl font-black tabular-nums ${card.textColor}`}>
                                    {card.value}
                                    <span className="text-xs font-bold text-slate-400 ml-0.5">명</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
