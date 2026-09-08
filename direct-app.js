(() => {
  // src/main.js
  var DB_NAME = "minhaya-ocr-pages";
  var DB_VERSION = 1;
  var GENRE_DEFINITIONS = {
    "\u7406\u7CFB": ["\u6570\u5B66", "\u60C5\u5831\u79D1\u5B66", "\u7269\u7406\u5B66", "\u5316\u5B66", "\u533B\u5B66", "\u751F\u7269\u7A2E", "\u751F\u7269\u5B66", "\u5730\u7403\u79D1\u5B66", "\u5929\u6587\u5B66", "\u6280\u8853\u5DE5\u5B66", "\u7406\u7CFB\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u7406\u7CFB\u305D\u306E\u4ED6"],
    "\u6587\u5B66": ["\u795E\u8A71-\u65E5\u672C\u795E\u8A71", "\u795E\u8A71-\u30AE\u30EA\u30B7\u30E3\u30FB\u30ED\u30FC\u30DE\u795E\u8A71", "\u795E\u8A71-\u305D\u306E\u4ED6\u795E\u8A71", "\u8A69", "\u7D75\u672C\u30FB\u7AE5\u8A71", "\u53E4\u6587\u30FB\u6F22\u6587", "\u65E5\u672C-\u6563\u6587-\u6226\u524D", "\u65E5\u672C-\u6563\u6587-\u6226\u5F8C", "\u4E16\u754C-\u30A2\u30B8\u30A2\u6587\u5B66", "\u4E16\u754C-\u82F1\u7C73\u6587\u5B66", "\u4E16\u754C-\u30C9\u30A4\u30C4\u6587\u5B66", "\u4E16\u754C-\u30ED\u30DE\u30F3\u30B9\u8AF8\u8A9E\u6587\u5B66", "\u4E16\u754C-\u30ED\u30B7\u30A2\u6587\u5B66", "\u4E16\u754C-\u305D\u306E\u4ED6\u5730\u57DF\u306E\u6587\u5B66", "\u6587\u5B66\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u6587\u5B66\u305D\u306E\u4ED6"],
    "\u8A00\u8449": ["\u56DB\u5B57\u719F\u8A9E\u30FB\u6545\u4E8B\u6210\u8A9E", "\u3053\u3068\u308F\u3056\u30FB\u6163\u7528\u53E5", "\u65E5\u5E38\u8A9E\u5F59\u30FB\u8A00\u3044\u56DE\u3057", "\u6D41\u884C\u8A9E\u30FB\u65B0\u8A9E\u30FB\u4FD7\u8A9E", "\u6F22\u5B57", "\u82F1\u8A9E", "\u5916\u56FD\u8A9E-\u82F1\u8A9E\u4EE5\u5916", "\u8A00\u8A9E\u5B66\u7528\u8A9E\u30FB\u6587\u6CD5", "\u8A00\u8449\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u8A00\u8449\u305D\u306E\u4ED6"],
    "\u65E5\u672C\u53F2": ["\u5148\u53F2\uFF5E\u53E4\u58B3\u6642\u4EE3", "\u98DB\u9CE5\u30FB\u5948\u826F\u6642\u4EE3", "\u5E73\u5B89\u6642\u4EE3", "\u938C\u5009\u6642\u4EE3", "\u5BA4\u753A\u6642\u4EE3", "\u6C5F\u6238\u6642\u4EE3", "\u660E\u6CBB\u30FB\u5927\u6B63\u6642\u4EE3", "\u662D\u548C-\u6226\u524D\u6226\u4E2D", "\u6226\u5F8C\u65E5\u672C\u53F2", "\u65E5\u672C\u53F2\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u65E5\u672C\u53F2\u305D\u306E\u4ED6"],
    "\u4E16\u754C\u53F2": ["\u30E8\u30FC\u30ED\u30C3\u30D1\u53F2-\u30EB\u30CD\u30B5\u30F3\u30B9\u4EE5\u524D", "\u30E8\u30FC\u30ED\u30C3\u30D1\u53F2-\u30D5\u30E9\u30F3\u30B9\u9769\u547D\u4EE5\u524D", "\u30E8\u30FC\u30ED\u30C3\u30D1\u53F2-WWI\u4EE5\u524D", "\u30E8\u30FC\u30ED\u30C3\u30D1\u53F2-\u7B2C\u4E00\u6B21\u5927\u6226\u4EE5\u5F8C", "\u4E2D\u56FD\u53F2-\u968B\u307E\u3067", "\u4E2D\u56FD\u53F2-\u5510\uFF5E\u660E", "\u4E2D\u56FD\u53F2-\u6E05\u4EE5\u964D", "\u30A2\u30B8\u30A2\u53F2-WWI\u4EE5\u524D", "\u30A2\u30B8\u30A2\u53F2-\u7B2C\u4E00\u6B21\u5927\u6226\u4EE5\u5F8C", "\u30A4\u30B9\u30E9\u30E0\u4E16\u754C\u53F2", "\u5357\u5317\u30A2\u30E1\u30EA\u30AB\u53F2", "\u305D\u306E\u4ED6\u5730\u57DF\u306E\u6B74\u53F2", "\u4E16\u754C\u53F2\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u4E16\u754C\u53F2\u305D\u306E\u4ED6"],
    "\u5730\u7406": ["\u4EA4\u901A", "\u5317\u6D77\u9053\u5730\u65B9", "\u6771\u5317\u5730\u65B9", "\u95A2\u6771\u5730\u65B9", "\u4E2D\u90E8\u5730\u65B9", "\u8FD1\u757F\u5730\u65B9", "\u4E2D\u56FD\u5730\u65B9", "\u56DB\u56FD\u5730\u65B9", "\u4E5D\u5DDE\u4EE5\u5357", "\u5317\u7C73", "\u4E2D\u5357\u7C73", "\u30A2\u30B8\u30A2", "\u30AA\u30BB\u30A2\u30CB\u30A2", "\u30E8\u30FC\u30ED\u30C3\u30D1", "\u30A2\u30D5\u30EA\u30AB", "\u6D77\u30FB\u6975\u5730\u65B9", "\u5730\u7406\u5B66", "\u5730\u7406\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u5730\u7406\u305D\u306E\u4ED6"],
    "\u516C\u6C11": ["\u502B\u7406(\u54F2\u5B66\u30FB\u601D\u60F3\u30FB\u5FC3\u7406\u5B66)", "\u793E\u4F1A", "\u6CD5\u5F8B\u30FB\u6CD5\u5B66\u30FB\u72AF\u7F6A", "\u65E5\u672C\u306E\u653F\u6CBB\u30FB\u5236\u5EA6", "\u4E16\u754C\u306E\u653F\u6CBB\u30FB\u5236\u5EA6", "\u904B\u52D5\u30FB\u4E8B\u4EF6", "\u7D4C\u6E08\u30FB\u7D4C\u6E08\u5B66", "\u5B97\u6559", "\u7591\u4F3C\u79D1\u5B66\u30FB\u30AA\u30AB\u30EB\u30C8", "\u6559\u80B2", "\u516C\u6C11\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u516C\u6C11\u305D\u306E\u4ED6"],
    "\u82B8\u8853": ["\u65E5\u672C-\u7D75\u753B", "\u65E5\u672C-\u5F6B\u523B", "\u4E16\u754C-\u7D75\u753B", "\u4E16\u754C-\u5F6B\u523B", "\u5EFA\u7BC9", "\u5DE5\u82B8\u30FB\u6C11\u82B8", "\u30C7\u30B6\u30A4\u30F3\u30FB\u5199\u771F\u30FB\u6620\u50CF", "\u30AF\u30E9\u30B7\u30C3\u30AF\u97F3\u697D", "\u7AE5\u8B21\u30FB\u5408\u5531\u66F2", "\u4F1D\u7D71\u97F3\u697D\u30FB\u6C11\u65CF\u97F3\u697D", "\u697D\u5668\u30FB\u97F3\u697D\u7528\u8A9E", "\u821E\u8E0A", "\u53E4\u5178\u82B8\u80FD-\u821E\u53F0-\u65E5\u672C", "\u53E4\u5178\u82B8\u80FD-\u3057\u3083\u3079\u304F\u308A-\u65E5\u672C", "\u82B8\u8853\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u82B8\u8853\u305D\u306E\u4ED6"],
    "\u6F2B\u753B\u30FB\u30A2\u30CB\u30E1\u30FB\u30B2\u30FC\u30E0": ["\u30A2\u30CB\u30E1", "\u6F2B\u753B", "\u30E9\u30A4\u30C8\u30CE\u30D9\u30EB", "\u30C6\u30EC\u30D3\u30B2\u30FC\u30E0", "\u7279\u64AE", "\u73A9\u5177\u30FB\u30B0\u30C3\u30BA", "\u6F2B\u30A2\u30B2\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u6F2B\u30A2\u30B2\u305D\u306E\u4ED6"],
    "\u751F\u6D3B": ["\u55DC\u597D\u54C1", "\u98DF\u6750", "\u6599\u7406\u30FB\u8ABF\u7406", "\u670D\u98FE\u30FB\u30D5\u30A1\u30C3\u30B7\u30E7\u30F3", "\u66A6\u30FB\u884C\u4E8B\u30FB\u3057\u304D\u305F\u308A", "\u5BB6\u5EAD\u306E\u533B\u5B66", "\u4F01\u696D\u30FB\u5546\u54C1", "\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8", "\u5A2F\u697D\u30FB\u8DA3\u5473", "\u751F\u6D3B\u81F3\u8FD1", "\u751F\u6D3B\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u751F\u6D3B\u305D\u306E\u4ED6"],
    "\u30B9\u30DD\u30FC\u30C4": ["\u91CE\u7403\u30FB\u30BD\u30D5\u30C8\u30DC\u30FC\u30EB", "\u30B5\u30C3\u30AB\u30FC\u30FB\u30D5\u30C3\u30C8\u30B5\u30EB", "\u7403\u6280-\u9664\u91CE\u7403\u30FB\u30B5\u30C3\u30AB\u30FC", "\u9678\u4E0A\u7AF6\u6280", "\u4F53\u64CD", "\u30A6\u30A9\u30FC\u30BF\u30FC\u30B9\u30DD\u30FC\u30C4", "\u683C\u95D8\u6280\u30FB\u6B66\u9053", "\u51AC\u5B63\u7AF6\u6280", "\u516C\u55B6\u30AE\u30E3\u30F3\u30D6\u30EB", "\u30EC\u30FC\u30B9\u7AF6\u6280", "\u30B9\u30DD\u30FC\u30C4\u30A4\u30D9\u30F3\u30C8", "\u30B9\u30DD\u30FC\u30C4\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u30B9\u30DD\u30FC\u30C4\u305D\u306E\u4ED6"],
    "\u82B8\u80FD": ["\u82B8\u80FD\u4E00\u822C\u7528\u8A9E", "\u30C6\u30EC\u30D3\u756A\u7D44\u30FB\u30E9\u30B8\u30AA\u756A\u7D44\u30FBCM", "\u90A6\u753B", "\u6D77\u5916\u6620\u753B", "\u73FE\u4EE3\u6F14\u5287", "\u304A\u7B11\u3044", "\u4FF3\u512A", "\u30BF\u30EC\u30F3\u30C8\u30FB\u6587\u5316\u4EBA", "\u90A6\u697D-\u662D\u548C\u4EE5\u524D", "\u90A6\u697D-\u5E73\u6210\uFF08\uFF5E2009\uFF09", "\u90A6\u697D-\u5E73\u6210\u30FB\u4EE4\u548C\uFF082010\uFF5E\uFF09", "\u6D0B\u697D\u30FB\u6D77\u5916\u97F3\u697D", "\u82B8\u80FD\u30AF\u30ED\u30B9\u30AA\u30FC\u30D0\u30FC", "\u82B8\u80FD\u305D\u306E\u4ED6"],
    "\u30CE\u30F3\u30BB\u30AF": ["\u30B8\u30E3\u30F3\u30EB\u8907\u5408", "\u30B8\u30E3\u30F3\u30EB\u4E0D\u660E"]
  };
  var GENRES = Object.keys(GENRE_DEFINITIONS);
  var VISION_BATCH_SIZE = 16;
  var GEMINI_BATCH_SIZE = 8;
  var MAX_RETRIES = 2;
  var state = {
    records: [],
    files: [],
    settings: { visionApiKey: "", geminiApiKey: "" },
    query: "",
    encoding: "utf-8",
    editingId: null,
    busy: false,
    progress: { current: 0, total: 0, message: "" }
  };
  var app = document.querySelector("#app");
  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("records")) db.createObjectStore("records", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function loadData() {
    const db = await openDb();
    const records = await new Promise((resolve, reject) => {
      const request = db.transaction("records", "readonly").objectStore("records").getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      request.onerror = () => reject(request.error);
    });
    const settings = await new Promise((resolve, reject) => {
      const request = db.transaction("settings", "readonly").objectStore("settings").get("api");
      request.onsuccess = () => resolve(request.result || { visionApiKey: "", geminiApiKey: "" });
      request.onerror = () => reject(request.error);
    });
    state.records = records.map(normalizeRecord);
    state.settings = settings;
  }
  function putRecords(records) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const transaction = db.transaction("records", "readwrite");
      records.forEach((record) => transaction.objectStore("records").put(record));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }));
  }
  function removeRecord(id) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const transaction = db.transaction("records", "readwrite");
      transaction.objectStore("records").delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }));
  }
  function removeAllRecords() {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const transaction = db.transaction("records", "readwrite");
      transaction.objectStore("records").clear();
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }));
  }
  function saveSettings() {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const transaction = db.transaction("settings", "readwrite");
      transaction.objectStore("settings").put(state.settings, "api");
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }));
  }
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  }
  function cleanOcrText(value, field = "") {
    let cleaned = String(value || "");
    if (field === "answer") cleaned = cleaned.replace(/Google|Wikipedia/gi, "");
    if (field === "question") cleaned = cleaned.replace(/\b\d{1,3}%/g, "");
    return cleaned.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }
  function normalizeRecord(record) {
    const genre = GENRE_DEFINITIONS[record.genre] ? record.genre : "";
    const subgenre = GENRE_DEFINITIONS[genre]?.includes(record.subgenre) ? record.subgenre : "";
    return {
      ...record,
      genre,
      subgenre,
      question: cleanOcrText(record.question, "question"),
      answer: cleanOcrText(record.answer, "answer")
    };
  }
  function parseOcrText(text) {
    const capture = (pattern) => text.match(pattern)?.[1]?.trim().replace(/\n{3,}/g, "\n\n") || "";
    return normalizeRecord({
      genre: "",
      subgenre: "",
      question: capture(/問題\s*([\s\S]*?)\s*解答/i),
      answer: capture(/解答\s*([\s\S]*?)(?:\s*読み|\s*正解率|$)/i)
    });
  }
  function demoRecord(imageName) {
    const rawText = "\u554F\u984C\n\u672C\u540D\u3092\u4E95\u4E0A\u4E45\u7F8E\u5B50\u3068\u3044\u3046\u5C0F\u8AAC\u5BB6\u306F\u8AB0\u3067\u3057\u3087\u3046\uFF1F\n\u89E3\u7B54\n\u9AD8\u91CE\u53F2\u7DD2\n\u8AAD\u307F\n\u305F\u304B\u306E\u3075\u307F\u304A\n\u6B63\u89E3\u7387 78%";
    return { id: crypto.randomUUID(), imageName, ...parseOcrText(rawText), rawText, confidence: 0.96, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  function similarity(left, right) {
    const a = left.replace(/\s/g, "");
    const b = right.replace(/\s/g, "");
    if (!a || !b) return 0;
    return [...a].filter((char, index) => char === b[index]).length / Math.max(a.length, b.length);
  }
  function notify(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.append(toast);
    setTimeout(() => toast.remove(), 2800);
  }
  function render() {
    const query = state.query.toLowerCase();
    const records = state.records.filter((record) => `${record.question} ${record.answer} ${record.genre} ${record.subgenre}`.toLowerCase().includes(query));
    app.innerHTML = `
    <div class="app-shell">
      <header class="topbar"><div class="brand"><span class="brand-mark">Q.</span><div>\u307F\u3093\u306F\u3084OCR\u554F\u984C\u30EA\u30FC\u30C0\u30FC<small>Quiz image to CSV</small></div></div><button class="settings-trigger" data-action="settings" aria-label="API\u8A2D\u5B9A">\u2699</button></header>
      <main class="content">
        <section class="page-heading"><div><div class="eyebrow">Question bank / 01</div><h1>\u554F\u984C\u753B\u50CF\u3092\u3001<br><em>\u4F7F\u3048\u308B\u30C7\u30FC\u30BF</em>\u3078\u3002</h1><p class="lede">OCR\u3067\u8AAD\u307F\u53D6\u308A\u3001\u3042\u306A\u305F\u306E\u76EE\u3067\u6574\u3048\u3066\u3001\u3059\u3050\u306BCSV\u3078\u3002</p></div><div class="stats"><div class="stat"><strong>${state.records.length}</strong><span>\u4FDD\u5B58\u6E08\u307F</span></div><div class="stat"><strong>${state.files.length}</strong><span>\u5F85\u6A5F\u4E2D</span></div></div></section>
        <div class="workspace">
          <section class="panel upload-panel"><div class="panel-head"><div><h2>\u753B\u50CFOCR\u53D6\u8FBC</h2><p>\u8907\u6570\u306E\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8\u3092\u4E00\u5EA6\u306B\u51E6\u7406</p></div><span class="eyebrow">${state.busy ? "working" : "ready"}</span></div>
          <div class="drop-zone" data-dropzone><div><div class="drop-icon">\uFF0B</div><h3>\u753B\u50CF\u3092\u30C9\u30ED\u30C3\u30D7</h3><p>PNG / JPG / WEBP \u306B\u5BFE\u5FDC</p><label class="button secondary">\u30D5\u30A1\u30A4\u30EB\u3092\u9078\u629E<input hidden type="file" accept="image/*" multiple data-files></label></div></div>
            <div class="queue"><div class="queue-title"><span>\u6295\u5165\u6E08\u307F\u753B\u50CF</span><span>${state.files.length}\u4EF6</span></div>${state.files.length ? state.files.map((file, index) => `<div class="file-row"><span class="file-type">IMG</span><span>${escapeHtml(file.name)}</span><button data-remove-file="${index}" aria-label="\u524A\u9664">\xD7</button></div>`).join("") : `<div class="file-row"><span class="file-type">--</span><span>\u753B\u50CF\u3092\u8FFD\u52A0\u3059\u308B\u3068\u3053\u3053\u306B\u8868\u793A\u3055\u308C\u307E\u3059</span></div>`}</div>
            <div class="action-pad">${state.busy ? `<div class="ocr-progress" role="status"><div class="progress-label"><span>${escapeHtml(state.progress.message)}</span><strong>${state.progress.current} / ${state.progress.total}</strong></div><div class="progress-track"><span style="width:${state.progress.total ? Math.round(state.progress.current / state.progress.total * 100) : 0}%"></span></div></div>` : ""}<button class="button primary full" data-action="ocr" ${!state.files.length || state.busy ? "disabled" : ""}>${state.busy ? "OCR\u51E6\u7406\u4E2D..." : state.settings.visionApiKey ? "Vision OCR\u3092\u958B\u59CB" : "\u30C7\u30E2OCR\u3092\u958B\u59CB"}\u3000\u2192</button></div>
          </section>
          <section class="panel pool-panel"><div class="panel-head"><div><h2>OCR\u7D50\u679C\u30D7\u30FC\u30EB</h2><p>\u8AAD\u307F\u53D6\u308A\u7D50\u679C\u3092\u78BA\u8A8D\u30FB\u7DE8\u96C6</p></div><div class="pool-summary"><span class="eyebrow">${records.length} records</span><button class="button danger" data-action="delete-all" ${!state.records.length || state.busy ? "disabled" : ""}>\u4E00\u62EC\u524A\u9664</button></div></div><div class="pool-tools"><input class="search" data-search value="${escapeHtml(state.query)}" placeholder="\u554F\u984C\u30FB\u89E3\u7B54\u30FB\u30B8\u30E3\u30F3\u30EB\u30FB\u30B5\u30D6\u30B8\u30E3\u30F3\u30EB\u3092\u691C\u7D22"><button class="button ghost" data-action="clear-search">\u232B</button></div><div class="record-list">${records.length ? records.map(recordCard).join("") : `<div class="empty"><strong>\u307E\u3060\u554F\u984C\u304C\u3042\u308A\u307E\u305B\u3093</strong>\u753B\u50CF\u3092\u8FFD\u52A0\u3057\u3066OCR\u3092\u958B\u59CB\u3057\u3066\u304F\u3060\u3055\u3044\u3002</div>`}</div></section>
        </div>
        <div class="footer-actions"><span class="status">${state.settings.visionApiKey ? "Vision API\u63A5\u7D9A\u8A2D\u5B9A\u6E08\u307F" : "\u30C7\u30E2\u30E2\u30FC\u30C9 / API\u30AD\u30FC\u672A\u8A2D\u5B9A"}</span><div class="export-controls"><label class="radio"><input type="radio" name="encoding" value="utf-8" ${state.encoding === "utf-8" ? "checked" : ""}> UTF-8</label><label class="radio"><input type="radio" name="encoding" value="shift-jis" ${state.encoding === "shift-jis" ? "checked" : ""}> Shift_JIS</label><button class="button primary" data-action="export" ${!state.records.length ? "disabled" : ""}>CSV\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3000\u2193</button></div></div>
      </main>
    </div>`;
    bindEvents();
  }
  function recordCard(record) {
    const classification = [record.genre, record.subgenre].filter(Boolean).join(" / ") || "\u30B8\u30E3\u30F3\u30EB\u672A\u8A2D\u5B9A";
    return `<article class="record"><div class="record-top"><span class="tag">${escapeHtml(classification)}</span><span class="confidence">OCR ${Math.round((record.confidence || 0) * 100)}%</span></div><h3>${escapeHtml(record.answer || "\u89E3\u7B54\u672A\u5165\u529B")}</h3><p>${escapeHtml(record.question || "\u554F\u984C\u6587\u672A\u5165\u529B")}</p><div class="record-actions"><button class="button secondary" data-edit="${record.id}">\u7DE8\u96C6</button><button class="button danger" data-delete="${record.id}">\u524A\u9664</button></div></article>`;
  }
  function bindEvents() {
    document.querySelector("[data-files]")?.addEventListener("change", (event) => addFiles([...event.target.files]));
    const dropzone = document.querySelector("[data-dropzone]");
    dropzone?.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("active");
    });
    dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("active"));
    dropzone?.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("active");
      addFiles([...event.dataTransfer.files]);
    });
    document.querySelector("[data-search]")?.addEventListener("input", (event) => {
      state.query = event.target.value;
      render();
      const input = document.querySelector("[data-search]");
      input.focus();
      input.setSelectionRange(state.query.length, state.query.length);
    });
    document.querySelectorAll("[data-remove-file]").forEach((button) => button.addEventListener("click", () => {
      state.files.splice(Number(button.dataset.removeFile), 1);
      render();
    }));
    document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => showEdit(button.dataset.edit)));
    document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
      state.records = state.records.filter((record) => record.id !== button.dataset.delete);
      await removeRecord(button.dataset.delete);
      render();
      notify("\u554F\u984C\u3092\u524A\u9664\u3057\u307E\u3057\u305F");
    }));
    document.querySelector("[data-action=delete-all]")?.addEventListener("click", async () => {
      if (!confirm(`${state.records.length}\u4EF6\u306E\u554F\u984C\u3092\u3059\u3079\u3066\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F`)) return;
      await removeAllRecords();
      state.records = [];
      render();
      notify("\u554F\u984C\u3092\u4E00\u62EC\u524A\u9664\u3057\u307E\u3057\u305F");
    });
    document.querySelectorAll("[name=encoding]").forEach((input) => input.addEventListener("change", (event) => {
      state.encoding = event.target.value;
    }));
    document.querySelector("[data-action=ocr]")?.addEventListener("click", runOcr);
    document.querySelector("[data-action=export]")?.addEventListener("click", exportCsv);
    document.querySelector("[data-action=clear-search]")?.addEventListener("click", () => {
      state.query = "";
      render();
    });
    document.querySelector("[data-action=settings]")?.addEventListener("click", showSettings);
  }
  function addFiles(files) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    const existing = new Set(state.files.map((file) => file.name));
    state.files.push(...images.filter((file) => !existing.has(file.name)));
    if (images.length) notify(`${images.length}\u4EF6\u306E\u753B\u50CF\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F`);
    render();
  }
  function fileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  function retryDelay(response, attempt) {
    const retryAfter = Number(response?.headers?.get("Retry-After"));
    if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.min(retryAfter * 1e3, 1e4);
    return 700 * 2 ** attempt + Math.floor(Math.random() * 250);
  }
  async function fetchJsonWithRetry(url, options, unavailableMessage) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      let response;
      try {
        response = await fetch(url, options);
      } catch (error) {
        if (attempt === MAX_RETRIES) throw new Error(error.message || unavailableMessage);
        await new Promise((resolve) => setTimeout(resolve, retryDelay(null, attempt)));
        continue;
      }
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === MAX_RETRIES) {
        throw new Error(data.error?.message || unavailableMessage);
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
    }
    throw new Error(unavailableMessage);
  }
  async function requestVisionOcrBatch(files, apiKey) {
    const requests = await Promise.all(files.map(async (file) => ({
      image: { content: await fileAsBase64(file) },
      features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      imageContext: { languageHints: ["ja"] }
    })));
    const data = await fetchJsonWithRetry(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests })
    }, "Google Vision API\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    return files.map((file, index) => {
      const result = data.responses?.[index];
      if (result?.error) return { file, error: result.error.message || "Google Vision API\u3067OCR\u306B\u5931\u6557\u3057\u307E\u3057\u305F" };
      const text = result?.fullTextAnnotation?.text;
      if (!text) return { file, error: "OCR\u30C6\u30AD\u30B9\u30C8\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F" };
      return { file, text, confidence: result.fullTextAnnotation.pages?.[0]?.confidence ?? 0.8 };
    });
  }
  function geminiResponseSchema(ids) {
    return {
      type: "array",
      minItems: ids.length,
      maxItems: ids.length,
      items: {
        type: "object",
        properties: {
          id: { type: "string", enum: ids },
          genre: { type: "string", enum: GENRES },
          subgenre: { type: "string" },
          question: { type: "string" },
          answer: { type: "string" }
        },
        required: ["id", "genre", "subgenre", "question", "answer"],
        additionalProperties: false
      }
    };
  }
  function validateGeminiBatchResult(value, items) {
    if (!Array.isArray(value) || value.length !== items.length) throw new Error("Gemini\u306E\u5FDC\u7B54\u4EF6\u6570\u304C\u5165\u529B\u3068\u4E00\u81F4\u3057\u307E\u305B\u3093");
    const expectedIds = new Set(items.map((item) => item.id));
    const seenIds = /* @__PURE__ */ new Set();
    const results = /* @__PURE__ */ new Map();
    for (const item of value) {
      const keys = ["id", "genre", "subgenre", "question", "answer"];
      if (!item || typeof item !== "object" || !keys.every((key) => typeof item[key] === "string")) throw new Error("Gemini\u306E\u5FDC\u7B54\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059");
      if (!expectedIds.has(item.id) || seenIds.has(item.id)) throw new Error("Gemini\u306E\u5FDC\u7B54ID\u304C\u4E0D\u6B63\u3067\u3059");
      const result = normalizeRecord(Object.fromEntries(keys.filter((key) => key !== "id").map((key) => [key, item[key].trim()])));
      if (!result.genre || !result.subgenre) throw new Error("Gemini\u306E\u30B8\u30E3\u30F3\u30EB\u5206\u985E\u304C\u4E0D\u6B63\u3067\u3059");
      seenIds.add(item.id);
      results.set(item.id, result);
    }
    if (seenIds.size !== expectedIds.size) throw new Error("Gemini\u306E\u5FDC\u7B54\u306B\u6B20\u843D\u3057\u305F\u9805\u76EE\u304C\u3042\u308A\u307E\u3059");
    return results;
  }
  async function requestGeminiCorrectionBatch(items, apiKey) {
    const ids = items.map((item) => item.id);
    const input = items.map(({ id, rawText }) => ({ id, rawText }));
    const prompt = `\u3042\u306A\u305F\u306F\u300C\u307F\u3093\u306A\u3067\u65E9\u62BC\u3057\u300D\u554F\u984C\u306EOCR\u88DC\u6B63\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002
\u5165\u529B\u914D\u5217\u306E\u5404\u9805\u76EE\u306B\u3064\u3044\u3066\u3001\u540C\u3058id\u3092\u6301\u3064\u7D50\u679C\u3092\u5FC5\u305A1\u4EF6\u305A\u3064\u3001\u5165\u529B\u9806\u3092\u7DAD\u6301\u3057\u3066\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u4ED6\u306E\u9805\u76EE\u306E\u672C\u6587\u3092\u6DF7\u305C\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002\u4E0D\u78BA\u304B\u306A\u6587\u5B57\u3092\u52DD\u624B\u306B\u63A8\u6E2C\u305B\u305A\u3001OCR\u672C\u6587\u3092\u512A\u5148\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u554F\u984C\u3068\u89E3\u7B54\u3092\u81EA\u7136\u306A\u65E5\u672C\u8A9E\u3078\u88DC\u6B63\u3057\u3001\u6700\u3082\u9069\u3057\u305F\u30B8\u30E3\u30F3\u30EB\u3068\u30B5\u30D6\u30B8\u30E3\u30F3\u30EB\u3092\u5019\u88DC\u304B\u30891\u3064\u305A\u3064\u5272\u308A\u5F53\u3066\u3066\u304F\u3060\u3055\u3044\u3002
\u30B8\u30E3\u30F3\u30EB\u5019\u88DC\u3068\u30B5\u30D6\u30B8\u30E3\u30F3\u30EB\u5019\u88DC: ${JSON.stringify(GENRE_DEFINITIONS)}
\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u7531\u6765\u306E\u767E\u5206\u7387\u8868\u8A18\uFF08\u4F8B: 67%\uFF09\u306F\u554F\u984C\u6587\u304B\u3089\u9664\u53BB\u3057\u3001\u89E3\u7B54\u306B\u6DF7\u5165\u3057\u305F Google \u3068 Wikipedia \u3082\u9664\u53BB\u3057\u3066\u304F\u3060\u3055\u3044\u3002
JSON\u914D\u5217\u306E\u307F\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u5404\u8981\u7D20\u306E\u30AD\u30FC\u306F id, genre, subgenre, question, answer \u3067\u3059\u3002

\u5165\u529B:
${JSON.stringify(input)}`;
    const data = await fetchJsonWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: geminiResponseSchema(ids) }
      })
    }, "Gemini API\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error("Gemini\u306E\u5FDC\u7B54\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    try {
      return validateGeminiBatchResult(JSON.parse(candidate), items);
    } catch (error) {
      error.splitBatch = true;
      throw error;
    }
  }
  async function correctBatchWithFallback(items, apiKey) {
    try {
      return await requestGeminiCorrectionBatch(items, apiKey);
    } catch (error) {
      if (items.length > 1 && error.splitBatch) {
        const midpoint = Math.ceil(items.length / 2);
        const left = await correctBatchWithFallback(items.slice(0, midpoint), apiKey);
        const right = await correctBatchWithFallback(items.slice(midpoint), apiKey);
        return new Map([...left, ...right]);
      }
      notify(`${items[0].imageName}: Gemini\u88DC\u6B63\u3092\u30B9\u30AD\u30C3\u30D7\u3057\u307E\u3057\u305F`);
      return /* @__PURE__ */ new Map([[items[0].id, parseOcrText(items[0].rawText)]]);
    }
  }
  async function runOcr() {
    state.busy = true;
    state.progress = { current: 0, total: state.files.length, message: "OCR\u51E6\u7406\u3092\u6E96\u5099\u4E2D..." };
    render();
    const queuedFiles = [...state.files];
    const failedFiles = /* @__PURE__ */ new Set();
    try {
      const imported = [];
      if (!state.settings.visionApiKey) {
        for (const [index, file] of queuedFiles.entries()) {
          imported.push(demoRecord(file.name));
          state.progress = { current: index + 1, total: queuedFiles.length, message: `${index + 1} / ${queuedFiles.length}\u4EF6\u5B8C\u4E86` };
          render();
        }
      } else {
        const ocrItems = [];
        for (let start = 0; start < queuedFiles.length; start += VISION_BATCH_SIZE) {
          const files = queuedFiles.slice(start, start + VISION_BATCH_SIZE);
          state.progress = { current: start, total: queuedFiles.length, message: `Vision OCR\u3092\u5B9F\u884C\u4E2D (${start + 1}-${start + files.length}\u4EF6)` };
          render();
          let visionResults;
          try {
            visionResults = await requestVisionOcrBatch(files, state.settings.visionApiKey);
          } catch (error) {
            files.forEach((file) => failedFiles.add(file));
            notify(`Vision OCR\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${error.message}`);
            continue;
          }
          visionResults.forEach(({ file, text, confidence, error }) => {
            if (error) {
              failedFiles.add(file);
              notify(`${file.name}: ${error}`);
              return;
            }
            ocrItems.push({ id: crypto.randomUUID(), file, imageName: file.name, rawText: text, confidence });
          });
          state.progress = { current: Math.min(start + files.length, queuedFiles.length), total: queuedFiles.length, message: `Vision OCR\u5B8C\u4E86 (${Math.min(start + files.length, queuedFiles.length)} / ${queuedFiles.length}\u4EF6)` };
          render();
        }
        for (let start = 0; start < ocrItems.length; start += GEMINI_BATCH_SIZE) {
          const items = ocrItems.slice(start, start + GEMINI_BATCH_SIZE);
          const corrected = state.settings.geminiApiKey ? await correctBatchWithFallback(items, state.settings.geminiApiKey) : new Map(items.map((item) => [item.id, parseOcrText(item.rawText)]));
          const batchRecords = items.map((item) => ({
            id: item.id,
            imageName: item.imageName,
            ...normalizeRecord(corrected.get(item.id) || parseOcrText(item.rawText)),
            rawText: item.rawText,
            confidence: item.confidence,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }));
          imported.push(...batchRecords);
          await putRecords(batchRecords);
          state.progress = { current: Math.min(start + items.length, ocrItems.length), total: queuedFiles.length, message: `Gemini\u88DC\u6B63\u5B8C\u4E86 (${Math.min(start + items.length, ocrItems.length)} / ${ocrItems.length}\u4EF6)` };
          render();
        }
      }
      const duplicates = imported.filter((item) => state.records.some((old) => old.answer === item.answer || similarity(old.answer, item.answer) >= 0.95));
      state.records = [...imported, ...state.records];
      state.files = queuedFiles.filter((file) => failedFiles.has(file));
      const failureMessage = failedFiles.size ? `\u3001${failedFiles.size}\u4EF6\u306F\u518D\u8A66\u884C\u5F85\u3061` : "";
      notify(duplicates.length ? `${imported.length}\u4EF6\u3092\u8FFD\u52A0\u3002\u91CD\u8907\u5019\u88DC\u304C${duplicates.length}\u4EF6\u3042\u308A\u307E\u3059${failureMessage}` : `${imported.length}\u4EF6\u306EOCR\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F${failureMessage}`);
    } catch (error) {
      notify(error.message || "OCR\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    } finally {
      state.busy = false;
      render();
    }
  }
  function showEdit(id) {
    const record = state.records.find((item) => item.id === id);
    if (!record) return;
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `<div class="modal"><div class="modal-head"><div><div class="eyebrow">Review record</div><h2>\u554F\u984C\u3092\u7DE8\u96C6</h2></div><button class="close" data-close>\xD7</button></div><form class="form"><label class="field-wrap"><span>\u554F\u984C</span><textarea class="field textarea" name="question">${escapeHtml(record.question)}</textarea></label><label class="field-wrap"><span>\u89E3\u7B54</span><input class="field" name="answer" value="${escapeHtml(record.answer)}"></label><label class="field-wrap"><span>\u30B8\u30E3\u30F3\u30EB</span><select class="field" name="genre" data-genre-select><option value="">\u672A\u8A2D\u5B9A</option>${GENRES.map((genre) => `<option value="${genre}" ${record.genre === genre ? "selected" : ""}>${genre}</option>`).join("")}</select></label><label class="field-wrap"><span>\u30B5\u30D6\u30B8\u30E3\u30F3\u30EB</span><select class="field" name="subgenre" data-subgenre-select></select></label><div class="modal-actions"><button class="button ghost" type="button" data-close>\u30AD\u30E3\u30F3\u30BB\u30EB</button><button class="button primary">\u4FDD\u5B58\u3059\u308B</button></div></form></div>`;
    document.body.append(modal);
    const genreSelect = modal.querySelector("[data-genre-select]");
    const subgenreSelect = modal.querySelector("[data-subgenre-select]");
    const updateSubgenres = () => {
      const subgenres = GENRE_DEFINITIONS[genreSelect.value] || [];
      subgenreSelect.innerHTML = `<option value="">\u672A\u8A2D\u5B9A</option>${subgenres.map((subgenre) => `<option value="${subgenre}" ${record.subgenre === subgenre ? "selected" : ""}>${subgenre}</option>`).join("")}`;
    };
    genreSelect.addEventListener("change", () => {
      record.subgenre = "";
      updateSubgenres();
    });
    updateSubgenres();
    modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
    modal.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      Object.assign(record, normalizeRecord(Object.fromEntries(data)));
      await putRecords([record]);
      modal.remove();
      render();
      notify("\u5909\u66F4\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F");
    });
  }
  function showSettings() {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `<div class="modal"><div class="modal-head"><div><div class="eyebrow">Private settings</div><h2>API\u8A2D\u5B9A</h2></div><button class="close" data-close>\xD7</button></div><form class="form"><p class="lede note">Vision\u306F\u6587\u5B57\u8A8D\u8B58\u3001Gemini\u306FOCR\u7D50\u679C\u306E\u88DC\u6B63\u306B\u4F7F\u3044\u307E\u3059\u3002\u30AD\u30FC\u306F\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u306EIndexedDB\u306B\u4FDD\u5B58\u3055\u308C\u3001GitHub Pages\u3067\u306F\u5229\u7528\u8005\u304B\u3089\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002</p><label class="field-wrap"><span>Google Cloud Vision API Key</span><input class="field" type="password" name="visionApiKey" value="${escapeHtml(state.settings.visionApiKey || "")}" autocomplete="off" placeholder="AIza..."></label><label class="field-wrap"><span>Gemini API Key\uFF08\u4EFB\u610F\uFF09</span><input class="field" type="password" name="geminiApiKey" value="${escapeHtml(state.settings.geminiApiKey || "")}" autocomplete="off" placeholder="AIza..."></label><div class="modal-actions"><button class="button ghost" type="button" data-close>\u30AD\u30E3\u30F3\u30BB\u30EB</button><button class="button primary">\u8A2D\u5B9A\u3092\u4FDD\u5B58</button></div></form></div>`;
    document.body.append(modal);
    modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
    modal.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      state.settings.visionApiKey = data.visionApiKey || "";
      state.settings.geminiApiKey = data.geminiApiKey || "";
      await saveSettings();
      modal.remove();
      render();
      notify("API\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F");
    });
  }
  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }
  function exportCsv() {
    const header = ["\u554F\u984C", "\u89E3\u7B54", "\u89E3\u8AAC", "\u30B8\u30E3\u30F3\u30EB", "\u30B5\u30D6\u30B8\u30E3\u30F3\u30EB"];
    const rows = state.records.map((record) => {
      const normalized = normalizeRecord(record);
      return [normalized.question, normalized.answer, "", normalized.genre, normalized.subgenre];
    });
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `minhaya-quiz-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  loadData().then(render).catch(() => render());
})();
