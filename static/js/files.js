(function () {
  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function readTextFile(file) {
    if (!file) return "";
    return file.text();
  }

  const files = {
    downloadJson,
    readTextFile,
  };

  window.ByeorakchigiFiles = files;
  window.JLPTFiles = files;
})();
