'use client';

import React from 'react';
import { Search, Copy, MessageSquare, Pin, AlertTriangle } from 'lucide-react';
import { SystemMemo, PastJobResult, isWeeklyNoteExceeded } from './types';

interface SidebarProps {
    systemMemos: SystemMemo[];
    searchStartDate: string;
    searchEndDate: string;
    onSearchStartDateChange: (date: string) => void;
    onSearchEndDateChange: (date: string) => void;
    onSearchPastJobs: () => void;
    isSearchingPastJobs: boolean;
    pastJobSearchResults: PastJobResult[];
    onCopyPastJob: (job: PastJobResult) => void;
    onDragStart: (e: React.DragEvent, job: PastJobResult) => void;
    weeklyNote: string;
    onWeeklyNoteChange: (note: string) => void;
}

export default function Sidebar({
    systemMemos,
    searchStartDate,
    searchEndDate,
    onSearchStartDateChange,
    onSearchEndDateChange,
    onSearchPastJobs,
    isSearchingPastJobs,
    pastJobSearchResults,
    onCopyPastJob,
    onDragStart,
    weeklyNote,
    onWeeklyNoteChange,
}: SidebarProps) {
    const handleResizeHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const target = e.target;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
    };

    return (
        <div className="lg:col-span-1 space-y-6 sm:space-y-8 lg:sticky lg:top-8 self-start">
            {/* System Memos */}
            {systemMemos.length > 0 ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center space-x-2 px-1">
                        <div className="w-1.5 h-6 bg-amber-400 rounded-full" />
                        <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center">
                            <MessageSquare size={16} className="mr-2 text-amber-500" />
                            시스템 메모 & 알림
                        </h3>
                    </div>
                    <div className="flex flex-col space-y-3">
                        {systemMemos.map((memo) => (
                            <div
                                key={`side-memo-${memo.id}`}
                                className="relative group bg-gradient-to-br from-amber-50/80 to-orange-50/30 border border-amber-100/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                            >
                                <Pin size={12} className="absolute top-3 right-3 text-amber-300 rotate-45" />
                                <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap pr-4">
                                    {memo.content}
                                </p>
                                <div className="flex justify-end mt-2 pt-2 border-t border-amber-100/20">
                                    <span className="text-[9px] font-mono text-amber-500/60">
                                        {new Date(memo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="hidden lg:flex flex-col items-center justify-center p-8 border border-stone-100 bg-stone-50/50 rounded-[2rem] text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-stone-200">
                        <MessageSquare size={20} />
                    </div>
                    <p className="text-xs font-bold text-stone-300">메모가 없습니다.</p>
                </div>
            )}

            {/* Past Task Search */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2">
                    <Search size={16} className="text-indigo-500" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-800">과거 업무 검색 (기간)</h4>
                </div>

                <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 mb-1 block pl-1">시작일</label>
                            <input
                                type="date"
                                value={searchStartDate}
                                onChange={(e) => onSearchStartDateChange(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 mb-1 block pl-1">종료일</label>
                            <input
                                type="date"
                                value={searchEndDate}
                                onChange={(e) => onSearchEndDateChange(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={onSearchPastJobs}
                        disabled={isSearchingPastJobs}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 text-xs"
                    >
                        {isSearchingPastJobs ? (
                            <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Search size={14} />
                                <span>기간 내 업무 검색</span>
                            </>
                        )}
                    </button>
                </div>

                {pastJobSearchResults.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {pastJobSearchResults.map((result) => (
                            <div
                                key={`search-result-${result.id}`}
                                className="p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-indigo-200 transition-all group cursor-move hover:shadow-md"
                                draggable={true}
                                onDragStart={(e) => onDragStart(e, result)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                        {new Date(result.jobDate).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => onCopyPastJob(result)}
                                        className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-all bg-white px-2 py-0.5 rounded border border-stone-200 shadow-sm"
                                    >
                                        <Copy size={12} />
                                        <span>복사</span>
                                    </button>
                                </div>
                                <div className="mb-1">
                                    {result.project?.clientName && (
                                        <span className="inline-block bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded mr-1.5 align-middle">
                                            {result.project.clientName}
                                        </span>
                                    )}
                                    <span className="text-xs font-bold text-slate-800 align-middle">
                                        {result.project?.projectName || result.title}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                                    {result.content}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isSearchingPastJobs && (
                        <div className="text-center py-8 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                            <Search size={24} className="mx-auto text-stone-300 mb-2" />
                            <p className="text-[11px] text-slate-400 font-medium">기간을 설정하고 검색해보세요.</p>
                        </div>
                    )
                )}
            </div>

            {/* Weekly Note */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h4 className="text-sm sm:text-base font-bold text-slate-800">주간 정보 사항</h4>
                    <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-2.5 py-1 rounded-full font-bold uppercase">주간 공통</span>
                </div>
                <textarea
                    id="weekly-note-textarea"
                    value={weeklyNote}
                    onChange={(e) => {
                        onWeeklyNoteChange(e.target.value);
                        handleResizeHeight(e);
                    }}
                    placeholder="이번 주(일~토) 공용 참고사항을 입력하세요..."
                    rows={1}
                    className={`w-full bg-stone-50 border rounded-xl px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-slate-700 font-medium outline-none transition-all placeholder:text-slate-400 overflow-hidden resize-none focus:bg-white focus:ring-2 focus:ring-violet-100 ${isWeeklyNoteExceeded(weeklyNote) ? 'border-rose-300 ring-2 ring-rose-100 focus:border-rose-400' : 'border-stone-200 focus:border-violet-500'}`}
                ></textarea>
                {isWeeklyNoteExceeded(weeklyNote) && (
                    <p className="text-[11px] text-rose-500 font-bold mt-2 animate-pulse flex items-center space-x-1 ml-1">
                        <AlertTriangle size={12} />
                        <span>주간 정보는 최대 4줄, 한 줄당 40자까지만 입력 가능합니다.</span>
                    </p>
                )}
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed ml-1">
                    * 이 내용은 해당 주의 모든 근무일에 동일하게 공유됩니다.
                </p>
            </div>
        </div>
    );
}
