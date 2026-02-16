'use client';

import React, { useMemo } from 'react';
import { Building2, UserCheck, UserX, Users, TrendingUp } from 'lucide-react';

interface MemberInfo {
    id?: number;
    name?: string;
    deptName?: string;
    teamName?: string;
    status?: string;
}

interface DeptBreakdown {
    deptName: string;
    total: number;
    onLeave: number;
    atWork: number;
}

interface CompanyHeadcountWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

export default function CompanyHeadcountWidget({ data, size }: CompanyHeadcountWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const totalEmployees = data?.totalEmployees ?? data?.kpi?.totalEmployees ?? 0;
    const todayOnLeave = data?.todayOnLeave ?? data?.kpi?.todayOnLeave ?? 0;
    const atWork = totalEmployees - todayOnLeave;
    const attendanceRate = totalEmployees > 0 ? Math.round((atWork / totalEmployees) * 100) : 0;

    const members: MemberInfo[] = data?.members ?? data?.kpi?.members ?? [];

    // 부서별 분류
    const deptBreakdown: DeptBreakdown[] = useMemo(() => {
        if (!members || members.length === 0) return [];

        const deptMap = new Map<string, { total: number; onLeave: number }>();

        members.forEach((m) => {
            const dept = m?.deptName ?? '미배정';
            const current = deptMap.get(dept) || { total: 0, onLeave: 0 };
            current.total += 1;
            if (m?.status === 'ON_LEAVE' || m?.status === 'VACATION') {
                current.onLeave += 1;
            }
            deptMap.set(dept, current);
        });

        return Array.from(deptMap.entries())
            .map(([deptName, info]) => ({
                deptName,
                total: info.total,
                onLeave: info.onLeave,
                atWork: info.total - info.onLeave,
            }))
            .sort((a, b) => b.total - a.total);
    }, [members]);

    const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

    const displayCount = isSmall ? 0 : isLarge ? 8 : 6;

    // Small: 컴팩트 카드 - 총 인원 + 출근율만 표시
    if (isSmall) {
        return (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-sm">
                            <Building2 size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">전사 인원</p>
                            <p className="text-2xl font-black text-slate-800 tabular-nums">
                                {totalEmployees}<span className="text-xs font-bold text-slate-400 ml-0.5">명</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span className="text-lg font-black text-emerald-600 tabular-nums">{attendanceRate}%</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">출근율</p>
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
                        <Building2 size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">전사 인원 현황</h4>
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 tabular-nums">출근율 {attendanceRate}%</span>
                </div>
            </div>

            {/* KPI 요약 카드 */}
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="flex items-center gap-1.5 p-1.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                    <Users size={12} className="text-indigo-600" />
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">전체</p>
                        <p className="text-sm font-black text-indigo-700 tabular-nums">
                            {totalEmployees}<span className="text-[9px] font-bold text-slate-400 ml-0.5">명</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                    <UserCheck size={12} className="text-emerald-600" />
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">출근</p>
                        <p className="text-sm font-black text-emerald-700 tabular-nums">
                            {atWork}<span className="text-[9px] font-bold text-slate-400 ml-0.5">명</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-rose-50/60 rounded-lg border border-rose-100">
                    <UserX size={12} className="text-rose-500" />
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">휴가</p>
                        <p className="text-sm font-black text-rose-600 tabular-nums">
                            {todayOnLeave}<span className="text-[9px] font-bold text-slate-400 ml-0.5">명</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 부서별 인원 현황 */}
            <div className="flex-1 min-h-0 overflow-auto">
                {deptBreakdown.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-4">
                        <Building2 size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">부서별 데이터가 없습니다</p>
                    </div>
                ) : (
                    <div className={isLarge ? 'grid grid-cols-2 gap-x-4 gap-y-1.5' : 'space-y-1.5'}>
                        {deptBreakdown.slice(0, displayCount).map((dept, idx) => {
                            const deptRate = dept.total > 0 ? Math.round((dept.atWork / dept.total) * 100) : 0;
                            const color = DEPT_COLORS[idx % DEPT_COLORS.length];

                            return (
                                <div key={dept.deptName} className="group/dept">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-xs font-bold text-slate-700 group-hover/dept:text-indigo-600 transition-colors">
                                                {dept.deptName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {dept.atWork}/{dept.total}명
                                            </span>
                                            {isLarge && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    (휴가 {dept.onLeave}명)
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black tabular-nums" style={{ color }}>
                                                {deptRate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out relative"
                                            style={{
                                                width: `${Math.max(deptRate, 2)}%`,
                                                backgroundColor: color,
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover/dept:opacity-100 transition-opacity" />
                                        </div>
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
