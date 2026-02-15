# Plan: n1-query-fix

## 개요
백엔드 서비스의 N+1 쿼리, O(n*m) 인메모리 필터링, 순차 await 등 15건의 성능 이슈 수정.

## 발견된 이슈 (15건)

### CRITICAL (1건)
| # | 파일 | 라인 | 문제 | 수정 방안 |
|---|------|------|------|-----------|
| 1b | work-status.service.ts | 94-115 | O(n*m) 인메모리 필터링 (.some/.find) | Map/Set 인덱싱으로 O(1) 조회 |

### HIGH (4건)
| # | 파일 | 라인 | 문제 | 수정 방안 |
|---|------|------|------|-----------|
| 1a | work-status.service.ts | 25-29 | 불필요 user 쿼리 (departmentId) | requestUser 직접 사용 |
| 1c | work-status.service.ts | 160-163 | 불필요 user 쿼리 (중복) | requestUser 직접 사용 |
| 2b | metrics.service.ts | 173-189 | N+1 집계 루프 | Prisma groupBy 사용 |
| 4a | vacation.service.ts | 279-337 | 앱 레이어 집계 루프 | DB 집계 또는 Map 인덱싱 |

### MEDIUM (7건)
| # | 파일 | 라인 | 문제 | 수정 방안 |
|---|------|------|------|-----------|
| 1d | work-status.service.ts | 252-266 | 순차 await | Promise.all() 병렬화 |
| 2a | metrics.service.ts | 10-34 | 과잉 fetch (switch 전) | select 최소화 |
| 2c | metrics.service.ts | 152-158 | 인메모리 필터링 | 쿼리 where 절 사용 |
| 4b | vacation.service.ts | 38-66 | 동일 데이터 다중 쿼리 | include로 통합 |
| 5a | reports.service.ts | 55-99 | 개별 update 루프 | Promise.all 배치 |
| 5b | reports.service.ts | 35-45 | .includes() O(n) | Set.has() O(1) |
| 9a | vacation.service.ts | 370-389 | 순차 upsert 루프 | Promise.all() 배치 |

### LOW (3건)
| # | 파일 | 라인 | 문제 | 수정 방안 |
|---|------|------|------|-----------|
| 3a | dashboard.service.ts | 53-55 | forEach → reduce | 코드 스타일 개선 |
| 6a | reports.service.ts | 270-283 | 반복 날짜 변환 | 사전 변환 Map |
| 7a | reports.service.ts | 366-383 | include 과잉 | select 최소화 |

## 수정 순서

### Phase 1: work-status.service.ts (1a, 1b, 1c, 1d)
- 불필요 쿼리 제거, Map 인덱싱, Promise.all 병렬화

### Phase 2: metrics.service.ts (2a, 2b, 2c)
- select 최소화, groupBy 집계, where 절 필터링

### Phase 3: vacation.service.ts (4a, 4b, 9a)
- Map 인덱싱, include 통합, Promise.all 배치

### Phase 4: reports.service.ts (5a, 5b, 6a, 7a)
- Set 사용, 날짜 사전변환, select 최소화

### Phase 5: dashboard.service.ts (3a)
- forEach → reduce

## 원칙
- **기능 변경 없음**: 반환값 동일 보장
- **빌드 검증**: 수정 후 반드시 tsc --noEmit 확인
- **단계별 진행**: 파일 단위로 수정 및 검증

## 성공 기준
- [ ] 15건 이슈 중 CRITICAL/HIGH 5건 전부 수정
- [ ] MEDIUM 7건 중 최소 5건 수정
- [ ] 빌드 성공
- [ ] 기존 기능 동작 유지
