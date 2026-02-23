import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Calendar } from "lucide-react";

export default function VacationInfo() {
    const [summary, setSummary] = useState<any>(null);
    const [pending, setPending] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        try {
            const [summaryRes, vacationsRes] = await Promise.all([
                apiClient.get("/vacations/summary"),
                apiClient.get("/vacations"),
            ]);
            setSummary(summaryRes.data);
            const pendingCount = vacationsRes.data.filter((v: any) => v.status === "PENDING").length;
            setPending(pendingCount);
        } catch (error) {
            console.error("연차 정보 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-xs text-slate-500">로딩 중...</div>;

    const total = summary?.total || 0;
    const used = summary?.used || 0;
    const remaining = summary?.remaining || 0;
    const usagePercent = total > 0 ? (used / total) * 100 : 0;

    return (
        <div className="space-y-2.5">
            {/* 총 연차 카드 */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-2.5 border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-600 font-medium">총 연차</span>
                    <span className="text-xl font-bold text-slate-800">{total}<span className="text-xs text-slate-500 ml-0.5">일</span></span>
                </div>

                {/* 사용률 프로그레스 바 */}
                <div className="space-y-1.5">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-600">사용 <span className="font-bold text-blue-600">{used}일</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-slate-600">잔여 <span className="font-bold text-green-600">{remaining}일</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 신청 대기 배지 */}
            {pending > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-2 border border-orange-200">
                    <div className="flex items-center justify-center gap-1.5 text-orange-700">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold">신청 대기 {pending}건</span>
                    </div>
                </div>
            )}
        </div>
    );
}
