# Plan: owms-sys-security

## 개요
OWMS_SYS (Tauri 데스크톱 앱) 프론트엔드의 보안 취약점 수정.
**가장 심각한 이슈**: localStorage에 평문 비밀번호 저장 (Quick Login 기능).

## 현황 분석

### 발견된 보안 이슈 (총 9건)

| # | 심각도 | 카테고리 | 이슈 | 파일 |
|---|--------|----------|------|------|
| 1 | CRITICAL | 저장소 | 평문 비밀번호 localStorage 저장 | userStore.ts:16,29,37 |
| 2 | CRITICAL | 저장소 | Zustand persist → localStorage 기본값 | userStore.ts:23-46 |
| 3 | CRITICAL | 인증 | Quick Login 저장된 PW 재사용 | Login.tsx:11,14,17-26 |
| 4 | CRITICAL | 저장소 | JWT 토큰 localStorage 저장 (XSS 리스크) | userStore.ts:13,26,32-35 |
| 5 | HIGH | 설정 | 하드코딩 HTTP localhost API URL | client.ts:5 |
| 6 | HIGH | 로깅 | console.error 원시 에러 노출 (6건) | Login, Dashboard, QuickJobEntry, TaskHistory, WeeklyWidget |
| 7 | HIGH | 타입 | `catch (err: any)` 사용 (4건) | Login(2), QuickJobEntry, TaskHistory |
| 8 | LOW | 세션 | 로그아웃 시 불완전한 세션 정리 | userStore.ts:39-41 |
| 9 | LOW | 설정 | OWMS_WEB_URL 하드코딩 | Dashboard.tsx:9 |

## 수정 범위

### Phase 1: CRITICAL — 비밀번호 저장 제거 (userStore.ts + Login.tsx)
- `lastPassword` 필드 완전 제거 (인터페이스, 상태, login 함수)
- Quick Login 기능 제거 → `lastUserId`만 유지하여 ID 자동입력으로 대체
- 로그아웃 시 모든 상태 초기화 (token, user, lastUserId)
- Zustand persist: sessionStorage로 전환 (Tauri 앱 특성 고려)

### Phase 2: HIGH — 코드 위생 (6개 파일)
- `console.error` 6건 제거 또는 조건부 처리
- `catch (err: any)` 4건 → `catch (err: unknown)` + AxiosError 패턴
- API URL 환경변수 지원 (`VITE_API_URL`)
- OWMS_WEB_URL 환경변수 지원 (`VITE_OWMS_WEB_URL`)

### Phase 3: LOW — 세션 관리 강화
- 로그아웃 시 완전한 상태 초기화
- 401 응답 시 전체 스토리지 정리

## 대상 파일 (7개)

| 파일 | Phase | 변경 내용 |
|------|-------|-----------|
| `src/store/userStore.ts` | 1, 3 | lastPassword 제거, sessionStorage, 완전 logout |
| `src/components/Login.tsx` | 1, 2 | Quick Login → ID 자동입력, err:any→unknown, console 제거 |
| `src/api/client.ts` | 2 | 환경변수 API URL, 401 스토리지 정리 |
| `src/components/Dashboard.tsx` | 2 | console.error 제거, OWMS_WEB_URL 환경변수 |
| `src/components/QuickJobEntry.tsx` | 2 | console.error 제거, err:any→unknown |
| `src/components/TaskHistory.tsx` | 2 | console.error 제거, err:any→unknown |
| `src/components/WeeklyWidget.tsx` | 2 | console.error 제거 |

## 제외 사항
- CSRF 보호: Tauri 데스크톱 앱이므로 브라우저 기반 CSRF 공격 벡터 없음
- HTTP-only 쿠키: Tauri 앱 → API 통신은 localhost, 쿠키 방식 불필요
- 라우트 가드: SPA 단일 페이지 구조 (Login/Dashboard 분기만 존재)

## 성공 기준
- [ ] localStorage에 비밀번호 저장 0건
- [ ] `console.error` 0건 (또는 DEV 모드 조건부)
- [ ] `catch (err: any)` 0건
- [ ] 하드코딩 URL 0건
- [ ] 빌드 성공
- [ ] 로그인/로그아웃 정상 동작
