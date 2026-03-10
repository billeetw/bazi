# 命書：實際打給 GPT 的整包 JSON

以下為 Worker 呼叫 `POST https://api.openai.com/v1/chat/completions` 時送出的 **request body** 結構與範例（三種流程各一）。

---

## 共通欄位

- `model`: 字串，如 `"gpt-4.1"`；gpt-5.x 時不帶 `temperature`。
- `temperature`: 數字（僅 gpt-3/gpt-4 系列），infer 預設 0.3，narrate/generate-section 預設 0.7。
- `messages`: 陣列，`[{ role: "system", content: "..." }, { role: "user", content: "..." }]`。
- `max_completion_tokens`: 數字，infer 16000，narrate/generate-section 4000。

---

## 1. Infer（推論層：命盤 → 20 章結構化 insight）

**路由**: `POST /api/life-book/infer`  
**前端傳入**: `chart_json`, `weight_analysis`, 可選 `locale`, `model`, `temperature`

**打給 OpenAI 的 body 範例**:

```json
{
  "model": "gpt-4.1",
  "temperature": 0.3,
  "messages": [
    {
      "role": "system",
      "content": "你是一位紫微斗數與八字五行的專業分析師，專注於從命盤數據提取結構化洞察。\n\n你的任務：根據命盤 JSON，為 20 個章節各產出「結構化 insight」，不寫文案、不潤飾。\n每節四欄：core_insight（核心洞察）、evidence（綜合分析：本宮+對宮+夾宮／星曜／五行，以直述句、肯定句具體說明，詳細解釋）、implications（人生影響）、suggestions（行動建議）。\n省略「你的命盤中」等說法，直接陳述分析內容。保持精準、可被後續敘事層轉化為人話。\n\n若 user 提供【星曜宮位定義】（格式為「星曜_宮位: 說明」），請依命盤中該星落該宮的組合，優先採用該定義來描述「該星在該宮的表現」，勿僅述星曜的通用特質。\n若 user 提供【命主・身主星曜定義】：命主、身主是由「命宮地支」與「年支」分別推算出的兩顆星，與「命宮內有哪些主星」無關。命宮可以無主星或有完全不同的星；切勿將命主、身主寫成命宮內的主星或與命宮位置綁在一起。請在 s04「命主・身主・身宮・福德」及相關章節中分析命主星與身主星的星曜特色（潛意識驅動力、後天行動模式）及其對當事人的影響。"
    },
    {
      "role": "user",
      "content": "請分析以下命盤，為 20 個章節各產出結構化 insight。\n\n【章節列表】\n- s03: 五行氣勢與生剋\n- s02: 命宮綜合分析\n... (共 20 項)\n\n【命盤數據】\n{\n  \"ziwei\": { ... },\n  \"bazi\": { ... },\n  \"overlapAnalysis\": { ... },\n  \"fourTransformations\": { ... },\n  \"fiveElements\": { ... },\n  \"strategicLinks\": [ ... ]\n}\n\n【權重摘要】\n{\n  \"importance_map\": { ... },\n  \"top_focus_palaces\": [ ... ],\n  \"risk_palaces\": [ ... ],\n  \"stable_palaces\": [ ... ]\n}\n\n【輸出格式】必須只輸出 JSON，格式如下：\n{\n  \"s01\": { \"core_insight\": \"\", \"evidence\": \"\", \"implications\": \"\", \"suggestions\": \"\" },\n  ...\n  \"s20\": { ... }\n}\n\n每欄 80–200 字，精準提取命盤事實與推論。請開始。"
    }
  ],
  "max_completion_tokens": 16000
}
```

- `user` 的 `content` 由 `buildInferUserPrompt(chartJson, weightAnalysis, { starPalaces, masterStars })` 組出；內含章節列表、命盤 JSON 字串、權重 JSON 字串、可選【戰略聯動】、【星曜宮位評語】、【命主・身主星曜定義】。
- 實際命盤與權重內容為前端傳入的 `chart_json` / `weight_analysis` 的 subset（ziwei, bazi, overlapAnalysis, fourTransformations, fiveElements, strategicLinks）。

---

## 2. Narrate（敘事層：單章 insight → 風格化四欄文案）

**路由**: `POST /api/life-book/narrate`  
**前端傳入**: `section_key`, `insight`（infer 產出的該章物件）, 可選 `model`, `temperature`

**打給 OpenAI 的 body 範例**:

