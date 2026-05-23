# 벼락치기 Product Design Improvement Plan

## Goal

벼락치기를 "기능이 있는 MVP"에서 "매일 쓰고 싶은 모바일 학습 제품" 수준으로 끌어올린다. 기준은 `DESIGN.md`이며, 방향은 **읽기 좋은 민트 포인트 학습 도구**다.

이 계획은 새 기능을 많이 추가하기보다, 핵심 화면의 정보 구조, 시각 위계, 빈 상태, 학습 루프를 제품 수준으로 다듬는 데 집중한다.

## Product Definition

- 앱 이름: 벼락치기
- 핵심 구조: 대그룹 > 소그룹 > 카드
- 공식 학습 단위: 소그룹
- 보조 학습: 여러 소그룹을 묶는 기록 없는 연습
- 주요 사용자 상황: 시험 전, 짧은 시간, 반복 암기, 모바일 사용

## Design Baseline

모든 UI/UX 변경은 `DESIGN.md`를 따른다.

Core direction:
- 밝은 캔버스
- 얇은 hairline border
- 민트 primary/active/success 포인트
- 8px radius
- 한글/일본어 negative letter-spacing 금지
- 학습 홈이 첫 화면
- 다크 히어로, 번개 장식, 구름/로켓, 과한 pill 버튼 금지

## Current Assessment

### Strong

- 대그룹 > 소그룹 > 카드 구조가 잡혔다.
- 소그룹 단위 공식 학습과 기록 없는 묶음 연습이 분리됐다.
- 카드 탭에 대그룹/소그룹 dependent select가 들어갔다.
- 묶음 탭은 대그룹 진입 후 소그룹 관리 흐름으로 바뀌었다.
- 앱 이름과 디자인 기준이 `벼락치기`로 정리됐다.

### Not Yet Product-Level

- 학습 홈이 "오늘 뭘 하면 되는지"를 충분히 강하게 안내하지 못한다.
- 소그룹 카드가 메인 학습 단위답게 충분히 정보화되어 있지 않다.
- 첫 사용/빈 상태 흐름이 제품처럼 친절하지 않다.
- 학습 세션과 완료 화면의 polish가 아직 기능 중심이다.
- 카드 등록/대량 등록 흐름은 실용적이지만 전문 도구처럼 정돈될 여지가 있다.
- 화면별 디자인 밀도와 CTA 우선순위가 완전히 통일되지 않았다.
- 로그인, 로딩, 네트워크 실패 같은 shell state가 아직 제품 경험의 일부로 충분히 다듬어지지 않았다.
- 앱은 범용 암기 도구가 됐지만 코드/설정/문서 곳곳에 JLPT 흔적이 남아 있다.
- dialog focus, keyboard, screen reader, touch target을 한 번에 검증하는 접근성 pass가 필요하다.
- 공식 소그룹 학습과 기록 없는 묶음 연습의 데이터 무결성을 별도 QA로 확인해야 한다.
- 카드가 많아졌을 때 검색, 필터, 리스트 렌더링이 느껴지는 품질을 아직 검증하지 않았다.
- 모바일에서 뒤로가기, 탭 이동, detail 진입/복귀, 스크롤 위치 같은 navigation comfort가 아직 별도 기준으로 정리되지 않았다.
- 백업 포맷, migration, 배포 안내, 인증 기대치 같은 운영성 기준이 제품 계획 안에 명시돼 있지 않다.

## Progress Tracker

완료한 작업은 `[ ]`를 `[x]`로 바꾼다. 한 phase 안의 모든 하위 항목이 끝나면 phase도 체크한다.

- [x] Phase 1. Foundation Polish
  - [x] 1.1 Design Token Cleanup
  - [x] 1.2 Layout Rhythm Cleanup
- [x] Phase 2. Study Home
  - [x] 2.1 "Today First" Home Structure
  - [x] 2.2 Weak Review Panel Refinement
- [x] Phase 3. Subgroup-Centered Study UX
  - [x] 3.1 Subgroup Card Redesign
  - [x] 3.2 Collection Detail Refinement
  - [x] 3.3 Bundle Practice Dialog Polish
- [x] Phase 4. Study Session
  - [x] 4.1 Card Front/Back Reading Polish
  - [x] 4.2 Answer Bar Stability
- [x] Phase 5. Completion Loop
  - [x] 5.1 Completion Summary Redesign
  - [x] 5.2 Next Action Design
- [x] Phase 6. Cards Tab
  - [x] 6.1 Card List Information Design
  - [x] 6.2 Single/Bulk Form UX
- [x] Phase 7. Groups Tab
  - [x] 7.1 Collection List Polish
  - [x] 7.2 Collection Detail & Group Form
- [x] Phase 8. Empty States & First-Use Flow
  - [x] 8.1 First-Use Onboarding Without Landing
  - [x] 8.2 Error & Disabled State Copy
- [x] Phase 9. Settings & Data Safety
  - [x] 9.1 Settings Screen Clarity
  - [x] 9.2 Backup/Restore Serious Mode
  - [x] 9.3 Privacy & Auth Expectations
- [x] Phase 10. Login, Loading & App Shell
  - [x] 10.1 Login Screen Polish
  - [x] 10.2 Loading & Error Shell
  - [x] 10.3 Navigation & Orientation
