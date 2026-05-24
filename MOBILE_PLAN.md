# 꼬꼬회독 Mobile Improvement Plan

## Goal

꼬꼬회독을 실제 사용 환경에 맞춰 **모바일에서 가장 자연스러운 회독 학습 앱**으로 다듬는다. 기존 `PLAN.md`가 제품 전체의 완성도를 끌어올리는 계획이었다면, 이 문서는 99% 이상이 모바일에서 접속한다는 전제로 화면, 조작, 성능, 복귀 흐름, 설치/오프라인 기대치를 별도로 검증하고 개선하는 실행 계획이다.

기준은 `DESIGN.md`이며, 방향은 그대로 유지한다: 밝은 캔버스, 얇은 선, 민트 포인트, 8px radius, 읽기 좋은 카드 UI, 하단 탭 중심의 한 손 조작.

## Product Assumptions

- 주요 기기: 360-430px 폭의 모바일 브라우저.
- 주요 자세: 한 손으로 짧게 열어 이어서 학습한다.
- 주요 세션: 1-5분 단위의 회독, 약점 복습, 카드 추가/수정.
- 주요 입력: 모바일 키보드, select picker, 터치 탭/스크롤.
- 주요 이탈/복귀: 브라우저 뒤로가기, 홈 화면 전환, 잠금 해제, 탭 재진입.
- 주요 브라우저: iOS Safari, Android Chrome. 주소창 show/hide, 입력 focus 확대, dynamic viewport height 차이를 고려한다.
- 공식 기록: 소그룹 학습만 저장한다.
- 보조 학습: 묶음 연습과 약점 복습은 공식 통계와 분리한다.

## Design Baseline

모바일 개선은 새 스타일을 만드는 작업이 아니라, `DESIGN.md`의 모바일 우선 규칙을 실제 화면에서 끝까지 지키는 작업이다.

Core mobile rules:
- 앱 shell은 모바일 중심 max-width를 유지한다.
- 하단 nav는 고정이며 safe area를 침범하지 않는다.
- active session 중에는 앱 헤더와 하단 nav를 숨긴다.
- 모든 주요 터치 대상은 최소 44px을 확보한다.
- dialog는 모바일에서 bottom sheet처럼 느껴져야 한다.
- 버튼 텍스트는 360px 폭에서도 넘치지 않아야 한다.
- 설명 문구는 필요한 곳에만 보이고, 부가 설명은 inline help로 숨긴다.

## Current Mobile Assessment

### Strong

- 하단 5탭 구조가 모바일 앱처럼 명확하다.
- 학습 세션은 헤더/nav를 숨겨 집중 모드로 전환된다.
- safe-area padding과 44px 터치 타깃 기준이 상당 부분 반영돼 있다.
- `PLAN.md`의 제품 polish가 완료되어 정보 구조의 큰 흔들림은 적다.
- 설명이 많은 영역을 inline help로 옮기는 방향이 시작됐다.

### Mobile Risks

- 360/390/430px 실제 viewport에서 모든 주요 화면을 반복 검증하는 기준이 별도 문서로 없다.
- 브라우저 뒤로가기, detail 진입/복귀, 탭 이동, 스크롤 복귀 흐름이 모바일 기준으로 충분히 정리되지 않았다.
- 학습 세션에서 긴 카드, 긴 예문, 버튼 바, landscape, 작은 화면 키보드 환경을 더 촘촘히 검증해야 한다.
- 설정/카드 등록/대량 등록처럼 입력이 많은 화면은 모바일 키보드가 올라왔을 때의 안정성이 중요하다.
- dialog와 bottom sheet가 작은 화면에서 86vh 안에 자연스럽게 들어가는지 기능별로 다시 봐야 한다.
- 카드 수가 많아졌을 때 모바일에서 검색, 필터, 목록 스크롤이 체감상 충분히 빠른지 확인해야 한다.
- PWA 설치, 아이콘, 오프라인 안내는 현재 제품 기대치에 맞춰 별도 판단이 필요하다.

## Working Rules

