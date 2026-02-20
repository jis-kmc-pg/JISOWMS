# JISOWMS CHANGELOG

## [2026-02-21] 반응형 레이아웃 개선 및 CORS 설정 수정

> 헤더 레이아웃 반응형 브레이크포인트 최적화 및 백엔드 CORS 설정 추가

---

### 문제 해결: Network Error (CORS)

**파일**: `jis_job_backend/src/main.ts`

**변경사항**:
- CORS origin에 `http://localhost:3002` 추가
- Next.js dev 서버가 3000 포트 사용 중일 때 3002로 fallback하는 경우 대응

**수정 전**:
```typescript
origin: [
  'http://localhost:3000',
  'http://localhost:1420',
  'http://192.168.123.75:3000',
  'http://192.168.123.46:3000',
  'tauri://localhost',
]
```

**수정 후**:
```typescript
origin: [
  'http://localhost:3000',
  'http://localhost:3002',  // ← 추가
  'http://localhost:1420',
  'http://192.168.123.75:3000',
  'http://192.168.123.46:3000',
  'tauri://localhost',
]
```

**효과**:
- 로그인 페이지에서 발생하던 Network Error 해결
- 포트 충돌 시에도 정상적인 백엔드 연결 가능

---

### 반응형 레이아웃: 브레이크포인트 최적화

**파일**: `jis_job_frontend/src/app/globals.css`

**변경사항**:
- Tailwind v4 커스텀 브레이크포인트 `3xl` 조정
- 1600px → 1400px → 1420px → **1530px** (최종)

**수정 내용**:
```css
@theme {
  --breakpoint-3xl: 1530px;  /* 최종 값 */
}
```

**레이아웃 기준**:
- **≥ 1530px**: 1줄 데스크톱 메뉴 (로고 ← 네비게이션 → 프로필, 양쪽 정렬)
- **1024px ~ 1529px**: 2줄 레이아웃
  - 1줄: 로고 + 프로필 (가운데 정렬)
  - 2줄: 네비게이션 (가운데 정렬)
- **< 1024px**: 햄버거 메뉴 (1줄)

---

### 반응형 레이아웃: 2줄 모드 정렬 개선

**파일**: `jis_job_frontend/src/app/dashboard-layout.tsx`

**변경사항**:
- 2줄 레이아웃(lg ~ 3xl)에서 1줄 콘텐츠(로고+프로필) 정렬 방식 변경
- 양쪽 정렬(`justify-between`) → 가운데 정렬(`justify-center`)

**수정 전**:
```tsx
<div className="... justify-between lg:gap-2 3xl:gap-0">
```

**수정 후**:
```tsx
<div className="... justify-between lg:justify-center 3xl:justify-between lg:gap-4 3xl:gap-0">
```

**효과**:
- 2줄 모드에서 로고와 프로필이 중앙에 배치되어 시각적 균형 개선
- gap 증가(2→4)로 가독성 향상

---

---

### 헤더-컨텐츠 폭 정렬 수정

**문제**: 헤더와 컨텐츠 영역의 폭이 시각적으로 맞지 않음

**원인**:
1. 반응형 padding 차이 (`px-4 md:px-8`)
2. 헤더의 `lg:justify-center` 정렬로 로고 위치 이동

**해결**:

**파일**: `jis_job_frontend/src/app/dashboard-layout.tsx`

1. **Padding 통일** (모든 화면 크기에서 동일한 32px)
   ```tsx
   // 수정 전
   px-4 md:px-8

   // 수정 후
   px-8
   ```

2. **Justify 정렬 수정** (모든 화면에서 양쪽 정렬)
   ```tsx
   // 수정 전
   justify-between lg:justify-center 3xl:justify-between

   // 수정 후
   justify-between
   ```

**효과**:
- 헤더의 로고와 컨텐츠 시작 위치가 정확히 일치
- 모든 화면 크기에서 일관된 정렬

---

### 전체 페이지 폭 통일

**파일**: 총 16개 페이지

**변경사항**: 모든 페이지를 헤더와 동일한 `max-w-[1600px]`와 `px-8`로 통일

