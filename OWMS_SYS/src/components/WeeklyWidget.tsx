import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useUserStore } from "../store/userStore";
import {
    CheckCircle,
    XCircle,
    MinusCircle,
    AlertTriangle,
    Loader2,
} from "lucide-react";

interface WeeklyStatusData {
    date: string;
    dayOfWeek: string;
    users: {
        id: number;
        name: string;
        status: "DONE" | "MISSING" | "HOLIDAY" | "LEAVE";
    }[];
}

/** 날짜를 n일만큼 이동 */
function offsetDate(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

/** 해당 날짜가 속한 주의 월요일을 반환 */
function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
}

export default function WeeklyWidget() {
    const user = useUserStore((state) => state.user);
    const [currentWeek, setCurrentWeek] = useState<WeeklyStatusData[]>([]);
    const [nextWeek, setNextWeek] = useState<WeeklyStatusData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const today = new Date();
    const isFriday = today.getDay() === 5;

    useEffect(() => {
        fetchBothWeeks();
    }, []);

    const fetchBothWeeks = async () => {
        try {
            setLoading(true);
            const todayStr = today.toISOString().split("T")[0];

            // 차주 월요일 계산
            const monday = getMonday(today);
            const nextMonday = offsetDate(monday, 7);
            const nextMondayStr = nextMonday.toISOString().split("T")[0];

            // 금주 + 차주 병렬 호출
            const [currentRes, nextRes] = await Promise.all([
                apiClient.get(`/work-status/weekly?date=${todayStr}`),
                apiClient.get(`/work-status/weekly?date=${nextMondayStr}`),
            ]);

            setCurrentWeek(currentRes.data);
            setNextWeek(nextRes.data);
        } catch {
            setError("상태를 불러올 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    /** 금주/차주 데이터에서 내 상태만 추출 */
    const extractMyStatus = (weekData: WeeklyStatusData[]) => {
        return weekData.map((day) => {
            const myStatus = day.users?.find((u) => u.id === user?.id);
            return {
                ...day,
                myStatus: myStatus?.status || "UNKNOWN",
            };
        });
    };

    if (loading)
        return (
            <div className="p-2 flex justify-center">
                <Loader2 className="animate-spin" size={16} />
            </div>
        );
    if (error) return <div className="text-red-500 text-xs">{error}</div>;

    const myCurrentWeek = extractMyStatus(currentWeek);
    const myNextWeek = extractMyStatus(nextWeek);

    // 미작성 건수
    const currentMissing = myCurrentWeek.filter((d) => d.myStatus === "MISSING").length;
    const nextMissing = myNextWeek.filter((d) => d.myStatus === "MISSING").length;

    return (
        <div className="w-full space-y-3">
            {/* ── 금주 ── */}
            <WeekSection
                label="금주"
                days={myCurrentWeek}
                missingCount={currentMissing}
                showAlert={isFriday}
            />
            {/* ── 차주 ── */}
            <WeekSection
                label="차주"
                days={myNextWeek}
                missingCount={nextMissing}
                showAlert={false}
            />
        </div>
    );
}

/** 주간 상태 섹션 */
function WeekSection({
    label,
    days,
    missingCount,
    showAlert,
}: {
    label: string;
    days: { date: string; dayOfWeek: string; myStatus: string }[];
    missingCount: number;
    showAlert: boolean;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-700">{label}</span>
                {missingCount > 0 && (
                    <span
                        className={`text-xs font-bold flex items-center gap-1 ${showAlert ? "text-red-600 animate-pulse" : "text-orange-500"
                            }`}
                    >
                        <AlertTriangle size={12} />
                        {missingCount}건 미작성
                    </span>
                )}
                {missingCount === 0 && days.length > 0 && (
                    <span className="text-xs text-green-600 font-medium">✅ 작성 완료</span>
                )}
            </div>
            <div className="flex justify-between gap-1">
                {days.map((day) => (
                    <div key={day.date} className="flex flex-col items-center flex-1">
                        <span className="text-[10px] text-slate-500">{day.dayOfWeek}</span>
                        <StatusIcon status={day.myStatus} />
                    </div>
                ))}
                {days.length === 0 && (
                    <span className="text-xs text-slate-400">데이터 없음</span>
                )}
            </div>
        </div>
    );
}

/** 상태 아이콘 */
function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case "DONE":
            return <CheckCircle className="text-green-500" size={16} />;
        case "MISSING":
            return <XCircle className="text-red-500" size={16} />;
        case "HOLIDAY":
        case "LEAVE":
            return <MinusCircle className="text-gray-400" size={16} />;
        default:
            return <MinusCircle className="text-slate-300" size={16} />;
    }
}