- 완료한 작업은 `[ ]`를 `[x]`로 바꾼다.
- 한 phase 안의 모든 하위 항목이 끝나면 phase도 체크한다.
- UI 변경 전에는 `DESIGN.md`를 먼저 확인한다.
- 모바일 UI 변경은 최소 360px, 390px viewport에서 확인한다.
- 체크리스트는 코드만 보고 체크하지 않고, 실제 화면 또는 자동화된 viewport 검사 결과가 있을 때만 완료 처리한다.
- 학습/기록 관련 변경은 공식 소그룹 기록과 기록 없는 연습의 분리를 다시 확인한다.
- 각 작업 단위가 끝나면 `main`에 commit & push한다.

## Progress Tracker

- [ ] Phase 1. Mobile Viewport Baseline
  - [ ] 1.1 Viewport QA Matrix
  - [x] 1.2 Safe Area & Fixed Chrome
  - [x] 1.3 Mobile Browser Quirks
- [ ] Phase 2. One-Hand Navigation
  - [ ] 2.1 Back & Return Flow
  - [ ] 2.2 Tab State & Scroll Restoration
  - [ ] 2.3 Resume & Session Continuity
- [ ] Phase 3. Study Session Ergonomics
  - [ ] 3.1 Card Reading & Flip Comfort
  - [ ] 3.2 Answer Bar & Completion Flow
- [ ] Phase 4. Mobile Forms & Keyboard
  - [ ] 4.1 Settings Form Pass
  - [ ] 4.2 Card Creation Form Pass
  - [ ] 4.3 Bulk Input Pass
- [ ] Phase 5. Dialogs & Bottom Sheets
  - [ ] 5.1 Core Dialog Pass
  - [ ] 5.2 Dense Picker Pass
- [ ] Phase 6. Mobile Performance
  - [ ] 6.1 Large List Responsiveness
  - [ ] 6.2 Loading & Network Feedback
- [ ] Phase 7. Touch & Accessibility
  - [ ] 7.1 Touch Target Audit
  - [ ] 7.2 Screen Reader & Focus Audit
  - [ ] 7.3 Motion & Scroll Preferences
- [ ] Phase 8. PWA & Offline Readiness
  - [ ] 8.1 Install Surface
  - [ ] 8.2 Offline Behavior
- [ ] Phase 9. Mobile Release QA
  - [ ] 9.1 Real-Device Checklist
  - [ ] 9.2 Final Regression Pass

## Phase 1. Mobile Viewport Baseline

### 1.1 Viewport QA Matrix

Purpose:
모바일 개선의 기준 화면 폭을 명시하고, 이후 변경이 같은 기준으로 검증되게 한다.

Tasks:
- [x] 360px, 390px, 430px, 768px viewport를 기본 QA 폭으로 정한다.
- [x] 학습, 묶음, 카드, 통계, 설정 화면을 각 폭에서 확인한다.
- [ ] 로그인 화면을 사용 중인 세션을 해치지 않는 방식으로 각 폭에서 확인한다.
- [x] 360px에서 버튼 텍스트, badge, select, 하단 nav label이 넘치지 않는지 확인한다.
- [x] 390px에서 실제 주력 모바일 화면처럼 전체 밀도와 tap flow를 확인한다.
- [x] 768px에서는 앱이 데스크톱 사이트처럼 과하게 넓어지지 않는지 확인한다.

Files:
- `static/styles.css`
- `static/app.js` only if markup changes are needed
- `DESIGN.md` only if the QA baseline becomes a permanent design rule

Acceptance Criteria:
- 모든 주요 화면이 360px에서 horizontal overflow 없이 동작한다.
- 하단 nav, sticky action, dialog가 viewport 폭 변화로 흔들리지 않는다.
- 390px에서 첫 화면의 primary action이 한눈에 보인다.

Verification:
- 360/390/430/768px viewport 자동 검사에서 학습, 묶음, 카드, 통계, 설정 화면 모두 horizontal overflow 0건.
- 360/390/430/768px viewport 자동 검사에서 버튼, 입력, select, badge overflow 0건.
- 768px에서 app shell과 bottom nav가 560px 모바일 폭을 유지함.
- 로그인 화면은 현재 세션을 로그아웃시키지 않기 위해 남겨둠.

### 1.2 Safe Area & Fixed Chrome

Purpose:
iOS/Android 브라우저의 safe area, 주소창 변화, 하단 nav 고정 상태에서도 주요 액션이 가려지지 않게 한다.

