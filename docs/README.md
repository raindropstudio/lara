# 문서

사람이 지속적으로 참고할 맥락을 기록한다. 구현 과정과 대화 로그는 남기지 않는다.

- `decisions/`: 제안하거나 승인한 아키텍처 결정
- `architecture/`: 안정된 시스템 경계와 데이터 흐름
- `product/`: 사용자 문제, 목표, 비목표, 수용 기준
- `specifications/`: 구현이 공유하는 동작 계약
- `operations/`: 운영 절차와 runbook

코드, 테스트, lint 규칙으로 강제하는 구현 세부 사항은 중복 기록하지 않는다.

## 작업별 시작점

| 작업 | 먼저 읽을 문서 |
| --- | --- |
| 설치, 기동, 실제 응답 재생과 합성 보완, 검증 | [로컬 개발](operations/local-development.md) |
| API 계약과 웹 연결 | [캐릭터 조회 API 호환성](specifications/character-api-compatibility.md), [Eden 결정](decisions/0004-use-eden-treaty-for-web-api.md) |
| 군장검사와 비교 화면 | [군장검사](specifications/party-inspection.md) |
| Nexon 원본 기록과 파싱 | [fixture 안내](../fixtures/nexon/README.md), [기록 도구](../tools/nexon-fixtures/README.md), [데이터 파이프라인](architecture/data-pipeline.md) |
| 수집 장애와 운영 전환 | [collector 장애 대응](operations/collector-incidents.md), [전환 절차](operations/migration-cutover.md) |
| 마이그레이션 범위와 남은 조건 | [백엔드 우선 마이그레이션](product/backend-first-migration.md) |

기능 문서는 현재 동작과 한계를, 결정 기록은 당시 선택의 이유를 설명한다. 완료 여부와 실행 명령은 현재 코드·테스트·`package.json`에 대조한다. 과거 검증 기록을 이번 작업의 실행 결과로 사용하지 않는다.
