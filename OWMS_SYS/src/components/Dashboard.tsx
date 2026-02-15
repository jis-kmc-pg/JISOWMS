import { useUserStore } from "../store/userStore";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ExternalLink, Clock } from "lucide-react";
import WeeklyWidget from "./WeeklyWidget";
import QuickJobEntry from "./QuickJobEntry";
import TaskHistory from "./TaskHistory";

const OWMS_WEB_URL = import.meta.env.VITE_OWMS_WEB_URL || "http://localhost:3000";

export default function Dashboard() {
    const { user, logout } = useUserStore();

    /** 기본 브라우저에서 OWMS 웹 앱 열기 */
    const handleOpenWeb = async () => {
        try {
            await openUrl(OWMS_WEB_URL);
        } catch {
            // openUrl failure silently ignored
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-100 text-slate-900">
            {/* ── 헤더 ── */}
            <header className="bg-white shadow p-3 flex justify-between items-center">
                <h1 className="text-sm font-bold">OWMS</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenWeb}
                        className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                        title="OWMS 웹 앱 열기"
                    >
                        <ExternalLink size={12} />
                        웹
                    </button>
                    <span className="text-xs text-slate-500">{user?.name}</span>
                    <button
                        onClick={logout}
                        className="text-xs text-red-600 hover:text-red-800"
                    >
                        로그아웃
                    </button>
                </div>
            </header>

            {/* ── 메인 콘텐츠 ── */}
            <main className="flex-1 p-3 overflow-auto space-y-3">
                {/* 빠른 업무 등록 */}
                <QuickJobEntry />

                {/* 작성 상태 현황판 (금주/차주) */}
                <div className="bg-white p-3 rounded shadow">
                    <h2 className="font-semibold mb-2 text-sm">📊 작성 상태 현황</h2>
                    <WeeklyWidget />
                </div>

                {/* 업무 이력 타임라인 */}
                <div className="bg-white p-3 rounded shadow">
                    <h2 className="font-semibold mb-2 text-sm flex items-center gap-1">
                        <Clock size={14} />
                        업무 전송 이력
                    </h2>
                    <TaskHistory />
                </div>
            </main>
        </div>
    );
}
