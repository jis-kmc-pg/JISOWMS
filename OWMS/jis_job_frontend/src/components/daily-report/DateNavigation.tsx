'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateSimple, formatDateFull } from './types';

interface DateNavigationProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    showCalendar: boolean;
    onToggleCalendar: () => void;
    workType: string;
    onWorkTypeChange: (type: string) => void;
    holidayName: string;
    onHolidayNameChange: (name: string) => void;
}

const WORK_TYPES = ['내근', '외근', '내/외근', '출장', '재택', '오전반차', '오후반차', '연차', '공가', '공휴일'];

export default function DateNavigation({
    selectedDate,
    onDateChange,
    showCalendar,
    onToggleCalendar,
    workType,
    onWorkTypeChange,
    holidayName,
    onHolidayNameChange,
}: DateNavigationProps) {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const WEEK_MS = 7 * DAY_MS;

    return (
        <>
            <div className="relative no-print">
                <div className="flex flex-col space-y-4 bg-stone-50 border border-stone-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => onDateChange(new Date(selectedDate.getTime() - WEEK_MS))}
                            className="h-10 px-6 bg-white border border-stone-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all text-xs text-slate-400 hover:text-indigo-600 flex items-center justify-center space-x-2 shadow-sm"
                        >
                            <ChevronLeft size={14} />
                            <span>{formatDateSimple(new Date(selectedDate.getTime() - WEEK_MS))}</span>
                        </button>

                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => onDateChange(new Date(selectedDate.getTime() - DAY_MS))}
                                className="h-10 px-4 bg-white border border-stone-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all flex items-center justify-center space-x-2 text-xs text-slate-400 hover:text-indigo-600 group shadow-sm"
                            >
                                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                                <span>{formatDateSimple(new Date(selectedDate.getTime() - DAY_MS))}</span>
                            </button>

                            <button
                                onClick={onToggleCalendar}
                                className="h-12 flex items-center justify-center space-x-3 px-8 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all text-indigo-600 shadow-sm"
                            >
                                <Calendar size={18} />
                                <span className="text-xl font-bold tracking-tight">{formatDateFull(selectedDate)}</span>
                            </button>

                            <button
                                onClick={() => onDateChange(new Date(selectedDate.getTime() + DAY_MS))}
                                className="h-10 px-4 bg-white border border-stone-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all flex items-center justify-center space-x-2 text-xs text-slate-400 hover:text-indigo-600 group shadow-sm"
                            >
                                <span>{formatDateSimple(new Date(selectedDate.getTime() + DAY_MS))}</span>
                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        <button
                            onClick={() => onDateChange(new Date(selectedDate.getTime() + WEEK_MS))}
                            className="h-10 px-6 bg-white border border-stone-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all text-xs text-slate-400 hover:text-indigo-600 flex items-center justify-center space-x-2 shadow-sm"
                        >
                            <span>{formatDateSimple(new Date(selectedDate.getTime() + WEEK_MS))}</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-stone-200">
                        {WORK_TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => onWorkTypeChange(type)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${workType === type
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-200'
                                    : 'bg-white border-stone-200 text-slate-500 hover:bg-stone-50 hover:text-slate-700'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}

                        {workType === '공휴일' && (
                            <div className="ml-4 flex items-center bg-white border border-stone-200 rounded-xl px-4 py-1 shadow-sm animate-in fade-in slide-in-from-left-2">
                                <span className="text-xs font-bold text-slate-500 mr-2 whitespace-nowrap">공휴일 명칭:</span>
                                <input
                                    type="text"
                                    value={holidayName}
                                    onChange={(e) => onHolidayNameChange(e.target.value)}
                                    placeholder="예: 설날, 추석"
                                    className="bg-transparent border-none text-slate-800 text-sm font-medium focus:ring-0 py-1.5 w-32 placeholder:text-slate-400"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCalendar && (
                <div className="absolute top-64 left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-stone-100 rounded-2xl p-6 shadow-2xl w-[340px] animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => onDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, selectedDate.getDate()))} className="p-2 hover:bg-stone-50 rounded-lg text-slate-500 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-base font-bold text-slate-800">{selectedDate.toLocaleString('ko-KR', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => onDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate()))} className="p-2 hover:bg-stone-50 rounded-lg text-slate-500 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-3 font-bold uppercase">
                        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const day = i + 1;
                            const isToday = new Date().toDateString() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString();
                            const isSelected = selectedDate.getDate() === day;
                            return (
                                <button
                                    key={day}
                                    onClick={() => {
                                        const next = new Date(selectedDate);
                                        next.setDate(day);
                                        onDateChange(next);
                                        onToggleCalendar();
                                    }}
                                    className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${isSelected ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200' : isToday ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:bg-stone-100 text-slate-600'
                                        }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
