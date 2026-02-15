import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface CreateVacationDto {
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

@Injectable()
export class VacationService {
  private readonly logger = new Logger(VacationService.name);
  constructor(private prisma: PrismaService) {}

  // 1. Get Vacation Summary (Total, Used, Remaining)
  async getSummary(userId: number) {
    const currentYear = new Date().getFullYear();

    // Single query: user info + vacations + adjustments
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        joinDate: true,
        annualLeaveOverride: true,
        carryoverLeave: true,
        vacations: {
          where: { status: { in: ['APPROVED', 'PENDING'] } },
        },
        vacationAdjustments: {
          where: { year: currentYear },
        },
      },
    });

    // Calculate Total Annual Leave based on Join Date or Override
    const { total: calculatedTotal } = this.calculateAnnualLeave(
      (user as any)?.joinDate || undefined,
    );
    const baseTotal =
      (user as any)?.annualLeaveOverride != null
        ? (user as any).annualLeaveOverride
        : calculatedTotal;
    const finalTotal = baseTotal + ((user as any)?.carryoverLeave || 0);

    // Calculate monthly usage from loaded vacations
    const monthlyUsage = new Array(12).fill(0);
    const usedVacations = (user as any)?.vacations || [];
    usedVacations.forEach((v: any) => {
      const month = v.startDate.getMonth();
      monthlyUsage[month] += this.calculateDuration(
        v.startDate,
        v.endDate,
        v.type,
      );
    });

    // Apply adjustments from loaded data
    const adjustments = (user as any)?.vacationAdjustments || [];
    adjustments.forEach((adj: any) => {
      if (adj.month >= 1 && adj.month <= 12) {
        monthlyUsage[adj.month - 1] = adj.amount;
      }
    });

    let used = 0;
    monthlyUsage.forEach((val) => (used += val));

    return {
      total: finalTotal,
      used,
      remaining: finalTotal - used,
    };
  }

  // 2. Get My Vacations List
  async getMyVacations(userId: number) {
    return this.prisma.vacation.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  // 3. Request Vacation
  async requestVacation(userId: number, dto: CreateVacationDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    // Basic Validation
    if (start > end) {
      throw new BadRequestException('종료일이 시작일보다 빠를 수 없습니다.');
    }

    // 1. Check Overlap
    const overlap = await this.prisma.vacation.findFirst({
      where: {
        userId,
        status: { not: 'REJECTED' },
        OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
      },
    });

    if (overlap) {
      throw new BadRequestException('이미 해당 기간에 신청된 휴가가 있습니다.');
    }

    // 2. Check Remaining Days
    const summary = await this.getSummary(userId);
    const requestDays = this.calculateDuration(start, end, dto.type);

    if (summary.remaining < requestDays) {
      throw new BadRequestException(
        `잔여 연차가 부족합니다. (잔여: ${summary.remaining}, 신청: ${requestDays})`,
      );
    }

    return this.prisma.vacation.create({
      data: {
        userId,
        type: dto.type,
        startDate: start,
        endDate: end,
        reason: dto.reason,
        status: 'PENDING',
      },
    });
  }

  // 4. [Dept Head] Get Requests in specific department
  async getDepartmentRequests(
    deptId: number,
    startDate?: string,
    endDate?: string,
  ) {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearEnd = new Date(new Date().getFullYear(), 11, 31);

    return this.prisma.vacation.findMany({
      where: {
        user: { departmentId: deptId },
        AND: [
          startDate
            ? { startDate: { gte: new Date(startDate) } }
            : { startDate: { gte: yearStart } },
          endDate
            ? { endDate: { lte: new Date(endDate) } }
            : { endDate: { lte: yearEnd } },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            position: true,
            team: { select: { name: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  // 5. [Admin] Get All Vacations (with user/dept info)
  async getAdminAll(deptId?: number) {
    return this.prisma.vacation.findMany({
      where: deptId ? { user: { departmentId: deptId } } : {},
      include: {
        user: {
          select: {
            name: true,
            department: { select: { name: true } },
            team: { select: { name: true } },
            position: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  // 5. [Admin] Bulk Request (Auto-Approved)
  async bulkRequest(
    targetType: 'ALL' | 'DEPT' | 'USER',
    targetIds: number[] | undefined,
    dto: CreateVacationDto,
  ) {
    let users;

    if (targetType === 'ALL') {
      users = await this.prisma.user.findMany({
        select: { id: true },
      });
    } else if (targetType === 'DEPT') {
      if (!targetIds || targetIds.length === 0)
        throw new BadRequestException('Department IDs are required');
      users = await this.prisma.user.findMany({
        where: { departmentId: { in: targetIds } },
        select: { id: true },
      });
    } else if (targetType === 'USER') {
      if (!targetIds || targetIds.length === 0)
        throw new BadRequestException('User IDs are required');
      users = await this.prisma.user.findMany({
        where: { id: { in: targetIds } },
        select: { id: true },
      });
    } else {
      throw new BadRequestException('Invalid target type');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const creations = users.map((user) =>
      this.prisma.vacation.create({
        data: {
          userId: user.id,
          type: dto.type,
          startDate: start,
          endDate: end,
          reason:
            dto.reason ||
            (targetType === 'USER' ? '관리자 직권 등록' : '일괄 신청'),
          status: 'APPROVED', // Auto-approved
        },
      }),
    );

    return Promise.all(creations);
  }

  // 6. [Admin] Update/Approve Vacation
  async updateVacation(id: number, data: any) {
    return this.prisma.vacation.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  // 7. [Admin] Delete Vacation
  async deleteVacation(id: number) {
    return this.prisma.vacation.delete({ where: { id } });
  }

  // 8. [Admin] Get Stats for all employees
  async getAdminStats(year?: number, name?: string, deptId?: number) {
    const targetYear = year || new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31);

    const whereClause: any = {};
    if (name) whereClause.name = { contains: name }; // Removed mode: 'insensitive' for compatibility relying on DB collation or specific Prisma version features
    if (deptId) whereClause.departmentId = deptId;

    const users = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        department: true,
        vacationAdjustments: {
          where: { year: targetYear },
        },
        vacations: {
          where: {
            status: 'APPROVED',
            startDate: { gte: yearStart },
            endDate: { lte: yearEnd },
          },
        },
      },
      orderBy: { joinDate: 'asc' },
    });

    return users.map((user) => {
      // Calculate based on target year logic if needed, currently using dynamic calc
      // Note: calculateAnnualLeave uses "today" logic. If we want historical stats, we might need to adjust targetDate
      // For now, let's assume we want "current status" or if specific year, we might need to pass that year to calc.
      // But requirement says "2026", "2025".

      const targetDate = new Date(targetYear, 0, 1);
      const u = user as any;
      const { total: calculatedBase } = this.calculateAnnualLeave(
        u.joinDate || undefined,
        targetDate,
      );
      const baseAllowance =
        u.annualLeaveOverride != null ? u.annualLeaveOverride : calculatedBase;
      const total = baseAllowance + (u.carryoverLeave || 0);

      let used = 0;
      u.vacations.forEach((v: any) => {
        used += this.calculateDuration(v.startDate, v.endDate, v.type);
      });

      // Monthly usage
      const monthlyUsage = new Array(12).fill(0);
      u.vacations.forEach((v: any) => {
        const month = v.startDate.getMonth();
        monthlyUsage[month] += this.calculateDuration(
          v.startDate,
          v.endDate,
          v.type,
        );
      });

      // Apply adjustments to monthlyUsage (Override if exists)
      u.vacationAdjustments.forEach((adj: any) => {
        if (adj.month >= 1 && adj.month <= 12) {
          monthlyUsage[adj.month - 1] = adj.amount;
        }
      });

      // Recalculate total used
      used = 0;
      monthlyUsage.forEach((val) => (used += val));

      return {
        userId: user.id,
        userName: user.name,
        deptName: (user as any).department?.name || '-',
        position: user.position || '-',
        joinDate: user.joinDate
          ? user.joinDate.toISOString().split('T')[0]
          : '-',
        totalAllowance: baseAllowance,
        carryover: (user as any).carryoverLeave,
        total,
        used,
        remaining: total - used,
        monthlyUsage,
      };
    });
  }

  // 9. [Admin] Save Stats Configuration
  async saveStatsConfig(
    userId: number,
    data: {
      joinDate?: string;
      annualLeaveOverride?: number;
      carryoverLeave?: number;
      monthlyAdjustments?: { month: number; amount: number }[];
    },
  ) {
    this.logger.debug(`saveStatsConfig for user ${userId}: ${JSON.stringify(data)}`);
    const year = new Date().getFullYear();

    // 1. Update User info
    const updateData: any = {};
    if (data.joinDate) updateData.joinDate = new Date(data.joinDate);
    if (data.annualLeaveOverride != null && !isNaN(data.annualLeaveOverride)) {
      updateData.annualLeaveOverride = data.annualLeaveOverride;
    }
    if (data.carryoverLeave != null && !isNaN(data.carryoverLeave)) {
      updateData.carryoverLeave = data.carryoverLeave;
    }

    await (this.prisma.user as any).update({
      where: { id: userId },
      data: updateData,
    });

    // 2. Update Monthly Adjustments (batched with Promise.all)
    if (data.monthlyAdjustments) {
      const validAdjs = data.monthlyAdjustments.filter((adj) => !isNaN(adj.amount));
      if (validAdjs.length > 0) {
        await Promise.all(
          validAdjs.map((adj) =>
            (this.prisma as any).vacationAdjustment.upsert({
              where: {
                userId_year_month: { userId, year, month: adj.month },
              },
              update: { amount: adj.amount },
              create: { userId, year, month: adj.month, amount: adj.amount },
            }),
          ),
        );
      }
    }

    return { success: true };
  }

  // --- Logic: Calculate Annual Leave ---
  // --- Logic: Calculate Annual Leave (Strict Rules) ---
  private calculateAnnualLeave(joinDate?: Date, targetDate?: Date) {
    if (!joinDate) return { total: 15, base: 15, bonus: 0, yearsOfService: 0 }; // Default fallback

    const today = targetDate || new Date();
    const refYear = today.getFullYear();
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth() + 1; // 1-12

    // 1. 근무년차 (Y) 계산: ReferenceYear - HireDate.Year + 1
    const Y = refYear - joinYear + 1;

    let base = 0;
    let bonus = 0;
    let total = 0;

    // 만약 입사일이 미래라면 0년차 처리
    if (Y <= 0) {
      return { total: 0, base: 0, bonus: 0, yearsOfService: Y };
    }

    // Case A: 1년차 (당해 입사자)
    // 입사 후 1년 미만 기간 동안 1개월 개근 시마다 1일씩 부여 (최대 11일)
    if (Y === 1) {
      // 간단히 11일로 가정하거나, 월별 계산 로직 적용 (요구사항: 최대 11일)
      // 여기서는 편의상 11 - (입사월 - 1) 등으로 근사치 적용 가능하나,
      // "1개월 개근 시마다 1일" 원칙에 따라 현재 시점 기준일 수 있음.
      // 통계용으로는 Max치인 11일 혹은 입사월 비례로 12-입사월 계산
      // 예: 1월 입사 -> 11일, 12월 입사 -> 0일 (다음해 1월에 1일 발생)
      // 여기서는 통상적인 "발생 예정 총합" 관점에서 (12 - joinMonth)로 근사
      // 단, 1년 미만자는 월단위 발생이므로 refYear 말일 기준 만근 가정 시:
      const maxDays = 12 - joinMonth;
      base = Math.min(11, maxDays);
    }
    // Case B: 2년차 (전년도 입사자)
    // 전년도 입사 월(M)에 따라 비례 부여
    else if (Y === 2) {
      if (joinMonth <= 2) base = 15.0;
      else if (joinMonth === 3) base = 14.5;
      else if (joinMonth <= 5) base = 14.0;
      else if (joinMonth <= 7) base = 13.5;
      else if (joinMonth <= 9) base = 13.0;
      else if (joinMonth <= 11) base = 12.5;
      else base = 12.0; // 12월
    }
    // Case C: 3년차 이상
    // 기본 15일 + 가산 연차: min(10, floor((Y - 1) / 2))
    else {
      base = 15;
      bonus = Math.floor((Y - 1) / 2);
      if (bonus > 10) bonus = 10;
    }

    total = base + bonus;

    return { total, base, bonus, yearsOfService: Y };
  }

  // Helper: Calculate Business Days (Excluding Weekends) & Half-day logic
  private calculateDuration(
    startDate: Date,
    endDate: Date,
    type: string,
  ): number {
    if (type === 'HALF_AM' || type === 'HALF_PM') {
      return 0.5;
    }

    let count = 0;
    const cur = new Date(startDate);
    const end = new Date(endDate);

    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0=Sun, 6=Sat
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }
}
