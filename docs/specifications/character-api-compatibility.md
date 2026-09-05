# 캐릭터 조회 API 호환성

## 기준

레거시 계약은 `lara-backend`의 `master` 커밋 `53d16789359869aeb9408b2c842602471fd3456c`에 있는 `GET /character/:nickname` 응답을 기준으로 한다.

## 조회 경로

- `GET /characters/:nickname`은 section 상태, parser version, issue, freshness와 마지막 정상 데이터를 함께 반환하는 정식 조회 API다.
- `GET /character/:nickname`은 레거시 최상위 필드 형태를 반환하는 read-only 호환 경로다. 새 클라이언트는 사용하지 않는다.
- 호환 경로는 `skill5`와 `skill6`을 `skill`로, `vMatrix`와 `hexaMatrix`를 `skillCore`로 합친다. 별도 popularity section을 최상위 `popularity`로 옮기고 `union` 값이 `null`이면 필드를 생략한다.

## 부분 데이터

호환 경로도 section의 마지막 정상 데이터를 사용한다. 없는 목록은 빈 배열, 없는 propensity는 0 값 객체, 없는 stat은 빈 객체로 반환하며 기본 정보가 없으면 404를 반환한다. 응답의 `X-Lara-Incomplete-Sections`와 `X-Lara-Stale-Sections`는 레거시 응답에서 표현할 수 없는 상태를 보완한다.

## 갱신

`GET /character/:nickname?update=true`의 `update` query는 deprecated이며 값을 해석하지 않고 무시한다. 이 요청은 Nexon 호출이나 수집 job을 만들지 않으며 `Warning`과 `X-Lara-Update-Ignored: true` 응답 header로 무시 사실을 알린다.

새 갱신 흐름은 `POST /characters/:nickname/collections`로 run을 만든 뒤 `GET /collection-runs/:runId/events`를 관찰하고 terminal 상태에서 `GET /characters/:nickname`을 다시 조회한다.
