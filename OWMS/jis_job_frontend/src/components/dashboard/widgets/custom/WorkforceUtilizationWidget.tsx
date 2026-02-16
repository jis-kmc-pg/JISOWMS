'use client';

import React, { useMemo } from 'react';
import { UserCheck, Users, Briefcase, Coffee } from 'lucide-react';

interface MemberInfo {
    id?: number;
    name?: string;
    deptName?: string;
    teamName?: string;
    status?: string;
    projectId?: number;
    projectAssigned?: boolean;
}

interface WorkforceUtilizationWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

export default function WorkforceUtilizationWidget({ data, size }: WorkforceUtilizationWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const totalEmployees = data?.totalEmployees ?? data?.kpi?.totalEmployees ?? 0;
    const members: MemberInfo[] = data?.members ?? data?.kpi?.members ?? [];

    const { overallRate, activeCount, idleCount, deptBreakdown } = useMemo(() => {
        if (members.length === 0) {
            // 멤버 정보가 없을 경우 kpi 기반 출근율 활용
            const onLeave = data?.todayOnLeave ?? data?.kpi?.todayOnLeave ?? 0;
            const atWork = totalEmployees - onLeave;
            const rate = totalEmployees > 0 ? Math.round((atWork / totalEmployees) * 100) : 0;
            return { overallRate: rate, activeCount: atWork, idleCount: onLeave, deptBreakdown: [] };
        }

        // 프로젝트 투입 여부 확인
        const hasProjectData = members.some(m => m?.projectId !== undefined || m?.projectAssigned !== undefined);

        const deptMap = new Map<string, { active: number; idle: number; total: number }>();

        members.forEach((m) => {
            const dept = m?.deptName ?? '미배정';
            const current = deptMap.get(dept) || { active: 0, idle: 0, total: 0 };
            current.total += 1;

            if (hasProjectData) {
                // 프로젝트 기반 가동률
                if (m?.projectId || m?.projectAssigned) {
                    current.active += 1;
                } else {
                    current.idle += 1;
                }
            } else {
                // 출근 기반 가동률
                if (m?.status === 'ON_LEAVE' || m?.status === 'VACATION') {
                    current.idle += 1;
                } else {
                    current.active += 1;
                }
            }

            deptMap.set(dept, current);
        });

        const breakdowns = Array.from(deptMap.entries())
            .map(([deptName, info]) => ({
                deptName,
                active: info.active,
                idle: info.idle,
                total: info.total,
                rate: info.total > 0 ? Math.round((info.active / info.total) * 100) : 0,
            }))
            .sort((a, b) => b.total - a.total);

        const totalActive = breakdowns.reduce((s, d) => s + d.active, 0);
        const totalIdle = breakdowns.reduce((s, d) => s + d.idle, 0);
        const totalAll = totalActive + totalIdle;
        const rate = totalAll > 0 ? Math.round((totalActive / totalAll) * 100) : 0;

        return { overallRate: rate, activeCount: totalActive, idleCount: totalIdle, deptBreakdown: breakdowns };
    }, [members, totalEmployees, data]);

    // SVG 원형 진행률 파라미터 - compact sizes
    const svgSize = isLarge ? 70 : 80;
    const radius = isLarge ? 26 : 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = (overallRate / 100) * circumference;
    const strokeWidth = isLarge ? 8 : 10;
    const viewBoxSize = isLarge ? 70 : 80;
    const center = viewBoxSize / 2;

    const displayCount = isSmall ? 0 : isLarge ? 7 : 5;

    // Small: 전사 가동률% 단일 통계
    if (isSmall) {
        return (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-sm">
                            <UserCheck size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">인력 가동률</p>
                            <p className="text-2xl font-black text-indigo-700 tabular-nums">
                                {overallRate}<span className="text-xs font-bold text-slate-400 ml-0.5">%</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600 tabular-nums">
                            {activeCount}<span className="text-[10px] font-bold text-slate-400 ml-0.5">명</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">투입 인력</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                        <UserCheck size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">인력 가동률</h4>
                </div>
                <span className="text-xs font-bold text-indigo-600 tabular-nums">{overallRate}%</span>
            </div>

            {/* 원형 차트 + KPI + 부서별 */}
            <div className="flex-1 min-h-0 overflow-auto">
                <div className={`flex ${isLarge ? 'flex-row gap-4' : 'flex-row gap-3'} items-start`}>
                    {/* 원형 진행률 */}
                    <div className="relative flex-shrink-0" style={{ width: svgSize, height: svgSize }}>
                        <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full transform -rotate-90">
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke="#f1f5f9"
                                strokeWidth={strokeWidth}
                            />
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke="url(#workforceGrad)"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                                strokeDashoffset={0}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="workforceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`${isLarge ? 'text-sm' : 'text-base'} font-black text-indigo-700 tabular-nums`}>{overallRate}%</span>
                        </div>
                    </div>

                    {/* KPI 카드 + 부서별 */}
                    <div className="flex-1 min-w-0">
                        {/* KPI 카드 */}
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                            <div className="flex items-center gap-1 p-1.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                                <Briefcase size={10} className="text-indigo-600" />
                                <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">투입</p>
                                    <p className="text-xs font-black text-indigo-700 tabular-nums">
                                        {activeCount}<span className="text-[8px] text-slate-400 ml-0.5">명</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                                <Coffee size={10} className="text-slate-500" />
                                <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">유휴</p>
                                    <p className="text-xs font-black text-slate-600 tabular-nums">
                                        {idleCount}<span className="text-[8px] text-slate-400 ml-0.5">명</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 p-1.5 bg-purple-50/60 rounded-lg border border-purple-100">
                                <Users size={10} className="text-purple-600" />
                                <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">전체</p>
                                    <p className="text-xs font-black text-purple-700 tabular-nums">
                                        {totalEmployees || (activeCount + idleCount)}
                                        <span className="text-[8px] text-slate-400 ml-0.5">명</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 부서별 스택 바 */}
                        {deptBreakdown.length > 0 && (
                            <div className={isLarge ? 'grid grid-cols-2 gap-x-3 gap-y-1' : 'space-y-1'}>
                                {deptBreakdown.slice(0, displayCount).map((dept, idx) => {
                                    const activePercent = dept.total > 0 ? (dept.active / dept.total) * 100 : 0;
                                    const color = DEPT_COLORS[idx % DEPT_COLORS.length];

                                    return (
                                        <div key={dept.deptName} className="group/dept">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-700">
                                                        {dept.deptName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] text-slate-400 font-medium">
                                                        {dept.active}/{dept.total}명
                                                    </span>
                                                    <span className="text-[9px] font-black tabular-nums" style={{ color }}>
                                                        {dept.rate}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full rounded-l-full transition-all duration-700 ease-out"
                                                    style={{
                                                        width: `${Math.max(activePercent, activePercent > 0 ? 2 : 0)}%`,
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
