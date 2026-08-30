# Node.js에서 Elysia 사용

- 상태: 승인됨
- 날짜: 2026-08-30

## 맥락

새 API는 기존 NestJS 구조를 유지하지 않는다. HTTP·SSE 경계는 작게 유지하고 수집과 분석은 별도 앱으로 실행한다. Bun 런타임에 종속되지 않아야 한다.

## 선택지

- Node.js와 Express
- Node.js와 Fastify
- Bun과 Elysia
- 공식 Node adapter와 Elysia

## 결정

`@elysiajs/node`와 Elysia를 사용한다. 불필요한 framework 추상화를 만들지 않고 실제 상태 확인 경로, build, test로 호환성을 검증한다.

공개 계약은 framework에 종속시키지 않는다. 첫 API 기능을 구현할 때 공유 응답과 event schema를 `packages/contracts`로 옮긴다.

## 결과

- Node.js에서 Elysia의 schema와 SSE 기능을 사용할 수 있다.
- Node adapter, streaming, 정상 종료, worker library 호환성을 통합 테스트한다.
- Node adapter가 listener를 비동기로 시작하므로 readiness 이후 시작 성공을 알린다.
- 수집기 구현에서 구체적인 문제가 확인되면 런타임 결정을 대체한다.

## 검증

Node.js 24에서 API typecheck와 build가 성공해야 한다. 테스트에서는 포트를 열지 않고 상태 확인 경로를 검증해야 한다.
