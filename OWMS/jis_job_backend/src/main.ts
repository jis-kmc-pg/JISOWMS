import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './app.module';

/**
 * DB Failover: 연결 가능한 DB URL을 결정합니다.
 *
 * 우선순위:
 *   1순위 — 내부망 (DATABASE_URL_INTERNAL)  → 타임아웃 5초
 *   2순위 — 외부망 (DATABASE_URL_EXTERNAL)  → 타임아웃 10초
 *   3순위 — 기본   (DATABASE_URL)           → 그대로 사용
 *
 * 결정된 URL을 process.env.DATABASE_URL 에 덮어쓰므로,
 * 이후 생성되는 모든 PrismaClient 인스턴스가 올바른 DB에 연결됩니다.
 */
async function resolveDbUrl(): Promise<void> {
  const logger = new Logger('DB-Failover');
  const internalUrl = process.env.DATABASE_URL_INTERNAL;
  const externalUrl = process.env.DATABASE_URL_EXTERNAL;

  // URL에서 호스트:포트만 추출 (로그 표시용)
  const extractHost = (url: string) => {
    const match = url.match(/@([^/]+)\//);
    return match ? match[1] : url;
  };

  // ── 1순위: 내부망 ──
  if (internalUrl) {
    const host = extractHost(internalUrl);
    logger.log(`🔌 [1순위 - 내부망] DB 연결 시도 중... (${host})`);
    const ok = await testConnection(internalUrl, 5000);
    if (ok) {
      process.env.DATABASE_URL = internalUrl;
      logger.log(`✅ [내부망] DB 연결 성공 (${host})`);
      return;
    }
    logger.warn(`⚠️ [내부망] DB 연결 실패 — 외부망으로 전환 시도`);
  }

  // ── 2순위: 외부망 ──
  if (externalUrl) {
    const host = extractHost(externalUrl);
    logger.log(`🌐 [2순위 - 외부망] DB 연결 시도 중... (${host})`);
    const ok = await testConnection(externalUrl, 10000);
    if (ok) {
      process.env.DATABASE_URL = externalUrl;
      logger.log(`✅ [외부망] DB 연결 성공 (${host})`);
      return;
    }
    logger.warn(`⚠️ [외부망] DB 연결 실패`);
  }

  // ── 3순위: 기본 DATABASE_URL ──
  if (process.env.DATABASE_URL) {
    logger.warn('⚙️ 내부/외부망 모두 실패. 기본 DATABASE_URL 사용');
  } else {
    logger.error('❌ 사용 가능한 DATABASE_URL이 없습니다!');
  }
}

/**
 * 주어진 URL로 DB 연결을 테스트합니다.
 * 타임아웃 내에 연결 성공하면 true, 실패하면 false를 반환합니다.
 */
async function testConnection(
  url: string,
  timeoutMs: number,
): Promise<boolean> {
  const logger = new Logger('DB-Failover');
  const client = new PrismaClient({
    datasources: { db: { url } },
  });

  try {
    await Promise.race([
      client.$connect(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`타임아웃 (${timeoutMs / 1000}초)`)),
          timeoutMs,
        ),
      ),
    ]);
    return true;
  } catch (error) {
    logger.warn(`   연결 실패 원인: ${error.message}`);
    return false;
  } finally {
    // 테스트용 클라이언트는 항상 정리
    try {
      await client.$disconnect();
    } catch {
      // 연결 실패 시 disconnect도 실패할 수 있으므로 무시
    }
  }
}

async function bootstrap() {
  // ── DB Failover: NestJS 부팅 전에 올바른 DB URL 결정 ──
  await resolveDbUrl();

  const app = await NestFactory.create(AppModule);

  // 보안 미들웨어
  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:1420',
      'http://192.168.123.46:3000',
      'tauri://localhost',
    ], // 프론트엔드 및 Tauri 앱 허용
    credentials: true,
  });

  // 유효성 검사
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
