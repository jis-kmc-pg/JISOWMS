# Design: Logger Migration

## Implementation Pattern

각 서비스/컨트롤러에 NestJS Logger 인스턴스 추가:

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class ExampleService {
  private readonly logger = new Logger(ExampleService.name);

  someMethod() {
    this.logger.log('정보 메시지');      // console.log (info)
    this.logger.debug('디버그 메시지');   // console.log (debug)
    this.logger.error('에러 메시지', error.stack); // console.error
  }
}
```

## File-by-File Design

### 1. excel/excel.controller.ts (6건)
- Line 18-20: `console.log(request info)` → `this.logger.log()`
- Line 30-32: `console.log(authorized access)` → `this.logger.log()`
- Line 41-43: `console.log(report generated)` → `this.logger.log()`
- Line 57: `console.error(download error)` → `this.logger.error()`
- Line 71-73: `console.log(team report)` → `this.logger.log()`
- Line 79-81: `console.log(team report generated)` → `this.logger.log()`
- Line 94-96: `console.error(team error)` → `this.logger.error()`

### 2. excel/excel.service.ts (3건)
- Line 23-25: `console.log(generate start)` → `this.logger.log()`
- Line 34: `console.log(querying)` → `this.logger.debug()`
- Line 75: `console.log(reading template)` → `this.logger.debug()`

### 3. board/board.service.ts (1건)
- Line 22: `console.log(auto-created board)` → `this.logger.log()`

### 4. vacation/vacation.service.ts (1건)
- Line 349: `console.log(saveStatsConfig)` → `this.logger.debug()`

### 5. reports/reports.service.ts (3건)
- Line 79-81: `console.error(project update fail)` → `this.logger.error()`
- Line 316: `console.error(getSystemMemos error)` → `this.logger.error()`
- Line 331: `console.error(saveSystemMemo error)` → `this.logger.error()`

## Log Level Guidelines
- `logger.log()`: 비즈니스 이벤트 (보고서 생성, 권한 확인 등)
- `logger.debug()`: 개발용 디버그 (쿼리, 설정 값 등)
- `logger.error()`: 예외/에러 (stack trace 포함)
