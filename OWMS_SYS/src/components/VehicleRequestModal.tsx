import { useState, useEffect } from "react";
import apiClient from "../api/client";
import { X, Car, Calendar, MapPin, FileText, AlertCircle } from "lucide-react";
import Toast from "./Toast";

interface Vehicle {
    id: number;
    modelName: string;
    licensePlate: string;
    color?: string;
    assignee?: string;
}

interface Dispatch {
    id: number;
    startDate: string;
    endDate: string;
    destination: string;
    purpose: string;
    user: {
        name: string;
    };
}

interface Props {
    onClose: () => void;
}

export default function VehicleRequestModal({ onClose }: Props) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [weeklyDispatches, setWeeklyDispatches] = useState<Dispatch[]>([]);
    const [loadingDispatches, setLoadingDispatches] = useState(false);

    const [startDateTime, setStartDateTime] = useState("");
    const [endDateTime, setEndDateTime] = useState("");
    const [destination, setDestination] = useState("");
    const [purpose, setPurpose] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // 로컬 시간 포맷 함수 (UTC 변환 없음)
    const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // 빠른 선택 함수
    const setQuickTime = (type: "today" | "tomorrow") => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (type === "today") {
            start.setHours(9, 0, 0, 0);
            end.setHours(18, 0, 0, 0);
        } else if (type === "tomorrow") {
            start.setDate(start.getDate() + 1);
            start.setHours(9, 0, 0, 0);
            end.setDate(end.getDate() + 1);
            end.setHours(18, 0, 0, 0);
        }

        setStartDateTime(formatDateTime(start));
        setEndDateTime(formatDateTime(end));
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (selectedVehicleId) {
            fetchWeeklyDispatches(selectedVehicleId);
        } else {
            setWeeklyDispatches([]);
        }
    }, [selectedVehicleId]);

    const fetchVehicles = async () => {
        try {
            const res = await apiClient.get("/vehicle");
            setVehicles(res.data);
        } catch (error) {
            console.error("차량 조회 실패:", error);
        }
    };

    const fetchWeeklyDispatches = async (vehicleId: number) => {
        setLoadingDispatches(true);
        try {
            // 금주의 시작(월요일)과 끝(일요일) 계산
            const today = new Date();
            const dayOfWeek = today.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(today);
            monday.setDate(today.getDate() + mondayOffset);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const startStr = monday.toISOString().split("T")[0];
            const endStr = sunday.toISOString().split("T")[0];

            const res = await apiClient.get(`/dispatch?vehicleId=${vehicleId}&startDate=${startStr}&endDate=${endStr}`);
            setWeeklyDispatches(res.data || []);
        } catch (error) {
            console.error("배차 조회 실패:", error);
            setWeeklyDispatches([]);
        } finally {
            setLoadingDispatches(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedVehicleId || !startDateTime || !endDateTime || !destination || !purpose) {
            setToast({ message: "모든 항목을 입력해주세요.", type: "error" });
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post("/dispatch", {
                vehicleId: selectedVehicleId,
                startDate: startDateTime,
                endDate: endDateTime,
                destination,
                purpose,
            });
            setToast({ message: "배차 신청이 완료되었습니다!", type: "success" });
            setTimeout(onClose, 1500);
        } catch (error) {
            console.error("배차 신청 실패:", error);
            setToast({ message: "배차 신청에 실패했습니다.", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Car className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">배차 신청</h2>
                            <p className="text-xs text-slate-500">차량을 선택하고 배차를 신청하세요</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    {/* 차량 선택 */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Car size={16} className="text-green-600" />
                            차량
                        </label>
                        <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar">
                            {vehicles.map((v) => (
                                <div
                                    key={v.id}
                                    onClick={() => setSelectedVehicleId(v.id)}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                        selectedVehicleId === v.id
                                            ? "border-green-500 bg-green-50 shadow-md"
                                            : "border-slate-200 bg-white hover:border-green-300 hover:shadow-sm"
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-sm text-slate-800">{v.modelName}</div>
                                                {v.color && (
                                                    <div className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: v.color.toLowerCase() === '흰색' || v.color.toLowerCase() === 'white' ? '#ffffff' : v.color.toLowerCase() === '검정' || v.color.toLowerCase() === 'black' ? '#000000' : v.color.toLowerCase() === '은색' || v.color.toLowerCase() === 'silver' ? '#c0c0c0' : v.color.toLowerCase() === '회색' || v.color.toLowerCase() === 'gray' ? '#808080' : '#3b82f6' }} />
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-600 font-medium">{v.licensePlate}</div>
                                            {v.assignee && (
                                                <div className="text-[10px] text-slate-500 mt-1.5">{v.assignee}</div>
                                            )}
                                        </div>
                                        {selectedVehicleId === v.id && (
                                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {vehicles.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-sm">등록된 차량이 없습니다.</div>
                        )}
                    </div>

                    {/* 금주 배차 예약 정보 */}
                    {selectedVehicle && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                                <AlertCircle size={14} className="text-blue-600" />
                                {selectedVehicle.modelName} - 금주 배차 현황
                            </h3>
                            {loadingDispatches ? (
                                <div className="text-center py-4 text-slate-500 text-xs">배차 정보 로딩 중...</div>
                            ) : weeklyDispatches.length > 0 ? (
                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {weeklyDispatches.map((dispatch) => (
                                        <div key={dispatch.id} className="bg-white rounded-lg p-2.5 shadow-sm">
                                            <div className="flex justify-between items-start text-xs">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-slate-700">{dispatch.user.name}</div>
                                                    <div className="text-slate-500 text-[10px] mt-0.5">
                                                        {new Date(dispatch.startDate).toLocaleDateString()} ~ {new Date(dispatch.endDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-slate-600 text-[10px] mt-1">
                                                        <span className="font-medium">목적지:</span> {dispatch.destination}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-slate-500 text-xs">이번 주 배차 예약이 없습니다.</div>
                            )}
                        </div>
                    )}

                    {/* 배차 신청 폼 */}
                    {selectedVehicle && (
                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                            <h3 className="font-bold text-sm text-slate-800 mb-3">배차 신청 정보</h3>

                            {/* 사용 기간 */}
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                                    <Calendar size={12} className="text-green-600" />
                                    사용 기간
                                </label>

                                {/* 빠른 선택 */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    <button type="button" onClick={() => setQuickTime("today")} className="px-2.5 py-1.5 text-[10px] bg-white border border-slate-300 rounded-lg hover:bg-green-50 hover:border-green-400 transition-colors font-medium text-slate-700 cursor-pointer">
                                        오늘 9-18시
                                    </button>
                                    <button type="button" onClick={() => setQuickTime("tomorrow")} className="px-2.5 py-1.5 text-[10px] bg-white border border-slate-300 rounded-lg hover:bg-green-50 hover:border-green-400 transition-colors font-medium text-slate-700 cursor-pointer">
                                        내일 9-18시
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-[10px] text-slate-600 mb-1">시작</label>
                                        <input
                                            type="datetime-local"
                                            value={startDateTime}
                                            onChange={(e) => setStartDateTime(e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white transition-shadow text-[11px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-600 mb-1">종료</label>
                                        <input
                                            type="datetime-local"
                                            value={endDateTime}
                                            onChange={(e) => setEndDateTime(e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white transition-shadow text-[11px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 목적지 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                    <MapPin size={12} className="text-green-600" />
                                    목적지
                                </label>
                                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="방문할 장소를 입력하세요" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white transition-shadow placeholder:text-slate-400 text-xs" />
                            </div>

                            {/* 사용 목적 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                    <FileText size={12} className="text-green-600" />
                                    사용 목적
                                </label>
                                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="차량 사용 목적을 작성해주세요" rows={3} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none bg-white transition-shadow placeholder:text-slate-400 text-xs" />
                            </div>

                            {/* 신청 버튼 */}
                            <button onClick={handleSubmit} disabled={submitting} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm">
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        신청 중...
                                    </>
                                ) : (
                                    <>
                                        <Car size={16} />
                                        배차 신청하기
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {!selectedVehicle && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            차량을 선택해주세요
                        </div>
                    )}
                </div>
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
