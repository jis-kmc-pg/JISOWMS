# Job/Project Module 기술 명세서

## 1. 개요 (Overview)
사용자의 일일 업무 내역을 기록하고 프로젝트별로 매핑하며, 주간 보고서의 핵심 데이터 소스가 됩니다.

## 2. 기술적 관심사 (Technical Concerns)
- **데이터 갱신 전략**: 특정 날짜의 업무 수정 시, 기존 데이터를 `deleteMany`로 삭제한 후 일괄 `create`하는 단순화된 동기화 방식 사용.
- **날짜 및 시간대 (KST)**: 
  - DB에는 UTC로 저장되나, 조회 및 저장 시 `setHours(0, 0, 0, 0)` 등을 호출하여 날짜 경계를 명확히 처리.
  - 서버 시간대에 의존하지 않도록 수동 KST 오프셋(+9h) 처리가 일부 로직에 포함됨.
- **업무 순서 (Ordering)**: 업무별 `order` 필드를 유지하여 사용자가 지정한 출력 순서를 엑셀에 반영.

## 3. 데이터 모델 연동 (Data Integration)
- **Models**: `Job`, `Project`.
- **Fields**: `title`, `content`, `jobDate`, `userId`, `projectId`.

## 4. 리팩토링 및 개선 가이드
- **표준 준수**: [전역 표준 가이드라인](../standard_conventions.md)의 날짜 처리 및 CRUD 패턴을 준수합니다.
- **현재 상태**: 업무 저장 시 "삭제 후 재생성" 방식에서 `id` 보존 방식으로 개선 완료.
