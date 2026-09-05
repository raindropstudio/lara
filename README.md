# Lara

Lara는 [lara.moe](https://lara.moe)를 위한 메이플스토리 데이터 수집, API, 분석, 웹 워크스페이스다.

Nx와 pnpm 기반 모노레포로 재구축한다. 기존 프론트엔드와 백엔드 저장소는 마이그레이션 참고 자료이며 Git 이력과 구조는 보존하지 않는다.

## 요구 사항

- Node.js 24 LTS. 전환 기간에는 Node.js 26까지 허용한다.
- Corepack으로 설치한 pnpm 11.19.0

화면만 작업할 때는 API 키와 로컬 DB가 필요 없는 [저장한 실제 API 응답 미리보기](docs/operations/local-development.md#nexon-호출-없는-화면-미리보기)로 시작할 수 있다. 아래는 로컬 인프라를 사용하는 개발 환경의 최초 설정이다. 기존 `.env`가 있다면 복사 단계를 생략한다.

```sh
corepack enable
pnpm install
cp .env.example .env
set -a
. ./.env
set +a
pnpm infra:up
pnpm check
pnpm dev
```

`pnpm dev`는 Node.js 기반 Elysia API를 `http://127.0.0.1:3001`에, Nuxt 웹을 `http://localhost:3000`에 함께 실행한다. 하나만 실행할 때는 `pnpm dev:api` 또는 `pnpm dev:web`을 사용한다. API 상태 확인 경로는 `GET /health`다.

MongoDB와 Redis는 `pnpm infra:up`으로 실행하고 `pnpm infra:down`으로 중지한다. 로컬 서비스까지 검증할 때는 `pnpm test:integration`을 사용한다.

collector의 Nexon 키는 `pnpm dev:collector:doppler`로 기존 Doppler 설정에서 주입할 수 있다. 직접 설정할 경우 `.env`의 `NEXON_API_KEY`에 로컬 키를 넣고 Git에 커밋하지 않는다. 실행 방법은 [로컬 개발 문서](docs/operations/local-development.md)를 따른다.

## 워크스페이스

```text
apps/
  web/         Nuxt 애플리케이션
  api/         HTTP API와 SSE 경계
  collector/   Nexon 수집 계획과 워커
packages/      재사용 계약, 도메인 코드, 어댑터
fixtures/      재현 가능한 외부 API 응답
docs/          결정과 아키텍처 맥락
.agents/       벤더 중립적인 에이전트 자료
```

`apps/analytics`는 아직 생성하지 않았다. Parquet 발행과 DuckDB 분석은 수집 스키마가 안정된 뒤 다음 작업 단위에서 추가한다.

지속적인 프로젝트 맥락은 [docs/README.md](docs/README.md), 작업 규칙은 [AGENTS.md](AGENTS.md)를 참고한다.
