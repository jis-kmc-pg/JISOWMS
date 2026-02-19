"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    PenSquare,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2
} from "lucide-react";
import { format } from "date-fns";

interface StatusItem {
    category: string;
    itemDate: string;
    content: string;
}

const CATEGORIES = [
    { value: "ISSUE", label: "이슈" },
    { value: "SALES", label: "영업" },
    { value: "REVENUE", label: "매출" },
    { value: "COLLECTION", label: "수금" },
    { value: "ORDER", label: "수주" },
    { value: "DEVELOPMENT", label: "개발" },
];

export default function TeamStatusWritePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEditMode = !!editId;

    const [reportDate, setReportDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [items, setItems] = useState<StatusItem[]>([
        { category: "ISSUE", itemDate: format(new Date(), "yyyy-MM-dd"), content: "" },
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [teamName, setTeamName] = useState("");

    // Toast
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    const toast = (message: string, type: "success" | "error" = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                const u = JSON.parse(savedUser);
                setTeamName(u.team?.name || u.department?.name || "");
            } catch { /* ignore */ }
        }
    }, []);

    // 수정 모드: 기존 보고서 데이터 로드
    useEffect(() => {
        if (!editId) return;
        const loadReport = async () => {
            try {
                setLoadingEdit(true);
                const res = await api.get(`/team-status/${editId}`);
                const report = res.data;
                setReportDate(format(new Date(report.reportDate), "yyyy-MM-dd"));
                setTeamName(report.team?.name || "");
                setItems(
                    report.items.map((item: any) => ({
                        category: item.category,
                        itemDate: format(new Date(item.itemDate), "yyyy-MM-dd"),
                        content: item.content,
                    }))
                );
            } catch {
                toast("보고서를 불러올 수 없습니다.", "error");
                setTimeout(() => router.back(), 500);
            } finally {
                setLoadingEdit(false);
            }
        };
        loadReport();
    }, [editId]);

    const addItem = () => {
        setItems([...items, { category: "ISSUE", itemDate: format(new Date(), "yyyy-MM-dd"), content: "" }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof StatusItem, value: string) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasEmpty = items.some((item) => !item.content.trim());
        if (hasEmpty) {
            toast("모든 항목의 내용을 입력해주세요.", "error");
            return;
        }

        try {
            setSubmitting(true);
            if (isEditMode) {
                await api.put(`/team-status/${editId}`, { reportDate, items });
                toast("보고서가 수정되었습니다.");
            } else {
                await api.post("/team-status", { reportDate, items });
                toast("보고서가 등록되었습니다.");
            }
            setTimeout(() => router.push("/board/team-status"), 500);
        } catch {
            toast(isEditMode ? "수정에 실패했습니다." : "등록에 실패했습니다.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto">
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
                        <h1 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">{isEditMode ? "팀현황보고 수정" : "팀현황보고 작성"}</h1>
                        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                            {teamName ? `${teamName} 현황점검` : "팀 현황을 보고합니다"}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
                    {/* Report Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">보고 날짜</label>
                        <input
                            type="date"
                            className="w-full sm:w-64 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none transition-colors text-sm font-bold dark:text-slate-200"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Items Table */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">보고 항목</label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                                <Plus size={14} aria-hidden="true" /> 행 추가
                            </button>
                        </div>

                        {/* Table Header */}
                        <div className="hidden sm:grid sm:grid-cols-[140px_140px_1fr_40px] bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-t-xl text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                            <div className="px-3 py-2.5 border-r border-stone-200 dark:border-slate-600">항목</div>
                            <div className="px-3 py-2.5 border-r border-stone-200 dark:border-slate-600">일자</div>
                            <div className="px-3 py-2.5">내용</div>
                            <div className="px-2 py-2.5"></div>
                        </div>

                        {/* Table Body */}
                        <div className="border border-stone-200 dark:border-slate-600 sm:border-t-0 rounded-xl sm:rounded-t-none divide-y divide-stone-100 dark:divide-slate-700">
                            {items.map((item, idx) => (
                                <div key={idx} className="sm:grid sm:grid-cols-[140px_140px_1fr_40px] items-center">
                                    {/* Mobile label */}
                                    <div className="sm:hidden px-3 pt-3 pb-1 text-[10px] font-bold text-slate-300 dark:text-slate-500 uppercase">항목 {idx + 1}</div>

                                    <div className="px-2 py-2 sm:border-r border-stone-100 dark:border-slate-700">
                                        <select
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-lg px-2 py-2 text-sm font-bold bg-white dark:bg-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none"
                                            value={item.category}
                                            onChange={(e) => updateItem(idx, "category", e.target.value)}
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="px-2 py-2 sm:border-r border-stone-100 dark:border-slate-700">
                                        <input
                                            type="date"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none"
                                            value={item.itemDate}
                                            onChange={(e) => updateItem(idx, "itemDate", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="px-2 py-2">
                                        <input
                                            type="text"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                            placeholder="내용을 입력하세요"
                                            value={item.content}
                                            onChange={(e) => updateItem(idx, "content", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="px-2 py-2 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            disabled={items.length <= 1}
                                            className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            aria-label="항목 삭제"
                                        >
                                            <Trash2 size={15} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
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
                            disabled={submitting}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-colors active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                    {isEditMode ? "수정 중..." : "등록 중..."}
                                </>
                            ) : isEditMode ? "수정 완료" : "작성 완료"}
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
