# OWMS_SYS Code Analysis Results

## Analysis Target
- **Path**: `d:\AI_PJ\JISOWMS\OWMS_SYS\`
- **Application Type**: Tauri v2 Desktop Application (System Tray Widget)
- **Frontend Framework**: React 19 + TypeScript + Tailwind CSS v4
- **Native Backend**: Rust (Tauri v2)
- **State Management**: Zustand v5
- **HTTP Client**: Axios
- **Build Tool**: Vite 7
- **File count**: 12 source files (10 frontend, 2 Rust)
- **Analysis date**: 2026-02-14

---

## 1. Architecture Overview

### Application Purpose
OWMS_SYS is a **system tray widget** for the OWMS (Office Work Management System). It runs as a persistent desktop application in the Windows system tray, providing:

- Quick login / quick reconnect
- Quick task entry (system memos)
- Weekly work status dashboard (current week / next week)
- Task history timeline (last 7 days)
- One-click launch of the full OWMS web application

### Architecture Diagram

```
+---------------------------------------------+
|  OWMS_SYS (Tauri Desktop App)               |
|                                              |
|  +---------+    +------------+    +--------+ |
|  | React   | -> | Zustand    | -> | Axios  | |   HTTP (localhost:4000)
|  | Frontend|    | UserStore  |    | Client | | -----> OWMS Backend (NestJS)
|  +---------+    +------------+    +--------+ |
|       |                                      |
|  +---------+                                 |
|  | Tauri   | (System tray, autostart,        |
|  | Rust    |  window management, events)     |
|  +---------+                                 |
+---------------------------------------------+
         |
         | openUrl()
         v
   Default Browser -> http://localhost:3000 (OWMS Web Frontend)
```

### Component Structure

```
src/
  main.tsx              - React entry point (StrictMode)
  App.tsx               - Root component (auth gate + tray event listener)
  App.css               - Empty (unused)
  index.css             - Tailwind CSS import only
  vite-env.d.ts         - Vite type declarations
  api/
    client.ts           - Axios instance with auth interceptors
  store/
    userStore.ts        - Zustand persisted store (user, token, quick-login data)
  components/
    Login.tsx           - Login form + Quick Login button
    Dashboard.tsx       - Main dashboard with header and widgets
    QuickJobEntry.tsx   - Rapid task/memo input form
    WeeklyWidget.tsx    - Weekly work status visualization
    TaskHistory.tsx     - Recent task memo timeline

src-tauri/
  src/
    main.rs             - Rust entry point (delegates to lib)
    lib.rs              - Tauri setup: tray icon, menu, window toggle, autostart
  Cargo.toml            - Rust dependencies
  tauri.conf.json       - Tauri window/build/security config
  capabilities/
    default.json        - Permission declarations
```

---

## 2. Quality Score: 55/100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Code Quality | 65/100 | 20% | 13 |
| Security | 25/100 | 30% | 7.5 |
| Performance | 70/100 | 15% | 10.5 |
| Architecture | 65/100 | 15% | 9.75 |
| Build & Config | 70/100 | 10% | 7 |
| Error Handling | 55/100 | 10% | 5.5 |
| **Total** | | **100%** | **53.25 -> 55** |

---

## 3. Issues Found

### CRITICAL (Immediate Fix Required)

| # | File | Line | Issue | Recommended Action |
|---|------|------|-------|-------------------|
| C1 | `src/store/userStore.ts` | 16, 29-37 | **Plain-text password stored in localStorage** via Zustand `persist`. The `lastPassword` field stores the raw password in `localStorage` under key `owms-user-storage`. Any local script, XSS, or file system access can read it. | Remove `lastPassword` entirely. Use a refresh token or session cookie for "quick login" instead. If quick login is essential, store a server-issued short-lived token in Tauri's secure storage (e.g., `tauri-plugin-store` with encryption or OS keychain). |
| C2 | `src-tauri/tauri.conf.json` | 32 | **CSP set to `null`** (Content Security Policy disabled). This means the WebView has no restrictions on script sources, inline scripts, or external resource loading. In a desktop app that loads web content and handles auth tokens, this is a significant attack surface. | Set a strict CSP: `"csp": "default-src 'self'; script-src 'self'; connect-src http://localhost:4000; style-src 'self' 'unsafe-inline'; img-src 'self' data:"` |
| C3 | `src/api/client.ts` | 5 | **Hardcoded backend URL** `http://localhost:4000`. No HTTPS, no environment variable. In production or multi-environment deployments, this cannot be changed without code modification. Also communicates entirely over plain HTTP -- tokens and passwords are transmitted in cleartext. | Use an environment variable (`VITE_API_BASE_URL`) or Tauri configuration for the API URL. Plan for HTTPS in production. |
| C4 | `src/components/Dashboard.tsx` | 9 | **Hardcoded web app URL** `http://localhost:3000` (opened in browser). Same issue as C3: no configurability, plain HTTP. | Use an environment variable or derive from config. |
| C5 | `src/components/Login.tsx` | 26, 41 | **Password sent in login request body and then stored** in the Zustand store. The password travels: user input -> axios POST body (unencrypted HTTP) -> stored in localStorage. Triple exposure. | Even if the password must be sent to the API (unavoidable for login), never store it client-side afterward. Use token refresh mechanisms. |