- [x] Phase 11. Accessibility & Interaction Reliability
  - [x] 11.1 Dialog Focus & Keyboard
  - [x] 11.2 Touch Targets & Screen Reader Semantics
- [x] Phase 12. Language Neutrality & Product Copy
  - [x] 12.1 Generic Subject Cleanup
  - [x] 12.2 Copy Inventory & Tone Pass
- [ ] Phase 13. Data Integrity & State Resilience
  - [ ] 13.1 Official vs Practice Stats Audit
  - [ ] 13.2 Destructive Actions & Restore Safety
  - [ ] 13.3 Client State Edge Cases
  - [ ] 13.4 Backup Schema & Migration Contract
- [ ] Phase 14. Performance & Large Data UX
  - [ ] 14.1 List Rendering & Search Responsiveness
  - [ ] 14.2 Network/Request Feedback
- [ ] Phase 15. Product QA Pass
  - [ ] 15.1 Visual QA
  - [ ] 15.2 Functional QA
  - [ ] 15.3 Technical QA
  - [ ] 15.4 Accessibility QA
  - [ ] 15.5 Data Integrity QA
  - [ ] 15.6 Release Readiness QA

## Phase 1. Foundation Polish

### 1.1 Design Token Cleanup

Purpose:
CSS가 `DESIGN.md`와 정확히 같은 방향을 갖도록 토큰과 컴포넌트 기본값을 정리한다.

Tasks:
- [x] `static/styles.css`의 색상 변수를 `DESIGN.md`의 Current CSS Mapping과 맞춘다.
- [x] 사용하지 않는 legacy 색상/실험 토큰을 제거한다.
- [x] panel, button, input, select, segmented, pill, dialog, toast의 기본 스타일을 component rules에 맞춘다.
- [x] `box-shadow`는 level 1/2만 남기고 과한 값은 줄인다.
- [x] mono font는 백업 JSON, 대량 등록 형식, 코드성 텍스트에만 적용한다.

Files:
- `static/styles.css`
- `DESIGN.md` if token definition changes

Acceptance Criteria:
- 전체 화면이 밝은 캔버스 + 흰 surface + 얇은 선 중심으로 보인다.
- primary/active/success 외에 민트가 남용되지 않는다.
- 일반 버튼은 pill이 아니다.
- `rg "letter-spacing" static/styles.css` 결과가 없거나, DESIGN.md가 허용한 micro label에만 제한된다.

### 1.2 Layout Rhythm Cleanup

Purpose:
화면 간 여백, panel 사용, 리스트 gap을 통일한다.

Tasks:
- [x] top-level panel padding을 16-18px 기준으로 통일한다.
- [x] list item padding은 14-16px 기준으로 통일한다.
- [x] `card-list`, `group-list`, `round-list`, `study-subgroup-list` gap을 10-12px로 맞춘다.
- [x] 화면마다 과한 내부 scroll area가 없는지 확인한다.
- [x] 360px 폭에서 버튼 텍스트가 넘치지 않도록 row collapse 기준을 보강한다.

Files:
- `static/styles.css`
- `static/app.js` only if markup hierarchy needs adjustment

Acceptance Criteria:
- 카드 탭, 묶음 탭, 설정 탭의 밀도가 서로 비슷하다.
- 버튼 텍스트가 360px 폭에서 잘리지 않는다.
- 카드 안에 큰 카드가 들어간 느낌이 없다.

## Phase 2. Study Home

### 2.1 "Today First" Home Structure

Purpose:
앱을 열자마자 오늘 할 행동이 보이게 만든다.

Tasks:
- [x] "오늘의 학습" 상단을 action-first 구조로 재정리한다.
- [x] 이어서 회독 card를 가장 중요한 primary card로 만든다.
- [x] 최근 학습이 없을 때는 "대그룹 고르기" CTA가 자연스럽게 대그룹 목록으로 이동한다.
- [x] 약점 복습은 secondary card로 분리하되, 오답 수가 있을 때만 충분히 눈에 띄게 한다.
- [x] 대그룹 찾아보기는 아래쪽 탐색 영역으로 유지한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 첫 화면에서 primary CTA가 3초 안에 식별된다.
- 최근 학습 없음, 약점 없음, 데이터 없음 상태가 모두 자연스럽다.
- 앱 첫 화면이 랜딩 페이지처럼 보이지 않는다.

### 2.2 Weak Review Panel Refinement

Purpose:
약점 복습이 무섭거나 산만하지 않고, 필요한 순간에만 행동을 유도하게 한다.

Tasks:
- [x] 약점 카드 수, 기준, 주요 CTA를 간결하게 보여준다.
- [x] 약점 카드 preview는 접힘 상태를 기본으로 유지한다.
- [x] 색상은 red-soft를 사용하되 경고처럼 과하게 보이지 않게 조정한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 약점 복습은 "보조 학습"으로 보인다.
- 오답이 많아도 화면이 빨갛게 지배되지 않는다.

## Phase 3. Subgroup-Centered Study UX

### 3.1 Subgroup Card Redesign

Purpose:
소그룹이 공식 학습 단위라는 사실이 화면에서 바로 느껴지게 한다.

