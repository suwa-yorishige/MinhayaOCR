import "./style.css";

const DB_NAME = "minhaya-ocr-pages";
const DB_VERSION = 1;
const GENRE_DEFINITIONS = {
  "理系": ["数学", "情報科学", "物理学", "化学", "医学", "生物種", "生物学", "地球科学", "天文学", "技術工学", "理系クロスオーバー", "理系その他"],
  "文学": ["神話-日本神話", "神話-ギリシャ・ローマ神話", "神話-その他神話", "詩", "絵本・童話", "古文・漢文", "日本-散文-戦前", "日本-散文-戦後", "世界-アジア文学", "世界-英米文学", "世界-ドイツ文学", "世界-ロマンス諸語文学", "世界-ロシア文学", "世界-その他地域の文学", "文学クロスオーバー", "文学その他"],
  "言葉": ["四字熟語・故事成語", "ことわざ・慣用句", "日常語彙・言い回し", "流行語・新語・俗語", "漢字", "英語", "外国語-英語以外", "言語学用語・文法", "言葉クロスオーバー", "言葉その他"],
  "日本史": ["先史～古墳時代", "飛鳥・奈良時代", "平安時代", "鎌倉時代", "室町時代", "江戸時代", "明治・大正時代", "昭和-戦前戦中", "戦後日本史", "日本史クロスオーバー", "日本史その他"],
  "世界史": ["ヨーロッパ史-ルネサンス以前", "ヨーロッパ史-フランス革命以前", "ヨーロッパ史-WWI以前", "ヨーロッパ史-第一次大戦以後", "中国史-隋まで", "中国史-唐～明", "中国史-清以降", "アジア史-WWI以前", "アジア史-第一次大戦以後", "イスラム世界史", "南北アメリカ史", "その他地域の歴史", "世界史クロスオーバー", "世界史その他"],
  "地理": ["交通", "北海道地方", "東北地方", "関東地方", "中部地方", "近畿地方", "中国地方", "四国地方", "九州以南", "北米", "中南米", "アジア", "オセアニア", "ヨーロッパ", "アフリカ", "海・極地方", "地理学", "地理クロスオーバー", "地理その他"],
  "公民": ["倫理(哲学・思想・心理学)", "社会", "法律・法学・犯罪", "日本の政治・制度", "世界の政治・制度", "運動・事件", "経済・経済学", "宗教", "疑似科学・オカルト", "教育", "公民クロスオーバー", "公民その他"],
  "芸術": ["日本-絵画", "日本-彫刻", "世界-絵画", "世界-彫刻", "建築", "工芸・民芸", "デザイン・写真・映像", "クラシック音楽", "童謡・合唱曲", "伝統音楽・民族音楽", "楽器・音楽用語", "舞踊", "古典芸能-舞台-日本", "古典芸能-しゃべくり-日本", "芸術クロスオーバー", "芸術その他"],
  "漫画・アニメ・ゲーム": ["アニメ", "漫画", "ライトノベル", "テレビゲーム", "特撮", "玩具・グッズ", "漫アゲクロスオーバー", "漫アゲその他"],
  "生活": ["嗜好品", "食材", "料理・調理", "服飾・ファッション", "暦・行事・しきたり", "家庭の医学", "企業・商品", "インターネット", "娯楽・趣味", "生活至近", "生活クロスオーバー", "生活その他"],
  "スポーツ": ["野球・ソフトボール", "サッカー・フットサル", "球技-除野球・サッカー", "陸上競技", "体操", "ウォータースポーツ", "格闘技・武道", "冬季競技", "公営ギャンブル", "レース競技", "スポーツイベント", "スポーツクロスオーバー", "スポーツその他"],
  "芸能": ["芸能一般用語", "テレビ番組・ラジオ番組・CM", "邦画", "海外映画", "現代演劇", "お笑い", "俳優", "タレント・文化人", "邦楽-昭和以前", "邦楽-平成（～2009）", "邦楽-平成・令和（2010～）", "洋楽・海外音楽", "芸能クロスオーバー", "芸能その他"],
  "ノンセク": ["ジャンル複合", "ジャンル不明"],
};
const GENRES = Object.keys(GENRE_DEFINITIONS);
const VISION_BATCH_SIZE = 16;
const GEMINI_BATCH_SIZE = 8;
const MAX_RETRIES = 2;
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

function normalizeRecord(record) {
  const genre = GENRE_DEFINITIONS[record.genre] ? record.genre : "";
  const subgenre = GENRE_DEFINITIONS[genre]?.includes(record.subgenre) ? record.subgenre : "";
  return {
    ...record,
    genre,
    subgenre,
    question: cleanOcrText(record.question, "question"),
    answer: cleanOcrText(record.answer, "answer"),
  };
}

function parseOcrText(text) {
  const capture = (pattern) => text.match(pattern)?.[1]?.trim().replace(/\n{3,}/g, "\n\n") || "";
  return normalizeRecord({
    genre: "",
    subgenre: "",
    question: capture(/問題\s*([\s\S]*?)\s*解答/i),
    answer: capture(/解答\s*([\s\S]*?)(?:\s*読み|\s*正解率|$)/i),
  });
}

