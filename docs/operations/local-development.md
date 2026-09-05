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

`GET /health`는 프로세스 생존만 확인한다. 일반 API의 `GET /health/ready`는 선택한 저장소와 Redis가 모두 준비됐을 때 200을 반환하며 MongoDB 사용 시에는 ping으로 확인한다. Redis를 생략한 read-only 로컬 API는 readiness가 503인 것이 정상이다. 합성 미리보기 API의 readiness는 실제 MongoDB·Redis 연결을 증명하지 않는다.

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

### Doppler의 기존 Nexon 키 사용

로컬에서는 Doppler의 `lara-backend` 프로젝트, `dev_personal` 설정에 저장된 `NXAPI_KEY`를 사용할 수 있다. Doppler CLI가 설치되고 해당 프로젝트를 읽을 수 있도록 로그인돼 있어야 한다. 위와 같이 로컬 `.env`의 MongoDB·Redis 설정을 로드한 뒤 실행한다.

```sh
pnpm dev:collector:doppler
```

이 명령은 `NXAPI_KEY`만 가져와 collector 프로세스의 `NEXON_API_KEY`로 주입한다. 기존 `NEXON_API_KEY`보다 Doppler 값을 우선하며 전달 후 `NXAPI_KEY`는 제거한다. 다른 레거시 비밀이나 DB 주소는 가져오지 않는다. 키를 `.env`에 복사하지 않고 Doppler fallback 파일도 만들지 않는다. 키가 없거나 Doppler 연결이 실패하면 collector를 시작하지 않는다. 실제 Nexon 호출은 수집 작업을 처리할 때 발생한다.

기본 `pnpm check`는 포트를 열거나 로컬 서비스를 요구하지 않으며 MongoDB, Redis, Node listener 통합 테스트는 skip한다. 로컬 인프라를 올린 뒤 모든 통합 테스트를 실행한다.

수정 중에는 변경한 앱·패키지의 관련 검증을 먼저 실행하고 마무리에 `pnpm check`를 실행한다. `pnpm nx affected -t lint,typecheck,test,build`를 사용할 때는 비교할 base/head에 이번 작업 커밋이 포함되는지 확인한다. 커밋 후 작업 트리가 깨끗하다는 이유로 검증 범위가 비어서는 안 된다.

결과에는 실행한 검증과 생략한 통합 테스트를 구분한다. Nx 캐시 결과는 재사용한 검증으로, 새로 실행한 브라우저 확인은 사용한 데이터와 화면 크기를 함께 보고한다. 환경 문제로 실패했다면 성공으로 간주하지 않고 실행 환경을 확인한다. 특정 에이전트의 설치 경로나 우회 설정은 저장소 표준 명령으로 고정하지 않는다.

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

## Nexon 호출 없는 화면 미리보기

MongoDB·Redis·API 키 없이 군장검사의 성공·부분 자료·오류를 확인할 때 두 터미널에서 실행한다. 같은 체크아웃의 Nuxt 개발 서버는 하나만 실행한다. 이미 실행 중이면 용도를 확인해 재사용하거나 작업용 서버를 종료한 뒤 전환한다.

```sh
pnpm --filter @lara/api dev:preview
NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3002 pnpm --filter @lara/web exec nuxt dev --port 3003
```

`http://localhost:3003/inspection`에서 `데모라라, 데모비숍, 데모부분`을 추가한다. 데모 자료는 실제 캐릭터가 아닌 합성 데이터로, 기본 정보·스탯·장비·유니온만 제공한다. `데모부분`은 스탯을 누락하며 목록에 없는 이름은 수집 오류를 반환한다. `데모제로, 데모궁수, 데모도적`으로 최대 6명 상태를 확인할 수 있다. 이미지가 없으면 기존 로고를 대체 이미지로 사용한다. API는 3002 포트의 메모리 저장소만 사용하며 재시작하면 초기화된다.

이 미리보기는 HTTP 조회·수집 상태 표시와 웹 상호작용을 재현한다. 실제 Nexon 응답의 파싱 정확도, Redis worker 복구, 실제 캐릭터 이미지와 다양한 장비 배치를 보장하지 않는다. 이 범위는 recorder fixture와 해당 통합 테스트로 따로 확인한다.

### 군장검사 실제 기록 재생

[Figma의 여섯 캐릭터 기록](../../fixtures/nexon/README.md)을 사용할 때는 합성 API를 종료하고 다음 명령으로 바꾼다. 웹의 주소와 실행 명령은 위와 같다.

```sh
pnpm nx build @lara/api
pnpm --filter @lara/api dev:recorded
```

`빙캔, 소주에보드카, 섭주, 무들, 믹끼유, 버블볍`을 입력한다. 5명의 20개 데이터 영역과 믹끼유의 실제 ID 조회 실패를 재생한다. 조회와 갱신은 저장된 원문을 parser·메모리 projection·HTTP 계약에 통과시키며 Nexon API를 호출하지 않는다. 기록에 없는 이름은 오류를 반환한다. 재생할 때 수집 시각을 현재 시각으로 바꾸지 않으므로 오래된 기록은 오래된 자료로 표시된다. 파서 변경 후에는 다시 빌드하고 API를 재시작한다.

`pnpm check`는 기록의 hash 검증과 실제 응답 재생 회귀 테스트를 포함한다. 이 검증은 실제 응답 파싱과 HTTP 계약을 확인하지만 MongoDB·Redis worker 통합 테스트를 대신하지 않는다.
