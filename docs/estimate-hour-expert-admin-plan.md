# 推算時辰：登入 + 紀錄 + 回饋 + 專家後台 — 按步驟開發建議

目標：  
1. 「點我推算時辰」改為需登入、紀錄使用、出結果後可回饋正確與否與真實時辰。  
2. 在專家後台（https://www.17gonplay.com/expert-admin）可查看與分析這些結果。

以下步驟**依賴順序**執行：先有資料（D1 + 用戶端 API），再在專家後台讀取與展示。

---

## 階段一：資料與用戶端 API（推算 + 紀錄 + 回饋）

此階段完成後，用戶可登入使用推算、每次推算會寫入一筆紀錄、結果頁可回饋「正確／不正確」與真實時辰；專家後台尚無畫面，但資料已就緒。

### Step 1：D1 新增表 `estimate_hour_logs`

- **產出**：migration 檔 `migrations/0008_estimate_hour_logs.sql`（內容見下方程式碼範例）。
- **內容**：  
  - 欄位：`id`（TEXT PK）、`user_id`（TEXT NOT NULL, FK → users.id）、`answers_json`（TEXT NOT NULL）、`estimated_branch`、`estimated_half`、`created_at`；  
  - 回饋欄位：`feedback_correct`（INTEGER, 1/0/NULL）、`feedback_actual_branch`、`feedback_actual_half`、`feedback_at`。  
  - 索引：`(user_id, created_at)`、`(feedback_correct)` 加速後台查詢與篩選。
- **執行**：  
  - 本機：`npx wrangler d1 migrations apply consult-db --local`  
  - 正式：`npx wrangler d1 migrations apply consult-db --remote`

**📝 Migration 範例**（見專案內 `migrations/0008_estimate_hour_logs.sql`）：

```sql
-- 建立推算時辰紀錄表
CREATE TABLE estimate_hour_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    estimated_branch TEXT NOT NULL,
    estimated_half TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    feedback_correct INTEGER,
    feedback_actual_branch TEXT,
    feedback_actual_half TEXT,
    feedback_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_logs_user_date ON estimate_hour_logs(user_id, created_at);
CREATE INDEX idx_logs_feedback ON estimate_hour_logs(feedback_correct);
```

### Step 2：後端推算邏輯「純函數化」+ `POST /api/me/estimate-hour`

- **2a. 共用推算模組（建議先做）**  
  - **產出**：`functions/utils/shichen-logic.js`（或專案內可被 Workers 與前端共用的路徑）。  
  - **內容**：將原本在 `identifyBirthTime.js` 裡的 `estimateHourLocal` 邏輯**抽取成純函數**，例如 `estimateHourFromAnswers(answers)`，回傳 `{ branch, hour_label, hour_range, half }`。  
  - **好處**：未來調整題目權重或題庫時，只改這一處，後端（紀錄用）與前端（fallback）邏輯同步；Cloudflare Workers 可 `import { estimateHourFromAnswers } from '../utils/shichen-logic.js'` 直接呼叫。  
  - **前端**：`identifyBirthTime.js` 改為從同一模組讀取（若前端無法直接 import 同路徑，可建一個 `js/calc/shichen-logic.js` 供前端載入，後端則用 `functions/utils/shichen-logic.js` 並保持兩檔內容一致或由 build 從單一來源產生）。

- **2b. POST /api/me/estimate-hour**  
  - **產出**：`functions/api/me/estimate-hour.js`。  
  - **行為**：  
    - 驗證 JWT；401 則回傳錯誤。  
    - 讀取 body `answers`。  
    - 推算：**直接 import 並呼叫** `estimateHourFromAnswers(answers)`（來自 `functions/utils/shichen-logic.js`），得到 `branch`、`half`、`hour_label`、`hour_range`。  
    - 寫入一筆 `estimate_hour_logs`（user_id 來自 JWT sub、answers_json、estimated_branch、estimated_half、created_at）。  
    - 回傳：`{ branch, hour_label, hour_range, half, log_id }`。  
  - **依賴**：Step 1、2a、JWT 驗證。

### Step 3：後端 `PATCH /api/me/estimate-hour/logs/:id`（回饋）

- **產出**：`functions/api/me/estimate-hour/logs/[id].js`。
- **行為**：  
  - 驗證 JWT；確認該筆 log 的 `user_id` 與 JWT sub 一致，否則 403。  
  - Body：`{ correct: true|false, actual_branch?, actual_half? }`。  
  - 更新該筆的 `feedback_correct`、`feedback_actual_branch`、`feedback_actual_half`、`feedback_at`。  
  - 回傳 200 或 204。
- **依賴**：Step 1。

### Step 4：前端 — 登入門檻 + 問卷改打本站 API + 結果頁回饋（非強制、一鍵送出）

- **登入門檻**：  
  - 兩處「點我推算時辰」按鈕點擊時，若 `!AuthService.isLoggedIn()`，不開 modal，改顯示「請先登入以使用推算時辰功能」或觸發登入。