### WARNING (Improvement Recommended)

| # | File | Line | Issue | Recommended Action |
|---|------|------|-------|-------------------|
| W1 | `src-tauri/src/lib.rs` | 10-12 | **Dead code**: `greet` command is registered in `invoke_handler` (line 86) but never called from the frontend. This is leftover Tauri template code. | Remove the `greet` function and its registration in `invoke_handler`. |
| W2 | `src/App.tsx` | 1 | **Unused CSS import**: `import "./App.css"` loads an empty file. | Remove the import and delete `App.css`. |
| W3 | `index.html` | 6 | **Default title**: `"Tauri + React + Typescript"`. Should reflect the actual application name. | Change to `"OWMS System Tray"` or the appropriate product name. |
| W4 | `src-tauri/tauri.conf.json` | 26-27 | **Hardcoded window position**: `"x": 1480, "y": 520`. This assumes a specific monitor resolution and will position the window off-screen on smaller displays. | Remove fixed x/y or calculate position dynamically relative to the tray icon. Tauri v2 supports tray-relative positioning. |
| W5 | `src/components/WeeklyWidget.tsx` | 49 | **Missing dependency in useEffect**: `fetchBothWeeks` is called in `useEffect([], [])` but depends on `today` (created each render) and the `user` state. The linting rule `react-hooks/exhaustive-deps` would flag this. | Add `fetchBothWeeks` to the dependency array or wrap it in `useCallback`, or restructure so the date is stable. |
| W6 | `src/components/TaskHistory.tsx` | 23-24 | **Missing dependency in useEffect**: Same pattern -- `fetchHistory` is defined inside the component but not listed as a dependency. | Same fix as W5. |
| W7 | `src/components/TaskHistory.tsx` | 33-46 | **N+1 API calls**: Fires 7 parallel requests (one per day) to fetch system memos. This generates unnecessary HTTP overhead and backend load. | Add a backend endpoint that accepts a date range (e.g., `?from=2026-02-07&to=2026-02-14`) and returns all memos at once. A single request replaces 7. |
| W8 | `package.json` | 2 | **Package name**: `"tauri-appowms-sys"` is the default Tauri template name with "owms-sys" appended. Not meaningful. | Rename to `"owms-sys"` or `"@jis/owms-system-tray"`. |
| W9 | `src-tauri/Cargo.toml` | 25 | **Git dependency**: `tauri-plugin-autostart` is pulled from a Git branch (`v2`), not a published crate version. This can break builds if the upstream branch changes. | Pin to a specific commit hash or wait for a published crate version. |
| W10 | `src/store/userStore.ts` | 42-44 | **No storage encryption**: Zustand `persist` uses plain `localStorage` by default. Token, user data, and (critically) password are stored as plain JSON. | At minimum, use Tauri's `tauri-plugin-store` which supports encrypted storage. Remove password storage entirely (see C1). |
| W11 | `src/components/Login.tsx` | 27, 32 | **`catch (err: any)`**: Using `any` type bypasses TypeScript safety. The error could be any shape. | Use `catch (err: unknown)` with type narrowing, or create an `isAxiosError` type guard. |
| W12 | `src/components/QuickJobEntry.tsx` | 32 | **Same `any` pattern** on error catch. | Same fix as W11. |
| W13 | `src/components/TaskHistory.tsx` | 62 | **Same `any` pattern** on error catch. | Same fix as W11. |
| W14 | No file | - | **No `.env` or `.env.example` file exists**. Configuration is entirely hardcoded. | Create `.env.example` with `VITE_API_BASE_URL=http://localhost:4000` and `VITE_WEB_URL=http://localhost:3000`. |
| W15 | No file | - | **No ESLint configuration**. TypeScript strict mode is enabled, but no linting rules enforce code style, hooks rules, or security patterns. | Add `eslint.config.mjs` with `@typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` rules. |
| W16 | No file | - | **No test files exist**. Zero test coverage for frontend components or Rust backend logic. | Add at minimum: unit tests for `userStore`, integration tests for API client interceptors, and component tests for Login/Dashboard. |
| W17 | `src-tauri/tauri.conf.json` | 35-36 | **Bundle targets set to `"all"`**. This builds for all platforms (Windows MSI/NSIS, macOS DMG, Linux AppImage/deb) even though this is a Windows-only system tray app. | Set `"targets": ["nsis", "msi"]` to build only Windows installers, reducing build time. |

