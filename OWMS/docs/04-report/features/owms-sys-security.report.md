# Report: owms-sys-security

## 요약
OWMS_SYS (Tauri 데스크톱 앱) 프론트엔드의 보안 취약점 9건을 수정 완료.

## 결과
- **Match Rate**: 100% (19/19 항목 통과)
- **Iteration**: 0회 (첫 구현에서 통과)
- **빌드**: TypeScript 타입 체크 성공 (tsc --noEmit)

## 수정 내역

### Phase 1: CRITICAL — 비밀번호 저장 제거 (4건 해결)
| 파일 | 변경 내용 |
|------|-----------|
| userStore.ts | `lastPassword` 필드 완전 제거, `login()` password 파라미터 제거 |
| userStore.ts | persist storage: localStorage → sessionStorage 전환 |
| userStore.ts | `logout()`: 모든 상태 초기화 (token, user, lastUserId) |
| Login.tsx | Quick Login 기능 완전 제거 → lastUserId로 ID 자동입력만 유지 |

### Phase 2: HIGH — 코드 위생 (5건 해결)
| 파일 | 변경 내용 |
|------|-----------|
| Login.tsx | console.error 2건 제거, `catch (err: any)` → `catch (err: unknown)` + AxiosError |
| Dashboard.tsx | console.error 1건 제거, OWMS_WEB_URL 환경변수 지원 |
| QuickJobEntry.tsx | console.error 1건 제거, `catch (err: any)` → `catch (err: unknown)` + AxiosError |
| TaskHistory.tsx | console.error 1건 제거, `catch (err: any)` → `catch (err: unknown)` + AxiosError |
| WeeklyWidget.tsx | console.error 1건 제거 |
| client.ts | API URL 환경변수 지원 (`VITE_API_URL`) |

## 검증 결과 (grep 확인)
- `lastPassword` 참조: **0건**
- `console.error` / `console.log`: **0건**
- `catch (err: any)`: **0건**
- `localStorage` 직접 참조: **0건**

## 변경 파일 목록 (7개)
1. `OWMS_SYS/src/store/userStore.ts` — 핵심 보안 수정
2. `OWMS_SYS/src/components/Login.tsx` — Quick Login 제거 + 전체 재작성
3. `OWMS_SYS/src/api/client.ts` — 환경변수 API URL
4. `OWMS_SYS/src/components/Dashboard.tsx` — console 제거 + 환경변수 URL
5. `OWMS_SYS/src/components/QuickJobEntry.tsx` — console 제거 + err:unknown
6. `OWMS_SYS/src/components/TaskHistory.tsx` — console 제거 + err:unknown
7. `OWMS_SYS/src/components/WeeklyWidget.tsx` — console 제거
