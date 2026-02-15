# 레거시 MSSQL → PostgreSQL 마이그레이션 매핑 문서

## 📊 데이터베이스 개요

| 항목 | 레거시 (MSSQL) | 현재 (PostgreSQL) |
|------|---------------|------------------|
| **서버** | 192.168.123.75:2133 | 192.168.123.205:5432 |
| **DB명** | JIS_JOB | OWMS |
| **총 테이블** | 20개 | 8개 (간소화) |
| **총 레코드** | ~280,000개 | 마이그레이션 필요 |

---

## 🗺️ 테이블 매핑

### 1. 조직 구조 (Organization)

#### ✅ **JIS_DEPARTMENT → Department**
```sql
-- 레거시 (7개 부서)
DEPT_CODE, DEPT_NAME, SORT_NUM

-- 현재
id (auto), name (unique), orderIndex, createdAt, updatedAt
```

**매핑 규칙**:
- `DEPT_CODE` → 무시 (auto increment ID 사용)
- `DEPT_NAME` → `name`
- `SORT_NUM` → `orderIndex` (NULL이면 0)

**샘플 데이터**:
```
dept_001 → 전문위원
dept_002 → 기술연구소
dept_006 → 시스템사업부
```

---

#### ✅ **JIS_TEAM → Team**
```sql
-- 레거시 (12개 팀)
DEPT_CODE, TEAM_CODE, TEAM_NAME, SORT_NUM

-- 현재
id, name, departmentId (FK), orderIndex, createdAt, updatedAt
UNIQUE(name, departmentId)
```

**매핑 규칙**:
- `DEPT_CODE` → `departmentId` (부서명으로 JOIN 후 ID 매핑)
- `TEAM_NAME` → `name`
- `SORT_NUM` → `orderIndex`

**샘플 데이터**:
```
dept_006 + team_001 → 시스템사업1팀
dept_006 + team_002 → 시스템사업2팀
```

---

### 2. 사용자 (User)

#### ✅ **JIS_USER → User**
```sql
-- 레거시 (95명)
USER_CODE, USER_ID, NAME, PASSWORD, DEPT_CODE, TEAM_CODE,
RANK (직위), PHONE, JOIN_DATE, QUIT_DATE, USE_YN,
ROLE_EXECUTIVE, ROLE_TEAMLEADER, ROLE_MANAGEMENT

-- 현재
id, userId, name, email, password, position, role (enum),
departmentId, teamId, joinDate, annualLeaveOverride,
carryoverLeave, refreshToken
```

**매핑 규칙**:
- `USER_ID` → `userId`
- `NAME` → `name`
- `PASSWORD` → `password` (⚠️ 암호화 방식 다름! 재설정 필요)
- `DEPT_CODE` → `departmentId` (부서명 매핑)
- `TEAM_CODE` → `teamId` (팀명 매핑)
- `RANK` → `position` (직위)
- `PHONE` → `email` (NULL, 전화번호는 미사용)
- `JOIN_DATE` → `joinDate`
- **Role 매핑**:
  ```javascript
  if (ROLE_EXECUTIVE === '1') → role = 'EXECUTIVE'
  else if (ROLE_TEAMLEADER === '1') → role = 'TEAM_LEADER'
  else if (ROLE_MANAGEMENT === '1') → role = 'DEPT_HEAD'
  else → role = 'MEMBER'
  ```
- `USE_YN === '사용'` → 활성 사용자만 마이그레이션

**⚠️ 주의사항**:
- 레거시 비밀번호는 커스텀 암호화 방식 사용
- 현재는 bcrypt 사용
- **해결책**: 초기 비밀번호 "owms1234" 등으로 일괄 설정 후 개별 변경 안내

---

### 3. 프로젝트 (Project)

#### ✅ **JIS_PROJECT + JIS_PROJECT_SUM_NAME → Project**
```sql
-- 레거시
JIS_PROJECT (2,494개): TRG_YY, PROJECT_NO, PROJECT_NAME, GET_SUPPLY
JIS_PROJECT_SUM_NAME (13,821개): TRG_YY, PROJECT_NO, PROJECT_NAME, GET_SUPPLY, PROJECT_KEY

-- 현재
id, projectName, clientName, status (ACTIVE/INACTIVE), createdAt, updatedAt
```

**매핑 규칙**:
- `PROJECT_NAME` → `projectName`
- `GET_SUPPLY` → `clientName` (거래처)
- `status` → 'ACTIVE' (기본값)
- **중복 제거**: `PROJECT_NAME + GET_SUPPLY` 기준 DISTINCT

