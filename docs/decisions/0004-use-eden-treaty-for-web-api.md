# 내부 웹 API에 Eden Treaty 사용

- 상태: 승인됨
- 날짜: 2026-08-31
- 대체 범위: 0002의 첫 HTTP 계약을 `packages/contracts`로 옮긴다는 결정

## 맥락

API와 웹은 같은 TypeScript 워크스페이스에서 함께 변경한다. HTTP 요청과 응답 타입을 별도 패키지에 다시 선언하면 Elysia route schema와 계약이 중복되고 변경 때 동기화 비용이 생긴다. 웹 이전보다 API 경계와 실패 모델을 먼저 안정화해야 한다.

## 선택지

- Elysia schema와 별도 `packages/contracts`를 함께 관리
- OpenAPI에서 웹 client를 생성
- `@elysia/eden`의 Treaty가 Elysia `App` 타입에서 client를 추론
- Nuxt 안에 Elysia 서버를 함께 실행

## 결정

API 앱을 `@lara/api` 패키지로 유지하고 `@lara/api/eden`에서 `App` 타입만 공개한다. 웹은 `@elysia/eden`의 `treaty<App>(baseURL, { parseDate: false })`를 사용한다. API 앱의 런타임 코드와 서비스는 웹에서 import하지 않는다.

Elysia route에는 입력, 성공 응답, 상태별 오류 응답 schema를 명시한다. Treaty의 `{ data, error }`와 status narrowing을 웹 오류 처리의 기준으로 삼는다. 날짜는 경계에서 문자열로 유지한다.

포트를 열지 않는 API 계약 테스트는 `treaty(createApp())`를 사용한다. 실제 Node adapter와 HTTP streaming은 별도 통합 테스트로 검증한다.

공개 소비자나 다른 언어 client가 생기면 같은 schema에서 OpenAPI를 제공한다. 큐 작업, 저장 envelope, parser 결과처럼 HTTP 밖에서도 공유하는 계약은 목적별 패키지에 둔다.

## 결과

- API schema 한 곳에서 웹 client 타입이 갱신된다.
- API와 웹은 타입 수준에서 함께 배포 가능한 상태를 유지해야 한다.
- `@lara/api/eden`의 export surface와 타입 검사 자체가 호환성 gate가 된다.
- Elysia 내부 type이 지나치게 커지면 feature 단위 sub-app을 합성하고 공개 route schema를 명시적으로 유지한다.

## 검증

API 테스트에서 Treaty로 성공과 상태별 오류를 검증한다. 웹 typecheck가 수동 응답 타입 없이 `@lara/api/eden`만으로 통과해야 한다. dependency graph에서 웹이 API 런타임 산출물에 의존하지 않아야 한다.
