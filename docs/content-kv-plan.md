# content 用 KV（更新更快）

目前 `GET /content/2026` 從 D1 `ui_copy_texts` 讀取。改用 KV 可降低讀取延遲、提升 edge 效能。

**✅ 已實作（2026-02）**：Worker 已加 KV 快取層，Admin copy 更新時自動失效。

## 現況

| 來源 | 延遲 | 說明 |
|------|------|------|
| D1 | ~10–50ms | SQL 查詢，無 edge 快取 |
| 靜態 JSON | 打包在 Worker | fallback 用 |

## 方案：KV 快取層

**讀取流程**：`KV 先讀 → 有則回傳 → 無則查 D1 → 寫入 KV → 回傳`

| 步驟 | 說明 |
|------|------|
| 1 | Worker 綁定 KV（新增 `CONTENT_CACHE` 或沿用 `CACHE`） |
| 2 | `GET /content/2026?locale=zh-TW` 先 `CACHE.get('content:zh-TW')` |
| 3 | 有值 → 直接回傳（低延遲） |
| 4 | 無值 → 查 D1 → `buildContentFromRows` → `CACHE.put('content:zh-TW', JSON, { expirationTtl })` → 回傳 |
| 5 | Admin 更新 copy 時 → 刪除對應 KV key（`CACHE.delete('content:zh-TW')`）使下次請求重新從 D1 載入 |

## 實作要點

### 1. Worker 綁定 KV

`worker/wrangler.toml` 新增（或共用 Pages 的 CACHE，若 Worker 與 Pages 同專案則需確認 binding 傳遞方式）：

```toml
[[kv_namespaces]]
binding = "CONTENT_CACHE"
id = "YOUR_KV_NAMESPACE_ID"
```

> 若 Worker 與 Pages 分開部署，需在 Worker 專案建立專用 KV namespace。

### 2. content/2026 讀取邏輯

```ts
// 偽碼
const cacheKey = `content:${locale}`;
let cached = await env.CONTENT_CACHE?.get(cacheKey);
if (cached) return json(JSON.parse(cached));

const rows = await db.prepare("SELECT ...").bind(locale).all();
const merged = mergeContent(staticContent, buildContentFromRows(rows));
await env.CONTENT_CACHE?.put(cacheKey, JSON.stringify(merged), { expirationTtl: 3600 });
return json(merged);
```

### 3. Admin 更新時失效 KV

在 `PUT /api/admin/copy` 或 `POST` 成功後，呼叫 Worker 的 invalidation 端點，或直接刪除 KV：

```ts
// 若 Admin API 與 Worker 共用 env
await env.CONTENT_CACHE?.delete(`content:${affectedLocale}`);
```

若 Admin 在 Pages Functions、Worker 獨立，可：
- 在 Worker 新增 `POST /content/invalidate?locale=zh-TW`（需認證），Admin 成功寫入後 `fetch` 此端點
- 或設定較短 TTL（如 5 分鐘），接受短暫延遲

## 替代：KV 為唯一來源

若希望「更新即時、讀取極快」，可改為：
- Admin 寫入時同時寫 D1（稽核）與 KV（服務）
- Worker 只讀 KV，不讀 D1

需調整 admin copy API 的寫入邏輯，較大改動。

## 建議

1. **第一階段**：KV 快取層 + TTL 1 小時，Admin 更新後可選呼叫 invalidate 或等 TTL
2. **第二階段**：Admin 寫入時同步更新 KV，並在 copy API 成功後刪除對應 cache key
