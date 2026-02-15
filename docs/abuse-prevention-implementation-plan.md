# 防濫用／防抄襲實作計畫

目標：確保推算時辰與 D1 不被濫用、抄襲或破壞，同時保持系統輕快。

**不做**：D1 消耗預警。  
**維持現狀**：`answers_json` 已只存選項 ID（A/B/C…），無需改動。

---

## 階段一：立即攔截無效與濫用請求（優先）

在請求到達 D1 前就擋掉無效與過量請求。

| 步驟 | 產出 | 依賴 | 說明 |
|------|------|------|------|
| **1.1 後端頻率限制** | 改 `POST /api/me/estimate-hour` | 無 | 每日每用戶 5 次；兩次間隔至少 30 秒；超過回 429。 |
| **1.2 前端完整驗證** | 改 `birth-time-identifier.js` | 無 | 送出前檢查 q1～q19 皆有答案，缺任一則不發 API。 |
| **1.3 WAF 限流（驗證碼）** | Dashboard 設定 | 無 | 同 IP 1 分鐘內對 `/api/me/estimate-hour` 超過 10 次 → Managed Challenge。 |

**建議順序**：1.1 → 1.2 → 1.3（1.1 與 1.2 可並行）。

---

### Step 1.1：後端頻率限制

- **檔案**：`functions/api/me/estimate-hour.js`
- **邏輯**：取得 `userId` 後、INSERT 前：
  1. 今日筆數：`SELECT COUNT(*) ... WHERE user_id = ? AND created_at LIKE ?`（今日 `YYYY-MM-DD%`），若 ≥ 5 → `jsonResponse({ error: '今日推算次數已達上限，請明日再試' }, 429)`。
  2. 最近一筆時間：`SELECT created_at ... WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`，若存在且與現在相差 < 30 秒 → `jsonResponse({ error: '請稍後再試（兩次推算需間隔 30 秒）' }, 429)`。
- **前端**：對 429 在 `#hint` 顯示 `data.error`（與現有錯誤處理一致即可）。

---

### Step 1.2：前端完整驗證

- **檔案**：`js/ui/components/birth-time-identifier.js`
- **邏輯**：表單 `submit` 處理內、`fetch` 前：檢查 `answers` 是否含 q1～q19（q1、q2 可為陣列，其餘為字串）；缺任一則 `hint` 顯示「請完成所有題目」並 `return`，不發請求。

---

### Step 1.3：WAF 限流（同 IP 1 分鐘 > 10 次 → 驗證碼）

- **設定說明**：見 [docs/waf-estimate-hour-rate-limit.md](waf-estimate-hour-rate-limit.md)。
- **位置**：Cloudflare Dashboard → 你的網域 → **Security** → **WAF** → **Custom rules**（或 **Rate limiting rules**）
- **動作**：新增規則，例如：
  - **Name**：`estimate-hour rate limit`
  - **Expression**：`(http.request.uri.path contains "/api/me/estimate-hour")`
  - **Rate limit**：同一 IP，1 分鐘內超過 10 次
  - **Action**：**Managed Challenge**（驗證碼）
- **說明**：不需改程式；請求在進入 Worker / D1 前就會被攔截。

---

## 階段二：專家後台異常監控

讓專家能第一時間發現異常使用（刷量、機器人、抄襲腳本）。

| 步驟 | 產出 | 依賴 | 說明 |
|------|------|------|------|
| **2.1 後台統計 API** | `GET /api/admin/estimate-hour-stats` | 無 | Basic Auth；回傳 24h Top 10、1h 警訊（>20 次）、可選異常 user 列表。 |
| **2.2 專家後台監控區塊** | 改 `expert-admin.html` | 2.1 | 「異常監控」區塊：頻率排行、警訊、異常列表紅色標示。 |
| **2.3 統計結果存 KV（每小時更新）** | 新增 KV + 改 stats API | 2.1 | 先讀 KV，無/過期再查 D1、寫入 KV（TTL 3600），減輕 D1 負擔。 |

**建議順序**：2.1 → 2.2 → 2.3（2.3 需先建 KV namespace 並在 Pages 綁定）。

---

### Step 2.1：GET /api/admin/estimate-hour-stats

- **檔案**：`functions/api/admin/estimate-hour-stats.js`（新建）
- **認證**：Basic Auth（與現有 admin 一致）
- **回傳**（查 D1）：
  - `last_24h_by_user`：過去 24h 每 user 推算次數，排序取前 10，含 `user_id`、`user_email`（JOIN users）、`count`。
  - `last_1h_by_user`：過去 1h 同上；用於警訊。
  - `anomaly_user_ids`：過去 24h 或 1h 內 `count > 10` 的 user_id 列表（供前端紅色標示）。
- **查詢**：`created_at >= datetime('now', '-24 hours')` 等；依 `user_id` 分組計數。

---

### Step 2.2：專家後台「異常監控」區塊

