# 命書模型改動 — 測試驗證清單

本文件說明如何驗證「gpt-4.1（含 temperature）與 gpt-5.x（無 temperature）+ 後台模型選單 + meta.generator_version」等改動。

---

## 一、自動化測試（必跑）

### 1. 命書組裝器煙霧測試

```bash
npm run test
```

應通過 `tests/lifebook-assembler.test.ts` 的 4 個用例（meta 版本、sections、expert 傳遞、star_palace_quotes）。  
若失敗，表示 `buildLifeBookDocument` 或 `lifebook-version.js` 有回歸。

---

## 二、建置檢查

確認改動後專案仍可正常建置：

```bash
npm run build:expert-admin
npm run build:lifebook-viewer
cd worker && npm run build
```

全部無錯誤即可。

---

## 三、手動驗證（後台 + 命書流程）

### 前置

- 依 [專家後台 — 本地測試指南](./expert-admin-local-test.md) 啟動環境（方式 A 用遠端 Worker 即可）。
- 開啟 **http://localhost:8788/expert-admin.html**（或正式環境的專家後台），並登入。

### 3.1 模型選單

- 進入「AI Prompt 與命書生成」。
- 確認「一鍵生成命書」旁有**模型下拉選單**，選項為：
  - **gpt-4.1（預設）**
  - gpt-4.1-turbo
  - gpt-5.0
  - gpt-5.1
  - gpt-5.2
- 預設選取應為 **gpt-4.1**。

### 3.2 一鍵生成請求帶 model + temperature

- 輸入出生年月日，點「計算」，等計算完成。
- 打開瀏覽器**開發者工具 → Network**，篩選 XHR/Fetch。
- 選擇模型（例如 gpt-4.1 或 gpt-5.0），點「📘 一鍵生成命書」。
- 在 Network 中檢查：

  - **推論＋敘事流程**：  
    - `POST .../api/life-book/infer`：Request payload 應含 `model`、`temperature: 0.7`。  
    - `POST .../api/life-book/narrate`（多次）：每次應含 `model`、`temperature: 0.7`。
  - **僅 generate-section 流程**（不勾 Phase 3）：  
    - `POST .../api/life-book/generate-section`（多次）：每次應含 `model`、`temperature: 0.7`。

- 若選 **gpt-5.0 / gpt-5.1 / gpt-5.2**，後端會自動略過 temperature（由 Worker 的 model-based merge 處理），前端仍可固定送 `temperature: 0.7`。

### 3.3 命書儲存後 meta.generator_version

- 一鍵生成完成後，命書會自動存進列表。
- 在命書列表點該筆的「詳情」。
- 右側 **ExpertPanel** 第一行應為：
  - **模型版本：gpt-4.1**（或你選擇的模型，例如 gpt-5.0）。
- 若該筆是舊資料、沒有 `document_json` 或沒有 `generator_version`，應顯示 **模型版本：(未知模型版本)**。

### 3.4 下載的 HTML / 存庫的 document_json

- 一鍵生成後會下載一份 HTML，且同一 doc 會存進後端（含 `document_json`）。
- 存進去的 `document_json` 中，`meta.generator_version` 應為你選擇的模型字串（如 `"gpt-4.1"`、`"gpt-5.2"`）。

---

## 四、Worker API 直接驗證（可選）

若跑**本地 Worker**（`npm run dev:worker`），可用 curl 確認 body 的 model/temperature 有被接受且合併正確。

### 4.1 generate-section（gpt-4.1 → 應帶 temperature）

```bash
curl -s -X POST http://localhost:8787/api/life-book/generate-section \
  -H "Content-Type: application/json" \
  -d '{
    "section_key": "s02",
    "model": "gpt-4.1",
    "temperature": 0.7,
    "chart_json": {},
    "weight_analysis": {}
  }'
```

- 若 Worker 正常，會回 400（缺 chart_json/weight_analysis 等）或打 OpenAI；**不會**因 `model`/`temperature` 欄位而 400。
- 日誌或除錯時可確認送給 OpenAI 的 body 含 `temperature: 0.7`。

### 4.2 generate-section（gpt-5.0 → 不應帶 temperature）

同上，僅將 `"model": "gpt-4.1"` 改為 `"model": "gpt-5.0"`。  
Worker 內應依 `getGenerationOptions` 只傳 `model`，不傳 `temperature`（gpt-5.x 不接受）。

### 4.3 未傳 model 時預設

body 不帶 `model`、`temperature`，例如：

```bash
curl -s -X POST http://localhost:8787/api/life-book/infer \
  -H "Content-Type: application/json" \
  -d '{"chart_json": {}, "weight_analysis": {}}'
```

應回 400（缺有效 chart_json）而非 500；Worker 內部應以預設 `model = "gpt-4.1"`、`temperature = 0.3`（infer）處理。

---

## 五、簡短檢查表（複製使用）

