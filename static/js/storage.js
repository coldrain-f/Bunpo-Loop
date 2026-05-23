(function () {
  const { LEGACY_USER_STORAGE_KEY, USER_STORAGE_KEY } = window.ByeorakchigiShared || window.JLPTShared;

  function loadStoredUser() {
    try {
      const raw =
        window.localStorage.getItem(USER_STORAGE_KEY) ||
        window.localStorage.getItem(LEGACY_USER_STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user.id || !user.nickname || !user.accessCode) return null;
      if (!window.localStorage.getItem(USER_STORAGE_KEY)) saveStoredUser(user);
      return user;
    } catch {
      return null;
    }
  }

  function saveStoredUser(user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  }

  function clearStoredUser() {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  }

  const storage = {
    clearStoredUser,
    loadStoredUser,
    saveStoredUser,
  };

  window.ByeorakchigiStorage = storage;
  window.JLPTStorage = storage;
})();