- **問卷送出**：  
  - 改為只呼叫本站 `POST /api/me/estimate-hour`（帶 JWT、body `{ answers }`）；成功則用回傳的 `branch, half, hour_label, hour_range, log_id` 顯示 ceremony，並暫存 `log_id`。
- **結果頁（ceremony）回饋設計 — 非強制、減少摩擦**：  
  - **區塊**：在現有「推算結果：你是 X時」與確認鈕之間（或之下）加「這個推算對你來說正確嗎？」。  
  - **按鈕**：  
    - **[ ✅ 準確 ]** 與 **[ ❌ 不準 ]** 兩個大按鈕。  
    - 點擊 **[ ✅ 準確 ]** → **立刻**觸發 `PATCH /api/me/estimate-hour/logs/:log_id`，body `{ correct: true }`，不需再按「送出回饋」。  
    - 點擊 **[ ❌ 不準 ]** → **動態展開**「請選擇您的真實時辰」：地支下拉（子丑寅卯…）+ 上半/下半；選完後**一鍵送出**（或選完即自動送出），觸發 PATCH，body `{ correct: false, actual_branch, actual_half }`。  
  - **不強制**：可不提供「稍後再說」按鈕，或提供「跳過」讓用戶直接點「確認」關閉，不送回饋（`feedback_correct` 維持 NULL）。
- **依賴**：Step 2、Step 3 已上線。

---

## 階段二：專家後台可讀取與分析「推算時辰結果」

此階段在專家後台新增「推算時辰結果」區塊與對應後台 API，不影響一般用戶流程。

### Step 5：後台 API `GET /api/admin/estimate-hour-logs`

- **產出**：`functions/api/admin/estimate-hour-logs.js`。
- **認證**：與現有專家後台一致，**Basic Auth**（`ADMIN_USER`、`ADMIN_PASSWORD`）；未通過則 401。
- **行為**：  
  - 查詢 D1 `estimate_hour_logs`，可 JOIN `users` 取得 `email`、`name`（方便專家辨識，不對外公開）。  
  - 查詢參數建議：  
    - `from`、`to`（ISO 日期或 datetime，篩選 `created_at`）；  
    - `feedback`：`all` | `yes` | `no`（有回饋 / 未回饋）；  
    - `correct`：`all` | `1` | `0`（回饋為正確 / 不正確）；  
    - `page`、`pageSize`（分頁，預設如 page=1, pageSize=50）。  
  - 回傳格式建議：  
    - `{ ok: true, logs: [...], total: N }`  
    - 每筆 log 含：`id, user_id, user_email, user_name, answers_json, estimated_branch, estimated_half, created_at, feedback_correct, feedback_actual_branch, feedback_actual_half, feedback_at`。  
  - 依 `created_at DESC` 排序。
- **依賴**：Step 1、現有 admin Basic Auth 寫法（可參考 `functions/api/admin/users.js`）。

### Step 6：專家後台頁面 — 新增「推算時辰結果」區塊（含熱圖與案例匯出）

- **檔案**：`expert-admin.html`。
- **位置**：登入後主控制台（`#dashboardWrap`）內，建議放在「數據輸入」之後、或「完整數據導出」之前，標題：「推算時辰結果」或「時辰推算紀錄與回饋分析」。
- **內容**：  
  1. **操作列**：  
     - 「載入推算紀錄」按鈕：呼叫 `GET /api/admin/estimate-hour-logs`（帶 `authHeader()`）。  
     - 篩選：日期區間（from / to）、回饋狀態（全部 / 已回饋 / 未回饋）、正確與否（全部 / 正確 / 不正確）；按「套用」或「載入」時將參數帶入 API。  
  2. **列表**：  
     - 表格欄位：時間、用戶（email 或 name，可脫敏）、推算結果（estimated_branch + estimated_half）、回饋（正確／不正確／未回饋）、真實時辰、回饋時間；可選一欄「答案摘要」折疊顯示 answers_json。  
  3. **回饋矩陣熱圖（進階）**：  
     - **維度**：橫軸 = 「系統推算時辰」（子丑寅卯…），縱軸 = 「用戶回饋真實時辰」（子丑寅卯…）。  
     - **格子數值**：已回饋且「不正確」的筆數（推算 = 橫軸、真實 = 縱軸）；對角線可為「正確」筆數。  
     - **價值**：一眼看出哪個時辰最常被誤判（例如系統算「寅時」、用戶回饋「卯時」特別多 → 寅卯交界權重可檢討）。  
     - 實作：用目前篩選結果在前端依 `estimated_branch` × `feedback_actual_branch` 分組計數，以表格或簡易 CSS 熱圖（顏色深淺表次數）呈現。  
  4. **摘要**：  
     - 總筆數、已回饋筆數、正確數 / 不正確數、準確率（正確／已回饋）；可依日期區間計算。  
  5. **案例匯出（強烈建議）**：  
     - **「匯出 CSV」**：除基本欄位（時間、user_id、email、推算結果、回饋、真實時辰等）外，**務必包含 answers_json 的展開欄位**（q1, q2, … q19 各一欄）。  
     - **價值**：下載到 Excel 後可做深度交叉分析，例如：「為什麼選了某選項的人，系統容易誤判為申時？」這類題目/選項與誤判時辰的關聯，是優化命理模型的核心。  
     - 「匯出 JSON」：同樣可含完整 answers 物件，供腳本或 BI 工具分析。
