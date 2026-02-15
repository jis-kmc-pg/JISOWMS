# OWMS (Office Work Management System)

OWMS는 현대적인 웹 기술 스택(NestJS, Next.js)을 기반으로 구축된 업무 관리 시스템입니다.
기존 시스템의 한계를 극복하고 효율적인 업무 보고, 주간 현황 파악, 근태 관리 기능을 제공합니다.

## 🚀 Key Features

### 1. Dashboard (`/`)
- 개인 업무 현황 요약 (진행 중, 금주 완료)
- 팀 부재 현황 위젯
- 최근 작성한 업무 리스트 (Quick Access)

### 2. Daily Report (`/daily-report`)
- **일일 업무 보고서 작성 및 조회**
- **Smart Input**: 업무 선택 시 제목 자동 완성 및 수정 가드
- **UI/UX**: Glassmorphism 디자인, 텍스트 기반 날짜 내비게이션
- **PDF Export**: 보고서 PDF 저장 기능 (Browser Print)

### 3. Weekly Status (`/weekly-status`)
- **매트릭스 뷰**: 팀원별 주간 업무 작성 현황(O/X) 한눈에 파악
- **Detail Timeline**: 작성 완료 아이콘 클릭 시 상세 업무 내용 슬라이드 조회

### 4. Attendance (`/attendance`) [New!]
- **내 연차 현황**: 총 연차, 사용 연차, 잔여 연차 카드
- **휴가 신청**: 연차/반차 신청 및 관리자 승인 대기
- **신청 내역**: 내 휴가 신청 이력 리스트

### 5. Settings (`/settings`) [New!]
- **프로필 설정**: 개인 정보 및 비밀번호 관리
- **업무 설정**: 일일 보고서에서 사용하는 프로젝트(업무) 항목 관리 (CRUD)
- [x] **탭 구조**: 직관적인 설정 메뉴 내비게이션

### 6. Vehicle Dispatch (`/dispatch`) [New!]
- **차량 배차 현황**: 캘린더 뷰를 통해 차량별 예약 현황 확인
- **배차 신청**: 날짜, 시간, 목적, 동승자 정보를 입력하여 배차 신청
- **중복 방지**: 이미 예약된 시간대에는 신청 불가능하도록 유효성 검사

### 7. Bulletin Board (`/board`) [New!]
- **통합 게시판**: 공지사항, 자유게시판 등 다양한 주제의 게시판 제공
- **커뮤니티 기능**: 게시글 작성, 조회, 댓글 작성을 통한 사내 소통 활성화
- **조회수**: 게시글 인기 척도를 위한 조회수 집계

---

## 🛠 Tech Stack

### Backend (`jis_job_backend`)
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (Passport)

### Frontend (`jis_job_frontend`)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Installation
1. Repository Clone
2. Backend Setup
   ```bash
   cd jis_job_backend
   npm install
   npx prisma generate
   npm run start:dev
   ```
3. Frontend Setup
   ```bash
   cd jis_job_frontend
   npm install
   npm run dev
   ```

### Ports
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:3000`
