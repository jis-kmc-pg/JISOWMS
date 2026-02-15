"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PostWritePage() {
    const params = useParams();
    const boardName = params.boardName as string;
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        content: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) return;

        try {
            setSubmitting(true);
            await api.post(`/board/${boardName}/posts`, formData);
            alert("등록되었습니다.");
            router.push(`/board/${boardName}`);
        } catch (err) {
            console.error("등록 실패:", err);
            alert("등록에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center text-gray-500 mb-6 hover:text-blue-600 w-fit">
                <ArrowLeft size={16} className="mr-1" /> 취소하고 돌아가기
            </button>

            <div className="bg-white border rounded-lg shadow-sm p-6">
                <h1 className="text-xl font-bold mb-6 pb-4 border-b">게시글 작성</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">제목</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-4 py-2.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                            placeholder="제목을 입력하세요"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">내용</label>
                        <textarea
                            className="w-full border rounded-lg px-4 py-3 h-64 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                            placeholder="내용을 자유롭게 입력하세요"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                            disabled={submitting}
                        >
                            {submitting ? "등록 중..." : "작성 완료"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
