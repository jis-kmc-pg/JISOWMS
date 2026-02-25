'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, ArrowRight, User, Search, Building2, Globe } from 'lucide-react';
import api from '@/lib/api';
import InlineCalendar from '@/components/InlineCalendar';

export default function BulkVacation() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [targetType, setTargetType] = useState<'ALL' | 'DEPT' | 'USER'>('ALL');
    const [selectedDept, setSelectedDept] = useState<number | null>(null);
    const [deptQuery, setDeptQuery] = useState('');

    // User Search State
    const [userQuery, setUserQuery] = useState('');
    const [userResults, setUserResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

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
                const res = await api.get('/admin/departments');
                setDepartments(res.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchDepts();
    }, []);

    // Load users when targetType changes to USER or query changes
    useEffect(() => {
        if (targetType === 'USER') {
            const fetchUsers = async () => {
                try {
                    const res = await api.get(`/users/search?q=${encodeURIComponent(userQuery)}`);
                    setUserResults(res.data || []);
                } catch (err) {
                    console.error(err);
                }
            };
            // Debounce could be added here, but for now simple effect is fine
            const timeoutId = setTimeout(fetchUsers, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [targetType, userQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!form.startDate) {
            alert('날짜를 선택해주세요.');
            return;
        }

        if (targetType === 'DEPT' && !selectedDept) {
            alert('부서를 선택해주세요.');
            return;
        }

        if (targetType === 'USER' && !selectedUser) {
            alert('대상 사용자를 선택해주세요.');
            return;
        }

        let confirmMsg = '';
        if (targetType === 'ALL') confirmMsg = '전사 임직원(모든 사용자)에게 연차가 일괄 신청 및 승인됩니다.\n정말 진행하시겠습니까?';
        else if (targetType === 'DEPT') confirmMsg = '선택한 부서의 모든 임직원에게 연차가 일괄 신청 및 승인됩니다.\n진행하시겠습니까?';
        else if (targetType === 'USER') confirmMsg = `${selectedUser.name} 님에게 관리자 권한으로 연차를 등록하시겠습니까?`;

        if (!confirm(confirmMsg)) return;

        setLoading(true);
        try {
            await api.post('/vacations/admin/bulk', {
                targetType,
                targetId: targetType === 'DEPT' ? selectedDept : (targetType === 'USER' ? selectedUser.id : undefined),
                ...form
            });
            alert('신청이 완료되었습니다.');
            setForm({ ...form, startDate: '', endDate: '', reason: '일괄 신청' });
            if (targetType === 'USER') {
                setUserQuery('');
                setUserResults([]);
                setSelectedUser(null);
            }
        } catch (e: any) {
            console.error(e);
            // 백엔드 응답의 실제 오류 메시지 표시
            const errorMessage = e?.response?.data?.message || '신청 중 오류가 발생했습니다.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getTargetLabel = () => {
        if (targetType === 'ALL') return '전사 임직원 (전체)';
        if (targetType === 'DEPT') return selectedDept ? departments.find(d => d.id === selectedDept)?.name : '부서 미선택';
        if (targetType === 'USER') return selectedUser ? `${selectedUser.name} (${selectedUser.department?.name || '-'})` : '사용자 미선택';
        return '-';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    {/* Target Type Selector */}
                    <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                            <Users size={12} className="mr-2" aria-hidden="true" /> 대상 유형 선택
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setTargetType('ALL')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${targetType === 'ALL'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600 dark:text-indigo-400 font-bold'
                                    : 'bg-stone-50 dark:bg-slate-700/50 border-stone-100 dark:border-slate-700 text-slate-400 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-stone-200 dark:hover:border-slate-600'
                                    }`}
                            >
                                <Globe size={20} className="mb-1" aria-hidden="true" />
                                <span className="text-xs">전체</span>
                            </button>
                            <button
                                onClick={() => setTargetType('DEPT')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${targetType === 'DEPT'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600 dark:text-indigo-400 font-bold'
                                    : 'bg-stone-50 dark:bg-slate-700/50 border-stone-100 dark:border-slate-700 text-slate-400 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-stone-200 dark:hover:border-slate-600'
                                    }`}
                            >
                                <Building2 size={20} className="mb-1" aria-hidden="true" />
                                <span className="text-xs">부서별</span>
                            </button>
                            <button
                                onClick={() => setTargetType('USER')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${targetType === 'USER'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600 dark:text-indigo-400 font-bold'
                                    : 'bg-stone-50 dark:bg-slate-700/50 border-stone-100 dark:border-slate-700 text-slate-400 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-stone-200 dark:hover:border-slate-600'
                                    }`}
                            >
                                <User size={20} className="mb-1" aria-hidden="true" />
                                <span className="text-xs">개인별</span>
                            </button>
                        </div>
                    </div>

                    {/* Conditional Target Selection */}
                    {targetType === 'ALL' && (
                        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-6">
                            <p className="text-sm text-amber-800 font-bold leading-relaxed">
                                주의: 전사 임직원(모든 사용자)을 대상으로 연차를 일괄 생성합니다. 창립기념일과 같은 전사 공통 휴무일에만 사용하세요.
                            </p>
                        </div>
                    )}

                    {targetType === 'DEPT' && (
                        <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl p-6 space-y-4 shadow-sm">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={deptQuery}
                                    onChange={(e) => setDeptQuery(e.target.value)}
                                    placeholder="부서 이름 검색"
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 dark:text-slate-200 dark:placeholder:text-slate-500"
                                />
                                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-400" aria-hidden="true" />
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {departments
                                    .filter(d => d.name.includes(deptQuery))
                                    .map((dept) => (
                                        <button
                                            key={dept.id}
                                            onClick={() => setSelectedDept(dept.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${selectedDept === dept.id
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                                                : 'bg-white dark:bg-slate-800 border-stone-100 dark:border-slate-700 text-slate-400 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <span className="text-sm">{dept.name}</span>
                                            {selectedDept === dept.id && <CheckCircle size={14} />}
                                        </button>
                                    ))}
                                {departments.filter(d => d.name.includes(deptQuery)).length === 0 && (
                                    <p className="text-xs text-slate-400 dark:text-slate-400 text-center py-4">부서 검색 결과가 없습니다.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {targetType === 'USER' && (
                        <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl p-6 space-y-4 shadow-sm">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={userQuery}
                                    onChange={(e) => setUserQuery(e.target.value)}
                                    placeholder="이름 또는 부서 검색"
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 dark:text-slate-200 dark:placeholder:text-slate-500"
                                />
                                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-400" aria-hidden="true" />
                            </div>

                            {userResults.length > 0 && (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {userResults.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${selectedUser?.id === user.id
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-700 dark:text-indigo-400 font-bold'
                                                : 'bg-white dark:bg-slate-800 border-stone-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <div>
                                                <div className="text-sm">{user.name}</div>
                                                <div className="text-xs text-slate-400 dark:text-slate-400">{user.department?.name} · {user.position}</div>
                                            </div>
                                            {selectedUser?.id === user.id && <CheckCircle size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {userResults.length === 0 && userQuery && (
                                <p className="text-xs text-slate-400 dark:text-slate-400 text-center py-4">검색 결과가 없습니다.</p>
                            )}
                        </div>
                    )}

                    <div className="bg-stone-50/50 dark:bg-slate-700/30 border border-stone-100 dark:border-slate-700 rounded-2xl p-6">
                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">연차 종류</label>
                        <select
                            className="w-full bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-100 font-bold outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-800/30 transition-colors shadow-sm"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value, startDate: '', endDate: '' })}
                        >
                            <option value="ANNUAL">종합 연차 (자동승인)</option>
                            <option value="HALF_AM">오전 반차 (자동승인)</option>
                            <option value="HALF_PM">오후 반차 (자동승인)</option>
                        </select>
                        <p className="text-[10px] text-amber-500 font-bold mt-3 px-1 flex items-start">
                            <span className="mr-1">※</span>
                            관리자 권한으로 즉시 승인 처리됩니다.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-stone-50/50 dark:bg-slate-700/30 border-b border-stone-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Calendar size={16} className="text-slate-400 dark:text-slate-400" aria-hidden="true" />
                                <span className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">신청 기간 선택</span>
                            </div>
                            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">드래그 가능</span>
                        </div>
                        <InlineCalendar
                            mode={form.type === 'ANNUAL' ? 'ANNUAL' : 'HALF'}
                            startDate={form.startDate}
                            endDate={form.endDate}
                            onChange={(s, e) => setForm({ ...form, startDate: s, endDate: e })}
                        />
                    </div>

                    <div className="bg-stone-50/50 dark:bg-slate-700/30 border border-stone-100 dark:border-slate-700 rounded-2xl p-6 space-y-5">
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">신청 사유</label>
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-xl p-4 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-800/30 shadow-sm"
                                placeholder={targetType === 'USER' ? "예: 관리자 직권 등록" : "예: 전사 휴무, 워크숍 등"}
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl shadow-sm">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-1">최종 대상</span>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                                    {getTargetLabel()}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-400 mt-1">
                                    {form.startDate || '-'} {form.endDate && form.endDate !== form.startDate ? `~ ${form.endDate}` : ''}
                                </span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !form.startDate || (targetType === 'DEPT' && !selectedDept) || (targetType === 'USER' && !selectedUser)}
                                className="px-8 py-3.5 bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-200 text-white font-black rounded-xl shadow-xl shadow-indigo-100 flex items-center space-x-2 transition-colors active:scale-95 text-sm uppercase"
                            >
                                <span>Batch Run</span>
                                <ArrowRight size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
