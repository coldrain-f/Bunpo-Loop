(function () {
  const ORDER_LABELS = {
    sequence: "순서대로",
    random: "랜덤",
    wrong: "자주 틀리는 순",
  };

  const TAB_LABELS = {
    study: "학습",
    groups: "묶음",
    cards: "카드",
    stats: "통계",
    settings: "설정",
  };

  const DEFAULT_LOGIN = {
    nickname: "상운",
    accessCode: "960725",
  };

  const USER_STORAGE_KEY = "byeorakchigiUser";
  const LEGACY_USER_STORAGE_KEY = "jlptGrammarUser";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return entities[char];
    });
  }

  function number(value) {
    return Number(value || 0);
  }

  function formatDate(value) {
    if (!value) return "기록 없음";
    const text = String(value);
    const date = text.includes("T") ? new Date(text) : new Date(text.replace(" ", "T") + "Z");
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Number(seconds || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;
    const two = (value) => String(value).padStart(2, "0");
    if (hours > 0) return `${hours}:${two(minutes)}:${two(rest)}`;
    return `${minutes}:${two(rest)}`;
  }

  const shared = {
    DEFAULT_LOGIN,
    LEGACY_USER_STORAGE_KEY,
    ORDER_LABELS,
    TAB_LABELS,
    USER_STORAGE_KEY,
    escapeHtml,
    formatDate,
    formatDuration,
    number,
  };

  window.ByeorakchigiShared = shared;
  window.JLPTShared = shared;
})();
