# 「點我推算時辰」登入門檻 + 使用紀錄與回饋 — 可行性分析

## 一、現況整理

| 項目 | 說明 |
|------|------|
| **入口** | 兩處：「點我推算時辰」（`btnIdentifyBirthTimeGlobal`）、「不確定時辰？點我推算時辰」（`btnIdentifyBirthTime`），皆由 `birth-time-identifier.js` 的 `openModal()` 開啟問卷。 |
| **流程** | 18+1 題問卷 → 送出 → 呼叫 `identifyBirthTimeFromAPI(answers)` → 先打**同源** `/api/estimate-hour`，失敗再打**遠端** `17gonplay-api.billeetw.workers.dev/api/estimate-hour`，再失敗則用**前端** `estimateHourLocal(answers)`。 |
| **結果呈現** | 儀式彈窗（ceremony）：顯示「推算結果：你是 X時」+ 打字動畫 + 確認鈕；點確認後把推算的時辰寫入表單（birthShichen / birthShichenHalf）。 |
| **後端** | 本專案 **目前沒有** `/api/estimate-hour`；推算實際由遠端 API 或前端 fallback 完成。 |

目標：**登入才能使用**、**紀錄每次使用**、**出結果後可回饋正確與否與真實時辰**，以利後續分析、模型修正並減少濫用。

---

## 二、方案概述

1. **登入門檻**：未登入時點「點我推算時辰」→ 提示先登入，或導向登入後再回來。
2. **紀錄使用**：每次送出問卷並取得推算結果時，在後端寫入一筆紀錄（誰、何時、問卷答案、推算結果）。
3. **結果回饋**：在結果頁（ceremony）加「正確／不正確」；若選不正確，可填寫真實時辰（地支 + 上半/下半），一併送出存檔。

---

## 三、可行性評估

### 3.1 技術可行性：**高**

| 項目 | 可行性 | 說明 |
|------|--------|------|
| 登入檢查 | ✅ 已有 | 現有 `AuthService.isLoggedIn()`、JWT；按鈕點擊時先檢查，未登入則不開 modal、改顯示「請先登入」或觸發登入。 |
| 後端驗證 | ✅ 已有 | `/api/me/*` 已用 JWT；新增「推算 + 紀錄」API 時一併驗證 JWT，401 即拒絕。 |
| 紀錄儲存 | ✅ 可做 | D1 新增表（見下節），每次推算（含 answers、結果）寫一筆；可關聯 `user_id`（來自 JWT）。 |
| 回饋儲存 | ✅ 可做 | 同一筆紀錄補欄位或另表存「是否正確、真實時辰」；前端在 ceremony 加區塊送出。 |
| 推算邏輯位置 | ⚠️ 需選擇 | 目前無本站 `/api/estimate-hour`。若要**完整紀錄 + 防濫用**，建議在本站實作一層 API：驗證 JWT → 可選呼叫遠端或本站實作推算 → 寫 log → 回傳結果。 |

結論：在現有架構（Cloudflare Pages + D1、JWT、AuthService）下，**登入門檻、紀錄、回饋皆可實作**，無技術障礙。

### 3.2 產品與營運可行性：**可行，需取捨**

| 面向 | 說明 |
|------|------|
| **使用者體驗** | 登入後才能推算，會篩掉「只想試玩」的訪客；可搭配文案說明「登入後可保存紀錄、參與模型改進」。 |
| **濫用防護** | 登入 + 依 user 紀錄次數即可（例如每人每日 N 次上限）；進階可再依 IP/設備限流。 |
| **資料用途** | 回饋「正確／不正確 + 真實時辰」可做準確率分析、題目或權重調參、未來模型/規則修正。 |
| **隱私與合規** | 問卷答案與推算結果屬個人相關；需在 UI/隱私說明中註明用途、留存時間，必要時取得同意。 |

### 3.3 與現有遠端 API 的關係

- **情境 A**：繼續使用遠端 `17gonplay-api.billeetw.workers.dev/api/estimate-hour`  
  - 本站僅負責：登入檢查、呼叫遠端前/後寫「使用紀錄」、結果頁回饋 API。  
  - 優點：不改遠端邏輯。缺點：推算邏輯與權重不在本站，若遠端改版或下線需因應。

- **情境 B**：本站新增 `/api/estimate-hour`（邏輯與前端 `estimateHourLocal` 一致或由本站獨自維護）  
  - 前端改為只打本站 API（帶 JWT）；本站：驗證 → 推算 → 寫 log → 回傳。  
  - 優點：資料與邏輯集中、易做 A/B 或模型迭代。缺點：需維護一份推算邏輯。

**建議**：若以「累積數據、後續更正模型」為主，優先考慮 **情境 B**（本站 API + 紀錄 + 回饋）；若短期僅要「登入門檻 + 簡單紀錄」，可先 **情境 A**，再視需求遷移到 B。

---

## 四、資料與 API 設計建議

### 4.1 D1 表結構（示意）

```text
-- 推算時辰使用紀錄（每次問卷送出 + 取得結果時寫一筆）
estimate_hour_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,           -- 來自 JWT sub，對應 users.id
  answers_json TEXT NOT NULL,      -- JSON：{ q1: [...], q2: [...], q3: "...", ... }
  estimated_branch TEXT NOT NULL,  -- 推算結果：子丑寅卯...
  estimated_half TEXT NOT NULL,    -- "upper" | "lower"
  created_at TEXT NOT NULL,
  -- 回饋（出結果後用戶填寫）
  feedback_correct INTEGER,        -- 1=正確, 0=不正確, NULL=未回饋
  feedback_actual_branch TEXT,     -- 用戶填寫的真實時辰（僅當不正確時）
  feedback_actual_half TEXT,
  feedback_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_estimate_hour_logs_user_created ON estimate_hour_logs(user_id, created_at);
```

