import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Car } from "lucide-react";

export default function VehicleStatus() {
    const [available, setAvailable] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            // 오늘 배차 신청 조회
            const today = new Date().toISOString().split("T")[0];
            const [vehiclesRes, dispatchRes] = await Promise.all([
                apiClient.get("/vehicle"),
                apiClient.get(`/dispatch?start=${today}&end=${today}`),
            ]);

            const totalVehicles = vehiclesRes.data.length;
            const usedVehicles = dispatchRes.data.length;
            setTotal(totalVehicles);
            setAvailable(totalVehicles - usedVehicles);
        } catch (error) {
            console.error("배차 현황 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-xs text-slate-500">로딩 중...</div>;

    return (
        <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
                <Car size={24} className="text-green-600" />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-800">{available}<span className="text-sm text-slate-500">/{total}</span></div>
            </div>
        </div>
    );
}
