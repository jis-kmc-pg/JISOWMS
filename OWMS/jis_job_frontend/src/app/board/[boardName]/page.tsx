"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Search,
    PenSquare,
    MessageSquare,
    Eye,
    User,
    Clock
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useParams } from "next/navigation";
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
    const router = useRouter();

    const [posts, setPosts] = useState<Post[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, last_page: 1 });
    const [loading, setLoading] = useState(true);
    const [boardTitle, setBoardTitle] = useState("");

    // 게시판 이름 매핑 (또는 DB에서 가져오기)
    const boardMap: Record<string, string> = {
        notice: "공지사항",
        free: "자유게시판",
        qna: "질의응답",
        issue: "이슈게시판"
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
        } catch (err) {
            console.error("게시글 조회 실패:", err);
            // 게시판이 없을 수도 있음
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{boardTitle}</h1>
                <Link
                    href={`/board/${boardName}/write`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <PenSquare size={16} /> 글쓰기
                </Link>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b text-sm text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3 text-left w-16">No</th>
                            <th className="px-6 py-3 text-left">제목</th>
                            <th className="px-6 py-3 text-left w-32">작성자</th>
                            <th className="px-6 py-3 text-center w-32">작성일</th>
                            <th className="px-6 py-3 text-center w-20">조회</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-500">로딩 중...</td></tr>
                        ) : posts.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-500">게시글이 없습니다.</td></tr>
                        ) : (
                            posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500 font-medium">{post.id}</td>
                                    <td className="px-6 py-4">
                                        <Link href={`/board/${boardName}/${post.id}`} className="block group">
                                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {post.title}
                                            </span>
                                            {post._count.comments > 0 && (
                                                <span className="ml-2 text-xs text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                                                    {post._count.comments}
                                                </span>
                                            )}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User size={14} className="text-gray-400" />
                                            {post.user.name}
                                            <span className="text-xs text-gray-400">{post.user.position}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                                        {format(new Date(post.createdAt), "yyyy.MM.dd")}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                                        {post.viewCount}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6 gap-2">
                <button
                    disabled={meta.page === 1}
                    onClick={() => fetchPosts(meta.page - 1)}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    이전
                </button>
                <span className="px-3 py-1 text-gray-600">
                    {meta.page} / {meta.last_page}
                </span>
                <button
                    disabled={meta.page === meta.last_page}
                    onClick={() => fetchPosts(meta.page + 1)}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    다음
                </button>
            </div>
        </div>
    );
}
