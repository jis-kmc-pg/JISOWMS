"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    PenSquare,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";

export default function PostWritePage() {
    const params = useParams();
    const boardName = params.boardName as string;
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        content: ""
    });
    const [submitting, setSubmitting] = useState(false);

    // Toast
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    const boardMap: Record<string, string> = {
        notice: "공지사항",
        free: "자유게시판",
        qna: "질의응답",
        issue: "이슈게시판",
        suggestion: "건의게시판"
    };

    const toast = (message: string, type: "success" | "error" = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) return;

        try {
            setSubmitting(true);
            await api.post(`/board/${boardName}/posts`, formData);
            toast("등록되었습니다.");
            setTimeout(() => router.push(`/board/${boardName}`), 500);
        } catch {
            toast("등록에 실패했습니다.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="px-8 max-w-[1600px] mx-auto">
            {/* Back */}
            <button onClick={() => router.back()} className="inline-flex items-center text-slate-400 dark:text-slate-400 mb-4 sm:mb-6 hover:text-indigo-600 transition-colors font-medium text-sm">
                <ArrowLeft size={18} className="mr-1.5" aria-hidden="true" /> 취소하고 돌아가기
            </button>

            {/* Write Card */}
            <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-stone-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 sm:p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shrink-0">
                        <PenSquare size={18} className="text-indigo-600 dark:text-indigo-400 sm:hidden" />
                        <PenSquare size={20} className="text-indigo-600 dark:text-indigo-400 hidden sm:block" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">게시글 작성</h1>
                        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">{boardMap[boardName] || boardName}에 새 글을 작성합니다</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">제목</label>
                        <input
                            type="text"
                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none transition-colors text-sm sm:text-[15px] font-bold placeholder:font-normal placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
                            placeholder="제목을 입력하세요"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">내용</label>
                        <textarea
                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 sm:px-5 sm:py-4 h-48 sm:h-72 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none transition-colors resize-none text-sm sm:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder="내용을 자유롭게 입력하세요"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end pt-2 border-t border-stone-100 dark:border-slate-700 gap-2 sm:gap-0">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-5 py-2.5 border border-stone-200 dark:border-slate-600 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm transition-colors sm:mr-3 w-full sm:w-auto"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-colors active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                    등록 중...
                                </>
                            ) : "작성 완료"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Toast */}
            {showToast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 font-bold text-xs sm:text-sm transition-colors max-w-[90vw] ${
                    toastType === "success"
                        ? "bg-emerald-600 text-white shadow-emerald-200"
                        : "bg-rose-600 text-white shadow-rose-200"
                }`}>
                    {toastType === "success" ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
