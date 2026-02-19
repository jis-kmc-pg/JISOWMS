"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    PenSquare,
    User,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Loader2,
    FileText
} from "lucide-react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Post {
    id: number;
    title: string;
    user: { name: string; position: string };
    createdAt: string;
    viewCount: number;
    _count: { comments: number };
}

interface Meta {
    total: number;
    page: number;
    last_page: number;
}

export default function BoardListPage() {
    const params = useParams();
    const boardName = params.boardName as string;

    const [posts, setPosts] = useState<Post[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, last_page: 1 });
    const [loading, setLoading] = useState(true);
    const [boardTitle, setBoardTitle] = useState("");

    const boardMap: Record<string, string> = {
        notice: "공지사항",
        free: "자유게시판",
        qna: "질의응답",
        issue: "이슈게시판",
        suggestion: "건의게시판"
    };

    const boardDescMap: Record<string, string> = {
        notice: "공지 사항을 확인하세요",
        free: "자유롭게 이야기를 나눠보세요",
        qna: "질문과 답변을 확인하세요",
        issue: "이슈 사항을 확인하세요",
        suggestion: "건의 사항을 남겨주세요"
    };

    useEffect(() => {
        setBoardTitle(boardMap[boardName] || boardName);
        fetchPosts(1);
    }, [boardName]);

    const fetchPosts = async (page: number) => {
        try {
            setLoading(true);
            const res = await api.get(`/board/${boardName}/posts?page=${page}`);
            setPosts(res.data.data);
            setMeta(res.data.meta);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 sm:p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <Link href="/" className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 transition-colors shrink-0" aria-label="홈으로 이동">
                        <ArrowLeft size={22} aria-hidden="true" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-2.5">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 sm:p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shrink-0">
                                <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400 sm:hidden" />
                                <MessageSquare size={22} className="text-indigo-600 dark:text-indigo-400 hidden sm:block" />
                            </div>
                            <span className="truncate">{boardTitle}</span>
                        </h1>
                        <p className="hidden sm:block text-sm text-slate-400 dark:text-slate-400 mt-1 ml-12">{boardDescMap[boardName] || "게시판"}</p>
                    </div>
                </div>
                <Link
                    href={`/board/${boardName}/write`}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 font-bold text-sm transition-colors active:scale-[0.97] w-full sm:w-auto shrink-0"
                >
                    <PenSquare size={16} aria-hidden="true" /> 글쓰기
                </Link>
            </div>

            {/* Post List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="hidden sm:grid sm:grid-cols-[60px_1fr_120px_100px_60px] bg-stone-50/80 dark:bg-slate-700/30 border-b border-stone-100 dark:border-slate-700 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    <div className="px-5 py-3.5 text-center">No</div>
                    <div className="px-5 py-3.5">제목</div>
                    <div className="px-5 py-3.5">작성자</div>
                    <div className="px-5 py-3.5 text-center">작성일</div>
                    <div className="px-5 py-3.5 text-center">조회</div>
                </div>

                {/* Table Body */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-400">
                        <Loader2 size={24} className="animate-spin mr-3" />
                        <span className="font-medium">불러오는 중...</span>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-400">
                        <FileText size={48} className="text-stone-200 dark:text-slate-600 mb-4" />
                        <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">게시글이 없습니다</p>
                        <p className="text-sm">첫 번째 글을 작성해보세요</p>
                    </div>
                ) : (
                    posts.map((post, idx) => (
                        <Link
                            key={post.id}
                            href={`/board/${boardName}/${post.id}`}
                            className={`block sm:grid sm:grid-cols-[60px_1fr_120px_100px_60px] items-center hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-colors ${
                                idx < posts.length - 1 ? 'border-b border-stone-100 dark:border-slate-700' : ''
                            }`}
                        >
                            <div className="hidden sm:block px-5 py-4 text-center text-sm text-slate-400 dark:text-slate-400 font-medium">{post.id}</div>
                            <div className="px-3 py-3 sm:px-5 sm:py-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 transition-colors text-sm sm:text-[15px] truncate">
                                        {post.title}
                                    </span>
                                    {post._count.comments > 0 && (
                                        <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/30 shrink-0">
                                            {post._count.comments}
                                        </span>
                                    )}
                                </div>
                                {/* Mobile: show author and date */}
                                <div className="sm:hidden flex items-center gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-400">
                                    <span className="font-medium">{post.user.name}</span>
                                    <span>{format(new Date(post.createdAt), "MM.dd")}</span>
                                    <span>조회 {post.viewCount}</span>
                                </div>
                            </div>
                            <div className="hidden sm:block px-5 py-4">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                    <User size={13} className="text-slate-300 dark:text-slate-500" />
                                    <span className="font-medium">{post.user.name}</span>
                                </div>
                            </div>
                            <div className="hidden sm:block px-5 py-4 text-center text-sm text-slate-400 dark:text-slate-400">
                                {format(new Date(post.createdAt), "yyyy.MM.dd")}
                            </div>
                            <div className="hidden sm:block px-5 py-4 text-center text-sm text-slate-400 dark:text-slate-400">
                                {post.viewCount}
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-center mt-4 sm:mt-6 gap-1">
                    <button
                        disabled={meta.page === 1}
                        onClick={() => fetchPosts(meta.page - 1)}
                        className="p-1.5 sm:p-2 rounded-xl border border-stone-200 dark:border-slate-600 hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="이전 페이지"
                    >
                        <ChevronLeft size={16} className="sm:hidden" aria-hidden="true" />
                        <ChevronLeft size={18} className="hidden sm:block" aria-hidden="true" />
                    </button>

                    {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                        .filter(p => Math.abs(p - meta.page) <= 1 || p === 1 || p === meta.last_page)
                        .map((p, idx, arr) => {
                            const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                            return (
                                <span key={p} className="flex items-center">
                                    {showEllipsis && <span className="px-1 sm:px-2 text-slate-300 dark:text-slate-500 text-xs sm:text-sm">&hellip;</span>}
                                    <button
                                        onClick={() => fetchPosts(p)}
                                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                                            meta.page === p
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-700 hover:text-indigo-600'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                </span>
                            );
                        })}

                    <button
                        disabled={meta.page === meta.last_page}
                        onClick={() => fetchPosts(meta.page + 1)}
                        className="p-1.5 sm:p-2 rounded-xl border border-stone-200 dark:border-slate-600 hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="다음 페이지"
                    >
                        <ChevronRight size={16} className="sm:hidden" aria-hidden="true" />
                        <ChevronRight size={18} className="hidden sm:block" aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
}
