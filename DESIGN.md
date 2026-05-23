# 꼬꼬회독 DESIGN.md

## Overview

꼬꼬회독은 시험 전 짧은 시간에 여러 카드 묶음을 반복해서 외우는 모바일 중심 회독 학습 앱이다. 일본어 문법에서 시작했지만, 영어 단어, 중국어 표현, 자격증 암기, 면접 질문처럼 사용자가 직접 만든 모든 암기 카드에 대응한다.

디자인 방향은 **Mintlify의 documentation UI에서 영감을 받은, 읽기 좋은 민트 포인트 학습 도구**다. 마케팅 페이지처럼 화려하게 보여주는 것이 아니라, 사용자가 매일 열어도 피로하지 않고 바로 학습을 시작할 수 있어야 한다.

핵심 구조는 `대그룹 > 소그룹 > 카드`다. 공식 회독 기록은 소그룹 단위로 저장하고, 여러 소그룹을 묶어 하는 연습은 기록 없는 보조 기능으로 둔다. 따라서 UI도 소그룹을 실제 학습 단위로 가장 명확하게 보여줘야 한다.

## Product Personality

- 차분하다: 공부 앱이므로 오래 봐도 눈이 편해야 한다.
- 빠르다: "오늘 뭘 하지?"를 고민하기 전에 시작 버튼이 보여야 한다.
- 신뢰감 있다: 장난스러운 브랜드 장식보다 카드, 기록, 선택 상태가 정확해야 한다.
- 읽기 좋다: 카드 뒷면, 메모, 예문, 회독 기록이 앱의 실제 콘텐츠다.
- 모바일 우선이다: 하단 탭, 큰 터치 영역, 한 손 조작을 우선한다.

## Design Principles

1. **Reading First**
   카드 앞면/뒷면, 예문, 메모, 기록 설명의 가독성이 모든 시각 효과보다 우선한다.

2. **Quiet Productivity**
   전체 톤은 문서 도구처럼 조용하고, 학습 시작/완료/활성 상태에만 민트 포인트를 쓴다.

3. **Subgroup As The Unit**
   소그룹은 학습의 기본 단위다. 소그룹 카드에는 카드 수, 마지막 학습, 오답/정답 흐름, 회독 상태가 빠르게 읽혀야 한다.

4. **No Marketing Hero**
   앱 첫 화면은 랜딩 페이지가 아니라 실제 학습 홈이다. 큰 히어로, 구름/로켓/번개 장식, 과한 그라데이션을 쓰지 않는다.

5. **Dense But Calm**
   카드/묶음/설정 화면은 관리 도구처럼 적당히 조밀해야 하지만, 줄 간격과 여백은 읽기 편하게 유지한다.

6. **One Accent Earns Its Place**
   민트/그린은 primary CTA, active state, 완료/성공 상태에만 사용한다. 일반 텍스트나 큰 배경에 남용하지 않는다.

## Visual Direction

### Inspiration

Mintlify의 marketing hero가 아니라 documentation/product surfaces를 참고한다.

가져올 것:
- 흰 캔버스와 연한 surface
- 얇은 hairline border
- 민트 포인트의 절제된 사용
- 14-16px 본문과 1.5 line-height
- 읽기 중심의 조밀한 레이아웃
- 코드/데이터 영역에만 mono 사용

버릴 것:
- 시네마틱 hero gradient
- 구름, 로켓, 거대한 브랜드 일러스트
- 72px급 마케팅 헤드라인
- 과도한 pill button
- orange testimonial card 같은 감정형 장식
- 한글/일본어에 negative letter-spacing

## Color Tokens

### Base

| Token | Value | Role |
|---|---:|---|
| `{colors.canvas}` | `#f6f7f5` | 앱 전체 배경 |
| `{colors.surface}` | `#ffffff` | 패널, 카드, 폼 기본 배경 |
| `{colors.surface-soft}` | `#fafbf8` | 약한 섹션, 입력 영역, 빈 상태 |
| `{colors.surface-mint}` | `#e8f3ef` | 활성 상태, 성공/완료 보조 배경 |
| `{colors.hairline}` | `#dde4df` | 기본 1px 경계선 |
| `{colors.hairline-strong}` | `#c8d3cd` | 강조 경계선, 구분선 |

