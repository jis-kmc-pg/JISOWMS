'use client';

import React from 'react';
import Link from 'next/link';
import { Megaphone, ExternalLink, Pin, ChevronRight } from 'lucide-react';

interface NoticeItem {
    id?: number | string;
    title: string;
    createdAt: string;
    author?: string;
    isPinned?: boolean;
    isNew?: boolean;
    category?: string;
    viewCount?: number;
}

interface RecentNoticesWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function isNewPost(dateStr: string) {
    const posted = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - posted.getTime()) / (1000 * 60 * 60);
    return diffHours < 48; // 48시간 이내
}

function timeAgo(dateStr: string) {
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
    return new Date(dateStr).toLocaleDateString('ko-KR');
}

function getCategoryBadge(category?: string) {
    if (!category) return null;
    const map: Record<string, { bg: string; text: string }> = {
        '중요': { bg: 'bg-rose-50', text: 'text-rose-600' },
        '긴급': { bg: 'bg-red-50', text: 'text-red-600' },
        '일반': { bg: 'bg-slate-50', text: 'text-slate-500' },
        '인사': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
        '총무': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    };
    return map[category] || { bg: 'bg-slate-50', text: 'text-slate-500' };
}

export default function RecentNoticesWidget({ data, size }: RecentNoticesWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const maxItems = isSmall ? 4 : isLarge ? 8 : 5;
    const allItems: NoticeItem[] = Array.isArray(data) ? data : (data?.data || data?.items || data?.posts || []);
    const items = allItems.slice(0, maxItems);
    const remainingCount = allItems.length - items.length;

    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-rose-50">
                        <Megaphone size={14} className="text-rose-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">최근 공지사항</h4>
                </div>
                {!isSmall && (
                    <Link
                        href="/board/notice"
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-bold transition-colors group/link"
                    >
                        <span>전체보기</span>
                        <ExternalLink size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                )}
            </div>

            {/* 공지 카드 리스트 */}
            {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="p-3 rounded-2xl bg-slate-50 mb-2">
                        <Megaphone size={24} className="text-slate-200" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">공지사항이 없습니다</p>
                </div>
            ) : isSmall ? (
                /* Small: 제목 + 날짜만, 컴팩트 */
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-1.5">
                    {items.map((item, idx) => {
                        const isNew = item.isNew || isNewPost(item.createdAt);

                        return (
                            <div
                                key={item.id || idx}
                                className={`
                                    flex items-center gap-2 p-2 rounded-lg border transition-all duration-200
                                    hover:shadow-sm cursor-default
                                    ${isNew
                                        ? 'bg-indigo-50/30 border-indigo-100/50'
                                        : 'bg-stone-50/30 border-stone-100'
                                    }
                                `}
                            >
                                {item.isPinned && (
                                    <Pin size={10} className="text-amber-500 rotate-45 flex-shrink-0" />
                                )}
                                {isNew && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded bg-indigo-500 text-white text-[7px] font-black uppercase tracking-wider flex-shrink-0">
                                        N
                                    </span>
                                )}
                                <span className={`text-xs font-bold truncate flex-1 ${isNew ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {item.title}
                                </span>
                                <span className="text-[9px] font-medium text-slate-400 tabular-nums flex-shrink-0">
                                    {timeAgo(item.createdAt)}
                                </span>
                            </div>
                        );
                    })}
                    {remainingCount > 0 && (
                        <p className="text-[10px] text-slate-400 font-medium text-center">+{remainingCount}건 더보기</p>
                    )}
                </div>
            ) : (
                /* Medium/Large: 컴팩트 리스트 */
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-1.5">
                    {items.map((item, idx) => {
                        const isNew = item.isNew || isNewPost(item.createdAt);
                        const catBadge = getCategoryBadge(item.category);

                        return (
                            <div
                                key={item.id || idx}
                                className={`
                                    group/card p-2.5 rounded-xl border transition-all duration-200
                                    hover:shadow-md cursor-default
                                    ${isNew
                                        ? 'bg-gradient-to-r from-indigo-50/30 to-white border-indigo-100/50 hover:border-indigo-200'
                                        : 'bg-stone-50/30 border-stone-100 hover:border-stone-200 hover:bg-stone-50'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    {/* 순번/고정 아이콘 */}
                                    <div className={`
                                        w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0
                                        ${item.isPinned
                                            ? 'bg-amber-50 text-amber-500'
                                            : isNew
                                                ? 'bg-indigo-50 text-indigo-500'
                                                : 'bg-stone-100 text-stone-400'
                                        }
                                    `}>
                                        {item.isPinned ? (
                                            <Pin size={11} className="rotate-45" />
                                        ) : (
                                            <span className="text-[10px] font-black">{idx + 1}</span>
                                        )}
                                    </div>

                                    {/* 내용 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {isNew && (
                                                <span className="inline-flex items-center px-1 py-0.5 rounded-md bg-indigo-500 text-white text-[7px] font-black uppercase tracking-wider animate-pulse flex-shrink-0" style={{ animationDuration: '3s' }}>
                                                    NEW
                                                </span>
                                            )}
                                            {catBadge && (
                                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded-md ${catBadge.bg} ${catBadge.text} flex-shrink-0`}>
                                                    {item.category}
                                                </span>
                                            )}
                                            <p className={`
                                                text-xs font-bold truncate leading-snug
                                                ${isNew ? 'text-slate-800' : 'text-slate-600'}
                                                group-hover/card:text-indigo-600 transition-colors
                                            `}>
                                                {item.title}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                            <span className="font-medium tabular-nums">{timeAgo(item.createdAt)}</span>
                                            {item.author && (
                                                <>
                                                    <span className="text-slate-200">|</span>
                                                    <span className="font-medium">{item.author}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight
                                        size={14}
                                        className="text-slate-200 flex-shrink-0 group-hover/card:text-indigo-400 group-hover/card:translate-x-0.5 transition-all"
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {remainingCount > 0 && (
                        <p className="text-[10px] text-slate-400 font-medium text-center py-0.5">+{remainingCount}건 더보기</p>
                    )}
                </div>
            )}
        </div>
    );
}
