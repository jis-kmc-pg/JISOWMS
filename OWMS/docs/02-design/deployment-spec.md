# JISOWMS 배포 사양서

> 작성일: 2026-02-19

---

## 1. 배포 환경

| 항목 | 값 |
|------|-----|
| 배포 방식 | On-Premise (사내 업무망) |
| 배포 서버 | 192.168.123.75 (Nginx + Frontend + Backend) |
| DB 서버 | 192.168.123.205:5432 (PostgreSQL) |
| 웹 서버 | Nginx (리버스 프록시) |
| 프로세스 관리 | PM2 |

### 네트워크 구성

```
사용자 브라우저 (업무망)
     │
     └── :80 (Nginx) ─── 192.168.123.75
              │
              ├── /api/*       → localhost:4000  (NestJS Backend)
              ├── /socket.io/  → localhost:4000  (WebSocket)
              └── /*           → localhost:3000  (Next.js Frontend)
                                       │
              Tauri Desktop (:1420) ────┘
                                       │
                              PostgreSQL (192.168.123.205:5432)
```

---

## 2. 포트 매핑

| 서비스 | 포트 | 바인딩 | 외부 노출 | 설명 |
|--------|:----:|--------|:---------:|------|
| Nginx | 80 | 0.0.0.0 | O | 리버스 프록시 (진입점) |
| Frontend (Next.js) | 3000 | 127.0.0.1 | X | Nginx 뒤에서 동작 |
| Backend (NestJS) | 4000 | 127.0.0.1 | X | Nginx 뒤에서 동작 |
| PostgreSQL | 5432 | 192.168.123.205 | X | DB 서버 |

---

## 3. Nginx 설정

설정 파일: `nginx/owms.conf`

**라우팅 규칙:**

| 경로 | 프록시 대상 | 설명 |
|------|------------|------|
| `/api/*` | `localhost:4000/` | API 요청 (/api 프리픽스 제거) |
| `/socket.io/*` | `localhost:4000/socket.io/` | WebSocket (Socket.IO) |
| `/*` | `localhost:3000` | 웹 UI (Next.js) |

**설치 및 적용:**

```bash
# Ubuntu/Debian
sudo apt install nginx

# 설정 복사
sudo cp nginx/owms.conf /etc/nginx/sites-available/owms
sudo ln -s /etc/nginx/sites-available/owms /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # 기본 설정 제거

# 검증 및 적용
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

## 4. 환경변수

### Backend (.env)

| 변수 | 값 | 설명 |
|------|-----|------|
| `DATABASE_URL` | `postgresql://...@192.168.123.205:5432/OWMS` | 업무망 DB (활성) |
| `DATABASE_URL_INTERNAL` | `postgresql://...@192.168.123.205:5432/OWMS` | 내부망 DB (Failover 1순위) |
| `DATABASE_URL_EXTERNAL` | `postgresql://...@jis4f.iptime.org:54321/OWMS` | 외부망 DB (Failover 2순위) |
| `JWT_SECRET` | (128자 해시) | JWT 액세스 토큰 서명 |
| `JWT_REFRESH_SECRET` | (128자 해시) | JWT 리프레시 토큰 서명 |
| `EXCEL_TEMPLATE_PATH` | 배포 서버 경로 | 엑셀 양식 절대 경로 |

### Frontend (.env.local)

| 변수 | 값 | 설명 |
|------|-----|------|
| `NEXT_PUBLIC_API_URL` | `/api` | Nginx 프록시 상대경로 (same-origin) |

---

## 5. DB Failover 로직

Backend는 부팅 시 자동으로 연결 가능한 DB를 탐색합니다:

```
1순위: DATABASE_URL_INTERNAL (192.168.123.205:5432) → 5초 타임아웃
2순위: DATABASE_URL_EXTERNAL (jis4f.iptime.org:54321) → 10초 타임아웃
3순위: DATABASE_URL (기본값) → 그대로 사용
```

업무망 배포 시 1순위 내부망 연결이 즉시 성공합니다.

---

## 6. CORS 허용 Origin

Nginx 리버스 프록시로 Frontend→Backend가 same-origin이지만,
Tauri 앱 및 개발 환경을 위해 CORS 설정 유지:

