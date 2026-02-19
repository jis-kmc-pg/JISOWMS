'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
    Search,
    Plus,
    Briefcase,
    Building2,
    Edit2,
    Trash2,
    XCircle,
    RotateCcw
} from 'lucide-react';

interface Job {
    id: number;
    projectName: string;
    clientName?: string;
    status: string;
}

export default function JobsSettings() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentJobId, setCurrentJobId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ projectName: '', clientName: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL'); // ALL, ACTIVE, INACTIVE

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            // Fetch ALL projects to manage them
            const res = await api.get('/reports/projects?status=ALL');
            if (res.data) {
                setJobs(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setFormData({ projectName: '', clientName: '' });
        setShowModal(true);
    };

    const handleOpenEditModal = (job: Job) => {
        setIsEditing(true);
        setCurrentJobId(job.id);
        setFormData({ projectName: job.projectName, clientName: job.clientName || '' });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.projectName) return;

        try {
            if (isEditing && currentJobId) {
                await api.patch(`/reports/projects/${currentJobId}`, formData);
            } else {
                await api.post('/reports/projects', formData);
            }
            fetchJobs();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save job:', error);
            alert('업무 저장에 실패했습니다.');
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await api.patch(`/reports/projects/${id}`, { status: newStatus });
            fetchJobs();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.clientName && job.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = filterStatus === 'ALL' || job.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Briefcase size={24} />
                    </div>
                    업무 목록 관리
                </h3>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow text-white"
                >
                    <Plus size={18} />
                    <span>신규 업무 등록</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="업무명 또는 거래처 검색..."
                        className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl outline-none text-slate-700 dark:text-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all"
                    />
                </div>
                <div className="flex space-x-2">
                    {['ALL', 'ACTIVE', 'INACTIVE'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === status
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                                : 'bg-stone-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {status === 'ALL' ? '전체' : status === 'ACTIVE' ? '사용 중' : '사용 안함'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Job Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-slate-500 dark:text-slate-400">데이터를 불러오는 중...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredJobs.slice(0, 50).map((job) => (
                        <div key={job.id} className={`bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl p-5 group transition-all shadow-sm ${job.status === 'INACTIVE' ? 'opacity-60 grayscale bg-stone-50 dark:bg-slate-700/50' : 'hover:border-indigo-300 hover:shadow-md'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${job.status === 'ACTIVE' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400' : 'bg-stone-100 dark:bg-slate-700 border-stone-200 dark:border-slate-600 text-slate-400 dark:text-slate-400'}`}>
                                        <Briefcase size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">{job.projectName}</h3>
                                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <Building2 size={12} />
                                            <span>{job.clientName || '내부 업무'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${job.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}>
                                    {job.status === 'ACTIVE' ? '사용 중' : '사용 안함'}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-stone-100 dark:border-slate-700">
                                <button
                                    onClick={() => handleOpenEditModal(job)}
                                    className="p-2 rounded-lg bg-stone-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm border border-transparent hover:border-stone-200 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                    title="수정"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(job.id, job.status)}
                                    className={`p-2 rounded-lg bg-stone-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm border border-transparent hover:border-stone-200 dark:hover:border-slate-600 transition-all ${job.status === 'ACTIVE'
                                        ? 'text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400'
                                        }`}
                                    title={job.status === 'ACTIVE' ? "사용 안함으로 변경" : "다시 사용"}
                                >
                                    {job.status === 'ACTIVE' ? <Trash2 size={16} /> : <RotateCcw size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredJobs.length > 50 && (
                        <div className="col-span-full px-4 py-8 text-center text-slate-400 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 border border-dashed border-stone-200 dark:border-slate-600 rounded-2xl">
                            결과가 너무 많습니다. 검색어를 입력하여 대상을 좁혀주세요. (50개까지만 표시됩니다)
                        </div>
                    )}
                    {filteredJobs.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 border border-dashed border-stone-200 dark:border-slate-600 rounded-2xl text-slate-400 dark:text-slate-400 text-sm gap-2">
                            <Briefcase size={32} className="text-stone-200" />
                            <p>조건에 맞는 업무가 없습니다.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Job Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                {isEditing ? <Edit2 size={20} className="text-indigo-500" /> : <Plus size={20} className="text-indigo-500" />}
                                {isEditing ? '업무 수정' : '신규 업무 등록'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">업무명 (필수)</label>
                                <input
                                    type="text"
                                    value={formData.projectName}
                                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                    placeholder="예: 차세대 ERP 구축"
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all font-medium"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">거래처 / 관련 부서</label>
                                <input
                                    type="text"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                    placeholder="예: A사, 경영지원팀"
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-600 transition-all"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/30"
                                disabled={!formData.projectName}
                            >
                                {isEditing ? '수정하기' : '등록하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

