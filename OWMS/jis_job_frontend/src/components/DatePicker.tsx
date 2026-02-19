'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    label?: string;
    minDate?: string;
}

export default function DatePicker({ value, onChange, label, minDate }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

    // Get month data
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();

    const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const handleDateSelect = (d: number) => {
        const selectedDate = new Date(year, month, d);
        // KST Adjust for ISO String if needed, but for YYYY-MM-DD simpler to manual build
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const formatted = `${yyyy}-${mm}-${dd}`;

        onChange(formatted);
        setIsOpen(false);
    };

    const isToday = (d: number) => {
        const today = new Date();
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    };

    const isSelected = (d: number) => {
        if (!value) return false;
        const [vY, vM, vD] = value.split('-').map(Number);
        return vY === year && vM === month + 1 && vD === d;
    };

    const isDisabled = (d: number) => {
        if (!minDate) return false;
        const current = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return current < minDate;
    };

    return (
        <div className="relative">
            {label && <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl p-3 text-slate-800 dark:text-slate-100 font-medium outline-none focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-800/30 transition-all cursor-pointer flex items-center justify-between"
            >
                <span className={value ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-400"}>
                    {value || '날짜 선택'}
                </span>
                <CalendarIcon size={18} className="text-slate-400 dark:text-slate-400" />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl shadow-xl z-50 w-72 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{year}년 {month + 1}월</span>
                            <div className="flex space-x-1">
                                <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {daysOfWeek.map(d => (
                                <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-400 text-center py-1">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty slots from prev month */}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`prev-${i}`} className="text-xs text-slate-300 dark:text-slate-500 text-center py-2">
                                    {prevMonthDays - firstDayOfMonth + i + 1}
                                </div>
                            ))}

                            {/* Current month days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dayNum = i + 1;
                                const disabled = isDisabled(dayNum);
                                const selected = isSelected(dayNum);
                                const today = isToday(dayNum);

                                return (
                                    <button
                                        key={dayNum}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => handleDateSelect(dayNum)}
                                        className={`
                                            text-xs font-medium py-2 rounded-lg transition-all relative
                                            ${disabled ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'}
                                            ${selected ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white ring-2 ring-indigo-100 dark:ring-indigo-800/30' : ''}
                                            ${today && !selected ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}
                                        `}
                                    >
                                        {dayNum}
                                        {today && !selected && (
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
