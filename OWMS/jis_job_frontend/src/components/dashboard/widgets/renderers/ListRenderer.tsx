'use client';

import React from 'react';
import Link from 'next/link';
import { Inbox } from 'lucide-react';

interface ColumnDef {
    key: string;
    label: string;
    format?: string;
}

interface ListConfig {
    columns: ColumnDef[];
    emptyMessage?: string;
    maxItems?: number;
    linkTo?: string;
}

interface ListRendererProps {
    title: string;
    config: ListConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/** 상대 시간 표시: 오늘, 내일, 어제, N일 전/후 */
function getRelativeDate(dateStr: string): string {
    const target = new Date(dateStr);
    const now = new Date();
    // 날짜만 비교 (시간 제거)
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = targetDay.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === -1) return '어제';
    if (diffDays > 1 && diffDays <= 7) return `${diffDays}일 후`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}일 전`;
    return new Date(dateStr).toLocaleDateString('ko-KR');
}

/** 상태별 뱃지 색상 */
function getStatusBadge(value: string): { bg: string; text: string; dot: string } {
    const upper = String(value).toUpperCase();
    const statusMap: Record<string, { bg: string; text: string; dot: string }> = {
        APPROVED: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        DONE: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        PENDING: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700', dot: 'bg-amber-500' },
        WAITING: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700', dot: 'bg-amber-500' },
        IN_PROGRESS: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700', dot: 'bg-blue-500' },
        CANCELLED: { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700', dot: 'bg-rose-500' },
        REJECTED: { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700', dot: 'bg-rose-500' },
        OVERDUE: { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700', dot: 'bg-rose-500' },
    };
    return statusMap[upper] || { bg: 'bg-slate-50 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' };
}

/** 상태 값인지 판별 */
function isStatusValue(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const statusKeys = ['APPROVED', 'COMPLETED', 'DONE', 'PENDING', 'WAITING', 'IN_PROGRESS', 'CANCELLED', 'REJECTED', 'OVERDUE'];
    return statusKeys.includes(value.toUpperCase());
}

function formatValue(value: unknown, format?: string): React.ReactNode {
    if (value === null || value === undefined) return <span className="text-slate-300 dark:text-slate-500">-</span>;

    // 날짜: 상대 시간 표시
    if ((format === 'date' || format === 'datetime') && typeof value === 'string') {
        const relative = getRelativeDate(value);
        const isToday = relative === '오늘';
        const isSoon = relative === '내일' || relative.includes('일 후');
        return (
            <span className={`text-xs font-semibold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : isSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {relative}
            </span>
        );
    }

    // 상태값: 뱃지
    if (isStatusValue(value)) {
        const badge = getStatusBadge(String(value));
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {String(value)}
            </span>
        );
    }

    return String(value);
}

export default function ListRenderer({ title, config, data }: ListRendererProps) {
    const items = config.maxItems ? data.slice(0, config.maxItems) : data;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h4>
                {config.linkTo && (
                    <Link href={config.linkTo} className="text-xs text-indigo-500 hover:text-indigo-700 font-bold transition-colors">
                        더보기 &rarr;
                    </Link>
                )}
            </div>

            {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-stone-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                        <Inbox size={28} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-400 font-medium">
                        {config.emptyMessage || '데이터가 없습니다.'}
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar space-y-2">
                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            className="group p-3.5 rounded-xl border border-stone-100 dark:border-slate-700 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50/30 dark:hover:from-indigo-900/20 hover:to-transparent transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                {/* 순번 */}
                                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 text-xs font-bold flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-colors">
                                    {idx + 1}
                                </span>

                                {/* 컨텐츠 */}
                                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1">
                                    {config.columns.map((col, colIdx) => {
                                        const rawValue = getNestedValue(item, col.key);
                                        const isFirst = colIdx === 0;
                                        return (
                                            <div key={col.key} className={`${isFirst ? 'flex-1 min-w-0' : 'flex-shrink-0'}`}>
                                                {isFirst ? (
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                        {formatValue(rawValue, col.format)}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatValue(rawValue, col.format)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