Tasks:
- [x] `env(safe-area-inset-bottom)` 적용 위치를 app shell, bottom nav, toast, sticky action에서 점검한다.
- [x] active session의 answer bar가 하단 safe area 위에 안정적으로 놓이는지 확인한다.
- [x] toast가 하단 nav나 answer bar를 가리지 않는지 확인한다.
- [x] dialog bottom sheet가 safe area와 겹치지 않는지 확인한다.

Files:
- `static/styles.css`

Acceptance Criteria:
- iOS Safari 기준 하단 영역에서 버튼이 홈 인디케이터에 붙지 않는다.
- toast와 하단 nav가 서로 겹치지 않는다.
- 학습 중 정답/오답 버튼이 항상 누르기 쉬운 위치에 있다.

Verification:
- 390px active session에서 header/nav가 숨겨지고 study action bar가 card 아래 안정적으로 배치됨.
- 390px 포기 dialog가 bottom sheet 위치로 열리고 viewport 하단 safe padding 안에 유지됨.
- 390px 설정 저장 toast가 bottom nav와 겹치지 않음.

### 1.3 Mobile Browser Quirks

Purpose:
iOS Safari와 Android Chrome의 모바일 웹 특성을 앱 품질 기준 안에 명시한다.

Tasks:
- [x] viewport meta가 모바일 확대/축소, safe area, installed mode에 적절한지 확인한다.
- [x] input, select, textarea의 font-size가 iOS focus 확대를 유발하지 않는지 확인한다.
- [x] `100vh` 사용 여부를 점검하고, 필요한 곳은 `100dvh`/fallback 또는 layout-safe 방식으로 조정한다.
- [x] 주소창 show/hide 후 fixed bottom nav, dialog, active session 높이가 갑자기 튀지 않는지 확인한다.
- [x] pull-to-refresh, overscroll, momentum scroll이 dialog와 내부 scroll 영역에서 어색하지 않은지 확인한다.

Files:
- `static/index.html`
- `static/styles.css`

Acceptance Criteria:
- iOS Safari에서 입력 focus 시 의도치 않은 zoom이 발생하지 않는다.
- 주소창 높이 변화에도 하단 nav와 answer bar가 주요 콘텐츠를 가리지 않는다.
- dialog 내부 스크롤이 페이지 전체 스크롤과 헷갈리지 않는다.

Verification:
- viewport meta는 `viewport-fit=cover`를 유지함.
- 360/390/430/768px 검사에서 input/select/textarea font-size 최소값 16px.
- app shell과 study shell에 `100dvh` fallback을 추가함.
- dialog/list 내부 scroll 영역은 `overscroll-behavior: contain`을 유지함.

## Phase 2. One-Hand Navigation

### 2.1 Back & Return Flow

Purpose:
모바일 브라우저의 뒤로가기와 앱 내부 돌아가기가 사용자의 기대와 맞게 동작하게 한다.