**게시판 페이지 (6개)**:
- `board/[boardName]/page.tsx`: max-w-5xl → max-w-[1600px]
- `board/[boardName]/[postId]/page.tsx`: max-w-4xl → max-w-[1600px]
- `board/[boardName]/write/page.tsx`: max-w-3xl → max-w-[1600px]
- `board/team-status/page.tsx`: max-w-6xl → max-w-[1600px]
- `board/team-status/[reportId]/page.tsx`: max-w-5xl → max-w-[1600px]
- `board/team-status/write/page.tsx`: max-w-4xl → max-w-[1600px]

**일반 페이지 (10개)**:
- `activity-log/page.tsx`: max-w-7xl → max-w-[1600px]
- `daily-report/page.tsx`: max-w-[1920px] → max-w-[1600px]
- `dashboard/settings/page.tsx`: max-w-4xl → max-w-[1600px]
- `vacation-mgmt/bulk/page.tsx`: max-w-4xl → max-w-[1600px]
- `vacation-mgmt/page.tsx`: 상속 (정상)
- `vacation-mgmt/admin/page.tsx`: 상속 (정상)
- `vacation-mgmt/stats/page.tsx`: 상속 (정상)
- `weekly-status/page.tsx`: 상속 (정상)
- `settings/page.tsx`: 상속 (정상)
- 기타 페이지: 상속 (정상)

---

### 페이지 타이틀 UI 통일

**목적**: 모든 페이지의 타이틀을 공지사항 스타일로 통일하여 일관된 UX 제공

**기준 스타일** (공지사항 기준):
```tsx
<div className="flex items-center space-x-3 sm:space-x-4">
    <Link href="/" className="text-slate-400 hover:text-indigo-600 ...">
        <ArrowLeft size={22} />
    </Link>
    <div className="min-w-0">
        <h1 className="text-lg sm:text-2xl font-extrabold ... flex items-center gap-2">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 sm:p-2 rounded-xl ...">
                <Icon size={18} className="sm:hidden" />
                <Icon size={22} className="hidden sm:block" />
            </div>
            <span className="truncate">페이지 제목</span>
        </h1>
        <p className="hidden sm:block text-sm text-slate-400 mt-1 ml-12">설명</p>
    </div>
</div>
```

**수정된 페이지 (13개)**:

| 페이지 | 아이콘 | 변경 사항 |
|--------|--------|-----------|
| daily-report | FileText | 뒤로가기 + 아이콘 박스 추가 |
| weekly-status | Calendar | 뒤로가기 + 아이콘 박스 추가 |
| activity-log | Activity | 뒤로가기 추가, 아이콘 박스화 |
| settings | Settings | 뒤로가기 + 아이콘 박스 추가 |
| vacation-mgmt | Plane | 뒤로가기 + 아이콘 박스 추가 |
| vacation-mgmt/admin | Users | 뒤로가기 + 아이콘 박스 추가 |
| vacation-mgmt/bulk | Users | 뒤로가기 + 아이콘 박스 추가 |
| vacation-mgmt/stats | BarChart3 | 뒤로가기 + 아이콘 박스 추가 |
| reservation | Calendar | 헤더 추가 (뒤로가기 + 아이콘 + 제목) |
| attendance | CalendarClock | 뒤로가기 + 아이콘 박스 추가 |
| attendance/approval | CheckSquare | 뒤로가기 + 아이콘 박스 추가 |
| board (6개) | MessageSquare | (이미 통일됨) |

**통일된 요소**:
1. ← 뒤로가기 버튼 (대시보드 제외)
2. Indigo 테마 아이콘 박스
3. 반응형 타이틀 (text-lg sm:text-2xl font-extrabold)
4. 모바일에서 숨겨지는 설명 (hidden sm:block)

**효과**:
- 모든 페이지에서 일관된 네비게이션 경험
- 아이콘으로 페이지 식별성 향상
- 반응형 대응으로 모바일 가독성 개선

---

### 수정 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `jis_job_backend/src/main.ts` | CORS origin에 `localhost:3002` 추가 |
| `jis_job_frontend/src/app/globals.css` | 3xl 브레이크포인트 1530px으로 설정 |
| `jis_job_frontend/src/app/dashboard-layout.tsx` | padding px-8 통일, justify-between으로 정렬 수정 |
| 16개 페이지 파일 | max-w-[1600px], px-8로 폭 통일 |
| 13개 페이지 파일 | 타이틀 UI 공지사항 스타일로 통일 |

---

## [2026-02-21] WebSocket 실시간 알림 시스템 구현

