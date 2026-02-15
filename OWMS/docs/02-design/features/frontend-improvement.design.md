# Design: Frontend Improvement (코드 위생 개선)

## 구현 순서

### Phase 1: Error/Loading Boundary (신규 파일)
### Phase 2: Console.log 제거 (5건)
### Phase 3: TypeScript any 제거 (31건)

---

## Phase 1: Error/Loading Boundary

### 1-1. Global error.tsx (`src/app/error.tsx`)
```tsx
'use client';
// Next.js 에러 바운더리 (클라이언트 컴포넌트 필수)
// props: error, reset 함수
// UI: 에러 메시지 + 재시도 버튼 (기존 TailwindCSS 스타일)
```

### 1-2. Global loading.tsx (`src/app/loading.tsx`)
```tsx
// 스피너 + "로딩 중..." 텍스트
// 기존 프로젝트 스타일 (indigo 계열 컬러)
```

### 1-3. 주요 라우트별 loading.tsx (데이터 로딩이 있는 페이지)
대상 라우트:
- `src/app/dashboard/loading.tsx`
- `src/app/daily-report/loading.tsx`
- `src/app/weekly-status/loading.tsx`
- `src/app/attendance/loading.tsx`
- `src/app/dispatch/loading.tsx`
- `src/app/vacation-mgmt/loading.tsx`
- `src/app/board/[boardName]/loading.tsx`
- `src/app/settings/loading.tsx`

### 1-4. 주요 라우트별 error.tsx
대상 라우트 (데이터 패칭 에러 가능):
- `src/app/dashboard/error.tsx`
- `src/app/daily-report/error.tsx`
- `src/app/weekly-status/error.tsx`

### 1-5. not-found.tsx (`src/app/not-found.tsx`)
```tsx
// 404 페이지: "페이지를 찾을 수 없습니다" + 홈으로 돌아가기 링크
```

---

## Phase 2: Console.log 제거

| 파일 | 라인 | 내용 | 처리 |
|------|------|------|------|
| daily-report/page.tsx | ~227 | `console.log('Projects Data Sample:...` | 삭제 |
| login/page.tsx | ~35 | `console.log('Login success:', data)` | 삭제 |
| weekly-status/page.tsx | ~133 | `console.log('Download response:', res)` | 삭제 |
| weekly-status/page.tsx | ~146 | `console.log('Force downloading...` | 삭제 |
| weekly-status/page.tsx | ~171 | `console.log('Force downloading ZIP...` | 삭제 |

---

## Phase 3: TypeScript any 제거

### 3-1. dashboard-layout.tsx - menuItems 인터페이스

```typescript
interface MenuItem {
  name: string;
  icon: React.ReactNode;
  href: string;
}
const menuItems: MenuItem[] = [...]
```

### 3-2. dashboard-layout.tsx - user 상태

```typescript
interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  departmentId?: number;
  teamId?: number;
}
const [user, setUser] = useState<UserInfo | null>(null);
```

### 3-3. DashboardChart.tsx - data prop

```typescript
interface ChartDataItem {
  [key: string]: string | number;
}
data: ChartDataItem[];
```

### 3-4. dashboard/page.tsx - stats 상태

```typescript
interface DashboardStats {
  employeeCount: number;
  todayAttendance: number;
  pendingVacations: number;
  activeProjects: number;
  recentActivities: Array<{ description: string; time: string; type: string }>;
  departmentStats: Array<{ name: string; count: number }>;
  monthlyTrend: Array<{ month: string; value: number }>;
}
const [stats, setStats] = useState<DashboardStats | null>(null);
```

### 3-5. catch (err: any) → catch (err: unknown)

대상 파일 (13건):
- dispatch/page.tsx
- login/page.tsx
- DeptTeamSettings.tsx (10건)

패턴:
```typescript
// Before
catch (err: any) { alert(err.response?.data?.message || '오류'); }
// After
catch (err: unknown) {
  const message = err instanceof Error ? err.message : '오류가 발생했습니다';
  // axios 에러인 경우 import { AxiosError } from 'axios' 사용
}
```

### 3-6. 콜백 함수 파라미터 any

대상: daily-report/page.tsx, vacation-mgmt/stats/page.tsx, VacationStats.tsx
- map/filter 콜백의 `(item: any)` → 적절한 인터페이스

---

## 구현 규칙
1. **기능 로직 변경 없음** - 기존 동작 100% 유지
2. **스타일 일관성** - 기존 TailwindCSS 패턴 (indigo 계열) 유지
3. **한국어 UI** - 모든 사용자 노출 텍스트는 한국어
4. **빌드 통과 필수** - `npm run build` PASS 확인
