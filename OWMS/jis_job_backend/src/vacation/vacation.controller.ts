import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Logger,
} from '@nestjs/common';
import { VacationService } from './vacation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateVacationDto } from './dto/create-vacation.dto';

@Controller('vacations')
@UseGuards(JwtAuthGuard)
export class VacationController {
  private readonly logger = new Logger(VacationController.name);
  constructor(private readonly vacationService: VacationService) {}

  @Get('summary')
  async getSummary(@Request() req: any) {
    return this.vacationService.getSummary(req.user.id);
  }

  @Get()
  async getMyVacations(@Request() req: any) {
    return this.vacationService.getMyVacations(req.user.id);
  }

  @Post()
  async requestVacation(
    @Request() req: any,
    @Body() body: CreateVacationDto,
  ) {
    return this.vacationService.requestVacation(req.user.id, body);
  }

  @Get('dept-requests')
  async getDeptRequests(@Request() req: any) {
    if (!req.user.departmentId) return [];
    const { startDate, endDate } = req.query;
    return this.vacationService.getDepartmentRequests(
      req.user.departmentId,
      startDate,
      endDate,
    );
  }

  @Get('dept-pending-count')
  async getDeptPendingCount(@Request() req: any) {
    return this.vacationService.getDeptPendingCount(req.user.departmentId);
  }

  // --- Administrative Endpoints ---

  @UseGuards(RolesGuard)
  @Roles('TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO')
  @Get('admin/all')
  async getAdminAll() {
    return this.vacationService.getAdminAll();
  }

  @UseGuards(RolesGuard)
  @Roles('TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO')
  @Post('admin/bulk')
  async bulkRequest(
    @Body()
    body: {
      targetType: 'ALL' | 'DEPT' | 'USER';
      targetIds?: number[];
      type: string;
      startDate: string;
      endDate: string;
      reason?: string;
    },
  ) {
    const { targetType, targetIds, ...dto } = body;
    return this.vacationService.bulkRequest(targetType, targetIds, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO')
  @Post('admin/:id') // Using POST for compatibility or PATCH if preferred
  async updateVacation(@Request() req: any, @Body() body: any) {
    const id = parseInt(req.params.id);
    return this.vacationService.updateVacation(id, body);
  }

  @UseGuards(RolesGuard)
  @Roles('TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO')
  @Get('admin/stats')
  async getAdminStats(@Request() req: any) {
    const { year, name, deptId } = req.query;
    const role = req.user.role;

    // 역할별 데이터 스코핑 강제
    let finalDeptId = deptId ? parseInt(deptId) : undefined;
    let finalTeamId: number | undefined = undefined;

    if (role === 'TEAM_LEADER') {
      // 팀장: 자기 팀원만 조회
      finalTeamId = req.user.teamId;
      finalDeptId = undefined; // teamId로 필터링하므로 deptId 불필요
    } else if (role === 'DEPT_HEAD') {
      // 부서장: 자기 부서만 조회
      finalDeptId = req.user.departmentId;
    }
    // CEO/EXECUTIVE: 제한 없음

    return this.vacationService.getAdminStats(
      year ? parseInt(year) : undefined,
      name,
      finalDeptId,
      finalTeamId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO')
  @Post('admin/stats-config/:userId')
  async saveStatsConfig(@Param('userId') userId: string, @Body() body: any) {
    this.logger.log(
      `Saving stats config for user ${userId}: ${JSON.stringify(body)}`,
    );
    const targetUserId = parseInt(userId);
    return this.vacationService.saveStatsConfig(targetUserId, body);
  }

  @UseGuards(RolesGuard)
  @Roles('TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO')
  @Post('admin/:id/delete') // Explicit delete route if DELETE method has issues, but DELETE is better
  async deleteVacation(@Request() req: any) {
    const id = parseInt(req.params.id);
    return this.vacationService.deleteVacation(id);
  }
}
