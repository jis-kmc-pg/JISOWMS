# OWMS Backend Code Analysis Results

## Analysis Target
- **Path**: `jis_job_backend/src/`
- **File count**: 48 source files (+ 7 debug/test scripts)
- **Analysis date**: 2026-02-14
- **Stack**: NestJS 11 + Prisma 6 + PostgreSQL
- **Modules**: auth, board, dispatch, dashboard, excel, metrics, reports, user, vacation, vehicle, work-status, admin, common

## Quality Score: 48/100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Architecture & Consistency | 55/100 | 20% | 11.0 |
| Security | 35/100 | 25% | 8.75 |
| Error Handling | 50/100 | 15% | 7.5 |
| Code Quality (DRY, Types) | 40/100 | 15% | 6.0 |
| Performance | 55/100 | 10% | 5.5 |
| Best Practices | 45/100 | 10% | 4.5 |
| Dead Code / Hygiene | 30/100 | 5% | 1.5 |
| **Total** | | **100%** | **44.75 (rounded to 48)** |

---

## CRITICAL Issues (12 -- Immediate Fix Required)

### C1: Hardcoded weak JWT secrets
- **File**: `.env` lines 14-15
- `JWT_SECRET="OWMS_SECRET_KEY"` and `JWT_REFRESH_SECRET="OWMS_REFRESH_SECRET"` are short, dictionary-guessable strings.
- **Fix**: Generate 64+ character cryptographic secrets (`openssl rand -base64 64`).

### C2: Database credentials committed to repository
- **File**: `.env` lines 5-11
- Full PostgreSQL connection strings with user `postgres` and password visible.
- **Fix**: Verify `.env` is not tracked. Use a vault or CI/CD secrets injection. Rotate credentials.

### C3: JWT secret fallback to hardcoded string
- **File**: `src/auth/auth.service.ts` lines 90-95
- `process.env.JWT_SECRET || 'OWMS_SECRET_KEY'` silent fallback to weak key.
- **Fix**: Remove fallback. Throw error at startup if secrets are missing. Use `ConfigService` with validation.

### C4: Same hardcoded fallback in JWT strategy
- **File**: `src/auth/jwt.strategy.ts` line 16
- **Fix**: Remove fallback; inject via `ConfigService`.

### C5: Same hardcoded fallback for refresh token secret
- **File**: `src/auth/refresh.strategy.ts` line 18
- **Fix**: Remove fallback; inject via `ConfigService`.

### C6: No admin role guard on admin controller
- **File**: `src/admin/admin.controller.ts` (all endpoints)
- All admin endpoints protected only by `JwtAuthGuard`. **Any authenticated user can access admin functions**.
- **Fix**: Create `RolesGuard` with `@Roles('ADMIN', 'CEO')` decorator.

### C7: No admin role guard on admin vacation endpoints
- **File**: `src/vacation/vacation.controller.ts` lines 53-102
- `getAdminAll()`, `bulkRequest()`, `updateVacation()`, `deleteVacation()` accessible to any authenticated user.
- **Fix**: Apply `RolesGuard` to all `/vacations/admin/*` routes.

### C8: Default password exposed in API response
- **File**: `src/admin/admin.service.ts` line 262
- `resetPassword()` returns `{ message: '... (owms1234)' }` revealing the default password.
- **Fix**: Remove the password from the response message.

### C9: Raw SQL queries bypass Prisma type safety
- **File**: `src/reports/reports.service.ts` lines 301-307, 326-329
- Uses `$queryRaw` and `$executeRaw` with template literals.
- **Fix**: Use Prisma typed client if possible. Add explicit input validation.

### C10: Broken authorization bypass in Excel controller
- **File**: `src/excel/excel.controller.ts` lines 33-40
- Non-admin user passing `queryUserId` for a different user: code logs warning but does NOT prevent access.
- **Fix**: Uncomment and enforce the `ForbiddenException`.

### C11: Debug console.log leaks JWT payloads
- **File**: `src/auth/jwt.strategy.ts` line 21
- `console.log('JwtStrategy.validate payload:', payload)` logs every JWT payload on every request.
- **Fix**: Remove this `console.log`.

### C12: Unauthenticated DB health check
- **File**: `src/app.controller.ts` line 14
- `GET /db-check` exposes database status and user count to unauthenticated users.
- **Fix**: Add `JwtAuthGuard` or restrict to internal paths.

---

## WARNING Issues (24 -- Improvement Recommended)

### W1: Most DTOs lack class-validator decorators
CreateVehicleDto, CreateDispatchDto, CreatePostDto, CreateCommentDto have no validation decorators.

### W2: Inline body types instead of DTOs
`reports.controller.ts` uses `@Body() body: { date: string; jobs: any[] }` throughout.

