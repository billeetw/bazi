# 既有疊宮殘留盤點（為疊宮分析做準備）

目的：確認還有哪些函式、模板、placeholder、formatter 會碰到舊疊宮；區分「只屬於展示層」、「屬於舊分析引擎應報廢」，供後續疊宮分析與清理決策使用。

---

## 一、總覽分類

| 分類 | 說明 | 建議 |
|------|------|------|
| **只屬於展示層** | 僅消費已算好的 shock/mine/wealth 或 V2 資料，不產出四化／飛星；可保留介面、改資料來源 | 保留；s15a 以 V2 為主、overlap fallback 已為空 |
| **舊分析引擎** | 仍從 `overlapAnalysis.items[].transformations` 或舊 overlap 結構產出大限／流年邊或 tag | 應報廢或改為僅用公式（buildDecadalSihuaFlows / buildYearlySihuaFlows / buildPalaceOverlay） |
| **已停用但未刪** | 函式恆回傳空或固定值，仍被呼叫；呼叫鏈可簡化 | 可刪除或改為從 buildPalaceOverlay 接 |

---

## 二、函式盤點

### 2.1 舊分析引擎（應報廢或改為公式）

| 位置 | 函式／邏輯 | 行為 | 建議 |
|------|------------|------|------|
| **worker/src/lifebook/normalize/normalizeTransforms.ts** | `buildTransformEdgesFromOverlap(chartJson)` | 讀 `chartJson.overlapAnalysis?.items[].transformations`，產出 `TransformEdge[]` | **報廢**：大限／流年邊應改由 gongGanFlowsToTransformEdges(buildDecadalSihuaFlows) / buildYearlySihuaFlows 產出，不讀 overlap |
| **worker/src/lifebook/normalize/normalizeTransforms.ts** | `getTransformsByLayer(chartJson)` | 呼叫 `buildTransformEdgesFromOverlap`，回傳 natal/decade/year 三組邊 | **改寫**：decade/year 改為從 gonggan-flows 公式產邊；natal 已由 normalizeChart 內 buildGongGanFlows(natal) 覆寫，可保留或統一從公式 |
| **worker/src/lifebook/normalize/normalizeChart.ts** | `getTransformsByLayer(chartJson)` 的結果賦值給 `decadeTransforms`、`yearTransforms` | 將 overlap 產出的邊 assign 到 palaces、currentDecade.transforms、yearlyHoroscope.transforms；`currentDecade.flows = []`、`yearlyHoroscope.flows = []` | **改寫**：大限／流年 transforms 與 flows 改為由 buildDecadalSihuaFlows / buildYearlySihuaFlows → gongGanFlowsToTransformEdges 灌入，不再用 getTransformsByLayer 的 decade/year |
| **worker/src/lifebook/normalize/normalizeChart.ts** | `currentDecade.transformSource = "overlap.decade"`、`yearlyHoroscope.transformSource = "liunian.mutagenStars|fourTransformations.liunian|overlap.year"` | 僅為 metadata 標註 | 改為 `"gonggan-formula"` 或刪除 overlap 字樣 |

### 2.2 已停用但未刪（恆回傳空／固定值）

| 位置 | 函式 | 行為 | 呼叫者 | 建議 |
|------|------|------|--------|------|
| **worker/src/lifeBookPrompts.ts** | `getAllOverlapTransformations(_chartJson)` | 恆回傳 `[]` | `getSihuaContext()`：用 `allTrans` 算 `sihuaGlobalSummary` 的「四化重點宮位」；allTrans 空則不改寫預設文案 | **報廢或改寫**：可刪除函式，getSihuaContext 改為不依賴 overlap 四化條目；或改為從 buildPalaceOverlay 推「飛入宮」統計 |
| **worker/src/lifeBookPrompts.ts** | `buildOverlapDetailBlocks(_overlap, _opts)` | 恆回傳 `{ shockBlocks: "", mineBlocks: "", wealthBlocks: "" }` | getPlaceholderMapFromContext 兩處（s15a key-level fallback）：`detail = buildOverlapDetailBlocks(overlap, ...)`，再寫入 `map.shockBlocks/mineBlocks/wealthBlocks` 等 | **保留殼**：s15a 已以 V2（buildS15aPlaceholderMapFromV2）為主，此為 fallback；目前等於填空。若要徹底移除舊路徑，可改為不呼叫、直接設空字串 |
| **worker/src/lifeBookPrompts.ts** | `collectFourTransformsForPalace(chartJson, palaceKey)` | 恆回傳 `[]`（註解：疊宮清理，待 buildPalaceOverlay 接上） | getSihuaContext（命宮）、buildWholeChartContext（各宮 perPalaceFlow） | **報廢**：不再從 overlap 取四化；若需「每宮四化流向」應改為從 buildPalaceOverlay 或 NormalizedChart 公式邊產出 |

