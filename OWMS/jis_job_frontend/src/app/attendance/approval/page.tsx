'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, User, Calendar, SlidersHorizontal, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function DeptApprovalPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Generate month buttons for 2026 (01 to 12)
    const monthButtons = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        return {
            label: `26.${monthStr}`,
            start: `2026-${monthStr}-01`,
            end: `2026-${monthStr}-${new Date(2026, month, 0).getDate()}`
        };
    });

    useEffect(() => {
        // Default to current year (2026 for demo purposes)
        const start = `2026-01-01`;
        const end = `2026-12-31`;
        setDateRange({ startDate: start, endDate: end });
        fetchData(start, end);
    }, []);

    const fetchData = async (start?: string, end?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);

            const res = await api.get(`/vacations/dept-requests?${params.toString()}`);
            setRequests(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchData(dateRange.startDate, dateRange.endDate);
    };

    const setQuickRange = (start: string, end: string) => {
        setDateRange({ startDate: start, endDate: end });
        fetchData(start, end);
    };

    const handleUpdate = async (id: number, status: string) => {
        try {
            await api.post(`/vacations/admin/${id}`, { status });
            alert(`성공적으로 ${status === 'APPROVED' ? '승인' : '반려'} 처리되었습니다.`);
            fetchData(dateRange.startDate, dateRange.endDate);
        } catch (e) {
            console.error(e);
            alert('처리에 실패했습니다.');
        }
    };

    const filtered = requests.filter(r =>
        r.user?.name?.includes(filter) ||
        r.reason?.includes(filter)
    );

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">부서 연차 승인 관리</h2>
                <p className="text-slate-500 mt-1 font-medium">부서원들의 연차 신청 현황을 확인하고 승인 가부를 결정합니다.</p>
            </div>

            {/* Enhanced Search Controls */}
            <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6">
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Calendar size={12} className="mr-2" /> 월간 빠른 조회
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {monthButtons.map((m) => (
                            <button
                                key={m.label}
                                onClick={() => setQuickRange(m.start, m.end)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${dateRange.startDate === m.start && dateRange.endDate === m.end
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                    : 'bg-stone-50 border-stone-100 text-slate-500 hover:bg-white hover:border-slate-300'
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4 border-t border-stone-50">
                    <div className="flex-1 space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                            <SlidersHorizontal size={12} className="mr-2" /> 기간 정밀 검색
                        </label>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative flex-1 w-full">
                                <input
                                    type="date"
                                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all appearance-none"
                                    value={dateRange.startDate}
                                    onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase pointer-events-none">Start</span>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 hidden sm:block" />
                            <div className="relative flex-1 w-full">
                                <input
                                    type="date"
                                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all appearance-none"
                                    value={dateRange.endDate}
                                    onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase pointer-events-none">End</span>
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-full sm:w-auto bg-slate-800 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 flex items-center justify-center whitespace-nowrap"
                            >
                                <Search size={16} className="mr-2" /> 기록 조회
                            </button>
                        </div>
                    </div>

                    <div className="w-full lg:w-72 space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                            <Search size={12} className="mr-2" /> 결과 내 검색
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                type="text"
                                className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-5 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium"
                                placeholder="성명 또는 사유..."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white border border-stone-200 rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-stone-50/50 text-slate-400 font-bold border-b border-stone-100 uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="p-6">신청자</th>
                                <th className="p-6">종류</th>
                                <th className="p-6">기간</th>
                                <th className="p-6">사유</th>
                                <th className="p-6 text-center">상태</th>
                                <th className="p-6 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-32 text-center text-slate-300 font-bold animate-pulse italic">데이터를 동기화 중입니다...</td>
                                </tr>
                            ) : filtered.length > 0 ? filtered.map((v) => (
                                <tr key={v.id} className="hover:bg-indigo-50/20 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-all">
                                                <User size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-bold">{v.user?.name || 'Unknown'}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{v.user?.team?.name || v.user?.department?.name || '팀 미지정'} / {v.user?.position || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter ${v.type === 'ANNUAL' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {v.type === 'ANNUAL' ? '연차' : v.type === 'HALF_AM' ? '오전반차' : '오후반차'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 font-bold">{v.startDate.split('T')[0]}</span>
                                                {v.type === 'ANNUAL' && v.endDate !== v.startDate && (
                                                    <span className="text-[11px] text-slate-500 font-bold">~ {v.endDate.split('T')[0]}</span>
                                                )}
                                            </div>
                                            <div className="bg-stone-50 border border-stone-100 px-2 py-1 rounded-lg text-indigo-600 font-black text-xs min-w-[32px] text-center shadow-sm">
                                                {v.type === 'ANNUAL' ? (
                                                    (() => {
                                                        const start = new Date(v.startDate.split('T')[0]);
                                                        const end = new Date(v.endDate.split('T')[0]);
                                                        const diffTime = Math.abs(end.getTime() - start.getTime());
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                                        return diffDays;
                                                    })()
                                                ) : '0.5'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-slate-500 max-w-[200px] truncate leading-relaxed">{v.reason || '-'}</td>
                                    <td className="p-6 text-center">
                                        <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black border ${v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            v.status === 'REJECTED' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {v.status === 'APPROVED' ? <CheckCircle size={12} className="mr-1.5" /> :
                                                v.status === 'REJECTED' ? <XCircle size={12} className="mr-1.5" /> :
                                                    <Clock size={12} className="mr-1.5 animate-spin-slow" />}
                                            {v.status === 'APPROVED' ? '승인됨' : v.status === 'REJECTED' ? '반려됨' : '심사 대기'}
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        {v.status === 'PENDING' ? (
                                            <div className="flex items-center justify-center space-x-1.5">
                                                <button
                                                    onClick={() => handleUpdate(v.id, 'APPROVED')}
                                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold text-xs shadow-lg shadow-emerald-50 active:scale-95"
                                                >
                                                    승인
                                                </button>
                                                <button
                                                    onClick={() => handleUpdate(v.id, 'REJECTED')}
                                                    className="px-4 py-2 bg-rose-400 text-white rounded-xl hover:bg-rose-500 transition-all font-bold text-xs shadow-lg shadow-rose-50 active:scale-95"
                                                >
                                                    반려
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] text-slate-300 font-bold italic tracking-wider">이력 보관됨</span>
                                                <span className="text-[10px] text-slate-200 font-medium mt-1">Status Finalized</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-40 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                                                <SlidersHorizontal size={24} className="text-slate-100" />
                                            </div>
                                            <p className="text-slate-600 font-bold tracking-tight text-lg">조회된 신청 내역이 없습니다.</p>
                                            <p className="text-sm text-slate-400 mt-2">다른 기간을 선택하거나 검색어를 변경해 보세요.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