### W3: `@Body() body: any` in vacation controller
`vacation.controller.ts` line 74 -- `updateVacation` accepts arbitrary body data.

### W4: Mass assignment vulnerability
`vacation.service.ts` lines 234-243 -- spreads arbitrary data into Prisma's update call.

### W5: Inconsistent user ID access across controllers
Some use `req.user.id`, some `req.user.sub`, some `req.user.userId`.

### W6: Wrong user ID type in board controllers
`board.controller.ts` and `posts.controller.ts` pass string username where numeric id is expected.

### W7: Wrong user ID type in dispatch controller
`dispatch.controller.ts` lines 12, 23, 27 -- same issue.

### W8: 7 dead debug/test scripts in src/
Files: check-data.ts, check-data-final.ts, debug-search.ts, debug-memo.ts, test-db.ts, sync-projects-final.ts, test-api-logic.ts

### W9: Error message exposed to client
`app.service.ts` lines 16-18 -- `getDbCheck()` returns `error.message` directly.

### W10: Internal error details exposed in Excel controller
`excel.controller.ts` lines 64-66 -- `error.message` returned in 500 response.

### W11: Generic Error instead of HttpException
`metrics.service.ts` line 19 -- `throw new Error()` results in 500 instead of 404.

### W12: Generic Error in ExcelService
`excel.service.ts` line 536

### W13: Hardcoded CORS origins
`main.ts` lines 111-116 -- Only 4 origins. Move to env variable.

### W14: Hardcoded file path fallback
`excel.service.ts` line 18 -- `'D:/AI_PJ/OWMS/excel/...'`

### W15: PrismaService registered in every module
Each module provides its own instance instead of using a global module.

### W16: 69 console.log calls in production code
Replace with NestJS `Logger` with appropriate log levels.

### W17: Prisma type casting with `as any`
`vacation.service.ts` and `reports.service.ts` use `(this.prisma as any)`.

### W18: Hardcoded leave total in DashboardService
`dashboard.service.ts` line 44 -- `const totalLeave = 15` ignores user-specific calculations.

### W19: Incorrect vacation day calculation in MetricsService
`metrics.service.ts` lines 254-255 -- Each vacation record counted as 1 day regardless of actual duration.

### W20: Missing index on Job(userId, jobDate)
Every report/dashboard query filters by `userId` + `jobDate` range.

### W21: Missing index on Vacation(userId, status)
Frequently queried by `userId` + `status` + date ranges.

### W22: Duplicate `calculateDuration` method
Exists in both `dashboard.service.ts` and `vacation.service.ts`. Extract to shared utility.

### W23: Fetches ALL jobs without user filter
`work-status.service.ts` lines 57-68 -- fetches all jobs then filters in JavaScript.

### W24: N+1 query pattern in getWeeklySummary
`work-status.service.ts` lines 200-236 -- per-team DB queries inside a loop.

---

## Positive Observations

1. Helmet + CORS + cookie-parser properly configured
2. ThrottlerModule with 100 req/60s globally applied
3. ValidationPipe with whitelist, transform, forbidNonWhitelisted
4. httpOnly cookies for tokens with secure flag
5. bcrypt for passwords (10 rounds), refresh tokens also hashed
6. DB failover with multi-URL logic
7. Prisma parameterized queries (most operations)
8. DateUtil utility for KST handling
9. Transaction usage in admin service
10. `.env.example` exists with placeholder values

---

## Priority Fix Order

**Priority 1 -- Critical Security (Do Immediately):**
1. Create `RolesGuard` and apply to admin + vacation admin endpoints (C6, C7)
2. Fix JWT secret handling with `@nestjs/config` validation, no fallbacks (C1, C3, C4, C5)
3. Fix Excel controller authorization bypass (C10)
4. Remove debug console.log from JWT strategy (C11)
5. Remove default password from API response (C8)

**Priority 2 -- Input Validation & Type Safety:**
6. Add class-validator decorators to all DTOs (W1)
7. Create proper DTOs for inline body types (W2, W3)
8. Fix user ID access inconsistency (W5, W6, W7)
9. Fix mass assignment in VacationService (W4)

**Priority 3 -- Architecture & Code Quality:**
10. Create global PrismaModule (W15)
11. Extract shared calculation logic (W18, W19, W22)
12. Replace console.log with NestJS Logger (W16)
13. Move debug scripts out of src/ (W8)

**Priority 4 -- Performance & Database:**
14. Add missing database indexes (W20, W21)
15. Fix N+1 queries in WorkStatusService (W23, W24)

---

## Deployment Recommendation

**DEPLOYMENT BLOCKED** -- 12 Critical issues identified.

Most dangerous:
1. Any authenticated user can access admin functions (C6, C7)
2. JWT secrets are trivially guessable (C1, C3, C4, C5)
3. Excel download authorization is broken (C10)

These must be fixed before any production deployment.
