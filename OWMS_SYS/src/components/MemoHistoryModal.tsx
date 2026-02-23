import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { X, Search } from "lucide-react";

interface Props {
    onClose: () => void;
}

export default function MemoHistoryModal({ onClose }: Props) {
    const [memos, setMemos] = useState<any[]>([]);
    const [searchDate, setSearchDate] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setSearchDate(today);
        fetchMemos(today);
    }, []);

    const fetchMemos = async (date: string) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/reports/system-memos?date=${date}`);
            setMemos(res.data);
        } catch (error) {
            console.error("메모 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchDate) fetchMemos(searchDate);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200">
                    <h2 className="font-bold text-slate-800">메모 전송 이력</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-200">
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                            <Search size={14} />
                            검색
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center text-slate-500 text-sm py-8">로딩 중...</div>
                    ) : memos.length === 0 ? (
                        <div className="text-center text-slate-500 text-sm py-8">메모가 없습니다.</div>
                    ) : (
                        memos.map((memo: any, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <div className="text-xs text-slate-500 mb-1">
                                    {new Date(memo.createdAt).toLocaleString("ko-KR")}
                                </div>
                                <div className="text-sm text-slate-800">{memo.content}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
