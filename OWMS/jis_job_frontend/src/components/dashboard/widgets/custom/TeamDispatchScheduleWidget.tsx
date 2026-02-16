'use client';

import React from 'react';
import { Car, MapPin, User, Clock } from 'lucide-react';

interface DispatchItem {
    id?: string | number;
    user?: { name: string } | string;
    vehicle?: { plateNumber: string; type?: string } | string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    purpose?: string;
    date?: string;
}

interface TeamDispatchScheduleWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금'];

function getStatusStyle(status?: string) {
    switch (status?.toUpperCase()) {
        case 'APPROVED':
        case '승인':
            return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        case 'PENDING':
        case '대기':
            return 'bg-amber-50 text-amber-600 border-amber-200';
        case 'REJECTED':
        case '반려':
            return 'bg-rose-50 text-rose-600 border-rose-200';
        case 'COMPLETED':
        case '완료':
            return 'bg-slate-50 text-slate-500 border-slate-200';
        case 'IN_PROGRESS':
        case '진행':
            return 'bg-blue-50 text-blue-600 border-blue-200';
        default:
            return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    }
}

function getUserName(user?: { name: string } | string): string {
    if (!user) return '미지정';
    if (typeof user === 'string') return user;
    return user.name ?? '미지정';
}

function getPlate(vehicle?: { plateNumber: string; type?: string } | string): string {
    if (!vehicle) return '';
    if (typeof vehicle === 'string') return vehicle;
    return vehicle.plateNumber ?? '';
}

