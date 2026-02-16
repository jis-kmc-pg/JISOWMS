import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string;
}

function formatDisplayValue(value: string | number): string {
    if (typeof value === 'string') return value;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(value);
}

const colorConfig: Record<string, {
    stripe: string;
    iconBg: string;
    iconText: string;
}> = {
    indigo: {
        stripe: 'from-indigo-500 to-indigo-600',
        iconBg: 'bg-indigo-50',
        iconText: 'text-indigo-600',
    },
    emerald: {
        stripe: 'from-emerald-500 to-emerald-600',
        iconBg: 'bg-emerald-50',
        iconText: 'text-emerald-600',
    },
    rose: {
        stripe: 'from-rose-500 to-rose-600',
        iconBg: 'bg-rose-50',
        iconText: 'text-rose-600',
    },
    amber: {
        stripe: 'from-amber-500 to-amber-600',
        iconBg: 'bg-amber-50',
        iconText: 'text-amber-600',
    },
    slate: {
        stripe: 'from-slate-500 to-slate-600',
        iconBg: 'bg-slate-100',
        iconText: 'text-slate-600',
    },
    purple: {
        stripe: 'from-purple-500 to-purple-600',
        iconBg: 'bg-purple-50',
        iconText: 'text-purple-600',
    },
    cyan: {
        stripe: 'from-cyan-500 to-cyan-600',
        iconBg: 'bg-cyan-50',
        iconText: 'text-cyan-600',
    },
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "indigo" }: StatCardProps) {
    const cfg = colorConfig[color] || colorConfig.indigo;
    const displayValue = formatDisplayValue(value);

    return (
        <div className="group relative bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            {/* 좌측 컬러 스트라이프 */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${cfg.stripe}`} />

            <div className="p-6 pl-5 ml-1.5">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide truncate">{title}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-2">{displayValue}</h3>
                        {trend && (
                            <div className={`flex items-center gap-1.5 mt-2.5 ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <div className={`flex items-center justify-center w-5 h-5 rounded-full ${trendUp ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                    {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                </div>
                                <span className="text-xs font-bold">{trend}</span>
                                <span className="text-slate-400 text-xs font-medium">vs 지난달</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl ${cfg.iconBg} ${cfg.iconText} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
}
