# Worker 語言參數需求（compute/all）

前端已於 2026-02 完成「可回退」語言機制，會將 `language` 傳給 Worker。請外部 Worker（17gonplay-api）配合以下變更。

## 前端傳入參數

`POST /compute/all` 的 body 現已包含：

```json
{
  "year": 1990,
  "month": 8,
  "day": 16,
  "hour": 2,
  "minute": 0,
  "gender": "M",
  "language": "zh-TW"
}
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| language | string | `zh-TW` \| `zh-CN` \| `en-US`，對應 UI 語系 |

- `zh-TW`：繁體中文
- `zh-CN`：簡體中文（預設）
- `en-US`：英文

## Worker 需實作項目

1. **接收 `language`**  
   從 request body 讀取 `language`，若無則預設 `zh-CN`。

2. **透傳給 iztro**  
   呼叫 iztro 時帶入：
   ```js
   astro.astrolabeBySolarDate(dateStr, timeIndex, gender, fixLeap, language)
   // 或
   astro.astrolabeByLunarDate(..., language)
   ```
   其中 `language = req.body.language ?? 'zh-CN'`。

3. **回傳 `language`**（建議）  
   讓前端判斷是否要套用轉繁邏輯：
   ```json
   {
     "ok": true,
     "language": "zh-TW",
     "chartId": "...",
     "features": { ... }
   }
   ```

## 效益

- 當 Worker 回傳 `language: "zh-TW"` 或 `"en-US"` 時，前端會直接使用 iztro 結果，不再套用簡→繁轉換。
- 若 Worker 尚未支援，前端會依預設視為 `zh-CN`，維持現有轉繁行為。

---

## 補充：content/2026 語系支援

前端現已會呼叫 `GET /content/2026?locale=zh-TW|zh-CN|en`。若 Worker 的 content API 尚未支援 `?locale=`，可忽略該參數，不影響現有行為。

完整 content API 與英文內容建立指南見 `docs/en-support-implementation-guide.md`。
