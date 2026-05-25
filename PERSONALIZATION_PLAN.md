# 꼬꼬회독 Personalization Plan

## Goal

꼬꼬회독을 사용자가 회독을 거듭하며 자기 방식에 맞게 조절할 수 있는 학습 앱으로 만든다.

현재 앱은 `대그룹 > 소그룹 > 카드` 구조와 소그룹 단위 공식 기록이 안정화되어 있다. 다음 단계는 카드와 입력 방식을 사용자의 실제 학습 감각에 맞게 조정하는 것이다.

핵심 방향:
- 이미 외운 카드는 삭제하지 않고 학습에서만 잠시 제외할 수 있게 한다.
- 8BitDo 같은 외부 컨트롤러 입력은 사용자가 원하는 정답/오답 방향으로 바꿀 수 있게 한다.
- 모든 개인화는 공식 소그룹 기록과 데이터 보존 원칙을 해치지 않는다.

## Product Rules

- 앱 이름은 `꼬꼬회독`이다.
- 공식 회독 기록은 계속 소그룹 단위로 저장한다.
- 카드 제외는 삭제가 아니라 학습 대상 필터다.
- 제외한 카드의 기존 정답/오답 기록은 유지한다.
- 묶음 연습은 기록 없는 연습으로 유지한다.
- 컨트롤러 매핑은 사용자별 설정이다.
- UI 변경은 `DESIGN.md`의 밝은 캔버스, 얇은 선, 민트 active/success 포인트, 8px radius를 따른다.

## Current Assessment

### Strong

- 소그룹 회독, 묶음 연습, 약점 복습의 역할이 분리되어 있다.
- 카드 등록/수정과 CSV import/export가 소그룹 단위 운영에 맞춰져 있다.
- 8BitDo Micro는 A/B 입력과 Gamepad API 기반 입력까지 지원한다.
- 설정 화면에 학습 순서, 예문 표시, 약점 기준 같은 사용자 설정이 이미 있다.

### Personalization Gaps

- 회독을 반복하며 "이 카드는 이제 잠시 안 봐도 된다"를 표시할 방법이 없다.
- 쉬운 카드를 삭제하면 기록과 콘텐츠가 사라지므로 안전한 제외 상태가 필요하다.
- 현재 컨트롤러 입력은 `A = 뒤집기/알맞음`, `B = 틀림`으로 고정되어 있다.
- 사용자가 컨디션이나 손 위치에 따라 A/B 동작을 바꾸고 싶을 수 있다.
- 컨트롤러 입력 상태는 보이지만, 매핑을 확인하거나 바꾸는 설정은 없다.

## Progress Tracker

완료한 작업은 `[ ]`를 `[x]`로 바꾼다. 한 phase 안의 모든 하위 항목이 끝나면 phase도 체크한다.

- [ ] Phase 1. Controller Action Mapping
  - [ ] 1.1 Settings Data Model
  - [ ] 1.2 Settings UI
  - [ ] 1.3 Study Input Integration
  - [ ] 1.4 Controller Mapping QA
- [ ] Phase 2. Card Study Exclusion
  - [ ] 2.1 Database & API
  - [ ] 2.2 Card Management UI
  - [ ] 2.3 Study Flow Filtering
  - [ ] 2.4 Exclusion State Copy
- [ ] Phase 3. Import, Export & Backup Compatibility
  - [ ] 3.1 CSV Round Trip
  - [ ] 3.2 Backup/Restore Contract
  - [ ] 3.3 Migration Defaults
- [ ] Phase 4. Review & Stats Policy
  - [ ] 4.1 Weak Review Behavior
  - [ ] 4.2 Stats Wording
  - [ ] 4.3 Edge Case QA
- [ ] Phase 5. Optional Controller Calibration
  - [ ] 5.1 Input Test Surface
  - [ ] 5.2 Button Detection

## Phase 1. Controller Action Mapping

### 1.1 Settings Data Model

Purpose:
사용자별로 A/B 입력의 학습 동작을 저장한다.

Default mapping:
- A: `primary`
- B: `wrong`

Action meanings:
- `primary`: 앞면에서는 뒤집기, 뒷면에서는 알맞음
- `wrong`: 뒷면에서 틀림
- `disabled`: 사용 안 함

Tasks:
- [ ] 사용자 설정에 `controller_a_action`, `controller_b_action`을 추가한다.
- [ ] 기존 사용자에게는 기본값 `A = primary`, `B = wrong`을 적용한다.
- [ ] 설정 저장/조회 API와 client state에 값을 연결한다.
- [ ] 설정이 없거나 잘못된 값이면 기본 매핑으로 보정한다.

