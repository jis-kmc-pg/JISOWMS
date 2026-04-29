'use client';

import { Plus, XCircle, AlertCircle } from 'lucide-react';
import {
    MAX_PROJECT_NAME_LENGTH,
    MAX_CLIENT_NAME_LENGTH,
    MAX_COMBINED_JOB_TITLE_LENGTH
} from '../../constants/validation';

interface CreateProjectModalProps {
    show: boolean;
    data: { clientName: string; projectName: string };
    onDataChange: (data: { clientName: string; projectName: string }) => void;
    onCreate: () => void;
    onClose: () => void;
}

export default function CreateProjectModal({ show, data, onDataChange, onCreate, onClose }: CreateProjectModalProps) {
    if (!show) return null;

    const projectNameLen = data.projectName.length;
    const clientNameLen = data.clientName.length;
    const combinedLen = data.clientName
        ? clientNameLen + 3 + projectNameLen // " : " = 3자
        : projectNameLen;
    const combinedTitle = data.clientName
        ? `${data.clientName} : ${data.projectName}`
        : data.projectName;

    const isProjectNameExceeded = projectNameLen > MAX_PROJECT_NAME_LENGTH;
    const isClientNameExceeded = clientNameLen > MAX_CLIENT_NAME_LENGTH;
    const isCombinedExceeded = !!data.clientName && combinedLen > MAX_COMBINED_JOB_TITLE_LENGTH;

    const isDisabled =
        !data.projectName.trim() ||
        isProjectNameExceeded ||
        isClientNameExceeded ||
        isCombinedExceeded;

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
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">거래처 / 관련 부서</label>
                            <span className={`text-xs font-bold ${isClientNameExceeded ? 'text-rose-500' : 'text-slate-400 dark:text-slate-400'}`}>
                                {clientNameLen}/{MAX_CLIENT_NAME_LENGTH}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={data.clientName}
                            onChange={(e) => onDataChange({ ...data, clientName: e.target.value })}
                            placeholder="예: 호연테크"
                            className={`w-full bg-stone-50 dark:bg-slate-700/50 border rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 transition-all font-medium dark:placeholder:text-slate-500 ${
                                isClientNameExceeded
                                    ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-800/30'
                                    : 'border-stone-200 dark:border-slate-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-indigo-100 dark:focus:ring-indigo-800/30'
                            }`}
                            autoFocus
                        />
                        {isClientNameExceeded && (
                            <div className="flex items-center space-x-1.5 mt-2 text-rose-500 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                                <AlertCircle size={14} />
                                <span>거래처명은 최대 {MAX_CLIENT_NAME_LENGTH}자까지 입력 가능합니다.</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">업무명 (필수)</label>
                            <span className={`text-xs font-bold ${isProjectNameExceeded ? 'text-rose-500' : 'text-slate-400 dark:text-slate-400'}`}>
                                {projectNameLen}/{MAX_PROJECT_NAME_LENGTH}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={data.projectName}
                            onChange={(e) => onDataChange({ ...data, projectName: e.target.value })}
                            placeholder="예: 네트워크 작업"
                            className={`w-full bg-stone-50 dark:bg-slate-700/50 border rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 transition-all font-medium dark:placeholder:text-slate-500 ${
                                isProjectNameExceeded
                                    ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-800/30'
                                    : 'border-stone-200 dark:border-slate-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-indigo-100 dark:focus:ring-indigo-800/30'
                            }`}
                        />
                        {isProjectNameExceeded && (
                            <div className="flex items-center space-x-1.5 mt-2 text-rose-500 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                                <AlertCircle size={14} />
                                <span>업무명은 최대 {MAX_PROJECT_NAME_LENGTH}자까지 입력 가능합니다.</span>
                            </div>
                        )}
                    </div>
                    {data.clientName && data.projectName && (
                        <div className={`p-3 rounded-xl border transition-all ${
                            isCombinedExceeded
                                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/30'
                                : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/30'
                        }`}>
                            <div className="flex items-start space-x-2">
                                <AlertCircle size={16} className={`mt-0.5 shrink-0 ${isCombinedExceeded ? 'text-rose-500' : 'text-indigo-500'}`} />
                                <div className="text-xs">
                                    <div className={`font-bold mb-1 ${isCombinedExceeded ? 'text-rose-700 dark:text-rose-400' : 'text-indigo-700 dark:text-indigo-400'}`}>
                                        주간업무 작성 시 표시될 제목
                                    </div>
                                    <div className={`font-medium mb-1.5 break-all ${isCombinedExceeded ? 'text-rose-600 dark:text-rose-300' : 'text-indigo-600 dark:text-indigo-300'}`}>
                                        &quot;{combinedTitle}&quot;
                                    </div>
                                    <div className={`font-bold ${isCombinedExceeded ? 'text-rose-500' : 'text-indigo-500'}`}>
                                        {combinedLen}/{MAX_COMBINED_JOB_TITLE_LENGTH}자
                                        {isCombinedExceeded && ' (초과!)'}
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
