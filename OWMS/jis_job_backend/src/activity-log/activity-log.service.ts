import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityLogService {
    constructor(private prisma: PrismaService) {}

    async log(data: {
        userId?: number;
        userName?: string;
        action: string;
        method: string;
        path: string;
        statusCode?: number;
        ip?: string;
        userAgent?: string;
        detail?: string;
    }) {
        try {
            await this.prisma.activityLog.create({ data });
        } catch {
            // 로그 저장 실패가 메인 요청에 영향 주지 않도록
        }
    }

    async findAll(filters: {
        userId?: number;
        action?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) {
        const { userId, action, startDate, endDate, page = 1, limit = 30 } = filters;

        const where: Prisma.ActivityLogWhereInput = {};

        if (userId) {
            where.userId = userId;
        }
        if (action) {
            where.action = action;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const [data, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, userId: true, role: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.activityLog.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /** 대시보드 위젯: 일별 활동 건수 (최근 N일) */
    async getDailyStats(startDate?: string, endDate?: string) {
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
        const start = startDate
            ? new Date(startDate)
            : new Date(end.getTime() - 13 * 24 * 60 * 60 * 1000); // 기본 14일

        const results: Array<{ date: string; count: bigint }> =
            await this.prisma.$queryRaw`
                SELECT DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as date,
                       COUNT(*)::bigint as count
                FROM "ActivityLog"
                WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
                GROUP BY DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
                ORDER BY date ASC
            `;

        return (results || []).map((r: any) => ({
            date:
                r.date instanceof Date
                    ? r.date.toISOString().split('T')[0]
                    : String(r.date),
            count: Number(r.count),
        }));
    }

    async getStats(startDate?: string, endDate?: string) {
        const where: Prisma.ActivityLogWhereInput = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const actionCounts = await this.prisma.activityLog.groupBy({
            by: ['action'],
            where,
            _count: { id: true },
        });

        const total = await this.prisma.activityLog.count({ where });

        return {
            total,
            byAction: actionCounts.map((a) => ({
                action: a.action,
                count: a._count.id,
            })),
        };
    }
}
