const {
  DEFAULT_LOGIN,
  ORDER_LABELS,
  TAB_LABELS,
  escapeHtml,
  formatDate,
  formatDuration,
  number,
} = window.ByeorakchigiShared || window.JLPTShared;
const { clearStoredUser, loadStoredUser, saveStoredUser } = window.ByeorakchigiStorage || window.JLPTStorage;
const { downloadJson, readTextFile } = window.ByeorakchigiFiles || window.JLPTFiles;

const ORDER_DESCRIPTIONS = {
  sequence: "등록한 순서 그대로 차분히 봅니다.",
  random: "순서를 섞어서 기억 착각을 줄입니다.",
  wrong: "누적 오답이 많은 카드부터 봅니다.",
};

const EXAMPLE_DISPLAY_LABELS = {
  collapsed: "1개만 먼저 보기",
  expanded: "모두 펼쳐 보기",
};

const EXAMPLE_DISPLAY_DESCRIPTIONS = {
  collapsed: "카드 뒷면에서 예문 1개만 먼저 보이고 나머지는 접어둡니다.",
  expanded: "카드 뒷면에서 예문을 처음부터 모두 보여줍니다.",
};

const STUDY_GROUP_SORT_LABELS = {
  recent: "최근순",
  wrong: "오답순",
  cards: "카드순",
  name: "이름순",
};

const JLPT_LEVELS = ["N1", "N2", "N3", "N4", "N5"];
const DEFAULT_WEAK_CARD_THRESHOLD = 16;
const DEFAULT_WEAK_RECENT_ROUNDS = 3;
const DEFAULT_WEAK_RECENT_WRONG_THRESHOLD = 8;

const state = {
  activeTab: "study",
  user: null,
  authError: "",
  authPending: false,
  authValues: { ...DEFAULT_LOGIN },
  collections: [],
  groups: [],
  cards: [],
  rounds: [],
  settings: {
    target_name: "",
    jlpt_exam_date: "",
    jlpt_level: "",
    weak_card_threshold: DEFAULT_WEAK_CARD_THRESHOLD,
    weak_recent_rounds: DEFAULT_WEAK_RECENT_ROUNDS,
    weak_recent_wrong_threshold: DEFAULT_WEAK_RECENT_WRONG_THRESHOLD,
  },
  selectedCollectionId: null,
  selectedStudyGroupIds: [],
  selectedGroupId: null,
  cardFilterCollectionId: "",
  cardFilterGroupId: "",
  cardSearchQuery: "",
  studyGroupSearchQuery: "",
  studyGroupSortMode: "recent",
  groupSearchQuery: "",
  cardScreen: "list",
  groupScreen: "list",
  groupDetailCollectionId: null,
  cardEntryMode: "single",
  bulkDraftText: "",
  bulkDraftGroupId: null,
  bulkPreview: null,
  dataPanelOpen: false,
  recentRoundsOpen: false,
  orderMode: "sequence",
  exampleDisplayMode: "collapsed",
  studyStep: "select",
  studyOptionsOpen: false,
  weakPanelOpen: false,
  weakCardOpenId: null,
  completionCorrectOpen: false,
  session: null,
  activeDialog: null,
  roundDetail: null,
  pendingTab: null,
  pendingAction: null,
  editingCardId: null,
  editingGroupId: null,
  editingCollectionId: null,
};

const views = {
  auth: document.querySelector("#view-auth"),
  study: document.querySelector("#view-study"),
  cards: document.querySelector("#view-cards"),
  groups: document.querySelector("#view-groups"),
  settings: document.querySelector("#view-settings"),
};
const toastEl = document.querySelector("#toast");
const dialogRoot = document.querySelector("#dialog-root");
const headerUserEl = document.querySelector("#header-user");
const headerGreetingEl = document.querySelector("#header-greeting");
const headerContextEl = document.querySelector("#header-context");
let studyTimerId = null;
const ANSWER_FEEDBACK_MS = 230;

