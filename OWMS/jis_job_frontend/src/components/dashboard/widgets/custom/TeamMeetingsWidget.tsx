'use client';

import React from 'react';
import { DoorOpen, Clock, User } from 'lucide-react';

interface MeetingItem {
    id?: string | number;
    user?: { name: string };
    room?: { name: string };
    title?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
}

interface TeamMeetingsWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

// 시간 문자열(HH:mm) → 분 단위
function timeToMinutes(dateStr: string): number {
    const d = new Date(dateStr);
    return d.getHours() * 60 + d.getMinutes();
}

// 분 → HH:mm
function minutesToTime(mins: number): string {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

const TIMELINE_START = 8 * 60;  // 08:00
const TIMELINE_END = 20 * 60;   // 20:00
const TIMELINE_RANGE = TIMELINE_END - TIMELINE_START;

const BAR_COLORS = [
    'bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400',
    'bg-violet-400', 'bg-cyan-400', 'bg-pink-400', 'bg-teal-400',
];

export default function TeamMeetingsWidget({ data, size }: TeamMeetingsWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const meetings: MeetingItem[] = Array.isArray(data) ? data : (data?.data || data?.items || []);
    const items = meetings.slice(0, 8);

    // 회의실별 그룹핑
    const roomGroups: Record<string, MeetingItem[]> = {};
    items.forEach(m => {
        const roomName = m.room?.name || '미지정';
        if (!roomGroups[roomName]) roomGroups[roomName] = [];
        roomGroups[roomName].push(m);
    });

    const rooms = Object.entries(roomGroups);

    // 타임라인 눈금 생성 (매 2시간)
    const timeMarks: number[] = [];
    for (let t = TIMELINE_START; t <= TIMELINE_END; t += 120) {
        timeMarks.push(t);
    }

    // 다음 회의 찾기
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const nextMeeting = items.find(m => {
        if (!m.startDate) return false;
        return timeToMinutes(m.startDate) > nowMins;
    }) ?? items[0];

    // ── Small: 오늘 회의 건수 + 다음 회의 시간 ──
    if (isSmall) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm h-full flex flex-col overflow-hidden hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-indigo-500" />
                        회의실
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-stone-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                        {items.length}건
                    </span>
                </div>

                <div className="flex-1 min-h-0 flex flex-col justify-center">
                    {items.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium text-center">
                            예약 없음
                        </p>
                    ) : nextMeeting ? (
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                {nextMeeting.title || '회의'}
                            </p>
                            {nextMeeting.startDate && (
                                <div className="flex items-center gap-1.5">
                                    <Clock size={11} className="text-indigo-400" />
                                    <span className="text-[11px] font-bold text-indigo-500">
                                        {minutesToTime(timeToMinutes(nextMeeting.startDate))}
                                    </span>
                                    {nextMeeting.endDate && (
                                        <span className="text-[10px] text-slate-400 dark:text-slate-400">
                                            ~{minutesToTime(timeToMinutes(nextMeeting.endDate))}
                                        </span>
                                    )}
                                </div>
                            )}
                            {nextMeeting.room?.name && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-400">
                                    {nextMeeting.room.name}
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    // ── Large: 타임라인 + 상세 목록 (compact) ──
    if (isLarge) {
        const displayItems = items.slice(0, 8);
        const moreCount = items.length - displayItems.length;
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm h-full flex flex-col overflow-hidden hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-indigo-500" />
                        팀 회의실 사용
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-stone-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                        오늘 {items.length}건
                    </span>
                </div>

                {rooms.length === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center text-xs text-slate-400 dark:text-slate-400 font-medium py-4">
                        회의실 예약이 없습니다.
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
                        {/* 좌측: 타임라인 */}
                        <div className="flex-1 overflow-y-auto">
                            {/* 시간 눈금 헤더 */}
                            <div className="flex items-end mb-1">
                                <div className="w-16 flex-shrink-0" />
                                <div className="flex-1 relative h-4">
                                    {timeMarks.map(t => {
                                        const left = ((t - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                        return (
                                            <span
                                                key={t}
                                                className="absolute text-[10px] text-slate-400 dark:text-slate-400 font-bold -translate-x-1/2"
                                                style={{ left: `${left}%` }}
                                            >
                                                {minutesToTime(t)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 회의실별 타임라인 행 */}
                            <div className="space-y-1.5">
                                {rooms.map(([roomName, roomMeetings], roomIdx) => (
                                    <div key={roomName} className="flex items-center gap-1.5">
                                        <div className="w-16 flex-shrink-0 text-right pr-1">
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate block">{roomName}</span>
                                        </div>

                                        <div className="flex-1 relative h-7 bg-stone-50 dark:bg-slate-700/50 rounded-lg border border-stone-100 dark:border-slate-700 overflow-hidden">
                                            {timeMarks.map(t => {
                                                const left = ((t - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                                return (
                                                    <div
                                                        key={t}
                                                        className="absolute top-0 bottom-0 w-px bg-stone-100 dark:bg-slate-600"
                                                        style={{ left: `${left}%` }}
                                                    />
                                                );
                                            })}

                                            {(() => {
                                                if (nowMins >= TIMELINE_START && nowMins <= TIMELINE_END) {
                                                    const left = ((nowMins - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                                    return (
                                                        <div
                                                            className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-20"
                                                            style={{ left: `${left}%` }}
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 -ml-[2px] -mt-[1px]" />
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {roomMeetings.map((m, mIdx) => {
                                                if (!m.startDate || !m.endDate) return null;
                                                const start = Math.max(timeToMinutes(m.startDate), TIMELINE_START);
                                                const end = Math.min(timeToMinutes(m.endDate), TIMELINE_END);
                                                const left = ((start - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                                const width = ((end - start) / TIMELINE_RANGE) * 100;
                                                const colorClass = BAR_COLORS[(roomIdx * 3 + mIdx) % BAR_COLORS.length];

                                                return (
                                                    <div
                                                        key={m.id ?? mIdx}
                                                        className={`absolute top-1 bottom-1 ${colorClass} rounded-md z-10 flex items-center px-1 overflow-hidden cursor-default transition-all hover:brightness-110`}
                                                        style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                                                        title={`${m.title || '회의'} | ${m.user?.name || ''} | ${minutesToTime(start)}~${minutesToTime(end)}`}
                                                    >
                                                        <span className="text-[10px] font-bold text-white truncate leading-none">
                                                            {m.title || m.user?.name || ''}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 우측: 상세 목록 */}
                        <div className="w-44 flex-shrink-0 border-l border-stone-100 dark:border-slate-700 pl-3 overflow-y-auto">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                상세 목록
                            </p>
                            <div className="space-y-1.5">
                                {displayItems.map((m, i) => (
                                    <div key={m.id ?? i} className="p-2 bg-stone-50/70 dark:bg-slate-700/50 rounded-lg border border-stone-100 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate mb-0.5">
                                            {m.title || '회의'}
                                        </p>
                                        {m.startDate && m.endDate && (
                                            <div className="flex items-center gap-1">
                                                <Clock size={8} className="text-slate-400" />
                                                <span className="text-[10px] font-bold text-indigo-500">
                                                    {minutesToTime(timeToMinutes(m.startDate))}~{minutesToTime(timeToMinutes(m.endDate))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {moreCount > 0 && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold text-center">+{moreCount}건 더</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Medium: 타임라인 레이아웃 (compact, max 5 rooms) ──
    const displayRooms = rooms.slice(0, 5);
    const moreRooms = rooms.length - displayRooms.length;
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm h-full flex flex-col overflow-hidden hover:shadow-md transition-all">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <DoorOpen size={14} className="text-indigo-500" />
                    팀 회의실 사용
                </h4>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-stone-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                    오늘 {items.length}건
                </span>
            </div>

            {rooms.length === 0 ? (
                <div className="flex-1 min-h-0 flex items-center justify-center text-xs text-slate-400 dark:text-slate-400 font-medium py-4">
                    회의실 예약이 없습니다.
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* 시간 눈금 헤더 */}
                    <div className="flex items-end mb-1">
                        <div className="w-16 flex-shrink-0" />
                        <div className="flex-1 relative h-4">
                            {timeMarks.map(t => {
                                const left = ((t - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                return (
                                    <span
                                        key={t}
                                        className="absolute text-[10px] text-slate-400 dark:text-slate-400 font-bold -translate-x-1/2"
                                        style={{ left: `${left}%` }}
                                    >
                                        {minutesToTime(t)}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* 회의실별 타임라인 행 */}
                    <div className="space-y-1.5">
                        {displayRooms.map(([roomName, roomMeetings], roomIdx) => (
                            <div key={roomName} className="flex items-center gap-1.5">
                                {/* 회의실 이름 */}
                                <div className="w-16 flex-shrink-0 text-right pr-1">
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate block">{roomName}</span>
                                </div>

                                {/* 타임라인 바 */}
                                <div className="flex-1 relative h-7 bg-stone-50 dark:bg-slate-700/50 rounded-lg border border-stone-100 dark:border-slate-700 overflow-hidden">
                                    {/* 시간 눈금 그리드 */}
                                    {timeMarks.map(t => {
                                        const left = ((t - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                        return (
                                            <div
                                                key={t}
                                                className="absolute top-0 bottom-0 w-px bg-stone-100 dark:bg-slate-600"
                                                style={{ left: `${left}%` }}
                                            />
                                        );
                                    })}

                                    {/* 현재 시간 표시선 */}
                                    {(() => {
                                        if (nowMins >= TIMELINE_START && nowMins <= TIMELINE_END) {
                                            const left = ((nowMins - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                            return (
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-20"
                                                    style={{ left: `${left}%` }}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 -ml-[2px] -mt-[1px]" />
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* 예약 블록 */}
                                    {roomMeetings.map((m, mIdx) => {
                                        if (!m.startDate || !m.endDate) return null;
                                        const start = Math.max(timeToMinutes(m.startDate), TIMELINE_START);
                                        const end = Math.min(timeToMinutes(m.endDate), TIMELINE_END);
                                        const left = ((start - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                        const width = ((end - start) / TIMELINE_RANGE) * 100;
                                        const colorClass = BAR_COLORS[(roomIdx * 3 + mIdx) % BAR_COLORS.length];

                                        return (
                                            <div
                                                key={m.id ?? mIdx}
                                                className={`absolute top-1 bottom-1 ${colorClass} rounded-md z-10 flex items-center px-1 overflow-hidden cursor-default transition-all hover:brightness-110`}
                                                style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                                                title={`${m.title || '회의'} | ${m.user?.name || ''} | ${minutesToTime(start)}~${minutesToTime(end)}`}
                                            >
                                                <span className="text-[10px] font-bold text-white truncate leading-none">
                                                    {m.title || m.user?.name || ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {moreRooms > 0 && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold text-center">+{moreRooms}개 회의실 더</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
