import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DateUtil } from '../common/utils/date.util';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  constructor(private prisma: PrismaService) { }

  async getJobsByDate(userId: number, date: string) {
    const startOfDay = DateUtil.setStartOfDay(new Date(date));
    const endOfDay = DateUtil.setEndOfDay(new Date(date));

    return this.prisma.job.findMany({
      where: {
        userId,
        jobDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        project: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async saveJobs(userId: number, date: string, jobs: any[]) {
    const jobDate = new Date(date);
    const startOfDay = DateUtil.setStartOfDay(jobDate);
    const endOfDay = DateUtil.setEndOfDay(jobDate);

    // 기존 업무 조회
    const existingJobs = await this.prisma.job.findMany({
      where: {
        userId,
        jobDate: { gte: startOfDay, lte: endOfDay },
      },
      select: { id: true },
    });

    const existingIds = existingJobs.map((j) => j.id);
    const incomingIdSet = new Set(jobs.filter((j) => j.id).map((j) => j.id));
    const idsToDelete = existingIds.filter((id) => !incomingIdSet.has(id));

    // 삭제 대상 처리
    if (idsToDelete.length > 0) {
      await this.prisma.job.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    // Upsert 로직
    return Promise.all(
      jobs.map(async (job, index) => {
        const data = {
          title: job.title,
          content: job.content,
          jobDate: startOfDay, // 날짜 경계 표준화
          userId,
          projectId: job.projectId,
          isIssue: job.isIssue || false,
          order: index,
        };

        if (job.projectId && job.title) {
          // 콜론이 있으면 거래처:업무명으로 분리, 없으면 전체를 업무명으로 (거래처 초기화)
          const match = job.title.match(/^(.*?)\s*:\s*([\s\S]*)$/);
          const updateData = match
            ? { clientName: match[1].trim(), projectName: match[2].trim() }
            : { clientName: null, projectName: job.title };


          try {
            await this.prisma.project.update({
              where: { id: job.projectId },
              data: updateData,
            });
          } catch (error) {
            this.logger.error(
              `Failed to update project info for projectId ${job.projectId}`,
              error.stack,
            );
          }
        }

        if (job.id) {
          return this.prisma.job.update({
            where: { id: job.id },
            data,
          });
        } else {
          return this.prisma.job.create({
            data,
          });
        }
      }),
    );
  }

  async getWeeklyNote(userId: number, weekStart: string) {
    return this.prisma.weeklyNote.findUnique({
      where: {
        weekStart_userId: {
          weekStart: new Date(weekStart),
          userId,
        },
      },
    });
  }

  async saveWeeklyNote(userId: number, weekStart: string, content: string) {
    if (content && content.trim()) {
      const lines = content.split('\n');

      // 1. 행 수 제한 검사
      if (lines.length > 4) {
        throw new BadRequestException(
          '주간 정보 사항은 최대 4줄까지만 입력 가능합니다.',
        );
      }

      // 2. 각 행별 글자 수 제한 검사
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 40) {
          throw new BadRequestException(
            `주간 정보 사항의 각 줄은 최대 40자까지 입력 가능합니다. (${i + 1}번째 줄 초과)`,
          );
        }
      }
    }

    return this.prisma.weeklyNote.upsert({
      where: {
        weekStart_userId: {
          weekStart: new Date(weekStart),
          userId,
        },
      },
      update: { content },
      create: {
        weekStart: new Date(weekStart),
        userId,
        content,
      },
    });
  }

  async getProjects(status?: string) {
    const whereClause = status ? { status } : {}; // If status is provided, filter by it. If not, return all.
    // Wait, if I want to return all, I shouldn't pass status.
    // Daily Report needs ACTIVE only. Settings needs ALL or Filter.
    // Let's change default to return ALL if no status passed?
    // Or keep default ACTIVE for backward compatibility and allow 'ALL' to reset filter?

    // Better: Allow passing status. If not passed, return ALL?
    // Existing calls might expect ACTIVE.
    // Let's check usages. Frontend calls `/reports/projects`.
    // It expects active projects for the dropdown?
    // Let's look at `dashboard/page.tsx` or wherever it's used.
    // Safest: Default to 'ACTIVE' if no arg?
    // But for Settings, I need 'ALL'.

    // Let's change signature: async getProjects(status?: string)
    // If status is undefined, return ACTIVE (preserve behavior).
    // If status is 'ALL', return all.

    const where = status === 'ALL' ? {} : { status: status || 'ACTIVE' };

    return this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProject(data: { projectName: string; clientName?: string }) {
    return this.prisma.project.create({
      data: {
        projectName: data.projectName,
        clientName: data.clientName,
        status: 'ACTIVE',
      },
    });
  }

  async updateProject(
    id: number,
    data: { projectName?: string; clientName?: string; status?: string },
  ) {
    return this.prisma.project.update({
      where: { id },
      data: {
        projectName: data.projectName,
        clientName: data.clientName,
        status: data.status,
      },
    });
  }

  async getDailyStatus(userId: number, date: string) {
    const d = DateUtil.setStartOfDay(new Date(date));

    return this.prisma.dailyStatus.findUnique({
      where: {
        date_userId: {
          date: d,
          userId,
        },
      },
    });
  }

  async saveDailyStatus(
    userId: number,
    date: string,
    data: { workType: string; holidayName?: string },
  ) {
    const d = DateUtil.setStartOfDay(new Date(date));

    return this.prisma.dailyStatus.upsert({
      where: {
        date_userId: {
          date: d,
          userId,
        },
      },
      update: { workType: data.workType, holidayName: data.holidayName },
      create: {
        date: d,
        userId,
        workType: data.workType,
        holidayName: data.holidayName,
      },
    });
  }

  async getMyWeeklyStatus(userId: number, dateStr?: string) {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const thisMonday = DateUtil.getMonday(baseDate);

    // 금주(월-금) + 차주(월-금) = 총 10일치 상태 조회
    const dates: Date[] = [];
    for (let i = 0; i < 12; i++) { // 월(0)~금(4) ... 차주 일(6) 월(7)~금(11)
      const d = new Date(thisMonday.getTime() + i * 86400000);
      const day = d.getDay();
      if (day >= 1 && day <= 5) { // 평일만 수집
        dates.push(d);
      }
    }

    // 해당 날짜들의 업무(Job) 및 상태(DailyStatus) 조회
    const [jobs, statuses] = await Promise.all([
      this.prisma.job.findMany({
        where: {
          userId,
          jobDate: { gte: dates[0], lte: dates[dates.length - 1] },
        },
        select: { jobDate: true },
      }),
      this.prisma.dailyStatus.findMany({
        where: {
          userId,
          date: { gte: dates[0], lte: dates[dates.length - 1] },
        },
      }),
    ]);

    // Pre-index jobs and statuses by KST date string for O(1) lookups
    const jobDateSet = new Set(jobs.map(j => DateUtil.toKSTString(new Date(j.jobDate))));
    const statusByDate = new Map(
      statuses.map(s => [DateUtil.toKSTString(new Date(s.date)), s]),
    );
    const todayKey = DateUtil.toKSTString(new Date());

    const result = dates.map((d) => {
      const dateKey = DateUtil.toKSTString(d);
      const status = statusByDate.get(dateKey);

      return {
        date: dateKey,
        dayName: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
        hasJob: jobDateSet.has(dateKey),
        workType: status?.workType || '내근',
        holidayName: status?.holidayName,
        isToday: todayKey === dateKey,
      };
    });

    return result;
  }

  async getSystemMemos(date: string) {
    const d = new Date(date);
    // Expand window slightly to be safe with TZ shifts, or just use the whole target day in UTC
    const startOfDay = new Date(d);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(d);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Also try a +- 12h buffer if needed, but standardizing on KST midnight in DB:
    // We saved it as DateUtil.setStartOfDay(new Date(date)) -> which is KST midnight.
    // So we should search for that specific day window.

    try {
      // Use raw query to bypass Prisma Client lock/generation issues and handle TZ
      const results = await (this.prisma as any).$queryRaw`
        SELECT sm.*, u.name as "userName", u.position as "userPosition"
        FROM "SystemMemo" sm
        LEFT JOIN "User" u ON sm."userId" = u.id
        WHERE (sm.date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::date = ${date}::date
        ORDER BY sm."createdAt" DESC
      `;

      if (!Array.isArray(results)) return [];

      return results.map((m: any) => ({
        ...m,
        user: { name: m.userName, position: m.userPosition }
      }));
    } catch (error) {
      this.logger.error('getSystemMemos raw query error', error.stack);
      return [];
    }
  }

  async saveSystemMemo(userId: number, content: string, date: string) {
    const d = DateUtil.setStartOfDay(new Date(date));
    const now = new Date();

    try {
      return await (this.prisma as any).$executeRaw`
        INSERT INTO "SystemMemo" (content, date, "userId", "updatedAt")
        VALUES (${content}, ${d}, ${userId}, ${now})
      `;
    } catch (error) {
      this.logger.error('saveSystemMemo raw execute error', error.stack);
      throw error;
    }
  }

  // ── 대시보드 위젯 전용 메서드 ──

  /** 위젯: 오늘 업무 건수 */
  async getJobsCount(userId: number, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = DateUtil.setStartOfDay(targetDate);
    const endOfDay = DateUtil.setEndOfDay(targetDate);

    const count = await this.prisma.job.count({
      where: {
        userId,
        jobDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    return { count };
  }

  /** 위젯: 금주 업무 완료율 (입력일/평일 비율) */
  async getMyCompletionRate(userId: number, dateStr?: string) {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const monday = DateUtil.getMonday(baseDate);

    // 오늘까지의 평일 수 계산 (월~오늘, 최대 금요일)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=일 ~ 6=토
    const weekdaysElapsed = Math.min(
      dayOfWeek === 0 ? 5 : dayOfWeek >= 6 ? 5 : dayOfWeek,
      5,
    );

    if (weekdaysElapsed === 0) {
      return { completionRate: 0 };
    }

    // 월~오늘 범위에서 업무가 입력된 날 수
    const friday = new Date(monday.getTime() + 4 * 86400000);
    const endOfRange = DateUtil.setEndOfDay(
      today < friday ? today : friday,
    );

    const jobs = await this.prisma.job.findMany({
      where: {
        userId,
        jobDate: { gte: monday, lte: endOfRange },
      },
      select: { jobDate: true },
    });

    const uniqueDates = new Set(
      jobs.map((j) => DateUtil.toKSTString(j.jobDate)),
    );
    const completionRate = Math.round(
      (uniqueDates.size / weekdaysElapsed) * 100,
    );

    return { completionRate };
  }

  /** 위젯: 금주 주간 참고사항 작성 여부 */
  async getWeeklyNoteWritten(userId: number, dateStr?: string) {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const monday = DateUtil.getMonday(baseDate);

    // 범위를 넓혀서 검색 (+-2일)
    const searchStart = new Date(monday);
    searchStart.setDate(searchStart.getDate() - 2);
    const searchEnd = new Date(monday);
    searchEnd.setDate(searchEnd.getDate() + 1);

    const note = await this.prisma.weeklyNote.findFirst({
      where: {
        userId,
        weekStart: { gte: searchStart, lte: searchEnd },
      },
    });

    return { written: !!note };
  }

  async searchPastJobs(userId: number, startDate: string, endDate: string) {
    if (!startDate || !endDate) return [];

    const start = DateUtil.setStartOfDay(new Date(startDate));
    const end = DateUtil.setEndOfDay(new Date(endDate));

    return this.prisma.job.findMany({
      where: {
        userId,
        jobDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        project: true,
      },
      orderBy: { jobDate: 'desc' },
      take: 100, // 기간 검색이므로 조금 더 넉넉하게
    });
  }

  async getMyWeeklyDetail(userId: number, dateStr: string) {
    const targetDate = new Date(dateStr);
    const startOfWeek = DateUtil.getMonday(targetDate); // 금주 월요일
    const endOfWeek = DateUtil.setEndOfDay(new Date(startOfWeek.getTime() + 4 * 86400000)); // 금주 금요일
    const startOfNextWeek = DateUtil.setStartOfDay(new Date(startOfWeek.getTime() + 7 * 86400000)); // 차주 월요일
    const endOfNextWeek = DateUtil.setEndOfDay(new Date(startOfNextWeek.getTime() + 4 * 86400000)); // 차주 금요일

    const [currentJobs, nextJobs, currentStatuses, nextStatuses] = await Promise.all([
      this.prisma.job.findMany({
        where: { userId, jobDate: { gte: startOfWeek, lte: endOfWeek } },
        include: { project: true },
        orderBy: [{ jobDate: 'asc' }, { order: 'asc' }],
      }),
      this.prisma.job.findMany({
        where: { userId, jobDate: { gte: startOfNextWeek, lte: endOfNextWeek } },
        include: { project: true },
        orderBy: [{ jobDate: 'asc' }, { order: 'asc' }],
      }),
      this.prisma.dailyStatus.findMany({
        where: { userId, date: { gte: startOfWeek, lte: endOfWeek } },
      }),
      this.prisma.dailyStatus.findMany({
        where: { userId, date: { gte: startOfNextWeek, lte: endOfNextWeek } },
      }),
    ]);

    // 주간 참고사항 조회 (범위 확장)
    const searchStart = new Date(startOfWeek);
    searchStart.setDate(searchStart.getDate() - 2);
    const searchEnd = new Date(startOfWeek);
    searchEnd.setDate(searchEnd.getDate() + 1);

    const weeklyNote = await this.prisma.weeklyNote.findFirst({
      where: {
        userId: userId,
        weekStart: { gte: searchStart, lte: searchEnd },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      startOfWeek,
      endOfWeek,
      startOfNextWeek,
      endOfNextWeek,
      currentJobs,
      nextJobs,
      currentStatuses,
      nextStatuses,
      weeklyNote,
    };
  }
}
