# 命書封測：正式環境設定與驗證清單

## 1. 正式環境設定 `LIFEBOOK_FEEDBACK_URL`

命書 UI 的「封測回饋」連結由 `buildLifebookFeedbackUrl()` 組出 query（`user_id`、`invite_code`、`current_surface`、`palace_id`），基底 URL 來自 **`window.Config.LIFEBOOK_FEEDBACK_URL`**（見 `js/config.js`）。

**目前預設表單（版控）：** [✨「人生說明書」封測回饋表單](https://forms.gle/EAsPAy9xJYdCEGPK6)（`LIFEBOOK_FEEDBACK_URL_INLINE`）。

**若要改網址或測試別表單，擇一即可：**

| 方式 | 說明 |
|------|------|
| **HTML 注入（建議）** | 在載入 `js/config.js` **之前** 設定 `window.LIFEBOOK_FEEDBACK_URL`（例：`lifebook-viewer.html` 內已附註解範例）。適合正式站用部署模板注入，不必改 Git 常數。 |
| **版控常數** | 在 `js/config.js` 內將 `LIFEBOOK_FEEDBACK_URL_INLINE` 設為表單基底 URL（與 `window` 注入互斥優先順序：先 `window.LIFEBOOK_FEEDBACK_URL`，再 `LIFEBOOK_FEEDBACK_URL_INLINE`）。 |

**Google 表單：** 建議在表單中新增「短答」欄位對應 query 參數名稱，或於表單 URL 使用預填參數（依 Google 表單說明產生）；前端會附加 `?user_id=…&invite_code=…` 等。

---

## 2. GA4 DebugView：確認身份欄位有進

### 2.1 命書頁載入 GA4

`/viewer`、`/timeline` 等命書殼使用 `lifebook-viewer.html`，已與主站共用 **`G-S0JFD6CTDP`**（可於該 HTML 內覆寫 `window.GA_MEASUREMENT_ID`）。未載入 gtag 時，`gtag("event", …)` 不會進 GA。

### 2.2 開啟 Debug 模式（DebugView 才看得到即時事件）

在命書頁網址加上 **`?ga_debug=1`**（可與其他 query 並存），例如：

`https://www.17gonplay.com/dist/lifebook-viewer.html?ga_debug=1`

此時 `gtag("config", …, { debug_mode: true })` 會生效。到 GA4 後台 **Admin → DebugView** 觀察即時事件。

（亦可使用 Chrome「Google Analytics Debugger」外掛，與官方文件並行。）

### 2.3 自訂維度／參數

遙測在事件參數中帶 **`user_id`**、**`invite_code`**（見 `enrichTelemetryPayload`）。在 GA4 中：

1. **Admin → 自訂定義 → 自訂維度**（或事件層級自訂參數，依 GA4 介面版本）。
2. 範圍選 **事件**，參數名稱分別註冊為 `user_id`、`invite_code`（與程式送出名稱一致）。
3. 儲存後數小時內報表可能仍顯示「未註冊」，DebugView 可較快驗證。

**建議抽樣事件：** `viewer_route_resolved`、`palace_section_generate_failed`、`timeline_decision_cta_click`，展開參數確認 `user_id` / `invite_code` 有值（登入且 localStorage 有邀請碼時）。

---

## 3. 跨裝置還原驗證

| 步驟 | 預期 |
|------|------|
| 裝置 A：登入、完成排盤／命書內容，確認已寫入帳號級命書（雲端）。 | 成功儲存。 |
| 裝置 B：**同一帳號**登入、開命書 Beta（同正式網域）。 | 讀回**同一份**命書內容（章節／chart 一致），非空白重算。 |
| 若失敗 | 查 Network：`GET /api/me/lifebook-document`、JWT、`401`；查 Console 錯誤。 |

---

## 4. 同裝置重新登入驗證

| 步驟 | 預期 |
|------|------|
| 同裝置：已登入且命書已產生。 | — |
| **登出**後再 **登入**同一帳號，進入命書。 | **直接還原**雲端命書；不應無故觸發整份重算（除非產品設計為「無雲端時才重算」）。 |
| 可選：清 `sessionStorage` 僅留登入，再試一次。 | 仍應以雲端為準。 |

---

## 5. 相關程式位置（除錯用）

- 回饋連結：`src/lifebook-viewer/utils/feedbackLink.ts`
- 身份合併遙測：`src/lifebook-viewer/utils/telemetryContext.ts`
- 帳號命書：`src/lifebook-viewer/utils/accountLifebookDocument.ts`、`functions/api/me/lifebook-document.js`
- 命書 HTML：`lifebook-viewer.html`（GA、`config.js` 順序）
