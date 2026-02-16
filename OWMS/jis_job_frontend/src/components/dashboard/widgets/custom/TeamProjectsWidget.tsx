'use client';

import React from 'react';
import { FolderKanban, Users, Building2 } from 'lucide-react';

interface Project {
    id?: string | number;
    projectName?: string;
    name?: string;
    clientName?: string;
    client?: string;
    status?: string;
    memberCount?: number;
    members?: unknown[];
    description?: string;
    progress?: number;
}

interface TeamProjectsWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function getStatusBadge(status?: string) {
    switch (status?.toUpperCase()) {
        case 'ACTIVE':
        case '진행':
        case '진행중':
            return { label: '진행중', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
        case 'COMPLETED':
        case '완료':
            return { label: '완료', color: 'bg-blue-50 text-blue-600 border-blue-200' };
        case 'PAUSED':
        case '보류':
        case '중단':
            return { label: '보류', color: 'bg-amber-50 text-amber-600 border-amber-200' };
        case 'CANCELLED':
        case '취소':
            return { label: '취소', color: 'bg-rose-50 text-rose-600 border-rose-200' };
        case 'PLANNING':
        case '계획':
            return { label: '계획', color: 'bg-violet-50 text-violet-600 border-violet-200' };
        default:
            return { label: status ?? '-', color: 'bg-slate-50 text-slate-500 border-slate-200' };
    }
}

function getProgressColor(progress: number) {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-indigo-500';
}

export default function TeamProjectsWidget({ data, size }: TeamProjectsWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const projects: Project[] = Array.isArray(data)
        ? data
        : (data?.projects ?? data?.data ?? data?.items ?? []);

    const activeCount = projects.filter(p => {
        const s = p.status?.toUpperCase();
        return s === 'ACTIVE' || s === '진행' || s === '진행중';
    }).length;

    // ── Small: 프로젝트 수 + 진행 수 인라인 통계 ──
    if (isSmall) {
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <FolderKanban size={14} className="text-indigo-500" />
                        프로젝트
                    </h4>
                </div>

                <div className="flex-1 min-h-0 flex items-center justify-center">
                    {projects.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium">없음</p>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <span className="text-2xl font-black text-slate-700 tabular-nums block">
                                    {projects.length}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">총 건수</span>
                            </div>
                            <div className="w-px h-8 bg-stone-200" />
                            <div className="text-center">
                                <span className="text-2xl font-black text-emerald-500 tabular-nums block">
                                    {activeCount}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400">진행중</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Large: 확장 레이아웃 + 진행률 바 (max 8) ──
    if (isLarge) {
        const displayProjects = projects.slice(0, 8);
        const moreCount = projects.length - displayProjects.length;
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <FolderKanban size={14} className="text-indigo-500" />
                        팀 프로젝트 현황
                    </h4>
                    <div className="flex items-center gap-1.5">
                        {activeCount > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                진행 {activeCount}
                            </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                            총 {projects.length}건
                        </span>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 font-medium text-center">
                            프로젝트가 없습니다
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
                        {displayProjects.map((project, idx) => {
                            const name = project.projectName ?? project.name ?? '제목 없음';
                            const client = project.clientName ?? project.client;
                            const badge = getStatusBadge(project.status);
                            const memberCount = project.memberCount ?? project.members?.length;
                            const progress = project.progress ?? 0;

                            return (
                                <div
                                    key={project.id ?? idx}
                                    className="group/card p-2.5 bg-stone-50/70 rounded-xl border border-stone-100 hover:bg-white hover:border-indigo-200 transition-all"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                                                <FolderKanban size={12} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 truncate" title={name}>
                                                {name}
                                            </p>
                                        </div>
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border flex-shrink-0 ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    {/* 메타 + 진행률 인라인 */}
                                    <div className="flex items-center gap-2 mt-1 pl-8">
                                        {client && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                                                <Building2 size={9} className="text-slate-400" />
                                                {client}
                                            </span>
                                        )}
                                        {memberCount != null && memberCount > 0 && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                                                <Users size={9} className="text-slate-400" />
                                                {memberCount}명
                                            </span>
                                        )}
                                        {progress > 0 && (
                                            <div className="flex items-center gap-1 flex-1">
                                                <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${getProgressColor(progress)} transition-all duration-500`}
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 tabular-nums">
                                                    {progress}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {moreCount > 0 && (
                            <p className="text-[10px] text-slate-400 font-bold text-center py-1">+{moreCount}건 더</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ── Medium: 카드 리스트 (max 5) ──
    const displayProjects = projects.slice(0, 5);
    const moreCount = projects.length - displayProjects.length;
    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <FolderKanban size={14} className="text-indigo-500" />
                    팀 프로젝트 현황
                </h4>
                <div className="flex items-center gap-1.5">
                    {activeCount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            진행 {activeCount}
                        </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                        총 {projects.length}건
                    </span>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-xs text-slate-400 font-medium text-center">
                        프로젝트가 없습니다
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
                    {displayProjects.map((project, idx) => {
                        const name = project.projectName ?? project.name ?? '제목 없음';
                        const client = project.clientName ?? project.client;
                        const badge = getStatusBadge(project.status);
                        const memberCount = project.memberCount ?? project.members?.length;

                        return (
                            <div
                                key={project.id ?? idx}
                                className="group/card p-2.5 bg-stone-50/70 rounded-xl border border-stone-100 hover:bg-white hover:border-indigo-200 transition-all"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover/card:bg-indigo-100 transition-colors">
                                            <FolderKanban size={13} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 truncate" title={name}>
                                            {name}
                                        </p>
                                    </div>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border flex-shrink-0 ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* 메타 정보 */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 pl-9">
                                    {client && (
                                        <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                                            <Building2 size={9} className="text-slate-400" />
                                            {client}
                                        </span>
                                    )}
                                    {memberCount != null && memberCount > 0 && (
                                        <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                                            <Users size={9} className="text-slate-400" />
                                            {memberCount}명
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {moreCount > 0 && (
                        <p className="text-[10px] text-slate-400 font-bold text-center py-1">+{moreCount}건 더</p>
                    )}
                </div>
            )}
        </div>
    );
}
