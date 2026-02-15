# Plan: PrismaService Global Module

## Problem
PrismaService가 12곳에 중복 등록:
- app.module.ts (1곳)
- 자식 모듈 11곳 (auth, reports, dashboard, work-status, vacation, excel, user, admin, metrics, vehicle, dispatch, board)

각 모듈마다 별도 PrismaService 인스턴스가 생성되어 불필요한 DB 커넥션 낭비.

## Solution
`@Global()` 데코레이터가 적용된 `PrismaModule`을 만들어 한 번만 등록하면 전역에서 사용 가능.

## Scope
- 신규: `src/prisma.module.ts`
- 수정: `src/app.module.ts` (PrismaModule import)
- 수정: 11개 자식 모듈 (PrismaService providers에서 제거)

## Risk: LOW
- 기능 변경 없음, DI 방식만 변경
- NestJS 공식 권장 패턴
