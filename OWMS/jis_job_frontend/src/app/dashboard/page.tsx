'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Users, Calendar, Briefcase, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import CalendarComponent from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import StatCard from '../../components/dashboard/StatCard';
import DashboardChart from '../../components/dashboard/DashboardChart';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface LeaveInfo {
    startDate: string;
    endDate: string;
    type: string;
    status: string;
}

interface TeamMember {
    name: string;
    position?: string;
    upcomingLeave: LeaveInfo[];
}

interface WeeklyWorkStat {
    name: string;
    thisWeek: number;
    nextWeek: number;
}

interface NextWeekPlan {
    projectName: string;
    title: string;
    date: string;
    memberName: string;
}

interface DashboardKpi {
    totalEmployees?: number;
    todayOnLeave?: number;
    utilizationRate?: number;
    deptMembers?: number;
    avgUtilization?: number;
    remainingDays?: number;
    usedDays?: number;
    [key: string]: number | string | undefined;
}

interface DashboardStats {
    scope: 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'PERSONAL';
    kpi: DashboardKpi;
    charts?: { deptUsage: Array<{ name: string; count: number }> };
    members: TeamMember[];
    stats: {
        weeklyWorkStats: WeeklyWorkStat[];
        jobNameStats: Array<{ name: string; weight: number; issueCount: number }>;
        nextWeekPlans: NextWeekPlan[];
    };
    recent: LeaveInfo[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [value, setValue] = useState<Value>(new Date());
    const router = useRouter();

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const res = await api.get('/metrics/dashboard');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center flex-col gap-4">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">대시보드 데이터를 불러오는 중...</p>
        </div>
    );
    if (!stats) return <div className="flex h-screen items-center justify-center text-slate-500">데이터를 불러올 수 없습니다.</div>;

    // --- Render Logic based on Scope ---

    // 1. Company (CEO/Exec)
    if (stats.scope === 'COMPANY') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">전사 현황 대시보드</h2>
                    <p className="text-slate-500 font-medium mt-1">회사 전체의 인력 및 연차 현황을 한눈에 확인하세요.</p>
                </div>