Tasks:
- [ ] 대그룹 detail에서 뒤로가면 묶음 탭 목록으로 돌아온다.
- [ ] 통계에서 약점 복습을 시작한 뒤 포기하면 통계로 돌아온다.
- [ ] 학습 홈에서 시작한 학습은 포기/완료 후 학습 홈 맥락으로 돌아온다.
- [ ] 카드 preview/detail dialog를 닫으면 원래 목록 위치와 focus가 자연스럽다.
- [ ] 브라우저 back button과 앱 내부 back action의 역할이 충돌하지 않는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css` if visual affordance changes are needed

Acceptance Criteria:
- 사용자가 "어디서 시작했는지"를 앱이 기억하는 느낌이 든다.
- 포기 action이 항상 이전 맥락으로 돌아가는 흐름을 가진다.
- 모바일 뒤로가기에서 빈 화면이나 잘못된 탭 상태가 나오지 않는다.

### 2.2 Tab State & Scroll Restoration

Purpose:
탭 이동과 detail 복귀 후 사용자가 보던 위치를 잃지 않게 한다.

Tasks:
- [ ] 각 탭의 주요 scroll position 보존 필요 여부를 정한다.
- [ ] 묶음/카드/통계 탭에서 detail 또는 dialog를 닫은 뒤 목록 위치가 유지되는지 확인한다.
- [ ] 검색어, 필터, select 상태가 탭 이동 후 기대한 만큼 유지되는지 확인한다.
- [ ] 새 데이터를 저장한 뒤에는 필요한 경우만 목록을 재정렬하거나 top으로 이동한다.

Files:
- `static/app.js`

Acceptance Criteria:
- 목록에서 항목 하나를 보고 돌아왔을 때 처음부터 다시 찾지 않아도 된다.
- 탭 이동이 reset처럼 느껴지지 않는다.
- 저장 직후 변경된 항목이 어디에 반영됐는지 알 수 있다.

### 2.3 Resume & Session Continuity

Purpose:
모바일에서 앱을 잠깐 나갔다가 돌아왔을 때 학습 맥락과 데이터 상태가 믿을 만하게 유지되게 한다.

Tasks:
- [ ] active session 중 화면 잠금/앱 전환 후 돌아왔을 때 현재 카드와 진행률이 유지되는지 확인한다.
- [ ] 학습 중 새로고침 또는 브라우저 재진입 시 사용자가 잃는 정보가 무엇인지 제품적으로 정한다.
- [ ] 저장/삭제 요청 중 앱을 벗어났다가 돌아오는 경우 pending state와 toast가 어색하지 않은지 확인한다.
- [ ] 인증 또는 사용자 상태가 만료됐을 때 모바일에서 다시 로그인하는 흐름이 막히지 않는지 확인한다.
- [ ] 오래 머문 탭으로 돌아왔을 때 데이터 재동기화가 필요한지 판단한다.

Files:
- `static/app.js`
- backend/session files only if behavior requires server changes

Acceptance Criteria:
- 잠깐 다른 앱을 보고 돌아와도 사용자가 현재 위치를 이해할 수 있다.
- 저장 여부가 불확실한 상태를 만들지 않는다.
- 세션 만료나 재연결이 학습 기록을 잘못 저장하지 않는다.

## Phase 3. Study Session Ergonomics

### 3.1 Card Reading & Flip Comfort

Purpose:
학습 세션이 작은 화면에서도 읽기 쉽고, 한 손으로 넘기기 쉬운 경험이 되게 한다.

Tasks:
- [ ] 짧은 카드, 긴 카드, 긴 예문, 메모가 있는 카드를 각각 확인한다.
- [ ] 카드 tap area가 flip action으로 충분히 예측 가능하게 동작하는지 확인한다.
- [ ] 앞면/뒷면 전환 시 레이아웃이 크게 튀지 않는지 점검한다.
- [ ] landscape 또는 낮은 높이 viewport에서 카드와 answer bar가 함께 보이는지 확인한다.
- [ ] 일본어/한글 혼합 텍스트가 작은 화면에서 과하게 빽빽하지 않은지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 360px 폭에서도 카드 본문과 예문을 편하게 읽을 수 있다.
- 카드 flip과 정답/오답 action이 서로 오작동처럼 느껴지지 않는다.
- 긴 내용이 있어도 answer bar가 밀려 사라지지 않는다.

### 3.2 Answer Bar & Completion Flow

Purpose:
정답/오답 선택과 완료 후 다음 행동이 모바일 엄지 영역에서 안정적으로 이어지게 한다.

Tasks:
- [ ] 정답/오답 버튼의 위치, 높이, label 길이를 360px에서 확인한다.
- [ ] 정답/오답 피드백이 버튼 위치를 흔들지 않는지 확인한다.
- [ ] 마지막 카드 후 완료 화면으로 넘어가는 전환이 즉시 이해되는지 확인한다.
- [ ] 완료 화면의 주요 CTA가 한 손 조작 영역 안에 들어오는지 확인한다.
- [ ] 약점 복습 완료는 공식 기록 완료와 다르게 보이는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 학습 중 가장 많이 누르는 버튼이 항상 같은 곳에 있다.
- 완료 화면에서 "다음에 무엇을 할지"가 설명 없이 보인다.
- 기록 없는 학습이 공식 회독처럼 보이지 않는다.

## Phase 4. Mobile Forms & Keyboard

### 4.1 Settings Form Pass

Purpose:
목표 이름, 목표일, 약점 기준, 데이터 관리가 모바일 입력 환경에서 부담 없이 동작하게 한다.

Tasks:
- [ ] 목표 이름 input focus 시 화면이 자연스럽게 스크롤되는지 확인한다.
- [ ] 목표일 select 3개가 360px에서 보기 좋게 배치되는지 확인한다.
- [ ] inline help가 작은 화면에서 label과 겹치지 않는지 확인한다.
- [ ] 저장 버튼이 키보드에 가려지거나 너무 멀지 않은지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 설정 변경은 모바일에서 확대 없이 끝낼 수 있다.
- help icon은 눈에 거슬리지 않지만 눌렀을 때 충분히 읽힌다.
- 부가 설명이 다시 화면을 무겁게 만들지 않는다.

### 4.2 Card Creation Form Pass

Purpose:
카드 한 장을 빠르게 추가하고 수정하는 흐름을 모바일에서 편하게 만든다.

Tasks:
- [ ] 대그룹/소그룹 dependent select가 모바일에서 순서대로 이해되는지 확인한다.
- [ ] 앞면/뒷면/메모 textarea focus와 scroll 위치를 점검한다.
- [ ] 저장 후 다음 카드 입력을 이어갈지, 목록으로 돌아갈지 흐름을 확인한다.
- [ ] validation message가 키보드나 sticky action과 겹치지 않는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 카드 추가가 손가락 이동이 적은 반복 작업처럼 느껴진다.
- select와 textarea 사이의 맥락이 끊기지 않는다.
- 오류 메시지가 입력 위치 근처에서 이해된다.

### 4.3 Bulk Input Pass

Purpose:
대량 등록이 모바일에서도 최소한 읽고 수정 가능한 보조 도구로 동작하게 한다.

Tasks:
- [ ] 대량 등록 형식 도움말을 inline help 또는 compact disclosure로 정리한다.
- [ ] textarea 높이와 preview/error 영역이 작은 화면에서 균형을 잃지 않는지 확인한다.
- [ ] 긴 오류 목록이 전체 화면을 밀어내지 않도록 max-height와 scroll을 점검한다.
- [ ] 모바일에서는 대량 등록이 보조 기능임을 밀도와 CTA 위계로 드러낸다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 대량 등록 화면이 문서처럼 길어 보이지 않는다.
- 오류가 많아도 저장/취소 흐름이 가려지지 않는다.
- 한 장 등록 흐름보다 더 중요해 보이지 않는다.

## Phase 5. Dialogs & Bottom Sheets

### 5.1 Core Dialog Pass

Purpose:
확인, 삭제, preview, 기록 상세 dialog가 모바일 bottom sheet처럼 안정적으로 동작하게 한다.

Tasks:
- [ ] 모든 dialog의 max-height가 86vh 안에서 작동하는지 확인한다.
- [ ] close, cancel, confirm 버튼 순서가 `DESIGN.md`와 맞는지 확인한다.
- [ ] 삭제 confirm은 대상 이름과 영향 범위를 작은 화면에서도 명확히 보여준다.
- [ ] dialog open/close 후 focus가 trigger로 자연스럽게 돌아오는지 확인한다.
- [ ] backdrop tap, Escape, close button 동작을 dialog 성격별로 점검한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- dialog가 모바일에서 중앙 모달보다 bottom sheet에 가깝게 느껴진다.
- 위험 action을 실수로 누를 가능성이 낮다.
- dialog 내부 스크롤과 바깥 화면 스크롤이 충돌하지 않는다.

### 5.2 Dense Picker Pass

Purpose:
묶음 연습 소그룹 선택처럼 항목이 많은 picker가 모바일에서 부담 없이 작동하게 한다.

Tasks:
- [ ] 소그룹 체크리스트의 행 높이와 tap area를 확인한다.
- [ ] selected count, disabled state, 기록 없음 안내가 과하게 길지 않은지 확인한다.
- [ ] 항목이 많을 때 내부 스크롤이 안정적인지 확인한다.
- [ ] 시작 CTA가 선택 리스트 아래에서 사라지지 않는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 여러 소그룹을 선택해도 dialog가 무겁게 느껴지지 않는다.
- 기록 없는 연습이라는 사실이 작지만 명확하게 남아 있다.
- 시작 버튼이 선택 작업 뒤에 자연스럽게 보인다.

## Phase 6. Mobile Performance

### 6.1 Large List Responsiveness

Purpose:
카드와 소그룹이 많아졌을 때도 모바일에서 스크롤과 검색이 빠르게 느껴지게 한다.

Tasks:
- [ ] 100/500/1000장 카드 데이터로 카드 탭 검색과 필터를 확인한다.
- [ ] 긴 카드 목록에서 렌더링이 느리면 pagination, windowing, incremental render 중 하나를 검토한다.
- [ ] 검색 입력 debounce가 모바일 키보드 입력에 자연스러운지 확인한다.
- [ ] 통계 목록과 회독 상세 목록도 같은 기준으로 점검한다.

Files:
- `static/app.js`
- `static/styles.css` if loading skeleton or list density changes are needed

Acceptance Criteria:
- 500장 수준에서도 검색 입력 후 앱이 멈춘 것처럼 보이지 않는다.
- 성능 개선 때문에 카드 정보 위계가 깨지지 않는다.
- 빈 결과와 loading 상태가 명확하다.

### 6.2 Loading & Network Feedback

Purpose:
모바일 네트워크가 느리거나 불안정할 때도 사용자가 앱 상태를 이해하게 한다.

Tasks:
- [ ] 초기 로딩, 저장 중, 삭제 중, 복원 중 상태가 모바일에서 분명한지 확인한다.
- [ ] 버튼 pending state가 중복 submit을 막는지 확인한다.
- [ ] 네트워크 실패 toast가 하단 nav 또는 answer bar와 겹치지 않는지 확인한다.
- [ ] offline-like 상황에서 사용자가 재시도할 수 있는 경로를 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 느린 작업에서 같은 버튼을 여러 번 누르고 싶지 않게 된다.
- 실패 메시지가 짧고 행동 가능하다.
- toast가 주요 action을 가리지 않는다.

## Phase 7. Touch & Accessibility

### 7.1 Touch Target Audit

Purpose:
작은 아이콘과 보조 action까지 모바일 손가락으로 안정적으로 누를 수 있게 한다.

Tasks:
- [ ] 하단 nav, 주요 CTA, ghost/secondary button, search clear action을 확인한다.
- [ ] inline help icon의 시각 크기와 실제 tap target을 분리해 44px 기준을 만족시킨다.
- [ ] checkbox row는 checkbox 자체보다 row 전체가 눌리는지 확인한다.
- [ ] 위험 action은 다른 action과 충분히 떨어져 있는지 확인한다.

Files:
- `static/styles.css`
- `static/app.js` if hit area markup changes are needed

Acceptance Criteria:
- 360px 화면에서 엄지로 주요 action을 놓치지 않는다.
- 작은 icon button도 실제 tap target은 충분하다.
- destructive action은 실수로 눌리기 어렵다.

### 7.2 Screen Reader & Focus Audit

Purpose:
모바일 접근성의 기본 신뢰도를 유지한다.

Tasks:
- [ ] form label과 input/select 연결을 확인한다.
- [ ] icon-only button의 accessible name을 확인한다.
- [ ] active tab, selected subgroup, disabled reason이 의미로 전달되는지 확인한다.
- [ ] dialog title/description/focus trap이 안정적인지 확인한다.
- [ ] keyboard만으로 로그인, 카드 추가, 학습 시작, dialog close를 수행한다.

Files:
- `static/app.js`
- `static/index.html`
- `static/styles.css`

Acceptance Criteria:
- 화면 낭독으로 현재 위치와 주요 action을 이해할 수 있다.
- focus ring이 보이고, focus가 예기치 않게 사라지지 않는다.
- 설명을 숨긴 help도 접근 가능한 이름과 상태를 가진다.

### 7.3 Motion & Scroll Preferences

Purpose:
모바일에서 작은 animation과 scroll 보정이 편안하게 느껴지도록 한다.

Tasks:
- [ ] `prefers-reduced-motion` 환경에서 essential action이 animation에 의존하지 않는지 확인한다.
- [ ] smooth scroll, focus scroll, dialog transition이 과하거나 어지럽지 않은지 확인한다.
- [ ] active session에서 card flip이나 feedback transition이 버튼 위치를 흔들지 않는지 확인한다.
- [ ] scroll restoration 또는 focus 이동이 사용자를 갑자기 화면 밖으로 보내지 않는지 확인한다.

Files:
- `static/styles.css`
- `static/app.js` if scroll behavior changes are needed

Acceptance Criteria:
- 모션을 줄인 환경에서도 모든 정보를 이해할 수 있다.
- 화면 전환이 가볍고 예측 가능하다.
- scroll/focus 보정이 사용자의 현재 작업을 방해하지 않는다.

## Phase 8. PWA & Offline Readiness

### 8.1 Install Surface

Purpose:
모바일에서 홈 화면에 추가했을 때 앱처럼 보이는 최소 기준을 맞춘다.

Tasks:
- [ ] manifest name, short_name, theme_color, background_color를 확인한다.
- [ ] `logo-192.png`, apple touch icon, favicon이 현재 앱 이름과 맞는지 확인한다.
- [ ] installed display mode에서 상단/하단 safe area가 어색하지 않은지 확인한다.
- [ ] 설치를 강요하는 UI를 만들지 않고, 필요하면 설정이나 안내에 조용히 둔다.

Files:
- `static/manifest.webmanifest`
- `static/index.html`
- `static/assets/*` only if asset changes are needed

Acceptance Criteria:
- 홈 화면 아이콘과 앱 이름이 꼬꼬회독으로 자연스럽다.
- 설치 후 첫 화면이 마케팅 랜딩이 아니라 학습 홈이다.
- 브라우저와 설치형 실행 모두에서 layout이 깨지지 않는다.

### 8.2 Offline Behavior

Purpose:
오프라인 전체 지원 여부와 관계없이, 모바일 사용자가 실패 상태를 이해하게 한다.

Tasks:
- [ ] 현재 앱이 오프라인 학습을 지원하는지 제품적으로 판단한다.
- [ ] 지원하지 않는다면 명확한 offline/error 안내와 재시도 경로를 둔다.
- [ ] 지원한다면 service worker, cache, sync, 데이터 충돌 정책을 별도 phase로 확장한다.
- [ ] 백업/복원과 오프라인 기대치가 충돌하지 않는지 확인한다.

Files:
- `static/app.js`
- `static/index.html`
- `static/manifest.webmanifest`
- service worker file only if introduced

Acceptance Criteria:
- 네트워크가 끊겼을 때 앱이 조용히 실패하지 않는다.
- 사용자가 데이터가 저장됐는지 아닌지 오해하지 않는다.
- full offline 지원이 아니라면 그 한계를 제품 안에서 숨기지 않는다.

## Phase 9. Mobile Release QA

### 9.1 Real-Device Checklist

Purpose:
브라우저 viewport 테스트를 실제 기기 감각으로 보완한다.

Tasks:
- [ ] iPhone Safari에서 로그인, 학습 시작, 정답/오답, 완료, 포기를 확인한다.
- [ ] Android Chrome에서 카드 추가, select, textarea, dialog를 확인한다.
- [ ] 주소창 show/hide 후 fixed bottom nav와 answer bar 위치를 확인한다.
- [ ] 홈 화면 추가 실행이 가능하다면 installed mode를 확인한다.
- [ ] 느린 네트워크 또는 절전 모드에서 loading feedback을 확인한다.

Files:
- No direct file requirement unless issues are found

Acceptance Criteria:
- 실제 기기에서 "웹앱이라 어색한" 순간이 줄어든다.
- 핵심 학습 루프는 한 손으로 끝까지 진행된다.
- 발견된 문제는 이 문서의 해당 phase로 되돌려 반영한다.

### 9.2 Final Regression Pass

Purpose:
모바일 개선이 기존 제품 규칙을 깨지 않았는지 마지막으로 확인한다.

Tasks:
- [ ] 공식 소그룹 학습 기록이 정상 저장되는지 확인한다.
- [ ] 묶음 연습과 약점 복습이 공식 통계에 섞이지 않는지 확인한다.
- [ ] 백업/복원 후 모바일 화면 상태가 깨지지 않는지 확인한다.
- [ ] 모든 주요 화면을 360px, 390px, 430px에서 다시 본다.
- [ ] `node --check static/app.js`와 가능한 브라우저 smoke test를 통과한다.

Files:
- `static/app.js`
- `static/styles.css`
- related backend/db files only if touched

Acceptance Criteria:
- 모바일 개선 후에도 제품의 데이터 규칙이 유지된다.
- 핵심 화면에 horizontal overflow, 가려진 CTA, 읽기 어려운 설명이 없다.
- `MOBILE_PLAN.md`의 모든 체크가 실제 확인 결과와 맞다.
