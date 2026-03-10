# 命書三盤疊加 / 紅綠燈演算法 / 權重系統 — 架構與現況分析

本文件為**現況盤點**，不涉及程式改動建議的實作，僅整理目前程式狀態與資料流。

---

## 1. 全局搜尋與檔案鎖定

### 關鍵字搜尋結果摘要

| 關鍵字 | 相關檔案與位置（摘要） |
|--------|------------------------|
| **lifeBook / LifeBook** | `worker/src/lifeBookInfer.ts`, `lifeBookPrompts.ts`, `lifeBookTemplates.ts`, `lifeBookNarrate.ts`；`worker/src/index.ts`（infer/narrate/generate 路由）；`js/calc/lifeBookEngine.js`（weightAnalysis、renderHTML、SECTION_CONFIG）；`src/lifebook-viewer/*`（types, constants, LifeBookViewer, loadDemoLifeBook, normalizeApiResponse, importExport, useLifeBookData）；`docs/lifebook-*.md`, `life-book-*.md`；`expert-admin.html`（generateLifeBook）、`entry-expert-admin.js`（載入 lifeBookEngine） |
| **三盤疊加 / 紅綠燈 / traffic_light** | `worker/src/lifeBookTemplates.ts`：s20 標題「三盤疊加：紅綠燈演算法」、description「分析原命＋大運＋流年＋小限…」；`public/demo-lifebook.json`：s20 章節；`docs/lifebook-api-instructions.md`：s20 表列；`index.html` / `docs/全網站SEO規劃.md` 等：僅「流年紅綠燈」文案，無演算法 |
| **weight_analysis / importance_map / top_focus_palaces / risk_palaces / stable_palaces** | **產出**：`js/calc/lifeBookEngine.js`（`weightAnalysis(chartJson)` 回傳上述欄位 + `palace_scores`, `sorted_palaces`）；**消費**：`worker/src/lifeBookPrompts.ts`（buildSectionUserPrompt 讀取 importance_map、top_focus_palaces、risk_palaces、stable_palaces）；`worker/src/lifeBookInfer.ts`（buildInferUserPrompt 將 weightAnalysis 整包傳給 AI）；`worker/src/index.ts`（infer / generate-section / generate 皆要求 body.weight_analysis）；**前端**：`src/lifebook-viewer/types.ts`（WeightAnalysis 型別）、`normalizeApiResponse.ts`、`WeightSummary.tsx`（只顯示三列表）、`importExport.ts`（HTML/JSON 匯出）、`useLifeBookData.ts` |
| **SECTION_TEMPLATES / s20 / 三盤疊加：紅綠燈演算法** | `worker/src/lifeBookTemplates.ts`：SECTION_TEMPLATES 含 s20，title「三盤疊加：紅綠燈演算法」，slice_types：`["ziwei", "overlap", "wuxing", "sihua"]`，無 palace_focus；`worker/src/lifeBookInfer.ts`：章節列表含 s20；`js/calc/lifeBookEngine.js`：SECTION_CONFIG.s20 為「總結」、palace: null；`src/lifebook-viewer/constants.ts`：SECTION_ORDER、MODULE_MAP 含 s20 |

### 命書推論 / 生成 / 敘事 — 核心檔案（worker/）

- **worker/src/lifeBookInfer.ts**：推論層；buildInferUserPrompt(chartJson, weightAnalysis, options)；產出 20 章結構化 insight（core_insight, evidence, implications, suggestions）。
- **worker/src/lifeBookPrompts.ts**：生成層 system + 單章 user；getSystemPrompt、buildSectionUserPrompt(sectionKey, chartJson, weightAnalysis, config)；GENERAL_RULES、結構規範、星曜評語規則。
- **worker/src/lifeBookTemplates.ts**：SECTION_ORDER、SECTION_TEMPLATES（含 s20）、GENERAL_TEMPLATE、S15_TEMPLATE、十神/五行句庫。
- **worker/src/lifeBookNarrate.ts**：敘事層；buildNarrateSystemPrompt、buildNarrateUserPrompt(sectionKey, insight, template, config)；將 infer 的 insight 轉成敘事四欄。
- **worker/src/index.ts**：POST /api/life-book/infer、/narrate、/generate-section、/generate；皆接收 body.chart_json、body.weight_analysis；**不計算** weight_analysis，僅轉傳給 prompt。

