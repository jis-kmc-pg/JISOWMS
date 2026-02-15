# OWMS Backend Modules Technical Specifications

본 문서는 OWMS 백엔드의 각 모듈별 기술적 관심사와 설계 원칙을 통합 관리하기 위한 인덱스입니다. 각 모듈의 명세서는 해당 기능을 구현하거나 리팩토링할 때 반드시 준수해야 하는 **일관성 가이드라인**을 포함합니다.

## 📂 모듈별 명세서 목록

- [**Auth (인증/인가)**](./auth.md): JWT 전략, RBAC 권한 체계 및 토큰 관리.
- [**User (사용자/조직)**](./user.md): 조직 계층 구조 및 프로필 정보 관리 기술점.
- [**Job (업무/프로젝트)**](./job.md): 일일 업무 데이터 갱신 전략 및 KST 날짜 처리.
- [**Attendance (근태/휴가)**](./attendance.md): 법정 연차 산정 및 휴가 보정 로직.
- [**Excel (엑셀/보고서)**](./excel.md): ExcelJS 제어, 동적 레이아웃 및 관심사 분리(SoC) 설계.
- [**Dashboard (통계/집계)**](./dashboard.md): 실시간 데이터 통계 및 N+1 쿼리 개선 방향.

## 📏 시스템 표준 가이드라인
모든 모듈 개발 시 공통으로 적용되는 기술 표준입니다.
- [**전역 표준 가이드라인 (Standard Conventions)**](../standard_conventions.md)

## 🛠 공통 기술 가이드라인

1.  **관심사 분리 (SoC)**: 서비스(Service)는 비즈니스 로직에 집중하고, 복잡한 데이터 변환이나 외부 I/O 제어는 전용 Provider/Manager로 분리합니다.
2.  **데이터 일관성**: 날짜 처리는 전역 KST 표준을 따르며, 보안 민감 정보는 API 응답에서 항상 제외합니다.
3.  **성능 최적화**: 대량 데이터 조회 시 Prisma의 `include`와 `count` 등을 효율적으로 활용하여 쿼리 횟수를 최소화합니다.
