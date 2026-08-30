# Nexon 응답 기록

Nexon Open API 응답 원문을 작은 fixture 모음으로 커밋한다. 기본 테스트는 fake upstream이나 parser에서 이를 재생하며 실제 API를 호출하지 않는다.

recorder는 공용 Nexon client의 endpoint registry를 만든 뒤 구현한다. 기록 도구와 운영 수집기가 endpoint 목록을 중복 관리하지 않게 하기 위함이다.

예정 구조:

```text
fixtures/nexon/
  manifest.json
  manifest.schema.json
  recordings/
    <case-id>/
      <endpoint-id>.body
```

응답 본문은 원문 그대로 보관하며 다시 포맷하지 않는다. manifest에는 안전한 요청 값, 응답 status, content type, Nexon 오류 코드, body 경로, SHA-256, 수집 시각을 기록한다. 민감한 헤더와 인증 정보는 저장하지 않는다.
