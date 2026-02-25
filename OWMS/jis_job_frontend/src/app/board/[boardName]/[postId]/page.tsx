"use client";

import { useState, useEffect, useCallback } from "react";
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
    AlertCircle,
    Edit3,
    X
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ConfirmDialog from '@/components/ConfirmDialog';

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
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmMessage, setConfirmMessage] = useState("");

    // 수정 모드
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: "", content: "" });
    const [submittingEdit, setSubmittingEdit] = useState(false);

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
            const res = await api.get('/users/me');
            console.log('Current User ID:', res.data.id);
            setCurrentUserId(res.data.id);
        } catch (error) {
            console.error('Failed to fetch current user:', error);
        }
    };

    const fetchPost = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/posts/${postId}`);
            console.log('Post User ID:', res.data.user.id);
            console.log('Comments:', res.data.comments.map((c: Comment) => ({ id: c.id, userId: c.user.id })));
            setPost(res.data);
        } catch {
            toast("게시글을 불러올 수 없습니다.", "error");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = () => {
        setConfirmMessage("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
        setConfirmAction(() => async () => {
            try {
                await api.delete(`/posts/${postId}`);
                toast("삭제되었습니다.");
                setTimeout(() => router.push(`/board/${boardName}`), 500);
            } catch {
                toast("삭제에 실패했습니다.", "error");
            }
        });
        setShowConfirm(true);
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

    const handleDeleteComment = (commentId: number) => {
        setConfirmMessage("댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
        setConfirmAction(() => async () => {
            try {
                await api.delete(`/posts/comments/${commentId}`);
                fetchPost();
                toast("댓글이 삭제되었습니다.");
            } catch {
                toast("삭제에 실패했습니다.", "error");
            }
        });
        setShowConfirm(true);
    };

    const handleEditClick = () => {
        if (post) {
            setEditData({ title: post.title, content: post.content });
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({ title: "", content: "" });
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editData.title.trim() || !editData.content.trim()) return;

        try {
            setSubmittingEdit(true);
            await api.patch(`/posts/${postId}`, editData);
            toast("수정되었습니다.");
            setIsEditing(false);
            fetchPost();
        } catch {
            toast("수정에 실패했습니다.", "error");
        } finally {
            setSubmittingEdit(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-slate-400 dark:text-slate-400">
                <Loader2 size={24} className="animate-spin mr-3" />
                <span className="font-medium">불러오는 중...</span>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-400">
                <p className="font-bold text-slate-500 dark:text-slate-400 mb-2">게시글이 없습니다</p>
                <Link href={`/board/${boardName}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">목록으로 돌아가기</Link>
            </div>
        );
    }

    return (
        <div className="px-8 max-w-[1600px] mx-auto">
            {/* Back Link */}
            <Link href={`/board/${boardName}`} className="inline-flex items-center text-slate-400 dark:text-slate-400 mb-4 sm:mb-6 hover:text-indigo-600 transition-colors font-medium text-sm">
                <ArrowLeft size={18} className="mr-1.5" /> 목록으로 돌아가기
            </Link>

            {/* Post Card */}
            <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden mb-4 sm:mb-6">
                {!isEditing ? (
                    <>
                        {/* Post Header */}
                        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-stone-100 dark:border-slate-700">
                            <h1 className="text-base sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-3 sm:mb-4 leading-snug">{post.title}</h1>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400 dark:text-slate-400">
                                <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-slate-700/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg">
                                    <User size={14} className="text-indigo-400" />
                                    <span className="text-slate-700 dark:text-slate-200 font-bold">{post.user.name}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-400 hidden sm:inline">{post.user.position}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-slate-300 dark:text-slate-500" />
                                    <span>{format(new Date(post.createdAt), "MM.dd HH:mm")}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Eye size={14} className="text-slate-300 dark:text-slate-500" />
                                    <span>{post.viewCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-4 sm:p-8 min-h-[150px] sm:min-h-[200px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px]">
                            {post.content}
                        </div>

                        {/* Post Actions */}
                        {(() => {
                            const canModify = currentUserId === post.user.id;
                            console.log('Post Action Buttons:', { currentUserId, postUserId: post.user.id, canModify });
                            return canModify;
                        })() && (
                            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-stone-50/80 dark:bg-slate-700/30 border-t border-stone-100 dark:border-slate-700 flex justify-end gap-2">
                                <button
                                    onClick={handleEditClick}
                                    className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm font-bold px-3 py-2 sm:px-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                >
                                    <Edit3 size={15} aria-hidden="true" /> 수정
                                </button>
                                <button
                                    onClick={handleDeletePost}
                                    className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-600 text-sm font-bold px-3 py-2 sm:px-4 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                >
                                    <Trash2 size={15} aria-hidden="true" /> 삭제
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Edit Header */}
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-stone-100 dark:border-slate-700 flex items-center gap-3">
                            <div className="bg-amber-50 dark:bg-amber-900/30 p-1.5 sm:p-2 rounded-xl border border-amber-100 dark:border-amber-800/30 shrink-0">
                                <Edit3 size={18} className="text-amber-600 dark:text-amber-400 sm:hidden" />
                                <Edit3 size={20} className="text-amber-600 dark:text-amber-400 hidden sm:block" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">게시글 수정</h2>
                                <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">내용을 수정하고 저장하세요</p>
                            </div>
                        </div>

                        {/* Edit Form */}
                        <form onSubmit={handleSubmitEdit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">제목</label>
                                <input
                                    type="text"
                                    className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none transition-colors text-sm sm:text-[15px] font-bold placeholder:font-normal placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
                                    placeholder="제목을 입력하세요"
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">내용</label>
                                <textarea
                                    className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 sm:px-5 sm:py-4 h-48 sm:h-72 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none transition-colors resize-none text-sm sm:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder="내용을 자유롭게 입력하세요"
                                    value={editData.content}
                                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end pt-2 border-t border-stone-100 dark:border-slate-700 gap-2 sm:gap-0">
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-5 py-2.5 border border-stone-200 dark:border-slate-600 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm transition-colors sm:mr-3 w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    <X size={16} aria-hidden="true" /> 취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingEdit || !editData.title.trim() || !editData.content.trim()}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-colors active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                                >
                                    {submittingEdit ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                            저장 중...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} aria-hidden="true" />
                                            저장
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl shadow-sm p-4 sm:p-6">
                <h3 className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 mb-4 sm:mb-5">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                        <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    댓글 <span className="text-indigo-600 dark:text-indigo-400">{post.comments.length}</span>
                </h3>

                {/* Comment List */}
                {post.comments.length > 0 ? (
                    <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        {post.comments.map((comment) => (
                            <li key={comment.id} className="bg-stone-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-stone-100 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">{comment.user.name}</span>
                                        <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400">
                                            {format(new Date(comment.createdAt), "MM.dd HH:mm")}
                                        </span>
                                    </div>
                                    {(() => {
                                        const canDelete = currentUserId === comment.user.id;
                                        console.log('Comment Delete Button:', { commentId: comment.id, currentUserId, commentUserId: comment.user.id, canDelete });
                                        return canDelete;
                                    })() && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                            aria-label="댓글 삭제"
                                        >
                                            <Trash2 size={18} aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">{comment.content}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-6 sm:py-8 text-slate-400 dark:text-slate-400 text-xs sm:text-sm mb-4">
                        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                    </div>
                )}

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 min-w-0 border border-stone-200 dark:border-slate-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 outline-none transition-colors text-sm font-medium placeholder:font-normal dark:text-slate-200 dark:placeholder:text-slate-500"
                        placeholder="댓글을 입력하세요..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!commentText.trim() || submittingComment}
                        className="bg-indigo-600 text-white px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl hover:bg-indigo-700 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-[0.97] flex items-center gap-1.5 shrink-0"
                        aria-label="댓글 등록"
                    >
                        {submittingComment ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                        <span className="hidden sm:inline">등록</span>
                    </button>
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

            <ConfirmDialog
                show={showConfirm}
                title="삭제 확인"
                description={confirmMessage}
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
