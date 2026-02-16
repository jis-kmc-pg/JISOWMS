import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('dashboard')
  async getDashboardStats(@Req() req: any) {
    const userId = req.user.sub;
    return this.metricsService.getDashboardStats(userId);
  }

  @Get('monthly-trend')
  @UseGuards(RolesGuard)
  @Roles(Role.TEAM_LEADER, Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
  getMonthlyTrend(@Req() req: any, @Query('deptId') deptId?: string) {
    const scopedDeptId = this.getScopedDeptId(req.user, deptId);
    return this.metricsService.getMonthlyTrend(scopedDeptId);
  }

  @Get('dispatch-stats')
  @UseGuards(RolesGuard)
  @Roles(Role.TEAM_LEADER, Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
  getDispatchStats(@Req() req: any, @Query('deptId') deptId?: string) {
    const scopedDeptId = this.getScopedDeptId(req.user, deptId);
    return this.metricsService.getDispatchStats(scopedDeptId);
  }

  @Get('room-stats')
  @UseGuards(RolesGuard)
  @Roles(Role.TEAM_LEADER, Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
  getRoomStats(@Req() req: any, @Query('deptId') deptId?: string) {
    const scopedDeptId = this.getScopedDeptId(req.user, deptId);
    return this.metricsService.getRoomStats(scopedDeptId);
  }

  /** 역할별 deptId 스코핑: 팀장/부서장은 자기 부서로 강제 */
  private getScopedDeptId(user: any, clientDeptId?: string): number | undefined {
    const role = user.role;
    if (role === 'TEAM_LEADER' || role === 'DEPT_HEAD') {
      return user.departmentId;
    }
    // CEO/EXECUTIVE: 클라이언트 요청값 허용
    return clientDeptId ? +clientDeptId : undefined;
  }

  @Get('attendance')
  @UseGuards(RolesGuard)
  @Roles(Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
  getAttendanceStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getAttendanceStats(startDate, endDate);
  }

  @Get('vacation-trend')
  @UseGuards(RolesGuard)
  @Roles(Role.DEPT_HEAD, Role.EXECUTIVE, Role.CEO)
  getVacationTrend(@Query('year') year?: string) {
    return this.metricsService.getVacationTrend(year ? +year : undefined);
  }
}
