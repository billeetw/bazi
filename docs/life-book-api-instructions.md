# 一鍵生成命書：送給 API 的指令總覽

供檢查「一鍵生成命書」時前端送出的請求與 Worker 組給 OpenAI 的 system / user 指令。

---

## 一、前端送出的請求

### API Base

- 取自 `window.Config?.API_BASE`，預設：`https://bazi-api.billeetw.workers.dev`

### 流程選擇

- **使用推論＋敘事流程**（勾選「使用推論＋敘事」）：先呼叫 `/api/life-book/infer`，再對 20 章逐次呼叫 `/api/life-book/narrate`。
- **未勾選**：對 20 章逐次呼叫 `/api/life-book/generate-section`。

### 1. POST `/api/life-book/infer`（僅在「使用推論＋敘事」時呼叫一次）

**Request Body：**

```json
{
  "chart_json": { /* AdminExport.exportCalculationResults() + birthInfo，經 toSerializable */ },
  "weight_analysis": { /* LifeBookEngine.weightAnalysis(chartJson) */ }
}
```

- `chart_json`：命盤完整輸出（含 ziwei、bazi、overlap、fourTransformations、fiveElements 等）。
- `weight_analysis`：權重摘要（例如 `importance_map`、`top_focus_palaces`、`risk_palaces`、`stable_palaces`）。

---

### 2. POST `/api/life-book/narrate`（僅在「使用推論＋敘事」時，每章一次，共 20 次）

**Request Body：**

```json
{
  "section_key": "s03",
  "insight": { "core_insight": "...", "evidence": "...", "implications": "...", "suggestions": "..." },
  "model": "gpt-4o-mini"
}
```

- `section_key`：該章 key（s03, s02, s10, … s20）。
- `insight`：infer 回傳的 `insight[section_key]`（四欄結構）。
- `model`：專家介面選擇的模型。

---

### 3. POST `/api/life-book/generate-section`（未使用推論＋敘事時，每章一次，共 20 次）

**Request Body：**

```json
{
  "section_key": "s03",
  "chart_json": { /* 同上 */ },
  "weight_analysis": { /* 同上 */ },
  "model": "gpt-4o-mini"
}
```

---

## 二、Worker 送給 OpenAI 的指令

### A. 推論層 `/api/life-book/infer`

**送給 OpenAI 的參數：**

- **model**：`INFER_MODEL`（或 fallback），目前為 `gpt-4o-mini`。
- **temperature**：0.3
- **max_completion_tokens**：16000

**System（INFER_SYSTEM_PROMPT）：**

```
你是一位紫微斗數與八字五行的專業分析師，專注於從命盤數據提取結構化洞察。

你的任務：根據命盤 JSON，為 20 個章節各產出「結構化 insight」，不寫文案、不潤飾。
每節四欄：core_insight（核心洞察）、evidence（命盤證據）、implications（人生影響）、suggestions（行動建議）。
保持精準、簡潔、可被後續敘事層轉化為人話。
```

**User（buildInferUserPrompt 產出）：**

- 章節列表（20 個 section_key + title）
- 【命盤數據】整份 JSON（ziwei, bazi, overlapAnalysis, fourTransformations, fiveElements）
- 【權重摘要】整份 weight_analysis JSON
- 【輸出格式】說明：必須只輸出 JSON，格式為 `{ "s01": { "core_insight", "evidence", "implications", "suggestions" }, ... "s20": { ... } }`，每欄 80–200 字。

---

### B. 敘事層 `/api/life-book/narrate`

**送給 OpenAI 的參數：**

- **model**：request body 的 `model`（須在 MODEL_CONFIG.options 內），否則預設。
- **temperature**：0.7
- **max_completion_tokens**：4000

**System（buildNarrateSystemPrompt = persona + rules）：**

- **Persona（EXPERT_PERSONA）：**  
  資深命理諮詢師；用資深諮詢顧問和當事人對話的口氣（你為什麼會如此…）寫給想知道人生所為何來、命運發展和前景的人；特色與寫作使命（可行動、可理解、可轉化）。

- **Rules（GENERAL_RULES）：**  
  語氣規範（第二人稱、溫和、禁止宿命/恐嚇）、執行規則（分組回覆、五行校正星曜、三方四正含對宮與夾宮）、結構規範（四段欄位）、輸出格式（只輸出 JSON，四欄：structure_analysis, behavior_pattern, blind_spots, strategic_advice）。

**User（buildNarrateUserPrompt 產出）：**

- 【題號】index/20、【標題】該章 title
- 【結構化 insight】說明：core_insight→behavior_pattern、evidence→structure_analysis、implications→blind_spots、suggestions→strategic_advice
- 該章的 `insight` JSON
- 【該題分析指引】該章 template 文字
- 【十神參考句庫】可適度融入
- 結尾：請將 insight 轉化為帶溫度、探索感、第二人稱的敘事，只輸出 JSON。

---

### C. 單章生成 `/api/life-book/generate-section`

