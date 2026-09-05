# Collector 장애 대응

## 확인 순서

1. collector 로그에서 `runId`, job 종류, HTTP status와 Nexon 오류 코드를 확인하고 API 키나 원본 응답 본문을 로그에 복사하지 않는다.
2. MongoDB와 Redis health, collector 프로세스, 큐의 waiting·prioritized·active·failed 수를 순서대로 확인한다.
3. 최근 배포, quota 설정 변경, Nexon 응답 형식 변경 여부를 확인하고 raw fetch와 parse run을 보존한다.

## 429와 quota

429 응답은 `Retry-After`를 우선 사용하고 값이 없으면 1초 동안 큐를 rate limit한 뒤 같은 job을 waiting 상태로 되돌린다. rate limit은 실패 attempt로 세지 않는다.

429가 계속되면 collector를 추가 확장하지 말고 `NEXON_RATE_LIMIT_REQUESTS`, `NEXON_RATE_LIMIT_DURATION_MS`, `NEXON_GLOBAL_CONCURRENCY`를 낮춘 뒤 현재 rate-limit TTL과 backlog 증가율을 확인한다.

BullMQ limiter는 HTTP 요청이 아니라 job 시작 수를 제한한다. Nexon 요청 한 번을 fetch job 한 개로 유지해야 quota가 정확하며 한 job 안에서 여러 Nexon 요청을 추가할 때는 공유 token bucket이 별도로 필요하다.

## 재시도와 실패

Nexon fetch job은 최대 5번 실행하며 1초를 시작값으로 한 exponential backoff와 `0.5` jitter를 적용한다. transport 오류, 5xx, 재시도 가능한 Nexon 오류 코드는 재시도하고 영구적인 4xx와 parser 실패는 무한 재시도하지 않는다.

마지막 attempt까지 실패하면 collection run의 해당 step을 실패로 기록한다. 최종 여부는 attempt 수가 아니라 Redis의 실제 `failed` 상태로 판정하며 collector는 놓친 실패를 주기적으로 다시 반영한다. 재처리 전 raw fetch, 마지막 정상 section, 실패 원인을 확인하고 동일한 `runId`와 section identity로 중복 enqueue하지 않는다.

API가 run을 저장한 직후 종료되어 Redis enqueue가 누락된 경우 collector는 오래된 `queued` run을 같은 `runId`의 결정적 job ID로 다시 등록한다. 완료한 section은 MongoDB의 `completedSteps`를 먼저 확인하므로 재등록돼도 Nexon quota를 다시 소비하지 않는다.

## Redis 장애

producer 요청은 빠르게 실패할 수 있고 worker는 연결 복구를 기다릴 수 있다. Redis 복구 전에는 신규 스케줄을 중지하고 `maxmemory-policy=noeviction`, 디스크 여유, 연결 수와 AOF 상태를 확인한다.

복구 후 waiting·prioritized·active 수와 global rate limit·concurrency 값을 확인한 뒤 collector를 점진적으로 재개한다. 큐를 `obliterate`하거나 Redis volume을 삭제해 복구하지 않는다.

## MongoDB 또는 parser 장애

MongoDB 장애 중에는 collector를 멈춰 raw 저장 누락을 방지하고 연결 복구와 index 상태를 확인한 뒤 재개한다.

parser 오류는 raw payload를 삭제하거나 덮어쓰지 않는다. 영향받지 않은 section은 계속 처리하고 parser version 수정 후 저장된 raw를 대상으로 재파싱한다.
