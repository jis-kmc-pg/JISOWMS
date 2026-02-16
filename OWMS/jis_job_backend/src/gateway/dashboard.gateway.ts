import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:1420'],
    credentials: true,
  },
  namespace: '/dashboard',
})
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** 특정 위젯의 데이터가 변경되었을 때 호출 */
  notifyWidgetUpdate(widgetId: string) {
    this.server.emit('widget:refresh', { widgetId, timestamp: Date.now() });
  }

  /** 전체 대시보드 새로고침 알림 */
  notifyDashboardRefresh() {
    this.server.emit('dashboard:refresh', { timestamp: Date.now() });
  }
}
