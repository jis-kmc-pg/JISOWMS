import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import apiClient from "../api/client";
import { Clock, Loader2, AlertCircle } from "lucide-react";

interface MemoItem {
    id: number;
    content: string;
    date: string;
    createdAt: string;
    user?: { name: string; position: string };
}

/** 날짜를 YYYY-MM-DD 형식으로 변환 */
function toDateStr(d: Date): string {
    return d.toISOString().split("T")[0];
}

export default function TaskHistory() {
    const [memos, setMemos] = useState<MemoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchHistory();
    }, []);

    /** 최근 7일간의 system-memos를 조회 */
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const today = new Date();
            const dates: string[] = [];

            // 최근 7일 날짜 생성
            for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                dates.push(toDateStr(d));
            }

            // 날짜별 병렬 조회
            const responses = await Promise.allSettled(
                dates.map((date) =>
                    apiClient.get(`/reports/system-memos?date=${date}`)
                )
            );

            // 성공한 응답의 데이터를 합치기
            const allMemos: MemoItem[] = [];
            responses.forEach((res) => {
                if (res.status === "fulfilled" && Array.isArray(res.value.data)) {
                    allMemos.push(...res.value.data);
                }
            });

            // createdAt 기준 내림차순 정렬 후 최대 20건
            allMemos.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setMemos(allMemos.slice(0, 20));
        } catch (err: unknown) {
            const msg = err instanceof AxiosError
                ? err.response?.data?.message || "업무 이력을 불러올 수 없습니다."
                : "업무 이력을 불러올 수 없습니다.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <div className="p-2 flex justify-center">
                <Loader2 className="animate-spin text-slate-400" size={16} />
            </div>
        );

    if (error)
        return (
            <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertCircle size={12} />
                {error}
            </div>
        );

    if (memos.length === 0) {
        return (
            <div className="text-xs text-slate-400 text-center py-2">
                최근 7일간 등록된 업무 이력이 없습니다.
            </div>
        );
    }

    return (
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {memos.map((memo) => (
                <div
                    key={memo.id}
                    className="flex gap-2 text-xs border-l-2 border-blue-400 pl-2 py-1"
                >
                    {/* 날짜 */}
                    <div className="flex items-center gap-1 text-slate-400 shrink-0 min-w-[48px]">
                        <Clock size={10} />
                        <span>{formatDate(memo.date || memo.createdAt)}</span>
                    </div>
                    {/* 내용 */}
                    <span className="text-slate-700 break-words">{memo.content}</span>
                </div>
            ))}
        </div>
    );
}

/** 날짜를 MM/DD로 포맷 */
function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${month}/${day}`;
    } catch {
        return dateStr;
    }
}
