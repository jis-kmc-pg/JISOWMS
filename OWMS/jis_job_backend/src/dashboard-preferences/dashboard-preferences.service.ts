import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';

// 역할별 기본 위젯 프리셋
const DEFAULT_PRESETS: Record<string, string[]> = {
    MEMBER: [
        'weekly-report-status', 'vacation-status', 'quick-links',
        'dispatch-overview', 'room-availability', 'recent-notices', 'board-latest',
    ],
    TEAM_LEADER: [
        'team-report-rate', 'pending-approvals', 'weekly-report-status', 'vacation-status',
        'team-attendance', 'team-meeting-status', 'team-projects',
        'team-report-summary', 'team-work-calendar',
    ],
    DEPT_HEAD: [
        'dept-headcount', 'pending-approvals',
        'dept-report-comparison', 'dept-vacation-stats',
        'dept-attendance-stats', 'dept-resource-util', 'dept-projects',
    ],
    EXECUTIVE: [
        'executive-approvals', 'company-headcount',
        'company-report-rate', 'company-vacation-trend',
        'vehicle-utilization', 'company-meeting-util',
        'company-projects', 'workforce-utilization',
    ],
    CEO: [
        'executive-approvals', 'company-headcount',
        'company-report-rate', 'company-vacation-trend',
        'vehicle-utilization', 'company-meeting-util',
        'company-projects', 'workforce-utilization', 'company-notices-mgmt',
    ],
};

@Injectable()
export class DashboardPreferencesService {
    constructor(private prisma: PrismaService) {}

    async getPreferences(userId: number) {
        const pref = await this.prisma.dashboardPreference.findUnique({
            where: { userId },
        });

        if (pref) {
            return { layout: pref.layout };
        }

        // 설정이 없으면 역할별 기본 프리셋 반환
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        const role = (user?.role as string) || 'MEMBER';
        const presetIds = DEFAULT_PRESETS[role] || DEFAULT_PRESETS.MEMBER;

        return {
            layout: presetIds.map((id, order) => ({
                id,
                enabled: true,
                order,
            })),
        };
    }

    async savePreferences(userId: number, layout: any[]) {
        return this.prisma.dashboardPreference.upsert({
            where: { userId },
            create: { userId, layout },
            update: { layout },
        });
    }

    async resetPreferences(userId: number) {
        await this.prisma.dashboardPreference.deleteMany({
            where: { userId },
        });
        return this.getPreferences(userId);
    }
}
