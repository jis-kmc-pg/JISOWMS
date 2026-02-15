import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
  Patch,
} from '@nestjs/common';

import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('jobs')
  async getJobs(@Request() req: any, @Query('date') date: string) {
    return this.reportsService.getJobsByDate(req.user.id, date);
  }

  @Post('jobs')
  async saveJobs(
    @Request() req: any,
    @Body() body: { date: string; jobs: any[] },
  ) {
    return this.reportsService.saveJobs(req.user.id, body.date, body.jobs);
  }

  @Get('weekly-note')
  async getWeeklyNote(
    @Request() req: any,
    @Query('weekStart') weekStart: string,
  ) {
    return this.reportsService.getWeeklyNote(req.user.id, weekStart);
  }

  @Post('weekly-note')
  async saveWeeklyNote(
    @Request() req: any,
    @Body() body: { weekStart: string; content: string },
  ) {
    return this.reportsService.saveWeeklyNote(
      req.user.id,
      body.weekStart,
      body.content,
    );
  }

  @Get('projects')
  async getProjects(@Query('status') status?: string) {
    // If status is passed (e.g. 'ALL'), service handles it.
    return this.reportsService.getProjects(status);
  }

  @Post('projects')
  async createProject(
    @Body() body: { projectName: string; clientName?: string },
  ) {
    return this.reportsService.createProject(body);
  }

  @Patch('projects/:id')
  async updateProject(
    @Param('id') id: string,
    @Body() body: { projectName: string; clientName?: string; status?: string },
  ) {
    return this.reportsService.updateProject(parseInt(id), body);
  }

  @Get('daily-status')
  async getDailyStatus(@Request() req: any, @Query('date') date: string) {
    return this.reportsService.getDailyStatus(req.user.id, date);
  }

  @Post('daily-status')
  async saveDailyStatus(
    @Request() req: any,
    @Body() body: { date: string; workType: string; holidayName?: string },
  ) {
    return this.reportsService.saveDailyStatus(req.user.id, body.date, {
      workType: body.workType,
      holidayName: body.holidayName,
    });
  }

  @Get('my-status')
  async getMyWeeklyStatus(@Request() req: any, @Query('date') date: string) {
    return this.reportsService.getMyWeeklyStatus(req.user.id, date);
  }

  @Get('my-weekly-detail')
  async getMyWeeklyDetail(@Request() req: any, @Query('date') date: string) {
    return this.reportsService.getMyWeeklyDetail(req.user.id, date);
  }

  @Get('system-memos')
  async getSystemMemos(@Query('date') date: string) {
    return this.reportsService.getSystemMemos(date);
  }

  @Post('system-memos')
  async saveSystemMemo(
    @Request() req: any,
    @Body() body: { content: string; date: string },
  ) {
    return this.reportsService.saveSystemMemo(
      req.user.id,
      body.content,
      body.date,
    );
  }

  @Get('search-jobs')
  async searchJobs(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.searchPastJobs(req.user.id, startDate, endDate);
  }
}
