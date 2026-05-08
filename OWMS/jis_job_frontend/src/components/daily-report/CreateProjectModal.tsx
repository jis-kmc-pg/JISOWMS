'use client';

import { Plus, XCircle, AlertCircle } from 'lucide-react';
import {
    MAX_COMBINED_JOB_TITLE_WIDTH,
    getDisplayWidth,
} from '../../constants/validation';

interface CreateProjectModalProps {
    show: boolean;
    data: { clientName: string; projectName: string };
    onDataChange: (data: { clientName: string; projectName: string }) => void;
    onCreate: () => void;
    onClose: () => void;
}

interface LineInfo {
    text: string;       // 표시될 줄 텍스트 (1줄은 "거래처 : 업무명")
    width: number;      // 디스플레이 너비 (한글 2 / 영문 1)
    exceeded: boolean;
}

function buildLineInfos(projectName: string, clientName: string, maxWidth: number): LineInfo[] {
    const lines = projectName.split('\n');
    return lines.map((rawLine, idx) => {
        const text = idx === 0 && clientName
            ? `${clientName} : ${rawLine}`
            : rawLine;
        const width = getDisplayWidth(text);
        return { text, width, exceeded: width > maxWidth };
    });
}

export default function CreateProjectModal({ show, data, onDataChange, onCreate, onClose }: CreateProjectModalProps) {
    if (!show) return null;

    const lineInfos = buildLineInfos(data.projectName, data.clientName, MAX_COMBINED_JOB_TITLE_WIDTH);
    const hasAnyExceeded = lineInfos.some(l => l.exceeded);
    const isDisabled = !data.projectName.trim() || hasAnyExceeded;

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
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">업무명 (필수, Enter로 줄바꿈)</label>
                        <textarea
                            value={data.projectName}
                            onChange={(e) => onDataChange({ ...data, projectName: e.target.value })}
                            placeholder="예: 네트워크 작업"
                            rows={3}
                            className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all font-medium dark:placeholder:text-slate-500 resize-none"
                        />
                    </div>
                    {data.projectName && (
                        <div className={`p-3 rounded-xl border transition-all ${
                            hasAnyExceeded
                                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/30'
                                : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/30'
                        }`}>
                            <div className="flex items-start space-x-2">
                                <AlertCircle size={16} className={`mt-0.5 shrink-0 ${hasAnyExceeded ? 'text-rose-500' : 'text-indigo-500'}`} />
                                <div className="text-xs flex-1">
                                    <div className={`font-bold mb-2 ${hasAnyExceeded ? 'text-rose-700 dark:text-rose-400' : 'text-indigo-700 dark:text-indigo-400'}`}>
                                        주간업무 작성 시 표시될 줄별 너비 (1줄당 {MAX_COMBINED_JOB_TITLE_WIDTH}, 한글 2/영문 1)
                                    </div>
                                    <div className="space-y-1">
                                        {lineInfos.map((line, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className={`shrink-0 font-bold ${line.exceeded ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {idx + 1}줄
                                                </span>
                                                <span className={`flex-1 break-all font-medium ${line.exceeded ? 'text-rose-600 dark:text-rose-300' : 'text-indigo-600 dark:text-indigo-300'}`}>
                                                    &quot;{line.text}&quot;
                                                </span>
                                                <span className={`shrink-0 font-bold tabular-nums ${line.exceeded ? 'text-rose-500' : 'text-indigo-500'}`}>
                                                    {line.width}/{MAX_COMBINED_JOB_TITLE_WIDTH}
                                                    {line.exceeded && '↑'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
                        disabled={isDisabled}
                    >
                        등록하기
                    </button>
                </div>
            </div>
        </div>
    );
}
