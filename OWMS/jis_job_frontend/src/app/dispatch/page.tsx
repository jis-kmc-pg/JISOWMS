"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";
import {
    ChevronLeft,
    ChevronRight,
    Car,
    Calendar,
    Clock,
    MapPin,
    Users,
    Plus
} from "lucide-react";
import { format, addDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";

interface Vehicle {
    id: number;
    modelName: string;
    licensePlate: string;
    color: string;
}

interface Dispatch {
    id: number;
    vehicleId: number;
    startDate: string;
    endDate: string;
    destination: string;
    purpose: string;
    user: { name: string; position: string };
}

const ROWS_START_HOUR = 8;
const ROWS_END_HOUR = 20;
const TOTAL_HOURS = ROWS_END_HOUR - ROWS_START_HOUR;

export default function DispatchPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [dispatches, setDispatches] = useState<Dispatch[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        startDate: "",
        startTime: "09:00",
        endDate: "",
        endTime: "18:00",
        destination: "",
        purpose: "",
        passengers: ""
    });

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const start = startOfDay(currentDate).toISOString();
            const end = endOfDay(currentDate).toISOString();

            const [vRes, dRes] = await Promise.all([
                api.get("/vehicle"),
                api.get(`/dispatch?start=${start}&end=${end}`)
            ]);

            setVehicles(vRes.data);
            setDispatches(dRes.data);
        } catch (err) {
            console.error("데이터 조회 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevDay = () => setCurrentDate(addDays(currentDate, -1));
    const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const openReserveModal = (vehicleId?: number) => {
        const todayStr = format(currentDate, "yyyy-MM-dd");
        setSelectedVehicleId(vehicleId || (vehicles.length > 0 ? vehicles[0].id : null));
        setFormData({
            startDate: todayStr,
            startTime: "09:00",
            endDate: todayStr,
            endTime: "10:00",
            destination: "",
            purpose: "",
            passengers: ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicleId) return alert("차량을 선택해주세요.");

        try {
            const start = new Date(`${formData.startDate}T${formData.startTime}`);
            const end = new Date(`${formData.endDate}T${formData.endTime}`);

            if (start >= end) return alert("종료 시간은 시작 시간보다 늦어야 합니다.");

            await api.post("/dispatch", {
                vehicleId: selectedVehicleId,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                destination: formData.destination,
                purpose: formData.purpose,
                passengers: formData.passengers
            });

            alert("배차 신청이 완료되었습니다.");
            setIsModalOpen(false);
            fetchData();
        } catch (err: unknown) {
            console.error("배차 신청 실패:", err);
            const message = err instanceof AxiosError ? err.response?.data?.message : '배차 신청에 실패했습니다.';
            alert(message || "배차 신청에 실패했습니다.");
        }
    };

    // 렌더링 헬퍼: 타임라인 바 위치 계산
    const getBarStyle = (startStr: string, endStr: string) => {
        const start = new Date(startStr);
        const end = new Date(endStr);

        // 현재 날짜 범위로 클리핑
        const viewStart = new Date(currentDate);
        viewStart.setHours(ROWS_START_HOUR, 0, 0, 0);

        const viewEnd = new Date(currentDate);
        viewEnd.setHours(ROWS_END_HOUR, 0, 0, 0);

        // 범위 밖이면 렌더링 안 함 (하지만 여기선 하루 단위 조회라 괜찮음)
        if (end < viewStart || start > viewEnd) return null;

        let s = start < viewStart ? viewStart : start;
        let e = end > viewEnd ? viewEnd : end;

        const startMinutes = (s.getHours() - ROWS_START_HOUR) * 60 + s.getMinutes();
        const durationMinutes = (e.getTime() - s.getTime()) / (1000 * 60);

        const left = (startMinutes / (TOTAL_HOURS * 60)) * 100;
        const width = (durationMinutes / (TOTAL_HOURS * 60)) * 100;

        return { left: `${left}%`, width: `${width}%` };
    };

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Car className="text-blue-600" />
                    차량 배차 현황
                </h1>
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border">
                    <button onClick={handlePrevDay} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronLeft />
                    </button>
                    <div className="flex items-center gap-2 font-bold text-lg min-w-[200px] justify-center">
                        <Calendar size={20} className="text-gray-500" />
                        {format(currentDate, "yyyy년 MM월 dd일 (cP)", { locale: ko })}
                    </div>
                    <button onClick={handleNextDay} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronRight />
                    </button>
                    <button onClick={handleToday} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 ml-2">
                        오늘
                    </button>
                </div>
                <button
                    onClick={() => openReserveModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                >
                    <Plus size={18} /> 배차 신청
                </button>
            </div>

            {/* Timeline Chart */}
            <div className="flex-1 bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
                {/* Time Header */}
                <div className="flex border-b bg-gray-50">
                    <div className="w-48 p-3 font-bold text-gray-500 border-r flex-shrink-0">차량 목록</div>
                    <div className="flex-1 relative h-10">
                        {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute top-0 bottom-0 border-l text-xs text-gray-400 pl-1 pt-1"
                                style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}
                            >
                                {ROWS_START_HOUR + i}:00
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">로딩 중...</div>
                    ) : vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="flex border-b hover:bg-gray-50 h-16 transition-colors group">
                            <div className="w-48 p-3 border-r flex-shrink-0 flex flex-col justify-center bg-gray-50/50 group-hover:bg-white transition-colors">
                                <div className="font-bold text-gray-800">{vehicle.licensePlate}</div>
                                <div className="text-xs text-gray-500">{vehicle.modelName}</div>
                            </div>
                            <div className="flex-1 relative cursor-pointer" onClick={() => openReserveModal(vehicle.id)}>
                                {/* Hour Guides */}
                                {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-0 bottom-0 border-l border-dashed border-gray-100"
                                        style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}
                                    />
                                ))}

                                {/* Dispatch Bars */}
                                {dispatches
                                    .filter(d => d.vehicleId === vehicle.id)
                                    .map(d => {
                                        const style = getBarStyle(d.startDate, d.endDate);
                                        if (!style) return null;
                                        return (
                                            <div
                                                key={d.id}
                                                className="absolute top-2 bottom-2 bg-blue-500/90 rounded border border-blue-600 shadow-sm text-white text-xs px-2 flex flex-col justify-center overflow-hidden hover:bg-blue-600 transition-colors z-10 cursor-default"
                                                style={style}
                                                onClick={(e) => { e.stopPropagation(); alert(`예약자: ${d.user.name}\n목적: ${d.purpose}`); }}
                                                title={`${d.user.name} (${d.destination})`}
                                            >
                                                <div className="font-bold truncate">{d.user.name}</div>
                                                <div className="truncate opacity-90">{d.destination}</div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">배차 신청</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">차량 선택</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 bg-white"
                                    value={selectedVehicleId || ""}
                                    onChange={(e) => setSelectedVehicleId(+e.target.value)}
                                    required
                                >
                                    <option value="">차량을 선택하세요</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.modelName} ({v.licensePlate})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">시작 일시</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="time"
                                        className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">종료 일시</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="time"
                                        className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">행선지</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg pl-10 pr-3 py-2"
                                        placeholder="예: 서울 본사, 부산 지사 등"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">용무</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="예: 클라이언트 미팅, 장비 운송"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">동승자 (선택)</label>
                                <div className="relative">
                                    <Users size={16} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg pl-10 pr-3 py-2"
                                        placeholder="예: 홍길동 대리, 김철수 차장"
                                        value={formData.passengers}
                                        onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 text-gray-600 font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm active:scale-[0.98] transition-transform"
                                >
                                    신청하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
