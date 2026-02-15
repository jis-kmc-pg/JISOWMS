import { Controller, Get, Query, Res, UseGuards, Req, ForbiddenException, Logger } from '@nestjs/common';
import * as express from 'express';
import { ExcelService } from './excel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('excel')
export class ExcelController {
  private readonly logger = new Logger(ExcelController.name);
  constructor(private readonly excelService: ExcelService) {}

  @Get('weekly-report')
  @UseGuards(JwtAuthGuard)
  async downloadWeeklyReport(
    @Query('date') date: string,
    @Query('userId') queryUserId: string,
    @Req() req: any,
    @Res() res: express.Response,
  ) {
    this.logger.log(
      `downloadWeeklyReport called. RequestUser: ${req.user.id}, Role: ${req.user.role}, QueryDate: ${date}, QueryUserId: ${queryUserId}`,
    );
    try {
      let targetUserId = req.user.id; // Default to self

      // If user is TEAM_LEADER or ADMIN and requests a specific userId, allow it
      if (
        (['TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO'].includes(req.user.role)) &&
        queryUserId
      ) {
        targetUserId = parseInt(queryUserId, 10);
        this.logger.log(
          `Authorized access to other user's report. TargetUserId: ${targetUserId}`,
        );
      } else if (queryUserId && parseInt(queryUserId, 10) !== req.user.id) {
        throw new ForbiddenException('본인의 보고서만 다운로드할 수 있습니다.');
      }

      const buffer = await this.excelService.generateWeeklyReport(
        targetUserId,
        date,
      );
      this.logger.log(
        `Report generated for User ${targetUserId}. Buffer size: ${buffer.length}`,
      );

      const filename = `WeeklyReport_${targetUserId}_${date}.xlsx`;

      const encodedFilename = encodeURIComponent(filename);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      this.logger.error('Error in downloadWeeklyReport', error.stack);
      res
        .status(500)
        .send({ message: 'Excel generation failed', error: error.message });
    }
  }

  @Get('team-weekly-report')
  @UseGuards(JwtAuthGuard)
  async downloadTeamWeeklyReport(
    @Query('teamId') teamId: string,
    @Query('date') date: string,
    @Res() res: express.Response,
  ) {
    this.logger.log(
      `downloadTeamWeeklyReport called. Team: ${teamId}, Date: ${date}`,
    );
    try {
      const buffer = await this.excelService.generateTeamWeeklyReport(
        parseInt(teamId),
        date,
      );
      this.logger.log(
        `Team Report generated. Buffer size: ${buffer.length}`,
      );

      const filename = `TeamWeeklyReport_${teamId}_${date}.zip`;

      const encodedFilename = encodeURIComponent(filename);
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      this.logger.error('Error in downloadTeamWeeklyReport', error.stack);
      res.status(500).send({
        message: 'Team Excel generation failed',
        error: error.message,
      });
    }
  }
}
