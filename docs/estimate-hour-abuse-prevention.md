# 推算時辰「防濫用監控」可行性分析與實作建議

針對 Gemini 提出的三道防火牆（後端限流、專家後台監控、Cloudflare WAF），依你目前架構（Cloudflare Pages + D1、POST /api/me/estimate-hour、專家後台）的可行性與實作要點如下。

---

## 一、第一道：後端頻率限制 (Rate Limiting)

| 項目 | 可行性 | 說明 |
|------|--------|------|
| **每日上限（每用戶 5 次/日）** | ✅ 可行 | 在 `POST /api/me/estimate-hour` 內，INSERT 前先查 `estimate_hour_logs` 當日（`created_at LIKE 'YYYY-MM-DD%'`）同一 `user_id` 的筆數，≥ 5 則回傳 429 + 錯誤訊息。 |
| **間隔限制（兩次間隔 30 秒）** | ✅ 可行 | 同一 API 內再查該 user 最近一筆的 `created_at`，若與現在相差 < 30 秒則回傳 429。 |

**實作要點**（`functions/api/me/estimate-hour.js`）：

- 取得 `userId = payload.sub` 後、`estimateHourFromAnswers` 之前或之後、INSERT 之前：
  1. `SELECT COUNT(*) as count FROM estimate_hour_logs WHERE user_id = ? AND created_at LIKE ?`（今日日期 `YYYY-MM-DD%`），若 `count >= 5` → 429。
  2. `SELECT created_at FROM estimate_hour_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`，若存在且 `(Date.now() - new Date(created_at).getTime()) / 1000 < 30` → 429。
- 回傳格式：`jsonResponse({ error: '今日推算次數已達上限，請明日再試' }, 429)` 或 `jsonResponse({ error: '請稍後再試（兩次推算需間隔 30 秒）' }, 429)`。
- 前端若有需要，可對 429 顯示對應提示，不影響現有 401/500 處理。

**結論**：不需改表結構，只改 API 邏輯即可，可行性高。

---

## 二、第二道：專家後台「異常監控看板」

| 項目 | 可行性 | 說明 |
|------|--------|------|
| **用戶頻率排行（過去 24h 推算次數 Top 10）** | ✅ 可行 | 專家後台已有 Basic Auth 與 `GET /api/admin/estimate-hour-logs`；可新增 `GET /api/admin/estimate-hour-stats`（或沿用現有 API 加 query）回傳「過去 24h 每 user_id 次數」排序前 10，前端在「推算時辰結果」區塊上方或另開「異常監控」區塊顯示。 |
| **警訊（一小時內 > 20 次等）** | ✅ 可行 | 同上 API 或同一支，加「過去 1h 每 user 次數」；若某 user > 閾值（如 20），在後台列表或監控區塊以紅色/標籤標示。 |
| **IP 分布（多 user_id 來自同 IP）** | ✅ 可行 | 需先落庫 IP（見下 Step 5a）；之後在後台用 SQL 聚合「同一 IP 對應的 user_id 數」或「同一 IP 的請求數」，在監控區塊顯示。 |
| **D1 消耗預警** | ❌ 不做 | 依需求排除；不實作。 |

**實作要點**：

- 後端：新增 `GET /api/admin/estimate-hour-stats`（Basic Auth），回傳例如：
  - `last_24h_by_user`: `[{ user_id, email?, count }]` 依 count 降冪取前 10；
  - `last_1h_by_user`: 同上，用於警訊；
  - （若有 IP）`by_ip`: 聚合資訊。
- 前端：在專家後台「推算時辰結果」區塊上方或新 section「異常監控」：呼叫上述 API，顯示表格 + 超過閾值者紅色標示。

**結論**：用戶頻率、警訊、IP 分布皆可行；D1 消耗預警依需求不做。

---

## 三、第三道：Cloudflare WAF（不寫程式）

| 項目 | 可行性 | 說明 |
|------|--------|------|
| **Rate Limiting 規則** | ✅ 可行 | 在 Cloudflare Dashboard → 該網域 → Security → WAF → Custom rules：針對路徑 `/api/me/estimate-hour`（或 `*www.17gonplay.com/api/me/estimate-hour*`）設「同一 IP 在 10 秒內請求 > 3 次」→ Action 選 Block 或 Managed Challenge。 |
| **Bot Fight Mode** | ✅ 可行 | Security → Bots → 開啟 Bot Fight Mode（若方案支援），可攔截已知惡意爬蟲。 |

**結論**：純 Dashboard 設定，與現有程式碼無關，可行性高；建議與後端限流並行使用。

---

## 四、Step 5a：Log 多加 `user_ip`（進階）

| 項目 | 可行性 | 說明 |
|------|--------|------|
| **欄位** | ✅ 可行 | 新增 migration（如 `0009_estimate_hour_logs_add_user_ip.sql`）對 `estimate_hour_logs` 加 `user_ip TEXT`（可 NULL，舊資料不填）。 |
| **寫入** | ✅ 可行 | 在 `POST /api/me/estimate-hour` 內用 `request.headers.get('CF-Connecting-IP')` 取得 IP（Cloudflare 會帶入），INSERT 時一併寫入。 |
| **隱私** | ⚠️ 注意 | IP 屬個人相關資料，若需合規（如 GDPR），應在隱私說明中註明用途與保留期限，必要時取得同意。 |

**結論**：技術上可行；若要做「同一 IP 多 user」的異常監控，建議實作此步。

---