| Origin | 설명 |
|--------|------|
| `http://localhost:3000` | 개발 환경 |
| `http://localhost:1420` | Tauri 개발 환경 |
| `http://192.168.123.75:3000` | 배포 서버 직접 접속 |
| `http://192.168.123.46:3000` | 기존 개발 PC |
| `tauri://localhost` | Tauri 앱 |

---

## 7. PM2 프로세스 구성

| 프로세스 | 스크립트 | 메모리 제한 | 재시작 지연 |
|----------|---------|:-----------:|:-----------:|
| owms-backend | `dist/main.js` | 512MB | 3초 |
| owms-frontend | `next start -p 3000 -H 0.0.0.0` | 1GB | 3초 |

설정 파일: `ecosystem.config.cjs`

---

## 8. 배포 절차

### 8.1 사전 준비 (배포 서버 192.168.123.75)

```bash
# Node.js 20+ 설치 확인
node -v

# PM2 전역 설치
npm install -g pm2

# Nginx 설치
sudo apt install nginx

# 프로젝트 복사 (Git clone 또는 파일 전송)
```

### 8.2 의존성 설치

```bash
cd OWMS/jis_job_backend
npm install --production
npx prisma generate

cd ../jis_job_frontend
npm install
```

### 8.3 빌드

```bash
# Backend
cd OWMS/jis_job_backend
npx nest build

# Frontend
cd ../jis_job_frontend
npx next build
```

### 8.4 환경변수 확인

```bash
# Backend .env에 업무망 DB URL 설정 확인
grep DATABASE_URL jis_job_backend/.env

# Frontend .env.local에 /api 상대경로 확인
cat jis_job_frontend/.env.local
# 출력: NEXT_PUBLIC_API_URL=/api
```

### 8.5 Nginx 설정 적용

```bash
sudo cp nginx/owms.conf /etc/nginx/sites-available/owms
sudo ln -s /etc/nginx/sites-available/owms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 8.6 PM2 시작

```bash
cd OWMS
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # 시스템 재부팅 시 자동 시작
```

### 8.7 검증

```bash
# PM2 프로세스 상태 확인
pm2 status

# Nginx 경유 Frontend 접근 확인
curl -s -o /dev/null -w "%{http_code}" http://192.168.123.75/
# 기대값: 200

# Nginx 경유 API 헬스 체크
curl -s -o /dev/null -w "%{http_code}" http://192.168.123.75/api/auth/login -X POST
# 기대값: 401 (인증 필요)

# 로그 확인
pm2 logs
sudo tail -f /var/log/nginx/owms_access.log
```

---

## 9. 운영 명령어

| 명령어 | 설명 |
|--------|------|
| `pm2 status` | 프로세스 상태 확인 |
| `pm2 logs` | 실시간 로그 |
| `pm2 logs owms-backend` | Backend 로그만 |
| `pm2 restart all` | 전체 재시작 |
| `pm2 reload all` | 무중단 재시작 |
| `pm2 stop all` | 전체 중지 |
| `pm2 monit` | 모니터링 대시보드 |
| `sudo systemctl reload nginx` | Nginx 설정 재적용 |
| `sudo tail -f /var/log/nginx/owms_error.log` | Nginx 에러 로그 |

---

## 10. 접속 URL

| 대상 | URL |
|------|-----|
| 웹 브라우저 | `http://192.168.123.75/` |
| API 직접 호출 | `http://192.168.123.75/api/{endpoint}` |
| Tauri 앱 | Backend: `http://192.168.123.75:4000` (CORS 허용) |

---

## 11. 롤백 계획

문제 발생 시:

```bash
# 1. 즉시 이전 버전으로 롤백
pm2 stop all
git checkout <이전커밋>
npm install && npm run build  # 양쪽 모두
pm2 start ecosystem.config.cjs

# 2. DB 롤백 (필요 시)
npx prisma migrate reset  # 주의: 데이터 손실
```

---

## 12. EXCEL_TEMPLATE_PATH 주의사항

Backend `.env`의 `EXCEL_TEMPLATE_PATH`는 절대 경로입니다.
배포 서버에서 해당 경로에 엑셀 양식 파일이 존재해야 합니다.

```bash
# 배포 서버에서 경로 수정 필요
EXCEL_TEMPLATE_PATH="/실제/배포/서버/경로/양식.xlsx"
```
