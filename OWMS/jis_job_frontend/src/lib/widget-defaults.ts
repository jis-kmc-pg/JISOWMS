import { WidgetPref } from '../types/dashboard';

type RoleKey = 'MEMBER' | 'TEAM_LEADER' | 'DEPT_HEAD' | 'EXECUTIVE' | 'CEO';

const DEFAULT_PRESETS: Record<RoleKey, string[]> = {
    MEMBER: [
        'today-jobs',
        'weekly-completion',
        'vacation-balance',
        'upcoming-vacations',
        'recent-notices',
        'my-dispatches',
    ],
    TEAM_LEADER: [
        'team-entry-rate',
        'team-members-list',
        'weekly-work-chart',
        'job-stats-chart',
        'team-calendar',
        'next-week-plans',
        'today-jobs',
        'vacation-balance',
    ],
    DEPT_HEAD: [
        'vacation-approvals',
        'dept-team-workload',
        'dept-entry-rate',
        'dept-vacation-overview',
        'dept-report-status',
        'meeting-utilization',
    ],
    EXECUTIVE: [
        'total-employees-kpi',
        'company-workload',
        'company-entry-rate',
        'dept-vacation-chart',
        'monthly-vacation-trend',
        'company-activity',
        'attendance-rate',
    ],
    CEO: [
        'total-employees-kpi',
        'company-workload',
        'company-entry-rate',
        'dept-vacation-chart',
        'monthly-vacation-trend',
        'company-activity',
        'attendance-rate',
    ],
};

export function getDefaultPreset(role: string): WidgetPref[] {
    const key = (role as RoleKey) in DEFAULT_PRESETS ? (role as RoleKey) : 'MEMBER';
    const ids = DEFAULT_PRESETS[key];
    return ids.map((id, index) => ({
        id,
        enabled: true,
        order: index,
    }));
}
