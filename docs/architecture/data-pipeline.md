# 데이터 파이프라인

```text
planner/API → collection run → BullMQ fetch → Nexon client → immutable raw envelope → versioned parser → section projection → character current → Elysia/Eden → web
                                                                                                      └→ Parquet publisher → DuckDB analytics
```

수집 성공과 파싱 성공은 별도 상태다. raw body는 content hash로 중복 제거하고 raw 저장이 끝난 요청만 parse 대상으로 삼으며 `(fetch observation, parser version)`을 parse run 멱등성 기준으로 사용한다.

최신 조회는 MongoDB의 캐릭터 projection을 사용한다. projection은 endpoint별 시도와 마지막 정상 값을 함께 보존하며 현재 실패를 `null`로 덮지 않는다.

identity와 section projection은 각각의 `observedAt`보다 오래된 결과를 적용하지 않고 캐릭터 `updatedAt`은 단조 증가시킨다. 동시에 도착한 같은 닉네임의 active collection run은 MongoDB unique index와 결정적 BullMQ job ID로 하나로 합친다.

Redis와 BullMQ는 실행 제어 수단이고 작업 상태의 장기 source of truth가 아니다. SSE 연결은 저장된 run 상태를 먼저 읽고 이후 집계 이벤트를 전달한다.

Parquet은 원본 보존 형식이 아니라 분석 형식이다. exact raw bytes와 provenance를 유지한 뒤 안정된 필드만 날짜 중심 bronze/silver dataset으로 발행한다.