function icon(name, extraClass = "") {
  return `<svg class="icon${extraClass ? ` ${extraClass}` : ""}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function iconLabel(name, label) {
  return `<span class="button-content">${icon(name)}<span>${escapeHtml(label)}</span></span>`;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toastEl.classList.remove("show"), 2200);
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (state.user) {
    headers["X-Byeorakchigi-User-Id"] = String(state.user.id);
    headers["X-Byeorakchigi-Code"] = state.user.accessCode;
  }
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data;
}

async function loadData() {
  const [collectionData, groupData, cardData, roundData, settingsData] = await Promise.all([
    request("/api/collections"),
    request("/api/groups"),
    request("/api/cards"),
    request("/api/rounds"),
    request("/api/settings"),
  ]);
  state.collections = collectionData.collections;
  state.groups = groupData.groups;
  state.cards = cardData.cards;
  state.rounds = roundData.rounds;
  state.settings = {
    target_name: "",
    jlpt_exam_date: "",
    jlpt_level: "",
    weak_card_threshold: DEFAULT_WEAK_CARD_THRESHOLD,
    weak_recent_rounds: DEFAULT_WEAK_RECENT_ROUNDS,
    weak_recent_wrong_threshold: DEFAULT_WEAK_RECENT_WRONG_THRESHOLD,
    ...(settingsData.settings || {}),
  };
  if (!state.collections.some((collection) => collection.id === state.selectedCollectionId)) {
    state.selectedCollectionId = state.collections[0]?.id ?? null;
  }
  if (
    state.groupDetailCollectionId &&
    !state.collections.some((collection) => Number(collection.id) === Number(state.groupDetailCollectionId))
  ) {
    state.groupDetailCollectionId = null;
  }
  const selectedCollectionGroups = getGroupsForCollection(state.selectedCollectionId);
  const selectedGroupIds = new Set(selectedCollectionGroups.map((group) => Number(group.id)));
  state.selectedStudyGroupIds = state.selectedStudyGroupIds
    .map(Number)
    .filter((groupId) => selectedGroupIds.has(groupId));
  if (!state.selectedStudyGroupIds.length) {
    state.selectedStudyGroupIds = selectedCollectionGroups.filter((group) => number(group.card_count) > 0).map((group) => group.id);
  }
  if (!state.groups.some((group) => group.id === state.selectedGroupId)) {
    state.selectedGroupId = state.groups[0]?.id ?? null;
  }
  if (
    state.cardFilterCollectionId &&
    state.cardFilterCollectionId !== "all" &&
    !state.collections.some((collection) => String(collection.id) === String(state.cardFilterCollectionId))
  ) {
    state.cardFilterCollectionId = "";
  }
  if (!state.cardFilterCollectionId && state.collections.length) {
    state.cardFilterCollectionId = "all";
  }
  if (state.cardFilterGroupId && !state.groups.some((group) => String(group.id) === String(state.cardFilterGroupId))) {
    state.cardFilterGroupId = "";
  }
  const filteredGroup = state.groups.find((group) => String(group.id) === String(state.cardFilterGroupId));
  if (filteredGroup) {
    state.cardFilterCollectionId = String(filteredGroup.collection_id);
  }
  if (
    state.cardFilterCollectionId !== "all" &&
    state.cardFilterCollectionId &&
    state.cardFilterGroupId &&
    !getGroupsForCollection(state.cardFilterCollectionId).some((group) => String(group.id) === String(state.cardFilterGroupId))
  ) {
    state.cardFilterGroupId = "";
  }
  if (state.weakCardOpenId && !state.cards.some((card) => Number(card.id) === Number(state.weakCardOpenId))) {
    state.weakCardOpenId = null;
  }
}

function getHeaderContext() {
  if (!state.user) return "로그인";
  if (state.activeTab === "study") {
    if (state.session?.savedRound) return `${state.session.group.name} · 완료`;
    if (state.session) {
      if (state.session.studyMode === "weak") return `${state.session.group.name} · 복습`;
      if (state.session.studyMode === "practice") return `${state.session.group.name} · 묶음 연습`;
      return `${state.session.group.name} · ${state.session.roundNo}회독`;
    }
    if (state.studyStep === "ready") {
      const selected = getSelectedGroup();
      return selected ? `학습 · ${selected.name}` : "학습 · 소그룹 선택";
    }
    if (state.studyStep === "collection") {
      const collection = getSelectedCollection();
      return collection ? `학습 · ${collection.name}` : "학습 · 대그룹 선택";
    }
    return "학습 · 대그룹 선택";
  }
  if (state.activeTab === "cards") {
    if (state.editingCardId) return "카드 · 수정";
    return state.cardScreen === "form" ? "카드 · 등록" : "카드 관리";
  }
  if (state.activeTab === "groups") {
    if (state.editingCollectionId) return "대그룹 · 수정";
    if (state.editingGroupId) return "소그룹 · 수정";
    if (state.groupScreen === "collection-form") return "대그룹 · 만들기";
    if (state.groupScreen === "group-form") return "소그룹 · 만들기";
    if (state.groupDetailCollectionId) {
      const collection = state.collections.find((item) => Number(item.id) === Number(state.groupDetailCollectionId));
      return collection ? `묶음 · ${collection.name}` : "묶음 관리";
    }
    return "묶음 관리";
  }
  if (state.activeTab === "settings") return "설정";
  return TAB_LABELS[state.activeTab] || "벼락치기";
}

function getExamDateInfo() {
  const value = state.settings?.jlpt_exam_date;
  if (!value) return null;
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.ceil((targetStart - todayStart) / 86400000);
  const dateLabel = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(targetStart);
  let label = `D-${diffDays}`;
  if (diffDays === 0) label = "D-Day";
  if (diffDays < 0) label = `D+${Math.abs(diffDays)}`;
  return { value, diffDays, dateLabel, label };
}

function getTargetLabel() {
  const customName = String(state.settings?.target_name || "").trim();
  if (customName) return customName;
  return state.settings?.jlpt_level ? `JLPT ${state.settings.jlpt_level}` : "목표";
}

function renderHeader() {
  const examInfo = getExamDateInfo();
  const ddayMarkup =
    state.user && (state.settings?.target_name || state.settings?.jlpt_level || examInfo)
      ? `<strong class="dday-badge">${escapeHtml(getTargetLabel())}${
          examInfo ? ` ${escapeHtml(examInfo.label)}` : ""
        }</strong>`
      : "";
  if (headerContextEl) headerContextEl.textContent = getHeaderContext();
  if (headerGreetingEl) {
    headerGreetingEl.hidden = !state.user;
    headerGreetingEl.innerHTML = state.user
      ? `<span>${escapeHtml(state.user.nickname)}님, 오늘도 한 회독 가볍게 가볼까요?</span>`
      : "";
  }
  if (!headerUserEl) return;
  if (!state.user) {
    headerUserEl.hidden = true;
    headerUserEl.innerHTML = "";
    return;
  }
  headerUserEl.hidden = false;
  headerUserEl.innerHTML = `
    ${ddayMarkup}
    <button class="ghost-button small-button" type="button" data-action="logout">${iconLabel("log-out", "로그아웃")}</button>
  `;
}

function setTab(tab) {
  state.activeTab = tab;
  views.auth.classList.remove("active");
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  Object.entries(views).forEach(([key, view]) => {
    if (key !== "auth") view.classList.toggle("active", key === tab);
  });
}

function matchesQuery(values, query) {
  const needle = String(query || "").trim().toLocaleLowerCase();
  if (!needle) return true;
  return values.some((value) => String(value || "").toLocaleLowerCase().includes(needle));
}

function renderMarkedText(value) {
  const text = String(value || "");
  const pattern = /\[\[([\s\S]+?)\]\]/g;
  let html = "";
  let index = 0;
  let match = pattern.exec(text);
  while (match) {
    html += escapeHtml(text.slice(index, match.index));
    html += `<mark class="grammar-mark">${escapeHtml(match[1])}</mark>`;
    index = match.index + match[0].length;
    match = pattern.exec(text);
  }
  html += escapeHtml(text.slice(index));
  return html;
}

function renderJapaneseText(value) {
  return `<span class="jp-text">${escapeHtml(value)}</span>`;
}

function renderMarkedJapaneseText(value) {
  return `<span class="jp-text">${renderMarkedText(value)}</span>`;
}

function parseBulkExampleText(value) {
  const examples = [];
  String(value || "")
    .replace(/\n/g, ";")
    .split(";")
    .forEach((rawPart) => {
      const part = rawPart.trim();
      if (!part) return;
      let japanese = part;
      let korean = "";
      if (part.includes("=>")) {
        [japanese, korean] = part.split(/=>([\s\S]*)/, 2);
      } else if (part.includes("::")) {
        [japanese, korean] = part.split(/::([\s\S]*)/, 2);
      } else if (part.includes("->")) {
        [japanese, korean] = part.split(/->([\s\S]*)/, 2);
      }
      japanese = String(japanese || "").trim();
      korean = String(korean || "").trim();
      if (japanese) examples.push({ japanese, korean });
    });
  return examples;
}

function parseBulkCardText(text) {
  const rawText = String(text || "").trim();
  const errors = [];
  const items = [];
  if (!rawText) return { items, errors: ["대량 등록할 카드를 입력하세요."] };
  rawText.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNo = index + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;
    const columns = (line.includes("\t") ? line.split("\t") : line.split("|")).map((part) => part.trim());
    if (columns.length < 2) {
      errors.push(`${lineNo}번째 줄은 앞면과 뒷면이 필요합니다.`);
      return;
    }
    const front = columns[0];
    const back = columns[1];
    if (!front) errors.push(`${lineNo}번째 줄 앞면을 입력하세요.`);
    if (front.length > 200) errors.push(`${lineNo}번째 줄 앞면은 200자 이하여야 합니다.`);
    if (!back) errors.push(`${lineNo}번째 줄 뒷면을 입력하세요.`);
    if (back.length > 500) errors.push(`${lineNo}번째 줄 뒷면은 500자 이하여야 합니다.`);
    items.push({
      lineNo,
      front,
      back,
      memo: columns.length >= 3 ? columns[2] : "",
      examples: columns.length >= 4 ? parseBulkExampleText(columns.slice(3).join(" | ")) : [],
      warnings: [],
    });
  });
  if (!items.length && !errors.length) errors.push("등록할 카드가 없습니다.");
  if (items.length > 500) errors.push("한 번에 500개까지만 등록할 수 있습니다.");
  return { items, errors };
}

function sameFront(left, right) {
  return String(left || "").trim() === String(right || "").trim();
}

function findDuplicateCard(groupId, front, excludeCardId = null) {
  const normalizedFront = String(front || "").trim();
  if (!normalizedFront) return null;
  return (
    state.cards.find(
      (card) =>
        Number(card.group_id) === Number(groupId) &&
        Number(card.id) !== Number(excludeCardId) &&
        sameFront(card.front, normalizedFront),
    ) || null
  );
}

function buildBulkPreview(groupId, text) {
  const parsed = parseBulkCardText(text);
  const seen = new Map();
  parsed.items.forEach((item) => {
    const existing = findDuplicateCard(groupId, item.front);
    if (existing) item.warnings.push(`이미 등록됨: ${existing.front}`);
    const key = item.front.trim();
    if (key) {
      if (seen.has(key)) item.warnings.push(`${seen.get(key)}번째 줄과 앞면이 같습니다.`);
      else seen.set(key, item.lineNo);
    }
  });
  const warningCount = parsed.items.reduce((sum, item) => sum + item.warnings.length, 0);
  return { groupId, text, items: parsed.items, errors: parsed.errors, warningCount };
}

function renderSearchInput({ id, value, placeholder }) {
  return `
    <div class="search-field">
      <span class="search-icon" aria-hidden="true">${icon("search")}</span>
      <input id="${id}" class="input" type="search" value="${escapeHtml(value)}" placeholder="${escapeHtml(
        placeholder,
      )}" aria-label="${escapeHtml(placeholder)}" autocomplete="off" />
      ${
        value
          ? `<button class="search-clear" type="button" data-action="clear-search" data-target="${id}" aria-label="${escapeHtml(
              placeholder,
            )} 지우기">${icon("x")}</button>`
          : ""
      }
    </div>
  `;
}

function refocusInput(id) {
  const input = document.getElementById(id);
  if (!input) return;
  try {
    input.focus({ preventScroll: true });
  } catch {
    input.focus();
  }
  const end = input.value.length;
  input.setSelectionRange(end, end);
}

function getSelectedGroup() {
  return state.groups.find((group) => group.id === state.selectedGroupId) ?? null;
}

function getSelectedCollection() {
  return state.collections.find((collection) => collection.id === state.selectedCollectionId) ?? null;
}

function getGroupsForCollection(collectionId) {
  return state.groups.filter((group) => Number(group.collection_id) === Number(collectionId));
}

function getSelectedStudyGroups() {
  const selectedIds = new Set(state.selectedStudyGroupIds.map(Number));
  return getGroupsForCollection(state.selectedCollectionId).filter((group) => selectedIds.has(Number(group.id)));
}

function getSelectedStudyCardCount() {
  return getSelectedStudyGroups().reduce((sum, group) => sum + number(group.card_count), 0);
}

function getPracticeSelectableGroups(collectionId = state.selectedCollectionId) {
  return getGroupsForCollection(collectionId).filter((group) => number(group.card_count) > 0);
}

function getPracticePresetGroups(preset) {
  const groups = getPracticeSelectableGroups();
  if (preset === "today") return groups.filter((group) => !isToday(group.last_studied_at));
  if (preset === "wrong") return groups.filter((group) => number(group.wrong_total) > 0);
  if (preset === "stale") {
    return [...groups]
      .sort(
        (left, right) =>
          dateMs(left.last_studied_at) - dateMs(right.last_studied_at) ||
          number(left.completed_rounds) - number(right.completed_rounds) ||
          compareGroupName(left, right),
      )
      .slice(0, 3);
  }
  return groups;
}

function roundIncludesGroup(round, groupId) {
  if (Number(round?.group_id) === Number(groupId)) return true;
  return String(round?.selected_group_ids || "")
    .split(",")
    .map((value) => Number(value))
    .includes(Number(groupId));
}

function getCardFilterGroups() {
  if (!state.cardFilterCollectionId || state.cardFilterCollectionId === "all") return [];
  return getGroupsForCollection(state.cardFilterCollectionId);
}

function getCardFormSelection(groupId) {
  const requestedGroupId = Number(groupId || 0);
  const requestedGroup = state.groups.find((group) => Number(group.id) === requestedGroupId);
  const collectionId =
    requestedGroup?.collection_id ??
    (Number(state.selectedCollectionId || 0) ||
      Number(state.cardFilterCollectionId || 0) ||
      state.groups[0]?.collection_id ||
      state.collections[0]?.id ||
      null);
  const groups = getGroupsForCollection(collectionId);
  const selectedGroupId = groups.some((group) => Number(group.id) === requestedGroupId)
    ? requestedGroupId
    : groups[0]?.id || null;
  return { collectionId, groups, groupId: selectedGroupId };
}

function getGroupLabel(group) {
  const groupName = group?.name || group?.group_name || "";
  return group?.collection_name ? `${group.collection_name} / ${groupName}` : groupName;
}

function subgroupOptions(groups, selectedId) {
  return groups
    .map(
      (group) =>
        `<option value="${group.id}" ${Number(selectedId) === group.id ? "selected" : ""}>${escapeHtml(group.name)}</option>`,
    )
    .join("");
}

function collectionOptions(selectedId) {
  return state.collections
    .map(
      (collection) =>
        `<option value="${collection.id}" ${Number(selectedId) === collection.id ? "selected" : ""}>${escapeHtml(
          collection.name,
        )}</option>`,
    )
    .join("");
}

function elapsedSeconds(session) {
  if (!session?.startedAtMs) return 0;
  return Math.max(0, Math.floor((Date.now() - session.startedAtMs) / 1000));
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function renderRoundTime(round) {
  const startedAt = escapeHtml(formatDate(round.started_at));
  const completedAt = escapeHtml(formatDate(round.completed_at));
  const duration = escapeHtml(formatDuration(round.duration_seconds));
  return `
    <div class="round-time-grid" aria-label="회독 시간">
      <div class="round-time-item">
        <span>시작</span>
        <strong>${startedAt}</strong>
      </div>
      <div class="round-time-item">
        <span>종료</span>
        <strong>${completedAt}</strong>
      </div>
      <div class="round-time-item duration">
        <span>소요</span>
        <strong>${duration}</strong>
      </div>
    </div>
  `;
}

function parseAppDate(value) {
  if (!value) return null;
  const text = String(value);
  const date = text.includes("T") ? new Date(text) : new Date(text.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? null : date;
}

function isToday(value) {
  const date = parseAppDate(value);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function dateMs(value) {
  const date = parseAppDate(value);
  return date ? date.getTime() : 0;
}

function getGroupRecentAccuracy(group) {
  const total = number(group.latest_first_attempt_total);
  if (!total) return null;
  const correct = number(group.latest_first_attempt_correct_count);
  return Math.round((correct / total) * 100);
}

function getAccuracyTone(rate) {
  if (rate === null) return "";
  if (rate >= 80) return "good";
  if (rate >= 50) return "warn";
  return "bad";
}

function renderGroupRecentAccuracy(group) {
  const rate = getGroupRecentAccuracy(group);
  if (rate === null) return "";
  return `<span class="accuracy-pill ${getAccuracyTone(rate)}">최근 정답률 ${rate}%</span>`;
}

function compareGroupName(left, right) {
  return String(left.name || "").localeCompare(String(right.name || ""), "ko") || number(left.id) - number(right.id);
}

function sortStudyGroups(groups) {
  return [...groups].sort((left, right) => {
    if (state.studyGroupSortMode === "wrong") {
      return (
        number(right.wrong_total) - number(left.wrong_total) ||
        dateMs(right.last_studied_at) - dateMs(left.last_studied_at) ||
        compareGroupName(left, right)
      );
    }
    if (state.studyGroupSortMode === "cards") {
      return (
        number(right.card_count) - number(left.card_count) ||
        dateMs(right.last_studied_at) - dateMs(left.last_studied_at) ||
        compareGroupName(left, right)
      );
    }
    if (state.studyGroupSortMode === "name") {
      return compareGroupName(left, right);
    }
    return (
      dateMs(right.last_studied_at) - dateMs(left.last_studied_at) ||
      number(right.completed_rounds) - number(left.completed_rounds) ||
      compareGroupName(left, right)
    );
  });
}

function getRecentStudyGroup() {
  return (
    [...state.groups]
      .filter((group) => dateMs(group.last_studied_at) > 0)
      .sort(
        (left, right) =>
          dateMs(right.last_studied_at) - dateMs(left.last_studied_at) ||
          number(right.completed_rounds) - number(left.completed_rounds) ||
          compareGroupName(left, right),
      )[0] || null
  );
}

function cardAttemptCount(card) {
  return number(card.correct_count) + number(card.wrong_count);
}

function cardWrongRate(card) {
  const attempts = cardAttemptCount(card);
  return attempts ? number(card.wrong_count) / attempts : 0;
}

function getWeakCardThreshold() {
  const threshold = Number(state.settings?.weak_card_threshold);
  if (!Number.isFinite(threshold)) return DEFAULT_WEAK_CARD_THRESHOLD;
  return Math.min(20, Math.max(1, Math.round(threshold)));
}

function getWeakRecentRounds() {
  const rounds = Number(state.settings?.weak_recent_rounds);
  if (!Number.isFinite(rounds)) return DEFAULT_WEAK_RECENT_ROUNDS;
  return Math.min(20, Math.max(1, Math.round(rounds)));
}

function getWeakRecentWrongThreshold() {
  const threshold = Number(state.settings?.weak_recent_wrong_threshold);
  if (!Number.isFinite(threshold)) return DEFAULT_WEAK_RECENT_WRONG_THRESHOLD;
  return Math.min(20, Math.max(1, Math.round(threshold)));
}

function cardRoundWrongCount(card) {
  return number(card.round_wrong_count ?? card.wrong_count);
}

function cardRecentWrongCount(card) {
  return number(card.recent_wrong_count);
}

function isWeakCard(card) {
  return cardRecentWrongCount(card) >= getWeakRecentWrongThreshold() || cardRoundWrongCount(card) >= getWeakCardThreshold();
}

function getWeakCards() {
  return [...state.cards]
    .filter(isWeakCard)
    .sort(
      (left, right) =>
        cardRecentWrongCount(right) - cardRecentWrongCount(left) ||
        cardRoundWrongCount(right) - cardRoundWrongCount(left) ||
        cardWrongRate(right) - cardWrongRate(left) ||
        number(left.correct_count) - number(right.correct_count) ||
        compareGroupName({ name: left.group_name, id: left.group_id }, { name: right.group_name, id: right.group_id }) ||
        number(left.id) - number(right.id),
    );
}

function syncStudyTimer() {
  const shouldRun = Boolean(state.session && !state.session.savedRound);
  if (shouldRun && !studyTimerId) studyTimerId = window.setInterval(updateStudyTimer, 1000);
  if (!shouldRun && studyTimerId) {
    window.clearInterval(studyTimerId);
    studyTimerId = null;
  }
  updateStudyTimer();
}

function updateStudyTimer() {
  if (!state.session || state.session.savedRound) return;
  const timerEl = document.querySelector("#study-elapsed");
  if (timerEl) timerEl.textContent = formatDuration(elapsedSeconds(state.session));
}

function render() {
  const inActiveStudy = Boolean(state.user && state.activeTab === "study" && state.session && !state.session.savedRound);
  document.body.classList.toggle("study-mode", inActiveStudy);
  if (!state.user) {
    renderHeader();
    renderAuth();
    renderDialog();
    syncStudyTimer();
    return;
  }
  document.body.classList.remove("auth-mode");
  renderHeader();
  setTab(state.activeTab);
  renderStudy();
  renderCards();
  renderGroups();
  renderSettings();
  renderDialog();
  syncStudyTimer();
}

function renderAuth() {
  document.body.classList.add("auth-mode");
  document.body.classList.remove("study-mode");
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.remove("active"));
  Object.entries(views).forEach(([key, view]) => view.classList.toggle("active", key === "auth"));
  const nickname = state.authValues.nickname ?? DEFAULT_LOGIN.nickname;
  const accessCode = state.authValues.accessCode ?? DEFAULT_LOGIN.accessCode;
  views.auth.innerHTML = `
    <div class="panel stack auth-panel">
      <div class="auth-heading">
        <p class="eyebrow">개인 학습 공간</p>
        <h2 id="auth-title">바로 시작하기</h2>
        <p id="auth-help" class="meta">닉네임과 6자리 코드는 같은 학습 데이터를 다시 여는 간단한 열쇠입니다.</p>
      </div>
      <form id="login-form" class="stack" novalidate>
        <label class="field">
          <span>닉네임</span>
          <input class="input" name="nickname" autocomplete="username" value="${escapeHtml(
            nickname,
          )}" placeholder="예: haru" required maxlength="40" aria-describedby="auth-help auth-error" ${
            state.authError ? 'aria-invalid="true"' : ""
          } ${state.authPending ? "disabled" : ""} />
        </label>
        <label class="field">
          <span>6자리 코드</span>
          <input class="input" name="access_code" inputmode="numeric" autocomplete="one-time-code" value="${escapeHtml(
            accessCode,
          )}" placeholder="숫자 6자리" required maxlength="6" pattern="[0-9]{6}" aria-describedby="auth-help auth-error" ${
            state.authError ? 'aria-invalid="true"' : ""
          } ${state.authPending ? "disabled" : ""} />
        </label>
        ${state.authError ? `<p id="auth-error" class="auth-error" role="alert">${escapeHtml(state.authError)}</p>` : ""}
        <button class="primary-button full" type="submit" ${state.authPending ? "disabled" : ""}>${iconLabel(
          "log-in",
          state.authPending ? "확인 중" : "들어가기",
        )}</button>
      </form>
      <p class="auth-note">처음 쓰는 닉네임이면 새 학습 공간을 만들고, 같은 닉네임이면 이 코드로 다시 들어갑니다.</p>
    </div>
  `;
  if (!state.authPending) {
    window.requestAnimationFrame(() => views.auth.querySelector('input[name="nickname"]')?.focus({ preventScroll: true }));
  }
}

function renderConfirmDialog({ eyebrow, title, message, confirmLabel, confirmAction, tone = "danger" }) {
  const buttonClass = tone === "primary" ? "primary-button" : "danger-button";
  const confirmIcon = tone === "primary" ? "check" : "alert-triangle";
  dialogRoot.innerHTML = `
    <div class="dialog-backdrop" role="presentation">
      <section class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title" aria-describedby="study-dialog-message">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h2 id="study-dialog-title">${escapeHtml(title)}</h2>
        <p id="study-dialog-message" class="meta">${escapeHtml(message)}</p>
        <div class="button-row">
          <button class="ghost-button" type="button" data-action="close-dialog">${iconLabel("x", "취소")}</button>
          <button class="${buttonClass}" type="button" data-action="${confirmAction}">${iconLabel(confirmIcon, confirmLabel)}</button>
        </div>
      </section>
    </div>
  `;
}

function renderDialog() {
  document.body.classList.toggle("dialog-open", Boolean(state.activeDialog));
  if (!state.activeDialog) {
    dialogRoot.innerHTML = "";
    return;
  }
  const selectedGroup = getSelectedGroup();
  if (state.activeDialog === "start" && selectedGroup) {
    renderConfirmDialog({
      eyebrow: "시작",
      title: `${number(selectedGroup.completed_rounds) + 1}회독을 시작할까요?`,
      message: `${selectedGroup.name} · 카드 ${number(selectedGroup.card_count)}개 · ${ORDER_LABELS[state.orderMode]} · ${
        EXAMPLE_DISPLAY_LABELS[state.exampleDisplayMode]
      }`,
      confirmLabel: "시작",
      confirmAction: "confirm-start-study",
      tone: "primary",
    });
    return;
  }
  if (state.activeDialog === "start-weak") {
    const weakCards = getWeakCards();
    renderConfirmDialog({
      eyebrow: "복습",
      title: `약점 카드 ${weakCards.length}개를 복습할까요?`,
      message: `최근 ${getWeakRecentRounds()}회독 ${getWeakRecentWrongThreshold()}회 이상 또는 전체 ${getWeakCardThreshold()}회 이상 틀린 카드를 봅니다.`,
      confirmLabel: "시작",
      confirmAction: "confirm-start-weak-study",
      tone: "primary",
    });
    return;
  }
  if (state.activeDialog === "collection-study-picker") {
    renderCollectionStudyDialog();
    return;
  }
  const previewTarget = getPreviewTarget();
  if (state.activeDialog === "preview" && previewTarget) {
    const previewMode = state.pendingAction ? "sequence" : state.orderMode;
    const previewCards = getPreviewCards(previewTarget.groupIds, previewMode);
    dialogRoot.innerHTML = `
      <div class="dialog-backdrop" role="presentation">
        <section class="dialog-panel preview-dialog" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title">
          <p class="eyebrow">미리보기</p>
          <h2 id="study-dialog-title">${escapeHtml(previewTarget.name)} 카드</h2>
          <p class="meta">${previewCards.length}개 · ${
            previewMode === "random" ? "기본 순서" : ORDER_LABELS[previewMode]
          }</p>
          <div class="preview-list">
            ${
              previewCards.length
                ? previewCards.map(renderPreviewCard).join("")
                : `<div class="empty-state">이 소그룹에는 카드가 없습니다.</div>`
            }
          </div>
          <button class="primary-button full" type="button" data-action="close-dialog">${iconLabel("check", "닫기")}</button>
        </section>
      </div>
    `;
    return;
  }
  if (state.activeDialog === "round-detail") {
    renderRoundDetailDialog();
    return;
  }
  if (state.activeDialog === "return-completion") {
    const isWeakReturn = state.session?.studyMode === "weak";
    renderConfirmDialog({
      eyebrow: "돌아가기",
      title: isWeakReturn ? "약점 카드 목록으로 돌아갈까요?" : "학습 설정으로 돌아갈까요?",
      message: isWeakReturn
        ? "완료 결과 화면을 닫고 약점 카드 목록이 있는 소그룹 선택 화면으로 돌아갑니다."
        : "완료 결과 화면을 닫고 다음 회독을 시작할 수 있는 설정 화면으로 돌아갑니다.",
      confirmLabel: "돌아가기",
      confirmAction: "confirm-end-study",
      tone: "primary",
    });
    return;
  }
  if (state.activeDialog === "logout") {
    renderConfirmDialog({
      eyebrow: "로그아웃",
      title: "로그아웃할까요?",
      message:
        state.session && !state.session.savedRound
          ? "진행 중인 회독은 저장되지 않고 로그인 화면으로 돌아갑니다."
          : "현재 기기에서 로그인 정보를 지우고 로그인 화면으로 돌아갑니다.",
      confirmLabel: "로그아웃",
      confirmAction: "confirm-logout",
    });
    return;
  }
  if (state.activeDialog === "clear-exam-date") {
    renderConfirmDialog({
      eyebrow: "초기화",
      title: "학습 목표를 초기화할까요?",
      message: "목표 이름, 선택 급수, 목표일을 모두 미정으로 돌립니다.",
      confirmLabel: "초기화",
      confirmAction: "confirm-clear-exam-date",
    });
    return;
  }
  if (state.activeDialog === "leave") {
    renderConfirmDialog({
      eyebrow: "이동",
      title: "학습을 종료하고 이동할까요?",
      message: `${TAB_LABELS[state.pendingTab] || "다른"} 탭으로 이동하면 지금까지의 답변은 저장되지 않습니다.`,
      confirmLabel: "이동",
      confirmAction: "confirm-leave-study",
    });
    return;
  }
  if (state.activeDialog === "delete-card") {
    const card = state.cards.find((item) => item.id === Number(state.pendingAction?.id));
    if (!card) return closeDialog();
    renderConfirmDialog({
      eyebrow: "삭제",
      title: "카드를 삭제할까요?",
      message: `${card.front} 카드를 삭제합니다. 예문과 기록도 함께 정리됩니다.`,
      confirmLabel: "삭제",
      confirmAction: "confirm-delete-card",
    });
    return;
  }
  if (state.activeDialog === "reset-history") {
    const target = state.groups.find((item) => item.id === Number(state.pendingAction?.id));
    if (!target) return closeDialog();
    renderConfirmDialog({
      eyebrow: "초기화",
      title: "학습기록을 초기화할까요?",
      message: `${target.name} 소그룹의 회독 기록과 알맞음/틀림 통계를 초기화합니다. 카드와 예문은 유지됩니다.`,
      confirmLabel: "초기화",
      confirmAction: "confirm-reset-history",
    });
    return;
  }
  if (state.activeDialog === "reset-collection-history") {
    const target = state.collections.find((item) => item.id === Number(state.pendingAction?.id));
    if (!target) return closeDialog();
    renderConfirmDialog({
      eyebrow: "초기화",
      title: "하위 소그룹 기록을 초기화할까요?",
      message: `${target.name} 대그룹의 모든 소그룹 회독 기록과 카드 통계를 초기화합니다. 카드와 예문은 유지됩니다.`,
      confirmLabel: "초기화",
      confirmAction: "confirm-reset-collection-history",
    });
    return;
  }
  if (state.activeDialog === "delete-group") {
    const target = state.groups.find((item) => item.id === Number(state.pendingAction?.id));
    if (!target) return closeDialog();
    renderConfirmDialog({
      eyebrow: "삭제",
      title: "소그룹을 삭제할까요?",
      message: `${target.name} 소그룹과 카드 ${number(target.card_count)}개를 삭제합니다.`,
      confirmLabel: "삭제",
      confirmAction: "confirm-delete-group",
    });
    return;
  }
  if (state.activeDialog === "delete-collection") {
    const target = state.collections.find((item) => item.id === Number(state.pendingAction?.id));
    if (!target) return closeDialog();
    renderConfirmDialog({
      eyebrow: "삭제",
      title: "대그룹을 삭제할까요?",
      message: `${target.name} 대그룹과 소그룹 ${number(target.group_count)}개, 카드 ${number(target.card_count)}개를 삭제합니다.`,
      confirmLabel: "삭제",
      confirmAction: "confirm-delete-collection",
    });
    return;
  }
  if (state.activeDialog === "restore-backup") {
    renderConfirmDialog({
      eyebrow: "복원",
      title: "백업을 복원할까요?",
      message: "현재 대그룹, 소그룹, 카드, 예문, 회독 기록을 지우고 백업 내용으로 교체합니다.",
      confirmLabel: "복원",
      confirmAction: "confirm-restore-backup",
    });
    return;
  }
  renderConfirmDialog({
    eyebrow: "중단",
    title: "회독을 포기할까요?",
    message: "지금까지의 답변은 저장되지 않고, 현재 소그룹의 학습 설정 화면으로 돌아갑니다.",
    confirmLabel: "포기",
    confirmAction: "confirm-quit-study",
  });
}

function closeDialog() {
  state.activeDialog = null;
  state.roundDetail = null;
  state.pendingTab = null;
  state.pendingAction = null;
  renderDialog();
}

function getPreviewTarget() {
  if (state.pendingAction?.type === "preview-group-cards") {
    const group = state.groups.find((item) => item.id === Number(state.pendingAction.id));
    return group ? { name: getGroupLabel(group), groupIds: [group.id] } : null;
  }
  if (state.pendingAction?.type === "preview-collection-cards") {
    const collection = state.collections.find((item) => item.id === Number(state.pendingAction.id));
    if (!collection) return null;
    return { name: collection.name, groupIds: getGroupsForCollection(collection.id).map((group) => group.id) };
  }
  if (state.pendingAction?.type === "preview-bundle-cards") {
    const collection = state.collections.find((item) => item.id === Number(state.pendingAction.id));
    const groupIds = state.pendingAction.groupIds || [];
    return collection ? { name: `${collection.name} 묶음 연습`, groupIds } : null;
  }
  const group = getSelectedGroup();
  return group ? { name: getGroupLabel(group), groupIds: [group.id] } : null;
}

function getPreviewCards(groupIds, orderMode = state.orderMode) {
  const groupIdSet = new Set((groupIds || []).map(Number));
  const cards = state.cards.filter((card) => groupIdSet.has(Number(card.group_id)));
  if (orderMode === "wrong") {
    return [...cards].sort((a, b) => {
      const aTotal = number(a.correct_count) + number(a.wrong_count);
      const bTotal = number(b.correct_count) + number(b.wrong_count);
      const aRate = aTotal ? number(a.wrong_count) / aTotal : 0;
      const bRate = bTotal ? number(b.wrong_count) / bTotal : 0;
      return number(b.wrong_count) - number(a.wrong_count) || bRate - aRate || number(a.id) - number(b.id);
    });
  }
  return [...cards].sort((a, b) => number(a.id) - number(b.id));
}

function renderPreviewCard(card) {
  return `
    <article class="preview-card">
      <div class="item-title">
        <strong>${renderJapaneseText(card.front)}</strong>
        <span class="pill">${card.examples?.length || 0}예문</span>
      </div>
      <p>${escapeHtml(card.back)}</p>
      <p class="meta">알맞음 ${number(card.correct_count)} · 틀림 ${number(card.wrong_count)}</p>
    </article>
  `;
}

function renderStudy() {
  if (state.session) return renderStudySession();
  const selected = getSelectedGroup();
  const selectedCollection = getSelectedCollection();
  if (!state.collections.length) {
    views.study.innerHTML = `
      <div class="panel stack">
        <p class="eyebrow">학습</p>
        <h2 id="study-title">대그룹 선택</h2>
        <div class="empty-state">대그룹을 먼저 만들면 소그룹을 담아 학습할 수 있어요.</div>
        <button class="primary-button full" type="button" data-action="go-groups">${iconLabel("plus", "대그룹 만들기")}</button>
      </div>
    `;
    return;
  }
  if (state.studyStep === "ready" && selected) return renderStudySetup(selected);
  if (state.studyStep === "collection" && selectedCollection) return renderStudySubgroupPicker(selectedCollection);
  return renderStudyGroupPicker();
}

function renderStudyGroupPicker() {
  const totalCards = state.collections.reduce((sum, collection) => sum + number(collection.card_count), 0);
  const recentGroup = getRecentStudyGroup();
  const visibleCollections = state.collections.filter((collection) =>
    matchesQuery([collection.name, collection.description], state.studyGroupSearchQuery),
  );
  views.study.innerHTML = `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">학습</p>
          <h2 id="study-title">오늘의 학습</h2>
        </div>
        <span class="pill">${state.collections.length}대그룹</span>
      </div>
      <p class="meta">전체 ${totalCards}개의 카드</p>
      ${renderTodayStudyPanel(recentGroup)}
      ${renderWeakCardsPanel()}
      <section id="study-collection-browser" class="group-browser-block">
        <div class="completion-header">
          <h3>대그룹 찾아보기</h3>
          <span class="pill">${visibleCollections.length}개</span>
        </div>
        <div class="study-group-tools">
          ${renderSearchInput({ id: "study-group-search", value: state.studyGroupSearchQuery, placeholder: "대그룹 검색" })}
        </div>
        <div class="study-group-scroll">
          ${
            visibleCollections.length
              ? visibleCollections.map(renderStudyCollectionChoiceItem).join("")
              : `<div class="empty-state">검색된 대그룹이 없습니다.</div>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderStudySubgroupPicker(collection) {
  const collectionGroups = sortStudyGroups(
    getGroupsForCollection(collection.id).filter((group) =>
      matchesQuery([group.name, group.description, group.collection_name], state.studyGroupSearchQuery),
    ),
  );
  views.study.innerHTML = `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">대그룹</p>
          <h2 id="study-title">${escapeHtml(collection.name)}</h2>
        </div>
        <button class="ghost-button small-button" type="button" data-action="back-to-study-collections">${iconLabel(
          "arrow-left",
          "대그룹 보기",
        )}</button>
      </div>
      <p class="meta">${escapeHtml(collection.description || "설명 없음")}</p>
      <div class="stat-grid">
        <div class="stat"><strong>${number(collection.group_count)}</strong><span>소그룹</span></div>
        <div class="stat"><strong>${number(collection.card_count)}</strong><span>카드</span></div>
      </div>
      <p class="meta">회독 기록은 소그룹별로 저장되고, 묶음 연습은 공식 기록에 저장되지 않습니다.</p>
      <button class="secondary-button full" type="button" data-action="open-collection-study-dialog" ${
        number(collection.card_count) ? "" : "disabled"
      }>${iconLabel("repeat-2", "묶음 연습")}</button>
      <section class="group-browser-block">
        <div class="completion-header">
          <h3>소그룹 선택</h3>
          <span class="pill">${collectionGroups.length}개</span>
        </div>
        <div class="study-group-tools">
          ${renderSearchInput({ id: "study-group-search", value: state.studyGroupSearchQuery, placeholder: "소그룹 검색" })}
          ${renderStudyGroupSortOptions()}
        </div>
        <div class="study-group-scroll">
          ${
            collectionGroups.length
              ? collectionGroups.map(renderStudyGroupChoiceItem).join("")
              : `<div class="empty-state">검색된 소그룹이 없습니다.</div>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderStudyGroupSortOptions() {
  return `
    <div class="segmented study-sort-options" role="group" aria-label="소그룹 정렬">
      ${Object.entries(STUDY_GROUP_SORT_LABELS)
        .map(
          ([mode, label]) => `
            <button class="segment ${state.studyGroupSortMode === mode ? "active" : ""}" type="button" data-action="set-study-group-sort" data-sort="${mode}">
              ${label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTodayStudyPanel(recentGroup) {
  const weakCards = getWeakCards();
  const totalThreshold = getWeakCardThreshold();
  const recentRounds = getWeakRecentRounds();
  const recentThreshold = getWeakRecentWrongThreshold();
  const nextRoundNo = recentGroup ? number(recentGroup.completed_rounds) + 1 : 1;
  const recentMeta = recentGroup
    ? `${nextRoundNo}회독 준비 · 마지막 ${formatDate(recentGroup.last_studied_at)}`
    : "아래에서 대그룹을 선택한 뒤 소그룹 회독을 시작하세요.";
  const weakMeta = weakCards.length
    ? `최근 ${recentRounds}회독 ${recentThreshold}회 이상 또는 전체 ${totalThreshold}회 이상`
    : `최근 ${recentRounds}회독 ${recentThreshold}회 이상 또는 전체 ${totalThreshold}회 이상 · 복습할 카드 없음`;
  return `
    <section class="today-study-panel">
      <div class="today-action-grid">
        <article class="today-action-card primary">
          <div>
            <span class="today-action-label">이어서 회독</span>
            <strong>${recentGroup ? escapeHtml(recentGroup.name) : "대그룹 선택"}</strong>
            <p>${escapeHtml(recentMeta)}</p>
          </div>
          <button class="primary-button full" type="button" data-action="${
            recentGroup ? "choose-study-group" : "focus-study-collections"
          }" ${recentGroup ? `data-group-id="${recentGroup.id}"` : ""}>
            ${iconLabel(recentGroup ? "play" : "folder", recentGroup ? "이어가기" : "대그룹 고르기")}
          </button>
        </article>
        <article class="today-action-card weak">
          <div>
            <span class="today-action-label">약점 복습</span>
            <strong>${weakCards.length}개</strong>
            <p>${escapeHtml(weakMeta)}</p>
          </div>
          ${
            weakCards.length
              ? `<div class="today-action-buttons">
                  <button class="secondary-button full" type="button" data-action="start-weak-study">${iconLabel(
                    "rotate-ccw",
                    "복습",
                  )}</button>
                  <button class="ghost-button full" type="button" data-action="toggle-weak-panel">${iconLabel(
                    state.weakPanelOpen ? "chevron-up" : "list",
                    state.weakPanelOpen ? "접기" : "목록 보기",
                  )}</button>
                </div>`
              : `<button class="secondary-button full" type="button" disabled>${iconLabel("rotate-ccw", "복습 없음")}</button>`
          }
        </article>
      </div>
    </section>
  `;
}

function renderRecentStudyGroupCallout(group) {
  return `
    <div class="recent-study-callout">
      <div>
        <p class="eyebrow">최근 학습</p>
        <strong>${escapeHtml(group.name)}</strong>
        <span>마지막 ${formatDate(group.last_studied_at)} · ${number(group.completed_rounds)}회독</span>
      </div>
      <button class="secondary-button small-button" type="button" data-action="choose-study-group" data-group-id="${group.id}">
        ${iconLabel("play", "이어가기")}
      </button>
    </div>
  `;
}

function renderWeakCardsPanel() {
  if (!state.weakPanelOpen || !state.cards.length) return "";
  const totalThreshold = getWeakCardThreshold();
  const recentRounds = getWeakRecentRounds();
  const recentThreshold = getWeakRecentWrongThreshold();
  const weakCards = getWeakCards();
  if (!weakCards.length) return "";
  const recentWrong = weakCards.reduce((sum, card) => sum + cardRecentWrongCount(card), 0);
  const totalWrong = weakCards.reduce((sum, card) => sum + cardRoundWrongCount(card), 0);
  return `
    <section class="weak-card-panel open">
      <div class="row">
        <div>
          <p class="eyebrow">약점 카드</p>
          <h3>목록 미리보기</h3>
        </div>
        <span class="pill ${weakCards.length ? "bad" : ""}">${weakCards.length}개</span>
      </div>
      <p class="meta">최근 ${recentRounds}회독 ${recentThreshold}회 이상 또는 전체 ${totalThreshold}회 이상 · 최근 오답 ${recentWrong}회 · 전체 오답 ${totalWrong}회</p>
      <div class="weak-card-list">${weakCards.map(renderWeakCardItem).join("")}</div>
      <button class="secondary-button full" type="button" data-action="start-weak-study">${iconLabel(
        "rotate-ccw",
        "약점 카드만 학습",
      )}</button>
    </section>
  `;
}

function renderWeakCardItem(card) {
  const isOpen = Number(state.weakCardOpenId) === Number(card.id);
  const attempts = cardAttemptCount(card);
  const wrongRate = attempts ? Math.round(cardWrongRate(card) * 100) : 0;
  const examples = card.examples || [];
  const recentWrong = cardRecentWrongCount(card);
  const totalWrong = cardRoundWrongCount(card);
  return `
    <article class="weak-card-item ${isOpen ? "open" : ""}">
      <button class="weak-card-main" type="button" data-action="toggle-weak-card" data-card-id="${card.id}" aria-expanded="${
        isOpen ? "true" : "false"
      }">
        <div class="item-title">
          <strong>${renderJapaneseText(card.front)}</strong>
          <span class="pill bad">최근 ${recentWrong} · 전체 ${totalWrong}</span>
        </div>
        <p>${escapeHtml(card.back)}</p>
        <div class="weak-card-meta">
          <span>${escapeHtml(card.group_name)}</span>
          <span>최근 ${getWeakRecentRounds()}회독 오답 ${recentWrong}</span>
          <span>전체 회독 오답 ${totalWrong}</span>
          <span>오답률 ${wrongRate}%</span>
        </div>
      </button>
      ${
        isOpen
          ? `
            <div class="weak-card-detail">
              ${card.memo ? `<p class="study-note">${escapeHtml(card.memo)}</p>` : ""}
              ${
                examples.length
                  ? `<ul class="review-examples">${examples
                      .map(
                        (example) => `
                          <li>
                            <p class="example-jp">${renderMarkedJapaneseText(example.japanese)}</p>
                            ${example.korean ? `<p class="example-ko">${renderMarkedText(example.korean)}</p>` : ""}
                          </li>
                        `,
                      )
                      .join("")}</ul>`
                  : `<p class="meta">예문 없음</p>`
              }
            </div>
          `
          : ""
      }
    </article>
  `;
}

function renderStudyCollectionChoiceItem(collection) {
  const cardCount = number(collection.card_count);
  const groupCount = number(collection.group_count);
  return `
    <article class="group-item group-choice ${cardCount ? "" : "empty"}">
      <button class="group-choice-main" type="button" data-action="choose-study-collection" data-collection-id="${collection.id}">
        <div class="item-title">
          <strong>${escapeHtml(collection.name)}</strong>
        </div>
        <p class="meta">${escapeHtml(collection.description || "설명 없음")}</p>
        <div class="group-choice-footer">
          <span>소그룹 ${groupCount}개</span>
          <span>카드 ${cardCount}개</span>
          <span>소그룹 합산</span>
        </div>
      </button>
      ${
        cardCount
          ? `<button class="pill group-card-count group-choice-card-count" type="button" data-action="preview-collection-cards" data-collection-id="${
              collection.id
            }" aria-label="${escapeHtml(`${collection.name} 카드 ${cardCount}개 미리보기`)}">${cardCount}개</button>`
          : `<span class="pill group-choice-card-count">카드 없음</span>`
      }
      ${
        groupCount
          ? ""
          : `<button class="secondary-button full group-choice-empty-action" type="button" data-action="open-group-form-for-collection" data-collection-id="${collection.id}">${iconLabel(
              "plus",
              "소그룹 만들기",
            )}</button>`
      }
    </article>
  `;
}

function renderStudyGroupChoiceItem(group) {
  const cardCount = number(group.card_count);
  const studiedToday = isToday(group.last_studied_at);
  const lastStudyText = group.last_studied_at ? `마지막 ${formatDate(group.last_studied_at)}` : "학습 기록 없음";
  return `
    <article class="group-item group-choice ${cardCount ? "" : "empty"}">
      <button class="group-choice-main" type="button" data-action="choose-study-group" data-group-id="${group.id}">
        <div class="item-title">
          <strong>${escapeHtml(group.name)}</strong>
        </div>
        <p class="meta">${escapeHtml(group.collection_name)} · ${escapeHtml(group.description || "설명 없음")}</p>
        <div class="group-choice-status">
          <span class="today-badge ${studiedToday ? "done" : "pending"}">${
            studiedToday ? "오늘 학습함" : "오늘 미학습"
          }</span>
          <span>${escapeHtml(lastStudyText)}</span>
        </div>
        <div class="group-choice-footer">
          <span>${number(group.completed_rounds)}회독</span>
          ${renderGroupRecentAccuracy(group)}
          <span>오답 ${number(group.wrong_total)}</span>
        </div>
      </button>
      ${
        cardCount
          ? `<button class="pill group-card-count group-choice-card-count" type="button" data-action="preview-group-cards" data-group-id="${
              group.id
            }" aria-label="${escapeHtml(`${group.name} 카드 ${cardCount}개 미리보기`)}">${cardCount}개</button>`
          : `<span class="pill group-choice-card-count">카드 없음</span>`
      }
      ${
        cardCount
          ? ""
          : `<button class="secondary-button full group-choice-empty-action" type="button" data-action="add-card-to-study-group" data-group-id="${group.id}">${iconLabel(
              "plus",
              "카드 등록",
            )}</button>`
      }
    </article>
  `;
}

function renderStudySetup(selected) {
  const selectedRounds = state.rounds.filter((round) => roundIncludesGroup(round, selected.id)).slice(0, 4);
  views.study.innerHTML = `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">학습</p>
          <h2 id="study-title">${escapeHtml(selected.name)}</h2>
        </div>
        <span class="pill">${number(selected.completed_rounds)}회독</span>
      </div>
      <div class="row">
        <p class="meta">${escapeHtml(selected.collection_name)} · ${escapeHtml(selected.description || "설명 없음")}</p>
        <button class="ghost-button small-button" type="button" data-action="open-study-groups">${iconLabel(
          "arrow-left",
          "소그룹 선택",
        )}</button>
      </div>
      ${renderStudyStartPanel(selected)}
      ${renderStudyOptionsPanel()}
      ${renderSelectedGroupStats(selected)}
      ${renderStudyReadiness(selected)}
    </div>
    ${renderRecentRoundsPanel(selectedRounds)}
  `;
}

function renderStudyGroupSelection(groups) {
  const selectableCount = groups.filter((group) => number(group.card_count) > 0).length;
  if (!groups.length) {
    return `
      <section class="study-subgroup-panel">
        <div class="empty-state">이 대그룹에는 아직 소그룹이 없습니다.</div>
        <button class="primary-button full" type="button" data-action="open-group-form-for-collection" data-collection-id="${
          state.selectedCollectionId
        }">${iconLabel("plus", "소그룹 만들기")}</button>
      </section>
    `;
  }
  const selectedIds = new Set(state.selectedStudyGroupIds.map(Number));
  const selectedCount = groups.filter((group) => selectedIds.has(Number(group.id)) && number(group.card_count) > 0).length;
  return `
    <section class="study-subgroup-panel">
      <div class="completion-header">
        <h3>학습할 소그룹</h3>
        <span class="pill">${selectedCount}/${selectableCount}개</span>
      </div>
      <div class="button-row">
        <button class="secondary-button" type="button" data-action="select-all-study-subgroups">${iconLabel("check", "전체 선택")}</button>
        <button class="ghost-button" type="button" data-action="clear-study-subgroups">${iconLabel("x", "선택 해제")}</button>
      </div>
      <div class="quick-practice-grid" aria-label="빠른 선택">
        <button class="ghost-button" type="button" data-action="select-practice-preset" data-preset="today">오늘 미학습</button>
        <button class="ghost-button" type="button" data-action="select-practice-preset" data-preset="wrong">오답 있음</button>
        <button class="ghost-button" type="button" data-action="select-practice-preset" data-preset="stale">오래된 3개</button>
      </div>
      <div class="study-subgroup-list">
        ${groups
          .map((group) => {
            const checked = selectedIds.has(Number(group.id));
            const disabled = !number(group.card_count);
            return `
              <label class="study-subgroup-option ${checked ? "active" : ""} ${disabled ? "disabled" : ""}">
                <input type="checkbox" data-action="toggle-study-subgroup" data-group-id="${group.id}" ${
                  checked ? "checked" : ""
                } ${disabled ? "disabled" : ""} />
                <span>
                  <strong>${escapeHtml(group.name)}</strong>
                  <small>${number(group.card_count)}개 · ${escapeHtml(group.description || "설명 없음")}</small>
                </span>
              </label>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderCollectionStudyDialog() {
  const collection = getSelectedCollection() || state.collections[0];
  if (!collection) return closeDialog();
  if (state.selectedCollectionId !== collection.id) state.selectedCollectionId = collection.id;
  const groups = getGroupsForCollection(collection.id);
  const selectedGroups = getSelectedStudyGroups();
  const selectedCardCount = getSelectedStudyCardCount();
  const canStart = selectedCardCount > 0;
  dialogRoot.innerHTML = `
    <div class="dialog-backdrop" role="presentation">
      <section class="dialog-panel collection-study-dialog" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title">
        <div class="row">
          <div>
            <p class="eyebrow">묶음 연습</p>
            <h2 id="study-dialog-title">소그룹 선택</h2>
          </div>
          <button class="ghost-button small-button" type="button" data-action="close-dialog">${iconLabel("x", "닫기")}</button>
        </div>
        <label class="field">
          <span>대그룹</span>
          <select id="study-collection-select" class="select" aria-label="학습 대그룹 선택">
            ${collectionOptions(collection.id)}
          </select>
        </label>
        ${renderStudyGroupSelection(groups)}
        <section class="study-start-panel">
          <div>
            <span class="today-action-label">기록 없는 연습</span>
            <strong>${selectedGroups.length}개 소그룹 · 카드 ${selectedCardCount}개</strong>
            <p>${ORDER_LABELS[state.orderMode]} · ${EXAMPLE_DISPLAY_LABELS[state.exampleDisplayMode]} · 공식 기록에 저장 안 함</p>
          </div>
          <div class="study-start-actions">
            <button class="primary-button full" type="button" data-action="start-bundle-study" ${canStart ? "" : "disabled"}>
              ${iconLabel("play", "연습 시작")}
            </button>
            <button class="ghost-button full" type="button" data-action="preview-bundle-cards" ${canStart ? "" : "disabled"}>
              ${iconLabel("eye", "미리보기")}
            </button>
          </div>
        </section>
        ${renderStudyOptionsPanel()}
      </section>
    </div>
  `;
}

function renderStudyStartPanel(group) {
  const nextRoundNo = number(group.completed_rounds) + 1;
  const cardCount = number(group.card_count);
  const canStart = cardCount > 0;
  return `
    <section class="study-start-panel">
      <div>
        <span class="today-action-label">다음 회독</span>
        <strong>${nextRoundNo}회독 시작</strong>
        <p>카드 ${cardCount}개 · ${ORDER_LABELS[state.orderMode]} · ${
          EXAMPLE_DISPLAY_LABELS[state.exampleDisplayMode]
        }</p>
      </div>
      <div class="study-start-actions">
        <button class="primary-button full" type="button" data-action="start-study" ${canStart ? "" : "disabled"}>
          ${iconLabel("play", `${nextRoundNo}회독 시작`)}
        </button>
        <button class="ghost-button full" type="button" data-action="preview-study-cards" ${canStart ? "" : "disabled"}>
          ${iconLabel("eye", "미리보기")}
        </button>
      </div>
    </section>
  `;
}

function renderStudyOptionsPanel() {
  return `
    <section class="study-options-panel">
      <button class="study-options-toggle" type="button" data-action="toggle-study-options" aria-expanded="${
        state.studyOptionsOpen ? "true" : "false"
      }">
        <span>
          <strong>학습 옵션</strong>
          <small>${ORDER_LABELS[state.orderMode]} · ${EXAMPLE_DISPLAY_LABELS[state.exampleDisplayMode]}</small>
        </span>
        <em aria-hidden="true">${icon(state.studyOptionsOpen ? "chevron-up" : "chevron-down")}</em>
      </button>
      ${
        state.studyOptionsOpen
          ? `<div class="study-options-body">
              ${renderOrderOptions()}
              ${renderExampleDisplayOptions()}
            </div>`
          : ""
      }
    </section>
  `;
}

function renderSelectedGroupStats(group) {
  return `
    <div class="stat-grid">
      <div class="stat"><strong>${number(group.card_count)}</strong><span>카드</span></div>
      <div class="stat"><strong>${number(group.correct_total)}</strong><span>알맞음</span></div>
      <div class="stat"><strong>${number(group.wrong_total)}</strong><span>틀림</span></div>
    </div>
    <p class="meta">마지막 학습 ${formatDate(group.last_studied_at)} · 최근 정답률 ${
      getGroupRecentAccuracy(group) === null ? "기록 없음" : `${getGroupRecentAccuracy(group)}%`
    }</p>
  `;
}

function renderStudyReadiness(group) {
  const studiedToday = isToday(group.last_studied_at);
  return `
    <div class="study-readiness ${studiedToday ? "done" : "pending"}">
      <div>
        <span class="today-badge ${studiedToday ? "done" : "pending"}">${
          studiedToday ? "오늘 학습함" : "오늘 미학습"
        }</span>
        <p>${studiedToday ? "오늘 이미 한 번 지나갔어요." : "오늘 첫 회독으로 들어가기 좋아요."}</p>
      </div>
      <strong>${number(group.completed_rounds)}회독</strong>
    </div>
  `;
}

function renderOrderOptions() {
  return `
    <section class="study-option-block">
      <div class="completion-header">
        <h3>학습 순서</h3>
        <span class="pill">${ORDER_LABELS[state.orderMode]}</span>
      </div>
      <div class="order-options" role="group" aria-label="학습 순서">
        ${Object.entries(ORDER_LABELS)
          .map(
            ([mode, label]) => `
              <button class="order-option ${state.orderMode === mode ? "active" : ""}" type="button" data-action="set-order" data-order="${mode}">
                <span>${label}</span>
                <small>${ORDER_DESCRIPTIONS[mode]}</small>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderExampleDisplayOptions() {
  return `
    <section class="study-option-block">
      <div class="completion-header">
        <h3>예문 표시</h3>
        <span class="pill">${EXAMPLE_DISPLAY_LABELS[state.exampleDisplayMode]}</span>
      </div>
      <div class="order-options two" role="group" aria-label="예문 표시 방식">
        ${Object.entries(EXAMPLE_DISPLAY_LABELS)
          .map(
            ([mode, label]) => `
              <button class="order-option ${state.exampleDisplayMode === mode ? "active" : ""}" type="button" data-action="set-example-display" data-example-display="${mode}">
                <span>${label}</span>
                <small>${EXAMPLE_DISPLAY_DESCRIPTIONS[mode]}</small>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderRecentRoundsPanel(rounds) {
  if (!rounds.length) return "";
  const visibleRounds = state.recentRoundsOpen ? rounds : rounds.slice(0, 1);
  return `
    <div class="panel stack">
      <div class="row">
        <h3>최근 회독</h3>
        ${
          rounds.length > 1
            ? `<button class="ghost-button small-button" type="button" data-action="toggle-recent-rounds">
                ${iconLabel(
                  state.recentRoundsOpen ? "chevron-up" : "chevron-down",
                  state.recentRoundsOpen ? "접기" : `더 보기 ${rounds.length - 1}`,
                )}
              </button>`
            : ""
        }
      </div>
      <div class="round-list ${state.recentRoundsOpen ? "scroll-list recent-round-scroll" : ""}">${visibleRounds
        .map(renderRoundItem)
        .join("")}</div>
    </div>
  `;
}

function renderRoundItem(round) {
  const firstAttemptTotal = number(round.first_attempt_total || round.total_cards);
  const firstAttemptCorrect = number(round.first_attempt_correct_count);
  const answerRate = number(round.total_cards) ? Math.round((number(round.correct_count) / number(round.total_cards)) * 100) : 0;
  return `
    <button class="round-item round-item-button" type="button" data-action="open-round-detail" data-round-id="${
      round.id
    }" aria-label="${number(round.round_no)}회독 자세히 보기">
      <div class="item-title">
        <strong>${round.round_no}회독</strong>
        <span class="round-title-actions">
          <span class="pill">${ORDER_LABELS[round.order_mode] || round.order_mode}</span>
          <span class="round-detail-indicator" aria-hidden="true">${icon("chevron-right")}</span>
        </span>
      </div>
      <p class="meta">첫 시도 ${firstAttemptCorrect}/${firstAttemptTotal} · 풀이 정답률 ${answerRate}% · 오답 ${number(
        round.wrong_count,
      )}</p>
      ${renderRoundTime(round)}
    </button>
  `;
}

function roundDetailMetricValue(value, fallback = 0) {
  return value === null || value === undefined ? fallback : number(value);
}

function getRoundDetailStats(detail) {
  const round = detail?.round || {};
  const cards = detail?.cards || [];
  const firstPassCards = cards.filter((card) => card.first_result === "correct");
  const wrongCards = cards.filter((card) => number(card.wrong_count) > 0);
  const totalAttempts = roundDetailMetricValue(
    round.total_attempts,
    cards.reduce((sum, card) => sum + (card.attempts?.length || 0), 0),
  );
  return {
    firstAttemptTotal: roundDetailMetricValue(round.first_attempt_total, cards.length),
    firstAttemptCorrect: roundDetailMetricValue(round.first_attempt_correct_count, firstPassCards.length),
    totalAttempts,
    wrongCards,
    firstPassCards,
    answerRate: totalAttempts ? Math.round((number(round.correct_count) / totalAttempts) * 100) : 0,
  };
}

function renderRoundDetailDialog() {
  const detail = state.roundDetail;
  const round = detail?.round || {};
  if (!detail || detail.loading) {
    dialogRoot.innerHTML = `
      <div class="dialog-backdrop" role="presentation">
        <section class="dialog-panel round-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title">
          <p class="eyebrow">회독 기록</p>
          <h2 id="study-dialog-title">자세히 불러오는 중</h2>
          <p class="meta">최근 회독의 풀이 기록을 정리하고 있습니다.</p>
        </section>
      </div>
    `;
    return;
  }
  const stats = getRoundDetailStats(detail);
  dialogRoot.innerHTML = `
    <div class="dialog-backdrop" role="presentation">
      <section class="dialog-panel round-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title">
        <div>
          <p class="eyebrow">회독 기록</p>
          <h2 id="study-dialog-title">${number(round.round_no)}회독 자세히</h2>
          <p class="meta">${escapeHtml(round.group_name || "소그룹")} · ${escapeHtml(
            round.selected_group_names ? `${round.selected_group_names} · ` : "",
          )}${escapeHtml(
            ORDER_LABELS[round.order_mode] || round.order_mode || "학습",
          )} · ${escapeHtml(formatDate(round.completed_at))}</p>
        </div>
        <div class="round-detail-body">
          <div class="round-detail-metrics">
            <div><strong>${stats.firstAttemptCorrect}/${stats.firstAttemptTotal}</strong><span>첫 시도 정답</span></div>
            <div><strong>${stats.totalAttempts}</strong><span>총 풀이</span></div>
            <div><strong>${number(round.wrong_count)}</strong><span>오답</span></div>
            <div><strong>${stats.answerRate}%</strong><span>풀이 정답률</span></div>
          </div>
          ${renderRoundTime(round)}
          ${renderRoundDetailSection("틀린 카드", stats.wrongCards, "bad")}
          ${renderRoundDetailSection("한 번에 맞은 카드", stats.firstPassCards, "good")}
        </div>
        <button class="primary-button full" type="button" data-action="close-dialog">${iconLabel("check", "닫기")}</button>
      </section>
    </div>
  `;
}

function renderRoundDetailSection(title, cards, tone) {
  const emptyText = tone === "bad" ? "이 회독에서는 다시 볼 오답 카드가 없었습니다." : "첫 시도에서 바로 맞은 카드가 없습니다.";
  return `
    <section class="round-detail-section">
      <div class="completion-header">
        <h3>${title}</h3>
        <span class="pill ${tone}">${cards.length}개</span>
      </div>
      ${
        cards.length
          ? `<div class="round-detail-list">${cards.map((card) => renderRoundDetailCard(card, tone)).join("")}</div>`
          : `<p class="meta">${emptyText}</p>`
      }
    </section>
  `;
}

function renderRoundDetailCard(card, tone) {
  const attempts = card.attempts || [];
  const detail =
    tone === "bad"
      ? `${number(card.wrong_count)}오답 · ${number(card.passed_attempt_no || attempts.length)}차 통과`
      : "첫 시도";
  return `
    <article class="round-detail-card ${tone}">
      <div class="item-title">
        <strong>${renderJapaneseText(card.front)}</strong>
        <span class="pill ${tone}">${escapeHtml(detail)}</span>
      </div>
      <p>${escapeHtml(card.back)}</p>
      <div class="attempt-timeline">${attempts.map(renderAttemptChip).join("")}</div>
    </article>
  `;
}

function isCardExamplesExpanded(session, card) {
  const override = session.expandedExamples?.[card.id];
  if (session.exampleDisplayMode === "expanded") return override !== false;
  return Boolean(override);
}

function getSessionTitle(session) {
  if (session.studyMode === "practice") return "묶음 연습";
  return session.studyMode === "weak" ? "약점 복습" : `${session.roundNo}회독`;
}

function getSessionOrderLabel(session) {
  return session.studyMode === "weak" ? "오답순" : ORDER_LABELS[session.orderMode];
}

function renderStudySession() {
  const session = state.session;
  if (session.savedRound) {
    const round = session.savedRound;
    const summary = getCompletionSummary(session);
    const completionTitle =
      session.studyMode === "weak"
        ? "약점 카드 복습 완료"
        : session.studyMode === "practice"
          ? "묶음 연습 완료"
          : `${round.round_no}회독 완료`;
    views.study.innerHTML = `
      <div id="completion-summary" class="panel stack completion-panel">
        <p class="eyebrow">완료</p>
        <h2 id="study-title">${completionTitle}</h2>
        ${renderCompletionScoreboard(summary, round)}
        ${renderDurationComparison(round, session)}
        <p class="meta">${escapeHtml(session.group.name)} · ${getSessionOrderLabel(session)} · ${
          session.passNo
        }차 통과</p>
        ${renderRoundTime(round)}
        ${renderCompletionDetails(summary, session)}
        <div class="completion-sticky-actions" aria-label="결과 화면 작업">
          <button class="ghost-button full" type="button" data-action="scroll-completion-section" data-target="completion-summary">
            ${iconLabel("chevron-up", "요약 보기")}
          </button>
          <button class="primary-button full" type="button" data-action="end-study">${iconLabel(
            "arrow-left",
            "돌아가기",
          )}</button>
        </div>
      </div>
    `;
    return;
  }
  const card = session.cards[session.index];
  const total = session.cards.length;
  const progress = Math.round(((session.index + 1) / total) * 100);
  const currentWrongCount = session.passResults.filter((item) => item.result === "wrong").length;
  const examplesExpanded = isCardExamplesExpanded(session, card);
  const feedbackClass = session.answerFeedback ? `answer-feedback-${session.answerFeedback}` : "";
  const feedbackLabel = session.answerFeedback === "correct" ? "알맞음" : "틀림";
  views.study.innerHTML = `
    <div class="stack study-shell">
      <div class="row">
        <div>
          <p class="eyebrow">${escapeHtml(session.group.name)} · ${getSessionOrderLabel(session)} · ${
            session.passNo
          }차</p>
          <h2 id="study-title">${getSessionTitle(session)}</h2>
        </div>
        <div class="study-session-controls">
          <button class="ghost-button small-button" type="button" data-action="quit-study" ${
            session.isAnswering ? "disabled" : ""
          }>${iconLabel("x", "포기")}</button>
          <span id="study-elapsed" class="timer-pill">${formatDuration(elapsedSeconds(session))}</span>
          <span class="pill">${session.passNo}차 ${session.index + 1}/${total}</span>
        </div>
      </div>
      <div class="progress" aria-hidden="true"><span style="width: ${progress}%"></span></div>
      <div class="study-quick-stats">
        <span>남은 ${Math.max(0, total - session.index - 1)}개</span>
        <span>이번 차수 오답 ${currentWrongCount}개</span>
      </div>
      <div class="study-card ${session.showingBack ? "back" : "front"} ${feedbackClass}" ${
        session.showingBack ? "" : `data-action="flip-card" role="button" tabindex="0"`
      }>
        ${
          session.answerFeedback
            ? `<div class="answer-feedback-label ${feedbackClass}" aria-live="polite">${feedbackLabel}</div>`
            : ""
        }
        ${
          session.showingBack
            ? renderCardBack(card, examplesExpanded)
            : `${renderStudyCardMeta(card.group_name, card)}<div class="grammar">${escapeHtml(
                card.front,
              )}</div><p class="study-hint">탭해서 뜻 보기</p>`
        }
      </div>
      <div class="study-action-bar ${feedbackClass}">
        ${
          session.showingBack
            ? `<div class="study-actions"><button class="answer-wrong" type="button" data-action="answer-card" data-result="wrong" ${
                session.isAnswering ? "disabled" : ""
              }>${iconLabel("x", "틀림")}</button><button class="answer-correct" type="button" data-action="answer-card" data-result="correct" ${
                session.isAnswering ? "disabled" : ""
              }>${iconLabel("check", "알맞음")}</button></div>`
            : `<button class="secondary-button full reveal-button" type="button" data-action="flip-card">${iconLabel(
                "eye",
                "뜻 보기",
              )}</button>`
        }
      </div>
    </div>
  `;
}

function getCompletionSummary(session) {
  const cardById = new Map((session.allCards || session.cards).map((card) => [Number(card.id), card]));
  const items = session.results
    .map((result, index) => ({
      result: result.result,
      passNo: result.pass_no || 1,
      position: result.position || index + 1,
      card: cardById.get(Number(result.card_id)),
    }))
    .filter((item) => item.card);
  const summaryByCard = new Map();
  items.forEach((item) => {
    const cardId = Number(item.card.id);
    if (!summaryByCard.has(cardId)) {
      summaryByCard.set(cardId, { card: item.card, attempts: [], wrongCount: 0, correctCount: 0 });
    }
    const summary = summaryByCard.get(cardId);
    summary.attempts.push(item);
    if (item.result === "wrong") summary.wrongCount += 1;
    if (item.result === "correct") summary.correctCount += 1;
  });
  const cardSummaries = [...cardById.values()].map((card) => summaryByCard.get(Number(card.id))).filter(Boolean);
  const wrongCardSummaries = cardSummaries
    .filter((item) => item.wrongCount > 0)
    .sort(
      (a, b) =>
        b.wrongCount - a.wrongCount ||
        number(b.attempts[b.attempts.length - 1]?.passNo) - number(a.attempts[a.attempts.length - 1]?.passNo) ||
        number(a.card.id) - number(b.card.id),
    );
  return {
    items,
    cardSummaries,
    wrongCardSummaries,
    uniqueCardCount: cardSummaries.length,
    totalAttempts: items.length,
    firstPassCorrectCount: cardSummaries.filter((item) => item.attempts[0]?.result === "correct").length,
    repeatedCardCount: wrongCardSummaries.length,
  };
}

function renderCompletionScoreboard(summary, round) {
  const attemptRate = round.total_cards ? Math.round((round.correct_count / round.total_cards) * 100) : 0;
  return `
    <div class="completion-scoreboard">
      <div class="completion-main-score">
        <strong>${summary.firstPassCorrectCount}/${summary.uniqueCardCount}</strong>
        <span>첫 시도 정답</span>
      </div>
      <div class="completion-metric-grid">
        <div><strong>${summary.totalAttempts}</strong><span>총 풀이</span></div>
        <div><strong>${round.wrong_count}</strong><span>오답</span></div>
        <div><strong>${summary.repeatedCardCount}</strong><span>반복 카드</span></div>
        <div><strong>${attemptRate}%</strong><span>풀이 정답률</span></div>
      </div>
    </div>
  `;
}

function getPreviousRoundForComparison(round, session) {
  if (session.studyMode === "weak" || session.studyMode === "practice") return null;
  if (session.previousRound) return session.previousRound;
  const previousRoundNo = number(round.round_no) - 1;
  if (round.collection_id) {
    return (
      state.rounds.find(
        (item) => Number(item.collection_id) === Number(round.collection_id) && number(item.round_no) === previousRoundNo,
      ) || null
    );
  }
  if (!round?.group_id) return null;
  return (
    state.rounds.find(
      (item) => roundIncludesGroup(item, round.group_id) && number(item.round_no) === previousRoundNo,
    ) || null
  );
}

function renderDurationComparison(round, session) {
  const previousRound = getPreviousRoundForComparison(round, session);
  if (session.studyMode === "weak" || session.studyMode === "practice") return "";
  if (!previousRound) {
    return `
      <section class="duration-comparison neutral">
        <span>소요시간 비교</span>
        <strong>비교할 이전 회독이 아직 없어요.</strong>
        <p>다음 회독부터 바로 이전 회독과 걸린 시간을 비교합니다.</p>
      </section>
    `;
  }
  const currentDuration = number(round.duration_seconds);
  const previousDuration = number(previousRound.duration_seconds);
  const diff = currentDuration - previousDuration;
  const tone = diff < 0 ? "faster" : diff > 0 ? "slower" : "neutral";
  const title =
    diff < 0
      ? `이전 회독보다 ${formatDuration(Math.abs(diff))} 단축됐어요.`
      : diff > 0
        ? `이전 회독보다 ${formatDuration(diff)} 더 걸렸어요.`
        : "이전 회독과 소요시간이 같아요.";
  const detail = `이번 ${formatDuration(currentDuration)} · 이전 ${formatDuration(previousDuration)}`;
  return `
    <section class="duration-comparison ${tone}">
      <span>소요시간 비교</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(detail)}</p>
    </section>
  `;
}

function scrollToCompletionSection(targetId) {
  if (!targetId) return;
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCompletionDetails(summary, session) {
  const firstPassItems = summary.cardSummaries
    .filter((item) => item.attempts[0]?.result === "correct")
    .map((item) => ({
      result: "correct",
      passNo: 1,
      position: item.attempts[0]?.position || 1,
      card: item.card,
    }));
  return `
    <div class="completion-details">
      ${renderCompletionFocus(summary, session)}
      ${renderWrongReview(summary, session)}
      ${renderCompletionSection("한 번에 맞은 카드", firstPassItems, "good", {
        id: "correct-review",
        collapsible: true,
        open: state.completionCorrectOpen,
      })}
    </div>
  `;
}

function renderCompletionFocus(summary, session) {
  const hardest = summary.wrongCardSummaries[0];
  const sessionLabel = session.studyMode === "weak" ? "복습" : session.studyMode === "practice" ? "연습" : "회독";
  if (!hardest) {
    return `
      <section class="completion-focus good">
        <p class="eyebrow">깔끔한 ${sessionLabel}</p>
        <h3>이번 ${sessionLabel}은 오답 없이 통과했어요.</h3>
        <p class="meta">첫 시도 정답 ${summary.firstPassCorrectCount}개 · 총 풀이 ${summary.totalAttempts}회</p>
      </section>
    `;
  }
  const lastAttempt = hardest.attempts[hardest.attempts.length - 1];
  return `
    <section class="completion-focus bad">
      <p class="eyebrow">다시 볼 카드</p>
      <h3>${renderJapaneseText(hardest.card.front)}</h3>
      <p>${escapeHtml(hardest.card.back)}</p>
      <p class="meta">${hardest.wrongCount}번 틀리고 ${lastAttempt.passNo}차에서 통과했어요.</p>
    </section>
  `;
}

function renderWrongReview(summary, session) {
  const sessionLabel = session.studyMode === "weak" ? "복습" : session.studyMode === "practice" ? "연습" : "회독";
  return `
    <section id="wrong-review" class="completion-section">
      <div class="completion-header">
        <h3>틀린 카드 다시 보기</h3>
        <span class="pill bad">${summary.wrongCardSummaries.length}개</span>
      </div>
      ${
        summary.wrongCardSummaries.length
          ? `<div class="wrong-review-list">${summary.wrongCardSummaries.map(renderWrongReviewCard).join("")}</div>`
          : `<p class="meta">이번 ${sessionLabel}에서 다시 볼 오답 카드가 없습니다.</p>`
      }
    </section>
  `;
}

function renderCorrectCollapsedSummary(count) {
  return `
    <div class="completion-collapsed-summary">
      <div>
        <strong>한 번에 맞은 카드 ${count}개</strong>
        <p>확인이 필요할 때만 목록을 펼쳐서 봅니다.</p>
      </div>
      <button class="secondary-button small-button" type="button" data-action="toggle-completion-correct">
        ${iconLabel("chevron-down", "목록 보기")}
      </button>
    </div>
  `;
}

function renderWrongReviewCard(summary) {
  const examples = summary.card.examples || [];
  const visibleExamples = examples.slice(0, 2);
  return `
    <article class="wrong-review-card">
      <div class="item-title">
        <strong>${renderJapaneseText(summary.card.front)}</strong>
        <span class="pill bad">${summary.wrongCount}오답</span>
      </div>
      <p class="wrong-review-meaning">${escapeHtml(summary.card.back)}</p>
      <div class="attempt-timeline">
        ${summary.attempts.map(renderAttemptChip).join("")}
      </div>
      ${
        summary.card.memo ? `<p class="study-note">${escapeHtml(summary.card.memo)}</p>` : ""
      }
      ${
        visibleExamples.length
          ? `<ul class="review-examples">${visibleExamples
              .map(
                (example) => `
                  <li>
                    <p class="example-jp">${renderMarkedJapaneseText(example.japanese)}</p>
                    ${example.korean ? `<p class="example-ko">${renderMarkedText(example.korean)}</p>` : ""}
                  </li>
                `,
              )
              .join("")}</ul>`
          : `<p class="meta">예문 없음</p>`
      }
      ${examples.length > visibleExamples.length ? `<p class="meta">예문 ${examples.length - visibleExamples.length}개 더 있음</p>` : ""}
    </article>
  `;
}

function renderAttemptChip(item) {
  const label = item.result === "correct" ? "알맞음" : "틀림";
  const tone = item.result === "correct" ? "good" : "bad";
  return `<span class="attempt-chip ${tone}">${number(item.passNo || item.attempt_no || 1)}차 ${label}</span>`;
}

function renderCompletionSection(title, items, tone, options = {}) {
  const emptyText = tone === "bad" ? "이번 회독에서 틀린 카드가 없습니다." : "첫 시도에서 바로 맞은 카드가 없습니다.";
  const isCollapsed = Boolean(options.collapsible && !options.open && items.length);
  const sectionId = options.id ? ` id="${escapeHtml(options.id)}"` : "";
  return `
    <section${sectionId} class="completion-section">
      <div class="completion-header">
        <h3>${title}</h3>
        <div class="completion-header-actions">
          <span class="pill ${tone}">${items.length}개</span>
          ${
            options.collapsible && items.length && options.open
              ? `<button class="ghost-button small-button" type="button" data-action="toggle-completion-correct">
                  ${iconLabel("chevron-up", "목록 접기")}
                </button>`
              : ""
          }
        </div>
      </div>
      ${
        isCollapsed
          ? renderCorrectCollapsedSummary(items.length)
          : items.length
          ? `<div class="result-list">${items.map((item) => renderResultItem(item, tone)).join("")}</div>`
          : `<p class="meta">${emptyText}</p>`
      }
    </section>
  `;
}

function renderResultItem(item, tone) {
  return `
    <article class="result-item ${tone}">
      <div class="item-title">
        <strong>${renderJapaneseText(item.card.front)}</strong>
        <span class="pill">${item.passNo}차 ${item.position}번</span>
      </div>
      <p>${escapeHtml(item.card.back)}</p>
    </article>
  `;
}

function renderCardBack(card, examplesExpanded = false) {
  const examples = card.examples || [];
  const visibleExamples = examplesExpanded ? examples : examples.slice(0, 1);
  return `
    ${renderStudyCardMeta(card.front, card, true)}
    <div class="meaning">${escapeHtml(card.back)}</div>
    ${card.memo ? `<p class="study-note">${escapeHtml(card.memo)}</p>` : ""}
    ${
      examples.length
        ? `
          <div class="example-header">
            <span>예문</span>
            <span class="pill">${examples.length}개</span>
          </div>
          <ul class="examples">${visibleExamples
            .map(
              (example) => `
                <li class="example">
                  <p class="example-jp">${renderMarkedJapaneseText(example.japanese)}</p>
                  ${example.korean ? `<p class="example-ko">${renderMarkedText(example.korean)}</p>` : ""}
                </li>
              `,
            )
            .join("")}</ul>
          ${
            examples.length > 1
              ? `<button class="ghost-button full example-toggle" type="button" data-action="toggle-examples">${
                  iconLabel(
                    examplesExpanded ? "chevron-up" : "chevron-down",
                    examplesExpanded ? "예문 접기" : `예문 ${examples.length - 1}개 더 보기`,
                  )
                }</button>`
              : ""
          }
        `
        : `<p class="meta">예문 없음</p>`
    }
  `;
}

function renderStudyCardMeta(label, card, japanese = false) {
  return `
    <div class="study-card-meta">
      <p class="meta ${japanese ? "jp-text" : ""}">${escapeHtml(label)}</p>
      ${isWeakCard(card) ? `<span class="study-weak-badge">${icon("target")}<span>약점</span></span>` : ""}
    </div>
  `;
}

function renderCards() {
  const editing = state.cards.find((card) => card.id === state.editingCardId) ?? null;
  const formGroupId = state.selectedGroupId ?? editing?.group_id ?? state.groups[0]?.id;
  const showForm = state.cardScreen === "form" || Boolean(editing);
  const hasCollectionFilter = state.collections.some(
    (collection) => String(collection.id) === String(state.cardFilterCollectionId),
  );
  const showAllCards = state.cardFilterCollectionId === "all";
  const hasGroupFilter = getCardFilterGroups().some((group) => String(group.id) === String(state.cardFilterGroupId));
  const filteredCards = hasGroupFilter
    ? state.cards.filter((card) => String(card.group_id) === String(state.cardFilterGroupId))
    : showAllCards
      ? state.cards
      : hasCollectionFilter
      ? state.cards.filter((card) => String(card.collection_id) === String(state.cardFilterCollectionId))
      : [];
  const visibleCards = filteredCards.filter((card) =>
    matchesQuery(
      [
        card.front,
        card.back,
        card.memo,
        card.group_name,
        card.collection_name,
        ...(card.examples || []).flatMap((example) => [example.japanese, example.korean]),
      ],
      state.cardSearchQuery,
    ),
  );
  views.cards.innerHTML = showForm
    ? renderCardEditorPanel(editing, formGroupId)
    : renderCardListPanel(visibleCards);
}

function renderCardEditorPanel(editing, formGroupId) {
  const hasGroups = state.groups.length > 0;
  return `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">카드</p>
          <h2 id="cards-title">${editing ? "카드 수정" : "카드 등록"}</h2>
        </div>
        <button class="ghost-button small-button" type="button" data-action="show-card-list">${iconLabel(
          "list",
          "목록 보기",
        )}</button>
      </div>
      ${
        editing
          ? `<p class="meta">수정한 내용은 저장 후 카드 목록에서 다시 확인할 수 있어요.</p>`
          : `<div class="segmented two" role="group" aria-label="카드 등록 방식">
              <button class="segment ${state.cardEntryMode === "single" ? "active" : ""}" type="button" data-action="set-card-entry-mode" data-mode="single">한 장</button>
              <button class="segment ${state.cardEntryMode === "bulk" ? "active" : ""}" type="button" data-action="set-card-entry-mode" data-mode="bulk">여러 장</button>
            </div>`
      }
      ${
        hasGroups
          ? state.cardEntryMode === "bulk" && !editing
            ? renderBulkCardForm(formGroupId)
            : renderCardForm(editing, formGroupId)
          : `<div class="empty-state">카드를 등록하려면 소그룹이 필요해요.</div><button class="primary-button full" type="button" data-action="${
              state.collections.length ? "open-group-form" : "go-groups"
            }">${iconLabel("plus", state.collections.length ? "소그룹 만들기" : "대그룹 만들기")}</button>`
      }
    </div>
  `;
}

function renderCardListPanel(visibleCards) {
  const collectionGroups = getCardFilterGroups();
  return `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">카드</p>
          <h2 id="cards-title">카드 목록</h2>
        </div>
        <span class="pill">${visibleCards.length}개</span>
      </div>
      <button class="primary-button full" type="button" data-action="open-card-form" ${
        state.groups.length ? "" : "disabled"
      }>${iconLabel("plus", "카드 등록")}</button>
      ${
        state.collections.length
          ? `<div class="card-filter-grid">
              <select id="card-collection-filter" class="select" aria-label="카드 대그룹 필터">
                <option value="all" ${state.cardFilterCollectionId === "all" ? "selected" : ""}>전체 카드</option>
                <option value="" ${
                  state.cardFilterCollectionId || state.cardFilterCollectionId === "all" ? "" : "selected"
                }>대그룹 선택</option>
                ${state.collections
                  .map(
                    (collection) =>
                      `<option value="${collection.id}" ${
                        String(state.cardFilterCollectionId) === String(collection.id) ? "selected" : ""
                      }>${escapeHtml(collection.name)}</option>`,
                  )
                  .join("")}
              </select>
              <select id="card-group-filter" class="select" aria-label="카드 소그룹 필터" ${
                state.cardFilterCollectionId && state.cardFilterCollectionId !== "all" ? "" : "disabled"
              }>
                <option value="" ${state.cardFilterGroupId ? "" : "selected"}>${
                  state.cardFilterCollectionId === "all"
                    ? "전체 보기"
                    : state.cardFilterCollectionId
                      ? "소그룹 전체"
                      : "대그룹을 먼저 선택"
                }</option>
                ${collectionGroups
                  .map(
                    (group) =>
                      `<option value="${group.id}" ${String(state.cardFilterGroupId) === String(group.id) ? "selected" : ""}>${escapeHtml(
                        group.name,
                      )}</option>`,
                  )
                  .join("")}
              </select>
            </div>`
          : ""
      }
      ${renderSearchInput({ id: "card-search", value: state.cardSearchQuery, placeholder: "카드 검색" })}
      <div class="card-list">
      ${
        visibleCards.length
          ? visibleCards.map(renderCardListItem).join("")
          : `<div class="empty-state">${
              state.cardFilterGroupId
                ? "검색된 카드가 없습니다."
                : state.cardFilterCollectionId
                  ? "검색된 카드가 없습니다."
                  : state.collections.length
                    ? "조건에 맞는 카드가 없습니다."
                    : "등록된 카드가 없습니다."
            }</div>`
      }
      </div>
    </div>
  `;
}

function renderCardForm(card, groupId) {
  const examples = card?.examples?.length ? card.examples : [{ japanese: "", korean: "" }];
  const selection = getCardFormSelection(groupId);
  const groupMissingPanel = !selection.groups.length
    ? `
      <div class="empty-state">선택한 대그룹에 아직 소그룹이 없습니다.</div>
      <button class="primary-button full" type="button" data-action="open-group-form-for-collection" data-collection-id="${
        selection.collectionId || ""
      }">${iconLabel("plus", "소그룹 만들기")}</button>
    `
    : "";
  return `
    <form id="card-form" class="stack">
      <div class="card-filter-grid">
        <label class="field"><span>대그룹</span><select id="card-form-collection" class="select" name="collection_id" required>${collectionOptions(
          selection.collectionId,
        )}</select></label>
        <label class="field"><span>소그룹</span><select id="card-form-group" class="select" name="group_id" required ${
          selection.groups.length ? "" : "disabled"
        }>${subgroupOptions(selection.groups, selection.groupId)}</select></label>
      </div>
      ${
        groupMissingPanel ||
        `
      <label class="field"><span>앞면</span><input class="input" name="front" value="${escapeHtml(
        card?.front || "",
      )}" placeholder="〜あまり" required /></label>
      <p id="card-duplicate-warning" class="duplicate-warning" hidden></p>
      <label class="field"><span>뒷면</span><textarea class="textarea" name="back" placeholder="~한 나머지" required>${escapeHtml(
        card?.back || "",
      )}</textarea></label>
      <label class="field"><span>메모</span><textarea class="textarea" name="memo" placeholder="접속, 뉘앙스, 헷갈리는 표현">${escapeHtml(
        card?.memo || "",
      )}</textarea></label>
      <div class="field">
        <span class="fieldset-label">예문</span>
        <div id="example-editor-list" class="example-editor-list">${examples
          .map((example, index) => renderExampleEditorRow(example, index))
          .join("")}</div>
      </div>
      <button class="ghost-button full" type="button" data-action="add-example">${iconLabel("plus", "예문 추가")}</button>
      <div class="form-actions">
        <button class="ghost-button" type="button" data-action="show-card-list">${iconLabel("x", "취소")}</button>
        <button class="primary-button" type="submit">${iconLabel("save", card ? "저장" : "등록")}</button>
      </div>
        `
      }
    </form>
  `;
}

function renderBulkCardForm(groupId) {
  const selection = getCardFormSelection(state.bulkDraftGroupId || groupId);
  const preview = state.bulkPreview;
  const groupMissingPanel = !selection.groups.length
    ? `
      <div class="empty-state">선택한 대그룹에 아직 소그룹이 없습니다.</div>
      <button class="primary-button full" type="button" data-action="open-group-form-for-collection" data-collection-id="${
        selection.collectionId || ""
      }">${iconLabel("plus", "소그룹 만들기")}</button>
    `
    : "";
  return `
    <form id="bulk-card-form" class="stack">
      <div class="card-filter-grid">
        <label class="field"><span>대그룹</span><select id="bulk-card-collection" class="select" name="collection_id" required>${collectionOptions(
          selection.collectionId,
        )}</select></label>
        <label class="field"><span>소그룹</span><select id="bulk-card-group" class="select" name="group_id" required ${
          selection.groups.length ? "" : "disabled"
        }>${subgroupOptions(selection.groups, selection.groupId)}</select></label>
      </div>
      ${
        groupMissingPanel ||
        `
      <label class="field">
        <span>카드</span>
        <textarea class="textarea bulk-textarea" name="bulk_text" placeholder="〜あまり | ~한 나머지 | 메모 | 緊張の[[あまり]]、声が震えた。 => 긴장한 나머지 목소리가 떨렸다.&#10;〜に至っては | ~에 이르러서는">${escapeHtml(
          state.bulkDraftText,
        )}</textarea>
      </label>
      <p class="form-hint">예문에서 강조할 부분은 [[이렇게]] 감싸면 학습 화면에서만 하이라이트됩니다.</p>
      <button class="secondary-button full" type="submit">${iconLabel("eye", "미리보기")}</button>
      ${preview ? renderBulkPreview(preview) : ""}
        `
      }
    </form>
  `;
}

function renderBulkPreview(preview) {
  const canCreate = preview.items.length > 0 && !preview.errors.length && preview.warningCount === 0;
  return `
    <section class="bulk-preview">
      <div class="completion-header">
        <h3>등록 미리보기</h3>
        <span class="pill">${preview.items.length}개</span>
      </div>
      ${
        preview.errors.length
          ? `<div class="bulk-issues bad">${preview.errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}</div>`
          : ""
      }
      ${
        preview.warningCount
          ? `<div class="bulk-issues warn"><p>중복 카드 ${preview.warningCount}건이 있습니다. 정리 후 다시 미리보기를 눌러주세요.</p></div>`
          : ""
      }
      <div class="bulk-preview-list">
        ${preview.items.map(renderBulkPreviewItem).join("")}
      </div>
      <button class="primary-button full" type="button" data-action="confirm-bulk-cards" ${
        canCreate ? "" : "disabled"
      }>${iconLabel("check", "미리보기대로 등록")}</button>
    </section>
  `;
}

function renderBulkPreviewItem(item) {
  return `
    <article class="bulk-preview-item ${item.warnings.length ? "warn" : ""}">
      <div class="item-title">
        <strong>${item.front ? renderJapaneseText(item.front) : "앞면 없음"}</strong>
        <span class="pill">${item.lineNo}줄</span>
      </div>
      <p class="meaning">${escapeHtml(item.back || "뒷면 없음")}</p>
      <p class="meta">메모 ${item.memo ? "있음" : "없음"} · 예문 ${item.examples.length}개</p>
      ${
        item.examples[0]
          ? `<div class="card-preview-example"><p class="example-jp">${renderMarkedJapaneseText(
              item.examples[0].japanese,
            )}</p>${item.examples[0].korean ? `<p class="example-ko">${renderMarkedText(item.examples[0].korean)}</p>` : ""}</div>`
          : ""
      }
      ${item.warnings.map((warning) => `<p class="duplicate-warning inline">${escapeHtml(warning)}</p>`).join("")}
    </article>
  `;
}

function renderExampleEditorRow(example = {}, index = 0, collapsed = index > 0) {
  return `
    <div class="example-row ${collapsed ? "collapsed" : ""}">
      <div class="example-row-header">
        <strong>예문 ${index + 1}</strong>
        <button class="ghost-button small-button" type="button" data-action="toggle-example-row">${iconLabel(
          collapsed ? "chevron-down" : "chevron-up",
          collapsed ? "펼치기" : "접기",
        )}</button>
      </div>
      <div class="example-row-body">
        <textarea class="textarea" name="example_japanese" placeholder="緊張の[[あまり]]、声が震えた。">${escapeHtml(
          example.japanese || "",
        )}</textarea>
        <textarea class="textarea" name="example_korean" placeholder="긴장한 나머지 목소리가 떨렸다.">${escapeHtml(
          example.korean || "",
        )}</textarea>
        <button class="ghost-button" type="button" data-action="remove-example">${iconLabel("trash", "예문 삭제")}</button>
        <p class="form-hint">강조할 조각은 [[ ]]로 감싸세요.</p>
      </div>
    </div>
  `;
}

function renderCardListItem(card) {
  const total = number(card.correct_count) + number(card.wrong_count);
  return `
    <article class="card-item">
      <div class="item-title">
        <strong>${renderJapaneseText(card.front)}</strong>
        <span class="pill">${escapeHtml(getGroupLabel(card))}</span>
      </div>
      <p class="meaning">${escapeHtml(card.back)}</p>
      ${
        card.examples?.[0]
          ? `<div class="card-preview-example"><p class="example-jp">${renderMarkedJapaneseText(
              card.examples[0].japanese,
            )}</p>${card.examples[0].korean ? `<p class="example-ko">${renderMarkedText(card.examples[0].korean)}</p>` : ""}</div>`
          : ""
      }
      <p class="meta">예문 ${card.examples?.length || 0}개 · 알맞음 ${number(card.correct_count)} · 틀림 ${number(
        card.wrong_count,
      )} · 총 ${total}</p>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-action="edit-card" data-card-id="${card.id}">${iconLabel(
          "pencil",
          "수정",
        )}</button>
        <button class="danger-button" type="button" data-action="delete-card" data-card-id="${card.id}">${iconLabel(
          "trash",
          "삭제",
        )}</button>
      </div>
    </article>
  `;
}

function renderGroups() {
  const editing = state.groups.find((group) => group.id === state.editingGroupId) ?? null;
  const editingCollection = state.collections.find((collection) => collection.id === state.editingCollectionId) ?? null;
  const detailCollection =
    state.collections.find((collection) => Number(collection.id) === Number(state.groupDetailCollectionId)) ?? null;
  const detailGroups = detailCollection
    ? getGroupsForCollection(detailCollection.id).filter((group) =>
        matchesQuery([group.name, group.description], state.groupSearchQuery),
      )
    : [];
  const visibleCollections = state.collections.filter((collection) =>
    matchesQuery([collection.name, collection.description], state.groupSearchQuery),
  );
  if (state.groupScreen === "collection-form" || editingCollection) {
    views.groups.innerHTML = renderCollectionEditorPanel(editingCollection);
    return;
  }
  if (state.groupScreen === "group-form" || editing) {
    views.groups.innerHTML = renderGroupEditorPanel(editing);
    return;
  }
  if (detailCollection) {
    views.groups.innerHTML = renderCollectionDetailPanel(detailCollection, detailGroups);
    return;
  }
  views.groups.innerHTML = renderGroupListPanel(visibleCollections);
}

function renderCollectionEditorPanel(editing) {
  return `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">대그룹</p>
          <h2 id="groups-title">${editing ? "대그룹 수정" : "대그룹 만들기"}</h2>
        </div>
        <button class="ghost-button small-button" type="button" data-action="show-group-list">${iconLabel(
          "list",
          "목록 보기",
        )}</button>
      </div>
      <form id="collection-form" class="stack">
        <label class="field"><span>대그룹명</span><input class="input" name="name" value="${escapeHtml(
          editing?.name || "",
        )}" placeholder="영어 단어 벼락세트" required /></label>
        <label class="field"><span>설명</span><textarea class="textarea" name="description" placeholder="시험 전 단어와 표현을 소그룹으로 나누어 회독">${escapeHtml(
          editing?.description || "",
        )}</textarea></label>
        <div class="form-actions">
          <button class="ghost-button" type="button" data-action="show-group-list">${iconLabel("x", "취소")}</button>
          <button class="primary-button" type="submit">${iconLabel("save", editing ? "저장" : "만들기")}</button>
        </div>
      </form>
    </div>
  `;
}

function renderGroupEditorPanel(editing) {
  const selectedCollectionId =
    editing?.collection_id ?? state.groupDetailCollectionId ?? state.selectedCollectionId ?? state.collections[0]?.id;
  return `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">소그룹</p>
          <h2 id="groups-title">${editing ? "소그룹 수정" : "소그룹 만들기"}</h2>
        </div>
        <button class="ghost-button small-button" type="button" data-action="show-group-list">${iconLabel(
          "list",
          state.groupDetailCollectionId ? "소그룹 보기" : "목록 보기",
        )}</button>
      </div>
      ${editing ? `<p class="meta">소그룹명과 설명만 바뀌고, 카드와 학습 기록은 유지됩니다.</p>` : ""}
      <form id="group-form" class="stack">
        <label class="field"><span>대그룹</span><select class="select" name="collection_id" required>${collectionOptions(
          selectedCollectionId,
        )}</select></label>
        <label class="field"><span>소그룹명</span><input class="input" name="name" value="${escapeHtml(
          editing?.name || "",
        )}" placeholder="조사" required /></label>
        <label class="field"><span>설명</span><textarea class="textarea" name="description" placeholder="조사 관련 카드">${escapeHtml(
          editing?.description || "",
        )}</textarea></label>
        <div class="form-actions">
          <button class="ghost-button" type="button" data-action="show-group-list">${iconLabel("x", "취소")}</button>
          <button class="primary-button" type="submit">${iconLabel("save", editing ? "저장" : "만들기")}</button>
        </div>
      </form>
    </div>
  `;
}

function renderGroupListPanel(visibleCollections) {
  return `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">묶음</p>
          <h2 id="groups-title">대그룹 목록</h2>
        </div>
        <span class="pill">${visibleCollections.length}개</span>
      </div>
      <button class="primary-button full" type="button" data-action="open-collection-form">${iconLabel(
        "plus",
        "대그룹 만들기",
      )}</button>
      ${renderSearchInput({ id: "group-search", value: state.groupSearchQuery, placeholder: "대그룹 검색" })}
      <div class="group-list">
        ${
          visibleCollections.length
            ? visibleCollections.map(renderCollectionListItem).join("")
            : `<div class="empty-state">${state.collections.length ? "검색된 대그룹이 없습니다." : "등록된 대그룹이 없습니다."}</div>`
        }
      </div>
    </div>
  `;
}

function renderCollectionDetailPanel(collection, visibleGroups) {
  return `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">대그룹</p>
          <h2 id="groups-title">${escapeHtml(collection.name)}</h2>
        </div>
        <button class="ghost-button small-button" type="button" data-action="back-to-collections">${iconLabel(
          "arrow-left",
          "대그룹 보기",
        )}</button>
      </div>
      <p class="meta">${escapeHtml(collection.description || "설명 없음")}</p>
      <div class="stat-grid">
        <div class="stat"><strong>${number(collection.group_count)}</strong><span>소그룹</span></div>
        <div class="stat"><strong>${number(collection.card_count)}</strong><span>카드</span></div>
      </div>
      <p class="meta">소그룹 합산 · 묶음 연습은 공식 기록 제외</p>
      <button class="primary-button full" type="button" data-action="open-group-form-for-collection" data-collection-id="${
        collection.id
      }">${iconLabel("plus", "소그룹 만들기")}</button>
      ${renderSearchInput({ id: "group-search", value: state.groupSearchQuery, placeholder: "소그룹 검색" })}
      <div class="group-list">
        ${
          visibleGroups.length
            ? visibleGroups.map(renderGroupListItem).join("")
            : `<div class="empty-state">${
                getGroupsForCollection(collection.id).length ? "검색된 소그룹이 없습니다." : "등록된 소그룹이 없습니다."
              }</div>`
        }
      </div>
    </div>
  `;
}

function renderBackupPanel() {
  return `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">데이터</p>
          <h2>데이터 백업</h2>
        </div>
        <button class="ghost-button small-button" type="button" data-action="toggle-data-panel">${iconLabel(
          state.dataPanelOpen ? "chevron-up" : "chevron-down",
          state.dataPanelOpen ? "접기" : "열기",
        )}</button>
      </div>
      ${
        state.dataPanelOpen
          ? `
            <div class="button-row">
              <button class="secondary-button" type="button" data-action="export-backup">${iconLabel(
                "download",
                "백업 파일 만들기",
              )}</button>
              <label class="ghost-button file-button">${iconLabel("upload", "파일 선택")}<input id="backup-file-input" type="file" accept="application/json,.json" /></label>
            </div>
            <form id="backup-import-form" class="stack">
              <textarea class="textarea backup-textarea" name="backup_json" placeholder="백업 JSON"></textarea>
              <button class="danger-button full" type="submit">${iconLabel("alert-triangle", "백업 복원")}</button>
            </form>
          `
          : `<p class="meta">카드 ${state.cards.length}개 · 대그룹 ${state.collections.length}개 · 소그룹 ${state.groups.length}개 · 예문과 회독 기록 포함</p>`
      }
    </div>
  `;
}

function renderSettings() {
  const examInfo = getExamDateInfo();
  const targetLabel = getTargetLabel();
  const targetDateLabel = targetLabel === "목표" ? "목표일" : `${targetLabel} 목표일`;
  const examDateMessage = examInfo
    ? examInfo.diffDays > 0
      ? `${escapeHtml(examInfo.dateLabel)}까지 ${number(examInfo.diffDays)}일 남았습니다.`
      : examInfo.diffDays === 0
        ? `${escapeHtml(examInfo.dateLabel)}, 오늘이 목표일입니다.`
        : `${escapeHtml(examInfo.dateLabel)} 목표일로부터 ${number(Math.abs(examInfo.diffDays))}일 지났습니다.`
    : "설정하면 공통 헤더에서 남은 날짜를 바로 볼 수 있어요.";
  views.settings.innerHTML = `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">설정</p>
          <h2 id="settings-title">학습 목표</h2>
        </div>
        <span class="pill">${escapeHtml(targetLabel)}${examInfo ? ` · ${escapeHtml(examInfo.label)}` : ""}</span>
      </div>
      <div class="settings-summary ${examInfo ? "" : "empty"}">
        <span>${escapeHtml(targetDateLabel)}</span>
        <strong>${examInfo ? escapeHtml(examInfo.label) : "목표일을 설정하세요"}</strong>
        <p>${examDateMessage}</p>
      </div>
      <form id="settings-form" class="stack">
        ${renderTargetNameField()}
        ${renderLevelOptions()}
        ${renderExamDateSelects()}
        ${renderWeakThresholdSetting()}
        <div class="form-actions">
          <button class="ghost-button" type="button" data-action="clear-exam-date" ${
            state.settings?.target_name || state.settings?.jlpt_exam_date || state.settings?.jlpt_level ? "" : "disabled"
          }>${iconLabel("rotate-ccw", "초기화")}</button>
          <button class="primary-button" type="submit">${iconLabel("save", "저장")}</button>
        </div>
      </form>
    </div>
    ${renderBackupPanel()}
  `;
}

function renderTargetNameField() {
  return `
    <label class="field">
      <span>목표 이름</span>
      <input class="input" name="target_name" value="${escapeHtml(
        state.settings?.target_name || "",
      )}" placeholder="JLPT N1, HSK 5급, 토익 단어처럼 직접 입력" maxlength="80" />
    </label>
  `;
}

function renderWeakThresholdSetting() {
  const totalThreshold = getWeakCardThreshold();
  const recentRounds = getWeakRecentRounds();
  const recentThreshold = getWeakRecentWrongThreshold();
  return `
    <section class="settings-subsection">
      <div>
        <span class="field-label">약점 카드 기준</span>
        <p class="form-hint">최근 기준이나 전체 기준 중 하나라도 해당하면 약점 카드에 모입니다.</p>
      </div>
      <div class="weak-rule-grid">
        <label class="number-setting weak-rule-setting">
          <span>최근</span>
          <input class="input" type="number" name="weak_recent_rounds" min="1" max="20" step="1" value="${recentRounds}" inputmode="numeric" required />
          <span>회독 중</span>
        </label>
        <label class="number-setting weak-rule-setting">
          <span>오답</span>
          <input class="input" type="number" name="weak_recent_wrong_threshold" min="1" max="20" step="1" value="${recentThreshold}" inputmode="numeric" required />
          <span>회 이상</span>
        </label>
        <label class="number-setting weak-rule-setting total">
          <span>전체 회독 오답</span>
          <input class="input" type="number" name="weak_card_threshold" min="1" max="20" step="1" value="${totalThreshold}" inputmode="numeric" required />
          <span>회 이상</span>
        </label>
      </div>
      <p class="form-hint">약점 복습에서 틀린 횟수는 최근/전체 회독 기준에는 넣지 않습니다.</p>
    </section>
  `;
}

function renderLevelOptions() {
  const currentLevel = state.settings?.jlpt_level || "";
  return `
    <div class="field">
      <span>JLPT 급수 (선택)</span>
      <div class="level-options" role="radiogroup" aria-label="JLPT 급수 선택">
        ${["", ...JLPT_LEVELS]
          .map(
            (level) => `
              <label class="level-option">
                <input type="radio" name="jlpt_level" value="${level}" ${currentLevel === level ? "checked" : ""} />
                <span>${level || "미정"}</span>
              </label>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function getExamDateParts() {
  const match = String(state.settings?.jlpt_exam_date || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) };
}

function renderSelectOptions(values, selected, placeholder) {
  return `
    <option value="">${placeholder}</option>
    ${values
      .map((value) => `<option value="${value}" ${String(value) === String(selected) ? "selected" : ""}>${value}</option>`)
      .join("")}
  `;
}

function renderExamDateSelects() {
  const parts = getExamDateParts();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, index) => currentYear + index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  return `
    <div class="field">
      <span>목표일</span>
      <div class="date-select-grid">
        <select class="select" name="exam_year" aria-label="목표 연도">
          ${renderSelectOptions(years, parts.year, "연도")}
        </select>
        <select class="select" name="exam_month" aria-label="목표 월">
          ${renderSelectOptions(months, parts.month, "월")}
        </select>
        <select class="select" name="exam_day" aria-label="목표 일">
          ${renderSelectOptions(days, parts.day, "일")}
        </select>
      </div>
    </div>
  `;
}

function renderCollectionListItem(collection) {
  return `
    <article class="group-item collection-item ${collection.id === state.selectedCollectionId ? "active" : ""}">
      <button class="collection-list-main" type="button" data-action="open-collection-detail" data-collection-id="${collection.id}">
        <div class="item-title">
          <strong>${escapeHtml(collection.name)}</strong>
          <span class="pill">${number(collection.card_count)}개</span>
        </div>
        <p class="meta">${escapeHtml(collection.description || "설명 없음")}</p>
        <div class="stat-grid">
          <div class="stat"><strong>${number(collection.group_count)}</strong><span>소그룹</span></div>
          <div class="stat"><strong>${number(collection.card_count)}</strong><span>카드</span></div>
        </div>
        <p class="meta">소그룹 합산 · 묶음 연습은 공식 기록 제외</p>
      </button>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-action="edit-collection" data-collection-id="${
          collection.id
        }">${iconLabel("pencil", "수정")}</button>
        <button class="danger-button" type="button" data-action="delete-collection" data-collection-id="${
          collection.id
        }">${iconLabel("trash", "삭제")}</button>
      </div>
    </article>
  `;
}

function renderGroupListItem(group) {
  const hasHistory =
    number(group.completed_rounds) > 0 || number(group.correct_total) > 0 || number(group.wrong_total) > 0;
  return `
    <article class="group-item ${group.id === state.selectedGroupId ? "active" : ""}">
      <div class="item-title">
        <strong>${escapeHtml(group.name)}</strong>
        <button class="pill group-card-count" type="button" data-action="preview-group-cards" data-group-id="${
          group.id
        }" aria-label="${escapeHtml(`${group.name} 카드 ${number(group.card_count)}개 미리보기`)}">${number(
          group.card_count,
        )}개</button>
      </div>
      <p class="meta">${escapeHtml(group.collection_name || "대그룹 없음")} · ${escapeHtml(group.description || "설명 없음")}</p>
      <div class="stat-grid">
        <div class="stat"><strong>${number(group.completed_rounds)}</strong><span>회독</span></div>
        <div class="stat"><strong>${number(group.correct_total)}</strong><span>알맞음</span></div>
        <div class="stat"><strong>${number(group.wrong_total)}</strong><span>틀림</span></div>
      </div>
      <button class="ghost-button full reset-history-button" type="button" data-action="reset-history" data-group-id="${group.id}" ${
        hasHistory ? "" : "disabled"
      }>${iconLabel("rotate-ccw", "기록 초기화")}</button>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-action="edit-group" data-group-id="${group.id}">${iconLabel(
          "pencil",
          "수정",
        )}</button>
        <button class="danger-button" type="button" data-action="delete-group" data-group-id="${group.id}">${iconLabel(
          "trash",
          "삭제",
        )}</button>
      </div>
    </article>
  `;
}

async function startStudy() {
  const group = getSelectedGroup();
  if (!group) return showToast("학습할 소그룹을 선택하세요.");
  const data = await request(`/api/study?group_id=${group.id}&order=${state.orderMode}`);
  if (!data.cards.length) return showToast("이 소그룹에는 카드가 없습니다.");
  state.session = {
    studyMode: "group",
    group: data.group,
    collection: data.collection,
    selectedGroups: data.groups,
    roundNo: data.round_no,
    orderMode: data.order_mode,
    exampleDisplayMode: state.exampleDisplayMode,
    allCards: data.cards,
    cards: data.cards,
    index: 0,
    passNo: 1,
    passResults: [],
    startedAtIso: new Date().toISOString(),
    startedAtMs: Date.now(),
    showingBack: false,
    expandedExamples: {},
    answerFeedback: null,
    isAnswering: false,
    results: [],
    previousRound: null,
    savedRound: null,
  };
  state.activeDialog = null;
  render();
}

async function startBundleStudy() {
  const collection = getSelectedCollection();
  const selectedGroups = getSelectedStudyGroups();
  if (!collection || !selectedGroups.length) return showToast("학습할 소그룹을 선택하세요.");
  const groupIds = selectedGroups.map((group) => group.id).join(",");
  const data = await request(
    `/api/study?collection_id=${collection.id}&group_ids=${encodeURIComponent(groupIds)}&order=${state.orderMode}`,
  );
  if (!data.cards.length) return showToast("선택한 소그룹에는 카드가 없습니다.");
  state.session = {
    studyMode: "practice",
    group: { id: null, name: `${data.collection.name} 묶음 연습` },
    collection: data.collection,
    selectedGroups: data.groups,
    roundNo: data.round_no,
    orderMode: data.order_mode,
    exampleDisplayMode: state.exampleDisplayMode,
    allCards: data.cards,
    cards: data.cards,
    index: 0,
    passNo: 1,
    passResults: [],
    startedAtIso: new Date().toISOString(),
    startedAtMs: Date.now(),
    showingBack: false,
    expandedExamples: {},
    answerFeedback: null,
    isAnswering: false,
    results: [],
    previousRound: null,
    savedRound: null,
  };
  state.activeDialog = null;
  render();
}

function startWeakStudy() {
  const weakCards = getWeakCards();
  if (!weakCards.length) return showToast("아직 약점 카드가 없습니다.");
  state.session = {
    studyMode: "weak",
    group: { id: null, name: "약점 카드" },
    roundNo: null,
    orderMode: "wrong",
    exampleDisplayMode: state.exampleDisplayMode,
    allCards: weakCards,
    cards: weakCards,
    index: 0,
    passNo: 1,
    passResults: [],
    startedAtIso: new Date().toISOString(),
    startedAtMs: Date.now(),
    showingBack: false,
    expandedExamples: {},
    answerFeedback: null,
    isAnswering: false,
    results: [],
    previousRound: null,
    savedRound: null,
  };
  state.weakCardOpenId = null;
  state.weakPanelOpen = false;
  state.activeDialog = null;
  render();
}

function buildPracticeRound(session) {
  const correctCount = session.results.filter((item) => item.result === "correct").length;
  const wrongCount = session.results.filter((item) => item.result === "wrong").length;
  return {
    id: null,
    group_id: null,
    group_name: session.group.name,
    round_no: "연습",
    order_mode: session.orderMode,
    total_cards: session.results.length,
    correct_count: correctCount,
    wrong_count: wrongCount,
    started_at: session.startedAtIso,
    duration_seconds: elapsedSeconds(session),
    completed_at: new Date().toISOString(),
    practice: true,
  };
}

async function answerCard(result) {
  const session = state.session;
  if (!session || session.savedRound || session.saving || session.isAnswering || !session.showingBack) return;
  const card = session.cards[session.index];
  session.isAnswering = true;
  session.answerFeedback = result;
  render();
  await sleep(ANSWER_FEEDBACK_MS);
  if (state.session !== session || session.savedRound) return;
  const attempt = { card_id: card.id, result, pass_no: session.passNo, position: session.index + 1 };
  session.results.push(attempt);
  session.passResults.push(attempt);
  session.answerFeedback = null;
  session.isAnswering = false;
  if (session.index < session.cards.length - 1) {
    session.index += 1;
    session.showingBack = false;
    render();
    return;
  }
  const wrongAttempts = session.passResults.filter((item) => item.result === "wrong");
  if (wrongAttempts.length) {
    const currentCardsById = new Map(session.cards.map((item) => [Number(item.id), item]));
    session.cards = wrongAttempts.map((item) => currentCardsById.get(Number(item.card_id))).filter(Boolean);
    session.index = 0;
    session.passNo += 1;
    session.passResults = [];
    session.showingBack = false;
    render();
    showToast(`틀린 카드 ${wrongAttempts.length}개를 다시 반복합니다.`);
    return;
  }
  if (session.studyMode === "practice") {
    session.previousRound = null;
    session.savedRound = buildPracticeRound(session);
    state.completionCorrectOpen = false;
    render();
    return;
  }
  session.saving = true;
  try {
    const payload = {
      order_mode: session.orderMode,
      started_at: session.startedAtIso,
      duration_seconds: elapsedSeconds(session),
      results: session.results,
    };
    if (session.studyMode !== "weak") {
      payload.group_id = session.group.id;
    }
    const data = await request(session.studyMode === "weak" ? "/api/weak-rounds" : "/api/rounds", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    session.previousRound = data.previous_round || null;
    session.savedRound = data.round;
    state.completionCorrectOpen = false;
    await loadData();
    render();
  } catch (error) {
    session.saving = false;
    session.answerFeedback = null;
    session.isAnswering = false;
    render();
    throw error;
  }
}

function collectExamples(form) {
  return [...form.querySelectorAll(".example-row")]
    .map((row) => ({
      japanese: row.querySelector('[name="example_japanese"]').value.trim(),
      korean: row.querySelector('[name="example_korean"]').value.trim(),
    }))
    .filter((example) => example.japanese);
}

function updateSingleDuplicateWarning(form) {
  const warning = form.querySelector("#card-duplicate-warning");
  if (!warning) return null;
  const groupId = Number(form.elements.group_id.value);
  const front = form.elements.front.value.trim();
  const duplicate = findDuplicateCard(groupId, front, state.editingCardId);
  if (duplicate) {
    warning.textContent = `같은 소그룹에 이미 '${duplicate.front}' 카드가 있습니다.`;
    warning.hidden = false;
  } else {
    warning.textContent = "";
    warning.hidden = true;
  }
  return duplicate;
}

async function saveCard(form) {
  const payload = {
    group_id: Number(form.elements.group_id.value),
    front: form.elements.front.value.trim(),
    back: form.elements.back.value.trim(),
    memo: form.elements.memo.value.trim(),
    examples: collectExamples(form),
  };
  const isEditing = Boolean(state.editingCardId);
  if (findDuplicateCard(payload.group_id, payload.front, state.editingCardId)) {
    updateSingleDuplicateWarning(form);
    throw new Error("같은 소그룹에 이미 같은 앞면 카드가 있습니다.");
  }
  await request(isEditing ? `/api/cards/${state.editingCardId}` : "/api/cards", {
    method: isEditing ? "PATCH" : "POST",
    body: JSON.stringify(payload),
  });
  state.editingCardId = null;
  state.cardScreen = "list";
  state.cardEntryMode = "single";
  state.selectedGroupId = payload.group_id;
  const targetGroup = state.groups.find((group) => Number(group.id) === Number(payload.group_id));
  if (targetGroup) state.selectedCollectionId = targetGroup.collection_id;
  if (targetGroup) state.cardFilterCollectionId = String(targetGroup.collection_id);
  state.cardFilterGroupId = String(payload.group_id);
  await loadData();
  render();
  showToast(isEditing ? "카드를 저장했습니다." : "카드를 등록했습니다.");
}

function previewBulkCards(form) {
  const groupId = Number(form.elements.group_id.value);
  const text = form.elements.bulk_text.value.trim();
  state.bulkDraftGroupId = groupId;
  state.bulkDraftText = text;
  state.bulkPreview = buildBulkPreview(groupId, text);
  renderCards();
  if (state.bulkPreview.errors.length) {
    showToast("대량 등록 형식을 확인해주세요.");
  } else if (state.bulkPreview.warningCount) {
    showToast("중복 카드를 정리해주세요.");
  } else {
    showToast(`카드 ${state.bulkPreview.items.length}개를 확인했습니다.`);
  }
}

async function confirmBulkCards() {
  const preview = state.bulkPreview;
  if (!preview || preview.errors.length || preview.warningCount || !preview.items.length) {
    showToast("미리보기의 오류나 중복을 먼저 정리해주세요.");
    return;
  }
  const data = await request("/api/cards/bulk", {
    method: "POST",
    body: JSON.stringify({ group_id: preview.groupId, text: preview.text }),
  });
  state.selectedGroupId = preview.groupId;
  const targetGroup = state.groups.find((group) => Number(group.id) === Number(preview.groupId));
  if (targetGroup) state.selectedCollectionId = targetGroup.collection_id;
  if (targetGroup) state.cardFilterCollectionId = String(targetGroup.collection_id);
  state.cardFilterGroupId = String(preview.groupId);
  state.cardSearchQuery = "";
  state.cardScreen = "list";
  state.bulkDraftText = "";
  state.bulkDraftGroupId = null;
  state.bulkPreview = null;
  await loadData();
  render();
  showToast(`카드 ${data.created_count}개를 등록했습니다.`);
}

async function saveGroup(form) {
  const payload = {
    collection_id: Number(form.elements.collection_id.value),
    name: form.elements.name.value.trim(),
    description: form.elements.description.value.trim(),
  };
  const isEditing = Boolean(state.editingGroupId);
  const data = await request(isEditing ? `/api/groups/${state.editingGroupId}` : "/api/groups", {
    method: isEditing ? "PATCH" : "POST",
    body: JSON.stringify(payload),
  });
  state.editingGroupId = null;
  state.selectedCollectionId = payload.collection_id;
  state.selectedGroupId = data.group.id;
  state.groupDetailCollectionId = payload.collection_id;
  state.groupSearchQuery = "";
  state.groupScreen = "list";
  await loadData();
  render();
  showToast(isEditing ? "소그룹을 저장했습니다." : "소그룹을 만들었습니다.");
}

async function saveCollection(form) {
  const payload = { name: form.elements.name.value.trim(), description: form.elements.description.value.trim() };
  const isEditing = Boolean(state.editingCollectionId);
  const data = await request(isEditing ? `/api/collections/${state.editingCollectionId}` : "/api/collections", {
    method: isEditing ? "PATCH" : "POST",
    body: JSON.stringify(payload),
  });
  state.editingCollectionId = null;
  state.selectedCollectionId = data.collection.id;
  state.groupDetailCollectionId = data.collection.id;
  state.groupSearchQuery = "";
  state.groupScreen = "list";
  await loadData();
  render();
  showToast(isEditing ? "대그룹을 저장했습니다." : "대그룹을 만들었습니다.");
}

async function login(form) {
  const nickname = form.elements.nickname.value.trim();
  const accessCode = form.elements.access_code.value.trim();
  state.authValues = { nickname, accessCode };
  if (!nickname) {
    state.authError = "닉네임을 입력하세요.";
    renderAuth();
    return;
  }
  if (!/^\d{6}$/.test(accessCode)) {
    state.authError = "6자리 숫자 코드를 입력하세요.";
    renderAuth();
    return;
  }
  state.authError = "";
  state.authPending = true;
  renderAuth();
  try {
    const data = await request("/api/auth", {
      method: "POST",
      body: JSON.stringify({ nickname, access_code: accessCode }),
    });
    state.user = { id: data.user.id, nickname: data.user.nickname, accessCode };
    saveStoredUser(state.user);
    state.activeTab = "study";
    state.studyStep = "select";
    await loadData();
    state.authPending = false;
    state.authError = "";
    render();
    showToast(`${state.user.nickname}님, 들어왔습니다.`);
  } catch (error) {
    clearStoredUser();
    state.user = null;
    state.authPending = false;
    state.authError = error.message;
    renderAuth();
  }
}

async function saveSettings(form) {
  const examDate = getExamDateFromSettingsForm(form);
  const targetName = form.elements.target_name.value.trim();
  const jlptLevel = form.elements.jlpt_level.value;
  const weakCardThreshold = Number(form.elements.weak_card_threshold.value);
  const weakRecentRounds = Number(form.elements.weak_recent_rounds.value);
  const weakRecentWrongThreshold = Number(form.elements.weak_recent_wrong_threshold.value);
  const weakValues = [weakCardThreshold, weakRecentRounds, weakRecentWrongThreshold];
  if (weakValues.some((value) => !Number.isInteger(value) || value < 1 || value > 20)) {
    throw new Error("약점 카드 기준은 1~20 사이로 입력하세요.");
  }
  const data = await request("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({
      target_name: targetName,
      jlpt_exam_date: examDate,
      jlpt_level: jlptLevel,
      weak_card_threshold: weakCardThreshold,
      weak_recent_rounds: weakRecentRounds,
      weak_recent_wrong_threshold: weakRecentWrongThreshold,
    }),
  });
  state.settings = data.settings;
  await loadData();
  render();
  showToast("설정을 저장했습니다.");
}

async function clearExamDate() {
  const data = await request("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({ target_name: "", jlpt_exam_date: "", jlpt_level: "" }),
  });
  state.settings = data.settings;
  state.activeDialog = null;
  render();
  showToast("학습 목표를 미정으로 초기화했습니다.");
}

function getExamDateFromSettingsForm(form) {
  const year = form.elements.exam_year.value;
  const month = form.elements.exam_month.value;
  const day = form.elements.exam_day.value;
  if (!year && !month && !day) return "";
  if (!year || !month || !day) throw new Error("목표일은 연도, 월, 일을 모두 선택하세요.");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    throw new Error("존재하지 않는 날짜입니다.");
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function logout() {
  clearStoredUser();
  Object.assign(state, {
    user: null,
    collections: [],
    groups: [],
    cards: [],
    rounds: [],
    settings: {
      target_name: "",
      jlpt_exam_date: "",
      jlpt_level: "",
      weak_card_threshold: DEFAULT_WEAK_CARD_THRESHOLD,
      weak_recent_rounds: DEFAULT_WEAK_RECENT_ROUNDS,
      weak_recent_wrong_threshold: DEFAULT_WEAK_RECENT_WRONG_THRESHOLD,
    },
    selectedCollectionId: null,
    selectedStudyGroupIds: [],
    selectedGroupId: null,
    groupDetailCollectionId: null,
    session: null,
    activeDialog: null,
    roundDetail: null,
    pendingTab: null,
    pendingAction: null,
    cardFilterCollectionId: "",
    cardFilterGroupId: "",
    cardSearchQuery: "",
    studyGroupSearchQuery: "",
    studyGroupSortMode: "recent",
    groupSearchQuery: "",
    cardScreen: "list",
    groupScreen: "list",
    cardEntryMode: "single",
    bulkDraftText: "",
    bulkDraftGroupId: null,
    bulkPreview: null,
    dataPanelOpen: false,
    recentRoundsOpen: false,
    exampleDisplayMode: "collapsed",
    studyStep: "select",
    studyOptionsOpen: false,
    weakPanelOpen: false,
    weakCardOpenId: null,
  });
  render();
}

async function exportBackup() {
  const data = await request("/api/backup");
  downloadJson(`byeorakchigi-backup-${new Date().toISOString().slice(0, 10)}.json`, data.backup);
  showToast("백업 파일을 만들었습니다.");
}

function prepareBackupRestore(form) {
  const raw = form.elements.backup_json.value.trim();
  if (!raw) throw new Error("백업 JSON을 넣어주세요.");
  try {
    state.pendingAction = { type: "restore-backup", backup: JSON.parse(raw) };
  } catch {
    throw new Error("백업 JSON 형식이 올바르지 않습니다.");
  }
  state.activeDialog = "restore-backup";
  renderDialog();
}

async function restoreBackup() {
  const backup = state.pendingAction?.backup;
  if (!backup) return;
  const data = await request("/api/backup", { method: "POST", body: JSON.stringify(backup) });
  state.pendingAction = null;
  state.activeDialog = null;
  state.session = null;
  await loadData();
  render();
  showToast(`복원 완료: 카드 ${data.restored.cards}개`);
}

async function deletePendingCard() {
  const cardId = Number(state.pendingAction?.id);
  if (!cardId) return;
  await request(`/api/cards/${cardId}`, { method: "DELETE" });
  state.pendingAction = null;
  state.activeDialog = null;
  await loadData();
  render();
  showToast("카드를 삭제했습니다.");
}

async function resetPendingHistory() {
  const groupId = Number(state.pendingAction?.id);
  if (!groupId) return;
  await request(`/api/groups/${groupId}/reset-history`, { method: "POST" });
  if (state.session?.group?.id === groupId) state.session = null;
  state.pendingAction = null;
  state.activeDialog = null;
  await loadData();
  render();
  showToast("학습기록을 초기화했습니다.");
}

async function resetPendingCollectionHistory() {
  const collectionId = Number(state.pendingAction?.id);
  if (!collectionId) return;
  await request(`/api/collections/${collectionId}/reset-history`, { method: "POST" });
  if (state.session?.collection?.id === collectionId) state.session = null;
  state.pendingAction = null;
  state.activeDialog = null;
  await loadData();
  render();
  showToast("하위 소그룹 기록을 초기화했습니다.");
}

async function deletePendingGroup() {
  const groupId = Number(state.pendingAction?.id);
  if (!groupId) return;
  await request(`/api/groups/${groupId}`, { method: "DELETE" });
  if (state.selectedGroupId === groupId) state.selectedGroupId = null;
  state.pendingAction = null;
  state.activeDialog = null;
  await loadData();
  render();
  showToast("소그룹을 삭제했습니다.");
}

async function deletePendingCollection() {
  const collectionId = Number(state.pendingAction?.id);
  if (!collectionId) return;
  await request(`/api/collections/${collectionId}`, { method: "DELETE" });
  if (state.selectedCollectionId === collectionId) state.selectedCollectionId = null;
  if (Number(state.groupDetailCollectionId) === collectionId) state.groupDetailCollectionId = null;
  state.pendingAction = null;
  state.activeDialog = null;
  await loadData();
  render();
  showToast("대그룹을 삭제했습니다.");
}

async function openRoundDetail(roundId) {
  const cachedRound = state.rounds.find((round) => Number(round.id) === Number(roundId));
  state.roundDetail = { loading: true, id: roundId, round: cachedRound || null, cards: [] };
  state.activeDialog = "round-detail";
  renderDialog();
  const data = await request(`/api/rounds/${roundId}`);
  if (state.activeDialog !== "round-detail" || Number(state.roundDetail?.id) !== Number(roundId)) return;
  state.roundDetail = { ...data, loading: false, id: roundId };
  renderDialog();
}

document.addEventListener("click", async (event) => {
  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    const nextTab = tabButton.dataset.tab;
    if (state.session && !state.session.savedRound && nextTab !== "study") {
      state.pendingTab = nextTab;
      state.activeDialog = "leave";
      renderDialog();
      return;
    }
    if (state.session?.savedRound && nextTab !== "study") {
      if (state.session.studyMode === "practice") state.selectedCollectionId = state.session.collection.id;
      else if (state.session.studyMode !== "weak") state.selectedGroupId = state.session.group.id;
      state.studyStep = state.session.studyMode === "practice" ? "collection" : state.session.studyMode === "weak" ? "select" : "ready";
      state.session = null;
      state.completionCorrectOpen = false;
    }
    state.activeTab = nextTab;
    render();
    return;
  }
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  try {
    if (action === "go-groups") {
      state.activeTab = "groups";
      state.groupScreen = "collection-form";
      state.groupDetailCollectionId = null;
      state.editingCollectionId = null;
      state.editingGroupId = null;
      render();
    }
    if (action === "logout") {
      state.activeDialog = "logout";
      renderDialog();
    }
    if (action === "confirm-logout") logout();
    if (action === "open-study-groups") {
      state.studyStep = state.selectedCollectionId ? "collection" : "select";
      state.studyOptionsOpen = false;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "choose-study-collection") {
      const collectionId = Number(actionEl.dataset.collectionId);
      if (!state.collections.some((collection) => Number(collection.id) === collectionId)) return;
      state.selectedCollectionId = collectionId;
      state.selectedGroupId = null;
      state.studyStep = "collection";
      state.studyGroupSearchQuery = "";
      state.recentRoundsOpen = false;
      state.studyOptionsOpen = false;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "focus-study-collections") {
      state.studyStep = "select";
      render();
      window.requestAnimationFrame(() => {
        document.getElementById("study-collection-browser")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    if (action === "back-to-study-collections") {
      state.studyStep = "select";
      state.selectedGroupId = null;
      state.studyGroupSearchQuery = "";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "choose-study-group") {
      const groupId = Number(actionEl.dataset.groupId);
      const group = state.groups.find((item) => Number(item.id) === groupId);
      if (!group) return;
      state.selectedGroupId = groupId;
      state.selectedCollectionId = group.collection_id;
      state.studyStep = "ready";
      state.recentRoundsOpen = false;
      state.studyOptionsOpen = false;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "open-collection-study-dialog") {
      const collectionId = state.selectedCollectionId || state.collections[0]?.id;
      if (!collectionId) return showToast("대그룹을 먼저 만들어 주세요.");
      state.selectedCollectionId = collectionId;
      state.selectedStudyGroupIds = getGroupsForCollection(collectionId)
        .filter((group) => number(group.card_count) > 0)
        .map((group) => group.id);
      state.activeDialog = "collection-study-picker";
      renderDialog();
    }
    if (action === "add-card-to-study-group") {
      const groupId = Number(actionEl.dataset.groupId);
      const group = state.groups.find((item) => Number(item.id) === groupId);
      state.selectedGroupId = groupId;
      if (group) state.cardFilterCollectionId = String(group.collection_id);
      state.cardFilterGroupId = String(groupId);
      state.activeTab = "cards";
      state.cardScreen = "form";
      state.cardEntryMode = "single";
      state.editingCardId = null;
      state.bulkPreview = null;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "open-group-form-for-collection") {
      const collectionId = Number(actionEl.dataset.collectionId);
      state.selectedCollectionId = collectionId || state.selectedCollectionId;
      state.groupDetailCollectionId = collectionId || state.groupDetailCollectionId;
      state.activeTab = "groups";
      state.activeDialog = null;
      state.pendingAction = null;
      state.groupScreen = "group-form";
      state.editingGroupId = null;
      state.editingCollectionId = null;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "toggle-study-subgroup") {
      const groupId = Number(actionEl.dataset.groupId);
      const selected = new Set(state.selectedStudyGroupIds.map(Number));
      if (actionEl.checked) selected.add(groupId);
      else selected.delete(groupId);
      state.selectedStudyGroupIds = [...selected];
      state.activeDialog === "collection-study-picker" ? renderDialog() : renderStudy();
    }
    if (action === "select-all-study-subgroups") {
      state.selectedStudyGroupIds = getPracticeSelectableGroups().map((group) => group.id);
      state.activeDialog === "collection-study-picker" ? renderDialog() : renderStudy();
    }
    if (action === "clear-study-subgroups") {
      state.selectedStudyGroupIds = [];
      state.activeDialog === "collection-study-picker" ? renderDialog() : renderStudy();
    }
    if (action === "select-practice-preset") {
      const picked = getPracticePresetGroups(actionEl.dataset.preset);
      if (!picked.length) {
        showToast("조건에 맞는 소그룹이 없습니다.");
        return;
      }
      state.selectedStudyGroupIds = picked.map((group) => group.id);
      state.activeDialog === "collection-study-picker" ? renderDialog() : renderStudy();
    }
    if (action === "set-study-group-sort") {
      state.studyGroupSortMode = actionEl.dataset.sort;
      renderStudy();
    }
    if (action === "toggle-weak-panel") {
      state.weakPanelOpen = !state.weakPanelOpen;
      if (!state.weakPanelOpen) state.weakCardOpenId = null;
      renderStudy();
    }
    if (action === "toggle-weak-card") {
      const cardId = Number(actionEl.dataset.cardId);
      state.weakCardOpenId = Number(state.weakCardOpenId) === cardId ? null : cardId;
      renderStudy();
    }
    if (action === "start-weak-study") {
      state.activeDialog = "start-weak";
      renderDialog();
    }
    if (action === "set-order") {
      state.orderMode = actionEl.dataset.order;
      render();
    }
    if (action === "set-example-display") {
      state.exampleDisplayMode = actionEl.dataset.exampleDisplay;
      render();
    }
    if (action === "toggle-study-options") {
      state.studyOptionsOpen = !state.studyOptionsOpen;
      state.activeDialog === "collection-study-picker" ? renderDialog() : renderStudy();
    }
    if (action === "toggle-recent-rounds") {
      state.recentRoundsOpen = !state.recentRoundsOpen;
      renderStudy();
    }
    if (action === "open-round-detail") {
      await openRoundDetail(Number(actionEl.dataset.roundId));
    }
    if (action === "set-card-entry-mode") {
      state.cardEntryMode = actionEl.dataset.mode;
      state.editingCardId = null;
      state.cardScreen = "form";
      state.bulkPreview = null;
      renderCards();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "open-card-form") {
      state.editingCardId = null;
      state.cardScreen = "form";
      state.bulkPreview = null;
      renderCards();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "show-card-list") {
      state.editingCardId = null;
      state.cardScreen = "list";
      renderCards();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "preview-study-cards") {
      state.pendingAction = null;
      state.activeDialog = "preview";
      renderDialog();
    }
    if (action === "preview-bundle-cards") {
      state.pendingAction = {
        type: "preview-bundle-cards",
        id: state.selectedCollectionId,
        groupIds: getSelectedStudyGroups().map((group) => group.id),
      };
      state.activeDialog = "preview";
      renderDialog();
    }
    if (action === "preview-group-cards") {
      state.pendingAction = { type: "preview-group-cards", id: Number(actionEl.dataset.groupId) };
      state.activeDialog = "preview";
      renderDialog();
    }
    if (action === "preview-collection-cards") {
      state.pendingAction = { type: "preview-collection-cards", id: Number(actionEl.dataset.collectionId) };
      state.activeDialog = "preview";
      renderDialog();
    }
    if (action === "start-study") {
      state.activeDialog = "start";
      renderDialog();
    }
    if (action === "confirm-start-study") {
      state.activeDialog = null;
      renderDialog();
      await startStudy();
    }
    if (action === "start-bundle-study") await startBundleStudy();
    if (action === "confirm-start-weak-study") {
      state.activeDialog = null;
      renderDialog();
      startWeakStudy();
    }
    if (action === "toggle-examples" && state.session && !state.session.savedRound) {
      const currentCard = state.session.cards[state.session.index];
      state.session.expandedExamples = state.session.expandedExamples || {};
      state.session.expandedExamples[currentCard.id] = !isCardExamplesExpanded(state.session, currentCard);
      render();
    }
    if (action === "flip-card" && state.session && !state.session.savedRound) {
      state.session.showingBack = true;
      render();
    }
    if (action === "answer-card") await answerCard(actionEl.dataset.result);
    if (action === "quit-study" && state.session) {
      state.activeDialog = "quit";
      renderDialog();
    }
    if (action === "close-dialog") closeDialog();
    if (action === "confirm-delete-card") await deletePendingCard();
    if (action === "confirm-reset-history") await resetPendingHistory();
    if (action === "confirm-reset-collection-history") await resetPendingCollectionHistory();
    if (action === "confirm-delete-group") await deletePendingGroup();
    if (action === "confirm-delete-collection") await deletePendingCollection();
    if (action === "confirm-restore-backup") await restoreBackup();
    if (action === "confirm-quit-study") {
      if (state.session) {
        if (state.session.studyMode === "practice") state.selectedCollectionId = state.session.collection.id;
        else if (state.session.studyMode !== "weak") state.selectedGroupId = state.session.group.id;
        state.studyStep = state.session.studyMode === "practice" ? "collection" : state.session.studyMode === "weak" ? "select" : "ready";
        state.session = null;
      }
      state.activeDialog = null;
      state.pendingTab = null;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "confirm-leave-study") {
      const nextTab = state.pendingTab || "study";
      if (state.session) {
        if (state.session.studyMode === "practice") state.selectedCollectionId = state.session.collection.id;
        else if (state.session.studyMode !== "weak") state.selectedGroupId = state.session.group.id;
        state.studyStep = state.session.studyMode === "practice" ? "collection" : state.session.studyMode === "weak" ? "select" : "ready";
        state.session = null;
      }
      state.activeDialog = null;
      state.pendingTab = null;
      state.activeTab = nextTab;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "jump-wrong-review") {
      scrollToCompletionSection("wrong-review");
    }
    if (action === "scroll-completion-section") {
      scrollToCompletionSection(actionEl.dataset.target);
    }
    if (action === "toggle-completion-correct") {
      state.completionCorrectOpen = !state.completionCorrectOpen;
      renderStudy();
      window.requestAnimationFrame(() => scrollToCompletionSection("correct-review"));
    }
    if (action === "end-study") {
      state.activeDialog = "return-completion";
      renderDialog();
    }
    if (action === "confirm-end-study") {
      const completedMode = state.session?.studyMode;
      if (state.session) {
        if (state.session.studyMode === "practice") state.selectedCollectionId = state.session.collection.id;
        else if (state.session.studyMode !== "weak") state.selectedGroupId = state.session.group.id;
      }
      state.session = null;
      state.completionCorrectOpen = false;
      state.studyStep = completedMode === "weak" ? "select" : completedMode === "practice" ? "collection" : "ready";
      state.activeDialog = null;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "export-backup") await exportBackup();
    if (action === "confirm-bulk-cards") await confirmBulkCards();
    if (action === "toggle-data-panel") {
      state.dataPanelOpen = !state.dataPanelOpen;
      renderSettings();
    }
    if (action === "clear-exam-date") {
      state.activeDialog = "clear-exam-date";
      renderDialog();
    }
    if (action === "confirm-clear-exam-date") await clearExamDate();
    if (action === "open-group-form") {
      state.editingGroupId = null;
      state.editingCollectionId = null;
      state.groupDetailCollectionId = state.groupDetailCollectionId || state.selectedCollectionId;
      state.groupScreen = "group-form";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "open-collection-form") {
      state.editingCollectionId = null;
      state.editingGroupId = null;
      state.groupDetailCollectionId = null;
      state.groupScreen = "collection-form";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "show-group-list") {
      state.editingGroupId = null;
      state.editingCollectionId = null;
      state.groupScreen = "list";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "open-collection-detail") {
      const collectionId = Number(actionEl.dataset.collectionId);
      if (!state.collections.some((collection) => Number(collection.id) === collectionId)) return;
      state.groupDetailCollectionId = collectionId;
      state.selectedCollectionId = collectionId;
      state.groupScreen = "list";
      state.editingGroupId = null;
      state.editingCollectionId = null;
      state.groupSearchQuery = "";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "back-to-collections") {
      state.groupDetailCollectionId = null;
      state.groupScreen = "list";
      state.editingGroupId = null;
      state.editingCollectionId = null;
      state.groupSearchQuery = "";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "clear-search") {
      const target = actionEl.dataset.target;
      if (target === "card-search") {
        state.cardSearchQuery = "";
        renderCards();
      }
      if (target === "study-group-search") {
        state.studyGroupSearchQuery = "";
        renderStudy();
      }
      if (target === "group-search") {
        state.groupSearchQuery = "";
        renderGroups();
      }
    }
    if (action === "add-example") {
      const list = document.querySelector("#example-editor-list");
      const index = list.querySelectorAll(".example-row").length;
      list.insertAdjacentHTML("beforeend", renderExampleEditorRow({}, index, false));
    }
    if (action === "toggle-example-row") {
      const row = actionEl.closest(".example-row");
      row.classList.toggle("collapsed");
      const isCollapsed = row.classList.contains("collapsed");
      actionEl.innerHTML = iconLabel(isCollapsed ? "chevron-down" : "chevron-up", isCollapsed ? "펼치기" : "접기");
    }
    if (action === "remove-example") {
      const list = document.querySelector("#example-editor-list");
      const rows = list.querySelectorAll(".example-row");
      const row = actionEl.closest(".example-row");
      if (rows.length <= 1) {
        row.querySelector('[name="example_japanese"]').value = "";
        row.querySelector('[name="example_korean"]').value = "";
      } else {
        row.remove();
      }
    }
    if (action === "edit-card") {
      const card = state.cards.find((item) => Number(item.id) === Number(actionEl.dataset.cardId));
      state.editingCardId = Number(actionEl.dataset.cardId);
      if (card) {
        state.selectedGroupId = card.group_id;
        state.selectedCollectionId = card.collection_id;
      }
      state.cardEntryMode = "single";
      state.cardScreen = "form";
      state.bulkPreview = null;
      state.activeTab = "cards";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "reset-card-form") {
      state.editingCardId = null;
      state.cardScreen = "form";
      renderCards();
    }
    if (action === "delete-card") {
      const card = state.cards.find((item) => item.id === Number(actionEl.dataset.cardId));
      if (card) {
        state.pendingAction = { type: "delete-card", id: card.id };
        state.activeDialog = "delete-card";
        renderDialog();
      }
    }
    if (action === "edit-group") {
      const group = state.groups.find((item) => item.id === Number(actionEl.dataset.groupId));
      state.editingGroupId = Number(actionEl.dataset.groupId);
      state.editingCollectionId = null;
      if (group) state.groupDetailCollectionId = group.collection_id;
      state.groupScreen = "group-form";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "edit-collection") {
      state.editingCollectionId = Number(actionEl.dataset.collectionId);
      state.editingGroupId = null;
      state.groupScreen = "collection-form";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "reset-group-form") {
      state.editingGroupId = null;
      state.groupScreen = "group-form";
      render();
    }
    if (action === "reset-history") {
      const group = state.groups.find((item) => item.id === Number(actionEl.dataset.groupId));
      if (group) {
        state.pendingAction = { type: "reset-history", id: group.id };
        state.activeDialog = "reset-history";
        renderDialog();
      }
    }
    if (action === "delete-group") {
      const group = state.groups.find((item) => item.id === Number(actionEl.dataset.groupId));
      if (group) {
        state.pendingAction = { type: "delete-group", id: group.id };
        state.activeDialog = "delete-group";
        renderDialog();
      }
    }
    if (action === "reset-collection-history") {
      const collection = state.collections.find((item) => item.id === Number(actionEl.dataset.collectionId));
      if (collection) {
        state.pendingAction = { type: "reset-collection-history", id: collection.id };
        state.activeDialog = "reset-collection-history";
        renderDialog();
      }
    }
    if (action === "delete-collection") {
      const collection = state.collections.find((item) => item.id === Number(actionEl.dataset.collectionId));
      if (collection) {
        state.pendingAction = { type: "delete-collection", id: collection.id };
        state.activeDialog = "delete-collection";
        renderDialog();
      }
    }
  } catch (error) {
    showToast(error.message);
  }
});

document.addEventListener("change", async (event) => {
  try {
    if (event.target.id === "card-collection-filter") {
      state.cardFilterCollectionId = event.target.value;
      state.cardFilterGroupId = "";
      renderCards();
    }
    if (event.target.id === "card-group-filter") {
      state.cardFilterGroupId = event.target.value;
      renderCards();
    }
    if (event.target.id === "study-collection-select") {
      const collectionId = Number(event.target.value);
      state.selectedCollectionId = collectionId;
      state.selectedStudyGroupIds = getGroupsForCollection(collectionId)
        .filter((group) => number(group.card_count) > 0)
        .map((group) => group.id);
      renderDialog();
    }
    if (event.target.id === "card-form-collection") {
      const collectionId = Number(event.target.value);
      const nextGroup = getGroupsForCollection(collectionId)[0];
      state.selectedCollectionId = collectionId;
      state.selectedGroupId = nextGroup?.id || null;
      renderCards();
    }
    if (event.target.id === "card-form-group") {
      state.selectedGroupId = Number(event.target.value);
      updateSingleDuplicateWarning(event.target.closest("#card-form"));
    }
    if (event.target.id === "bulk-card-collection") {
      const collectionId = Number(event.target.value);
      const nextGroup = getGroupsForCollection(collectionId)[0];
      state.selectedCollectionId = collectionId;
      state.bulkDraftGroupId = nextGroup?.id || null;
      state.bulkPreview = null;
      renderCards();
    }
    if (event.target.id === "bulk-card-group") {
      state.bulkDraftGroupId = Number(event.target.value);
      state.bulkPreview = null;
    }
    if (event.target.closest("#card-form") && event.target.name === "group_id") {
      updateSingleDuplicateWarning(event.target.closest("#card-form"));
    }
    if (event.target.closest("#bulk-card-form") && event.target.name === "group_id") {
      state.bulkDraftGroupId = Number(event.target.value);
      state.bulkPreview = null;
    }
    if (event.target.id === "backup-file-input") {
      const text = await readTextFile(event.target.files?.[0]);
      const textarea = document.querySelector('[name="backup_json"]');
      if (textarea && text) {
        textarea.value = text;
        showToast("백업 파일을 불러왔습니다.");
      }
    }
  } catch (error) {
    showToast(error.message);
  }
});

function updateSearchInput(event) {
  if (event.target.closest("#card-form") && event.target.name === "front") {
    updateSingleDuplicateWarning(event.target.closest("#card-form"));
  }
  if (event.target.closest("#bulk-card-form") && event.target.name === "bulk_text") {
    state.bulkDraftText = event.target.value;
    state.bulkPreview = null;
  }
  if (event.target.id === "card-search") {
    state.cardSearchQuery = event.target.value;
    renderCards();
    refocusInput("card-search");
  }
  if (event.target.id === "study-group-search") {
    state.studyGroupSearchQuery = event.target.value;
    renderStudy();
    refocusInput("study-group-search");
  }
  if (event.target.id === "group-search") {
    state.groupSearchQuery = event.target.value;
    renderGroups();
    refocusInput("group-search");
  }
}

document.addEventListener("input", (event) => {
  if (event.isComposing) return;
  updateSearchInput(event);
});

document.addEventListener("compositionend", (event) => {
  updateSearchInput(event);
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (event.target.id === "login-form") await login(event.target);
    if (event.target.id === "card-form") await saveCard(event.target);
    if (event.target.id === "bulk-card-form") previewBulkCards(event.target);
    if (event.target.id === "collection-form") await saveCollection(event.target);
    if (event.target.id === "group-form") await saveGroup(event.target);
    if (event.target.id === "backup-import-form") prepareBackupRestore(event.target);
    if (event.target.id === "settings-form") await saveSettings(event.target);
  } catch (error) {
    showToast(error.message);
  }
});

document.addEventListener("keydown", async (event) => {
  if (event.key === "Escape" && state.activeDialog) {
    closeDialog();
    return;
  }
  const target = event.target;
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  if (isTyping || !state.session || state.session.savedRound) return;
  if (state.session.isAnswering) return;
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    state.session.showingBack = true;
    render();
  }
  if (state.session.showingBack && event.key === "ArrowLeft") {
    event.preventDefault();
    await answerCard("wrong");
  }
  if (state.session.showingBack && event.key === "ArrowRight") {
    event.preventDefault();
    await answerCard("correct");
  }
});

async function init() {
  state.user = loadStoredUser();
  if (!state.user) {
    render();
    return;
  }
  try {
    await loadData();
    render();
  } catch (error) {
    clearStoredUser();
    state.user = null;
    render();
    showToast(error.message);
  }
}

init();