                {/* 1. KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="전체 임직원" value={`${stats.kpi.totalEmployees}명`} icon={Users} color="indigo" />
                    <StatCard title="금일 휴가자" value={`${stats.kpi.todayOnLeave}명`} icon={Calendar} color="rose" trend="2명" trendUp={true} />
                    <StatCard title="평균 연차 소진율" value={`${stats.kpi.utilizationRate}%`} icon={TrendingUp} color="emerald" />
                    <StatCard title="진행 중 프로젝트" value="12개" icon={Briefcase} color="amber" />
                </div>

                {/* 2. Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-96">
                    <DashboardChart
                        title="부서별 연차 사용 현황"
                        type="bar"
                        data={stats.charts?.deptUsage ?? []}
                        dataKey="count"
                        colors={['#6366f1']}
                    />
                    <DashboardChart
                        title="전사 업무 상태 비율"
                        type="donut"
                        data={[
                            { name: '진행 중', value: 45 },
                            { name: '대기 중', value: 20 },
                            { name: '완료', value: 35 },
                        ]}
                        dataKey="value"
                        colors={['#3b82f6', '#fbbf24', '#10b981']}
                    />
                </div>
            </div>
        );
    }

    // 2. Department (Dept Head)
    if (stats.scope === 'DEPARTMENT') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">부서 현황 대시보드</h2>
                    <p className="text-slate-500 font-medium mt-1">소속 부서의 근태 및 업무 현황입니다.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="부서 총원" value={`${stats.kpi.deptMembers}명`} icon={Users} color="indigo" />
                    <StatCard title="금일 휴가자" value={`${stats.kpi.todayOnLeave}명`} icon={Calendar} color="rose" />
                    <StatCard title="평균 소진율" value={`${stats.kpi.avgUtilization}%`} icon={TrendingUp} color="emerald" />
                </div>

                {/* Placeholder for Dept specific charts */}
                <div className="bg-stone-50 border border-stone-200 border-dashed rounded-2xl h-64 flex items-center justify-center text-slate-400 font-bold">
                    부서별 상세 차트 영역 (준비 중)
                </div>
            </div>
        );
    }

    // 3. Team (Team Lead)
    if (stats.scope === 'TEAM') {
        const totalThisWeek = stats.stats.weeklyWorkStats.reduce((acc: number, cur: WeeklyWorkStat) => acc + cur.thisWeek, 0);
        const totalNextWeek = stats.stats.weeklyWorkStats.reduce((acc: number, cur: WeeklyWorkStat) => acc + cur.nextWeek, 0);

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">팀 현황 대시보드</h2>
                        <p className="text-slate-500 font-medium mt-1">팀원들의 근태와 주간 업무 현황을 관리하세요.</p>
                    </div>
                </div>

                {/* 1. Team KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="팀원 수" value={`${stats.members.length}명`} icon={Users} color="indigo" />
                    <StatCard title="금일 팀 휴가" value={`${stats.members.filter((m: TeamMember) => m.upcomingLeave.some((l: LeaveInfo) => {
                        const s = new Date(l.startDate).toISOString().split('T')[0];
                        const e = new Date(l.endDate).toISOString().split('T')[0];
                        const t = new Date().toISOString().split('T')[0];
                        return t >= s && t <= e;
                    })).length}명`} icon={Calendar} color="rose" />
                    <StatCard title="금주 팀 업무" value={`${totalThisWeek}건`} icon={Briefcase} color="emerald" trend="진행 완료" />
                    <StatCard title="차주 팀 업무" value={`${totalNextWeek}건`} icon={Clock} color="amber" trend="예정 사항" trendUp={true} />
                </div>

                {/* 2. Charts Section - Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[400px]">
                    <DashboardChart
                        title="주간 업무 현황 (금주 vs 차주)"
                        type="bar"
                        data={stats.stats.weeklyWorkStats}
                        dataKey={['thisWeek', 'nextWeek']}
                        categoryKey="name"
                        colors={['#6366f1', '#fbbf24']}
                    />
                    <DashboardChart
                        title="업무명별 가중치 통계"
                        type="bar"
                        stacked={true}
                        data={stats.stats.jobNameStats}
                        dataKey={['weight', 'issueCount']}
                        categoryKey="name"
                        colors={['#10b981', '#ef4444']}
                    />
                </div>

                {/* 3. Charts Section - Row 2 & Members */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Team Members List */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col">
                        <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Users size={20} className="text-indigo-500" /> 팀원 근태
                        </h4>
                        <div className="space-y-4 overflow-y-auto max-h-[400px] flex-1 pr-2 custom-scrollbar">
                            {stats.members.map((m: TeamMember, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-extrabold text-sm">
                                            {m.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{m.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{m.position || 'MEMBER'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {m.upcomingLeave.length > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black border border-rose-100 uppercase">
                                                <Calendar size={10} /> {new Date(m.upcomingLeave[0].startDate).getMonth() + 1}/{new Date(m.upcomingLeave[0].startDate).getDate()} 휴가
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100 uppercase">
                                                <CheckCircle size={10} /> 근무 중
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Job Name Ratio Pie */}
                    <div className="lg:col-span-1">
                        <DashboardChart
                            title="업무명별 비중"
                            type="pie"
                            data={stats.stats.jobNameStats}
                            dataKey="weight"
                            categoryKey="name"
                        />
                    </div>

                    {/* Calendar Section (Reduced height) */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col min-h-[400px]">
                        <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-500" /> 팀 업무 캘린더
                        </h4>
                        <div className="flex-1 calendar-container overflow-hidden">
                            <CalendarComponent
                                onChange={setValue}
                                value={value}
                                className="w-full border-none font-sans"
                                tileContent={({ date, view }: { date: Date, view: string }) => {
                                    if (view === 'month') {
                                        const dateStr = date.toISOString().split('T')[0];
                                        const leaves = stats.members.flatMap((m: TeamMember) =>
                                            m.upcomingLeave.filter((l: LeaveInfo) => {
                                                const start = new Date(l.startDate).toISOString().split('T')[0];
                                                const end = new Date(l.endDate).toISOString().split('T')[0];
                                                return dateStr >= start && dateStr <= end;
                                            }).map((l: LeaveInfo) => ({ ...l, memberName: m.name }))
                                        );

                                        if (leaves.length > 0) {
                                            return (
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    {leaves.slice(0, 2).map((l: LeaveInfo & { memberName: string }, i: number) => (
                                                        <div key={i} className="text-[8px] px-1 py-0.5 rounded bg-rose-100 text-rose-700 font-bold truncate">
                                                            {l.memberName}
                                                        </div>
                                                    ))}
                                                    {leaves.length > 2 && (
                                                        <div className="text-[8px] text-slate-400 font-bold">+{leaves.length - 2}</div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    }
                                }}
                            />
                        </div>
                        <style jsx global>{`
                            .calendar-container .react-calendar { width: 100%; border: none; font-size: 11px; }
                            .calendar-container .react-calendar__tile { height: 60px; padding: 2px; border: 1px solid #f5f5f4; font-size: 10px; }
                            .calendar-container .react-calendar__tile--now { background: #eff6ff; }
                            .calendar-container .react-calendar__tile--active { background: #e0e7ff; color: #3730a3; }
                            .calendar-container .react-calendar__month-view__days__day--weekend { color: #ef4444; }
                        `}</style>
                    </div>
                </div>

                {/* 4. Next Week Major Plans */}
                <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Briefcase size={20} className="text-indigo-500" /> 차주 주요 업무 계획
                    </h4>
                    {stats.stats.nextWeekPlans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.stats.nextWeekPlans.map((plan: NextWeekPlan, idx: number) => (
                                <div key={idx} className="p-5 bg-stone-50 rounded-2xl border border-stone-100 hover:border-indigo-200 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                            {plan.projectName}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 bg-stone-50 px-2 py-1 rounded">
                                            {new Date(plan.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{plan.title}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black">{plan.memberName[0]}</div>
                                        <span className="text-xs text-slate-500 font-bold">{plan.memberName}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-stone-50 rounded-2xl border border-stone-100 border-dashed text-slate-400 font-bold uppercase tracking-widest text-sm">
                            차주 예정된 업무가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 4. Personal (Me)
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-black text-slate-800">나의 대시보드</h2>
                <p className="text-slate-500 font-medium mt-1">오늘의 일정과 연차 현황을 확인하세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="남은 연차" value={`${stats.kpi.remainingDays}일`} icon={Calendar} color="emerald" />
                <StatCard title="사용 연차" value={`${stats.kpi.usedDays}일`} icon={Clock} color="slate" />
                <StatCard title="진행 중 업무" value="5건" icon={Briefcase} color="indigo" />
                <StatCard title="승인 대기" value="1건" icon={AlertCircle} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Vacations */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-indigo-500" /> 다가오는 연차 일정
                    </h4>
                    {stats.recent.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recent.map((v: LeaveInfo, idx: number) => (
                                <div key={idx} className="flex items-center p-4 bg-stone-50 rounded-xl border border-stone-100">
                                    <div className={`w-1.5 h-10 rounded-full mr-4 ${v.type === 'WHOLE' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                    <div>
                                        <p className="font-bold text-slate-700">{v.type === 'WHOLE' ? '연차' : '반차'}</p>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {new Date(v.startDate).toLocaleDateString()} ~ {new Date(v.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="ml-auto px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs font-bold text-slate-600">
                                        {v.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400 font-medium">예정된 연차 일정이 없습니다.</div>
                    )}
                </div>

                {/* Vertical Gauge Chart Placeholder */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center">
                    <h4 className="text-lg font-bold text-slate-800 mb-6 w-full text-left">연차 소진율</h4>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        {/* Simple CSS Doughnut */}
                        <div className="w-full h-full rounded-full border-[12px] border-stone-100 border-t-indigo-500 animate-spin-slow" style={{ transform: 'rotate(-45deg)' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-black text-indigo-600">
                                {Math.round(((stats.kpi.usedDays ?? 0) / 15) * 100)}%
                            </span>
                            <span className="text-xs text-slate-400 font-bold">소진됨</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
