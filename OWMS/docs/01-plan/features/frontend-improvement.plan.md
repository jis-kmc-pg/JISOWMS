# Plan: Frontend Improvement (코드 위생 개선)

## 개요
| 항목 | 내용 |
|------|------|
| Feature | frontend-improvement |
| 범위 | Frontend (jis_job_frontend) |
| 우선순위 | HIGH |
| 위험도 | LOW (기능 로직 변경 없음) |

## 현황 분석

### 프로젝트 정보
- Next.js 16.1.6 + React 19.2.3 + TypeScript 5
- TailwindCSS 4 + Recharts 3 + Axios
- 17개 라우트, 50+ 컴포넌트 파일
- 현재 코드 품질 점수: 72/100

### 발견된 문제

#### 1. Error/Loading Boundary 부재 (CRITICAL)
- `error.tsx` 파일: **0개** (전체 app 디렉토리)
- `loading.tsx` 파일: **0개** (전체 app 디렉토리)
- 미처리 에러 발생 시 앱 전체 크래시 위험

#### 2. TypeScript `any` 사용 (31건)
| 파일 | 건수 | 유형 |
|------|------|------|
| dashboard/page.tsx | 10 | map/filter 콜백 |
| daily-report/page.tsx | 6 | 함수 파라미터 |
| vacation-mgmt/stats/page.tsx | 6 | 함수/상태 |
| VacationStats.tsx | 6 | 함수/상태 |
| DeptTeamSettings.tsx | 10 | catch (err: any) |
| dashboard-layout.tsx | 1 | menuItems: any[] |
| DashboardChart.tsx | 1 | data: any[] |
| dispatch/page.tsx | 1 | catch (err: any) |
| login/page.tsx | 1 | catch (err: any) |

#### 3. Console.log 잔존 (5건)
| 파일 | 건수 |
|------|------|
| daily-report/page.tsx | 1 |
| login/page.tsx | 1 |
| weekly-status/page.tsx | 3 |

#### 4. 테스트 커버리지 (0%)
- Jest + Testing Library 설정됨
- 테스트 파일 없음

## 개선 범위 (이번 PDCA)

### 포함 (기능 로직 변경 없음)
1. **error.tsx 생성** - 글로벌 + 주요 라우트 에러 바운더리
2. **loading.tsx 생성** - 글로벌 + 주요 라우트 로딩 상태
3. **console.log 제거** - 5건 삭제
4. **TypeScript any 제거** - 적절한 인터페이스로 교체 (31건)

### 제외 (별도 PDCA 필요)
- 테스트 코드 작성 (test-improvement 별도)
- daily-report 리팩토링 (1339줄 분리, 별도 승인 필요)
- UI/UX 변경 (사용자 승인 필요)

## 예상 효과
- 에러 발생 시 사용자 친화적 폴백 UI 제공
- 페이지 로딩 중 스켈레톤/스피너 표시
- TypeScript 타입 안전성 향상
- 프로덕션 배포 시 디버그 로그 노출 방지
- 코드 품질 점수: 72 → 85+ 목표

## 영향받는 파일
- 신규: ~12개 (error.tsx, loading.tsx 파일들)
- 수정: ~10개 (any 제거, console.log 제거)
- 삭제: 0개
