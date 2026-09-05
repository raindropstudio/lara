# Nexon fixture 도구

허용 목록 plan만 읽어 Nexon 응답 byte를 기록하고 manifest를 검증한다. 기본 테스트에서는 네트워크를 사용하지 않는다.

```bash
NEXON_API_KEY=... pnpm --filter @lara/nexon-fixtures record -- --plan fixtures/nexon/allowlist.example.json --out fixtures/nexon/recorded/example --concurrency 2
pnpm --filter @lara/nexon-fixtures verify
```

plan의 각 캐릭터는 nickname과 허용 endpoint 목록만 가진다. `ocid`는 `/id` 응답에서 얻으며 임의 URL, API key query, 인증 header는 plan에 넣을 수 없다.

HTTP 오류도 원문 응답으로 기록한다. ID 조회가 실패한 캐릭터는 `/id` 응답만 남기고 나머지 캐릭터 기록을 계속한다. 네트워크 실패·timeout·정상 status의 잘못된 ID JSON은 기록을 중단하며 불완전한 출력 디렉터리를 남기지 않는다.
