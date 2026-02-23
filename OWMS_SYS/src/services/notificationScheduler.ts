import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import apiClient from '../api/client';

/** 알림 권한 확인 및 요청 */
export async function ensureNotificationPermission(): Promise<boolean> {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
    }
    return permissionGranted;
}

/** 금요일인지 확인 */
function isFriday(): boolean {
    const now = new Date();
    return now.getDay() === 5; // 0=일, 5=금
}

/** 현재 시간이 9시 또는 10시인지 확인 */
function isTargetHour(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour === 9 || hour === 10;
}

/** 이미 오늘 해당 시간에 알림을 보냈는지 확인 (중복 방지) */
function hasNotifiedToday(key: string): boolean {
    const lastNotified = localStorage.getItem(key);
    if (!lastNotified) return false;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return lastNotified === today;
}

/** 알림 기록 저장 */
function markAsNotified(key: string) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(key, today);
}

/** 일반 직원: 업무보고 미작성 확인 및 알림 */
export async function checkAndNotifyMemberReport(userId: number) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await apiClient.get(`/work-status/weekly?date=${today}`);
        const weekData = res.data as {
            date: string;
            dayOfWeek: string;
            users: { id: number; name: string; status: string }[];
        }[];

        // 나의 미작성 건수 확인
        let missingCount = 0;
        weekData.forEach((day) => {
            const myStatus = day.users.find((u) => u.id === userId);
            if (myStatus && myStatus.status === 'MISSING') {
                missingCount++;
            }
        });

        if (missingCount > 0) {
            const notifKey = `notif-member-${today}`;
            if (!hasNotifiedToday(notifKey)) {
                await sendNotification({
                    title: '📝 업무보고 작성 알림',
                    body: `미작성 업무보고가 ${missingCount}건 있습니다. 지금 작성하세요!`,
                });
                markAsNotified(notifKey);
            }
        }
    } catch (error) {
        console.error('업무보고 확인 실패:', error);
    }
}

/** 팀장: 팀원현황보고 미작성 확인 및 알림 */
export async function checkAndNotifyTeamLeaderReport() {
    try {
        const res = await apiClient.get('/team-status/submitted-status');
        const data = res.data as { hasThisWeek: boolean };

        if (!data.hasThisWeek) {
            const today = new Date().toISOString().split('T')[0];
            const notifKey = `notif-teamleader-${today}`;
            if (!hasNotifiedToday(notifKey)) {
                await sendNotification({
                    title: '📊 팀원현황보고 작성 알림',
                    body: '금주 팀원현황보고가 작성되지 않았습니다. 지금 작성하세요!',
                });
                markAsNotified(notifKey);
            }
        }
    } catch (error) {
        console.error('팀원현황보고 확인 실패:', error);
    }
}

/** 스케줄러: 금요일 9시, 10시에 작성 현황 확인 및 알림 */
export async function scheduleNotifications(userId: number, userRole: string) {
    // 알림 권한 확인
    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) {
        console.warn('알림 권한이 없습니다.');
        return;
    }

    // 1분마다 체크 (정확한 시간에 알림 발송)
    setInterval(() => {
        const now = new Date();
        const minute = now.getMinutes();

        // 정각에만 체크 (9:00, 10:00)
        if (minute !== 0) return;

        // 금요일 + 9시 또는 10시인지 확인
        if (!isFriday() || !isTargetHour()) return;

        // 역할별 알림 발송
        if (userRole === 'TEAM_LEADER') {
            // 팀장: 팀원현황보고만 확인
            checkAndNotifyTeamLeaderReport();
        } else if (userRole === 'MEMBER') {
            // 일반 직원: 업무보고 확인
            checkAndNotifyMemberReport(userId);
        }
        // 부서장/임원/CEO: 알람 없음
    }, 60 * 1000); // 1분마다 체크
}
