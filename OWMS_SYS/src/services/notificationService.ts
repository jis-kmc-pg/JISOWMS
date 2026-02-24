import { io, Socket } from 'socket.io-client';
import { sendNotification } from '@tauri-apps/plugin-notification';

interface VacationNotification {
  type: 'vacation_request' | 'vacation_approved';
  userId: number;
  userName: string;
  startDate: string;
  endDate: string;
  vacationType: string;
  timestamp: number;
}

class NotificationService {
  private socket: Socket | null = null;
  // @ts-ignore - userId will be used for future user-specific features
  private _userId: number | null = null;

  connect(userId: number, apiUrl: string) {
    if (this.socket?.connected) {
      console.log('Already connected to notification server');
      return;
    }

    this._userId = userId;
    const socketUrl = apiUrl.replace(/\/api$/, ''); // http://localhost:4000

    this.socket = io(`${socketUrl}/notifications`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
      // 사용자 등록
      this.socket?.emit('register', { userId });
    });

    this.socket.on('registered', (data: any) => {
      console.log('Registered with notification server:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // 연차 신청 알림 수신 (팀장, 부서장)
    this.socket.on('vacation:request', (notification: VacationNotification) => {
      console.log('Received vacation request notification:', notification);
      this.showVacationRequestNotification(notification);
    });

    // 연차 승인 알림 수신 (신청자)
    this.socket.on('vacation:approved', (notification: VacationNotification) => {
      console.log('Received vacation approved notification:', notification);
      this.showVacationApprovedNotification(notification);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._userId = null;
      console.log('Disconnected from notification service');
    }
  }

  private async showVacationRequestNotification(notification: VacationNotification) {
    const startDate = new Date(notification.startDate).toLocaleDateString('ko-KR');
    const endDate = new Date(notification.endDate).toLocaleDateString('ko-KR');

    await sendNotification({
      title: '📅 연차 신청 알림',
      body: `${notification.userName}님이 연차를 신청했습니다.\n기간: ${startDate} ~ ${endDate}\n유형: ${notification.vacationType}`,
    });
  }

  private async showVacationApprovedNotification(notification: VacationNotification) {
    const startDate = new Date(notification.startDate).toLocaleDateString('ko-KR');
    const endDate = new Date(notification.endDate).toLocaleDateString('ko-KR');

    await sendNotification({
      title: '✅ 연차 승인 알림',
      body: `연차 신청이 승인되었습니다!\n기간: ${startDate} ~ ${endDate}\n유형: ${notification.vacationType}`,
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getUserId(): number | null {
    return this._userId;
  }
}

export const notificationService = new NotificationService();
