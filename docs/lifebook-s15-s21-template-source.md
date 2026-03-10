# s15～s21 實際使用的 template 來源與排查

## 一、Template 來源鏈

1. **靜態 base（bundle 時）**  
   `worker/src/index.ts` 內 `getContentForLocale` 使用的 `staticContent`：
   - `contentZhTw` = `import from "../content/content-zh-TW.json"`（**此檔沒有** `lifebookSection`）
   - `lifebookSectionZhTw` = `import from "../content/lifebookSection-zh-TW.json"`
   - `staticContent.lifebookSection` = `{ ...contentZhTw.lifebookSection, ...lifebookSectionZhTw }`  
   → 實際等於 **worker/content/lifebookSection-zh-TW.json** 的內容（content-zh-TW 沒有 lifebookSection，所以全部來自後者）。

2. **Runtime 合併（D1 overlay）**  
   `worker/src/content-from-d1.ts` 的 `mergeContent(staticContent, buildContentFromRows(rows))`：
   - `lifebookSection: mergeLifebookSections(overlay.lifebookSection, base.lifebookSection)`  
     即 `mergeLifebookSections(D1, static)`。
   - 實作：`merged = { ...(D1 || {}) }`，再對 `static` 的每個 key 做 `merged[key] = { ...merged[key], ...static[key] }`。  
   → **static（lifebookSection-zh-TW.json）會覆寫 D1**：同一 sectionKey 下，最終是 JSON 檔的 template。

3. **結論**  
   - 正常情況下，s15 / s16 / s17 / s18 / s19 / s20 / s21 的 template 都應來自 **worker/content/lifebookSection-zh-TW.json**。  
   - 若看到舊版，優先檢查：**KV 快取**、**未重新 build/deploy**、以及下方「sectionKey / 注入」是否一致。

---

## 二、sectionKey 與 currentDecadalPalace 真值

- **SECTION_ORDER / section_key**：`worker/src/lifeBookTemplates.ts` 與 `lifeBookPrompts.ts` 使用小寫：`s15`, `s15a`, `s16`, `s17`, `s18`, `s19`, `s20`, `s21`。
- **currentDecadalPalace**：在 `getPlaceholderMapFromContext` 裡，僅在 `TIME_MODULE_SECTION_KEYS`（s15～s21）且 `opts?.chartJson` 存在時，由 `getCurrentDecadalLimit(decadalLimits, currentAge)` 算出「當前大限」對應宮位（例如 nominalAge=55 → 僕役宮 54–63）。
- **xiaoXianPalaceName**：來自 `chartJson.yearlyHoroscope.activeLimitPalaceName` 或 `palaceNames[0]`，在 `timeModuleYearKeys`（s15～s21）的區塊裡會從 `yearly` 寫入 `map.xiaoXianPalaceName`。

若 nominalAge=55、currentDecadalPalace=僕役宮、2026、小限夫妻宮，則 s15～s21 都應共用同一套 chartJson/yearly 與同一份 content（同上 JSON），故 **s16～s21 與 s15 應來自同一 content source**（同一 lifebookSection 物件）。

---

## 三、可能出現「仍是舊版」的原因

| 情況 | 說明 | 建議 |
|------|------|------|
| **KV 快取** | `getContentForLocale` 先讀 `env.CACHE.get(cacheKey)`，命中則直接回傳快取的 content，**不會再合併 static**。若快取是改 JSON 前寫入的，會一直是舊 lifebookSection。 | 清空 KV 中 `content:zh-TW`（或對應 locale）的 key，或等 TTL（3600s）過期。 |
| **未重新 build/deploy** | `lifebookSection-zh-TW.json` 在 build 時被 import，改檔後若未重新 build 或 deploy，runtime 仍是舊 bundle。 | 改完 JSON 後執行 build 並重新 deploy worker。 |
| **D1 有舊版** | 若 D1 的 `ui_copy_texts` 裡有 lifebookSection 的 key（例如整份 content 含 s15～s21），merge 時 **per-key** 是 static 覆寫 D1；但若 D1 的 key 寫法或結構不同，可能出現非預期結果。 | 確認 D1 是否存了 lifebookSection；若要以 JSON 為準，可考慮 D1 不存這些 key 或清掉舊 key。 |
| **inject 只做 s15/s16/s17** | 目前 `injectTimeModuleDataIntoSection` 只對 s15/s15a/s16/s17 做「再代入 placeholder」。s18～s21 只在 `getSectionTechnicalBlocks` / `buildNarrateUserPrompt` 時用 `getPlaceholderMapFromContext` 解一次。 | 已改為 s18～s21 也走 `injectTimeModuleDataIntoSection`，與 s15～s17 一致，確保時間模組 placeholders 一定被代入。 |

---

## 四、Render 流程簡要

- **Technical 模式**：`getSectionTechnicalBlocks(sectionKey, ...)` → `content.lifebookSection[sectionKey]` 取 template → `getPlaceholderMapFromContext(..., { sectionKey })` 代入 → 若為 s15/s15a/s16/s17/**s18/s19/s20/s21** 再經 `injectTimeModuleDataIntoSection` 用同一 `sectionKey` 與 chartJson 重代一次。
- **AI 模式**：prompt 由 `buildNarrateUserPrompt` 組，同樣用 `content.lifebookSection[sectionKey]` 與 `getPlaceholderMapFromContext`；AI 回傳的 structure_analysis 若為 s15～s21，同樣會經 `injectTimeModuleDataIntoSection` 注入時間模組資料。

因此，**s15 與 s16～s21 的 template 都來自同一 content 的同一 `lifebookSection`**（即 worker/content/lifebookSection-zh-TW.json，且被 static 覆寫 D1）；若仍見舊版，依上表查 KV、build/deploy、D1 與 inject 範圍即可。

---

## 五、如何確認目前 render 用的是哪份 template

1. **看 structure_analysis 開頭**  
   - 新版 s16：應為「【今年主線與心理濾鏡】」＋「今年心理濾鏡落在{xiaoXianPalaceName}」等三行。  
   - 舊版 s16：會出現「本章內容已整合至「時間主線與功課」（s15）」等字樣。  
   - 新版 s18：應為「【主要盲點】」＋「{blindSpotsDecadalNarrative}」一段。  
   - 舊版 s18：會出現「某些宮位星曜組合特別極端」。

2. **開發時可打 log 確認 content 來源**  
   在 `getContentForLocale` 回傳前或 generate-section 取得 `sectionContent` 後加一行（僅 dev）：  
   `console.log('[lifebook] s16 template prefix', sectionContent?.lifebookSection?.s16?.structure_analysis?.slice(0, 120));`  
   預期新版前約 120 字會含「今年心理濾鏡落在」「yearRoleInDecade」「一句建議」。

3. **檢查 currentDecadalPalace / 小限**  
   - 若 nominalAge=55、當前大限 54–63 為僕役宮，則 `currentDecadalPalace` 應為「僕役宮」；  
   - 若 2026 小限在夫妻宮，則 `xiaoXianPalaceName` 應為「夫妻宮」。  
   若這兩者正確但 s16～s21 仍是舊版文字，問題在 template 來源（KV/D1/build）；若這兩者不對，問題在 chartJson（decadalLimits / yearlyHoroscope）或 getPlaceholderMapFromContext 的 sectionKey/條件。
