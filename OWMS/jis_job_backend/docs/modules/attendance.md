# Attendance/Vacation Module 기술 명세서

## 1. 개요 (Overview)
사용자의 휴가 신청, 승인 및 일일 근무 형태(내근/외근/재택 등)를 관리하며, 법정 연차 산정 로직을 포함합니다.

## 2. 기술적 관심사 (Technical Concerns)
- **연차 산정 로직 (Strict Logic)**:
  - 입사일(`joinDate`) 기반 1년차(월별 발생), 2년차(비례 부여), 3년차 이상(기본 15일+가산) 로직 엄격 적용.
  - `annualLeaveOverride`와 `carryoverLeave`를 통한 수동 보정 지원.
- **휴가 조정 (Adjustment)**: `VacationAdjustment` 모델을 통해 해당 월의 실제 휴가 데이터를 무시하고 관리자가 입력한 값으로 통계를 강제 교정할 수 있는 전용 로직 존재.
- **근무일 계산**: 주말(토, 일)을 제외한 평일 기준의 휴가 일수 계산 로직.

## 3. 데이터 모델 연동 (Data Integration)
- **Models**: `Vacation`, `DailyStatus`, `VacationAdjustment`.
- **Status Enum**: `PENDING`, `APPROVED`, `REJECTED`.

## 4. 리팩토링 및 개선 가이드
- **현재 상태**: KST 날짜 변환 로직(`+ 9 * 60 * 60 * 1000`)이 서비스 코드 곳곳에 산재해 있어 일관성 유지가 어려움.
- **개선안**:
  - `DateUtil` 또는 전역 `DateService`를 만들어 표준화된 KST 변환 함수 제공.
  - 공휴일 정보를 외부 API나 DB 테이블로 관리하여 하드코딩된 '공휴일' 체크 로직 제거.
