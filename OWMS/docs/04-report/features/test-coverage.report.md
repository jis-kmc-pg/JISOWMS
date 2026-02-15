# Report: test-coverage

## 요약
백엔드 테스트 커버리지 개선. 기존 실패 테스트 수정 + 4개 서비스 신규 테스트 추가.

## 결과
- **Tests**: 43개 → 76개 (+33개)
- **Test Suites**: 4개 → 8개 (+4개)
- **Statement Coverage**: 10.66% → 21.76% (+11.1%p)
- **빌드**: 모든 테스트 통과 (8 suites, 76 tests)

## 수정 내역

### 기존 테스트 수정 (2개 파일)

| 파일 | 변경 | 원인 |
|------|------|------|
| `app.controller.spec.ts` | PrismaService mock 추가 | AppService → PrismaService 의존성 누락 |
| `vacation.service.spec.ts` | getSummary mock 패턴 변경 | n1-query-fix에서 3회 쿼리 → 1회 include 쿼리로 리팩토링 |

### 신규 테스트 파일 (4개)

#### 1. `dashboard.service.spec.ts` (6 tests)
| 테스트 | 내용 |
|--------|------|
| getSummary - all fields | 대시보드 요약 전체 필드 반환 검증 |
| getSummary - half-day | 반차 0.5일 계산 검증 |
| getSummary - absence types | 팀 부재 유형 매핑 (오전반차/오후반차/연차) |
| getRecentJobs - with project | 프로젝트명 포함 최근 업무 |
| getRecentJobs - null project | 프로젝트 없을 때 '일반 업무' 기본값 |
| should be defined | 서비스 인스턴스 검증 |

**커버리지**: 0% → 93.3% Lines

#### 2. `metrics.service.spec.ts` (8 tests)
| 테스트 | 내용 |
|--------|------|
| getDashboardStats - user not found | 사용자 미존재 에러 |
| getDashboardStats - CEO | 전사 현황 (scope: COMPANY) |
| getDashboardStats - EXECUTIVE | 임원 전사 현황 |
| getDashboardStats - DEPT_HEAD | 부서 현황 |
| getDashboardStats - DEPT_HEAD no dept | 부서 미배정 에러 |
| getDashboardStats - TEAM_LEAD | 팀 현황 |
| getDashboardStats - TEAM_LEAD no team | 팀 미배정 에러 |
| getDashboardStats - MEMBER | 개인 현황 |

**커버리지**: 0% → 83.3% Lines

#### 3. `work-status.service.spec.ts` (8 tests)
| 테스트 | 내용 |
|--------|------|
| getWeeklyStatus - 7 days | 주간 7일 구조 반환 |
| getWeeklyStatus - DONE with job | 업무 있으면 DONE |
| getWeeklyStatus - DONE with 연차 | 연차 상태면 DONE |
| getWeeklyStatus - MISSING | 업무/면제 없으면 MISSING |
| getWeeklyStatus - dept filter | 비CEO 부서 필터링 |
| getWeeklyStatus - team filter | teamId 필터링 |
| getWeeklyDetail - with jobs | 일별 업무 상세 |
| getWeeklyDetail - empty | 업무 없을 때 빈 배열 |

**커버리지**: 0% → 42.6% Lines

#### 4. `user.service.spec.ts` (8 tests)
| 테스트 | 내용 |
|--------|------|
| getProfile - success | 프로필 조회 성공 |
| getProfile - not found | 사용자 미존재 NotFoundException |
| updateProfile | 이름/이메일 수정 |
| changePassword - success | 비밀번호 변경 성공 |
| changePassword - not found | 사용자 미존재 |
| changePassword - wrong password | 현재 비밀번호 불일치 UnauthorizedException |
| searchUsers - with query | 검색어로 필터링 |
| searchUsers - empty query | 전체 조회 |

**커버리지**: 0% → 100% Lines

## 서비스별 커버리지 요약

| 서비스 | Before | After | 변화 |
|--------|--------|-------|------|
| auth.service | 100% | 100% | - |
| user.service | 0% | **100%** | +100%p |
| dashboard.service | 0% | **93.3%** | +93.3%p |
| metrics.service | 0% | **83.3%** | +83.3%p |
| vacation.service | 45.6% | 45.6% | - |
| work-status.service | 0% | **42.6%** | +42.6%p |
| reports.service | 36% | 36% | - |

## 변경 파일 목록 (6개)
1. `src/app.controller.spec.ts` — PrismaService mock 추가
2. `src/vacation/vacation.service.spec.ts` — getSummary mock 패턴 수정
3. `src/dashboard/dashboard.service.spec.ts` — 신규 (6 tests)
4. `src/metrics/metrics.service.spec.ts` — 신규 (8 tests)
5. `src/work-status/work-status.service.spec.ts` — 신규 (8 tests)
6. `src/user/user.service.spec.ts` — 신규 (8 tests)
