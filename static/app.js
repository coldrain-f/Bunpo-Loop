const {
  ALLOWED_LOGINS,
  DEFAULT_LOGIN,
  ORDER_LABELS,
  TAB_LABELS,
  escapeHtml,
  formatDate,
  formatDuration,
  number,
} = window.ByeorakchigiShared || window.JLPTShared;
const { clearStoredUser, loadStoredUser, saveStoredUser } = window.ByeorakchigiStorage || window.JLPTStorage;
const { downloadBlob, downloadJson, readTextFile } = window.ByeorakchigiFiles || window.JLPTFiles;
const reducedMotionQuery =
  typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

const ORDER_DESCRIPTIONS = {
  sequence: "등록한 순서 그대로 차분히 봅니다.",
  random: "순서를 섞어 순서 기억에 기대지 않게 합니다.",
  wrong: "누적 오답이 많은 카드부터 봅니다.",
};

const EXAMPLE_DISPLAY_LABELS = {
  collapsed: "1개만 먼저 보기",
  expanded: "모두 펼쳐 보기",
};

const EXAMPLE_DISPLAY_DESCRIPTIONS = {
  collapsed: "카드 뒷면에서 예문 1개만 먼저 보여주고 나머지는 접어둡니다.",
  expanded: "카드 뒷면에서 예문을 처음부터 모두 보여줍니다.",
};

const EXAMPLE_ORDER_LABELS = {
  sequence: "예문 순차",
  random: "예문 랜덤",
};

const EXAMPLE_ORDER_DESCRIPTIONS = {
  sequence: "등록한 예문 순서대로 봅니다.",
  random: "세션을 시작할 때 카드별 예문 순서를 섞습니다.",
};

const FRONT_EXAMPLE_LABELS = {
  hidden: "앞면 예문 숨김",
  shown: "앞면 예문 보기",
};

const FRONT_EXAMPLE_DESCRIPTIONS = {
  hidden: "앞면에는 카드 내용만 봅니다.",
  shown: "앞면에 일본어 예문을 1개 먼저 힌트로 봅니다.",
};

const STUDY_GROUP_SORT_LABELS = {
  recent: "최근순",
  wrong: "오답순",
  cards: "카드순",
  name: "이름순",
};

const STATS_RANGE_LABELS = {
  all: "전체",
  today: "오늘",
  days7: "7일",
  days30: "30일",
  days60: "60일",
  days90: "90일",
};

const KOKKO_MASCOTS = {
  welcome: {
    src: "/static/assets/kokko-welcome.png",
    label: "꼬꼬가 회독 카드를 들고 반기는 중",
  },
  empty: {
    src: "/static/assets/kokko-empty.png",
    label: "꼬꼬가 빈 카드 상자에서 기다리는 중",
  },
  stats: {
    src: "/static/assets/kokko-stats.png",
    label: "꼬꼬가 회독 통계를 보여주는 중",
  },
  shield: {
    src: "/static/assets/kokko-shield.png",
    label: "꼬꼬가 좋은 상태를 지켜주는 중",
  },
  medal: {
    src: "/static/assets/celebration-niwatori-medal.png",
    label: "꼬꼬가 번개 메달을 보여주는 중",
  },
  study: {
    src: "/static/assets/celebration-niwatori-study.png",
    label: "꼬꼬가 카드 더미 옆에서 축하하는 중",
  },
  flag: {
    src: "/static/assets/celebration-niwatori-flag.png",
    label: "꼬꼬가 번개 깃발을 흔드는 중",
  },
};

const COMPLETION_MASCOTS = [
  { id: "welcome", ...KOKKO_MASCOTS.welcome },
  { id: "medal", ...KOKKO_MASCOTS.medal },
  { id: "study", ...KOKKO_MASCOTS.study },
  { id: "flag", ...KOKKO_MASCOTS.flag },
  { id: "stats", ...KOKKO_MASCOTS.stats },
  { id: "shield", ...KOKKO_MASCOTS.shield },
];

const DEFAULT_WEAK_CARD_THRESHOLD = 16;
const DEFAULT_WEAK_RECENT_ROUNDS = 3;
const DEFAULT_WEAK_RECENT_WRONG_THRESHOLD = 8;
const DEFAULT_CONTROLLER_A_ACTION = "primary";
const DEFAULT_CONTROLLER_B_ACTION = "wrong";
const DEFAULT_CONTROLLER_X_ACTION = "disabled";
const DEFAULT_CONTROLLER_Y_ACTION = "disabled";
const DEFAULT_STUDY_ORDER_MODE = "random";
const DEFAULT_EXAMPLE_DISPLAY_MODE = "collapsed";
const DEFAULT_EXAMPLE_ORDER_MODE = "sequence";
const DEFAULT_FRONT_EXAMPLE_MODE = "shown";
const CONTROLLER_ACTION_LABELS = {
  primary: "뒤집기/알맞음",
  wrong: "틀림",
  disabled: "사용 안 함",
};
const CONTROLLER_BUTTON_LABELS = {
  a: "A 버튼",
  b: "B 버튼",
  x: "X 버튼",
  y: "Y 버튼",
};
const CARD_LIST_PAGE_SIZE = 80;
const CARD_PAGE_SIZE = 10;
const GROUP_LIST_PAGE_SIZE = 60;
const STATS_COLLECTION_LIST_PAGE_SIZE = 40;
const ROUND_DETAIL_SECTION_PAGE_SIZE = 60;
const BULK_PREVIEW_RENDER_LIMIT = 80;
const CSV_IMPORT_ACCEPT = "text/csv,.csv";
const STUDY_GAMEPAD_A_BUTTONS = new Set([0, 15]);
const STUDY_GAMEPAD_B_BUTTONS = new Set([1, 14]);
const STUDY_GAMEPAD_X_BUTTONS = new Set([2]);
const STUDY_GAMEPAD_Y_BUTTONS = new Set([3]);
const STUDY_CONTROLLER_COOLDOWN_MS = 250;
const STUDY_CONTROLLER_STATUS_FLASH_MS = 1200;
const CARD_SEARCH_TEXT_CACHE = new WeakMap();

const state = {
  activeTab: "study",
  isOffline: typeof navigator !== "undefined" && "onLine" in navigator ? !navigator.onLine : false,
  user: null,
  authError: "",
  authPending: false,
  authValues: { ...DEFAULT_LOGIN },
  appStatus: "idle",
  appError: null,
  backupError: "",
  backupDraftText: "",
  pendingRequest: null,
  collections: [],
  groups: [],
  cards: [],
  rounds: [],
  settings: {
    target_name: "",
    jlpt_exam_date: "",
    weak_card_threshold: DEFAULT_WEAK_CARD_THRESHOLD,
    weak_recent_rounds: DEFAULT_WEAK_RECENT_ROUNDS,
    weak_recent_wrong_threshold: DEFAULT_WEAK_RECENT_WRONG_THRESHOLD,
    controller_a_action: DEFAULT_CONTROLLER_A_ACTION,
    controller_b_action: DEFAULT_CONTROLLER_B_ACTION,
    controller_x_action: DEFAULT_CONTROLLER_X_ACTION,
    controller_y_action: DEFAULT_CONTROLLER_Y_ACTION,
    study_order_mode: DEFAULT_STUDY_ORDER_MODE,
    example_display_mode: DEFAULT_EXAMPLE_DISPLAY_MODE,
    example_order_mode: DEFAULT_EXAMPLE_ORDER_MODE,
    front_example_mode: DEFAULT_FRONT_EXAMPLE_MODE,
  },
  selectedCollectionId: null,
  selectedStudyGroupIds: [],
  selectedGroupId: null,
  cardFilterCollectionId: "",
  cardFilterGroupId: "",
  cardSearchQuery: "",
  cardPage: 0,
  studyCollectionSearchQuery: "",
  studyGroupSearchQuery: "",
  collectionSearchQuery: "",
  studyGroupSortMode: "recent",
  groupSearchQuery: "",
  cardListLimit: CARD_LIST_PAGE_SIZE,
  groupListLimit: GROUP_LIST_PAGE_SIZE,
  scrollPositions: {},
  cardScreen: "list",
  groupScreen: "list",
  groupDetailCollectionId: null,
  cardEntryMode: "single",
  bulkDraftText: "",
  bulkDraftGroupId: null,
  bulkPreview: null,
  dataPanelOpen: false,
  recentRoundsOpen: false,
  statsRecentRoundsOpen: false,
  statsRangeMode: "all",
  statsCollectionId: "",
  statsCollectionListLimit: STATS_COLLECTION_LIST_PAGE_SIZE,
  orderMode: DEFAULT_STUDY_ORDER_MODE,
  exampleDisplayMode: DEFAULT_EXAMPLE_DISPLAY_MODE,
  exampleOrderMode: DEFAULT_EXAMPLE_ORDER_MODE,
  frontExampleMode: DEFAULT_FRONT_EXAMPLE_MODE,
  studyStep: "select",
  studyCollectionPage: 0,
  studyGroupPage: 0,
  studyOptionsOpen: false,
  weakPanelOpen: false,
  weakCardOpenId: null,
  completionCorrectOpen: false,
  session: null,
  collectionStudyReturnContext: null,
  activeDialog: null,
  roundDetail: null,
  pendingTab: null,
  pendingAction: null,
  pendingHistoryRoute: null,
  editingCardId: null,
  editingGroupId: null,
  editingCollectionId: null,
};

const views = {
  auth: document.querySelector("#view-auth"),
  study: document.querySelector("#view-study"),
  groups: document.querySelector("#view-groups"),
  cards: document.querySelector("#view-cards"),
  stats: document.querySelector("#view-stats"),
  settings: document.querySelector("#view-settings"),
};
const toastEl = document.querySelector("#toast");
const dialogRoot = document.querySelector("#dialog-root");
const headerUserEl = document.querySelector("#header-user");
const headerGreetingEl = document.querySelector("#header-greeting");
const headerContextEl = document.querySelector("#header-context");
const connectionBannerEl = document.querySelector("#connection-banner");
let studyTimerId = null;
let studyGamepadFrameId = null;
const studyGamepadPressedButtons = new Set();
let studyControllerLastActionAt = 0;
let studyControllerLastInputAt = 0;
let studyControllerLastInputLabel = "";
let studyControllerStatusTimerId = null;
let studyGamepadConnected = false;
let renderedDialogName = null;
let dialogReturnFocusEl = null;
let shouldFocusDialogOnRender = false;
let historyInitialized = false;
let lastHistoryRouteKey = "";
let isApplyingHistoryRoute = false;
let lastHiddenAtMs = 0;
let resumeRefreshPending = false;
let studyOptionSaveSerial = 0;
const ANSWER_FEEDBACK_MS = 230;
const RESUME_REFRESH_AFTER_MS = 5 * 60 * 1000;
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
const DISMISSIBLE_DIALOGS = new Set(["preview", "round-detail", "collection-study-picker", "edit-card-in-session"]);

function defaultSettings() {
  return {
    target_name: "",
    jlpt_exam_date: "",
    weak_card_threshold: DEFAULT_WEAK_CARD_THRESHOLD,
    weak_recent_rounds: DEFAULT_WEAK_RECENT_ROUNDS,
    weak_recent_wrong_threshold: DEFAULT_WEAK_RECENT_WRONG_THRESHOLD,
    controller_a_action: DEFAULT_CONTROLLER_A_ACTION,
    controller_b_action: DEFAULT_CONTROLLER_B_ACTION,
    controller_x_action: DEFAULT_CONTROLLER_X_ACTION,
    controller_y_action: DEFAULT_CONTROLLER_Y_ACTION,
    study_order_mode: DEFAULT_STUDY_ORDER_MODE,
    example_display_mode: DEFAULT_EXAMPLE_DISPLAY_MODE,
    example_order_mode: DEFAULT_EXAMPLE_ORDER_MODE,
    front_example_mode: DEFAULT_FRONT_EXAMPLE_MODE,
  };
}

function hasOwnOption(options, value) {
  return Object.prototype.hasOwnProperty.call(options, String(value || ""));
}

function normalizeStudyOrderMode(value) {
  return hasOwnOption(ORDER_LABELS, value) ? String(value) : DEFAULT_STUDY_ORDER_MODE;
}

function normalizeExampleDisplayMode(value) {
  return hasOwnOption(EXAMPLE_DISPLAY_LABELS, value) ? String(value) : DEFAULT_EXAMPLE_DISPLAY_MODE;
}

function normalizeExampleOrderMode(value) {
  return hasOwnOption(EXAMPLE_ORDER_LABELS, value) ? String(value) : DEFAULT_EXAMPLE_ORDER_MODE;
}

function normalizeFrontExampleMode(value) {
  return hasOwnOption(FRONT_EXAMPLE_LABELS, value) ? String(value) : DEFAULT_FRONT_EXAMPLE_MODE;
}

function normalizeSettings(settings = {}) {
  const merged = { ...defaultSettings(), ...(settings || {}) };
  return {
    ...merged,
    study_order_mode: normalizeStudyOrderMode(merged.study_order_mode),
    example_display_mode: normalizeExampleDisplayMode(merged.example_display_mode),
    example_order_mode: normalizeExampleOrderMode(merged.example_order_mode),
    front_example_mode: normalizeFrontExampleMode(merged.front_example_mode),
  };
}

function currentStudyOptionSettings() {
  return {
    study_order_mode: normalizeStudyOrderMode(state.orderMode),
    example_display_mode: normalizeExampleDisplayMode(state.exampleDisplayMode),
    example_order_mode: normalizeExampleOrderMode(state.exampleOrderMode),
    front_example_mode: normalizeFrontExampleMode(state.frontExampleMode),
  };
}

function applyStudyOptionSettings(settings = state.settings) {
  state.orderMode = normalizeStudyOrderMode(settings?.study_order_mode);
  state.exampleDisplayMode = normalizeExampleDisplayMode(settings?.example_display_mode);
  state.exampleOrderMode = normalizeExampleOrderMode(settings?.example_order_mode);
  state.frontExampleMode = normalizeFrontExampleMode(settings?.front_example_mode);
}

function syncStudyOptionSettings() {
  state.settings = normalizeSettings({
    ...state.settings,
    ...currentStudyOptionSettings(),
  });
}

function icon(name, extraClass = "") {
  return `<svg class="icon${extraClass ? ` ${extraClass}` : ""}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function iconLabel(name, label) {
  return `<span class="button-content">${icon(name)}<span>${escapeHtml(label)}</span></span>`;
}

function getStableElementId(prefix, value) {
  return `${prefix}-${hashString(value).toString(36)}`;
}

function renderHelpDisclosure(label, body, className = "") {
  const helpId = getStableElementId("help", `${label}|${body}`);
  return `
    <details class="help-disclosure ${className}">
      <summary aria-label="${escapeHtml(label)}" aria-controls="${helpId}" aria-expanded="false">
        ${icon("info")}
        <span class="sr-only">${escapeHtml(label)}</span>
      </summary>
      <p id="${helpId}">${escapeHtml(body)}</p>
    </details>
  `;
}

function syncHelpDisclosureState(details) {
  const summary = details?.querySelector?.("summary");
  if (summary instanceof HTMLElement) summary.setAttribute("aria-expanded", details.open ? "true" : "false");
}

function closeHelpDisclosures(except = null) {
  document.querySelectorAll("details.help-disclosure[open]").forEach((item) => {
    if (item !== except) item.open = false;
  });
}

function renderSectionHeading(label, helpText = "") {
  return `
    <div class="section-heading-with-help">
      <span class="field-label">${escapeHtml(label)}</span>
      ${helpText ? renderHelpDisclosure(`${label} 안내`, helpText) : ""}
    </div>
  `;
}

function renderFieldLabel(label, helpText = "") {
  return `
    <div class="field-label-row">
      <span>${escapeHtml(label)}</span>
      ${helpText ? renderHelpDisclosure(`${label} 안내`, helpText) : ""}
    </div>
  `;
}

function showToast(message, { duration = 2200 } = {}) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toastEl.classList.remove("show");
    toastEl.textContent = "";
  }, duration);
}

function isBrowserOffline() {
  return typeof navigator !== "undefined" && "onLine" in navigator && !navigator.onLine;
}

function getRequestErrorMessage(error) {
  if (error?.code === "offline") {
    return error?.message || "오프라인 상태입니다. 온라인으로 돌아온 뒤 다시 시도하세요.";
  }
  if (error?.code === "network") {
    return error?.message || "연결 실패. 다시 눌러 재시도하세요.";
  }
  return error?.message || "요청을 처리하지 못했습니다.";
}

function showRequestError(error, fallback = "") {
  const isConnectionError = error?.code === "network" || error?.code === "offline";
  showToast(isConnectionError ? getRequestErrorMessage(error) : fallback || getRequestErrorMessage(error), {
    duration: isConnectionError ? 4200 : 2400,
  });
}

function renderConnectionBanner() {
  if (!connectionBannerEl) return;
  connectionBannerEl.hidden = !state.isOffline;
  connectionBannerEl.textContent = state.isOffline
    ? "오프라인 상태입니다. 새 데이터 불러오기와 학습 기록 저장은 온라인에서만 가능합니다."
    : "";
}

function syncConnectionState({ notify = false } = {}) {
  const wasOffline = state.isOffline;
  state.isOffline = isBrowserOffline();
  renderConnectionBanner();
  if (!notify || wasOffline === state.isOffline) return;
  showToast(
    state.isOffline ? "오프라인 상태입니다. 저장은 온라인에서 다시 시도하세요." : "다시 연결됐습니다. 필요하면 다시 시도하세요.",
    { duration: 3600 },
  );
}

function getFocusableElements(container = document) {
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (element.closest("[hidden]")) return false;
    return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  });
}

function focusDialogContent() {
  const dialog = dialogRoot.querySelector('[role="dialog"]');
  if (!dialog) return;
  const focusTarget = getFocusableElements(dialog)[0] || dialog.querySelector("h2") || dialog;
  if (focusTarget instanceof HTMLElement) {
    if (!focusTarget.matches(FOCUSABLE_SELECTOR) && !focusTarget.hasAttribute("tabindex")) {
      focusTarget.setAttribute("tabindex", "-1");
    }
    focusTarget.focus({ preventScroll: true });
  }
}

function beginDialogRender() {
  if (!state.activeDialog) return;
  const isNewDialog = renderedDialogName !== state.activeDialog;
  if (!isNewDialog) return;
  const activeElement = document.activeElement;
  dialogReturnFocusEl =
    activeElement instanceof HTMLElement && activeElement !== document.body && !dialogRoot.contains(activeElement)
      ? activeElement
      : null;
  shouldFocusDialogOnRender = true;
}

function finishDialogRender() {
  renderedDialogName = state.activeDialog;
  if (!shouldFocusDialogOnRender) return;
  shouldFocusDialogOnRender = false;
  window.requestAnimationFrame(focusDialogContent);
}

function restoreDialogFocus() {
  const target = dialogReturnFocusEl;
  dialogReturnFocusEl = null;
  renderedDialogName = null;
  shouldFocusDialogOnRender = false;
  if (target?.isConnected) window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
}

function canDismissActiveDialogWithEscape() {
  return Boolean(state.activeDialog && DISMISSIBLE_DIALOGS.has(state.activeDialog));
}

function trapDialogFocus(event) {
  const dialog = dialogRoot.querySelector('[role="dialog"]');
  if (!dialog) return;
  const focusable = getFocusableElements(dialog);
  if (!focusable.length) {
    event.preventDefault();
    if (dialog instanceof HTMLElement) dialog.focus({ preventScroll: true });
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function focusAfterRender(selectors) {
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  window.requestAnimationFrame(() => {
    const candidates = selectorList.flatMap((selector) => [...document.querySelectorAll(selector)]);
    const target = candidates.find((element) => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.closest("[hidden]")) return false;
      return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    });
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches(FOCUSABLE_SELECTOR) && !target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  });
}

function shouldMoveFocusAfterClick(event) {
  return event.detail === 0;
}

function isTypingTarget(target) {
  return (
    target instanceof HTMLElement &&
    (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)
  );
}

function submitFormFromKeyboard(event) {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.key !== "Enter" ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return false;
  }
  const target = event.target;
  if (
    !(target instanceof HTMLElement) ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  ) {
    return false;
  }
  const form = target.closest("form");
  if (!(form instanceof HTMLFormElement)) return false;
  const submitter = form.querySelector('button[type="submit"]:not([disabled])');
  if (!(submitter instanceof HTMLElement)) return false;
  event.preventDefault();
  if (typeof form.requestSubmit === "function") form.requestSubmit(submitter);
  else submitter.click();
  return true;
}

function activateControlFromKeyboard(event) {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    (event.key !== "Enter" && event.key !== " ") ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  ) {
    return false;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement) || isTypingTarget(target)) return false;
  const control = target.closest('button[data-tab], button[data-action], [role="button"][data-action]');
  if (!(control instanceof HTMLElement) || control.hasAttribute("disabled")) return false;
  event.preventDefault();
  control.click();
  return true;
}

function makeRequestError(message, details = {}) {
  const error = new Error(message);
  Object.assign(error, details);
  return error;
}

function buildAuthHeaders(accept = "application/json", extra = {}) {
  const headers = { Accept: accept, ...extra };
  if (state.user) {
    headers["X-Byeorakchigi-User-Id"] = String(state.user.id);
    headers["X-Byeorakchigi-Code"] = state.user.accessCode;
  }
  return headers;
}

async function request(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const isWrite = !["GET", "HEAD"].includes(method);
  if (isBrowserOffline()) {
    state.isOffline = true;
    renderConnectionBanner();
    throw makeRequestError(
      isWrite
        ? "오프라인 상태라 서버에 저장하지 못했습니다. 연결 후 다시 시도하세요."
        : "오프라인 상태입니다. 연결 후 다시 시도하세요.",
      { code: "offline", method },
    );
  }
  const headers = buildAuthHeaders("application/json", options.headers || {});
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch (error) {
    throw makeRequestError(
      isWrite
        ? "서버에 연결하지 못해 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도하세요."
        : "서버에 연결하지 못했습니다. 실행 중인지 확인한 뒤 다시 시도하세요.",
      {
        code: "network",
        method,
        cause: error,
      },
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw makeRequestError(data.error || "요청을 처리하지 못했습니다.", {
      status: response.status,
      code: response.status === 401 ? "auth" : "api",
      detail: data.detail || "",
    });
  }
  return data;
}

async function requestBlob(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const isWrite = !["GET", "HEAD"].includes(method);
  if (isBrowserOffline()) {
    state.isOffline = true;
    renderConnectionBanner();
    throw makeRequestError(
      isWrite
        ? "오프라인 상태라 서버에 저장하지 못했습니다. 연결 후 다시 시도하세요."
        : "오프라인 상태입니다. 연결 후 다시 시도하세요.",
      { code: "offline", method },
    );
  }
  const headers = buildAuthHeaders(options.accept || "text/csv", options.headers || {});
  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch (error) {
    throw makeRequestError("서버에 연결하지 못했습니다. 실행 중인지 확인한 뒤 다시 시도하세요.", {
      code: "network",
      method,
      cause: error,
    });
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw makeRequestError(data.error || "파일을 처리하지 못했습니다.", {
      status: response.status,
      code: response.status === 401 ? "auth" : "api",
      detail: data.detail || "",
    });
  }
  return {
    blob: await response.blob(),
    response,
  };
}

function reconcileLoadedState() {
  const collectionIds = new Set(state.collections.map((collection) => Number(collection.id)));
  const groupById = new Map(state.groups.map((group) => [Number(group.id), group]));
  const cardIds = new Set(state.cards.map((card) => Number(card.id)));

  if (!state.collections.length) {
    state.selectedCollectionId = null;
    state.selectedStudyGroupIds = [];
    state.selectedGroupId = null;
    state.groupDetailCollectionId = null;
    state.cardFilterCollectionId = "";
    state.cardFilterGroupId = "";
    state.statsCollectionId = "";
    state.studyStep = "select";
  } else if (!collectionIds.has(Number(state.selectedCollectionId))) {
    state.selectedCollectionId = state.collections[0]?.id ?? null;
  }

  if (state.groupDetailCollectionId && !collectionIds.has(Number(state.groupDetailCollectionId))) {
    state.groupDetailCollectionId = null;
  }
  if (state.statsCollectionId && !collectionIds.has(Number(state.statsCollectionId))) {
    state.statsCollectionId = "";
  }
  if (!STATS_RANGE_LABELS[state.statsRangeMode]) {
    state.statsRangeMode = "all";
  }

  const selectedCollectionGroups = getGroupsForCollection(state.selectedCollectionId);
  const selectedCollectionGroupIds = new Set(selectedCollectionGroups.map((group) => Number(group.id)));
  state.selectedStudyGroupIds = state.selectedStudyGroupIds
    .map(Number)
    .filter((groupId) => selectedCollectionGroupIds.has(groupId));
  if (!state.selectedStudyGroupIds.length) {
    state.selectedStudyGroupIds = selectedCollectionGroups.filter((group) => getGroupStudyCardCount(group) > 0).map((group) => group.id);
  }

  const selectedGroup = groupById.get(Number(state.selectedGroupId));
  if (
    !selectedGroup ||
    (state.selectedCollectionId && Number(selectedGroup.collection_id) !== Number(state.selectedCollectionId))
  ) {
    state.selectedGroupId = selectedCollectionGroups[0]?.id ?? null;
  }

  if (state.cardFilterCollectionId === "all") {
    state.cardFilterCollectionId = "";
  }
  if (state.cardFilterCollectionId && !collectionIds.has(Number(state.cardFilterCollectionId))) {
    state.cardFilterCollectionId = "";
  }
  if (state.cardFilterGroupId && !groupById.has(Number(state.cardFilterGroupId))) {
    state.cardFilterGroupId = "";
  }
  const filteredGroup = groupById.get(Number(state.cardFilterGroupId));
  if (filteredGroup) {
    state.cardFilterCollectionId = String(filteredGroup.collection_id);
  }
  if (
    state.cardFilterCollectionId &&
    state.cardFilterGroupId &&
    !getGroupsForCollection(state.cardFilterCollectionId).some((group) => String(group.id) === String(state.cardFilterGroupId))
  ) {
    state.cardFilterGroupId = "";
  }

  if (state.editingCardId && !cardIds.has(Number(state.editingCardId))) {
    state.editingCardId = null;
    state.cardScreen = "list";
  }
  if (state.editingGroupId && !groupById.has(Number(state.editingGroupId))) {
    state.editingGroupId = null;
    state.groupScreen = "list";
  }
  if (state.editingCollectionId && !collectionIds.has(Number(state.editingCollectionId))) {
    state.editingCollectionId = null;
    state.groupScreen = "list";
  }
  if (state.bulkDraftGroupId && !groupById.has(Number(state.bulkDraftGroupId))) {
    state.bulkDraftGroupId = null;
    state.bulkPreview = null;
  }
  if (state.bulkPreview?.groupId && !groupById.has(Number(state.bulkPreview.groupId))) {
    state.bulkPreview = null;
  }
  if (state.weakCardOpenId && !cardIds.has(Number(state.weakCardOpenId))) {
    state.weakCardOpenId = null;
  }
  if (state.roundDetail?.id && !state.rounds.some((round) => Number(round.id) === Number(state.roundDetail.id))) {
    state.roundDetail = null;
  }
  if (state.studyStep === "collection" && !state.selectedCollectionId) {
    state.studyStep = "select";
  }
  if (state.studyStep === "ready" && !state.selectedGroupId) {
    state.studyStep = state.selectedCollectionId ? "collection" : "select";
  }
}

function resetDataScopedUiState() {
  Object.assign(state, {
    session: null,
    activeDialog: null,
    roundDetail: null,
    pendingTab: null,
    pendingAction: null,
    collectionStudyReturnContext: null,
    editingCardId: null,
    editingGroupId: null,
    editingCollectionId: null,
    cardScreen: "list",
    groupScreen: "list",
    groupDetailCollectionId: null,
    cardListLimit: CARD_LIST_PAGE_SIZE,
    groupListLimit: GROUP_LIST_PAGE_SIZE,
    bulkDraftText: "",
    bulkDraftGroupId: null,
    bulkPreview: null,
    weakPanelOpen: false,
    weakCardOpenId: null,
    completionCorrectOpen: false,
    statsCollectionListLimit: STATS_COLLECTION_LIST_PAGE_SIZE,
    scrollPositions: {},
  });
}

async function loadData() {
  const [collectionData, groupData, cardData, roundData, settingsData] = await Promise.all([
    request("/api/collections"),
    request("/api/groups"),
    request("/api/cards"),
    request("/api/rounds?limit=500"),
    request("/api/settings"),
  ]);
  state.collections = collectionData.collections;
  state.groups = groupData.groups;
  state.cards = cardData.cards;
  state.rounds = roundData.rounds;
  state.settings = normalizeSettings(settingsData.settings || {});
  applyStudyOptionSettings();
  reconcileLoadedState();
}

function handleLoadDataError(error) {
  if (error?.status === 401 || error?.code === "auth") {
    clearStoredUser();
    state.user = null;
    state.appStatus = "idle";
    state.appError = null;
    state.authPending = false;
    state.authError = "로그인 정보가 맞지 않습니다. 닉네임과 6자리 코드를 다시 확인하세요.";
    render();
    return;
  }
  state.appStatus = "error";
  state.appError = error;
  state.authPending = false;
  render();
}

async function retryLoadData() {
  if (!state.user) {
    render();
    return;
  }
  state.appStatus = "loading";
  state.appError = null;
  render();
  try {
    await loadData();
    state.appStatus = "ready";
    state.appError = null;
    render();
  } catch (error) {
    handleLoadDataError(error);
  }
}

function getHeaderContext() {
  if (state.appStatus === "loading") return "데이터 불러오는 중";
  if (state.appStatus === "error") return "연결 확인 필요";
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
  if (state.activeTab === "stats") return "통계 · 공식 회독";
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
      return collection ? `대그룹 · ${collection.name}` : "대그룹 관리";
    }
    return "대그룹 관리";
  }
  if (state.activeTab === "settings") return "설정";
  return TAB_LABELS[state.activeTab] || "꼬꼬회독";
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
  return customName || "목표";
}

function renderHeader() {
  const examInfo = getExamDateInfo();
  const ddayMarkup =
    state.user && (state.settings?.target_name || examInfo)
      ? `<strong class="dday-badge">${escapeHtml(getTargetLabel())}${
          examInfo ? ` ${escapeHtml(examInfo.label)}` : ""
        }</strong>`
      : "";
  if (headerContextEl) headerContextEl.textContent = getHeaderContext();
  if (headerGreetingEl) {
    headerGreetingEl.hidden = !state.user;
    headerGreetingEl.innerHTML = state.user
      ? `<span>${escapeHtml(state.user.nickname)}님, 오늘도 한 회독 가볍게 가볼까요?</span>${ddayMarkup}`
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
    <button class="ghost-button small-button" type="button" data-action="logout">${iconLabel("log-out", "로그아웃")}</button>
  `;
}

