# API 呼叫掃描結果

## 1. 所有 API 呼叫點（檔案 + 行數）

### compute / 命盤計算
| 檔案 | 行數 | API | 方法 |
|------|------|-----|------|
| js/ui/services/api-service.js | 98-99 | `${API_BASE}/compute/all` | POST |
| js/ui/services/api-service.js | 108-109 | `${API_BASE}/compute/all` (retry) | POST |
| js/ui/services/api-service.js | 146-147 | `${API_BASE}/compute/horoscope` | POST |
| js/ui/services/api-service.js | 58-59 | `${API_BASE}/content/2026?locale=...` | GET |
| js/ui/services/api-service.js | 65-66 | `${API_BASE}/content/2026?locale=zh-TW` | GET |
| js/ui/services/api-service.js | 176-177 | `${API_BASE}/charts/{chartId}/scores` | GET |
| js/ui/services/api-service.js | 201-202 | `${API_BASE}/charts/{chartId}/strategy/{palaceName}` | GET |

### life-book 命書
| 檔案 | 行數 | API | 方法 |
|------|------|-----|------|
| expert-admin.html | 1536-1538 | `{origin}/api/life-book/infer` | POST |
| expert-admin.html | 1548-1552 | `{origin}/api/life-book/narrate` | POST |
| expert-admin.html | 1565-1570 | `{origin}/api/life-book/generate-section` | POST |
| expert-admin.html | 2245-2250 | `{origin}/api/life-book/ask` | POST |

### consult / admin
| 檔案 | 行數 | API | 方法 |
|------|------|-----|------|
| expert-admin.html | 665-666 | `/api/admin/consultations` | GET |
| expert-admin.html | 1595-1598 | `/api/admin/life-books` | POST |
| expert-admin.html | 1757-1758 | `/api/admin/usage-stats?days=` | GET |
| expert-admin.html | 1885-1886 | `/api/admin/estimate-hour-stats` | GET |
| expert-admin.html | 1958-1959 | `/api/admin/estimate-hour-logs?` | GET |
| expert-admin.html | 1992-1993 | `/api/admin/divination-stats?` | GET |
| expert-admin.html | 2092-2093 | `/api/admin/calculation-results` | GET |
| expert-admin.html | 2138-2139 | `/api/admin/life-books?limit=100` | GET |
| expert-admin.html | 2180-2181 | `/api/admin/life-books/{id}` | GET |
| consultation.html | 253-256 | `/api/consultation` | POST |
| js/calc/adminExport.js | 223-224 | `/api/admin/calculation-results` | POST |

### 其他後端 API
| 檔案 | 行數 | API | 方法 |
|------|------|-----|------|
| js/ui.js | 508-509 | `${API_BASE}/api/log-usage` | POST |
| js/divination-app.js | 58-62 | `/api/divination` | POST |
| js/divination-app.js | 914-919 | `/api/divination` | POST |
| js/divination-app.js | 1210-1214 | `/api/divination/feedback` | POST |
| js/divination-app.js | 1247-1251 | `/api/divination/feedback` | POST |
| js/divination-app.js | 1345-1346 | `/api/me/divinations` | GET |
| js/ui/components/birth-time-identifier.js | 406-410 | `{origin}/api/me/estimate-hour` | POST |
| js/ui/components/birth-time-identifier.js | 451-455 | `{origin}/api/me/estimate-hour/logs/{log_id}` | PATCH |
| js/ui/services/auth-service.js | 78-79 | `{origin}/api/me/badges?year=2026` | GET |
| js/ui/services/auth-service.js | 154-155 | `/api/auth/config` | GET |
| js/ui/services/auth-service.js | 226-229 | `{origin}/api/auth/google` | POST |
| js/ui/services/my-charts-service.js | 122-123 | `{base}/api/me/charts` | GET |
| js/ui/services/my-charts-service.js | 196-197 | `{base}/api/me/charts` | POST |
| js/ui/services/my-charts-service.js | 237-238 | `{base}/api/me/charts/{id}` | DELETE |
| js/strategyConfig.js | 56-57 | `{base}/api/strategy-note?` | GET |
| js/strategyConfig.js | 78-79 | `{base}/api/strategy-note` | POST |
| js/ui/services/feedback-service.js | 106-109 | `{API_BASE}/api/feedback` 或 `/api/feedback` | POST |
| js/ui/services/feedback-service.js | 187-189 | `{API_BASE}/api/feedback?action=stats` | GET |
| js/identifyBirthTime.js | 134-135 | `{base}/api/me/estimate-hour` | POST |
| js/ui/components/taisui-card.js | 101-102 | `getApiUrl("/api/taisui/status?")` | GET |
| js/ui/components/taisui-card.js | 318-323 | `getApiUrl("/api/taisui/lamp")` | POST |
| js/ui/components/taisui-card.js | 338-341 | `getApiUrl("/api/taisui/lamp")` (retry) | POST |
| js/ui/components/taisui-card.js | 462-465 | `getApiUrl("/api/taisui/lamp")` | POST |

---

## 2. 各 API 實際送出的標準 payload 範例（含 chart_json.strategicLinks 處）

### 有 chart_json 的 API（需含 strategicLinks）

