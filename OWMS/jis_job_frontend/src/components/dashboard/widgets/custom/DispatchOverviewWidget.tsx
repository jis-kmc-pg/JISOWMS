'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Car, MapPin, Clock, ExternalLink, Navigation, Truck, Bus, ChevronRight } from 'lucide-react';

interface DispatchItem {
    id?: number | string;
    user?: { name?: string; id?: number | string };
    vehicle?: { plateNumber?: string; name?: string; type?: string };
    destination?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    purpose?: string;
}

interface DispatchOverviewWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function getVehicleIcon(type?: string) {
    if (type?.includes('트럭') || type?.includes('화물')) return Truck;
    if (type?.includes('버스') || type?.includes('밴')) return Bus;
    return Car;
}

function getStatusInfo(status?: string) {
    const s = status?.toLowerCase();
    if (s === 'confirmed' || s === '확정' || s === 'approved') {
        return { label: '확정', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' };
    }
    if (s === 'pending' || s === '대기' || s === 'requested') {
        return { label: '대기', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' };
    }
    if (s === 'in_progress' || s === '운행중' || s === 'active') {
        return { label: '운행중', bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-400' };
    }
    if (s === 'completed' || s === '완료') {
        return { label: '완료', bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' };
    }
    if (s === 'rejected' || s === '반려') {
        return { label: '반려', bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400' };
    }
    return { label: status || '예정', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };
}

function formatDateRange(start?: string, end?: string): string {
    if (!start) return '';
    try {
        const s = new Date(start);
        const sMonth = s.getMonth() + 1;
        const sDay = s.getDate();
        const sTime = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}`;

        if (!end) return `${sMonth}/${sDay} ${sTime}`;

        const e = new Date(end);
        const eMonth = e.getMonth() + 1;
        const eDay = e.getDate();
        const eTime = `${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')}`;

        if (sMonth === eMonth && sDay === eDay) {
            return `${sMonth}/${sDay} ${sTime} ~ ${eTime}`;
        }
        return `${sMonth}/${sDay} ${sTime} ~ ${eMonth}/${eDay} ${eTime}`;
    } catch {
        return start;
    }
}

function getCurrentUserName(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const user = JSON.parse(stored);
            return user?.name ?? user?.username ?? null;
        }
        return null;
    } catch {
        return null;
    }
}

function getCurrentUserId(): string | number | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const user = JSON.parse(stored);
            return user?.id ?? null;
        }
        return null;
    } catch {
        return null;
    }
}

