# CHANGELOG

JISOWMS (JIS 업무 관리 시스템) 변경 이력.

## [2026-02-15] 테스트 커버리지 개선 (test-coverage)

### Testing (test-coverage)
- **Backend**: 기존 실패 테스트 2개 수정
  - `app.controller.spec.ts`: PrismaService mock 누락 → 추가
  - `vacation.service.spec.ts`: n1-query-fix 리팩토링 후 mock 패턴 동기화
- **Backend**: 신규 테스트 4개 서비스 추가
  - `dashboard.service.spec.ts` (6 tests) — 커버리지 0% → 93.3%
  - `metrics.service.spec.ts` (8 tests) — 커버리지 0% → 83.3%
  - `work-status.service.spec.ts` (8 tests) — 커버리지 0% → 42.6%
  - `user.service.spec.ts` (8 tests) — 커버리지 0% → 100%
- **결과**: Tests 43 → 76개, Statement Coverage 10.66% → 21.76%

---

## [2026-02-15] PDCA 코드 품질 개선 (7개 Feature 완료)

### Security (security-improvement)
- **Backend**: RolesGuard 적용 (admin, vacation-admin 컨트롤러)
- **Backend**: class-validator DTO 검증 강화
- **Backend**: JWT 인증 가드 누락 엔드포인트 보호
- **Backend**: Rate Limiting 적용 (로그인 5회/15분, 기본 10회/분)
- **Frontend**: XSS 방지 (dangerouslySetInnerHTML 제거)
- **Frontend**: 인증 토큰 관리 개선

### Logging (logger-migration)
- **Backend**: `console.log/error` 15건 → NestJS `Logger` 전환
- 대상 파일: reports.service.ts, vacation.service.ts, admin.service.ts, auth.service.ts, excel.service.ts

### Architecture (prisma-global)
- **Backend**: PrismaService 글로벌 모듈화
- 13개 모듈의 개별 PrismaService import → 1개 `PrismaModule` (global: true)
- 중복 코드 제거, 모듈 의존성 단순화

### Frontend Code Hygiene (frontend-improvement)
- **Frontend**: `error.tsx` / `loading.tsx` 14개 생성 (모든 라우트 그룹)
- **Frontend**: `console.log` 5건 제거
- **Frontend**: `any` 타입 31건 → 5건 감소 (적절한 인터페이스 적용)

### OWMS_SYS Security (owms-sys-security)
- **OWMS_SYS**: localStorage 평문 비밀번호 저장 제거 (`lastPassword` 필드 삭제)
- **OWMS_SYS**: Quick Login 기능 제거 (보안 위험)
- **OWMS_SYS**: `localStorage` → `sessionStorage` 전환 (Zustand persist)
- **OWMS_SYS**: `console.error` 6건 제거
- **OWMS_SYS**: `catch (err: any)` 4건 → `catch (err: unknown)` + AxiosError
- **OWMS_SYS**: API URL 환경변수 지원 (`VITE_API_URL`, `VITE_OWMS_WEB_URL`)

### Component Refactoring (daily-report-refactor)
- **Frontend**: `daily-report/page.tsx` 1382줄 → 554줄 (-60%)
- 7개 컴포넌트 추출:
  - `types.ts` — 공유 인터페이스 + 유틸 함수
  - `DateNavigation.tsx` — 날짜 선택 + 작업유형 + 캘린더
  - `JobCard.tsx` — 개별 업무 카드 (드롭다운, 편집, 드래그)
  - `Sidebar.tsx` — 시스템 메모 + 과거 업무 검색 + 주간 노트
  - `CreateProjectModal.tsx` — 프로젝트 생성 모달
  - `DeleteConfirmModal.tsx` — 삭제 확인 모달
  - `ToastNotification.tsx` — 토스트 알림
- `console.error` 6건 제거 (`showToastMsg` 헬퍼로 통합)

### Performance (n1-query-fix)
- **Backend**: N+1 쿼리 및 성능 이슈 10건 수정 (5개 서비스 파일)
- `work-status.service.ts`:
  - O(n*m) `.some()/.find()` → `Set/Map` 인덱싱 O(1)
  - 불필요 `user.findUnique` 쿼리 2건 제거 (`requestUser` 직접 참조)
  - 순차 await → `Promise.all()` 병렬화
- `metrics.service.ts`:
  - `include { department, team }` → `select { role, departmentId, teamId }`
- `vacation.service.ts`:
  - 3회 쿼리 (user + vacations + adjustments) → 1회 include 쿼리
  - 순차 upsert for 루프 → `Promise.all()` 배치
- `reports.service.ts`:
  - `.includes()` O(n) → `Set.has()` O(1)
  - 반복 `toKSTString()` → 사전 변환 `Set/Map`
- `dashboard.service.ts`:
  - `forEach + let` → `reduce` 패턴

---

## PDCA 통계

| Feature | Match Rate | 수정 파일 |
|---------|-----------|-----------|
| security-improvement | 68% | ~15개 |
| logger-migration | 100% | 5개 |
| prisma-global | 100% | 14개 |
| frontend-improvement | 92% | 19개 |
| owms-sys-security | 100% | 7개 |
| daily-report-refactor | 100% | 8개 |
| n1-query-fix | 100% | 5개 |
| test-coverage | 100% | 6개 |