Tasks:
- [x] 소그룹 item에 다음 정보 위계를 적용한다:
  1. 소그룹명
  2. 카드 수
  3. 오늘 학습 여부
  4. 마지막 학습일
  5. 정답률/오답 누적
  6. 회독 수
- [x] 오늘 완료, 미학습, 오답 있음 상태 pill을 정리한다.
- [x] 비어 있는 소그룹은 학습 CTA 대신 카드 추가 CTA를 보여준다.
- [x] active/selected 상태는 border + subtle mint로 표현한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 소그룹 목록만 봐도 무엇을 먼저 공부할지 판단할 수 있다.
- 대그룹과 소그룹의 역할 차이가 명확하다.
- 빈 소그룹은 dead end가 아니다.

### 3.2 Collection Detail Refinement

Purpose:
대그룹을 "학습 기록 단위"가 아니라 "소그룹 묶음"으로 보이게 한다.

Tasks:
- [x] 대그룹 상세 상단에 aggregate stats를 명확히 표시한다.
- [x] "소그룹 합산 · 묶음 연습은 공식 기록 제외" 문구를 더 자연스럽게 다듬는다.
- [x] 소그룹 만들기 CTA를 명확히 배치한다.
- [x] 묶음 연습 CTA는 secondary로 유지한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 대그룹이 자체 통계를 가진 것처럼 보이지 않는다.
- 소그룹 추가 흐름이 한 번에 이해된다.

### 3.3 Bundle Practice Dialog Polish

Purpose:
여러 소그룹을 묶는 연습을 강력하지만 보조 기능으로 유지한다.

Tasks:
- [x] dialog title/subtitle에서 기록 없는 연습임을 명확히 한다.
- [x] selected subgroup count와 card count를 sticky-ish summary처럼 유지한다.
- [x] quick presets를 compact segmented/ghost action으로 정리한다.
- [x] empty-card subgroup은 disabled visual을 명확히 한다.
- [x] start button disabled reason이 보이게 한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 사용자가 묶음 연습을 시작해도 공식 기록에 남지 않는다는 점을 이해한다.
- 선택 수와 카드 수를 항상 확인할 수 있다.

## Phase 4. Study Session

### 4.1 Card Front/Back Reading Polish

Purpose:
학습 카드의 읽기 경험을 앱의 최고 품질 지점으로 만든다.

Tasks:
- [x] front card의 content type이 일본어/영어/기타 모두 자연스럽게 보이도록 typography를 조정한다.
- [x] back card에서 뜻, 메모, 예문의 위계를 재정리한다.
- [x] 예문 spacing과 grammar highlight를 더 읽기 좋게 다듬는다.
- [x] 긴 예문/긴 번역이 카드 밖으로 밀리지 않게 한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 일본어 예문이 모바일에서 편하게 읽힌다.
- 긴 카드도 레이아웃이 깨지지 않는다.
- 앞면과 뒷면의 시각적 역할이 명확하다.

### 4.2 Answer Bar Stability

Purpose:
학습 중 조작 리듬을 안정화한다.

Tasks:
- [x] 답변 버튼 높이와 위치가 feedback 상태에서도 변하지 않게 한다.
- [x] correct/wrong feedback은 color + label로 표현하되 layout shift를 없앤다.
- [x] quit/study timer/progress 영역이 너무 시끄럽지 않게 정리한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 답변 후 버튼/카드 위치가 튀지 않는다.
- 엄지 조작 영역이 안정적이다.

## Phase 5. Completion Loop

### 5.1 Completion Summary Redesign

Purpose:
학습 완료 후 결과를 이해하고 다음 행동으로 이어지게 한다.

Tasks:
- [x] accuracy, wrong count, duration, studied count를 명확한 scoreboard로 정리한다.
- [x] practice mode completion에는 "기록 없음"을 분명히 표시한다.
- [x] wrong review section을 더 읽기 좋게 만든다.
- [x] correct review는 기본 접힘을 유지하되 접근성을 높인다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 완료 화면에서 성과와 다음 행동이 명확하다.
- 연습 모드가 공식 회독처럼 보이지 않는다.

### 5.2 Next Action Design

Purpose:
완료 후 학습 루프가 끊기지 않게 한다.

Tasks:
- [x] 다음 회독, 같은 소그룹 다시, 소그룹 선택으로 돌아가기 중 상황별 primary action을 정의한다.
- [x] 약점 복습 완료와 일반 회독 완료의 CTA를 분리한다.
- [x] sticky action bar를 `DESIGN.md` 기준으로 정리한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 완료 후 사용자가 다음 클릭을 고민하지 않는다.
- primary action이 하나로 보인다.

## Phase 6. Cards Tab

### 6.1 Card List Information Design

Purpose:
카드 관리 화면을 조밀하지만 읽기 좋은 도구로 만든다.

Tasks:
- [x] 카드 item에서 front, back, memo, examples, group path의 위계를 정리한다.
- [x] 카드 리스트 action 버튼이 content보다 과하게 보이지 않게 한다.
- [x] all cards / collection / group filter 상태를 명확히 표현한다.
- [x] 검색 결과 없음, 대그룹 없음, 소그룹 없음 상태를 각각 다르게 안내한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 카드 목록에서 앞면과 소속 대그룹/소그룹이 빠르게 읽힌다.
- 관리 action은 보이지만 시선을 빼앗지 않는다.

