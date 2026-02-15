/**
 * KST (Korea Standard Time) 기준 날짜 처리를 위한 유틸리티
 */
export class DateUtil {
    /**
     * Date 객체를 해당 날짜의 시작 시점(00:00:00.000)으로 조정합니다.
     */
    static setStartOfDay(date: Date): Date {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Date 객체를 해당 날짜의 종료 시점(23:59:59.999)으로 조정합니다.
     */
    static setEndOfDay(date: Date): Date {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    /**
     * KST 날짜 문자열(YYYY-MM-DD)을 생성합니다.
     * 타임존 오차를 방지하기 위해 9시간을 더하여 처리합니다.
     */
    static toKSTString(date: Date): string {
        const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
        return kstDate.toISOString().split('T')[0];
    }

    /**
     * 특정 날짜가 속한 주의 월요일(시작일)을 구합니다.
     */
    static getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return this.setStartOfDay(monday);
    }
}
