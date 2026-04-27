# remAIn Web App

문서의 `v2` 사양을 기준으로 만든 `Next.js` 웹앱 스타터입니다.

## 포함된 화면

- `/login`: 사용자 로그인
- `/home`: 홈 대시보드
- `/conversation`: 텍스트 + Web Speech API 기반 대화 화면
- `/history`: 이전 대화 기록
- `/admin`: 관리자 로그인 및 사용자 관리

## 실행

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

개발 중에는 `NEXT_PUBLIC_API_URL`이 없어도 데모 모드로 동작할 수 있습니다.
운영 배포에서는 기본적으로 데모 모드가 꺼지며, 실제 API 또는 명시적 데모 설정이 필요합니다.

## 관리자 페이지

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`이 필요합니다.
- 인메모리 관리자 API는 기본 비활성화입니다.
- 데모 관리자까지 함께 배포하려면 `ENABLE_INMEMORY_ADMIN=true`를 명시적으로 설정해야 합니다.

## Vercel 배포 전 필수

- `NEXT_PUBLIC_API_URL` 설정
- `ADMIN_USERNAME` 설정
- `ADMIN_PASSWORD` 설정
- `ADMIN_SESSION_SECRET` 설정
- 실제 운영이면 `ENABLE_INMEMORY_ADMIN=false` 유지
- 데모 배포만 할 거면 `NEXT_PUBLIC_ENABLE_DEMO=true` 명시

## 권장 배포 방식

- 프론트: Vercel
- 대화 API: AWS Lambda + API Gateway
- DB: PostgreSQL/RDS
- 관리자 계정 관리: 실제 백엔드 또는 별도 관리자 API

## 다음 연결 포인트

- `/message`, `/session/start`, `/session/end`, `/session/history` 실백엔드 연결
- 관리자 API를 실제 DB 기반으로 교체
- 대화 기록 상세 보기와 세션 요약 고도화
