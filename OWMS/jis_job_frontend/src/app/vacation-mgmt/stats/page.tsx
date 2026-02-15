'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Save, RotateCcw, Edit3, X, Calculator, Calendar } from 'lucide-react';
import api from '@/lib/api';

interface MonthlyAdjustment {
    month: number;
    amount: number;
}

interface VacationStatRow {
    userId: number;
    name: string;
    userName?: string;
    departmentName?: string;
    deptName?: string;
    position?: string;
    joinDate: string;
    totalAllowance: number;
    carryover: number;
    monthlyUsage: number[];
    used: number;
    remaining: number;
}

interface EditValueState {
    joinDate: string;
    totalAllowance: number;
    carryover: number;
    monthlyAdjustments: MonthlyAdjustment[];
}

export default function VacationStatsPage() {
    const [stats, setStats] = useState<VacationStatRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<EditValueState | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/vacations/admin/stats');
            setStats(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEditStart = (item: VacationStatRow) => {
        setEditMode(item.userId);
        // Map monthlyUsage to a more editable structure
        const monthlyAdjustments = rowToMonthlyAdjustments(item);
        setEditValue({
            joinDate: item.joinDate === '-' ? '' : item.joinDate,
            totalAllowance: item.totalAllowance,
            carryover: item.carryover,
            monthlyAdjustments: rowToMonthlyAdjustments(item)
        });
    };

    const rowToMonthlyAdjustments = (row: VacationStatRow) => {
        return row.monthlyUsage.map((val: number, idx: number) => ({
            month: idx + 1,
            amount: val
        }));
    };

    const handleValueChange = (field: string, value: string | number) => {
        setEditValue(prev => prev ? { ...prev, [field]: value } : prev);
    };

    const handleMonthlyChange = (monthIdx: number, value: string) => {
        const val = parseFloat(value) || 0;
        setEditValue(prev => {
            if (!prev) return prev;
            const nextAdjs = [...prev.monthlyAdjustments];
            nextAdjs[monthIdx] = { ...nextAdjs[monthIdx], amount: val };
            return { ...prev, monthlyAdjustments: nextAdjs };
        });
    };

    const handleSave = async (userId: number) => {
        if (!editValue) return;
        setLoading(true);
        try {
            await api.post(`/vacations/admin/stats-config/${userId}`, {
                joinDate: editValue?.joinDate || undefined,
                annualLeaveOverride: parseFloat(String(editValue?.totalAllowance)),
                carryoverLeave: parseFloat(String(editValue?.carryover)),
                monthlyAdjustments: editValue?.monthlyAdjustments
            });
            alert('설정이 저장되었습니다.');
            setEditMode(null);
            fetchData();
        } catch (e) {
            console.error(e);
            alert('저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate live values for the editing row
    const calculateLiveStats = () => {
        if (!editValue) return null;
        const total = (Number(editValue?.totalAllowance) || 0) + (Number(editValue?.carryover) || 0);
        const used = editValue?.monthlyAdjustments.reduce((acc: number, adj: MonthlyAdjustment) => acc + (adj.amount || 0), 0);
        return { total, used, remaining: total - used };
    };

    const liveStats = calculateLiveStats();

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-slate-800">연차 실적 및 통계</h2>
                    <p className="text-slate-500 mt-1 font-medium">부서별 연차 소진율과 개인별 잔여 연차 실적을 모니터링합니다.</p>
                </div>
                <div className="flex items-center space-x-3 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl">
                    <AlertCircle size={16} />
                    <span>연차는 입사일 기준으로 자동 계산되나, 관리자가 직접 총연차/이월/월별 사용량을 보정할 수 있습니다.</span>
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">평균 소진율</p>
                    <div className="flex items-end space-x-2">
                        <span className="text-3xl font-black text-indigo-600">42.5</span>
                        <span className="text-sm font-bold text-slate-400 mb-1.5">%</span>
                    </div>
                </div>
                {/* ... other stats cards ... */}
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-stone-100 italic">
                        <tr>
                            <th className="p-4" rowSpan={2}>대상자</th>
                            <th className="p-4" rowSpan={2}>입사일</th>
                            <th className="p-4" rowSpan={2}>부서/직위</th>
                            <th className="p-4 text-center border-b border-stone-100" colSpan={4}>연차 집계 (단위: 일)</th>
                            <th className="p-4 text-center border-b border-stone-100" colSpan={12}>월별 사용 현황 (보정 포함)</th>
                        </tr>
                        <tr>
                            <th className="p-4 text-center text-indigo-500">총연차</th>
                            <th className="p-4 text-center text-amber-500">이월</th>
                            <th className="p-4 text-center text-rose-500">사용일</th>
                            <th className="p-4 text-center text-emerald-500">잔여일</th>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <th key={i} className="p-2 text-center text-[10px] bg-stone-50/50">{i + 1}월</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {stats.map((row) => (
                            <tr key={row.userId} className="hover:bg-indigo-50/10 transition-colors">
                                <td className="p-4 font-bold text-slate-800">{row.userName}</td>
                                <td className="p-4">
                                    <span className="font-medium text-slate-500">{row.joinDate}</span>
                                </td>
                                <td className="p-4 font-medium text-slate-400">{row.deptName} / {row.position}</td>
                                <td className="p-4 text-center font-bold text-slate-700">{row.totalAllowance}</td>
                                <td className="p-4 text-center font-bold text-amber-500">{row.carryover}</td>
                                <td className="p-4 text-center font-bold text-rose-500">{row.used}</td>
                                <td className="p-4 text-center font-bold text-emerald-600">
                                    <div className="flex items-center justify-center space-x-2 group cursor-pointer" onClick={() => handleEditStart(row)}>
                                        <span>{row.remaining}</span>
                                        <Edit3 size={11} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </td>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <td key={i} className={`p-1 text-center text-[11px] font-bold ${row.monthlyUsage[i] > 0 ? 'text-indigo-500 bg-indigo-50/30' : 'text-slate-300'}`}>
                                        {row.monthlyUsage[i] > 0 ? row.monthlyUsage[i] : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editMode !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-stone-50/50">
                            <div className="flex items-center space-x-4">
                                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                                    <Calculator size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">연차 정보 상세 수정</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-0.5">
                                        {stats.find(s => s.userId === editMode)?.userName} ({stats.find(s => s.userId === editMode)?.deptName}) • {stats.find(s => s.userId === editMode)?.position}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditMode(null)}
                                className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 overflow-y-auto space-y-10">
                            {/* Basic Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="flex flex-col space-y-2.5">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest pl-1">입사일</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={editValue?.joinDate}
                                            onChange={e => handleValueChange('joinDate', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2.5">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest pl-1">총 연차 (기본)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={editValue?.totalAllowance}
                                        onChange={e => handleValueChange('totalAllowance', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-base"
                                    />
                                </div>
                                <div className="flex flex-col space-y-2.5">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest pl-1">전년도 이월</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={editValue?.carryover}
                                        onChange={e => handleValueChange('carryover', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-amber-600 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-base"
                                    />
                                </div>
                            </div>

                            {/* Monthly Adjustment Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-2.5">
                                    <Calendar size={16} className="text-slate-400" />
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">월별 사용 현황 확정 (단위: 일)</label>
                                </div>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                    {editValue?.monthlyAdjustments.map((adj: MonthlyAdjustment, i: number) => (
                                        <div key={i} className="space-y-2">
                                            <p className="text-[11px] font-black text-center text-slate-400 uppercase">{i + 1}월</p>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={adj.amount}
                                                onChange={e => handleMonthlyChange(i, e.target.value)}
                                                className={`w-full text-center py-3 text-sm font-black rounded-xl border-2 outline-none transition-all ${adj.amount > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-4 ring-indigo-500/5' : 'bg-slate-50 border-transparent text-slate-300 focus:border-indigo-100 focus:bg-white'}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live Calculation Summary */}
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white grid grid-cols-3 gap-6 shadow-2xl shadow-indigo-100">
                                <div className="text-center border-r border-indigo-400/30">
                                    <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest mb-2 opacity-80">합계 (보정)</p>
                                    <p className="text-3xl font-black">{liveStats?.total}</p>
                                </div>
                                <div className="text-center border-r border-indigo-400/30">
                                    <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest mb-2 opacity-80">사용 합계</p>
                                    <p className="text-3xl font-black">{liveStats?.used}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-2 underline decoration-emerald-400/50 underline-offset-8">최종 잔여일</p>
                                    <p className="text-3xl font-black text-emerald-300 drop-shadow-sm">{liveStats?.remaining}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-stone-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setEditMode(null)}
                                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => handleSave(editMode)}
                                disabled={loading}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center space-x-2"
                            >
                                {loading ? (
                                    <RotateCcw size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>변경사항 저장</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