### Text

| Token | Value | Role |
|---|---:|---|
| `{colors.ink}` | `#1c211f` | 제목, 주요 본문 |
| `{colors.charcoal}` | `#303936` | 강조 본문, 카드 제목 |
| `{colors.slate}` | `#68716c` | 보조 텍스트, meta |
| `{colors.stone}` | `#89928d` | placeholder, 비활성 설명 |
| `{colors.on-dark}` | `#ffffff` | 짙은 버튼 위 텍스트 |

### Accent

| Token | Value | Role |
|---|---:|---|
| `{colors.brand}` | `#176f66` | primary action, active state, progress |
| `{colors.brand-hover}` | `#115f57` | pressed/active action |
| `{colors.brand-soft}` | `#e8f3ef` | active/selected background |
| `{colors.brand-faint}` | `#f4faf7` | 아주 약한 민트 표면 |
| `{colors.focus}` | `rgba(23, 111, 102, 0.18)` | focus ring |

### Semantic

| Token | Value | Role |
|---|---:|---|
| `{colors.danger}` | `#b94a43` | 삭제, 오답, 위험 |
| `{colors.danger-soft}` | `#f8e3df` | 위험/오답 배경 |
| `{colors.warning}` | `#b97918` | 주의, 중복 경고 |
| `{colors.warning-soft}` | `#fbefd4` | 주의 배경 |
| `{colors.success}` | `#176f66` | 정답, 완료 |
| `{colors.success-soft}` | `#e8f3ef` | 정답/완료 배경 |

### Color Rules

- 기본 화면은 밝은 캔버스다. 전체 다크 모드는 현재 디자인 범위에서 제외한다.
- `{colors.brand}`는 클릭 가능한 주요 행동과 active state에만 사용한다.
- 삭제/오답은 항상 red 계열로 구분한다.
- 경고 색은 대량 등록 중복, 형식 오류, 주의 배너에만 사용한다.
- 앱 전체가 한 가지 색으로 보이지 않도록 surface, hairline, text hierarchy로 깊이를 만든다.

## Typography

### Font Stack

