"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    User,
    Clock,
    Eye,
    MessageSquare,
    Trash2,
    CornerDownRight,
    ArrowLeft
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
    // 현재 로그인한 사용자 ID (실제로는 Context나 API에서 가져와야 함)
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        fetchPost();
        fetchCurrentUser();
    }, [postId]);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/auth/profile');
            setCurrentUserId(res.data.id);
        } catch (e) {
            console.error("사용자 정보 로드 실패", e);
        }
    };

    const fetchPost = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/posts/${postId}`);
            setPost(res.data);
        } catch (err) {
            console.error("게시글 조회 실패:", err);
            alert("게시글을 불러올 수 없습니다.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async () => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/posts/${postId}`);
            alert("삭제되었습니다.");
            router.push(`/board/${boardName}`);
        } catch (err) {
            console.error("삭제 실패:", err);
            alert("삭제 실패 (권한이 없거나 오류 발생)");
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            await api.post(`/posts/${postId}/comments`, { content: commentText });
            setCommentText("");
            fetchPost(); // 댓글 갱신을 위해 재조회
        } catch (err) {
            console.error("댓글 작성 실패:", err);
            alert("댓글 작성에 실패했습니다.");
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/posts/comments/${commentId}`);
            fetchPost();
        } catch (err) {
            console.error("댓글 삭제 실패:", err);
            alert("삭제 실패");
        }
    };

    if (loading) return <div className="p-10 text-center">로딩 중...</div>;
    if (!post) return <div className="p-10 text-center">게시글이 없습니다.</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Link href={`/board/${boardName}`} className="flex items-center text-gray-500 mb-6 hover:text-blue-600 w-fit">
                <ArrowLeft size={16} className="mr-1" /> 목록으로 돌아가기
            </Link>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <User size={14} />
                            <span className="text-gray-900 font-medium">{post.user.name}</span>
                            <span className="text-xs">({post.user.position})</span>
                        </div>
                        <div className="w-px h-3 bg-gray-300"></div>
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {format(new Date(post.createdAt), "yyyy.MM.dd HH:mm")}
                        </div>
                        <div className="w-px h-3 bg-gray-300"></div>
                        <div className="flex items-center gap-1">
                            <Eye size={14} />
                            {post.viewCount}
                        </div>
                    </div>
                </div>

                <div className="p-8 min-h-[300px] prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </div>

                {currentUserId === post.user.id && (
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                        <button
                            onClick={handleDeletePost}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded hover:bg-red-50 transition"
                        >
                            <Trash2 size={16} /> 게시글 삭제
                        </button>
                    </div>
                )}
            </div>

            {/* 댓글 영역 */}
            <div className="bg-gray-50 rounded-lg border p-6">
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                    <MessageSquare size={18} className="text-blue-600" />
                    댓글 <span className="text-blue-600">{post.comments.length}</span>
                </h3>

                <ul className="space-y-4 mb-6">
                    {post.comments.map((comment) => (
                        <li key={comment.id} className="bg-white p-4 rounded-lg border shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-gray-800">{comment.user.name}</span>
                                    <span className="text-xs text-gray-400">
                                        {format(new Date(comment.createdAt), "MM.dd HH:mm")}
                                    </span>
                                </div>
                                {currentUserId === comment.user.id && (
                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                        </li>
                    ))}
                </ul>

                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="댓글을 입력하세요..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                        disabled={!commentText.trim()}
                    >
                        등록
                    </button>
                </form>
            </div>
        </div>
    );
}