### INFO (Reference)

| # | Observation |
|---|-------------|
| I1 | **Good**: TypeScript strict mode is enabled with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`. |
| I2 | **Good**: Axios interceptors properly handle 401 responses by triggering logout automatically. |
| I3 | **Good**: The system tray implementation in Rust is well-structured with proper window toggle, menu events, and close-to-tray behavior. |
| I4 | **Good**: Parallel API calls in `WeeklyWidget.tsx` (`Promise.all`) and error-tolerant calls in `TaskHistory.tsx` (`Promise.allSettled`). |
| I5 | **Good**: Tauri autostart plugin is configured for the app to launch on system startup. |
| I6 | **Good**: The OWMS backend (`main.ts` line 113-115) already allows CORS from `http://localhost:1420` and `tauri://localhost`, so Tauri integration is accounted for. |
| I7 | **Good**: Component sizes are reasonable (all under 120 lines). Functions are short and focused. |
| I8 | The React SVG asset (`src/assets/react.svg`) and public SVGs (`tauri.svg`, `vite.svg`) are template defaults and unused. Can be cleaned up. |
| I9 | The `dist/` directory is committed (not in `.gitignore` for the root, though `dist` is listed). The built output should not be in version control. Verify `.gitignore` is working. |

---

## 4. Detailed Analysis

### 4.1 Security Analysis

#### Password Storage (CRITICAL)

The most severe security issue in this codebase is the storage of plaintext passwords in `localStorage`:

```typescript
// src/store/userStore.ts line 36-37
login: (token, user, password?) =>
    set({
        token,
        user,
        lastUserId: user.userId,
        ...(password ? { lastPassword: password } : {}),
    }),
```

This means anyone who:
- Opens DevTools on the Tauri WebView
- Has access to the machine's file system (localStorage is stored on disk)
- Exploits any XSS vulnerability (easy since CSP is `null`)

...can read the user's password in plaintext from `localStorage` key `owms-user-storage`.

**Risk**: HIGH -- credential theft, lateral movement if password is reused.

**Recommended architecture for Quick Login**:
```
1. On first login, server issues: accessToken (short-lived) + refreshToken (long-lived, httpOnly cookie)
2. Store only the refreshToken securely (OS keychain via Tauri plugin)
3. Quick Login = use refreshToken to get new accessToken
4. No password ever stored on client
```

#### CSP Disabled

```json
// src-tauri/tauri.conf.json
"security": {
    "csp": null
}
```

With CSP disabled, the Tauri WebView has no restrictions. If an attacker can inject any script (through a compromised API response, XSS in content rendering, etc.), they have full access to:
- The Zustand store (including passwords and tokens)
- The Tauri IPC bridge (potentially executing native commands)
- Making arbitrary network requests

#### No HTTPS

All communication between the desktop app and backend occurs over plain HTTP (`http://localhost:4000`). While `localhost` traffic typically stays on the local machine, if the backend is deployed on a different host (e.g., `192.168.123.46`), credentials and tokens transit the network unencrypted.

### 4.2 Architecture Compliance

#### Clean Architecture Assessment

The codebase is small (12 files) and follows a **flat, pragmatic structure** rather than strict Clean Architecture. For a system tray widget, this is acceptable, but some improvements can be made:

