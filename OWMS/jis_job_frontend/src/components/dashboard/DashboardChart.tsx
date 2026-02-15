import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartData = Record<string, any>[];

interface DashboardChartProps {
    title: string;
    type: 'bar' | 'line' | 'pie' | 'donut';
    data: ChartData;
    dataKey: string | string[]; // 다중 키 지원
    categoryKey?: string;
    colors?: string[];
    height?: number;
    stacked?: boolean; // 스택 여부
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#a855f7', '#ec4899'];

export default function DashboardChart({
    title,
    type,
    data,
    dataKey,
    categoryKey = 'name',
    colors = COLORS,
    height = 300,
    stacked = false
}: DashboardChartProps) {
    const keys = Array.isArray(dataKey) ? dataKey : [dataKey];

    return (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-full flex flex-col">
            <h4 className="text-lg font-bold text-slate-800 mb-6">{title}</h4>
            <div className="flex-1" style={{ width: '100%', height: height }}>
                <ResponsiveContainer>
                    {type === 'bar' ? (
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey={categoryKey} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                itemStyle={{ fontWeight: 600 }}
                            />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
                            {keys.map((key, idx) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    stackId={stacked ? 'a' : undefined}
                                    fill={colors[idx % colors.length]}
                                    radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                                    barSize={stacked ? 30 : undefined}
                                />
                            ))}
                        </BarChart>
                    ) : type === 'line' ? (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey={categoryKey} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
                            {keys.map((key, idx) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[idx % colors.length]}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    ) : (
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={type === 'donut' ? 60 : 0}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey={keys[0]}
                                nameKey={categoryKey}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
