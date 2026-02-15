# OWMS Frontend Code Analysis Results

## Analysis Target
- **Path**: `jis_job_frontend/src/`
- **File count**: 35 TypeScript/TSX files
- **Analysis date**: 2026-02-14
- **Tech Stack**: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5, Tailwind CSS 4, Axios
- **Backend**: localhost:4000 (API proxy via Axios)

## Quality Score: 48/100

---

## Summary of Findings

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 8 | Security flaws, broken architecture |
| WARNING | 18 | Type safety, reusability, maintainability |
| INFO | 12 | Style improvements, minor suggestions |

---

## CRITICAL Issues (8)

### C1: Backend URL Hardcoded (Security + Deployment)
- **File**: `src/lib/api.ts` lines 5-7
- Plain HTTP, exposes backend port 4000, no .env file exists
- **Fix**: Create `.env.local` with `NEXT_PUBLIC_API_URL`

### C2: User Data in localStorage Used for Authorization
- **File**: `src/app/login/page.tsx` lines 38-39
- Full user object including role/departmentId stored in localStorage

### C3: Client-Side Role Checks Are Bypassable
- **File**: `src/app/dashboard-layout.tsx` lines 71, 76
- Attacker can set `role: "DEPT_HEAD"` or `departmentId: 3` in DevTools
- Magic number `3` for department is hardcoded
- **Fix**: Server-side authorization on every API call

### C4: Hardcoded Year "2026" in Approval Page
- **File**: `src/app/attendance/approval/page.tsx` lines 17-29
- Will break in any other year
- **Fix**: Replace with `new Date().getFullYear()`

### C5: Middleware Checks Cookie Existence Only, Not Validity
- **File**: `src/middleware.ts` lines 4-26
- No JWT signature verification, no expiry check
- **Fix**: Add JWT verification using `jose` library

### C6: No CSP Headers or XSS Protection
- **File**: `next.config.ts` - completely empty
- No security headers configured
- **Fix**: Add CSP, X-Frame-Options, HSTS headers

### C7: Pervasive `catch (err: any)` Pattern
- **Files**: 12+ files across codebase
- **Fix**: Use `catch (err: unknown)` with type narrowing

### C8: Hardcoded Magic Number for Leave Days
- **File**: `src/app/dashboard/page.tsx` line 340
- Hardcoded `15` for total annual leave
- **Fix**: Use API-provided value

---

## WARNING Issues (18)

### W1: Monster Component - daily-report/page.tsx (1339 lines)
- 30+ state variables, needs split into 8-10 components + 3-4 hooks

### W2/W3: Pervasive `any` Type Usage (50+ occurrences)
- dashboard-layout.tsx, dashboard/page.tsx, daily-report/page.tsx, weekly-status/page.tsx, DashboardChart.tsx

### W4: Dark Mode CSS Variables Defined but Never Used
- `globals.css` lines 9-15

### W5: DashboardLayout Wraps ALL Routes Including Login
- `layout.tsx` line 29
- **Fix**: Use Next.js Route Groups: `(auth)/` and `(dashboard)/`

### W6: User State Duplicated Across 4 Components
- Each independently reads/parses localStorage
- **Fix**: Create `UserContext` with `UserProvider`

### W7: Token Refresh Edge Cases
- `lib/api.ts` lines 36-49 - possible stuck/loop on refresh failure

### W8: Single Test File is Broken
- `__tests__/page.test.tsx` - imports wrong component, expects non-existent text

### W9: Duplicate setState Call
- `weekly-status/page.tsx` line 189

### W10-W18: Additional Warnings
- W10: DashboardChart data typed as `any[]`
- W11: Duplicate date formatting functions across 4 files
- W12: No `loading.tsx` or `error.tsx` boundaries
- W13: `alert()`/`confirm()` used in 15+ locations
- W14: Empty `next.config.ts`
- W15: No ARIA attributes on interactive elements
- W16: Deprecated `substr` usage
- W17: Inconsistent import paths
- W18: Dashboard component 240-line if/else blocks

---

## Positive Observations

1. Good responsive design with Tailwind
2. Cookie-based auth with `withCredentials: true`
3. Consistent Korean locale support
4. Settings page component extraction is exemplary
5. StatCard and DashboardChart are well-designed reusable components
6. InlineCalendar drag-to-select is good UX
7. Print styles properly implemented
8. No `dangerouslySetInnerHTML` (good for XSS)
9. Dynamic routes follow App Router conventions
10. Suspense boundary correctly wraps `useSearchParams()`

---

## Duplicate Code Analysis

| Type | Location | Action |
|------|----------|--------|
| formatDate (3 functions) | daily-report, weekly-status | Extract to `src/lib/date-utils.ts` |
| downloadFile | weekly-status, daily-report | Extract to `src/lib/file-utils.ts` |
| localStorage user parse | 4 components | Create `useUser()` hook |
| Toast implementation | 6 files | Create `useToast()` + `<ToastProvider>` |
| Modal backdrop | 8 files | Create `<Modal>` base component |
| Loading spinner | 10 files | Create `<LoadingSpinner>` component |

---

## Performance Recommendations

1. Dynamic imports for heavy libraries (recharts, react-calendar, xlsx, html2canvas, jspdf)
2. Route Groups to avoid loading DashboardLayout for login
3. Server Components for data fetching
4. Memoization for `getFilteredProjects()` in daily-report
5. `Promise.all()` for independent parallel API calls

---

## Improvement Priorities

**Week 1 - Critical Security:**
1. `.env.local` with `NEXT_PUBLIC_API_URL`
2. JWT verification in middleware
3. Security headers in next.config.ts
4. Server-side authorization

**Weeks 2-3 - Architecture:**
5. Route Groups for auth/dashboard separation
6. UserContext for shared user state
7. Refactor daily-report/page.tsx
8. TypeScript interfaces in src/types/
9. Extract shared utilities
10. Add loading.tsx/error.tsx for each route

**Weeks 3-4 - Quality:**
11. Reusable UI components (Modal, Toast, ConfirmDialog)
12. Standardize `@/` imports
13. Dynamic imports for heavy libraries
14. Fix/rewrite test suite

---

## Deployment Readiness: NOT READY
8 critical issues must be fixed before production deployment.