| Principle | Status | Notes |
|-----------|--------|-------|
| Separation of concerns | Partial | API client, store, and components are separated. But business logic (date calculations, data transforms) lives inside components. |
| Dependency direction | OK | Components -> Store -> API Client. No circular dependencies. |
| Interface segregation | N/A | No interfaces defined (small codebase). |
| Single responsibility | Partial | `WeeklyWidget.tsx` handles data fetching, date math, status extraction, AND rendering. Should separate data hook from UI. |

**Recommended refactoring**:
```
src/
  hooks/
    useWeeklyStatus.ts    - Data fetching + transformation logic
    useTaskHistory.ts     - History fetching logic
  components/
    WeeklyWidget.tsx      - Pure UI, receives data as props
    TaskHistory.tsx        - Pure UI, receives data as props
  types/
    api.ts                - Shared API response types
    user.ts               - User-related types
```

#### API Client Layer

The API client (`src/api/client.ts`) is well-designed with:
- Centralized Axios instance
- Request interceptor for auth token injection
- Response interceptor for 401 auto-logout

However, it lacks:
- Request/response type definitions
- Error transformation to a typed `ApiError`
- Retry logic for transient failures (important for a desktop app that may experience intermittent connectivity)

### 4.3 Performance Analysis

| Item | Status | Notes |
|------|--------|-------|
| N+1 API calls | Issue (W7) | `TaskHistory.tsx` fires 7 parallel requests instead of one range query. |
| Unnecessary re-renders | OK | Zustand selectors are used properly (`useUserStore((state) => state.user)`). |
| Memory leaks | OK | `useEffect` cleanup properly unlistens Tauri events in `App.tsx`. |
| Heavy computation caching | Minor | `extractMyStatus` in `WeeklyWidget.tsx` runs on every render. Could be memoized with `useMemo`. |
| Async handling | Good | `Promise.all` and `Promise.allSettled` used appropriately. |
| Bundle size | Unoptimized | No code splitting or lazy loading (acceptable for a small tray app). |

### 4.4 Tauri Configuration Analysis

#### tauri.conf.json

| Setting | Value | Assessment |
|---------|-------|------------|
| `productName` | `"OWMS-SYS"` | Good |
| `identifier` | `"com.jis.owms-sys"` | Good -- proper reverse domain notation |
| `visible` | `false` | Correct -- starts hidden in tray |
| `alwaysOnTop` | `true` | Correct for a tray popup widget |
| `x: 1480, y: 520` | Hardcoded | Problematic -- see W4 |
| `csp` | `null` | Critical -- see C2 |
| `targets` | `"all"` | Wasteful -- see W17 |

#### Capabilities (Permissions)

```json
{
    "permissions": [
        "core:default",
        "opener:default",       // Open URLs in browser
        "core:tray:default",    // System tray operations
        "autostart:allow-enable",
        "autostart:allow-disable"
    ]
}
```

This follows the **principle of least privilege** well. Only necessary permissions are requested. No file system, shell, or clipboard access is granted.

#### Rust Backend (lib.rs)

The Rust code is well-structured:
- System tray with 3-item context menu (Open / Logout / Quit)
- Left-click toggles window visibility
- Close button hides to tray (prevents accidental exit)
- `tray-logout` event emitted to frontend for Zustand state cleanup
- Autostart plugin configured

Minor issue: The `greet` command (template leftover) is registered but never used.

### 4.5 Code Quality Details

#### Naming Conventions
- **Components**: PascalCase -- PASS
- **Functions**: camelCase -- PASS
- **Variables**: camelCase -- PASS
- **Constants**: Mixed -- `OWMS_WEB_URL` is UPPER_SNAKE_CASE (correct), but there are no other constants extracted from hardcoded values
- **Files**: PascalCase for components, camelCase for utilities -- PASS

#### TypeScript Usage
- Strict mode enabled -- GOOD
- `any` type used in 3 error catch blocks -- should use `unknown`
- Interfaces defined for `User`, `UserState`, `WeeklyStatusData`, `MemoItem` -- GOOD
- Missing: API response type definitions (responses are untyped `response.data`)