Files:
- `app.py`
- `static/app.js`

Acceptance Criteria:
- 새 DB와 기존 DB 모두 기본 컨트롤러 매핑이 동일하게 동작한다.
- 사용자별 설정이 분리되어 저장된다.
- 잘못된 설정값이 있어도 학습 화면이 깨지지 않는다.

### 1.2 Settings UI

Purpose:
설정 화면에서 A/B 동작을 짧고 명확하게 바꿀 수 있게 한다.

Tasks:
- [ ] 설정 화면에 "컨트롤러" 섹션을 추가한다.
- [ ] A 버튼 동작 select를 제공한다.
- [ ] B 버튼 동작 select를 제공한다.
- [ ] 선택지는 `뒤집기/알맞음`, `틀림`, `사용 안 함`으로 둔다.
- [ ] "기본값으로 되돌리기" action을 제공한다.
- [ ] 설정 설명은 길게 쓰지 않고, 필요한 경우 inline help로 숨긴다.

Files:
- `static/app.js`
- `static/styles.css`
- `DESIGN.md` only if a reusable settings pattern changes

Acceptance Criteria:
- 360px 모바일 폭에서 select와 버튼 텍스트가 넘치지 않는다.
- 기본값이 현재 동작과 같아서 기존 사용자가 다시 배울 필요가 없다.
- A와 B를 서로 바꾸는 설정이 가능하다.

### 1.3 Study Input Integration

Purpose:
키보드 A/B와 Gamepad A/B가 같은 매핑 테이블을 통해 학습 동작을 실행하게 한다.

Tasks:
- [ ] `handleStudyControllerAction` 앞에 raw input을 logical action으로 변환하는 helper를 둔다.
- [ ] keyboard `a`와 gamepad button 0/15는 A 매핑을 따른다.
- [ ] keyboard `b`와 gamepad button 1/14는 B 매핑을 따른다.
- [ ] `disabled`인 입력은 아무 동작도 하지 않는다.
- [ ] 현재 250ms 쿨다운과 controller status pill은 유지한다.
- [ ] status pill은 실제 실행된 동작 이름을 보여준다.

Files:
- `static/app.js`

Acceptance Criteria:
- 기본 설정에서 현재와 동일하게 A는 뒤집기/알맞음, B는 틀림이다.
- A와 B를 뒤바꾸면 A가 틀림, B가 뒤집기/알맞음으로 동작한다.
- 뒷면이 아닌 상태에서 `wrong` 입력은 카드를 넘기지 않는다.

### 1.4 Controller Mapping QA

Purpose:
실제 iPhone + 8BitDo Micro에서 매핑 변경이 학습 흐름을 방해하지 않는지 확인한다.

Tasks:
- [ ] 기본 매핑으로 A/B 동작을 확인한다.
- [ ] A/B 뒤바꿈 매핑으로 동작을 확인한다.
- [ ] 한쪽 버튼을 `사용 안 함`으로 두고 입력 무시를 확인한다.
- [ ] PWA 캐시 갱신 뒤 설정이 반영되는지 확인한다.

Acceptance Criteria:
- 설정 변경 후 새 학습 세션에서 매핑이 반영된다.
- 컨트롤러가 처음 한 번 눌린 뒤 Gamepad로 잡히는 현재 iPhone 동작과 충돌하지 않는다.

## Phase 2. Card Study Exclusion

### 2.1 Database & API

Purpose:
카드를 삭제하지 않고 학습 대상에서 제외할 수 있는 영속 상태를 만든다.

Data proposal:
- `cards.study_excluded INTEGER NOT NULL DEFAULT 0`
- optional later: `cards.study_excluded_at TEXT`

Tasks:
- [ ] SQLite migration에 `study_excluded` 컬럼을 추가한다.
- [ ] 카드 조회 응답에 제외 여부를 포함한다.
- [ ] 카드 생성 기본값은 `false`로 둔다.
- [ ] 카드 수정 API에서 제외 여부를 저장할 수 있게 한다.
- [ ] 빠른 토글 API가 필요한지 판단한다.

Files:
- `app.py`
- `static/js/storage.js` if local shape helpers need updates
- `static/app.js`

Acceptance Criteria:
- 기존 카드들은 모두 학습 포함 상태로 마이그레이션된다.
- 제외 상태를 바꿔도 카드 내용과 기존 학습 기록은 유지된다.
- 다른 사용자의 카드 제외 상태를 변경할 수 없다.

### 2.2 Card Management UI

Purpose:
카드 목록과 카드 수정 흐름에서 제외 상태를 안전하게 바꿀 수 있게 한다.

