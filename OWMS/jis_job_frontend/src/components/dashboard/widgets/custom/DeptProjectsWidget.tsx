'use client';

import React, { useMemo } from 'react';
import { Briefcase, FolderOpen, Users } from 'lucide-react';

interface Project {
    id?: number | string;
    projectName: string;
    clientName?: string;
    status: string;
    progress?: number;
    memberCount?: number;
}

interface DeptProjectsWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
    ACTIVE: { label: '진행중', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    COMPLETED: { label: '완료', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    PAUSED: { label: '보류', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    CANCELLED: { label: '취소', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

const STATUS_ORDER: ProjectStatus[] = ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];

function getStatusConfig(status: string) {
    const upper = status?.toUpperCase() as ProjectStatus;
    return STATUS_CONFIG[upper] ?? { label: status ?? '알 수 없음', bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', dot: 'bg-stone-400' };
}

export default function DeptProjectsWidget({ data, size }: DeptProjectsWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const rawProjects: Project[] = Array.isArray(data) ? data : (data?.data ?? data?.projects ?? data?.items ?? []);

    const projects = useMemo(() => {
        return [...rawProjects].sort((a, b) => {
            const aIdx = STATUS_ORDER.indexOf(a.status?.toUpperCase() as ProjectStatus);
            const bIdx = STATUS_ORDER.indexOf(b.status?.toUpperCase() as ProjectStatus);
            return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
        });
    }, [rawProjects]);

    // 상태별 카운트
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        projects.forEach(p => {
            const key = p.status?.toUpperCase() ?? 'UNKNOWN';
            counts[key] = (counts[key] ?? 0) + 1;
        });
        return counts;
    }, [projects]);

    const activeCount = statusCounts['ACTIVE'] ?? 0;

    return (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <Briefcase size={14} className="text-blue-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">전체 프로젝트 현황</h4>
                </div>
                {!isSmall && (
                    <span className="text-xs font-black px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
                        {projects.length}개
                    </span>
                )}
            </div>

            {/* Small: 프로젝트 수 + 진행중 인라인 스탯 */}
            {isSmall ? (
                <div className="flex-1 flex items-center justify-around gap-2">
                    <div className="text-center">
                        <p className="text-lg font-black tabular-nums text-blue-600">{projects.length}</p>
                        <p className="text-[10px] font-bold text-slate-400">전체</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black tabular-nums text-emerald-600">{activeCount}</p>
                        <p className="text-[10px] font-bold text-slate-400">진행중</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* 상태 요약 배지 */}
                    {projects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {STATUS_ORDER.map(status => {
                                const count = statusCounts[status] ?? 0;
                                if (count === 0) return null;
                                const config = STATUS_CONFIG[status];
                                return (
                                    <div
                                        key={status}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${config.bg} ${config.border}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                                        <span className={`text-xs font-bold ${config.text}`}>
                                            {config.label}
                                        </span>
                                        <span className={`text-xs font-black ${config.text} tabular-nums`}>
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 프로젝트 카드 리스트 */}
                    <div className="flex-1 min-h-0 overflow-auto space-y-1.5">
                        {projects.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-4">
                                <FolderOpen size={24} className="text-slate-200 mb-2" />
                                <p className="text-xs text-slate-400 font-medium">프로젝트가 없습니다</p>
                            </div>
                        ) : (
                            projects.slice(0, isLarge ? 7 : 5).map((project, idx) => {
                                const config = getStatusConfig(project.status);
                                return (
                                    <div
                                        key={project.id ?? idx}
                                        className={`flex items-center gap-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm p-2.5 ${config.bg} ${config.border}`}
                                    >
                                        {/* 상태 도트 */}
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />

                                        {/* 프로젝트 정보 */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">
                                                {project.projectName ?? '제목 없음'}
                                            </p>
                                        </div>

                                        {/* Large: 멤버 수 */}
                                        {isLarge && project.memberCount !== undefined && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <Users size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-500 tabular-nums">{project.memberCount}</span>
                                            </div>
                                        )}

                                        {/* 상태 배지 */}
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide flex-shrink-0 border ${config.bg} ${config.text} ${config.border}`}>
                                            {config.label}
                                        </span>
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
