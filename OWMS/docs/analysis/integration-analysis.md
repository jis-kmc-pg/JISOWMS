# OWMS & OWMS_SYS Integration Analysis Report

## Analysis Date: 2026-02-14

---

## 1. 시스템 구성

```
┌──────────────────────┐
│   OWMS_SYS (Tauri)   │ Port 1420 (Vite Dev)
│  Desktop Tray Widget │
│                      │
│ - Login              │ ──┐
│ - Dashboard          │   │ axios (Bearer Token)
│ - QuickJobEntry      │   │
│ - WeeklyWidget       │   │
│ - TaskHistory        │   │
└──────────────────────┘   │
                           ▼
┌──────────────────────────────────────────────┐
│     OWMS Backend (NestJS) Port 4000          │
│                                              │
│ - AuthController      (/auth/*)              │
│ - ReportsController   (/reports/*)           │
│ - WorkStatusController(/work-status/*)       │
│ - DashboardController (/dashboard/*)         │
│ - VacationController  (/vacation/*)          │
│ - DispatchController  (/dispatch/*)          │
│ - BoardController     (/board/*)             │
│                                              │
│ Prisma ORM                                   │
└──────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────┐
│    PostgreSQL (OWMS) 192.168.123.205:5432    │
│                                              │
│ User, SystemMemo, DailyStatus, WeeklyNote,  │
│ Job, Project, Vacation, Board, Vehicle, etc. │
└──────────────────────────────────────────────┘
                           ▲
┌──────────────────────┐   │
│  OWMS Web Frontend   │   │ (via Backend API)
│  (Next.js:3000)      │ ──┘
└──────────────────────┘
```

---

## 2. API 연결 포인트

### OWMS_SYS → OWMS Backend

API 클라이언트: `OWMS_SYS/src/api/client.ts` (axios, baseURL: localhost:4000)

| Endpoint | Method | 용도 | 인증 |
|----------|--------|------|------|
| `/auth/login` | POST | 사용자 로그인 | No |
| `/reports/system-memos` | POST | 빠른 업무 등록 | JWT |
| `/reports/system-memos?date={date}` | GET | 업무 이력 조회 | JWT |
| `/work-status/weekly?date={date}` | GET | 주간 현황 대시보드 | JWT |

---

## 3. 공유 자원

### 3.1 데이터베이스 (동일 PostgreSQL)
- **단일 DB**: 두 시스템 모두 `OWMS` 데이터베이스 사용
- **충돌 해결**: Last-write-wins (별도 충돌 방지 없음)
- **OWMS_SYS 사용 테이블**: User, SystemMemo, DailyStatus, WeeklyNote, Department, Team

### 3.2 인증 (동일 JWT 시스템)
- 동일한 JWT_SECRET, 동일한 토큰 구조
- Access Token: 15분, Refresh Token: 7일

| 구분 | OWMS Web | OWMS_SYS |
|------|----------|----------|
| 토큰 저장 | HttpOnly Cookie | Zustand (localStorage) |
| 빠른 로그인 | 없음 | ID/PW 기억 기능 |
| 토큰 갱신 | 쿠키 기반 | Bearer 헤더 기반 |

### 3.3 사용자 모델 (동일 User 테이블)
- 5단계 RBAC: CEO, EXECUTIVE, DEPT_HEAD, TEAM_LEADER, MEMBER
- OWMS_SYS는 로그인 후 { id, userId, name, role, teamId } 저장

---

## 4. CORS 설정

Backend `main.ts`에서 허용하는 Origin:
```
http://localhost:3000       # OWMS Web Frontend
http://localhost:1420       # OWMS_SYS Vite dev server
http://192.168.123.46:3000  # External OWMS Web
tauri://localhost            # Tauri security protocol
```

---

## 5. 시작 순서 (start_all.bat)

```
[1/3] Backend (NestJS)    → Port 4000  ← 반드시 먼저 시작
[2/3] Web Frontend (Next) → Port 3000
[3/3] OWMS_SYS (Tauri)    → Port 1420  ← Backend 의존
```

---

## 6. Tauri 설정

- **Product**: OWMS-SYS (com.jis.owms-sys)
- **Window**: 400x520, 숨김 모드 (시스템 트레이), alwaysOnTop
- **Plugins**: autostart (Windows 시작 시 자동 실행), opener (브라우저 링크)
- **CSP**: null (제한 없음 - localhost:4000 허용)

---

## 7. 누락/미완성 연동

| 항목 | 상태 | 설명 |
|------|------|------|
| Offline Sync | ❌ 없음 | OWMS_SYS는 항상 백엔드 연결 필요 |
| 공유 타입 | ❌ 없음 | 모노레포/공유 패키지 없음 |
| 실시간 업데이트 | ❌ 없음 | WebSocket/SSE 없음, 요청 시에만 조회 |
| 메시지 큐 | ❌ 없음 | 시스템 간 이벤트 버스 없음 |
| 감사 로그 | ❌ 없음 | OWMS_SYS 작업에 대한 중앙 감사 추적 없음 |
| 부서별 필터 | ❌ 불완전 | WeeklyStatus가 부서 기준 필터 미적용 |

---

## 8. 핵심 요약

| 항목 | 내용 |
|------|------|
| **관계** | OWMS_SYS는 OWMS의 **경량 데스크톱 위젯** (빠른 업무 등록 + 현황 조회) |
| **API** | OWMS_SYS → NestJS Backend (localhost:4000) via axios |
| **DB** | 동일 PostgreSQL (OWMS) - 단일 소스 |
| **인증** | 동일 JWT 시스템, 저장 방식만 다름 (Cookie vs localStorage) |
| **동기화** | 오프라인 동기화 없음, 요청 시 조회 |
| **시작** | Backend 먼저 → Frontend → OWMS_SYS 순서 |
| **범위** | OWMS_SYS는 4개 API만 사용 (전체의 ~15%) |
