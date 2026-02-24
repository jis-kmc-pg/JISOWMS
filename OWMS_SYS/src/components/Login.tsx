import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUserStore } from "../store/userStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogIn, ChevronDown, GripHorizontal } from "lucide-react";

export default function Login() {
    const { login, lastUserId } = useUserStore();
    const [userId, setUserId] = useState(lastUserId || "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            const response = await invoke<{ accessToken: string; user: any }>('login_command', {
                url: `${apiUrl}/auth/login`,
                userId,
                password
            });

            login(response.accessToken, response.user);
        } catch (err: unknown) {
            console.error('Login error:', err);
            const errorMessage = typeof err === 'string' ? err : "로그인에 실패했습니다.";
            setError(errorMessage);
        }
    };

    const handleClose = async () => {
        const appWindow = getCurrentWindow();
        await appWindow.hide();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 relative">
            {/* 드래그 가능한 영역 */}
            <div
                data-tauri-drag-region
                className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-move group"
            >
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <GripHorizontal size={14} />
                </div>
            </div>

            {/* 트레이 숨김 버튼 */}
            <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border border-blue-100 z-10"
                title="트레이로 숨기기"
            >
                <ChevronDown size={16} className="text-slate-600" />
            </button>

            <div className="w-full max-w-sm">
                {/* Logo/Title Section */}
                <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-xl shadow-blue-300/50 mb-3 transform hover:scale-105 transition-transform">
                        <span className="text-white font-black text-lg">OW</span>
                    </div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">OWMS</h1>
                    <p className="text-slate-600 text-xs font-semibold">업무관리 시스템</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-blue-100 p-5">
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">아이디</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-blue-300"
                                placeholder="사원번호를 입력하세요"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-blue-300"
                                placeholder="비밀번호를 입력하세요"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-2">
                                <p className="text-red-600 text-xs font-semibold">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-2.5 rounded-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-bold text-xs"
                        >
                            <LogIn size={16} />
                            로그인
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-[10px] mt-4 font-medium">© 2024 JISO OWMS. All rights reserved.</p>
            </div>
        </div>
    );
}