### 2.3 只屬於展示層（消費 overlap 或 shock/mine/wealth）

| 位置 | 函式／邏輯 | 行為 | 建議 |
|------|------------|------|------|
| **worker/src/lifeBookPrompts.ts** | getPlaceholderMapFromContext 內讀 `overlap = chartJson.overlapAnalysis ?? chartJson.overlap` | 用於：newItems、criticalRisks、maxOpportunities、volatileAmbivalences、shockCount/mineCount/wealthCount、hasOverlap、overlapDataMissingNotice；以及呼叫 buildOverlapDetailBlocks 填 map.shockBlocks/mineBlocks/wealthBlocks 等 | **展示層**：s15a 有 V2 時用 V2；無 V2 時用 overlap 計數與 buildOverlapDetailBlocks（目前空）。可保留「缺資料提示」邏輯，其餘待 V2 覆蓋率夠高再收斂 |
| **worker/src/lifeBookPrompts.ts** | getSectionTechnicalBlocks：sectionKey === "s15a" 時 `fourTech` 含 placeholderMap.shockBlocks/mineBlocks/wealthBlocks | 僅組技術版區塊字串，不產四化 | **展示層**：保留；資料來源已是 V2 或空 |
| **worker/src/lifebook/v2/assembler/buildS15aMapFromV2.ts** | `blocksFromStackSignals(signals)` | 從 findingsV2.stackSignals 產 shockBlocks/mineBlocks/wealthBlocks、overlapSummary | **展示層**：新資料鏈（V2），非舊 overlap，保留 |
| **worker/src/lifebook/transforms/buildTransformFlowLines.ts** | `buildTransformFlowLines(chart)`、`getFlowBlockForPalace(chart, palace)` | 只讀 NormalizedChart 的 natal/currentDecade/yearlyHoroscope 的 flows／transforms | **展示層**：不直接讀 overlap；若 normalizeChart 改為公式產邊，此處自動跟進 |

---

## 三、模板與 Placeholder

### 3.1 使用舊疊宮相關 placeholder 的章節

| 章節 | 模板／內容來源 | 使用的 placeholder | 說明 |
|------|----------------|---------------------|------|
| **s15a** | lifebookSection-zh-TW.json 或 D1/KV | shockBlocks、mineBlocks、wealthBlocks、overlapSummary、volatileSection、criticalRisksSection、opportunitiesSection | 展示層；s15a 優先 V2（buildS15aPlaceholderMapFromV2），缺 key 才 fallback 到 overlap + buildOverlapDetailBlocks（目前空） |
| **s15** | 同上 | 無直接 overlap；decadalFourTransformBlocks 來自 buildDecadalSihuaFlows | 已為公式驅動 |
| **s16** | 同上 | yearlyFourTransformBlocks 來自 buildYearlySihuaFlows | 已為公式驅動 |
| **s17** | structure_analysis = "{palaceOverlayBlocks}" | palaceOverlayBlocks | 唯一來源 buildPalaceOverlay + buildPalaceOverlayBlocks，不讀 overlap |

### 3.2 其他仍寫入 overlap 相關 key 的 placeholder

- **overlapSummary**：s15a 用（V2 或 overlap 計數拼接文案）
- **overlapDataMissingNotice**：無 V2 且無 overlap/minor 時提示「疊宮資料尚未產出…」
- **volatileSection / criticalRisksSection / opportunitiesSection**：s15a 用（V2 或 buildOverlapDetailBlocks 結果，目前 fallback 為空）

以上皆為**展示層**；資料來源可逐步收斂為 V2 + buildPalaceOverlay，不再讀 overlap 內容。

---

## 四、Formatter

| 名稱 | 位置 | 是否碰舊疊宮 | 說明 |
|------|------|--------------|------|
| formatOverlayFlow / formatPalaceOverlayBlock / buildPalaceOverlayBlocks | lifebook/palaceOverlay.ts | 否 | S17 專用，只吃 PalaceOverlayEntry（來自 buildPalaceOverlay） |
| buildLayerFlows / buildLayerFlowBlock / formatTransformFlowBlocks | lifebook/transforms/buildTransformFlowLines.ts | 間接 | 吃 NormalizedChart；若 chart 的 decade/year 邊改為公式產出，則不再依賴舊 overlap |
| blocksFromStackSignals | lifebook/v2/assembler/buildS15aMapFromV2.ts | 否 | 吃 V2 stackSignals，非 overlap |

無專為「舊 overlap 結構」的 formatter 需保留；buildOverlapDetailBlocks 已恆回傳空，等同無 formatter。

---

