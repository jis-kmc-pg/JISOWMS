import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma DB 연결 서비스
 *
 * DB 연결 Failover 로직은 main.ts의 resolveDbUrl()에서 처리합니다.
 * 앱 부트스트랩 전에 process.env.DATABASE_URL이 올바른 URL로 설정되므로,
 * 이 서비스는 단순히 연결/해제만 담당합니다.
 *
 * Failover 우선순위 (main.ts에서 결정):
 *   1순위 — 내부망 (DATABASE_URL_INTERNAL)
 *   2순위 — 외부망 (DATABASE_URL_EXTERNAL)
 *   3순위 — 기본   (DATABASE_URL)
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ DB 연결 완료');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
