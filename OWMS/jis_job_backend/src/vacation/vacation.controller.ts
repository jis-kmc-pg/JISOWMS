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
    @Body()
    body: { type: string; startDate: string; endDate: string; reason?: string },
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
    return this.vacationService.getAdminStats(
      year ? parseInt(year) : undefined,
      name,
      deptId ? parseInt(deptId) : undefined,
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
