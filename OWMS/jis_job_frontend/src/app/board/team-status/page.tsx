"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    ClipboardCheck,
    ArrowLeft,
    PenSquare,
    ChevronLeft,
    ChevronRight,
    Loader2,
    FileText,
    Users,
    Pencil,
    Trash2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StatusItem {
    id: number;
    category: string;
    itemDate: string;
    content: string;
}

interface TeamStatusReport {
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

export default function TeamStatusListPage() {
    const router = useRouter();
    const [reports, setReports] = useState<TeamStatusReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>("");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentWeek, setCurrentWeek] = useState(new Date());

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
                setUserRole(u.role || "");
                setCurrentUserId(u.id || null);
            } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [currentWeek]);

    const canWrite = userRole === "TEAM_LEADER";
    const isSeniorRole = ["CEO", "EXECUTIVE", "DEPT_HEAD"].includes(userRole);

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 월요일 시작
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const isThisWeek = isSameWeek(currentWeek, new Date(), { weekStartsOn: 1 });

    const fetchReports = async () => {
        try {
            setLoading(true);
            const start = format(weekStart, "yyyy-MM-dd");
            const end = format(weekEnd, "yyyy-MM-dd");
            const res = await api.get(`/team-status?startDate=${start}&endDate=${end}`);
            setReports(res.data.data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reportId: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/team-status/${reportId}`);
            toast("삭제되었습니다.");
            fetchReports();
        } catch {
            toast("삭제에 실패했습니다.", "error");
        }
    };

    // 팀별로 그룹핑 후 항목 통합
    const groupedByTeam = reports.reduce<Record<string, { teamName: string; reportId: number; userId: number; userName: string; items: StatusItem[] }>>((acc, report) => {
        const key = report.team.name;
        if (!acc[key]) {
            acc[key] = { teamName: report.team.name, reportId: report.id, userId: report.user.id, userName: report.user.name, items: [] };
        }
        acc[key].items.push(...report.items);
        return acc;
    }, {});

    // 각 팀 그룹 내 항목을 카테고리 순서로 정렬
    Object.values(groupedByTeam).forEach((group) => {
        group.items.sort((a, b) => (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99));
    });

    // 통합 테이블용 플랫 데이터 (팀 | 항목 | 일자 | 내용)
    const flatRows: { teamName: string; reportId: number; userId: number; category: string; itemDate: string; content: string; isFirstOfTeam: boolean; teamRowSpan: number }[] = [];

    Object.values(groupedByTeam).forEach((group) => {
        group.items.forEach((item, idx) => {
            flatRows.push({
                teamName: group.teamName,
                reportId: group.reportId,
                userId: group.userId,
                category: item.category,
                itemDate: item.itemDate,
                content: item.content,
                isFirstOfTeam: idx === 0,
                teamRowSpan: group.items.length,
            });
        });
    });

    return (
        <div className="p-3 sm:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <Link href="/" className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
                        <ArrowLeft size={22} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2 sm:gap-2.5">
                            <div className="bg-indigo-50 p-1.5 sm:p-2 rounded-xl border border-indigo-100 shrink-0">
                                <ClipboardCheck size={18} className="text-indigo-600 sm:hidden" />
                                <ClipboardCheck size={22} className="text-indigo-600 hidden sm:block" />
                            </div>
                            <span className="truncate">팀현황보고</span>
                        </h1>
                        <p className="hidden sm:block text-sm text-slate-400 mt-1 ml-12">부서 내 팀별 주간 현황을 확인하세요</p>
                    </div>
                </div>
                {canWrite && (
                    <Link
                        href="/board/team-status/write"
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 font-bold text-sm transition-all active:scale-[0.97] w-full sm:w-auto shrink-0"
                    >
                        <PenSquare size={16} /> 보고서 작성
                    </Link>
                )}
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-center gap-3 mb-5">
                <button
                    onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-slate-500 hover:text-indigo-600 transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="text-center min-w-[220px]">
                    <p className="text-sm sm:text-base font-extrabold text-slate-800">
                        {format(weekStart, "M월 d일", { locale: ko })} ~ {format(weekEnd, "M월 d일", { locale: ko })}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {format(weekStart, "yyyy년", { locale: ko })}
                    </p>
                </div>
                <button
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-slate-500 hover:text-indigo-600 transition-all"
                >
                    <ChevronRight size={18} />
                </button>
                {!isThisWeek && (
                    <button
                        onClick={() => setCurrentWeek(new Date())}
                        className="text-xs font-bold text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-all"
                    >
                        이번주
                    </button>
                )}
            </div>

            {/* Consolidated Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <Loader2 size={24} className="animate-spin mr-3" />
                        <span className="font-medium">불러오는 중...</span>
                    </div>
                ) : flatRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <FileText size={48} className="text-stone-200 mb-4" />
                        <p className="font-bold text-slate-500 mb-1">이 주간에 보고서가 없습니다</p>
                        <p className="text-sm">팀장이 보고서를 작성하면 여기에 표시됩니다</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-stone-50/80 border-b border-stone-100">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-32 border-r border-stone-100">팀</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-24 border-r border-stone-100">항목</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28 border-r border-stone-100">일자</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">내용</th>
                                        <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flatRows.map((row, idx) => (
                                        <tr key={idx} className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/30 transition-colors">
                                            {row.isFirstOfTeam && (
                                                <td
                                                    rowSpan={row.teamRowSpan}
                                                    className="px-4 py-3 border-r border-stone-100 align-top"
                                                >
                                                    <Link href={`/board/team-status/${row.reportId}`} className="hover:text-indigo-600 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-indigo-50 p-1 rounded-lg shrink-0">
                                                                <Users size={13} className="text-indigo-500" />
                                                            </div>
                                                            <span className="font-bold text-sm text-slate-800">{row.teamName}</span>
                                                        </div>
                                                    </Link>
                                                </td>
                                            )}
                                            <td className="px-4 py-3 border-r border-stone-100">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[row.category] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
                                                    {CATEGORY_LABELS[row.category] || row.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500 border-r border-stone-100">
                                                {format(new Date(row.itemDate), "MM.dd")}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 leading-relaxed">
                                                {row.content}
                                            </td>
                                            {row.isFirstOfTeam && (
                                                <td rowSpan={row.teamRowSpan} className="px-2 py-3 align-top text-center">
                                                    {(currentUserId === row.userId || isSeniorRole) && (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Link
                                                                href={`/board/team-status/write?id=${row.reportId}`}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                title="수정"
                                                            >
                                                                <Pencil size={14} />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(row.reportId)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                title="삭제"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards (팀별 그룹) */}
                        <div className="sm:hidden divide-y divide-stone-100">
                            {Object.values(groupedByTeam).map((group) => (
                                <div key={group.teamName} className="p-3">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <Link href={`/board/team-status/${group.reportId}`} className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="bg-indigo-50 p-1 rounded-lg shrink-0">
                                                <Users size={13} className="text-indigo-500" />
                                            </div>
                                            <span className="font-bold text-sm text-slate-800">{group.teamName}</span>
                                            <span className="text-[10px] text-slate-400">{group.userName}</span>
                                        </Link>
                                        {(currentUserId === group.userId || isSeniorRole) && (
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <Link
                                                    href={`/board/team-status/write?id=${group.reportId}`}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                >
                                                    <Pencil size={13} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(group.reportId)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {group.items.map((item, idx) => (
                                            <div key={idx} className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[item.category] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
                                                        {CATEGORY_LABELS[item.category] || item.category}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">{format(new Date(item.itemDate), "MM.dd")}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 leading-relaxed">{item.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Toast */}
            {showToast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 font-bold text-xs sm:text-sm transition-all max-w-[90vw] ${
                    toastType === "success"
                        ? "bg-emerald-600 text-white shadow-emerald-200"
                        : "bg-rose-600 text-white shadow-rose-200"
                }`}>
                    {toastType === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