function demoRecord(imageName) {
  const rawText = "問題\n本名を井上久美子という小説家は誰でしょう？\n解答\n高野史緒\n読み\nたかのふみお\n正解率 78%";
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
  const records = state.records.filter((record) => `${record.question} ${record.answer} ${record.genre} ${record.subgenre}`.toLowerCase().includes(query));
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
          <section class="panel pool-panel"><div class="panel-head"><div><h2>OCR結果プール</h2><p>読み取り結果を確認・編集</p></div><div class="pool-summary"><span class="eyebrow">${records.length} records</span><button class="button danger" data-action="delete-all" ${!state.records.length || state.busy ? "disabled" : ""}>一括削除</button></div></div><div class="pool-tools"><input class="search" data-search value="${escapeHtml(state.query)}" placeholder="問題・解答・ジャンル・サブジャンルを検索"><button class="button ghost" data-action="clear-search">⌫</button></div><div class="record-list">${records.length ? records.map(recordCard).join("") : `<div class="empty"><strong>まだ問題がありません</strong>画像を追加してOCRを開始してください。</div>`}</div></section>
        </div>
        <div class="footer-actions"><span class="status">${state.settings.visionApiKey ? "Vision API接続設定済み" : "デモモード / APIキー未設定"}</span><div class="export-controls"><label class="radio"><input type="radio" name="encoding" value="utf-8" ${state.encoding === "utf-8" ? "checked" : ""}> UTF-8</label><label class="radio"><input type="radio" name="encoding" value="shift-jis" ${state.encoding === "shift-jis" ? "checked" : ""}> Shift_JIS</label><button class="button primary" data-action="export" ${!state.records.length ? "disabled" : ""}>CSVをダウンロード　↓</button></div></div>
      </main>
    </div>`;
  bindEvents();
}

function recordCard(record) {
  const classification = [record.genre, record.subgenre].filter(Boolean).join(" / ") || "ジャンル未設定";
  return `<article class="record"><div class="record-top"><span class="tag">${escapeHtml(classification)}</span><span class="confidence">OCR ${Math.round((record.confidence || 0) * 100)}%</span></div><h3>${escapeHtml(record.answer || "解答未入力")}</h3><p>${escapeHtml(record.question || "問題文未入力")}</p><div class="record-actions"><button class="button secondary" data-edit="${record.id}">編集</button><button class="button danger" data-delete="${record.id}">削除</button></div></article>`;
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

function retryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get("Retry-After"));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.min(retryAfter * 1000, 10000);
  return 700 * (2 ** attempt) + Math.floor(Math.random() * 250);
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
    imageContext: { languageHints: ["ja"] },
  })));
  const data = await fetchJsonWithRetry(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  }, "Google Vision APIに接続できませんでした");
  return files.map((file, index) => {
    const result = data.responses?.[index];
    if (result?.error) return { file, error: result.error.message || "Google Vision APIでOCRに失敗しました" };
    const text = result?.fullTextAnnotation?.text;
    if (!text) return { file, error: "OCRテキストを取得できませんでした" };
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
        answer: { type: "string" },
      },
      required: ["id", "genre", "subgenre", "question", "answer"],
      additionalProperties: false,
    },
  };
}

function validateGeminiBatchResult(value, items) {
  if (!Array.isArray(value) || value.length !== items.length) throw new Error("Geminiの応答件数が入力と一致しません");
  const expectedIds = new Set(items.map((item) => item.id));
  const seenIds = new Set();
  const results = new Map();
  for (const item of value) {
    const keys = ["id", "genre", "subgenre", "question", "answer"];
    if (!item || typeof item !== "object" || !keys.every((key) => typeof item[key] === "string")) throw new Error("Geminiの応答形式が不正です");
    if (!expectedIds.has(item.id) || seenIds.has(item.id)) throw new Error("Geminiの応答IDが不正です");
    const result = normalizeRecord(Object.fromEntries(keys.filter((key) => key !== "id").map((key) => [key, item[key].trim()])));
    if (!result.genre || !result.subgenre) throw new Error("Geminiのジャンル分類が不正です");
    seenIds.add(item.id);
    results.set(item.id, result);
  }
  if (seenIds.size !== expectedIds.size) throw new Error("Geminiの応答に欠落した項目があります");
  return results;
}

async function requestGeminiCorrectionBatch(items, apiKey) {
  const ids = items.map((item) => item.id);
  const input = items.map(({ id, rawText }) => ({ id, rawText }));
  const prompt = `あなたは「みんなで早押し」問題のOCR補正アシスタントです。
入力配列の各項目について、同じidを持つ結果を必ず1件ずつ、入力順を維持して返してください。他の項目の本文を混ぜないでください。不確かな文字を勝手に推測せず、OCR本文を優先してください。
問題と解答を自然な日本語へ補正し、最も適したジャンルとサブジャンルを候補から1つずつ割り当ててください。
ジャンル候補とサブジャンル候補: ${JSON.stringify(GENRE_DEFINITIONS)}
スマートフォンのステータスバー由来の百分率表記（例: 67%）は問題文から除去し、解答に混入した Google と Wikipedia も除去してください。
JSON配列のみを返してください。各要素のキーは id, genre, subgenre, question, answer です。\n\n入力:\n${JSON.stringify(input)}`;
  const data = await fetchJsonWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: geminiResponseSchema(ids) },
    }),
  }, "Gemini APIに接続できませんでした");
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error("Geminiの応答を取得できませんでした");
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
    notify(`${items[0].imageName}: Gemini補正をスキップしました`);
    return new Map([[items[0].id, parseOcrText(items[0].rawText)]]);
  }
}

async function runOcr() {
  state.busy = true;
  state.progress = { current: 0, total: state.files.length, message: "OCR処理を準備中..." };
  render();
  const queuedFiles = [...state.files];
  const failedFiles = new Set();
  try {
    const imported = [];
    if (!state.settings.visionApiKey) {
      for (const [index, file] of queuedFiles.entries()) {
        imported.push(demoRecord(file.name));
        state.progress = { current: index + 1, total: queuedFiles.length, message: `${index + 1} / ${queuedFiles.length}件完了` };
        render();
      }
    } else {
      const ocrItems = [];
      for (let start = 0; start < queuedFiles.length; start += VISION_BATCH_SIZE) {
        const files = queuedFiles.slice(start, start + VISION_BATCH_SIZE);
        state.progress = { current: start, total: queuedFiles.length, message: `Vision OCRを実行中 (${start + 1}-${start + files.length}件)` };
        render();
        let visionResults;
        try {
          visionResults = await requestVisionOcrBatch(files, state.settings.visionApiKey);
        } catch (error) {
          files.forEach((file) => failedFiles.add(file));
          notify(`Vision OCRに失敗しました: ${error.message}`);
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
        state.progress = { current: Math.min(start + files.length, queuedFiles.length), total: queuedFiles.length, message: `Vision OCR完了 (${Math.min(start + files.length, queuedFiles.length)} / ${queuedFiles.length}件)` };
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
          createdAt: new Date().toISOString(),
        }));
        imported.push(...batchRecords);
        await putRecords(batchRecords);
        state.progress = { current: Math.min(start + items.length, ocrItems.length), total: queuedFiles.length, message: `Gemini補正完了 (${Math.min(start + items.length, ocrItems.length)} / ${ocrItems.length}件)` };
        render();
      }
    }
    const duplicates = imported.filter((item) => state.records.some((old) => old.answer === item.answer || similarity(old.answer, item.answer) >= 0.95));
    state.records = [...imported, ...state.records];
    state.files = queuedFiles.filter((file) => failedFiles.has(file));
    const failureMessage = failedFiles.size ? `、${failedFiles.size}件は再試行待ち` : "";
    notify(duplicates.length ? `${imported.length}件を追加。重複候補が${duplicates.length}件あります${failureMessage}` : `${imported.length}件のOCRが完了しました${failureMessage}`);
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
  modal.innerHTML = `<div class="modal"><div class="modal-head"><div><div class="eyebrow">Review record</div><h2>問題を編集</h2></div><button class="close" data-close>×</button></div><form class="form"><label class="field-wrap"><span>問題</span><textarea class="field textarea" name="question">${escapeHtml(record.question)}</textarea></label><label class="field-wrap"><span>解答</span><input class="field" name="answer" value="${escapeHtml(record.answer)}"></label><label class="field-wrap"><span>ジャンル</span><select class="field" name="genre" data-genre-select><option value="">未設定</option>${GENRES.map((genre) => `<option value="${genre}" ${record.genre === genre ? "selected" : ""}>${genre}</option>`).join("")}</select></label><label class="field-wrap"><span>サブジャンル</span><select class="field" name="subgenre" data-subgenre-select></select></label><div class="modal-actions"><button class="button ghost" type="button" data-close>キャンセル</button><button class="button primary">保存する</button></div></form></div>`;
  document.body.append(modal);
  const genreSelect = modal.querySelector("[data-genre-select]");
  const subgenreSelect = modal.querySelector("[data-subgenre-select]");
  const updateSubgenres = () => { const subgenres = GENRE_DEFINITIONS[genreSelect.value] || []; subgenreSelect.innerHTML = `<option value="">未設定</option>${subgenres.map((subgenre) => `<option value="${subgenre}" ${record.subgenre === subgenre ? "selected" : ""}>${subgenre}</option>`).join("")}`; };
  genreSelect.addEventListener("change", () => { record.subgenre = ""; updateSubgenres(); });
  updateSubgenres();
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
  const header = ["問題", "解答", "解説", "ジャンル", "サブジャンル"];
  const rows = state.records.map((record) => {
    const normalized = normalizeRecord(record);
    return [normalized.question, normalized.answer, "", normalized.genre, normalized.subgenre];
  });
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `minhaya-quiz-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
}

loadData().then(render).catch(() => render());