> 연차 신청/승인 시 실시간 푸시 알림 (OWMS_SYS 데스크톱 앱)

---

### Backend (NotificationGateway)

**신규 파일**: `src/gateway/notification.gateway.ts`
- **Namespace**: `/notifications` (Socket.IO)
- **CORS**: localhost:3000, localhost:1420, 192.168.123.75:3000, 192.168.123.46:3000, tauri://localhost
- **User Connection Management**: Map<userId, socketId[]> (멀티 디바이스 지원)
- **이벤트**:
  - `register`: 클라이언트 userId 등록
  - `vacation:request`: 연차 신청 알림 (팀장/부서장에게)
  - `vacation:approved`: 연차 승인 알림 (신청자에게)

**수정 파일**: `src/gateway/gateway.module.ts`
- NotificationGateway를 Global Module로 등록 및 export

**수정 파일**: `src/vacation/vacation.service.ts`
- **requestVacation()**: 연차 생성 시 팀장/부서장 조회 후 `sendVacationRequest()` 호출
- **updateVacation()**: 연차 승인 시 `sendVacationApproved()` 호출
- Prisma include에 `team.users`, `department.users` 추가하여 알림 대상 추출

### OWMS_SYS (Tauri 데스크톱 앱)

**신규 파일**: `src/services/notificationService.ts`
- Socket.IO Client 연결 관리 (`io()` from `socket.io-client`)
- **connect()**: userId 기반 WebSocket 연결 + register 이벤트 발송
- **disconnect()**: 연결 해제
- **이벤트 핸들러**:
  - `vacation:request`: 팀장/부서장 → Tauri `sendNotification()` 호출 (📅 연차 신청 알림)
  - `vacation:approved`: 팀원/팀장 → Tauri `sendNotification()` 호출 (✅ 연차 승인 알림)

**수정 파일**: `src/components/Dashboard.tsx`
- **useEffect**: user.id 존재 시 자동으로 `notificationService.connect()` 호출
- **cleanup**: 컴포넌트 언마운트 시 `notificationService.disconnect()` 호출
- **제거**: 테스트용 `handleTestNotification()` 함수 및 "알림 테스트 (개발용)" 버튼 삭제

**의존성 추가**: `socket.io-client` (`pnpm add socket.io-client`)

### 알림 플로우

1. **연차 신청** (ksm → 팀장/부서장)
   - Web/OWMS_SYS에서 연차 신청
   - Backend: 팀장(teamId 기준) + 부서장(departmentId 기준) userId 배열 추출
   - `NotificationGateway.sendVacationRequest(targetUserIds, notification)`
   - 연결된 팀장/부서장 OWMS_SYS에 Windows 알림 표시

2. **연차 승인** (부서장 → ksm)
   - Web에서 연차 승인
   - Backend: `status: 'PENDING' → 'APPROVED'` 감지
   - `NotificationGateway.sendVacationApproved(userId, notification)`
   - 신청자 OWMS_SYS에 Windows 알림 표시

### 테스트 결과
- ✅ ksm(팀원) 연차 신청 → sjlee(부서장) 알림 수신 확인
- ✅ sjlee(부서장) 승인 → ksm(팀원) 승인 알림 확인
- ✅ 테스트 데이터 정리 (ID 254, 255 삭제)

---

## [2026-02-19] 업무망 배포 준비

> DB를 업무망(내부망)으로 전환하고 배포 서버(192.168.123.75) 환경 구성

---

### 환경 설정 변경

| 항목 | Before | After |
|------|--------|-------|
| `DATABASE_URL` | `jis4f.iptime.org:54321` (외부망) | `192.168.123.205:5432` (내부망) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `/api` (Nginx 상대경로) |
| CORS origin | 미포함 | `http://192.168.123.75:3000` 추가 |

### 웹 서버 (Nginx 리버스 프록시)

- `nginx/owms.conf` 생성: `:80` 단일 진입점
- `/api/*` → `localhost:4000` (Backend, /api 프리픽스 제거)
- `/socket.io/` → `localhost:4000` (WebSocket 프록시 + Upgrade 헤더)
- `/*` → `localhost:3000` (Frontend)

### WebSocket URL 수정

- `useSocket.ts`: Nginx 환경에서 same-origin 네임스페이스 `/dashboard` 사용
- `NEXT_PUBLIC_API_URL`이 상대경로(`/api`)일 때 자동 감지