### 6.2 Single/Bulk Form UX

Purpose:
카드 등록 피로도를 줄인다.

Tasks:
- [x] 대그룹/소그룹 dependent select를 form 상단에서 더 명확히 묶는다.
- [x] 선택한 대그룹에 소그룹이 없을 때 CTA를 더 명확히 한다.
- [x] 대량 등록 미리보기에서 줄별 오류/중복을 더 잘 보이게 한다.
- [x] 형식 힌트는 짧게 유지하고, 필요하면 접힘/예시 형태로 둔다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 새 사용자가 카드 등록 흐름에서 막히지 않는다.
- 대량 등록 오류를 수정할 수 있다.

## Phase 7. Groups Tab

### 7.1 Collection List Polish

Purpose:
묶음 관리가 구조적으로 이해되게 한다.

Tasks:
- [x] 대그룹 list item의 title/stats/description/action 위계를 정리한다.
- [x] "묶음"이라는 탭명과 "대그룹"이라는 구조명을 혼동하지 않게 copy를 정리한다.
- [x] empty 대그룹 list에서 첫 대그룹 만들기 CTA를 명확히 한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 사용자가 대그룹을 클릭해 소그룹으로 들어가는 모델을 이해한다.
- 묶음 탭이 학습 탭과 역할이 다르게 보인다.

### 7.2 Collection Detail & Group Form

Purpose:
소그룹 추가/수정 흐름을 더 제품답게 만든다.

Tasks:
- [x] 대그룹 상세 상단에 back action과 title hierarchy를 정리한다.
- [x] 소그룹 만들기 form에서 대그룹 select가 필요한 경우와 아닌 경우를 구분한다.
- [x] 삭제/초기화 action은 danger zone처럼 분리한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 소그룹 추가가 대그룹 상세 안에서 자연스럽다.
- 위험 action이 실수로 눌릴 가능성이 낮다.

## Phase 8. Empty States & First-Use Flow

### 8.1 First-Use Onboarding Without Landing

Purpose:
데이터가 없는 사용자가 자연스럽게 첫 카드를 만들게 한다.

Tasks:
- [x] 대그룹 없음: 대그룹 만들기 CTA
- [x] 대그룹은 있는데 소그룹 없음: 소그룹 만들기 CTA
- [x] 소그룹은 있는데 카드 없음: 카드 만들기 CTA
- [x] 각 빈 상태는 다음 단계 하나만 primary로 제안한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 빈 데이터 상태에서 사용자는 3단계를 따라 첫 학습까지 갈 수 있다.
- 빈 상태가 설명문이 아니라 action으로 보인다.

### 8.2 Error & Disabled State Copy

Purpose:
막힌 이유를 명확히 알려준다.

Tasks:
- [x] disabled button 주변에 이유를 표시한다.
- [x] duplicate card, missing group, empty practice selection copy를 통일한다.
- [x] toast는 짧은 결과 알림에만 쓴다.

Files:
- `static/app.js`
- `app.py` if backend errors need alignment

Acceptance Criteria:
- 사용자가 왜 진행할 수 없는지 즉시 알 수 있다.
- backend/frontend error tone이 일관된다.

## Phase 9. Settings & Data Safety

### 9.1 Settings Screen Clarity

Purpose:
목표 설정과 약점 기준을 앱 정체성에 맞게 정리한다.

Tasks:
- [x] 목표 이름, 목표일, JLPT 급수 optional 관계를 명확히 한다.
- [x] 약점 카드 기준 설정을 compact but understandable하게 만든다.
- [x] 설정 저장/초기화 CTA 우선순위를 정리한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 일본어 외 목적도 자연스럽게 설정할 수 있다.
- 약점 기준이 기술 설정처럼 어렵게 보이지 않는다.

### 9.2 Backup/Restore Serious Mode

Purpose:
백업/복원은 강력한 작업이므로 실수 방지 UI를 강화한다.

Tasks:
- [x] 백업/복원 panel을 data safety section으로 분리한다.
- [x] 복원 전 경고 copy를 구체화한다.
- [x] 백업 textarea mono styling을 유지한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 복원 위험이 명확하다.
- 백업 데이터가 일반 메모처럼 보이지 않는다.

### 9.3 Privacy & Auth Expectations

Purpose:
개인 학습 데이터를 다루는 앱이므로 사용자가 보안 수준과 데이터 위치를 오해하지 않게 한다.

Tasks:
- [x] 앱 안의 간단 로그인과 서버 기본 인증의 역할 차이를 README와 설정 copy에서 명확히 한다.
- [x] 개인 서버 배포 시 HTTPS/reverse proxy 권장 문구를 더 구체화한다.
- [x] 닉네임/6자리 코드가 강력한 계정 보안이 아니라 개인용 접근 구분임을 제품 톤에 맞게 설명한다.
- [x] 백업 파일에는 학습 데이터가 그대로 들어간다는 점을 복원/내보내기 UI에 명시한다.
- [x] public server 사용을 상정하지 않는다면 그 제약을 문서화한다.

Files:
- `README.md`
- `static/app.js`
- `static/styles.css` if UI copy needs layout support

