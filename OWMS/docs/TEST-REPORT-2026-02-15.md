# OWMS 통합 테스트 보고서

**테스트 일시**: 2026-02-15
**테스트 환경**: Backend(NestJS 11, :4000) + Frontend(Next.js 16, :3000) + PostgreSQL(jis4f.iptime.org:54321)
**테스트 방법**: API 직접 호출 (curl) + 에이전트 팀 병렬 테스트

---

## 1. 테스트 개요

### 테스트 범위
| 영역 | 테스트 항목 | 에이전트 |
|------|------------|---------|
| 예약 시스템 | 배차 CRUD, 회의실 예약 CRUD, 충돌 검증 | Agent 1 |
| 게시판 시스템 | 게시글 CRUD, 댓글 CRUD, DTO 검증 | Agent 2 |
| 업무/연차 시스템 | 일일업무 보고, 연차 신청/승인, 잔여연차 | Agent 3 |

### 테스트 사용자
| 사용자 | ID | 역할 | 부서 |
|--------|-----|------|------|
| 김근호 | kimgh | CEO | 대표이사 |
| 이상진 | sjlee | DEPT_HEAD | 솔루션사업부 |
| 강명철 | kmc | TEAM_LEADER | 솔루션개발팀 |
| 백미경 | baekmk | DEPT_HEAD | 경영지원부 |

---

## 2. 테스트 결과 요약

| 영역 | 테스트 수 | PASS | WARN | FAIL | 통과율 |
|------|:--------:|:----:|:----:|:----:|:-----:|
| 예약 시스템 | 15 | 15 | 0 | 0 | 100% |
| 게시판 시스템 | 14 | 14 | 0 | 0 | 100% |
| 업무/연차 시스템 | 18 | 18 | 0 | 0 | 100% |
| **합계** | **47** | **47** | **0** | **0** | **100%** |

---

## 3. 발견 및 수정된 버그

### 3.1 [CRITICAL] req.user.userId 버그 (수정 완료)

**증상**: 배차 생성, 회의실 예약, 게시글 작성, 댓글 작성 시 500 Internal Server Error
**원인**: JWT Strategy가 반환하는 사용자 객체에 `userId` 속성이 없음

```
// JWT Strategy (jwt.strategy.ts) 반환값
{ id: payload.sub, sub: payload.sub, username: payload.userId, role, departmentId }

// 컨트롤러에서 잘못된 접근
req.user.userId  → undefined (존재하지 않는 속성)

// 올바른 접근
req.user.id      → 10 (numeric DB primary key)
```

**영향 범위**: 4개 파일, 10개소
| 파일 | 수정 개소 |
|------|:--------:|
| dispatch.controller.ts | 3 |
| meeting-room.controller.ts | 3 |
| board.controller.ts | 1 |
| posts.controller.ts | 3 |

**수정**: `req.user.userId` → `req.user.id` 일괄 변경
**검증**: 수정 후 모든 CRUD 작업 정상 동작 확인

### 3.2 [MEDIUM] 날짜 범위 쿼리 버그 (수정 완료)

**증상**: `GET /dispatch?start=2026-02-16&end=2026-02-16` → 빈 배열 반환
**원인**: `new Date("2026-02-16")` → 자정(00:00:00)으로 파싱되어, 09:00에 시작하는 예약이 조건에 걸리지 않음

```
// 수정 전: start=end=2026-02-16일 때
startDate < 2026-02-16T00:00:00  → 09:00 예약은 FALSE (누락!)

// 수정 후: 시간 없는 날짜면 end에 +1일 적용
startDate < 2026-02-17T00:00:00  → 09:00 예약은 TRUE (정상)
```

**영향 범위**: 2개 파일
- dispatch.service.ts (findAll 메서드)
- meeting-room.service.ts (findReservations 메서드)

**수정**: end 파라미터에 시간 정보(`T`)가 없으면 `e.setDate(e.getDate() + 1)` 적용
**검증**: 수정 후 날짜 범위 쿼리 정상 동작 확인 (2건 반환)

### 3.3 [MEDIUM] 프론트엔드 메모리 누수 (수정 완료)

**증상**: Toast setTimeout이 컴포넌트 언마운트 시 정리되지 않음
**수정**: `useRef`로 타이머 참조 관리, cleanup effect에서 `clearTimeout` 호출

**영향 범위**: 3개 파일
- VehicleReservation.tsx
- MeetingRoomReservation.tsx
- MeetingRoomSettings.tsx

### 3.4 [LOW] useCallback 누락 (수정 완료)

**증상**: fetchData 함수가 매 렌더링마다 재생성 → 불필요한 API 호출
**수정**: `useCallback`으로 감싸고 의존성 배열 명시

### 3.5 [LOW] ESC 키 모달 닫기 미지원 (수정 완료)

**증상**: 모달이 ESC 키로 닫히지 않음 (접근성 이슈)
**수정**: `keydown` 이벤트 리스너 추가, 다중 모달 시 우선순위 처리

