'use client';

import React, { useMemo } from 'react';
import { CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';
import {
    ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

interface VacationTrendItem {
    month: string;
    count: number;
    cumulative?: number;
    approved?: number;
}

interface MonthlyVacationTrendWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

export default function MonthlyVacationTrendWidget({ data, size }: MonthlyVacationTrendWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const trendData: VacationTrendItem[] = Array.isArray(data) ? data : (data?.data || data?.stats || data?.trend || []);

    // 누적 값이 없으면 자동 계산
    const chartData = useMemo(() => {
        let cum = 0;
        return trendData.map(item => {
            cum += item.count || 0;
            return {
                ...item,
                cumulative: item.cumulative ?? cum,
            };
        });
    }, [trendData]);

    const totalUsed = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0;
    const latestMonth = chartData.length > 0 ? chartData[chartData.length - 1].count : 0;
    const prevMonth = chartData.length > 1 ? chartData[chartData.length - 2].count : 0;
    const trendUp = latestMonth >= prevMonth;

    const chartHeight = isLarge ? 160 : 140;

    // Small: 이번 달 사용 건수 + 트렌드 화살표
    if (isSmall) {
        return (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-sm">
                            <CalendarDays size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">이번 달 연차</p>
                            <p className="text-2xl font-black text-purple-700 tabular-nums">
                                {latestMonth}<span className="text-xs font-bold text-slate-400 ml-0.5">일</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                            {trendUp ? (
                                <TrendingUp size={14} className="text-rose-500" />
                            ) : (
                                <TrendingDown size={14} className="text-emerald-500" />
                            )}
                            <span className={`text-xs font-bold ${trendUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                                vs 전월
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            누적 {totalUsed}일
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                        <CalendarDays size={14} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">월간 연차 사용 추이</h4>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-purple-600 tabular-nums">누적 {totalUsed}일</span>
                </div>
            </div>

            {/* 이중 축 차트 */}
            <div className="flex-1 min-h-0 overflow-auto">
                {chartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-4">
                        <CalendarDays size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">데이터가 없습니다</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradVacation" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                dy={5}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                width={30}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    color: '#fff',
                                    padding: '6px 10px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                }}
                                itemStyle={{ fontWeight: 600 }}
                                labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, marginBottom: '2px' }}
                                formatter={(value?: number, name?: string) => {
                                    if (name === 'count') return [`${value ?? 0}일`, '월별 사용'];
                                    if (name === 'cumulative') return [`${value ?? 0}일`, '누적'];
                                    return [`${value ?? 0}`, name ?? ''];
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="count"
                                fill="url(#barGradVacation)"
                                radius={[4, 4, 0, 0]}
                                barSize={isLarge ? 28 : 20}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cumulative"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#fff', stroke: '#f59e0b', strokeWidth: 2 }}
                                activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
