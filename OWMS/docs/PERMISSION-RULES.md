# JISOWMS 권한 규칙 정리

> 최종 업데이트: 2026-02-15

## 1. 역할(Role) 계층

```
CEO (대표이사)
  └── EXECUTIVE (임원)
       └── DEPT_HEAD (부서장)
            └── TEAM_LEADER (팀장)
                 └── MEMBER (팀원)
```

**Senior Roles** (부서장 이상): `CEO`, `EXECUTIVE`, `DEPT_HEAD`

---

## 2. 인증 체계

| 구분 | 방식 | 저장 위치 |
|------|------|-----------|
| Web (Next.js) | JWT | HttpOnly Cookie |
| Desktop (Tauri) | JWT | localStorage |
| 비밀번호 | bcrypt | 10 rounds |

**JWT Payload**: `{ id, sub, username, role, departmentId }`

---

## 3. 백엔드 API 권한 매트릭스

### 3.1 관리자 (`/admin/*`)

| API | 메서드 | 가드 | 허용 역할 | 설명 |
|-----|--------|------|-----------|------|
| `/admin/departments` | GET | JWT + Roles | TEAM_LEADER+ | 부서 목록 |
| `/admin/departments` | POST | JWT + Roles | TEAM_LEADER+ | 부서 생성 |
| `/admin/departments/:id` | PATCH | JWT + Roles | TEAM_LEADER+ | 부서 수정 |
| `/admin/departments/:id` | DELETE | JWT + Roles | TEAM_LEADER+ | 부서 삭제 |
| `/admin/departments/:id/reorder` | POST | JWT + Roles | TEAM_LEADER+ | 부서 정렬 |
| `/admin/departments/:id/demote` | POST | JWT + Roles | TEAM_LEADER+ | 부서→팀 강등 |
| `/admin/teams` | GET | JWT + Roles | TEAM_LEADER+ | 팀 목록 |
| `/admin/teams` | POST | JWT + Roles | TEAM_LEADER+ | 팀 생성 |
| `/admin/teams/:id` | PATCH | JWT + Roles | TEAM_LEADER+ | 팀 수정 |
| `/admin/teams/:id` | DELETE | JWT + Roles | TEAM_LEADER+ | 팀 삭제 |
| `/admin/teams/:id/reorder` | POST | JWT + Roles | TEAM_LEADER+ | 팀 정렬 |
| `/admin/teams/:id/promote` | POST | JWT + Roles | TEAM_LEADER+ | 팀→부서 승격 |
| `/admin/users` | GET | JWT + Roles | TEAM_LEADER+ | 사용자 목록 |
| `/admin/users` | POST | JWT + Roles | TEAM_LEADER+ | 사용자 생성 |
| `/admin/users/:id` | PATCH | JWT + Roles | TEAM_LEADER+ | 사용자 수정 |
| `/admin/users/:id/reset-password` | POST | JWT + Roles | TEAM_LEADER+ | 비밀번호 초기화 |

### 3.2 연차 (`/vacations/*`)

| API | 메서드 | 가드 | 허용 역할 | 설명 |
|-----|--------|------|-----------|------|
| `/vacations/summary` | GET | JWT | 전체 | 본인 연차 요약 |
| `/vacations` | GET | JWT | 전체 | 본인 연차 목록 |
| `/vacations` | POST | JWT | 전체 | 연차 신청 |
| `/vacations/dept-requests` | GET | JWT | 전체 | 부서 연차 현황 (본인 부서 필터) |
| `/vacations/admin/all` | GET | JWT + Roles | TEAM_LEADER+ | 전체 연차 조회 |
| `/vacations/admin/bulk` | POST | JWT + Roles | TEAM_LEADER+ | 일괄 연차 등록 |
| `/vacations/admin/:id` | POST | JWT + Roles | TEAM_LEADER+ | 연차 수정 |
| `/vacations/admin/stats` | GET | JWT + Roles | TEAM_LEADER+ | 연차 통계 |
| `/vacations/admin/stats-config/:userId` | POST | JWT + Roles | TEAM_LEADER+ | 통계 설정 저장 |
| `/vacations/admin/:id/delete` | POST | JWT + Roles | TEAM_LEADER+ | 연차 삭제 |

### 3.3 팀현황보고 (`/team-status/*`)

