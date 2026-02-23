import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
    message: string;
    type?: "success" | "error";
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
    const textColor = type === "success" ? "text-green-800" : "text-red-800";
    const Icon = type === "success" ? CheckCircle : XCircle;
    const iconColor = type === "success" ? "text-green-600" : "text-red-600";

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className={`${bgColor} border rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 min-w-[300px]`}>
                <Icon size={20} className={iconColor} />
                <p className={`${textColor} text-sm font-medium flex-1`}>{message}</p>
                <button
                    onClick={onClose}
                    className={`${textColor} hover:opacity-70 transition`}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
