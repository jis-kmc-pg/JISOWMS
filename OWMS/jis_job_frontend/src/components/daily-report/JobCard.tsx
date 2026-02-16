'use client';

import React from 'react';
import {
    ChevronDown, Trash2, Plus, Check, Briefcase,
    Search, AlertTriangle
} from 'lucide-react';
import { JobItem, ProjectItem, isLineExceeded } from './types';

interface JobCardProps {
    job: JobItem;
    index: number;
    projects: ProjectItem[];
    openDropdownIndex: number | null;
    onToggleDropdown: (index: number | null) => void;
    onUpdateJob: (index: number, field: string, value: unknown) => void;
    onDeleteJob: (index: number) => void;
    onConfirmTitleEdit: (index: number) => void;
    getJobDisplayTitle: (job: JobItem) => string;
    projectSearchTerm: string;
    onProjectSearchChange: (term: string) => void;
    filteredProjects: ProjectItem[];
    matchingCount: number;
    onShowCreateProjectModal: (searchTerm?: string) => void;
    dragOverIndex: number | null;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
}

export default function JobCard({
    job,
    index,
    openDropdownIndex,
    onToggleDropdown,
    onUpdateJob,
    onDeleteJob,
    onConfirmTitleEdit,
    getJobDisplayTitle,
    projectSearchTerm,
    onProjectSearchChange,
    filteredProjects,
    matchingCount,
    onShowCreateProjectModal,
    dragOverIndex,
    onDragOver,
    onDrop,
}: JobCardProps) {
    const handleResizeHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const target = e.target;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
    };

    return (
        <div
            className={`group bg-white border rounded-2xl p-3 sm:p-6 space-y-3 sm:space-y-5 transition-all shadow-sm hover:shadow-md relative ${job.isIssue ? 'border-rose-200 bg-rose-50/30' : 'border-stone-200 hover:border-indigo-200'
                } ${dragOverIndex === index ? 'border-t-4 border-t-indigo-500 mt-2' : ''}`}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
        >
            {dragOverIndex === index && (
                <div className="absolute -top-3 left-0 w-full h-1 bg-indigo-500 rounded-full animate-pulse z-10 pointer-events-none shadow-lg shadow-indigo-200" />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-1 relative">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-widest uppercase shrink-0 border border-indigo-100">업무 {index + 1}</span>
                        {/* Mobile: show issue & delete buttons inline */}
                        <div className="flex sm:hidden items-center gap-1.5">
                            <button
                                onClick={() => onUpdateJob(index, 'isIssue', !job.isIssue)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-all ${job.isIssue
                                    ? 'bg-rose-50 border-rose-200 text-rose-500'
                                    : 'bg-white border-stone-200 text-slate-400'}`}
                                title={job.isIssue ? "이슈 해제" : "이슈 표시"}
                            >
                                <AlertTriangle size={14} />
                            </button>
                            <button
                                onClick={() => onDeleteJob(index)}
                                className="text-slate-300 hover:text-rose-500 transition-colors p-1 no-print"
                                title="업무 삭제"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Custom Dropdown */}
                    <div className="relative w-full sm:w-[50%] lg:w-[420px]">
                        <button
                            onClick={() => onToggleDropdown(openDropdownIndex === index ? null : index)}
                            className="w-full bg-stone-50 hover:bg-white border border-stone-200 hover:border-indigo-400 rounded-xl px-3 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between transition-all group-dropdown shadow-sm hover:shadow-md h-full"
                        >
                            <div className="flex flex-col items-start flex-1 min-w-0 pr-2">
                                {job.projectId ? (
                                    (() => {
                                        const project = filteredProjects.find(p => p.id === job.projectId) ||
                                            { clientName: '', projectName: '알 수 없는 업무' };
                                        const displayName = project.clientName
                                            ? `${project.clientName} : ${project.projectName}`
                                            : project.projectName;
                                        return (
                                            <span className="text-base font-bold text-slate-800 text-left w-full break-words whitespace-pre-wrap leading-snug">
                                                {displayName}
                                            </span>
                                        );
                                    })()
                                ) : (
                                    <span className="text-slate-400 text-sm sm:text-base font-bold">업무 선택 (검색 가능)</span>
                                )}
                            </div>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform flex-shrink-0 ${openDropdownIndex === index ? 'rotate-180 text-indigo-500' : ''}`} />
                        </button>

                        {openDropdownIndex === index && (
                            <div className="absolute top-full left-0 w-full min-w-0 sm:min-w-[480px] mt-2 bg-white border border-stone-100 rounded-2xl shadow-2xl z-50 max-h-[400px] sm:max-h-[500px] overflow-y-auto overflow-x-hidden p-1 animate-in zoom-in-95 duration-200 custom-scrollbar flex flex-col">
                                <div className="p-3 border-b border-stone-100 sticky top-0 bg-white/95 backdrop-blur-md z-10 shrink-0">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">업무 검색</span>
                                        <button
                                            onClick={() => onShowCreateProjectModal()}
                                            className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                                        >
                                            <Plus size={12} />
                                            <span>신규 업무 등록</span>
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={projectSearchTerm}
                                            onChange={(e) => onProjectSearchChange(e.target.value)}
                                            placeholder="예: 호연테크"
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>

                                <div className="mt-1 pb-2 flex flex-col">
                                    <button
                                        onClick={() => {
                                            onUpdateJob(index, 'projectId', null);
                                            onProjectSearchChange('');
                                        }}
                                        className="w-full text-left px-5 py-3 text-sm font-medium text-slate-400 hover:bg-stone-50 hover:text-slate-600 transition-colors rounded-xl mb-1"
                                    >
                                        - 선택 취소 (업무 없음)
                                    </button>

                                    {filteredProjects.map((p, pIdx) => (
                                        <button
                                            key={`project-${p.id}-${pIdx}`}
                                            onClick={() => {
                                                onUpdateJob(index, 'projectId', p.id);
                                                onProjectSearchChange('');
                                            }}
                                            className={`w-full text-left px-5 py-4 text-[15px] font-bold transition-all border-b border-stone-100 last:border-0 hover:bg-indigo-50/50 ${job.projectId === p.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:text-indigo-600'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start overflow-hidden w-full">
                                                    <span className="text-indigo-300 mr-2 font-mono text-[10px] mt-1 shrink-0">{pIdx + 1}.</span>
                                                    <span className="break-all whitespace-pre-wrap leading-snug text-left select-none text-[15px]">
                                                        {p.clientName ? `${p.clientName} : ${p.projectName}` : (p.projectName || `업무 #${p.id}`)}
                                                    </span>
                                                </div>
                                                {job.projectId === p.id && <Check size={14} className="text-indigo-500 shrink-0 ml-2 mt-1" />}
                                            </div>
                                        </button>
                                    ))}

                                    {matchingCount === 0 && projectSearchTerm.trim() !== '' && (
                                        <div className="px-5 py-12 text-center">
                                            <Briefcase size={32} className="mx-auto text-stone-200 mb-3" />
                                            <p className="text-sm text-slate-400 mb-4">&quot;{projectSearchTerm}&quot; 결과가 없습니다.</p>
                                            <button
                                                onClick={() => onShowCreateProjectModal(projectSearchTerm)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-indigo-200"
                                            >
                                                &apos;{projectSearchTerm}&apos;(으)로 새 업무 등록
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onUpdateJob(index, 'isIssue', !job.isIssue)}
                        className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all ${job.isIssue
                            ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm'
                            : 'bg-white border-stone-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50/50'}`}
                        title={job.isIssue ? "이슈 해제" : "이슈/블로커로 표시"}
                    >
                        <AlertTriangle size={16} />
                        <span className="text-xs font-bold">이슈</span>
                    </button>
                </div>

                <button
                    onClick={() => onDeleteJob(index)}
                    className="hidden sm:block text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 no-print px-2"
                    title="업무 삭제"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="flex flex-col space-y-2">
                <div className="flex space-x-3 items-start">
                    <textarea
                        id={`job-title-${index}`}
                        value={getJobDisplayTitle(job)}
                        onChange={(e) => {
                            onUpdateJob(index, 'title', e.target.value);
                            handleResizeHeight(e);
                        }}
                        placeholder="업무 제목을 입력하세요"
                        rows={1}
                        className={`flex-1 bg-stone-50 border rounded-xl px-3 py-2.5 sm:px-5 sm:py-3.5 text-sm sm:text-base text-slate-800 font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 overflow-hidden resize-none min-h-[44px] sm:min-h-[50px] whitespace-pre-wrap break-words ${isLineExceeded(job.title) ? 'border-rose-300 ring-2 ring-rose-100' : 'border-stone-200'}`}
                        style={{ height: 'auto' }}
                    />
                    {job.title && job.projectId && job.isCustomTitle && (
                        <button
                            onClick={() => onConfirmTitleEdit(index)}
                            className="h-[50px] px-5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition-all whitespace-nowrap animate-in fade-in slide-in-from-left-2 shrink-0 flex items-center justify-center no-print"
                        >
                            수정
                        </button>
                    )}
                </div>
                {isLineExceeded(job.title) && (
                    <p className="text-[11px] text-rose-500 font-bold ml-2 animate-pulse flex items-center space-x-1">
                        <AlertTriangle size={12} />
                        <span>1줄에 20자 이상 입력은 불가합니다. 다음줄에 입력하세요</span>
                    </p>
                )}
            </div>

            <div className="flex flex-col space-y-2">
                <textarea
                    value={job.content}
                    onChange={(e) => onUpdateJob(index, 'content', e.target.value)}
                    placeholder="상세 업무 내용을 기록하세요"
                    rows={4}
                    className={`w-full bg-stone-50 border rounded-xl px-3 py-3 sm:px-5 sm:py-4 text-sm sm:text-base text-slate-700 font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none transition-all placeholder:text-slate-400 leading-relaxed whitespace-pre-wrap break-words ${isLineExceeded(job.content) ? 'border-rose-300 ring-2 ring-rose-100' : 'border-stone-200'}`}
                ></textarea>
                {isLineExceeded(job.content) && (
                    <p className="text-[11px] text-rose-500 font-bold ml-2 animate-pulse flex items-center space-x-1">
                        <AlertTriangle size={12} />
                        <span>1줄에 20자 이상 입력은 불가합니다. 다음줄에 입력하세요</span>
                    </p>
                )}
            </div>
        </div>
    );
}