| API | 메서드 | 가드 | 허용 역할 | 소유권 체크 | 설명 |
|-----|--------|------|-----------|-------------|------|
| `/team-status` | GET | JWT | 전체 | - | 주간 보고서 (본인 부서) |
| `/team-status/:id` | GET | JWT | 전체 | - | 보고서 상세 |
| `/team-status` | POST | JWT + Roles | TEAM_LEADER+ | - | 보고서 작성 |
| `/team-status/:id` | PUT | JWT + Roles | TEAM_LEADER+ | 작성자 OR 부서장+ | 보고서 수정 |
| `/team-status/:id` | DELETE | JWT + Roles | TEAM_LEADER+ | 작성자 OR 부서장+ | 보고서 삭제 |

### 3.4 게시판 (`/board/*`, `/posts/*`)

| API | 메서드 | 가드 | 허용 역할 | 소유권 체크 | 설명 |
|-----|--------|------|-----------|-------------|------|
| `/board` | GET | JWT | 전체 | - | 게시판 목록 |
| `/board/:name/posts` | GET | JWT | 전체 | - | 게시글 목록 |
| `/board/:name/posts` | POST | JWT | 전체 | - | 게시글 작성 |
| `/posts/:id` | GET | JWT | 전체 | - | 게시글 상세 |
| `/posts/:id` | DELETE | JWT | 전체 | 작성자만 | 게시글 삭제 |
| `/posts/:id/comments` | POST | JWT | 전체 | - | 댓글 작성 |
| `/posts/comments/:id` | DELETE | JWT | 전체 | 작성자만 | 댓글 삭제 |

### 3.5 업무보고 (`/reports/*`)

| API | 메서드 | 가드 | 허용 역할 | 설명 |
|-----|--------|------|-----------|------|
| `/reports/jobs` | GET | JWT | 전체 | 본인 업무 조회 |
| `/reports/jobs` | POST | JWT | 전체 | 본인 업무 저장 |
| `/reports/weekly-note` | GET/POST | JWT | 전체 | 본인 주간 메모 |
| `/reports/daily-status` | GET/POST | JWT | 전체 | 본인 일일 현황 |
| `/reports/my-status` | GET | JWT | 전체 | 본인 주간 현황 |
| `/reports/my-weekly-detail` | GET | JWT | 전체 | 본인 주간 상세 |
| `/reports/search-jobs` | GET | JWT | 전체 | 과거 업무 검색 |
| `/reports/projects` | GET/POST/PATCH | JWT | 전체 | 프로젝트 관리 |
| `/reports/system-memos` | GET/POST | JWT | 전체 | 시스템 메모 |

### 3.6 예약 시스템

**차량 배차 (`/dispatch/*`)**

| API | 메서드 | 가드 | 소유권 체크 | 설명 |
|-----|--------|------|-------------|------|
| `/dispatch` | POST | JWT | - | 배차 신청 |
| `/dispatch` | GET | JWT | - | 전체 배차 조회 |
| `/dispatch/my` | GET | JWT | - | 본인 배차 조회 |
| `/dispatch/:id/cancel` | PATCH | JWT | - (전체) | 배차 취소 |

**회의실 (`/meeting-room/*`)**

| API | 메서드 | 가드 | 소유권 체크 | 설명 |
|-----|--------|------|-------------|------|
| `/meeting-room` | GET/POST/PATCH/DELETE | JWT | - | 회의실 관리 |
| `/meeting-room/reservation` | GET | JWT | - | 예약 조회 |
| `/meeting-room/reservation` | POST | JWT | - | 예약 생성 |
| `/meeting-room/reservation/my` | GET | JWT | - | 본인 예약 |
| `/meeting-room/reservation/:id/cancel` | PATCH | JWT | 작성자만 | 예약 취소 |

### 3.7 엑셀 다운로드 (`/excel/*`)

| API | 메서드 | 가드 | 허용 역할 | 설명 |
|-----|--------|------|-----------|------|
| `/excel/weekly-report` | GET | JWT | 전체 (본인) / TEAM_LEADER+ (타인) | 주간보고 엑셀 |
| `/excel/team-weekly-report` | GET | JWT | 전체 | 팀 주간보고 엑셀 |

### 3.8 차량 관리 (`/vehicle/*`)

| API | 메서드 | 가드 | 허용 역할 | 설명 |
|-----|--------|------|-----------|------|
| `/vehicle` | POST/GET | JWT | 전체 | 차량 생성/목록 |
| `/vehicle/:id` | GET/PATCH/DELETE | JWT | 전체 | 차량 상세/수정/삭제 |

### 3.9 기타

| API | 메서드 | 가드 | 설명 |
|-----|--------|------|------|
| `/dashboard/*` | GET | JWT | 대시보드 데이터 |
| `/metrics/*` | GET | JWT | 메트릭스 |
| `/work-status/*` | GET | JWT | 업무 현황 |
| `/user/me` | GET | JWT | 본인 정보 |

