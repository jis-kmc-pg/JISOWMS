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

  // --- 위젯용 집계 API ---

  /** 월간 업무 추이 (최근 6개월, 부서/전사) */
  async getMonthlyTrend(deptId?: number) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const where: any = { jobDate: { gte: sixMonthsAgo } };
    if (deptId) {
      where.user = { departmentId: deptId };
    }

    const jobs = await this.prisma.job.findMany({
      where,
      select: { jobDate: true },
    });

    const monthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, 0);
    }

    jobs.forEach((j) => {
      const key = `${j.jobDate.getFullYear()}-${String(j.jobDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      }
    });

    return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
  }

  /** 배차 통계 (기간별, 부서/전사) */
  async getDispatchStats(deptId?: number) {
    const now = new Date();
    const startOfWeek = DateUtil.getMonday(now);
    const endOfWeek = DateUtil.setEndOfDay(new Date(startOfWeek.getTime() + 6 * 86400000));

    const where: any = {
      status: { not: 'CANCELLED' },
      startDate: { gte: startOfWeek, lte: endOfWeek },
    };
    if (deptId) {
      where.user = { departmentId: deptId };
    }

    const dispatches = await this.prisma.dispatch.findMany({
      where,
      include: { vehicle: { select: { modelName: true, licensePlate: true } } },
    });

    // 차량별 집계
    const vehicleMap = new Map<string, number>();
    dispatches.forEach((d) => {
      const key = `${d.vehicle.modelName} (${d.vehicle.licensePlate})`;
      vehicleMap.set(key, (vehicleMap.get(key) || 0) + 1);
    });

    return {
      totalDispatches: dispatches.length,
      byVehicle: Array.from(vehicleMap.entries()).map(([name, count]) => ({ name, count })),
    };
  }

  /** 회의실 가동률 */
  async getRoomStats(deptId?: number) {
    const now = new Date();
    const startOfWeek = DateUtil.getMonday(now);
    const endOfWeek = DateUtil.setEndOfDay(new Date(startOfWeek.getTime() + 6 * 86400000));

    const rooms = await this.prisma.meetingRoom.findMany({
      where: { isActive: true },
    });

    const where: any = {
      status: { not: 'CANCELLED' },
      startDate: { gte: startOfWeek, lte: endOfWeek },
    };
    if (deptId) {
      where.user = { departmentId: deptId };
    }

    const reservations = await this.prisma.meetingRoomReservation.findMany({
      where,
      include: { room: { select: { name: true } } },
    });

    // 회의실별 예약 건수
    const roomMap = new Map<string, number>();
    rooms.forEach((r) => roomMap.set(r.name, 0));
    reservations.forEach((r) => {
      roomMap.set(r.room.name, (roomMap.get(r.room.name) || 0) + 1);
    });

    // 가동률: 예약 시간 / (회의실 수 × 주간 근무시간)
    let totalBookedHours = 0;
    reservations.forEach((r) => {
      totalBookedHours += (r.endDate.getTime() - r.startDate.getTime()) / 3600000;
    });
    const totalAvailableHours = rooms.length * 40; // 주 40시간 기준
    const utilizationRate = totalAvailableHours > 0
      ? Math.round((totalBookedHours / totalAvailableHours) * 100)
      : 0;

    return {
      totalReservations: reservations.length,
      utilizationRate,
      byRoom: Array.from(roomMap.entries()).map(([name, count]) => ({ name, count })),
    };
  }

  /** 출근율 (ActivityLog LOGIN 기반, 부서별/일별) */
  async getAttendanceStats(startDate?: string, endDate?: string) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : DateUtil.getMonday(now);
    const end = endDate ? new Date(endDate) : DateUtil.setEndOfDay(new Date(start.getTime() + 6 * 86400000));

    // 로그인 기록에서 일자별 고유 사용자 추출
    const loginLogs = await this.prisma.activityLog.findMany({
      where: {
        action: 'LOGIN',
        statusCode: 200,
        createdAt: { gte: start, lte: end },
        userId: { not: null },
      },
      select: { userId: true, createdAt: true },
    });

    // 부서별 전체 인원
    const departments = await this.prisma.department.findMany();
    const users = await this.prisma.user.findMany({
      select: { id: true, departmentId: true },
    });

    // 일별-부서별 출근자 집계
    const dayMap = new Map<string, Map<number, Set<number>>>();
    loginLogs.forEach((log) => {
      const dateKey = log.createdAt.toISOString().slice(0, 10);
      if (!dayMap.has(dateKey)) dayMap.set(dateKey, new Map());
      const deptMap = dayMap.get(dateKey)!;

      const user = users.find((u) => u.id === log.userId);
      const deptId = user?.departmentId || 0;
      if (!deptMap.has(deptId)) deptMap.set(deptId, new Set());
      deptMap.get(deptId)!.add(log.userId!);
    });

    const deptMemberCounts = new Map<number, number>();
    users.forEach((u) => {
      const deptId = u.departmentId || 0;
      deptMemberCounts.set(deptId, (deptMemberCounts.get(deptId) || 0) + 1);
    });

    const result: any[] = [];
    dayMap.forEach((deptMap, dateKey) => {
      departments.forEach((dept) => {
        const loggedIn = deptMap.get(dept.id)?.size || 0;
        const total = deptMemberCounts.get(dept.id) || 1;
        result.push({
          date: dateKey,
          deptId: dept.id,
          deptName: dept.name,
          loggedIn,
          total,
          rate: Math.round((loggedIn / total) * 100),
        });
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date) || a.deptId - b.deptId);
  }

  /** 월간 연차 사용 추이 (전사) */
  async getVacationTrend(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59);

    const vacations = await this.prisma.vacation.findMany({
      where: {
        status: 'APPROVED',
        startDate: { gte: yearStart, lte: yearEnd },
      },
      select: { startDate: true },
    });

    const monthMap = new Map<string, number>();
    for (let m = 0; m < 12; m++) {
      const key = `${targetYear}-${String(m + 1).padStart(2, '0')}`;
      monthMap.set(key, 0);
    }

    vacations.forEach((v) => {
      const key = `${v.startDate.getFullYear()}-${String(v.startDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      }
    });

    return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
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
