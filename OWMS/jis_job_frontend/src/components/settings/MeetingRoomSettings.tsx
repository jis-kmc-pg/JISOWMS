"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";
import {
    DoorOpen,
    Plus,
    Pencil,
    Trash2,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    MapPin,
    Users
} from "lucide-react";

interface MeetingRoom {
    id: number;
    name: string;
    capacity: number;
    location?: string;
    description?: string;
    isActive: boolean;
}

export default function MeetingRoomSettings() {
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        capacity: 10,
        location: "",
        description: ""
    });

    // Toast
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

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

    const fetchRooms = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/meeting-room");
            setRooms(res.data);
        } catch {
            toast("회의실 목록을 불러오는데 실패했습니다.", "error");
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isModalOpen) setIsModalOpen(false);
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isModalOpen]);

    const openCreateModal = () => {
        setEditingRoom(null);
        setFormData({ name: "", capacity: 10, location: "", description: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (room: MeetingRoom) => {
        setEditingRoom(room);
        setFormData({
            name: room.name,
            capacity: room.capacity,
            location: room.location || "",
            description: room.description || ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingRoom) {
                await api.patch(`/meeting-room/${editingRoom.id}`, formData);
                toast("회의실이 수정되었습니다.");
            } else {
                await api.post("/meeting-room", formData);
                toast("회의실이 등록되었습니다.");
            }
            setIsModalOpen(false);
            fetchRooms();
        } catch (err: unknown) {
            const message = err instanceof AxiosError ? err.response?.data?.message : null;
            toast(message || "처리에 실패했습니다.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("회의실을 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/meeting-room/${id}`);
            toast("회의실이 삭제되었습니다.");
            fetchRooms();
        } catch (err: unknown) {
            const message = err instanceof AxiosError ? err.response?.data?.message : null;
            toast(message || "삭제에 실패했습니다.", "error");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">회의실 관리</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">회의실을 등록하고 관리합니다</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-violet-600 text-white px-4 py-2 rounded-xl hover:bg-violet-700 flex items-center gap-2 shadow-lg shadow-violet-200 font-bold text-sm transition-all active:scale-[0.97]"
                >
                    <Plus size={16} /> 회의실 등록
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <Loader2 size={24} className="animate-spin mr-3" />
                    <span className="font-medium">불러오는 중...</span>
                </div>
            ) : rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <DoorOpen size={48} className="text-stone-200 mb-4" />
                    <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">등록된 회의실이 없습니다</p>
                    <p className="text-sm dark:text-slate-500">위의 버튼을 클릭하여 회의실을 등록하세요</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rooms.map((room) => (
                        <div key={room.id} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-slate-700/50 border border-stone-100 dark:border-slate-700 rounded-xl hover:border-stone-200 dark:hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                                    <DoorOpen size={18} className="text-violet-600" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{room.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                                        <span className="flex items-center gap-1"><Users size={11} />{room.capacity}인</span>
                                        {room.location && <span className="flex items-center gap-1"><MapPin size={11} />{room.location}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={() => openEditModal(room)}
                                    className="p-2 text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                    title="수정"
                                >
                                    <Pencil size={15} />
                                </button>
                                <button
                                    onClick={() => handleDelete(room.id)}
                                    className="p-2 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                    title="삭제"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="sm:hidden w-10 h-1 bg-stone-200 dark:bg-slate-600 rounded-full mx-auto mt-3" />
                        <div className="bg-violet-50 dark:bg-violet-900/20 px-5 sm:px-6 py-4 sm:py-5 border-b border-violet-100 dark:border-violet-800/30 flex justify-between items-center">
                            <div>
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                    {editingRoom ? "회의실 수정" : "회의실 등록"}
                                </h2>
                                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">회의실 정보를 입력해주세요</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">회의실명</label>
                                <input
                                    type="text"
                                    className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-800/30 outline-none transition-all text-sm font-medium placeholder:font-normal dark:text-slate-100"
                                    placeholder="예: 대회의실, 소회의실A"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">수용 인원</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-800/30 outline-none transition-all text-sm font-medium dark:text-slate-100"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: +e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">위치 <span className="text-slate-300 font-normal normal-case">(선택)</span></label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        className="w-full border border-stone-200 dark:border-slate-600 rounded-xl pl-11 pr-4 py-3 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-800/30 outline-none transition-all text-sm font-medium placeholder:font-normal dark:text-slate-100"
                                        placeholder="예: 3층, 본관 2층"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">비고 <span className="text-slate-300 font-normal normal-case">(선택)</span></label>
                                <textarea
                                    className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-800/30 outline-none transition-all text-sm font-medium placeholder:font-normal resize-none dark:text-slate-100"
                                    rows={2}
                                    placeholder="예: 프로젝터 설치됨, 화이트보드 있음"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-stone-200 dark:border-slate-600 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm transition-colors">
                                    취소
                                </button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-bold text-sm shadow-lg shadow-violet-200 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {submitting ? (<><Loader2 size={16} className="animate-spin" />처리 중...</>) : editingRoom ? "수정하기" : "등록하기"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 sm:gap-3 font-bold text-xs sm:text-sm transition-all max-w-[90vw] ${
                    toastType === "success"
                        ? "bg-emerald-600 text-white shadow-emerald-200"
                        : "bg-rose-600 text-white shadow-rose-200"
                }`}>
                    {toastType === "success" ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                    <span className="truncate">{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