### 命書 Viewer / 前端呈現

- **src/lifebook-viewer/types.ts**：SectionPayload、WeightAnalysis（top_focus_palaces, risk_palaces, stable_palaces, importance_map）、LifeBookViewerState。
- **src/lifebook-viewer/constants.ts**：SECTION_ORDER、MODULE_MAP。
- **src/lifebook-viewer/utils/normalizeApiResponse.ts**：API/上傳 JSON → LifeBookViewerState；正規化 weight_analysis 四欄。
- **src/lifebook-viewer/utils/loadDemoLifeBook.ts**：fetch demo-lifebook.json → normalizeApiResponse。
- **src/lifebook-viewer/utils/importExport.ts**：exportHtml、downloadJson、downloadHtml、readFileAsState；權重摘要只輸出三列表（優先/風險/穩定）。
- **src/lifebook-viewer/components/WeightSummary.tsx**：僅顯示 top_focus_palaces、risk_palaces、stable_palaces 三列。
- **src/lifebook-viewer/components/SectionCard.tsx**：單章四欄 + 星曜宮位評語；**無**紅綠燈或權重視覺。
- **src/lifebook-viewer/components/LifeBookViewer.tsx**：主版面、TOC、WeightSummary、章節列表、匯入/匯出。
- **src/lifebook-viewer/hooks/useLifeBookData.ts**、**useImportExport.ts**：狀態與匯入/匯出。
- **js/calc/lifeBookEngine.js**：**weight_analysis 的產出端**（見下）；renderHTML(weightAnalysisData, sections, chartJson)；SECTION_CONFIG、buildSectionUserPrompt（供專家後台等呼叫）。

---

## 2. 後端推論層現況（infer / weight）

### 2.1 weight_analysis 現在是怎麼算出來的？

- **計算位置**：**僅在前端** `js/calc/lifeBookEngine.js` 的 `weightAnalysis(chartJson)`。Worker **不計算** weight_analysis，API 要求呼叫端在 body 傳入 `weight_analysis`。
- **演算法**：有明確公式（非單純 placeholder）：
  - 依賴 `chartJson.overlapAnalysis`（或 `chartJson.overlap`）：`palaceMap`、`criticalRisks`、`maxOpportunities`、`volatileAmbivalences`。
  - 每宮分數 = `(化忌×3) + (化祿×2) + (化權×1.5) + (化科×1) + (疊宮係數×2) + (五行失衡×2)`，其中疊宮係數：該宮若在 criticalRisks / maxOpportunities / volatileAmbivalences 任一則 +2。
  - `palaceMap` 來自 `overlapAnalysis`，其內每宮有 `jiCount, luCount, quanCount, keCount` 等（見 fourTransformations.js 的 calculateOverlapTransformations）。
- **分級**：
  - 依分數排序後：**top_focus_palaces** = 前 3 宮，**stable_palaces** = 後 3 宮；**risk_palaces** = `criticalRisks.map(r => r.palace)`（與分數無關，直接來自疊宮「化忌疊加」標記）。
  - **importance_map**：章節對應宮位者用該宮的 high/medium/low（top3=high, bottom3=low）；s15/s16/s17/s19/s20 固定 high；其餘多為 medium。
- **額外產出**：`weightAnalysis()` 還回傳 `palace_scores`（每宮分數）、`sorted_palaces`（排序後陣列），但 **API 與 Viewer 型別未使用**；命書 API 只傳遞/儲存 top_focus、risk、stable、importance_map。

### 2.2 有沒有「本命 + 大限 + 流年/小限」三盤疊加計算？

- **有，且是四層**：在 **前端** `js/calc/fourTransformations.js` 的 `calculateOverlapTransformations(fourTransformations, ziwei)`：
  - 每宮結構：`transformations: { benming, dalimit, liunian, xiaoxian }`（本命、大限、流年、小限），各有 type/star/weight（權重 1.0 / 1.5 / 2.0 / 1.0）。
  - 依四化星落宮注入各層，再累計每宮的 luCount、jiCount 等，據此產出 `criticalRisks`（化忌≥2）、`maxOpportunities`（化祿≥2）、`volatileAmbivalences`（忌≥2 且祿≥2）。
