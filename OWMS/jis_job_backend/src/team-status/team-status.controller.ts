import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TeamStatusService } from './team-status.service';
import { CreateTeamStatusDto } from './dto/create-team-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('team-status')
@UseGuards(JwtAuthGuard)
export class TeamStatusController {
    constructor(private readonly teamStatusService: TeamStatusService) {}

    @Get()
    findWeekly(
        @Request() req: any,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const departmentId = req.user.departmentId;
        return this.teamStatusService.findWeekly(departmentId, startDate, endDate);
    }

    // ── 대시보드 위젯 전용 ──

    @Get('submitted-status')
    getSubmittedStatus(@Request() req: any) {
        return this.teamStatusService.getSubmittedStatus(req.user.id);
    }

    @Get('submission-list')
    getSubmissionList(@Request() req: any) {
        return this.teamStatusService.getTeamSubmissionList(req.user.departmentId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.teamStatusService.findOne(+id);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.TEAM_LEADER, Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
    create(@Request() req: any, @Body() dto: CreateTeamStatusDto) {
        return this.teamStatusService.create(req.user.id, dto);
    }

    @Put(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.TEAM_LEADER, Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
    update(@Request() req: any, @Param('id') id: string, @Body() dto: CreateTeamStatusDto) {
        return this.teamStatusService.update(+id, req.user.id, req.user.role, dto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.TEAM_LEADER, Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
    remove(@Request() req: any, @Param('id') id: string) {
        return this.teamStatusService.remove(+id, req.user.id, req.user.role);
    }
}
