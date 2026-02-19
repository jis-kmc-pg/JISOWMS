'use client';

import React from 'react';
import { Building2, DoorOpen } from 'lucide-react';

interface RoomStat {
    roomName: string;
    utilizationRate: number;
    totalSlots?: number;
    usedSlots?: number;
}

interface CompanyMeetingUtilWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

function getBarGradient(rate: number): string {
    if (rate >= 80) return 'from-emerald-400 to-emerald-500';
    if (rate >= 60) return 'from-indigo-400 to-indigo-500';
    if (rate >= 40) return 'from-amber-400 to-amber-500';
    return 'from-slate-300 to-slate-400';
}

function getBarBg(rate: number): string {
    if (rate >= 80) return 'bg-emerald-50 dark:bg-emerald-900/30';
    if (rate >= 60) return 'bg-indigo-50 dark:bg-indigo-900/30';
    if (rate >= 40) return 'bg-amber-50 dark:bg-amber-900/30';
    return 'bg-slate-50 dark:bg-slate-700/50';
}

function getRateTextColor(rate: number): string {
    if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 60) return 'text-indigo-600 dark:text-indigo-400';
    if (rate >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-500 dark:text-slate-400';
}

export default function CompanyMeetingUtilWidget({ data, size }: CompanyMeetingUtilWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const rawRooms = Array.isArray(data) ? data : (data?.byRoom ?? data?.rooms ?? data?.stats ?? data?.data ?? []);
    const rooms: RoomStat[] = rawRooms.map((r: { roomName?: string; name?: string; utilizationRate?: number; count?: number; totalSlots?: number; usedSlots?: number }) => ({
        roomName: r.roomName ?? r.name ?? '',
        utilizationRate: r.utilizationRate ?? (r.totalSlots && r.totalSlots > 0 ? Math.round(((r.usedSlots ?? r.count ?? 0) / r.totalSlots) * 100) : r.count ?? 0),
        totalSlots: r.totalSlots,
        usedSlots: r.usedSlots ?? r.count,
    }));

    const avgRate = rooms.length > 0
        ? Math.round(rooms.reduce((sum, r) => sum + (r.utilizationRate || 0), 0) / rooms.length)
        : 0;

    const availableRooms = rooms.filter(r => (r.utilizationRate || 0) < 80).length;

    const displayCount = isSmall ? 0 : isLarge ? 8 : 6;

    // Small: 가동률% + 사용 가능 회의실 수
    if (isSmall) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-sm">
                            <Building2 size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">회의실 가동률</p>
                            <p className={`text-2xl font-black tabular-nums ${getRateTextColor(avgRate)}`}>
                                {avgRate}<span className="text-xs font-bold text-slate-400 dark:text-slate-400 ml-0.5">%</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-emerald-600 tabular-nums">
                            {availableRooms}<span className="text-[10px] font-bold text-slate-400 ml-0.5">실</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400">사용 가능</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                        <Building2 size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">전사 회의실 가동률</h4>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">평균</span>
                    <span className="text-sm font-black text-indigo-600 tabular-nums">{avgRate}%</span>
                </div>
            </div>

            {/* 수평 프로그레스 바 그룹 */}
            <div className={`flex-1 min-h-0 overflow-auto ${isLarge ? 'grid grid-cols-2 gap-x-4 gap-y-1.5 content-start' : 'space-y-1.5'}`}>
                {rooms.length === 0 ? (
                    <div className={`flex-1 flex flex-col items-center justify-center py-4 ${isLarge ? 'col-span-2' : ''}`}>
                        <DoorOpen size={24} className="text-slate-200 dark:text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">회의실 데이터가 없습니다</p>
                    </div>
                ) : (
                    rooms.slice(0, displayCount).map((room, idx) => {
                        const rate = room.utilizationRate || 0;
                        return (
                            <div key={idx} className="group/bar">
                                <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center ${getBarBg(rate)}`}>
                                            <DoorOpen size={10} className={getRateTextColor(rate)} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/bar:text-indigo-600 transition-colors">
                                            {room.roomName}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-black tabular-nums ${getRateTextColor(rate)}`}>
                                        {rate}%
                                    </span>
                                </div>
                                <div className="h-2 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${getBarGradient(rate)} rounded-full transition-all duration-1000 ease-out relative`}
                                        style={{ width: `${Math.max(rate, 2)}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