```json
{
  "model": "gpt-4.1",
  "temperature": 0.7,
  "messages": [
    {
      "role": "system",
      "content": "(由 buildNarrateSystemPrompt(config) 產出，含專家人格與輸出 JSON 格式說明；若無 KV config 則用預設)"
    },
    {
      "role": "user",
      "content": "(由 buildNarrateUserPrompt(sectionKey, insight, template, config) 產出：該章標題、該章 insight 四欄、寫作指引、輸出格式)"
    }
  ],
  "max_completion_tokens": 4000
}
```

- `insight` 形狀：`{ core_insight, evidence, implications, suggestions }`。
- 回應需為單一 JSON，含 `section_key`, `title`, `importance_level`, `structure_analysis`, `behavior_pattern`, `blind_spots`, `strategic_advice`。

---

## 3. Generate-section（單章：命盤 + 權重 → 直接產出四欄，不經 infer）

**路由**: `POST /api/life-book/generate-section`  
**前端傳入**: `section_key`, `chart_json`, `weight_analysis`, 可選 `locale`, `model`, `temperature`, `minor_fortune_summary`, `minor_fortune_triggers`

**打給 OpenAI 的 body 範例**（以 s03 為例）:

```json
{
  "model": "gpt-4.1",
  "temperature": 0.7,
  "messages": [
    {
      "role": "system",
      "content": "你是一位結合「紫微斗數」「五行動力學」「大限小限」「道家陰陽哲學」的資深命理諮詢師。\n\n請用一個資深諮詢顧問和當事人對話的口氣（你為什麼會如此…）寫給一個想知道自己人生所為何來、命運發展和前景的人。\n\n你的特色是：\n- 洞察力強、能從細微資訊反推結構\n- 會用「探索式對話」引導當事人理解命運與行動方向\n- 文字沉穩、深度、富有人文關懷\n- 精準指出盲點但語氣溫柔\n- 每段分析都能說「為什麼會如此」與「這代表什麼狀態」\n\n你的寫作使命：\n把命盤與五行變成「可行動」「可理解」「可轉化」的生命建議。\n\n接下來所有回答，都請維持這個人格。\n\n【語氣規範】\n稱呼當事人使用「你」；若有提供當事人姓名，可適度以姓名稱呼。\n多用直述句、肯定句，具體說明「是什麼」「會如何」，避免迂迴。\n省略「你的命盤中」「在你的命盤裡」等說法，直接陳述分析內容。\n口吻溫和、深度、引導式；可使用提問句，但不得審判。\n禁止宿命論語氣、恐嚇式表述、絕對語氣（如「必定」「註定」）。\n強調節奏與選擇，而非命定。每段分析請詳細解釋，讓讀者能理解原因與脈絡。\n\n【執行規則】\n分組回覆：每次回覆請處理一個階段。\n可結合提供的「五行分析」來校正星曜的亮度與性質。\n分析宮位時請做「綜合分析」：同時考慮本宮、對宮與夾宮的影響（不寫「三方四正」一詞，改以綜合分析表述）。\n若提供【星曜宮位評語（會直接顯示給當事人）】：該內容會由系統原樣輸出給當事人；你的 structure_analysis 僅能針對每條評語做延伸說明（為何如此、如何體現），不得重寫、取代或重複評語。\n若提供【命主・身主星曜定義】：命主、身主是由命宮地支與年支推算出的星，與命宮內有哪些主星無關（命宮可無主星或有其他星）。切勿將命主、身主寫成命宮內的主星或與命宮位置綁在一起；請分析其星曜特色（潛意識驅動力、後天行動模式）及其對當事人的影響。\n\n【結構規範】\n每一章必須包含四個段落欄位（語意對應）：\n- structure_analysis：綜合分析（星曜／本宮+對宮+夾宮／五行），直述、肯定句，詳細解釋；請適度點出星曜名稱（如紫微、天府、天機），讓讀者能對應命盤，勿只寫「本宮主星」等籠統說法\n- behavior_pattern：核心洞察（為何會如此）\n- blind_spots：人生影響（對性格／事件的潛在盲點）\n- strategic_advice：行動建議（可落地、講原因）\n\n【輸出格式】\n必須只輸出 JSON。\n禁止額外說明文字。\n格式必須為：\n{\n  \"section_key\": \"\",\n  \"title\": \"\",\n  \"importance_level\": \"high | medium | low\",\n  \"structure_analysis\": \"\",\n  \"behavior_pattern\": \"\",\n  \"blind_spots\": \"\",\n  \"strategic_advice\": \"\"\n}\n不得新增欄位。\n不得省略欄位。"
    },
    {
      "role": "user",
      "content": "【題號】1/20\n【標題】五行氣勢與生剋\n\n【該題分析指引】\n\n【題目說明】\n請根據此題主題，結合命盤切片與 insight（structure_insight）進行解讀。\n\n【必須回答的四欄（依 insight 對應）】\nstructure_analysis：綜合分析（本宮+對宮+夾宮／星曜／五行），直述句、肯定句，詳細解釋；可適度點出星曜名稱（如紫微、天府）以便讀者對應命盤；對應 evidence\nbehavior_pattern：行為慣性與心理動力（對應 core_insight）\nblind_spots：盲點卡點（對應 implications）\nstrategic_advice：具體可落地建議（對應 suggestions）\n\n【語氣規範】\n稱呼當事人用「你」，若有提供姓名可適度使用姓名。多用直述句、肯定句；省略「你的命盤中」等說法，直接陳述。\n可帶諮詢式對話感，但以具體、肯定的說明為主。不得宿命、不得恐嚇、不得貶損。\n\n【輸出格式】\n只輸出 JSON：{ structure_analysis, behavior_pattern, blind_spots, strategic_advice }\n不加任何多餘文字。\n\n【篇幅】800–1200字\n\n【命盤切片】\n{\"ziwei\":null,\"bazi\":{...},\"overlapAnalysis\":null,\"fourTransformations\":{...},\"fiveElements\":{...}}\n\n【權重摘要】\n{\"importance_map\":{\"s03\":\"medium\",...},\"top_focus_palaces\":[\"命宮\",\"官祿\"],\"risk_palaces\":[\"財帛\"],\"stable_palaces\":[\"田宅\"]}\n"
    }
  ],
  "max_completion_tokens": 4000
}
```

