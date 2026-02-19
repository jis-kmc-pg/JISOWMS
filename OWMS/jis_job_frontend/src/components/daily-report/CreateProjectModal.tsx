'use client';

import { Plus, XCircle } from 'lucide-react';

interface CreateProjectModalProps {
    show: boolean;
    data: { clientName: string; projectName: string };
    onDataChange: (data: { clientName: string; projectName: string }) => void;
    onCreate: () => void;
    onClose: () => void;
}

export default function CreateProjectModal({ show, data, onDataChange, onCreate, onClose }: CreateProjectModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-500">
                            <Plus size={16} />
                        </div>
                        신규 업무 등록
                    </h3>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <XCircle size={22} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">거래처 / 관련 부서</label>
                        <input
                            type="text"
                            value={data.clientName}
                            onChange={(e) => onDataChange({ ...data, clientName: e.target.value })}
                            placeholder="예: 호연테크"
                            className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all font-medium dark:placeholder:text-slate-500"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">업무명 (필수)</label>
                        <input
                            type="text"
                            value={data.projectName}
                            onChange={(e) => onDataChange({ ...data, projectName: e.target.value })}
                            placeholder="예: 네트워크 작업"
                            className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all font-medium dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>
                <div className="flex space-x-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-600 transition-all text-sm"
                    >
                        취소
                    </button>
                    <button
                        onClick={onCreate}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/30 text-sm"
                        disabled={!data.projectName.trim()}
                    >
                        등록하기
                    </button>
                </div>
            </div>
        </div>
    );
}
