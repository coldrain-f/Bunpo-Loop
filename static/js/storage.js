(function () {
  const { USER_STORAGE_KEY } = window.JLPTShared;

  function loadStoredUser() {
    try {
      const raw = window.localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user.id || !user.nickname || !user.accessCode) return null;
      return user;
    } catch {
      return null;
    }
  }

  function saveStoredUser(user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  function clearStoredUser() {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }

  window.JLPTStorage = {
    clearStoredUser,
    loadStoredUser,
    saveStoredUser,
  };
})();
