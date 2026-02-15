"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Plus,
    MapPin,
    Video,
    CreditCard,
    Car,
    Trash2,
    Edit,
    Calendar,
    Users
} from "lucide-react";

interface Vehicle {
    id: number;
    modelName: string;
    licensePlate: string;
    color?: string;
    year?: number;
    capacity?: number;
    hasNavi: boolean;
    hasBlackBox: boolean;
    hasHiPass: boolean;
    minAge: number;
    contractStartDate?: string;
    contractEndDate?: string;
    rentalCompany?: string;
    department?: { id: number; name: string };
}

export default function VehicleManagementPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Vehicle>>({
        modelName: "",
        licensePlate: "",
        color: "",
        year: new Date().getFullYear(),
        capacity: 5,
        hasNavi: false,
        hasBlackBox: true,
        hasHiPass: true,
        minAge: 26,
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
                alert("차량 정보가 수정되었습니다.");
            } else {
                await api.post("/vehicle", formData);
                alert("새 차량이 등록되었습니다.");
            }
            setIsModalOpen(false);
            setEditingVehicle(null);
            setFormData({});
            fetchVehicles();
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장에 실패했습니다.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("정말 이 차량을 삭제하시겠습니까? 관련 배차 기록도 영향을 받을 수 있습니다.")) return;
        try {
            await api.delete(`/vehicle/${id}`);
            alert("삭제되었습니다.");
            fetchVehicles();
        } catch (err) {
            console.error("삭제 실패:", err);
            alert("삭제에 실패했습니다.");
        }
    };

    const openEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            ...vehicle,
            contractStartDate: vehicle.contractStartDate ? vehicle.contractStartDate.split('T')[0] : '',
            contractEndDate: vehicle.contractEndDate ? vehicle.contractEndDate.split('T')[0] : '',
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingVehicle(null);
        setFormData({
            modelName: "",
            licensePlate: "",
            color: "",
            year: new Date().getFullYear(),
            capacity: 5,
            hasNavi: false,
            hasBlackBox: true,
            hasHiPass: true,
            minAge: 26,
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Car className="text-blue-600" />
                    차량 관리
                </h1>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    <Plus size={16} /> 차량 등록
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">로딩 중...</div>
            ) : vehicles.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg text-gray-500">
                    등록된 차량이 없습니다.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((v) => (
                        <div key={v.id} className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                        {v.modelName}
                                    </span>
                                    <h3 className="text-lg font-bold mt-1 text-gray-800">{v.licensePlate}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(v)} className="p-1 text-gray-400 hover:text-blue-600">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(v.id)} className="p-1 text-gray-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-16 text-gray-400">상세</span>
                                    {v.color || "-"} / {v.year}년식
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-gray-400" />
                                    <span className="w-12 text-gray-400">정원</span>
                                    {v.capacity}인승
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span className="w-12 text-gray-400">계약</span>
                                    {v.contractEndDate ? `${v.contractEndDate.split('T')[0]} 만료` : "정보 없음"}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-3 border-t">
                                <OptionBadge active={v.hasNavi} icon={<MapPin size={12} />} label="내비" />
                                <OptionBadge active={v.hasBlackBox} icon={<Video size={12} />} label="블박" />
                                <OptionBadge active={v.hasHiPass} icon={<CreditCard size={12} />} label="패스" />
                                <span className={`px-2 py-1 rounded text-xs border ${v.minAge >= 26 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                    만 {v.minAge}세 이상
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingVehicle ? "차량 정보 수정" : "새 차량 등록"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">모델명</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2"
                                        value={formData.modelName}
                                        onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">차량번호</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2"
                                        value={formData.licensePlate}
                                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">색상</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2"
                                        value={formData.color || ""}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">연식</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded px-3 py-2"
                                        value={formData.year || ""}
                                        onChange={(e) => setFormData({ ...formData, year: +e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">승차정원</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded px-3 py-2"
                                        value={formData.capacity || 5}
                                        onChange={(e) => setFormData({ ...formData, capacity: +e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">운전연령제한</label>
                                    <select
                                        className="w-full border rounded px-3 py-2"
                                        value={formData.minAge}
                                        onChange={(e) => setFormData({ ...formData, minAge: +e.target.value })}
                                    >
                                        <option value={21}>만 21세 이상</option>
                                        <option value={26}>만 26세 이상</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium mb-2">차량 옵션</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasNavi}
                                            onChange={(e) => setFormData({ ...formData, hasNavi: e.target.checked })}
                                        /> 내비게이션
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasBlackBox}
                                            onChange={(e) => setFormData({ ...formData, hasBlackBox: e.target.checked })}
                                        /> 블랙박스
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasHiPass}
                                            onChange={(e) => setFormData({ ...formData, hasHiPass: e.target.checked })}
                                        /> 하이패스
                                    </label>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium mb-2">계약 정보 (선택)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">계약 시작일</label>
                                        <input
                                            type="date"
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={formData.contractStartDate || ""}
                                            onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">계약 종료일</label>
                                        <input
                                            type="date"
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={formData.contractEndDate || ""}
                                            onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">렌터카 업체</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={formData.rentalCompany || ""}
                                            onChange={(e) => setFormData({ ...formData, rentalCompany: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {editingVehicle ? "수정 완료" : "등록하기"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function OptionBadge({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
    return (
        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${active ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200 line-through decoration-gray-400'}`}>
            {icon} {label}
        </span>
    );
}