Acceptance Criteria:
- 사용자가 데이터가 어디에 저장되고 어떤 보호가 필요한지 이해한다.
- 앱의 로그인 모델이 실제보다 안전하게 과장되어 보이지 않는다.
- 개인 서버 배포 안내가 현재 기능 수준과 정직하게 맞는다.

## Phase 10. Login, Loading & App Shell

### 10.1 Login Screen Polish

Purpose:
로그인도 제품의 첫인상이므로 학습 앱의 톤과 신뢰감을 맞춘다.

Tasks:
- [x] 로그인 화면을 `DESIGN.md`의 밝은 shell/panel 규칙에 맞춘다.
- [x] 닉네임과 6자리 코드 입력의 목적을 짧고 명확하게 설명한다.
- [x] 로그인 실패, 빈 값, 코드 형식 오류 상태를 inline copy로 정리한다.
- [x] 기본 focus 위치와 submit 후 loading/disabled 상태를 정의한다.
- [x] 로그인 후 학습 홈으로 들어오는 전환이 어색하지 않게 한다.

Files:
- `static/app.js`
- `static/styles.css`
- `static/index.html` if shell markup needs adjustment

Acceptance Criteria:
- 첫 사용자도 계정 생성/로그인 모델을 이해한다.
- 로그인 실패가 toast 하나로만 사라지지 않는다.
- 로그인 화면이 앱 디자인과 따로 놀지 않는다.

### 10.2 Loading & Error Shell

Purpose:
데이터를 불러오는 중이거나 요청이 실패했을 때도 제품처럼 보이게 한다.

Tasks:
- [x] 초기 데이터 loading state를 빈 화면이 아니라 calm loading surface로 보여준다.
- [x] API 요청 실패 시 재시도 CTA와 원인 copy를 제공한다.
- [x] 저장/삭제/복원 중 버튼 disabled와 pending label을 통일한다.
- [x] toast는 성공/짧은 알림에만 쓰고, 복구가 필요한 오류는 화면 안에 남긴다.
- [x] 서버 연결 실패, 인증 만료, 잘못된 백업 JSON을 서로 다른 상태로 구분한다.

Files:
- `static/app.js`
- `static/styles.css`
- `app.py` if error shape needs alignment

Acceptance Criteria:
- 느린 요청에서도 사용자가 앱이 멈췄다고 느끼지 않는다.
- 실패 상태마다 다음 행동이 하나 이상 보인다.
- 같은 오류가 화면마다 다른 톤으로 보이지 않는다.

### 10.3 Navigation & Orientation

Purpose:
모바일 앱처럼 이동 맥락과 복귀 흐름이 자연스럽게 느껴지게 한다.

Tasks:
- [x] 대그룹 상세, 소그룹 선택, 카드 form/list 전환에서 현재 위치가 제목/상단 copy로 명확히 보이게 한다.
- [x] 앱 내부 back action과 브라우저/안드로이드 뒤로가기 기대치를 비교해 정책을 정한다.
- [x] 탭 이동 후 돌아왔을 때 검색어, 선택된 대그룹/소그룹, 스크롤 위치를 어디까지 유지할지 정의한다.
- [x] 학습 세션 중 뒤로가기/탭 이동/새로고침 시 데이터 손실 경고 정책을 정리한다.
- [x] detail 화면에서 list로 돌아왔을 때 사용자가 방금 보던 항목 근처로 돌아오게 할지 검토한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 사용자가 현재 대그룹/소그룹/탭 위치를 잃지 않는다.
- 모바일 뒤로가기 행동이 예측 가능하다.
- list-detail-list 흐름에서 매번 처음부터 다시 찾는 피로가 줄어든다.

## Phase 11. Accessibility & Interaction Reliability

### 11.1 Dialog Focus & Keyboard

Purpose:
dialog, 학습 세션, 탭 이동이 키보드와 보조기기에서도 안정적으로 동작하게 한다.

Tasks:
- [x] dialog open 시 첫 의미 있는 버튼/제목으로 focus를 이동한다.
- [x] dialog close 시 원래 trigger로 focus를 돌린다.
- [x] Escape로 닫을 수 있는 dialog와 닫으면 안 되는 confirm flow를 구분한다.
- [x] dialog 안에서 Tab focus가 밖으로 새지 않도록 검토한다.
- [x] 학습 중 Space/Arrow key 동작이 form 입력과 충돌하지 않는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 마우스 없이 로그인, 카드 등록, 학습 시작, 학습 종료가 가능하다.
- confirm dialog에서 실수로 위험 action이 실행되지 않는다.
- focus ring이 모든 주요 조작에서 보인다.

### 11.2 Touch Targets & Screen Reader Semantics

Purpose:
모바일 한 손 조작과 기본 접근성 품질을 확보한다.

Tasks:
- [x] 모든 button, select, checkbox, search clear action이 최소 44px touch target을 가진다.
- [x] icon-only button에는 `aria-label`이 있다.
- [x] segmented control은 현재 선택 상태를 시각/semantics 양쪽에서 알 수 있다.
- [x] toast와 answer feedback의 live region 사용을 정리한다.
- [x] list item 전체 클릭 영역과 내부 edit/delete 버튼의 충돌을 점검한다.

Files:
- `static/app.js`
- `static/index.html`
- `static/styles.css`

