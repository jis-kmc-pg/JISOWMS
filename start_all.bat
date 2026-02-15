@echo off
setlocal

echo [1/3] OWMS 백엔드 시작 중... (NestJS)
start "OWMS Backend" cmd /c "cd /d %~dp0OWMS\jis_job_backend && npm run start:dev"

echo [2/3] OWMS 프론트엔드 시작 중... (Next.js)
start "OWMS Frontend" cmd /c "cd /d %~dp0OWMS\jis_job_frontend && npm run dev"

echo [3/3] OWMS_SYS 시작 중... (Vite/Tauri)
start "OWMS_SYS" cmd /c "cd /d %~dp0OWMS_SYS && npm run dev"

echo.
echo 모든 서비스의 시작 명령을 전달했습니다. 각 창에서 로그를 확인하세요.
pause
