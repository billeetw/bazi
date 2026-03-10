# 命盤 Demo 頁（/ziwei/demo-lifebook）做法評估

## 結論：**做法 2** 較適合本專案

### 專案現況

- **主站**：靜態部署（`wrangler pages deploy .`），根目錄為靜態檔，**沒有** server 端 route/template 系統。
- **命盤結果**：同一頁 `index.html`，表單送出後前端呼叫 **POST /compute/all**，取得 `chart_json` 後由 **DataRenderer.renderZiweiAndLiuyue**、**ZiweiGrid.renderZiwei**、**renderRadarChart** 等在同一頁渲染；沒有獨立的「結果頁 URL」如 `/ziwei/result?birth=...`。
- **Worker**：只提供 API（/compute/all、/api/life-book/* 等），沒有 GET 頁面路由。

### 做法 1（後端加固定 route）在本專案的狀況

- 需要一個 **GET /ziwei/demo-lifebook** 的 server 邏輯，並 render 出與結果頁相同的畫面。
- 目前 **沒有** 這種後端：Pages 是靜態、Worker 只做 API。若要做做法 1，必須：
  - 在 Worker 加 GET /ziwei/demo-lifebook，內建一組 demo 出生參數，呼叫現有 compute 流程，再 **回傳 HTML**（Worker 要組出整頁 HTML，或 redirect 到某個帶 query 的靜態頁），或
  - 改為 Pages Functions / 其他 server 層提供該 route。
- 工作量大、且要維護「與結果頁一致」的 HTML 輸出，容易與前端脫節。

### 做法 2（前端薄頁 + fetch demo JSON）的優勢

- **完全符合現有架構**：多一個靜態 HTML 即可，不需改 Worker、不需 server 邏輯。
- **與 Viewer 共用同一份資料**：fetch `/demo-lifebook.json` 的 `chart_json`，和命書 Viewer 示範命書同源，資料一致。
- **重用既有前端**：載入 `app.js`，呼叫 `UiComponents.ZiweiGrid.renderZiwei`、`UiRenderHelpers.renderRadarChart`，和主站結果區塊邏輯一致，不需重寫命盤/五行。
- **實作量小**：一個 HTML + 一小段 inline script，約數十行。
- **之後要換 demo 盤**：只改 `demo-lifebook.json` 或換一個 JSON URL 即可。

### 建議實作

- 新增 **ziwei/demo-lifebook/index.html**（對應 URL：`/ziwei/demo-lifebook` 或 `/ziwei/demo-lifebook/`）。
- 內容：載入主站 CSS（可選）、**app.js**，頁面內有 `#ziweiGrid`、`#ziweiHint`、五行雷達圖容器；on load 時 **fetch('/demo-lifebook.json')** → 取 `chart_json` → 呼叫 **ZiweiGrid.renderZiwei**、**renderRadarChart**。
- 若部署後路徑有差異（例如需加 base path），再調整 **LIFEBOOK_DEMO_CHART_URL** 或該 HTML 的 fetch 路徑即可。

### 實作狀態（已完成）

- **ziwei/demo-lifebook/index.html** 已新增：載入 `/dist/tailwind.css`、`/dist/app.js`（type="module"），內含 `#ziweiGrid`、`#ziweiHint`、`#ziweiWxRadar`；`window.load` 後 fetch `/demo-lifebook.json`，以 `chart_json` 呼叫 `UiComponents.ZiweiGrid.renderZiwei`、`UiRenderHelpers.renderRadarChart`。
- **部署注意**：需確保站點根目錄能存取 `/demo-lifebook.json`（例如將 `public/demo-lifebook.json` 複製到部署根目錄，或由現有 static 流程一併輸出）。

---

**總結**：以目前架構，**做法 2（前端薄頁 + fetch demo JSON）** 較省力、好維護，且與命書 Viewer、demo-lifebook.json 一致；做法 1 需新增並維護 server 端 route 與輸出，較不適合本專案。
