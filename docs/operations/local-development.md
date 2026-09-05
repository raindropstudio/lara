# 로컬 개발

`package.json`의 Node.js 범위와 pnpm 버전을 맞춘 뒤 `pnpm install`을 실행한다. MongoDB와 Redis는 Docker Compose로 관리한다.

## 환경 변수

| 이름 | 필수 여부와 기본값 | 용도 |
| --- | --- | --- |
| `HOST` | 선택, `127.0.0.1` | API listen 주소 |
| `PORT` | 선택, `3001` | API listen 포트 |
| `CORS_ORIGINS` | 선택, 로컬 web origin | 쉼표로 구분한 허용 origin 목록 |
| `NUXT_PUBLIC_API_BASE_URL` | 선택, `http://127.0.0.1:3001` | web이 사용할 API base URL |
| `MONGODB_URI` | collector 필수 | MongoDB 연결 문자열이며 API에서 비어 있으면 메모리 저장소 사용 |
| `MONGODB_DATABASE` | 선택, `lara` | MongoDB database 이름 |
| `REDIS_URL` | collector 필수 | BullMQ가 사용할 Redis 연결 문자열 |
| `NEXON_API_KEY` | collector 필수 | Nexon Open API 키이며 로그와 Git에 남기지 않음 |
| `NEXON_RATE_LIMIT_REQUESTS` | 선택, `50` | rate limit 기간에 시작할 수 있는 Nexon fetch job 수 |
| `NEXON_RATE_LIMIT_DURATION_MS` | 선택, `1000` | rate limit 기간의 밀리초 값 |
| `NEXON_GLOBAL_CONCURRENCY` | 선택, `20` | 모든 collector worker를 합친 Nexon fetch 동시 실행 상한 |
| `COLLECTOR_CONCURRENCY` | 선택, `20` | collector 프로세스 하나의 동시 실행 상한 |
| `COLLECTOR_RECONCILE_INTERVAL_MS` | 선택, `30000` | queued run과 실패 상태를 재조정하는 기본 주기 |
| `COLLECTOR_FAILED_RECONCILE_INTERVAL_MS` | 선택, `300000` | 보관 중인 failed job 전체를 다시 확인하는 주기 |
| `COLLECTOR_QUEUED_STALE_MS` | 선택, `60000` | enqueue 복구 대상으로 볼 queued run의 최소 정체 시간 |
| `COLLECTOR_RECONCILE_BATCH_SIZE` | 선택, `100` | 한 주기에 다시 enqueue할 queued run 상한 |
| `RUN_MONGO_TESTS` | 테스트 전용, 기본 꺼짐 | 실제 MongoDB 통합 테스트 실행 |
| `RUN_REDIS_TESTS` | 테스트 전용, 기본 꺼짐 | 실제 Redis 통합 테스트 실행 |
| `RUN_NETWORK_TESTS` | 테스트 전용, 기본 꺼짐 | 실제 Node listener 통합 테스트 실행 |

`.env`에는 로컬 자격 증명만 두고 커밋하지 않는다. 운영 환경에서는 secret manager나 배포 환경 변수로 `NEXON_API_KEY`를 주입한다.

## 기동

```sh
cp .env.example .env
pnpm infra:up
docker compose ps
set -a
. ./.env
set +a
pnpm dev
```

`MONGODB_URI`를 지정하지 않으면 API는 재시작 시 사라지는 메모리 저장소를 사용한다. raw 저장과 collector를 검증할 때는 MongoDB를 사용한다.

`GET /health`는 프로세스 생존만 확인하고 `GET /health/ready`는 MongoDB ping과 Redis ping이 모두 성공할 때만 200을 반환한다. Redis를 생략한 read-only 로컬 API는 readiness가 503인 것이 정상이다.

`pnpm dev`는 API와 web을 함께 실행한다. 한 앱만 확인할 때는 해당 명령을 사용한다.

```sh
pnpm dev:api
pnpm dev:web
```

collector는 API와 별도 터미널에서 실행한다. 실제 Nexon API를 호출하므로 유효한 `NEXON_API_KEY`와 quota 설정을 확인한 뒤 시작한다.

```sh
set -a
. ./.env
set +a
pnpm dev:collector
```

기본 `pnpm check`는 포트를 열거나 로컬 서비스를 요구하지 않으며 MongoDB, Redis, Node listener 통합 테스트는 skip한다. 로컬 인프라를 올린 뒤 모든 통합 테스트를 실행한다.

```sh
pnpm test:integration
```

Redis 통합 테스트만 재현할 때는 다음 명령을 사용한다. 테스트는 실행마다 고유한 큐를 만들고 종료 시 큐 key와 연결을 정리한다.

```sh
RUN_REDIS_TESTS=1 pnpm nx test @lara/jobs --skip-nx-cache
```

## 종료

API와 collector를 먼저 `Ctrl-C`로 정상 종료한 뒤 인프라를 내린다.

```sh
pnpm infra:down
```

`infra:down`은 container만 중지하고 volume은 보존한다. volume 삭제는 복구할 수 있는 데이터가 없음을 확인한 사람이 별도로 수행하며 자동화하지 않는다.
