'use client';

import React from 'react';
import { Calendar, CheckCircle2, Circle, AlertCircle, Sparkles } from 'lucide-react';

interface WeeklyStatusItem {
    date: string;
    dayName: string;
    hasJob: boolean;
    workType: string;
    holidayName?: string;
    isToday: boolean;
}

interface WeeklyStatusNavProps {
    statusData: WeeklyStatusItem[];
    selectedDate: string;
    onDateSelect: (date: Date) => void;
}

const WeeklyStatusNav: React.FC<WeeklyStatusNavProps> = ({ statusData, selectedDate, onDateSelect }) => {
    // 10일치 데이터를 금주(5일)와 차주(5일)로 분리
    const thisWeek = statusData.slice(0, 5);
    const nextWeek = statusData.slice(5, 10);

    const renderDay = (item: WeeklyStatusItem) => {
        const isSelected = item.date === selectedDate;
        const isHoliday = item.workType === '연차' || item.workType === '공휴일' || item.workType === '공가';

        // 상태에 따른 프리미엄 스타일 결정 (HSL 조화 컬러)
        let statusClasses = 'bg-stone-50/50 text-stone-400 border-stone-100 hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10';

        if (item.hasJob) {
            statusClasses = 'bg-indigo-50/30 text-indigo-500 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/60';
        } else if (isHoliday) {
            statusClasses = 'bg-amber-50/30 text-amber-500 border-amber-100 hover:border-amber-300 hover:bg-amber-50/60';
        }

        if (isSelected) {
            statusClasses = 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-xl shadow-indigo-200 scale-105 z-10';
        }

        return (
            <button
                key={item.date}
                onClick={() => onDateSelect(new Date(item.date))}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group min-w-[72px] sm:min-w-[80px] ${statusClasses} ${item.isToday && !isSelected ? 'ring-4 ring-indigo-50' : ''}`}
            >
                <span className={`text-[10px] font-black mb-1.5 tracking-tighter uppercase transition-colors ${isSelected ? 'text-indigo-100' : 'text-slate-400 group-hover:text-indigo-500'} truncate w-full text-center`}>
                    {item.dayName}
                </span>
                <span className={`text-sm font-black mb-2 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110 text-slate-700'}`}>
                    {item.date.split('-')[2]}
                </span>
                <div className={`transition-all duration-300 ${isSelected ? 'scale-110' : 'group-hover:rotate-12'}`}>
                    {item.hasJob ? (
                        <CheckCircle2 size={16} className={isSelected ? 'text-white' : 'text-indigo-500'} />
                    ) : isHoliday ? (
                        <Calendar size={16} className={isSelected ? 'text-white' : 'text-amber-500'} />
                    ) : (
                        <Circle size={16} className={`opacity-20 ${isSelected ? 'text-white/40' : 'text-slate-300'}`} />
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="relative w-full no-print">
            {/* 배경 글래스모피즘 효과 */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] -z-10" />

            <div className="flex flex-col p-6 sm:p-8">
                {/* 헤더 영역 및 도움말 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200 shrink-0">
                            <Calendar size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
                                주간 업무 현황
                                <Sparkles size={16} className="ml-2 text-indigo-500 animate-pulse" />
                            </h3>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">금주 및 차주 평일 작성 상태를 확인하고 이동하세요.</p>
                        </div>
                    </div>

                    {/* 도움말 카드 (헤더 우측으로 이동) */}
                    <div className="hidden sm:flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-xl border border-white/60 shadow-sm">
                        <AlertCircle size={14} className="text-indigo-500" />
                        <span className="text-[10px] font-bold text-slate-500">
                            날짜를 클릭하여 해당 보고서로 이동
                        </span>
                    </div>
                </div>

                {/* 메인 콘텐츠 영역 - Grid Layout 적용 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
                    {/* 금주 현황 */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-2 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">THIS WEEK</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 sm:gap-4">
                            {thisWeek.map(renderDay)}
                        </div>
                    </div>

                    {/* 차주 현황 */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-2 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">NEXT WEEK</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 sm:gap-4">
                            {nextWeek.map(renderDay)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyStatusNav;