Tasks:
- [ ] 카드 목록 item에 `학습 제외` 상태 pill을 표시한다.
- [ ] 카드 수정 폼에 `학습에서 제외` 체크박스를 추가한다.
- [ ] 카드 목록에서 빠르게 제외/포함을 바꾸는 action이 필요한지 판단한다.
- [ ] 제외된 카드는 시각적으로 약하게 보이되 삭제/오답처럼 위험하게 보이지 않게 한다.
- [ ] 검색/필터에 "제외 카드" 필터가 필요한지 판단한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 제외 상태가 삭제나 오답 상태로 오해되지 않는다.
- 카드 수정 화면에서 현재 제외 여부가 명확하다.
- 모바일에서 체크박스/토글 터치 영역이 44px 이상이다.

### 2.3 Study Flow Filtering

Purpose:
공식 소그룹 학습과 묶음 연습에서 제외 카드를 기본적으로 빼고 학습한다.

Default behavior:
- 소그룹 공식 학습: 제외 카드 미포함
- 묶음 연습: 제외 카드 미포함
- 카드 목록/검색: 제외 카드 표시
- 백업/CSV: 제외 카드 포함

Tasks:
- [ ] `startStudySession` 카드 준비 단계에서 제외 카드를 필터링한다.
- [ ] 묶음 연습 카드 준비 단계에서도 제외 카드를 필터링한다.
- [ ] 학습 시작 panel에 `학습 대상 n개 · 제외 m개`를 표시한다.
- [ ] 모든 카드가 제외된 소그룹은 학습 시작 disabled reason을 보여준다.
- [ ] 필요하면 "제외 카드 포함" 임시 옵션을 제공한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 제외 카드만 있는 소그룹은 빈 학습 세션을 시작하지 않는다.
- 제외된 카드는 공식 회독 기록에 새로 포함되지 않는다.
- 기존 회독 기록과 통계는 사라지지 않는다.

### 2.4 Exclusion State Copy

Purpose:
사용자가 "제외"를 삭제나 영구 숨김으로 오해하지 않게 한다.

Copy guidelines:
- Use: `학습 제외`, `학습에 포함`, `제외 카드 포함`
- Avoid: `숨김`, `삭제`, `비활성`, `제거`

Tasks:
- [ ] 카드 수정 폼 help text를 짧게 작성한다.
- [ ] 학습 시작 disabled reason을 명확하게 작성한다.
- [ ] 제외 상태 pill 색상은 muted/neutral 계열로 둔다.

Acceptance Criteria:
- 제외는 되돌릴 수 있는 학습 필터로 이해된다.
- red 계열을 쓰지 않는다.

## Phase 3. Import, Export & Backup Compatibility

### 3.1 CSV Round Trip

Purpose:
소그룹 CSV로 카드 운영을 할 때 제외 상태가 사라지지 않게 한다.

Tasks:
- [ ] CSV export에 `학습제외` 컬럼을 추가한다.
- [ ] CSV import에서 `학습제외` 컬럼이 있으면 읽는다.
- [ ] 기존 CSV처럼 컬럼이 없으면 기본값 `false`로 처리한다.
- [ ] 허용 값은 `TRUE/FALSE`, `1/0`, `예/아니오`, `Y/N` 중 필요한 범위를 정한다.

Files:
- `app.py`
- `static/js/files.js` if client-side filename/help changes

Acceptance Criteria:
- 기존 CSV 파일 import가 깨지지 않는다.
- export 후 import하면 제외 상태가 유지된다.

### 3.2 Backup/Restore Contract

Purpose:
백업 JSON이 제외 상태와 컨트롤러 설정을 안전하게 보존하게 한다.

Tasks:
- [ ] 백업 export에 카드 제외 상태를 포함한다.
- [ ] 백업 export에 컨트롤러 매핑 설정을 포함한다.
- [ ] restore에서 필드가 없으면 기본값으로 보정한다.
- [ ] 백업 schema/migration 메모를 문서화한다.

Files:
- `app.py`
- `README.md` if backup format notes are expanded

Acceptance Criteria:
- 예전 백업 파일도 restore 가능하다.
- 새 백업 파일은 제외 상태와 컨트롤러 매핑을 보존한다.

### 3.3 Migration Defaults

Purpose:
기존 사용자 데이터가 있는 서버에 배포해도 기존 학습 흐름이 바뀌지 않게 한다.

Tasks:
- [ ] 기존 카드의 `study_excluded` 기본값이 0인지 확인한다.
- [ ] 기존 사용자 설정에는 기본 컨트롤러 매핑을 적용한다.
- [ ] migration이 여러 번 실행되어도 안전한지 확인한다.

