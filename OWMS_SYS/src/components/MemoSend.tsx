import { useState } from "react";
import apiClient from "../api/client";
import { Send } from "lucide-react";
import Toast from "./Toast";

export default function MemoSend() {
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const handleSend = async () => {
        if (!content.trim()) return;
        setSending(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            await apiClient.post("/reports/system-memos", { content, date: today });
            setContent("");
            setToast({ message: "메모가 전송되었습니다!", type: "success" });
        } catch (error) {
            console.error("메모 전송 실패:", error);
            setToast({ message: "메모 전송에 실패했습니다.", type: "error" });
        } finally {
            setSending(false);
        }
    };

    // 자동으로 높이 조절
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    return (
        <>
            <div className="flex gap-2 items-start">
                <textarea
                    value={content}
                    onChange={handleInput}
                    placeholder="메모 입력... (Enter: 줄바꿈)"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none min-h-[36px] max-h-[200px] overflow-y-auto"
                    disabled={sending}
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !content.trim()}
                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap text-[10px] font-semibold"
                >
                    <Send size={12} />
                    전송
                </button>
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}