```css
--font-ui:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Apple SD Gothic Neo",
  "Noto Sans KR",
  "Segoe UI",
  sans-serif;

--font-jp-sans:
  "Hiragino Sans",
  "Hiragino Kaku Gothic ProN",
  "Yu Gothic",
  "YuGothic",
  "Meiryo",
  "Noto Sans CJK JP",
  sans-serif;

--font-jp-serif:
  "Hiragino Mincho ProN",
  "Yu Mincho",
  "YuMincho",
  "Noto Serif CJK JP",
  serif;

--font-mono:
  "Geist Mono",
  "SF Mono",
  Menlo,
  Consolas,
  ui-monospace,
  monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---:|---:|---:|---:|---|
| `{type.app-title}` | 28px | 800 | 1.15 | 0 | 앱 이름 |
| `{type.screen-title}` | 22px | 750 | 1.25 | 0 | 탭/화면 제목 |
| `{type.section-title}` | 18px | 700 | 1.35 | 0 | 패널 제목 |
| `{type.card-title}` | 16px | 700 | 1.4 | 0 | 카드/소그룹 제목 |
| `{type.body}` | 15px | 400 | 1.5 | 0 | 기본 본문 |
| `{type.body-strong}` | 15px | 650 | 1.5 | 0 | 본문 강조 |
| `{type.body-sm}` | 14px | 400 | 1.5 | 0 | 설명, 리스트 보조 정보 |
| `{type.meta}` | 13px | 500 | 1.45 | 0 | 날짜, 카운트, 상태 |
| `{type.caption}` | 12px | 600 | 1.4 | 0 | badge, eyebrow |
| `{type.button}` | 14px | 650 | 1.2 | 0 | 버튼 |
| `{type.jp-front}` | 32-36px | 500 | 1.25 | 0 | 학습 카드 앞면 |
| `{type.jp-example}` | 15px | 400 | 1.6 | 0 | 일본어 예문 |
| `{type.mono}` | 13px | 400 | 1.45 | 0 | 백업 JSON, 형식 예시 |

### Typography Rules

- 한글과 일본어에는 negative letter-spacing을 쓰지 않는다.
- 제목은 굵기로 위계를 만들고, 크기 차이는 과하게 벌리지 않는다.
- 일본어 카드 앞면은 필요할 때 serif를 허용하지만, 예문은 sans로 읽기 쉽게 유지한다.
- 예문은 줄 간격을 넓혀서 학습 중 눈이 멈출 수 있게 한다.
- 버튼 텍스트는 짧고 직접적이어야 한다.

## Spacing

Base unit은 4px이다.

| Token | Value | Use |
|---|---:|---|
| `{space.1}` | 4px | 미세 간격 |
| `{space.2}` | 8px | 아이콘/텍스트 간격, 작은 gap |
| `{space.3}` | 12px | 카드 내부 소간격 |
| `{space.4}` | 16px | 기본 패널 padding |
| `{space.5}` | 20px | 주요 섹션 gap |
| `{space.6}` | 24px | 넓은 패널 padding |
| `{space.8}` | 32px | 화면 블록 간격 |

Rules:
- 모바일 기본 좌우 gutter는 16px이다.
- panel 내부는 16-18px를 기본으로 한다.
- 카드 목록 gap은 10-12px를 유지한다.
- 학습 세션의 카드와 액션 바 사이에는 충분한 여백을 둔다.
- 탭/폼/목록은 scroll container를 과하게 만들지 않는다. 자연 문서 흐름을 우선한다.

## Radius

| Token | Value | Use |
|---|---:|---|
| `{radius.xs}` | 4px | inline highlight, 작은 칩 |
| `{radius.sm}` | 6px | segment 내부 버튼 |
| `{radius.md}` | 8px | 앱의 기본 버튼, input, card, panel |
| `{radius.full}` | 999px | badge, 작은 상태 pill |

Rules:
- 기본 UI radius는 8px 이하로 유지한다.
- 일반 CTA 버튼은 pill로 만들지 않는다.
- badge, D-day, 상태 pill만 full radius를 쓴다.
- 카드 안에 또 카드가 중첩되는 느낌을 만들지 않는다.

## Elevation

| Level | Treatment | Use |
|---|---|---|
| 0 | no shadow, 1px hairline | 입력, 기본 리스트 |
| 1 | `0 6px 18px rgba(35, 47, 43, 0.07)` | 패널, 카드 목록 |
| 2 | `0 16px 38px rgba(35, 47, 43, 0.10)` | dialog, sticky action |
| Focus | `0 0 0 3px {colors.focus}` | keyboard/touch focus |

Rules:
- 그림자는 깊게 쓰지 않는다.
- hierarchy는 shadow보다 border, background, spacing으로 만든다.
- 학습 카드와 dialog만 상대적으로 더 떠 보일 수 있다.

## Core Components

### App Shell

- 모바일 우선 max-width는 560px.
- 배경은 밝은 캔버스.
- 상단 헤더는 꼬꼬회독 로고, 앱 이름, 현재 위치, 사용자 인사말을 먼저 보여주고, 목표/D-day 배지는 인사말 아래 보조 정보로 둔다.
- 로고는 `static/assets/logo.svg`를 기준으로 쓰고, 앱 안에서는 44px 전후의 작은 브랜드 마크로만 사용한다.
- 하단 nav는 항상 5개 탭: 학습, 묶음, 카드, 통계, 설정.
- 하단 nav active는 민트 배경 + 민트 텍스트.
- 고퀄 꼬꼬 캐릭터는 로그인, 빈 상태, 좋은 상태, 통계 정상 상태, 완료 화면처럼 감정 완충이 필요한 곳에만 작게 쓴다.
- 캐릭터는 `static/assets/kokko-*.png`와 `static/assets/celebration-niwatori-*.png` 안에서 용도별로 돌려 써서 같은 이미지가 연속 화면에서 반복되어 보이지 않게 한다.
- 캐릭터는 주요 정보나 CTA보다 먼저 경쟁하지 않아야 하며, 학습 카드 화면에는 넣지 않는다.

### Panel

Use for top-level screen sections.

- Background: `{colors.surface}`
- Border: `1px solid {colors.hairline}`
- Radius: `{radius.md}`
- Padding: 16-18px
- Shadow: level 1

Panel은 페이지 섹션을 감싸는 기본 단위다. 패널 내부에 또 다른 큰 패널을 넣지 않는다.

### Buttons

#### Primary Button

Use for the next most important action.

- Background: `{colors.brand}`
- Text: white
- Radius: `{radius.md}`
- Height: 44-48px
- Typography: `{type.button}`

Examples:
- 학습 시작
- 카드 등록
- 저장
- 소그룹 만들기

#### Secondary Button

- Background: `{colors.brand-soft}`
- Text: `{colors.brand}`
- Border: soft brand border
- Radius: `{radius.md}`

Examples:
- 카드 미리보기
- 약점 복습
- 전체 선택

#### Ghost Button

- Background: `{colors.surface}`
- Text: `{colors.ink}`
- Border: `{colors.hairline}`
- Radius: `{radius.md}`

Examples:
- 취소
- 선택 해제
- 목록 보기
- 설정 열기

#### Danger Button

- Background: `{colors.danger-soft}`
- Text: `{colors.danger}`
- Radius: `{radius.md}`

Use only for destructive actions.

### Inputs

- Height: 44-46px
- Radius: `{radius.md}`
- Border: `{colors.hairline}`
- Focus: brand border + focus ring
- Placeholder: `{colors.stone}`

Select boxes should have clear labels. In card tab, 대그룹 select and 소그룹 select must visually read as a dependent pair.

### Segmented Controls

Use for mode switching, not major navigation.

- Background: `{colors.surface-soft}`
- Border: `{colors.hairline}`
- Active segment: white surface + small shadow
- Radius: container 8px, segment 6px

Examples:
- 카드 등록 방식: 한 장 / 여러 장
- 학습 정렬: 최근 / 미학습 / 오답 / 이름

### Status Pills

- Radius: full
- Height: 24-28px
- Font: `{type.caption}`
- Use muted backgrounds unless active/success/error.

Examples:
- 오늘 완료
- 미학습
- 카드 20개
- D-30

### Study Card

학습 카드가 앱의 가장 중요한 컴포넌트다.

- Background: `{colors.surface}`
- Border: hairline
- Top border: brand color
- Radius: `{radius.md}`
- Min-height: 320-360px on mobile
- Padding: 20-24px
- Shadow: level 2

Front:
- center aligned
- Japanese/content front uses `{type.jp-front}`
- hint text is muted and small

Back:
- left aligned
- meaning uses brand text color but not oversized
- examples use `line-height: 1.6`
- highlighted grammar uses subtle warning-soft underline, not neon marker

### Group/Collection Item

Use for 대그룹 and 소그룹 rows.

- Background: `{colors.surface}`
- Border: `{colors.hairline}`
- Radius: `{radius.md}`
- Padding: 14-16px
- Active: brand border + soft mint background or left indicator
- Empty: surface-soft + muted text

소그룹 item must prioritize:
1. 소그룹명
2. 카드 수
3. 마지막 학습/오늘 학습 여부
4. 오답/정답 흐름
5. 주요 action

### Card Item

Use for card list.

- Front text should be prominent.
- Back/memo/examples are secondary.
- Show collection/group path in meta.
- Avoid making every card visually heavy.
- Edit/delete actions are visible but secondary.

### Completion Summary

Completion screen should feel rewarding but not flashy.

- Main score area uses surface-mint, not dark hero.
- Correct/wrong counts are in compact metric cards.
- Wrong review section should be easy to scan.
- Primary next action is "돌아가기" or "다음 회독" depending on flow.

### Dialog

- Bottom sheet style on mobile.
- Background white.
- Radius 8px.
- Max height: 86vh.
- Destructive confirmations must clearly name the target.
- Dialog button order: cancel/secondary left, confirm/primary or danger right.

### Toast

- Dark neutral background.
- White text.
- Short message only.
- Do not use toast for important decisions.

## Screen Rules

### Study Home

Goal: User immediately knows what to study next.

Must show:
- "오늘의 학습" title
- 이어서 회독 card
- 약점 복습 card
- 대그룹 찾아보기

Design:
- 이어서 회독 should be the most visually prominent card.
- If no recent group exists, CTA should scroll/focus to collection browser.
- Weak review should be visually distinct but not alarmist.
- Search and sort controls should feel like tools, not hero content.

### Collection Selection

Goal: 대그룹을 선택하고 그 안의 소그룹으로 들어간다.

Rules:
- 대그룹 card shows 소그룹 수, 카드 수, aggregate note.
- 대그룹 itself does not show official study stats as if it has its own history.
- Empty 대그룹 should offer 소그룹 만들기.

### Subgroup Selection

Goal: 소그룹 단위로 official study starts.

Rules:
- 소그룹 list is the main surface.
- Each subgroup should clearly show whether it was studied today.
- "묶음 연습" is secondary and clearly marked as 기록 없음.
- Sorting controls remain compact.

### Bundle Practice Dialog

Goal: Let users combine subgroups for practice without stats.

Rules:
- Header says "묶음 연습" or "기록 없는 연습".
- Card count and selected subgroup count are always visible.
- Quick presets: 오늘 미학습, 오답 있음, 오래된 3개.
- Empty-card subgroups are disabled.
- Start button disabled if selected card count is 0.

### Study Session

Goal: Focus only on the current card.

Rules:
- Hide app header and bottom nav during active session.
- Show progress, elapsed time, session title.
- Card tap flips front to back.
- Answer buttons are large, stable, and always at the bottom.
- Correct/wrong feedback can be colored but must not shift layout.

### Completion

Goal: Close the loop and suggest a next useful step.

Rules:
- Show accuracy, wrong count, duration, card count.
- Wrong cards are easy to review.
- Practice mode explicitly says records were not saved.
- A small completion mascot panel is allowed after explicit product direction, but it must stay compact and secondary to the result.
- No confetti, oversized hero, or full-screen celebration.

### Cards Tab

Goal: Manage cards efficiently.

Rules:
- Default list can show all cards.
- Filter order: 대그룹 select -> 소그룹 select -> search.
- If a selected 대그룹 has no 소그룹, show "소그룹 만들기" CTA.
- 대량 등록 preview must expose duplicate/errors clearly.
- Card form should not feel like a separate landing page.

### Groups Tab

Goal: Manage 대그룹 and 소그룹 structure.

Rules:
- Tab label is "묶음".
- First screen shows 대그룹 list.
- Clicking 대그룹 opens its 소그룹 list.
- 소그룹 add button lives inside 대그룹 detail.
- 대그룹 stats are aggregates, not independent learning records.

### Settings

Goal: Configure learning target and weak-card rules.

Rules:
- Target name is generic: JLPT N1, HSK 5급, 토익 단어, etc.
- JLPT level is optional compatibility, not the app identity.
- Weak-card settings are functional and compact.
- Backup/restore is powerful and should feel serious.

## Content Voice

### Product Vocabulary

- `대그룹`: 여러 소그룹을 담는 상위 구조다. 공식 학습 기록을 직접 갖는 단위처럼 말하지 않는다.
- `소그룹`: 공식 회독과 통계가 저장되는 기본 학습 단위다.
- `묶음`: 하단 탭 이름으로는 사용할 수 있지만, 데이터 구조를 설명할 때는 `대그룹`을 쓴다.
- `묶음 연습`: 여러 소그룹을 임시로 합쳐 하는 기록 없는 연습이다. 공식 회독, 통계, 학습 이력에 저장되지 않는다고 명확히 말한다.
- `카드`: 앞면, 뒷면, 메모, 예문을 가진 암기 항목이다.
- `회독`: 소그룹 단위로 저장되는 공식 학습 기록이다.
- `연습`: 공식 기록에 저장되지 않는 보조 학습이다.
- `약점`: 오답 기준에 걸린 카드 묶음이다. 경고처럼 과장하지 않는다.

Copy rules:
- CTA는 동사형으로 쓴다: `시작`, `만들기`, `저장`, `돌아가기`, `복원`.
- 구조를 말할 때는 `대그룹 > 소그룹 > 카드`를 유지한다.
- `묶음`은 탭명 또는 `묶음 연습` 맥락에서만 쓴다.
- 위험 action은 대상 이름과 영향 범위를 문장 안에 넣는다.
- 완료 화면은 결과와 다음 행동을 우선하고, 장난스러운 표현은 아주 절제해서 쓴다.

Tone:
- Korean-first, clear, concise.
- Friendly but not childish.
- Avoid excessive slang.
- "꼬꼬회독" is the product name; playful expressions can appear sparingly after completion.

Good:
- "오늘 학습할 소그룹을 골라보세요."
- "묶음 연습은 공식 기록에 저장되지 않습니다."
- "카드를 등록하려면 소그룹이 필요해요."
- "같은 소그룹에 이미 같은 앞면 카드가 있습니다."

Avoid:
- "찢었다" as a primary interface phrase.
- Overexcited copy.
- Long instructions inside the app.
- Feature explanations that read like marketing text.

## Accessibility

- All interactive elements must have at least 44px touch target on mobile.
- Focus states must be visible.
- Text contrast must pass normal reading contrast.
- Do not rely on color alone for correct/wrong or active/inactive.
- Button labels should include visible text unless the icon is universally obvious.
- Japanese text must remain selectable/readable and not be compressed.
- Motion should be subtle; no essential information should depend on animation.

## Responsive Behavior

### Mobile < 480px

- Single-column everything.
- Button rows stack if text does not fit.
- Study card min-height can reduce to 300px.
- Bottom nav remains fixed.
- Dialogs open as bottom sheets.

### Large Mobile / Small Tablet 480-767px

- App shell remains centered and mobile-like.
- Two-column small controls are allowed when text fits.
- Lists remain single column.

### Tablet/Desktop >= 768px

- App shell may stay narrow because this is a mobile-first study app.
- Do not stretch content to full desktop width.
- Wider screens can increase max-width to 560px only unless a future desktop layout is explicitly designed.

## Implementation Guardrails

### Do

- Use 8px radius for cards, panels, inputs, and normal buttons.
- Use 민트/green for active, progress, success, and primary CTA.
- Use red only for destructive actions and wrong answers.
- Use muted text for metadata and helper text.
- Keep forms compact and predictable.
- Keep content hierarchy stable between empty, loading, and filled states.
- Prefer real UI density over decorative visual weight.

### Don't

- Do not create a marketing landing page as the first screen.
- Do not use dark hero bands, cloud/rocket illustrations, decorative lightning marks, or gradient orbs.
- Do not use purple-blue gradients as the app identity.
- Do not use negative letter-spacing.
- Do not make all buttons pill-shaped.
- Do not put cards inside cards.
- Do not let text overflow inside buttons or status pills.
- Do not make 대그룹 look like it has official learning history.
- Do not save 묶음 연습 into official stats.

## Current CSS Mapping

The current app should map these conceptual tokens to CSS variables in `static/styles.css`:

```css
:root {
  --paper: #f6f7f5;
  --surface: #ffffff;
  --surface-strong: #fafbf8;
  --ink: #1c211f;
  --muted: #68716c;
  --line: #dde4df;
  --line-strong: #c8d3cd;
  --teal: #176f66;
  --teal-soft: #e8f3ef;
  --red: #b94a43;
  --red-soft: #f8e3df;
  --gold: #b97918;
}
```

If the CSS diverges from this document, update the CSS first unless the product direction itself changed.

## Design QA Checklist

Before shipping UI changes, check:

- Does the first study screen clearly show what to do next?
- Can a new user understand 대그룹 > 소그룹 > 카드 without reading docs?
- Are official study and 기록 없는 연습 visually distinct?
- Are card examples comfortable to read on mobile?
- Are primary actions obvious without looking flashy?
- Are empty states actionable?
- Are destructive actions unmistakable?
- Does the screen still look calm after adding real data?
- Does every button label fit at 360px wide?
- Are colors being used for meaning, not decoration?