Acceptance Criteria:
- 360px 모바일에서 엄지로 주요 행동을 안정적으로 누를 수 있다.
- 화면 낭독에서 dialog title, form label, 상태 변경을 이해할 수 있다.
- 색상만으로 정답/오답/활성 상태를 구분하지 않는다.

## Phase 12. Language Neutrality & Product Copy

### 12.1 Generic Subject Cleanup

Purpose:
벼락치기를 JLPT 전용 앱이 아니라 범용 암기 앱으로 느끼게 한다.

Tasks:
- [x] UI copy에서 JLPT가 필수 전제처럼 보이는 문구를 제거하거나 optional로 낮춘다.
- [x] `jlpt_*`, `X-JLPT-*`, `JLPTStorage` 같은 legacy naming은 사용자 영향과 migration risk를 검토한다.
- [x] DB/env 이름 `JLPT_DB`, `jlpt_cards.sqlite3`는 호환 유지/새 alias 제공 중 어느 쪽이 나은지 결정한다.
- [x] 테스트 데이터가 일본어 문법에 치우치더라도 첫 사용 흐름은 범용 예시로 보이게 한다.
- [x] README의 실행/기능 설명에서 벼락치기 브랜드와 범용성을 일관되게 맞춘다.

Files:
- `static/app.js`
- `static/js/app-shared.js`
- `static/js/storage.js`
- `app.py`
- `README.md`
- `DESIGN.md` if naming policy changes

Acceptance Criteria:
- 영어 단어, 중국어 표현, 자격증 암기 사용자가 앱을 열어도 어색하지 않다.
- JLPT 급수는 선택 설정일 뿐 앱 정체성으로 보이지 않는다.
- 기존 저장 사용자/백업을 깨지 않는 migration 방향이 문서화된다.

### 12.2 Copy Inventory & Tone Pass

Purpose:
화면마다 말투와 용어를 통일한다.

Tasks:
- [x] 주요 용어 사전을 정한다: 대그룹, 소그룹, 묶음, 카드, 회독, 연습, 약점.
- [x] "대그룹"과 "묶음"이 섞이는 지점을 찾아 탭명/구조명/도움말의 역할을 정한다.
- [x] CTA는 동사형으로 통일한다: 시작, 만들기, 저장, 돌아가기, 복원.
- [x] 위험 action copy에는 대상 이름을 넣는다.
- [x] 완료 화면의 playful copy는 절제하고 결과/다음 행동을 우선한다.

Files:
- `static/app.js`
- `DESIGN.md`
- `README.md` if user-facing vocabulary changes

Acceptance Criteria:
- 같은 개념이 화면마다 다른 이름으로 불리지 않는다.
- 버튼만 읽어도 행동 결과를 예측할 수 있다.
- copy가 장난스럽거나 마케팅 문구처럼 길어지지 않는다.

## Phase 13. Data Integrity & State Resilience

### 13.1 Official vs Practice Stats Audit

Purpose:
소그룹 공식 학습과 기록 없는 묶음 연습의 경계가 데이터에서도 절대 섞이지 않게 한다.

Tasks:
- [ ] 소그룹 공식 학습 완료 시 `study_rounds`, `study_round_groups`, `reviews`, card stats 업데이트를 검증한다.
- [ ] 묶음 연습 완료 시 공식 이력/통계가 저장되지 않는지 검증한다.
- [ ] 약점 복습 완료 시 어떤 통계가 변해야 하는지 명확히 정한다.
- [ ] 대그룹 aggregate stats가 독립 이력처럼 계산되지 않는지 확인한다.
- [ ] 소그룹 삭제/대그룹 삭제 후 orphan round/review가 남지 않는지 확인한다.

Files:
- `app.py`
- `static/app.js`

Acceptance Criteria:
- 공식 통계는 소그룹 기준으로만 남는다.
- 묶음 연습은 완료 화면에서도 백업 데이터에서도 기록 없는 연습으로 유지된다.
- 삭제/초기화 후 남은 화면 상태가 깨지지 않는다.

### 13.2 Destructive Actions & Restore Safety

Purpose:
삭제, 초기화, 복원은 실수 비용이 크므로 별도 안전 기준을 둔다.

Tasks:
- [ ] 카드/소그룹/대그룹 삭제 dialog가 삭제 대상과 영향 범위를 명확히 말한다.
- [ ] 소그룹 학습기록 초기화와 대그룹 하위 기록 초기화의 차이를 설명한다.
- [ ] 백업 복원 전 현재 데이터가 대체된다는 점을 구체적으로 보여준다.
- [ ] 복원 실패 시 기존 데이터가 손상되지 않는지 확인한다.
- [ ] 삭제/초기화 후 선택된 collection/group/card state를 안전하게 재설정한다.

Files:
- `static/app.js`
- `app.py`

Acceptance Criteria:
- 위험 action은 한 번 더 읽고 누르게 된다.
- 복원 실패 후 앱을 새로고침해도 기존 데이터가 유지된다.
- 삭제 직후 빈 화면이나 JS error가 나오지 않는다.

### 13.3 Client State Edge Cases

Purpose:
단일 페이지 앱 상태가 탭 이동, 삭제, 복원, 검색, 학습 중단 후에도 안정적이게 한다.

