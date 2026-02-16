import { Module } from '@nestjs/common';
import { TeamStatusService } from './team-status.service';
import { TeamStatusController } from './team-status.controller';

@Module({
    controllers: [TeamStatusController],
    providers: [TeamStatusService],
})
export class TeamStatusModule {}
