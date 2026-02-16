'use client';

import React, { useMemo } from 'react';
import { FolderKanban, Play, CheckCircle2, PauseCircle, ChevronRight } from 'lucide-react';

interface ProjectItem {
    id?: number;
    projectName?: string;
    clientName?: string;
    status?: string;
}

interface CompanyProjectsWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    ACTIVE: { label: '진행중', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Play },
    COMPLETED: { label: '완료', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: CheckCircle2 },
    PAUSED: { label: '중단', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: PauseCircle },
};

function getStatusConfig(status?: string) {
    return STATUS_CONFIG[status ?? ''] ?? { label: status ?? '미정', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: FolderKanban };
}

export default function CompanyProjectsWidget({ data, size }: CompanyProjectsWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const projects: ProjectItem[] = Array.isArray(data) ? data : (data?.data ?? data?.projects ?? data?.items ?? []);

    const summary = useMemo(() => {
        const active = projects.filter(p => p?.status === 'ACTIVE').length;
        const completed = projects.filter(p => p?.status === 'COMPLETED').length;
        const paused = projects.filter(p => p?.status === 'PAUSED').length;
        return { active, completed, paused, total: projects.length };
    }, [projects]);

    const displayCount = isSmall ? 0 : isLarge ? 8 : 5;

    // Small: 진행중 + 완료 인라인 통계
    if (isSmall) {
        return (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-sm">
                            <FolderKanban size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">프로젝트</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-lg font-black text-emerald-700 tabular-nums">
                                    {summary.active}<span className="text-[10px] font-bold text-slate-400 ml-0.5">진행</span>
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-lg font-black text-indigo-700 tabular-nums">
                                    {summary.completed}<span className="text-[10px] font-bold text-slate-400 ml-0.5">완료</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-slate-800 tabular-nums">{summary.total}</p>
                        <p className="text-[10px] font-bold text-slate-400">전체</p>
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
                        <FolderKanban size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">전사 프로젝트 현황</h4>
                </div>
                <span className="text-xs font-bold text-indigo-600 tabular-nums">{summary.total}건</span>
            </div>

            {/* 상태 요약 카드 */}
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                    <Play size={12} className="text-emerald-600" />
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">진행중</p>
                        <p className="text-sm font-black text-emerald-700 tabular-nums">
                            {summary.active}<span className="text-[9px] font-bold text-slate-400 ml-0.5">건</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                    <CheckCircle2 size={12} className="text-indigo-600" />
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">완료</p>
                        <p className="text-sm font-black text-indigo-700 tabular-nums">
                            {summary.completed}<span className="text-[9px] font-bold text-slate-400 ml-0.5">건</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-amber-50/60 rounded-lg border border-amber-100">
                    <PauseCircle size={12} className="text-amber-600" />
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">중단</p>
                        <p className="text-sm font-black text-amber-700 tabular-nums">
                            {summary.paused}<span className="text-[9px] font-bold text-slate-400 ml-0.5">건</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 프로젝트 리스트 */}
            <div className="flex-1 min-h-0 overflow-auto">
                {projects.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-4">
                        <FolderKanban size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">등록된 프로젝트가 없습니다</p>
                    </div>
                ) : (
                    <div className={isLarge ? 'grid grid-cols-3 gap-1.5' : 'space-y-1.5'}>
                        {projects.slice(0, displayCount).map((project, idx) => {
                            const config = getStatusConfig(project?.status);
                            const StatusIcon = config.icon;

                            return (
                                <div
                                    key={project?.id ?? idx}
                                    className={`p-2 rounded-lg border ${config.border} ${config.bg} hover:shadow-sm transition-all duration-200 cursor-pointer group/card`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 min-w-0 flex-1">
                                            <StatusIcon size={12} className={config.color} />
                                            <span className={`text-[9px] font-black uppercase ${config.color}`}>
                                                {config.label}
                                            </span>
                                            <span className="text-xs font-bold text-slate-800 truncate ml-1">
                                                {project?.projectName ?? '프로젝트명 없음'}
                                            </span>
                                        </div>
                                        <ChevronRight
                                            size={12}
                                            className="text-slate-300 group-hover/card:text-slate-500 transition-colors flex-shrink-0"
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
