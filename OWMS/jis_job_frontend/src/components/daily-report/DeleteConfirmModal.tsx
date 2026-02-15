'use client';

import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
    show: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteConfirmModal({ show, onConfirm, onCancel }: DeleteConfirmModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-stone-100 rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 text-center">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">정말 삭제하시겠습니까?</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    선택한 업무 항목이 리스트에서 제거됩니다.<br />
                    (작성된 내용은 복구할 수 없습니다)
                </p>
                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-stone-100 transition-all text-sm"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-rose-500 hover:bg-rose-600 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 text-sm"
                    >
                        삭제하기
                    </button>
                </div>
            </div>
        </div>
    );
}