function setTab(tab) {
  state.activeTab = tab;
  views.auth.classList.remove("active");
  document.querySelectorAll(".nav-button").forEach((button) => {
    const active = button.dataset.tab === tab;
    const label = TAB_LABELS[button.dataset.tab] || button.textContent.trim();
    button.classList.toggle("active", active);
    button.setAttribute("aria-label", active ? `${label} 탭, 현재 화면` : `${label} 탭`);
    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
  Object.entries(views).forEach(([key, view]) => {
    if (key !== "auth") view.classList.toggle("active", key === tab);
  });
}

function normalizeSearchQuery(query) {
  const needle = String(query || "").trim().toLocaleLowerCase();
  return needle;
}

function matchesQuery(values, query) {
  const needle = normalizeSearchQuery(query);
  if (!needle) return true;
  return values.some((value) => String(value || "").toLocaleLowerCase().includes(needle));
}

function getCardSearchText(card) {
  if (!card || typeof card !== "object") return "";
  const cached = CARD_SEARCH_TEXT_CACHE.get(card);
  if (cached !== undefined) return cached;
  const text = [
    card.front,
    card.back,
    card.memo,
    card.group_name,
    card.collection_name,
    ...(card.examples || []).flatMap((example) => [example.japanese, example.korean]),
  ]
    .map((value) => String(value || ""))
    .join("\n")
    .toLocaleLowerCase();
  CARD_SEARCH_TEXT_CACHE.set(card, text);
  return text;
}

function shuffleItems(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function prepareStudyCards(cards, exampleOrderMode = state.exampleOrderMode) {
  const shouldShuffleExamples = exampleOrderMode === "random";
  return cards.map((card) => {
    const examples = Array.isArray(card.examples) ? card.examples.map((example) => ({ ...example })) : [];
    return {
      ...card,
      examples: shouldShuffleExamples ? shuffleItems(examples) : examples,
    };
  });
}

function cardMatchesQuery(card, needle) {
  return !needle || getCardSearchText(card).includes(needle);
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
  return `<span class="jp-text">${renderMarkedText(value)}</span>`;
}

function renderMarkedJapaneseText(value) {
  return renderJapaneseText(value);
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
    if (existing) item.warnings.push(`같은 소그룹에 이미 같은 앞면 카드가 있습니다: ${existing.front}`);
    const key = item.front.trim();
    if (key) {
      if (seen.has(key)) item.warnings.push(`대량 등록 안에 같은 앞면이 두 번 들어 있습니다: ${seen.get(key)}번째 줄`);
      else seen.set(key, item.lineNo);
    }
  });
  const warningCount = parsed.items.reduce((sum, item) => sum + item.warnings.length, 0);
  return { groupId, text, items: parsed.items, errors: parsed.errors, warningCount };
}

function renderSearchInput({ id, value, placeholder }) {
  return `
    <form class="search-field" data-search-target="${id}">
      <div class="search-input-wrap">
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
      <button class="secondary-button search-submit" type="submit">${iconLabel("search", "검색")}</button>
    </form>
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

function saveScrollPosition(key) {
  if (!key) return;
  state.scrollPositions[key] = window.scrollY || 0;
}

function restoreScrollPosition(key) {
  const position = Number(state.scrollPositions[key] || 0);
  window.requestAnimationFrame(() => {
    const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, Math.min(position, maxScrollTop));
  });
}

function getCurrentScrollKey() {
  if (!state.user || state.session) return "";
  if (state.activeTab === "groups") {
    if (state.groupScreen !== "list") return `groups:${state.groupScreen}`;
    return state.groupDetailCollectionId ? `groups:detail:${state.groupDetailCollectionId}` : "groups:collections";
  }
  if (state.activeTab === "cards") return state.cardScreen === "form" ? "cards:form" : "cards:list";
  if (state.activeTab === "stats") return `stats:${state.statsCollectionId || "all"}:${state.statsRangeMode}`;
  if (state.activeTab === "settings") return "settings";
  if (state.activeTab === "study") {
    if (state.studyStep === "collection") return `study:collection:${state.selectedCollectionId || "none"}`;
    if (state.studyStep === "ready") return `study:ready:${state.selectedGroupId || "none"}`;
    return "study:collections";
  }
  return state.activeTab || "";
}

function saveCurrentScrollPosition() {
  saveScrollPosition(getCurrentScrollKey());
}

function restoreCurrentScrollPosition() {
  restoreScrollPosition(getCurrentScrollKey());
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: getMotionSafeScrollBehavior() });
}

function getMotionSafeScrollBehavior() {
  return reducedMotionQuery?.matches ? "auto" : "smooth";
}

function scrollIntoViewSafely(element, options = {}) {
  if (!(element instanceof Element)) return;
  element.scrollIntoView({ ...options, behavior: getMotionSafeScrollBehavior() });
}

function getAppRoute() {
  if (!state.user) return { tab: "auth", view: "login" };
  if (state.appStatus === "loading" || state.appStatus === "error") {
    return { tab: "study", view: state.appStatus };
  }
  if (state.activeTab === "groups") {
    if (state.groupScreen !== "list") return { tab: "groups", view: state.groupScreen };
    if (state.groupDetailCollectionId) {
      return { tab: "groups", view: "detail", collectionId: Number(state.groupDetailCollectionId) };
    }
    return { tab: "groups", view: "list" };
  }
  if (state.activeTab === "cards") {
    return { tab: "cards", view: state.cardScreen === "form" ? "form" : "list" };
  }
  if (state.activeTab === "study") {
    if (state.session?.savedRound) return { tab: "study", view: "completion", mode: state.session.studyMode };
    if (state.session) return { tab: "study", view: "session", mode: state.session.studyMode };
    return {
      tab: "study",
      view: state.studyStep || "select",
      collectionId: state.selectedCollectionId ? Number(state.selectedCollectionId) : null,
      groupId: state.selectedGroupId ? Number(state.selectedGroupId) : null,
    };
  }
  return { tab: state.activeTab || "study", view: "main" };
}

function getAppRouteKey(route = getAppRoute()) {
  return JSON.stringify(route || {});
}

function writeCurrentHistoryRoute(mode = "push") {
  if (!window.history?.pushState || !window.history?.replaceState) return;
  const route = getAppRoute();
  const key = getAppRouteKey(route);
  if (!historyInitialized || mode === "replace") {
    window.history.replaceState({ appRoute: route }, "", window.location.href);
    historyInitialized = true;
    lastHistoryRouteKey = key;
    return;
  }
  if (isApplyingHistoryRoute || key === lastHistoryRouteKey) return;
  window.history.pushState({ appRoute: route }, "", window.location.href);
  lastHistoryRouteKey = key;
}

function applyHistoryRoute(route) {
  if (!route?.tab || route.tab === "auth") return;
  closeHelpDisclosures();
  state.activeDialog = null;
  state.pendingTab = null;
  state.pendingAction = null;
  state.pendingHistoryRoute = null;
  state.collectionStudyReturnContext = null;
  state.roundDetail = null;
  state.editingCardId = null;
  state.editingGroupId = null;
  state.editingCollectionId = null;
  if (state.session?.savedRound && route.view !== "completion") {
    state.session = null;
    state.completionCorrectOpen = false;
  }
  if (route.tab === "groups") {
    state.activeTab = "groups";
    state.groupScreen = route.view === "collection-form" || route.view === "group-form" ? route.view : "list";
    state.groupDetailCollectionId = route.view === "detail" ? Number(route.collectionId) || null : null;
    return;
  }
  if (route.tab === "cards") {
    state.activeTab = "cards";
    state.cardScreen = route.view === "form" ? "form" : "list";
    return;
  }
  if (route.tab === "settings" || route.tab === "stats") {
    state.activeTab = route.tab;
    return;
  }
  state.activeTab = "study";
  if (!state.session || route.view !== "session") {
    if (state.session?.savedRound && route.view === "completion") return;
    state.session = null;
    state.studyStep = ["select", "collection", "ready"].includes(route.view) ? route.view : "select";
    state.selectedCollectionId = route.collectionId || null;
    state.selectedGroupId = route.groupId || null;
  }
}

function completeHistoryNavigation(route) {
  isApplyingHistoryRoute = true;
  applyHistoryRoute(route);
  render();
  isApplyingHistoryRoute = false;
  writeCurrentHistoryRoute("replace");
  restoreCurrentScrollPosition();
}

function handleHistoryPop(event) {
  const route = event.state?.appRoute;
  if (!route) return;
  if (state.session && !state.session.savedRound) {
    state.pendingHistoryRoute = route;
    state.activeDialog = "history-leave";
    window.history.pushState({ appRoute: getAppRoute() }, "", window.location.href);
    lastHistoryRouteKey = getAppRouteKey();
    renderDialog();
    return;
  }
  completeHistoryNavigation(route);
}

function isDraftScreenActive() {
  if (isTypingTarget(document.activeElement)) return true;
  if (state.activeTab === "settings") return true;
  if (state.activeTab === "cards" && state.cardScreen === "form") return true;
  if (state.activeTab === "groups" && state.groupScreen !== "list") return true;
  return false;
}

function canRefreshDataOnResume() {
  if (!state.user || state.appStatus !== "ready") return false;
  if (state.pendingRequest || state.authPending || resumeRefreshPending) return false;
  if (state.activeDialog) return false;
  if (state.session && !state.session.savedRound) return false;
  if (isDraftScreenActive()) return false;
  return true;
}

async function refreshDataOnResume({ force = false } = {}) {
  const elapsedHiddenMs = lastHiddenAtMs ? Date.now() - lastHiddenAtMs : 0;
  if (!force && elapsedHiddenMs < RESUME_REFRESH_AFTER_MS) return;
  if (!canRefreshDataOnResume()) return;
  resumeRefreshPending = true;
  saveCurrentScrollPosition();
  try {
    await loadData();
    render();
    restoreCurrentScrollPosition();
  } catch (error) {
    if (error?.status === 401 || error?.code === "auth") {
      handleLoadDataError(error);
    } else {
      showRequestError(error, "최신 데이터를 확인하지 못했습니다. 다시 시도해 주세요.");
    }
  } finally {
    resumeRefreshPending = false;
    lastHiddenAtMs = 0;
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    lastHiddenAtMs = Date.now();
    return;
  }
  if (document.visibilityState === "visible") {
    refreshDataOnResume();
  }
}

function handlePageShow(event) {
  refreshDataOnResume({ force: Boolean(event.persisted) });
}

function resetCardListLimit() {
  state.cardListLimit = CARD_LIST_PAGE_SIZE;
  state.cardPage = 0;
}

function resetGroupListLimit() {
  state.groupListLimit = GROUP_LIST_PAGE_SIZE;
}

function resetStatsCollectionListLimit() {
  state.statsCollectionListLimit = STATS_COLLECTION_LIST_PAGE_SIZE;
}

function applySearchInput(target) {
  const input = document.getElementById(target);
  const query = input instanceof HTMLInputElement ? input.value : "";
  if (target === "card-search") {
    state.cardSearchQuery = query;
    resetCardListLimit();
    renderCards();
    focusAfterRender("#card-search");
  }
  if (target === "study-collection-search") {
    state.studyCollectionSearchQuery = query;
    state.studyCollectionPage = 0;
    renderStudy();
    focusAfterRender("#study-collection-search");
  }
  if (target === "study-group-search") {
    state.studyGroupSearchQuery = query;
    state.studyGroupPage = 0;
    renderStudy();
    focusAfterRender("#study-group-search");
  }
  if (target === "collection-search") {
    state.collectionSearchQuery = query;
    renderGroups();
    focusAfterRender("#collection-search");
  }
  if (target === "group-search") {
    state.groupSearchQuery = query;
    resetGroupListLimit();
    renderGroups();
    focusAfterRender("#group-search");
  }
}

function renderOrientationNote(parts, note, { exposeNote = false } = {}) {
  return `
    <div class="orientation-note ${exposeNote ? "has-visible-note" : ""}">
      <span>${parts.map((part) => escapeHtml(part)).join(" / ")}</span>
      ${note ? (exposeNote ? `<p>${escapeHtml(note)}</p>` : renderHelpDisclosure("화면 안내", note)) : ""}
    </div>
  `;
}

function renderKokkoMascot(type = "study", className = "kokko-mascot", loading = "lazy") {
  const mascot = KOKKO_MASCOTS[type] || KOKKO_MASCOTS.study;
  return `<img class="${className}" src="${mascot.src}" alt="${escapeHtml(mascot.label)}" loading="${loading}" />`;
}

function renderActionEmptyState({ title, body, action, label, iconName = "plus", buttonClass = "primary-button", attrs = "", mascot = "empty" }) {
  return `
    <div class="empty-state action-empty">
      ${mascot ? renderKokkoMascot(mascot, "empty-state-mascot") : ""}
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(body)}</p>
      ${
        action && label
          ? `<button class="${buttonClass} full" type="button" data-action="${action}" ${attrs}>${iconLabel(
              iconName,
              label,
            )}</button>`
          : ""
      }
    </div>
  `;
}

function renderDisabledReason(message) {
  return `<p id="${getDisabledReasonId(message)}" class="disabled-reason" role="note">${escapeHtml(message)}</p>`;
}

function getDisabledReasonId(message) {
  return getStableElementId("disabled-reason", message);
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

function isCardStudyExcluded(card) {
  return Boolean(number(card?.study_excluded));
}

function getGroupStudyCardCount(group) {
  return number(group?.study_card_count ?? group?.card_count);
}

function getGroupExcludedCardCount(group) {
  return number(group?.excluded_card_count);
}

function getCollectionStudyCardCount(collection) {
  return number(collection?.study_card_count ?? collection?.card_count);
}

function getCollectionExcludedCardCount(collection) {
  return number(collection?.excluded_card_count);
}

function studyCountText(totalCount, studyCount, excludedCount) {
  if (excludedCount) return `학습 대상 ${studyCount}개 · 제외 ${excludedCount}개`;
  return `카드 ${totalCount}개`;
}

function cardScopeText(totalCount, studyCount, excludedCount) {
  if (excludedCount) return `전체 ${totalCount}개 · 학습 대상 ${studyCount}개 · 제외 ${excludedCount}개`;
  return `전체 카드 ${totalCount}개`;
}

function getSelectedStudyCardCount() {
  return getSelectedStudyGroups().reduce((sum, group) => sum + getGroupStudyCardCount(group), 0);
}

function getPracticeSelectableGroups(collectionId = state.selectedCollectionId) {
  return getGroupsForCollection(collectionId).filter((group) => getGroupStudyCardCount(group) > 0);
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

function hasSameSelectedIds(selectedIds, ids) {
  const normalizedIds = ids.map(Number);
  return normalizedIds.length === selectedIds.size && normalizedIds.every((id) => selectedIds.has(id));
}

function renderPracticePresetButton(preset, label, selectedIds) {
  const presetGroupIds = getPracticePresetGroups(preset).map((group) => group.id);
  const disabled = !presetGroupIds.length;
  const active = Boolean(!disabled && hasSameSelectedIds(selectedIds, presetGroupIds));
  return `<button class="ghost-button preset-button ${active ? "active" : ""}" type="button" data-action="select-practice-preset" data-preset="${preset}" aria-pressed="${active}" ${
    disabled ? "disabled" : ""
  }>${escapeHtml(
    label,
  )}</button>`;
}

function getCollectionStudyReturnContext(collectionId = state.selectedCollectionId) {
  return {
    tab: state.activeTab,
    collectionId: Number(collectionId) || null,
    groupDetailCollectionId: Number(state.groupDetailCollectionId) || null,
    groupScreen: state.groupScreen,
    studyStep: state.studyStep,
  };
}

function roundIncludesGroup(round, groupId) {
  if (Number(round?.group_id) === Number(groupId)) return true;
  return String(round?.selected_group_ids || "")
    .split(",")
    .map((value) => Number(value))
    .includes(Number(groupId));
}

function getCardFilterGroups() {
  if (!state.cardFilterCollectionId) return [];
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

function getCardPath(card) {
  return [card.collection_name || "대그룹 없음", card.group_name || "소그룹 없음"].filter(Boolean).join(" / ");
}

function getSelectedCardFilterCopy(filteredCount, visibleCount) {
  if (!state.collections.length) {
    return {
      label: "대그룹 없음",
      detail: "카드를 등록하려면 먼저 대그룹과 소그룹이 필요합니다.",
    };
  }
  const collection = state.collections.find(
    (item) => String(item.id) === String(state.cardFilterCollectionId),
  );
  if (!collection) {
    return {
      label: "대그룹 선택",
      detail: "대그룹을 고르면 소그룹 필터와 카드 목록이 이어집니다.",
    };
  }
  const group = getCardFilterGroups().find((item) => String(item.id) === String(state.cardFilterGroupId));
  if (group) {
    return {
      label: group.name,
      detail: `${collection.name} / ${group.name} · ${number(visibleCount)}/${number(filteredCount)}개 표시`,
    };
  }
  return {
    label: collection.name,
    detail: `소그룹 ${number(getGroupsForCollection(collection.id).length)}개 전체 · ${number(visibleCount)}/${number(
      filteredCount,
    )}개 표시`,
  };
}

function renderCardFilterSummary(filteredCount, visibleCount) {
  const copy = getSelectedCardFilterCopy(filteredCount, visibleCount);
  return `
    <section class="card-filter-summary">
      <span>현재 범위</span>
      <strong>${escapeHtml(copy.label)}</strong>
      <p>${escapeHtml(copy.detail)}</p>
    </section>
  `;
}

function renderCardListEmptyState(filteredCards) {
  if (!state.collections.length) {
    return renderActionEmptyState({
      title: "첫 대그룹을 만들어 주세요.",
      body: "대그룹 아래에 소그룹을 만들고, 카드는 소그룹에 저장합니다.",
      action: "go-groups",
      label: "대그룹 만들기",
    });
  }
  if (!state.groups.length) {
    return renderActionEmptyState({
      title: "소그룹을 먼저 만들어 주세요.",
      body: "카드는 소그룹에 저장되고 공식 회독과 통계도 소그룹 기준으로 남습니다.",
      action: "open-group-form-for-collection",
      label: "소그룹 만들기",
      attrs: `data-collection-id="${state.selectedCollectionId || state.collections[0]?.id || ""}"`,
    });
  }
  if (filteredCards.length && state.cardSearchQuery) {
    return renderActionEmptyState({
      title: "검색된 카드가 없습니다.",
      body: "앞면, 뜻, 메모, 예문을 함께 검색합니다. 검색어를 지우면 현재 범위의 카드가 다시 보입니다.",
      action: "clear-search",
      label: "검색어 지우기",
      iconName: "x",
      buttonClass: "secondary-button",
      attrs: `data-target="card-search"`,
    });
  }
  if (!state.cardFilterCollectionId) {
    return renderActionEmptyState({
      title: "대그룹을 선택해 주세요.",
      body: "카드 목록을 보려면 위의 대그룹 선택 박스에서 먼저 볼 범위를 고르세요.",
    });
  }
  if (!getCardFilterGroups().length) {
    return renderActionEmptyState({
      title: "선택한 대그룹에 소그룹이 없습니다.",
      body: "카드를 등록하려면 먼저 이 대그룹 안에 소그룹을 만들어야 합니다.",
      action: "open-group-form-for-collection",
      label: "소그룹 만들기",
      attrs: `data-collection-id="${state.cardFilterCollectionId}"`,
    });
  }
  const target = state.cardFilterGroupId ? "소그룹" : "대그룹";
  return renderActionEmptyState({
    title: `이 ${target}에는 아직 카드가 없습니다.`,
    body: "첫 카드를 등록하면 학습 탭에서 바로 회독을 시작할 수 있습니다.",
    action: "open-card-form",
    label: "카드 등록",
  });
}

function renderCardLocationPicker(selection, ids) {
  const selectedCollection = state.collections.find((collection) => Number(collection.id) === Number(selection.collectionId));
  const selectedGroup = selection.groups.find((group) => Number(group.id) === Number(selection.groupId));
  const summary = selectedGroup
    ? `${selectedCollection?.name || "대그룹 없음"} / ${selectedGroup.name}`
    : selectedCollection
      ? `${selectedCollection.name} / 소그룹 필요`
      : "대그룹과 소그룹을 선택하세요.";
  const groupDisabledReason = "선택한 대그룹에 소그룹이 없어 저장 위치를 고를 수 없습니다.";
  return `
    <section class="card-location-panel">
      <div>
        <span>저장 위치</span>
        <strong>${escapeHtml(summary)}</strong>
        <p>대그룹을 바꾸면 선택 가능한 소그룹도 함께 바뀝니다.</p>
      </div>
      <div class="card-filter-grid card-location-grid">
        <label class="field"><span>대그룹</span><select id="${ids.collection}" class="select" name="collection_id" required>${collectionOptions(
          selection.collectionId,
        )}</select></label>
        <label class="field"><span>소그룹</span><select id="${ids.group}" class="select" name="group_id" required ${
          selection.groups.length ? "" : `disabled aria-describedby="${getDisabledReasonId(groupDisabledReason)}"`
        }>${subgroupOptions(selection.groups, selection.groupId)}</select></label>
      </div>
      ${selection.groups.length ? "" : renderDisabledReason(groupDisabledReason)}
    </section>
  `;
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

function getGroupRecentFirstAttemptRate(group) {
  const total = number(group.latest_first_attempt_total);
  if (!total) return null;
  const correct = number(group.latest_first_attempt_correct_count);
  return Math.round((correct / total) * 100);
}

function getRoundAnswerRate(round) {
  return getRate(round.correct_count, number(round.correct_count) + number(round.wrong_count));
}

function getAccuracyTone(rate) {
  if (rate === null) return "";
  if (rate >= 80) return "good";
  if (rate >= 50) return "warn";
  return "bad";
}

function getAccuracyStatusTone(rate) {
  if (rate === null) return "muted";
  if (rate >= 80) return "done";
  if (rate >= 50) return "review";
  return "bad";
}

function getGroupLastStudyLabel(group) {
  return group.last_studied_at ? `마지막 ${formatDate(group.last_studied_at)}` : "학습 기록 없음";
}

function renderGroupStatusPills(group, { showRounds = false, showAccuracy = false } = {}) {
  const cardCount = number(group.card_count);
  const studyCount = getGroupStudyCardCount(group);
  const excludedCount = getGroupExcludedCardCount(group);
  const wrongTotal = number(group.wrong_total);
  const roundCount = number(group.completed_rounds);
  const studiedToday = isToday(group.last_studied_at);
  const accuracyRate = getGroupRecentFirstAttemptRate(group);
  const status = studyCount
    ? studiedToday
      ? `<span class="status-pill done">오늘 완료</span>`
      : group.last_studied_at
        ? `<span class="status-pill">학습 기록 있음</span>`
        : `<span class="status-pill muted">미학습</span>`
    : cardCount
      ? `<span class="status-pill muted">전체 학습 제외</span>`
      : `<span class="status-pill muted">카드 없음</span>`;
  const wrong = wrongTotal
    ? `<span class="status-pill bad">오답 ${wrongTotal}</span>`
    : `<span class="status-pill muted">오답 없음</span>`;
  const excluded = excludedCount ? `<span class="status-pill muted">제외 ${excludedCount}</span>` : "";
  const rounds = showRounds ? `<span class="status-pill muted">${roundCount}회독</span>` : "";
  const accuracy = showAccuracy
    ? `<span class="status-pill ${getAccuracyStatusTone(accuracyRate)}">최근 정답률 ${
        accuracyRate === null ? "없음" : `${accuracyRate}%`
      }</span>`
    : "";
  return `<div class="group-status-strip">${status}${accuracy}${wrong}${excluded}${rounds}</div>`;
}

function renderGroupMetricRow(group) {
  const rate = getGroupRecentFirstAttemptRate(group);
  const accuracyTone = getAccuracyTone(rate);
  return `
    <div class="subgroup-metrics" aria-label="소그룹 학습 지표">
      <div class="subgroup-metric"><strong>${number(group.card_count)}</strong><span>전체 카드</span></div>
      <div class="subgroup-metric"><strong>${number(group.completed_rounds)}</strong><span>회독</span></div>
      <div class="subgroup-metric accuracy ${accuracyTone}"><strong>${rate === null ? "-" : `${rate}%`}</strong><span>최근 첫 시도</span></div>
    </div>
  `;
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
        getGroupStudyCardCount(right) - getGroupStudyCardCount(left) ||
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

function getRecentStudyGroup(groups = state.groups) {
  return (
    [...groups]
      .filter((group) => dateMs(group.last_studied_at) > 0)
      .filter((group) => getGroupStudyCardCount(group) > 0)
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

function getWeakCards(cards = state.cards) {
  return [...cards]
    .filter((card) => !isCardStudyExcluded(card) && isWeakCard(card))
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

function clampPercent(value) {
  return Math.min(100, Math.max(0, number(value)));
}

function getRate(correct, total) {
  const base = number(total);
  if (!base) return null;
  return Math.round((number(correct) / base) * 100);
}

function rateText(rate) {
  return rate === null ? "-" : `${rate}%`;
}

function getStatsRangeStart(mode = state.statsRangeMode) {
  if (mode === "all") return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysByMode = {
    days7: 7,
    days30: 30,
    days60: 60,
    days90: 90,
  };
  const days = daysByMode[mode];
  if (days) start.setDate(start.getDate() - (days - 1));
  return start.getTime();
}

function getStatsRangeCopy(mode = state.statsRangeMode) {
  if (mode === "all") return { label: "전체", detail: "누적 기록 기준" };
  if (mode === "today") return { label: "오늘", detail: "오늘 완료한 회독 기준" };
  const label = STATS_RANGE_LABELS[mode] || STATS_RANGE_LABELS.days30;
  return { label: `최근 ${label}`, detail: `최근 ${label} 완료한 회독 기준` };
}

function getRoundGroupIds(round) {
  return String(round.selected_group_ids || round.group_id || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter(Boolean);
}

function roundMatchesCollection(round, collectionId, groupIds = null) {
  if (!collectionId) return true;
  if (Number(round.collection_id) === Number(collectionId)) return true;
  const scopedGroupIds = groupIds || new Set(getGroupsForCollection(collectionId).map((group) => Number(group.id)));
  return getRoundGroupIds(round).some((groupId) => scopedGroupIds.has(Number(groupId)));
}

function roundMatchesRange(round, rangeStart = getStatsRangeStart()) {
  if (!rangeStart) return true;
  return dateMs(round.completed_at) >= rangeStart;
}

function getStatsScope() {
  const collectionId = state.statsCollectionId ? Number(state.statsCollectionId) : null;
  const collection = collectionId
    ? state.collections.find((item) => Number(item.id) === collectionId) || null
    : null;
  const collections = collection ? [collection] : state.collections;
  const groups = collectionId ? getGroupsForCollection(collectionId) : state.groups;
  const groupIds = new Set(groups.map((group) => Number(group.id)));
  const cards = state.cards.filter((card) =>
    groupIds.size ? groupIds.has(Number(card.group_id)) : !collectionId || Number(card.collection_id) === collectionId,
  );
  const rangeStart = getStatsRangeStart();
  const rounds = state.rounds.filter(
    (round) => roundMatchesCollection(round, collectionId, groupIds) && roundMatchesRange(round, rangeStart),
  );
  return {
    collection,
    collectionId,
    collections,
    groups,
    groupIds,
    cards,
    rounds,
    rangeMode: state.statsRangeMode,
    rangeStart,
    rangeCopy: getStatsRangeCopy(),
    isAllTime: state.statsRangeMode === "all",
  };
}

function getRoundScopedGroupIds(round, groupIds) {
  const ids = getRoundGroupIds(round).filter((groupId) => groupIds.has(Number(groupId)));
  return ids.length ? ids : round.group_id && groupIds.has(Number(round.group_id)) ? [Number(round.group_id)] : [];
}

function getStatsSummary() {
  const scope = getStatsScope();
  const totalCards = scope.cards.length;
  const totalStudyCards = scope.groups.reduce((sum, group) => sum + getGroupStudyCardCount(group), 0);
  const totalExcludedCards = scope.groups.reduce((sum, group) => sum + getGroupExcludedCardCount(group), 0);
  const learnedCards = scope.isAllTime
    ? scope.cards.filter((card) => cardAttemptCount(card) > 0).length
    : scope.rounds.reduce((sum, round) => sum + number(round.total_cards), 0);
  const totalGroups = scope.groups.length;
  const periodStudiedGroupIds = new Set();
  scope.rounds.forEach((round) => getRoundScopedGroupIds(round, scope.groupIds).forEach((groupId) => periodStudiedGroupIds.add(groupId)));
  const studiedGroups = scope.isAllTime
    ? scope.groups.filter((group) => number(group.completed_rounds) > 0).length
    : periodStudiedGroupIds.size;
  const studyReadyGroups = scope.groups.filter((group) => getGroupStudyCardCount(group) > 0);
  const todayGroups = studyReadyGroups.filter((group) => isToday(group.last_studied_at));
  const pendingTodayGroups = studyReadyGroups.filter((group) => !isToday(group.last_studied_at));
  const totalCorrect = scope.isAllTime
    ? scope.cards.reduce((sum, card) => sum + number(card.correct_count), 0)
    : scope.rounds.reduce((sum, round) => sum + number(round.correct_count), 0);
  const totalWrong = scope.isAllTime
    ? scope.cards.reduce((sum, card) => sum + number(card.wrong_count), 0)
    : scope.rounds.reduce((sum, round) => sum + number(round.wrong_count), 0);
  const latestFirstAttempt = scope.isAllTime
    ? scope.groups.reduce(
    (acc, group) => {
      acc.correct += number(group.latest_first_attempt_correct_count);
      acc.total += number(group.latest_first_attempt_total);
      return acc;
    },
    { correct: 0, total: 0 },
      )
    : scope.rounds.reduce(
        (acc, round) => {
          acc.correct += number(round.first_attempt_correct_count);
          acc.total += number(round.first_attempt_total || round.total_cards);
          return acc;
        },
        { correct: 0, total: 0 },
      );
  const weakCards = getWeakCards(scope.cards);
  const recentGroup = getRecentStudyGroup(scope.groups);
  const recommendedGroup =
    sortStudyGroups(pendingTodayGroups)[0] || (recentGroup && getGroupStudyCardCount(recentGroup) > 0 ? recentGroup : null);
  return {
    scope,
    totalCards,
    totalStudyCards,
    totalExcludedCards,
    learnedCards,
    totalGroups,
    studiedGroups,
    studyReadyGroups,
    todayGroups,
    pendingTodayGroups,
    totalCorrect,
    totalWrong,
    totalAttempts: totalCorrect + totalWrong,
    totalSubgroupRounds: scope.isAllTime
      ? scope.groups.reduce((sum, group) => sum + number(group.completed_rounds), 0)
      : scope.rounds.length,
    latestFirstAttemptRate: getRate(latestFirstAttempt.correct, latestFirstAttempt.total),
    answerRate: getRate(totalCorrect, totalCorrect + totalWrong),
    weakCards,
    recentGroup,
    recommendedGroup,
  };
}

function renderStats() {
  const summary = getStatsSummary();
  if (!state.collections.length && !state.groups.length && !state.cards.length) {
    views.stats.innerHTML = `
      <div class="panel stack">
        <div>
          <p class="eyebrow">통계</p>
          <h2 id="stats-title">학습 통계</h2>
        </div>
        ${renderOrientationNote(["통계", "공식 회독"], "소그룹 단위 회독이 쌓이면 통계가 채워집니다.")}
        ${renderActionEmptyState({
          title: "아직 통계를 만들 데이터가 없습니다.",
          body: "대그룹과 소그룹을 만들고 카드를 넣은 뒤 회독을 시작하면 여기에 흐름이 쌓입니다.",
          action: "go-groups",
          label: "대그룹 만들기",
          iconName: "folder",
          buttonClass: "primary-button",
        })}
      </div>
    `;
    return;
  }
  views.stats.innerHTML = `
    <div class="stats-page stack">
      <section class="panel stack stats-today-panel">
        <div class="row">
          <div>
            <p class="eyebrow">통계</p>
            <h2 id="stats-title">오늘의 상태</h2>
          </div>
          <span class="pill">${escapeHtml(summary.scope.rangeCopy.label)}</span>
        </div>
        ${renderStatsFilters(summary.scope)}
        ${renderStatsTodayPanel(summary)}
      </section>
      ${renderStatsOverviewSection(summary)}
      ${renderStatsCollectionSection(summary.scope)}
      ${renderStatsFocusSection(summary)}
      ${renderStatsRecentRoundSection(summary.scope)}
    </div>
  `;
}

function renderStatsFilters(scope) {
  return `
    <section class="stats-filter-panel" aria-label="통계 필터">
      <div class="segmented stats-range-options" role="group" aria-label="통계 기간">
        ${Object.entries(STATS_RANGE_LABELS)
          .map(
            ([mode, label]) => `
              <button class="segment ${state.statsRangeMode === mode ? "active" : ""}" type="button" data-action="set-stats-range" data-range="${mode}" aria-pressed="${
                state.statsRangeMode === mode ? "true" : "false"
              }">
                ${label}
              </button>
            `,
          )
          .join("")}
      </div>
      <select id="stats-collection-filter" class="select" aria-label="통계 대그룹 필터">
        <option value="" ${state.statsCollectionId ? "" : "selected"}>전체 대그룹</option>
        ${state.collections
          .map(
            (collection) =>
              `<option value="${collection.id}" ${String(state.statsCollectionId) === String(collection.id) ? "selected" : ""}>${escapeHtml(
                collection.name,
              )}</option>`,
          )
          .join("")}
      </select>
      <p>${escapeHtml(scope.rangeCopy.detail)} · ${escapeHtml(scope.collection?.name || "전체 대그룹")}</p>
    </section>
  `;
}

function renderStatsTodayPanel(summary) {
  const readyCount = summary.studyReadyGroups.length;
  const todayCount = summary.todayGroups.length;
  const pendingCount = summary.pendingTodayGroups.length;
  let action = {
    tone: "quiet",
    eyebrow: "추천",
    title: "첫 학습 단위를 준비하세요.",
    detail: "학습 대상 카드가 있는 소그룹이 생기면 오늘의 학습 상태를 더 정확히 보여줍니다.",
    buttonLabel: "묶음 탭으로",
    icon: "folder",
    action: "go-groups",
    attrs: "",
  };
  if (summary.weakCards.length) {
    action = {
      tone: "danger",
      eyebrow: "추천",
      title: `약점 카드 ${number(summary.weakCards.length)}개를 먼저 확인해요.`,
      detail: "설정한 오답 기준에 걸린 카드가 있어 복습 우선순위가 높습니다.",
      buttonLabel: "복습 시작",
      icon: "target",
      action: "start-weak-study",
      attrs: "",
    };
  } else if (pendingCount && summary.recommendedGroup) {
    action = {
      tone: "primary",
      eyebrow: "추천",
      title: `${number(pendingCount)}개 소그룹이 오늘 아직 남았어요.`,
      detail: `${summary.recommendedGroup.name}부터 이어가면 좋습니다.`,
      buttonLabel: "바로 학습",
      icon: "play",
      action: "study-stats-group",
      attrs: `data-group-id="${summary.recommendedGroup.id}"`,
    };
  } else if (readyCount && summary.recentGroup) {
    action = {
      tone: "good",
      eyebrow: "완료",
      title: "오늘 학습 흐름이 깔끔합니다.",
      detail: `${summary.recentGroup.name}을 한 번 더 돌리거나 다른 소그룹을 추가해도 좋습니다.`,
      buttonLabel: "한 번 더 회독",
      icon: "repeat-2",
      action: "study-stats-group",
      attrs: `data-group-id="${summary.recentGroup.id}"`,
    };
  }
  const todayRate = getRate(todayCount, readyCount);
  return `
    <section class="stats-recommend-card ${action.tone}">
      <div>
        <span>${escapeHtml(action.eyebrow)}</span>
        <strong>${escapeHtml(action.title)}</strong>
        <p>${escapeHtml(action.detail)}</p>
      </div>
      <button class="${action.tone === "danger" ? "secondary-button" : "primary-button"} full" type="button" data-action="${
        action.action
      }" ${action.attrs}>${iconLabel(action.icon, action.buttonLabel)}</button>
    </section>
    <div class="stats-status-grid">
      ${renderStatsStatusItem("오늘 완료", `${number(todayCount)}/${number(readyCount)}`, "학습 대상이 있는 소그룹", todayRate)}
      ${renderStatsStatusItem("남은 소그룹", `${number(pendingCount)}개`, "오늘 아직 회독 전", getRate(readyCount - pendingCount, readyCount))}
      ${renderStatsStatusItem("약점 카드", `${number(summary.weakCards.length)}개`, "오답 기준에 걸림", summary.weakCards.length ? 100 : 0, summary.weakCards.length ? "danger" : "good")}
    </div>
  `;
}

function renderStatsStatusItem(label, value, detail, rate, tone = "") {
  return `
    <article class="stats-status-item ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
      ${renderStatsProgress(rate)}
    </article>
  `;
}

function renderStatsOverviewSection(summary) {
  const learnedRate = getRate(summary.learnedCards, summary.totalCards);
  const studiedGroupRate = getRate(summary.studiedGroups, summary.totalGroups);
  const latestName = summary.recentGroup ? summary.recentGroup.name : "기록 없음";
  const latestDetail = summary.recentGroup
    ? `${formatDate(summary.recentGroup.last_studied_at)} · ${number(summary.recentGroup.completed_rounds)}회독`
    : "첫 회독을 완료하면 최근 학습 소그룹이 표시됩니다.";
  const cardMetricValue = summary.scope.isAllTime
    ? `${number(summary.learnedCards)}/${number(summary.totalCards)}`
    : `${number(summary.learnedCards)}장`;
  const cardMetricDetail = summary.scope.isAllTime
    ? cardScopeText(summary.totalCards, summary.totalStudyCards, summary.totalExcludedCards)
    : `${summary.scope.rangeCopy.label} 회독에 나온 학습 대상 카드`;
  return `
    <section class="panel stack stats-overview-panel">
      <div class="completion-header">
        <h3>${summary.scope.isAllTime ? "전체 흐름" : `${summary.scope.rangeCopy.label} 흐름`}</h3>
        <span class="pill">회독 ${number(summary.totalSubgroupRounds)}회</span>
      </div>
      <div class="stats-overview">
        ${renderStatsMetricCard("카드 풀이", cardMetricValue, cardMetricDetail, summary.scope.isAllTime ? learnedRate : null)}
        ${renderStatsMetricCard("소그룹 진행", `${number(summary.studiedGroups)}/${number(summary.totalGroups)}`, "회독 기록이 있는 소그룹", studiedGroupRate)}
        ${renderStatsMetricCard(
          "첫 시도 정답률",
          rateText(summary.latestFirstAttemptRate),
          summary.scope.isAllTime ? "각 소그룹의 최근 회독 기준" : `${summary.scope.rangeCopy.label} 회독 기준`,
          summary.latestFirstAttemptRate,
        )}
        ${renderStatsMetricCard(
          summary.scope.isAllTime ? "전체 풀이 정답률" : "기간 풀이 정답률",
          rateText(summary.answerRate),
          `재풀이 포함 ${number(summary.totalAttempts)}회`,
          summary.answerRate,
        )}
      </div>
      <section class="stats-insight-strip">
        <div>
          <span>최근 학습</span>
          <strong>${escapeHtml(latestName)}</strong>
          <p>${escapeHtml(latestDetail)}</p>
        </div>
        <div>
          <span>통계 기준</span>
          <strong>소그룹 공식 회독</strong>
          <p>묶음 연습은 합산하지 않습니다.</p>
        </div>
      </section>
    </section>
  `;
}

function renderStatsMetricCard(label, value, detail, rate = null) {
  return `
    <article class="stats-metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
      ${renderStatsProgress(rate)}
    </article>
  `;
}

function renderStatsProgress(rate, label = "") {
  if (rate === null || rate === undefined) return `<div class="stats-progress empty" aria-hidden="true"><span></span></div>`;
  const width = clampPercent(rate);
  return `
    <div class="stats-progress" role="img" aria-label="${escapeHtml(label || `${width}%`)}">
      <span style="width: ${width}%"></span>
    </div>
  `;
}

function getCollectionStats(collection, scope = getStatsScope()) {
  const groups = getGroupsForCollection(collection.id);
  const studiedGroups = groups.filter((group) => number(group.completed_rounds) > 0).length;
  const collectionGroupIds = new Set(groups.map((group) => Number(group.id)));
  const rounds = scope.rounds.filter((round) => roundMatchesCollection(round, collection.id, collectionGroupIds));
  const totalAttempts = scope.isAllTime
    ? number(collection.correct_total) + number(collection.wrong_total)
    : rounds.reduce((sum, round) => sum + number(round.correct_count) + number(round.wrong_count), 0);
  const correctTotal = scope.isAllTime
    ? number(collection.correct_total)
    : rounds.reduce((sum, round) => sum + number(round.correct_count), 0);
  const firstAttempt = scope.isAllTime
    ? {
        correct: number(collection.latest_first_attempt_correct_count),
        total: number(collection.latest_first_attempt_total),
      }
    : rounds.reduce(
        (acc, round) => {
          acc.correct += number(round.first_attempt_correct_count);
          acc.total += number(round.first_attempt_total || round.total_cards);
          return acc;
        },
        { correct: 0, total: 0 },
      );
  const periodStudiedGroupIds = new Set();
  rounds.forEach((round) =>
    getRoundScopedGroupIds(round, collectionGroupIds).forEach((groupId) => periodStudiedGroupIds.add(Number(groupId))),
  );
  const scopedStudiedGroups = scope.isAllTime ? studiedGroups : periodStudiedGroupIds.size;
  return {
    groups,
    studiedGroups: scopedStudiedGroups,
    groupRate: getRate(scopedStudiedGroups, groups.length),
    answerRate: getRate(correctTotal, totalAttempts),
    latestRate: getRate(firstAttempt.correct, firstAttempt.total),
    rounds,
    correctTotal,
    wrongTotal: scope.isAllTime
      ? number(collection.wrong_total)
      : rounds.reduce((sum, round) => sum + number(round.wrong_count), 0),
    roundCount: scope.isAllTime ? number(collection.completed_rounds) : rounds.length,
  };
}

function renderStatsCollectionSection(scope = getStatsScope()) {
  const collections = scope.collections;
  const displayLimit = Math.max(STATS_COLLECTION_LIST_PAGE_SIZE, number(state.statsCollectionListLimit));
  const displayCollections = collections.slice(0, displayLimit);
  const hiddenCount = Math.max(0, collections.length - displayCollections.length);
  return `
    <section class="panel stack">
      <div class="completion-header">
        <h3>${scope.collection ? "선택 대그룹 진행" : "대그룹별 진행"}</h3>
        <span class="pill">${hiddenCount ? `${number(displayCollections.length)}/${number(collections.length)}` : number(collections.length)}개</span>
      </div>
      ${
        collections.length
          ? `
            <div class="stats-collection-list">${displayCollections
              .map((collection) => renderStatsCollectionItem(collection, scope))
              .join("")}</div>
            ${
              hiddenCount
                ? `<div class="list-footer">
                    <p>${number(displayCollections.length)}/${number(collections.length)}개 대그룹을 표시 중입니다.</p>
                    <button class="secondary-button full" type="button" data-action="show-more-stats-collections">${iconLabel(
                      "chevron-down",
                      `${Math.min(STATS_COLLECTION_LIST_PAGE_SIZE, hiddenCount)}개 더 보기`,
                    )}</button>
                  </div>`
                : collections.length > STATS_COLLECTION_LIST_PAGE_SIZE
                  ? `<p class="list-performance-note">현재 조건의 대그룹 ${number(collections.length)}개를 모두 표시했습니다.</p>`
                  : ""
            }
          `
          : renderActionEmptyState({
              title: "대그룹이 없습니다.",
              body: "대그룹을 만들면 소그룹별 학습 진행을 모아 볼 수 있습니다.",
              action: "go-groups",
              label: "대그룹 만들기",
              iconName: "folder",
            })
      }
    </section>
  `;
}

function renderStatsCollectionItem(collection, scope = getStatsScope()) {
  const stats = getCollectionStats(collection, scope);
  const lastStudy = collection.last_studied_at ? formatDate(collection.last_studied_at) : "학습 기록 없음";
  const cardCount = number(collection.card_count);
  const studyCount = getCollectionStudyCardCount(collection);
  const excludedCount = getCollectionExcludedCardCount(collection);
  return `
    <article class="stats-collection-item">
      <div class="stats-item-heading">
        <div>
          <strong>${escapeHtml(collection.name)}</strong>
          <p>${escapeHtml(lastStudy)}</p>
        </div>
        <button class="ghost-button small-button" type="button" data-action="open-stats-collection" data-collection-id="${
          collection.id
        }">${iconLabel("folder", "소그룹 보기")}</button>
      </div>
      <div class="stats-chip-row">
        <span>소그룹 ${number(stats.studiedGroups)}/${number(stats.groups.length)}</span>
        <span>${escapeHtml(cardScopeText(cardCount, studyCount, excludedCount))}</span>
        <span>회독 ${number(stats.roundCount)}</span>
        <span>최근 첫 시도 ${rateText(stats.latestRate)}</span>
      </div>
      <div class="stats-progress-row">
        <span>소그룹 진행</span>
        ${renderStatsProgress(stats.groupRate, `소그룹 진행 ${rateText(stats.groupRate)}`)}
        <strong>${rateText(stats.groupRate)}</strong>
      </div>
      <p class="meta">${scope.isAllTime ? "누적 풀이" : `${scope.rangeCopy.label} 풀이`} 정답률 ${rateText(
        stats.answerRate,
      )} · 정답 ${number(
        stats.correctTotal,
      )} · 오답 ${number(
        stats.wrongTotal,
      )}</p>
    </article>
  `;
}

function getStatsFocusGroups(scope = getStatsScope()) {
  const periodWrongByGroup = new Map();
  if (!scope.isAllTime) {
    scope.rounds.forEach((round) => {
      const groupIds = getRoundScopedGroupIds(round, scope.groupIds);
      const share = groupIds.length ? number(round.wrong_count) / groupIds.length : 0;
      groupIds.forEach((groupId) => periodWrongByGroup.set(groupId, number(periodWrongByGroup.get(groupId)) + share));
    });
  }
  return [...scope.groups]
    .filter((group) =>
      scope.isAllTime
        ? getGroupStudyCardCount(group) > 0 && number(group.wrong_total) > 0
        : getGroupStudyCardCount(group) > 0 && number(periodWrongByGroup.get(Number(group.id))) > 0,
    )
    .sort((left, right) => {
      const leftAttempts = number(left.correct_total) + number(left.wrong_total);
      const rightAttempts = number(right.correct_total) + number(right.wrong_total);
      const leftWrong = scope.isAllTime ? number(left.wrong_total) : number(periodWrongByGroup.get(Number(left.id)));
      const rightWrong = scope.isAllTime ? number(right.wrong_total) : number(periodWrongByGroup.get(Number(right.id)));
      return (
        rightWrong - leftWrong ||
        rightWrong / Math.max(1, rightAttempts) - leftWrong / Math.max(1, leftAttempts) ||
        dateMs(right.last_studied_at) - dateMs(left.last_studied_at) ||
        compareGroupName(left, right)
      );
    })
    .map((group) => ({ ...group, stats_wrong_total: scope.isAllTime ? number(group.wrong_total) : Math.round(number(periodWrongByGroup.get(Number(group.id)))) }))
    .slice(0, 5);
}

function renderStatsFocusSection(summary) {
  const focusGroups = getStatsFocusGroups(summary.scope);
  if (!focusGroups.length) {
    return `
      <section class="stats-healthy-note has-mascot">
        ${renderKokkoMascot("stats", "stats-healthy-mascot")}
        <div>
          <span>오답 관리</span>
          <strong>누적 오답이 없습니다.</strong>
          <p>${
            summary.totalAttempts
              ? `${summary.scope.rangeCopy.label} 기준으로 오답이 쌓인 소그룹이 없습니다.`
              : "회독을 완료하면 오답이 많은 소그룹을 우선순위로 보여줍니다."
          }</p>
        </div>
      </section>
    `;
  }
  return `
    <section class="panel stack">
      <div class="completion-header">
        <h3>오답 많은 소그룹</h3>
        <span class="pill ${focusGroups.length ? "bad" : ""}">${number(focusGroups.length)}개</span>
      </div>
      <div class="stats-focus-list">${focusGroups.map(renderStatsFocusGroupItem).join("")}</div>
    </section>
  `;
}

function renderStatsFocusGroupItem(group) {
  const wrongTotal = number(group.stats_wrong_total ?? group.wrong_total);
  const attempts = number(group.correct_total) + number(group.wrong_total);
  const wrongRate = getRate(wrongTotal, attempts);
  const recentRate = getGroupRecentFirstAttemptRate(group);
  const cardCount = number(group.card_count);
  const studyCount = getGroupStudyCardCount(group);
  const excludedCount = getGroupExcludedCardCount(group);
  return `
    <article class="stats-focus-item">
      <div class="stats-item-heading">
        <div>
          <strong>${escapeHtml(group.name)}</strong>
          <p>${escapeHtml(group.collection_name)} · ${escapeHtml(getGroupLastStudyLabel(group))}</p>
        </div>
        <button class="secondary-button small-button" type="button" data-action="study-stats-group" data-group-id="${
          group.id
        }">${iconLabel("play", "학습")}</button>
      </div>
      <div class="stats-chip-row">
        <span>${escapeHtml(cardScopeText(cardCount, studyCount, excludedCount))}</span>
        <span>회독 ${number(group.completed_rounds)}</span>
        <span>오답 ${number(wrongTotal)}</span>
        <span>최근 첫 시도 ${rateText(recentRate)}</span>
      </div>
      <div class="stats-progress-row danger">
        <span>오답 비중</span>
        ${renderStatsProgress(wrongRate, `오답 비중 ${rateText(wrongRate)}`)}
        <strong>${rateText(wrongRate)}</strong>
      </div>
    </article>
  `;
}

function renderStatsRecentRoundSection(scope = getStatsScope()) {
  const visibleLimit = state.statsRecentRoundsOpen ? 10 : 3;
  const rounds = scope.rounds.slice(0, visibleLimit);
  return `
    <section class="panel stack">
      <div class="completion-header">
        <h3>최근 회독</h3>
        ${
          scope.rounds.length > 3
            ? `<button class="ghost-button small-button" type="button" data-action="toggle-stats-rounds">
                ${iconLabel(
                  state.statsRecentRoundsOpen ? "chevron-up" : "chevron-down",
                  state.statsRecentRoundsOpen ? "접기" : `더 보기 ${number(scope.rounds.length - 3)}`,
                )}
              </button>`
            : `<span class="pill">최근 ${number(rounds.length)}개</span>`
        }
      </div>
      ${
        rounds.length
          ? `<div class="stats-round-list">${rounds.map(renderStatsRecentRoundItem).join("")}</div>`
          : renderActionEmptyState({
              title: "회독 기록이 없습니다.",
              body: `${scope.rangeCopy.label} 조건에 맞는 회독 기록이 없습니다.`,
            })
      }
    </section>
  `;
}

function renderStatsRecentRoundItem(round) {
  const firstAttemptTotal = number(round.first_attempt_total || round.total_cards);
  const firstAttemptCorrect = number(round.first_attempt_correct_count);
  const firstAttemptRate = getRate(firstAttemptCorrect, firstAttemptTotal);
  const answerRate = getRoundAnswerRate(round);
  const targetName = round.selected_group_names || round.group_name || round.collection_name || "학습";
  return `
    <button class="stats-round-item" type="button" data-action="open-round-detail" data-round-id="${round.id}">
      <span>
        <strong>${escapeHtml(targetName)}</strong>
        <small>${number(round.round_no)}회독 · ${escapeHtml(formatDate(round.completed_at))}</small>
      </span>
      <em>
        <strong>${rateText(firstAttemptRate)}</strong>
        <small>첫 시도 · 재풀이 포함 ${rateText(answerRate)}</small>
      </em>
      <i aria-hidden="true">${icon("chevron-right")}</i>
    </button>
  `;
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

function normalizeControllerAction(action, fallback = "disabled") {
  return CONTROLLER_ACTION_LABELS[action] ? action : fallback;
}

function getControllerInputAction(inputName) {
  if (inputName === "a") {
    return normalizeControllerAction(state.settings?.controller_a_action, DEFAULT_CONTROLLER_A_ACTION);
  }
  if (inputName === "b") {
    return normalizeControllerAction(state.settings?.controller_b_action, DEFAULT_CONTROLLER_B_ACTION);
  }
  if (inputName === "x") {
    return normalizeControllerAction(state.settings?.controller_x_action, DEFAULT_CONTROLLER_X_ACTION);
  }
  if (inputName === "y") {
    return normalizeControllerAction(state.settings?.controller_y_action, DEFAULT_CONTROLLER_Y_ACTION);
  }
  return "disabled";
}

function hasRecentStudyControllerInput(now = Date.now()) {
  return Boolean(
    studyControllerLastInputLabel &&
      studyControllerLastInputAt &&
      now - studyControllerLastInputAt < STUDY_CONTROLLER_STATUS_FLASH_MS,
  );
}

function getStudyControllerStatusText(now = Date.now()) {
  if (hasRecentStudyControllerInput(now)) return `${studyControllerLastInputLabel} 입력됨`;
  if (studyGamepadConnected) return "컨트롤러 연결됨";
  return "컨트롤러 대기";
}

function updateStudyControllerStatusElement() {
  const statusEl = document.getElementById("study-controller-status");
  if (!statusEl) return;
  const now = Date.now();
  const isRecent = hasRecentStudyControllerInput(now);
  statusEl.textContent = getStudyControllerStatusText(now);
  statusEl.classList.toggle("active", studyGamepadConnected || isRecent);
}

function scheduleStudyControllerStatusRefresh() {
  if (studyControllerStatusTimerId) {
    window.clearTimeout(studyControllerStatusTimerId);
    studyControllerStatusTimerId = null;
  }
  if (!studyControllerLastInputAt) return;
  const remaining = STUDY_CONTROLLER_STATUS_FLASH_MS - (Date.now() - studyControllerLastInputAt);
  if (remaining <= 0) {
    updateStudyControllerStatusElement();
    return;
  }
  studyControllerStatusTimerId = window.setTimeout(() => {
    studyControllerStatusTimerId = null;
    updateStudyControllerStatusElement();
  }, remaining);
}

function markStudyControllerInput(label) {
  studyControllerLastInputAt = Date.now();
  studyControllerLastInputLabel = label;
  updateStudyControllerStatusElement();
  scheduleStudyControllerStatusRefresh();
}

function setStudyGamepadConnected(isConnected) {
  const nextConnected = Boolean(isConnected);
  if (studyGamepadConnected === nextConnected) return;
  studyGamepadConnected = nextConnected;
  updateStudyControllerStatusElement();
}

function shouldHandleStudyController() {
  return Boolean(
    state.activeTab === "study" &&
      state.session &&
      !state.session.savedRound &&
      !state.session.saving &&
      !state.session.isAnswering &&
      !state.activeDialog,
  );
}

function revealStudyCard() {
  if (!state.session || state.session.showingBack) return false;
  state.session.showingBack = true;
  render();
  return true;
}

async function handleStudyControllerAction(action) {
  if (!shouldHandleStudyController()) return false;
  const showingBack = state.session.showingBack;
  let actionLabel = "";
  if (action === "primary") actionLabel = showingBack ? "알맞음" : "뒤집기";
  else if (action === "wrong" && showingBack) actionLabel = "틀림";
  if (!actionLabel) return false;
  const now = Date.now();
  if (now - studyControllerLastActionAt < STUDY_CONTROLLER_COOLDOWN_MS) return false;
  studyControllerLastActionAt = now;
  markStudyControllerInput(actionLabel);
  if (action === "primary") {
    if (showingBack) await answerCard("correct");
    else revealStudyCard();
    return true;
  }
  if (action === "wrong" && showingBack) {
    await answerCard("wrong");
    return true;
  }
  return false;
}

async function handleStudyControllerInput(inputName) {
  const action = getControllerInputAction(inputName);
  if (action === "disabled") return false;
  const handled = await handleStudyControllerAction(action);
  if (handled) focusStudyControllerInputSoon();
  return handled;
}

function canFocusStudyControllerInput() {
  return Boolean(state.activeTab === "study" && state.session && !state.session.savedRound && !state.activeDialog);
}

function blurFocusedStudyAction() {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && activeElement.closest(".study-action-bar")) {
    activeElement.blur();
  }
}

function focusStudyControllerInput() {
  if (!canFocusStudyControllerInput()) return;
  const input = document.getElementById("study-controller-input");
  if (!(input instanceof HTMLElement)) return;
  blurFocusedStudyAction();
  try {
    input.focus({ preventScroll: true });
  } catch {
    input.focus();
  }
}

function focusStudyControllerInputSoon() {
  window.requestAnimationFrame(() => {
    focusStudyControllerInput();
    window.setTimeout(focusStudyControllerInput, 0);
  });
}

function handleStudyControllerText(value) {
  const text = String(value || "").toLowerCase();
  if (!text) return false;
  if (text.includes("a")) {
    void handleStudyControllerInput("a").catch(showRequestError);
    return true;
  }
  if (text.includes("b")) {
    void handleStudyControllerInput("b").catch(showRequestError);
    return true;
  }
  if (text.includes("x")) {
    void handleStudyControllerInput("x").catch(showRequestError);
    return true;
  }
  if (text.includes("y")) {
    void handleStudyControllerInput("y").catch(showRequestError);
    return true;
  }
  return false;
}

function pollStudyGamepads() {
  studyGamepadFrameId = null;
  if (!state.session || state.session.savedRound) {
    studyGamepadPressedButtons.clear();
    setStudyGamepadConnected(false);
    return;
  }
  studyGamepadFrameId = window.requestAnimationFrame(pollStudyGamepads);
  const pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : [];
  let handled = false;
  let hasGamepad = false;
  for (const pad of pads) {
    if (!pad) continue;
    hasGamepad = true;
    pad.buttons.forEach((button, index) => {
      const key = `${pad.index}:${index}`;
      const pressed = Boolean(button?.pressed || Number(button?.value || 0) > 0.5);
      if (!pressed) {
        studyGamepadPressedButtons.delete(key);
        return;
      }
      if (studyGamepadPressedButtons.has(key) || handled) return;
      studyGamepadPressedButtons.add(key);
      if (STUDY_GAMEPAD_A_BUTTONS.has(index)) {
        handled = true;
        void handleStudyControllerInput("a").catch(showRequestError);
      } else if (STUDY_GAMEPAD_B_BUTTONS.has(index)) {
        handled = true;
        void handleStudyControllerInput("b").catch(showRequestError);
      } else if (STUDY_GAMEPAD_X_BUTTONS.has(index)) {
        handled = true;
        void handleStudyControllerInput("x").catch(showRequestError);
      } else if (STUDY_GAMEPAD_Y_BUTTONS.has(index)) {
        handled = true;
        void handleStudyControllerInput("y").catch(showRequestError);
      }
    });
  }
  setStudyGamepadConnected(hasGamepad);
}

function syncStudyGamepad() {
  const shouldRun = Boolean(state.session && !state.session.savedRound);
  if (shouldRun && !studyGamepadFrameId && typeof navigator.getGamepads === "function") {
    studyGamepadFrameId = window.requestAnimationFrame(pollStudyGamepads);
  }
  if (!shouldRun) {
    if (studyGamepadFrameId) {
      window.cancelAnimationFrame(studyGamepadFrameId);
      studyGamepadFrameId = null;
    }
    studyGamepadPressedButtons.clear();
    setStudyGamepadConnected(false);
  }
}

function render() {
  state.isOffline = isBrowserOffline();
  renderConnectionBanner();
  const inActiveStudy = Boolean(state.user && state.activeTab === "study" && state.session && !state.session.savedRound);
  document.body.classList.toggle("study-mode", inActiveStudy);
  if (!state.user) {
    state.appStatus = "idle";
    document.body.classList.remove("shell-mode");
    renderHeader();
    renderAuth();
    renderDialog();
    syncStudyTimer();
    syncStudyGamepad();
    writeCurrentHistoryRoute();
    return;
  }
  if (state.appStatus === "loading" || state.appStatus === "error") {
    document.body.classList.remove("auth-mode", "study-mode");
    document.body.classList.add("shell-mode");
    renderHeader();
    renderAppShellState();
    renderDialog();
    syncStudyTimer();
    syncStudyGamepad();
    writeCurrentHistoryRoute();
    return;
  }
  document.body.classList.remove("auth-mode", "shell-mode");
  renderHeader();
  setTab(state.activeTab);
  renderActiveTab();
  renderDialog();
  syncStudyTimer();
  syncStudyGamepad();
  writeCurrentHistoryRoute();
}

function renderActiveTab() {
  if (state.activeTab === "cards") {
    renderCards();
    return;
  }
  if (state.activeTab === "stats") {
    renderStats();
    return;
  }
  if (state.activeTab === "groups") {
    renderGroups();
    return;
  }
  if (state.activeTab === "settings") {
    renderSettings();
    return;
  }
  renderStudy();
}

function getAppErrorCopy(error = state.appError) {
  if (error?.code === "offline") {
    return {
      eyebrow: "오프라인",
      title: "온라인 연결이 필요합니다",
      message: "꼬꼬회독은 서버에 학습 기록을 저장합니다. 연결 후 다시 시도하세요.",
    };
  }
  if (error?.code === "network") {
    return {
      eyebrow: "연결 실패",
      title: "서버에 연결하지 못했습니다",
      message: "개인 서버나 로컬 실행 상태를 확인한 뒤 다시 시도하세요. 입력한 데이터는 이 화면에서 지워지지 않습니다.",
    };
  }
  if (error?.status === 401 || error?.code === "auth") {
    return {
      eyebrow: "로그인 필요",
      title: "다시 들어가야 합니다",
      message: "저장된 로그인 정보가 맞지 않거나 만료되었습니다. 로그인 화면에서 닉네임과 6자리 코드를 다시 확인하세요.",
    };
  }
  return {
    eyebrow: "불러오기 실패",
    title: "데이터를 불러오지 못했습니다",
    message: error?.message || "잠시 뒤 다시 시도하세요.",
  };
}

function renderAppShellState() {
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.remove("active"));
  Object.entries(views).forEach(([key, view]) => {
    view.classList.toggle("active", key === "study");
    if (key !== "study") view.innerHTML = "";
  });
  if (state.appStatus === "loading") {
    views.study.innerHTML = `
      <div class="panel stack shell-state-panel" aria-live="polite">
        <p class="eyebrow">불러오는 중</p>
        <h2 id="study-title">학습 데이터를 준비하고 있어요</h2>
        <p class="meta">대그룹, 소그룹, 카드와 회독 기록을 한 번에 확인하는 중입니다.</p>
        <div class="loading-lines" aria-hidden="true"><span></span><span></span><span></span></div>
      </div>
    `;
    return;
  }
  const copy = getAppErrorCopy();
  views.study.innerHTML = `
    <div class="panel stack shell-state-panel error-state" role="alert">
      <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
      <h2 id="study-title">${escapeHtml(copy.title)}</h2>
      <p class="meta">${escapeHtml(copy.message)}</p>
      <div class="button-row">
        <button class="primary-button" type="button" data-action="retry-load-data">${iconLabel("repeat-2", "다시 시도")}</button>
        <button class="ghost-button" type="button" data-action="logout">${iconLabel("log-out", "로그인 화면")}</button>
      </div>
    </div>
  `;
}

function renderAuth() {
  document.body.classList.add("auth-mode");
  document.body.classList.remove("study-mode");
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.remove("active"));
  Object.entries(views).forEach(([key, view]) => view.classList.toggle("active", key === "auth"));
  const nickname = ALLOWED_LOGINS.includes(state.authValues.nickname) ? state.authValues.nickname : DEFAULT_LOGIN.nickname;
  const accessCode = state.authValues.accessCode ?? DEFAULT_LOGIN.accessCode;
  const accountOptions = ALLOWED_LOGINS.map(
    (name) => `<option value="${escapeHtml(name)}" ${name === nickname ? "selected" : ""}>${escapeHtml(name)}</option>`,
  ).join("");
  views.auth.innerHTML = `
    <div class="panel stack auth-panel">
      <section class="auth-mascot-card" aria-label="꼬꼬회독 시작">
        ${renderKokkoMascot("welcome", "auth-mascot", "eager")}
        <div>
          <p class="eyebrow">꼬꼬회독</p>
          <strong>오늘 볼 카드를 가볍게 열어둘게요.</strong>
        </div>
      </section>
      <div class="auth-heading">
        <p class="eyebrow">개인 학습 공간</p>
        <h2 id="auth-title">바로 시작하기</h2>
        <p id="auth-help" class="meta">등록된 계정 3개 중 하나를 선택하고 6자리 코드를 입력하세요.</p>
      </div>
      <form id="login-form" class="stack ${state.authPending ? "is-pending" : ""}" novalidate aria-busy="${state.authPending ? "true" : "false"}">
        <label class="field">
          <span>계정</span>
          <select class="input" name="nickname" autocomplete="username" required aria-describedby="auth-help auth-error" ${
            state.authError ? 'aria-invalid="true"' : ""
          } ${state.authPending ? "disabled" : ""}>
            <option value="">계정 선택</option>
            ${accountOptions}
          </select>
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
        <button class="primary-button full ${state.authPending ? "is-pending" : ""}" type="submit" ${state.authPending ? "disabled" : ""}>${iconLabel(
          "log-in",
          state.authPending ? "확인 중" : "들어가기",
        )}</button>
      </form>
      <p class="auth-note">허용된 계정만 접속할 수 있고, 계정별 학습 데이터는 서로 분리됩니다.</p>
    </div>
  `;
  if (!state.authPending) {
    window.requestAnimationFrame(() => views.auth.querySelector('select[name="nickname"]')?.focus({ preventScroll: true }));
  }
}

function renderConfirmDialog({ eyebrow, title, message, confirmLabel, confirmAction, tone = "danger" }) {
  const buttonClass = tone === "primary" ? "primary-button" : "danger-button";
  const confirmIcon = tone === "primary" ? "check" : "alert-triangle";
  const isPending = state.pendingRequest?.action === confirmAction;
  dialogRoot.innerHTML = `
    <div class="dialog-backdrop" role="presentation">
      <section class="dialog-panel ${isPending ? "is-pending" : ""}" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title" aria-describedby="study-dialog-message" aria-busy="${isPending ? "true" : "false"}">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h2 id="study-dialog-title">${escapeHtml(title)}</h2>
        <p id="study-dialog-message" class="meta">${escapeHtml(message)}</p>
        ${isPending ? `<p class="pending-note" role="status">${escapeHtml(state.pendingRequest.label)}입니다. 잠시만 기다려 주세요.</p>` : ""}
        <div class="button-row">
          <button class="ghost-button" type="button" data-action="close-dialog" ${isPending ? "disabled" : ""}>${iconLabel(
            "x",
            "취소",
          )}</button>
          <button class="${buttonClass} ${isPending ? "is-pending" : ""}" type="button" data-action="${confirmAction}" ${isPending ? "disabled" : ""}>${iconLabel(
            confirmIcon,
            isPending ? state.pendingRequest.label : confirmLabel,
          )}</button>
        </div>
      </section>
    </div>
  `;
  finishDialogRender();
}

async function runDialogRequest(action, label, task) {
  if (state.pendingRequest) return;
  state.pendingRequest = { action, label };
  renderDialog();
  try {
    await task();
  } finally {
    state.pendingRequest = null;
    if (state.activeDialog) renderDialog();
  }
}

async function runFormRequest(form, label, task) {
  const button = form.querySelector('button[type="submit"]');
  const originalMarkup = button?.innerHTML || "";
  const originalBusy = form.getAttribute("aria-busy");
  if (button?.disabled) return;
  form.classList.add("is-pending");
  form.setAttribute("aria-busy", "true");
  if (button) {
    button.disabled = true;
    button.classList.add("is-pending");
    button.innerHTML = iconLabel("save", label);
  }
  try {
    await task();
  } finally {
    if (form.isConnected) {
      form.classList.remove("is-pending");
      if (originalBusy === null) form.removeAttribute("aria-busy");
      else form.setAttribute("aria-busy", originalBusy);
    }
    if (button?.isConnected) {
      button.disabled = false;
      button.classList.remove("is-pending");
      button.innerHTML = originalMarkup;
    }
  }
}

function renderDialog() {
  beginDialogRender();
  document.body.classList.toggle("dialog-open", Boolean(state.activeDialog));
  if (!state.activeDialog) {
    dialogRoot.innerHTML = "";
    restoreDialogFocus();
    return;
  }
  const selectedGroup = getSelectedGroup();
  if (state.activeDialog === "start" && selectedGroup) {
    const selectedGroupCardText = studyCountText(
      number(selectedGroup.card_count),
      getGroupStudyCardCount(selectedGroup),
      getGroupExcludedCardCount(selectedGroup),
    );
    renderConfirmDialog({
      eyebrow: "시작",
      title: `${number(selectedGroup.completed_rounds) + 1}회독을 시작할까요?`,
      message: `${selectedGroup.name} · ${selectedGroupCardText} · ${getStudyOptionsSummary()}`,
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
      message: `최근 ${getWeakRecentRounds()}회독에서 ${getWeakRecentWrongThreshold()}회 이상, 또는 전체 ${getWeakCardThreshold()}회 이상 오답이 난 카드를 봅니다. ${EXAMPLE_ORDER_LABELS[state.exampleOrderMode]} · ${
        EXAMPLE_DISPLAY_LABELS[state.exampleDisplayMode]
      } · ${FRONT_EXAMPLE_LABELS[state.frontExampleMode]}`,
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
  if (state.activeDialog === "edit-card-in-session") {
    renderEditCardInSessionDialog();
    return;
  }
  const previewTarget = getPreviewTarget();
  if (state.activeDialog === "preview" && previewTarget) {
    const previewMode = state.pendingAction ? "sequence" : state.orderMode;
    const previewCards = getPreviewCards(previewTarget.groupIds, previewMode, previewTarget.includeExcluded);
    dialogRoot.innerHTML = `
      <div class="dialog-backdrop" role="presentation">
        <section class="dialog-panel preview-dialog" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title" aria-describedby="preview-dialog-summary">
          <p class="eyebrow">미리보기</p>
          <h2 id="study-dialog-title">${escapeHtml(previewTarget.name)} 카드</h2>
          <p id="preview-dialog-summary" class="meta">${previewCards.length}개 · ${
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
    finishDialogRender();
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
      message: "현재 학습 목표 정보를 모두 미정으로 돌립니다.",
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
  if (state.activeDialog === "history-leave") {
    renderConfirmDialog({
      eyebrow: "뒤로가기",
      title: "학습을 종료하고 돌아갈까요?",
      message: "브라우저 뒤로가기로 이동하면 지금까지의 답변은 저장되지 않습니다.",
      confirmLabel: "돌아가기",
      confirmAction: "confirm-history-leave-study",
    });
    return;
  }
  if (state.activeDialog === "delete-card") {
    const card = state.cards.find((item) => item.id === Number(state.pendingAction?.id));
    if (!card) return closeDialog();
    renderConfirmDialog({
      eyebrow: "삭제",
      title: "카드를 삭제할까요?",
      message: `${card.front} 카드와 연결된 예문, 이 카드의 답변 기록을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: "삭제",
      confirmAction: "confirm-delete-card",
    });
    return;
  }
  if (state.activeDialog === "delete-group-cards") {
    const target = state.groups.find((item) => item.id === Number(state.pendingAction?.id));
    if (!target) return closeDialog();
    renderConfirmDialog({
      eyebrow: "삭제",
      title: "소그룹의 모든 카드를 삭제할까요?",
      message: `${target.name} 소그룹의 카드 ${number(target.card_count)}개와 연결된 예문, 이 소그룹의 회독 기록을 삭제합니다. 소그룹 자체는 유지되며, 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: "전체 삭제",
      confirmAction: "confirm-delete-group-cards",
    });
    return;
  }
  if (state.activeDialog === "reset-history") {
    const target = state.groups.find((item) => item.id === Number(state.pendingAction?.id));
    if (!target) return closeDialog();
    renderConfirmDialog({
      eyebrow: "초기화",
      title: "학습 기록을 초기화할까요?",
      message: `${target.name} 소그룹의 회독 기록과 카드별 정답/오답 누적을 0으로 돌립니다. 카드와 예문은 유지되며, 이 작업은 되돌릴 수 없습니다.`,
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
      title: "소그룹 기록을 초기화할까요?",
      message: `${target.name} 대그룹의 모든 소그룹 회독 기록과 카드별 정답/오답 누적을 0으로 돌립니다. 카드와 예문은 유지되며, 이 작업은 되돌릴 수 없습니다.`,
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
      message: `${target.name} 소그룹과 카드 ${number(target.card_count)}개, 예문, 이 소그룹의 회독 기록을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
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
      message: `${target.name} 대그룹과 소그룹 ${number(target.group_count)}개, 카드 ${number(target.card_count)}개, 예문, 소그룹 회독 기록을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: "삭제",
      confirmAction: "confirm-delete-collection",
    });
    return;
  }
  if (state.activeDialog === "restore-backup") {
    const summary = backupSummary(state.pendingAction?.backup);
    renderConfirmDialog({
      eyebrow: "데이터 복원",
      title: "현재 데이터를 백업 파일로 교체할까요?",
      message: `현재 학습 데이터는 삭제되고 백업의 대그룹 ${number(summary.collections)}개, 소그룹 ${number(
        summary.groups,
      )}개, 카드 ${number(summary.cards)}개, 회독 ${number(summary.rounds)}개로 교체됩니다. ${
        summary.hasSettings ? "학습 설정도 백업 값으로 복원됩니다. " : ""
      }이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: "교체 복원",
      confirmAction: "confirm-restore-backup",
    });
    return;
  }
  renderConfirmDialog({
    eyebrow: "중단",
    title: "회독을 포기할까요?",
    message:
      state.session?.studyMode === "weak"
        ? state.session.returnTab === "stats"
          ? "지금까지의 답변은 저장되지 않고, 통계 화면으로 돌아갑니다."
          : "지금까지의 답변은 저장되지 않고, 약점 카드 목록으로 돌아갑니다."
        : "지금까지의 답변은 저장되지 않고, 현재 소그룹의 학습 설정 화면으로 돌아갑니다.",
    confirmLabel: "포기",
    confirmAction: "confirm-quit-study",
  });
}

function closeDialog() {
  if (state.pendingRequest) return;
  if (state.activeDialog === "preview" && state.pendingAction?.returnDialog === "collection-study-picker") {
    const scrollTop = number(state.pendingAction.returnScrollTop);
    state.activeDialog = "collection-study-picker";
    state.pendingAction = null;
    renderDialog();
    window.requestAnimationFrame(() => {
      const panel = getCollectionStudyScrollElement();
      if (!panel) return;
      const maxScrollTop = Math.max(0, panel.scrollHeight - panel.clientHeight);
      panel.scrollTop = Math.min(scrollTop, maxScrollTop);
    });
    return;
  }
  state.activeDialog = null;
  state.roundDetail = null;
  state.pendingTab = null;
  state.pendingAction = null;
  state.pendingHistoryRoute = null;
  state.collectionStudyReturnContext = null;
  renderDialog();
}

function getCollectionStudyScrollElement() {
  return dialogRoot.querySelector(".collection-study-body") || dialogRoot.querySelector(".collection-study-dialog");
}

function rerenderCollectionStudyDialog({ preserveScroll = true, anchorSelector = "" } = {}) {
  const currentPanel = getCollectionStudyScrollElement();
  const scrollTop = preserveScroll && currentPanel ? currentPanel.scrollTop : 0;
  const anchorTop = anchorSelector ? currentPanel?.querySelector(anchorSelector)?.getBoundingClientRect().top : null;
  renderDialog();
  if (!preserveScroll) return;
  window.requestAnimationFrame(() => {
    const nextPanel = getCollectionStudyScrollElement();
    if (!nextPanel) return;
    const maxScrollTop = Math.max(0, nextPanel.scrollHeight - nextPanel.clientHeight);
    nextPanel.scrollTop = Math.min(scrollTop, maxScrollTop);
    if (anchorTop === null) return;
    const nextAnchor = nextPanel.querySelector(anchorSelector);
    if (!nextAnchor) return;
    const nextTop = nextAnchor.getBoundingClientRect().top;
    nextPanel.scrollTop = Math.min(Math.max(0, nextPanel.scrollTop + nextTop - anchorTop), maxScrollTop);
  });
}

function renderStudyPickerUpdate(anchorSelector = "") {
  if (state.activeDialog === "collection-study-picker") {
    rerenderCollectionStudyDialog({ anchorSelector });
    return;
  }
  renderStudy();
}

function getPreviewTarget() {
  if (state.pendingAction?.type === "preview-group-cards") {
    const group = state.groups.find((item) => item.id === Number(state.pendingAction.id));
    return group ? { name: getGroupLabel(group), groupIds: [group.id], includeExcluded: true } : null;
  }
  if (state.pendingAction?.type === "preview-collection-cards") {
    const collection = state.collections.find((item) => item.id === Number(state.pendingAction.id));
    if (!collection) return null;
    return { name: collection.name, groupIds: getGroupsForCollection(collection.id).map((group) => group.id), includeExcluded: true };
  }
  if (state.pendingAction?.type === "preview-bundle-cards") {
    const collection = state.collections.find((item) => item.id === Number(state.pendingAction.id));
    const groupIds = state.pendingAction.groupIds || [];
    return collection ? { name: `${collection.name} 묶음 연습`, groupIds, includeExcluded: false } : null;
  }
  const group = getSelectedGroup();
  return group ? { name: getGroupLabel(group), groupIds: [group.id], includeExcluded: false } : null;
}

function getPreviewCards(groupIds, orderMode = state.orderMode, includeExcluded = true) {
  const groupIdSet = new Set((groupIds || []).map(Number));
  const cards = state.cards.filter((card) => groupIdSet.has(Number(card.group_id)) && (includeExcluded || !isCardStudyExcluded(card)));
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

function restorePracticeReturnContext(session) {
  const collectionId = Number(session?.collection?.id || session?.returnContext?.collectionId || state.selectedCollectionId);
  state.selectedCollectionId = collectionId || state.selectedCollectionId;
  state.selectedStudyGroupIds = (session?.selectedGroups || []).map((group) => group.id);

  if (session?.returnContext?.tab === "groups") {
    state.activeTab = "groups";
    state.groupScreen = "list";
    state.groupDetailCollectionId = collectionId || session.returnContext.groupDetailCollectionId || null;
    state.editingGroupId = null;
    state.editingCollectionId = null;
    return;
  }

  state.activeTab = "study";
  state.studyStep = "collection";
}

function renderPreviewCard(card) {
  return `
    <article class="preview-card">
      <div class="item-title">
        <strong>${renderJapaneseText(card.front)}</strong>
        <span class="pill">${card.examples?.length || 0}예문</span>
      </div>
      <p>${renderMarkedText(card.back)}</p>
      <p class="meta">정답 ${number(card.correct_count)} · 오답 ${number(card.wrong_count)}</p>
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
        ${renderActionEmptyState({
          title: "첫 대그룹을 만들어 주세요.",
          body: "대그룹을 만든 뒤 소그룹과 카드를 넣으면 학습을 시작할 수 있습니다.",
          action: "go-groups",
          label: "대그룹 만들기",
        })}
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
  const totalStudyCards = state.collections.reduce((sum, collection) => sum + getCollectionStudyCardCount(collection), 0);
  const totalExcludedCards = state.collections.reduce((sum, collection) => sum + getCollectionExcludedCardCount(collection), 0);
  const recentGroup = getRecentStudyGroup();
  const weakCards = getWeakCards();
  const visibleCollections = state.collections.filter((collection) =>
    matchesQuery([collection.name, collection.description], state.studyCollectionSearchQuery),
  );
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(visibleCollections.length / PAGE_SIZE));
  const page = Math.min(state.studyCollectionPage, totalPages - 1);
  const pageItems = visibleCollections.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  views.study.innerHTML = `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">학습</p>
          <h2 id="study-title">오늘의 학습</h2>
        </div>
        <span class="pill">대그룹 ${number(state.collections.length)}개</span>
      </div>
      <p class="meta">${escapeHtml(studyCountText(totalCards, totalStudyCards, totalExcludedCards))} · 오늘은 먼저 이어서 회독할 소그룹을 고릅니다.</p>
      ${renderTodayStudyPanel(recentGroup, weakCards)}
      ${renderWeakCardsPanel()}
      <section id="study-collection-browser" class="group-browser-block">
        <div class="completion-header">
          <h3>대그룹 찾아보기</h3>
          <span class="pill">${visibleCollections.length}개</span>
        </div>
        <div class="study-group-tools">
          ${renderSearchInput({ id: "study-collection-search", value: state.studyCollectionSearchQuery, placeholder: "대그룹 검색" })}
        </div>
        <div class="study-group-list">
          ${
            visibleCollections.length
              ? pageItems.map(renderStudyCollectionChoiceItem).join("")
              : renderActionEmptyState({
                  title: "검색된 대그룹이 없습니다.",
                  body: "검색어를 지우면 전체 대그룹을 다시 볼 수 있습니다.",
                  action: "clear-search",
                  label: "검색어 지우기",
                  iconName: "x",
                  buttonClass: "secondary-button",
                  attrs: `data-target="study-collection-search"`,
                })
          }
        </div>
        ${visibleCollections.length > PAGE_SIZE ? renderStudyPagination(page, totalPages, "collection") : ""}
      </section>
    </div>
  `;
}

function renderStudySubgroupPicker(collection) {
  const collectionStudyCount = getCollectionStudyCardCount(collection);
  const collectionExcludedCount = getCollectionExcludedCardCount(collection);
  const bundleDisabledReason = collectionExcludedCount
    ? "학습 대상 카드가 없습니다. 제외한 카드를 다시 학습에 포함해 주세요."
    : "학습 대상 카드가 있는 소그룹이 있어야 기록 없는 묶음 연습을 시작할 수 있습니다.";
  const collectionGroups = sortStudyGroups(
    getGroupsForCollection(collection.id).filter((group) =>
      matchesQuery([group.name, group.description, group.collection_name], state.studyGroupSearchQuery),
    ),
  );
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(collectionGroups.length / PAGE_SIZE));
  const page = Math.min(state.studyGroupPage, totalPages - 1);
  const pageItems = collectionGroups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
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
      ${renderOrientationNote(["학습", collection.name], "공식 회독은 아래 소그룹 단위로 저장됩니다.", {
        exposeNote: true,
      })}
      <p class="meta">${escapeHtml(collection.description || "설명 없음")}</p>
      <div class="stat-grid">
        <div class="stat"><strong>${number(collection.group_count)}</strong><span>소그룹</span></div>
        <div class="stat"><strong>${number(collection.card_count)}</strong><span>전체 카드</span></div>
        <div class="stat"><strong>${number(collection.completed_rounds)}</strong><span>소그룹 회독</span></div>
      </div>
      <p class="meta">${escapeHtml(studyCountText(number(collection.card_count), collectionStudyCount, collectionExcludedCount))} · 묶음 연습은 공식 기록에 저장되지 않습니다.</p>
      <button class="secondary-button full" type="button" data-action="open-collection-study-dialog" ${
        collectionStudyCount ? "" : `disabled aria-describedby="${getDisabledReasonId(bundleDisabledReason)}"`
      }>${iconLabel("repeat-2", "묶음 연습")}</button>
      ${
        collectionStudyCount
          ? ""
          : renderDisabledReason(bundleDisabledReason)
      }
      <section class="group-browser-block subgroup-picker-block">
        <div class="completion-header">
          <h3>소그룹 선택</h3>
          <span class="pill">${collectionGroups.length}개</span>
        </div>
        <div class="study-group-tools">
          ${renderSearchInput({ id: "study-group-search", value: state.studyGroupSearchQuery, placeholder: "소그룹 검색" })}
          ${renderStudyGroupSortOptions()}
        </div>
        <div class="study-group-list">
          ${
            collectionGroups.length
              ? pageItems.map(renderStudyGroupChoiceItem).join("")
              : getGroupsForCollection(collection.id).length
                ? renderActionEmptyState({
                    title: "검색된 소그룹이 없습니다.",
                    body: "검색어를 지우면 이 대그룹의 소그룹을 다시 볼 수 있습니다.",
                    action: "clear-search",
                    label: "검색어 지우기",
                    iconName: "x",
                    buttonClass: "secondary-button",
                    attrs: `data-target="study-group-search"`,
                  })
                : renderActionEmptyState({
                    title: "아직 소그룹이 없습니다.",
                    body: "공식 회독과 통계는 소그룹 단위로 저장됩니다.",
                    action: "open-group-form-for-collection",
                    label: "소그룹 만들기",
                    attrs: `data-collection-id="${collection.id}"`,
                  })
          }
        </div>
        ${collectionGroups.length > PAGE_SIZE ? renderStudyPagination(page, totalPages, "group") : ""}
      </section>
    </div>
  `;
}

function renderStudyPagination(page, totalPages, target) {
  return `
    <div class="study-pagination">
      <button class="ghost-button small-button" type="button" data-action="study-page-prev" data-target="${target}" ${page === 0 ? "disabled" : ""} aria-label="이전">
        ${icon("arrow-left")}
      </button>
      <span class="study-pagination-label">${page + 1} / ${totalPages}</span>
      <button class="ghost-button small-button" type="button" data-action="study-page-next" data-target="${target}" ${page >= totalPages - 1 ? "disabled" : ""} aria-label="다음">
        ${icon("chevron-right")}
      </button>
    </div>
  `;
}

function renderStudyGroupSortOptions() {
  return `
    <div class="segmented study-sort-options" role="group" aria-label="소그룹 정렬">
      ${Object.entries(STUDY_GROUP_SORT_LABELS)
        .map(
          ([mode, label]) => `
            <button class="segment ${state.studyGroupSortMode === mode ? "active" : ""}" type="button" data-action="set-study-group-sort" data-sort="${mode}" aria-pressed="${
              state.studyGroupSortMode === mode ? "true" : "false"
            }">
              ${label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTodayStudyPanel(recentGroup, weakCards = getWeakCards()) {
  const totalThreshold = getWeakCardThreshold();
  const recentRounds = getWeakRecentRounds();
  const recentThreshold = getWeakRecentWrongThreshold();
  const nextRoundNo = recentGroup ? number(recentGroup.completed_rounds) + 1 : 1;
  const recentTitle = recentGroup
    ? [recentGroup.collection_name, recentGroup.name].filter(Boolean).join(" · ")
    : "학습할 대그룹 고르기";
  const recentMeta = recentGroup
    ? `${nextRoundNo}회독 준비 · 마지막 ${formatDate(recentGroup.last_studied_at)}`
    : "아래에서 대그룹을 선택한 뒤 소그룹 회독을 시작하세요.";
  const weakMeta = weakCards.length
    ? `기준: 최근 ${recentRounds}회독 ${recentThreshold}회 이상 또는 전체 ${totalThreshold}회 이상`
    : `기준: 최근 ${recentRounds}회독 ${recentThreshold}회 이상 또는 전체 ${totalThreshold}회 이상`;
  const weakSummary = weakCards.length
    ? `${weakCards.length}개`
    : "없음";
  const studiedToday = recentGroup && isToday(recentGroup.last_studied_at);
  const weakDisabledReason = "약점 기준에 걸린 카드가 생기면 복습을 시작할 수 있습니다.";
  return `
    <section class="today-study-panel">
      <div class="today-action-card primary today-primary-card">
        <div>
          <span class="today-action-label">오늘 바로 할 일</span>
          <strong>${escapeHtml(recentTitle)}</strong>
          <p>${escapeHtml(recentMeta)}</p>
        </div>
        <button class="primary-button full" type="button" data-action="${
          recentGroup ? "choose-study-group" : "focus-study-collections"
        }" ${recentGroup ? `data-group-id="${recentGroup.id}"` : ""}>
          ${iconLabel(recentGroup ? "play" : "folder", recentGroup ? `${nextRoundNo}회독 준비` : "대그룹 고르기")}
        </button>
      </div>
      <div class="today-secondary-grid">
        <article class="today-action-card primary ${studiedToday ? "has-mascot" : ""}">
          ${studiedToday ? renderKokkoMascot("flag", "today-card-mascot") : ""}
          <div>
            <span class="today-action-label">회독 상태</span>
            <strong>${recentGroup ? `${number(recentGroup.completed_rounds)}회독 완료` : `${number(state.groups.length)}개 소그룹`}</strong>
            <p>${escapeHtml(recentGroup ? `최근 학습 ${formatDate(recentGroup.last_studied_at)}` : "대그룹을 열고 첫 소그룹 회독을 시작하세요.")}</p>
          </div>
        </article>
        <article class="today-action-card weak ${weakCards.length ? "has-weak" : "quiet has-mascot"}">
          ${weakCards.length ? "" : renderKokkoMascot("shield", "today-card-mascot")}
          <div>
            <span class="today-action-label">약점 복습</span>
            <strong>${weakSummary}</strong>
            <p>${escapeHtml(weakMeta)}</p>
          </div>
          <div class="today-card-actions">
            ${
              weakCards.length
                ? `<div class="today-action-buttons">
                  <button class="secondary-button full" type="button" data-action="start-weak-study">${iconLabel(
                    "rotate-ccw",
                    "복습 시작",
                  )}</button>
                  <button class="ghost-button full" type="button" data-action="toggle-weak-panel">${iconLabel(
                    state.weakPanelOpen ? "chevron-up" : "list",
                    state.weakPanelOpen ? "접기" : "목록 보기",
                  )}</button>
                </div>`
                : `<button class="ghost-button full" type="button" disabled aria-describedby="${getDisabledReasonId(
                  weakDisabledReason,
                )}">${iconLabel("rotate-ccw", "복습할 카드 없음")}</button>
                 ${renderDisabledReason(weakDisabledReason)}`
            }
          </div>
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
          <h3>복습 목록</h3>
        </div>
        <span class="pill ${weakCards.length ? "bad" : ""}">${weakCards.length}개</span>
      </div>
      <p class="meta">기준: 최근 ${recentRounds}회독 ${recentThreshold}회 이상 또는 전체 ${totalThreshold}회 이상 · 최근 오답 ${recentWrong}회 · 전체 오답 ${totalWrong}회</p>
      <div class="weak-card-list">${weakCards.map(renderWeakCardItem).join("")}</div>
      <button class="secondary-button full" type="button" data-action="start-weak-study">${iconLabel(
        "rotate-ccw",
        "복습 시작",
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
        <p>${renderMarkedText(card.back)}</p>
        <div class="weak-card-meta">
          <span>${escapeHtml(card.group_name)}</span>
          <span>최근 ${getWeakRecentRounds()}회독 오답 ${recentWrong}</span>
          <span>전체 회독 오답 ${totalWrong}</span>
          <span>오답 비중 ${wrongRate}%</span>
        </div>
      </button>
      ${
        isOpen
          ? `
            <div class="weak-card-detail">
              ${card.memo ? `<p class="study-note">${renderMarkedText(card.memo)}</p>` : ""}
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
  const studyCount = getCollectionStudyCardCount(collection);
  const excludedCount = getCollectionExcludedCardCount(collection);
  const groupCount = number(collection.group_count);
  return `
    <article class="group-item group-choice ${studyCount ? "" : "empty"}">
      <button class="group-choice-main" type="button" data-action="choose-study-collection" data-collection-id="${collection.id}">
        <div class="item-title">
          <strong>${escapeHtml(collection.name)}</strong>
        </div>
        <p class="meta">${escapeHtml(collection.description || "설명 없음")}</p>
        <div class="group-choice-footer">
          <span>소그룹 ${groupCount}개</span>
          <span>${escapeHtml(studyCountText(cardCount, studyCount, excludedCount))}</span>
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
  const active = Number(group.id) === Number(state.selectedGroupId);
  const lastStudyText = getGroupLastStudyLabel(group);
  return `
    <article class="group-item group-choice subgroup-choice ${active ? "active" : ""} ${cardCount ? "" : "empty"}">
      <button class="group-choice-main" type="button" data-action="choose-study-group" data-group-id="${group.id}" aria-pressed="${active ? "true" : "false"}">
        <div class="item-title">
          <strong>${escapeHtml(group.name)}</strong>
        </div>
        ${renderGroupStatusPills(group, { showRounds: true, showAccuracy: true })}
        ${renderGroupMetricRow(group)}
        <p class="meta">${escapeHtml(lastStudyText)} · 누적 정답 ${number(group.correct_total)} · 누적 오답 ${number(group.wrong_total)}</p>
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
  const selectedRounds = state.rounds.filter((round) => roundIncludesGroup(round, selected.id));
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
  const selectableCount = groups.filter((group) => getGroupStudyCardCount(group) > 0).length;
  const disabledCount = groups.length - selectableCount;
  if (!groups.length) {
    return `
      <section class="study-subgroup-panel">
        ${renderActionEmptyState({
          title: "이 대그룹에는 아직 소그룹이 없습니다.",
          body: "소그룹을 만든 뒤 카드를 넣으면 묶음 연습에 포함할 수 있습니다.",
          action: "open-group-form-for-collection",
          label: "소그룹 만들기",
          attrs: `data-collection-id="${state.selectedCollectionId}"`,
        })}
      </section>
    `;
  }
  const selectedIds = new Set(state.selectedStudyGroupIds.map(Number));
  const selectedCount = groups.filter((group) => selectedIds.has(Number(group.id)) && getGroupStudyCardCount(group) > 0).length;
  const allSelected = Boolean(selectableCount && selectedCount === selectableCount);
  return `
    <section class="study-subgroup-panel">
      <div class="completion-header">
        <h3>학습할 소그룹</h3>
        <span class="pill">${selectedCount}/${selectableCount} 선택</span>
      </div>
      ${disabledCount ? `<p class="study-subgroup-note">학습 대상이 없는 소그룹 ${number(disabledCount)}개는 선택에서 제외됩니다.</p>` : ""}
      <div class="button-row">
        <button class="secondary-button" type="button" data-action="select-all-study-subgroups" aria-pressed="${
          allSelected ? "true" : "false"
        }" ${selectableCount ? "" : "disabled"}>${iconLabel(allSelected ? "check" : "plus", allSelected ? "전체 선택됨" : "전체 선택")}</button>
        <button class="ghost-button" type="button" data-action="clear-study-subgroups">${iconLabel("x", "선택 해제")}</button>
      </div>
      <div class="quick-practice-grid" aria-label="빠른 선택">
        ${renderPracticePresetButton("today", "오늘 미학습", selectedIds)}
        ${renderPracticePresetButton("wrong", "오답 있음", selectedIds)}
        ${renderPracticePresetButton("stale", "오래된 3개", selectedIds)}
      </div>
      <div class="study-subgroup-list">
        ${groups
          .map((group) => {
            const cardCount = number(group.card_count);
            const studyCount = getGroupStudyCardCount(group);
            const excludedCount = getGroupExcludedCardCount(group);
            const disabled = !studyCount;
            const checked = !disabled && selectedIds.has(Number(group.id));
            const lastStudyText = getGroupLastStudyLabel(group);
            return `
              <label class="study-subgroup-option ${checked ? "active" : ""} ${disabled ? "disabled" : ""}">
                <input type="checkbox" data-action="toggle-study-subgroup" data-group-id="${group.id}" ${
                  checked ? "checked" : ""
                } ${disabled ? "disabled" : ""} />
                <span>
                  <strong>${escapeHtml(group.name)}</strong>
                  <small>${
                    disabled
                      ? cardCount
                        ? `전체 학습 제외 · 제외 ${excludedCount}개`
                        : "카드 없음 · 제외"
                      : `${escapeHtml(studyCountText(cardCount, studyCount, excludedCount))} · ${escapeHtml(lastStudyText)} · 오답 ${number(
                          group.wrong_total,
                        )}`
                  }</small>
                </span>
              </label>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderEditCardInSessionDialog() {
  const card = state.cards.find((c) => Number(c.id) === Number(state.editingCardId));
  if (!card) return closeDialog();
  dialogRoot.innerHTML = `
    <div class="dialog-backdrop" role="presentation">
      <section class="dialog-panel edit-card-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-card-dialog-title">
        <div class="row">
          <h2 id="edit-card-dialog-title" class="edit-card-dialog-title">카드 수정</h2>
          <button class="ghost-button small-button" type="button" data-action="close-dialog" aria-label="닫기">${icon("x")}</button>
        </div>
        ${renderCardForm(card, card.group_id)}
      </section>
    </div>
  `;
  finishDialogRender();
}

function renderCollectionStudyDialog() {
  const collection = getSelectedCollection() || state.collections[0];
  if (!collection) return closeDialog();
  if (state.selectedCollectionId !== collection.id) state.selectedCollectionId = collection.id;
  const groups = getGroupsForCollection(collection.id);
  const selectedGroups = getSelectedStudyGroups();
  const selectedCardCount = getSelectedStudyCardCount();
  const canStart = selectedCardCount > 0;
  const summaryText = canStart
    ? getStudyOptionsSummary(["공식 기록 제외"])
    : selectedGroups.length
      ? "선택한 소그룹에 학습 대상 카드가 없습니다."
      : "학습 대상 카드가 있는 소그룹을 하나 이상 선택하세요.";
  dialogRoot.innerHTML = `
    <div class="dialog-backdrop" role="presentation">
      <section class="dialog-panel collection-study-dialog" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title" aria-describedby="collection-study-help">
        <div class="row dialog-header">
          <div>
            <p class="eyebrow">묶음 연습</p>
            <h2 id="study-dialog-title">기록 없이 소그룹 묶기</h2>
          </div>
          <button class="ghost-button small-button" type="button" data-action="close-dialog">${iconLabel("x", "닫기")}</button>
        </div>
        <div class="collection-study-body">
          <p id="collection-study-help" class="meta collection-study-note">선택한 소그룹 카드만 섞어 연습합니다. 회독 기록과 통계에는 저장되지 않습니다.</p>
          <label class="field">
            <span>대그룹</span>
            <select id="study-collection-select" class="select" aria-label="학습 대그룹 선택">
              ${collectionOptions(collection.id)}
            </select>
          </label>
          ${renderStudyGroupSelection(groups)}
          ${renderStudyOptionsPanel()}
        </div>
        <section class="study-start-panel practice-summary" aria-label="묶음 연습 요약" aria-live="polite">
          <div>
            <span class="today-action-label">기록 없는 연습</span>
            <strong>${selectedGroups.length}개 소그룹 · 학습 대상 ${selectedCardCount}개</strong>
            <p id="collection-practice-summary">${escapeHtml(summaryText)}</p>
          </div>
          <div class="study-start-actions">
            <button class="primary-button full" type="button" data-action="start-bundle-study" ${
              canStart ? "" : 'disabled aria-describedby="collection-practice-summary"'
            }>
              ${iconLabel("play", "연습 시작")}
            </button>
            <button class="ghost-button full" type="button" data-action="preview-bundle-cards" ${
              canStart ? "" : 'disabled aria-describedby="collection-practice-summary"'
            }>
              ${iconLabel("eye", "미리보기")}
            </button>
          </div>
        </section>
      </section>
    </div>
  `;
  finishDialogRender();
}

function renderStudyStartPanel(group) {
  const nextRoundNo = number(group.completed_rounds) + 1;
  const cardCount = number(group.card_count);
  const studyCount = getGroupStudyCardCount(group);
  const excludedCount = getGroupExcludedCardCount(group);
  const canStart = studyCount > 0;
  const disabledReason = cardCount
    ? "모든 카드가 학습 제외 상태입니다. 카드 관리에서 다시 학습에 포함해 주세요."
    : "카드를 등록하면 회독과 미리보기를 사용할 수 있습니다.";
  return `
    <section class="study-start-panel">
      <div>
        <span class="today-action-label">다음 회독</span>
        <strong>${nextRoundNo}회독 시작</strong>
        <p>${escapeHtml(studyCountText(cardCount, studyCount, excludedCount))} · ${getStudyOptionsSummary()}</p>
      </div>
      <div class="study-start-actions">
        ${
          canStart
            ? `<button class="primary-button full" type="button" data-action="start-study">
                ${iconLabel("play", `${nextRoundNo}회독 시작`)}
              </button>
              <button class="ghost-button full" type="button" data-action="preview-study-cards">
                ${iconLabel("eye", "미리보기")}
              </button>`
            : `<button class="primary-button full" type="button" data-action="${cardCount ? "open-study-group-cards" : "add-card-to-study-group"}" data-group-id="${group.id}">
                ${iconLabel(cardCount ? "list" : "plus", cardCount ? "카드 관리" : "카드 등록")}
              </button>
              <button class="ghost-button full" type="button" data-action="preview-study-cards" disabled aria-describedby="${getDisabledReasonId(disabledReason)}">
                ${iconLabel("eye", "미리보기")}
              </button>`
        }
      </div>
      ${canStart ? "" : renderDisabledReason(disabledReason)}
    </section>
  `;
}

function getStudyOptionsSummary(extraItems = []) {
  return [
    ORDER_LABELS[state.orderMode],
    EXAMPLE_ORDER_LABELS[state.exampleOrderMode],
    EXAMPLE_DISPLAY_LABELS[state.exampleDisplayMode],
    FRONT_EXAMPLE_LABELS[state.frontExampleMode],
    ...extraItems,
  ].join(" · ");
}

function renderStudyOptionsPanel() {
  const summary = getStudyOptionsSummary();
  return `
    <section class="study-options-panel">
      <button class="study-options-toggle" type="button" data-action="toggle-study-options" aria-expanded="${
        state.studyOptionsOpen ? "true" : "false"
      }">
        <span>
          <strong>학습 옵션</strong>
          <small>${summary}</small>
        </span>
        <em aria-hidden="true">${icon(state.studyOptionsOpen ? "chevron-up" : "chevron-down")}</em>
      </button>
      ${
        state.studyOptionsOpen
          ? `<div class="study-options-body">
              ${renderOrderOptions()}
              ${renderExampleOrderOptions()}
              ${renderExampleDisplayOptions()}
              ${renderFrontExampleOptions()}
            </div>`
          : ""
      }
    </section>
  `;
}

function renderSelectedGroupStats(group) {
  const recentFirstAttemptRate = getGroupRecentFirstAttemptRate(group);
  const cardCount = number(group.card_count);
  const studyCount = getGroupStudyCardCount(group);
  const excludedCount = getGroupExcludedCardCount(group);
  return `
    <div class="stat-grid">
      <div class="stat"><strong>${number(group.card_count)}</strong><span>전체 카드</span></div>
      <div class="stat"><strong>${number(group.correct_total)}</strong><span>정답</span></div>
      <div class="stat"><strong>${number(group.wrong_total)}</strong><span>오답</span></div>
    </div>
    <p class="meta">${escapeHtml(studyCountText(cardCount, studyCount, excludedCount))} · 마지막 학습 ${formatDate(group.last_studied_at)} · 최근 첫 시도 ${
      recentFirstAttemptRate === null ? "기록 없음" : `${recentFirstAttemptRate}%`
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
        <p>${studiedToday ? "오늘 이미 한 번 회독했어요." : "오늘 첫 회독으로 들어가기 좋아요."}</p>
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
              <button class="order-option ${state.orderMode === mode ? "active" : ""}" type="button" data-action="set-order" data-order="${mode}" aria-pressed="${
                state.orderMode === mode ? "true" : "false"
              }">
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

function renderExampleOrderOptions() {
  return `
    <section class="study-option-block">
      <div class="completion-header">
        <h3>예문 순서</h3>
        <span class="pill">${EXAMPLE_ORDER_LABELS[state.exampleOrderMode]}</span>
      </div>
      <div class="order-options two" role="group" aria-label="예문 순서">
        ${Object.entries(EXAMPLE_ORDER_LABELS)
          .map(
            ([mode, label]) => `
              <button class="order-option ${state.exampleOrderMode === mode ? "active" : ""}" type="button" data-action="set-example-order" data-example-order="${mode}" aria-pressed="${
                state.exampleOrderMode === mode ? "true" : "false"
              }">
                <span>${label}</span>
                <small>${EXAMPLE_ORDER_DESCRIPTIONS[mode]}</small>
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
              <button class="order-option ${state.exampleDisplayMode === mode ? "active" : ""}" type="button" data-action="set-example-display" data-example-display="${mode}" aria-pressed="${
                state.exampleDisplayMode === mode ? "true" : "false"
              }">
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

function renderFrontExampleOptions() {
  return `
    <section class="study-option-block">
      <div class="completion-header">
        <h3>앞면 예문</h3>
        <span class="pill">${FRONT_EXAMPLE_LABELS[state.frontExampleMode]}</span>
      </div>
      <div class="order-options two" role="group" aria-label="앞면 예문 표시">
        ${Object.entries(FRONT_EXAMPLE_LABELS)
          .map(
            ([mode, label]) => `
              <button class="order-option ${state.frontExampleMode === mode ? "active" : ""}" type="button" data-action="set-front-example" data-front-example="${mode}" aria-pressed="${
                state.frontExampleMode === mode ? "true" : "false"
              }">
                <span>${label}</span>
                <small>${FRONT_EXAMPLE_DESCRIPTIONS[mode]}</small>
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
  const answerRate = getRoundAnswerRate(round);
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
      <p class="meta">첫 시도 ${firstAttemptCorrect}/${firstAttemptTotal} · 재풀이 포함 ${rateText(answerRate)} · 오답 ${number(
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
        <section class="dialog-panel round-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title" aria-describedby="round-detail-loading-message" tabindex="-1">
          <p class="eyebrow">회독 기록</p>
          <h2 id="study-dialog-title">자세히 불러오는 중</h2>
          <p id="round-detail-loading-message" class="meta">최근 회독의 풀이 기록을 정리하고 있습니다.</p>
          <div class="loading-lines" aria-hidden="true"><span></span><span></span><span></span></div>
        </section>
      </div>
    `;
    finishDialogRender();
    return;
  }
  const stats = getRoundDetailStats(detail);
  dialogRoot.innerHTML = `
    <div class="dialog-backdrop" role="presentation">
      <section class="dialog-panel round-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="study-dialog-title" aria-describedby="round-detail-summary">
        <div>
          <p class="eyebrow">회독 기록</p>
          <h2 id="study-dialog-title">${number(round.round_no)}회독 자세히</h2>
          <p id="round-detail-summary" class="meta">${escapeHtml(round.group_name || "소그룹")} · ${escapeHtml(
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
            <div><strong>${stats.answerRate}%</strong><span>재풀이 포함</span></div>
          </div>
          ${renderRoundTime(round)}
          ${renderRoundDetailSection("오답 카드", stats.wrongCards, "bad")}
          ${renderRoundDetailSection("첫 시도 정답 카드", stats.firstPassCards, "good")}
        </div>
        <button class="primary-button full" type="button" data-action="close-dialog">${iconLabel("check", "닫기")}</button>
      </section>
    </div>
  `;
}

function renderRoundDetailSection(title, cards, tone) {
  const emptyText = tone === "bad" ? "이 회독에서는 다시 볼 오답 카드가 없었습니다." : "첫 시도 정답 카드가 없습니다.";
  const visibleLimit = Math.max(ROUND_DETAIL_SECTION_PAGE_SIZE, number(state.roundDetail?.visibleLimits?.[tone]));
  const displayCards = cards.slice(0, visibleLimit);
  const hiddenCount = Math.max(0, cards.length - displayCards.length);
  return `
    <section class="round-detail-section">
      <div class="completion-header">
        <h3>${title}</h3>
        <span class="pill ${tone}">${cards.length}개</span>
      </div>
      ${
        cards.length
          ? `
            <div class="round-detail-list">${displayCards.map((card) => renderRoundDetailCard(card, tone)).join("")}</div>
            ${
              hiddenCount
                ? `<div class="list-footer">
                    <p>${number(displayCards.length)}/${number(cards.length)}개 표시 중입니다.</p>
                    <button class="secondary-button full" type="button" data-action="show-more-round-detail" data-section="${tone}">${iconLabel(
                      "chevron-down",
                      `${Math.min(ROUND_DETAIL_SECTION_PAGE_SIZE, hiddenCount)}개 더 보기`,
                    )}</button>
                  </div>`
                : cards.length > ROUND_DETAIL_SECTION_PAGE_SIZE
                  ? `<p class="list-performance-note">이 회독의 ${escapeHtml(title)} ${number(cards.length)}개를 모두 표시했습니다.</p>`
                  : ""
            }
          `
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
      <p>${renderMarkedText(card.back)}</p>
      <div class="attempt-timeline">${attempts.map(renderAttemptChip).join("")}</div>
    </article>
  `;
}

function isCardExamplesExpanded(session, card) {
  const override = session.expandedExamples?.[card.id];
  if (session.exampleDisplayMode === "expanded") return override !== false;
  return Boolean(override);
}

function isCardFrontExamplesExpanded(session, card) {
  return Boolean(session.frontExpandedExamples?.[card.id]);
}

function getStudyTextScriptClass(value) {
  const text = String(value || "");
  if (/[\u3040-\u30ff]/u.test(text)) return "script-jp";
  if (/[\u3400-\u9fff]/u.test(text)) return "script-cjk";
  if (/[A-Za-z]/.test(text)) return "script-latin";
  return "script-generic";
}

function getStudyTextDensityClass(value) {
  const length = Array.from(String(value || "").trim()).length;
  if (length > 72) return "density-long";
  if (length > 36) return "density-medium";
  return "density-short";
}

function shouldUseCjkCardMeta(value) {
  const script = getStudyTextScriptClass(value);
  return script === "script-jp" || script === "script-cjk";
}

function getSessionTitle(session) {
  if (session.studyMode === "practice") return "묶음 연습";
  return session.studyMode === "weak" ? "약점 복습" : `${session.roundNo}회독`;
}

function getSessionOrderLabel(session) {
  return session.studyMode === "weak" ? "오답순" : ORDER_LABELS[session.orderMode];
}

function hashString(value) {
  return String(value || "").split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0);
}

function getCompletionMascot(session) {
  if (!session.completionMascotId) {
    const round = session.savedRound || {};
    const seed = [session.studyMode, session.group?.name, round.id, round.completed_at, session.results?.length].join("|");
    session.completionMascotId = COMPLETION_MASCOTS[hashString(seed) % COMPLETION_MASCOTS.length].id;
  }
  return COMPLETION_MASCOTS.find((item) => item.id === session.completionMascotId) || COMPLETION_MASCOTS[0];
}

function getCompletionMascotCopy(session, summary, round) {
  if (session.studyMode === "practice") {
    return {
      title: "기록 없이 연습을 마쳤어요.",
      body: `${number(summary.uniqueCardCount)}개 카드를 묶어서 훑었습니다.`,
    };
  }
  if (session.studyMode === "weak") {
    return {
      title: "흔들린 카드까지 다시 잡았어요.",
      body: `약점 카드 ${number(summary.uniqueCardCount)}개를 끝까지 확인했습니다.`,
    };
  }
  return {
    title: `${number(round.round_no)}회독을 마쳤어요.`,
    body: `첫 시도 ${number(summary.firstPassCorrectCount)}/${number(summary.uniqueCardCount)} · 좋은 흐름이에요.`,
  };
}

function renderCompletionMascot(session, summary, round) {
  const mascot = getCompletionMascot(session);
  const copy = getCompletionMascotCopy(session, summary, round);
  return `
    <section class="completion-celebration" aria-label="회독 완료 축하">
      <img class="completion-mascot" src="${mascot.src}" alt="${escapeHtml(mascot.label)}" loading="lazy" />
      <div>
        <strong>${escapeHtml(copy.title)}</strong>
        <p>${escapeHtml(copy.body)}</p>
      </div>
    </section>
  `;
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
        <div class="completion-title-row">
          <div>
            <p class="eyebrow">완료</p>
            <h2 id="study-title">${completionTitle}</h2>
          </div>
          ${renderCompletionRecordBadge(session)}
        </div>
        ${renderCompletionMascot(session, summary, round)}
        ${renderCompletionRecordNote(session)}
        ${renderCompletionScoreboard(summary, round, session)}
        ${renderDurationComparison(round, session)}
        <p class="meta">${escapeHtml(session.group.name)} · ${getSessionOrderLabel(session)} · ${
          session.passNo
        }차 통과</p>
        ${renderRoundTime(round)}
        ${renderCompletionDetails(summary, session)}
        ${renderCompletionStickyActions(session)}
      </div>
    `;
    return;
  }
  const card = session.cards[session.index];
  const total = session.cards.length;
  const progress = Math.round(((session.index + 1) / total) * 100);
  const currentWrongCount = session.passResults.filter((item) => item.result === "wrong").length;
  const examplesExpanded = isCardExamplesExpanded(session, card);
  const frontExamplesExpanded = isCardFrontExamplesExpanded(session, card);
  const feedbackClass = session.answerFeedback ? `answer-feedback-${session.answerFeedback}` : "";
  const feedbackLabel = session.answerFeedback === "correct" ? "정답" : "오답";
  const frontClass = `grammar ${getStudyTextScriptClass(card.front)} ${getStudyTextDensityClass(card.front)}`;
  views.study.innerHTML = `
    <div class="stack study-shell">
      <input id="study-controller-input" class="study-controller-input" type="text" inputmode="none" autocomplete="off" autocapitalize="none" spellcheck="false" tabindex="-1" aria-hidden="true" />
      <div class="row">
        <div>
          <p class="eyebrow">${escapeHtml(session.group.name)} · ${getSessionOrderLabel(session)} · ${
            session.passNo
          }차</p>
          <h2 id="study-title">${getSessionTitle(session)}</h2>
        </div>
        <div class="study-session-controls">
          <button class="ghost-button small-button" type="button" data-action="edit-card-in-session" data-card-id="${card.id}" aria-label="카드 수정">${icon("pencil")}</button>
          <button class="ghost-button small-button" type="button" data-action="quit-study" ${
            session.isAnswering || session.saving ? "disabled" : ""
          }>${iconLabel("x", "포기")}</button>
          <span id="study-elapsed" class="timer-pill">${formatDuration(elapsedSeconds(session))}</span>
          <span class="pill">${session.passNo}차 ${session.index + 1}/${total}</span>
        </div>
      </div>
      <div class="progress" aria-hidden="true"><span style="width: ${progress}%"></span></div>
      <div class="study-quick-stats">
        <span>남은 ${Math.max(0, total - session.index)}개</span>
        <span>이번 차수 오답 ${currentWrongCount}개</span>
        <span id="study-controller-status" class="study-controller-status ${
          studyGamepadConnected || hasRecentStudyControllerInput() ? "active" : ""
        }" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(getStudyControllerStatusText())}</span>
      </div>
      <div class="study-card ${session.showingBack ? "back" : "front"} ${feedbackClass}" ${
        session.showingBack
          ? ""
          : `data-action="flip-card" role="button" tabindex="0" aria-label="카드 앞면. 탭해서 뜻 보기"`
      }>
        ${
          session.answerFeedback
            ? `<div class="answer-feedback-label ${feedbackClass}" role="status" aria-live="polite" aria-atomic="true">${feedbackLabel}</div>`
            : ""
        }
        ${
          session.showingBack
            ? renderCardBack(card, examplesExpanded)
            : `<div class="study-front-content">${renderStudyCardMeta(
                card.group_name,
                card,
              )}<div class="${frontClass}">${renderMarkedText(card.front)}</div>${renderStudyFrontExamples(
                card,
                session,
                frontExamplesExpanded,
              )}<p class="study-hint">탭해서 뜻 보기</p></div>`
        }
      </div>
      <div class="study-action-bar ${feedbackClass}">
        ${
          session.saving
            ? `<button class="primary-button full" type="button" disabled>${iconLabel("save", "결과 저장 중")}</button>`
            : session.showingBack
            ? `<div class="study-actions"><button class="answer-wrong" type="button" data-action="answer-card" data-result="wrong" ${
                session.isAnswering ? "disabled" : ""
              }>${iconLabel("x", "오답")}</button><button class="answer-correct" type="button" data-action="answer-card" data-result="correct" ${
                session.isAnswering ? "disabled" : ""
              }>${iconLabel("check", "정답")}</button></div>`
            : `<button class="secondary-button full reveal-button" type="button" data-action="flip-card">${iconLabel(
                "eye",
                "뜻 보기",
              )}</button>`
        }
      </div>
    </div>
  `;
  focusStudyControllerInputSoon();
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

function getCompletionModeLabel(session) {
  if (session.studyMode === "practice") return "기록 없는 연습";
  if (session.studyMode === "weak") return "약점 복습";
  return "공식 회독";
}

function renderCompletionRecordBadge(session) {
  const label = getCompletionModeLabel(session);
  const tone = session.studyMode === "practice" ? "muted" : session.studyMode === "weak" ? "review" : "done";
  return `<span class="status-pill ${tone}">${label}</span>`;
}

function renderCompletionRecordNote(session) {
  if (session.studyMode === "practice") {
    return `
      <section class="completion-record-note practice">
        <strong>공식 기록에 저장하지 않았습니다.</strong>
        <p>묶음 연습은 지금 선택한 소그룹 카드만 임시로 합쳐 본 결과입니다. 회독 수, 정답률, 학습 이력에는 반영되지 않습니다.</p>
      </section>
    `;
  }
  if (session.studyMode === "weak") {
    return `
      <section class="completion-record-note review">
        <strong>공식 회독에 저장하지 않았습니다.</strong>
        <p>약점 복습은 오답 기준에 걸린 카드를 따로 훑어본 결과입니다. 소그룹 회독 수, 공식 정답률, 학습 이력에는 반영하지 않습니다.</p>
      </section>
    `;
  }
  return "";
}

function renderCompletionScoreboard(summary, round, session) {
  const answerRate = summary.totalAttempts ? Math.round((number(round.correct_count) / summary.totalAttempts) * 100) : 0;
  const firstAttemptRate = summary.uniqueCardCount
    ? Math.round((summary.firstPassCorrectCount / summary.uniqueCardCount) * 100)
    : 0;
  const modeLabel = getCompletionModeLabel(session);
  const modeClass = session.studyMode === "practice" ? "practice" : session.studyMode === "weak" ? "review" : "";
  return `
    <div class="completion-scoreboard ${modeClass}">
      <div class="completion-main-score">
        <span>${modeLabel} 결과</span>
        <strong>${firstAttemptRate}%</strong>
        <p>첫 시도 ${summary.firstPassCorrectCount}/${summary.uniqueCardCount} · 재풀이 포함 ${answerRate}%</p>
      </div>
      <div class="completion-metric-grid">
        <div><strong>${summary.uniqueCardCount}</strong><span>학습 카드</span></div>
        <div><strong>${summary.repeatedCardCount}</strong><span>오답 카드</span></div>
        <div><strong>${summary.totalAttempts}</strong><span>총 풀이</span></div>
        <div><strong>${formatDuration(round.duration_seconds)}</strong><span>소요시간</span></div>
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
  scrollIntoViewSafely(document.getElementById(targetId), { block: "start" });
}

function getCompletionActionConfig(session) {
  if (session.studyMode === "practice") {
    return {
      primary: { action: "completion-practice-again", icon: "repeat-2", label: "묶음 다시 고르기" },
      secondary: { action: "completion-collection-detail", icon: "arrow-left", label: "대그룹 보기" },
    };
  }
  if (session.studyMode === "weak") {
    return {
      primary: { action: "completion-weak-list", icon: "target", label: "약점 목록 보기" },
      secondary: { action: "completion-study-home", icon: "arrow-left", label: "학습 홈" },
    };
  }
  return {
    primary: { action: "completion-next-round", icon: "repeat-2", label: "다음 회독" },
    secondary: { action: "completion-group-list", icon: "arrow-left", label: "소그룹 선택" },
  };
}

function renderCompletionStickyActions(session) {
  const actions = getCompletionActionConfig(session);
  return `
    <div class="completion-sticky-actions" aria-label="완료 후 작업">
      <button class="primary-button full" type="button" data-action="${actions.primary.action}">
        ${iconLabel(actions.primary.icon, actions.primary.label)}
      </button>
      <button class="secondary-button full" type="button" data-action="${actions.secondary.action}">
        ${iconLabel(actions.secondary.icon, actions.secondary.label)}
      </button>
      <button class="ghost-button full" type="button" data-action="scroll-completion-section" data-target="completion-summary">
        ${iconLabel("chevron-up", "요약")}
      </button>
    </div>
  `;
}

function takeCompletionSessionSnapshot() {
  const session = state.session;
  if (!session) return null;
  const snapshot = {
    mode: session.studyMode,
    collectionId: session.collection?.id || null,
    groupId: session.studyMode === "weak" ? null : session.group?.id || null,
    selectedGroupIds: (session.selectedGroups || []).map((group) => group.id),
  };
  if (snapshot.mode === "practice") {
    state.selectedCollectionId = snapshot.collectionId;
    state.selectedStudyGroupIds = snapshot.selectedGroupIds;
  } else if (snapshot.mode !== "weak") {
    state.selectedGroupId = snapshot.groupId;
    state.selectedCollectionId = snapshot.collectionId || state.selectedCollectionId;
  }
  state.session = null;
  state.completionCorrectOpen = false;
  state.activeDialog = null;
  return snapshot;
}

function navigateFromCompletion(target) {
  const snapshot = takeCompletionSessionSnapshot();
  if (!snapshot) return;
  if (target === "next-round") {
    state.studyStep = "ready";
    state.activeDialog = "start";
  } else if (target === "group-list") {
    state.selectedGroupId = null;
    state.studyStep = state.selectedCollectionId ? "collection" : "select";
  } else if (target === "practice-again") {
    state.studyStep = "collection";
    state.activeDialog = "collection-study-picker";
  } else if (target === "collection-detail") {
    state.studyStep = "collection";
  } else if (target === "weak-list") {
    state.studyStep = "select";
    state.weakPanelOpen = true;
  } else {
    state.studyStep = "select";
  }
  render();
  scrollToTop();
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
      ${renderCompletionSection("첫 시도 정답 카드", firstPassItems, "good", {
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
      <p>${renderMarkedText(hardest.card.back)}</p>
      <p class="meta">${hardest.wrongCount}번 오답 후 ${lastAttempt.passNo}차에서 통과했어요.</p>
    </section>
  `;
}

function renderWrongReview(summary, session) {
  const sessionLabel = session.studyMode === "weak" ? "복습" : session.studyMode === "practice" ? "연습" : "회독";
  return `
    <section id="wrong-review" class="completion-section">
      <div class="completion-header">
        <h3>오답 카드 다시 보기</h3>
        <span class="pill bad">${summary.wrongCardSummaries.length}개</span>
      </div>
      ${
        summary.wrongCardSummaries.length
          ? `<p class="meta completion-section-copy">이번 ${sessionLabel}에서 흔들렸던 카드입니다. 뜻과 시도 흐름을 같이 확인하세요.</p><div class="wrong-review-list">${summary.wrongCardSummaries.map(renderWrongReviewCard).join("")}</div>`
          : `<p class="meta">이번 ${sessionLabel}에서 다시 볼 오답 카드가 없습니다.</p>`
      }
    </section>
  `;
}

function renderCorrectCollapsedSummary(count, controlsId = "correct-review-list") {
  return `
    <div class="completion-collapsed-summary">
      <div>
        <strong>첫 시도 정답 카드 ${count}개</strong>
        <p>확인이 필요할 때만 목록을 펼쳐서 봅니다.</p>
      </div>
      <button class="secondary-button small-button" type="button" data-action="toggle-completion-correct" aria-expanded="false" aria-controls="${escapeHtml(
        controlsId,
      )}">
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
      <section class="wrong-review-block">
        <span class="study-section-label">뜻</span>
        <p class="wrong-review-meaning">${renderMarkedText(summary.card.back)}</p>
      </section>
      <section class="wrong-review-block">
        <span class="study-section-label">시도 흐름</span>
        <div class="attempt-timeline">
          ${summary.attempts.map(renderAttemptChip).join("")}
        </div>
      </section>
      ${
        summary.card.memo
          ? `<section class="wrong-review-block"><span class="study-section-label">메모</span><p class="study-note">${renderMarkedText(
              summary.card.memo,
            )}</p></section>`
          : ""
      }
      ${
        visibleExamples.length
          ? `<section class="wrong-review-block"><span class="study-section-label">예문</span><ul class="review-examples">${visibleExamples
              .map(
                (example) => `
                  <li>
                    <p class="example-jp">${renderMarkedJapaneseText(example.japanese)}</p>
                    ${example.korean ? `<p class="example-ko">${renderMarkedText(example.korean)}</p>` : ""}
                  </li>
                `,
              )
              .join("")}</ul></section>`
          : `<p class="meta">예문 없음</p>`
      }
      ${examples.length > visibleExamples.length ? `<p class="meta">예문 ${examples.length - visibleExamples.length}개 더 있음</p>` : ""}
    </article>
  `;
}

function renderAttemptChip(item) {
  const label = item.result === "correct" ? "정답" : "오답";
  const tone = item.result === "correct" ? "good" : "bad";
  return `<span class="attempt-chip ${tone}">${number(item.passNo || item.attempt_no || 1)}차 ${label}</span>`;
}

function renderCompletionSection(title, items, tone, options = {}) {
  const emptyText = tone === "bad" ? "이번 회독에서 오답 카드가 없습니다." : "첫 시도 정답 카드가 없습니다.";
  const isCollapsed = Boolean(options.collapsible && !options.open && items.length);
  const sectionId = options.id ? ` id="${escapeHtml(options.id)}"` : "";
  const titleId = options.id ? `${options.id}-title` : "";
  const listId = options.id ? `${options.id}-list` : "";
  return `
    <section${sectionId} class="completion-section"${titleId ? ` aria-labelledby="${escapeHtml(titleId)}"` : ""}>
      <div class="completion-header">
        <h3${titleId ? ` id="${escapeHtml(titleId)}"` : ""}>${title}</h3>
        <div class="completion-header-actions">
          <span class="pill ${tone}">${items.length}개</span>
          ${
            options.collapsible && items.length && options.open
              ? `<button class="ghost-button small-button" type="button" data-action="toggle-completion-correct" aria-expanded="true" aria-controls="${escapeHtml(
                  listId,
                )}">
                  ${iconLabel("chevron-up", "목록 접기")}
                </button>`
              : ""
          }
        </div>
      </div>
      ${
        isCollapsed
          ? renderCorrectCollapsedSummary(items.length, listId)
          : items.length
          ? `<div class="result-list"${listId ? ` id="${escapeHtml(listId)}"` : ""}>${items
              .map((item) => renderResultItem(item, tone))
              .join("")}</div>`
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
      <p>${renderMarkedText(item.card.back)}</p>
    </article>
  `;
}

function renderStudyFrontExamples(card, session, examplesExpanded = false) {
  if (session.frontExampleMode !== "shown") return "";
  const examples = (card.examples || []).filter((item) => item.japanese);
  const visibleExamples = examplesExpanded ? examples : examples.slice(0, 1);
  if (!examples.length) return "";
  return `
    <section class="front-example-hint" aria-label="앞면 예문 힌트">
      <div class="front-example-header">
        <span class="study-section-label">예문 힌트</span>
        <span class="pill">${examples.length}개</span>
      </div>
      <ul class="front-examples">${visibleExamples
        .map(
          (example) => `
            <li class="front-example">
              <p class="example-jp">${renderMarkedJapaneseText(example.japanese)}</p>
            </li>
          `,
        )
        .join("")}</ul>
      ${
        examples.length > 1
          ? `<button class="ghost-button full front-example-toggle" type="button" data-action="toggle-front-examples">${
              iconLabel(
                examplesExpanded ? "chevron-up" : "chevron-down",
                examplesExpanded ? "예문 접기" : `예문 ${examples.length - 1}개 더 보기`,
              )
            }</button>`
          : ""
      }
    </section>
  `;
}

function renderCardBack(card, examplesExpanded = false) {
  const examples = card.examples || [];
  const visibleExamples = examplesExpanded ? examples : examples.slice(0, 1);
  return `
    <div class="study-back-content">
      ${renderStudyCardMeta(card.front, card, shouldUseCjkCardMeta(card.front), true)}
      <section class="study-back-section meaning-section">
        <span class="study-section-label">뜻</span>
        <div class="meaning">${renderMarkedText(card.back)}</div>
      </section>
      ${
        card.memo
          ? `<section class="study-back-section"><span class="study-section-label">메모</span><p class="study-note">${renderMarkedText(
              card.memo,
            )}</p></section>`
          : ""
      }
      <section class="study-back-section example-section">
        <div class="example-header">
          <span>예문</span>
          <span class="pill">${examples.length}개</span>
        </div>
        ${
          examples.length
            ? `
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
            : `<p class="meta study-empty-note">예문 없음</p>`
        }
      </section>
    </div>
  `;
  finishDialogRender();
}

function renderStudyCardMeta(label, card, japanese = false, marked = false) {
  return `
    <div class="study-card-meta">
      <p class="meta ${japanese ? "jp-text" : ""}">${marked ? renderMarkedText(label) : escapeHtml(label)}</p>
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
  const hasGroupFilter = getCardFilterGroups().some((group) => String(group.id) === String(state.cardFilterGroupId));
  const filteredCards = hasGroupFilter
    ? state.cards.filter((card) => String(card.group_id) === String(state.cardFilterGroupId))
    : hasCollectionFilter
      ? state.cards.filter((card) => String(card.collection_id) === String(state.cardFilterCollectionId))
      : [];
  const cardSearchNeedle = normalizeSearchQuery(state.cardSearchQuery);
  const visibleCards = cardSearchNeedle
    ? filteredCards.filter((card) => cardMatchesQuery(card, cardSearchNeedle))
    : filteredCards;
  views.cards.innerHTML = showForm
    ? renderCardEditorPanel(editing, formGroupId)
    : renderCardListPanel(visibleCards, filteredCards);
}

function renderCardEditorPanel(editing, formGroupId) {
  const hasGroups = state.groups.length > 0;
  const formGroup = state.groups.find((group) => Number(group.id) === Number(formGroupId));
  const formPath = formGroup
    ? `저장 위치: ${formGroup.collection_name || "대그룹 없음"} / ${formGroup.name}`
    : "카드를 저장할 소그룹을 먼저 선택하세요.";
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
      ${renderOrientationNote(["카드 관리", editing ? "카드 수정" : "카드 등록"], formPath, { exposeNote: true })}
      ${
        editing
          ? `<p class="meta">수정한 내용은 저장 후 카드 목록에서 다시 확인할 수 있어요.</p>`
          : `<div class="segmented two" role="group" aria-label="카드 등록 방식">
              <button class="segment ${state.cardEntryMode === "single" ? "active" : ""}" type="button" data-action="set-card-entry-mode" data-mode="single" aria-pressed="${
                state.cardEntryMode === "single" ? "true" : "false"
              }">한 장</button>
              <button class="segment ${state.cardEntryMode === "bulk" ? "active" : ""}" type="button" data-action="set-card-entry-mode" data-mode="bulk" aria-pressed="${
                state.cardEntryMode === "bulk" ? "true" : "false"
              }">여러 장</button>
            </div>`
      }
      ${
        hasGroups
          ? state.cardEntryMode === "bulk" && !editing
            ? renderBulkCardForm(formGroupId)
            : renderCardForm(editing, formGroupId)
          : renderActionEmptyState({
              title: state.collections.length ? "소그룹을 먼저 만들어 주세요." : "첫 대그룹을 만들어 주세요.",
              body: state.collections.length
                ? "카드는 소그룹에 저장됩니다. 소그룹을 만든 뒤 바로 카드를 등록할 수 있습니다."
                : "대그룹 아래에 소그룹을 만들고, 카드는 소그룹에 저장합니다.",
              action: state.collections.length ? "open-group-form" : "go-groups",
              label: state.collections.length ? "소그룹 만들기" : "대그룹 만들기",
            })
      }
    </div>
  `;
}

function renderCardListPanel(visibleCards, filteredCards = visibleCards) {
  const collectionGroups = getCardFilterGroups();
  const selectedCardGroup = collectionGroups.find((group) => String(group.id) === String(state.cardFilterGroupId));
  const totalPages = Math.max(1, Math.ceil(visibleCards.length / CARD_PAGE_SIZE));
  const page = Math.min(state.cardPage, totalPages - 1);
  const displayCards = visibleCards.slice(page * CARD_PAGE_SIZE, (page + 1) * CARD_PAGE_SIZE);
  const cardCreateDisabledReason = "카드는 소그룹에 저장됩니다. 먼저 소그룹을 만들어 주세요.";
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
        state.groups.length ? "" : `disabled aria-describedby="${getDisabledReasonId(cardCreateDisabledReason)}"`
      }>${iconLabel("plus", "카드 등록")}</button>
      ${state.groups.length ? "" : renderDisabledReason(cardCreateDisabledReason)}
      ${
        state.collections.length
          ? `<div class="card-filter-grid">
              <select id="card-collection-filter" class="select" aria-label="카드 대그룹 필터">
                <option value="" ${state.cardFilterCollectionId ? "" : "selected"}>대그룹 선택</option>
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
                state.cardFilterCollectionId ? "" : "disabled"
              }>
                <option value="" ${state.cardFilterGroupId ? "" : "selected"}>${
                  state.cardFilterCollectionId
                      ? "소그룹 전체"
                      : "-"
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
      ${renderCardFilterSummary(filteredCards.length, visibleCards.length)}
      ${
        selectedCardGroup && filteredCards.length
          ? `<div class="card-list-danger-actions">
              <button class="danger-button full" type="button" data-action="delete-group-cards" data-group-id="${
                selectedCardGroup.id
              }">${iconLabel("trash", "이 소그룹 카드 전체 삭제")}</button>
            </div>`
          : ""
      }
      ${renderSearchInput({ id: "card-search", value: state.cardSearchQuery, placeholder: "카드 검색" })}
      <div class="card-list">
      ${
        displayCards.length
          ? displayCards.map(renderCardListItem).join("")
          : renderCardListEmptyState(filteredCards)
      }
      </div>
      ${visibleCards.length > CARD_PAGE_SIZE ? renderStudyPagination(page, totalPages, "card") : ""}
    </div>
  `;
}

function renderCardForm(card, groupId) {
  const examples = card?.examples?.length ? card.examples : [{ japanese: "", korean: "" }];
  const selection = getCardFormSelection(groupId);
  const groupMissingPanel = !selection.groups.length
    ? renderActionEmptyState({
        title: "선택한 대그룹에 소그룹이 없습니다.",
        body: "카드를 저장하려면 이 대그룹 안에 소그룹이 필요합니다.",
        action: "open-group-form-for-collection",
        label: "소그룹 만들기",
        attrs: `data-collection-id="${selection.collectionId || ""}"`,
      })
    : "";
  return `
    <form id="card-form" class="stack">
      ${renderCardLocationPicker(selection, { collection: "card-form-collection", group: "card-form-group" })}
      ${
        groupMissingPanel ||
        `
      <label class="field"><span>앞면</span><input id="card-front-input" class="input" name="front" value="${escapeHtml(
        card?.front || "",
      )}" placeholder="〜あまり" required aria-describedby="card-duplicate-warning" autocomplete="off" enterkeyhint="next" /></label>
      <p id="card-duplicate-warning" class="duplicate-warning" role="alert" hidden></p>
      <label class="field"><span>뒷면</span><textarea id="card-back-textarea" class="textarea" name="back" placeholder="~한 나머지" required>${escapeHtml(
        card?.back || "",
      )}</textarea></label>
      <label class="field"><span>메모</span><textarea id="card-memo-textarea" class="textarea" name="memo" placeholder="접속, 뉘앙스, 헷갈리는 표현">${escapeHtml(
        card?.memo || "",
      )}</textarea></label>
      <label class="checkbox-field">
        <input type="checkbox" name="study_excluded" ${isCardStudyExcluded(card) ? "checked" : ""} />
        <span>
          <strong>학습에서 제외</strong>
          <small>카드는 남겨두고 회독, 묶음 연습, 약점 복습에서만 빼둡니다.</small>
        </span>
      </label>
      <div class="field">
        ${renderFieldLabel("예문", "앞면, 뒷면, 메모, 예문에서 강조할 조각은 [[ ]]로 감싸면 학습 화면에서 하이라이트됩니다.")}
        <div id="example-editor-list" class="example-editor-list">${examples
          .map((example, index) => renderExampleEditorRow(example, index))
          .join("")}</div>
      </div>
      <button class="ghost-button full" type="button" data-action="add-example">${iconLabel("plus", "예문 추가")}</button>
      <div class="form-actions card-form-actions">
        <button class="ghost-button" type="button" data-action="show-card-list">${iconLabel(
          card ? "x" : "list",
          card ? "취소" : "목록 보기",
        )}</button>
        <button class="primary-button" type="submit">${iconLabel("save", card ? "저장" : "등록 후 계속")}</button>
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
    ? renderActionEmptyState({
        title: "선택한 대그룹에 소그룹이 없습니다.",
        body: "대량 등록도 소그룹 하나를 저장 위치로 사용합니다.",
        action: "open-group-form-for-collection",
        label: "소그룹 만들기",
        attrs: `data-collection-id="${selection.collectionId || ""}"`,
      })
    : "";
  return `
    <form id="bulk-card-form" class="stack">
      ${renderCardLocationPicker(selection, { collection: "bulk-card-collection", group: "bulk-card-group" })}
      ${
        groupMissingPanel ||
        `
      <div class="bulk-mode-note">
        <strong>여러 장 보조 등록</strong>
        <span>미리보기로 오류와 중복을 확인한 뒤 한 번에 저장합니다.</span>
      </div>
      <div class="field">
        <div class="field-label-row">
          <label for="bulk-card-textarea">카드</label>
          ${renderHelpDisclosure(
            "대량 등록 형식 안내",
            "한 줄에 한 장씩 입력합니다. 구분자는 | 또는 탭을 쓰고, 예문 번역은 => 뒤에 적습니다. 앞면, 뒷면, 메모, 예문에서 강조할 조각은 [[ ]]로 감쌉니다.",
          )}
        </div>
        <textarea id="bulk-card-textarea" class="textarea bulk-textarea" name="bulk_text" aria-describedby="bulk-card-help" placeholder="〜あまり | ~한 나머지 | 메모 | 緊張の[[あまり]]、声が震えた。 => 긴장한 나머지 목소리가 떨렸다.&#10;〜に至っては | ~에 이르러서는">${escapeHtml(
          state.bulkDraftText,
        )}</textarea>
        <small id="bulk-card-help" class="form-hint">한 줄에 한 장씩 입력한 뒤 미리보기로 확인합니다.</small>
      </div>
      <button class="secondary-button full" type="submit">${iconLabel("eye", "미리보기")}</button>
      ${preview ? renderBulkPreview(preview) : ""}
        `
      }
    </form>
  `;
}

function renderBulkPreview(preview) {
  const canCreate = preview.items.length > 0 && !preview.errors.length && preview.warningCount === 0;
  const isPending = state.pendingRequest?.action === "confirm-bulk-cards";
  const displayItems = preview.items.slice(0, BULK_PREVIEW_RENDER_LIMIT);
  const hiddenCount = Math.max(0, preview.items.length - displayItems.length);
  const statusText = preview.errors.length
    ? "형식 오류가 있습니다."
    : preview.warningCount
      ? "중복을 확인하세요."
      : "등록할 수 있습니다.";
  const disabledReason = preview.errors.length
    ? "형식 오류를 고치면 등록할 수 있습니다."
    : preview.warningCount
      ? "중복 카드를 정리하면 등록할 수 있습니다."
      : preview.items.length
        ? ""
        : "등록할 카드가 없습니다.";
  return `
    <section class="bulk-preview ${isPending ? "is-pending" : ""}" aria-labelledby="bulk-preview-title" aria-busy="${isPending ? "true" : "false"}">
      <div class="completion-header">
        <div>
          <h3 id="bulk-preview-title">등록 미리보기</h3>
          <p class="meta">${escapeHtml(statusText)}</p>
        </div>
        <span class="pill ${canCreate ? "good" : preview.errors.length ? "bad" : ""}">${preview.items.length}개</span>
      </div>
      ${
        preview.errors.length
          ? `<div class="bulk-issues bad" role="alert">${preview.errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}</div>`
          : ""
      }
      ${
        preview.warningCount
          ? `<div class="bulk-issues warn" role="alert"><p>중복 카드 ${preview.warningCount}건이 있습니다. 중복을 정리한 뒤 미리보기를 다시 눌러 주세요.</p></div>`
          : ""
      }
      <div class="bulk-preview-list">
        ${displayItems.map(renderBulkPreviewItem).join("")}
      </div>
      ${
        hiddenCount
          ? `<p class="bulk-preview-note">미리보기는 먼저 ${number(
              displayItems.length,
            )}개만 표시합니다. 등록하면 미리보기에서 확인한 ${number(preview.items.length)}개가 모두 저장됩니다.</p>`
          : ""
      }
      ${isPending ? `<p class="pending-note" role="status">등록 중입니다. 잠시만 기다려 주세요.</p>` : ""}
      <button class="primary-button full ${isPending ? "is-pending" : ""}" type="button" data-action="confirm-bulk-cards" ${
        canCreate && !isPending ? "" : "disabled"
      }>${iconLabel(
        "check",
        isPending ? state.pendingRequest.label : "미리보기대로 등록",
      )}</button>
      ${canCreate || !disabledReason ? "" : renderDisabledReason(disabledReason)}
    </section>
  `;
}

function renderBulkPreviewItem(item) {
  return `
    <article class="bulk-preview-item ${item.warnings.length ? "warn" : ""}">
      <div class="item-title">
        <strong>${item.front ? renderJapaneseText(item.front) : "앞면 없음"}</strong>
        <span class="pill ${item.warnings.length ? "bad" : ""}">${item.lineNo}줄</span>
      </div>
      <p class="meaning">${renderMarkedText(item.back || "뒷면 없음")}</p>
      <p class="meta">메모 ${item.memo ? "있음" : "없음"} · 예문 ${item.examples.length}개</p>
      ${
        item.examples[0]
          ? `<div class="card-preview-example"><p class="example-jp">${renderMarkedJapaneseText(
              item.examples[0].japanese,
            )}</p>${item.examples[0].korean ? `<p class="example-ko">${renderMarkedText(item.examples[0].korean)}</p>` : ""}</div>`
          : ""
      }
      ${
        item.warnings.length
          ? `<div class="bulk-row-issues">${item.warnings
              .map((warning) => `<p>${escapeHtml(warning)}</p>`)
              .join("")}</div>`
          : ""
      }
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
      </div>
    </div>
  `;
}

function renderCardListItem(card) {
  const total = number(card.correct_count) + number(card.wrong_count);
  const exampleCount = card.examples?.length || 0;
  const hasMemo = Boolean(card.memo);
  const excluded = isCardStudyExcluded(card);
  return `
    <article class="card-item ${excluded ? "study-excluded" : ""}">
      <div class="card-item-main">
        <p class="card-path">${escapeHtml(getCardPath(card))}</p>
        <strong class="card-front">${renderJapaneseText(card.front)}</strong>
        <p class="card-back">${renderMarkedText(card.back)}</p>
      </div>
      ${
        card.examples?.[0]
          ? `<div class="card-preview-example compact"><p class="example-jp">${renderMarkedJapaneseText(
              card.examples[0].japanese,
            )}</p>${card.examples[0].korean ? `<p class="example-ko">${renderMarkedText(card.examples[0].korean)}</p>` : ""}</div>`
          : ""
      }
      <div class="card-meta-strip">
        ${excluded ? `<span class="card-meta-excluded">학습 제외</span>` : ""}
        <span>예문 ${exampleCount}개</span>
        <span>메모 ${hasMemo ? "있음" : "없음"}</span>
        <span>정답 ${number(card.correct_count)}</span>
        <span>오답 ${number(card.wrong_count)}</span>
        <span>총 ${total}</span>
      </div>
      <div class="card-actions quiet-actions">
        <button class="ghost-button" type="button" data-action="toggle-card-exclusion" data-card-id="${card.id}">${iconLabel(
          excluded ? "check" : "x",
          excluded ? "학습 포함" : "학습 제외",
        )}</button>
        <button class="ghost-button" type="button" data-action="edit-card" data-card-id="${card.id}">${iconLabel(
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
    matchesQuery([collection.name, collection.description], state.collectionSearchQuery),
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
      </div>
      ${renderOrientationNote(
        ["묶음", "대그룹 목록", editing ? "대그룹 수정" : "대그룹 만들기"],
        "대그룹은 소그룹을 담는 상위 구조입니다.",
        { exposeNote: true },
      )}
      <form id="collection-form" class="stack">
        <label class="field"><span>대그룹명</span><input class="input" name="name" value="${escapeHtml(
          editing?.name || "",
        )}" placeholder="영어 단어 꼬꼬세트" required /></label>
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
  const selectedCollection = state.collections.find((collection) => Number(collection.id) === Number(selectedCollectionId));
  const lockCollection = Boolean(state.groupDetailCollectionId && selectedCollection);
  const collectionField = lockCollection
    ? `
        <section class="group-form-context">
          <span>대그룹</span>
          <strong>${escapeHtml(selectedCollection.name)}</strong>
          <input type="hidden" name="collection_id" value="${selectedCollection.id}" />
        </section>
      `
    : `<label class="field"><span>대그룹</span><select class="select" name="collection_id" required>${collectionOptions(
        selectedCollectionId,
      )}</select></label>`;
  return `
    <div class="panel stack">
      <div class="row">
        <div>
          <p class="eyebrow">소그룹</p>
          <h2 id="groups-title">${editing ? "소그룹 수정" : "소그룹 만들기"}</h2>
        </div>
      </div>
      ${renderOrientationNote(
        ["묶음", selectedCollection?.name || "대그룹 선택", editing ? "소그룹 수정" : "소그룹 만들기"],
        "소그룹은 공식 회독과 통계가 저장되는 학습 단위입니다.",
        { exposeNote: true },
      )}
      ${editing ? `<p class="meta">소그룹명과 설명만 바뀌고, 카드와 학습 기록은 유지됩니다.</p>` : ""}
      <form id="group-form" class="stack">
        ${collectionField}
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

function renderCollectionEmptyState() {
  if (state.collections.length) {
    return renderActionEmptyState({
      title: "검색된 대그룹이 없습니다.",
      body: "검색어를 지우면 전체 대그룹을 다시 볼 수 있습니다.",
      action: "clear-search",
      label: "검색어 지우기",
      iconName: "x",
      buttonClass: "secondary-button",
      attrs: `data-target="collection-search"`,
    });
  }
  return renderActionEmptyState({
    title: "첫 대그룹을 만들어 주세요.",
    body: "대그룹을 만든 뒤 안에서 소그룹과 카드를 이어서 관리할 수 있습니다.",
    action: "open-collection-form",
    label: "대그룹 만들기",
  });
}

function renderGroupEmptyState(collection) {
  if (getGroupsForCollection(collection.id).length) {
    return renderActionEmptyState({
      title: "검색된 소그룹이 없습니다.",
      body: "검색어를 지우면 이 대그룹의 소그룹을 다시 볼 수 있습니다.",
      action: "clear-search",
      label: "검색어 지우기",
      iconName: "x",
      buttonClass: "secondary-button",
      attrs: `data-target="group-search"`,
    });
  }
  return renderActionEmptyState({
    title: "아직 소그룹이 없습니다.",
    body: "공식 회독과 통계는 소그룹 단위로 저장됩니다.",
    action: "open-group-form-for-collection",
    label: "소그룹 만들기",
    attrs: `data-collection-id="${collection.id}"`,
  });
}

function renderGroupListPanel(visibleCollections) {
  return `
    <div class="panel stack">
      <div class="groups-page-header">
        <div>
          <p class="eyebrow">묶음 탭</p>
          <h2 id="groups-title">대그룹 관리</h2>
          <p class="meta">대그룹을 열어 소그룹을 관리합니다.</p>
        </div>
        <div class="groups-header-actions">
          <span class="pill">대그룹 ${visibleCollections.length}개</span>
          ${
            state.collections.length
              ? `<button class="primary-button small-button" type="button" data-action="open-collection-form">${iconLabel(
                  "plus",
                  "대그룹 만들기",
                )}</button>`
              : ""
          }
        </div>
      </div>
      ${
        state.collections.length
          ? renderSearchInput({ id: "collection-search", value: state.collectionSearchQuery, placeholder: "대그룹 검색" })
          : ""
      }
      <div class="group-list">
        ${visibleCollections.length ? visibleCollections.map(renderCollectionListItem).join("") : renderCollectionEmptyState()}
      </div>
    </div>
  `;
}

function renderCollectionDetailPanel(collection, visibleGroups) {
  const displayLimit = Math.max(GROUP_LIST_PAGE_SIZE, number(state.groupListLimit));
  const displayGroups = visibleGroups.slice(0, displayLimit);
  const hiddenCount = Math.max(0, visibleGroups.length - displayGroups.length);
  const collectionStudyCount = getCollectionStudyCardCount(collection);
  const collectionExcludedCount = getCollectionExcludedCardCount(collection);
  const bundleDisabledReason = collectionExcludedCount
    ? "학습 대상 카드가 없습니다. 제외한 카드를 다시 학습에 포함해 주세요."
    : "학습 대상 카드가 있는 소그룹이 있어야 기록 없는 묶음 연습을 시작할 수 있습니다.";
  return `
    <div class="panel stack">
      <div class="collection-detail-header">
        <button class="ghost-button small-button" type="button" data-action="back-to-collections">${iconLabel(
          "arrow-left",
          "대그룹 목록",
        )}</button>
        <div>
          <p class="eyebrow">대그룹 상세</p>
          <h2 id="groups-title">${escapeHtml(collection.name)}</h2>
        </div>
      </div>
      ${renderOrientationNote(["묶음", "대그룹 목록", collection.name], "이 대그룹 안에서 소그룹을 만들고 관리합니다.", {
        exposeNote: true,
      })}
      <section class="collection-detail-summary">
        <p>${escapeHtml(collection.description || "설명 없음")}</p>
        <div class="stat-grid">
          <div class="stat"><strong>${number(collection.group_count)}</strong><span>소그룹</span></div>
          <div class="stat"><strong>${number(collection.card_count)}</strong><span>전체 카드</span></div>
          <div class="stat"><strong>${number(collection.completed_rounds)}</strong><span>소그룹 회독</span></div>
        </div>
        <small>${escapeHtml(studyCountText(number(collection.card_count), collectionStudyCount, collectionExcludedCount))} · 공식 기록은 소그룹 기록 합산입니다. 묶음 연습은 공식 기록에 저장되지 않습니다.</small>
      </section>
      <div class="button-row">
        <button class="primary-button" type="button" data-action="open-group-form-for-collection" data-collection-id="${
          collection.id
        }">${iconLabel("plus", "소그룹 만들기")}</button>
        <button class="secondary-button" type="button" data-action="open-collection-study-dialog" ${
          collectionStudyCount ? "" : `disabled aria-describedby="${getDisabledReasonId(bundleDisabledReason)}"`
        }>${iconLabel("repeat-2", "묶음 연습")}</button>
      </div>
      ${
        collectionStudyCount
          ? ""
          : renderDisabledReason(bundleDisabledReason)
      }
      ${renderSearchInput({ id: "group-search", value: state.groupSearchQuery, placeholder: "소그룹 검색" })}
      <div class="group-list">
        ${
          displayGroups.length
            ? displayGroups.map(renderGroupListItem).join("")
            : renderGroupEmptyState(collection)
        }
      </div>
      ${
        hiddenCount
          ? `<div class="list-footer">
              <p>${number(displayGroups.length)}/${number(visibleGroups.length)}개 소그룹을 표시 중입니다.</p>
              <button class="secondary-button full" type="button" data-action="show-more-groups">${iconLabel(
                "chevron-down",
                `${Math.min(GROUP_LIST_PAGE_SIZE, hiddenCount)}개 더 보기`,
              )}</button>
            </div>`
          : visibleGroups.length > GROUP_LIST_PAGE_SIZE
            ? `<p class="list-performance-note">현재 조건의 소그룹 ${number(visibleGroups.length)}개를 모두 표시했습니다.</p>`
            : ""
      }
    </div>
  `;
}

function backupSummary(backup) {
  const payload = backup?.backup && typeof backup.backup === "object" ? backup.backup : backup || {};
  return {
    collections: Array.isArray(payload.collections) ? payload.collections.length : 0,
    groups: Array.isArray(payload.groups) ? payload.groups.length : 0,
    cards: Array.isArray(payload.cards) ? payload.cards.length : 0,
    rounds: Array.isArray(payload.study_rounds) ? payload.study_rounds.length : 0,
    hasSettings: Boolean(payload.settings && typeof payload.settings === "object"),
  };
}

function renderSafetyNote(title, body) {
  return `
    <article class="safety-note compact">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}

function renderPrivacyPanel() {
  return `
    <section class="panel stack data-safety-panel">
      <div>
        <p class="eyebrow">개인 데이터</p>
        <h2>저장 위치와 로그인</h2>
      </div>
      <div class="safety-note-grid">
        ${renderSafetyNote(
          "앱 안 로그인",
          "닉네임과 6자리 코드는 같은 학습 데이터를 다시 여는 개인용 구분값입니다. 강력한 계정 보안으로 보기는 어렵습니다.",
        )}
        ${renderSafetyNote(
          "서버 보호",
          "개인 서버에 올릴 때는 HTTPS와 서버 기본 인증 또는 리버스 프록시 보호를 함께 쓰는 구성을 권장합니다.",
        )}
        ${renderSafetyNote(
          "학습 데이터",
          "카드, 예문, 회독 기록은 서버의 SQLite 데이터베이스와 백업 JSON 파일에 그대로 저장됩니다.",
        )}
      </div>
    </section>
  `;
}

function renderBackupPanel() {
  return `
    <section class="panel stack data-safety-panel">
      <div class="row">
        <div>
          <p class="eyebrow">데이터 안전</p>
          <h2>백업과 복원</h2>
        </div>
        <button class="ghost-button small-button" type="button" data-action="toggle-data-panel">${iconLabel(
          state.dataPanelOpen ? "chevron-up" : "chevron-down",
          state.dataPanelOpen ? "접기" : "열기",
        )}</button>
      </div>
      ${
        state.dataPanelOpen
          ? `
            <div class="data-safety-summary">
              <strong>백업 파일에는 학습 데이터와 설정이 그대로 들어갑니다.</strong>
              <p>대그룹 ${number(state.collections.length)}개, 소그룹 ${number(state.groups.length)}개, 카드 ${number(
                state.cards.length,
              )}개와 예문, 회독 기록, 학습 설정이 포함됩니다. 파일은 개인 저장소에 보관하세요.</p>
            </div>
            <div class="button-row">
              <button class="secondary-button" type="button" data-action="export-backup">${iconLabel(
                "download",
                "백업 파일 만들기",
              )}</button>
              <label class="ghost-button file-button">${iconLabel("upload", "파일 선택")}<input id="backup-file-input" type="file" accept="application/json,.json" /></label>
            </div>
            <form id="backup-import-form" class="stack">
              <label class="field">
                <span>복원할 백업 JSON</span>
                <textarea id="backup-json" class="textarea backup-textarea" name="backup_json" placeholder="백업 JSON" aria-describedby="backup-error backup-help">${escapeHtml(
                  state.backupDraftText,
                )}</textarea>
                <small id="backup-help" class="form-hint">복원하면 현재 대그룹, 소그룹, 카드, 예문, 회독 기록과 학습 설정이 백업 파일 내용으로 교체됩니다.</small>
              </label>
              ${
                state.backupError
                  ? `<p id="backup-error" class="backup-error" role="alert">${escapeHtml(state.backupError)}</p>`
                  : ""
              }
              <button class="danger-button full" type="submit">${iconLabel("alert-triangle", "백업 복원")}</button>
            </form>
          `
          : `<p class="meta">카드 ${state.cards.length}개 · 대그룹 ${state.collections.length}개 · 소그룹 ${state.groups.length}개 · 예문과 회독 기록 포함</p>`
      }
    </section>
  `;
}

function renderSettings() {
  const examInfo = getExamDateInfo();
  const targetLabel = getTargetLabel();
  const targetDateLabel = targetLabel === "목표" ? "목표일" : `${targetLabel} 목표일`;
  const hasTargetSettings = Boolean(state.settings?.target_name || state.settings?.jlpt_exam_date);
  const clearTargetDisabledReason = "초기화할 학습 목표가 아직 없습니다.";
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
        <section class="settings-subsection">
          ${renderSectionHeading(
            "목표 표시",
            "목표 이름과 목표일은 선택 사항입니다. 일본어가 아니라도 시험명, 프로젝트명, 단어장 이름처럼 자유롭게 적을 수 있습니다.",
          )}
          ${renderTargetNameField()}
          ${renderExamDateSelects()}
        </section>
        ${renderWeakThresholdSetting()}
        ${renderControllerMappingSetting()}
        <div class="form-actions settings-form-actions">
          <button class="ghost-button" type="button" data-action="clear-exam-date" ${
            hasTargetSettings ? "" : `disabled aria-describedby="${getDisabledReasonId(clearTargetDisabledReason)}"`
          }>${iconLabel("rotate-ccw", "초기화")}</button>
          <button class="primary-button" type="submit">${iconLabel("save", "저장")}</button>
        </div>
        ${hasTargetSettings ? "" : renderDisabledReason(clearTargetDisabledReason)}
      </form>
    </div>
    ${renderPrivacyPanel()}
    ${renderBackupPanel()}
  `;
}

function renderTargetNameField() {
  return `
    <div class="field">
      ${renderFieldLabel("목표 이름")}
      <input id="target-name-input" class="input" name="target_name" value="${escapeHtml(
        state.settings?.target_name || "",
      )}" placeholder="예: 토익 단어" maxlength="80" aria-label="목표 이름" autocomplete="off" enterkeyhint="done" />
    </div>
  `;
}

function renderWeakThresholdSetting() {
  const totalThreshold = getWeakCardThreshold();
  const recentRounds = getWeakRecentRounds();
  const recentThreshold = getWeakRecentWrongThreshold();
  return `
    <section class="settings-subsection">
      ${renderSectionHeading(
        "약점 카드 기준",
        "최근 회독에서 자주 틀렸거나, 전체 회독에서 누적 오답이 많은 카드를 약점으로 모읍니다. 약점 복습의 오답 횟수는 이 기준 계산에 넣지 않습니다.",
      )}
      <div class="weak-rule-preview">
        <span>최근 ${number(recentRounds)}회독 중 오답 ${number(recentThreshold)}회 이상</span>
        <span>또는 전체 오답 ${number(totalThreshold)}회 이상</span>
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
    </section>
  `;
}

function renderControllerActionOptions(selected) {
  const normalized = normalizeControllerAction(selected);
  return Object.entries(CONTROLLER_ACTION_LABELS)
    .map(
      ([value, label]) => `<option value="${value}" ${value === normalized ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function renderControllerMappingField(inputName) {
  const label = CONTROLLER_BUTTON_LABELS[inputName] || inputName.toUpperCase();
  return `<label class="field"><span class="field-label">${escapeHtml(label)}</span><select class="select" name="controller_${inputName}_action" aria-label="${escapeHtml(
    `${label} 동작`,
  )}">${renderControllerActionOptions(getControllerInputAction(inputName))}</select></label>`;
}

function renderControllerMappingSetting() {
  return `
    <section class="settings-subsection">
      ${renderSectionHeading(
        "컨트롤러",
        "8BitDo Micro처럼 A/B/X/Y 입력이 잡히는 컨트롤러의 학습 동작을 바꿉니다. 기본값은 A가 뒤집기/알맞음, B가 틀림입니다.",
      )}
      <div class="controller-mapping-grid">
        ${["a", "b", "x", "y"].map(renderControllerMappingField).join("")}
      </div>
      <button class="ghost-button full" type="button" data-action="reset-controller-mapping">${iconLabel(
        "rotate-ccw",
        "기본값으로",
      )}</button>
    </section>
  `;
}

function getExamDateParts() {
  const match = String(state.settings?.jlpt_exam_date || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) };
}

function renderSelectOptions(values, selected, placeholder, suffix = "") {
  return `
    <option value="">${placeholder}</option>
    ${values
      .map(
        (value) =>
          `<option value="${value}" ${String(value) === String(selected) ? "selected" : ""}>${value}${suffix}</option>`,
      )
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
      ${renderFieldLabel("목표일")}
      <div class="date-select-grid">
        <select class="select" name="exam_year" aria-label="목표 연도">
          ${renderSelectOptions(years, parts.year, "연도", "년")}
        </select>
        <select class="select" name="exam_month" aria-label="목표 월">
          ${renderSelectOptions(months, parts.month, "월", "월")}
        </select>
        <select class="select" name="exam_day" aria-label="목표 일">
          ${renderSelectOptions(days, parts.day, "일", "일")}
        </select>
      </div>
    </div>
  `;
}

function renderCollectionListItem(collection) {
  return `
    <article class="group-item collection-item">
      <button class="collection-list-main" type="button" data-action="open-collection-detail" data-collection-id="${collection.id}">
        <div class="collection-card-heading">
          <div>
            <span>대그룹</span>
            <strong>${escapeHtml(collection.name)}</strong>
          </div>
          <span class="pill ${number(collection.group_count) ? "good" : ""}">${number(collection.group_count)}개 소그룹</span>
        </div>
        <p class="collection-description">${escapeHtml(collection.description || "설명 없음")}</p>
        <div class="collection-metric-strip">
          <span><strong>${number(collection.card_count)}</strong>전체 카드</span>
          <span><strong>${number(collection.completed_rounds)}</strong>회독</span>
          <span><strong>${number(collection.wrong_total)}</strong>오답</span>
        </div>
        <p class="collection-list-note">소그룹을 관리하려면 대그룹을 여세요. 묶음 연습은 공식 기록에서 제외됩니다.</p>
      </button>
      <div class="card-actions quiet-actions">
        <button class="ghost-button" type="button" data-action="edit-collection" data-collection-id="${
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
  const cardCount = number(group.card_count);
  const lastStudyText = getGroupLastStudyLabel(group);
  return `
    <article class="group-item subgroup-management-item ${cardCount ? "" : "empty"}">
      <div class="subgroup-item-main">
        <div class="item-title">
          <strong>${escapeHtml(group.name)}</strong>
          ${
            cardCount
              ? `<button class="pill group-card-count" type="button" data-action="preview-group-cards" data-group-id="${
                  group.id
                }" aria-label="${escapeHtml(`${group.name} 카드 ${cardCount}개 미리보기`)}">${cardCount}개</button>`
              : `<span class="pill">카드 없음</span>`
          }
        </div>
        <p class="meta">${escapeHtml(group.collection_name || "대그룹 없음")} · ${escapeHtml(group.description || "설명 없음")}</p>
        ${renderGroupStatusPills(group)}
        ${renderGroupMetricRow(group)}
        <p class="meta">${escapeHtml(lastStudyText)} · 누적 정답 ${number(group.correct_total)} · 누적 오답 ${number(group.wrong_total)}</p>
      </div>
      <div class="subgroup-primary-actions">
        <button class="secondary-button full add-card-button" type="button" data-action="add-card-to-study-group" data-group-id="${
          group.id
        }">${iconLabel("plus", cardCount ? "카드 추가" : "카드 등록")}</button>
        <div class="subgroup-file-actions">
          <button class="ghost-button" type="button" data-action="export-group-csv" data-group-id="${group.id}">${iconLabel(
            "download",
            "CSV 내보내기",
          )}</button>
          <label class="ghost-button file-button">${iconLabel("upload", "CSV 불러오기")}<input class="group-csv-input" type="file" accept="${CSV_IMPORT_ACCEPT}" data-group-id="${
            group.id
          }" /></label>
        </div>
        <button class="ghost-button" type="button" data-action="edit-group" data-group-id="${group.id}">${iconLabel(
          "pencil",
          "수정",
        )}</button>
      </div>
      <div class="danger-zone-actions subgroup-danger-actions" aria-label="기록/삭제 관리">
        <button class="ghost-button" type="button" data-action="reset-history" data-group-id="${group.id}" ${
          hasHistory ? "" : "disabled"
        }>${iconLabel("rotate-ccw", "기록 초기화")}</button>
        <button class="danger-button" type="button" data-action="delete-group" data-group-id="${group.id}">${iconLabel(
          "trash",
          "소그룹 삭제",
        )}</button>
      </div>
    </article>
  `;
}

async function startStudy() {
  const group = getSelectedGroup();
  if (!group) return showToast("학습할 소그룹을 선택하세요.");
  const data = await request(`/api/study?group_id=${group.id}&order=${state.orderMode}`);
  if (!data.cards.length) return showToast("학습 대상 카드가 없습니다. 제외한 카드를 다시 포함해 주세요.");
  const cards = prepareStudyCards(data.cards);
  state.session = {
    studyMode: "group",
    group: data.group,
    collection: data.collection,
    selectedGroups: data.groups,
    roundNo: data.round_no,
    orderMode: data.order_mode,
    exampleDisplayMode: state.exampleDisplayMode,
    exampleOrderMode: state.exampleOrderMode,
    frontExampleMode: state.frontExampleMode,
    allCards: cards,
    cards,
    index: 0,
    passNo: 1,
    passResults: [],
    startedAtIso: new Date().toISOString(),
    startedAtMs: Date.now(),
    showingBack: false,
    expandedExamples: {},
    frontExpandedExamples: {},
    answerFeedback: null,
    isAnswering: false,
    results: [],
    previousRound: null,
    savedRound: null,
  };
  state.activeDialog = null;
  render();
  focusAfterRender(['.study-card[data-action="flip-card"]', '.reveal-button[data-action="flip-card"]']);
}

async function startBundleStudy() {
  const collection = getSelectedCollection();
  const selectedGroups = getSelectedStudyGroups();
  if (!collection || !selectedGroups.length) return showToast("학습 대상 카드가 있는 소그룹을 선택하세요.");
  const groupIds = selectedGroups.map((group) => group.id).join(",");
  const data = await request(
    `/api/study?collection_id=${collection.id}&group_ids=${encodeURIComponent(groupIds)}&order=${state.orderMode}`,
  );
  if (!data.cards.length) return showToast("선택한 소그룹에 학습 대상 카드가 없습니다.");
  const cards = prepareStudyCards(data.cards);
  state.session = {
    studyMode: "practice",
    group: { id: null, name: `${data.collection.name} 묶음 연습` },
    collection: data.collection,
    selectedGroups: data.groups,
    roundNo: data.round_no,
    orderMode: data.order_mode,
    exampleDisplayMode: state.exampleDisplayMode,
    exampleOrderMode: state.exampleOrderMode,
    frontExampleMode: state.frontExampleMode,
    returnContext: state.collectionStudyReturnContext,
    allCards: cards,
    cards,
    index: 0,
    passNo: 1,
    passResults: [],
    startedAtIso: new Date().toISOString(),
    startedAtMs: Date.now(),
    showingBack: false,
    expandedExamples: {},
    frontExpandedExamples: {},
    answerFeedback: null,
    isAnswering: false,
    results: [],
    previousRound: null,
    savedRound: null,
  };
  state.activeDialog = null;
  state.collectionStudyReturnContext = null;
  state.activeTab = "study";
  state.studyStep = "collection";
  render();
  scrollToTop();
  focusAfterRender(['.study-card[data-action="flip-card"]', '.reveal-button[data-action="flip-card"]']);
}

function startWeakStudy() {
  const weakCards = getWeakCards();
  if (!weakCards.length) return showToast("아직 약점 카드가 없습니다.");
  const returnTab = state.activeTab === "stats" ? "stats" : "study";
  const cards = prepareStudyCards(weakCards);
  state.session = {
    studyMode: "weak",
    group: { id: null, name: "약점 카드" },
    roundNo: null,
    orderMode: "wrong",
    exampleDisplayMode: state.exampleDisplayMode,
    exampleOrderMode: state.exampleOrderMode,
    frontExampleMode: state.frontExampleMode,
    allCards: cards,
    cards,
    index: 0,
    passNo: 1,
    passResults: [],
    startedAtIso: new Date().toISOString(),
    startedAtMs: Date.now(),
    showingBack: false,
    expandedExamples: {},
    frontExpandedExamples: {},
    answerFeedback: null,
    isAnswering: false,
    results: [],
    previousRound: null,
    savedRound: null,
    returnTab,
  };
  state.weakCardOpenId = null;
  state.weakPanelOpen = false;
  state.activeDialog = null;
  state.activeTab = "study";
  state.studyStep = "select";
  render();
  scrollToTop();
  focusAfterRender(['.study-card[data-action="flip-card"]', '.reveal-button[data-action="flip-card"]']);
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
    showToast(`오답 카드 ${wrongAttempts.length}개를 다시 반복합니다.`);
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
  render();
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
    warning.textContent = `같은 소그룹에 이미 같은 앞면 카드가 있습니다: ${duplicate.front}`;
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
    study_excluded: form.elements.study_excluded?.checked || false,
    examples: collectExamples(form),
  };
  const isEditing = Boolean(state.editingCardId);
  if (findDuplicateCard(payload.group_id, payload.front, state.editingCardId)) {
    updateSingleDuplicateWarning(form);
    return;
  }
  const editingCardIdSnapshot = state.editingCardId;
  await request(isEditing ? `/api/cards/${state.editingCardId}` : "/api/cards", {
    method: isEditing ? "PATCH" : "POST",
    body: JSON.stringify(payload),
  });
  state.editingCardId = null;
  state.cardEntryMode = "single";
  state.selectedGroupId = payload.group_id;
  const targetGroup = state.groups.find((group) => Number(group.id) === Number(payload.group_id));
  if (targetGroup) state.selectedCollectionId = targetGroup.collection_id;
  if (targetGroup) state.cardFilterCollectionId = String(targetGroup.collection_id);
  state.cardFilterGroupId = String(payload.group_id);
  resetCardListLimit();
  await loadData();
  if (state.activeDialog === "edit-card-in-session") {
    state.activeDialog = null;
    const session = state.session;
    if (session) {
      const updatedCard = state.cards.find((c) => Number(c.id) === Number(editingCardIdSnapshot));
      if (updatedCard) {
        const prepared = prepareStudyCards([updatedCard])[0];
        const replaceIn = (arr) => {
          const idx = arr.findIndex((c) => Number(c.id) === Number(updatedCard.id));
          if (idx !== -1) arr[idx] = prepared;
        };
        replaceIn(session.cards);
        if (session.allCards) replaceIn(session.allCards);
      }
      session.showingBack = false;
      session.answerFeedback = null;
    }
    state.editingCardId = null;
    render();
    renderDialog();
    showToast("카드를 저장했습니다.");
    return;
  }
  state.cardScreen = isEditing ? "list" : "form";
  render();
  if (isEditing) {
    focusAfterRender("#cards-title");
    showToast("카드를 저장했습니다.");
    return;
  }
  scrollToTop();
  focusAfterRender("#card-form [name='front']");
  showToast("카드를 등록했습니다. 다음 카드를 이어서 입력하세요.");
}

function previewBulkCards(form) {
  const groupId = Number(form.elements.group_id.value);
  const text = form.elements.bulk_text.value.trim();
  state.bulkDraftGroupId = groupId;
  state.bulkDraftText = text;
  state.bulkPreview = buildBulkPreview(groupId, text);
  renderCards();
  focusAfterRender(state.bulkPreview.errors.length ? ".bulk-issues.bad" : "#bulk-preview-title");
  if (!state.bulkPreview.errors.length && !state.bulkPreview.warningCount) {
    showToast(`카드 ${state.bulkPreview.items.length}개를 확인했습니다.`);
  }
}

async function confirmBulkCards() {
  const preview = state.bulkPreview;
  if (state.pendingRequest) return;
  if (!preview || preview.errors.length || preview.warningCount || !preview.items.length) {
    showToast("미리보기의 오류나 중복을 먼저 정리해 주세요.");
    return;
  }
  state.pendingRequest = { action: "confirm-bulk-cards", label: "등록 중" };
  renderCards();
  try {
    const data = await request("/api/cards/bulk", {
      method: "POST",
      body: JSON.stringify({ group_id: preview.groupId, text: preview.text }),
    });
    state.pendingRequest = null;
    state.selectedGroupId = preview.groupId;
    const targetGroup = state.groups.find((group) => Number(group.id) === Number(preview.groupId));
    if (targetGroup) state.selectedCollectionId = targetGroup.collection_id;
    if (targetGroup) state.cardFilterCollectionId = String(targetGroup.collection_id);
    state.cardFilterGroupId = String(preview.groupId);
    state.cardSearchQuery = "";
    resetCardListLimit();
    state.cardScreen = "list";
    state.bulkDraftText = "";
    state.bulkDraftGroupId = null;
    state.bulkPreview = null;
    await loadData();
    render();
    showToast(`카드 ${data.created_count}개를 등록했습니다.`);
  } catch (error) {
    state.pendingRequest = null;
    renderCards();
    throw error;
  }
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
  resetGroupListLimit();
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
  state.collectionSearchQuery = "";
  state.groupSearchQuery = "";
  resetGroupListLimit();
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
    state.appStatus = "loading";
    state.appError = null;
    render();
    await loadData();
    state.authPending = false;
    state.authError = "";
    state.appStatus = "ready";
    render();
    focusAfterRender(["#study-collection-search", '[data-action="choose-study-collection"]', "#study-title"]);
    showToast(`${state.user.nickname}님, 들어왔어요.`);
  } catch (error) {
    state.authPending = false;
    if (state.user) {
      handleLoadDataError(error);
      return;
    }
    clearStoredUser();
    state.user = null;
    state.appStatus = "idle";
    state.authError = error.message;
    render();
  }
}

async function saveSettings(form) {
  const examDate = getExamDateFromSettingsForm(form);
  const targetName = form.elements.target_name.value.trim();
  const weakCardThreshold = Number(form.elements.weak_card_threshold.value);
  const weakRecentRounds = Number(form.elements.weak_recent_rounds.value);
  const weakRecentWrongThreshold = Number(form.elements.weak_recent_wrong_threshold.value);
  const controllerAAction = normalizeControllerAction(form.elements.controller_a_action.value, "");
  const controllerBAction = normalizeControllerAction(form.elements.controller_b_action.value, "");
  const controllerXAction = normalizeControllerAction(form.elements.controller_x_action.value, "");
  const controllerYAction = normalizeControllerAction(form.elements.controller_y_action.value, "");
  const weakValues = [weakCardThreshold, weakRecentRounds, weakRecentWrongThreshold];
  if (weakValues.some((value) => !Number.isInteger(value) || value < 1 || value > 20)) {
    throw new Error("약점 카드 기준은 1~20 사이로 입력하세요.");
  }
  if (!controllerAAction || !controllerBAction || !controllerXAction || !controllerYAction) {
    throw new Error("컨트롤러 동작 설정을 다시 선택하세요.");
  }
  const data = await request("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({
      target_name: targetName,
      jlpt_exam_date: examDate,
      weak_card_threshold: weakCardThreshold,
      weak_recent_rounds: weakRecentRounds,
      weak_recent_wrong_threshold: weakRecentWrongThreshold,
      controller_a_action: controllerAAction,
      controller_b_action: controllerBAction,
      controller_x_action: controllerXAction,
      controller_y_action: controllerYAction,
    }),
  });
  state.settings = normalizeSettings(data.settings);
  applyStudyOptionSettings();
  await loadData();
  render();
  showToast("설정을 저장했습니다.");
}

async function saveStudyOptionSettings() {
  syncStudyOptionSettings();
  const serial = ++studyOptionSaveSerial;
  const data = await request("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(currentStudyOptionSettings()),
  });
  if (serial !== studyOptionSaveSerial) return;
  state.settings = normalizeSettings(data.settings);
  applyStudyOptionSettings();
}

async function clearExamDate() {
  const data = await request("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({ target_name: "", jlpt_exam_date: "" }),
  });
  state.settings = normalizeSettings(data.settings);
  applyStudyOptionSettings();
  state.activeDialog = null;
  render();
  showToast("학습 목표를 미정으로 초기화했습니다.");
}

function resetControllerMappingForm() {
  const form = document.getElementById("settings-form");
  if (!(form instanceof HTMLFormElement)) return;
  form.elements.controller_a_action.value = DEFAULT_CONTROLLER_A_ACTION;
  form.elements.controller_b_action.value = DEFAULT_CONTROLLER_B_ACTION;
  form.elements.controller_x_action.value = DEFAULT_CONTROLLER_X_ACTION;
  form.elements.controller_y_action.value = DEFAULT_CONTROLLER_Y_ACTION;
  showToast("컨트롤러 기본값으로 바꿨어요. 저장을 누르면 적용됩니다.");
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
    settings: defaultSettings(),
    selectedCollectionId: null,
    selectedStudyGroupIds: [],
    selectedGroupId: null,
    groupDetailCollectionId: null,
    session: null,
    activeDialog: null,
    roundDetail: null,
    pendingTab: null,
    pendingAction: null,
    pendingHistoryRoute: null,
    cardFilterCollectionId: "",
    cardFilterGroupId: "",
    cardSearchQuery: "",
    studyCollectionSearchQuery: "",
    studyGroupSearchQuery: "",
    collectionSearchQuery: "",
    studyGroupSortMode: "recent",
    orderMode: DEFAULT_STUDY_ORDER_MODE,
    exampleOrderMode: DEFAULT_EXAMPLE_ORDER_MODE,
    frontExampleMode: DEFAULT_FRONT_EXAMPLE_MODE,
    groupSearchQuery: "",
    cardListLimit: CARD_LIST_PAGE_SIZE,
    groupListLimit: GROUP_LIST_PAGE_SIZE,
    statsCollectionListLimit: STATS_COLLECTION_LIST_PAGE_SIZE,
    scrollPositions: {},
    cardScreen: "list",
    groupScreen: "list",
    cardEntryMode: "single",
    bulkDraftText: "",
    bulkDraftGroupId: null,
    bulkPreview: null,
    dataPanelOpen: false,
    recentRoundsOpen: false,
    exampleDisplayMode: DEFAULT_EXAMPLE_DISPLAY_MODE,
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
  showToast("백업 파일을 만들었습니다. 개인 저장소에 보관하세요.");
}

function safeFilenamePart(value, fallback = "소그룹") {
  const text = String(value || "")
    .replace(/[\\/:*?"<>|\r\n]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return (text || fallback).slice(0, 60);
}

function groupCsvFilename(group) {
  const collectionName = safeFilenamePart(group?.collection_name, "대그룹");
  const groupName = safeFilenamePart(group?.name, "소그룹");
  return `kokko-${collectionName}-${groupName}-${new Date().toISOString().slice(0, 10)}.csv`;
}

async function exportGroupCsv(groupId) {
  const group = state.groups.find((item) => Number(item.id) === Number(groupId));
  if (!group) return showToast("소그룹을 찾을 수 없습니다.");
  const { blob } = await requestBlob(`/api/groups/${groupId}/cards.csv`, { accept: "text/csv" });
  downloadBlob(groupCsvFilename(group), blob);
  showToast("소그룹 CSV 파일을 만들었습니다.");
}

async function importGroupCsv(groupId, file) {
  const group = state.groups.find((item) => Number(item.id) === Number(groupId));
  if (!group) return showToast("소그룹을 찾을 수 없습니다.");
  const text = await readTextFile(file);
  if (!text.trim()) return showToast("CSV 파일 내용이 비어 있습니다.");
  const data = await request(`/api/groups/${groupId}/cards.csv`, {
    method: "POST",
    body: JSON.stringify({ csv: text }),
  });
  state.selectedGroupId = groupId;
  state.selectedCollectionId = group.collection_id;
  state.cardFilterCollectionId = String(group.collection_id);
  state.cardFilterGroupId = String(groupId);
  state.cardSearchQuery = "";
  resetCardListLimit();
  await loadData();
  render();
  showToast(`CSV에서 카드 ${number(data.created_count)}개를 등록했습니다.`);
}

function prepareBackupRestore(form) {
  const raw = form.elements.backup_json.value.trim();
  state.backupDraftText = raw;
  if (!raw) {
    state.backupError = "복원할 백업 JSON을 넣어주세요.";
    renderSettings();
    return;
  }
  try {
    state.pendingAction = { type: "restore-backup", backup: JSON.parse(raw) };
  } catch {
    state.backupError = "백업 JSON 형식이 올바르지 않습니다. 파일 내용이 온전한지 확인하세요.";
    renderSettings();
    return;
  }
  state.backupError = "";
  state.activeDialog = "restore-backup";
  renderDialog();
}

async function restoreBackup() {
  const backup = state.pendingAction?.backup;
  if (!backup) return;
  try {
    const data = await request("/api/backup", { method: "POST", body: JSON.stringify(backup) });
    resetDataScopedUiState();
    state.backupError = "";
    state.backupDraftText = "";
    await loadData();
    render();
    showToast(`복원 완료: 카드 ${data.restored.cards}개`);
  } catch (error) {
    state.activeDialog = null;
    state.backupError = error.message || "백업을 복원하지 못했습니다.";
    render();
  }
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

async function deletePendingGroupCards() {
  const groupId = Number(state.pendingAction?.id);
  if (!groupId) return;
  const data = await request(`/api/groups/${groupId}/cards`, { method: "DELETE" });
  if (state.session?.group?.id === groupId || state.session?.selectedGroups?.some((group) => Number(group.id) === groupId)) {
    state.session = null;
  }
  state.pendingAction = null;
  state.activeDialog = null;
  state.editingCardId = null;
  state.cardScreen = "list";
  state.cardSearchQuery = "";
  resetCardListLimit();
  await loadData();
  render();
  showToast(`카드 ${number(data.cards_deleted)}개를 삭제했습니다.`);
}

async function toggleCardStudyExclusion(cardId) {
  const card = state.cards.find((item) => Number(item.id) === Number(cardId));
  if (!card) return showToast("카드를 찾을 수 없습니다.");
  const nextExcluded = !isCardStudyExcluded(card);
  await request(`/api/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify({ study_excluded: nextExcluded }),
  });
  await loadData();
  render();
  showToast(nextExcluded ? "학습에서 제외했습니다." : "학습에 포함했습니다.");
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
  showToast("학습 기록을 초기화했습니다.");
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
  showToast("소그룹 기록을 초기화했습니다.");
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
  const visibleLimits = {
    bad: ROUND_DETAIL_SECTION_PAGE_SIZE,
    good: ROUND_DETAIL_SECTION_PAGE_SIZE,
  };
  state.roundDetail = { loading: true, id: roundId, round: cachedRound || null, cards: [], visibleLimits };
  state.activeDialog = "round-detail";
  renderDialog();
  const data = await request(`/api/rounds/${roundId}`);
  if (state.activeDialog !== "round-detail" || Number(state.roundDetail?.id) !== Number(roundId)) return;
  state.roundDetail = { ...data, loading: false, id: roundId, visibleLimits };
  renderDialog();
}

document.addEventListener(
  "toggle",
  (event) => {
    const details = event.target;
    if (details instanceof HTMLDetailsElement && details.classList.contains("help-disclosure")) {
      syncHelpDisclosureState(details);
    }
  },
  true,
);

document.addEventListener("click", async (event) => {
  const clickTarget = event.target instanceof Element ? event.target : null;
  closeHelpDisclosures(clickTarget?.closest("summary")?.closest("details.help-disclosure") || null);
  if (clickTarget?.classList.contains("dialog-backdrop")) {
    if (state.pendingRequest) return;
    if (canDismissActiveDialogWithEscape()) closeDialog();
    else dialogRoot.querySelector('[data-action="close-dialog"]')?.focus({ preventScroll: true });
    return;
  }
  const tabButton = clickTarget?.closest("[data-tab]");
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
    if (nextTab !== state.activeTab) saveCurrentScrollPosition();
    state.activeTab = nextTab;
    render();
    if (nextTab !== "study" || !state.session) restoreCurrentScrollPosition();
    if (shouldMoveFocusAfterClick(event)) {
      focusAfterRender(`#view-${nextTab}.active h2`);
    } else if (tabButton instanceof HTMLElement) {
      tabButton.blur();
    }
    return;
  }
  const actionEl = clickTarget?.closest("[data-action]");
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
      focusAfterRender('#collection-form [name="name"], #view-groups.active h2');
    }
    if (action === "open-stats-collection") {
      const collectionId = Number(actionEl.dataset.collectionId);
      if (!state.collections.some((collection) => Number(collection.id) === collectionId)) return;
      state.activeTab = "groups";
      state.groupScreen = "list";
      state.groupDetailCollectionId = collectionId;
      state.editingCollectionId = null;
      state.editingGroupId = null;
      state.groupSearchQuery = "";
      resetGroupListLimit();
      render();
      focusAfterRender("#view-groups.active h2");
      scrollToTop();
    }
    if (action === "study-stats-group") {
      const groupId = Number(actionEl.dataset.groupId);
      const group = state.groups.find((item) => Number(item.id) === groupId);
      if (!group || !getGroupStudyCardCount(group)) return showToast("학습 대상 카드가 있는 소그룹을 선택하세요.");
      state.activeTab = "study";
      state.selectedGroupId = groupId;
      state.selectedCollectionId = group.collection_id;
      state.studyStep = "ready";
      state.recentRoundsOpen = false;
      state.studyOptionsOpen = false;
      render();
      focusAfterRender('[data-action="start-study"]');
      scrollToTop();
    }
    if (action === "set-stats-range") {
      const nextRange = actionEl.dataset.range;
      if (!STATS_RANGE_LABELS[nextRange]) return;
      state.statsRangeMode = nextRange;
      state.statsRecentRoundsOpen = false;
      resetStatsCollectionListLimit();
      renderStats();
      focusAfterRender(`[data-action="set-stats-range"][data-range="${nextRange}"]`);
    }
    if (action === "logout") {
      state.activeDialog = "logout";
      renderDialog();
    }
    if (action === "confirm-logout") logout();
    if (action === "retry-load-data") await retryLoadData();
    if (action === "open-study-groups") {
      state.studyStep = state.selectedCollectionId ? "collection" : "select";
      state.selectedGroupId = null;
      state.studyOptionsOpen = false;
      render();
      focusAfterRender([
        "#study-group-search",
        '[data-action="choose-study-group"]',
        "#study-collection-search",
        '[data-action="choose-study-collection"]',
      ]);
      scrollToTop();
    }
    if (action === "choose-study-collection") {
      const collectionId = Number(actionEl.dataset.collectionId);
      if (!state.collections.some((collection) => Number(collection.id) === collectionId)) return;
      saveScrollPosition("study:collections");
      state.selectedCollectionId = collectionId;
      state.selectedGroupId = null;
      state.studyStep = "collection";
      state.studyGroupSearchQuery = "";
      state.studyGroupPage = 0;
      state.recentRoundsOpen = false;
      state.studyOptionsOpen = false;
      render();
      focusAfterRender(["#study-group-search", '[data-action="choose-study-group"]']);
      scrollToTop();
    }
    if (action === "focus-study-collections") {
      state.studyStep = "select";
      render();
      focusAfterRender(["#study-collection-search", '[data-action="choose-study-collection"]']);
      window.requestAnimationFrame(() => {
        scrollIntoViewSafely(document.getElementById("study-collection-browser"), { block: "start" });
      });
    }
    if (action === "study-page-prev") {
      const target = actionEl.dataset.target;
      if (target === "collection") state.studyCollectionPage = Math.max(0, state.studyCollectionPage - 1);
      if (target === "group") state.studyGroupPage = Math.max(0, state.studyGroupPage - 1);
      if (target === "card") state.cardPage = Math.max(0, state.cardPage - 1);
      target === "card" ? renderCards() : renderStudy();
    }
    if (action === "study-page-next") {
      const target = actionEl.dataset.target;
      if (target === "collection") state.studyCollectionPage += 1;
      if (target === "group") state.studyGroupPage += 1;
      if (target === "card") state.cardPage += 1;
      target === "card" ? renderCards() : renderStudy();
    }
    if (action === "back-to-study-collections") {
      saveScrollPosition(`study:collection:${state.selectedCollectionId || "none"}`);
      state.studyStep = "select";
      state.selectedGroupId = null;
      render();
      focusAfterRender(["#study-collection-search", '[data-action="choose-study-collection"]']);
      restoreScrollPosition("study:collections");
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
      focusAfterRender('[data-action="start-study"]');
      scrollToTop();
    }
    if (action === "open-collection-study-dialog") {
      const collectionId = state.selectedCollectionId || state.collections[0]?.id;
      if (!collectionId) return showToast("대그룹을 먼저 만들어 주세요.");
      state.selectedCollectionId = collectionId;
      state.selectedStudyGroupIds = getGroupsForCollection(collectionId)
        .filter((group) => getGroupStudyCardCount(group) > 0)
        .map((group) => group.id);
      state.collectionStudyReturnContext = getCollectionStudyReturnContext(collectionId);
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
      focusAfterRender(['#card-form [name="front"]', '#card-form [name="collection_id"]']);
      scrollToTop();
    }
    if (action === "open-study-group-cards") {
      const groupId = Number(actionEl.dataset.groupId);
      const group = state.groups.find((item) => Number(item.id) === groupId);
      if (!group) return;
      state.selectedGroupId = groupId;
      state.cardFilterCollectionId = String(group.collection_id);
      state.cardFilterGroupId = String(groupId);
      state.activeTab = "cards";
      state.cardScreen = "list";
      state.cardEntryMode = "single";
      state.editingCardId = null;
      state.bulkPreview = null;
      resetCardListLimit();
      render();
      focusAfterRender("#cards-title");
      scrollToTop();
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
      focusAfterRender('#group-form [name="name"]');
      scrollToTop();
    }
    if (action === "toggle-study-subgroup") {
      const groupId = Number(actionEl.dataset.groupId);
      const selected = new Set(state.selectedStudyGroupIds.map(Number));
      if (actionEl.checked) selected.add(groupId);
      else selected.delete(groupId);
      state.selectedStudyGroupIds = [...selected];
      renderStudyPickerUpdate(`[data-action="toggle-study-subgroup"][data-group-id="${groupId}"]`);
    }
    if (action === "select-all-study-subgroups") {
      state.selectedStudyGroupIds = getPracticeSelectableGroups().map((group) => group.id);
      renderStudyPickerUpdate();
    }
    if (action === "clear-study-subgroups") {
      state.selectedStudyGroupIds = [];
      renderStudyPickerUpdate();
    }
    if (action === "select-practice-preset") {
      const picked = getPracticePresetGroups(actionEl.dataset.preset);
      if (!picked.length) {
        showToast("조건에 맞는 소그룹이 없습니다.");
        return;
      }
      const selectedIds = new Set(state.selectedStudyGroupIds.map(Number));
      const pickedIds = picked.map((group) => group.id);
      state.selectedStudyGroupIds = hasSameSelectedIds(selectedIds, pickedIds) ? [] : pickedIds;
      renderStudyPickerUpdate(`[data-action="select-practice-preset"][data-preset="${actionEl.dataset.preset}"]`);
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
      const nextMode = normalizeStudyOrderMode(actionEl.dataset.order);
      state.orderMode = nextMode;
      syncStudyOptionSettings();
      state.activeDialog === "collection-study-picker"
        ? rerenderCollectionStudyDialog({ anchorSelector: `[data-action="set-order"][data-order="${nextMode}"]` })
        : render();
      await saveStudyOptionSettings();
    }
    if (action === "set-example-display") {
      const nextMode = normalizeExampleDisplayMode(actionEl.dataset.exampleDisplay);
      state.exampleDisplayMode = nextMode;
      syncStudyOptionSettings();
      state.activeDialog === "collection-study-picker"
        ? rerenderCollectionStudyDialog({
            anchorSelector: `[data-action="set-example-display"][data-example-display="${nextMode}"]`,
          })
        : render();
      await saveStudyOptionSettings();
    }
    if (action === "set-example-order") {
      const nextMode = normalizeExampleOrderMode(actionEl.dataset.exampleOrder);
      state.exampleOrderMode = nextMode;
      syncStudyOptionSettings();
      state.activeDialog === "collection-study-picker"
        ? rerenderCollectionStudyDialog({
            anchorSelector: `[data-action="set-example-order"][data-example-order="${nextMode}"]`,
          })
        : render();
      await saveStudyOptionSettings();
    }
    if (action === "set-front-example") {
      const nextMode = normalizeFrontExampleMode(actionEl.dataset.frontExample);
      state.frontExampleMode = nextMode;
      syncStudyOptionSettings();
      state.activeDialog === "collection-study-picker"
        ? rerenderCollectionStudyDialog({
            anchorSelector: `[data-action="set-front-example"][data-front-example="${nextMode}"]`,
          })
        : render();
      await saveStudyOptionSettings();
    }
    if (action === "toggle-study-options") {
      state.studyOptionsOpen = !state.studyOptionsOpen;
      renderStudyPickerUpdate('[data-action="toggle-study-options"]');
    }
    if (action === "toggle-recent-rounds") {
      state.recentRoundsOpen = !state.recentRoundsOpen;
      renderStudy();
    }
    if (action === "toggle-stats-rounds") {
      state.statsRecentRoundsOpen = !state.statsRecentRoundsOpen;
      renderStats();
      focusAfterRender('[data-action="toggle-stats-rounds"]');
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
      focusAfterRender(
        state.cardEntryMode === "bulk"
          ? ['#bulk-card-form [name="bulk_text"]', '#bulk-card-form [name="collection_id"]']
          : ['#card-form [name="front"]', '#card-form [name="collection_id"]'],
      );
      scrollToTop();
    }
    if (action === "open-card-form") {
      saveScrollPosition("cards:list");
      state.editingCardId = null;
      state.cardScreen = "form";
      state.bulkPreview = null;
      renderCards();
      focusAfterRender(['#card-form [name="front"]', '#card-form [name="collection_id"]']);
      scrollToTop();
    }
    if (action === "edit-card-in-session") {
      state.editingCardId = Number(actionEl.dataset.cardId);
      state.activeDialog = "edit-card-in-session";
      renderDialog();
    }
    if (action === "show-card-list") {
      if (state.activeDialog === "edit-card-in-session") {
        closeDialog();
        return;
      }
      state.editingCardId = null;
      state.cardScreen = "list";
      renderCards();
      focusAfterRender("#cards-title");
      restoreScrollPosition("cards:list");
    }
    if (action === "preview-study-cards") {
      state.pendingAction = null;
      state.activeDialog = "preview";
      renderDialog();
    }
    if (action === "preview-bundle-cards") {
      const pickerPanel = getCollectionStudyScrollElement();
      state.pendingAction = {
        type: "preview-bundle-cards",
        id: state.selectedCollectionId,
        groupIds: getSelectedStudyGroups().map((group) => group.id),
        returnDialog: state.activeDialog === "collection-study-picker" ? "collection-study-picker" : null,
        returnScrollTop: pickerPanel ? pickerPanel.scrollTop : 0,
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
    if (action === "toggle-front-examples" && state.session && !state.session.savedRound) {
      const currentCard = state.session.cards[state.session.index];
      state.session.frontExpandedExamples = state.session.frontExpandedExamples || {};
      state.session.frontExpandedExamples[currentCard.id] = !isCardFrontExamplesExpanded(state.session, currentCard);
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
    if (action === "confirm-delete-card") await runDialogRequest(action, "삭제 중", deletePendingCard);
    if (action === "confirm-delete-group-cards") await runDialogRequest(action, "삭제 중", deletePendingGroupCards);
    if (action === "confirm-reset-history") await runDialogRequest(action, "초기화 중", resetPendingHistory);
    if (action === "confirm-reset-collection-history")
      await runDialogRequest(action, "초기화 중", resetPendingCollectionHistory);
    if (action === "confirm-delete-group") await runDialogRequest(action, "삭제 중", deletePendingGroup);
    if (action === "confirm-delete-collection") await runDialogRequest(action, "삭제 중", deletePendingCollection);
    if (action === "confirm-restore-backup") await runDialogRequest(action, "복원 중", restoreBackup);
    if (action === "confirm-quit-study") {
      if (state.session) {
        if (state.session.studyMode === "practice") {
          restorePracticeReturnContext(state.session);
        } else if (state.session.studyMode !== "weak") {
          state.selectedGroupId = state.session.group.id;
          state.studyStep = "ready";
        } else {
          state.studyStep = "select";
          if (state.session.returnTab === "stats") state.activeTab = "stats";
        }
        state.session = null;
      }
      state.activeDialog = null;
      state.collectionStudyReturnContext = null;
      state.pendingTab = null;
      render();
      scrollToTop();
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
      scrollToTop();
    }
    if (action === "confirm-history-leave-study") {
      const route = state.pendingHistoryRoute || { tab: "study", view: "select" };
      if (state.session) {
        if (state.session.studyMode === "practice") restorePracticeReturnContext(state.session);
        else if (state.session.studyMode !== "weak") {
          state.selectedGroupId = state.session.group.id;
          state.studyStep = "ready";
        }
        state.session = null;
      }
      state.activeDialog = null;
      state.pendingHistoryRoute = null;
      completeHistoryNavigation(route);
    }
    if (action === "jump-wrong-review") {
      scrollToCompletionSection("wrong-review");
    }
    if (action === "completion-next-round") {
      navigateFromCompletion("next-round");
      return;
    }
    if (action === "completion-group-list") {
      navigateFromCompletion("group-list");
      return;
    }
    if (action === "completion-practice-again") {
      navigateFromCompletion("practice-again");
      return;
    }
    if (action === "completion-collection-detail") {
      navigateFromCompletion("collection-detail");
      return;
    }
    if (action === "completion-weak-list") {
      navigateFromCompletion("weak-list");
      return;
    }
    if (action === "completion-study-home") {
      navigateFromCompletion("study-home");
      return;
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
      scrollToTop();
    }
    if (action === "export-backup") await exportBackup();
    if (action === "export-group-csv") await exportGroupCsv(Number(actionEl.dataset.groupId));
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
    if (action === "reset-controller-mapping") resetControllerMappingForm();
    if (action === "open-group-form") {
      saveScrollPosition(state.groupDetailCollectionId ? `groups:detail:${state.groupDetailCollectionId}` : "groups:collections");
      state.editingGroupId = null;
      state.editingCollectionId = null;
      state.groupDetailCollectionId = state.groupDetailCollectionId || state.selectedCollectionId;
      state.groupScreen = "group-form";
      render();
      scrollToTop();
    }
    if (action === "open-collection-form") {
      saveScrollPosition("groups:collections");
      state.editingCollectionId = null;
      state.editingGroupId = null;
      state.groupDetailCollectionId = null;
      state.groupScreen = "collection-form";
      render();
      scrollToTop();
    }
    if (action === "show-group-list") {
      const detailKey = state.groupDetailCollectionId ? `groups:detail:${state.groupDetailCollectionId}` : "groups:collections";
      state.editingGroupId = null;
      state.editingCollectionId = null;
      state.groupScreen = "list";
      render();
      restoreScrollPosition(detailKey);
    }
    if (action === "open-collection-detail") {
      const collectionId = Number(actionEl.dataset.collectionId);
      if (!state.collections.some((collection) => Number(collection.id) === collectionId)) return;
      saveScrollPosition("groups:collections");
      state.groupDetailCollectionId = collectionId;
      state.selectedCollectionId = collectionId;
      state.groupScreen = "list";
      state.editingGroupId = null;
      state.editingCollectionId = null;
      state.groupSearchQuery = "";
      resetGroupListLimit();
      render();
      scrollToTop();
    }
    if (action === "back-to-collections") {
      saveScrollPosition(`groups:detail:${state.groupDetailCollectionId || "none"}`);
      state.groupDetailCollectionId = null;
      state.groupScreen = "list";
      state.editingGroupId = null;
      state.editingCollectionId = null;
      render();
      restoreScrollPosition("groups:collections");
    }
    if (action === "clear-search") {
      const target = actionEl.dataset.target;
      const input = document.getElementById(target);
      if (input instanceof HTMLInputElement) input.value = "";
      if (target === "card-search") {
        state.cardSearchQuery = "";
        resetCardListLimit();
        renderCards();
        focusAfterRender("#card-search");
      }
      if (target === "study-collection-search") {
        state.studyCollectionSearchQuery = "";
        renderStudy();
        focusAfterRender("#study-collection-search");
      }
      if (target === "study-group-search") {
        state.studyGroupSearchQuery = "";
        renderStudy();
        focusAfterRender("#study-group-search");
      }
      if (target === "collection-search") {
        state.collectionSearchQuery = "";
        renderGroups();
        focusAfterRender("#collection-search");
      }
      if (target === "group-search") {
        state.groupSearchQuery = "";
        resetGroupListLimit();
        renderGroups();
        focusAfterRender("#group-search");
      }
    }
    if (action === "show-more-cards") {
      state.cardListLimit = number(state.cardListLimit) + CARD_LIST_PAGE_SIZE;
      renderCards();
    }
    if (action === "show-more-groups") {
      state.groupListLimit = number(state.groupListLimit) + GROUP_LIST_PAGE_SIZE;
      renderGroups();
    }
    if (action === "show-more-round-detail") {
      const section = actionEl.dataset.section;
      if (!["bad", "good"].includes(section) || !state.roundDetail) return;
      const body = dialogRoot.querySelector(".round-detail-body");
      const scrollTop = body ? body.scrollTop : 0;
      state.roundDetail.visibleLimits = {
        ...(state.roundDetail.visibleLimits || {}),
        [section]: number(state.roundDetail.visibleLimits?.[section]) + ROUND_DETAIL_SECTION_PAGE_SIZE,
      };
      renderDialog();
      window.requestAnimationFrame(() => {
        const nextBody = dialogRoot.querySelector(".round-detail-body");
        if (nextBody) nextBody.scrollTop = scrollTop;
      });
    }
    if (action === "show-more-stats-collections") {
      state.statsCollectionListLimit = number(state.statsCollectionListLimit) + STATS_COLLECTION_LIST_PAGE_SIZE;
      renderStats();
    }
    if (action === "add-example") {
      const list = document.querySelector("#example-editor-list");
      const index = list.querySelectorAll(".example-row").length;
      list.insertAdjacentHTML("beforeend", renderExampleEditorRow({}, index, false));
      const textarea = list.lastElementChild?.querySelector('[name="example_japanese"]');
      scrollIntoViewSafely(textarea, { block: "center" });
      textarea?.focus();
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
      saveScrollPosition("cards:list");
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
      scrollToTop();
    }
    if (action === "toggle-card-exclusion") {
      await toggleCardStudyExclusion(Number(actionEl.dataset.cardId));
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
    if (action === "delete-group-cards") {
      const group = state.groups.find((item) => item.id === Number(actionEl.dataset.groupId));
      if (group) {
        state.pendingAction = { type: "delete-group-cards", id: group.id };
        state.activeDialog = "delete-group-cards";
        renderDialog();
      }
    }
    if (action === "edit-group") {
      const group = state.groups.find((item) => item.id === Number(actionEl.dataset.groupId));
      saveScrollPosition(group ? `groups:detail:${group.collection_id}` : "groups:collections");
      state.editingGroupId = Number(actionEl.dataset.groupId);
      state.editingCollectionId = null;
      if (group) state.groupDetailCollectionId = group.collection_id;
      state.groupScreen = "group-form";
      render();
      scrollToTop();
    }
    if (action === "edit-collection") {
      saveScrollPosition("groups:collections");
      state.editingCollectionId = Number(actionEl.dataset.collectionId);
      state.editingGroupId = null;
      state.groupScreen = "collection-form";
      render();
      scrollToTop();
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
    showRequestError(error);
  }
});

document.addEventListener("change", async (event) => {
  try {
    if (event.target.id === "card-collection-filter") {
      state.cardFilterCollectionId = event.target.value;
      state.cardFilterGroupId = "";
      resetCardListLimit();
      renderCards();
    }
    if (event.target.id === "card-group-filter") {
      state.cardFilterGroupId = event.target.value;
      resetCardListLimit();
      renderCards();
    }
    if (event.target.id === "stats-collection-filter") {
      state.statsCollectionId = event.target.value;
      state.statsRecentRoundsOpen = false;
      resetStatsCollectionListLimit();
      renderStats();
      focusAfterRender("#stats-collection-filter");
    }
    if (event.target.id === "study-collection-select") {
      const collectionId = Number(event.target.value);
      state.selectedCollectionId = collectionId;
      state.selectedStudyGroupIds = getGroupsForCollection(collectionId)
        .filter((group) => getGroupStudyCardCount(group) > 0)
        .map((group) => group.id);
      renderDialog();
    }
    if (event.target.id === "card-form-collection") {
      const collectionId = Number(event.target.value);
      const nextGroup = getGroupsForCollection(collectionId)[0];
      state.selectedCollectionId = collectionId;
      state.selectedGroupId = nextGroup?.id || null;
      renderCards();
      focusAfterRender('#card-form [name="group_id"]');
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
      focusAfterRender('#bulk-card-form [name="group_id"]');
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
    if (event.target.classList.contains("group-csv-input")) {
      const input = event.target;
      const file = input.files?.[0];
      try {
        if (file) await importGroupCsv(Number(input.dataset.groupId), file);
      } finally {
        input.value = "";
      }
    }
    if (event.target.id === "backup-file-input") {
      const text = await readTextFile(event.target.files?.[0]);
      const textarea = document.querySelector('[name="backup_json"]');
      if (textarea && text) {
        textarea.value = text;
        state.backupDraftText = text;
        state.backupError = "";
        showToast("백업 파일을 불러왔습니다.");
      }
    }
  } catch (error) {
    showRequestError(error);
  }
});

function updateSearchInput(event) {
  if (event.target.id === "study-controller-input") {
    const value = event.target.value;
    event.target.value = "";
    handleStudyControllerText(value);
    return;
  }
  if (event.target.closest("#card-form") && event.target.name === "front") {
    updateSingleDuplicateWarning(event.target.closest("#card-form"));
  }
  if (event.target.closest("#bulk-card-form") && event.target.name === "bulk_text") {
    state.bulkDraftText = event.target.value;
    state.bulkPreview = null;
  }
  if (event.target.closest("#backup-import-form") && event.target.name === "backup_json" && state.backupError) {
    state.backupDraftText = event.target.value;
    state.backupError = "";
    renderSettings();
    refocusInput("backup-json");
  } else if (event.target.closest("#backup-import-form") && event.target.name === "backup_json") {
    state.backupDraftText = event.target.value;
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
  const form = event.target;
  try {
    if (form.classList.contains("search-field")) {
      applySearchInput(form.dataset.searchTarget);
      return;
    }
    if (form.id === "login-form") await login(form);
    if (form.id === "card-form") await runFormRequest(form, "저장 중", () => saveCard(form));
    if (form.id === "bulk-card-form") previewBulkCards(form);
    if (form.id === "collection-form") await runFormRequest(form, "저장 중", () => saveCollection(form));
    if (form.id === "group-form") await runFormRequest(form, "저장 중", () => saveGroup(form));
    if (form.id === "backup-import-form") prepareBackupRestore(form);
    if (form.id === "settings-form") await runFormRequest(form, "저장 중", () => saveSettings(form));
  } catch (error) {
    showRequestError(error);
  }
});

document.addEventListener("keydown", async (event) => {
  if (submitFormFromKeyboard(event)) return;
  if (event.key === "Escape" && document.querySelector("details.help-disclosure[open]")) {
    event.preventDefault();
    closeHelpDisclosures();
    return;
  }
  if (state.activeDialog) {
    if (event.key === "Tab") {
      trapDialogFocus(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (state.pendingRequest) return;
      if (canDismissActiveDialogWithEscape()) closeDialog();
      else dialogRoot.querySelector('[data-action="close-dialog"]')?.focus({ preventScroll: true });
      return;
    }
    if (activateControlFromKeyboard(event)) return;
    return;
  }
  const target = event.target;
  if (activateControlFromKeyboard(event)) return;
  const isStudyControllerInput = target instanceof HTMLElement && target.id === "study-controller-input";
  if (!isStudyControllerInput && isTypingTarget(target)) return;
  if (!state.session || state.session.savedRound) return;
  const studyKey = String(event.key || "").toLowerCase();
  const controllerInput =
    studyKey === "a" || event.key === "ArrowRight"
      ? "a"
      : studyKey === "b" || event.key === "ArrowLeft"
        ? "b"
        : studyKey === "x"
          ? "x"
          : studyKey === "y"
            ? "y"
            : "";
  if (controllerInput) {
    event.preventDefault();
    if (event.repeat) return;
    await handleStudyControllerInput(controllerInput);
    return;
  }
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    if (shouldHandleStudyController()) revealStudyCard();
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!state.session || state.session.savedRound) return;
  event.preventDefault();
  event.returnValue = "";
});

window.addEventListener("popstate", handleHistoryPop);
document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener("pageshow", handlePageShow);
window.addEventListener("offline", () => syncConnectionState({ notify: true }));
window.addEventListener("online", () => syncConnectionState({ notify: true }));

function notifyServiceWorkerUpdate() {
  showToast("새 버전을 적용하는 중입니다.", { duration: 2400 });
}

function applyServiceWorkerUpdate(worker) {
  if (!worker) return;
  notifyServiceWorkerUpdate();
  worker.postMessage({ type: "SKIP_WAITING" });
}

function watchServiceWorkerUpdate(registration) {
  if (registration.waiting && navigator.serviceWorker.controller) applyServiceWorkerUpdate(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) applyServiceWorkerUpdate(worker);
    });
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  let refreshingForServiceWorker = false;
  let hadServiceWorkerController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadServiceWorkerController) {
      hadServiceWorkerController = true;
      return;
    }
    if (refreshingForServiceWorker) return;
    refreshingForServiceWorker = true;
    window.location.reload();
  });
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      watchServiceWorkerUpdate(registration);
      await registration.update();
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
  });
}

async function init() {
  state.user = loadStoredUser();
  if (!state.user) {
    render();
    return;
  }
  state.appStatus = "loading";
  state.appError = null;
  render();
  try {
    await loadData();
    state.appStatus = "ready";
    render();
  } catch (error) {
    handleLoadDataError(error);
  }
}

registerServiceWorker();
init();
