import "./style.css";

const DB_NAME = "minhaya-ocr-pages";
const DB_VERSION = 1;
const GENRES = ["自然科学", "社会", "地理・歴史", "生活・雑学", "芸術・エンタメ", "スポーツ・趣味", "文学・ことば"];
const state = {
  records: [],
  files: [],
  settings: { visionApiKey: "", geminiApiKey: "" },
  query: "",
  encoding: "utf-8",
  editingId: null,
  busy: false,
  progress: { current: 0, total: 0, message: "" },
};

const app = document.querySelector("#app");

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
  return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
}

function cleanOcrText(value, field = "") {
  let cleaned = String(value || "");
  if (field === "answer") cleaned = cleaned.replace(/Google|Wikipedia/gi, "");
  if (field === "question") cleaned = cleaned.replace(/\b\d{1,3}%/g, "");
  return cleaned.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeGenre(value) {
  const text = cleanOcrText(value);
  return GENRES.find((genre) => text.includes(genre)) || "未分類";
}

function normalizeRecord(record) {
  return {
    ...record,
    category: normalizeGenre(record.category),
    question: cleanOcrText(record.question, "question"),
    answer: cleanOcrText(record.answer, "answer"),
  };
}

function parseOcrText(text) {
  const lines = text.split(/\r?\n/);
  const category = lines.find((line) => line.trim() && !/問題|解答|読み|正解率/.test(line))?.trim() || "未分類";
  const capture = (pattern) => text.match(pattern)?.[1]?.trim().replace(/\n{3,}/g, "\n\n") || "";
  return normalizeRecord({
    category,
    question: capture(/問題\s*([\s\S]*?)\s*解答/i),
    answer: capture(/解答\s*([\s\S]*?)(?:\s*読み|\s*正解率|$)/i),
  });
}

function demoRecord(imageName) {
  const rawText = "文学・ことば\n問題\n本名を井上久美子という小説家は誰でしょう？\n解答\n高野史緒\n読み\nたかのふみお\n正解率 78%";
  return { id: crypto.randomUUID(), imageName, ...parseOcrText(rawText), rawText, confidence: 0.96, createdAt: new Date().toISOString() };
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
      <header class="topbar"><div class="brand"><span class="brand-mark">Q.</span><div>みんはやOCR問題リーダー<small>Quiz image to CSV</small></div></div><button class="settings-trigger" data-action="settings" aria-label="API設定">⚙</button></header>
      <main class="content">
        <section class="page-heading"><div><div class="eyebrow">Question bank / 01</div><h1>問題画像を、<br><em>使えるデータ</em>へ。</h1><p class="lede">OCRで読み取り、あなたの目で整えて、すぐにCSVへ。</p></div><div class="stats"><div class="stat"><strong>${state.records.length}</strong><span>保存済み</span></div><div class="stat"><strong>${state.files.length}</strong><span>待機中</span></div></div></section>
        <div class="workspace">
          <section class="panel upload-panel"><div class="panel-head"><div><h2>画像OCR取込</h2><p>複数のスクリーンショットを一度に処理</p></div><span class="eyebrow">${state.busy ? "working" : "ready"}</span></div>
            <div class="drop-zone" data-dropzone><div><div class="drop-icon">＋</div><h3>画像をドロップ</h3><p>PNG / JPG / WEBP に対応</p><label class="button secondary">ファイルを選択<input hidden type="file" accept="image/*" multiple data-files></label></div></div>
            <div class="queue"><div class="queue-title"><span>投入済み画像</span><span>${state.files.length}件</span></div>${state.files.length ? state.files.map((file, index) => `<div class="file-row"><span class="file-type">IMG</span><span>${escapeHtml(file.name)}</span><button data-remove-file="${index}" aria-label="削除">×</button></div>`).join("") : `<div class="file-row"><span class="file-type">--</span><span>画像を追加するとここに表示されます</span></div>`}</div>
            <div class="action-pad">${state.busy ? `<div class="ocr-progress" role="status"><div class="progress-label"><span>${escapeHtml(state.progress.message)}</span><strong>${state.progress.current} / ${state.progress.total}</strong></div><div class="progress-track"><span style="width:${state.progress.total ? Math.round(state.progress.current / state.progress.total * 100) : 0}%"></span></div></div>` : ""}<button class="button primary full" data-action="ocr" ${!state.files.length || state.busy ? "disabled" : ""}>${state.busy ? "OCR処理中..." : state.settings.visionApiKey ? "Vision OCRを開始" : "デモOCRを開始"}　→</button></div>
          </section>
          <section class="panel pool-panel"><div class="panel-head"><div><h2>OCR結果プール</h2><p>読み取り結果を確認・編集</p></div><div class="pool-summary"><span class="eyebrow">${records.length} records</span><button class="button danger" data-action="delete-all" ${!state.records.length || state.busy ? "disabled" : ""}>一括削除</button></div></div><div class="pool-tools"><input class="search" data-search value="${escapeHtml(state.query)}" placeholder="問題・解答・カテゴリを検索"><button class="button ghost" data-action="clear-search">⌫</button></div><div class="record-list">${records.length ? records.map(recordCard).join("") : `<div class="empty"><strong>まだ問題がありません</strong>画像を追加してOCRを開始してください。</div>`}</div></section>
        </div>
        <div class="footer-actions"><span class="status">${state.settings.visionApiKey ? "Vision API接続設定済み" : "デモモード / APIキー未設定"}</span><div class="export-controls"><label class="radio"><input type="radio" name="encoding" value="utf-8" ${state.encoding === "utf-8" ? "checked" : ""}> UTF-8</label><label class="radio"><input type="radio" name="encoding" value="shift-jis" ${state.encoding === "shift-jis" ? "checked" : ""}> Shift_JIS</label><button class="button primary" data-action="export" ${!state.records.length ? "disabled" : ""}>CSVをダウンロード　↓</button></div></div>
      </main>
    </div>`;
  bindEvents();
}

function recordCard(record) {
  return `<article class="record"><div class="record-top"><span class="tag">${escapeHtml(record.category || "未分類")}</span><span class="confidence">OCR ${Math.round((record.confidence || 0) * 100)}%</span></div><h3>${escapeHtml(record.answer || "解答未入力")}</h3><p>${escapeHtml(record.question || "問題文未入力")}</p><div class="record-actions"><button class="button secondary" data-edit="${record.id}">編集</button><button class="button danger" data-delete="${record.id}">削除</button></div></article>`;
}

function bindEvents() {
  document.querySelector("[data-files]")?.addEventListener("change", (event) => addFiles([...event.target.files]));
  const dropzone = document.querySelector("[data-dropzone]");
  dropzone?.addEventListener("dragover", (event) => { event.preventDefault(); dropzone.classList.add("active"); });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("active"));
  dropzone?.addEventListener("drop", (event) => { event.preventDefault(); dropzone.classList.remove("active"); addFiles([...event.dataTransfer.files]); });
  document.querySelector("[data-search]")?.addEventListener("input", (event) => { state.query = event.target.value; render(); const input = document.querySelector("[data-search]"); input.focus(); input.setSelectionRange(state.query.length, state.query.length); });
  document.querySelectorAll("[data-remove-file]").forEach((button) => button.addEventListener("click", () => { state.files.splice(Number(button.dataset.removeFile), 1); render(); }));
  document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => showEdit(button.dataset.edit)));
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => { state.records = state.records.filter((record) => record.id !== button.dataset.delete); await removeRecord(button.dataset.delete); render(); notify("問題を削除しました"); }));
  document.querySelector("[data-action=delete-all]")?.addEventListener("click", async () => {
    if (!confirm(`${state.records.length}件の問題をすべて削除しますか？`)) return;
    await removeAllRecords();
    state.records = [];
    render();
    notify("問題を一括削除しました");
  });
  document.querySelectorAll("[name=encoding]").forEach((input) => input.addEventListener("change", (event) => { state.encoding = event.target.value; }));
  document.querySelector("[data-action=ocr]")?.addEventListener("click", runOcr);
  document.querySelector("[data-action=export]")?.addEventListener("click", exportCsv);
  document.querySelector("[data-action=clear-search]")?.addEventListener("click", () => { state.query = ""; render(); });
  document.querySelector("[data-action=settings]")?.addEventListener("click", showSettings);
}

function addFiles(files) {
  const images = files.filter((file) => file.type.startsWith("image/"));
  const existing = new Set(state.files.map((file) => file.name));
  state.files.push(...images.filter((file) => !existing.has(file.name)));
  if (images.length) notify(`${images.length}件の画像を追加しました`);
  render();
}

function fileAsBase64(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
}

async function requestVisionOcr(imageBase64, apiKey) {
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{
        image: { content: imageBase64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: { languageHints: ["ja"] },
      }],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Google Vision APIに接続できませんでした");
  const result = data.responses?.[0];
  if (result?.error) throw new Error(result.error.message || "Google Vision APIでOCRに失敗しました");
  const text = result?.fullTextAnnotation?.text;
  if (!text) throw new Error("OCRテキストを取得できませんでした");
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
      contents: [{ parts: [{ text: `あなたは「みんなで早押し」問題のOCR補正アシスタントです。以下のOCR本文から、問題・解答・ジャンルを抽出して自然な日本語へ補正してください。ジャンルは必ず次の7つのいずれかにしてください: ${GENRES.join("、")}。スマートフォンのステータスバー由来の百分率表記（例: 67%）は問題文から除去し、解答に混入した Google と Wikipedia も除去してください。JSONのみを返してください。キーは category, question, answer とし、値はすべて文字列にしてください。\n\nOCR本文:\n${rawText}` }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Gemini APIに接続できませんでした");
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error("Geminiの応答を取得できませんでした");
  const result = validateGeminiResult(JSON.parse(candidate));
  if (!result) throw new Error("Geminiの応答形式が不正です");
  return result;
}

async function runOcr() {
  state.busy = true;
  state.progress = { current: 0, total: state.files.length, message: "OCR処理を準備中..." };
  render();
  try {
    const imported = [];
    for (const [index, file] of state.files.entries()) {
      state.progress = { current: index, total: state.files.length, message: `${file.name} を解析中...` };
      render();
      if (state.settings.visionApiKey) {
        const vision = await requestVisionOcr(await fileAsBase64(file), state.settings.visionApiKey);
        const parsed = parseOcrText(vision.text);
        let corrected = parsed;
        if (state.settings.geminiApiKey) {
          try {
            state.progress = { current: index, total: state.files.length, message: `${file.name} をGeminiで補正中...` };
            render();
            corrected = await requestGeminiCorrection(vision.text, state.settings.geminiApiKey);
          } catch (error) {
            notify(`Gemini補正をスキップしました: ${error.message}`);
          }
        }
        imported.push({ id: crypto.randomUUID(), imageName: file.name, ...normalizeRecord(corrected), rawText: vision.text, confidence: vision.confidence, createdAt: new Date().toISOString() });
      } else {
        imported.push(demoRecord(file.name));
      }
      state.progress = { current: index + 1, total: state.files.length, message: `${index + 1} / ${state.files.length}件完了` };
      render();
    }
    const duplicates = imported.filter((item) => state.records.some((old) => old.answer === item.answer || similarity(old.answer, item.answer) >= 0.95));
    state.records = [...imported, ...state.records];
    await putRecords(imported);
    state.files = [];
    notify(duplicates.length ? `${imported.length}件を追加。重複候補が${duplicates.length}件あります` : `${imported.length}件のOCRが完了しました`);
  } catch (error) {
    notify(error.message || "OCRに失敗しました");
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
  modal.innerHTML = `<div class="modal"><div class="modal-head"><div><div class="eyebrow">Review record</div><h2>問題を編集</h2></div><button class="close" data-close>×</button></div><form class="form"><label class="field-wrap"><span>問題</span><textarea class="field textarea" name="question">${escapeHtml(record.question)}</textarea></label><label class="field-wrap"><span>解答</span><input class="field" name="answer" value="${escapeHtml(record.answer)}"></label><label class="field-wrap"><span>ジャンル</span><select class="field" name="category"><option value="未分類">未分類</option>${GENRES.map((genre) => `<option value="${genre}" ${record.category === genre ? "selected" : ""}>${genre}</option>`).join("")}</select></label><div class="modal-actions"><button class="button ghost" type="button" data-close>キャンセル</button><button class="button primary">保存する</button></div></form></div>`;
  document.body.append(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("form").addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(event.target); Object.assign(record, normalizeRecord(Object.fromEntries(data))); await putRecords([record]); modal.remove(); render(); notify("変更を保存しました"); });
}

function showSettings() {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal"><div class="modal-head"><div><div class="eyebrow">Private settings</div><h2>API設定</h2></div><button class="close" data-close>×</button></div><form class="form"><p class="lede note">Visionは文字認識、GeminiはOCR結果の補正に使います。キーはこのブラウザのIndexedDBに保存され、GitHub Pagesでは利用者から確認できます。</p><label class="field-wrap"><span>Google Cloud Vision API Key</span><input class="field" type="password" name="visionApiKey" value="${escapeHtml(state.settings.visionApiKey || "")}" autocomplete="off" placeholder="AIza..."></label><label class="field-wrap"><span>Gemini API Key（任意）</span><input class="field" type="password" name="geminiApiKey" value="${escapeHtml(state.settings.geminiApiKey || "")}" autocomplete="off" placeholder="AIza..."></label><div class="modal-actions"><button class="button ghost" type="button" data-close>キャンセル</button><button class="button primary">設定を保存</button></div></form></div>`;
  document.body.append(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("form").addEventListener("submit", async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); state.settings.visionApiKey = data.visionApiKey || ""; state.settings.geminiApiKey = data.geminiApiKey || ""; await saveSettings(); modal.remove(); render(); notify("API設定を保存しました"); });
}

function csvEscape(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
function exportCsv() {
  const header = ["問題", "解答", "カテゴリ", "画像名", "作成日時"];
  const rows = state.records.map((record) => {
    const normalized = normalizeRecord(record);
    return [normalized.question, normalized.answer, normalized.category, normalized.imageName, normalized.createdAt];
  });
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `minhaya-quiz-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
}

loadData().then(render).catch(() => render());
