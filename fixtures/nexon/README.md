# Nexon 응답 기록

Nexon Open API 응답 원문을 작은 fixture 모음으로 커밋한다. 기본 테스트는 fake upstream이나 parser에서 이를 재생하며 실제 API를 호출하지 않는다.

recorder와 fake transport는 `@lara/nexon-client`의 endpoint registry를 함께 사용한다. 임의 URL과 인증 query는 기록할 수 없다.

구조:

```text
fixtures/nexon/
  manifest.schema.json
  synthetic/
    manifest.json
    recordings/
      <case-id>/<sha256>.body
```

응답 본문은 원문 byte 그대로 보관하며 다시 포맷하지 않는다. manifest에는 안전한 요청 값, 응답 status, content type, Nexon 오류 코드, body 경로, SHA-256, latency와 수집 시각을 기록한다. 민감한 헤더와 인증 정보는 저장하지 않는다.

```bash
pnpm --filter @lara/nexon-fixtures verify
```