- **檔案**：`expert-admin.html`
- **位置**：在「推算時辰結果」區塊上方或內側，新增「異常監控」小節。
- **內容**：按「載入監控」呼叫 `GET /api/admin/estimate-hour-stats`，顯示：
  - 過去 24h 推算次數 Top 10（表格）。
  - 過去 1h 警訊：若某 user > 20 次，紅色標示或獨立警訊列。
  - （可選）異常 user 列表（`anomaly_user_ids`）在「推算時辰結果」表格中對應列以紅色標示。

---

### Step 2.3：統計結果存 KV、每小時更新

- **前置**：專案若已用 `wrangler.toml` 部署，Dashboard 的 **Settings → Bindings → Add** 會呈灰色（以 Wrangler 為準）。請改在 **wrangler.toml** 中綁定 KV：
  1. 到 **Workers & Pages** → 左側 **KV** → **Create namespace**，名稱例如 `BAZI_CACHE`，建立後複製該 namespace 的 **ID**。
  2. 在專案根目錄的 `wrangler.toml` 中已預留 `[[kv_namespaces]]`（binding 名稱為 `CACHE`），將 `id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"` 改成剛複製的 namespace ID。
  3. 存檔後重新部署（git push 或 `npx wrangler pages deploy`）。
- **檔案**：`functions/api/admin/estimate-hour-stats.js`
- **邏輯**：收到請求時先 `await env.CACHE.get('estimate_hour_stats')`；若有值且未過期（例如 key 存 JSON 內含 `cached_at`，或另用 TTL），直接回傳。若無或過期，查 D1 彙總 → 寫入 `CACHE.put('estimate_hour_stats', JSON.stringify(data), { expirationTtl: 3600 })` → 回傳。  
- **說明**：專家看到的統計最多延遲 1 小時，D1 負擔降為每小時最多 1 次聚合查詢。

---

## 階段三：進階防護（可選）

| 步驟 | 產出 | 依賴 | 說明 |
|------|------|------|------|
| **3.1 Log 加 user_ip** | migration + 改 POST API | 無 | 存 `CF-Connecting-IP`，供「同 IP 多帳號」異常分析；需隱私說明。 |
| **3.2 專家後台 IP 維度** | 改 stats API + 後台 | 3.1 | 聚合「同一 IP 的請求數／user 數」，監控區塊顯示。 |
| **3.3 WAF Bot Fight Mode** | Dashboard | 無 | Security → Bots → 開啟 Bot Fight Mode（若方案支援）。見 [docs/waf-bot-fight-mode.md](waf-bot-fight-mode.md)。 |

**建議**：3.1 若有隱私與合規考量可延後；3.3 可隨時在 Dashboard 開啟。

---

### Step 3.1：estimate_hour_logs 加 user_ip

- **Migration**：`migrations/0009_estimate_hour_logs_add_user_ip.sql`  
  - `ALTER TABLE estimate_hour_logs ADD COLUMN user_ip TEXT;`
- **API**：`POST /api/me/estimate-hour` 內 `const userIp = request.headers.get('CF-Connecting-IP') || null`；INSERT 時多一欄 `user_ip`。
- **隱私**：在網站隱私說明中註明會記錄 IP、用途（防濫用、異常分析）、保留期限。可參考 [docs/privacy-note-estimate-hour-ip.md](privacy-note-estimate-hour-ip.md)。

---

## 實作順序總覽

```
階段一（優先）
  1.1 後端頻率限制（每日 5 次 + 30 秒間隔）
  1.2 前端完整驗證（q1～q19 皆有答案才送出）
  1.3 WAF 限流（同 IP 1 分鐘 > 10 次 → 驗證碼）

階段二（監控）
  2.1 GET /api/admin/estimate-hour-stats（24h Top 10、1h 警訊、異常列表）
  2.2 專家後台「異常監控」區塊
  2.3 統計結果存 KV、TTL 3600（每小時更新）

階段三（可選）
  3.1 estimate_hour_logs 加 user_ip + API 寫入
  3.2 專家後台 IP 維度聚合（依 3.1）
  3.3 WAF Bot Fight Mode
```

**建議**：先完成階段一（1.1、1.2、1.3），再依序做 2.1 → 2.2 → 2.3；階段三視需求再排。

---

## 檢查清單（完成後自檢）

- [ ] 未登入無法推算；登入後每日最多 5 次、間隔 30 秒；超過會收到 429 與明確訊息。
- [ ] 問卷未填完無法送出（按鈕 Disable + 送出前檢查 q1～q19）。
- [ ] WAF 規則已設：`/api/me/estimate-hour` 同 IP 1 分鐘 > 10 次 → Managed Challenge。
- [ ] 專家後台可看「異常監控」：24h Top 10、1h 警訊、異常 user 紅色標示。
- [ ] （若做 2.3）統計由 KV 快取，每小時更新，D1 無重複聚合負擔。
- [ ] （若做 3.1）新寫入的 log 含 `user_ip`；隱私說明已更新。
- [ ] （若做 3.3）Bot Fight Mode 已開啟。

完成上述計畫後，系統可有效降低濫用、抄襲與惡意刷量對 D1 與服務的影響，同時保持輕量與可維護性。
