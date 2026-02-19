'use client';

import React, { useMemo } from 'react';
import { Search, Hash } from 'lucide-react';

interface KeywordItem {
    keyword: string;
    count: number;
}

interface ReportKeywordAnalysisWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

const COLOR_PALETTE = [
    { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/30' },
    { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/30' },
    { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/30' },
    { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/30' },
    { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/30' },
    { bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/30' },
    { bg: 'bg-pink-50 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800/30' },
    { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800/30' },
    { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/30' },
    { bg: 'bg-sky-50 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800/30' },
];

function mapCountToFontSize(count: number, minCount: number, maxCount: number): number {
    const MIN_SIZE = 10;
    const MAX_SIZE = 24;
    if (maxCount === minCount) return (MIN_SIZE + MAX_SIZE) / 2;
    const ratio = (count - minCount) / (maxCount - minCount);
    return Math.round(MIN_SIZE + ratio * (MAX_SIZE - MIN_SIZE));
}

export default function ReportKeywordAnalysisWidget({ data, size }: ReportKeywordAnalysisWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const rawKeywords: KeywordItem[] = data?.keywords ?? data?.data ?? data?.items ?? (Array.isArray(data) ? data : []);
    const totalJobs: number = data?.totalJobs ?? data?.total ?? 0;

    const keywords = useMemo(() => {
        return rawKeywords
            .filter(k => k.keyword && k.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [rawKeywords]);

    const minCount = keywords.length > 0 ? Math.min(...keywords.map(k => k.count)) : 0;
    const maxCount = keywords.length > 0 ? Math.max(...keywords.map(k => k.count)) : 0;

    // 시드 기반 의사 랜덤으로 색상 배정 (키워드 문자열 해시)
    const getColorIndex = (keyword: string): number => {
        let hash = 0;
        for (let i = 0; i < keyword.length; i++) {
            hash = keyword.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % COLOR_PALETTE.length;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-xl">
                        <Search size={14} className="text-violet-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">업무보고 키워드 분석</h4>
                </div>
                {keywords.length > 0 && !isSmall && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/30 rounded-lg border border-violet-100 dark:border-violet-800/30">
                        <Hash size={12} className="text-violet-400" />
                        <span className="text-xs font-black text-violet-600 tabular-nums">{keywords.length}</span>
                        <span className="text-[10px] font-bold text-violet-400">키워드</span>
                    </div>
                )}
            </div>

            {/* Small: 상위 5개 키워드 랭킹 리스트 */}
            {isSmall ? (
                <div className="flex-1 min-h-0 overflow-auto">
                    {keywords.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-4">
                            <Search size={24} className="text-slate-200 dark:text-slate-600 mb-2" />
                            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">키워드 데이터가 없습니다</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {keywords.slice(0, 3).map((item, idx) => {
                                const colorIdx = getColorIndex(item.keyword);
                                const color = COLOR_PALETTE[colorIdx];
                                return (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 w-5 flex-shrink-0">#{idx + 1}</span>
                                        <span className={`text-xs font-bold truncate ${color.text}`}>{item.keyword}</span>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 tabular-nums flex-shrink-0 ml-auto">({item.count})</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Medium / Large: 워드 클라우드 */}
                    <div className="flex-1 min-h-0 overflow-auto">
                        {keywords.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-4">
                                <Search size={24} className="text-slate-200 dark:text-slate-600 mb-2" />
                                <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">키워드 데이터가 없습니다</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 items-center justify-center py-1">
                                {keywords.map((item, idx) => {
                                    const fontSize = mapCountToFontSize(item.count, minCount, maxCount);
                                    const colorIdx = getColorIndex(item.keyword);
                                    const color = COLOR_PALETTE[colorIdx];

                                    return (
                                        <span
                                            key={idx}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border cursor-default transition-all duration-200 hover:scale-105 hover:shadow-sm ${color.bg} ${color.border}`}
                                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
                                            title={`${item.keyword}: ${item.count}회`}
                                        >
                                            <span className={`font-bold ${color.text}`}>
                                                {item.keyword}
                                            </span>
                                            {fontSize >= 16 && (
                                                <span className={`text-[10px] font-black opacity-60 ${color.text}`}>
                                                    {item.count}
                                                </span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </>
            )}
        </div>
    );
}