function getWeekDates(): Date[] {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

function formatDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function TeamDispatchScheduleWidget({ data, size }: TeamDispatchScheduleWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const dispatches: DispatchItem[] = Array.isArray(data)
        ? data
        : (data?.data ?? data?.items ?? data?.dispatches ?? []);

    const weekDates = getWeekDates();

    // 요일별 배차 분류
    const byDay: Map<string, DispatchItem[]> = new Map();
    weekDates.forEach(d => byDay.set(formatDateKey(d), []));

    dispatches.forEach(item => {
        const dateStr = item.date ?? item.startDate;
        if (!dateStr) return;
        const key = dateStr.slice(0, 10); // YYYY-MM-DD
        if (byDay.has(key)) {
            byDay.get(key)!.push(item);
        }
    });

    const totalCount = dispatches.length;
    const todayKey = formatDateKey(new Date());
    const todayItems = byDay.get(todayKey) ?? [];

    // ── Small: 오늘 배차 건수 + 다음 배차 정보만 ──
    if (isSmall) {
        const nextDispatch = todayItems.find(item => {
            if (!item.startDate) return false;
            return new Date(item.startDate) >= new Date();
        }) ?? todayItems[0];

        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Car size={14} className="text-indigo-500" />
                        배차 일정
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                        오늘 {todayItems.length}건
                    </span>
                </div>

                <div className="flex-1 min-h-0 flex flex-col justify-center">
                    {todayItems.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium text-center">
                            오늘 배차 없음
                        </p>
                    ) : nextDispatch ? (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <User size={11} className="text-indigo-400 flex-shrink-0" />
                                <span className="text-xs font-bold text-slate-700 truncate">
                                    {getUserName(nextDispatch.user)}
                                </span>
                            </div>
                            {nextDispatch.destination && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                                    <span className="text-[11px] text-slate-500 truncate">
                                        {nextDispatch.destination}
                                    </span>
                                </div>
                            )}
                            {nextDispatch.startDate && (
                                <div className="flex items-center gap-1.5">
                                    <Clock size={11} className="text-slate-400 flex-shrink-0" />
                                    <span className="text-[11px] font-bold text-indigo-500">
                                        {formatTime(nextDispatch.startDate)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    // ── Medium: 컴팩트 스케줄 리스트 (max 5 items) ──
    if (!isLarge) {
        // Flatten all items with day labels, max 5
        const allItems: { dayLabel: string; date: Date; item: DispatchItem; isToday: boolean }[] = [];
        weekDates.forEach((date, idx) => {
            const key = formatDateKey(date);
            const items = byDay.get(key) ?? [];
            const isToday = todayKey === key;
            items.forEach(item => {
                allItems.push({ dayLabel: WEEKDAY_LABELS[idx], date, item, isToday });
            });
        });
        const displayItems = allItems.slice(0, 5);
        const moreCount = allItems.length - displayItems.length;

        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Car size={14} className="text-indigo-500" />
                        팀 배차 일정
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                        이번 주 {totalCount}건
                    </span>
                </div>

                {totalCount === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 font-medium text-center">
                            이번 주 배차 일정이 없습니다
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto space-y-1">
                        {displayItems.map(({ dayLabel, date, item, isToday }, idx) => (
                            <div
                                key={item.id ?? idx}
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-50/70 rounded-lg border border-stone-100"
                            >
                                <span className={`text-[10px] font-black w-8 flex-shrink-0 ${isToday ? 'text-indigo-500' : 'text-slate-400'}`}>
                                    {dayLabel} {date.getDate()}
                                </span>
                                <User size={10} className="text-indigo-400 flex-shrink-0" />
                                <span className="text-xs font-bold text-slate-700 truncate flex-1">
                                    {getUserName(item.user)}
                                </span>
                                {item.destination && (
                                    <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                                        {item.destination}
                                    </span>
                                )}
                                {item.startDate && (
                                    <span className="text-[10px] font-bold text-indigo-500 flex-shrink-0">
                                        {formatTime(item.startDate)}
                                    </span>
                                )}
                            </div>
                        ))}
                        {moreCount > 0 && (
                            <p className="text-[10px] text-slate-400 font-bold text-center">+{moreCount}건 더</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ── Large: 주간 그리드 뷰 (compact) ──
    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Car size={14} className="text-indigo-500" />
                    팀 배차 일정
                </h4>
                <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-0.5 rounded-md">
                    이번 주 {totalCount}건
                </span>
            </div>

            {totalCount === 0 ? (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-xs text-slate-400 font-medium text-center">
                        이번 주 배차 일정이 없습니다
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-auto">
                    {/* 주간 그리드 */}
                    <div className="grid grid-cols-5 gap-1.5">
                        {weekDates.map((date, idx) => {
                            const key = formatDateKey(date);
                            const items = byDay.get(key) ?? [];
                            const isToday = todayKey === key;
                            const displayItems = items.slice(0, 4);
                            const moreCount = items.length - displayItems.length;

                            return (
                                <div key={key} className="flex flex-col min-w-0">
                                    {/* 요일 헤더 */}
                                    <div className={`text-center py-1 rounded-lg mb-1 ${
                                        isToday
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-stone-50 text-slate-500'
                                    }`}>
                                        <p className={`text-[10px] font-black ${isToday ? 'text-white' : 'text-slate-500'}`}>
                                            {WEEKDAY_LABELS[idx]}
                                        </p>
                                        <p className={`text-[9px] font-bold ${isToday ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {date.getMonth() + 1}/{date.getDate()}
                                        </p>
                                    </div>

                                    {/* 배차 카드 */}
                                    <div className="space-y-1 flex-1">
                                        {items.length === 0 ? (
                                            <div className="text-center py-2">
                                                <p className="text-[9px] text-slate-300 font-medium">없음</p>
                                            </div>
                                        ) : (
                                            <>
                                                {displayItems.map((item, iIdx) => (
                                                    <div
                                                        key={item.id ?? iIdx}
                                                        className="p-1.5 bg-stone-50/70 rounded-lg border border-stone-100 hover:bg-white transition-all"
                                                    >
                                                        <div className="flex items-center gap-1 mb-0.5">
                                                            <User size={9} className="text-indigo-400 flex-shrink-0" />
                                                            <span className="text-[10px] font-bold text-slate-700 truncate">
                                                                {getUserName(item.user)}
                                                            </span>
                                                        </div>
                                                        {item.destination && (
                                                            <div className="flex items-center gap-1">
                                                                <MapPin size={8} className="text-slate-400 flex-shrink-0" />
                                                                <span className="text-[9px] text-slate-500 truncate">
                                                                    {item.destination}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.startDate && (
                                                            <span className="text-[9px] font-bold text-indigo-500">
                                                                {formatTime(item.startDate)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                                {moreCount > 0 && (
                                                    <p className="text-[9px] text-slate-400 font-bold text-center">+{moreCount}</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
