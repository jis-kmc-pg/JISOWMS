'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, CheckCircle, XCircle, Edit3, Download } from 'lucide-react';
import api from '@/lib/api';

export default function AdminVacation() {
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
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                        type="text"
                        className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-sm text-slate-700 placeholder:text-slate-300 shadow-sm"
                        placeholder="성명, 부서 또는 사유 검색..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
                <button className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-white border border-stone-100 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-stone-50 hover:text-slate-800 transition-all shadow-sm">
                    <Download size={14} />
                    <span>Export Data</span>
                </button>
            </div>

            <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-stone-100">
                                <th className="p-6">Employee</th>
                                <th className="p-6">Type</th>
                                <th className="p-6">Period</th>
                                <th className="p-6">Reason</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 text-sm">
                            {filtered.length > 0 ? filtered.map((v) => (
                                <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-slate-800 font-black">{v.user?.name || 'Unknown'}</span>
                                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">{v.user?.department?.name || 'No Dept'} · {v.user?.position || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-tighter ${v.type === 'ANNUAL' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {v.type === 'ANNUAL' ? '연차' : v.type === 'HALF_AM' ? '오전반차' : '오후반차'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-slate-600 font-bold">{v.startDate.split('T')[0]}</span>
                                            {v.endDate !== v.startDate && (
                                                <span className="text-[10px] text-slate-300 font-medium tracking-tight">~ {v.endDate.split('T')[0]}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6 text-slate-500 max-w-[200px] truncate font-medium">{v.reason || '-'}</td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black border ${v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            v.status === 'REJECTED' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {v.status === 'APPROVED' ? '승인됨' : v.status === 'REJECTED' ? '반려됨' : '대기중'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {v.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(v.id, 'APPROVED')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="승인">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button onClick={() => handleStatusUpdate(v.id, 'REJECTED')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="반려">
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => handleDelete(v.id)} className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all" title="삭제">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-200">
                                                <Search size={24} />
                                            </div>
                                            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No Records Found</p>
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
