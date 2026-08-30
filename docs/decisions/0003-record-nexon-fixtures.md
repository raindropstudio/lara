# Nexon 응답을 fixture로 기록

- 상태: 승인됨
- 날짜: 2026-08-30

## 맥락

기본 테스트는 빠르고 재현 가능해야 하며 실제 Nexon API 형식, 부분 응답, 알려진 호환성
문제를 검증해야 한다. 실제 API를 호출하면 공용 quota를 사용하고 시간과 점검 상태에
따라 결과가 달라진다.

## 선택지

- 기본 테스트에서 실제 API 호출
- 직접 작성한 mock만 사용
- 저장소 도구로 응답을 기록하고 커밋
- agent skill이 직접 네트워크 기록 수행

## 결정

공용 Nexon client를 사용하는 재현 가능한 recorder를 만든다. 허용된 캐릭터 계획을
입력받아 등록된 endpoint를 호출하고 인증 정보를 제거한다. 응답 원문과 SHA-256,
`fixtures/nexon/manifest.schema.json` 형식의 manifest를 저장한다.

대표 사례만 작게 커밋한다. 기록을 변형해 누락, null, 필드명 변경, 잘못된 형식,
Nexon 오류를 검증할 수 있다. 벤더 중립 skill은 recorder 실행과 diff 검토를 돕지만
실행 가능한 도구를 기준으로 삼는다.

## 결과

- quota 없이 실제와 가까운 payload를 재생할 수 있다.
- 저장소 크기를 관리하기 위해 사례 추가와 큰 응답을 검토한다.
- API 키, 인증 헤더, 쿠키, 인증 정보가 포함된 URL을 저장하지 않는다.
- 수집 시각, 요청 값, HTTP status, Nexon 오류 코드, 캐릭터를 출처로 기록한다.

## 검증

recorder는 manifest schema 검증, secret 탐지, SHA-256 재계산을 통과해야 한다.
