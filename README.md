# Lara

Lara는 [lara.moe](https://lara.moe)를 위한 메이플스토리 데이터 수집, API, 분석, 웹 워크스페이스다.

Nx와 pnpm 기반 모노레포로 재구축한다. 기존 프론트엔드와 백엔드 저장소는 마이그레이션 참고 자료이며 Git 이력과 구조는 보존하지 않는다.

## 요구 사항

- Node.js 24 LTS. 전환 기간에는 Node.js 26까지 허용한다.
- Corepack으로 설치한 pnpm 11.19.0

```sh
corepack enable
pnpm install
pnpm check
pnpm dev
```

`pnpm dev`는 Node.js 기반 Elysia API를 `http://localhost:3000`에 실행한다. 상태 확인 경로는 `GET /health`다.

## 워크스페이스

```text
apps/
  web/         Nuxt 애플리케이션
  api/         HTTP API와 SSE 경계
  collector/   Nexon 수집 계획과 워커
  analytics/   Parquet 생성과 분석 작업
packages/      재사용 계약, 도메인 코드, 어댑터
fixtures/      재현 가능한 외부 API 응답
docs/          결정과 아키텍처 맥락
.agents/       벤더 중립적인 에이전트 자료
```

지속적인 프로젝트 맥락은 [docs/README.md](docs/README.md), 작업 규칙은 [AGENTS.md](AGENTS.md)를 참고한다.
