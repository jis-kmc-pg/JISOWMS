import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Users } from "lucide-react";

export default function MeetingRoomStatus() {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const res = await apiClient.get(`/meeting-room/reservation?start=${today}&end=${today}`);
            setCount(res.data.length);
        } catch (error) {
            console.error("회의실 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-xs text-slate-500">로딩 중...</div>;

    return (
        <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
                <Users size={24} className="text-purple-600" />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-800">{count}<span className="text-sm text-slate-500">건</span></div>
                <div className="text-xs text-slate-500">오늘 예약</div>
            </div>
        </div>
    );
}
