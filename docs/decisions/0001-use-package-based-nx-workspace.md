# package-based Nx 워크스페이스 사용

- 상태: 승인됨
- 날짜: 2026-08-30

## 맥락

Lara에는 독립적으로 배포하는 웹, API, 수집, 분석 프로세스와 재사용 TypeScript
패키지가 필요하다. 코드를 Nx generator에 종속시키지 않으면서 공통 task graph와
검증 환경을 제공해야 한다.

## 선택지

- 독립 저장소
- pnpm workspace만 사용
- pnpm package-based workspace와 Nx 사용
- Nx integrated workspace

## 결정

pnpm workspace를 패키지 경계로 사용한다. Nx는 프로젝트 탐색, task 실행, 캐시,
affected 실행, 의존성 확인을 담당한다. 각 앱과 패키지는 일반적인 package script를
소유한다.

Node.js 24 LTS를 기준으로 하고 pnpm 버전을 고정한다. 전환 기간에는 Node.js 25와
26도 허용한다.

레거시 저장소의 Git 이력은 가져오지 않는다. 필요한 동작을 이전할 때까지 각
`master` 브랜치를 참고한다.

## 결과

- Nx 없이도 프로젝트 script를 이해할 수 있다.
- 공유 패키지를 만들 때 tag와 lint 경계를 추가해야 한다.
- remote cache는 CI 시간이 필요성을 보여줄 때 도입한다.

## 검증

`pnpm check`가 Nx graph를 통해 format, lint, typecheck, test, build를 실행해야 한다.
`pnpm nx show projects`가 workspace package를 찾아야 한다.
