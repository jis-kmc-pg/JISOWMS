# WebSocket 실시간 알림 시스템 가이드

> 작성일: 2026-02-21
> 작성자: Claude AI (Sonnet 4.5)

## 개요

OWMS_SYS(Tauri 데스크톱 앱)에서 연차 신청/승인 시 실시간 푸시 알림을 받을 수 있는 시스템입니다.

### 주요 기능

- ✅ 팀장/부서장: 팀원/부서원 연차 신청 시 실시간 알림
- ✅ 팀원/팀장: 연차 승인 시 실시간 알림
- ✅ Windows 시스템 알림 (Tauri notification)
- ✅ 멀티 디바이스 지원 (한 사용자가 여러 OWMS_SYS 실행 가능)

---

## 아키텍처

```
[OWMS_SYS - Tauri Desktop]
         |
    socket.io-client
         |
         v
[Backend - NotificationGateway]  ← [VacationService]
    (/notifications namespace)
         |
    Socket.IO
         |
         v
    User Connection Map
    (userId → socketId[])
```

---

## 백엔드 구현

### 1. NotificationGateway

**위치**: `jis_job_backend/src/gateway/notification.gateway.ts`

**주요 기능**:
- Socket.IO `/notifications` 네임스페이스
- 사용자 연결 관리 (Map<userId, socketId[]>)
- 연차 신청/승인 알림 전송

**주요 메서드**:

```typescript
// 사용자 등록
@SubscribeMessage('register')
handleRegister(client: Socket, payload: { userId: number })

// 연차 신청 알림 전송
sendVacationRequest(targetUserIds: number[], notification: VacationNotification)

// 연차 승인 알림 전송
sendVacationApproved(targetUserId: number, notification: VacationNotification)
```

**이벤트**:
- `vacation:request`: 연차 신청 알림
- `vacation:approved`: 연차 승인 알림

### 2. VacationService 통합

**위치**: `jis_job_backend/src/vacation/vacation.service.ts`

**변경 사항**:

1. **NotificationGateway 주입**:
```typescript
constructor(
  private prisma: PrismaService,
  private notificationGateway: NotificationGateway,
) {}
```

2. **연차 신청 시 알림 전송** (requestVacation):
```typescript
// 팀장 ID 추출
const teamLeaderIds = vacation.user.team?.users
  .filter(u => u.role === 'TEAM_LEADER')
  .map(u => u.id) || [];

// 부서장 ID 추출
const deptHeadIds = vacation.user.department?.users
  .filter(u => u.role === 'DEPT_HEAD')
  .map(u => u.id) || [];

// 알림 전송
this.notificationGateway.sendVacationRequest([...teamLeaderIds, ...deptHeadIds], {
  type: 'vacation_request',
  userId: vacation.user.id,
  userName: vacation.user.name,
  startDate: vacation.startDate.toISOString(),
  endDate: vacation.endDate.toISOString(),
  vacationType: vacation.type,
  timestamp: Date.now(),
});
```

3. **연차 승인 시 알림 전송** (updateVacation):
```typescript
const wasApproved = vacation.status === 'APPROVED' && ...;

if (wasApproved) {
  this.notificationGateway.sendVacationApproved(vacation.user.id, {
    type: 'vacation_approved',
    userId: vacation.user.id,
    userName: vacation.user.name,
    startDate: vacation.startDate.toISOString(),
    endDate: vacation.endDate.toISOString(),
    vacationType: vacation.type,
    timestamp: Date.now(),
  });
}
```

---

## OWMS_SYS 구현

### 1. notificationService.ts

**위치**: `OWMS_SYS/src/services/notificationService.ts`

**주요 기능**:
- Socket.IO Client 연결 관리
- WebSocket 이벤트 수신
- Tauri 시스템 알림 표시

**주요 메서드**:

```typescript
class NotificationService {
  // WebSocket 연결
  connect(userId: number, apiUrl: string)

  // WebSocket 연결 해제
  disconnect()

  // 연결 상태 확인
  isConnected(): boolean

  // 연차 신청 알림 표시
  private async showVacationRequestNotification(notification: VacationNotification)

  // 연차 승인 알림 표시
  private async showVacationApprovedNotification(notification: VacationNotification)
}

export const notificationService = new NotificationService();
```

**이벤트 핸들러**:

```typescript
// 연차 신청 알림 수신
this.socket.on('vacation:request', (notification) => {
  this.showVacationRequestNotification(notification);
});

// 연차 승인 알림 수신
this.socket.on('vacation:approved', (notification) => {
  this.showVacationApprovedNotification(notification);
});
```

### 2. Dashboard.tsx 통합

**위치**: `OWMS_SYS/src/components/Dashboard.tsx`

**자동 연결/해제**:

```typescript
useEffect(() => {
  if (user?.id) {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    notificationService.connect(user.id, apiUrl);
    console.log('[Dashboard] Notification service connected for user:', user.id);
  }

  return () => {
    notificationService.disconnect();
    console.log('[Dashboard] Notification service disconnected');
  };
}, [user?.id]);
```

---

## 알림 플로우

### 1. 연차 신청 알림

```
[김상민(팀원)] → 연차 신청 (Web/OWMS_SYS)
         ↓
[Backend] VacationService.requestVacation()
         ↓
팀장/부서장 ID 추출 (Prisma include)
         ↓
NotificationGateway.sendVacationRequest([teamLeaderId, deptHeadId], notification)
         ↓
소켓 연결된 팀장/부서장에게 'vacation:request' 이벤트 전송
         ↓
[OWMS_SYS] notificationService.on('vacation:request')
         ↓
Tauri sendNotification({ title: '📅 연차 신청 알림', body: '...' })
         ↓
[Windows] 시스템 알림 표시
```

