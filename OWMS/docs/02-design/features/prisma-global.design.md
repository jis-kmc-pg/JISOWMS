# Design: PrismaService Global Module

## 1. 신규 파일: src/prisma.module.ts
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## 2. app.module.ts 수정
- imports에 `PrismaModule` 추가
- providers에서 `PrismaService` 제거

## 3. 자식 모듈 11개 수정
각 모듈에서:
- `import { PrismaService }` 제거
- `providers`에서 `PrismaService` 제거

대상 모듈:
1. auth.module.ts
2. reports.module.ts
3. dashboard.module.ts
4. work-status.module.ts
5. vacation.module.ts
6. excel.module.ts
7. user.module.ts
8. admin.module.ts
9. metrics.module.ts
10. vehicle.module.ts
11. dispatch.module.ts
12. board.module.ts
