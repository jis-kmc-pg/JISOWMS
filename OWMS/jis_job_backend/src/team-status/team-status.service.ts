import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTeamStatusDto } from './dto/create-team-status.dto';
import { Role } from '@prisma/client';

const SENIOR_ROLES: Role[] = [Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO];

@Injectable()
export class TeamStatusService {
    private readonly logger = new Logger(TeamStatusService.name);

    constructor(private prisma: PrismaService) {}

    private async getUserTeamId(userId: number): Promise<number> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true },
        });
        if (!user?.teamId) throw new BadRequestException('소속 팀이 없습니다. 팀 배정 후 작성할 수 있습니다.');
        return user.teamId;
    }

    async findWeekly(departmentId: number, startDate: string, endDate: string) {
        // 해당 부서의 모든 팀 ID 조회
        const teams = await this.prisma.team.findMany({
            where: { departmentId },
            select: { id: true, name: true },
            orderBy: { orderIndex: 'asc' },
        });
        const teamIds = teams.map((t) => t.id);

        // 해당 기간 + 해당 부서 팀들의 보고서 조회
        const reports = await this.prisma.teamStatusReport.findMany({
            where: {
                teamId: { in: teamIds },
                reportDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            include: {
                user: { select: { id: true, name: true, position: true } },
                team: { select: { id: true, name: true } },
                items: { orderBy: { id: 'asc' } },
            },
            orderBy: [{ team: { orderIndex: 'asc' } }, { reportDate: 'desc' }],
        });

        return { data: reports, teams };
    }

    async findOne(id: number) {
        const report = await this.prisma.teamStatusReport.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, position: true } },
                team: { select: { id: true, name: true } },
                items: { orderBy: { id: 'asc' } },
            },
        });
        if (!report) throw new NotFoundException('보고서를 찾을 수 없습니다.');
        return report;
    }

    async create(userId: number, dto: CreateTeamStatusDto) {
        const teamId = await this.getUserTeamId(userId);
        return this.prisma.teamStatusReport.create({
            data: {
                userId,
                teamId,
                reportDate: new Date(dto.reportDate),
                items: {
                    create: dto.items.map((item) => ({
                        category: item.category,
                        itemDate: new Date(item.itemDate),
                        content: item.content,
                    })),
                },
            },
            include: {
                items: true,
                user: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
            },
        });
    }

    async update(id: number, userId: number, userRole: Role, dto: CreateTeamStatusDto) {
        const report = await this.prisma.teamStatusReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('보고서를 찾을 수 없습니다.');
        if (report.userId !== userId && !SENIOR_ROLES.includes(userRole)) {
            throw new ForbiddenException('작성자 또는 부서장 이상만 수정할 수 있습니다.');
        }

        // 기존 항목 삭제 후 재생성
        await this.prisma.teamStatusItem.deleteMany({ where: { reportId: id } });

        return this.prisma.teamStatusReport.update({
            where: { id },
            data: {
                reportDate: new Date(dto.reportDate),
                items: {
                    create: dto.items.map((item) => ({
                        category: item.category,
                        itemDate: new Date(item.itemDate),
                        content: item.content,
                    })),
                },
            },
            include: {
                items: true,
                user: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
            },
        });
    }

    // ── 대시보드 위젯 전용 ──

    /** 위젯: 현재 사용자의 금주 팀현황 제출 여부 */
    async getSubmittedStatus(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true },
        });

        if (!user?.teamId) {
            return { submitted: false };
        }

        // 금주 월~일 범위
        const now = new Date();
        const monday = new Date(now);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const report = await this.prisma.teamStatusReport.findFirst({
            where: {
                teamId: user.teamId,
                reportDate: { gte: monday, lte: sunday },
            },
        });

        return { submitted: !!report };
    }

    /** 위젯: 부서 내 팀별 금주 제출 현황 리스트 */
    async getTeamSubmissionList(departmentId: number) {
        if (!departmentId) return [];

        const now = new Date();
        const monday = new Date(now);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const teams = await this.prisma.team.findMany({
            where: { departmentId },
            select: { id: true, name: true },
            orderBy: { orderIndex: 'asc' },
        });

        const reports = await this.prisma.teamStatusReport.findMany({
            where: {
                teamId: { in: teams.map((t) => t.id) },
                reportDate: { gte: monday, lte: sunday },
            },
            select: { teamId: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });

        const reportByTeam = new Map(
            reports.map((r) => [r.teamId, r]),
        );

        return teams.map((team) => {
            const report = reportByTeam.get(team.id);
            return {
                teamName: team.name,
                submittedAt: report?.createdAt || null,
                status: report ? 'submitted' : 'pending',
            };
        });
    }

    async remove(id: number, userId: number, userRole: Role) {
        const report = await this.prisma.teamStatusReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('보고서를 찾을 수 없습니다.');
        if (report.userId !== userId && !SENIOR_ROLES.includes(userRole)) {
            throw new ForbiddenException('작성자 또는 부서장 이상만 삭제할 수 있습니다.');
        }

        return this.prisma.teamStatusReport.delete({ where: { id } });
    }
}
