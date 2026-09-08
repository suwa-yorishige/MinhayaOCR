(() => {
  // src/main.js
  var DB_NAME = "minhaya-ocr-pages";
  var DB_VERSION = 1;
  var GENRES = ["\u81EA\u7136\u79D1\u5B66", "\u793E\u4F1A", "\u5730\u7406\u30FB\u6B74\u53F2", "\u751F\u6D3B\u30FB\u96D1\u5B66", "\u82B8\u8853\u30FB\u30A8\u30F3\u30BF\u30E1", "\u30B9\u30DD\u30FC\u30C4\u30FB\u8DA3\u5473", "\u6587\u5B66\u30FB\u3053\u3068\u3070"];
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
  function normalizeGenre(value) {
    const text = cleanOcrText(value);
    return GENRES.find((genre) => text.includes(genre)) || "\u672A\u5206\u985E";
  }
  function normalizeRecord(record) {
    return {
      ...record,
      category: normalizeGenre(record.category),
      question: cleanOcrText(record.question, "question"),
      answer: cleanOcrText(record.answer, "answer")
    };
  }
  function parseOcrText(text) {
    const lines = text.split(/\r?\n/);
    const category = lines.find((line) => line.trim() && !/問題|解答|読み|正解率/.test(line))?.trim() || "\u672A\u5206\u985E";
    const capture = (pattern) => text.match(pattern)?.[1]?.trim().replace(/\n{3,}/g, "\n\n") || "";
    return normalizeRecord({
      category,
      question: capture(/問題\s*([\s\S]*?)\s*解答/i),
      answer: capture(/解答\s*([\s\S]*?)(?:\s*読み|\s*正解率|$)/i)
    });
  }
  function demoRecord(imageName) {
    const rawText = "\u6587\u5B66\u30FB\u3053\u3068\u3070\n\u554F\u984C\n\u672C\u540D\u3092\u4E95\u4E0A\u4E45\u7F8E\u5B50\u3068\u3044\u3046\u5C0F\u8AAC\u5BB6\u306F\u8AB0\u3067\u3057\u3087\u3046\uFF1F\n\u89E3\u7B54\n\u9AD8\u91CE\u53F2\u7DD2\n\u8AAD\u307F\n\u305F\u304B\u306E\u3075\u307F\u304A\n\u6B63\u89E3\u7387 78%";
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
    const records = state.records.filter((record) => `${record.question} ${record.answer} ${record.category}`.toLowerCase().includes(query));
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
          <section class="panel pool-panel"><div class="panel-head"><div><h2>OCR\u7D50\u679C\u30D7\u30FC\u30EB</h2><p>\u8AAD\u307F\u53D6\u308A\u7D50\u679C\u3092\u78BA\u8A8D\u30FB\u7DE8\u96C6</p></div><div class="pool-summary"><span class="eyebrow">${records.length} records</span><button class="button danger" data-action="delete-all" ${!state.records.length || state.busy ? "disabled" : ""}>\u4E00\u62EC\u524A\u9664</button></div></div><div class="pool-tools"><input class="search" data-search value="${escapeHtml(state.query)}" placeholder="\u554F\u984C\u30FB\u89E3\u7B54\u30FB\u30AB\u30C6\u30B4\u30EA\u3092\u691C\u7D22"><button class="button ghost" data-action="clear-search">\u232B</button></div><div class="record-list">${records.length ? records.map(recordCard).join("") : `<div class="empty"><strong>\u307E\u3060\u554F\u984C\u304C\u3042\u308A\u307E\u305B\u3093</strong>\u753B\u50CF\u3092\u8FFD\u52A0\u3057\u3066OCR\u3092\u958B\u59CB\u3057\u3066\u304F\u3060\u3055\u3044\u3002</div>`}</div></section>
        </div>
        <div class="footer-actions"><span class="status">${state.settings.visionApiKey ? "Vision API\u63A5\u7D9A\u8A2D\u5B9A\u6E08\u307F" : "\u30C7\u30E2\u30E2\u30FC\u30C9 / API\u30AD\u30FC\u672A\u8A2D\u5B9A"}</span><div class="export-controls"><label class="radio"><input type="radio" name="encoding" value="utf-8" ${state.encoding === "utf-8" ? "checked" : ""}> UTF-8</label><label class="radio"><input type="radio" name="encoding" value="shift-jis" ${state.encoding === "shift-jis" ? "checked" : ""}> Shift_JIS</label><button class="button primary" data-action="export" ${!state.records.length ? "disabled" : ""}>CSV\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3000\u2193</button></div></div>
      </main>
    </div>`;
    bindEvents();
  }
  function recordCard(record) {
    return `<article class="record"><div class="record-top"><span class="tag">${escapeHtml(record.category || "\u672A\u5206\u985E")}</span><span class="confidence">OCR ${Math.round((record.confidence || 0) * 100)}%</span></div><h3>${escapeHtml(record.answer || "\u89E3\u7B54\u672A\u5165\u529B")}</h3><p>${escapeHtml(record.question || "\u554F\u984C\u6587\u672A\u5165\u529B")}</p><div class="record-actions"><button class="button secondary" data-edit="${record.id}">\u7DE8\u96C6</button><button class="button danger" data-delete="${record.id}">\u524A\u9664</button></div></article>`;
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
  async function requestVisionOcr(imageBase64, apiKey) {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: { languageHints: ["ja"] }
        }]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "Google Vision API\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    const result = data.responses?.[0];
    if (result?.error) throw new Error(result.error.message || "Google Vision API\u3067OCR\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const text = result?.fullTextAnnotation?.text;
    if (!text) throw new Error("OCR\u30C6\u30AD\u30B9\u30C8\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    return { text, confidence: result.fullTextAnnotation.pages?.[0]?.confidence ?? 0.8 };
  }
  function validateGeminiResult(value) {
    if (!value || typeof value !== "object") return null;
    const keys = ["category", "question", "answer"];
    if (!keys.every((key) => typeof value[key] === "string")) return null;
    return normalizeRecord(Object.fromEntries(keys.map((key) => [key, value[key].trim()])));
  }
  async function requestGeminiCorrection(rawText, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `\u3042\u306A\u305F\u306F\u300C\u307F\u3093\u306A\u3067\u65E9\u62BC\u3057\u300D\u554F\u984C\u306EOCR\u88DC\u6B63\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002\u4EE5\u4E0B\u306EOCR\u672C\u6587\u304B\u3089\u3001\u554F\u984C\u30FB\u89E3\u7B54\u30FB\u30B8\u30E3\u30F3\u30EB\u3092\u62BD\u51FA\u3057\u3066\u81EA\u7136\u306A\u65E5\u672C\u8A9E\u3078\u88DC\u6B63\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u30B8\u30E3\u30F3\u30EB\u306F\u5FC5\u305A\u6B21\u306E7\u3064\u306E\u3044\u305A\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${GENRES.join("\u3001")}\u3002\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u7531\u6765\u306E\u767E\u5206\u7387\u8868\u8A18\uFF08\u4F8B: 67%\uFF09\u306F\u554F\u984C\u6587\u304B\u3089\u9664\u53BB\u3057\u3001\u89E3\u7B54\u306B\u6DF7\u5165\u3057\u305F Google \u3068 Wikipedia \u3082\u9664\u53BB\u3057\u3066\u304F\u3060\u3055\u3044\u3002JSON\u306E\u307F\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u30AD\u30FC\u306F category, question, answer \u3068\u3057\u3001\u5024\u306F\u3059\u3079\u3066\u6587\u5B57\u5217\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002

OCR\u672C\u6587:
${rawText}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "Gemini API\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error("Gemini\u306E\u5FDC\u7B54\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    const result = validateGeminiResult(JSON.parse(candidate));
    if (!result) throw new Error("Gemini\u306E\u5FDC\u7B54\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059");
    return result;
  }
  async function runOcr() {
    state.busy = true;
    state.progress = { current: 0, total: state.files.length, message: "OCR\u51E6\u7406\u3092\u6E96\u5099\u4E2D..." };
    render();
    try {
      const imported = [];
      for (const [index, file] of state.files.entries()) {
        state.progress = { current: index, total: state.files.length, message: `${file.name} \u3092\u89E3\u6790\u4E2D...` };
        render();
        if (state.settings.visionApiKey) {
          const vision = await requestVisionOcr(await fileAsBase64(file), state.settings.visionApiKey);
          const parsed = parseOcrText(vision.text);
          let corrected = parsed;
          if (state.settings.geminiApiKey) {
            try {
              state.progress = { current: index, total: state.files.length, message: `${file.name} \u3092Gemini\u3067\u88DC\u6B63\u4E2D...` };
              render();
              corrected = await requestGeminiCorrection(vision.text, state.settings.geminiApiKey);
            } catch (error) {
              notify(`Gemini\u88DC\u6B63\u3092\u30B9\u30AD\u30C3\u30D7\u3057\u307E\u3057\u305F: ${error.message}`);
            }
          }
          imported.push({ id: crypto.randomUUID(), imageName: file.name, ...normalizeRecord(corrected), rawText: vision.text, confidence: vision.confidence, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
        } else {
          imported.push(demoRecord(file.name));
        }
        state.progress = { current: index + 1, total: state.files.length, message: `${index + 1} / ${state.files.length}\u4EF6\u5B8C\u4E86` };
        render();
      }
      const duplicates = imported.filter((item) => state.records.some((old) => old.answer === item.answer || similarity(old.answer, item.answer) >= 0.95));
      state.records = [...imported, ...state.records];
      await putRecords(imported);
      state.files = [];
      notify(duplicates.length ? `${imported.length}\u4EF6\u3092\u8FFD\u52A0\u3002\u91CD\u8907\u5019\u88DC\u304C${duplicates.length}\u4EF6\u3042\u308A\u307E\u3059` : `${imported.length}\u4EF6\u306EOCR\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F`);
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
    modal.innerHTML = `<div class="modal"><div class="modal-head"><div><div class="eyebrow">Review record</div><h2>\u554F\u984C\u3092\u7DE8\u96C6</h2></div><button class="close" data-close>\xD7</button></div><form class="form"><label class="field-wrap"><span>\u554F\u984C</span><textarea class="field textarea" name="question">${escapeHtml(record.question)}</textarea></label><label class="field-wrap"><span>\u89E3\u7B54</span><input class="field" name="answer" value="${escapeHtml(record.answer)}"></label><label class="field-wrap"><span>\u30B8\u30E3\u30F3\u30EB</span><select class="field" name="category"><option value="\u672A\u5206\u985E">\u672A\u5206\u985E</option>${GENRES.map((genre) => `<option value="${genre}" ${record.category === genre ? "selected" : ""}>${genre}</option>`).join("")}</select></label><div class="modal-actions"><button class="button ghost" type="button" data-close>\u30AD\u30E3\u30F3\u30BB\u30EB</button><button class="button primary">\u4FDD\u5B58\u3059\u308B</button></div></form></div>`;
    document.body.append(modal);
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
    const header = ["\u554F\u984C", "\u89E3\u7B54", "\u30AB\u30C6\u30B4\u30EA", "\u753B\u50CF\u540D", "\u4F5C\u6210\u65E5\u6642"];
    const rows = state.records.map((record) => {
      const normalized = normalizeRecord(record);
      return [normalized.question, normalized.answer, normalized.category, normalized.imageName, normalized.createdAt];
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
