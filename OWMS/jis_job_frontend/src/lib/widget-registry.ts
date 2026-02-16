import { WidgetDef, hasRolePermission } from '../types/dashboard';

export const WIDGET_REGISTRY: WidgetDef[] = [
    // ══════════════════════════════════════
    // MEMBER (7개) — 개인
    // ══════════════════════════════════════
    {
        id: 'weekly-report-status',
        title: '주간업무 작성현황',
        description: '이번주/차주 작성 여부, 미작성 시 알림 표시',
        category: 'personal',
        minRole: 'MEMBER',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/reports/my-status',
    },
    {
        id: 'dispatch-overview',
        title: '배차 현황',
        description: '전체 차량 상태 캘린더 + 내 예약 하이라이트',
        category: 'personal',
        minRole: 'MEMBER',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/dispatch',
    },
    {
        id: 'room-availability',
        title: '회의실 예약',
        description: '오늘/이번주 회의실 예약 현황 + 빈 회의실 표시',
        category: 'personal',
        minRole: 'MEMBER',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/meeting-room/reservation',
    },
    {
        id: 'vacation-status',
        title: '연차 현황',
        description: '총 연차 / 사용 / 잔여 (도넛 차트)',
        category: 'personal',
        minRole: 'MEMBER',
        size: 'small',
        rendererType: 'custom',
        apiPath: '/vacations/summary',
    },
    {
        id: 'recent-notices',
        title: '공지사항',
        description: '최신 공지 3~5건, 새 공지 뱃지 표시',
        category: 'personal',
        minRole: 'MEMBER',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/board/notice/posts?limit=5',
    },
    {
        id: 'board-latest',
        title: '게시판 최신글',
        description: '자유게시판 등 최신글 미리보기',
        category: 'personal',
        minRole: 'MEMBER',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/board/recent-all',
    },
    {
        id: 'quick-links',
        title: '자주 쓰는 메뉴',
        description: '업무보고 작성, 배차 신청 등 바로가기',
        category: 'personal',
        minRole: 'MEMBER',
        size: 'small',
        rendererType: 'custom',
        apiPath: '',
    },

    // ══════════════════════════════════════
    // TEAM_LEADER (9개) — 팀
    // ══════════════════════════════════════
    {
        id: 'team-report-rate',
        title: '팀원 업무보고 작성률',
        description: '작성 완료/미작성 인원, 미작성자 이름 표시',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'small',
        rendererType: 'custom',
        apiPath: '/work-status/summary',
    },
    {
        id: 'team-report-summary',
        title: '팀원 업무보고 요약',
        description: '팀원별 이번주 핵심 업무 한줄 요약 리스트',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/work-status/weekly',
    },
    {
        id: 'team-vacation-table',
        title: '팀 연차 현황표',
        description: '팀원 전체 연차 잔여/사용 테이블',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/vacations/admin/stats',
    },
    {
        id: 'team-attendance',
        title: '팀 근태 현황',
        description: '오늘 출근/재택/외근/휴가 인원 한눈에',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/metrics/dashboard',
    },
    {
        id: 'team-dispatch-schedule',
        title: '팀 배차 일정',
        description: '팀원들의 배차 예약 전체 캘린더',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/dispatch',
    },
    {
        id: 'team-meeting-status',
        title: '팀 회의실 사용 현황',
        description: '팀 전체 회의 스케줄',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/meeting-room/reservation',
    },
    {
        id: 'team-projects',
        title: '팀 프로젝트 현황',
        description: 'IT 프로젝트별 인원수 현황',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/reports/projects',
    },
    {
        id: 'team-work-calendar',
        title: '팀원 근무 캘린더',
        description: '누가 언제 휴가/외근인지 월간 캘린더로 표시',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'large',

        rendererType: 'calendar',
        apiPath: '/metrics/dashboard',
    },
    {
        id: 'pending-approvals',
        title: '승인 대기함',
        description: '연차 등 승인 대기 건수',
        category: 'team',
        minRole: 'TEAM_LEADER',
        size: 'small',
        rendererType: 'custom',
        apiPath: '/vacations/dept-pending-count',
    },

    // ══════════════════════════════════════
    // DEPT_HEAD (7개) — 부서
    // ══════════════════════════════════════
    {
        id: 'dept-report-comparison',
        title: '팀별 업무보고 작성률 비교',
        description: '팀 단위로 작성률 막대 차트',
        category: 'dept',
        minRole: 'DEPT_HEAD',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/work-status/summary',
    },
    {
        id: 'dept-headcount',
        title: '부서 전체 인원 현황',
        description: '총원 / 오늘 출근 / 휴가 / 외근 숫자 카드',
        category: 'dept',
        minRole: 'DEPT_HEAD',
        size: 'small',
        rendererType: 'custom',
        apiPath: '/metrics/dashboard',
    },
    {
        id: 'dept-vacation-stats',
        title: '부서 연차 사용 통계',
        description: '팀별 연차 사용률 비교 그래프',
        category: 'dept',
        minRole: 'DEPT_HEAD',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/vacations/admin/stats',
    },
    {
        id: 'dept-attendance-stats',
        title: '부서 근태 통계',
        description: '팀별 지각률, 출근율 등 비교',
        category: 'dept',
        minRole: 'DEPT_HEAD',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/metrics/attendance',
    },
    {
        id: 'dept-projects',
        title: '전체 프로젝트 현황',
        description: '부서 내 모든 프로젝트 상태 요약',
        category: 'dept',
        minRole: 'DEPT_HEAD',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/reports/projects',
    },
    {
        id: 'dept-resource-util',
        title: '부서 배차/회의실 활용률',
        description: '자원이 효율적으로 쓰이고 있는지 통계',
        category: 'dept',
        minRole: 'DEPT_HEAD',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/metrics/dispatch-stats',
    },
    {
        id: 'report-keyword-analysis',
        title: '업무보고 키워드 분석',
        description: '자주 등장하는 키워드 워드클라우드',
        category: 'dept',
        minRole: 'DEPT_HEAD',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/work-status/keywords',
    },

    // ══════════════════════════════════════
    // EXECUTIVE/CEO (9개) — 전사
    // ══════════════════════════════════════
    {
        id: 'company-headcount',
        title: '전사 인원 현황',
        description: '부서별 인원, 오늘 출근율 숫자 카드',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/metrics/dashboard',
    },
    {
        id: 'company-report-rate',
        title: '부서별 업무보고 작성률',
        description: '전사 부서 비교 차트',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/work-status/summary',
    },
    {
        id: 'company-vacation-trend',
        title: '전사 연차 사용 트렌드',
        description: '월별 추이 라인 차트',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/metrics/vacation-trend',
    },
    {
        id: 'company-projects',
        title: '전사 프로젝트 현황',
        description: '주요 프로젝트 상태',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/reports/projects?status=ALL',
    },
    {
        id: 'vehicle-utilization',
        title: '차량 가동률',
        description: '전체 배차 활용 통계',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/metrics/dispatch-stats',
    },
    {
        id: 'company-meeting-util',
        title: '회의실 활용률',
        description: '전사 회의실 사용 통계',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/metrics/room-stats',
    },
    {
        id: 'company-notices-mgmt',
        title: '공지사항 관리',
        description: '최신 공지 + 조회율',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'medium',

        rendererType: 'custom',
        apiPath: '/board/notice/posts?limit=5',
    },
    {
        id: 'executive-approvals',
        title: '중요 결재 대기',
        description: '임원 승인 필요 건',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'small',
        rendererType: 'custom',
        apiPath: '/vacations/dept-requests',
    },
    {
        id: 'workforce-utilization',
        title: '인력 가동률',
        description: '개발자들의 프로젝트 투입률',
        category: 'company',
        minRole: 'EXECUTIVE',
        size: 'large',

        rendererType: 'custom',
        apiPath: '/metrics/dashboard',
    },
];

export function getWidgetById(id: string): WidgetDef | undefined {
    return WIDGET_REGISTRY.find(w => w.id === id);
}

export function getWidgetsForRole(role: string): WidgetDef[] {
    return WIDGET_REGISTRY.filter(w => hasRolePermission(role, w.minRole));
}
