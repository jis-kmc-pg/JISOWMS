import { Module } from '@nestjs/common';
import { WorkStatusController } from './work-status.controller';
import { WorkStatusService } from './work-status.service';

@Module({
  controllers: [WorkStatusController],
  providers: [WorkStatusService],
})
export class WorkStatusModule {}
