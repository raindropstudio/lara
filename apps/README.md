# 애플리케이션

애플리케이션은 독립적으로 배포할 수 있는 프로세스다. 워크스페이스 패키지에는 의존할 수 있지만 다른 애플리케이션을 직접 import하지 않는다.

- `api`: Node.js 기반 Elysia HTTP·SSE 경계
- `web`: 기존 프론트엔드에서 이전할 Nuxt 애플리케이션
- `collector`: Nexon 수집 계획과 워커
- `analytics`: Parquet 생성과 제한된 분석 작업

각 애플리케이션이 런타임 의존성과 package script를 소유한다. Nx는 script를 프로젝트 target으로 인식한다.