### 2. 연차 승인 알림

```
[이상진(부서장)] → 연차 승인 (Web)
         ↓
[Backend] VacationService.updateVacation()
         ↓
status: PENDING → APPROVED 감지
         ↓
NotificationGateway.sendVacationApproved(userId, notification)
         ↓
소켓 연결된 신청자에게 'vacation:approved' 이벤트 전송
         ↓
[OWMS_SYS] notificationService.on('vacation:approved')
         ↓
Tauri sendNotification({ title: '✅ 연차 승인 알림', body: '...' })
         ↓
[Windows] 시스템 알림 표시
```

---

## 설정 및 환경변수

### Backend (.env)

```env
# 기본 설정으로 충분 (별도 WebSocket 설정 불필요)
```

### OWMS_SYS (.env)

```env
VITE_API_URL=http://localhost:4000
```

**배포 서버 사용 시**:
```env
VITE_API_URL=http://192.168.123.75:4000
```

### CORS 설정

**위치**: `jis_job_backend/src/gateway/notification.gateway.ts`

```typescript
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',      // Web (로컬)
      'http://localhost:1420',      // OWMS_SYS (Tauri)
      'http://192.168.123.75:3000', // Web (배포)
      'http://192.168.123.46:3000', // Web (추가 배포)
      'tauri://localhost',          // Tauri 프로토콜
    ],
    credentials: true,
  },
  namespace: '/notifications',
})
```

---

## 테스트 방법

### 1. 로컬 환경 테스트

**사전 준비**:
1. Backend 실행: `cd jis_job_backend && pnpm run start:dev`
2. OWMS_SYS 실행: `cd OWMS_SYS && pnpm tauri dev`

**테스트 시나리오 1: 연차 신청 알림**
1. OWMS_SYS를 **부서장(sjlee)** 계정으로 로그인
2. Web 브라우저에서 **팀원(ksm)** 계정으로 로그인
3. Web에서 연차 신청
4. OWMS_SYS에서 "📅 연차 신청 알림" 확인

**테스트 시나리오 2: 연차 승인 알림**
1. OWMS_SYS를 **팀원(ksm)** 계정으로 로그인
2. Web 브라우저에서 **부서장(sjlee)** 계정으로 로그인
3. Web에서 연차 승인
4. OWMS_SYS에서 "✅ 연차 승인 알림" 확인

### 2. 배포 서버 테스트

**API 호출 예시** (curl):

```bash
# 1. ksm 로그인
curl -X POST http://192.168.123.75:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"ksm","password":"owms1234"}'

# 2. 연차 신청 (토큰 필요)
curl -X POST http://192.168.123.75:4000/vacations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "type": "ANNUAL",
    "startDate": "2026-03-01",
    "endDate": "2026-03-02",
    "reason": "개인 사유"
  }'

# 3. sjlee 로그인 후 승인
curl -X POST http://192.168.123.75:4000/vacations/admin/<ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SJLEE_TOKEN>" \
  -d '{"status":"APPROVED"}'
```

---

## 트러블슈팅

### 1. 알림이 오지 않을 때

**확인 사항**:
1. OWMS_SYS가 로그인되어 있는가?
2. Backend 로그에서 WebSocket 연결 확인:
   ```
   [NotificationGateway] Client connected: <socketId>
   [NotificationGateway] User <userId> registered with socket <socketId>
   ```
3. 알림 대상이 올바른가?
   - 연차 신청: 팀장/부서장만 알림
   - 연차 승인: 신청자만 알림

### 2. WebSocket 연결 실패

**원인**:
- Backend가 실행되지 않음
- CORS 설정 오류
- 네트워크 방화벽

**해결**:
1. Backend 로그 확인
2. CORS origin에 OWMS_SYS URL 포함 확인
3. 방화벽 4000 포트 허용

### 3. 중복 알림

**원인**: 같은 사용자가 여러 OWMS_SYS를 실행

**정상 동작**: 멀티 디바이스 지원으로 모든 인스턴스에서 알림 수신

---

## 향후 개선 사항

### P3 우선순위
- [ ] JWT 기반 WebSocket 인증 (현재는 userId만으로 등록)
- [ ] 알림 히스토리 저장 (DB 테이블)
- [ ] 알림 읽음/미읽음 상태 관리

### P4 우선순위
- [ ] 알림 설정 (사용자별 알림 ON/OFF)
- [ ] 알림 타입 확장 (메모, 게시판, 배차, 회의실)
- [ ] 모바일 푸시 알림 (FCM/APNs)

### P5 우선순위
- [ ] 알림 그룹화 (여러 연차 신청을 하나로 묶음)
- [ ] 알림 소리 커스터마이징
- [ ] Web 알림 지원 (Browser Notification API)

---

## 관련 파일

### Backend
- `src/gateway/notification.gateway.ts`
- `src/gateway/gateway.module.ts`
- `src/vacation/vacation.service.ts`

### OWMS_SYS
- `src/services/notificationService.ts`
- `src/components/Dashboard.tsx`

### 문서
- `docs/CHANGELOG.md` (2026-02-21)
- `docs/PROJECT-STATUS.md` (Section 8)

---

*이 문서는 WebSocket 실시간 알림 시스템의 구현 및 사용 가이드입니다.*
*최종 작성: 2026-02-21*