- **技術要點**：  
  - 使用與現有區塊相同的 `authHeader()`；401 導回登入、4xx/5xx 顯示錯誤訊息。  
  - 若筆數多，僅載入當前頁或有限筆數。

### Step 7：專家後台 — 分析與後續使用方式（說明）

- **不做額外開發**：在文件中說明專家可如何利用後台資料。  
- **建議用法**：  
  - 定期查看「推算時辰結果」、篩選「已回饋」與「不正確」，檢視 `estimated_branch/half` 與 `feedback_actual_branch/half` 的差異，找出題目或權重需調整之處。  
  - 匯出 CSV/JSON 後，用試算表或腳本計算準確率、依題目或選項做交叉分析，供模型修正參考。  
  - 若未來要 A/B 測試或改版題庫，可依 `created_at` 區分新舊版本資料。

---

## 步驟總覽與依賴關係

| 步驟 | 產出 | 依賴 |
|------|------|------|
| **1** | D1 migration `estimate_hour_logs` | 無 |
| **2a** | 共用模組 `functions/utils/shichen-logic.js`（純函數推算） | 無 |
| **2b** | POST /api/me/estimate-hour（JWT、import 推算、寫 log） | 1、2a、JWT |
| **3** | PATCH /api/me/estimate-hour/logs/:id（回饋） | 1、JWT |
| **4** | 前端：登入門檻 + 問卷打本站 API + ceremony「✅ 準確 / ❌ 不準」一鍵 PATCH | 2b、3 |
| **5** | GET /api/admin/estimate-hour-logs（Basic Auth、篩選、分頁） | 1、admin 認證 |
| **6** | expert-admin「推算時辰結果」：列表、熱圖、匯出 CSV（含 answers 展開欄） | 5 |
| **7** | 文件說明：專家如何用後台做分析與模型修正 | 無 |

建議開發順序：**1 → 2a → 2b → 3 → 4**（先讓推算邏輯共用、用戶端流程與資料完整），再 **5 → 6**；**7** 可與 6 並行或稍後補上。

---

## 與現有專家後台整合要點

- **認證**：專家後台沿用現有 Basic Auth（`ADMIN_USER` / `ADMIN_PASSWORD`），所有 admin API 含 `GET /api/admin/estimate-hour-logs` 皆用同一套，無需改登入流程。  
- **路由**：Cloudflare Pages Functions 依目錄對應路由，新增 `functions/api/admin/estimate-hour-logs.js` 即對應 `GET /api/admin/estimate-hour-logs`。  
- **UI 風格**：新區塊使用既有 `glass`、按鈕與表格樣式，與「數據輸入」「戰略標籤」等區塊一致即可。  
- **環境變數**：無需新增；沿用 `ADMIN_USER`、`ADMIN_PASSWORD`、`CONSULT_DB`。

完成後，專家在 https://www.17gonplay.com/expert-admin 登入即可在「推算時辰結果」區塊看到所有推算紀錄與回饋，並可依日期、回饋狀態篩選與匯出，用於後續分析與模型更正。

---

## 參考建議摘要（已整合進本計畫）

| 建議 | 對應步驟 | 說明 |
|------|----------|------|
| **推算邏輯純函數化、共用模組** | Step 2a、2b | 建立 `functions/utils/shichen-logic.js`，後端 API 直接 import；未來調整題目權重只改一處，後端與前端 fallback 可同步。 |
| **Ceremony 回饋：非強制、一鍵送出** | Step 4 | [ ✅ 準確 ] / [ ❌ 不準 ] 兩大按鈕；點 ❌ 才展開「請選擇真實時辰」；點任一按鈕即觸發 PATCH，不再多按「送出回饋」。 |
| **專家後台：回饋矩陣熱圖** | Step 6 | 橫軸 = 系統推算時辰、縱軸 = 用戶回饋真實時辰；一眼看出哪個時辰最常被誤判（如寅→卯）。 |
| **Migration 範例** | Step 1 | 見 `migrations/0008_estimate_hour_logs.sql`；索引含 `idx_logs_feedback` 加速後台篩選。 |
| **案例匯出：answers 展開欄** | Step 6 | CSV 匯出含 q1～q19 等展開欄位，下載到 Excel 可做「選了某選項的人為何易被誤判為某時辰」等交叉分析，利於優化模型。 |
