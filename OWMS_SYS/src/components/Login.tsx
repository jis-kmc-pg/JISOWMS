import { useState } from "react";
import { AxiosError } from "axios";
import apiClient from "../api/client";
import { useUserStore } from "../store/userStore";
import { LogIn } from "lucide-react";

export default function Login() {
    const { login, lastUserId } = useUserStore();
    const [userId, setUserId] = useState(lastUserId || "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const response = await apiClient.post("/auth/login", { userId, password });
            login(response.data.accessToken, response.data.user);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || "로그인에 실패했습니다.");
            } else {
                setError("로그인에 실패했습니다.");
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-900 p-4">
            <div className="w-full max-w-xs space-y-4">
                <h1 className="text-xl font-bold text-center">OWMS 로그인</h1>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium mb-1">아이디</label>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full p-2 border rounded shadow-sm text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="사원번호 입력"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded shadow-sm text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="********"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    >
                        <LogIn size={16} />
                        로그인
                    </button>
                </form>
            </div>
        </div>
    );
}