### 배포 구성 생성

- `ecosystem.config.cjs`: PM2 프로세스 관리 설정 (Backend + Frontend)
- `docs/02-design/deployment-spec.md`: 배포 사양서 작성

### 빌드 검증
- Backend (`npx nest build`): PASS
- Frontend (`npx next build`): PASS (22개 라우트)

---

## [2026-02-16] 대시보드 위젯 데이터 검증 및 사이즈 반응형 수정

> 32개 위젯의 API 데이터 파싱 정합성 + small/medium/large 사이즈별 데이터 표시 검증

---

### 데이터 파싱 수정 (5건)

| 위젯 | 문제 | 수정 |
|------|------|------|
| TeamAttendanceWidget | `members`에 `status` 필드 없음 → 카운트 0 | `upcomingLeave` 기반 카운팅으로 변경 |
| DeptHeadcountWidget | API `kpi.deptMembers` ≠ `kpi.totalEmployees` | `deptMembers` 우선 fallback 추가 |
| VehicleUtilizationWidget | API `byVehicle[].name` ≠ `stats[].vehicleName` | `byVehicle` 추출 + 필드 매핑 |
| CompanyMeetingUtilWidget | API `byRoom[].name` ≠ `rooms[].roomName` | `byRoom` 추출 + 필드 매핑 |
| DeptResourceUtilWidget | 배차/회의실 모두 필드명 불일치 | 양쪽 추출 + 필드 매핑 |

### 사이즈 반응형 수정 (2건)

| 위젯 | 문제 | 수정 |
|------|------|------|
| MonthlyVacationTrendWidget | `chartHeight` 반전 (large=130 < medium=140) | large=160, medium=140 |
| CompanyReportRateWidget | `Math.random()` 가짜 트렌드 → 항상 "↑" | 실제 데이터 기반 비교 |

### 검증 결과
- 32개 위젯 전체 small/medium/large 데이터 표시 확인 완료
- Size 전파 경로 정상 확인: WidgetGrid → SortableWidget → WidgetContainer → WidgetRenderer → Component
- `npx next build` PASS

---

## [2026-02-15] 대시보드 위젯 시스템 전면 재구성

> 39개 → 32개 위젯 체계 전환, SWR/WebSocket/DnD/다크모드 추가, 레거시 정리

---

### 위젯 시스템 재설계
- 기존 39개 → 신규 32개 (MEMBER 7 + TEAM_LEADER 9 + DEPT_HEAD 7 + EXECUTIVE/CEO 9)
- 26개 신규 커스텀 위젯 컴포넌트 생성
- `WidgetRenderer.tsx` Map 기반 dispatch 패턴으로 재작성
- `widget-registry.ts` 전면 교체
- Backend `/work-status/keywords` 키워드 분석 엔드포인트 추가

### 신규 기능
- SWR 캐싱 (5분 갱신, 30초 중복 방지, focus revalidate)
- WebSocket 실시간 갱신 (Socket.IO + SWR 캐시 무효화)
- @dnd-kit 드래그앤드롭 위젯 정렬 + 자동 저장
- small↔medium↔large 사이즈 토글
- 다크 모드 (useTheme 훅, class-based light/dark/system)

### 레거시 정리
- 미사용 위젯 29개 파일 삭제, 활성 31개 + CalendarRenderer 유지

### 페이지 점검 버그 수정
- `weekly-status/page.tsx`: Backend 응답 구조 변경 대응 + 중복 호출 제거
- `reports/dto/save-jobs.dto.ts`: 서버 반환 필드 DTO 미선언 → `@Allow()` 추가

---

## [2026-02-15] PDCA 개선 작업 (Phase 1~5)

> 기능 로직 변경 없이 보안/품질/성능/테스트 개선 수행
> 기존 사용 테스트 완료 상태 유지

---

### Phase 1: Critical Security (Backend 보안 강화)

#### 1-1. RBAC (Role-Based Access Control) 구현
- **수정 파일**:
  - `src/common/guards/roles.guard.ts` (신규)
  - `src/common/decorators/roles.decorator.ts` (신규)
  - `src/admin/admin.controller.ts` (수정)
  - `src/vacation/vacation.controller.ts` (수정)