#### Code Duplication
- **Date formatting**: `toISOString().split("T")[0]` appears in 3 files (`QuickJobEntry.tsx:20`, `WeeklyWidget.tsx:55`, `TaskHistory.tsx:15`). Should extract to a shared utility.
- **Error display pattern**: `{error && <p className="text-red-500 text-xs">...</p>}` appears in 3 components with slight variations. Could extract an `ErrorMessage` component.
- **Loading spinner pattern**: `<Loader2 className="animate-spin" size={16} />` appears in 4 places. Could extract a `LoadingSpinner` component.

### 4.6 Build Configuration

#### Vite Config (`vite.config.ts`)

- Fixed dev port 1420 (required by Tauri) with `strictPort: true` -- correct
- HMR configured for remote dev with `TAURI_DEV_HOST` -- correct
- Ignores `src-tauri/` in watch -- correct
- **Missing**: Path aliases (e.g., `@/` for `src/`), which would clean up imports

#### TypeScript Config (`tsconfig.json`)

- Target ES2020 -- fine for WebView2 (Chromium-based)
- Strict mode with all recommended checks -- excellent
- `noEmit: true` -- correct (Vite handles bundling)
- **Missing**: Path aliases to match Vite config

---

## 5. Improvement Recommendations

### Priority 1: Security Fixes (IMMEDIATE)

1. **Remove password storage** from `userStore.ts`. Implement server-side refresh tokens for "quick login" functionality.

2. **Enable CSP** in `tauri.conf.json`:
   ```json
   "security": {
       "csp": "default-src 'self'; script-src 'self'; connect-src http://localhost:4000; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
   }
   ```

3. **Externalize configuration** -- create environment variables for API URL and web URL:
   ```env
   # .env
   VITE_API_BASE_URL=http://localhost:4000
   VITE_WEB_URL=http://localhost:3000
   ```
   ```typescript
   // src/api/client.ts
   const apiClient = axios.create({
       baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
   });
   ```

4. **Plan HTTPS migration** for production deployment.

### Priority 2: Code Quality (THIS SPRINT)

5. **Remove dead code**: Delete `greet` command from `lib.rs`, remove `App.css` import, clean up template SVG assets.

6. **Fix TypeScript issues**: Replace `catch (err: any)` with `catch (err: unknown)` and add proper type narrowing.

7. **Add ESLint** with `react-hooks/exhaustive-deps` rule to catch the useEffect dependency issues.

8. **Extract shared utilities**:
   ```typescript
   // src/utils/date.ts
   export function toDateStr(d: Date): string { ... }
   export function formatShortDate(dateStr: string): string { ... }
   export function getMonday(d: Date): Date { ... }
   ```

9. **Add API response types**:
   ```typescript
   // src/types/api.ts
   interface LoginResponse {
       accessToken: string;
       user: User;
   }
   interface SystemMemo {
       id: number;
       content: string;
       date: string;
       createdAt: string;
       user?: { name: string; position: string };
   }
   ```

### Priority 3: Architecture (NEXT SPRINT)

10. **Separate data fetching from rendering** using custom hooks:
    ```typescript
    // src/hooks/useWeeklyStatus.ts
    export function useWeeklyStatus() {
        // Move all fetching + transformation logic here
        return { currentWeek, nextWeek, loading, error, refresh };
    }
    ```

11. **Reduce TaskHistory API calls** from 7 to 1 by adding a date-range endpoint to the backend.

12. **Add Axios retry logic** with exponential backoff for network resilience:
    ```typescript
    import axiosRetry from 'axios-retry';
    axiosRetry(apiClient, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
    ```

13. **Fix hardcoded window position** -- use dynamic positioning or remove fixed coordinates:
    ```json
    {
        "center": true,
        "visible": false
    }
    ```

### Priority 4: Testing & DevOps (UPCOMING)

14. **Add unit tests** for `userStore.ts` (Zustand testing with `vitest`).
15. **Add component tests** for Login and Dashboard flows.
16. **Set bundle targets** to Windows-only: `"targets": ["nsis"]`.
17. **Fix index.html title** to reflect actual application name.

---

## 6. Duplicate Code Analysis

### Duplicates Found

