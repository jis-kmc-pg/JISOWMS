'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InlineCalendarProps {
    mode: 'ANNUAL' | 'HALF';
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    onChange: (start: string, end: string) => void;
}

export default function InlineCalendar({ mode, startDate, endDate, onChange }: InlineCalendarProps) {
    const [viewDate, setViewDate] = useState(new Date());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<string | null>(null);
    const [dragCurrent, setDragCurrent] = useState<string | null>(null);

    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

    // Month data
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const formatDate = (d: number) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };

    const handleMouseDown = (day: number) => {
        const dateStr = formatDate(day);
        if (mode === 'HALF') {
            onChange(dateStr, dateStr);
        } else {
            setIsDragging(true);
            setDragStart(dateStr);
            setDragCurrent(dateStr);
        }
    };

    const handleMouseEnter = (day: number) => {
        if (isDragging && mode === 'ANNUAL') {
            setDragCurrent(formatDate(day));
        }
    };

    const handleMouseUp = () => {
        if (isDragging && dragStart && dragCurrent) {
            const dates = [dragStart, dragCurrent].sort();
            onChange(dates[0], dates[1]);
        }
        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
    };

    // Global mouse up to handle out of calendar release
    useEffect(() => {
        const onGlobalMouseUp = () => {
            if (isDragging) handleMouseUp();
        };
        window.addEventListener('mouseup', onGlobalMouseUp);
        return () => window.removeEventListener('mouseup', onGlobalMouseUp);
    }, [isDragging, dragStart, dragCurrent]);

    const getStatus = (day: number) => {
        const dateStr = formatDate(day);

        // During drag
        if (isDragging && dragStart && dragCurrent) {
            const [start, end] = [dragStart, dragCurrent].sort();
            if (dateStr === start && dateStr === end) return 'selected-single';
            if (dateStr === start) return 'selected-start';
            if (dateStr === end) return 'selected-end';
            if (dateStr > start && dateStr < end) return 'selected-range';
        }

        // After selection
        if (startDate && endDate) {
            if (dateStr === startDate && dateStr === endDate) return 'selected-single';
            if (dateStr === startDate) return 'selected-start';
            if (dateStr === endDate) return 'selected-end';
            if (dateStr > startDate && dateStr < endDate) return 'selected-range';
        }

        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        if (isToday) return 'today';

        return 'none';
    };

    return (
        <div className="bg-white p-4 select-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold text-slate-800">{year}년 {month + 1}월</span>
                <div className="flex items-center space-x-1">
                    <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-stone-100 rounded-xl text-slate-500 transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-stone-100 rounded-xl text-slate-500 transition-all">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {daysOfWeek.map(d => (
                    <div key={d} className="text-xs font-bold text-slate-400 text-center py-2">{d}</div>
                ))}

                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="py-2"></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const status = getStatus(dayNum);

                    let bgClass = "";
                    let textClass = "text-slate-600";
                    let roundedClass = "rounded-xl";

                    if (status === 'selected-single') {
                        bgClass = "bg-indigo-600 shadow-md shadow-indigo-200";
                        textClass = "text-white font-bold";
                    } else if (status === 'selected-start') {
                        bgClass = "bg-indigo-600 rounded-r-none";
                        textClass = "text-white font-bold";
                    } else if (status === 'selected-end') {
                        bgClass = "bg-indigo-600 rounded-l-none";
                        textClass = "text-white font-bold";
                    } else if (status === 'selected-range') {
                        bgClass = "bg-indigo-100/80 rounded-none";
                        textClass = "text-indigo-700 font-bold";
                    } else if (status === 'today') {
                        textClass = "text-indigo-600 font-bold ring-2 ring-indigo-50 ring-offset-0";
                    }

                    return (
                        <div
                            key={dayNum}
                            onMouseDown={() => handleMouseDown(dayNum)}
                            onMouseEnter={() => handleMouseEnter(dayNum)}
                            className={`
                                relative py-2.5 text-center cursor-pointer transition-all flex items-center justify-center
                                ${status !== 'none' && status !== 'today' ? '' : 'hover:bg-stone-50 rounded-xl'}
                            `}
                        >
                            <div className={`
                                w-full h-full absolute inset-0 
                                ${bgClass} ${roundedClass}
                                ${status === 'selected-start' ? 'rounded-l-xl' : ''}
                                ${status === 'selected-end' ? 'rounded-r-xl' : ''}
                            `}></div>
                            <span className={`relative z-10 text-sm ${textClass}`}>
                                {dayNum}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm"></div>
                    <span>선택됨</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 border border-indigo-600 rounded-sm"></div>
                    <span>오늘</span>
                </div>
            </div>
        </div>
    );
}
