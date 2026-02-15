# OWMS Backend (Office Work Management System)

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

## 소개
OWMS Backend는 **사내 업무 관리 및 주간 업무 보고서 자동 생성**을 위한 RESTful API 서버입니다. NestJS 프레임워크와 Prisma ORM을 기반으로 구축되었으며, 엑셀 템플릿을 활용한 정교한 보고서 생성 기능을 특징으로 합니다.

## 핵심 기능
- **업무 관리**: 일일 업무 등록, 수정, 삭제 및 프로젝트별 분류
- **엑셀 보고서 생성**: 
  - `ExcelJS`를 사용하여 기존 엑셀 템플릿(`양식.xlsx`) 기반 업무 보고서 자동 생성
  - 다중 페이지 확장 및 행 레이아웃 자동 조정
  - 주간 중요 정보 사항 연동
- **휴가/근태 관리**: 연차 신청 및 승인 프로세스, 일일 근무 형태(내근/외근/재택 등) 관리
- **권한 체계**: 5단계 Role-based Access Control (CEO, Executive, Dept Head, Team Leader, Member)
- **통계/대시보드**: 팀별/사용자별 업무 현황 및 주간 통계 데이터 제공

## 기술 스택
- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Excel Library**: [ExcelJS](https://github.com/exceljs/exceljs)
- **Auth**: Passport (JWT & Local Strategy)

## 시작하기

### 설치
```bash
$ npm install
```

### 환경 변수 설정
`.env.example` 파일을 참고하여 `.env` 파일을 생성합니다.
```bash
$ cp .env.example .env
```

### 데이터베이스 마이그레이션
```bash
$ npx prisma generate
$ npx prisma db push
```

### 실행
```bash
# 개발 모드 (watch)
$ npm run start:dev

# 프로덕션 모드
$ npm run start:prod
```

## 문서 및 가이드
- [EXCEL_RULES.md](./EXCEL_RULES.md): 엑셀 생성 규칙 및 레이아웃 정의
- [VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md): 기능 검증 및 테스트 방법
- [scripts/](./scripts/): 데이터 생성, 검증, 디버깅을 위한 유틸리티 스크립트 모음

## 라이선스
This project is private and unlicensed.
