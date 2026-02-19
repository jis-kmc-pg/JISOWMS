'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Save, RotateCcw, Edit3, Search, X, Calculator, Calendar } from 'lucide-react';
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

interface DepartmentOption {
    id: number;
    name: string;
}

interface EditValueState {
    joinDate: string;
    totalAllowance: number;
    carryover: number;
    monthlyAdjustments: MonthlyAdjustment[];
}

export default function VacationStats() {
    const [stats, setStats] = useState<VacationStatRow[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<EditValueState | null>(null);

    // Search State
    const [year, setYear] = useState(new Date().getFullYear());
    const [deptId, setDeptId] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        fetchDepartments();
    }, []);

    // 검색 조건 변경 시 자동 조회 (이름은 디바운스 적용)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300); // 이름 입력 시 300ms 대기 후 검색

        return () => clearTimeout(timer);
    }, [year, deptId, name]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/admin/departments');
            setDepartments(res.data || []);
        } catch (e) {
            console.error('부서 정보를 가져오는데 실패했습니다.', e);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            query.append('year', year.toString());
            if (deptId) query.append('deptId', deptId);
            if (name) query.append('name', name);

            const res = await api.get(`/vacations/admin/stats?${query.toString()}`);
            setStats(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEditStart = (item: VacationStatRow) => {
        setEditMode(item.userId);
        const monthlyAdjustments = rowToMonthlyAdjustments(item);
        setEditValue({
            joinDate: item.joinDate === '-' ? '' : item.joinDate,
            totalAllowance: item.totalAllowance,
            carryover: item.carryover,
            monthlyAdjustments
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
            console.error('설정이 저장되었습니다.');
            setEditMode(null);
            fetchData();
        } catch (e) {
            console.error(e);
            console.error('저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const calculateLiveStats = () => {
        if (!editValue) return null;
        const total = (Number(editValue?.totalAllowance) || 0) + (Number(editValue?.carryover) || 0);
        const used = editValue?.monthlyAdjustments.reduce((acc: number, adj: MonthlyAdjustment) => acc + (adj.amount || 0), 0);
        return { total, used, remaining: total - used };
    };

    const liveStats = calculateLiveStats();

    const handleCarryoverClosing = () => {
        console.error('이월 마감 처리가 완료되었습니다. (Mock)');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 w-full">
            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center space-x-2 bg-stone-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5 border border-stone-200 dark:border-slate-600">
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-transparent outline-none w-16 font-bold text-slate-700 dark:text-slate-200 text-sm"
                        />
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">년</span>
                    </div>

                    <select
                        value={deptId}
                        onChange={(e) => setDeptId(e.target.value)}
                        className="bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none font-bold min-w-[120px]"
                    >
                        <option value="">전체 부서</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="이름 검색"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 pl-3 outline-none font-bold dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleCarryoverClosing} className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-slate-700 text-sm transition-colors">
                        이월 마감
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-stone-50/80 dark:bg-slate-700/50 text-sm font-bold text-slate-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-600">
                                <th className="p-4 w-16 text-center">No</th>
                                <th className="p-4 w-32">부서</th>
                                <th className="p-4 w-24">이름</th>
                                <th className="p-4 w-24 text-center">직위</th>
                                <th className="p-4 w-32 text-center">입사일</th>
                                <th className="p-4 text-center border-l border-stone-100 dark:border-slate-700" colSpan={4}>연차 요약 (일)</th>
                                <th className="p-4 text-center border-l border-stone-100 dark:border-slate-700" colSpan={12}>월별 사용 현황</th>
                            </tr>
                            <tr className="bg-stone-50/40 dark:bg-slate-700/30 text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest border-b border-stone-200 dark:border-slate-600">
                                <th colSpan={5}></th>
                                <th className="p-3 text-center text-indigo-600 dark:text-indigo-400 border-l border-stone-50 dark:border-slate-700">총 연차</th>
                                <th className="p-3 text-center text-amber-500">이월</th>
                                <th className="p-3 text-center text-rose-500 dark:text-rose-400">사용</th>
                                <th className="p-3 text-center text-emerald-600 dark:text-emerald-400">잔여</th>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <th key={i} className={`p-2 text-center text-[10px] ${i === 0 ? 'border-l border-stone-50' : ''}`}>{i + 1}월</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {stats.map((row, idx) => (
                                <tr key={row.userId} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                    <td className="p-4 text-center text-slate-400 dark:text-slate-400 bg-stone-50/30 dark:bg-slate-700/20 font-bold">{idx + 1}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300 font-bold">{row.deptName}</td>
                                    <td className="p-4 text-slate-900 dark:text-slate-100 font-bold">{row.userName}</td>
                                    <td className="p-4 text-center text-slate-500 dark:text-slate-400 text-xs">{row.position}</td>
                                    <td className="p-4 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">{row.joinDate}</td>

                                    <td className="p-4 text-center border-l border-stone-50 dark:border-slate-700 bg-indigo-50/5 dark:bg-indigo-900/5 font-bold text-slate-800 dark:text-slate-100">{row.totalAllowance}</td>
                                    <td className="p-4 text-center text-amber-500 font-bold">{row.carryover}</td>
                                    <td className="p-4 text-center text-rose-500 dark:text-rose-400 font-bold">{row.used}</td>
                                    <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400 text-base">
                                        <button type="button" className="flex items-center justify-center space-x-2 group cursor-pointer" onClick={() => handleEditStart(row)} aria-label={`${row.userName} 연차 정보 수정`}>
                                            <span>{row.remaining}</span>
                                            <Edit3 size={12} className="text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                        </button>
                                    </td>

                                    {row.monthlyUsage.map((val: number, i: number) => (
                                        <td key={i} className={`p-2 text-center border-l border-stone-50/50 dark:border-slate-700/50 text-[11px] ${val > 0 ? 'bg-indigo-50/40 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-200 dark:text-slate-600'}`}>
                                            {val > 0 ? val : '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {stats.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={24} className="p-12 text-center text-slate-400 dark:text-slate-400 font-bold italic">
                                        데이터가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editMode !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-600 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-stone-50/50 dark:bg-slate-700/30">
                            <div className="flex items-center space-x-4">
                                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                                    <Calculator size={22} aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">연차 정보 상세 수정</h3>
                                    <p className="text-sm font-bold text-slate-400 dark:text-slate-400 mt-0.5">
                                        {stats.find(s => s.userId === editMode)?.userName} ({stats.find(s => s.userId === editMode)?.deptName}) • {stats.find(s => s.userId === editMode)?.position}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditMode(null)}
                                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
                                aria-label="닫기"
                            >
                                <X size={24} aria-hidden="true" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 overflow-y-auto space-y-10">
                            {/* Basic Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="flex flex-col space-y-2.5">
                                    <label className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">입사일</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={editValue?.joinDate}
                                            onChange={e => handleValueChange('joinDate', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-colors text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2.5">
                                    <label className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">총 연차 (기본)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={editValue?.totalAllowance}
                                        onChange={e => handleValueChange('totalAllowance', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-colors text-base"
                                    />
                                </div>
                                <div className="flex flex-col space-y-2.5">
                                    <label className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">전년도 이월</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={editValue?.carryover}
                                        onChange={e => handleValueChange('carryover', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 font-bold text-amber-600 dark:text-amber-400 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-colors text-base"
                                    />
                                </div>
                            </div>

                            {/* Monthly Adjustment Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-2.5">
                                    <Calendar size={16} className="text-slate-400" aria-hidden="true" />
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">월별 사용 현황 확정 (단위: 일)</label>
                                </div>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                    {editValue?.monthlyAdjustments.map((adj: MonthlyAdjustment, i: number) => (
                                        <div key={i} className="space-y-2">
                                            <p className="text-[11px] font-black text-center text-slate-400 dark:text-slate-400 uppercase">{i + 1}월</p>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={adj.amount}
                                                onChange={e => handleMonthlyChange(i, e.target.value)}
                                                className={`w-full text-center py-3 text-sm font-black rounded-xl border-2 outline-none transition-colors ${adj.amount > 0 ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600 dark:text-indigo-400 ring-4 ring-indigo-500/5' : 'bg-slate-50 dark:bg-slate-700/50 border-transparent text-slate-300 dark:text-slate-500 focus:border-indigo-100 focus:bg-white dark:focus:bg-slate-700'}`}
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
                        <div className="p-6 bg-stone-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setEditMode(null)}
                                className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => handleSave(editMode)}
                                disabled={loading}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-colors active:scale-95 flex items-center space-x-2"
                            >
                                {loading ? (
                                    <RotateCcw size={18} className="animate-spin" aria-hidden="true" />
                                ) : (
                                    <>
                                        <Save size={18} aria-hidden="true" />
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
