import { useState } from "react";
import apiClient from "../api/client";
import { X, Calendar, FileText, Sun, Sunrise, Sunset, Heart } from "lucide-react";
import Toast from "./Toast";

interface Props {
    onClose: () => void;
}

type VacationType = "ANNUAL" | "HALF_AM" | "HALF_PM" | "SICK";

interface VacationTypeInfo {
    value: VacationType;
    label: string;
    description: string;
    icon: typeof Sun;
    color: string;
    bgColor: string;
    borderColor: string;
}

const vacationTypes: VacationTypeInfo[] = [
    {
        value: "ANNUAL",
        label: "연차",
        description: "",
        icon: Sun,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-500",
    },
    {
        value: "HALF_AM",
        label: "오전 반차",
        description: "",
        icon: Sunrise,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-500",
    },
    {
        value: "HALF_PM",
        label: "오후 반차",
        description: "",
        icon: Sunset,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-500",
    },
    {
        value: "SICK",
        label: "공가",
        description: "",
        icon: Heart,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
    },
];

export default function VacationRequestModal({ onClose }: Props) {
    const [type, setType] = useState<VacationType>("ANNUAL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            setToast({ message: "날짜를 선택해주세요.", type: "error" });
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post("/vacations", { type, startDate, endDate, reason });
            setToast({ message: "연차 신청이 완료되었습니다!", type: "success" });
            setTimeout(onClose, 1500);
        } catch (error) {
            console.error("연차 신청 실패:", error);
            setToast({ message: "연차 신청에 실패했습니다.", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedTypeInfo = vacationTypes.find(v => v.value === type) || vacationTypes[0];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Calendar className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">연차 신청</h2>
                            <p className="text-xs text-slate-500">휴가 신청서를 작성해주세요</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* 연차 종류 선택 */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-orange-600" />
                            연차 종류
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {vacationTypes.map((vacType) => {
                                const Icon = vacType.icon;
                                const isSelected = type === vacType.value;
                                return (
                                    <div
                                        key={vacType.value}
                                        onClick={() => setType(vacType.value)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            isSelected
                                                ? `${vacType.borderColor} ${vacType.bgColor} shadow-md`
                                                : "border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`${isSelected ? vacType.color : 'text-slate-400'} transition-colors`}>
                                                    <Icon size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{vacType.label}</div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className={`w-5 h-5 ${vacType.bgColor} rounded-full flex items-center justify-center`}>
                                                    <svg className={`w-3 h-3 ${vacType.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 휴가 기간 */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-orange-600" />
                            휴가 기간
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-600 mb-2">시작일</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white transition-shadow"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-600 mb-2">종료일</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white transition-shadow"
                                />
                            </div>
                        </div>
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <p className="text-xs text-orange-700">
                                <strong>선택한 종류:</strong> {selectedTypeInfo.label} - {selectedTypeInfo.description}
                            </p>
                        </div>
                    </div>

                    {/* 사유 */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-orange-600" />
                            사유 <span className="text-xs text-slate-400 font-normal">(선택사항)</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="휴가 사유를 입력하세요 (선택사항)"
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none bg-white transition-shadow placeholder:text-slate-400"
                        />
                    </div>

                    {/* 신청 버튼 */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                신청 중...
                            </>
                        ) : (
                            <>
                                <Calendar size={20} />
                                연차 신청하기
                            </>
                        )}
                    </button>
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
