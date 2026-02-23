import { Module, Global } from '@nestjs/common';
import { DashboardGateway } from './dashboard.gateway';
import { NotificationGateway } from './notification.gateway';

@Global()
@Module({
  providers: [DashboardGateway, NotificationGateway],
  exports: [DashboardGateway, NotificationGateway],
})
export class GatewayModule {}
