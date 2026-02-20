"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Users,
    Clock,
    Trash2,
    Pencil,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ClipboardCheck
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ConfirmDialog from '@/components/ConfirmDialog';

interface StatusItem {
    id: number;
    category: string;
    itemDate: string;
    content: string;
}

interface ReportDetail {
    id: number;
    reportDate: string;
    createdAt: string;
    user: { id: number; name: string; position: string };
    team: { id: number; name: string };
    items: StatusItem[];
}

const CATEGORY_ORDER: Record<string, number> = {
    ISSUE: 0,
    SALES: 1,
    REVENUE: 2,
    COLLECTION: 3,
    ORDER: 4,
    DEVELOPMENT: 5,
};

const CATEGORY_LABELS: Record<string, string> = {
    ISSUE: "이슈",
    SALES: "영업",
    REVENUE: "매출",
    COLLECTION: "수금",
    ORDER: "수주",
    DEVELOPMENT: "개발",
};

const CATEGORY_COLORS: Record<string, string> = {
    ISSUE: "bg-rose-50 text-rose-600 border-rose-100",
    COLLECTION: "bg-amber-50 text-amber-600 border-amber-100",
    ORDER: "bg-emerald-50 text-emerald-600 border-emerald-100",
    DEVELOPMENT: "bg-blue-50 text-blue-600 border-blue-100",
    SALES: "bg-purple-50 text-purple-600 border-purple-100",
    REVENUE: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

export default function TeamStatusDetailPage() {
    const params = useParams();
    const reportId = params.reportId as string;
    const router = useRouter();

    const [report, setReport] = useState<ReportDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

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
        fetchReport();
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                const u = JSON.parse(savedUser);
                setCurrentUserId(u.id);
                setCurrentUserRole(u.role || "");
            } catch { /* ignore */ }
        }
    }, [reportId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/team-status/${reportId}`);
            setReport(res.data);
        } catch {
            toast("보고서를 불러올 수 없습니다.", "error");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        setConfirmAction(() => async () => {
            try {
                await api.delete(`/team-status/${reportId}`);
                toast("삭제되었습니다.");
                setTimeout(() => router.push("/board/team-status"), 500);
            } catch {
                toast("삭제에 실패했습니다.", "error");
            }
        });
        setShowConfirm(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-slate-400 dark:text-slate-400">
                <Loader2 size={24} className="animate-spin mr-3" />
                <span className="font-medium">불러오는 중...</span>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-400">
                <p className="font-bold text-slate-500 dark:text-slate-400 mb-2">보고서가 없습니다</p>
                <Link href="/board/team-status" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">목록으로 돌아가기</Link>
            </div>
        );
    }

    const sortedItems = [...report.items].sort(
        (a, b) => (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99)
    );

    return (
        <div className="px-8 max-w-[1600px] mx-auto">
            {/* Back Link */}
            <Link href="/board/team-status" className="inline-flex items-center text-slate-400 dark:text-slate-400 mb-4 sm:mb-6 hover:text-indigo-600 transition-colors font-medium text-sm">
                <ArrowLeft size={18} className="mr-1.5" /> 목록으로 돌아가기
            </Link>

            {/* Report Card */}
            <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden">
                {/* Report Header */}
                <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-stone-100 dark:border-slate-700">
                    <h1 className="text-base sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-3 sm:mb-4 leading-snug flex items-center gap-2.5">
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shrink-0">
                            <ClipboardCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        {report.team.name} 현황점검
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-slate-700/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg">
                            <Users size={14} className="text-indigo-400" />
                            <span className="text-slate-700 dark:text-slate-200 font-bold">{report.user.name}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-400 hidden sm:inline">{report.user.position}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-300 dark:text-slate-500" />
                            <span>보고일: {format(new Date(report.reportDate), "yyyy.MM.dd")}</span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="p-4 sm:p-6">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-t-xl">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider w-28 border-r border-stone-200 dark:border-slate-600">항목</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider w-32 border-r border-stone-200 dark:border-slate-600">일자</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">내용</th>
                                </tr>
                            </thead>
                            <tbody className="border border-stone-200 dark:border-slate-600 border-t-0">
                                {sortedItems.map((item) => (
                                    <tr key={item.id} className="border-b border-stone-100 dark:border-slate-700 last:border-b-0 hover:bg-stone-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 border-r border-stone-100 dark:border-slate-700">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[item.category] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
                                                {CATEGORY_LABELS[item.category] || item.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 border-r border-stone-100 dark:border-slate-700">
                                            {format(new Date(item.itemDate), "yyyy.MM.dd")}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                            {item.content}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3">
                        {sortedItems.map((item) => (
                            <div key={item.id} className="bg-stone-50 dark:bg-slate-700/50 p-3 rounded-xl border border-stone-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[item.category] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
                                        {CATEGORY_LABELS[item.category] || item.category}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-400">{format(new Date(item.itemDate), "MM.dd")}</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                {(currentUserId === report.user.id || ["CEO", "EXECUTIVE", "DEPT_HEAD"].includes(currentUserRole)) && (
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-stone-50/80 dark:bg-slate-700/30 border-t border-stone-100 dark:border-slate-700 flex justify-end gap-2">
                        <Link
                            href={`/board/team-status/write?id=${reportId}`}
                            className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm font-bold px-3 py-2 sm:px-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                            <Pencil size={15} aria-hidden="true" /> 수정
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-600 text-sm font-bold px-3 py-2 sm:px-4 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                        >
                            <Trash2 size={15} aria-hidden="true" /> 삭제
                        </button>
                    </div>
                )}
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

            <ConfirmDialog
                show={showConfirm}
                title="삭제 확인"
                description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                confirmLabel="삭제"
                variant="danger"
                onConfirm={() => {
                    confirmAction?.();
                    setShowConfirm(false);
                    setConfirmAction(null);
                }}
                onCancel={() => {
                    setShowConfirm(false);
                    setConfirmAction(null);
                }}
            />
        </div>
    );
}
