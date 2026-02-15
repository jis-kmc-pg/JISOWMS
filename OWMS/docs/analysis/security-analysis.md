# OWMS Security Architecture Review

**Date:** 2026-02-14
**Overall Security Score: 52/100**
**Findings: 5 Critical, 8 High, 7 Medium, 5 Low**

---

## Executive Summary

OWMS implements security fundamentals correctly -- JWT with HttpOnly cookies, refresh token rotation with bcrypt, Helmet headers, CORS, rate limiting, Prisma ORM. However, critical weaknesses must be resolved before production.

**Key Strengths:**
- HttpOnly cookie-based JWT storage
- Refresh token rotation with bcrypt hash
- Helmet middleware for HTTP security headers
- Global rate limiting (100 req/min)
- Prisma ORM parameterized queries
- ValidationPipe with whitelist/forbidNonWhitelisted
- Password hashing with bcrypt (10 rounds)

---

## Critical Findings (5)

### SEC-001: Hardcoded Weak JWT Secrets
**OWASP:** A02 - Cryptographic Failures
**Files:** auth.service.ts, jwt.strategy.ts, refresh.strategy.ts, .env

```
JWT_SECRET="OWMS_SECRET_KEY"
JWT_REFRESH_SECRET="OWMS_REFRESH_SECRET"
```
Source code has fallback: `process.env.JWT_SECRET || 'OWMS_SECRET_KEY'`

**Risk:** Attacker can forge JWT tokens for any user including admin.
**Fix:** Generate 64-char cryptographic secrets, remove fallback defaults.

### SEC-006: Complete Absence of RBAC Enforcement
**OWASP:** A01 - Broken Access Control
**Files:** All controllers use only JwtAuthGuard -- no role checks exist.

5-level role system exists (CEO → MEMBER) but **never enforced**. Any MEMBER can:
- Create/delete departments, teams, users (admin.controller.ts)
- Reset any user's password to `owms1234`
- Change any user's role to CEO
- Bulk-create vacations for all users
- Delete any vacation record
- Create/delete vehicles

**Fix:** Implement `RolesGuard` with `@Roles()` decorator.

### SEC-007: Admin Password Reset Without Authorization
**OWASP:** A01 - Broken Access Control
**File:** admin.service.ts lines 253-263

Any authenticated user can reset any user's password (including CEO) to `owms1234`. Response includes password in plaintext.

### SEC-010: Multiple DTOs Missing Validation Decorators
**OWASP:** A03 - Injection
**Files:** create-post.dto.ts, create-comment.dto.ts, create-vehicle.dto.ts, create-dispatch.dto.ts

No class-validator decorators. Fields accept empty strings, extremely long strings, or any value.

### SEC-014: Unauthenticated Database Health Check
**OWASP:** A05 - Security Misconfiguration
**File:** app.controller.ts, app.service.ts

`GET /db-check` exposes user count and database error messages without authentication.

---

## High Findings (8)

### SEC-002: Debug Logging of JWT Payload
- jwt.strategy.ts line 21: logs full JWT payload on every request

### SEC-008: IDOR Vulnerabilities
| Endpoint | Issue |
|----------|-------|
| `GET /work-status/detail?userId=X` | Any user views any user's jobs |
| `POST /vacations/admin/stats-config/:userId` | Any user modifies any user's config |
| `POST /vacations/admin/:id` | Any user updates any vacation |
| `POST /vacations/admin/:id/delete` | Any user deletes any vacation |

### SEC-009: Excel Report Access Bypass
- excel.controller.ts: detects unauthorized access but silently allows it

### SEC-011: Inline Body Types Without DTO Validation
- Multiple controllers use `@Body() body: any` bypassing ValidationPipe

### SEC-015: No Security Audit Trail
- No structured logging for failed logins, role changes, password resets

### SEC-016: No Stricter Rate Limiting on Auth
- Login shares global 100 req/min limit. Brute-force feasible with default password.

### SEC-018: Default Password in API Response
- admin.service.ts: `'비밀번호가 초기화되었습니다. (owms1234)'`

### SEC-019: Internal Error Details in Excel Responses
- excel.controller.ts: returns `error.message` in 500 response

---

## Medium Findings (7)

| ID | Title |
|----|-------|
| SEC-003 | NODE_ENV not set; `secure` cookie flag disabled |
| SEC-004 | Logout does not invalidate refresh token in DB |
| SEC-005 | Access token returned in login response body (also in cookie) |
| SEC-012 | No password complexity requirements |
| SEC-013 | External DB connection uses `sslmode=disable` over internet |
| SEC-017 | Next.js config empty -- no security headers |
| SEC-021 | No server-side content sanitization for board posts/comments |

---

## Low Findings (5)

| ID | Title |
|----|-------|
| SEC-020 | Refresh token cookie path `/` too broad |
| SEC-022 | User data stored in localStorage |
| SEC-023 | Frontend middleware checks cookie existence but not JWT validity |
| SEC-024 | Dynamic backend URL from `window.location.hostname` |
| SEC-025 | Console.log debug statements throughout codebase |

---

## Remediation Priority

### Phase 1: MUST fix before production (Critical) - ~8 hours
1. SEC-001: Generate strong JWT secrets, remove fallbacks (1h)
2. SEC-006: Implement RolesGuard for admin endpoints (4h)
3. SEC-007: Gate password reset behind admin role, remove password from response (30min)
4. SEC-014: Remove or protect `/db-check` endpoint (15min)
5. SEC-010: Add class-validator decorators to all DTOs (2h)

### Phase 2: Fix before release (High) - ~10 hours
6. SEC-002/015/025: Remove all debug console.log (1h)
7. SEC-008: Add ownership/role checks to IDOR endpoints (3h)
8. SEC-009: Activate ForbiddenException in Excel controller (30min)
9. SEC-011: Create DTOs for all inline body types (4h)
10. SEC-016: Stricter throttling on login 5/15min (30min)
11. SEC-018/019: Remove sensitive data from responses (30min)

### Phase 3: Next sprint (Medium)
12. SEC-003, SEC-004, SEC-005, SEC-012, SEC-013, SEC-017, SEC-021

### Phase 4: Backlog (Low)
13. SEC-020, SEC-022, SEC-023, SEC-024
