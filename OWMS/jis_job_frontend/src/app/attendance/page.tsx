'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Plus, CheckCircle2, CalendarClock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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

    // Toast
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const toast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
    };

    useEffect(() => {
        return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, []);

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
                toast('연차 신청이 완료되었습니다.');
                setIsModalOpen(false);
                fetchData(); // Refresh
                setFormData({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
            } else {
                toast('연차 신청에 실패했습니다.', 'error');
            }
        } catch (err) {
            console.error(err);
            toast('오류가 발생했습니다.', 'error');
        }
    };

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
                                <CalendarClock size={18} className="text-indigo-600 dark:text-indigo-400 sm:hidden" />
                                <CalendarClock size={22} className="text-indigo-600 dark:text-indigo-400 hidden sm:block" />
                            </div>
                            <span className="truncate">연차 신청</span>
                        </h1>
                        <p className="hidden sm:block text-sm text-slate-400 dark:text-slate-400 mt-1 ml-12">나의 연차 현황을 확인하고 연차를 신청합니다.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold transition-colors shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
                >
                    <Plus size={18} aria-hidden="true" />
                    <span>연차 신청</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 p-6 rounded-2xl flex items-center space-x-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                        <Calendar size={28} aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">총 연차</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{summary?.total || 0}<span className="text-sm font-bold text-slate-400 dark:text-slate-400 ml-1">일</span></p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 p-6 rounded-2xl flex items-center space-x-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/30">
                        <CheckCircle size={28} aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">사용 연차</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{summary?.used || 0}<span className="text-sm font-bold text-slate-400 dark:text-slate-400 ml-1">일</span></p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 p-6 rounded-2xl flex items-center space-x-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100">
                        <Clock size={28} aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">잔여 연차</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{summary?.remaining || 0}<span className="text-sm font-bold text-slate-400 dark:text-slate-400 ml-1">일</span></p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-stone-100 dark:border-slate-700 flex items-center justify-between bg-stone-50/50 dark:bg-slate-700/30">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">연차 신청 내역</h3>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 px-3 py-1 rounded-full">최근 30일</span>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-stone-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm font-bold border-b border-stone-100 dark:border-slate-700">
                        <tr>
                            <th className="p-5">종류</th>
                            <th className="p-5">기간</th>
                            <th className="p-5">상태</th>
                            <th className="p-5">신청일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-slate-700 text-sm">
                        {vacations.length > 0 ? vacations.map((v) => (
                            <tr key={v.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                <td className="p-5 text-slate-800 dark:text-slate-100 font-bold">
                                    {v.type === 'ANNUAL' ? '연차' : v.type === 'HALF_AM' ? '오전반차' : '오후반차'}
                                </td>
                                <td className="p-5 text-slate-600 dark:text-slate-300 font-medium">
                                    {v.startDate.split('T')[0]} ~ {v.endDate.split('T')[0]}
                                </td>
                                <td className="p-5">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${v.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200' :
                                        v.status === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 border-rose-200' :
                                            'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200'
                                        }`}>
                                        {v.status === 'APPROVED' ? '승인됨' : v.status === 'REJECTED' ? '반려됨' : '대기중'}
                                    </span>
                                </td>
                                <td className="p-5 text-slate-500 dark:text-slate-400">{v.createdAt.split('T')[0]}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400 dark:text-slate-400">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-12 h-12 bg-stone-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500">
                                            <Calendar size={24} aria-hidden="true" />
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
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md border border-stone-100 dark:border-slate-700 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-stone-100 dark:border-slate-700 flex justify-between items-center bg-stone-50/50 dark:bg-slate-700/30 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">연차 신청</h3>
                            <button onClick={() => setIsModalOpen(false)} aria-label="닫기" className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-600 rounded-lg p-1 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleRequest} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">종류</label>
                                <select
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl p-3 text-slate-800 dark:text-slate-100 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-colors cursor-pointer"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value, startDate: '', endDate: '' })}
                                >
                                    <option value="ANNUAL">연차 (하루 종일)</option>
                                    <option value="HALF_AM">오전 반차 (0.5일)</option>
                                    <option value="HALF_PM">오후 반차 (0.5일)</option>
                                </select>
                            </div>
                            <div className="bg-stone-50 dark:bg-slate-700/50 border border-stone-100 dark:border-slate-700 rounded-2xl overflow-hidden p-2">
                                <InlineCalendar
                                    mode={formData.type === 'ANNUAL' ? 'ANNUAL' : 'HALF'}
                                    startDate={formData.startDate}
                                    endDate={formData.endDate}
                                    onChange={(start, end) => setFormData({ ...formData, startDate: start, endDate: end })}
                                />
                            </div>
                            {formData.startDate && (
                                <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
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
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">사유</label>
                                <textarea
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl p-3 text-slate-800 dark:text-slate-100 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 h-28 resize-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder="연차 사유를 상세히 입력하세요"
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="pt-2 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-indigo-300"
                                >
                                    신청하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 sm:gap-3 font-bold text-xs sm:text-sm transition-colors max-w-[90vw] ${
                    toastType === 'success'
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-rose-600 text-white shadow-rose-200'
                }`}>
                    {toastType === 'success' ? <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" /> : <AlertCircle size={16} className="shrink-0" aria-hidden="true" />}
                    <span className="truncate">{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
