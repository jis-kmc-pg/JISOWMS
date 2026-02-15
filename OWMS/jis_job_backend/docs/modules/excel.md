# Excel/Reports Module 기술 명세서 (SoC 설계 포함)

## 1. 개요 (Overview)
DB의 업무 데이터를 수집하여 사전 정의된 엑셀 템플릿(`양식.xlsx`)에 정해진 레이아웃에 맞춰 기입하고, 보고서 파일을 생성합니다.

## 2. 기술적 관심사 (Technical Concerns)
- **템플릿 제어**: 기존 셀 서식(병합, 폰트, 테두리)을 보존하면서 데이터만 주입.
- **동적 레이아웃 (Dynamic Pagination)**:
  - 1페이지(33행) 초과 시 기존 서식을 복제하여 2페이지 이상으로 무제한 확장.
  - 주간 중요 정보(`WeeklyNote`)를 특정 행(40-44)에 줄바꿈 기준으로 분할 기입.
- **UI/UX 포맷팅**: 업무 제목/내용의 줄바꿈(`\n`)을 실제 엑셀 행 분리로 치환하고, 내용 앞에 3칸 들여쓰기 적용.

## 3. 데이터 모델 연동 (Data Integration)
- **Models**: `Job`, `WeeklyNote`, `DailyStatus`, `User`.
- **Source Area**: 엑셀 Row 7-39, 45-84 (업무 데이터), Row 40-44 (주간 정보).

## 4. 관심사 분리(SoC) 리팩토링 설계 (Refactoring Design)
`ExcelService`의 거대 로직을 다음으로 분할하여 일관성을 확보합니다.

1.  **ExcelDataProvider**: 보고서 종류별(주간, 팀별 등) 필요한 데이터를 DB에서 조회하고 정제하는 역할.
2.  **ExcelLayoutManager**: 템플릿 로딩, 행 복제(`copyTemplateRows`), 페이지 확장 로직 담당.
3.  **ExcelCellFormatter**: 줄바꿈 처리, 들여쓰기, 날짜 포맷 변환 등 개별 셀 값의 시각적 변환 담당.

---
> [!IMPORTANT]
> 템플릿의 서식이 깨지지 않도록 `ExcelJS` 사용 시 `value`만 수정하고 서식 정보는 `copyTemplateRows`를 통해 정교하게 복사해야 합니다.
