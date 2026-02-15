# Plan: Logger Migration (console.log → NestJS Logger)

## Feature Overview
- **Feature**: Backend console.log/error를 NestJS Logger로 전환
- **Priority**: MEDIUM
- **Risk**: LOW (기능 로직 변경 없음, 로깅 방식만 변경)

## Problem Statement
프로덕션 환경에서 console.log는:
1. 로그 레벨 구분 불가 (debug/info/warn/error)
2. 타임스탬프 자동 미포함
3. 로그 필터링 불가
4. 구조화된 로깅 불가

## Scope

### 대상 파일 (5개, 15건)
| File | console.log | console.error | Total |
|------|:-----------:|:-------------:|:-----:|
| excel/excel.controller.ts | 4 | 2 | 6 |
| excel/excel.service.ts | 3 | 0 | 3 |
| board/board.service.ts | 1 | 0 | 1 |
| vacation/vacation.service.ts | 1 | 0 | 1 |
| reports/reports.service.ts | 0 | 3 | 3 |
| **Total** | **9** | **5** | **14** |

### 변환 규칙
| 기존 | 변환 후 | 용도 |
|------|---------|------|
| console.log (디버그) | this.logger.debug() | 개발 시 디버그 정보 |
| console.log (정보) | this.logger.log() | 일반 정보 로깅 |
| console.error | this.logger.error() | 에러 로깅 |

## Success Criteria
- [ ] 모든 console.log/error가 NestJS Logger로 전환
- [ ] Backend TypeScript 빌드 성공
- [ ] 기존 테스트 42개 전체 PASS
- [ ] 기능 동작 변경 없음
