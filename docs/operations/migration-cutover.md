# 전환과 롤백 체크리스트

## 전환 전

- [ ] 배포할 commit, Node·pnpm·패키지 버전과 환경 변수 값을 기록했다.
- [ ] `pnpm check`와 로컬 인프라를 사용하는 `pnpm test:integration`이 통과했다.
- [ ] MongoDB와 Redis backup 또는 snapshot을 확인하고 복구 절차를 시험했다.
- [ ] Nexon quota, global rate limit, global concurrency와 collector 프로세스 수가 일치한다.
- [ ] 공개 수집 POST에 API gateway 또는 reverse proxy의 주체별 요청 제한과 오용 차단 기준을 적용했다.
- [ ] 동일한 대표 캐릭터에서 레거시와 Lara의 공개 응답, 부분 실패, 최신 데이터 시각을 비교했다.
- [ ] 레거시 read 경로와 직전 배포 artifact를 즉시 되돌릴 수 있게 유지했다.
- [ ] 전환·관찰·롤백 담당자와 오류율, backlog, 429 비율의 중단 기준을 합의했다.

## 전환

- [ ] 새 정기 enqueue를 잠시 멈추고 기존 큐의 waiting·prioritized·active 수를 기록했다.
- [ ] MongoDB·Redis를 먼저 확인한 뒤 collector, API, web 순서로 호환되는 버전을 배포했다.
- [ ] 낮은 트래픽이나 일부 사용자부터 Lara read 경로로 전환했다.
- [ ] HTTP 오류율, 응답 불일치, collection partial·failed 비율, queue 지연과 429를 관찰했다.
- [ ] 기준을 만족한 뒤 트래픽과 정기 수집을 단계적으로 늘렸다.

## 롤백 조건

- [ ] 공개 응답 계약이나 인증 흐름에 중대한 회귀가 있다.
- [ ] raw fetch가 저장되지 않거나 마지막 정상 데이터가 손상된다.
- [ ] 429, 실패율 또는 queue 지연이 합의한 한도를 지속해서 넘는다.
- [ ] MongoDB·Redis 장애로 멱등성과 진행 상태를 신뢰할 수 없다.

## 롤백

- [ ] 신규 enqueue와 Lara collector를 먼저 중지하되 Redis queue와 MongoDB raw 데이터를 삭제하지 않는다.
- [ ] 사용자 read 트래픽을 레거시 경로로 되돌리고 직전 정상 artifact와 환경 설정을 복원한다.
- [ ] 전환 시각, 마지막 정상 `runId`, 영향 범위와 보존한 raw fetch를 기록한다.
- [ ] 원인을 수정하고 같은 통합·비교 검증을 통과하기 전에는 queue를 일괄 재개하지 않는다.

## 전환 완료

- [ ] 합의한 관찰 기간 동안 롤백 조건이 발생하지 않았다.
- [ ] backlog와 429가 정상 범위이며 실패 job의 처리 방침이 정리됐다.
- [ ] 레거시 제거 전 마지막 backup과 복구 가능성을 다시 확인했다.
- [ ] 레거시 제거는 별도 작업과 결정으로 수행한다.
