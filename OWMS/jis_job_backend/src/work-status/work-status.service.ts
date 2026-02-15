import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DateUtil } from '../common/utils/date.util';

@Injectable()
export class WorkStatusService {
  constructor(private prisma: PrismaService) { }

  async getWeeklyStatus(
    requestUser: any,
    dateStr?: string,
    teamId?: number,
    deptId?: number,
  ) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    // 주간 시작(일요일) 및 종료(토요일) 데이터 계산 (기존 로직 유지)
    // 주간 시작(일요일) 및 종료(토요일) 데이터 계산 (기존 로직 유지)
    const startOfWeek = DateUtil.getMonday(targetDate);
    const endOfWeek = DateUtil.setEndOfDay(new Date(startOfWeek.getTime() + 6 * 86400000));

    // 1. Get filtered users based on role
    const where: any = {};
    if (requestUser.role !== 'CEO' && requestUser.role !== 'EXECUTIVE') {
      where.departmentId = requestUser.departmentId;
    }

    // 만약 특정 팀 ID가 명시되었다면 해당 팀만 필터링
    if (teamId) {
      where.teamId = teamId;
    } else if (deptId) {
      // 팀 없이 부서로 필터링하는 경우 (팀 미지정 사용자들)
      where.departmentId = deptId;
      where.teamId = null;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        department: { select: { name: true } },
        team: { select: { name: true } },
      },
      orderBy: [
        { department: { orderIndex: 'asc' } },
        { team: { orderIndex: 'asc' } },
        { id: 'asc' },
      ],
    });

    // 2. Get all jobs for this week
    const jobs = await this.prisma.job.findMany({
      where: {
        jobDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      select: {
        userId: true,
        jobDate: true,
      },
    });

    // 2.5 Get DailyStatus for this week (휴무성 근무형태 확인용)
    const dailyStatuses = await this.prisma.dailyStatus.findMany({
      where: {
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      select: {
        userId: true,
        date: true,
        workType: true,
      },
    });

    // 3. Build index maps for O(1) lookups (avoid O(n*m) .some/.find)
    // Key: "userId:YYYY-MM-DD" → boolean/workType
    const jobIndex = new Set<string>();
    for (const job of jobs) {
      const key = `${job.userId}:${job.jobDate.toISOString().split('T')[0]}`;
      jobIndex.add(key);
    }

    const statusIndex = new Map<string, string>();
    for (const ds of dailyStatuses) {
      const key = `${ds.userId}:${ds.date.toISOString().split('T')[0]}`;
      statusIndex.set(key, ds.workType);
    }

    // 4. Build matrix: Date x User -> Status (O(n) per day)
    const weeklyStatus = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      const usersStatus = users.map((user) => {
        const key = `${user.id}:${dateString}`;
        const hasJob = jobIndex.has(key);
        const workType = statusIndex.get(key);
        const isExempt = workType && ['연차', '공가', '공휴일'].includes(workType);

        return {
          id: user.id,
          name: user.name,
          department: user.department?.name || '미배정',
          status: hasJob || isExempt ? 'DONE' : 'MISSING',
        };
      });

      weeklyStatus.push({
        date: dateString,
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][
          currentDate.getDay()
        ],
        users: usersStatus,
      });
    }

    return weeklyStatus;
  }

  async getWeeklySummary(requestUser: any, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    // KST 기준 날짜 문자열 변환 헬퍼 (YYYY-MM-DD)
    const toKSTString = (d: Date) => {
      const kstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return kstDate.toISOString().split('T')[0];
    };

    // 이번주 및 차주의 월~금 범위 계산
    const getMonToFri = (baseDate: Date) => {
      const monday = DateUtil.getMonday(baseDate);

      const dates = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        // DB에 저장된 시간과 무관하게 KST 기준 날짜 문자열 생성
        dates.push(toKSTString(d));
      }
      return { monday, dates };
    };

    const currentWeek = getMonToFri(targetDate);
    const nextWeekDate = new Date(targetDate);
    nextWeekDate.setDate(targetDate.getDate() + 7);
    const nextWeek = getMonToFri(nextWeekDate);

    // 1. 소속 부서 필터링 (requestUser에서 직접 참조)
    let baseWhere: any = {};
    if (requestUser.role !== 'CEO' && requestUser.role !== 'EXECUTIVE') {
      if (requestUser.departmentId) {
        baseWhere = { id: requestUser.departmentId };
      } else {
        baseWhere = { id: -1 };
      }
    }

    // 2. 부서 및 관련 팀/사용자 조회
    const departments = await this.prisma.department.findMany({
      where: baseWhere,
      include: {
        teams: {
          include: { users: { select: { id: true } } },
          orderBy: { orderIndex: 'asc' },
        },
        users: {
          where: { teamId: null },
          select: { id: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    // 4. 통계 계산 헬퍼 함수
    const getCompletionStats = async (userIds: number[], dates: string[]) => {
      if (userIds.length === 0) return { completed: 0, incomplete: 0 };

      // 조회 범위 설정 (안전하게 앞뒤 하루씩 더 넓게 잡음)
      const start = new Date(dates[0]);
      start.setDate(start.getDate() - 1);
      const end = new Date(dates[4]);
      end.setDate(end.getDate() + 1);
      end.setHours(23, 59, 59, 999);

      const jobs = await this.prisma.job.findMany({
        where: { userId: { in: userIds }, jobDate: { gte: start, lte: end } },
        select: { userId: true, jobDate: true },
      });

      const dailyStatuses = await this.prisma.dailyStatus.findMany({
        where: { userId: { in: userIds }, date: { gte: start, lte: end } },
        select: { userId: true, date: true, workType: true },
      });

      let completedCount = 0;
      userIds.forEach((uid) => {
        const userJobs = jobs.filter((j) => j.userId === uid);
        const userStatuses = dailyStatuses.filter((ds) => ds.userId === uid);

        // 중요: DB 날짜를 KST 문자열로 변환하여 Set 생성
        const jobDates = new Set(userJobs.map((j) => toKSTString(j.jobDate)));

        const isFull = dates.every((d) => {
          if (jobDates.has(d)) return true;
          // 부재 사유(연차 등) 확인 시에도 KST 문자열 비교
          const status = userStatuses.find(
            (s) => s.date && toKSTString(s.date) === d,
          );
          return (
            status &&
            ['연차', '공가', '공휴일', '휴무'].includes(status.workType)
          );
        });

        if (isFull) completedCount++;
      });

      return {
        completed: completedCount,
        incomplete: userIds.length - completedCount,
      };
    };

    // Build summary entries and parallelize getCompletionStats calls
    const entries: Array<{
      teamId: number; deptId: number; teamName: string;
      isTeam: boolean; userIds: number[];
    }> = [];

    for (const dept of departments) {
      if (dept.teams.length > 0) {
        for (const team of dept.teams) {
          entries.push({
            teamId: team.id, deptId: dept.id,
            teamName: team.name, isTeam: true,
            userIds: team.users.map((u) => u.id),
          });
        }
      } else {
        entries.push({
          teamId: 0, deptId: dept.id,
          teamName: `${dept.name} (미지정)`, isTeam: false,
          userIds: dept.users.map((u) => u.id),
        });
      }
    }

    // Parallel: fetch currentWeek + nextWeek stats for all entries at once
    const statsResults = await Promise.all(
      entries.map(async (e) => {
        const [cw, nw] = await Promise.all([
          getCompletionStats(e.userIds, currentWeek.dates),
          getCompletionStats(e.userIds, nextWeek.dates),
        ]);
        return { currentWeek: cw, nextWeek: nw };
      }),
    );

    const summaries = entries.map((e, i) => ({
      teamId: e.teamId,
      deptId: e.deptId,
      teamName: e.teamName,
      isTeam: e.isTeam,
      totalMembers: e.userIds.length,
      currentWeek: statsResults[i].currentWeek,
      nextWeek: statsResults[i].nextWeek,
    }));

    return summaries.sort((a, b) => a.teamId - b.teamId);
  }

  async getWeeklyDetail(dateStr: string, userId: number) {
    // Fetch all jobs for the specific user and date
    // Join with Project to get project name

    // Ensure date range covers the whole day
    const startOfDay = DateUtil.setStartOfDay(new Date(dateStr));

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const jobs = await this.prisma.job.findMany({
      where: {
        userId: userId,
        jobDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        project: {
          select: { projectName: true },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      content: job.content,
      projectName: job.project?.projectName || '기타 업무',
      order: job.order,
    }));
  }
}
