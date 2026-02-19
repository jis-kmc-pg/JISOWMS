'use client';

import React, { useMemo } from 'react';
import { DoorOpen, Clock, CalendarDays, Users } from 'lucide-react';

interface ReservationItem {
    id?: number | string;
    room?: { name?: string; id?: number | string };
    user?: { name?: string; id?: number | string };
    title?: string;
    startDate?: string;
    endDate?: string;
    participants?: number;
    status?: string;
}

interface RoomAvailabilityWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

interface RoomGroup {
    name: string;
    reservations: ReservationItem[];
}

const ROOM_COLORS = [
    { bg: 'bg-indigo-100 dark:bg-indigo-900/40', bar: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', light: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800/30' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/40', bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/30' },
    { bg: 'bg-amber-100 dark:bg-amber-900/40', bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', light: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/30' },
    { bg: 'bg-rose-100 dark:bg-rose-900/40', bar: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', light: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800/30' },
    { bg: 'bg-purple-100 dark:bg-purple-900/40', bar: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800/30' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/40', bar: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-400', light: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800/30' },
];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const TIME_START = 8;
const TIME_END = 18;
const TOTAL_HOURS = TIME_END - TIME_START;

function getHourDecimal(dateStr: string): number {
    const d = new Date(dateStr);
    return d.getHours() + d.getMinutes() / 60;
}

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function isToday(dateStr?: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d.getDate() === now.getDate();
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

export default function RoomAvailabilityWidget({ data, size }: RoomAvailabilityWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const myName = useMemo(() => getCurrentUserName(), []);

    // 데이터 파싱: 오늘 예약만 필터
    const allReservations: ReservationItem[] = useMemo(() => {
        const raw = Array.isArray(data)
            ? data
            : (data?.data || data?.items || data?.reservations || []);
        return (raw as ReservationItem[]).filter(r => isToday(r.startDate));
    }, [data]);

    // 회의실별 그룹핑
    const roomGroups: RoomGroup[] = useMemo(() => {
        const map = new Map<string, ReservationItem[]>();
        allReservations.forEach(item => {
            const roomName = item.room?.name || '미정';
            if (!map.has(roomName)) map.set(roomName, []);
            map.get(roomName)!.push(item);
        });
        // 정렬: 예약 많은 순
        return Array.from(map.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .map(([name, reservations]) => ({ name, reservations }));
    }, [allReservations]);

    // 현재 시간 위치(%)
    const now = new Date();
    const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
    const currentPercent = Math.max(0, Math.min(100,
        ((currentHourDecimal - TIME_START) / TOTAL_HOURS) * 100
    ));
    const showCurrentLine = currentHourDecimal >= TIME_START && currentHourDecimal <= TIME_END;

    // 룸 컬러 매핑
    const roomColorMap = useMemo(() => {
        const map = new Map<string, typeof ROOM_COLORS[0]>();
        roomGroups.forEach((group, idx) => {
            map.set(group.name, ROOM_COLORS[idx % ROOM_COLORS.length]);
        });
        return map;
    }, [roomGroups]);

    function isMine(item: ReservationItem): boolean {
        if (!myName) return false;
        return item.user?.name === myName;
    }

    // Small 모드용: 다음 회의 시간 찾기
    const nextMeeting = useMemo(() => {
        if (!isSmall) return null;
        const upcoming = allReservations
            .filter(r => r.startDate && getHourDecimal(r.startDate) > currentHourDecimal)
            .sort((a, b) => getHourDecimal(a.startDate!) - getHourDecimal(b.startDate!));
        return upcoming.length > 0 ? upcoming[0] : null;
    }, [allReservations, currentHourDecimal, isSmall]);

    // Small 모드용: 현재 사용 가능한 회의실 수
    const availableRoomCount = useMemo(() => {
        if (!isSmall) return 0;
        const busyRooms = roomGroups.filter(group =>
            group.reservations.some(r => {
                if (!r.startDate || !r.endDate) return false;
                const start = getHourDecimal(r.startDate);
                const end = getHourDecimal(r.endDate);
                return currentHourDecimal >= start && currentHourDecimal <= end;
            })
        ).length;
        return Math.max(0, roomGroups.length - busyRooms);
    }, [roomGroups, currentHourDecimal, isSmall]);

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/30">
                        <DoorOpen size={14} className="text-purple-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">회의실 예약</h4>
                </div>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-wider">
                    오늘 {allReservations.length}건
                </span>
            </div>

            {allReservations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 mb-2">
                        <CalendarDays size={24} className="text-slate-200" />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">오늘 회의실 예약이 없습니다</p>
                </div>
            ) : isSmall ? (
                /* Small 모드: 컴팩트 요약 */
                <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-2">
                    {/* 이용 가능 / 전체 */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-emerald-50/60 rounded-xl p-2 border border-emerald-100/50 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">이용 가능</p>
                            <p className="text-lg font-black text-emerald-600 tabular-nums">
                                {availableRoomCount}
                                <span className="text-[10px] font-bold text-slate-400 ml-0.5">/{roomGroups.length}</span>
                            </p>
                        </div>
                        <div className="flex-1 bg-indigo-50/60 rounded-xl p-2 border border-indigo-100/50 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">다음 회의</p>
                            {nextMeeting ? (
                                <p className="text-sm font-black text-indigo-600 tabular-nums">
                                    {nextMeeting.startDate ? formatTime(nextMeeting.startDate) : '--:--'}
                                </p>
                            ) : (
                                <p className="text-xs font-bold text-slate-400">없음</p>
                            )}
                        </div>
                    </div>

                    {/* 회의실 상태 dots */}
                    <div className="space-y-1">
                        {roomGroups.slice(0, 3).map((group) => {
                            const color = roomColorMap.get(group.name) || ROOM_COLORS[0];
                            const hasCurrentReservation = group.reservations.some(r => {
                                if (!r.startDate || !r.endDate) return false;
                                const start = getHourDecimal(r.startDate);
                                const end = getHourDecimal(r.endDate);
                                return currentHourDecimal >= start && currentHourDecimal <= end;
                            });
                            return (
                                <div key={group.name} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasCurrentReservation ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`}
                                        style={hasCurrentReservation ? { animationDuration: '2s' } : {}} />
                                    <span className={`text-[10px] font-bold truncate ${color.text}`}>{group.name}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-400 ml-auto tabular-nums">{group.reservations.length}건</span>
                                </div>
                            );
                        })}
                        {roomGroups.length > 3 && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium text-center">+{roomGroups.length - 3}개 회의실</p>
                        )}
                    </div>
                </div>
            ) : (
                /* Medium/Large 모드: 타임라인 */
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                    {/* 시간축 헤더 */}
                    <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 pb-1 mb-1.5 border-b border-stone-100 dark:border-slate-700">
                        <div className={`flex items-center ${isLarge ? 'ml-[90px]' : 'ml-[70px]'}`}>
                            {HOURS.map(h => (
                                <div
                                    key={h}
                                    className="text-[10px] font-bold text-slate-300 dark:text-slate-500 tabular-nums"
                                    style={{ width: `${100 / TOTAL_HOURS}%`, textAlign: 'left' }}
                                >
                                    {h}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 회의실 타임라인 */}
                    <div className="space-y-1.5">
                        {roomGroups.slice(0, isLarge ? 6 : 4).map((group) => {
                            const color = roomColorMap.get(group.name) || ROOM_COLORS[0];
                            const hasCurrentReservation = group.reservations.some(r => {
                                if (!r.startDate || !r.endDate) return false;
                                const start = getHourDecimal(r.startDate);
                                const end = getHourDecimal(r.endDate);
                                return currentHourDecimal >= start && currentHourDecimal <= end;
                            });

                            return (
                                <div key={group.name}>
                                    <div className="flex items-center gap-1.5">
                                        {/* 회의실 이름 + 상태 dot */}
                                        <div className={`${isLarge ? 'w-[82px]' : 'w-[62px]'} flex-shrink-0 flex items-center gap-1`}>
                                            <div className={`
                                                w-1.5 h-1.5 rounded-full flex-shrink-0
                                                ${hasCurrentReservation ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}
                                            `} style={hasCurrentReservation ? { animationDuration: '2s' } : {}} />
                                            <span className={`text-[10px] font-black uppercase tracking-wider truncate ${color.text}`}>
                                                {group.name}
                                            </span>
                                        </div>

                                        {/* 타임바 영역 */}
                                        <div className={`flex-1 relative ${isLarge ? 'h-8' : 'h-7'} bg-stone-50 rounded-lg overflow-hidden border border-stone-100`}>
                                            {/* 격자선 */}
                                            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute top-0 bottom-0 w-px bg-stone-100"
                                                    style={{ left: `${((i + 1) / TOTAL_HOURS) * 100}%` }}
                                                />
                                            ))}

                                            {/* 현재시간 라인 */}
                                            {showCurrentLine && (
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-20"
                                                    style={{ left: `${currentPercent}%` }}
                                                >
                                                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                </div>
                                            )}

                                            {/* 예약 바들 */}
                                            {group.reservations.map((res, rIdx) => {
                                                if (!res.startDate) return null;
                                                const startH = getHourDecimal(res.startDate);
                                                const endH = res.endDate
                                                    ? getHourDecimal(res.endDate)
                                                    : startH + 1;
                                                const leftPct = Math.max(0,
                                                    ((startH - TIME_START) / TOTAL_HOURS) * 100
                                                );
                                                const widthPct = Math.max(5,
                                                    Math.min(100 - leftPct,
                                                        ((endH - startH) / TOTAL_HOURS) * 100
                                                    )
                                                );
                                                const mine = isMine(res);

                                                return (
                                                    <div
                                                        key={res.id ?? rIdx}
                                                        className={`
                                                            absolute top-0.5 bottom-0.5 rounded-md
                                                            flex items-center justify-center overflow-hidden
                                                            shadow-sm transition-all duration-200
                                                            ${mine
                                                                ? 'bg-indigo-500 ring-2 ring-indigo-300 z-10'
                                                                : color.bar
                                                            }
                                                        `}
                                                        style={{
                                                            left: `${leftPct}%`,
                                                            width: `${widthPct}%`,
                                                            minWidth: '32px',
                                                        }}
                                                        title={`${res.title || '회의'} (${formatTime(res.startDate)}${res.endDate ? ` ~ ${formatTime(res.endDate)}` : ''}) - ${res.user?.name || ''}`}
                                                    >
                                                        <span className="text-[10px] font-bold text-white truncate px-1">
                                                            {mine ? '내 예약' : (res.title || res.user?.name || '')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {roomGroups.length > (isLarge ? 6 : 4) && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium text-center">+{roomGroups.length - (isLarge ? 6 : 4)}개 회의실</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