- **변경 내용**: NestJS `RolesGuard` + `@Roles()` 데코레이터 구현. Admin 전체, Vacation 관리 엔드포인트 6개에 팀장급 이상 권한 필수 적용
- **효과**: 일반 사원(MEMBER)이 관리자 기능 접근 차단. CEO/EXECUTIVE/DEPT_HEAD/TEAM_LEADER만 관리 가능

#### 1-2. JWT Secret 강화
- **수정 파일**: `.env`
- **변경 내용**: `OWMS_SECRET_KEY` (추측 가능한 16자) → 128자 암호학적 랜덤 hex 값으로 교체 (JWT_SECRET, JWT_REFRESH_SECRET 모두)
- **효과**: JWT 토큰 위조 불가. 브루트포스 공격 방어

#### 1-3. JWT Fallback 제거 + ConfigService 적용
- **수정 파일**:
  - `src/auth/auth.service.ts`
  - `src/auth/jwt.strategy.ts`
  - `src/auth/refresh.strategy.ts`
  - `src/auth/auth.module.ts`
  - `src/app.module.ts`
- **변경 내용**: `process.env.JWT_SECRET || 'OWMS_SECRET_KEY'` 패턴 → `ConfigService.get<string>('JWT_SECRET')` 주입 방식. `ConfigModule.forRoot()` 전역 등록
- **효과**: 환경변수 미설정 시 약한 키로 동작하는 취약점 제거. 안전한 의존성 주입

#### 1-4. 비밀번호 노출 제거
- **수정 파일**: `src/admin/admin.service.ts`
- **변경 내용**: 비밀번호 초기화 응답 `'비밀번호가 초기화되었습니다. (owms1234)'` → `'비밀번호가 초기화되었습니다.'`
- **효과**: API 응답에서 기본 비밀번호 노출 차단

#### 1-5. Excel 다운로드 권한 강화
- **수정 파일**: `src/excel/excel.controller.ts`
- **변경 내용**: 주석 처리된 `ForbiddenException` 활성화. 역할 체크 `'TEAM_LEADER' || 'ADMIN'` (항상 true) → `['TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO'].includes(req.user.role)`
- **효과**: 일반 사원의 타인 보고서 다운로드 차단

#### 1-6. DB Health Check 보호
- **수정 파일**: `src/app.controller.ts`
- **변경 내용**: `/db-check` 엔드포인트에 `@UseGuards(JwtAuthGuard)` 추가
- **효과**: 인증 없이 DB 상태/사용자 수 조회 차단

#### 1-7. JWT 디버그 로그 제거
- **수정 파일**: `src/auth/jwt.strategy.ts`
- **변경 내용**: `console.log('JWT Payload:', payload)` 제거
- **효과**: 서버 로그에 JWT 페이로드 (사용자 ID, 역할) 노출 차단

#### 1-8. @nestjs/config 패키지 설치
- **변경 내용**: `npm install @nestjs/config` 실행
- **효과**: ConfigService 사용을 위한 의존성 해결

---

### Phase 2: Input Validation (입력 검증 강화)

#### 2-1. Backend DTO class-validator 적용
- **수정 파일**:
  - `src/board/dto/create-post.dto.ts`
  - `src/board/dto/create-comment.dto.ts`
  - `src/vehicle/dto/create-vehicle.dto.ts`
  - `src/vehicle/dto/update-vehicle.dto.ts`
  - `src/dispatch/dto/create-dispatch.dto.ts`
- **변경 내용**: `@IsString()`, `@IsNotEmpty()`, `@IsNumber()`, `@IsOptional()`, `@IsDateString()` 등 검증 데코레이터 추가. 한국어 에러 메시지 포함
- **효과**: 잘못된 입력 데이터가 서버단에서 즉시 차단. 유효한 데이터만 DB 도달

#### 2-2. Frontend API URL 환경변수화
- **수정 파일**: `src/lib/api.ts`
- **신규 파일**: `.env.local`, `.env.example`
- **변경 내용**: `window.location.hostname` 동적 참조 → `process.env.NEXT_PUBLIC_API_URL` 환경변수
- **효과**: 악성 도메인에서 호스팅 시 백엔드 URL 조작 방지

