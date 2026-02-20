# OWMS 배포 가이드

## 📋 목차
- [환경 요구사항](#환경-요구사항)
- [배포 서버 설정](#배포-서버-설정)
- [환경 변수 구성](#환경-변수-구성)
- [빌드 및 실행](#빌드-및-실행)
- [nginx 설정 (선택)](#nginx-설정-선택)
- [트러블슈팅](#트러블슈팅)

---

## 환경 요구사항

### 필수 소프트웨어
- **Node.js**: v18.x 이상
- **npm**: v9.x 이상
- **PM2**: 프로세스 관리 (글로벌 설치 필요)
- **PostgreSQL**: v14.x 이상
- **nginx**: v1.18 이상 (선택사항)

### 시스템 권장 사양
- **CPU**: 2 Core 이상
- **RAM**: 4GB 이상
- **Disk**: 10GB 이상 여유 공간

---

## 배포 서버 설정

### 1. 저장소 클론

```bash
# 배포 서버에 접속 후
cd /home/deploy  # 또는 적절한 배포 디렉토리
git clone <repository-url> OWMS
cd OWMS
```

### 2. 의존성 설치

```bash
# Backend 의존성
cd jis_job_backend
npm install
cd ..

# Frontend 의존성
cd jis_job_frontend
npm install
cd ..
```

---

## 환경 변수 구성

### Backend: `jis_job_backend/.env`

**⚠️ 주의: `.env` 파일은 Git에 포함되지 않으므로 배포 서버에서 직접 생성해야 합니다.**

```bash
# 1. 예시 파일 복사
cp jis_job_backend/.env.example jis_job_backend/.env

# 2. 환경 변수 수정
nano jis_job_backend/.env
```

**필수 설정 항목:**

```bash
# DB 연결 (Failover 시스템)
DATABASE_URL_INTERNAL="postgresql://postgres:PASSWORD@192.168.123.205:5432/OWMS?schema=public&sslmode=disable"
DATABASE_URL_EXTERNAL="postgresql://postgres:PASSWORD@jis4f.iptime.org:54321/OWMS?schema=public&sslmode=disable"
DATABASE_URL="postgresql://postgres:PASSWORD@192.168.123.205:5432/OWMS?schema=public&sslmode=disable"

# JWT 시크릿 (새로 생성 권장)
JWT_SECRET="여기에_랜덤한_64자_이상의_문자열"
JWT_REFRESH_SECRET="여기에_또_다른_랜덤한_64자_이상의_문자열"

# 서버 포트
PORT=4000

# Excel 템플릿 경로 (배포 서버의 실제 경로로 수정!)
EXCEL_TEMPLATE_PATH="/home/deploy/OWMS/excel/양식.xlsx"
```

**JWT 시크릿 생성 방법:**
```bash
# 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend: `jis_job_frontend/.env.local`

```bash
# 1. 예시 파일 복사
cp jis_job_frontend/.env.example jis_job_frontend/.env.local

# 2. API URL 수정
nano jis_job_frontend/.env.local
```

**배포 서버용 설정:**

```bash
# nginx 사용 시 (권장)
NEXT_PUBLIC_API_URL=http://192.168.123.75/api

# nginx 미사용 시 (직접 접근)
# NEXT_PUBLIC_API_URL=http://192.168.123.75:4000
```

---

## 빌드 및 실행

### 1. Prisma 마이그레이션

```bash
cd jis_job_backend

# Prisma 클라이언트 생성
npx prisma generate

# DB 마이그레이션 적용
npx prisma migrate deploy

# 또는 스키마 강제 푸시 (개발 환경)
# npx prisma db push

cd ..
```

### 2. 프로덕션 빌드

```bash
# Backend 빌드 (TypeScript → JavaScript)
cd jis_job_backend
npm run build
cd ..

# Frontend 빌드 (Next.js 프로덕션 빌드)
cd jis_job_frontend
npm run build
cd ..
```

**빌드 결과 확인:**
```bash
# Backend 빌드 결과 (dist/ 폴더)
ls -la jis_job_backend/dist/

# Frontend 빌드 결과 (.next/ 폴더)
ls -la jis_job_frontend/.next/
```

### 3. PM2로 실행

```bash
# PM2가 설치되어 있지 않다면
npm install -g pm2

# PM2로 앱 시작 (ecosystem.config.cjs 사용)
pm2 start ecosystem.config.cjs

# PM2 설정 저장 (재부팅 시 자동 시작)
pm2 save
pm2 startup  # 이후 안내에 따라 명령어 실행
```

**PM2 관리 명령어:**
```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs

# Backend 로그만 보기
pm2 logs owms-backend

# Frontend 로그만 보기
pm2 logs owms-frontend

# 재시작
pm2 restart ecosystem.config.cjs

# 중지
pm2 stop ecosystem.config.cjs

# 삭제
pm2 delete ecosystem.config.cjs
```

---

## nginx 설정 (선택)

### 1. nginx 설정 복사

```bash
# nginx 설정 파일 복사
sudo cp nginx/owms.conf /etc/nginx/sites-available/owms

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/owms /etc/nginx/sites-enabled/

# 기존 default 설정 제거 (선택)
# sudo rm /etc/nginx/sites-enabled/default
```

### 2. nginx 설정 확인 및 재시작

```bash
# 설정 문법 확인
sudo nginx -t

# nginx 재시작
sudo systemctl reload nginx

# 또는
sudo systemctl restart nginx
```

### 3. nginx 로그 확인

```bash
# 접속 로그
tail -f /var/log/nginx/owms_access.log

# 에러 로그
tail -f /var/log/nginx/owms_error.log
```

---

## 트러블슈팅

### 1. 포트 충돌 오류

**증상:** `Error: listen EADDRINUSE: address already in use :::4000`

**해결:**
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :4000
# 또는
netstat -tuln | grep 4000

# 프로세스 종료
kill -9 <PID>

# PM2 재시작
pm2 restart ecosystem.config.cjs
```

### 2. DB 연결 실패

**증상:** `Error: Can't reach database server`

**해결:**
1. PostgreSQL 서버 실행 확인
   ```bash
   sudo systemctl status postgresql
   ```

2. DB 연결 정보 확인 (`.env` 파일)
   ```bash
   cat jis_job_backend/.env | grep DATABASE_URL
   ```

3. 방화벽 확인
   ```bash
   # PostgreSQL 포트 5432 열기
   sudo ufw allow 5432/tcp
   ```

### 3. 빌드 오류

**증상:** `npm run build` 실패

**해결:**
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm cache clean --force

# 다시 빌드
npm run build
```

### 4. PM2 앱이 계속 재시작됨

**증상:** `pm2 status`에서 `restart` 횟수가 계속 증가

**해결:**
```bash
# 에러 로그 확인
pm2 logs owms-backend --err
pm2 logs owms-frontend --err

# 환경 변수 확인
pm2 env 0  # owms-backend
pm2 env 1  # owms-frontend

# .env 파일 확인
cat jis_job_backend/.env
cat jis_job_frontend/.env.local
```

### 5. nginx 502 Bad Gateway

**증상:** 브라우저에서 `502 Bad Gateway` 오류

**해결:**
1. Backend/Frontend 실행 확인
   ```bash
   pm2 status
   curl http://localhost:4000  # Backend 확인
   curl http://localhost:3000  # Frontend 확인
   ```

2. nginx 설정 확인
   ```bash
   sudo nginx -t
   cat /etc/nginx/sites-enabled/owms
   ```

3. nginx 재시작
   ```bash
   sudo systemctl restart nginx
   ```

---

## 업데이트 배포

### 코드 업데이트 후 재배포

```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. 의존성 업데이트 (필요시)
cd jis_job_backend && npm install && cd ..
cd jis_job_frontend && npm install && cd ..

# 3. Prisma 마이그레이션 (DB 스키마 변경 시)
cd jis_job_backend
npx prisma generate
npx prisma migrate deploy
cd ..

# 4. 재빌드
cd jis_job_backend && npm run build && cd ..
cd jis_job_frontend && npm run build && cd ..

# 5. PM2 재시작
pm2 restart ecosystem.config.cjs

# 6. nginx 재시작 (설정 변경 시)
sudo systemctl reload nginx
```

---

## 개발 환경 vs 배포 환경 차이점

| 항목 | 개발 환경 | 배포 환경 |
|------|-----------|----------|
| **실행 방식** | `npm run start:dev` / `npm run dev` | PM2 (`ecosystem.config.cjs`) |
| **빌드** | 불필요 (실시간 컴파일) | **필수** (`npm run build`) |
| **환경 변수** | `.env` / `.env.local` (로컬용) | `.env` / `.env.local` (배포용) |
| **API URL** | `http://localhost:4000` | `http://192.168.123.75/api` (nginx) |
| **포트 접근** | 직접 접근 (:3000, :4000) | nginx를 통해 :80 |
| **Excel 경로** | Windows 경로 (`D:/...`) | Linux 경로 (`/home/...`) |
| **프로세스 관리** | 터미널에서 직접 실행 | PM2 자동 재시작 |

---

## 보안 권장사항

1. **JWT 시크릿 변경**: 배포 서버의 JWT 시크릿은 개발 환경과 다르게 설정
2. **DB 비밀번호 강화**: 복잡한 비밀번호 사용
3. **방화벽 설정**: 필요한 포트만 개방 (80, 443, 5432)
4. **HTTPS 적용**: Let's Encrypt 인증서 사용 권장
5. **정기 업데이트**: npm 패키지 보안 업데이트 정기 확인

```bash
# 보안 취약점 확인
npm audit

# 자동 수정
npm audit fix
```

---

## 지원

문제 발생 시:
1. PM2 로그 확인: `pm2 logs`
2. nginx 로그 확인: `tail -f /var/log/nginx/owms_error.log`
3. 시스템 리소스 확인: `top`, `free -h`, `df -h`

문의: [GitHub Issues](<repository-url>/issues)
