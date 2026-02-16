"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    User,
    Clock,
    Eye,
    MessageSquare,
    Trash2,
    ArrowLeft,
    Send,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: { id: number; name: string };
}

interface PostDetail {
    id: number;
    title: string;
    content: string;
    viewCount: number;
    createdAt: string;
    user: { id: number; name: string; position: string };
    comments: Comment[];
    board: { name: string };
}

export default function PostDetailPage() {
    const params = useParams();
    const boardName = params.boardName as string;
    const postId = params.postId as string;
    const router = useRouter();

    const [post, setPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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
        fetchPost();
        fetchCurrentUser();
    }, [postId]);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/auth/profile');
            setCurrentUserId(res.data.id);
        } catch {
            // silent
        }
    };

    const fetchPost = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/posts/${postId}`);
            setPost(res.data);
        } catch {
            toast("게시글을 불러올 수 없습니다.", "error");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async () => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/posts/${postId}`);
            toast("삭제되었습니다.");
            setTimeout(() => router.push(`/board/${boardName}`), 500);
        } catch {
            toast("삭제에 실패했습니다.", "error");
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            setSubmittingComment(true);
            await api.post(`/posts/${postId}/comments`, { content: commentText });
            setCommentText("");
            fetchPost();
        } catch {
            toast("댓글 작성에 실패했습니다.", "error");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/posts/comments/${commentId}`);
            fetchPost();
        } catch {
            toast("삭제에 실패했습니다.", "error");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-slate-400">
                <Loader2 size={24} className="animate-spin mr-3" />
                <span className="font-medium">불러오는 중...</span>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <p className="font-bold text-slate-500 mb-2">게시글이 없습니다</p>
                <Link href={`/board/${boardName}`} className="text-indigo-600 hover:underline text-sm font-medium">목록으로 돌아가기</Link>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto">
            {/* Back Link */}
            <Link href={`/board/${boardName}`} className="inline-flex items-center text-slate-400 mb-4 sm:mb-6 hover:text-indigo-600 transition-colors font-medium text-sm">
                <ArrowLeft size={18} className="mr-1.5" /> 목록으로 돌아가기
            </Link>

            {/* Post Card */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden mb-4 sm:mb-6">
                {/* Post Header */}
                <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-stone-100">
                    <h1 className="text-base sm:text-xl font-extrabold text-slate-800 mb-3 sm:mb-4 leading-snug">{post.title}</h1>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400">
                        <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg">
                            <User size={14} className="text-indigo-400" />
                            <span className="text-slate-700 font-bold">{post.user.name}</span>
                            <span className="text-xs text-slate-400 hidden sm:inline">{post.user.position}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-300" />
                            <span>{format(new Date(post.createdAt), "MM.dd HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Eye size={14} className="text-slate-300" />
                            <span>{post.viewCount}</span>
                        </div>
                    </div>
                </div>

                {/* Post Content */}
                <div className="p-4 sm:p-8 min-h-[150px] sm:min-h-[200px] text-slate-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px]">
                    {post.content}
                </div>

                {/* Post Actions */}
                {currentUserId === post.user.id && (
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-stone-50/80 border-t border-stone-100 flex justify-end">
                        <button
                            onClick={handleDeletePost}
                            className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 text-sm font-bold px-3 py-2 sm:px-4 rounded-xl hover:bg-rose-50 transition-all"
                        >
                            <Trash2 size={15} /> 삭제
                        </button>
                    </div>
                )}
            </div>

            {/* Comments Section */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4 sm:p-6">
                <h3 className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-slate-800 mb-4 sm:mb-5">
                    <div className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
                        <MessageSquare size={16} className="text-indigo-600" />
                    </div>
                    댓글 <span className="text-indigo-600">{post.comments.length}</span>
                </h3>

                {/* Comment List */}
                {post.comments.length > 0 ? (
                    <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        {post.comments.map((comment) => (
                            <li key={comment.id} className="bg-stone-50 p-3 sm:p-4 rounded-xl border border-stone-100">
                                <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs sm:text-sm text-slate-800">{comment.user.name}</span>
                                        <span className="text-[11px] sm:text-xs text-slate-400">
                                            {format(new Date(comment.createdAt), "MM.dd HH:mm")}
                                        </span>
                                    </div>
                                    {currentUserId === comment.user.id && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{comment.content}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-6 sm:py-8 text-slate-400 text-xs sm:text-sm mb-4">
                        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                    </div>
                )}

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 min-w-0 border border-stone-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 bg-stone-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium placeholder:font-normal"
                        placeholder="댓글을 입력하세요..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!commentText.trim() || submittingComment}
                        className="bg-indigo-600 text-white px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl hover:bg-indigo-700 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 active:scale-[0.97] flex items-center gap-1.5 shrink-0"
                    >
                        {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        <span className="hidden sm:inline">등록</span>
                    </button>
                </form>
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
