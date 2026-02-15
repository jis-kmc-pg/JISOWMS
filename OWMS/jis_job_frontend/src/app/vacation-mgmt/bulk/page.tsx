'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import InlineCalendar from '@/components/InlineCalendar';

export default function BulkVacationPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<number | null>(null);
    const [form, setForm] = useState({
        type: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: '창립기념일 등 부서 일괄 휴무'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await api.get('/work-status/departments'); // Using existing endpoint
                setDepartments(res.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchDepts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDept || !form.startDate) {
            alert('부서와 날짜를 선택해주세요.');
            return;
        }

        if (!confirm('선택한 부서의 모든 임직원에게 연차가 일괄 신청 및 승인됩니다. 진행하시겠습니까?')) return;

        setLoading(true);
        try {
            await api.post('/vacations/admin/bulk', {
                deptId: selectedDept,
                ...form
            });
            alert('일괄 신청이 완료되었습니다.');
            setForm({ type: 'ANNUAL', startDate: '', endDate: '', reason: '부서 일괄 신청' });
        } catch (e) {
            console.error(e);
            alert('일괄 신청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">연차 일괄 신청</h2>
                <p className="text-slate-500 mt-1 font-medium">부서 전체 인원에게 특정 기간의 연차를 일괄적으로 등록하고 승인 처리합니다.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                            <Users size={14} className="mr-2" /> 대상 부서 선택
                        </h3>
                        <div className="space-y-2">
                            {departments.map((dept) => (
                                <button
                                    key={dept.id}
                                    onClick={() => setSelectedDept(dept.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${selectedDept === dept.id
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-sm ring-2 ring-indigo-100'
                                        : 'bg-stone-50 border-stone-100 text-slate-500 hover:bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <span>{dept.name}</span>
                                    {selectedDept === dept.id && <CheckCircle size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">연차 종류</label>
                        <select
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value, startDate: '', endDate: '' })}
                        >
                            <option value="ANNUAL">종합 연차 (Auto-Approve)</option>
                            <option value="HALF_AM">오전 반차 (Auto-Approve)</option>
                            <option value="HALF_PM">오후 반차 (Auto-Approve)</option>
                        </select>
                        <p className="text-[11px] text-amber-500 font-bold mt-2">※ 일괄 신청 시 관리자 권한으로 자동 승인됩니다.</p>
                    </div>
                </div>

                {/* Right: Calendar & Submit */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-center space-x-2">
                            <Calendar size={18} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">신청 기간 드래그 선택</span>
                        </div>
                        <InlineCalendar
                            mode={form.type === 'ANNUAL' ? 'ANNUAL' : 'HALF'}
                            startDate={form.startDate}
                            endDate={form.endDate}
                            onChange={(s, e) => setForm({ ...form, startDate: s, endDate: e })}
                        />
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">일괄 신청 사유</label>
                            <input
                                type="text"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100"
                                placeholder="예: 전사 휴무, 워크숍 등"
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-indigo-400 uppercase">최종 확인</span>
                                <span className="text-sm font-bold text-indigo-700">
                                    {selectedDept ? departments.find(d => d.id === selectedDept)?.name : '부서 미선택'} / {form.startDate || '-'} {form.endDate && form.endDate !== form.startDate ? `~ ${form.endDate}` : ''}
                                </span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !selectedDept || !form.startDate}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center space-x-2 transition-all hover:-translate-y-0.5 active:scale-95"
                            >
                                <span>일괄 신청 실행</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
