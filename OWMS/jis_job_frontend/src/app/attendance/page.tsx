'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import api from '../../lib/api';
import InlineCalendar from '../../components/InlineCalendar';

interface VacationSummary {
    total: number;
    used: number;
    remaining: number;
}

interface Vacation {
    id: number;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: string;
}

export default function AttendancePage() {
    const [summary, setSummary] = useState<VacationSummary | null>(null);
    const [vacations, setVacations] = useState<Vacation[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'ANNUAL', // ANNUAL, HALF_AM, HALF_PM
        startDate: '',
        endDate: '',
        reason: ''
    });


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        try {
            // Fetch Summary
            const summaryRes = await api.get('/vacations/summary');
            if (summaryRes.data) setSummary(summaryRes.data);

            // Fetch List
            const listRes = await api.get('/vacations');
            if (listRes.data) setVacations(listRes.data);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await api.post('/vacations', formData);

            if (res.status === 201 || res.status === 200) {
                alert('연차 신청이 완료되었습니다.');
                setIsModalOpen(false);
                fetchData(); // Refresh
                setFormData({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
            } else {
                alert('연차 신청에 실패했습니다.');
            }
        } catch (err) {
            console.error(err);
            alert('오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">연차 신청</h2>
                    <p className="text-slate-500 mt-1 font-medium">나의 연차 현황을 확인하고 연차를 신청합니다.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    <span>연차 신청</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-stone-200 p-6 rounded-2xl flex items-center space-x-5 shadow-sm hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">총 연차</p>
                        <p className="text-3xl font-bold text-slate-800">{summary?.total || 0}<span className="text-sm font-bold text-slate-400 ml-1">일</span></p>
                    </div>
                </div>
                <div className="bg-white border border-stone-200 p-6 rounded-2xl flex items-center space-x-5 shadow-sm hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">사용 연차</p>
                        <p className="text-3xl font-bold text-slate-800">{summary?.used || 0}<span className="text-sm font-bold text-slate-400 ml-1">일</span></p>
                    </div>
                </div>
                <div className="bg-white border border-stone-200 p-6 rounded-2xl flex items-center space-x-5 shadow-sm hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">잔여 연차</p>
                        <p className="text-3xl font-bold text-slate-800">{summary?.remaining || 0}<span className="text-sm font-bold text-slate-400 ml-1">일</span></p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <h3 className="text-lg font-bold text-slate-800">연차 신청 내역</h3>
                    <span className="text-xs font-bold text-slate-400 bg-white border border-stone-200 px-3 py-1 rounded-full">최근 30일</span>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-stone-50 text-slate-500 text-sm font-bold border-b border-stone-100">
                        <tr>
                            <th className="p-5">종류</th>
                            <th className="p-5">기간</th>
                            <th className="p-5">상태</th>
                            <th className="p-5">신청일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                        {vacations.length > 0 ? vacations.map((v) => (
                            <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="p-5 text-slate-800 font-bold">
                                    {v.type === 'ANNUAL' ? '연차' : v.type === 'HALF_AM' ? '오전반차' : '오후반차'}
                                </td>
                                <td className="p-5 text-slate-600 font-medium">
                                    {v.startDate.split('T')[0]} ~ {v.endDate.split('T')[0]}
                                </td>
                                <td className="p-5">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                        v.status === 'REJECTED' ? 'bg-rose-50 text-rose-500 border-rose-200' :
                                            'bg-amber-50 text-amber-600 border-amber-200'
                                        }`}>
                                        {v.status === 'APPROVED' ? '승인됨' : v.status === 'REJECTED' ? '반려됨' : '대기중'}
                                    </span>
                                </td>
                                <td className="p-5 text-slate-500">{v.createdAt.split('T')[0]}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-slate-300">
                                            <Calendar size={24} />
                                        </div>
                                        <span>신청 내역이 없습니다.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md border border-stone-100 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-slate-800">연차 신청</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-stone-200 rounded-lg p-1 transition-all">✕</button>
                        </div>
                        <form onSubmit={handleRequest} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">종류</label>
                                <select
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value, startDate: '', endDate: '' })}
                                >
                                    <option value="ANNUAL">연차 (하루 종일)</option>
                                    <option value="HALF_AM">오전 반차 (0.5일)</option>
                                    <option value="HALF_PM">오후 반차 (0.5일)</option>
                                </select>
                            </div>
                            <div className="bg-stone-50 border border-stone-100 rounded-2xl overflow-hidden p-2">
                                <InlineCalendar
                                    mode={formData.type === 'ANNUAL' ? 'ANNUAL' : 'HALF'}
                                    startDate={formData.startDate}
                                    endDate={formData.endDate}
                                    onChange={(start, end) => setFormData({ ...formData, startDate: start, endDate: end })}
                                />
                            </div>
                            {formData.startDate && (
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">선택된 기간</span>
                                        <span className="text-sm font-bold text-indigo-700">
                                            {formData.startDate}
                                            {formData.type === 'ANNUAL' && formData.endDate !== formData.startDate && ` ~ ${formData.endDate}`}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-indigo-600">
                                            {formData.type === 'ANNUAL'
                                                ? Math.round((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                                                : 0.5
                                            }
                                        </span>
                                        <span className="text-xs font-bold text-indigo-400 ml-0.5">일</span>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">사유</label>
                                <textarea
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 h-28 resize-none transition-all placeholder:text-slate-400"
                                    placeholder="연차 사유를 상세히 입력하세요"
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="pt-2 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-slate-600 font-bold transition-all"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-200 hover:shadow-indigo-300"
                                >
                                    신청하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
