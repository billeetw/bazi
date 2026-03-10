# 命書統一 LifeBookDocument：分析與建議

## 1. 目前「線上命書 Viewer」實作

### 相關檔案與元件

| 項目 | 路徑 / 說明 |
|------|----------------|
| 主版面 | `src/lifebook-viewer/components/LifeBookViewer.tsx` |
| 根狀態 | `src/lifebook-viewer/App.tsx` → `useLifeBookData(initial)` |
| 型別 | `src/lifebook-viewer/types.ts` |
| 單章卡片 | `SectionCard.tsx`（四欄 + star_palace_quotes） |
| 模組分組 | `ModuleGroup.tsx` + `constants.ts` 的 `MODULE_MAP` |
| 匯入／匯出 | `utils/normalizeApiResponse.ts`、`utils/importExport.ts`、`exportHtml()` |

### Viewer 吃的資料結構

- **Props / 狀態**：`LifeBookViewerState`，內含：
  - `sections: Record<string, SectionPayload>`（20 章，key 為 s01～s20）
  - `weight_analysis?: WeightAnalysis | null`（top_focus_palaces, risk_palaces, stable_palaces, importance_map）
  - `chart_json?: Record<string, unknown> | null`（命盤快照，供 ChartEmbed 與匯出）
  - `meta?: { client_name?, birth_info? } | null`
- **SectionPayload**：`section_key`, `title`, `importance_level`, `structure_analysis`, `behavior_pattern`, `blind_spots`, `strategic_advice`, `star_palace_quotes?`（星曜_宮位 → 評語）
- **已有型別**：`LifeBookDocument` 目前為 `LifeBookViewerState` 的 type alias，未獨立成介面。

---

## 2. 後台「一鍵輸出命書（HTML）」實作

### 呼叫鏈與資料流

- **入口**：`expert-admin.html` 內 `generateLifeBook()`，按鈕 `#generateLifeBookBtn` / `#generateLifeBookBtnSection`。
- **取得章節**：
  - **Pipeline 關閉**：依序 `POST /api/life-book/generate-section` × 20，每次帶 `section_key`, `chart_json`, `weight_analysis`, `model`；回傳 `{ ok, section }`，section 已含四欄 + Worker 注入的 `star_palace_quotes`。
  - **Pipeline 開啟**：先 `POST /api/life-book/infer` 拿整份 `insight`，再對每章 `POST /api/life-book/narrate` 拿 `section`，同樣得到 20 章。
- **組 HTML**：**先拿 JSON（sections），再在前端轉成 HTML**。  
  `window.LifeBookEngine.renderHTML(weight, sections, chartForApi)`（`js/calc/lifeBookEngine.js`）  
  輸入：`weightAnalysisData`、`sections`、`chartJson`（用於 birthInfo 年月日）；產出單一 HTML 字串（權重摘要 + 模組分組 + 每章星曜評語 + 四欄）。
- **儲存**：`POST /api/admin/life-books` body：`client_name`, `birth_info`, `sections_json: JSON.stringify(sections)`, `html_content: html`。  
  資料庫僅存 `sections_json` 與 `html_content`，**未存** `chart_json`、`weight_analysis`。

### 後台命書詳情頁

- **列表**：`GET /api/admin/life-books`，表格顯示 client_name、email、birth_info、created_at，操作為「預覽」「下載」。
- **單筆**：`GET /api/admin/life-books/:id` 回傳一筆 row（id, created_at, consultation_id, user_id, email, client_name, birth_info, sections_json, html_content）。
- **預覽／下載**：目前僅使用 `html_content`（`document.write(d.html_content)` 或 Blob 下載），**沒有**「左邊使用者 viewer、右邊專家 debug」的詳情頁；也沒有用 `sections_json` 還原成 viewer 可吃的 state。

---

## 3. 命書 pipeline 的資料來源

### Worker / GPT 回傳的命書 JSON