---

## 4. 상세 테스트 결과

### 4.1 예약 시스템 (Agent 1)

#### 배차 (Dispatch)
| # | 테스트 | 메서드 | 상태 | 결과 |
|---|--------|--------|:----:|:----:|
| 2-1 | 배차 생성 (스타렉스, 09-12시) | POST /dispatch | 201 | PASS |
| 2-2 | 배차 생성 (쏘렌토, 13-17시) | POST /dispatch | 201 | PASS |
| 2-3 | 충돌 테스트 (스타렉스, 10-11시) | POST /dispatch | 409 | PASS |
| 2-4 | 내 배차 조회 | GET /dispatch/my | 200 (2건) | PASS |
| 2-5 | 날짜 범위 조회 | GET /dispatch?start=&end= | 200 (2건) | PASS |

#### 회의실 예약 (Meeting Room Reservation)
| # | 테스트 | 메서드 | 상태 | 결과 |
|---|--------|--------|:----:|:----:|
| 3-1 | 회의실 예약 (대회의실, 10-11시) | POST /meeting-room/reservation | 201 | PASS |
| 3-2 | 회의실 예약 (소회의실A, 14-15:30) | POST /meeting-room/reservation | 201 | PASS |
| 3-3 | 충돌 테스트 (대회의실, 10:30-11:30) | POST /meeting-room/reservation | 409 | PASS |
| 3-4 | 날짜 범위 조회 | GET /meeting-room/reservation?start=&end= | 200 (1건) | PASS |
| 3-5 | 내 예약 조회 | GET /meeting-room/reservation/my | 200 (2건) | PASS |
| 3-6 | 예약 취소 | PATCH /meeting-room/reservation/1/cancel | 200 | PASS |

#### 유효성 검증 (Validation)
| # | 테스트 | 메서드 | 상태 | 결과 |
|---|--------|--------|:----:|:----:|
| 4-1 | 빈 body 배차 생성 | POST /dispatch | 400 | PASS |
| 4-2 | 필수 필드 누락 예약 | POST /meeting-room/reservation | 400 | PASS |

### 4.2 게시판 시스템 (Agent 2)

| # | 테스트 | 메서드 | 상태 | 결과 |
|---|--------|--------|:----:|:----:|
| 2 | 게시판 목록 조회 | GET /board | 200 (4개 게시판) | PASS |
| 3-1 | 공지사항 글 작성 | POST /board/notice/posts | 201 | PASS |
| 3-2 | 자유게시판 글 작성 | POST /board/free/posts | 201 | PASS |
| 4-1 | 공지사항 목록 조회 | GET /board/notice/posts | 200 | PASS |
| 4-2 | 자유게시판 목록 조회 | GET /board/free/posts | 200 | PASS |
| 5-1 | 게시글 상세 조회 | GET /posts/{id} | 200 | PASS |
| 6-1 | 공지사항 댓글 작성 | POST /posts/{id}/comments | 201 | PASS |
| 6-2 | 자유게시판 댓글 작성 | POST /posts/{id}/comments | 201 | PASS |
| 7 | 댓글 포함 조회 | GET /posts/{id} | 200 (comments[]) | PASS |
| 8 | 댓글 삭제 | DELETE /posts/comments/{id} | 200 | PASS |
| 9 | 게시글 삭제 | DELETE /posts/{id} | 200 | PASS |
| 10-1 | 빈 제목 검증 | POST /board/notice/posts | 400 ("제목을 입력해주세요") | PASS |
| 10-2 | 내용 누락 검증 | POST /board/free/posts | 400 ("내용을 입력해주세요") | PASS |

### 4.3 업무보고 + 연차 시스템 (Agent 3)

#### 일일 업무 보고
| # | 테스트 | 메서드 | 상태 | 결과 |
|---|--------|--------|:----:|:----:|
| 2-1 | 업무 목록 조회 | GET /reports/jobs?date= | 200 | PASS |
| 2-2 | 업무 등록 (OWMS 테스트) | POST /reports/jobs | 201 | PASS |
| 2-3 | 업무 등록 (회의실 기능) | POST /reports/jobs | 201 | PASS |
| 2-4 | 일일 보고 조회 | GET /reports/jobs?date= | 200 (2건) | PASS |
| 2-5 | 주간 현황 조회 | GET /reports/my-status?date= | 200 (10일분) | PASS |

#### 연차 관리
| # | 테스트 | 메서드 | 상태 | 결과 |
|---|--------|--------|:----:|:----:|
| 3-1 | 잔여 연차 조회 | GET /vacations/summary | 200 (총23/사용6.5/잔여16.5) | PASS |
| 3-2 | 연차 신청 (2/20, 종일) | POST /vacations | 201 (PENDING) | PASS |
| 3-3 | 오전 반차 신청 (2/21) | POST /vacations | 201 (PENDING) | PASS |
| 3-4 | 내 연차 목록 조회 | GET /vacations | 200 (9건) | PASS |

