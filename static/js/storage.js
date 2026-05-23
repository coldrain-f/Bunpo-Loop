(function () {
  const { LEGACY_USER_STORAGE_KEY, USER_STORAGE_KEY } = window.ByeorakchigiShared || window.JLPTShared;

  function getStorage() {
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  }

  function loadStoredUser() {
    try {
      const storage = getStorage();
      if (!storage) return null;
      const raw =
        storage.getItem(USER_STORAGE_KEY) ||
        storage.getItem(LEGACY_USER_STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user.id || !user.nickname || !user.accessCode) return null;
      if (!storage.getItem(USER_STORAGE_KEY)) saveStoredUser(user);
      return user;
    } catch {
      return null;
    }
  }

  function saveStoredUser(user) {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    storage.removeItem(LEGACY_USER_STORAGE_KEY);
  }

  function clearStoredUser() {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(USER_STORAGE_KEY);
    storage.removeItem(LEGACY_USER_STORAGE_KEY);
  }

  const storage = {
    clearStoredUser,
    loadStoredUser,
    saveStoredUser,
  };

  window.ByeorakchigiStorage = storage;
  window.JLPTStorage = storage;
})();
