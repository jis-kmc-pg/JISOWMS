import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEAM_LEADER, Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
export class ActivityLogController {
    constructor(private readonly activityLogService: ActivityLogService) {}

    @Get()
    findAll(
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.activityLogService.findAll({
            userId: userId ? +userId : undefined,
            action: action || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page: page ? +page : 1,
            limit: limit ? +limit : 30,
        });
    }

    @Get('daily-stats')
    getDailyStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.activityLogService.getDailyStats(
            startDate || undefined,
            endDate || undefined,
        );
    }

    @Get('stats')
    getStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.activityLogService.getStats(
            startDate || undefined,
            endDate || undefined,
        );
    }
}
