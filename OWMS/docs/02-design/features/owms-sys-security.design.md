# Design: owms-sys-security

## Phase 1: CRITICAL — 비밀번호 저장 제거

### 1.1 userStore.ts 변경

**Before (현재)**:
```typescript
interface UserState {
    token: string | null;
    user: User | null;
    lastUserId: string | null;
    lastPassword: string | null;   // ← 제거
    login: (token: string, user: User, password?: string) => void;  // ← password 파라미터 제거
    logout: () => void;
}
// persist → localStorage (기본값)
```

**After (변경)**:
```typescript
interface UserState {
    token: string | null;
    user: User | null;
    lastUserId: string | null;
    // lastPassword 완전 제거
    setToken: (token: string) => void;
    setUser: (user: User) => void;
    login: (token: string, user: User) => void;  // password 파라미터 제거
    logout: () => void;
}
// persist → createJSONStorage(() => sessionStorage)
```

**핵심 변경**:
1. `lastPassword` 필드 제거 (interface + state + login 함수)
2. `login` 함수에서 `password` 파라미터 제거
3. `logout`에서 `lastUserId`도 초기화
4. persist storage를 `sessionStorage`로 전환

### 1.2 Login.tsx 변경

**Before**: Quick Login 버튼 (저장된 ID+PW로 자동 로그인)
**After**: ID 자동입력만 (lastUserId → input 초기값)

- `lastPassword` 참조 완전 제거
- `canQuickLogin` → `hasLastUserId`로 변경
- Quick Login 버튼 → 제거
- `handleQuickLogin` 함수 → 제거
- `userId` useState 초기값을 `lastUserId || ""`로 설정
- `login(token, user, password)` → `login(token, user)`

## Phase 2: HIGH — 코드 위생

### 2.1 console.error 제거 (6건)

| 파일 | 라인 | 현재 | 변경 |
|------|------|------|------|
| Login.tsx | 28 | `console.error("Quick Login 실패:", err)` | 함수 자체 제거됨 |
| Login.tsx | 43 | `console.error(err)` | 제거 (setError만 유지) |
| Dashboard.tsx | 19 | `console.error("OWMS 웹 열기 실패:", error)` | 제거 |
| QuickJobEntry.tsx | 33 | `console.error("업무 등록 실패:", err)` | 제거 |
| TaskHistory.tsx | 63 | `console.error("이력 조회 실패:", err)` | 제거 |
| WeeklyWidget.tsx | 71 | `console.error(err)` | 제거 |

### 2.2 catch (err: any) → catch (err: unknown) (4건)

**패턴**:
```typescript
// Before
} catch (err: any) {
    setError(err.response?.data?.message || "fallback");
}

// After
} catch (err: unknown) {
    if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "fallback");
    } else {
        setError("fallback");
    }
}
```

대상: Login.tsx(2건→1건 Quick Login 제거), QuickJobEntry.tsx(1건), TaskHistory.tsx(1건)

### 2.3 API URL 환경변수

**client.ts**:
```typescript
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
```

**Dashboard.tsx**:
```typescript
const OWMS_WEB_URL = import.meta.env.VITE_OWMS_WEB_URL || "http://localhost:3000";
```

## Phase 3: 세션 관리 강화

### 3.1 완전한 로그아웃

```typescript
logout: () => set({ token: null, user: null, lastUserId: null }),
```

### 3.2 401 응답 시 스토리지 정리

```typescript
// client.ts 401 interceptor
if (error.response?.status === 401) {
    useUserStore.getState().logout();
}
// logout이 모든 상태를 초기화하므로 추가 작업 불필요
```

## 구현 순서

1. `userStore.ts` — lastPassword 제거 + sessionStorage + 완전 logout
2. `Login.tsx` — Quick Login 제거 + ID 자동입력 + err:unknown + console 제거
3. `client.ts` — 환경변수 API URL
4. `Dashboard.tsx` — console 제거 + 환경변수 URL
5. `QuickJobEntry.tsx` — console 제거 + err:unknown
6. `TaskHistory.tsx` — console 제거 + err:unknown
7. `WeeklyWidget.tsx` — console 제거