| Type | Location 1 | Location 2 | Location 3 | Similarity | Recommended Action |
|------|-----------|-----------|-----------|-----------|-------------------|
| Exact | `QuickJobEntry.tsx:20` `.toISOString().split("T")[0]` | `WeeklyWidget.tsx:55` same pattern | `TaskHistory.tsx:15` `toDateStr()` function | 100% | Extract to `src/utils/date.ts` |
| Structural | `Login.tsx:27-33` error catch + setError | `QuickJobEntry.tsx:32-37` same pattern | `TaskHistory.tsx:62-64` same pattern | 85% | Extract error handling utility |
| Structural | `WeeklyWidget.tsx:89-94` loading spinner | `TaskHistory.tsx:70-75` loading spinner | `Login.tsx:60-62` loading spinner | 80% | Extract `<Spinner />` component |

### Reuse Opportunities

| Function/Component | Current Location | Suggestion | Reason |
|-------------------|-----------------|------------|--------|
| `toDateStr()` | `TaskHistory.tsx:14-16` | Move to `src/utils/date.ts` | Reusable in 3+ places |
| `getMonday()` | `WeeklyWidget.tsx:30-36` | Move to `src/utils/date.ts` | General-purpose date utility |
| `offsetDate()` | `WeeklyWidget.tsx:23-27` | Move to `src/utils/date.ts` | General-purpose date utility |
| `formatDate()` | `TaskHistory.tsx:114-122` | Move to `src/utils/date.ts` | Date formatting utility |
| Loading spinner | Inline in 4 components | Extract `<Spinner size={16} />` component | DRY principle |
| Error message | Inline in 3 components | Extract `<ErrorText message={...} />` component | DRY principle |

---

## 7. Extensibility Analysis

### Hardcoding Found

| File | Line | Code | Suggestion |
|------|------|------|------------|
| `api/client.ts` | 5 | `baseURL: 'http://localhost:4000'` | Environment variable `VITE_API_BASE_URL` |
| `api/client.ts` | 6 | `timeout: 5000` | Environment variable or config constant |
| `Dashboard.tsx` | 9 | `const OWMS_WEB_URL = "http://localhost:3000"` | Environment variable `VITE_WEB_URL` |
| `tauri.conf.json` | 26-27 | `"x": 1480, "y": 520` | Dynamic positioning or `"center": true` |
| `TaskHistory.tsx` | 35 | `i < 7` (7 days hardcoded) | Named constant `HISTORY_DAYS = 7` |
| `TaskHistory.tsx` | 61 | `.slice(0, 20)` (max 20 items) | Named constant `MAX_HISTORY_ITEMS = 20` |
| `QuickJobEntry.tsx` | 31 | `setTimeout(..., 2000)` | Named constant `SUCCESS_DISPLAY_MS` |
| `QuickJobEntry.tsx` | 36 | `setTimeout(..., 3000)` | Named constant `ERROR_DISPLAY_MS` |

### Extensibility Improvement Needed

| File | Pattern | Problem | Suggestion |
|------|---------|---------|------------|
| `WeeklyWidget.tsx:169-181` | `switch` on status | Adding new statuses requires modifying this function | Use a status-to-icon mapping object: `const STATUS_ICONS: Record<string, ComponentType> = { DONE: CheckCircle, ... }` |
| `App.tsx:22` | Ternary `user ? <Dashboard /> : <Login />` | No support for additional states (loading, error, onboarding) | Consider a state machine or router for app states |

---

## 8. Summary

### Strengths
- Clean, small codebase with focused purpose (system tray widget)
- Good Tauri v2 integration (tray menu, window management, autostart, event bridge)
- Proper React patterns (functional components, hooks, controlled inputs)
- Zustand store is well-typed with proper selectors
- Axios interceptors handle auth lifecycle correctly
- TypeScript strict mode enforced
- Tauri capabilities follow least-privilege principle
- Components are concise and readable (all under 120 lines)

### Weaknesses
- CRITICAL: Plaintext password stored in localStorage
- CRITICAL: Content Security Policy disabled
- CRITICAL: All URLs hardcoded, no HTTPS
- No tests (0% coverage)
- No ESLint configuration
- No environment variable management
- Dead template code not cleaned up
- Date utility functions duplicated across components
- API responses are untyped
- 7 parallel API calls where 1 would suffice (TaskHistory)

### Deployment Recommendation

**BLOCKED** -- 5 critical issues must be resolved before production deployment:
1. Remove password storage (C1, C5)
2. Enable CSP (C2)
3. Externalize and secure URLs (C3, C4)

After critical fixes, the application can proceed to testing with WARNING issues tracked for resolution.
