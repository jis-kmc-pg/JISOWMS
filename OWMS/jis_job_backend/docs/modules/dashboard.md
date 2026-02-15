# Dashboard/Metrics Module 기술 명세서

## 1. 개요 (Overview)
전체 부서/팀의 업무 진행율, 주간 통계 및 대시보드용 요약 데이터를 제공합니다.

## 2. 기술적 관심사 (Technical Concerns)
- **실시간 집계 (On-the-fly Aggregation)**: 별도의 집계 테이블 없이 요청 시점에 전체 User의 Job 데이터를 `findMany`로 가져와 메모리에서 완료 여부(Completion) 판별.
- **완료 조건 (Definition of Done)**: 해당 날짜에 `Job`이 1개 이상 존재하거나, `DailyStatus.workType`이 휴무성(연차, 공휴일 등)인 경우 '완료'로 간주.
- **권한별 필터링**: 요청자의 Role에 따라 소속 부서만 조회하거나 전체 부서를 조회하는 접근 제어 로직.

## 3. 데이터 모델 연동 (Data Integration)
- **Models**: `User`, `Department`, `Team`, `Job`, `DailyStatus`.
- **Output**: 완성도 행렬 (Date x User Matrix).

## 4. 리팩토링 및 개선 가이드
- **현재 상태**: 주간 요약 조회(`getWeeklySummary`) 시 N+1 쿼리 발생 가능성이 매우 높음 (사용자별로 매번 `Job`과 `DailyStatus`를 개별 쿼리).
- **개선안**:
  - 부서/팀 단위의 `findMany` 쿼리를 한 번에 수행하여 메모리에서 필터링하거나, `Prisma`의 `_count`, `_sum` 기능을 활용한 집계 쿼리로 전환.
  - 자주 변경되지 않는 과거 통계 데이터는 Redis 등 캐싱 계층 도입 검토.
