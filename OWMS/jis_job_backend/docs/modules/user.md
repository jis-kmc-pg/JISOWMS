# User/Organization Module 기술 명세서

## 1. 개요 (Overview)
사용자 계명 정보와 조직(부서, 팀) 간의 관계를 관리하며, 인사 정보의 기초 데이터 소스 역할을 합니다.

## 2. 기술적 관심사 (Technical Concerns)
- **계층 구조 (Hierarchy)**: `Department` (1) : (N) `Team` (1) : (N) `User` 관계의 정규화된 모델링.
- **프로필 정제**: 보안 민감 정보(Password, RefreshToken)를 제외하고 프론트엔드에 필요한 데이터만 `select`하여 노출.
- **비밀번호 관리**: 회원 정보 수정과 비밀번호 변경 로직을 분리하여 보안 이슈 예방.

## 3. 데이터 모델 연동 (Data Integration)
- **Models**: `User`, `Department`, `Team`.
- **Relationship**: User 테이블은 `departmentId`와 `teamId`를 외래키로 가짐.

## 4. 리팩토링 및 개선 가이드
- **현재 상태**: 사용자 검색 시 `OR` 조건과 `contains`를 사용하여 성능 이슈 발생 가능성 있음.
- **개선안**:
  - 조직도 조회 시 재귀적 쿼리나 고정된 계층 구조 조회를 위한 전용 서비스 패턴 도입.
  - 대규모 사용자 조회 시 페이징 처리(Skip/Take) 필수 적용.
