import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { WorkStatusService } from './work-status.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('work-status')
@UseGuards(JwtAuthGuard)
export class WorkStatusController {
  constructor(private readonly workStatusService: WorkStatusService) {}

  @Get('weekly')
  async getWeeklyStatus(
    @Request() req: any,
    @Query('date') date: string,
    @Query('teamId') teamId?: string,
    @Query('deptId') deptId?: string,
  ) {
    // 요청자의 유저 정보를 서비스로 전달하여 권한별 필터링 처리
    return this.workStatusService.getWeeklyStatus(
      req.user,
      date,
      teamId ? parseInt(teamId) : undefined,
      deptId ? parseInt(deptId) : undefined,
    );
  }

  @Get('summary')
  async getWeeklySummary(@Request() req: any, @Query('date') date: string) {
    // 팀별 통계 요약 정보를 반환 (부서별 필터링 적용)
    return this.workStatusService.getWeeklySummary(req.user, date);
  }

  @Get('detail')
  async getWeeklyDetail(
    @Query('date') date: string,
    @Query('userId') userId: string,
  ) {
    return this.workStatusService.getWeeklyDetail(date, parseInt(userId));
  }

  @Get('keywords')
  async getKeywords(
    @Request() req: any,
    @Query('date') date?: string,
  ) {
    return this.workStatusService.getKeywords(req.user, date);
  }
}