export default function DispatchOverviewWidget({ data, size }: DispatchOverviewWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const maxItems = isSmall ? 3 : isLarge ? 8 : 5;

    const allItems: DispatchItem[] = useMemo(() => {
        const raw = Array.isArray(data) ? data : (data?.data || data?.items || data?.dispatches || []);
        return raw as DispatchItem[];
    }, [data]);

    const items = useMemo(() => allItems.slice(0, maxItems), [allItems, maxItems]);
    const remainingCount = allItems.length - items.length;

    const myName = useMemo(() => getCurrentUserName(), []);
    const myId = useMemo(() => getCurrentUserId(), []);

    function isMine(item: DispatchItem): boolean {
        if (myId && item.user?.id && String(item.user.id) === String(myId)) return true;
        if (myName && item.user?.name && item.user.name === myName) return true;
        return false;
    }

    // Small 모드: 상태별 건수 요약
    const statusSummary = useMemo(() => {
        if (!isSmall) return null;
        const allRaw = Array.isArray(data) ? data : (data?.data || data?.items || data?.dispatches || []);
        const counts: Record<string, number> = {};
        (allRaw as DispatchItem[]).forEach(item => {
            const info = getStatusInfo(item.status);
            counts[info.label] = (counts[info.label] || 0) + 1;
        });
        return { total: (allRaw as DispatchItem[]).length, counts };
    }, [data, isSmall]);

    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-amber-50">
                        <Car size={14} className="text-amber-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">배차 현황</h4>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                        {isSmall ? `${statusSummary?.total ?? 0}건` : `${allItems.length}건`}
                    </span>
                    {!isSmall && (
                        <Link
                            href="/dispatch"
                            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-bold transition-colors group/link"
                        >
                            <span>더보기</span>
                            <ExternalLink size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Small 모드: 컴팩트 상태 요약 */}
            {isSmall ? (
                items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                        <Navigation size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">배차 정보 없음</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto space-y-1.5">
                        {/* 상태별 요약 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {statusSummary && Object.entries(statusSummary.counts).map(([label, count]) => {
                                const info = getStatusInfo(label);
                                return (
                                    <span key={label} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${info.bg} ${info.text}`}>
                                        {label} {count}건
                                    </span>
                                );
                            })}
                        </div>
                        {/* 컴팩트 리스트 */}
                        <div className="space-y-1.5">
                            {items.map((item, idx) => {
                                const mine = isMine(item);
                                const statusInfo = getStatusInfo(item.status);
                                return (
                                    <div
                                        key={item.id ?? idx}
                                        className={`flex items-center gap-2 p-1.5 rounded-lg border ${mine ? 'border-indigo-100 bg-indigo-50/30' : 'border-stone-100 bg-stone-50/30'}`}
                                    >
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${statusInfo.bg} ${statusInfo.text}`}>
                                            {statusInfo.label}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 truncate flex-1">
                                            {item.destination || '목적지 미정'}
                                        </span>
                                        {mine && (
                                            <span className="text-[8px] font-black px-1 py-0.5 rounded bg-indigo-500 text-white">MY</span>
                                        )}
                                    </div>
                                );
                            })}
                            {remainingCount > 0 && (
                                <p className="text-[10px] text-slate-400 font-medium text-center">+{remainingCount}건 더보기</p>
                            )}
                        </div>
                    </div>
                )
            ) : (
                <>
                    {/* Medium/Large 리스트 */}
                    {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-4">
                            <div className="p-3 rounded-2xl bg-slate-50 mb-2">
                                <Navigation size={24} className="text-slate-200" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">배차 정보가 없습니다</p>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-1.5">
                            {items.map((item, idx) => {
                                const mine = isMine(item);
                                const VehicleIcon = getVehicleIcon(item.vehicle?.type);
                                const statusInfo = getStatusInfo(item.status);
                                const dateRange = formatDateRange(item.startDate, item.endDate);

                                return (
                                    <div
                                        key={item.id ?? idx}
                                        className={`
                                            group/card p-2.5 rounded-xl border transition-all duration-200
                                            hover:shadow-md cursor-default
                                            ${mine
                                                ? 'bg-gradient-to-r from-indigo-50/40 to-white border-indigo-200/60 ring-1 ring-indigo-100/50'
                                                : 'bg-gradient-to-r from-white to-stone-50/30 border-stone-150 hover:border-stone-200'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* 차량 아이콘 */}
                                            <div className={`
                                                p-2 rounded-xl flex-shrink-0
                                                ${mine ? 'bg-indigo-100' : 'bg-amber-50'}
                                            `}>
                                                <VehicleIcon size={16} className={mine ? 'text-indigo-600' : 'text-amber-500'} />
                                            </div>

                                            {/* 정보 */}
                                            <div className="flex-1 min-w-0">
                                                {/* 차량번호 + 상태 + 내 배차 표시 */}
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`
                                                        text-xs font-black uppercase tracking-wider
                                                        ${mine ? 'text-indigo-600' : 'text-slate-700'}
                                                    `}>
                                                        {item.vehicle?.plateNumber || item.vehicle?.name || '차량 미정'}
                                                    </span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${statusInfo.bg} ${statusInfo.text}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                    {mine && (
                                                        <span className="text-[8px] font-black px-1 py-0.5 rounded-md bg-indigo-500 text-white uppercase tracking-wider">
                                                            MY
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 목적지 + 날짜 한 줄 */}
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                                    <span className="flex items-center gap-0.5 truncate">
                                                        <MapPin size={10} className="text-slate-300 flex-shrink-0" />
                                                        <span className="truncate font-medium">{item.destination || '목적지 미정'}</span>
                                                    </span>
                                                    {dateRange && (
                                                        <span className="flex items-center gap-0.5 font-medium tabular-nums text-slate-400 flex-shrink-0">
                                                            <Clock size={9} className="text-slate-300" />
                                                            {dateRange}
                                                        </span>
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
                                <p className="text-[10px] text-slate-400 font-medium text-center py-0.5">+{remainingCount}건 더보기</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
