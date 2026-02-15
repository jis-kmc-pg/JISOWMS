# Auth Module 기술 명세서

## 1. 개요 (Overview)
사용자 인증(Authentication) 및 인가(Authorization)를 처리하며, JWT 기반의 Stateless 인증 전략을 채택하고 있습니다.

## 2. 기술적 관심사 (Technical Concerns)
- **보안 전략**: 패스워드 저장 시 `bcrypt`를 사용한 단방향 해싱 적용.
- **토큰 관리 (Dual Token)**:
  - **Access Token**: 짧은 만료 시간(15분), API 요청 인가 시 사용.
  - **Refresh Token**: 긴 만료 시간(7일), Access Token 갱신용으로 사용되며 DB에 해싱하여 저장.
- **5단계 권한 체계 (RBAC)**: `CEO` > `EXECUTIVE` > `DEPT_HEAD` > `TEAM_LEADER` > `MEMBER` 순의 계층적 권한 관리.

## 3. 데이터 모델 연동 (Data Integration)
- **Model**: `User`
- **Fields**: `userId`, `password`, `role`, `refreshToken`.

## 4. 리팩토링 및 개선 가이드
- **현재 상태**: `AuthService`에서 JWT 비밀키가 하드코딩되어 있음 (`OWMS_SECRET_KEY`).
- **개선안**: 
  - 하드코딩된 비밀키를 `.env` 기반으로 완전히 이전.
  - 권한별 접근 제어를 위한 커스텀 데코레이터(`@Roles`)와 가드(`RolesGuard`)를 전역적으로 강화하여 코드 일관성 확보.