- **generate-section**：`{ ok: true, section }`，`section` = `section_key`, `title`, `importance_level`, `structure_analysis`, `behavior_pattern`, `blind_spots`, `strategic_advice`，以及 Worker 依命盤 + content 注入的 `star_palace_quotes`（Record<"星曜_宮位", string>）。
- **generate**（一次 20 章）：`{ ok, sections }`，`sections` = `Record<section_key, SectionPayload>`，結構同上。
- **infer**：`{ ok, insight }`，`insight` = 每章 `section_key` → `{ core_insight, evidence, implications, suggestions }`（結構化，未敘事）。
- **narrate**：`{ ok, section }`，單章從 insight 轉成四欄文案；**未**回傳 raw insight 或 token 用量。

### /compute/all 的 chartJson

- 來自 `payload.features`（bazi, ziwei, …）。  
- **ziwei**：`core`, `basic`, `mainStars`（`Record<宮位名, string[]>`，如 `"命宮": ["紫微","天府"]`），`horoscope` 等。  
- 組裝器與 Worker 都用 `mainStars` 建「星曜_宮位」key，再對應 content 的 starPalaces。

### /content/2026 的 contentDb

- 回傳含 `starPalaces: Record<string, string>`，key 為「星曜_宮位」（如 `紫微_命宮`），value 為評語文案。  
- 前端組裝器 `buildLifeBookDocument` 已用 `chartJson.ziwei.mainStars` + `contentDb.starPalaces` 在本地組每章 `star_palace_quotes`，與 Worker 邏輯一致。

---

## 4. 統一 LifeBookDocument 的可行性與風險

### 可行性

- **結構已對齊**：Viewer 的 `LifeBookViewerState` 與 Worker 的 sections 四欄 + star_palace_quotes 一致；後台一鍵輸出也是「同份 sections + weight + chart」經 `renderHTML` 產 HTML。  
  定義一份正式的 **LifeBookDocument**（含 meta、chart_json、weight_analysis、sections），兩邊都改吃這份 document，技術上可行。
- **組裝單一化**：已有 `buildLifeBookDocument(chartJson, contentDb, lifeBookJson)`，可擴充為「唯一產出 LifeBookDocument 的來源」；Worker 只產四欄 JSON，星曜評語與命盤細節由 content DB + chartJson 在組裝器補齊。
- **HTML 單一產出**：可抽成「從 LifeBookDocument 產 HTML」的函式（與現有 `LifeBookEngine.renderHTML` 同邏輯），前台匯出與後台一鍵下載／預覽都走同一條，避免兩套模板。

### 會影響的現有功能

| 功能 | 影響 |
|------|------|
| 線上 Viewer | 改為只接受 `LifeBookDocument`（或相容的 state）；可保留 `normalizeApiResponse` 將舊格式／API 回傳轉成 document。 |
| 後台一鍵生成 | 生成後先組裝成 `LifeBookDocument`，再呼叫「document → HTML」產出；儲存時可改為存 `document_json`（或同時保留 sections_json 向下相容）。 |
| 後台命書列表／預覽／下載 | 若改存 document：預覽／下載可改為「由 document 即時 render HTML」；若仍只存 sections_json + html_content，則預覽／下載維持現狀，新流程可選「多存一份 document_json」。 |

### 潛在風險與注意點

1. **Schema 版本**：在 meta 加 `schema_version`（與未來 `generator_version`），舊資料讀入時可依版本做轉換或相容。
2. **向下相容**：既存 DB 只有 `sections_json` + `html_content`，沒有 chart_json / weight_analysis。要還原「完整 document」必須有遷移策略：例如新欄位存 `document_json`，舊列仍用 sections_json 還原 sections + 僅能預覽 HTML，或標記「僅有 HTML」。
3. **專家 debug 資料**：infer/narrate 的 raw insight、token 用量等目前 Worker 未回傳給前端。若要「右邊專家視角」，需在 Worker 回傳時加欄位（或另存），並在 document 的 `expert` 區塊承載，不影響使用者看到的內容。
4. **後台 UI 改動**：要達到「左 viewer、右專家」需新增詳情頁或彈窗：左側嵌入 viewer（傳入 document），右側顯示 expert 區塊；可列為第二階段。

