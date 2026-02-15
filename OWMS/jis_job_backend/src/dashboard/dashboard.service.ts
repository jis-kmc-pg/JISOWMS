import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DateUtil } from '../common/utils/date.util';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getSummary(userId: number) {
    // 1. Today's Projects (Distinct projects worked on today)
    const startOfToday = DateUtil.setStartOfDay(new Date());
    const endOfToday = DateUtil.setEndOfDay(new Date());

    const todayJobs = await this.prisma.job.findMany({
      where: {
        userId,
        jobDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: { projectId: true },
    });
    // Count distinct projectIds (including null as 'General') - actually we might just count jobs or distinct projects
    // Simple logic: number of job entries today
    const todayCount = todayJobs.length;

    // 2. Weekly Completed Jobs
    const now = new Date();
    const startOfWeek = DateUtil.getMonday(now);
    const endOfWeek = DateUtil.setEndOfDay(new Date(startOfWeek.getTime() + 6 * 86400000));

    const weeklyJobsCount = await this.prisma.job.count({
      where: {
        userId,
        jobDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    // 3. Leave Metrics (Using logic from VacationService or direct query)
    const totalLeave = 15;
    const usedVacations = await this.prisma.vacation.findMany({
      where: {
        userId: userId,
        status: { in: ['APPROVED', 'PENDING'] },
      },
    });

    const leaveUsed = usedVacations.reduce(
      (sum, v) => sum + this.calculateDuration(v.startDate, v.endDate, v.type), 0,
    );

    // 4. Team Absence (Today & Tomorrow)
    const today = DateUtil.setStartOfDay(new Date());
    const tomorrow = DateUtil.setStartOfDay(new Date(today.getTime() + 86400000));

    const absences = await this.prisma.vacation.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { startDate: { lte: endOfToday }, endDate: { gte: startOfToday } },
          {
            startDate: { lte: new Date(tomorrow.getTime() + 86399999) },
            endDate: { gte: tomorrow },
          },
        ],
      },
      include: { user: true },
    });

    const teamAbsence = absences.map((v) => {
      const isToday = v.startDate <= endOfToday && v.endDate >= startOfToday;
      return {
        name: v.user.name,
        type:
          v.type === 'HALF_AM'
            ? '오전반차'
            : v.type === 'HALF_PM'
              ? '오후반차'
              : '연차',
        date: isToday ? '오늘' : '내일',
      };
    });

    return {
      todayProjects: todayCount,
      weeklyCompleted: weeklyJobsCount,
      leaveBalance: totalLeave,
      leaveUsed: leaveUsed,
      remainingLeave: totalLeave - leaveUsed,
      teamAbsence,
    };
  }

  private calculateDuration(
    startDate: Date,
    endDate: Date,
    type: string,
  ): number {
    if (type === 'HALF_AM' || type === 'HALF_PM') return 0.5;
    let count = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  async getRecentJobs(userId: number) {
    const jobs = await this.prisma.job.findMany({
      where: { userId },
      orderBy: { jobDate: 'desc' },
      take: 5,
      include: {
        project: true,
      },
    });

    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      content: job.content,
      date: job.jobDate,
      projectName: job.project?.projectName || '일반 업무',
      category: '개발', // Mock category or derive from project
      timeAgo: this.timeSince(new Date(job.jobDate)),
    }));
  }

  private timeSince(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + '년 전';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + '개월 전';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + '일 전';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + '시간 전';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + '분 전';
    return Math.floor(seconds) + '초 전';
  }
}
