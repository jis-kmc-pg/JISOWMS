"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import {
    Activity,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    LogIn,
    LogOut,
    FilePlus,
    Pencil,
    Trash2,
    Filter,
} from "lucide-react";

interface ActivityLog {
    id: number;
    userId: number | null;
    userName: string | null;
    action: string;
    method: string;
    path: string;
    statusCode: number | null;
    ip: string | null;
    detail: string | null;
    createdAt: string;
    user: {
        id: number;
        name: string;
        userId: string;
        role: string;
    } | null;
}

interface UserOption {
    id: number;
    name: string;
    userId: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    LOGIN: { label: "로그인", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <LogIn size={12} /> },
    LOGOUT: { label: "로그아웃", color: "bg-slate-50 text-slate-600 border-slate-200", icon: <LogOut size={12} /> },
    CREATE: { label: "생성", color: "bg-blue-50 text-blue-600 border-blue-100", icon: <FilePlus size={12} /> },
    UPDATE: { label: "수정", color: "bg-amber-50 text-amber-600 border-amber-100", icon: <Pencil size={12} /> },
    DELETE: { label: "삭제", color: "bg-rose-50 text-rose-600 border-rose-100", icon: <Trash2 size={12} /> },
};

const STATUS_COLORS: Record<string, string> = {
    "2": "text-emerald-600",
    "3": "text-blue-600",
    "4": "text-amber-600",
    "5": "text-rose-600",
};

function getStatusColor(code: number | null): string {
    if (!code) return "text-slate-400";
    const prefix = String(code)[0];
    return STATUS_COLORS[prefix] || "text-slate-500";
}

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserOption[]>([]);

    // Filters
    const [filterUserId, setFilterUserId] = useState("");
    const [filterAction, setFilterAction] = useState("");
    const [filterStartDate, setFilterStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [filterEndDate, setFilterEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [page]);

    const loadUsers = async () => {
        try {
            const res = await api.get("/admin/users");
            const list = Array.isArray(res.data) ? res.data : res.data.data || [];
            setUsers(list.map((u: any) => ({ id: u.id, name: u.name, userId: u.userId })));
        } catch { /* ignore */ }
    };

    const loadLogs = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = { page: String(page), limit: "30" };
            if (filterUserId) params.userId = filterUserId;
            if (filterAction) params.action = filterAction;
            if (filterStartDate) params.startDate = filterStartDate;
            if (filterEndDate) params.endDate = filterEndDate;

            const res = await api.get("/activity-logs", { params });
            setLogs(res.data.data);
            setTotalPages(res.data.totalPages);
            setTotal(res.data.total);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadLogs();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                    <Activity size={22} className="text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-800">활동 로그</h1>
                    <p className="text-xs text-slate-400 mt-0.5">사용자 활동 기록을 확인합니다</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">필터</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <select
                        className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold"
                        value={filterUserId}
                        onChange={(e) => setFilterUserId(e.target.value)}
                    >
                        <option value="">전체 사용자</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.userId})</option>
                        ))}
                    </select>
                    <select
                        className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold"
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                    >
                        <option value="">전체 액션</option>
                        <option value="LOGIN">로그인</option>
                        <option value="LOGOUT">로그아웃</option>
                        <option value="CREATE">생성</option>
                        <option value="UPDATE">수정</option>
                        <option value="DELETE">삭제</option>
                    </select>
                    <input
                        type="date"
                        className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <input
                        type="date"
                        className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                    >
                        <Search size={14} /> 검색
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Result Header */}
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                        총 <span className="text-indigo-600">{total.toLocaleString()}</span>건
                    </span>
                    <span className="text-xs text-slate-400">
                        {page} / {totalPages} 페이지
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <Loader2 size={24} className="animate-spin mr-3" />
                        <span className="font-medium">불러오는 중...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Activity size={40} className="mb-3 text-slate-200" />
                        <p className="font-bold text-slate-500">로그가 없습니다</p>
                        <p className="text-xs text-slate-400 mt-1">필터를 변경해보세요</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-44">시각</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-32">사용자</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-24">액션</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">경로</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">상태</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-32">IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const actionInfo = ACTION_LABELS[log.action] || {
                                            label: log.action,
                                            color: "bg-slate-50 text-slate-600 border-slate-200",
                                            icon: null,
                                        };
                                        return (
                                            <tr key={log.id} className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-slate-500 font-medium">
                                                    {format(new Date(log.createdAt), "yyyy.MM.dd HH:mm:ss")}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {log.user?.name || log.userName || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${actionInfo.color}`}>
                                                        {actionInfo.icon}
                                                        {actionInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 font-mono truncate max-w-xs" title={log.path}>
                                                    <span className="text-xs font-bold text-slate-400 mr-1">{log.method}</span>
                                                    {log.path}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-sm font-bold ${getStatusColor(log.statusCode)}`}>
                                                        {log.statusCode || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                                    {log.ip || "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden divide-y divide-stone-100">
                            {logs.map((log) => {
                                const actionInfo = ACTION_LABELS[log.action] || {
                                    label: log.action,
                                    color: "bg-slate-50 text-slate-600 border-slate-200",
                                    icon: null,
                                };
                                return (
                                    <div key={log.id} className="p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${actionInfo.color}`}>
                                                {actionInfo.icon}
                                                {actionInfo.label}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {format(new Date(log.createdAt), "MM.dd HH:mm")}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700">
                                                {log.user?.name || log.userName || "-"}
                                            </span>
                                            <span className={`text-xs font-bold ${getStatusColor(log.statusCode)}`}>
                                                {log.statusCode || "-"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono mt-1 truncate">
                                            <span className="font-bold text-slate-400 mr-1">{log.method}</span>
                                            {log.path}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-lg hover:bg-stone-50 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                                        page === pageNum
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                            : "text-slate-400 hover:bg-stone-50"
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page >= totalPages}
                            className="p-2 rounded-lg hover:bg-stone-50 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
