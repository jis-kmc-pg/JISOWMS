import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('dashboard')
  async getDashboardStats(@Req() req: any) {
    const userId = req.user.sub; // From JWT Strategy
    return this.metricsService.getDashboardStats(userId);
  }
}