**통합 전략**:
1. `JIS_PROJECT_SUM_NAME` 우선 (더 많은 데이터)
2. 중복 제거 후 삽입

---

### 4. 업무 (Job)

#### ✅ **JIS_WORK_LIST + JIS_PROJECT_STATS → Job**
```sql
-- 레거시
JIS_WORK_LIST (217,443개):
  DATE, USER_CODE, NAME, CONTENT, TYPE, WORK_ORDER,
  DATA_ORDER, WORK_TYPE_CODE, PROJECT_KEY

JIS_PROJECT_STATS (40,559개):
  DATE, USER_CODE, NAME, CONTENT, WORK_ORDER, DATA_ORDER

-- 현재
id, title, content, jobDate, jobType, userId, projectId,
isIssue, order, createdAt, updatedAt
```

**매핑 규칙**:
- `DATE` → `jobDate`
- `USER_CODE` → `userId` (JIS_USER 매핑)
- `CONTENT` → `content` (업무 내용)
- `TYPE`:
  - `'m'` → `title` = "금주 실시사항", `isIssue` = false
  - `'t'` → `title` = "차주 계획", `isIssue` = false
  - `'wt'` → `title` = "근무형태", `jobType` 매핑
  - `'issue'` → `isIssue` = true
- `PROJECT_KEY` → `projectId` (프로젝트 매핑)
- `DATA_ORDER` → `order`
- `WORK_TYPE_CODE` → `jobType` (내근/외근/재택)

**⚠️ 데이터 정제**:
- `CONTENT`에서 " - " 접두사 제거
- HTML 태그 제거 (일부 데이터 HTML 포함)
- 빈 내용 제외

---

### 5. 연차 관리 (Vacation)

#### ✅ **JIS_VACATION + JIS_VACATION_DATE + JIS_SIGN → Vacation**
```sql
-- 레거시
JIS_VACATION (2,749개):
  SIGN_CODE, TYPE, PERIOD, REQ_USER, REASON, PHONE,
  REG_DATE, RES_DATE, SIGN_YN, CARRIE_FLAG, CURRENT_FLAG

JIS_VACATION_DATE (3,359개):
  SIGN_CODE, VACATION_DATE, CARRIE_CNT, CURRENT_CNT, TYPE

JIS_SIGN (2,748개):
  SIGN_CODE, TYPE, REQ_USER, REG_DATE, RES_USER, RES_DATE,
  SIGN_YN, REJECTION_REASON

-- 현재
id, type (FULL/HALF_AM/HALF_PM), startDate, endDate,
reason, status (PENDING/APPROVED/REJECTED), userId
```

**매핑 규칙**:
1. `JIS_VACATION`과 `JIS_SIGN`을 `SIGN_CODE`로 JOIN
2. `TYPE` 매핑:
   ```javascript
   '연차' → 'FULL'
   '연차(오전 반차)' → 'HALF_AM'
   '연차(오후 반차)' → 'HALF_PM'
   '공가' → 'FULL' (type에 별도 플래그 필요 시 확장)
   ```
3. `PERIOD` 파싱:
   - "2024-04-23" → startDate = endDate = 2024-04-23
   - "2024-05-02,2024-05-03" → startDate = 2024-05-02, endDate = 2024-05-03
4. `SIGN_YN`:
   - `'Y'` → `status = 'APPROVED'`
   - `'N'` → `status = 'REJECTED'`
   - `NULL` → `status = 'PENDING'`
5. `REQ_USER` → `userId` (사용자 매핑)
6. `REASON` → `reason`

---

#### ✅ **JIS_VACATION_CNT → VacationAdjustment**
```sql
-- 레거시 (341개)
TRG_YY, USER_CODE, VAC_CNT (총 연차), USE_VAC_CNT (사용),
PRE_VAC_CNT (이월), JANUARY ~ DECEMBER, NEXT_JANUARY

-- 현재
id, userId, year, month, amount, reason
UNIQUE(userId, year, month)
```

**매핑 규칙**:
- `TRG_YY` → `year`
- `USER_CODE` → `userId`
- 월별 컬럼 → 각 월별로 레코드 생성:
  ```javascript
  if (JANUARY > 0) → INSERT (userId, 2023, 1, JANUARY, '레거시 마이그레이션')
  if (FEBRUARY > 0) → INSERT (userId, 2023, 2, FEBRUARY, '레거시 마이그레이션')
  ...
  ```
