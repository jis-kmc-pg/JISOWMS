"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import ToastNotification from "@/components/daily-report/ToastNotification";
import {
    Plus,
    MapPin,
    Video,
    CreditCard,
    Car,
    Trash2,
    Pencil,
    Calendar,
    UserCircle,
    X,
    Loader2,
    FileText,
} from "lucide-react";

interface Vehicle {
    id: number;
    modelName: string;
    licensePlate: string;
    color?: string;
    assignee?: string;
    hasNavi: boolean;
    hasBlackBox: boolean;
    hasHiPass: boolean;
    contractStartDate?: string;
    contractEndDate?: string;
    rentalCompany?: string;
    department?: { id: number; name: string };
}

export default function VehicleSettings() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const showToastMsg = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const [formData, setFormData] = useState<Partial<Vehicle>>({
        modelName: "",
        licensePlate: "",
        color: "",
        assignee: "",
        hasNavi: false,
        hasBlackBox: true,
        hasHiPass: true,
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await api.get("/vehicle");
            setVehicles(res.data);
        } catch (err) {
            console.error("차량 목록 조회 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingVehicle) {
                await api.patch(`/vehicle/${editingVehicle.id}`, formData);
                showToastMsg("차량 정보가 수정되었습니다.");
            } else {
                await api.post("/vehicle", formData);
                showToastMsg("새 차량이 등록되었습니다.");
            }
            setIsModalOpen(false);
            setEditingVehicle(null);
            setFormData({});
            fetchVehicles();
        } catch (err) {
            console.error("저장 실패:", err);
            showToastMsg("저장에 실패했습니다.");
        }
    };

    const requestDelete = (id: number) => {
        setConfirmAction(() => async () => {
            try {
                await api.delete(`/vehicle/${id}`);
                showToastMsg("삭제되었습니다.");
                fetchVehicles();
            } catch (err) {
                console.error("삭제 실패:", err);
                showToastMsg("삭제에 실패했습니다.");
            }
        });
        setShowConfirm(true);
    };

    const openEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            modelName: vehicle.modelName,
            licensePlate: vehicle.licensePlate,
            color: vehicle.color || '',
            assignee: vehicle.assignee || '',
            hasNavi: vehicle.hasNavi,
            hasBlackBox: vehicle.hasBlackBox,
            hasHiPass: vehicle.hasHiPass,
            contractStartDate: vehicle.contractStartDate ? vehicle.contractStartDate.split('T')[0] : '',
            contractEndDate: vehicle.contractEndDate ? vehicle.contractEndDate.split('T')[0] : '',
            rentalCompany: vehicle.rentalCompany || '',
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingVehicle(null);
        setFormData({
            modelName: "",
            licensePlate: "",
            color: "",
            assignee: "",
            hasNavi: false,
            hasBlackBox: true,
            hasHiPass: true,
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-5">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">차량 목록</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">업무용 차량 등록 및 정보를 관리합니다</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-colors"
                >
                    <Plus size={16} aria-hidden="true" /> 차량 등록
                </button>
            </div>

            {/* 차량 수 표시 */}
            {!loading && vehicles.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-400">
                        총 <span className="text-indigo-600 dark:text-indigo-400">{vehicles.length}</span>대 등록
                    </span>
                </div>
            )}

            {/* 차량 목록 */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <Loader2 size={24} className="animate-spin mr-3" aria-hidden="true" />
                    <span className="font-medium">불러오는 중...</span>
                </div>
            ) : vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-stone-50 dark:bg-slate-700/50 rounded-xl border border-stone-100 dark:border-slate-700">
                    <Car size={36} className="mb-3 text-slate-200 dark:text-slate-600" aria-hidden="true" />
                    <p className="font-bold text-slate-500 dark:text-slate-400">등록된 차량이 없습니다</p>
                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">차량 등록 버튼을 눌러 새 차량을 추가하세요</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {vehicles.map((v) => (
                        <div key={v.id} className="bg-stone-50/50 dark:bg-slate-700/30 border border-stone-100 dark:border-slate-700 rounded-xl p-4 hover:bg-stone-50 dark:hover:bg-slate-700 hover:border-stone-200 dark:hover:border-slate-600 transition-colors">
                            <div className="flex justify-between items-start mb-2.5">
                                <div>
                                    <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                        {v.modelName}
                                    </span>
                                    <h3 className="text-base font-extrabold mt-1 text-slate-800 dark:text-slate-100">{v.licensePlate}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(v)} aria-label="수정" className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                                        <Pencil size={13} aria-hidden="true" />
                                    </button>
                                    <button onClick={() => requestDelete(v.id)} aria-label="삭제" className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                                        <Trash2 size={13} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 w-8">색상</span>
                                    <span className="text-xs font-medium">{v.color || "-"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserCircle size={10} className="text-slate-400 dark:text-slate-400" aria-hidden="true" />
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 w-6">담당</span>
                                    <span className="text-xs font-medium">{v.assignee || "-"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={10} className="text-slate-400 dark:text-slate-400" aria-hidden="true" />
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 w-6">계약</span>
                                    <span className="text-xs font-medium">{v.contractEndDate ? `${v.contractEndDate.split('T')[0]} 만료` : "정보 없음"}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-stone-100 dark:border-slate-700">
                                <OptionBadge active={v.hasNavi} icon={<MapPin size={10} />} label="내비" />
                                <OptionBadge active={v.hasBlackBox} icon={<Video size={10} />} label="블박" />
                                <OptionBadge active={v.hasHiPass} icon={<CreditCard size={10} />} label="패스" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 차량 등록/수정 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)} role="presentation">
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 dark:border-slate-600 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 모달 헤더 */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${editingVehicle ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/30' : 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/30'}`}>
                                    {editingVehicle
                                        ? <Pencil size={18} className="text-amber-600" aria-hidden="true" />
                                        : <Plus size={18} className="text-indigo-600" aria-hidden="true" />
                                    }
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                        {editingVehicle ? "차량 정보 수정" : "새 차량 등록"}
                                    </h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                                        {editingVehicle ? "차량 정보를 변경합니다" : "업무용 차량을 새로 등록합니다"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                aria-label="닫기"
                                className="p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        {/* 모달 바디 */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* 기본 정보 */}
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold mb-3 flex items-center gap-1.5">
                                    <Car size={12} aria-hidden="true" /> 기본 정보
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">모델명 <span className="text-rose-400">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 font-medium transition-colors dark:text-slate-100"
                                            placeholder="카니발, 스타리아 등"
                                            value={formData.modelName}
                                            onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">차량번호 <span className="text-rose-400">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 font-medium transition-colors dark:text-slate-100"
                                            placeholder="12가 3456"
                                            value={formData.licensePlate}
                                            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">색상</label>
                                        <input
                                            type="text"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 font-medium transition-colors dark:text-slate-100"
                                            placeholder="흰색, 검정 등"
                                            value={formData.color || ""}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">담당</label>
                                        <input
                                            type="text"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 font-medium transition-colors dark:text-slate-100"
                                            placeholder="담당 부서 또는 이름"
                                            value={formData.assignee || ""}
                                            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 차량 옵션 */}
                            <div className="border-t border-stone-100 dark:border-slate-700 pt-5">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold mb-3 flex items-center gap-1.5">
                                    <CreditCard size={12} aria-hidden="true" /> 차량 옵션
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <ToggleChip
                                        checked={formData.hasNavi ?? false}
                                        onChange={(v) => setFormData({ ...formData, hasNavi: v })}
                                        icon={<MapPin size={12} />}
                                        label="내비게이션"
                                    />
                                    <ToggleChip
                                        checked={formData.hasBlackBox ?? true}
                                        onChange={(v) => setFormData({ ...formData, hasBlackBox: v })}
                                        icon={<Video size={12} />}
                                        label="블랙박스"
                                    />
                                    <ToggleChip
                                        checked={formData.hasHiPass ?? true}
                                        onChange={(v) => setFormData({ ...formData, hasHiPass: v })}
                                        icon={<CreditCard size={12} />}
                                        label="하이패스"
                                    />
                                </div>
                            </div>

                            {/* 계약 정보 */}
                            <div className="border-t border-stone-100 dark:border-slate-700 pt-5">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold mb-3 flex items-center gap-1.5">
                                    <FileText size={12} aria-hidden="true" /> 계약 정보
                                    <span className="text-[10px] text-slate-300 font-medium normal-case">(선택)</span>
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">계약 시작일</label>
                                        <input
                                            type="date"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 font-medium transition-colors dark:text-slate-100"
                                            value={formData.contractStartDate || ""}
                                            onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">계약 종료일</label>
                                        <input
                                            type="date"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 font-medium transition-colors dark:text-slate-100"
                                            value={formData.contractEndDate || ""}
                                            onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">렌터카 업체</label>
                                        <input
                                            type="text"
                                            className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-stone-50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 font-medium transition-colors dark:text-slate-100"
                                            placeholder="업체명 입력"
                                            value={formData.rentalCompany || ""}
                                            onChange={(e) => setFormData({ ...formData, rentalCompany: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 버튼 */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-stone-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-600 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-200 transition-colors"
                                >
                                    {editingVehicle ? "수정 완료" : "등록하기"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                show={showConfirm}
                title="차량 삭제"
                description="정말 이 차량을 삭제하시겠습니까? 관련 배차 기록도 영향을 받을 수 있습니다."
                confirmLabel="삭제"
                variant="danger"
                onConfirm={() => { confirmAction?.(); setShowConfirm(false); setConfirmAction(null); }}
                onCancel={() => { setShowConfirm(false); setConfirmAction(null); }}
            />
            <ToastNotification show={showToast} message={toastMessage} />
        </div>
    );
}

function OptionBadge({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
    return (
        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/30' : 'bg-stone-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-400 border-stone-200 dark:border-slate-600 line-through decoration-slate-300 dark:decoration-slate-600'}`}>
            {icon} {label}
        </span>
    );
}

function ToggleChip({ checked, onChange, icon, label }: { checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                checked
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 shadow-sm'
                    : 'bg-stone-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-400 border-stone-200 dark:border-slate-600 hover:border-stone-300 dark:hover:border-slate-500'
            }`}
        >
            {icon}
            {label}
            {checked && (
                <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
    );
}
