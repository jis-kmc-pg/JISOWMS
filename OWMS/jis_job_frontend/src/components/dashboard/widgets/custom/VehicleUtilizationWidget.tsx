'use client';

import React, { useMemo } from 'react';
import { Truck, Activity, Car } from 'lucide-react';

interface DispatchStat {
    vehicleName?: string;
    count?: number;
    totalCapacity?: number;
}

interface VehicleUtilizationWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

const SEGMENT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

export default function VehicleUtilizationWidget({ data, size }: VehicleUtilizationWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const rawStats = Array.isArray(data) ? data : (data?.byVehicle ?? data?.data ?? data?.stats ?? []);
    const stats: DispatchStat[] = rawStats.map((s: { vehicleName?: string; name?: string; count?: number; totalCapacity?: number }) => ({
        vehicleName: s.vehicleName ?? s.name ?? '',
        count: s.count ?? 0,
        totalCapacity: s.totalCapacity ?? 0,
    }));

    const { totalVehicles, activeDispatches, utilizationRate, segments } = useMemo(() => {
        const totalCap = stats.reduce((s, d) => s + (d?.totalCapacity ?? 0), 0);
        const totalCount = stats.reduce((s, d) => s + (d?.count ?? 0), 0);
        const vehicles = stats.length;
        const rate = totalCap > 0
            ? Math.round((totalCount / totalCap) * 100)
            : vehicles > 0
                ? Math.min(Math.round((totalCount / vehicles) * 100), 100)
                : 0;

        // SVG 도넛 세그먼트 계산
        const total = totalCount || 1;
        let cumulativePercent = 0;
        const segs = stats
            .filter(s => (s?.count ?? 0) > 0)
            .map((s, idx) => {
                const percent = ((s?.count ?? 0) / total) * 100;
                const offset = cumulativePercent;
                cumulativePercent += percent;
                return {
                    name: s?.vehicleName ?? `차량 ${idx + 1}`,
                    percent,
                    offset,
                    color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
                    count: s?.count ?? 0,
                    capacity: s?.totalCapacity ?? 0,
                };
            });

        return {
            totalVehicles: vehicles,
            activeDispatches: totalCount,
            utilizationRate: Math.min(rate, 100),
            segments: segs,
        };
    }, [stats]);

    // SVG 도넛 파라미터 - medium: 80px, large: 60px
    const donutSize = isLarge ? 60 : 80;
    const radius = isLarge ? 22 : 30;
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = isLarge ? 8 : 10;
    const viewBox = isLarge ? '0 0 60 60' : '0 0 80 80';
    const center = isLarge ? 30 : 40;

    // Small: 가동률% 단일 통계
    if (isSmall) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-sm">
                            <Truck size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">차량 가동률</p>
                            <p className="text-2xl font-black text-indigo-700 tabular-nums">
                                {utilizationRate}<span className="text-xs font-bold text-slate-400 dark:text-slate-400 ml-0.5">%</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">{totalVehicles}대</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">{activeDispatches}건 운행</p>
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
                        <Truck size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">차량 가동률</h4>
                </div>
                <span className="text-xs font-bold text-indigo-600 tabular-nums">{utilizationRate}%</span>
            </div>

            {/* 도넛 차트 + 통계 */}
            <div className="flex-1 min-h-0 overflow-auto">
                {stats.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-4">
                        <Truck size={24} className="text-slate-200 dark:text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">차량 데이터가 없습니다</p>
                    </div>
                ) : (
                    <div className={`flex ${isLarge ? 'flex-row items-start gap-4' : 'flex-row items-center gap-3'}`}>
                        {/* SVG 도넛 차트 */}
                        <div className="relative flex-shrink-0" style={{ width: donutSize, height: donutSize }}>
                            <svg
                                viewBox={viewBox}
                                className="w-full h-full transform -rotate-90"
                            >
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke="#f1f5f9"
                                    strokeWidth={strokeWidth}
                                />
                                {segments.map((seg, idx) => {
                                    const dashLength = (seg.percent / 100) * circumference;
                                    const dashOffset = -((seg.offset / 100) * circumference);

                                    return (
                                        <circle
                                            key={idx}
                                            cx={center}
                                            cy={center}
                                            r={radius}
                                            fill="none"
                                            stroke={seg.color}
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                                            strokeDashoffset={dashOffset}
                                            strokeLinecap="round"
                                            className="transition-all duration-700 ease-out"
                                        />
                                    );
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`${isLarge ? 'text-sm' : 'text-base'} font-black text-indigo-700 tabular-nums`}>
                                    {utilizationRate}%
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* 통계 카드 */}
                            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                                <div className="flex items-center gap-1.5 p-1.5 bg-indigo-50/60 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                    <Car size={12} className="text-indigo-600" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">차량</p>
                                        <p className="text-sm font-black text-indigo-700 tabular-nums">
                                            {totalVehicles}<span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 ml-0.5">대</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50/60 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                    <Activity size={12} className="text-emerald-600" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">운행</p>
                                        <p className="text-sm font-black text-emerald-700 tabular-nums">
                                            {activeDispatches}<span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 ml-0.5">건</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 차량별 범례 */}
                            {segments.length > 0 && (
                                <div className={isLarge ? 'space-y-1' : 'flex flex-wrap gap-x-3 gap-y-0.5'}>
                                    {segments.slice(0, isLarge ? 8 : 5).map((seg, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: seg.color }}
                                            />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                                                {seg.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                                                ({seg.count}건)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