Tasks:
- [ ] 선택된 대그룹/소그룹이 삭제됐을 때 fallback selection을 정의한다.
- [ ] 카드 필터와 카드 등록 form의 selected collection/group이 서로 꼬이지 않는지 확인한다.
- [ ] 학습 중 다른 탭 이동, 로그아웃, 새로고침, session 종료 흐름을 정리한다.
- [ ] 검색어가 남아 있는 상태에서 데이터가 바뀔 때 empty state가 정확한지 확인한다.
- [ ] 백업 복원 후 모든 derived state를 다시 계산한다.

Files:
- `static/app.js`

Acceptance Criteria:
- 오래 사용해도 화면 상태가 "이전 선택"에 묶여 이상하게 보이지 않는다.
- 데이터 변경 후 active tab의 list/form/filter가 정상 상태로 돌아온다.
- 콘솔 error 없이 주요 edge case를 통과한다.

### 13.4 Backup Schema & Migration Contract

Purpose:
앱 구조가 바뀌어도 백업/복원과 기존 데이터가 안전하게 이어지게 한다.

Tasks:
- [ ] 백업 JSON의 `version` 의미와 호환 범위를 문서화한다.
- [ ] 대그룹 도입 전/후 백업을 복원할 때 기대 동작을 명확히 한다.
- [ ] legacy naming을 바꿀 경우 localStorage key, header name, DB env alias의 migration path를 정한다.
- [ ] restore 시 알 수 없는 version 또는 누락 필드를 어떻게 처리할지 정의한다.
- [x] backup export 파일명도 현재 브랜드명 `byeorakchigi` 기준으로 맞춘다.

Files:
- `app.py`
- `static/app.js`
- `static/js/app-shared.js`
- `static/js/storage.js`
- `README.md`

Acceptance Criteria:
- 기존 백업을 새 버전에서 복원할 수 있는지 판단 기준이 있다.
- 브랜드/구조 rename이 사용자 데이터를 깨지 않는다.
- 백업 파일명과 내부 schema가 현재 앱 이름과 어긋나지 않는다.

## Phase 14. Performance & Large Data UX

### 14.1 List Rendering & Search Responsiveness

Purpose:
카드/소그룹이 많아져도 관리 화면이 답답하지 않게 한다.

Tasks:
- [ ] 카드 100개, 500개, 1000개 test data에서 렌더링 감각을 확인한다.
- [ ] 카드 검색 input 렌더링이 매 key 입력마다 과하게 무거워지지 않는지 확인한다.
- [ ] 대량 등록 preview가 긴 입력에서도 화면을 잠그지 않게 한다.
- [ ] 리스트 item markup과 CSS가 불필요하게 무거운 중첩을 만들지 않는지 정리한다.
- [ ] 필요 시 pagination, collapse, lightweight virtualization 중 가장 작은 개선안을 정한다.

Files:
- `static/app.js`
- `static/styles.css`
- `app.py` if API pagination/filtering becomes necessary

Acceptance Criteria:
- 500개 카드에서도 검색/필터가 사용 가능한 속도로 반응한다.
- 긴 대량 등록 입력 후에도 앱이 멈춘 느낌을 주지 않는다.
- 성능 개선 때문에 모바일 UI 밀도가 깨지지 않는다.

### 14.2 Network/Request Feedback

Purpose:
저장/삭제/학습 완료 요청이 느릴 때도 사용자가 현재 상태를 이해하게 한다.

Tasks:
- [ ] 저장/삭제/복원/학습 완료 요청 중 중복 submit을 막는다.
- [ ] pending 중인 primary button label을 상황에 맞게 바꾼다.
- [ ] 실패 시 입력값을 잃지 않고 다시 시도할 수 있게 한다.
- [ ] `request()` 공통 error handling과 화면별 inline error의 역할을 분리한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 느린 네트워크에서도 같은 카드가 중복 등록되지 않는다.
- 실패 후 사용자가 방금 입력한 내용을 다시 작성하지 않아도 된다.
- 성공/실패 feedback 위치가 화면마다 일관된다.

## Phase 15. Product QA Pass

### 15.1 Visual QA

Checklist:
- [ ] 360px mobile width에서 모든 버튼 텍스트가 들어간다.
- [ ] 390px mobile width에서 하단 nav가 안정적이다.
- [ ] 긴 대그룹/소그룹/카드 이름이 layout을 깨지 않는다.
- [ ] 일본어 긴 예문과 긴 한국어 번역이 readable하다.
- [ ] dialog가 86vh 안에서 스크롤된다.
- [ ] active/disabled/focus states가 구분된다.

### 15.2 Functional QA

Checklist:
- [ ] 로그인
- [ ] 대그룹 생성/수정/삭제
- [ ] 소그룹 생성/수정/삭제
- [ ] 카드 단일 등록/수정/삭제
- [ ] 카드 대량 등록/미리보기/중복 처리
- [ ] 소그룹 공식 학습
- [ ] 약점 복습
- [ ] 대그룹 묶음 연습
- [ ] 회독 완료 저장
- [ ] 묶음 연습 기록 미저장
- [ ] 설정 저장/초기화
- [ ] 백업/복원

### 15.3 Technical QA

Commands:

```powershell
node --check static\app.js
python -c "import os, py_compile, tempfile; p=os.path.join(tempfile.gettempdir(), 'bunpo-loop-app-check.pyc'); py_compile.compile('app.py', cfile=p, doraise=True); os.remove(p)"
git diff --check
```

Browser checks:
- local app loads at `http://127.0.0.1:8000/`
- study session starts
- card flip works
- completion screen renders
- mobile viewport screenshot review when browser tooling is available

### 15.4 Accessibility QA

Checklist:
- [ ] keyboard만으로 로그인, 탭 이동, 카드 등록, 학습 시작을 완료한다.
- [ ] dialog open/close focus 위치가 자연스럽다.
- [ ] Escape key가 confirm flow를 위험하게 만들지 않는다.
- [ ] screen reader label이 없는 icon-only button이 없다.
- [ ] 정답/오답/disabled 상태가 색상 외의 텍스트나 형태로도 구분된다.

### 15.5 Data Integrity QA

Checklist:
- [ ] 소그룹 공식 학습은 이력과 통계를 저장한다.
- [ ] 묶음 연습은 이력과 통계를 저장하지 않는다.
- [ ] 약점 복습의 통계 반영 규칙이 의도와 일치한다.
- [ ] 대그룹 aggregate는 하위 소그룹 합산으로만 보인다.
- [ ] 삭제/초기화/복원 후 orphan data와 깨진 selection이 없다.

### 15.6 Release Readiness QA

Checklist:
- [ ] README의 앱 이름, 실행 방법, 데이터 저장 위치, 백업/복원 설명이 최신이다.
- [ ] Docker Compose 실행 후 첫 화면, 로그인, 백업 경로가 문서와 일치한다.
- [ ] 기본 포트, env 변수, DB 파일/volume 이름이 설명과 맞는다.
- [ ] 브라우저 새로고침, 서버 재시작 후 데이터가 유지된다.
- [ ] release 전 `DESIGN.md`, `PLAN.md`, `AGENTS.md`가 현재 제품 방향과 충돌하지 않는다.

## Suggested Execution Order

1. Phase 1: Foundation Polish
2. Phase 12: Language Neutrality & Product Copy
3. Phase 10: Login, Loading & App Shell
4. Phase 2: Study Home
5. Phase 3: Subgroup-Centered Study UX
6. Phase 4: Study Session
7. Phase 5: Completion Loop
8. Phase 8: Empty States & First-Use Flow
9. Phase 6: Cards Tab
10. Phase 7: Groups Tab
11. Phase 9: Settings & Data Safety
12. Phase 13: Data Integrity & State Resilience
13. Phase 11: Accessibility & Interaction Reliability
14. Phase 14: Performance & Large Data UX
15. Phase 15: Product QA Pass

Reason:
먼저 디자인 토큰과 용어를 고정해야 이후 화면 수정이 흔들리지 않는다. 그 다음 로그인/로딩 shell을 제품답게 만들고, 학습 홈 > 소그룹 선택 > 학습 세션 > 완료 루프 순서로 앱의 핵심 경험을 다듬는다. 관리 화면과 설정은 그 뒤에 맞추고, 마지막으로 데이터 무결성, 접근성, 성능, 전체 QA를 통과시킨다.

## Definition Of Product-Level

벼락치기가 product-level이라고 판단하려면 다음을 만족해야 한다.

- 새 사용자가 문서 없이 첫 카드 등록과 첫 학습을 완료할 수 있다.
- 기존 사용자가 앱을 열자마자 오늘 할 학습을 알 수 있다.
- 소그룹이 공식 학습 단위임이 모든 화면에서 일관된다.
- 묶음 연습이 기록 없는 보조 기능임이 명확하다.
- 학습 카드와 예문이 모바일에서 편하게 읽힌다.
- 완료 화면이 다음 행동을 자연스럽게 제안한다.
- 빈 상태, 오류, disabled 상태가 모두 actionable하다.
- 로그인, loading, request failure가 앱 밖의 임시 상태처럼 보이지 않는다.
- 일본어/JLPT 외 학습 목적도 앱의 1급 사용 사례처럼 자연스럽다.
- keyboard, focus, screen reader, touch target 기본 품질을 만족한다.
- 삭제, 초기화, 복원은 실수하기 어렵고 실패해도 데이터가 안전하다.
- 공식 통계와 기록 없는 연습이 데이터/화면/백업에서 섞이지 않는다.
- 카드가 많이 쌓여도 검색, 필터, 대량 등록이 쓸 만한 속도를 유지한다.
- 탭, detail, back action, 스크롤 복귀가 모바일에서 예측 가능하다.
- 백업 schema, migration, 배포/보안 안내가 현재 제품과 맞는다.
- 전체 시각 언어가 `DESIGN.md`와 일치한다.

## Out Of Scope For This Plan

이번 계획에 포함하지 않는 것:

- public marketing landing page
- desktop-first wide layout
- cloud sync or multi-device account system
- social sharing, leaderboard, gamification
- native mobile app or full PWA install flow
- AI card generation

Reason:
지금 제품 수준을 결정하는 핵심은 "학습할 것을 고르고, 읽고, 답하고, 다음 행동으로 이어지는 루프"의 완성도다. 위 항목들은 나중에 제품 방향이 더 선명해진 뒤 별도 계획으로 다루는 편이 좋다.
