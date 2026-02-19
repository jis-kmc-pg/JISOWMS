"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";
import {
    ChevronLeft,
    ChevronRight,
    DoorOpen,
    Calendar,
    Users,
    Plus,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Clock,
    MapPin,
    CircleDot
} from "lucide-react";
import {
    format, startOfDay, endOfDay, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
    isSameMonth, addMonths, subMonths, isToday as isDateToday
} from "date-fns";
import { ko } from "date-fns/locale";

interface MeetingRoom {
    id: number;
    name: string;
    capacity: number;
    location?: string;
    description?: string;
}

interface Reservation {
    id: number;
    roomId: number;
    startDate: string;
    endDate: string;
    title: string;
    attendees?: string;
    status?: string;
    user: { id: number; name: string; position: string };
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
    APPROVED: { label: "확정", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    CANCELLED: { label: "취소", bg: "bg-stone-50", text: "text-stone-400", border: "border-stone-200" },
};

export default function MeetingRoomReservation() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        startDate: "",
        startTime: "09:00",
        endDate: "",
        endTime: "10:00",
        title: "",
        attendees: ""
    });

    // Toast
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    // Reservation detail
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

    const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const toast = (message: string, type: "success" | "error" = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
    };

    useEffect(() => {
        return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const start = startOfMonth(currentMonth).toISOString();
            const end = endOfMonth(currentMonth).toISOString();

            const [rRes, rvRes] = await Promise.all([
                api.get("/meeting-room"),
                api.get(`/meeting-room/reservation?start=${start}&end=${end}`)
            ]);

            setRooms(rRes.data);
            setReservations(rvRes.data);
        } catch {
            // fetchData error
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (selectedReservation) setSelectedReservation(null);
                else if (isModalOpen) setIsModalOpen(false);
            }
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [selectedReservation, isModalOpen]);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handleThisMonth = () => {
        const now = new Date();
        setCurrentMonth(now);
        setSelectedDay(now);
    };
    const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

    // 월간 캘린더 날짜 배열 생성
    const calendarDays = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    });

    // 특정 회의실의 특정 날짜 예약 필터
    const getRoomDayReservations = (roomId: number, day: Date) =>
        reservations.filter(r =>
            r.roomId === roomId &&
            r.status !== "CANCELLED" &&
            new Date(r.startDate) < endOfDay(day) &&
            new Date(r.endDate) > startOfDay(day)
        );

    // 특정 회의실이 예약 있는 날 체크
    const hasReservationOnDay = (roomId: number, day: Date) =>
        getRoomDayReservations(roomId, day).length > 0;

    const openReserveModal = (roomId?: number) => {
        const todayStr = format(selectedDay, "yyyy-MM-dd");
        setSelectedRoomId(roomId || (rooms.length > 0 ? rooms[0].id : null));
        setFormData({
            startDate: todayStr,
            startTime: "09:00",
            endDate: todayStr,
            endTime: "10:00",
            title: "",
            attendees: ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoomId) {
            toast("회의실을 선택해주세요.", "error");
            return;
        }

        const start = new Date(`${formData.startDate}T${formData.startTime}`);
        const end = new Date(`${formData.endDate}T${formData.endTime}`);

        if (start >= end) {
            toast("종료 시간은 시작 시간보다 늦어야 합니다.", "error");
            return;
        }

        try {
            setSubmitting(true);
            await api.post("/meeting-room/reservation", {
                roomId: selectedRoomId,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                title: formData.title,
                attendees: formData.attendees
            });

            toast("회의실 예약이 완료되었습니다.");
            setIsModalOpen(false);
            fetchData();
        } catch (err: unknown) {
            const message = err instanceof AxiosError ? err.response?.data?.message : null;
            toast(message || "예약에 실패했습니다.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelReservation = async (reservationId: number) => {
        try {
            await api.patch(`/meeting-room/reservation/${reservationId}/cancel`);
            toast("예약이 취소되었습니다.");
            setSelectedReservation(null);
            fetchData();
        } catch (err: unknown) {
            const message = err instanceof AxiosError ? err.response?.data?.message : null;
            toast(message || "예약 취소에 실패했습니다.", "error");
        }
    };

    const getRoomReservations = (roomId: number) =>
        getRoomDayReservations(roomId, selectedDay);

    const getStatusStyle = (status?: string) =>
        STATUS_MAP[status || "APPROVED"] || STATUS_MAP.APPROVED;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="bg-violet-50 dark:bg-violet-900/30 p-1.5 rounded-lg border border-violet-100 dark:border-violet-800/30">
                            <DoorOpen size={18} className="text-violet-600" aria-hidden="true" />
                        </div>
                        회의실 예약
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 ml-9 hidden sm:block">회의실별 월간 예약 현황을 확인하고 예약할 수 있습니다</p>
                </div>
                <button
                    onClick={() => openReserveModal()}
                    className="bg-violet-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-violet-700 flex items-center justify-center gap-2 shadow-lg shadow-violet-200 font-bold text-sm transition-colors active:scale-[0.97] shrink-0 w-full sm:w-auto"
                >
                    <Plus size={18} aria-hidden="true" /> 예약하기
                </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="flex items-center bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl px-1 sm:px-2 py-1 sm:py-1.5 shadow-sm w-full sm:w-auto justify-between sm:justify-center">
                    <button onClick={handlePrevMonth} aria-label="이전 달" className="p-1.5 sm:p-2 hover:bg-stone-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-violet-600">
                        <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <div className="flex items-center gap-1.5 sm:gap-2.5 font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 px-1 sm:px-3 min-w-0">
                        <Calendar size={16} className="text-violet-500 shrink-0 sm:hidden" aria-hidden="true" />
                        <Calendar size={18} className="text-violet-500 shrink-0 hidden sm:block" aria-hidden="true" />
                        <span className="truncate">
                            <span className="sm:hidden">{format(currentMonth, "yyyy.MM", { locale: ko })}</span>
                            <span className="hidden sm:inline">{format(currentMonth, "yyyy년 MM월", { locale: ko })}</span>
                        </span>
                    </div>
                    <button onClick={handleNextMonth} aria-label="다음 달" className="p-1.5 sm:p-2 hover:bg-stone-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-violet-600">
                        <ChevronRight size={20} aria-hidden="true" />
                    </button>
                    <div className="w-px h-6 bg-stone-200 dark:bg-slate-600 mx-0.5 sm:mx-1" />
                    <button
                        onClick={handleThisMonth}
                        disabled={isCurrentMonth}
                        className={`text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-colors border shrink-0 flex items-center gap-1 ${isCurrentMonth ? 'bg-violet-100 border-violet-200 text-violet-400 cursor-default' : 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100'}`}
                    >
                        <CircleDot size={12} aria-hidden="true" />
                        이번달
                    </button>
                </div>
            </div>

            {/* Room Cards Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-400">
                    <Loader2 size={24} className="animate-spin mr-3" aria-hidden="true" />
                    <span className="font-medium">데이터를 불러오는 중...</span>
                </div>
            ) : rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-400">
                    <DoorOpen size={48} className="text-stone-200 dark:text-slate-600 mb-4" aria-hidden="true" />
                    <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">등록된 회의실이 없습니다</p>
                    <p className="text-sm">관리자에게 회의실 등록을 요청해주세요</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {rooms.map((room) => {
                        const roomReservations = getRoomReservations(room.id);
                        const hasReservations = roomReservations.length > 0;

                        return (
                            <div
                                key={room.id}
                                className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                            >
                                {/* Room Header */}
                                <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-slate-700">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/30 flex items-center justify-center shrink-0">
                                                <DoorOpen size={20} className="text-violet-600" aria-hidden="true" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">{room.name}</h3>
                                                <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                                                    {room.capacity}인실
                                                    {room.location && <span> · {room.location}</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold border ${hasReservations ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/30' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100'}`}>
                                            {hasReservations ? `${roomReservations.length}건` : "예약가능"}
                                        </div>
                                    </div>

                                    {room.description && (
                                        <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-2 bg-stone-50 dark:bg-slate-700/50 rounded-lg px-2.5 py-1.5">{room.description}</p>
                                    )}
                                </div>

                                {/* Mini Monthly Calendar */}
                                <div className="p-3 sm:p-4">
                                    <div className="grid grid-cols-7 gap-0 mb-1">
                                        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                                            <div key={d} className={`text-center text-[10px] font-bold py-1 ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-slate-400 dark:text-slate-400'}`}>
                                                {d}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-0">
                                        {calendarDays.map((day) => {
                                            const inMonth = isSameMonth(day, currentMonth);
                                            const today = isDateToday(day);
                                            const selected = isSameDay(day, selectedDay);
                                            const hasDot = inMonth && hasReservationOnDay(room.id, day);
                                            const dayOfWeek = day.getDay();

                                            return (
                                                <button
                                                    key={day.toISOString()}
                                                    onClick={() => inMonth && setSelectedDay(day)}
                                                    disabled={!inMonth}
                                                    className={`relative flex flex-col items-center py-1 rounded-lg transition-colors text-xs
                                                        ${!inMonth ? 'text-stone-200 dark:text-slate-700 cursor-default' : 'hover:bg-violet-50 dark:hover:bg-violet-900/30 cursor-pointer'}
                                                        ${selected && inMonth ? 'bg-violet-600 text-white hover:bg-violet-700' : ''}
                                                        ${today && !selected && inMonth ? 'bg-violet-50 dark:bg-violet-900/30 font-extrabold text-violet-600 dark:text-violet-400' : ''}
                                                        ${!selected && !today && inMonth && dayOfWeek === 0 ? 'text-rose-500 dark:text-rose-400' : ''}
                                                        ${!selected && !today && inMonth && dayOfWeek === 6 ? 'text-blue-500 dark:text-blue-400' : ''}
                                                        ${!selected && !today && inMonth && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-slate-700 dark:text-slate-200' : ''}
                                                    `}
                                                >
                                                    <span className="font-bold leading-tight">{format(day, "d")}</span>
                                                    {hasDot && (
                                                        <span className={`w-1 h-1 rounded-full mt-0.5 ${selected ? 'bg-white' : 'bg-violet-500'}`} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Selected Day Reservations */}
                                <div className="px-3 sm:px-4 pb-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">
                                            {format(selectedDay, "M/d (EEE)", { locale: ko })}
                                        </span>
                                        <span className="text-[10px] text-slate-300 dark:text-slate-500">
                                            {roomReservations.length > 0 ? `${roomReservations.length}건` : '예약 없음'}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                        {hasReservations ? (
                                            roomReservations.map((r) => {
                                                const statusStyle = getStatusStyle(r.status);
                                                return (
                                                    <button
                                                        key={r.id}
                                                        onClick={() => setSelectedReservation(r)}
                                                        className="w-full text-left p-2 bg-stone-50 dark:bg-slate-700/50 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 border border-stone-100 dark:border-slate-700 hover:border-violet-200 rounded-lg transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <div className="flex items-center gap-1 text-violet-500">
                                                                <Clock size={10} aria-hidden="true" />
                                                                <span className="text-[11px] font-bold">
                                                                    {format(new Date(r.startDate), "HH:mm")} ~ {format(new Date(r.endDate), "HH:mm")}
                                                                </span>
                                                            </div>
                                                            {r.status && (
                                                                <span className={`text-[10px] font-bold px-1 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                                    {statusStyle.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5 truncate">{r.title}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{r.user.name}</span>
                                                            {r.attendees && (
                                                                <>
                                                                    <span className="text-stone-300 dark:text-slate-600">·</span>
                                                                    <span className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{r.attendees}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="flex items-center justify-center py-3 text-center">
                                                <CheckCircle2 size={14} className="text-emerald-400 mr-1.5" aria-hidden="true" />
                                                <p className="text-[11px] text-slate-400 dark:text-slate-400">예약 없음</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reserve Button */}
                                <div className="p-3 sm:p-4 pt-0">
                                    <button
                                        onClick={() => openReserveModal(room.id)}
                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-bold transition-colors border border-violet-100 dark:border-violet-800/30"
                                    >
                                        <Plus size={14} aria-hidden="true" />
                                        <span>예약하기</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reservation Detail Popover */}
            {selectedReservation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setSelectedReservation(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-5 sm:p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="sm:hidden w-10 h-1 bg-stone-200 dark:bg-slate-600 rounded-full mx-auto -mt-2 mb-2" />
                        <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">예약 정보</h3>
                            <button onClick={() => setSelectedReservation(null)} aria-label="닫기" className="text-slate-400 dark:text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors">
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        {selectedReservation.status && (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusStyle(selectedReservation.status).bg} ${getStatusStyle(selectedReservation.status).text} ${getStatusStyle(selectedReservation.status).border}`}>
                                {getStatusStyle(selectedReservation.status).label}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="bg-violet-50 dark:bg-violet-900/30 rounded-xl p-3 border border-violet-100 dark:border-violet-800/30">
                                <p className="text-xs text-violet-400 mb-0.5">회의 제목</p>
                                <p className="font-bold text-violet-700 dark:text-violet-300 text-sm break-words">{selectedReservation.title}</p>
                            </div>
                            <div className="flex items-start gap-3 bg-stone-50 dark:bg-slate-700/50 rounded-xl p-3">
                                <Users size={16} className="text-violet-500 mt-0.5 shrink-0" aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-400 dark:text-slate-400 mb-0.5">예약자</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{selectedReservation.user.name} <span className="text-xs text-slate-400 dark:text-slate-400 font-normal">{selectedReservation.user.position}</span></p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 bg-stone-50 dark:bg-slate-700/50 rounded-xl p-3">
                                <Calendar size={16} className="text-violet-500 mt-0.5 shrink-0" aria-hidden="true" />
                                <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-400 mb-0.5">시간</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                        {format(new Date(selectedReservation.startDate), "HH:mm")} ~ {format(new Date(selectedReservation.endDate), "HH:mm")}
                                    </p>
                                </div>
                            </div>
                            {selectedReservation.attendees && (
                                <div className="flex items-start gap-3 bg-stone-50 dark:bg-slate-700/50 rounded-xl p-3">
                                    <Users size={16} className="text-slate-400 dark:text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400 dark:text-slate-400 mb-0.5">참석자</p>
                                        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm break-words">{selectedReservation.attendees}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedReservation.status !== "CANCELLED" && (
                            <button
                                onClick={() => handleCancelReservation(selectedReservation.id)}
                                className="w-full py-2.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-bold transition-colors"
                            >
                                예약 취소
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Reserve Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sm:hidden w-10 h-1 bg-stone-200 dark:bg-slate-600 rounded-full mx-auto mt-3" />
                        <div className="bg-violet-50 dark:bg-violet-900/30 px-5 sm:px-6 py-4 sm:py-5 border-b border-violet-100 dark:border-violet-800/30 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">회의실 예약</h2>
                                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">회의실을 선택하고 정보를 입력해주세요</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} aria-label="닫기" className="text-slate-400 dark:text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                <X size={20} aria-hidden="true" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">회의실 선택</label>
                                <select
                                    className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors text-sm font-medium text-slate-800 dark:text-slate-100"
                                    value={selectedRoomId || ""}
                                    onChange={(e) => setSelectedRoomId(+e.target.value)}
                                    required
                                >
                                    <option value="">회의실을 선택하세요</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.capacity}인실{r.location ? ` · ${r.location}` : ''})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">시작 일시</label>
                                    <div className="flex gap-2 sm:flex-col sm:gap-0">
                                        <input type="date" className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors font-medium dark:text-slate-200" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                                        <input type="time" className="w-28 sm:w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm sm:mt-2 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors font-medium dark:text-slate-200" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">종료 일시</label>
                                    <div className="flex gap-2 sm:flex-col sm:gap-0">
                                        <input type="date" className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors font-medium dark:text-slate-200" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
                                        <input type="time" className="w-28 sm:w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm sm:mt-2 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors font-medium dark:text-slate-200" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">회의 제목</label>
                                <input type="text" className="w-full border border-stone-200 rounded-xl px-4 py-3 bg-stone-50 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors text-sm font-medium placeholder:font-normal" placeholder="예: 주간 팀 미팅, 프로젝트 킥오프" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">참석자 <span className="text-slate-300 font-normal normal-case">(선택)</span></label>
                                <div className="relative">
                                    <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                    <input type="text" className="w-full border border-stone-200 rounded-xl pl-11 pr-4 py-3 bg-stone-50 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-colors text-sm font-medium placeholder:font-normal" placeholder="예: 홍길동, 김철수, 박영희" value={formData.attendees} onChange={(e) => setFormData({ ...formData, attendees: e.target.value })} />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 pb-1">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-stone-200 dark:border-slate-600 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm transition-colors">
                                    취소
                                </button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-bold text-sm shadow-lg shadow-violet-200 dark:shadow-violet-900/30 active:scale-[0.97] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {submitting ? (<><Loader2 size={16} className="animate-spin" aria-hidden="true" />예약 중...</>) : "예약하기"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 sm:gap-3 font-bold text-xs sm:text-sm transition-colors max-w-[90vw] ${
                    toastType === "success"
                        ? "bg-emerald-600 text-white shadow-emerald-200"
                        : "bg-rose-600 text-white shadow-rose-200"
                }`}>
                    {toastType === "success" ? <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" /> : <AlertCircle size={16} className="shrink-0" aria-hidden="true" />}
                    <span className="truncate">{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