**送給 OpenAI 的參數：**

- **model**：request body 的 `model` 或 KV config 或 `MODEL_CONFIG.default`（如 gpt-4o-mini）。
- **temperature**：0.7
- **max_completion_tokens**：4000

**System（getSystemPrompt）：**

- 與 B 相同：EXPERT_PERSONA + GENERAL_RULES。

**User（buildSectionUserPrompt 產出）：**

- 【題號】index/20、【標題】該章 title
- 【該題分析指引】該章 template
- 【篇幅】依 importance 為 high/medium/low 給 1200–1600 / 800–1200 / 500–800 字
- 【命盤切片】該章 slice_types 對應的 chart 子集 JSON（ziwei / bazi / overlap / sihua / wuxing）
- 【權重摘要】importance_map、top_focus_palaces、risk_palaces、stable_palaces
- 若該題 needs_wuxing_weak：【五行句庫】動態注入
- 【十神參考句庫】
- 結尾：請開始生成。只輸出 JSON。

---

## 三、章節順序與權重摘要格式

**SECTION_ORDER（20 章）：**

```
s03, s02, s10, s01, s05, s06, s07, s08, s04, s09, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20
```

**權重摘要（weight_analysis）預期結構（由 LifeBookEngine.weightAnalysis 產出）：**

- `importance_map`：可選，章節對應 "high" | "medium" | "low"
- `top_focus_palaces`：優先關注宮位，例如 `["命宮", "財帛", "官祿"]`
- `risk_palaces`：風險宮位，例如 `["命宮"]`
- `stable_palaces`：相對穩定宮位，例如 `["夫妻", "疾厄", "田宅"]`

第一章（s03）為「五行氣勢與生剋」；若生成失敗，錯誤訊息中的「權重摘要」即上述結構，API 會把整份 `weight_analysis` 放進 user prompt 的【權重摘要】區塊供模型參考。

---

## 四、相關檔案

| 用途 | 檔案 |
|------|------|
| 前端一鍵流程、請求 body | `expert-admin.html`（generateLifeBook） |
| 推論層 system/user | `worker/src/lifeBookInfer.ts` |
| 敘事層 system/user | `worker/src/lifeBookNarrate.ts` |
| 單章 system/user、章節模板 | `worker/src/lifeBookPrompts.ts`、`worker/src/lifeBookTemplates.ts` |
| API 路由與呼叫 OpenAI | `worker/src/index.ts` |

若你要改「給 API 的指令」，可調整：  
- 推論口吻與輸出格式 → `lifeBookInfer.ts`（INFER_SYSTEM_PROMPT、buildInferUserPrompt）  
- 敘事口吻與執行規則 → `lifeBookPrompts.ts`（EXPERT_PERSONA、GENERAL_RULES）  
- 各章分析指引與篇幅 → `lifeBookTemplates.ts`（SECTION_TEMPLATES）。

---

## 五、執行評估（可否正常執行）

**結論：可以正常執行。** 以下為檢查結果。

### 已對齊項目

| 項目 | 狀態 |
|------|------|
| SECTION_ORDER | 前端 `expert-admin`、Worker `lifeBookTemplates`、前端 `lifeBookEngine.js` 三者一致（s03…s20）。 |
| 章節 key | 20 個 section_key 在 SECTION_TEMPLATES 皆有對應，含 index、title、template、slice_types、needs_wuxing_weak。 |
| 輸出格式 | 模型只需回傳四欄（structure_analysis, behavior_pattern, blind_spots, strategic_advice）；Worker 會自動補上 section_key、title、importance_level。 |
| API 驗證 | narrate / generate-section / generate 皆改為「有四欄即通過」，不再要求模型回傳 section_key / title。 |
| 前端消費 | generateLifeBook() 依 SECTION_ORDER 呼叫 infer→narrate 或 generate-section，並用 LifeBookEngine.renderHTML(weight, sections, chartForApi) 組 HTML；renderHTML 使用 sec.title 與四欄，與 API 回傳結構一致。 |
| Worker 建置 | `worker` 目錄下 `npm run build`（wrangler deploy --dry-run）可完成，TypeScript 編譯無誤。 |

### 仍需確認（環境／營運）

- **OPENAI_API_KEY**：Worker 環境需設定，否則會回 500。
- **模型參數**：已使用 `max_completion_tokens`（不再用 `max_tokens`），與目前支援的模型相容。
- **CORS / apiBase**：前端需能連到正確 `Config.API_BASE`，且 Worker 已回傳 CORS 頭。

### 建議自測步驟

1. 專家後台登入 → 輸入出生資料 → 計算。
2. 不勾選「使用推論＋敘事」→ 點「一鍵生成命書」→ 應依序出現「生成 1/20…」並最終開新視窗顯示命書 HTML。
3. 若勾選「使用推論＋敘事」→ 先呼叫 infer，再 20 次 narrate；任一階段失敗可從進度與錯誤訊息判斷是 infer 或某章 narrate 問題。
