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

## 군장검사 실제 응답

`party-inspection.plan.json`은 [Figma 군장검사](https://www.figma.com/design/EnWT6VTeCpaKG5ZKgKK6rS/lara.moe?node-id=1509-84)의 텍스트 레이어로 확인한 빙캔·소주에보드카·섭주·무들·믹끼유·버블볍을 허용한다. `recorded/party-inspection/`에는 2026-09-05 수집한 106개 응답을 보관한다. 5명의 ID와 full collection 20개 요청이 성공했고, 믹끼유는 ID 조회의 HTTP 400 `OPENAPI00004` 응답만 있다. 실패 원인이나 변경된 이름은 추측하지 않는다. 디자인에 표시된 과거 레벨·장비와 현재 API 응답은 다를 수 있다.

키를 파일에 복사하지 않고 다시 기록하려면 Doppler CLI 로그인 후 저장소 루트에서 다음 명령을 실행한다. 출력 경로는 기존 기록을 덮어쓰지 않도록 새로 지정한다. 이는 실제 API 호출이며 기본 테스트 명령에는 포함하지 않는다.

```sh
doppler run --project lara-backend --config dev_personal --only-secrets NXAPI_KEY --no-fallback -- pnpm --filter @lara/nexon-fixtures record -- --plan fixtures/nexon/party-inspection.plan.json --out fixtures/nexon/recorded/party-inspection-new --concurrency 2
```