## 五、其他檔案與資料流

| 位置 | 說明 | 建議 |
|------|------|------|
| **worker/src/index.ts** | 傳 `overlap_analysis: chartForSection?.overlapAnalysis`、`chartForGenerate?.overlapAnalysis` 給下游 | API 傳遞用；可保留相容，或改為僅供選用、命書主路徑不依賴 |
| **worker/src/lifeBookPrompts.ts** | getChartSlice：`sliceTypes.includes("overlap")` 時 `slice.overlapAnalysis = chartJson?.overlapAnalysis ?? chartJson?.overlap` | 舊 slice 組裝；若前端仍要 overlap 鍵可保留，否則可移除 |
| **worker/src/lifebook/sectionDataDependencyMap.ts** | secondaryChartContent / fallback 多處列 `chartJson.overlapAnalysis`、`chartJson.overlap`、minorFortuneByPalace；SECTION_V2_TARGET_MAP 的 removePromptRecalc 列「buildOverlapDetailBlocks」「overlap items」等 | **文件／依賴說明**：建議更新為「s15a/s17 以 V2 或 buildPalaceOverlay 為準；overlap 僅 fallback 或廢棄」 |
| **worker/src/lifebook/normalize/normalizeChart.ts** | 註解／transformSource 字串含 "overlap.decade"、"overlap.year" | 改為 "gonggan-formula" 或移除 overlap 字樣 |
| **worker/src/lifebook/findings/buildLifebookFindings.ts** | BuildLifebookFindingsInput 含 overlap、minorFortuneByPalace | findings 組裝；overlap 可改為選填或廢棄，由 V2 / buildPalaceOverlay 取代 |
| **worker/src/lifebook/engines/signals/keyYearEngine.ts** | 註解「由 minorFortuneByPalace 或 yearlyHoroscope + overlap 標記」；實作僅用 minorFortuneByPalace + note 推論 | 實作未讀 overlap；註解可改為「由 minorFortuneByPalace（或未來由 buildPalaceOverlay 標記）」 |

---

## 六、小限（minorFortune）與疊宮

| 項目 | 說明 | 建議 |
|------|------|------|
| minorFortuneByPalace | 仍被 getPlaceholderMapFromContext 讀取，用於 minorFortuneTable、minorFortuneTimelineTable、overlapDataMissingNotice、buildOverlapDetailBlocks 傳入 opts（已傳 []） | 疊宮主邏輯已不納入（buildPalaceOverlay 不讀）；小限表若保留則僅展示層，不參與四化飛星／疊宮分析 |
| keyYearEngine.runKeyYearFromMinorFortune | 只吃 minorFortuneByPalace + birthYear，從 note 推 mine/wealth/shock | 展示／決策用，非舊 overlap 分析引擎 |

---

## 七、建議行動摘要

### 7.1 應直接報廢（舊分析引擎）— 已完成

1. **normalizeTransforms.buildTransformEdgesFromOverlap** — ✅ 已刪除；getTransformsByLayer 已刪除；僅保留 groupTransformsByLayer。
2. **normalizeChart** — ✅ 大限／流年改為 buildDecadalSihuaFlows / buildYearlySihuaFlows + gongGanFlowsToTransformEdges；transformSource 改為 "gonggan-formula"；本命一律用 natalFlowEdges。
3. **getAllOverlapTransformations** — ✅ 已刪除；getSihuaContext 改為直接使用 defaultCtx.sihuaGlobalSummary。
4. **collectFourTransformsForPalace** — ✅ 已刪除；getMingGongTransformNarrativeByPriority / getPalaceTransformNarrativeByPriority 改為僅用 fourTransformations.benming 主星四化。

### 7.2 只屬於展示層（保留介面、可改資料來源）

- s15a：shockBlocks / mineBlocks / wealthBlocks / overlapSummary → 維持 V2 優先，overlap fallback 可保留空殼或移除。
- getPlaceholderMapFromContext 內 overlap 計數與 overlapDataMissingNotice → 可保留至 V2 覆蓋率夠高再收斂。
- buildOverlapDetailBlocks：保留空殼或改為直接設空字串、不再呼叫。

### 7.3 依賴說明與註解

- sectionDataDependencyMap.ts：更新 s15a/s15/s16/s17 的 fallback、removePromptRecalc，標註「疊宮以 buildPalaceOverlay / V2 為準」。
- normalizeChart.transformSource、keyYearEngine 註解：移除或改寫「overlap」字樣。

完成以上盤點後，疊宮分析可單一依賴 **buildPalaceOverlay + buildPalaceOverlayBlocks（S17）** 與 **V2 stackSignals（s15a）**，舊 overlap 分析引擎可逐步報廢或改為僅用公式產邊。