## 五、Step 5b：專家後台「異常預警」查詢與視覺化

| 項目 | 可行性 | 說明 |
|------|--------|------|
| **SQL 聚合** | ✅ 可行 | 例如 `SELECT user_id, COUNT(*) as cnt FROM estimate_hour_logs GROUP BY user_id HAVING cnt > 10`，可由現有 `GET /api/admin/estimate-hour-logs` 擴充或另開 `GET /api/admin/estimate-hour-stats` 回傳。 |
| **後台紅色標示** | ✅ 可行 | 專家後台「推算時辰結果」列表載入時，若後端回傳「異常 user_id 列表」或每筆帶 `is_anomaly`，前端對該列或該用戶以紅色/標籤顯示。 |

**結論**：與現有專家後台、Basic Auth、D1 查詢相容，可行性高。

---

## 六、建議實作順序

1. **後端限流**（每日 5 次 + 30 秒間隔）— 改動小、立即見效。
2. **Cloudflare WAF**（Rate Limit + 可選 Bot Fight Mode）— 無需改 code，補足基礎設施層防護。
3. **專家後台「異常監控」**（24h Top 10 + 1h 警訊 + 可選異常列表紅色標示）— 需新增或擴充 admin API 與前端區塊。
4. **Step 5a（user_ip）**— 若要 IP 維度分析再做；並配合隱私說明。
5. **D1 消耗顯示**— 不做。

---

## 七、讓系統保持輕快：三項補充建議（有意義且可行）

以下三項在現有架構下**有意義**且**可行**，建議一併納入設計。

### 7.1 攔截無效請求（前端 + WAF）

| 項目 | 意義 | 可行性 |
|------|------|--------|
| **前端驗證：問卷沒填完按鈕 Disable** | 減少無效請求打到 API，減輕 D1 與頻寬負擔。 | ✅ 已部分做到：送出按鈕僅在最後一題顯示，且 `!hasCurrentAnswer()` 時 Disable。可再補一層：送出前檢查 `answers` 是否含 q1～q19，缺任一則不發請求。 |
| **WAF 限流：同 IP 一分鐘 > 10 次 → 驗證碼** | 在請求進到 Worker / D1 前就擋掉濫用，系統更輕。 | ✅ 可行：Cloudflare Dashboard → Security → WAF → Rate limiting rule：路徑含 `/api/me/estimate-hour`，同一 IP 1 分鐘內 > 10 次 → Action 選 **Managed Challenge**（驗證碼）。不需改程式。 |

**結論**：有意義；前端可再加一層「全部題目都有答案」再送出，WAF 用現成規則即可。

### 7.2 緩存（Caching）— 專家後台聚合統計

| 項目 | 意義 | 可行性 |
|------|------|--------|
| **準確率等聚合結果存 KV，每小時更新** | 專家後台「準確率統計」等耗時聚合不必每次打 D1，負擔降為零；報表延遲 1 小時可接受。 | ✅ 可行：專案需新增 **Cloudflare KV** namespace，在 Pages 綁定；admin API（如 `/api/admin/estimate-hour-stats`）先查 KV 是否有未過期快取，有則直接回傳，無則查 D1、寫入 KV（TTL 3600）、回傳。 |

**結論**：有意義；需在 wrangler 與 Dashboard 新增 KV，API 內加「先讀 KV 再決定是否查 D1」邏輯。

### 7.3 欄位精簡（Pruning）— answers_json 只存選項 ID

| 項目 | 意義 | 可行性 |
|------|------|--------|
| **只存選項 ID（如 q1: "A"），不存選項文字（如 "體型壯碩"）** | 資料庫體積與 I/O 明顯變小，寫入與查詢都更輕。 | ✅ **目前已是只存 ID**：問卷表單 `value` 為 `opt.key`（A、B、C…），送出時 `answers[q.id] = input.value`，故 `answers_json` 已是 `{ q1: ["A","B"], q2: "C", ... }`，沒有存選項文字。無需再改；若未來有別處寫入文字，再統一改為只存 key。 |

**結論**：有意義；你現有實作已符合「只存 ID」，只要維持此約定即可。

---

## 八、小結

| 防火牆 | 可行性 | 備註 |
|--------|--------|------|
| 後端每日 5 次 + 30 秒間隔 | ✅ 高 | 僅改 POST /api/me/estimate-hour。 |
| 專家後台監控（頻率排行、警訊、異常標示） | ✅ 高 | 需新增/擴充 admin API + 前端區塊。 |
| Cloudflare WAF Rate Limit + Bot | ✅ 高 | Dashboard 設定即可。 |
| Log 加 user_ip | ✅ 高 | 需 migration + API 寫入；注意隱私。 |
| D1 消耗預警 | ❌ 不做 | 依需求不實作。 |
| 前端完整驗證 + WAF 限流（攔截無效請求） | ✅ 高 | 有意義；前端可再加「全部題目有答案」檢查，WAF 設同 IP 1 分鐘 > 10 次 → 驗證碼。 |
| 專家後台聚合結果存 KV、每小時更新 | ✅ 高 | 有意義；需新增 KV 與 API 快取邏輯。 |
| answers_json 只存選項 ID | ✅ 已符合 | 目前即只存 key（A/B/C…），未存選項文字，維持即可。 |

整體而言，除 D1 消耗預警不做外，其餘在現有架構下皆可實作；建議先做後端限流與 WAF，再補專家後台監控與可選的 KV 緩存、IP 紀錄。