#### POST `/api/life-book/infer`
```json
{
  "chart_json": {
    "birthInfo": { "year": 1990, "month": 5, "day": 15, "hour": 14, "minute": 0, "gender": "M" },
    "ziwei": { ... },
    "bazi": { ... },
    "overlapAnalysis": { ... },
    "fourTransformations": { ... },
    "fiveElements": { ... },
    "strategicLinks": [
      { "type": "overlay", "from": "Wealth", "to": "Parents", "key": "overlay.Wealth_over_Parents" },
      { "type": "ji_clash", "from": "Travel", "to": "Self", "key": "ji_clash.Travel_to_Self" }
    ]
  },
  "weight_analysis": { "importance_map": { ... }, "top_focus_palaces": [...], ... }
}
```

#### POST `/api/life-book/generate-section`
```json
{
  "section_key": "s01",
  "chart_json": {
    "birthInfo": { ... },
    "ziwei": { ... },
    "bazi": { ... },
    "overlapAnalysis": { ... },
    "fourTransformations": { ... },
    "fiveElements": { ... },
    "strategicLinks": [
      { "type": "overlay", "from": "Wealth", "to": "Parents", "key": "overlay.Wealth_over_Parents" }
    ]
  },
  "weight_analysis": { ... },
  "model": "gpt-4o-mini"
}
```

#### POST `/api/life-book/ask`（已修正：chart_json 改為完整物件並含 strategicLinks）
```json
{
  "prompt": "自訂系統提示（可選）",
  "question": "用戶問題",
  "model": "gpt-4o-mini",
  "chart_json": {
    "ziwei": { ... },
    "bazi": { ... },
    "overlapAnalysis": { ... },
    "fourTransformations": { ... },
    "fiveElements": { ... },
    "strategicLinks": [
      { "type": "overlay", "from": "Wealth", "to": "Parents", "key": "overlay.Wealth_over_Parents" }
    ]
  },
  "weight_analysis": { ... }
}
```

#### POST `/api/life-book/narrate`（無 chart_json，僅 insight）
```json
{
  "section_key": "s01",
  "insight": { "core_insight": "...", "evidence": "...", "implications": "...", "suggestions": "..." },
  "model": "gpt-4o-mini"
}
```

### 其他 API 範例（無 chart_json）

- **POST `/api/log-usage`**: `{ "birth_year": 1990, "gender": "male", "language": "zh-TW" }`
- **POST `compute/all`**: `{ "year": 1990, "month": 5, "day": 15, "hour": 14, "minute": 0, "language": "zh-TW", "gender": "M" }`
- **POST `compute/horoscope`**: `{ "year": 1990, "month": 5, "day": 15, "hour": 0, "minute": 0, "gender": "M", "horoscopeYear": 2026 }`
- **POST `/api/consultation`**: `{ "name": "...", "email": "...", "birth_info": "...", "source": "..." }`
- **POST `/api/divination`**: `{ "question": "...", "mood": "...", "primaryIndex": ..., "lines": [...], ... }`
- **POST `/api/admin/calculation-results`**: 後台導出之完整 `results` 物件（無 strategicLinks，為後台存檔用）

---

## 3. 修正：未將 contract.strategicLinks 放進 chart_json 的 API

### 修正項目：`/api/life-book/ask`

**位置**：`expert-admin.html`，命書「自訂問題」送出處。

**問題**：原先只送 `payload.chart_json = window.contract.ziwei`，未含 `strategicLinks`，命書 ask 無法使用戰略聯動。

**修正**：改為組裝完整 `chart_json`，並帶入 `contract.strategicLinks`。

### Diff（expert-admin.html）

```diff
           var payload = { prompt: prompt || undefined, question: question, model: model };
-          if (window.contract && window.contract.ziwei) payload.chart_json = window.contract.ziwei;
+          if (window.contract && window.contract.ziwei) {
+            payload.chart_json = {
+              ziwei: window.contract.ziwei,
+              bazi: window.contract.bazi || null,
+              overlapAnalysis: window.overlapAnalysis || null,
+              fourTransformations: window.fourTransformations || null,
+              fiveElements: window.fiveElements || window.wuxingData || null,
+              strategicLinks: window.contract.strategicLinks ?? []
+            };
+          }
           if (window.ziweiScores && window.ziweiScores.palaceScores) payload.weight_analysis = window.ziweiScores.palaceScores;
+          console.log('📡 API REQUEST', apiBase + '/api/life-book/ask', JSON.stringify(payload, null, 2));
           var res = await fetch(apiBase + '/api/life-book/ask', {
```

### 其他已確認

- **infer / generate-section**：`chartForApi` 已在先前實作中設定 `chartForApi.strategicLinks = window.contract?.strategicLinks ?? []`，無需再改。
- **narrate**：不收 chart_json，只收 infer 產出的 insight，無 strategicLinks 需求。
- **compute/all**：由後端依生辰計算並回傳 contract（含 strategicLinks 由前端 M7 計算），請求 body 僅生辰與語言，無 chart_json。

---

## 4. 已加入的 console.log

所有上列 API 呼叫在送出前皆已加入：

```js
console.log("📡 API REQUEST", url, JSON.stringify(payload, null, 2));
```

其中 `payload` 為該次請求的 body 或 query 參數物件（GET 時為代表參數的物件）。可於瀏覽器開發者工具 Console 篩選 `📡 API REQUEST` 檢視每次請求的 URL 與 payload。
