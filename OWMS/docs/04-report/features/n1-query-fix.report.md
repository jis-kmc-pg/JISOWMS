# Report: n1-query-fix

## 요약
백엔드 5개 서비스 파일의 N+1 쿼리, O(n*m) 인메모리 필터링, 순차 await 등 10건의 성능 이슈 수정.

## 결과
- **Match Rate**: 100% (10/10 항목 통과)
- **Iteration**: 0회 (첫 구현에서 통과)
- **빌드**: tsc --noEmit 성공

## 수정 내역

### work-status.service.ts (4건 — CRITICAL + HIGH)
| 변경 | 내용 |
|------|------|
| 불필요 쿼리 제거 (×2) | `prisma.user.findUnique` → `requestUser.departmentId` 직접 참조 |
| O(n*m) → O(1) | `.some()/.find()` 루프 → `Set/Map` 인덱싱 |
| 순차 → 병렬 | for-await → `Promise.all()` + entries 패턴 |

### metrics.service.ts (1건 — MEDIUM)
| 변경 | 내용 |
|------|------|
| 과잉 include 제거 | `include { department, team }` → `select { role, departmentId, teamId }` |

### vacation.service.ts (2건 — MEDIUM)
| 변경 | 내용 |
|------|------|
| 3회 쿼리 → 1회 | user + vacations + adjustments → 단일 include 쿼리 |
| 순차 upsert → 배치 | for-await → `Promise.all()` 배치 |

### reports.service.ts (2건 — MEDIUM)
| 변경 | 내용 |
|------|------|
| O(n) → O(1) | `.includes()` → `Set.has()` |
| 반복 변환 제거 | `.some()` 내 `toKSTString()` → 사전 변환 `Set/Map` |

### dashboard.service.ts (1건 — LOW)
| 변경 | 내용 |
|------|------|
| 코드 스타일 | `forEach + let` → `reduce` 패턴 |

## 변경 파일 목록 (5개)
1. `src/work-status/work-status.service.ts` — 핵심 성능 개선 (4건)
2. `src/metrics/metrics.service.ts` — 과잉 fetch 제거 (1건)
3. `src/vacation/vacation.service.ts` — 쿼리 통합 + 배치 (2건)
4. `src/reports/reports.service.ts` — Set/Map 인덱싱 (2건)
5. `src/dashboard/dashboard.service.ts` — reduce 패턴 (1건)