- `PRE_VAC_CNT` → `User.carryoverLeave` (사용자 테이블에 직접 업데이트)

---

### 6. 주간 중요 사항 (WeeklyNote)

#### ✅ **JIS_IMPORTANT → WeeklyNote**
```sql
-- 레거시 (356개)
PERIOD (주간 날짜 범위), USER_CODE, NAME, CONTENT, DATA_ORDER

-- 현재
id, weekStart (월요일 날짜), content, userId
UNIQUE(weekStart, userId)
```

**매핑 규칙**:
1. `PERIOD` 파싱:
   - "2023-11-12,2023-11-13,..." → 첫 번째 날짜의 주 월요일 계산
   - 예: `2023-11-12` → 월요일 = `2023-11-13`
2. 동일 `PERIOD` + `USER_CODE`의 여러 `CONTENT`를 줄바꿈으로 결합:
   ```javascript
   GROUP BY PERIOD, USER_CODE
   content = CONTENT들을 '\n'로 JOIN
   ```
3. `USER_CODE` → `userId`

---

### 7. 근무 형태 (DailyStatus)

#### ✅ **JIS_WORK_LIST (TYPE='wt') → DailyStatus**
```sql
-- 레거시
TYPE='wt', DATE, USER_CODE, CONTENT, WORK_TYPE_CODE

-- 현재
id, date, workType, holidayName, userId
UNIQUE(date, userId)
```

**매핑 규칙**:
- `DATE` → `date`
- `USER_CODE` → `userId`
- `WORK_TYPE_CODE` → `workType`:
  ```javascript
  '0001' → 'OFFICE' (내근)
  '0002' → 'FIELD' (외근)
  '0003' → 'REMOTE' (재택)
  '0004' → 'VACATION' (연차)
  '0005' → 'HOLIDAY' (공휴일)
  ```
- `CONTENT`에 '<공휴일명>' 포함 시 → `holidayName` 파싱

---

## 📋 마이그레이션 우선순위

### Phase 1: 기본 데이터 (필수)
1. ✅ **Department** (7개)
2. ✅ **Team** (12개)
3. ✅ **User** (95명 → 활성 사용자만)

### Phase 2: 업무 데이터
4. ✅ **Project** (~15,000개 → 중복 제거)
5. ✅ **Job** (~250,000개 → 정제 후)

### Phase 3: 연차 데이터
6. ✅ **Vacation** (2,749개)
7. ✅ **VacationAdjustment** (월별 데이터)
8. ✅ **User.carryoverLeave** 업데이트

### Phase 4: 부가 데이터
9. ✅ **WeeklyNote** (356개)
10. ✅ **DailyStatus** (근무 형태)

---

## ⚠️ 주요 이슈 및 해결 방안

### 1. 비밀번호 암호화 방식 불일치
**문제**: 레거시는 커스텀 암호화, 현재는 bcrypt
**해결**:
- 모든 사용자 초기 비밀번호 `owms1234`로 설정
- 로그인 후 비밀번호 변경 강제

### 2. 프로젝트 중복
**문제**: `PROJECT_NAME`이 동일한 경우 다수 존재
**해결**: `(PROJECT_NAME + GET_SUPPLY)` 조합으로 DISTINCT

### 3. 업무 데이터 대량 (25만 건)
**문제**: 메모리 부족 가능성
**해결**:
- 배치 처리 (1,000건씩)
- 2023년 이후 데이터만 마이그레이션 (필요 시)

### 4. 날짜 형식 차이
**문제**: 레거시 `PERIOD` = "2023-11-12,2023-11-13,..."
**해결**: 문자열 파싱 후 Date 변환

### 5. NULL 처리
**문제**: 레거시 일부 필드 NULL 허용
**해결**: 기본값 설정 (예: `orderIndex = 0`)

---

## 🚀 다음 단계

1. ✅ **마이그레이션 스크립트 작성** (`migrate_legacy_to_postgres.js`)
2. **테스트 환경에서 실행 및 검증**
3. **데이터 정합성 검사**
4. **프로덕션 마이그레이션 실행**
5. **사용자 공지 및 비밀번호 재설정 안내**

---

**생성일**: 2026-02-12
**작성자**: Claude AI
**레거시 DB**: JIS_JOB (MSSQL 192.168.123.75:2133)
**타겟 DB**: OWMS (PostgreSQL 192.168.123.205:5432)
