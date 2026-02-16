'use client';

import React, { useState, useMemo } from 'react';
import CalendarComponent from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar, ChevronRight } from 'lucide-react';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface LeaveInfo {
    startDate: string;
    endDate: string;
    type: string;
    memberName?: string;
}

interface TeamMember {
    name: string;
    upcomingLeave: LeaveInfo[];
}

interface CalendarRendererProps {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size?: 'small' | 'medium' | 'large';
}

const LEAVE_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    '연차': { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400' },
    '반차': { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    '오전반차': { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    '오후반차': { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
    '병가': { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400' },
    '공가': { bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-400' },
    '경조': { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-400' },
};

function getLeaveColor(type: string) {
    return LEAVE_TYPE_COLORS[type] || { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };
}

export default function CalendarRenderer({ title, data, size = 'large' }: CalendarRendererProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const [value, setValue] = useState<Value>(new Date());

    const members: TeamMember[] = data?.members || [];

    // 선택된 날짜의 문자열 키
    const selectedDateStr = useMemo(() => {
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }
        return new Date().toISOString().split('T')[0];
    }, [value]);

    // 오늘 날짜 키
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // 모든 날짜의 연차 맵 (최적화)
    const leaveDateMap = useMemo(() => {
        const map = new Map<string, { memberName: string; type: string; startDate: string; endDate: string }[]>();
        members.forEach(m => {
            m.upcomingLeave.forEach(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                const current = new Date(start);
                while (current <= end) {
                    const key = current.toISOString().split('T')[0];
                    if (!map.has(key)) map.set(key, []);
                    map.get(key)!.push({
                        memberName: m.name,
                        type: l.type,
                        startDate: l.startDate,
                        endDate: l.endDate,
                    });
                    current.setDate(current.getDate() + 1);
                }
            });
        });
        return map;
    }, [members]);

    // 선택 날짜의 이벤트
    const selectedEvents = leaveDateMap.get(selectedDateStr) || [];

    // 오늘의 이벤트
    const todayEvents = leaveDateMap.get(todayStr) || [];

    // 날짜 포맷
    const formatSelectedDate = () => {
        if (!(value instanceof Date)) return '';
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return `${value.getMonth() + 1}월 ${value.getDate()}일 (${days[value.getDay()]})`;
    };

    // 이번 주 날짜 배열
    const getWeekDates = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, []);

    const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

    // ── Small: 오늘 날짜 + 이벤트 카운트 뱃지 ──
    if (isSmall) {
        const today = new Date();
        const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar size={14} className="text-indigo-500" />
                        근무 캘린더
                    </h4>
                    {todayEvents.length > 0 && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                            {todayEvents.length}명 휴가
                        </span>
                    )}
                </div>

                <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-indigo-600 tabular-nums">
                        {today.getDate()}
                    </span>
                    <span className="text-xs font-bold text-slate-500 mt-0.5">
                        {today.getMonth() + 1}월 ({dayLabels[today.getDay()]})
                    </span>
                    {todayEvents.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 justify-center">
                            {todayEvents.slice(0, 3).map((ev, i) => {
                                const color = getLeaveColor(ev.type);
                                return (
                                    <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color.bg} ${color.text}`}>
                                        {ev.memberName}
                                    </span>
                                );
                            })}
                            {todayEvents.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-bold">+{todayEvents.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Medium: 컴팩트 주간 캘린더 뷰 ──
    if (!isLarge) {
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar size={14} className="text-indigo-500" /> {title}
                    </h4>
                    <div className="flex items-center gap-1.5">
                        {Object.entries(LEAVE_TYPE_COLORS).slice(0, 3).map(([type, colors]) => (
                            <span key={type} className="flex items-center gap-0.5 text-[8px] text-slate-400">
                                <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 주간 그리드 */}
                <div className="flex-1 min-h-0 overflow-auto">
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {WEEKDAY_LABELS.map((label, idx) => (
                            <div key={idx} className="text-center">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {getWeekDates.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const leaves = leaveDateMap.get(dateStr) || [];
                            const isToday = dateStr === todayStr;

                            return (
                                <div
                                    key={idx}
                                    className={`rounded-lg p-1.5 min-h-[60px] border ${
                                        isToday
                                            ? 'border-indigo-300 bg-indigo-50/50'
                                            : 'border-stone-100 bg-stone-50/30'
                                    }`}
                                >
                                    <p className={`text-[10px] font-black mb-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                                        {date.getDate()}
                                    </p>
                                    <div className="space-y-0.5">
                                        {leaves.slice(0, 2).map((l, lIdx) => {
                                            const color = getLeaveColor(l.type);
                                            return (
                                                <div
                                                    key={lIdx}
                                                    className={`flex items-center gap-0.5 px-0.5 py-0.5 rounded ${color.bg}`}
                                                    title={`${l.memberName} (${l.type})`}
                                                >
                                                    <span className={`w-1 h-1 rounded-full ${color.dot} flex-shrink-0`} />
                                                    <span className="text-[7px] font-bold text-slate-600 truncate">
                                                        {l.memberName}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {leaves.length > 2 && (
                                            <span className="text-[7px] text-slate-400 font-bold pl-0.5">
                                                +{leaves.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ── Large: 월간 캘린더 (compact within 250px) ──
    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-500" /> {title}
                </h4>
                <div className="flex items-center gap-1.5">
                    {Object.entries(LEAVE_TYPE_COLORS).slice(0, 3).map(([type, colors]) => (
                        <span key={type} className="flex items-center gap-0.5 text-[8px] text-slate-400">
                            <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
                            {type}
                        </span>
                    ))}
                </div>
            </div>

            {/* 본문: 좌측 캘린더 + 우측 이벤트 리스트 */}
            <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
                {/* 좌측: 캘린더 */}
                <div className="flex-1 calendar-container-v2-compact overflow-hidden">
                    <CalendarComponent
                        onChange={setValue}
                        value={value}
                        className="w-full border-none font-sans"
                        tileContent={({ date, view }: { date: Date; view: string }) => {
                            if (view === 'month') {
                                const dateStr = date.toISOString().split('T')[0];
                                const leaves = leaveDateMap.get(dateStr) || [];

                                if (leaves.length > 0) {
                                    return (
                                        <div className="flex justify-center gap-0.5 mt-0.5">
                                            {leaves.slice(0, 3).map((l, i) => (
                                                <span
                                                    key={i}
                                                    className={`w-1 h-1 rounded-full ${getLeaveColor(l.type).dot}`}
                                                    title={`${l.memberName} (${l.type})`}
                                                />
                                            ))}
                                            {leaves.length > 3 && (
                                                <span className="text-[6px] text-slate-400 font-bold leading-none">+{leaves.length - 3}</span>
                                            )}
                                        </div>
                                    );
                                }
                            }
                        }}
                        tileClassName={({ date, view }: { date: Date; view: string }) => {
                            if (view === 'month') {
                                const dateStr = date.toISOString().split('T')[0];
                                if (dateStr === selectedDateStr) return 'selected-date-tile';
                                if (leaveDateMap.has(dateStr)) return 'has-event-tile';
                            }
                            return '';
                        }}
                    />
                </div>

                {/* 우측: 선택 날짜 이벤트 리스트 */}
                <div className="w-[200px] flex flex-col border-l border-stone-100 pl-3">
                    {/* 선택 날짜 헤더 */}
                    <div className="mb-1.5">
                        <p className="text-[10px] font-bold text-indigo-500">{formatSelectedDate()}</p>
                        <p className="text-[9px] text-slate-400">
                            {selectedEvents.length > 0
                                ? `${selectedEvents.length}명 연차/휴가`
                                : '일정 없음'
                            }
                        </p>
                    </div>

                    {/* 이벤트 목록 */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5">
                        {selectedEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                <Calendar size={20} className="text-stone-200 mb-1" />
                                <p className="text-[10px] text-slate-400">일정 없음</p>
                            </div>
                        ) : (
                            selectedEvents.slice(0, 6).map((ev, i) => {
                                const color = getLeaveColor(ev.type);
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-2 p-1.5 rounded-lg border border-stone-100 ${color.bg}`}
                                    >
                                        {/* 아바타 */}
                                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[9px] font-black text-slate-600 shadow-sm flex-shrink-0">
                                            {ev.memberName.charAt(0)}
                                        </div>

                                        {/* 정보 */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-slate-700 truncate">{ev.memberName}</p>
                                            <span className={`text-[8px] font-black ${color.text}`}>{ev.type}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {selectedEvents.length > 6 && (
                            <p className="text-[9px] text-slate-400 font-bold text-center">+{selectedEvents.length - 6}명 더</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 스타일 */}
            <style jsx global>{`
                .calendar-container-v2-compact .react-calendar {
                    width: 100%;
                    border: none;
                    font-size: 10px;
                    font-family: inherit;
                    background: transparent;
                }
                .calendar-container-v2-compact .react-calendar__navigation {
                    margin-bottom: 2px;
                    min-height: 28px;
                    height: 28px;
                }
                .calendar-container-v2-compact .react-calendar__navigation button {
                    font-size: 11px;
                    font-weight: 700;
                    color: #334155;
                    min-width: 28px;
                    border-radius: 6px;
                    padding: 2px;
                }
                .calendar-container-v2-compact .react-calendar__navigation button:hover {
                    background: #f1f5f9;
                }
                .calendar-container-v2-compact .react-calendar__month-view__weekdays {
                    font-size: 8px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                }
                .calendar-container-v2-compact .react-calendar__month-view__weekdays abbr {
                    text-decoration: none;
                }
                .calendar-container-v2-compact .react-calendar__tile {
                    height: 28px;
                    max-height: 28px;
                    padding: 1px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 600;
                    color: #475569;
                    transition: all 0.15s;
                    line-height: 1;
                }
                .calendar-container-v2-compact .react-calendar__tile:hover {
                    background: #f1f5f9;
                }
                .calendar-container-v2-compact .react-calendar__tile--now {
                    background: #eef2ff;
                    color: #4f46e5;
                    font-weight: 800;
                }
                .calendar-container-v2-compact .react-calendar__tile--active,
                .calendar-container-v2-compact .selected-date-tile {
                    background: #6366f1 !important;
                    color: #fff !important;
                    border-radius: 4px;
                }
                .calendar-container-v2-compact .has-event-tile {
                    background: #fef2f2;
                }
                .calendar-container-v2-compact .react-calendar__month-view__days__day--weekend {
                    color: #ef4444;
                }
                .calendar-container-v2-compact .react-calendar__tile--active .react-calendar__month-view__days__day--weekend,
                .calendar-container-v2-compact .react-calendar__tile--active span {
                    color: #fff;
                }
                .calendar-container-v2-compact .react-calendar__month-view__days__day--neighboringMonth {
                    color: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
