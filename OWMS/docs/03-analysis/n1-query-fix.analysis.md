# Gap Analysis: n1-query-fix

## 검증 항목 (15건 중 10건 수정 대상)

### 수정 완료 (10/10)

| # | 파일 | 이슈 | 상태 | 수정 내용 |
|---|------|------|------|-----------|
| 1a | work-status.service.ts | 불필요 user 쿼리 | PASS | requestUser.departmentId 직접 사용 |
| 1b | work-status.service.ts | O(n*m) .some/.find | PASS | Set/Map 인덱싱으로 O(1) 조회 |
| 1c | work-status.service.ts | 불필요 user 쿼리 (중복) | PASS | requestUser.departmentId 직접 사용 |
| 1d | work-status.service.ts | 순차 await | PASS | Promise.all() 병렬화 |
| 2a | metrics.service.ts | 과잉 include | PASS | select { role, departmentId, teamId } |
| 4b | vacation.service.ts | 동일 데이터 다중 쿼리 | PASS | 단일 쿼리 (include vacations + adjustments) |
| 9a | vacation.service.ts | 순차 upsert 루프 | PASS | Promise.all() 배치 |
| 5b | reports.service.ts | .includes() O(n) | PASS | Set.has() O(1) |
| 6a | reports.service.ts | 반복 날짜 변환 | PASS | 사전 변환 Set/Map |
| 3a | dashboard.service.ts | forEach → reduce | PASS | reduce 패턴 |

### 스킵 사유 (5건)

| # | 파일 | 이슈 | 사유 |
|---|------|------|------|
| 2b | metrics.service.ts | N+1 집계 루프 | 이미 include로 한 번에 로드. in-memory Map 사용은 적절 |
| 2c | metrics.service.ts | 인메모리 필터링 | where 절로 이미 2주분만 로드. 추가 분리 시 오히려 쿼리 증가 |
| 4a | vacation.service.ts | 앱 레이어 집계 | include로 한 번에 로드 후 forEach. 실제 N+1 아님 |
| 5a | reports.service.ts | 개별 update | 이미 Promise.all 내에서 병렬 실행 중 |
| 7a | reports.service.ts | include 과잉 | 프론트엔드가 project 전체 데이터 사용. LOW 우선순위 |

## Match Rate: 100% (10/10 수정 대상 항목 통과)

## 빌드 검증
- `npx tsc --noEmit`: 에러 0건 (통과)

## 성능 개선 요약

| 파일 | Before | After |
|------|--------|-------|
| work-status.service.ts | O(n*m) 필터링 + 불필요 쿼리 2건 + 순차 await | O(n) Set/Map + 쿼리 제거 + Promise.all |
| metrics.service.ts | include { department, team } 전체 로드 | select { role, departmentId, teamId } |
| vacation.service.ts | 3회 쿼리(user+vacations+adjustments) + 순차 upsert | 1회 쿼리(include) + Promise.all 배치 |
| reports.service.ts | .includes() O(n) + 반복 toKSTString | Set.has() O(1) + 사전 변환 Map |
| dashboard.service.ts | forEach + let | reduce 패턴 |
