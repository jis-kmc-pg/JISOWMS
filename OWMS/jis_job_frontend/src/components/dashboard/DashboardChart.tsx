import React from 'react';
import {
    ResponsiveContainer,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell,
    LineChart, Line,
    AreaChart, Area,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartData = Record<string, any>[];

interface DashboardChartProps {
    title: string;
    type: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'horizontal-bar' | 'radar' | 'bar-donut';
    data: ChartData;
    dataKey: string | string[]; // 다중 키 지원
    categoryKey?: string;
    colors?: string[];
    height?: number;
    stacked?: boolean; // 스택 여부
}

const COLORS = [
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // rose
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#a855f7', // purple
];

const tooltipStyle = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
    fontSize: '12px',
    padding: '10px 14px',
};

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

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={data} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey={categoryKey} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                        <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }} />
                        {keys.map((key, idx) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId={stacked ? 'a' : undefined}
                                fill={colors[idx % colors.length]}
                                radius={stacked ? (idx === keys.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]) : [8, 8, 0, 0]}
                                barSize={stacked ? 32 : 24}
                                animationDuration={800}
                                animationEasing="ease-out"
                            />
                        ))}
                    </BarChart>
                );

            case 'horizontal-bar':
                return (
                    <BarChart data={data} layout="vertical" barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis type="category" dataKey={categoryKey} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} width={80} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                        <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }} />
                        {keys.map((key, idx) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId={stacked ? 'a' : undefined}
                                fill={colors[idx % colors.length]}
                                radius={[0, 8, 8, 0]}
                                barSize={20}
                                animationDuration={800}
                                animationEasing="ease-out"
                            />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey={categoryKey} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }} />
                        <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }} />
                        {keys.map((key, idx) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[idx % colors.length]}
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#fff', strokeWidth: 2.5, stroke: colors[idx % colors.length] }}
                                activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: colors[idx % colors.length] }}
                                animationDuration={1000}
                                animationEasing="ease-out"
                            />
                        ))}
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart data={data}>
                        <defs>
                            {keys.map((key, idx) => (
                                <linearGradient key={`gradient-${key}`} id={`areaGradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0.02} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey={categoryKey} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }} />
                        <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }} />
                        {keys.map((key, idx) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[idx % colors.length]}
                                strokeWidth={2.5}
                                fill={`url(#areaGradient-${key})`}
                                dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: colors[idx % colors.length] }}
                                activeDot={{ r: 5, strokeWidth: 2.5, stroke: '#fff', fill: colors[idx % colors.length] }}
                                animationDuration={1000}
                                animationEasing="ease-out"
                            />
                        ))}
                    </AreaChart>
                );

            case 'radar':
                return (
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey={categoryKey} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                        <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }} />
                        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '12px' }} />
                        {keys.map((key, idx) => (
                            <Radar
                                key={key}
                                name={key}
                                dataKey={key}
                                stroke={colors[idx % colors.length]}
                                fill={colors[idx % colors.length]}
                                fillOpacity={0.15}
                                strokeWidth={2}
                                animationDuration={800}
                            />
                        ))}
                    </RadarChart>
                );

            case 'pie':
            case 'donut':
            default:
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={type === 'donut' ? 60 : 0}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey={keys[0]}
                            nameKey={categoryKey}
                            stroke="none"
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {data.map((_entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
                                />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
                        />
                    </PieChart>
                );
        }
    };

    // ── bar-donut dual 차트: 별도 레이아웃 ──
    if (type === 'bar-donut') {
        const donutData = data.map((item, idx) => ({
            name: item[categoryKey],
            value: Number(item[keys[0]] || 0),
        }));

        return (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-full flex flex-col hover:shadow-md transition-all">
                <h4 className="text-lg font-bold text-slate-800 mb-6">{title}</h4>
                <div className="flex-1 flex flex-col lg:flex-row gap-4" style={{ minHeight: height }}>
                    {/* 좌측: 스택 바 */}
                    <div className="flex-1" style={{ height }}>
                        <ResponsiveContainer>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey={categoryKey}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                    dy={8}
                                    interval={0}
                                    angle={-15}
                                    textAnchor="end"
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 700 }} />
                                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 700 }} />
                                {keys.map((key, idx) => (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        stackId="stack"
                                        fill={colors[idx % colors.length]}
                                        radius={idx === keys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                                        barSize={28}
                                        animationDuration={800}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* 우측: 도넛 */}
                    <div className="lg:w-[200px] flex flex-col items-center justify-center">
                        <div style={{ width: 160, height: 160 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                        nameKey="name"
                                        stroke="none"
                                    >
                                        {donutData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                            {donutData.slice(0, 6).map((d, i) => (
                                <span key={i} className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                    {d.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-full flex flex-col hover:shadow-md transition-all">
            <h4 className="text-lg font-bold text-slate-800 mb-6">{title}</h4>
            <div className="flex-1" style={{ width: '100%', height: height }}>
                <ResponsiveContainer>
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
