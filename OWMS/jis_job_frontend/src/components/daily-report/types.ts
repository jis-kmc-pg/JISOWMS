export interface JobItem {
    id?: number;
    tempId?: string;
    title: string;
    content: string;
    projectId: number | null;
    isIssue: boolean;
    timeSpent: number;
    isCustomTitle?: boolean;
    project?: ProjectItem;
    [key: string]: unknown;
}

export interface ProjectItem {
    id: number;
    projectName: string;
    clientName?: string;
}

export interface WeeklyNavStatus {
    date: string;
    dayName: string;
    hasJob: boolean;
    workType: string;
    holidayName?: string;
    isToday: boolean;
}

export interface SystemMemo {
    id: number;
    content: string;
    pinned: boolean;
    createdAt: string;
}

export interface PastJobResult {
    id?: number;
    title: string;
    content: string;
    projectId: number | null;
    timeSpent: number;
    jobDate: string;
    project?: ProjectItem;
}

// 날짜 포맷 (YYYY-MM-DD, Local Time)
export const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 버튼용 간단한 날짜 포맷 (MM.DD 요일)
export const formatDateSimple = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}.${day} (${weekDay})`;
};

// 메인 표시용 날짜 포맷 (YYYY.MM.DD 요일)
export const formatDateFull = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${year}.${month}.${day} (${weekDay})`;
};

// 주 시작일 계산 (일요일 기준)
export const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
};

import {
    MAX_CHARS_PER_LINE,
    MAX_WEEKLY_NOTE_LINES,
    MAX_WEEKLY_NOTE_CHARS_PER_LINE
} from '../../constants/validation';

// 1줄당 최대 글자수 초과 여부 체크
export const isLineExceeded = (text: string) => {
    if (!text) return false;
    const lines = text.split('\n');
    return lines.some(line => line.length > MAX_CHARS_PER_LINE);
};

// 주간 정보 유효성 체크 (최대 줄 수 또는 줄당 최대 글자수 초과)
export const isWeeklyNoteExceeded = (text: string) => {
    if (!text) return false;
    const lines = text.split('\n');
    if (lines.length > MAX_WEEKLY_NOTE_LINES) return true;
    return lines.some(line => line.length > MAX_WEEKLY_NOTE_CHARS_PER_LINE);
};
