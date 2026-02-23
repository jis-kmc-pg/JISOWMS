import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useUserStore } from "../store/userStore";
import { AlertTriangle, CheckCircle2, Calendar } from "lucide-react";

export default function WeeklyStatusSimple() {
    const user = useUserStore((state) => state.user);
    const [currentMissing, setCurrentMissing] = useState(0);
    const [nextMissing, setNextMissing] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const today = new Date();
            const monday = new Date(today);
            monday.setDate(today.getDate() - today.getDay() + 1);
            const nextMonday = new Date(monday);
            nextMonday.setDate(monday.getDate() + 7);

            const [currentRes, nextRes] = await Promise.all([
                apiClient.get(`/work-status/weekly?date=${today.toISOString().split("T")[0]}`),
                apiClient.get(`/work-status/weekly?date=${nextMonday.toISOString().split("T")[0]}`),
            ]);

            const countMissing = (data: any[]) => {
                let count = 0;
                data.forEach((day: any) => {
                    const myStatus = day.users?.find((u: any) => u.id === user?.id);
                    if (myStatus?.status === "MISSING") count++;
                });
                return count;
            };

            setCurrentMissing(countMissing(currentRes.data));
            setNextMissing(countMissing(nextRes.data));
        } catch (error) {
            console.error("작성 현황 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-xs text-slate-500">로딩 중...</div>;

    return (
        <div className="grid grid-cols-2 gap-2.5">
            {/* 금주 카드 */}
            <div className={`rounded-lg p-2.5 border-2 transition-all ${
                currentMissing > 0
                    ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300"
                    : "bg-gradient-to-br from-green-50 to-green-100 border-green-300"
            }`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Calendar size={12} className={currentMissing > 0 ? "text-red-600" : "text-green-600"} />
                    <span className="text-[10px] font-bold text-slate-700">금주</span>
                </div>

                {currentMissing > 0 ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <AlertTriangle size={16} className="text-red-600" />
                            <span className="text-xs font-bold text-red-700">미작성</span>
                        </div>
                        <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                            <span className="text-[10px] font-bold">{currentMissing}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span className="text-xs font-bold text-green-700">완료</span>
                    </div>
                )}
            </div>

            {/* 차주 카드 */}
            <div className={`rounded-lg p-2.5 border-2 transition-all ${
                nextMissing > 0
                    ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300"
                    : "bg-gradient-to-br from-green-50 to-green-100 border-green-300"
            }`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Calendar size={12} className={nextMissing > 0 ? "text-orange-600" : "text-green-600"} />
                    <span className="text-[10px] font-bold text-slate-700">차주</span>
                </div>

                {nextMissing > 0 ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <AlertTriangle size={16} className="text-orange-600" />
                            <span className="text-xs font-bold text-orange-700">미작성</span>
                        </div>
                        <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                            <span className="text-[10px] font-bold">{nextMissing}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span className="text-xs font-bold text-green-700">완료</span>
                    </div>
                )}
            </div>
        </div>
    );
}
