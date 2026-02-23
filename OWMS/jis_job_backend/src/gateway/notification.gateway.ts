import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface VacationNotification {
  type: 'vacation_request' | 'vacation_approved';
  userId: number;
  userName: string;
  startDate: string;
  endDate: string;
  vacationType: string;
  timestamp: number;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:1420',
      'http://192.168.123.75:3000',
      'http://192.168.123.75',
      'http://192.168.123.46:3000',
      'tauri://localhost',
    ],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userConnections = new Map<number, string[]>(); // userId -> socketIds[]

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove from userConnections
    for (const [userId, socketIds] of this.userConnections.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index > -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.userConnections.delete(userId);
        }
        this.logger.log(`Removed user ${userId} connection: ${client.id}`);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, payload: { userId: number }) {
    const { userId } = payload;
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }
    this.userConnections.get(userId)!.push(client.id);
    this.logger.log(`User ${userId} registered with socket ${client.id}`);
    client.emit('registered', { userId, socketId: client.id });
  }

  /**
   * 연차 신청 알림 발송
   * @param targetUserIds 알림 받을 사용자 ID 배열 (팀장, 부서장)
   * @param notification 알림 데이터
   */
  sendVacationRequest(
    targetUserIds: number[],
    notification: VacationNotification,
  ) {
    targetUserIds.forEach((userId) => {
      const socketIds = this.userConnections.get(userId);
      if (socketIds && socketIds.length > 0) {
        socketIds.forEach((socketId) => {
          this.server.to(socketId).emit('vacation:request', notification);
          this.logger.log(
            `Sent vacation request notification to user ${userId} (${socketId})`,
          );
        });
      } else {
        this.logger.warn(
          `User ${userId} not connected, notification not sent`,
        );
      }
    });
  }

  /**
   * 연차 승인 알림 발송
   * @param targetUserId 알림 받을 사용자 ID (신청자)
   * @param notification 알림 데이터
   */
  sendVacationApproved(
    targetUserId: number,
    notification: VacationNotification,
  ) {
    const socketIds = this.userConnections.get(targetUserId);
    if (socketIds && socketIds.length > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('vacation:approved', notification);
        this.logger.log(
          `Sent vacation approved notification to user ${targetUserId} (${socketId})`,
        );
      });
    } else {
      this.logger.warn(
        `User ${targetUserId} not connected, notification not sent`,
      );
    }
  }
}
