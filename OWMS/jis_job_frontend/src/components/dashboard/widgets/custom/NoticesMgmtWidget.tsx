'use client';

import React from 'react';
import { Megaphone, Plus, ChevronRight, Clock, Eye } from 'lucide-react';

interface Notice {
    id: number;
    title: string;
    createdAt: string;
    author?: string;
    pinned?: boolean;
    viewCount?: number;
}

interface NoticesMgmtWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function timeAgo(dateStr: string) {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffD > 7) {
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }
    if (diffD > 0) return `${diffD}일 전`;
    if (diffH > 0) return `${diffH}시간 전`;
    if (diffMin > 0) return `${diffMin}분 전`;
    return '방금';
}

export default function NoticesMgmtWidget({ data, size }: NoticesMgmtWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const notices: Notice[] = Array.isArray(data) ? data : (data?.data || data?.items || data?.posts || []);
    const displayCount = isSmall ? 0 : isLarge ? 7 : 5;
    const displayNotices = notices.slice(0, displayCount);

    // Small: 공지 개수 + 최신 공지 제목 1줄
    if (isSmall) {
        const latestNotice = notices.length > 0 ? notices[0] : null;
        return (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-sm flex-shrink-0">
                        <Megaphone size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">공지사항</p>
                            <span className="text-xs font-black text-indigo-600 tabular-nums">{notices.length}건</span>
                        </div>
                        {latestNotice ? (
                            <p className="text-sm font-bold text-slate-700 truncate mt-0.5">
                                {latestNotice.title}
                            </p>
                        ) : (
                            <p className="text-sm text-slate-400 mt-0.5">공지사항이 없습니다</p>
                        )}
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
                    <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                        <Megaphone size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">공지사항</h4>
                </div>
                <button className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100">
                    <Plus size={10} className="text-indigo-600" />
                    <span className="text-[9px] font-black text-indigo-600 uppercase">작성</span>
                </button>
            </div>

            {/* 공지사항 리스트 */}
            <div className="flex-1 min-h-0 overflow-auto space-y-1">
                {displayNotices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <Megaphone size={20} className="text-slate-200 mb-1.5" />
                        <p className="text-xs text-slate-400 font-medium">공지사항이 없습니다</p>
                    </div>
                ) : (
                    displayNotices.map((notice, idx) => (
                        <div
                            key={notice.id || idx}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 transition-all duration-200 cursor-pointer group/item border border-transparent hover:border-stone-100"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    {notice.pinned && (
                                        <span className="px-1 py-0.5 bg-rose-50 text-rose-500 rounded text-[8px] font-black border border-rose-100">
                                            고정
                                        </span>
                                    )}
                                    <p className="text-xs font-bold text-slate-700 truncate group-hover/item:text-indigo-600 transition-colors">
                                        {notice.title}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Clock size={9} className="text-slate-300" />
                                    <span className="text-[9px] text-slate-400 font-medium">
                                        {timeAgo(notice.createdAt)}
                                    </span>
                                    {notice.author && (
                                        <>
                                            <span className="text-slate-200">|</span>
                                            <span className="text-[9px] text-slate-400 font-medium">{notice.author}</span>
                                        </>
                                    )}
                                    {isLarge && notice.viewCount !== undefined && (
                                        <>
                                            <span className="text-slate-200">|</span>
                                            <Eye size={9} className="text-slate-300" />
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                {notice.viewCount}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={12} className="text-slate-300 group-hover/item:text-slate-500 transition-colors flex-shrink-0" />
                        </div>
                    ))
                )}
            </div>

            {/* 더보기 */}
            {notices.length > displayCount && (
                <div className="pt-1.5 border-t border-stone-100 mt-1">
                    <button className="w-full text-center text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors">
                        전체 보기
                    </button>
                </div>
            )}
        </div>
    );
}