- 寫入時機：**取得推算結果後**（不論來自本站 API 或遠端/前端 fallback，若走本站 API 建議在 API 內寫入）。
- 回饋更新：用戶在結果頁點「正確／不正確」並可選填真實時辰後，`PATCH` 或 `POST` 更新該筆 log 的 `feedback_*` 欄位。

### 4.2 API 設計建議

| 方法 | 路徑 | 用途 | 認證 |
|------|------|------|------|
| POST | `/api/me/estimate-hour` | 送出問卷答案；後端推算（或轉調遠端）、寫入 `estimate_hour_logs`、回傳 `{ branch, hour_label, hour_range, half }` | JWT 必填 |
| PATCH | `/api/me/estimate-hour/logs/:id` | 回饋：`{ correct: true/false, actual_branch?, actual_half? }`，更新該筆 log 的 feedback 欄位 | JWT 必填，且僅能更新自己的 log |

- 前端流程調整：  
  - 點「點我推算時辰」→ 若未登入，提示登入並 return。  
  - 問卷送出 → 改為呼叫本站 `POST /api/me/estimate-hour`（帶 JWT + `answers`）；後端負責推算 + 寫 log + 回傳結果。  
  - 結果頁（ceremony）顯示結果後，多一個回饋區塊；送出時呼叫 `PATCH /api/me/estimate-hour/logs/:logId`（logId 由 POST 回傳）。

若暫不實作本站推算，可僅實作「紀錄 + 回饋」：  
- 前端仍先依現有邏輯取得結果（遠端或 fallback），再呼叫本站 `POST /api/me/estimate-hour/logs` 只寫入紀錄（answers + 前端算出的結果）+ 回傳 `log_id`，結果頁回饋時用該 `log_id` 更新。  
- 缺點是「推算」與「紀錄」分離，且若用 fallback 則後端沒有完整推算邏輯可重現，長期仍建議走向「本站 API 統一推算 + 寫 log」。

---

## 五、前端改動要點

1. **入口按鈕（兩處）**  
   - 點「點我推算時辰」時：若 `!AuthService.isLoggedIn()` → 不開 modal，改顯示「請先登入以使用推算時辰功能」或觸發登入；登入後可再點一次進入問卷。

2. **問卷送出**  
   - 改為只呼叫本站 `POST /api/me/estimate-hour`（帶 JWT、body 含 `answers`）。  
   - 成功：後端回傳 `{ branch, hour_label, hour_range, half, log_id }`；前端用於顯示 ceremony 並保留 `log_id`。  
   - 失敗（如 401）：提示登入過期或請先登入。

3. **結果頁（ceremony）**  
   - 在現有「推算結果：你是 X時」與確認鈕之間（或之下）加回饋區塊：  
     - 「這個推算對你來說正確嗎？」  
     - 按鈕：「正確」「不正確」。  
     - 若選「不正確」：顯示表單「請選擇真實時辰」→ 地支下拉（子丑寅卯…）+ 上半/下半，送出。  
   - 送出回饋時呼叫 `PATCH /api/me/estimate-hour/logs/:log_id`，body：`{ correct, actual_branch?, actual_half? }`。  
   - 可設計為「選正確／不正確」即送出，選「不正確」再跳出真實時辰表單，送出後更新同一筆 log。

4. **防濫用（可選）**  
   - 後端依 `user_id` + 當日（或當小時）計數，超過 N 次回 429 或友善提示「今日次數已滿，請明日再試」。

---

## 六、風險與注意事項

| 風險 | 說明 | 建議 |
|------|------|------|
| 登入率下降 | 部分用戶不願登入即離開 | 文案說明登入可保存紀錄、參與改進；可保留「僅試算」不紀錄的入口（不建議，會與防濫用衝突）。 |
| 回饋率低 | 多數人不填正確與否 | 設計成 1～2 次點擊即可完成；可選「稍後再說」不強制當下回饋，之後在「我的命盤」或設定頁補填。 |
| 資料量與成本 | D1 寫入與儲存 | 單筆體積小，依使用量評估即可；可訂保留期限（如 2 年）或匿名化後長期分析。 |
| 隱私 | 問卷答案可推論個性 | 隱私政策/說明中註明用途；必要時僅儲存「題目 id + 選項 key」不存自由文字。 |

---

## 七、結論與建議

- **可行性**：在現有登入、JWT、D1 架構下，**登入才能使用、紀錄使用狀況、結果頁回饋正確與否與真實時辰**皆可實作，技術與產品面均可行。
- **建議步驟**：  
  1. 新增 D1 表 `estimate_hour_logs` 與上述欄位。  
  2. 實作本站 `POST /api/me/estimate-hour`（JWT 必填）：內含推算邏輯（或短期轉調遠端）+ 寫入 log，回傳結果與 `log_id`。  
  3. 實作 `PATCH /api/me/estimate-hour/logs/:id` 回饋更新。  
  4. 前端：兩處「點我推算時辰」加登入檢查；問卷改打本站 API；ceremony 加回饋區塊並呼叫 PATCH。  
  5. 可選：每人每日/每小時次數上限、隱私說明與同意。

此設計可支援後續分析（準確率、題目與權重檢討）、模型更正，並透過登入與次數限制降低濫用與亂填影響。