Acceptance Criteria:
- 배포 직후 기존 학습 카드 수가 갑자기 줄지 않는다.
- 기존 컨트롤러 사용자에게 동작 변화가 없다.

## Phase 4. Review & Stats Policy

### 4.1 Weak Review Behavior

Purpose:
제외 카드가 약점 복습에 포함될지 정책을 정한다.

Default proposal:
- 약점 복습도 제외 카드를 기본적으로 제외한다.
- 나중에 필요하면 `제외 카드 포함` 옵션을 추가한다.

Tasks:
- [ ] 약점 카드 계산에서 제외 카드를 뺄지 확정한다.
- [ ] 제외된 약점 카드 수를 별도로 보여줄지 판단한다.
- [ ] 사용자가 의도치 않게 약점 복습에서 카드가 사라졌다고 느끼지 않도록 copy를 정리한다.

Acceptance Criteria:
- 제외 카드가 약점 복습에 갑자기 다시 나타나지 않는다.
- 사용자가 원하면 다시 학습에 포함할 수 있다.

### 4.2 Stats Wording

Purpose:
카드 수, 학습 대상 수, 제외 수가 혼동되지 않게 한다.

Tasks:
- [ ] 소그룹 카드 수는 전체 등록 카드 수로 유지할지 결정한다.
- [ ] 학습 시작 화면에는 학습 대상 카드 수를 별도로 표시한다.
- [ ] 통계 화면에서 제외 카드 수를 보여줄 필요가 있는지 판단한다.
- [ ] 공식 회독 기록은 실제 학습한 카드 기준임을 필요할 때만 설명한다.

Acceptance Criteria:
- 사용자가 카드가 삭제됐다고 오해하지 않는다.
- 학습 시작 전 실제로 몇 장을 볼지 알 수 있다.

### 4.3 Edge Case QA

Purpose:
제외 상태가 학습, 통계, CSV, 백업에서 어긋나지 않게 한다.

Tasks:
- [ ] 카드 1장 중 1장 제외 상태에서 공식 학습 시작이 막히는지 확인한다.
- [ ] 카드 3장 중 1장 제외 상태에서 2장만 학습되는지 확인한다.
- [ ] 제외 카드를 다시 포함하면 다음 학습에 포함되는지 확인한다.
- [ ] 제외 카드의 기존 오답 기록이 유지되는지 확인한다.
- [ ] CSV export/import 후 제외 상태가 유지되는지 확인한다.
- [ ] 백업/복원 후 제외 상태와 설정이 유지되는지 확인한다.

Acceptance Criteria:
- 제외 상태 변경이 기록 손실을 만들지 않는다.
- 공식 학습과 기록 없는 연습의 분리가 유지된다.

## Phase 5. Optional Controller Calibration

### 5.1 Input Test Surface

Purpose:
사용자가 현재 컨트롤러가 앱에서 어떻게 잡히는지 직접 확인하게 한다.

Tasks:
- [ ] 설정 화면에 컨트롤러 테스트 영역을 추가할지 판단한다.
- [ ] 마지막 입력 source와 raw button index를 짧게 보여준다.
- [ ] 테스트 영역은 평소에는 접힌 상태로 둔다.

Acceptance Criteria:
- iPhone에서 "한 번 눌러야 연결됨" 현상을 사용자가 이해할 수 있다.
- 일반 사용자에게 과한 개발자 도구처럼 보이지 않는다.

### 5.2 Button Detection

Purpose:
A/B 고정 버튼을 넘어, 사용자가 직접 버튼을 눌러 동작을 등록할 수 있게 확장한다.

Tasks:
- [ ] `A/B 동작 변경`으로 충분한지 먼저 확인한다.
- [ ] 필요할 때만 `버튼 눌러 등록` flow를 설계한다.
- [ ] keyboard key와 gamepad button index를 같은 mapping model로 표현할 수 있는지 검토한다.

Acceptance Criteria:
- Phase 1만으로 사용성이 충분하면 Phase 5는 보류한다.
- 확장하더라도 기본 8BitDo Micro 사용자는 복잡한 설정을 볼 필요가 없다.

## Suggested Implementation Order

1. Phase 1: Controller Action Mapping
2. Phase 2.1-2.3: Card Study Exclusion Core
3. Phase 3: CSV/Backup Compatibility
4. Phase 4: Review & Stats Policy
5. Phase 5: Optional Calibration only if real use shows the need

Reason:
컨트롤러 매핑은 프론트 설정 중심이라 작고 빠르게 끝낼 수 있다. 카드 제외는 DB, API, CSV, 백업, 학습 로직까지 닿으므로 한 번에 정책을 정하고 진행해야 한다.
