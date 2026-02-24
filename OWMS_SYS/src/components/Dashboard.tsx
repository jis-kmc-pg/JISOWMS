import { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { downloadDir } from "@tauri-apps/api/path";
import { ExternalLink, Send, Clock, Car, Users, Calendar, FileDown, Plus, ChevronDown, LogOut } from "lucide-react";
import MemoSend from "./MemoSend";
import WeeklyStatusSimple from "./WeeklyStatusSimple";
import MemoHistoryModal from "./MemoHistoryModal";
import VehicleStatus from "./VehicleStatus";
import MeetingRoomStatus from "./MeetingRoomStatus";
import VacationInfo from "./VacationInfo";
import VacationRequestModal from "./VacationRequestModal";
import VehicleRequestModal from "./VehicleRequestModal";
import MeetingRoomRequestModal from "./MeetingRoomRequestModal";
import Toast from "./Toast";
import apiClient from "../api/client";
import { notificationService } from "../services/notificationService";

const OWMS_WEB_URL = import.meta.env.VITE_OWMS_WEB_URL || "http://localhost:3000";

export default function Dashboard() {
    const { user, logout, token } = useUserStore();
    const [showMemoHistory, setShowMemoHistory] = useState(false);
    const [showVacationRequest, setShowVacationRequest] = useState(false);
    const [showVehicleRequest, setShowVehicleRequest] = useState(false);
    const [showMeetingRoomRequest, setShowMeetingRoomRequest] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // WebSocket 알림 서비스 연결
    useEffect(() => {
        if (user?.id) {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
            notificationService.connect(user.id, apiUrl);
            console.log('[Dashboard] Notification service connected for user:', user.id);
        }

        return () => {
            notificationService.disconnect();
            console.log('[Dashboard] Notification service disconnected');
        };
    }, [user?.id]);

    const handleOpenWeb = async () => {
        try {
            console.log("[OWMS_SYS] 토큰 존재:", !!token);
            console.log("[OWMS_SYS] 토큰 길이:", token?.length || 0);
            if (!token) {
                console.error("[OWMS_SYS] 토큰이 없습니다!");
                return;
            }
            const ssoUrl = `${OWMS_WEB_URL}/sso?token=${encodeURIComponent(token)}`;
            console.log("[OWMS_SYS] SSO URL:", ssoUrl);
            await openUrl(ssoUrl);
        } catch (error) {
            console.error("웹 열기 실패:", error);
        }
    };

    const handleClose = async () => {
        setToast({ message: '트레이로 숨기는 중...', type: 'success' });
        try {
            console.log('[Dashboard] 트레이로 숨김 시도...');
            const appWindow = getCurrentWindow();
            console.log('[Dashboard] Window 객체:', appWindow);
            await appWindow.hide();
            console.log('[Dashboard] 숨김 완료');
        } catch (error) {
            console.error('[Dashboard] 숨김 실패:', error);
            setToast({ message: `창 숨김 실패: ${error}`, type: 'error' });
        }
    };

    const handleExportReport = async () => {
        if (!user) {
            setToast({ message: "사용자 정보를 찾을 수 없습니다.", type: "error" });
            return;
        }
        try {
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            const dateStr = new Date(today.getTime() - offset).toISOString().split("T")[0];

            const res = await apiClient.get(`/excel/weekly-report?userId=${user.id}&date=${dateStr}`, {
                responseType: "blob",
            });

            // 에러 응답 처리 (JSON으로 온 경우)
            if (res.data.type === "application/json") {
                const text = await res.data.text();
                const json = JSON.parse(text);
                setToast({ message: `다운로드 실패: ${json.message || "서버 오류"}`, type: "error" });
                return;
            }

            // 엑셀 파일 다운로드
            const filename = `${user.name}_주간보고서_${dateStr}.xlsx`;
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            // 다운로드 폴더 경로 가져오기
            try {
                const downloadPath = await downloadDir();
                setToast({ message: `다운로드 완료!\n저장 위치: ${downloadPath}\\${filename}`, type: "success" });
            } catch {
                // downloadDir 실패 시 기본 메시지
                setToast({ message: `다운로드 완료!\n파일명: ${filename}`, type: "success" });
            }
        } catch (error) {
            console.error("엑셀 다운로드 실패:", error);
            setToast({ message: "엑셀 다운로드에 실패했습니다.", type: "error" });
        }
    };


    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
            {/* 컴팩트 헤더 */}
            <header data-tauri-drag-region className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3 py-2.5 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">OW</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white">OWMS</h1>
                        <p className="text-[10px] text-blue-100">{user?.name}님 환영합니다</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleOpenWeb}
                        className="text-white/90 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
                        title="웹 열기"
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button
                        onClick={logout}
                        className="text-white/90 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
                        title="로그아웃"
                    >
                        <LogOut size={16} />
                    </button>
                    <button
                        onClick={handleClose}
                        className="text-white/90 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
                        title="트레이로 숨기기"
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="flex-1 p-3 overflow-auto space-y-2.5 custom-scrollbar">
                {/* 메모 전송 */}
                <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-xl shadow-md border border-blue-100 p-3 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-center mb-2.5">
                        <h2 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Send size={12} className="text-white" />
                            </div>
                            메모 전송
                        </h2>
                        <button onClick={() => setShowMemoHistory(true)} className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded-lg transition-all cursor-pointer">
                            <Clock size={10} />
                            전송 이력
                        </button>
                    </div>
                    <MemoSend />
                </div>

                {/* 작성 상태 현황 */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-md border border-slate-200 p-3 hover:shadow-lg transition-shadow">
                    <h2 className="font-bold text-xs text-slate-800 mb-2.5 flex items-center gap-1.5">
                        <span className="text-base">📊</span>
                        작성 상태 현황
                    </h2>
                    <WeeklyStatusSimple />
                </div>

                {/* 배차 & 회의실 */}
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gradient-to-br from-white to-green-50/40 rounded-xl shadow-md border border-green-100 p-3 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-center mb-2.5">
                            <h2 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                    <Car size={12} className="text-white" />
                                </div>
                                배차
                            </h2>
                            <button
                                onClick={() => setShowVehicleRequest(true)}
                                className="text-[10px] bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2.5 py-1 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
                            >
                                <Plus size={10} />
                                <span>신청</span>
                            </button>
                        </div>
                        <VehicleStatus />
                    </div>

                    <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl shadow-md border border-purple-100 p-3 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-center mb-2.5">
                            <h2 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Users size={12} className="text-white" />
                                </div>
                                회의실
                            </h2>
                            <button
                                onClick={() => setShowMeetingRoomRequest(true)}
                                className="text-[10px] bg-gradient-to-r from-purple-600 to-purple-700 text-white px-2.5 py-1 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
                            >
                                <Plus size={10} />
                                <span>예약</span>
                            </button>
                        </div>
                        <MeetingRoomStatus />
                    </div>
                </div>

                {/* 연차 정보 */}
                <div className="bg-gradient-to-br from-white to-orange-50/40 rounded-xl shadow-md border border-orange-100 p-3 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-center mb-2.5">
                        <h2 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <Calendar size={12} className="text-white" />
                            </div>
                            내 연차 정보
                        </h2>
                        <button
                            onClick={() => setShowVacationRequest(true)}
                            className="text-[10px] bg-gradient-to-r from-orange-600 to-red-600 text-white px-2.5 py-1 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all flex items-center justify-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
                        >
                            <Plus size={10} />
                            <span>신청</span>
                        </button>
                    </div>
                    <VacationInfo />
                </div>

                {/* 업무보고서 다운로드 */}
                <div className="bg-gradient-to-br from-white to-indigo-50/40 rounded-xl shadow-md border border-indigo-100 p-3 hover:shadow-lg transition-shadow">
                    <button onClick={handleExportReport} className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-[10px] font-semibold cursor-pointer">
                        <FileDown size={14} />
                        <span>이번 주 업무보고서 다운로드</span>
                    </button>
                </div>

            </main>

            {/* 모달들 */}
            {showMemoHistory && <MemoHistoryModal onClose={() => setShowMemoHistory(false)} />}
            {showVacationRequest && <VacationRequestModal onClose={() => setShowVacationRequest(false)} />}
            {showVehicleRequest && <VehicleRequestModal onClose={() => setShowVehicleRequest(false)} />}
            {showMeetingRoomRequest && <MeetingRoomRequestModal onClose={() => setShowMeetingRoomRequest(false)} />}

            {/* Toast Notification */}
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
