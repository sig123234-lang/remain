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

개발 중에는 `NEXT_PUBLIC_API_URL`이 없어도 프로젝트 내부 API로 동작할 수 있습니다.
`OPENAI_API_KEY`가 있으면 내부 `/api/message`가 OpenAI를 호출하고, 키가 없고 데모 모드가 허용되면 데모 응답으로 동작합니다.

## 관리자 페이지

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`이 필요합니다.
- 인메모리 관리자 API는 기본 비활성화입니다.
- 데모 관리자까지 함께 배포하려면 `ENABLE_INMEMORY_ADMIN=true`를 명시적으로 설정해야 합니다.

## Vercel 배포 전 필수

- 내부 API만 쓸 경우 `NEXT_PUBLIC_API_URL`은 비워둘 수 있음
- `OPENAI_API_KEY` 설정
- 선택: `OPENAI_MODEL` 설정 (`gpt-4o-mini` 기본)
- `ADMIN_USERNAME` 설정
- `ADMIN_PASSWORD` 설정
- `ADMIN_SESSION_SECRET` 설정
- 실제 운영이면 `ENABLE_INMEMORY_ADMIN=false` 유지
- 데모 배포만 할 거면 `NEXT_PUBLIC_ENABLE_DEMO=true` 명시

## 권장 배포 방식

- 프론트: Vercel
- 초기 버전 대화 API: 현재 프로젝트 내부 Next.js API Route
- 확장형 대화 API: AWS Lambda + API Gateway 또는 별도 서버
- DB: PostgreSQL/RDS
- 관리자 계정 관리: 실제 백엔드 또는 별도 관리자 API

## 다음 연결 포인트

- `/message`, `/session/start`, `/session/end`, `/session/history` 실백엔드 연결
- 관리자 API를 실제 DB 기반으로 교체
- 대화 기록 상세 보기와 세션 요약 고도화

## 회상 인터뷰 프롬프트

- 현재 프로젝트에는 [src/lib/reminiscence-prompt.ts](/Users/kim/Documents/Codex/remain%20v3/src/lib/reminiscence-prompt.ts:1)에 회상치료 인터뷰어 시스템 프롬프트 v2 적응본이 들어 있습니다.
- 데모 모드 응답은 [src/lib/demo-reminiscence.ts](/Users/kim/Documents/Codex/remain%20v3/src/lib/demo-reminiscence.ts:1)에서 이 프롬프트 원칙을 따라 말투와 질문 방향을 흉내 냅니다.
- 실제 운영 백엔드를 붙일 때는 `/message` 처리 서버에서 `buildReminiscenceSystemPrompt()`를 system prompt로 넘기면 됩니다.