---

## 4. 프론트엔드 화면별 권한

### 4.1 메뉴 노출 규칙

| 메뉴 | 경로 | 노출 조건 |
|------|------|-----------|
| 대시보드 | `/` | 전체 |
| 일일 업무 보고 | `/daily-report` | 전체 |
| 주간 업무 현황 | `/weekly-status` | 전체 |
| 연차 신청 | `/vacation` | 전체 |
| 예약 | `/reservation` | 전체 |
| 공지사항 | `/board/notice` | 전체 |
| 게시판 > 팀현황보고 | `/board/team-status` | 전체 |
| 게시판 > 자유게시판 | `/board/free` | 전체 |
| 게시판 > 건의게시판 | `/board/suggestion` | 전체 |
| **연차 승인** | `/attendance/approval` | **DEPT_HEAD만** |
| **연차 관리** | `/vacation-mgmt` | **경영지원부 (departmentId=3)** |
| **차량 관리** | `/settings/vehicles` | **경영지원부 (departmentId=3)** |
| 설정 | `/settings` | 전체 |

### 4.2 팀현황보고 화면 권한

| 화면/기능 | 경로/요소 | 노출 조건 |
|-----------|-----------|-----------|
| 목록 열람 | `/board/team-status` | 전체 (로그인 사용자) |
| **보고서 작성 버튼** | 목록 우상단 | **TEAM_LEADER만** |
| 수정 버튼 (목록) | 팀별 관리 컬럼 | 작성자 본인 OR 부서장+ |
| 삭제 버튼 (목록) | 팀별 관리 컬럼 | 작성자 본인 OR 부서장+ |
| 수정 버튼 (상세) | 하단 액션 영역 | 작성자 본인 OR 부서장+ |
| 삭제 버튼 (상세) | 하단 액션 영역 | 작성자 본인 OR 부서장+ |
| 보고서 작성 | `/board/team-status/write` | TEAM_LEADER+ (API 가드) |
| 보고서 수정 | `/board/team-status/write?id=X` | 작성자 OR 부서장+ (API 서비스 체크) |

### 4.3 게시판 화면 권한

| 화면/기능 | 노출 조건 |
|-----------|-----------|
| 게시글 작성 | 전체 |
| 게시글 삭제 | 작성자 본인만 |
| 댓글 작성 | 전체 |
| 댓글 삭제 | 작성자 본인만 |

### 4.4 예약 시스템 화면 권한

| 화면/기능 | 노출 조건 |
|-----------|-----------|
| 배차 신청 | 전체 |
| 배차 취소 | 작성자 본인만 |
| 회의실 예약 | 전체 |
| 회의실 예약 취소 | 작성자 본인만 |

### 4.5 엑셀 다운로드 권한

| 기능 | 노출 조건 |
|------|-----------|
| 본인 주간보고 다운로드 | 전체 |
| 타인 주간보고 다운로드 | TEAM_LEADER+ |

---

## 5. 소유권(Ownership) 기반 권한 패턴

서비스 레벨에서 소유권을 확인하는 패턴 정리:

| 리소스 | 작성자 | 부서장+(Senior) | 비작성자(일반) |
|--------|--------|-----------------|----------------|
| 게시글 삭제 | O | X | X |
| 댓글 삭제 | O | X | X |
| 배차 취소 | O | O | O |
| 회의실 예약 취소 | O | X | X |
| **팀현황보고 수정** | **O** | **O** | **X** |
| **팀현황보고 삭제** | **O** | **O** | **X** |

---

## 6. 권한 관련 개선 필요 사항

### 6.1 차량 관리 - 역할 제한 없음
- **파일**: `vehicle.controller.ts`
- **현상**: 인증만 확인, 역할 제한 없음
- **제안**: 경영지원부 또는 관리자 역할로 제한

### 6.2 회의실 CRUD - 역할 제한 없음
- **파일**: `meeting-room.controller.ts`
- **현상**: 회의실 생성/수정/삭제에 역할 제한 없음
- **제안**: 관리자 역할로 제한 (예약은 전체 유지)

### 6.3 프로젝트 관리 - 역할 제한 없음
- **파일**: `reports.controller.ts`
- **현상**: 프로젝트 생성/수정에 역할 제한 없음
- **제안**: TEAM_LEADER+ 역할로 제한

### 6.4 연차 승인 메뉴 - DEPT_HEAD 한정
- **현상**: `user.role === 'DEPT_HEAD'` 정확 일치로만 노출
- **제안**: CEO, EXECUTIVE도 승인 가능해야 할 수 있음 (비즈니스 요건 확인 필요)