- [ ] `npm run test` 通過
- [ ] `npm run build:expert-admin`、`npm run build:lifebook-viewer`、`worker npm run build` 皆成功
- [ ] 後台模型選單有 5 個選項，預設 gpt-4.1
- [ ] 一鍵生成時 Network 中 infer / narrate / generate-section 請求帶 `model`、`temperature: 0.7`
- [ ] 命書詳情右側「模型版本」顯示所選模型（或舊資料顯示「(未知模型版本)」）
- [ ] （可選）本地 Worker + curl 驗證 gpt-4.1 帶 temperature、gpt-5.0 不帶、未傳 model 時預設正常

以上都通過即可視為改動驗證完成。

---

## 六、前端 Viewer 怎麼測試

命書 Viewer（`lifebook-viewer.html`）負責**顯示**已組好的 LifeBookDocument，不負責生成。資料來源依序為：

1. **sessionStorage `lifebook_doc`**（後台詳情點「詳情」時會先寫入再開 iframe）
2. **window.__LIFEBOOK_INITIAL_STATE__**（若在掛載前被注入）
3. **匯入命書 JSON**（使用者點「匯入命書 JSON」選檔）
4. **載入示範命書**（點「查看示範命書」，會請求 `./demo-lifebook.json`）

### 6.1 開發時本地跑 Viewer

```bash
npm run dev:lifebook-viewer
```

會啟動 Vite，通常為 http://localhost:5173。開啟後：

- 若尚未有資料：可點「**查看示範命書**」載入 `public/demo-lifebook.json`（需確保 dev 會 serve public，或改開 dist 見下）。
- 或手動在 Console 寫入：  
  `sessionStorage.setItem('lifebook_doc', JSON.stringify({ meta: { schema_version: '1.0', generator_version: 'gpt-4.1' }, sections: { s01: { section_key: 's01', title: '測試', importance_level: 'medium', structure_analysis: '...', behavior_pattern: '', blind_spots: '', strategic_advice: '' } }, weight_analysis: null, chart_json: null }));`  
  再重新整理，即可看到內容與 **模型：gpt-4.1** 等 meta 顯示。

### 6.2 與後台詳情一起測（整合）

1. 依「三、手動驗證」啟動後台（例如 `npm run dev:pages`），登入後一鍵生成一筆命書。
2. 在命書列表點該筆「**詳情**」。
3. 左側 iframe 會載入 `lifebook-viewer.html`，且同頁已寫入 `sessionStorage.lifebook_doc`，Viewer 會讀取並顯示。
4. 檢查：標題下應出現「命書對象」「出生」「**模型：gpt-4.1**」（或你選的模型）；若該筆無 `generator_version` 會顯示「(未知模型版本)」。

### 6.3 建置後靜態測

```bash
npm run build:lifebook-viewer
# 若專案會 copy public：確保 dist/demo-lifebook.json 存在（來自 public/demo-lifebook.json）
npx serve dist -p 8789
```

開啟 http://localhost:8789/lifebook-viewer.html，點「查看示範命書」應可載入；示範 JSON 若無 `meta.generator_version`，模型那行可能不顯示或只顯示 schema。

### 6.4 可選：E2E 自動化

目前專案沒有針對 `lifebook-viewer.html` 的 E2E。若要加，可在 `e2e/` 新增一則：開啟 viewer 頁 → 注入或載入一筆最小 doc（含 `meta.generator_version`）→ 断言頁面出現「模型：gpt-4.1」等文字。可參考既有的 `playwright.config.cjs` 與 `test:e2e` 流程。

---

## 七、可檢討／可加強的開發項目

| 項目 | 說明 | 優先度 |
|------|------|--------|
| **Viewer 顯示模型版本** | 已在 Viewer 內文區塊加上「模型：{generator_version}」或「(未知模型版本)」，與後台 ExpertPanel 一致。 | ✅ 已做 |
| **單一 HTML renderer** | 目前 viewer 用 TS、後台用 JS 各有一份 `renderLifeBookDocumentToHtml`；長期可抽成 `js/lifebook-html.js` 單一實作，兩邊共用。 | 中長期 |
| **Viewer 單元測試** | 僅有 `buildLifeBookDocument` 煙霧測試；Viewer 的 React 元件（如 LifeBookViewer、SectionCard）可加 Vitest + React Testing Library。 | 低 |
| **Viewer E2E** | 上述 6.4：一則「載入 doc → 檢查標題與模型字樣」即可覆蓋主流程。 | 低 |
| **示範命書 meta** | `public/demo-lifebook.json` 的 `meta` 可加 `generator_version: "gpt-4.1"`、`schema_version: "1.0"`，方便測 Viewer 模型顯示。 | 低 |
| **無資料時的模型行** | 無 meta 時目前不顯示模型行；若希望一律顯示「模型：(未知模型版本)」可再改。 | 可選 |