#### 2-3. 보안 헤더 추가
- **수정 파일**: `next.config.ts`
- **변경 내용**: 4개 보안 헤더 추가 (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-XSS-Protection`)
- **효과**: 클릭재킹, MIME 스니핑, XSS 공격 방어

#### 2-4. Middleware JWT 만료 검증
- **수정 파일**: `src/middleware.ts`
- **신규 의존성**: `jose` 패키지 설치
- **변경 내용**: 쿠키 존재 여부만 확인 → `jose.decodeJwt()`로 만료 시간 검증. 만료 시 로그인 페이지 리다이렉트 + 쿠키 삭제
- **효과**: 만료된 JWT로 보호 페이지 접근 차단

---

### Phase 3: Code Hygiene (코드 정리)

#### 3-1. 디버그 스크립트 이동
- **이동 파일** (7개): `src/` → `scripts/`
  - check-data.ts, check-data-final.ts, debug-search.ts, debug-memo.ts, test-db.ts, sync-projects-final.ts, test-api-logic.ts
- **효과**: 프로덕션 빌드에서 테스트/디버그 코드 분리

#### 3-2. Frontend 타입 에러 수정
- **수정 파일**: `src/components/vacation/BulkVacation.tsx:297`
- **변경 내용**: 존재하지 않는 `selectedDeptIds` → `selectedDept`, `selectedUserIds` → `selectedUser`
- **효과**: Frontend 빌드 성공. 기존 타입 버그 해결

---

### Phase 4: Performance (성능 최적화)

#### 4-1. DB 인덱스 추가
- **수정 파일**: `prisma/schema.prisma`
- **추가 인덱스**:
  - `Job`: `@@index([userId, jobDate])` -- 일일/주간 업무 조회 최적화
  - `Vacation`: `@@index([userId, status])`, `@@index([startDate, endDate])` -- 연차 요약/기간 검색 최적화
  - `User`: `@@index([departmentId])`, `@@index([teamId])` -- 부서/팀별 조회 최적화
  - `Comment`: `@@index([postId])` -- 게시글별 댓글 조회 최적화
- **효과**: 주요 쿼리 응답 속도 대폭 향상 (full table scan → index scan)
- **참고**: DB 서버 연결 후 `npx prisma migrate dev --name add_performance_indexes` 실행 필요

---

### Phase 5: Testing (테스트 추가)

#### 5-1. Auth Module 테스트 (17개)
- **신규 파일**: `src/auth/auth.service.spec.ts`
- **검증 항목**: validateUser (3), login (2), logout (1), refreshTokens (4), getTokens (4), updateRefreshToken (1), 기본 (1)
- **효과**: 인증 로직의 정합성 검증. bcrypt 해싱, JWT 발급/갱신, 비밀번호 비교 로직 보장

#### 5-2. Vacation Module 테스트 (11개)
- **신규 파일**: `src/vacation/vacation.service.spec.ts`
- **검증 항목**: getSummary (4), requestVacation (4), deleteVacation (1), getMyVacations (1), 기본 (1)
- **효과**: 연차 계산 (기본 15일, override, carryover), 반차 0.5일 처리, 중복/잔여일 검증

#### 5-3. Reports Module 테스트 (14개)
- **신규 파일**: `src/reports/reports.service.spec.ts`
- **검증 항목**: getJobsByDate (1), saveWeeklyNote (4), getProjects (3), createProject (1), searchPastJobs (2), getSystemMemos (2), 기본 (1)
- **효과**: 주간 메모 제한 (4줄, 40자), 프로젝트 필터링, 날짜 검색, 에러 처리 검증

---

### 빌드 검증 결과

| 항목 | 결과 |
|------|------|
| Backend TypeScript | PASS (에러 0건) |
| Frontend Next.js Build | PASS (모든 페이지 빌드 성공) |
| Unit Tests | PASS (42개 전체 통과) |
| Prisma Generate | PASS (클라이언트 생성 성공) |

---

### 보류 사항

| 항목 | 사유 | 필요 조건 |
|------|------|-----------|
| DB 마이그레이션 적용 | DB 서버 접근 불가 | 서버 연결 후 `npx prisma migrate dev` |
| N+1 쿼리 (WorkStatusService) | 기능 로직 변경 위험 | 사용자 승인 필요 |
| OWMS_SYS 비밀번호 localStorage | 빠른 로그인 기능 변경 | 사용자 승인 필요 |
| OWMS_SYS CSP 활성화 | 데스크톱 앱 동작 검증 필요 | 테스트 환경 필요 |
| console.log → Logger 전환 (69건) | 대량 수정 필요 | 별도 Phase |
