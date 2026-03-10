# 命書 Prompt 驗證說明

## 一、s18 完整 prompt 印出（僅 dev）

- **作法**：當環境變數 `LIFEBOOK_DEBUG` 為 `"1"` 或 `"true"` 時，若請求的章節為 **s18**，會在 log 印出該次呼叫的 **完整 system + user prompt**（含長度）。
- **啟用方式（dev）**：
  - **本地**：在 `worker/` 下新增 `.dev.vars`（不提交），內容：
    ```
    LIFEBOOK_DEBUG=1
    ```
    然後 `cd worker && npx wrangler dev`，對 s18 打一次 generate-section 或 generate，在終端看 log。
  - **Cloudflare 儀表板**：在 Workers 的 Settings → Variables 新增 `LIFEBOOK_DEBUG` = `1`（僅在 dev / preview 環境使用，勿在 production 設）。
- **log 標記**：`[life-book/generate-section] [LIFEBOOK_DEBUG]` 或 `[life-book/generate] [LIFEBOOK_DEBUG]`，後面會接 s18 的 SYSTEM / USER PROMPT 全文。

---

## 二、是否把前面章節的歷史帶進來？

**不會。每一章都是「全新 messages」：**

- **generate-section**：每次請求只處理一個 `section_key`。組裝為：
  - `sectionMessages = [ { role: "system", content: systemPrompt }, { role: "user", content: userPrompt } ]`
  - 其中 `userPrompt = buildSectionUserPrompt(sectionKey, chartJson, weightAnalysis, config)`，只含該章需要的內容（題號、標題、該題分析指引、命盤切片、權重、戰略、星曜宮位、命主身主、十神等）。
- **generate（一次 20 章）**：迴圈內每次 `sectionKey` 都重新呼叫 `buildSectionUserPrompt(sectionKey, ...)`，組出新的 `userPrompt`，再組 `messages = [ system, user ]`，**沒有**把上一章的 assistant 或歷史訊息塞進下一章。

所以不是「帶前面章節歷史」，而是「單章就包含不少內容」：命盤切片、權重、戰略聯動、星曜宮位定義、命主身主、十神句庫等，所以單章 prompt 本身就會很長。

---

## 三、generate-section / generate 的 messages 組裝

- **generate-section**：每次 API 呼叫 = 一個 section_key。組裝一次 `[ system, user ]`，送給 OpenAI，**沒有**共享的 conversation 狀態，也沒有累積歷史。
- **generate**：for 迴圈依 SECTION_ORDER 跑 20 次，每次：
  - 該 `sectionKey` 的 `userPrompt = buildSectionUserPrompt(sectionKey, chartJson, weightAnalysis, generateConfig)`
  - `messages = [ getSystemPrompt(generateConfig), userPrompt ]`
  - 立刻 `fetch` OpenAI，等回傳，寫入 `sections[sectionKey]`，然後下一輪用**新的** `sectionKey` 再組**新的** `messages`。

結論：**每一個 section 的 API 呼叫都是全新的 messages 陣列，沒有共享 conversation 狀態。**

---

## 四、infer 的 insight 是否有 slice 對應？

- **generate-section / generate 流程**：**沒有使用 infer 的 insight**。這兩條路徑只傳入 `chart_json`、`weight_analysis`、config（含 starPalaces、masterStars 等），由 `buildSectionUserPrompt` 依該章的 `template.slice_types` 從 `chartJson` 切出 **命盤切片**（ziwei / bazi / overlap / sihua / wuxing），放進 user prompt。所以「每章只吃自己的 slice」指的是**命盤切片**（getChartSlice），不是 insight。
- **narrate 流程**：會用 infer 產出的 insight。前端每次呼叫 narrate 時傳入 **單一** `section_key` 與 **該章** 的 `insight`（例如 `insight[sk]`），所以 narrate 是「每章只吃自己的 insight」，不會把整本 insight 送進去。

結論：  
- generate-section / generate：每章只吃**該章命盤切片** + 權重 + 共用 config，**沒有**整本 insight。  
- narrate：每章只吃**該章 insight**，沒有整本。

---

## 五、星曜宮位 DB 文案是否出現在 prompt？前端是否要自己補？

- **有出現在 prompt**：`buildSectionUserPrompt` 在 config 有 `starPalaces`（usedStarPalaces）時，會把「【星曜宮位定義】… 以下評語將由系統強制原樣輸出…」以及逐條 `星曜_宮位: 評語` 塞進 user prompt。所以星曜宮位 DB 文案**確實**在 prompt 裡。
- **模型被要求不要重複**：同一段裡已註明「你不需要在 JSON 中重複寫出」「評語本身由系統輸出，你只負責後續解釋」。
- **前端／渲染層**：後端在章節回傳裡已帶 `star_palace_quotes`（同組評語），`lifeBookEngine.js` 的 `renderHTML` 會先渲染「【星曜在宮位評語】」+ `star_palace_quotes`，再渲染「【綜合分析】」+ `structure_analysis`。所以**前端有把 DB 文案補進輸出**，不是只靠模型重複。

結論：星曜宮位 DB 文案有進 prompt、模型被要求不重複、前端會用 `star_palace_quotes` 自己補進最終顯示。
