# 패키지

패키지는 안정적인 재사용 경계를 표현한다. 공개 계약, Nexon transport,
메이플스토리 canonical model, 버전별 parser, fixture 도구부터 분리할 예정이다.

경계가 안정됐거나 둘 이상의 애플리케이션이 사용할 때 패키지를 만든다. 패키지는
`apps/`를 import하지 않는다.
