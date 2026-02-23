import { useState, useEffect } from "react";
import apiClient from "../api/client";
import { X, Users, Calendar, FileText, AlertCircle } from "lucide-react";
import Toast from "./Toast";

interface MeetingRoom {
    id: number;
    name: string;
    capacity: number;
    location?: string;
    facilities?: string;
}

interface Reservation {
    id: number;
    startDate: string;
    endDate: string;
    purpose: string;
    user: {
        name: string;
    };
}

interface Props {
    onClose: () => void;
}

export default function MeetingRoomRequestModal({ onClose }: Props) {
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [weeklyReservations, setWeeklyReservations] = useState<Reservation[]>([]);
    const [loadingReservations, setLoadingReservations] = useState(false);

    const [startDateTime, setStartDateTime] = useState("");
    const [endDateTime, setEndDateTime] = useState("");
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
    const setQuickTime = (type: "1h" | "2h") => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        // 시작 시간은 현재 시간 기준 (분은 00으로)
        start.setMinutes(0, 0, 0);

        if (type === "1h") {
            end.setHours(start.getHours() + 1, 0, 0, 0);
        } else if (type === "2h") {
            end.setHours(start.getHours() + 2, 0, 0, 0);
        }

        setStartDateTime(formatDateTime(start));
        setEndDateTime(formatDateTime(end));
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        if (selectedRoomId) {
            fetchWeeklyReservations(selectedRoomId);
        } else {
            setWeeklyReservations([]);
        }
    }, [selectedRoomId]);

    const fetchRooms = async () => {
        try {
            const res = await apiClient.get("/meeting-room");
            setRooms(res.data);
        } catch (error) {
            console.error("회의실 조회 실패:", error);
        }
    };

    const fetchWeeklyReservations = async (roomId: number) => {
        setLoadingReservations(true);
        try {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(today);
            monday.setDate(today.getDate() + mondayOffset);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const startStr = monday.toISOString().split("T")[0];
            const endStr = sunday.toISOString().split("T")[0];

            const res = await apiClient.get(`/meeting-room/reservation?start=${startStr}&end=${endStr}`);
            // roomId로 필터링
            const filtered = (res.data || []).filter((r: any) => r.roomId === roomId);
            setWeeklyReservations(filtered);
        } catch (error) {
            console.error("예약 조회 실패:", error);
            setWeeklyReservations([]);
        } finally {
            setLoadingReservations(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedRoomId || !startDateTime || !endDateTime || !purpose) {
            setToast({ message: "모든 항목을 입력해주세요.", type: "error" });
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post("/meeting-room/reservation", {
                roomId: selectedRoomId,
                startDate: startDateTime,
                endDate: endDateTime,
                purpose,
            });
            setToast({ message: "회의실 예약이 완료되었습니다!", type: "success" });
            setTimeout(onClose, 1500);
        } catch (error) {
            console.error("예약 실패:", error);
            setToast({ message: "회의실 예약에 실패했습니다.", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedRoom = rooms.find(r => r.id === selectedRoomId);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Users className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">회의실 예약</h2>
                            <p className="text-xs text-slate-500">회의실을 선택하고 예약하세요</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    {/* 회의실 선택 */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Users size={16} className="text-purple-600" />
                            예약 가능한 회의실
                        </label>
                        <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                        selectedRoomId === room.id
                                            ? "border-purple-500 bg-purple-50 shadow-md"
                                            : "border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm"
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-slate-800">{room.name}</div>
                                            <div className="text-xs text-slate-600 font-medium">수용: {room.capacity}명</div>
                                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                                                {room.location && <span>위치: {room.location}</span>}
                                            </div>
                                        </div>
                                        {selectedRoomId === room.id && (
                                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {rooms.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-sm">등록된 회의실이 없습니다.</div>
                        )}
                    </div>

                    {/* 금주 예약 정보 */}
                    {selectedRoom && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                                <AlertCircle size={14} className="text-purple-600" />
                                {selectedRoom.name} - 금주 예약 현황
                            </h3>
                            {loadingReservations ? (
                                <div className="text-center py-4 text-slate-500 text-xs">예약 정보 로딩 중...</div>
                            ) : weeklyReservations.length > 0 ? (
                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {weeklyReservations.map((reservation) => (
                                        <div key={reservation.id} className="bg-white rounded-lg p-2.5 shadow-sm">
                                            <div className="flex justify-between items-start text-xs">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-slate-700">{reservation.user.name}</div>
                                                    <div className="text-slate-500 text-[10px] mt-0.5">
                                                        {new Date(reservation.startDate).toLocaleDateString()} {new Date(reservation.startDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ {new Date(reservation.endDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="text-slate-600 text-[10px] mt-1">
                                                        <span className="font-medium">목적:</span> {reservation.purpose}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-slate-500 text-xs">이번 주 예약이 없습니다.</div>
                            )}
                        </div>
                    )}

                    {/* 예약 신청 폼 */}
                    {selectedRoom && (
                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                            <h3 className="font-bold text-sm text-slate-800 mb-3">예약 정보</h3>

                            {/* 사용 시간 */}
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                                    <Calendar size={12} className="text-purple-600" />
                                    사용 시간
                                </label>

                                {/* 빠른 선택 */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    <button type="button" onClick={() => setQuickTime("1h")} className="px-2.5 py-1.5 text-[10px] bg-white border border-slate-300 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-colors font-medium text-slate-700 cursor-pointer">
                                        1시간
                                    </button>
                                    <button type="button" onClick={() => setQuickTime("2h")} className="px-2.5 py-1.5 text-[10px] bg-white border border-slate-300 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-colors font-medium text-slate-700 cursor-pointer">
                                        2시간
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-[10px] text-slate-600 mb-1">시작</label>
                                        <input
                                            type="datetime-local"
                                            value={startDateTime}
                                            onChange={(e) => setStartDateTime(e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white transition-shadow text-[11px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-600 mb-1">종료</label>
                                        <input
                                            type="datetime-local"
                                            value={endDateTime}
                                            onChange={(e) => setEndDateTime(e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white transition-shadow text-[11px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 사용 목적 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                    <FileText size={12} className="text-purple-600" />
                                    사용 목적
                                </label>
                                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="회의 목적을 작성해주세요" rows={3} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-white transition-shadow placeholder:text-slate-400 text-xs" />
                            </div>

                            {/* 신청 버튼 */}
                            <button onClick={handleSubmit} disabled={submitting} className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm">
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        예약 중...
                                    </>
                                ) : (
                                    <>
                                        <Users size={16} />
                                        회의실 예약하기
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {!selectedRoom && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            회의실을 선택해주세요
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
