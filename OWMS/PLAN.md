# OWMS 프로젝트 개발 계획 (Project Implementation Plan)

이 문서는 OWMS(Office Work Management System)의 소스 코드 분석을 바탕으로 현행화된 개발 계획 및 로드맵입니다.

## 1. 프로젝트 개요
- **목표**: NestJS(Backend)와 Next.js 15(Frontend) 기반의 업무 관리 및 협업 시스템 구축
- **상태**:
  - **Backend**: 주요 모듈(Auth, Reports, Works, Vacation) 구현 및 고도화 진행 중
  - **Frontend**: App Router 기반 라우팅 및 주요 페이지(Login, Dashboard, Report, Attendance) 구현 완료

---

## 2. 개발 단계 및 기능 명세 (Phases & Features)

### Phase 1: 인증 및 보안 (Authentication & Security)
**상태: [완료]** / **우선순위: 높음**
- **기능 설명**: JWT 기반 인증, HttpOnly Cookie 저장, 접근 제어(Guard)
- **작업 상세**:
  - [x] **[Backend]** JWT 토큰 발급 및 검증 로직 (`AuthService.login`, `AuthController.login`)
  - [x] **[Backend]** HttpOnly Cookie 설정 (Login Response Cookie)
  - [x] **[Backend]** Refresh Token 로직 및 Rotation 전략 구현 (보안 강화)
  - [x] **[Frontend]** API 호출 시 쿠키 자동 전송 설정 및 미들웨어(`middleware.ts`) 토큰 검증 강화
  - [x] **[Frontend]** 로그인 페이지 유효성 검사 및 에러 피드백 UI 개선
  - [x] **[Frontend]** **[New]** 비밀번호 보기/숨기기(Eye Icon) 토글 기능 추가

### Phase 2: 대시보드 및 일일 업무 보고 (Core: Dashboard & Daily Report)
**상태: [완료]** / **우선순위: 높음**
- **기능 설명**: 개인 업무 요약 대시보드 및 일일 업무 보고 작성
- **작업 상세**:
  - [x] **[Frontend]** 메인 대시보드 레이아웃 (`dashboard-layout.tsx`)
  - [x] **[Backend]** 대시보드용 요약 데이터 조회 API (`DashboardService`)
  - [x] **[Frontend]** 위젯 데이터 연동 (내 업무 현황, 팀 부재 현황)
  - [x] **[Frontend]** Daily Report: 스마트 입력 기능 (전일 업무 불러오기, 이슈 토글)
  - [x] **[Frontend]** PDF 내보내기 기능 구현 (`html2canvas`, `jspdf`)

### Phase 3: 주간 업무 및 협업 (Weekly Status)
**상태: [완료]** / **우선순위: 중간**
- **기능 설명**: 팀원별 주간 업무 현황 매트릭스 조회 및 엑셀 리포트 생성
- **작업 상세**:
  - [x] **[Backend]** 주간 업무 데이터 구조 설계 (`WeeklyNote` 모델)
  - [x] **[Frontend]** 주간 업무 매트릭스 뷰 (테이블 형태) 반응형 구현
  - [x] **[Frontend]** 상세 보기 모달/슬라이드 구현
  - [x] **[Backend]** 팀 단위 주간 업무 조회 쿼리 최적화
  - [x] **[Backend]** **[New]** 주간 업무 엑셀 내보내기 (엔터 줄바꿈 기반 행 분리 로직 적용)

### Phase 4: 근태 관리 (Attendance / Vacation)
**상태: [완료]** / **우선순위: 중간**
- **기능 설명**: 연차 조회, 신청, 승인 관리
- **작업 상세**:
  - [x] **[Backend]** 휴가(`Vacation`) 엔티티 및 기본 CRUD 모듈 생성 (`vacation` dir)
  - [x] **[Backend]** 휴가 사유(`reason`) 필드 추가 (Schema Migration)
  - [x] **[Backend]** 잔여 연차 계산 로직 (주말 제외) 및 유효성 검사 구현
  - [x] **[Frontend]** 캘린더 뷰 기반 휴가 신청 UI 구현 (`attendance` dir)
  - [x] **[Frontend]** 내 신청 현황 리스트 및 상태(승인/대기/반려) 표시

### Phase 5: 설정 및 관리자 (Settings & Admin)
**상태: [완료]** / **우선순위: 낮음**
- **기능 설명**: 프로필 변경, 프로젝트 관리, 시스템 설정
- **작업 상세**:
  - [x] **[Frontend]** 설정 페이지 라우팅 (`/settings`)
  - [x] **[Frontend]** 탭 기반 설정 메뉴(프로필, 업무 설정 등) UI 구현
  - [x] **[Backend]** 비밀번호 변경 및 프로필 수정 API
  - [x] **[Backend]** 프로젝트(업무) 카테고리 관리 API (생성/수정/비활성화)

### Phase 6: 차량 배차 관리 (Vehicle Dispatch) [New!]
**상태: [진행 중]** / **우선순위: 중간**
- **기능 설명**: 법인 차량 관리 및 배차 예약 시스템
- **작업 상세**:
  - [x] **[Backend]** 차량(`Vehicle`) 및 배차(`Dispatch`) 스키마 정의
  - [x] **[Backend]** 차량 등록/수정/삭제 관리자 API
  - [x] **[Backend]** 배차 신청, 승인, 반려 로직 구현
  - [x] **[Frontend]** 차량 목록 및 배차 현황 캘린더 뷰 (`/dispatch`)
  - [x] **[Frontend]** 배차 신청 모달 및 유효성 검사 (중복 예약 방지)

### Phase 7: 사내 게시판 (Bulletin Board) [New!]
**상태: [진행 중]** / **우선순위: 중간**
- **기능 설명**: 공지사항, 자유게시판, Q&A 등 사내 소통 공간
- **작업 상세**:
  - [x] **[Backend]** 게시판(`Board`), 게시글(`Post`), 댓글(`Comment`) 스키마 정의
  - [x] **[Backend]** 게시판 CRUD 및 조회수 카운팅 로직
  - [x] **[Frontend]** 게시판 카테고리별 목록 조회 (`/board/[boardName]`)
  - [x] **[Frontend]** 게시글 작성/수정 에디터 및 댓글 기능


---

## 3. 기술적 부채 및 개선항목 (Technical Debt)
- **테스트 코드**: 현재 테스트 커버리지가 낮으므로 핵심 로직(Auth, Report) 위주로 Unit Test 작성 필요
- **에러 핸들링**: 프론트엔드 전역 에러 바운더리 및 백엔드 Exception Filter 표준화 필요

## 4. 작업 기록 (Work Log)
### 2026-02-09
- **[Done]** Phase 1: 인증 및 보안 (HttpOnly, Refresh Token) 구현 완료.
- **[Done]** Phase 2: 일일 보고 스마트 입력 및 PDF 내보내기 구현 완료.
- **[Done]** Phase 3: 주간 업무 엑셀 내보내기 (행 확장 로직) 구현 및 검증 완료.
- **[In Progress]** Phase 4: 근태 관리 백엔드 로직(주말 제외 계산, 유효성 검사) 구현 및 DB 마이그레이션 진행 중.

