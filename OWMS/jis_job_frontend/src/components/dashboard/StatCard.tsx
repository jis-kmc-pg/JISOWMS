import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "indigo" }: StatCardProps) {
    const colorClasses: { [key: string]: string } = {
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
        rose: "bg-rose-50 text-rose-600",
        amber: "bg-amber-50 text-amber-600",
        slate: "bg-slate-100 text-slate-600",
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-2">{value}</h3>
                    {trend && (
                        <p className={`text-xs font-bold mt-2 flex items-center ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {trendUp ? '▲' : '▼'} {trend}
                            <span className="text-slate-400 ml-1 font-medium">vs 지난달</span>
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.indigo}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
}
