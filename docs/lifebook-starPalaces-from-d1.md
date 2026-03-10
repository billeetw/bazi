# 命書從 D1 取得 starPalaces 可行性分析

## 目標

讓命書 API 自己從 D1（與 content/2026 同一來源）取得「星曜在不同宮位表現」文案（`starPalaces`），並塞進 OpenAI 的 prompt，**不**依賴前端傳一大包 content。

---

## 做法概述

1. **Worker 共用 `getContentForLocale(env, locale)`**  
   與現有 **GET /content/2026** 相同邏輯：KV 快取 → D1 `ui_copy_texts` → 靜態 JSON fallback。  
   命書在呼叫 OpenAI 前，多呼叫一次此函式即可。

2. **在 infer / generate-section / generate 的流程裡**  
   - 決定 `locale`（見下）  
   - `const { content } = await getContentForLocale(env, locale)`  
   - 把 `content.starPalaces` 傳入 `buildInferUserPrompt` / `buildSectionUserPrompt`

3. **Prompt 裡如何放 starPalaces**  
   - **System**：可加一句說明，例如「以下【星曜宮位定義】為星曜在該宮位的解釋，撰寫時可參考。」  
   - **User**：在命盤數據之後加一區塊，例如：  
     `【星曜宮位定義】` + JSON 或逐條「key: 文案」文字。  
   建議用 **user message** 附上，方便模型對照命盤與定義撰寫。

---

## 可行性評估

### 1. 單一來源（content/2026 / D1）

- **可行且建議**  
  - `getContentForLocale` 已存在於 `worker/src/index.ts`，且 **GET /content/2026** 已使用。  
  - 命書只要在 **同一個 Worker** 的 route handler 裡 `await getContentForLocale(env, locale)`，拿到的就是與畫面、其他 API 同一套 content（含 D1 覆寫、KV 快取、靜態 fallback）。  
  - 不需新增 D1 表或新 API，只是「多一個消費者」共用既有邏輯。

### 2. 前端不用傳一大包文案

- **可行**  
  - 目前命書 request body 只有 `chart_json`、`weight_analysis`、`section_key` 等，沒有 content。  
  - 改為後端自己取 content 後，前端仍只傳上述欄位，**無需**傳 `starPalaces` 或整包文案。  
  - 可選：若未來要做「命書語系切換」，前端可多傳一個 `locale`（或 `language`），後端用它來選 content；若沒傳則用預設（見下）。

### 3. 命書邏輯與畫面顯示用同一套 content

- **可行**  
  - 畫面顯示的 content 來自 **GET /content/2026**（或前端快取該 API 結果）。  
  - 命書用的是同一個 `getContentForLocale(env, locale)`，因此 **starPalaces 與畫面一致**，無兩套定義。

### 4. 實作面：誰拿 content、誰組 prompt

- **建議：在 index.ts 的 route 裡拿 content，再傳入現有 builder**  
  - `buildInferUserPrompt` / `buildSectionUserPrompt` 目前在 **lifeBookInfer.ts / lifeBookPrompts.ts**，沒有 `env`，也不適合直接打 D1。  
  - 較乾淨的做法：  
    - 在 **index.ts** 的 `POST /api/life-book/infer`、`/generate-section`、`/generate`（以及可選的 `/ask`）裡：  
      - 先決定 `locale`  
      - `const { content } = await getContentForLocale(env, locale)`  
      - 再呼叫 `buildInferUserPrompt(chartJson, weightAnalysis, { starPalaces: content.starPalaces })` 或 `buildSectionUserPrompt(..., { starPalaces: content.starPalaces })`  
    - **lifeBookInfer.ts / lifeBookPrompts.ts** 只多一個可選參數（例如 `options?: { starPalaces?: Record<string, string> }`），在組好的 prompt 字串中追加「【星曜宮位定義】」區塊。  
  - 這樣：  
    - D1/KV 存取只發生在 Worker 的 fetch handler，符合 Cloudflare 環境；  
    - prompt 組裝仍是純函式，易測、不碰 env。

### 5. locale 從哪來

- **選項 A（建議）**  
  - Request body 可選欄位：`locale` 或 `language`（例如 `"zh-TW"` | `"zh-CN"` | `"en"`）。  
  - 若未傳，則用 **chart_json 現有欄位**：`chart_json.language` 或 `chart_json.astrolabeLanguage`（compute/all 已回傳），對應到 `zh-TW` | `zh-CN` | `en`。  
  - 若都沒有，預設 `"zh-TW"`。  
- **選項 B**  
  - 一律用預設 `"zh-TW"`，之後若要多語命書再加 `locale` 參數。  

兩者都可行；A 可讓「算盤語系」與「命書語系」一致，且不強制前端改動（沿用 chart_json 即有）。

### 6. Prompt 大小與 token

- **靜態 content-zh-TW.json** 的 `starPalaces` 約 **400+ 條**（星名_宮名 → 一段文案），每條約 30～80 字，整段約 **2～3 萬字**，約 6k～10k tokens。  
- 目前模型 context 動輒 128k，單章/推論的命盤+權重+戰略聯動+星曜定義仍在安全範圍內。  
- **可選優化**：只傳「本命盤有出現的」星曜×宮位組合（依 `chart_json.ziwei` 解析出星與宮，只取 `starPalaces` 中對應 key），可把 token 再壓到約 1k～3k，實作稍複雜，可第二階段再做。

### 7. 錯誤與 fallback

- **getContentForLocale** 已有：KV 失敗 → D1 → 靜態 JSON；D1 失敗也會 fallback 靜態。  
  - 命書端只要：若 `content.starPalaces` 為空或不存在，就當「沒有星曜宮位定義」、照常送既有 prompt（與現在行為一致），不 500。  
  - 不需額外錯誤處理，僅多一段可選的 prompt 區塊。

---

## 結論與建議

| 項目           | 評估 |
|----------------|------|
| 後端命書自己 D1 拿 starPalaces | ✅ 可行，且與 content/2026 單一來源一致 |
| 前端不傳一大包文案             | ✅ 不需改前端 payload |
| 命書與畫面同一套 content       | ✅ 共用 `getContentForLocale` 即可 |
| 在 buildInfer / buildSection 塞進 prompt | ✅ 建議在 index 取 content，以選參傳入 builder，在 user message 加「【星曜宮位定義】」 |

**建議實作步驟（精簡）**  
1. 在 **index.ts** 的 infer / generate-section / generate（及可選 ask）中：  
   - 決定 `locale`（body.locale ?? chartJson?.language ?? chartJson?.astrolabeLanguage，對應 en/zh-CN/zh-TW，預設 zh-TW）。  
   - `const { content } = await getContentForLocale(env, locale)`。  
   - 將 `content.starPalaces` 傳入下列 builder 的新可選參數。  
2. **lifeBookInfer.ts**：`buildInferUserPrompt(chartJson, weightAnalysis, { starPalaces?: Record<string, string> })`  
   - 若有 `starPalaces`，在【命盤數據】或【權重摘要】之後追加一段：  
     `【星曜宮位定義】` + 格式化（例如 JSON 或「key: 文案」一行一條）。  
3. **lifeBookPrompts.ts**：`buildSectionUserPrompt(..., options?: { starPalaces?: Record<string, string> })`  
   - 同上，在既有區塊後追加 `【星曜宮位定義】` + starPalaces。  
4. **System prompt**（可選）：加一句「撰寫時可參考下列【星曜宮位定義】解釋星曜在該宮位的意涵。」  

這樣命書就會吃到與畫面同一套、來自 D1/content/2026 的 starPalaces，且前端無需傳送文案包。
