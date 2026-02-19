'use client';

import React, { useMemo } from 'react';
import { Car, DoorOpen, Activity } from 'lucide-react';

interface DispatchStat {
    vehicleName: string;
    count: number;
    totalCapacity?: number;
}

interface MeetingRoomStat {
    roomName: string;
    usedSlots?: number;
    totalSlots?: number;
    utilizationRate?: number;
}

interface DeptResourceUtilWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

interface CircularProgressProps {
    percentage: number;
    color: string;
    trackColor: string;
    size?: number;
    strokeWidth?: number;
}

function CircularProgress({ percentage, color, trackColor, size = 90, strokeWidth = 8 }: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* 트랙 */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={trackColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
            {/* 프로그레스 */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
            />
        </svg>
    );
}

export default function DeptResourceUtilWidget({ data, size }: DeptResourceUtilWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    // 배차 데이터 추출 - API returns {totalDispatches, byVehicle:[{name, count}]}
    const rawDispatch = data?.byVehicle ?? data?.data ?? data?.dispatches ?? data?.stats ?? (Array.isArray(data) ? data : []);
    const dispatchStats: DispatchStat[] = rawDispatch.map((d: { vehicleName?: string; name?: string; count?: number; totalCapacity?: number }) => ({
        vehicleName: d.vehicleName ?? d.name ?? '',
        count: d.count ?? 0,
        totalCapacity: d.totalCapacity ?? 0,
    }));

    // 회의실 데이터 추출 (동일 데이터 or 별도 필드)
    const rawMeeting = data?.byRoom ?? data?.meetings ?? data?.rooms ?? [];
    const meetingStats: MeetingRoomStat[] = rawMeeting.map((r: { roomName?: string; name?: string; usedSlots?: number; totalSlots?: number; utilizationRate?: number; count?: number }) => ({
        roomName: r.roomName ?? r.name ?? '',
        usedSlots: r.usedSlots ?? r.count ?? 0,
        totalSlots: r.totalSlots,
        utilizationRate: r.utilizationRate,
    }));

    // 배차 활용률 계산
    const dispatchUtil = useMemo(() => {
        const totalCount = dispatchStats.reduce((s, d) => s + (d.count ?? 0), 0);
        const totalCapacity = dispatchStats.reduce((s, d) => s + (d.totalCapacity ?? 0), 0);
        if (totalCapacity > 0) {
            return Math.round((totalCount / totalCapacity) * 100);
        }
        // totalCapacity가 없으면 건수만 표시
        return totalCount > 0 ? Math.min(totalCount * 10, 100) : 0;
    }, [dispatchStats]);

    // 회의실 활용률 계산
    const meetingUtil = useMemo(() => {
        if (meetingStats.length === 0) {
            // 회의실 데이터가 없으면 data에서 직접 추출 시도
            const rate = data?.meetingUtilization ?? data?.meetingRate ?? null;
            return rate !== null ? Math.round(rate) : 0;
        }
        const rates = meetingStats.map(r => {
            if (r.utilizationRate !== undefined) return r.utilizationRate;
            if (r.totalSlots && r.totalSlots > 0) return Math.round(((r.usedSlots ?? 0) / r.totalSlots) * 100);
            return 0;
        });
        return rates.length > 0 ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length) : 0;
    }, [meetingStats, data]);

    const totalDispatches = dispatchStats.reduce((s, d) => s + (d.count ?? 0), 0);
    const totalMeetingUsed = meetingStats.reduce((s, r) => s + (r.usedSlots ?? 0), 0);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <Activity size={14} className="text-indigo-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">부서 배차/회의실 활용률</h4>
            </div>

            {/* Small: 두 가지 컴팩트 스탯 (배차율% + 회의실율%) */}
            {isSmall ? (
                <div className="flex-1 flex items-center justify-around gap-2">
                    <div className="text-center">
                        <p className="text-lg font-black tabular-nums text-indigo-600">{dispatchUtil}%</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400">배차</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black tabular-nums text-emerald-600">{meetingUtil}%</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400">회의실</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Medium / Large: 듀얼 서큘러 프로그레스 */}
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <div className={`grid grid-cols-2 w-full ${isLarge ? 'gap-6' : 'gap-4'}`}>
                            {/* 배차 활용률 */}
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="relative">
                                    <CircularProgress
                                        percentage={dispatchUtil}
                                        color="#6366f1"
                                        trackColor="#e0e7ff"
                                        size={isLarge ? 80 : 70}
                                        strokeWidth={isLarge ? 10 : 8}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="font-black text-indigo-600 tabular-nums text-lg">{dispatchUtil}%</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <Car size={12} className="text-indigo-500" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">배차</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400">
                                        {totalDispatches}건 이용
                                    </p>
                                </div>
                            </div>

                            {/* 회의실 활용률 */}
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="relative">
                                    <CircularProgress
                                        percentage={meetingUtil}
                                        color="#10b981"
                                        trackColor="#d1fae5"
                                        size={isLarge ? 80 : 70}
                                        strokeWidth={isLarge ? 10 : 8}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="font-black text-emerald-600 tabular-nums text-lg">{meetingUtil}%</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <DoorOpen size={12} className="text-emerald-500" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">회의실</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400">
                                        {meetingStats.length > 0 ? `${totalMeetingUsed}슬롯 이용` : '데이터 없음'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
