# Plan: daily-report-refactor

## 개요
`daily-report/page.tsx` 1382줄 → 컴포넌트 분리. 기능 변경 없이 구조만 개선.

## 현황
- 단일 파일에 인터페이스, 유틸리티, 20+ useState, 20+ 핸들러, 전체 JSX 포함
- 컴포넌트 분리 0건 (`src/components/daily-report/` 없음)
- console.error 6건 포함 (코드 위생 이슈)

## 파일 구조 분석 (1382줄)

| 구간 | 라인 | 내용 | 추출 대상 |
|------|------|------|-----------|
| 인터페이스 + 유틸 | 1-111 | 5개 인터페이스, 4개 유틸 함수 | types.ts |
| 상태 선언 | 113-181 | 20+ useState | page.tsx 유지 |
| 데이터 패칭 | 185-282 | fetchReport, fetchProjects | page.tsx 유지 |
| 이벤트 핸들러 | 284-714 | ~20개 핸들러 | page.tsx 유지 |
| 헤더 | 716-747 | 저장/엑셀 버튼 | page.tsx 유지 |
| 날짜 네비게이션 | 761-881 | 날짜 선택 + 작업유형 + 캘린더 | DateNavigation.tsx |
| 업무 카드 | 892-1087 | 개별 업무 항목 렌더링 | JobCard.tsx |
| 사이드바 | 1101-1263 | 시스템 메모 + 과거 검색 + 주간 노트 | Sidebar.tsx |
| 모달 (신규 업무) | 1293-1348 | 프로젝트 생성 모달 | CreateProjectModal.tsx |
| 모달 (삭제 확인) | 1350-1378 | 삭제 확인 모달 | DeleteConfirmModal.tsx |
| 토스트 | 1276-1291 | 알림 토스트 | ToastNotification.tsx |

## 추출 계획 (7개 파일 생성)

### 신규 파일
```
src/components/daily-report/
├── types.ts                  # 공유 인터페이스 + 유틸 함수
├── DateNavigation.tsx        # 날짜 선택 + 작업유형 + 캘린더 팝업
├── JobCard.tsx               # 개별 업무 카드 (드롭다운 + 제목/내용 편집)
├── Sidebar.tsx               # 시스템 메모 + 과거 업무 검색 + 주간 노트
├── CreateProjectModal.tsx    # 신규 업무 등록 모달
├── DeleteConfirmModal.tsx    # 삭제 확인 모달
└── ToastNotification.tsx     # 토스트 알림
```

### 예상 효과
- page.tsx: 1382줄 → ~500줄 (상태 + 핸들러 + 레이아웃)
- 각 컴포넌트: 50~200줄
- 가독성 + 유지보수성 대폭 향상

## 원칙
- **기능 변경 없음**: 리팩터링만 수행 (동일한 동작 보장)
- **Props drilling**: 필요한 상태/핸들러를 props로 전달
- **console.error 정리**: 추출 시 함께 제거 (6건)
- **빌드 검증**: 추출 후 반드시 `next build` 또는 tsc 확인

## 성공 기준
- [ ] page.tsx 600줄 이하
- [ ] 7개 컴포넌트 파일 생성
- [ ] console.error 0건
- [ ] 빌드 성공 (기존 기능 100% 유지)
