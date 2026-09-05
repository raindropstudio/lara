# 백엔드 우선 마이그레이션

- 상태: 로컬 기반 구현 완료, 운영 전환 준비 중
- 날짜: 2026-08-31

## 목표

레거시 `lara-backend`의 공개 동작과 mapper 지식을 보존하면서 수집, 원본 저장, 파싱, 최신 projection, 조회 API를 분리한다. 각 단계는 독립적으로 검증 가능해야 하며 웹은 안정된 Elysia 계약을 Eden Treaty로 사용한다.

## 비목표

- NestJS와 Prisma 구조를 그대로 옮기지 않는다.
- 레거시 Git 이력을 합치지 않는다.
- 첫 단계에서 모든 코드를 공유 패키지로 추출하지 않는다.
- 운영 parser를 AI가 검증 없이 자동 변경하지 않는다.
- 최신 조회 API에서 분석용 장기 데이터를 직접 계산하지 않는다.

## 현재 구현 범위

- Elysia Node API와 type-only `@lara/api/eden` 경계를 만들고 Nuxt 4 웹에서 Eden Treaty로 사용한다. section 기반 정식 조회와 레거시 flat read-only 조회를 함께 제공한다.
- Nexon 공용 client, 허용 목록 recorder, manifest 검증, fixture fake upstream, 20개 캐릭터 상세 endpoint의 독립 parser를 구성했다.
- 원본 body와 status를 MongoDB에 먼저 저장하고 parser issue, version, completeness, 마지막 정상 projection을 section별로 관리한다. 한 endpoint 실패는 다른 section의 성공 데이터를 지우지 않는다.
- BullMQ 수집 작업, 기본 QoS 우선순위, 전역 rate limit과 concurrency, retry 분류, MongoDB 기반 run 상태, SSE 진행 스트림을 구현했다.
- enqueue 도중 중단된 queued run과 보관된 failed job을 재조정하고 worker 재시작과 부분 실패를 검증하는 테스트를 구성했다.
- 로컬 MongoDB와 Redis, API와 웹 동시 개발, 단위·빌드·선택적 통합 검증 명령을 구성했다.
- 운영 트래픽 전환과 분석 파이프라인은 완료 범위에 포함하지 않는다.

## 순서

### 1. Elysia 계약 경계 — 기반 구현 완료

`apps/api`는 type-only `@lara/api/eden` entrypoint와 명시적 route schema를 공개한다. Treaty의 인프로세스 성공·오류 테스트와 Node adapter smoke test를 구성했다.

캐릭터 조회의 정식 section 계약과 레거시 flat read-only 경계는 [캐릭터 조회 API 호환성](../specifications/character-api-compatibility.md)을 따른다.

### 2. Nexon 기준선과 fixture — 로컬 기준선 구현 완료

레거시 endpoint registry와 호환성 사례를 정리하고 공용 Nexon client, 허용 목록 기반 recorder, manifest 검증기, fixture fake upstream을 구현했다. 기본 테스트는 네트워크와 API key 없이 합성 정상·오류 응답과 parser 경계 사례를 재생한다. 실제 Nexon 응답 전체 corpus 기록은 운영 전환 조건으로 남긴다.

### 3. raw-first 기본 캐릭터 slice — 기반 구현 완료

OCID와 기본 정보 요청을 독립 fetch로 실행하고 exact body, status, 안전한 request metadata, hash를 원본 envelope로 저장한다. versioned parser는 issue를 값과 함께 반환하고 Mongo latest projection은 `lastKnownGood`를 보존한다. 저장소 adapter의 계약 테스트와 실제 Mongo 통합 테스트를 구성했다.

### 4. 전체 캐릭터 projection — 기반 구현 완료

레거시에서 사용하는 20개 상세 endpoint를 독립 parser로 이전했다. 수집은 endpoint 단위 결과를 합치며 일부 실패가 성공한 section을 지우지 않고 API는 section별 `complete`, `partial`, `failed`, `unavailable` 상태와 freshness를 반환한다. 실제 fixture corpus replay와 레거시 결과의 의도된 차이 검토는 운영 전환 전에 수행한다.

### 5. collector와 상태 스트림 — 기반 구현 완료

