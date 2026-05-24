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

- [x] Phase 1. Mobile Viewport Baseline
  - [x] 1.1 Viewport QA Matrix
  - [x] 1.2 Safe Area & Fixed Chrome
  - [x] 1.3 Mobile Browser Quirks
- [x] Phase 2. One-Hand Navigation
  - [x] 2.1 Back & Return Flow
  - [x] 2.2 Tab State & Scroll Restoration
  - [x] 2.3 Resume & Session Continuity
- [x] Phase 3. Study Session Ergonomics
  - [x] 3.1 Card Reading & Flip Comfort
  - [x] 3.2 Answer Bar & Completion Flow
- [x] Phase 4. Mobile Forms & Keyboard
  - [x] 4.1 Settings Form Pass
  - [x] 4.2 Card Creation Form Pass
  - [x] 4.3 Bulk Input Pass
- [x] Phase 5. Dialogs & Bottom Sheets
  - [x] 5.1 Core Dialog Pass
  - [x] 5.2 Dense Picker Pass
- [x] Phase 6. Mobile Performance
  - [x] 6.1 Large List Responsiveness
  - [x] 6.2 Loading & Network Feedback
- [ ] Phase 7. Touch & Accessibility
  - [x] 7.1 Touch Target Audit
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
- [x] 로그인 화면을 사용 중인 세션을 해치지 않는 방식으로 각 폭에서 확인한다.
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
- 로그인 화면은 테스트 탭에서 로그아웃 후 같은 기본 로그인 값으로 재진입하는 방식으로 360/390/430/768px 검증 완료.
- 로그인 화면에서도 horizontal overflow 0건, 16px 미만 입력 0건, 44px 미만 터치 타깃 0건.

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
- [x] 대그룹 detail에서 뒤로가면 묶음 탭 목록으로 돌아온다.
- [x] 통계에서 약점 복습을 시작한 뒤 포기하면 통계로 돌아온다.
- [x] 학습 홈에서 시작한 학습은 포기/완료 후 학습 홈 맥락으로 돌아온다.
- [x] 카드 preview/detail dialog를 닫으면 원래 목록 위치와 focus가 자연스럽다.
- [x] 브라우저 back button과 앱 내부 back action의 역할이 충돌하지 않는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css` if visual affordance changes are needed

Acceptance Criteria:
- 사용자가 "어디서 시작했는지"를 앱이 기억하는 느낌이 든다.
- 포기 action이 항상 이전 맥락으로 돌아가는 흐름을 가진다.
- 모바일 뒤로가기에서 빈 화면이나 잘못된 탭 상태가 나오지 않는다.

Verification:
- 대그룹 상세 화면에서 브라우저 뒤로가기를 누르면 묶음 탭의 대그룹 목록으로 복귀함.
- 통계에서 약점 복습 시작 후 브라우저 뒤로가기를 누르면 저장되지 않는다는 확인 dialog가 먼저 뜨고, 확인 시 통계로 복귀함.
- 활성 학습 중 브라우저 뒤로가기는 즉시 이탈하지 않고 `학습을 종료하고 돌아갈까요?` 확인 dialog를 띄움.
- 학습 홈에서 소그룹 회독 시작 후 포기하면 같은 소그룹 학습 설정 화면으로 복귀함.
- 카드 preview dialog를 닫으면 원래 preview 버튼으로 focus가 돌아옴.

### 2.2 Tab State & Scroll Restoration

Purpose:
탭 이동과 detail 복귀 후 사용자가 보던 위치를 잃지 않게 한다.

Tasks:
- [x] 각 탭의 주요 scroll position 보존 필요 여부를 정한다.
- [x] 묶음/카드/통계 탭에서 detail 또는 dialog를 닫은 뒤 목록 위치가 유지되는지 확인한다.
- [x] 검색어, 필터, select 상태가 탭 이동 후 기대한 만큼 유지되는지 확인한다.
- [x] 새 데이터를 저장한 뒤에는 필요한 경우만 목록을 재정렬하거나 top으로 이동한다.

Files:
- `static/app.js`

Acceptance Criteria:
- 목록에서 항목 하나를 보고 돌아왔을 때 처음부터 다시 찾지 않아도 된다.
- 탭 이동이 reset처럼 느껴지지 않는다.
- 저장 직후 변경된 항목이 어디에 반영됐는지 알 수 있다.

Verification:
- 하단 탭 전환 시 현재 탭의 scroll key를 저장하고, 복귀한 탭의 scroll position을 복원하도록 공통 처리함.
- 390px에서 묶음 탭을 스크롤한 뒤 카드 탭을 거쳐 돌아왔을 때 묶음 탭 scrollY가 유지됨.
- 390px에서 통계 기간 필터 `30일`과 통계 탭 scrollY가 탭 왕복 후 유지됨.
- 390px에서 카드 검색어 `N1`과 카드 탭 scrollY가 탭 왕복 후 유지됨.
- 대그룹/detail, 카드 form/list는 기존 저장/취소/복귀 흐름을 유지하고, 저장 후에는 변경 내용을 확인할 수 있는 목록/상세 맥락으로 돌아감.

### 2.3 Resume & Session Continuity

Purpose:
모바일에서 앱을 잠깐 나갔다가 돌아왔을 때 학습 맥락과 데이터 상태가 믿을 만하게 유지되게 한다.

Tasks:
- [x] active session 중 화면 잠금/앱 전환 후 돌아왔을 때 현재 카드와 진행률이 유지되는지 확인한다.
- [x] 학습 중 새로고침 또는 브라우저 재진입 시 사용자가 잃는 정보가 무엇인지 제품적으로 정한다.
- [x] 저장/삭제 요청 중 앱을 벗어났다가 돌아오는 경우 pending state와 toast가 어색하지 않은지 확인한다.
- [x] 인증 또는 사용자 상태가 만료됐을 때 모바일에서 다시 로그인하는 흐름이 막히지 않는지 확인한다.
- [x] 오래 머문 탭으로 돌아왔을 때 데이터 재동기화가 필요한지 판단한다.

Files:
- `static/app.js`
- backend/session files only if behavior requires server changes

Acceptance Criteria:
- 잠깐 다른 앱을 보고 돌아와도 사용자가 현재 위치를 이해할 수 있다.
- 저장 여부가 불확실한 상태를 만들지 않는다.
- 세션 만료나 재연결이 학습 기록을 잘못 저장하지 않는다.

Verification:
- `visibilitychange`로 앱을 벗어난 시점을 기록하고, 5분 이상 지난 뒤 안전한 읽기 화면으로 돌아오면 `loadData()`로 최신 데이터를 다시 확인한다.
- `pageshow.persisted`로 BFCache 복귀가 감지되면 시간 조건 없이 같은 안전성 검사를 거쳐 최신 데이터를 확인한다.
- 저장되지 않은 active session, dialog, pending request, 설정 화면, 카드 form, 대그룹 detail/form 화면에서는 자동 재동기화를 건너뛰어 입력값과 진행 중인 학습을 덮어쓰지 않는다.
- 학습 중 새로고침은 진행 중인 답변 상태를 복원하지 않는 것으로 정리했다. 기존 `beforeunload` 경고로 실수 새로고침을 막고, 공식 기록은 완료 저장 시점에만 쌓는다.
- 인증 만료는 기존 `handleLoadDataError()` 경로를 그대로 사용해 저장된 사용자를 정리하고 로그인 화면으로 돌려보낸다.
- 390px 로컬 앱에서 통계 탭 진입과 일반 회독 session 시작 화면을 확인했고, `static/app.js` 문법 검사를 통과했다. 인앱 브라우저 연결이 중간에 끊겨 lifecycle 이벤트의 시각 검증은 코드 경로 검토와 정적 검사로 보완했다.

## Phase 3. Study Session Ergonomics

### 3.1 Card Reading & Flip Comfort

Purpose:
학습 세션이 작은 화면에서도 읽기 쉽고, 한 손으로 넘기기 쉬운 경험이 되게 한다.

Tasks:
- [x] 짧은 카드, 긴 카드, 긴 예문, 메모가 있는 카드를 각각 확인한다.
- [x] 카드 tap area가 flip action으로 충분히 예측 가능하게 동작하는지 확인한다.
- [x] 앞면/뒷면 전환 시 레이아웃이 크게 튀지 않는지 점검한다.
- [x] landscape 또는 낮은 높이 viewport에서 카드와 answer bar가 함께 보이는지 확인한다.
- [x] 일본어/한글 혼합 텍스트가 작은 화면에서 과하게 빽빽하지 않은지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 360px 폭에서도 카드 본문과 예문을 편하게 읽을 수 있다.
- 카드 flip과 정답/오답 action이 서로 오작동처럼 느껴지지 않는다.
- 긴 내용이 있어도 answer bar가 밀려 사라지지 않는다.

Verification:
- active study mode를 viewport 높이 안의 grid layout으로 바꾸고, 카드 영역만 내부 스크롤되게 해 긴 뒷면/메모/예문이 answer bar를 밀어내지 않도록 했다.
- 앞면 카드에는 명시적인 `aria-label`을 추가해 카드 전체 tap이 뜻 보기 동작임을 보조 기술에도 드러나게 했다.
- 360px 이하에서도 정답/오답 버튼은 label이 짧아 2열을 유지하도록 했고, 낮은 높이 viewport에서는 카드 padding과 앞면 최소 높이를 줄인다.
- 일본어/한글 혼합 카드의 줄간격은 유지하고, 낮은 높이에서만 앞면 글자 크기를 단계적으로 낮춰 답변 영역과 함께 보이게 했다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200 응답 확인을 통과했다. 이 환경의 헤드리스 Chrome/Edge가 권한 문제로 종료되어 실제 스크린샷 검증은 다음 브라우저 가능 시점에 다시 보는 항목으로 남긴다.

### 3.2 Answer Bar & Completion Flow

Purpose:
정답/오답 선택과 완료 후 다음 행동이 모바일 엄지 영역에서 안정적으로 이어지게 한다.

Tasks:
- [x] 정답/오답 버튼의 위치, 높이, label 길이를 360px에서 확인한다.
- [x] 정답/오답 피드백이 버튼 위치를 흔들지 않는지 확인한다.
- [x] 마지막 카드 후 완료 화면으로 넘어가는 전환이 즉시 이해되는지 확인한다.
- [x] 완료 화면의 주요 CTA가 한 손 조작 영역 안에 들어오는지 확인한다.
- [x] 약점 복습 완료는 공식 기록 완료와 다르게 보이는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 학습 중 가장 많이 누르는 버튼이 항상 같은 곳에 있다.
- 완료 화면에서 "다음에 무엇을 할지"가 설명 없이 보인다.
- 기록 없는 학습이 공식 회독처럼 보이지 않는다.

Verification:
- 정답/오답 버튼은 360px 이하에서도 짧은 label의 2열 버튼을 유지하고, 피드백 중에는 같은 action bar 안에서 색과 shadow만 바뀌게 했다.
- 완료 화면 작업 bar를 bottom nav 위 fixed action으로 바꿔 결과 화면 첫 진입 시에도 다음 행동이 엄지 영역 안에 보이도록 했다.
- 완료 작업 bar는 primary action을 전체 폭으로 두고, 보조 action과 요약 이동은 한 줄 아래/위계 낮은 버튼으로 분리했다.
- 약점 복습 완료는 `review` tone과 명시 copy를 추가해 소그룹 회독 수, 공식 정답률, 학습 이력에 반영되지 않는 결과로 보이게 했다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200/UTF-8 title 확인을 통과했다. 이 환경의 브라우저 권한 제한 때문에 실제 스크린샷 검증은 보류한다.

## Phase 4. Mobile Forms & Keyboard

### 4.1 Settings Form Pass

Purpose:
목표 이름, 목표일, 약점 기준, 데이터 관리가 모바일 입력 환경에서 부담 없이 동작하게 한다.

Tasks:
- [x] 목표 이름 input focus 시 화면이 자연스럽게 스크롤되는지 확인한다.
- [x] 목표일 select 3개가 360px에서 보기 좋게 배치되는지 확인한다.
- [x] inline help가 작은 화면에서 label과 겹치지 않는지 확인한다.
- [x] 저장 버튼이 키보드에 가려지거나 너무 멀지 않은지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 설정 변경은 모바일에서 확대 없이 끝낼 수 있다.
- help icon은 눈에 거슬리지 않지만 눌렀을 때 충분히 읽힌다.
- 부가 설명이 다시 화면을 무겁게 만들지 않는다.

Verification:
- 목표 이름 input에 `enterkeyhint="done"`과 명시 id를 추가하고, 설정 form 입력 항목에 scroll margin을 줘 모바일 focus 시 하단 action과 겹치지 않게 했다.
- 목표일 select option에 `년/월/일` 단위를 표시하고, 380px 이하에서 select grid와 padding을 줄여 세 칸이 한 줄에 안정적으로 들어가게 했다.
- 설정 form의 저장/초기화 action을 sticky bar로 처리해 약점 기준을 조정한 뒤 저장 버튼이 너무 멀리 떨어지지 않게 했다.
- 설정/데이터 안전 inline help는 480px 이하에서 viewport 안 fixed popover로 열리게 해 label이나 화면 가장자리와 겹치지 않도록 했다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200/UTF-8 title 확인을 통과했다. 인앱 브라우저 패널이 없어 실제 터치/키보드 검증은 다음 브라우저 가능 시점에 다시 확인한다.

### 4.2 Card Creation Form Pass

Purpose:
카드 한 장을 빠르게 추가하고 수정하는 흐름을 모바일에서 편하게 만든다.

Tasks:
- [x] 대그룹/소그룹 dependent select가 모바일에서 순서대로 이해되는지 확인한다.
- [x] 앞면/뒷면/메모 textarea focus와 scroll 위치를 점검한다.
- [x] 저장 후 다음 카드 입력을 이어갈지, 목록으로 돌아갈지 흐름을 확인한다.
- [x] validation message가 키보드나 sticky action과 겹치지 않는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 카드 추가가 손가락 이동이 적은 반복 작업처럼 느껴진다.
- select와 textarea 사이의 맥락이 끊기지 않는다.
- 오류 메시지가 입력 위치 근처에서 이해된다.

Verification:
- 카드 저장 위치 select에 `card-location-grid`를 추가해 480px 이하에서 대그룹, 소그룹이 세로 순서로 읽히게 했다.
- 새 카드 등록은 저장 후 같은 소그룹의 빈 카드 form으로 돌아가 `등록 후 계속` 흐름을 기본으로 하고, 수정 저장은 기존처럼 목록으로 돌아가게 정했다.
- 카드 form action을 sticky bar로 처리하고, 입력 field/example/중복 경고에 scroll margin을 줘 모바일 키보드와 하단 action에 가려지지 않게 했다.
- 중복 경고를 `role="alert"`로 두고 앞면 input에 연결해 저장 위치 근처가 아니라 앞면 입력 바로 아래에서 이해되게 했다.
- 예문 추가 후 새 일본어 예문 textarea로 스크롤/focus되게 해 긴 form에서도 입력 위치를 놓치지 않게 했다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200/UTF-8 title 확인을 통과했다. 인앱 브라우저 패널이 없어 실제 터치/키보드 검증은 다음 브라우저 가능 시점에 다시 확인한다.

### 4.3 Bulk Input Pass

Purpose:
대량 등록이 모바일에서도 최소한 읽고 수정 가능한 보조 도구로 동작하게 한다.

Tasks:
- [x] 대량 등록 형식 도움말을 inline help 또는 compact disclosure로 정리한다.
- [x] textarea 높이와 preview/error 영역이 작은 화면에서 균형을 잃지 않는지 확인한다.
- [x] 긴 오류 목록이 전체 화면을 밀어내지 않도록 max-height와 scroll을 점검한다.
- [x] 모바일에서는 대량 등록이 보조 기능임을 밀도와 CTA 위계로 드러낸다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 대량 등록 화면이 문서처럼 길어 보이지 않는다.
- 오류가 많아도 저장/취소 흐름이 가려지지 않는다.
- 한 장 등록 흐름보다 더 중요해 보이지 않는다.

Verification:
- 기존 대량 등록 형식 설명 disclosure를 제거하고, 카드 label 옆 inline help로 옮겨 기본 화면의 설명 밀도를 낮췄다.
- `여러 장 보조 등록` note와 secondary `미리보기` CTA를 유지해 한 장 등록보다 보조 기능처럼 보이게 했다.
- 대량 등록 textarea, preview list, 오류/중복 영역에 max-height와 내부 scroll을 적용해 작은 화면에서 전체 form을 밀어내지 않게 했다.
- preview 후 오류가 있으면 오류 영역, 오류가 없으면 preview 제목으로 focus를 옮겨 수정/확인 위치를 바로 잡게 했다.
- 오류/중복 메시지는 `role="alert"`로 표시하고, 모바일 inline help는 설정 화면과 같은 fixed popover 규칙을 공유한다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200/UTF-8 title 확인을 통과했다. 인앱 브라우저 패널이 없어 실제 터치/키보드 검증은 다음 브라우저 가능 시점에 다시 확인한다.

## Phase 5. Dialogs & Bottom Sheets

### 5.1 Core Dialog Pass

Purpose:
확인, 삭제, preview, 기록 상세 dialog가 모바일 bottom sheet처럼 안정적으로 동작하게 한다.

Tasks:
- [x] 모든 dialog의 max-height가 86vh 안에서 작동하는지 확인한다.
- [x] close, cancel, confirm 버튼 순서가 `DESIGN.md`와 맞는지 확인한다.
- [x] 삭제 confirm은 대상 이름과 영향 범위를 작은 화면에서도 명확히 보여준다.
- [x] dialog open/close 후 focus가 trigger로 자연스럽게 돌아오는지 확인한다.
- [x] backdrop tap, Escape, close button 동작을 dialog 성격별로 점검한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- dialog가 모바일에서 중앙 모달보다 bottom sheet에 가깝게 느껴진다.
- 위험 action을 실수로 누를 가능성이 낮다.
- dialog 내부 스크롤과 바깥 화면 스크롤이 충돌하지 않는다.

Verification:
- 모든 dialog panel에 `max-height: min(86vh, 760px)`와 내부 scroll/overscroll containment를 적용했다.
- preview dialog는 header/action을 고정된 grid 영역에 두고 목록만 내부 scroll되도록 정리했다.
- 삭제/초기화 confirm 문구가 대상 이름, 예문/회독 기록/정오답 누적 영향, 되돌릴 수 없음을 직접 말한다.
- dismissible dialog는 backdrop tap과 Escape로 닫히고, confirm dialog는 backdrop/Escape에서 취소 버튼으로 focus를 돌린다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200 확인을 통과했다. 인앱 브라우저 패널이 없어 실제 터치/시각 검증은 다음 브라우저 가능 시점에 다시 확인한다.

### 5.2 Dense Picker Pass

Purpose:
묶음 연습 소그룹 선택처럼 항목이 많은 picker가 모바일에서 부담 없이 작동하게 한다.

Tasks:
- [x] 소그룹 체크리스트의 행 높이와 tap area를 확인한다.
- [x] selected count, disabled state, 기록 없음 안내가 과하게 길지 않은지 확인한다.
- [x] 항목이 많을 때 내부 스크롤이 안정적인지 확인한다.
- [x] 시작 CTA가 선택 리스트 아래에서 사라지지 않는지 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 여러 소그룹을 선택해도 dialog가 무겁게 느껴지지 않는다.
- 기록 없는 연습이라는 사실이 작지만 명확하게 남아 있다.
- 시작 버튼이 선택 작업 뒤에 자연스럽게 보인다.

Verification:
- 묶음 연습 dialog를 header / 내부 scroll body / action footer 구조로 나눠 선택 개수와 시작 CTA가 항상 보이도록 했다.
- 소그룹 row는 label 전체가 tap target이며, 카드 없는 소그룹 안내를 짧은 disabled copy와 panel note로 정리했다.
- 많은 소그룹에서도 selection list와 dialog body가 각각 `overscroll-behavior: contain`으로 내부 scroll된다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200/title 확인을 통과했다. 인앱 브라우저 패널이 없어 실제 터치/시각 검증은 다음 브라우저 가능 시점에 다시 확인한다.

## Phase 6. Mobile Performance

### 6.1 Large List Responsiveness

Purpose:
카드와 소그룹이 많아졌을 때도 모바일에서 스크롤과 검색이 빠르게 느껴지게 한다.

Tasks:
- [x] 100/500/1000장 카드 데이터로 카드 탭 검색과 필터를 확인한다.
- [x] 긴 카드 목록에서 렌더링이 느리면 pagination, windowing, incremental render 중 하나를 검토한다.
- [x] 검색 입력 debounce가 모바일 키보드 입력에 자연스러운지 확인한다.
- [x] 통계 목록과 회독 상세 목록도 같은 기준으로 점검한다.

Files:
- `static/app.js`
- `static/styles.css` if loading skeleton or list density changes are needed

Acceptance Criteria:
- 500장 수준에서도 검색 입력 후 앱이 멈춘 것처럼 보이지 않는다.
- 성능 개선 때문에 카드 정보 위계가 깨지지 않는다.
- 빈 결과와 loading 상태가 명확하다.

Verification:
- 카드 검색은 카드별 검색 텍스트를 `WeakMap`으로 캐시해 예문 포함 검색의 반복 문자열 조합을 줄였다.
- 카드 목록은 기존 80개 단위 pagination을 유지하고, 소그룹 상세 목록은 60개 단위 더 보기로 DOM 증가를 제한했다.
- 통계 대그룹 목록은 40개 단위, 회독 상세의 틀린 카드/한 번에 맞은 카드는 60개 단위 더 보기로 나눠 큰 기록에서 렌더를 줄였다.
- 검색 debounce를 120ms로 조정해 모바일 키보드 입력 중 렌더 빈도를 조금 낮췄다.
- 합성 100/500/1000장 카드 검색 벤치: cached 검색이 각각 0.047ms / 0.070ms / 0.105ms로 확인됐다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200/title 확인을 통과했다. 인앱 브라우저 패널이 없어 실제 터치/시각 검증은 다음 브라우저 가능 시점에 다시 확인한다.

### 6.2 Loading & Network Feedback

Purpose:
모바일 네트워크가 느리거나 불안정할 때도 사용자가 앱 상태를 이해하게 한다.

Tasks:
- [x] 초기 로딩, 저장 중, 삭제 중, 복원 중 상태가 모바일에서 분명한지 확인한다.
- [x] 버튼 pending state가 중복 submit을 막는지 확인한다.
- [x] 네트워크 실패 toast가 하단 nav 또는 answer bar와 겹치지 않는지 확인한다.
- [x] offline-like 상황에서 사용자가 재시도할 수 있는 경로를 확인한다.

Files:
- `static/app.js`
- `static/styles.css`

Acceptance Criteria:
- 느린 작업에서 같은 버튼을 여러 번 누르고 싶지 않게 된다.
- 실패 메시지가 짧고 행동 가능하다.
- toast가 주요 action을 가리지 않는다.

Verification:
- form submit pending에 `aria-busy`, `is-pending` 버튼 상태, 중복 submit 방지 복구 흐름을 적용했다.
- 삭제/초기화/복원 confirm dialog와 대량 등록 확정에 pending note를 추가해 처리 중임을 본문에서도 보이게 했다.
- 네트워크 실패 toast를 `연결 실패. 다시 눌러 재시도하세요.`로 짧고 행동 가능하게 정리하고 표시 시간을 조금 늘렸다.
- study mode toast bottom offset을 answer bar 위로 올려 학습 중 주요 action과 겹칠 가능성을 줄였다.
- 초기 로딩/error 화면은 기존 loading skeleton과 `다시 시도` 경로를 유지한다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200/title 확인을 통과했다. 인앱 브라우저 패널이 없어 실제 터치/시각 검증은 다음 브라우저 가능 시점에 다시 확인한다.

## Phase 7. Touch & Accessibility

### 7.1 Touch Target Audit

Purpose:
작은 아이콘과 보조 action까지 모바일 손가락으로 안정적으로 누를 수 있게 한다.

Tasks:
- [x] 하단 nav, 주요 CTA, ghost/secondary button, search clear action을 확인한다.
- [x] inline help icon의 시각 크기와 실제 tap target을 분리해 44px 기준을 만족시킨다.
- [x] checkbox row는 checkbox 자체보다 row 전체가 눌리는지 확인한다.
- [x] 위험 action은 다른 action과 충분히 떨어져 있는지 확인한다.

Files:
- `static/styles.css`
- `static/app.js` if hit area markup changes are needed

Acceptance Criteria:
- 360px 화면에서 엄지로 주요 action을 놓치지 않는다.
- 작은 icon button도 실제 tap target은 충분하다.
- destructive action은 실수로 눌리기 어렵다.

Verification:
- 공통 button에 모바일 tap 지연을 줄이는 `touch-action: manipulation`과 텍스트 선택 방지를 적용했고, 기존 nav/CTA/ghost/secondary/search clear는 44px 이상 터치 타겟을 유지한다.
- inline help summary는 시각 상태를 muted로 낮추고 실제 44px 터치 영역, focus/open 상태를 유지한다.
- 학습 소그룹 checkbox row는 58px 높이의 label 전체가 눌리는 구조를 유지하고 터치/선택 방지 속성을 더했다.
- 소그룹 위험 action에는 상단 구분선과 간격을 추가했고, 480px 이하에서는 초기화/삭제 action을 한 줄씩 분리한다.
- `node --check static/app.js`, `git diff --check`, 로컬 HTTP 200/title 확인을 통과했다. 인앱 브라우저 패널이 없어 실제 터치/시각 검증은 다음 브라우저 가능 시점에 다시 확인한다.

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
