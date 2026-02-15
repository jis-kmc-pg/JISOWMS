import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DateUtil } from '../common/utils/date.util';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) { }

  async getDashboardStats(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, departmentId: true, teamId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Role-based Strategy
    switch (user.role as string) {
      case 'CEO':
      case 'EXECUTIVE':
        return this.getCompanyStats();
      case 'DEPT_HEAD':
        return this.getDepartmentStats(user.departmentId);
      case 'TEAM_LEAD':
      case 'TEAM_LEADER':
        return this.getTeamStats(user.teamId);
      default:
        return this.getPersonalStats(userId);
    }
  }

  // --- 1. CEO / Executive (전사 현황) ---
  private async getCompanyStats() {
    const today = DateUtil.setStartOfDay(new Date());

    const totalEmployees = await this.prisma.user.count();

    // 금일 휴가자
    const todayVacations = await this.prisma.vacation.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    // 부서별 연차 사용 현황 (Pie/Bar Chart용)
    const deptStats = await this.prisma.user.groupBy({
      by: ['departmentId'],
      _count: { _all: true },
    });

    // 부서 명 매핑을 위한 추가 조회
    const departments = await this.prisma.department.findMany();
    const deptUsage = deptStats.map((stat) => {
      const dept = departments.find((d) => d.id === stat.departmentId);
      return {
        name: dept?.name || 'Unknown',
        count: stat._count._all,
      };
    });

    return {
      scope: 'COMPANY',
      kpi: {
        totalEmployees,
        todayOnLeave: todayVacations,
        utilizationRate: 0, // TODO: Calculate actual rate
      },
      charts: {
        deptUsage,
      },
    };
  }

  // --- 2. Department Head (부서 현황) ---
  private async getDepartmentStats(deptId: number | null) {
    if (!deptId)
      return { scope: 'DEPARTMENT', error: 'No Department Assigned' };

    const today = DateUtil.setStartOfDay(new Date());

    const deptMembers = await this.prisma.user.count({
      where: { departmentId: deptId },
    });

    // 부서 내 금일 휴가자
    const todayOnLeave = await this.prisma.vacation.count({
      where: {
        status: 'APPROVED',
        user: { departmentId: deptId },
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    return {
      scope: 'DEPARTMENT',
      kpi: {
        deptMembers,
        todayOnLeave,
        avgUtilization: 0,
      },
      charts: {
        // TODO: Team comparison within dept
      },
    };
  }

  // --- 3. Team Lead (팀 현황) ---
  private async getTeamStats(teamId: number | null) {
    if (!teamId) return { scope: 'TEAM', error: 'No Team Assigned' };

    const today = new Date();
    // 1. Calculate Date Ranges
    const startOfWeek = DateUtil.getMonday(today);
    const endOfWeek = DateUtil.setEndOfDay(new Date(startOfWeek.getTime() + 6 * 86400000));

    const startOfNextWeek = DateUtil.setStartOfDay(new Date(endOfWeek.getTime() + 1));
    const endOfNextWeek = DateUtil.setEndOfDay(new Date(startOfNextWeek.getTime() + 6 * 86400000));

    // 2. Fetch Team Members & Vacations
    const teamMembers = await this.prisma.user.findMany({
      where: { teamId },
      include: {
        vacations: {
          where: {
            status: 'APPROVED',
            startDate: { gte: today },
          },
          orderBy: { startDate: 'asc' },
          take: 3,
        },
        jobs: {
          where: {
            jobDate: {
              gte: startOfWeek,
              lte: endOfNextWeek,
            },
          },
          include: { project: true },
        },
      },
    });

    // 3. Aggregate Work Stats
    const weeklyWorkStats = teamMembers.map((m) => {
      const thisWeekJobs = m.jobs.filter(
        (j) => j.jobDate >= startOfWeek && j.jobDate <= endOfWeek,
      );
      const nextWeekJobs = m.jobs.filter(
        (j) => j.jobDate >= startOfNextWeek && j.jobDate <= endOfNextWeek,
      );

      return {
        name: m.name,
        thisWeek: thisWeekJobs.length,
        nextWeek: nextWeekJobs.length,
      };
    });

    // 4. Aggregate Job Name Weight (Stacked Bar & Pie)
    const jobStatsMap = new Map<
      string,
      { name: string; weight: number; issueCount: number }
    >();

    teamMembers.forEach((m) => {
      m.jobs.forEach((j) => {
        // 프로젝트가 있으면 프로젝트명, 없으면 '일반 업무'로 통합
        const jobName = j.project?.projectName || '일반 업무';
        const current = jobStatsMap.get(jobName) || {
          name: jobName,
          weight: 0,
          issueCount: 0,
        };

        // 가중치 계산 (단순 건수 + 이슈 가중치)
        current.weight += 1;
        if (j.isIssue) current.issueCount += 1;

        jobStatsMap.set(jobName, current);
      });
    });

    const jobNameStats = Array.from(jobStatsMap.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    // 5. Next Week Plans (List)
    const nextWeekPlans = teamMembers
      .flatMap((m) =>
        m.jobs
          .filter(
            (j) => j.jobDate >= startOfNextWeek && j.jobDate <= endOfNextWeek,
          )
          .map((j) => ({
            id: j.id,
            memberName: m.name,
            date: j.jobDate,
            title: j.title || '업무명 없음',
            projectName: j.project?.projectName || '일반 업무',
          })),
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    return {
      scope: 'TEAM',
      members: teamMembers.map((m) => ({
        name: m.name,
        position: m.position,
        upcomingLeave: m.vacations,
      })),
      stats: {
        weeklyWorkStats,
        jobNameStats,
        nextWeekPlans,
      },
    };
  }

  // --- 4. Personal (개인 현황) ---
  private async getPersonalStats(userId: number) {
    const today = DateUtil.setStartOfDay(new Date());
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = DateUtil.setEndOfDay(new Date(today.getFullYear(), 11, 31));

    const myVacations = await this.prisma.vacation.findMany({
      where: {
        userId,
        startDate: { gte: today, lte: yearEnd }, // 남은 휴가
        status: { in: ['APPROVED', 'PENDING'] },
      },
      orderBy: { startDate: 'asc' },
    });

    // 사용한 휴가 계산 (금년도 전체)
    const usedVacations = await this.prisma.vacation.findMany({
      where: {
        userId,
        startDate: { gte: yearStart, lte: yearEnd },
        status: 'APPROVED',
      },
    });

    // TODO: Use shared calculation logic from VacationService (DRY)
    // For now, simplified count
    let usedDays = 0;
    usedVacations.forEach(() => usedDays++); // Simple count for prototype

    return {
      scope: 'PERSONAL',
      kpi: {
        usedDays,
        remainingDays: 15 - usedDays, // Mock
      },
      recent: myVacations.slice(0, 5), // Upcoming vacations
    };
  }
}
