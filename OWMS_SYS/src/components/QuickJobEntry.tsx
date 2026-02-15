import { useState } from "react";
import { AxiosError } from "axios";
import apiClient from "../api/client";
import { PlusCircle, Loader2, Send } from "lucide-react";

export default function QuickJobEntry() {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        setSuccess(false);
        setError("");
        try {
            const today = new Date();
            const dateStr = today.toISOString().split("T")[0];

            // 시스템 메모로 저장
            await apiClient.post("/reports/system-memos", {
                content: content,
                date: dateStr,
            });

            // 입력 초기화 및 성공 메시지 표시
            setContent("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (err: unknown) {
            const msg = err instanceof AxiosError
                ? err.response?.data?.message || "업무 등록에 실패했습니다."
                : "업무 등록에 실패했습니다.";
            setError(msg);
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-3 rounded shadow">
            <h2 className="font-semibold mb-2 flex items-center text-sm">
                <PlusCircle size={14} className="mr-1" />
                빠른 업무 등록
            </h2>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="할 일을 입력하고 엔터를 누르세요..."
                    className="flex-1 p-2 border rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                </button>
            </form>
            {success && <p className="text-green-600 text-xs mt-1">✅ 업무가 등록되었습니다!</p>}
            {error && <p className="text-red-500 text-xs mt-1">❌ {error}</p>}
        </div>
    );
}