---

## 5. 建議的 LifeBookDocument schema（概念級）

以下為「中介格式」建議，不要求一次實作到完美，但先劃清「使用者 vs 專家」邊界。

```ts
// === 使用者與專家共用的核心 ===
interface LifeBookDocument {
  meta: LifeBookMeta;
  chart_json: Record<string, unknown> | null;  // 命盤快照（/compute/all 精簡版）
  weight_analysis: WeightAnalysis | null;
  sections: Record<string, LifeBookUserSection>;  // 20 章，使用者看到的
  expert?: LifeBookExpertBlock;                   // 選填，僅後台／debug 用
}

interface LifeBookMeta {
  schema_version: string;        // 例 "1.0"
  generator_version?: string;    // 組裝器／Worker 版本標識
  id?: string;                   // 命書 id（若已存庫）
  chart_id?: string;              // 關聯命盤 id（若有）
  locale?: string;                // zh-TW | zh-CN | en
  client_name?: string;
  birth_info?: string;
  created_at?: string;            // ISO 8601
}

// 每章：使用者看到的
interface LifeBookUserSection {
  section_key: string;
  title: string;
  importance_level: "high" | "medium" | "low";
  structure_analysis: string;
  behavior_pattern: string;
  blind_spots: string;
  strategic_advice: string;
  star_palace_quotes?: Record<string, string>;
}

// 專家／debug 區塊（選填）
interface LifeBookExpertBlock {
  infer_insight?: Record<string, SectionInsight>;  // infer API 回傳的原始 insight
  per_section?: Record<string, {
    raw_insight?: SectionInsight;
    token_usage?: { prompt: number; completion: number };
    model?: string;
  }>;
}
```

- **使用者視角**：只看 `meta`、`chart_json`、`weight_analysis`、`sections`；viewer 與「由 document 產 HTML」都只用這塊。
- **專家視角**：在後台詳情頁或側欄多顯示 `expert`（若存在）；不寫入對外命書或下載 HTML。

---

## 6. 實作階段建議

### 第一階段（本輪）

1. **型別**：正式定義 `LifeBookDocument` 介面（含 `meta` 的 schema_version、generator_version、id、chart_id、locale、client_name、birth_info、created_at），`LifeBookUserSection`（= 現有 SectionPayload），`LifeBookExpertBlock`（選填）。  
   `LifeBookViewerState` 改為「可從 LifeBookDocument 取出」或與 document 同構（viewer 只渲染 user 部分）。
2. **組裝器**：擴充 `buildLifeBookDocument`，產出帶完整 `meta` 的 document，並可接受 `expert` 參數（若未來 API 有回傳則填入）。
3. **HTML 產出**：新增 `renderLifeBookDocumentToHtml(doc: LifeBookDocument): string`（邏輯與現有 `LifeBookEngine.renderHTML` 一致），供 viewer 匯出與後台一鍵下載共用。
4. **後台**：一鍵生成完成後，先 `buildLifeBookDocument` 得到 doc，再用 `renderLifeBookDocumentToHtml(doc)` 產 HTML；儲存時可寫入 `document_json: JSON.stringify(doc)`（需 migration 新欄位，或先用 query 參數／新 API 試行）。

### 第二階段（後續）

- 後台命書詳情頁：左側 iframe/embed 線上 viewer（傳入 document），右側「專家視角」顯示 `expert`（及 chart_json 精簡樹狀）。
- Worker 回傳 infer/narrate 的 raw insight 或 token 用量，寫入 document.expert。
- 遷移舊資料：若有 `document_json` 欄位，舊列可漸進回填或標記「僅 HTML」。

---

*本文件為統一命書格式的分析與建議，實作細節以程式碼與後續 PR 為準。*