- **三層分開存的資料結構**：有。`palaceMap` 每宮的 `transformations` 即為本命/大限/流年/小限四層；`fourTransformations` 本身有 `benming`、`dalimit`、`liunian`、`xiaoxian`。
- **四化是否當權重因子**：是。lifeBookEngine 的宮位分數用 ji/lu/quan/ke 的加權和；fourTransformations 疊宮時也使用權重（1.0/1.5/2.0/1.0）。**沒有**「共振 multiplier」或「double 忌放大」等進階係數，僅線性加權與閾值（≥2 忌 → criticalRisk）。

### 2.3 有沒有明確產生「紅燈 / 黃燈 / 綠燈」或類似標記？

- **沒有**名為 `traffic_light`、`risk_level`、`score` 的**命書專用**欄位。
- **有**的僅是：
  - **fourTransformations.js** 每宮：`riskLevel`（'normal' | 'warning' | 'critical'）、`opportunityLevel`（'normal' | 'good' | 'max'）；以及三個陣列：criticalRisks、maxOpportunities、volatileAmbivalences。
  - 這些用於疊宮分析與 lifeBookEngine 的 risk_palaces / 分數，**沒有**被轉成「紅/黃/綠」字樣或 enum 寫入命書 sections / weight_analysis。
- **s20** 在 SECTION_TEMPLATES 只有標題「三盤疊加：紅綠燈演算法」與 GENERAL_TEMPLATE，**沒有**專用計算或專用 prompt 區塊產出 traffic_light。
- **結論**：目前沒有「真正的紅綠燈演算法」產出欄位，只有疊宮的風險/機會分類與權重摘要的「優先/風險/穩定」三列表，以及 s20 的**文字敘述**（由 AI 依命盤切片與權重摘要自由發揮）。

---

## 3. 前端 / Viewer 對 weight_analysis 的使用現況

### 3.1 weight_analysis 在前端怎麼被用？

- **WeightSummary.tsx**：只顯示三列 — 優先關注宮位、風險宮位、相對穩定宮位（top_focus_palaces、risk_palaces、stable_palaces）；無每宮分數、無等級、無紅綠燈。
- **normalizeApiResponse**：只正規化這四項 + importance_map；若 API 或 JSON 有 `palace_scores` / `sorted_palaces` 也會被忽略（型別未定義）。
- **importExport（HTML/JSON）**：權重摘要只輸出上述三列表；**importance_map** 未在 Viewer 畫面顯示，僅在 lifeBookEngine 的 buildSectionUserPrompt 裡用來決定篇幅（high/medium/low）。
- **SectionCard**：不讀 weight_analysis；只顯示章節標題、星曜評語、四欄。
- **結論**：沒有更細緻的「每宮一個 score 或等級」的呈現；有 importance_map 但只用於後端篇幅，前端未用。

### 3.2 s20「三盤疊加：紅綠燈演算法」在後端有沒有實際計算？

- **沒有**。s20 與其他章節共用 GENERAL_TEMPLATE，slice_types 為 `["ziwei", "overlap", "wuxing", "sihua"]`，即把同一份 chart_json 切片（含 overlapAnalysis）送給 AI，沒有任何 s20 專屬的「紅綠燈計算」或「三盤加權分」。
- 僅在 **templates** 裡有標題與描述，依賴 AI 根據命盤切片與權重摘要**自由撰寫**「原命＋大運＋流年＋小限的事件與心態重疊」；沒有結構化輸出（例如每宮 traffic_light）。

---

## 4. 三盤資料來源現況（chart_json / overlapAnalysis）

### 4.1 命書 API 回傳的 chart_json 是否包含本命、大限、流年？

