'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, CheckCircle, XCircle, Edit3, Download, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AdminVacationPage() {
    const [vacations, setVacations] = useState<any[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/vacations/admin/all');
            setVacations(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await api.post(`/vacations/admin/${id}`, { status });
            alert(`상태가 ${status === 'APPROVED' ? '승인' : '반려'} 처리되었습니다.`);
            fetchData();
        } catch (e) {
            console.error(e);
            alert('처리에 실패했습니다.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말로 이 연차 내역을 삭제하시겠습니까? 삭제된 내역은 복구할 수 없습니다.')) return;
        try {
            await api.post(`/vacations/admin/${id}/delete`);
            alert('삭제되었습니다.');
            fetchData();
        } catch (e) {
            console.error(e);
            alert('삭제에 실패했습니다.');
        }
    };

    const filtered = vacations.filter(v =>
        v.user?.name?.includes(filter) ||
        v.user?.department?.name?.includes(filter) ||
        v.reason?.includes(filter)
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <Link href="/" className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 transition-colors shrink-0" aria-label="홈으로 이동">
                        <ArrowLeft size={22} aria-hidden="true" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-2.5">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 sm:p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shrink-0">
                                <Users size={18} className="text-indigo-600 dark:text-indigo-400 sm:hidden" />
                                <Users size={22} className="text-indigo-600 dark:text-indigo-400 hidden sm:block" />
                            </div>
                            <span className="truncate">전체 임직원 연차 관리</span>
                        </h1>
                        <p className="hidden sm:block text-sm text-slate-400 dark:text-slate-400 mt-1 ml-12">모든 신청 내역을 조회하고 승인, 수정 및 삭제 처리를 수행합니다.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-slate-600 font-bold hover:bg-stone-50 transition-all">
                        <Download size={16} />
                        <span>내역 추출</span>
                    </button>
                </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden text-sm">
                <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            className="w-full bg-white border border-stone-200 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                            placeholder="성명, 부서 또는 사유 검색..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-stone-50 text-slate-500 font-bold border-b border-stone-100 uppercase text-[11px] tracking-widest">
                            <tr>
                                <th className="p-4">대상자</th>
                                <th className="p-4">유형</th>
                                <th className="p-4">기간</th>
                                <th className="p-4">사유</th>
                                <th className="p-4">상태</th>
                                <th className="p-4 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium">
                            {filtered.length > 0 ? filtered.map((v) => (
                                <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-800 font-bold">{v.user?.name || 'Unknown'}</span>
                                            <span className="text-[10px] text-slate-400">{v.user?.department?.name || 'No Dept'} / {v.user?.position || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-[11px] font-black ${v.type === 'ANNUAL' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {v.type === 'ANNUAL' ? '연차' : v.type === 'HALF_AM' ? '오전반차' : '오후반차'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {v.startDate.split('T')[0]} {v.endDate !== v.startDate && `~ ${v.endDate.split('T')[0]}`}
                                    </td>
                                    <td className="p-4 text-slate-500 max-w-xs truncate">{v.reason || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            v.status === 'REJECTED' ? 'bg-rose-50 text-rose-500 border-rose-200' :
                                                'bg-amber-50 text-amber-600 border-amber-200'
                                            }`}>
                                            {v.status === 'APPROVED' ? '승인됨' : v.status === 'REJECTED' ? '반려됨' : '대기중'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center space-x-1">
                                            {v.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(v.id, 'APPROVED')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="승인">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button onClick={() => handleStatusUpdate(v.id, 'REJECTED')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="반려">
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => handleDelete(v.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all" title="삭제">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-slate-400 font-medium">데이터가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