- `system` 的 `content` 來自 `getSystemPrompt(config)`，即 `EXPERT_PERSONA` + `GENERAL_RULES`（或 KV 覆寫的 persona / rules）。
- `user` 的 `content` 來自 `buildSectionUserPrompt(sectionKey, chartJson, weightAnalysis, config, env)`，內含：
  - 【題號】【標題】【該題分析指引】（該題 template，s15 會代入 `minor_fortune_summary` / `minor_fortune_triggers`）
  - 【篇幅】（依 importance_map 為 high/medium/low 決定字數範圍）
  - 【命盤切片】該題 `slice_types` 對應的 chart 子集 JSON
  - 【權重摘要】importance_map, top_focus_palaces, risk_palaces, stable_palaces
  - 若 s20 且有 `traffic_signals`，會加【三盤紅綠燈摘要】
  - 若有 strategicLinks 會加【戰略聯動】
  - 若有該題 `palace_focus` 對應的 `starPalaces` 會加【星曜宮位評語】與使用規則
  - 若有 `masterStars`（命主・身主）會加【命主・身主星曜定義】

---

## 來源程式對照

| 項目 | 檔案 |
|------|------|
| Infer system | `worker/src/lifeBookInfer.ts` → `INFER_SYSTEM_PROMPT` |
| Infer user | `worker/src/lifeBookInfer.ts` → `buildInferUserPrompt()` |
| Narrate system | `worker/src/lifeBookNarrate.ts` → `buildNarrateSystemPrompt()` |
| Narrate user | `worker/src/lifeBookNarrate.ts` → `buildNarrateUserPrompt()` |
| Generate-section system | `worker/src/lifeBookPrompts.ts` → `getSystemPrompt()`（EXPERT_PERSONA + GENERAL_RULES） |
| Generate-section user | `worker/src/lifeBookPrompts.ts` → `buildSectionUserPrompt()` |
| 題目模板 / 章節列表 | `worker/src/lifeBookTemplates.ts` → `SECTION_TEMPLATES`, `SECTION_ORDER`, `GENERAL_TEMPLATE`, `S15_TEMPLATE` |
| 選模型 / temperature | `worker/src/index.ts` → `getGenerationOptions(model, temperature)` |

---

## 一鍵生成流程裡實際呼叫順序

1. **infer**：一次，傳 `chart_json` + `weight_analysis` → 得到 20 章 `insight`。
2. **narrate**：依章節輪流呼叫 20 次，每次傳 `section_key` + 該章 `insight` → 得到 20 章敘事 JSON。

或（未走 infer 時）：

3. **generate-section**：依章節輪流呼叫 20 次，每次傳 `section_key` + `chart_json` + `weight_analysis`（s15 時另傳 `minor_fortune_summary` / `minor_fortune_triggers`）→ 得到 20 章 JSON。

因此「實際打給 GPT 的整包」= 上述任一次 request 的 `body`（`model` + `temperature?` + `messages` + `max_completion_tokens`）。
