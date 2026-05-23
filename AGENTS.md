# AGENTS.md

## Project Context

벼락치기는 모바일 중심의 회독 카드 학습 앱이다. 핵심 정보 구조는 `대그룹 > 소그룹 > 카드`이며, 공식 학습 기록은 소그룹 단위로 저장한다. 여러 소그룹을 묶는 연습은 기록 없는 보조 기능이다.

## Design System

- UI, UX, copy, layout, spacing, color, component styling을 변경할 때는 먼저 `DESIGN.md`를 읽고 따른다.
- `DESIGN.md`와 현재 구현이 충돌하면, 사용자의 명시 지시가 없는 한 `DESIGN.md`를 우선한다.
- 새 UI 컴포넌트를 만들 때는 `DESIGN.md`의 color, typography, spacing, radius, elevation, component rules를 재사용한다.
- `DESIGN.md`에 없는 패턴이 필요하면 기존 화면 패턴과 가장 가까운 규칙을 확장한다.
- 새 패턴이 반복될 가능성이 있으면 구현과 함께 `DESIGN.md`도 업데이트한다.
- 학습 홈, 카드 탭, 묶음 탭, 학습 세션, 완료 화면은 `DESIGN.md`의 Screen Rules를 기준으로 검토한다.

## Product Rules

- 앱 이름은 `벼락치기`다.
- 공식 회독 통계와 학습 이력은 소그룹 단위로 저장한다.
- 대그룹은 소그룹을 묶는 관리 단위이며, 자체 학습 이력처럼 보이게 만들지 않는다.
- 묶음 연습은 기록 없는 연습으로 유지하고, 공식 통계에 저장하지 않는다.
- UI 첫 화면은 마케팅 랜딩이 아니라 실제 학습 홈이어야 한다.

## Visual Guardrails

- 밝은 캔버스, 얇은 hairline border, 민트 포인트, 읽기 좋은 카드 UI를 기본으로 한다.
- 한글과 일본어에는 negative letter-spacing을 쓰지 않는다.
- 일반 버튼, 카드, 패널, 입력은 8px radius를 기본으로 한다.
- 민트/그린은 primary CTA, active state, progress, success 상태에만 절제해서 사용한다.
- red는 삭제, 오답, 위험 상태에만 사용한다.
- mono font는 백업 JSON, 대량 등록 형식, 코드성 텍스트에만 사용한다.

## Avoid

- 다크 히어로, 구름/로켓/번개 장식, gradient orb, bokeh 장식을 만들지 않는다.
- purple-blue gradient를 앱 정체성으로 쓰지 않는다.
- 모든 버튼을 pill 형태로 만들지 않는다.
- 카드 안에 큰 카드를 중첩하지 않는다.
- 텍스트가 버튼, badge, card 안에서 넘치게 두지 않는다.
- 기능 설명을 앱 안에서 마케팅 문구처럼 길게 쓰지 않는다.