- **Worker compute/all** 回傳的是 **features**（bazi、ziwei），**不包含** overlapAnalysis、fourTransformations。ziwei 內含 **horoscope**（小限/大限/流年資訊）：如 decadal、yearly、age（activeLimitPalaceName、mutagenStars）、horoscopeByYear 等。
- **命書** 使用的 **chart_json** 是由**呼叫端**（如 expert-admin 或未來的前端流程）組裝的：先取得 compute/all 的 features，再在**前端**執行 FourTransformations.computeFourTransformations + calculateOverlapTransformations，把 **overlapAnalysis**（及必要時 fourTransformations）塞進 chart_json 再送 infer/generate。因此命書若要有「三盤疊加」，**必須由前端先算好疊宮**，再把結果放進 chart_json。
- 本命盤：有（ziwei.mainStars、core、basic）。大限：有（horoscope.decadal：stem、branch、palace、mutagenStars）。流年/小限：有（horoscope.yearly、age、horoscopeByYear）。但「疊加後的宮位四化計數與分類」只在 **overlapAnalysis**（前端計算）裡，不在 Worker 回傳的 features 裡。

### 4.2 疊加相關結構（pseudo）

- **overlapAnalysis**（來自 fourTransformations.calculateOverlapTransformations）：
  - `palaceMap`: Map<宮名, { palace, transformations: { benming, dalimit, liunian, xiaoxian }, luCount, quanCount, keCount, jiCount, totalWeight, riskLevel, opportunityLevel, resonance }>`
  - `criticalRisks`: [{ palace, jiCount, transformations, description }]
  - `maxOpportunities`: [{ palace, luCount, transformations, description }]
  - `volatileAmbivalences`: [{ palace, jiCount, luCount, transformations, description, note, priority }]
  - `summary`: { totalCriticalRisks, totalMaxOpportunities, totalVolatileAmbivalences, riskPalaces, opportunityPalaces, volatilePalaces }
- **fourTransformations**（computeFourTransformations 產出）：benming、dalimit、liunian、xiaoxian 各層的 stem/branch、mutagenStars、weights、palace 等；供 calculateOverlapTransformations 注入用。
- **strategicLinks**：M7 戰略聯動，由 StrategicLinkEngine 依 ziwei、overlapAnalysis、bodyPalaceReport 等產出；命書 prompt 會帶戰略聯動文案，**未**用於權重或紅綠燈計算。
- **chart_json** 傳入命書時通常含：ziwei、bazi、overlapAnalysis、fourTransformations、fiveElements/wuxingData（slice 依題目取用）。

---

## 5. 實作難度與著力點評估

### 5.1 要實作「真正的三盤疊加紅綠燈演算法」，最自然的進入點

- **建議進入點：A. 在 infer / weight_analysis 那層加計算（後端或前端權重層）**
  - **理由**：目前 **weight_analysis 已是命書的權重入口**，infer/generate 都依賴它；且 **overlapAnalysis 已具備四層疊加與 risk/opportunity 分類**，只是尚未轉成「每宮一個紅/黃/綠」或數值等級。在產出 weight_analysis 的同一層（目前是 lifeBookEngine.weightAnalysis）擴充「每宮 traffic_light 或 score 等級」，改動範圍最小，且 API 與 Viewer 可逐步接軌（例如在 WeightAnalysis 型別加 optional `palace_signals` 或 `traffic_light`）。
  - 若在 **Worker** 實作：需在 Worker 內重做或移植 fourTransformations + overlap 計算（目前僅前端有），或改為由前端傳入已含 overlap 的 chart_json 並在 Worker 內從 overlap 算出 weight_analysis；後者較符合現況（前端已有疊宮）。
  - **B. 在 lifeBookEngine / renderHTML 之前做整體分級**：等同於擴充現有 weightAnalysis 的產出，再交給現有 renderHTML / API；與 A 一致，只是強調在「同一個權重產出流程」內完成。
  - **C. 在前端 Viewer 自己算**：需在 Viewer 拿到完整 chart_json（含 overlapAnalysis），目前 Viewer 多數情境是「已生成命書 JSON」，沒有 chart_json 或只有部分；若未來改為「從主站帶 chart 進 Viewer 再生成」，可在 Viewer 內算一層解釋/視覺紅綠燈，但無法取代「命書內容本身」的紅綠燈產出（s20 或各章仍須後端或權重層給資料）。

### 5.2 難度與風險大致排序（以目前程式狀態與改動範圍論）

1. **只強化現有 weight_analysis（不動三盤）**  
   - 例如：在 lifeBookEngine.weightAnalysis 中多產出 `importance_map` 更細緻、或對外暴露 `palace_scores` / `sorted_palaces` 給 API；Viewer 可選顯示「每宮分數」或「高/中/低」標籤。  
   - **改動**：lifeBookEngine.js 回傳型別、API 傳遞、Viewer types + WeightSummary 或新元件。  
   - **難度**：低。**風險**：低。

2. **在後端（或權重產出處）加入簡單版三盤加權（直線加權、不含共振 multiplier）**  
   - 目前已有：四層權重 1.0/1.5/2.0/1.0、ji/lu/quan/ke 線性加總、criticalRisks/maxOpportunities 閾值。  
   - 「簡單版」可定義為：在現有 weightAnalysis（或 Worker 若日後自己算 weight）產出 **每宮一個綜合分或等級**（例如 0–100 或 red/yellow/green），僅用現有公式，不新增「共振倍數」或「double 忌放大」。  
   - **改動**：weightAnalysis 擴充輸出；API 與 Viewer 型別 + 顯示（可選）。  
   - **難度**：中低。**風險**：中低（與現有邏輯一致）。

3. **在後端（或權重產出處）加入完整版三盤紅綠燈（含四化共振、double 忌放大等）**  
   - 需定義規則：何謂「共振」、double 忌如何放大、是否與流年/大限宮位重疊才加分等；並在 fourTransformations/overlap 或 weight 層實作。  
   - **改動**：演算法設計 + fourTransformations.js 或 lifeBookEngine.js 或 Worker 內新模組。  
   - **難度**：中高。**風險**：中（邏輯複雜、需與現有疊宮一致）。

4. **在前端 Viewer 再做一層解釋 / 視覺紅綠燈**  
   - 若 weight_analysis（或 chart_json）已帶每宮 traffic_light / score：Viewer 僅需顯示（例如 SectionCard 旁標燈、或 WeightSummary 擴充為宮位表格）。  
   - 若要在 Viewer **僅從既有 weight_analysis 三列表**推估紅綠燈：只能做啟發式（例如 risk_palaces=紅、top_focus=黃、stable=綠），與「三盤疊加」無直接對應，屬展示層。  
   - **改動**：Viewer 元件、optional 從 state 讀 traffic_light。  
   - **難度**：低（若資料已有）到中（若需自己推估）。**風險**：低。

---

## 6. 總結：目前實作到哪一層、建議第一步

- **已實作**：  
  - 本命＋大限＋流年＋小限的**四層疊加**（fourTransformations + overlapAnalysis），與依四化計數的 **criticalRisks / maxOpportunities / volatileAmbivalences**。  
  - 依 overlap 與五行產生的 **weight_analysis**（top_focus、risk、stable、importance_map），以及命書 infer/generate 對其的使用。  
  - **未實作**：真正的「紅/黃/綠」欄位、s20 專用紅綠燈計算、以及 Viewer 上對每宮燈號或分數的呈現。

- **建議第一步**：  
  - **先強化現有 weight_analysis**：在 **lifeBookEngine.weightAnalysis**（或未來 Worker 若接手）多產出可選欄位，例如 `palace_scores`、或每宮一個 **signal**（如 'critical_risk' | 'max_opportunity' | 'volatile' | 'focus' | 'stable' | 'normal'），讓 API 與 Viewer 有穩定資料可接。  
  - 再視需求在 **Viewer** 加「權重/燈號」區塊（例如在 WeightSummary 或 s20 旁顯示每宮對應），或為 s20 設計專用 prompt 區塊，讓 AI 依這些欄位產出「紅綠燈敘述」而非完全自由發揮。  
  - 若要做「完整版」三盤紅綠燈（共振、double 忌等），建議在**同一權重/疊宮流程**內擴充公式，再從 (2) 的簡單版逐步迭代到 (3)。

（以上為現況分析，未改動任何程式碼。）
