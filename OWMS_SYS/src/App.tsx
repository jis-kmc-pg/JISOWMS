import "./App.css";
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useUserStore } from "./store/userStore";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { scheduleNotifications } from "./services/notificationScheduler";

function App() {
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  // 시스템 트레이 로그아웃 이벤트 수신
  useEffect(() => {
    const unlisten = listen("tray-logout", () => {
      logout();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [logout]);

  // 로그인 후 알림 스케줄러 시작 (금요일 9시, 10시 알림)
  useEffect(() => {
    if (user) {
      scheduleNotifications(user.id, user.role);
    }
  }, [user]);

  return <>{user ? <Dashboard /> : <Login />}</>;
}

export default App;
