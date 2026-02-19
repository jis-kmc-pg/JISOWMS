'use client';

import React, { useMemo } from 'react';
import { MessageSquareText, ChevronRight, Newspaper } from 'lucide-react';

interface PostItem {
    id?: number | string;
    title?: string;
    boardName?: string;
    boardType?: string;
    author?: string;
    createdAt?: string;
    category?: string;
    commentCount?: number;
}

interface BoardLatestWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

const BOARD_COLORS: Record<string, { bg: string; text: string }> = {
    '공지사항': { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    '공지': { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    'notice': { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    '자유게시판': { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
    '자유': { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
    'free': { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
    '질문': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    'qna': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    '건의': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    'suggestion': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    '업무': { bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
    'work': { bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
    '정보공유': { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    'info': { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
};

const DEFAULT_BOARD_COLORS = [
    { bg: 'bg-slate-50 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300' },
    { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
    { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
    { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
    { bg: 'bg-pink-50 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
];

function getBoardColor(boardName?: string, index?: number): { bg: string; text: string } {
    if (boardName) {
        const key = boardName.toLowerCase();
        for (const [k, v] of Object.entries(BOARD_COLORS)) {
            if (key.includes(k.toLowerCase()) || k.toLowerCase().includes(key)) {
                return v;
            }
        }
    }
    return DEFAULT_BOARD_COLORS[(index ?? 0) % DEFAULT_BOARD_COLORS.length];
}

function isNewPost(dateStr?: string): boolean {
    if (!dateStr) return false;
    try {
        const posted = new Date(dateStr);
        const now = new Date();
        const diffHours = (now.getTime() - posted.getTime()) / (1000 * 60 * 60);
        return diffHours < 24;
    } catch {
        return false;
    }
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    try {
        const posted = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - posted.getTime();
        const diffMin = Math.floor(diffMs / (1000 * 60));
        const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMin < 1) return '방금';
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay < 7) return `${diffDay}일 전`;
        return posted.toLocaleDateString('ko-KR');
    } catch {
        return dateStr;
    }
}

export default function BoardLatestWidget({ data, size }: BoardLatestWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const maxItems = isSmall ? 4 : isLarge ? 8 : 5;

    const allItems: PostItem[] = useMemo(() => {
        const raw = Array.isArray(data)
            ? data
            : (data?.data || data?.items || data?.posts || []);
        return raw as PostItem[];
    }, [data]);

    const items = useMemo(() => allItems.slice(0, maxItems), [allItems, maxItems]);
    const remainingCount = allItems.length - items.length;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/30">
                        <Newspaper size={14} className="text-cyan-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">게시판 최신글</h4>
                </div>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-wider">
                    {allItems.length}건
                </span>
            </div>

            {/* 리스트 */}
            {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 mb-2">
                        <MessageSquareText size={24} className="text-slate-200" />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">최신 게시글이 없습니다</p>
                </div>
            ) : isSmall ? (
                /* Small: 한 줄에 제목 + 시간만 */
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-1.5">
                    {items.map((item, idx) => {
                        const isNew = isNewPost(item.createdAt);
                        const boardColor = getBoardColor(item.boardName || item.boardType, idx);

                        return (
                            <div
                                key={item.id ?? idx}
                                className={`
                                    flex items-center gap-2 p-2 rounded-lg border transition-all duration-200
                                    hover:shadow-sm cursor-default
                                    ${isNew
                                        ? 'bg-indigo-50/30 dark:bg-indigo-900/20 border-indigo-100/50 dark:border-indigo-800/30'
                                        : 'bg-stone-50/30 dark:bg-slate-700/30 border-stone-100 dark:border-slate-600/50'
                                    }
                                `}
                            >
                                {(item.boardName || item.boardType) && (
                                    <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${boardColor.bg} ${boardColor.text} flex-shrink-0`}>
                                        {item.boardName || item.boardType}
                                    </span>
                                )}
                                <span className={`text-xs font-bold truncate flex-1 ${isNew ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {item.title || '(제목 없음)'}
                                    {item.commentCount !== undefined && item.commentCount > 0 && (
                                        <span className="text-indigo-400 text-[10px] font-bold ml-0.5">[{item.commentCount}]</span>
                                    )}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 tabular-nums flex-shrink-0">
                                    {timeAgo(item.createdAt)}
                                </span>
                            </div>
                        );
                    })}
                    {remainingCount > 0 && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium text-center">+{remainingCount}건 더보기</p>
                    )}
                </div>
            ) : (
                /* Medium/Large: 컴팩트 카드 리스트 */
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-1.5">
                    {items.map((item, idx) => {
                        const isNew = isNewPost(item.createdAt);
                        const boardColor = getBoardColor(item.boardName || item.boardType, idx);

                        return (
                            <div
                                key={item.id ?? idx}
                                className={`
                                    group/card p-2.5 rounded-xl border transition-all duration-200
                                    hover:shadow-md cursor-default
                                    ${isNew
                                        ? 'bg-gradient-to-r from-indigo-50/30 dark:from-indigo-900/20 to-white dark:to-slate-800 border-indigo-100/50 dark:border-indigo-800/30 hover:border-indigo-200 dark:hover:border-indigo-700'
                                        : 'bg-stone-50/30 dark:bg-slate-700/30 border-stone-100 dark:border-slate-600/50 hover:border-stone-200 dark:hover:border-slate-500 hover:bg-stone-50 dark:hover:bg-slate-700/50'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    {/* 순번 */}
                                    <div className={`
                                        w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0
                                        ${isNew ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500' : 'bg-stone-100 dark:bg-slate-700 text-stone-400 dark:text-slate-400'}
                                    `}>
                                        <span className="text-[10px] font-black">{idx + 1}</span>
                                    </div>

                                    {/* 콘텐츠 */}
                                    <div className="flex-1 min-w-0">
                                        {/* 뱃지 + 제목 한 줄 */}
                                        <div className="flex items-center gap-1.5">
                                            {(item.boardName || item.boardType) && (
                                                <span className={`text-[10px] font-bold px-1 py-0.5 rounded-md ${boardColor.bg} ${boardColor.text} flex-shrink-0`}>
                                                    {item.boardName || item.boardType}
                                                </span>
                                            )}
                                            {isNew && (
                                                <span
                                                    className="inline-flex items-center px-1 py-0.5 rounded-md bg-indigo-500 text-white text-[7px] font-black uppercase tracking-wider animate-pulse flex-shrink-0"
                                                    style={{ animationDuration: '3s' }}
                                                >
                                                    새 글
                                                </span>
                                            )}
                                            <p className={`
                                                text-xs font-bold truncate leading-snug
                                                ${isNew ? 'text-slate-800' : 'text-slate-600'}
                                                group-hover/card:text-indigo-600 transition-colors
                                            `}>
                                                {item.title || '(제목 없음)'}
                                                {item.commentCount !== undefined && item.commentCount > 0 && (
                                                    <span className="text-indigo-400 text-[10px] font-bold ml-0.5">
                                                        [{item.commentCount}]
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* 메타: 작성자, 시간 */}
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 dark:text-slate-400">
                                            {item.author && (
                                                <span className="font-medium">{item.author}</span>
                                            )}
                                            {item.author && item.createdAt && (
                                                <span className="text-slate-200">|</span>
                                            )}
                                            {item.createdAt && (
                                                <span className="font-medium tabular-nums">{timeAgo(item.createdAt)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 화살표 */}
                                    <ChevronRight
                                        size={14}
                                        className="text-slate-200 flex-shrink-0 group-hover/card:text-indigo-400 group-hover/card:translate-x-0.5 transition-all"
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {remainingCount > 0 && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium text-center py-0.5">+{remainingCount}건 더보기</p>
                    )}
                </div>
            )}
        </div>
    );
}
