import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Request() req: any) {
    return this.dashboardService.getSummary(req.user.id);
  }

  @Get('recent-jobs')
  async getRecentJobs(@Request() req: any) {
    return this.dashboardService.getRecentJobs(req.user.id);
  }
}