BullMQ job을 collection run과 endpoint 단위로 나눴다. 모든 upstream 요청은 하나의 rate-limit 경로를 지나며 `interactive`, `daily-top`, `repair`, `backfill` 우선순위와 retry 분류를 적용한다. 상태의 source of truth를 MongoDB에 저장하고 SSE는 집계된 progress와 재접속 cursor를 전달한다. 같은 닉네임의 active run을 원자적으로 병합하고 enqueue 복구, 429, worker 재시작, 부분 실패를 검증했다. 공개 ingress의 멱등성 정책과 주체별 요청 제한은 운영 전환 조건으로 남긴다.

### 6. 웹 이전과 Eden 연결 — 기반 구현 완료

`lara-frontend`의 `master`를 생성물과 레거시 설치 설정 없이 `apps/web`로 옮기고 Nuxt 최신 버전과 pnpm/Nx에 맞췄다. 수동 API wrapper와 중복 응답 타입을 Eden client로 교체하고 section 상태와 수집 job progress를 표시한다. 합성 Mongo fixture로 홈, 검색, 캐릭터 상세 렌더링을 브라우저에서 검증했으며 실제 Nexon 수집 연결은 운영 전환 전에 검증한다.

2026-08-31 이전 기준은 `lara-frontend`의 `master` 커밋 `dcaa09f57e4046b2ab5022f67712147c8606db81`이며 Nuxt 4.5.2로 전환한다.

### 7. 통합과 전환 — 진행 중

로컬 MongoDB와 Redis를 한 명령으로 실행하고 API, collector, web을 함께 개발할 수 있게 구성했다. 합성 fixture replay, Node HTTP와 SSE smoke, 브라우저 핵심 흐름은 완료했다. 실제 Nexon fixture replay와 레거시 read 비교를 완료하고 운영 설정, quota, 배포 순서, 관찰 기준, rollback과 제거 조건을 확인해야 전환을 시작한다.

## 공통 완료 기준

- `pnpm check`와 변경 영역 통합 테스트가 통과한다.
- 외부 응답, parser version, 수집 시각, 오류와 completeness를 추적할 수 있다.
- 한 endpoint 실패가 다른 endpoint의 성공 데이터나 마지막 정상 projection을 지우지 않는다.
- 기본 테스트는 실제 Nexon API를 호출하지 않는다.
- 문서와 주석은 간결한 한글로 쓰고 Markdown 산문은 문단 단위 한 줄을 유지한다.

## 운영 전환 전 조건

- 실제 `NEXON_API_KEY`와 허용된 대표 캐릭터로 OCID 및 20개 상세 endpoint의 원본 응답을 모두 녹화하고 비밀 정보가 없는 fixture corpus를 커밋한 뒤 전체 replay를 통과시킨다.
- 캐릭터별 active run 병합에 더해 공개 수집 POST의 `Idempotency-Key` 정책과 API gateway 또는 reverse proxy의 주체별 요청 제한을 정해 사용자 재시도와 오용이 quota를 중복 소비하지 않게 한다.
- collection job에 `schemaVersion`과 `asOfDate`를 넣고 일일 상위 캐릭터 ranking planner가 재시작 가능한 checkpoint를 저장하게 한다.
- 단순 우선순위를 넘어 QoS별 가중치와 interactive 예약 용량을 정하고 queue 지연, backlog, 429, 부분 실패를 포함한 metrics와 readiness 기준을 운영 설정에 연결한다.
- queued·failed 재조정과 별도로 오래 멈춘 running run을 감시해 worker 중단이나 Redis job 보존 기간 이후에도 상태를 종결하거나 안전하게 재개하게 한다.
- 실제 fixture replay, Node HTTP smoke, 브라우저 핵심 흐름, 레거시 read 비교를 통과시키고 quota, 배포 순서, 관찰 기준, rollback 절차를 운영 환경에서 확인한다.

## 다음 작업 단위

Parquet bronze/silver publication과 DuckDB 분석은 수집량과 schema가 안정된 뒤 별도 작업 단위로 진행한다. 장비 content-addressing은 실제 fixture corpus에서 압축 후 중복률과 조회 비용을 측정한 뒤 endpoint snapshot보다 세밀하게 나눌지 결정한다.