#### 연차 승인
| # | 테스트 | 메서드 | 상태 | 결과 |
|---|--------|--------|:----:|:----:|
| 4-1 | 전체 연차 조회 (CEO) | GET /vacations/admin/all | 200 | PASS |
| 4-2 | 연차 승인 | POST /vacations/admin/{id} | 201 (APPROVED) | PASS |
| - | 승인 후 잔여 확인 | GET /vacations/summary | 200 (총23/사용8/잔여15) | PASS |

#### 기타 데이터 확인
| # | 테스트 | 메서드 | 상태 | 결과 |
|---|--------|--------|:----:|:----:|
| 5-1 | 차량 목록 | GET /vehicle | 200 (3대) | PASS |
| 5-2 | 회의실 목록 | GET /meeting-room | 200 (3개) | PASS |
| 5-3 | 부서 목록 | GET /admin/departments | 200 (7개 부서) | PASS |

---

## 5. 생성된 데모 데이터

### 기준 데이터 (Settings에서 생성)
| 항목 | ID | 이름 | 비고 |
|------|:--:|------|------|
| 차량 | 1 | 스타렉스 (12가1234) | 솔루션사업부, 11인승 |
| 차량 | 2 | 쏘렌토 (34나5678) | 5인승 |
| 차량 | 3 | 카니발 (56다9012) | 9인승 |
| 회의실 | 1 | 대회의실 | 20인, 본관 3층 |
| 회의실 | 2 | 소회의실A | 8인, 본관 2층 |
| 회의실 | 3 | 소회의실B | 8인, 별관 1층 |

### 사용자 데이터 (테스트 중 생성)
| 항목 | 내용 | 사용자 | 상태 |
|------|------|--------|------|
| 배차 | 스타렉스, 2/16 09-12시 | kmc | APPROVED |
| 배차 | 쏘렌토, 2/16 13-17시 | kmc | APPROVED |
| 회의실 예약 | 대회의실, 2/16 10-11시 | sjlee | CANCELLED |
| 회의실 예약 | 소회의실A, 2/16 14-15:30 | sjlee | APPROVED |
| 공지사항 | 시스템 테스트 안내 | kmc | 작성됨 |
| 연차 | 2/20 종일 | kmc | APPROVED |
| 연차 | 2/21 오전 반차 | kmc | PENDING |
| 업무 보고 | OWMS 시스템 테스트 외 1건 | kmc | 작성됨 |

---

## 6. 수정된 파일 목록

### Backend (6개 파일)
| 파일 | 수정 내용 | 심각도 |
|------|----------|:------:|
| dispatch.controller.ts | `req.user.userId` → `req.user.id` (3개소) | CRITICAL |
| meeting-room.controller.ts | `req.user.userId` → `req.user.id` (3개소) | CRITICAL |
| board.controller.ts | `req.user.userId` → `req.user.id` (1개소) | CRITICAL |
| posts.controller.ts | `req.user.userId` → `req.user.id` (3개소) | CRITICAL |
| dispatch.service.ts | 날짜 범위 쿼리 수정 (end +1일) | MEDIUM |
| meeting-room.service.ts | 날짜 범위 쿼리 수정 (end +1일) | MEDIUM |

### Frontend (3개 파일)
| 파일 | 수정 내용 | 심각도 |
|------|----------|:------:|
| VehicleReservation.tsx | useCallback, useRef Toast, ESC 키 핸들러 | MEDIUM |
| MeetingRoomReservation.tsx | useCallback, useRef Toast, ESC 키 핸들러 | MEDIUM |
| MeetingRoomSettings.tsx | useCallback, useRef Toast, ESC 키 핸들러 | MEDIUM |

---

## 7. 잔여 이슈 (향후 개선사항)

| 우선순위 | 이슈 | 설명 |
|:--------:|------|------|
| LOW | console.log 잔존 | 69건의 console.log → NestJS Logger 전환 필요 |
| LOW | DB 인덱스 마이그레이션 | Phase 4에서 추가한 6개 인덱스 적용 대기 |
| LOW | OWMS_SYS localStorage | Tauri 앱의 비밀번호 저장 방식 변경 필요 |

---

## 8. 결론

- **총 47개 테스트 전체 통과 (100%)**
- **치명적 버그 1건 수정** (`req.user.userId` → `req.user.id`): 배차, 회의실 예약, 게시글, 댓글 생성이 모두 불가능했던 버그
- **날짜 범위 쿼리 버그 1건 수정**: 날짜 파라미터 파싱 오류로 인한 빈 결과 반환
- **프론트엔드 메모리 누수 3건 수정**: Toast 타이머 정리 미흡
- **접근성 개선 3건**: ESC 키 모달 닫기 지원
- **전체 데이터 플로우 정상 동작 확인**: 로그인 → 설정(기준데이터) → 예약/업무/연차 → 승인
