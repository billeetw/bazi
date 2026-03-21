# 命書系統完整盤點報告（小限刪除後）

**盤點日期**：2026-03  
**範圍**：Chart 來源、NormalizedChart、四化算法、宮干飛化、命書組裝、模板、Debug、已知問題與修復優先順序。

---

## 1 Chart / 排盤資料來源

### 1.1 palaceByBranch 如何產生

| 項目 | 說明 |
|------|------|
| **定義** | 地支（寅…丑）→ 宮位名（命宮、兄弟宮…）的唯一權威對照表。 |
| **產生位置** | `worker/src/palace-map.ts`：`buildPalaceByBranch(mingBranch: string)` |
| **算法** | 寅起地支環 `BRANCH_RING = [寅,卯,…,丑]`，命宮地支索引 `mingIndex`，對每個地支 `i`：`offset = (mingIndex - i + 12) % 12`，`out[branch] = PALACE_BY_OFFSET[offset]`。 |
| **寫入 NormalizedChart** | `worker/src/lifebook/normalize/normalizeChart.ts`：`palaceByBranch = mingBranch ? buildPalaceByBranch(mingBranch) : undefined`，命宮地支來自 `chartJson.ziwei.core.minggongBranch`。 |
| **其他使用** | `lifeBookPrompts.ts`：`buildTimeModuleDisplayFromChartJson` 內流年命宮查表時，優先 `chartJson.palaceByBranch`，否則用 `buildPalaceByBranch(mingBranch)`。`index.ts`：`/compute` 回傳之 `yearlyPalace` 用同一套查表。 |

**與前端是否一致**：是。前端 `js/calc.js` 之 `buildSlotsFromZiwei` 使用相同寅起環與公式 `palaceIndex = (mingIdx - idx + 12) % 12`，與 worker 之 `(mingIndex - i + 12) % 12` 對應同一套宮位順序。

**與 iztro 是否一致**：palaceByBranch 為 worker 自行計算，不直接讀 iztro；命宮地支來源為前端/API 傳入之 `ziwei.core.minggongBranch`（多數來自 iztro 排盤），故宮位對應與「以命宮地支旋轉」的 iztro 邏輯一致。

---

### 1.2 starsByPalace 如何產生

| 項目 | 說明 |
|------|------|
| **定義** | 宮位 → 該宮星曜名稱陣列（用於宮干飛化時「找星在哪一宮」）。 |
| **產生位置** | `worker/src/lifebook/normalize/normalizePalaces.ts`：`getStarByPalaceFromChart(chartJson)`，回傳 `Map<string, string[]>`。 |
| **資料來源** | `chartJson.ziwei.starByPalace` 或 `chartJson.ziwei.core.starByPalace` 或 `chartJson.ziwei.basic.starByPalace`；若無則用 `chartJson.ziwei.mainStars`。Key 為宮位（中文或 id），經 `toPalaceCanonical` 正規化。 |
| **在 NormalizedChart** | 未直接掛在 NormalizedChart 上；僅在 `normalizeChart()` 內部用於 `buildGongGanFlows({ starsByPalace })`，產出本命 flows。 |

**與前端是否一致**：星曜與宮位對應依同一份 `chartJson.ziwei`，前端排盤與 worker 共用該結構則一致。

**與 iztro 是否一致**：依 chartJson 是否由 iztro 產出；若資料來自 iztro，則一致。

---

### 1.3 palaceStemMap 是否存在

| 項目 | 說明 |
|------|------|
| **存在** | 是。 |
| **型別** | `Record<string, string>`：宮位 canonical 名 → 天干（甲…癸）。 |
| **產生位置** | `worker/src/gonggan-flows.ts`：`buildPalaceStemMap(chartJson)`。 |
| **優先順序** | (1) `chartJson.palaceStemMap` 或 `chartJson.ziwei.palaceStemMap`；(2) `ziwei.core.minggongStem` + 宮位索引順推 12 宮；(3) `bazi` 年干 + `minggongBranch` 推命宮天干後順推。 |
| **寫入 NormalizedChart** | `normalizeChart.ts`：`palaceStemMap` 建完後寫入 `chart.palaceStemMap`（有值才寫）。 |

---

### 1.4 命宮地支來源

| 項目 | 說明 |
|------|------|
| **來源** | `chartJson.ziwei.core.minggongBranch`（字串，如 "亥"）。 |
| **使用處** | `normalizeChart` 建 `palaceByBranch`、算 `flowYearDestinyPalace`；`buildTimeModuleDisplayFromChartJson` 建表與流年命宮；`index.ts` 流年命宮。 |

---

### 1.5 流年命宮來源

| 項目 | 說明 |
|------|------|
| **權威算法** | 僅查表，禁止再用 offset 公式：`flowYearPalace = palaceByBranch[liunian.branch]`，即 `getFlowYearPalace(liunian.branch, palaceByBranch)`。 |
| **palaceByBranch 來源** | 若 `chartJson.palaceByBranch` 存在則用，否則 `buildPalaceByBranch(mingBranch)`。 |
| **liunian.branch 來源** | `chartJson.liunian.branch`（當年流年地支，如 "午"）。 |
| **fallback** | 若查表無結果，則用 `chartJson.liunian.palace` / `destinyPalace` / `palaceName`；再無則顯示「（無流年命宮資料）」或「YYYY年X位」。 |

**與前端是否一致**：是（同上，寅起 + 同一公式）。**與 iztro 是否一致**：依傳入之 `liunian.branch` 與命宮地支是否與 iztro 一致。

---

## 2 NormalizedChart 結構

### 2.1 normalizeChart() 輸出結構

```
NormalizedChart
├─ chartId, locale, nominalAge?, flowYear?
├─ mingGong, shenGong?, shenGongSource?, lifeLord?, bodyLord?
├─ palaceByBranch?: Record<string, string>     // 地支 → 宮位
├─ palaceStemMap?: Record<string, string>       // 宮位 → 天干（宮干飛化用）
├─ palaces: PalaceStructure[]                    // 12 宮，每宮含 natal/decade/year TransformsIn/Out
├─ natalTransforms: TransformEdge[]             // 來自 overlap，與 natal.flows 不同源
├─ natal?: NatalScope
│   ├─ birthTransforms: TransformEdge[]        // 同 natalTransforms（overlap 本命邊）
│   └─ flows?: TransformEdge[]                 // 宮干飛化邊（buildGongGanFlows → gongGanFlowsToTransformEdges）
├─ decadalLimits: DecadalLimit[]
├─ currentDecade?: DecadalLimit
│   ├─ transforms?: TransformEdge[]            // 來自 overlap 大限層
│   └─ flows?: TransformEdge[]                 // 目前固定 []
├─ yearlyHoroscope?: YearScope
│   ├─ destinyPalace?: string                  // 流年命宮（查表或 fallback）
│   ├─ transforms?: TransformEdge[]            // 來自 overlap 流年層
│   └─ flows?: TransformEdge[]                 // 目前固定 []
```

註：`starsByPalace` 未存在於 NormalizedChart 上，僅在 `normalizeChart()` 內部使用。

### 2.2 flows 是否只存在 natal

| 層級 | flows 內容 |
|------|------------|
| **natal** | 有。由 `buildGongGanFlows({ layer: "natal", palaceStemMap, starsByPalace })` → `gongGanFlowsToTransformEdges` 產出，為宮干飛化。 |
| **currentDecade** | 刻意為空：`currentDecade.flows = []`。 |
| **yearlyHoroscope** | 刻意為空：`yearlyHoroscope.flows = []`。 |

結論：**僅 natal 有實質 flows**；大限／流年目前不產 from→to 的 flow，僅保留「四化落宮」顯示。

### 2.3 transforms 是否正確分層

| 項目 | 說明 |
|------|------|
| **來源** | `getTransformsByLayer(chartJson)` → `buildTransformEdgesFromOverlap(chartJson)`，即 **overlapAnalysis.items[].transformations**。 |
| **分層** | `groupTransformsByLayer(all)` 依 `layer` 分為 natal / decade / year；**小限層**（layerLabel 小限/minor）已跳過不產邊。 |
| **寫入** | natal → `natalTransforms` 與 `assignEdgesToPalaces(..., natalFlowEdges, "natal")` 之「本命」為兩套：前者為 overlap 本命邊，後者為宮干飛化邊；宮位上的 `natalTransformsIn/Out` 由 **宮干飛化邊** 填入。decade → `currentDecade.transforms` 並 assign 到各宮 `decadalTransformsIn/Out`；year → `yearlyHoroscope.transforms` 並 assign 到各宮 `yearlyTransformsIn/Out`。 |

結論：**transforms 分層正確**（本命／大限／流年）；本命「宮位四化」顯示已改為宮干飛化邊，overlap 本命邊仍存在於 `natalTransforms`／`birthTransforms`，但 12 宮敘事讀的是宮干飛化邊。

---

## 3 四化算法

### 3.1 buildLayerTransforms

**盤點結果**：程式內**無**名為 `buildLayerTransforms` 的函式。與「分層四化」相關者為：

- `getTransformsByLayer(chartJson)`（`normalizeTransforms.ts`）：從 overlap 產出並分層。
- `buildLayerFlows` / `buildLayerFlowBlock`（`buildTransformFlowLines.ts`）：把單層 `TransformEdge[]` 轉成敘事字串。

若「buildLayerTransforms」指「各層 transforms 的組裝」，則由 `getTransformsByLayer` + `assignEdgesToPalaces` 完成，無額外 step-based 計算。

### 3.2 findPalaceByStar

| 項目 | 說明 |
|------|------|
| **位置** | `worker/src/gonggan-flows.ts` |
| **簽名** | `findPalaceByStar(starsByPalace, starName): string \| null` |
| **行為** | 在 `starsByPalace`（Map 或 Record 宮→星名陣列）中找第一個包含 `starName` 的宮位，回傳 canonical 宮名；找不到則 `null`。 |
| **用途** | 宮干飛化時由「星名」反查「該星在本命盤哪一宮」，作為 toPalace；回傳 null 則不產該條邊，避免髒資料。 |

### 3.3 buildGongGanFlows（無 buildNatalGongGanFlows 一詞）

| 項目 | 說明 |
|------|------|
| **位置** | `worker/src/gonggan-flows.ts`：`buildGongGanFlows(params)` |
| **參數** | `{ layer, palaceStemMap, starsByPalace }`；本命呼叫時 `layer: "natal"`。 |
| **邏輯** | 對每宮 `fromPalace` 與其 `triggerStem`，用 `SI_HUA_BY_STEM[stem]` 得祿/權/科/忌四星，再以 `findPalaceByStar(starsByPalace, star)` 得 `toPalace`，僅在 toPalace 非 null 時 push 一筆 `GongGanFlow`。 |
| **與 natal.flows 關係** | `normalizeChart` 內：`natalFlowEdges = gongGanFlowsToTransformEdges(buildGongGanFlows({ layer: "natal", ... }))`，再賦給 `natal.flows` 並 `assignEdgesToPalaces(..., natalFlowEdges, "natal")`。 |

### 3.4 四化星來源是否正確

| 項目 | 說明 |
|------|------|
| **本命（生年）四化** | 依生年天干；`SI_HUA_BY_STEM`（`sihua-stem-table.ts`）為權威表；前端/API 之 `fourTransformations.benming.mutagenStars` 或 iztro 生年四化與此對齊即正確。 |
| **大限／流年四化** | 依該大限／流年天干，同樣可對照 `SI_HUA_BY_STEM`；`getTransformsByLayer` 來自 overlap，若 overlap 來自同一套天干四化表則一致。 |

### 3.5 是否仍存在 +4 / +6 / +8 / +10 位移

**盤點結果**：**不存在**。worker 內無以 `toIndex = fromIndex + 4/6/8/10` 或固定 step 產 flow 的程式碼；本命 flow 已改為宮干飛化。

### 3.6 大限／流年 transforms 是否正確

- **來源**：overlap 之 `items[].transformations`，且 `layerLabel` 為本命／大限／流年（小限已濾掉）。
- **正確性**：依前端/API 傳入之 overlap 是否依「大限天干」「流年天干」正確標記；若 overlap 正確，則分層與寫入 `currentDecade.transforms`、`yearlyHoroscope.transforms` 正確。

---

## 4 宮干飛化

### 4.1 palaceStemMap 是否正確

- **建表**：`buildPalaceStemMap(chartJson)`，優先讀 chart 既有 `palaceStemMap`，其次命宮天干順推。
- **正確性**：若前端/API 有提供正確 12 宮宮干或正確 `minggongStem`，則正確；否則依 bazi 年干 + 命宮地支推命宮天干再順推，與多數派一致。

### 4.2 natal.flows 是否由 buildGongGanFlows 生成

**是**。`normalizeChart` 內僅有一處寫入本命 flows：

```ts
const natalFlowEdges = gongGanFlowsToTransformEdges(
  buildGongGanFlows({ layer: "natal", palaceStemMap, starsByPalace })
);
// ...
natal: { birthTransforms: natalTransforms, flows: natalFlowEdges },
assignEdgesToPalaces(palaces, natalFlowEdges, "natal");
```

### 4.3 是否存在 overlap 或舊 edge

| 項目 | 說明 |
|------|------|
| **natal.flows** | 僅宮干飛化邊，無 overlap。 |
| **natal.birthTransforms / natalTransforms** | 仍來自 **overlap**（本命層邊），用於部分邏輯或相容；**宮位上的 natalTransformsIn/Out 已改為宮干飛化邊**（assignEdgesToPalaces 用 natalFlowEdges）。 |
| **currentDecade.transforms** | 來自 overlap 大限層；**currentDecade.flows** 固定 []。 |
| **yearlyHoroscope.transforms** | 來自 overlap 流年層；**yearlyHoroscope.flows** 固定 []。 |

結論：**本命「流向」顯示已純為宮干飛化**；overlap 仍提供大限/流年「分層邊」與部分本命邊資料，但不再用於本命 from→to 敘事。

---

## 5 命書組裝

### 5.1 buildLifebookFindings() 目前輸出

**函式**：`buildLifebookFindings(input)` 與對外入口 `buildLifebookFindingsFromChartAndContent({ chartJson, content })`。

**實際回傳型別**：`LifebookFindings`（`lifebookFindings.ts`），**沒有**您列出的 `timelineSummary`、`sihuaPlacement`、`sihuaEnergy`、`natalFlows`、`interpretationContext` 等欄位。

**目前 LifebookFindings 欄位**：

| 欄位 | 說明 |
|------|------|
| mainBattlefields | 主戰場（宮位+理由+層級） |
| pressureOutlets | 壓力出口 |
| spilloverFindings | 壓力外溢（spillover 引擎） |
| crossChartFindings | 三盤聯動診斷 |
| yearSignals | 年度訊號（紅綠燈） |
| keyYears | 關鍵年份（地雷/機會/震盪） |
| lifeLessons | 靈魂功課 |
| actionItems | 行動建議 |
| starCombinations | 星曜組合 |
| palacePatterns | 四化×宮位×主星矩陣／fallback |

**timeContext**（與 findings 一併回傳）：`currentDecadePalace`、`shenGong`、`year`、`nominalAge`；以及 `timelineValidationIssues`。

亦即：**時間軸／四化落宮／四化能量／本命宮干飛化** 等「段落文字」並非 findings 的欄位，而是後續由 **chartJson + 模板 + placeholder 替換** 組裝（見下節）。

### 5.2 各 section 的資料來源

| Section | 資料來源 | 說明 |
|---------|----------|------|
| **s15（時間主線與功課）** | `injectTimeModuleDataIntoSection(sectionKey, structureAnalysis, chartJson, content, config, contentLocale, options)` | 模板來自 `lifebookSection-zh-TW.json` 之 s15；placeholders（如 birthSihuaLine, flowYearMingPalace, sihuaFallByPalaceBlock, sihuaEnergyFocusBlock, natalGongganFlowBlock, currentDecadalPalace 等）由 chartJson 經 `buildTimeModuleDisplayFromChartJson`、`buildSihuaFallByPalaceBlock`、`buildSihuaEnergyFocusBlock`、`buildNatalGongganFlowBlock` 等即時計算填入。 |
| **s16（流年）** | 同上，同一套 chartJson + 時間/四化組裝 | 流年命宮、流年四化等來自同一邏輯。 |
| **12 宮（s02, s05～s14 等）** | `getPlaceholderMapFromContext(ctx, opts)`，其中 `ctx` 為該宮的 PalaceContext，`opts.chartJson` 存在 | 各宮 `structure_analysis` 模板使用 `sihuaFlowSummary`、`palaceStarsOnlySnippet` 等；sihuaFlowSummary 由 `buildSihuaFlowSummary({ chartJson, palaceKey, flowsNotVerified })` 產出，內部會 `normalizeChart(chartJson)` 並用 `getFlowBlockForPalace`（讀 chart.natal.flows / currentDecade.flows / yearlyHoroscope.flows）。 |
| **s00 / s03 等總論** | 同上，getPlaceholderMapFromContext 或專用組裝，chartJson + content | 依各 section 的 skeleton 與 placeholder 設計。 |

結論：**命書正文的「時間軸／四化落宮／能量集中／宮干飛化」等段落，是由 chartJson 在組裝當下用 lifeBookPrompts 的 builder 函式即時算出並填進模板**，而非由 LifebookFindings 的欄位直接提供；Findings 主要提供主戰場、壓力、關鍵年份、行動建議等「結構化結論」，與「四化段落」是兩條線。

---

## 6 命書模板

### 6.1 lifeBookPrompts.ts

| 檢查項 | 結果 |
|--------|------|
| 是否仍存在「四化流向（本命／大限／流年）」標題 | **是**。`buildSihuaFlowSummary` 內仍有 `flowLines.push("【四化流向（本命／大限／流年）】")`；該區塊用於**單一宮位**的 sihuaFlowSummary（12 宮模板之 `sihuaFlowSummary`），內容為「本命宮干飛化」之該宮相關流向 + 四化能量總結。 |
| 是否仍存在小限 | **有殘留**。註解或文案仍出現「小限」：例如「本命／大限／流年／小限的 SiHuaLayers」、「流年宮位／四化仍由 chartJson 組裝並與小限分開」、「各宮位小限年份與注意事項」、「當年小限 + 流年四化」、「當前大限／當年小限／當年流年」等；另有 `minorFortuneByPalace`、`config.minorFortuneSummary` 等仍傳入或使用。 |
| prompt 中是否直接計算命理 | 命書組裝時不「算」命理，但會依 chartJson 與 content 做**資料轉換與字串組裝**（如四化落宮、宮干飛化敘事）；若「直接計算」指公式推導，則宮干飛化、流年命宮查表等屬於此類，但集中在 worker 邏輯層，非在 GPT prompt 內算。 |

### 6.2 lifebookSection-zh-TW.json

| 檢查項 | 結果 |
|--------|------|
| 四化段落標題 | s15 已改為四段式：**【時間軸校對總覽】**、**【本命／大限／流年四化落宮】**、**【四化能量集中】**、**【本命宮干飛化】**；不再在 s15 頂層出現「四化流向（本命／大限／流年）」單一標題。 |
| 小限 | 模板內未再出現「小限命宮」「小限四化」等 placeholder；s15/s15a 文案為大限／流年。 |

### 6.3 lifeBookTemplates.ts

- 主要為 SECTION_ORDER、SECTION_TEMPLATES、宮位 key 等；未見「四化流向」或「小限」字串。
- 個別 section 的 structure_analysis 骨架在 `lifebookSection-zh-TW.json`，不在 lifeBookTemplates。

---

## 7 Debug 輸出

| 標籤 | 位置 | 是否仍存在 |
|------|------|------------|
| **FLOW_YEAR_DEBUG** | `lifeBookPrompts.ts`：`buildTimeModuleDisplayFromChartJson` 內 `console.log("FLOW_YEAR_DEBUG", { liunian, yearlyHoroscope, flowYearMingPalace })` | **是** |
| **FLOW_YEAR_SIHUA_DEBUG** | `lifeBookPrompts.ts`：同函式內 `console.log("FLOW_YEAR_SIHUA_DEBUG", { liunianMutagenStars, fourTransformationsLiuNian, decadeMutagenStars, finalFlowYearSihuaLine })` | **是** |
| **FLOW_DEBUG** | `lifeBookPrompts.ts`：`buildTechDebugForPalace` 內 `lines.push("【FLOW_DEBUG】")` 並用 `buildFlowDebugEntries(chart)` 產出結構化邊列表 | **是**（技術版／除錯用） |

---

## 8 已知問題

| 問題 | 說明 |
|------|------|
| **命書組裝與 Findings 脫鉤** | 時間軸／四化落宮／能量集中／宮干飛化等「段落」不來自 LifebookFindings，而是 chartJson + 模板即時計算；若希望「宮位與星曜分開解釋」或統一由 findings 驅動，需重設計資料流（例如 findings 內增加 timelineSummary、sihuaPlacement、sihuaEnergy、natalFlows 等）。 |
| **12 宮仍用「四化流向（本命／大限／流年）」標題** | 單宮的 `sihuaFlowSummary` 仍用此標題，內容已是本命宮干飛化 + 能量總結；若與 s15 四段式用語統一，可改為「本命宮干飛化（本宮）」或類似。 |
| **小限殘留** | 註解、prompt 文案、Findings 型別（如 `layer?: "xiaoxian"`、`reasons` 例「小限落宮」）、buildActionFindings/buildTimeFindings 的 `minorFortuneByPalace`、keyYearEngine 的「小限落宮」敘事、lifeBookInfer 的「當年小限」等仍存在；功能上小限已不產 flow/不顯示，但語意與文案未完全清除。 |
| **transforms 雙源** | 本命既有 overlap 的 `natalTransforms`/`birthTransforms`，又有宮干飛化的 `natal.flows`；宮位顯示已只用 flows，但結構上兩套並存，易混淆。 |
| **大限／流年無 from→to flow** | `currentDecade.flows`、`yearlyHoroscope.flows` 固定 []，僅「四化落宮」；若未來要顯示「大限／流年從 X 宮出入 Y 宮」，需再定義規則並產邊。 |
| **流年命宮錯誤風險** | 若 `chartJson.liunian.branch` 或 `palaceByBranch` 來源錯誤，流年命宮會錯；目前邏輯正確，需確保上游傳入正確。 |
| **四化落宮錯誤風險** | 依 `buildSiHuaLayers` 與各層 mutagenStars + starByPalace；若 starByPalace 與實際盤不一致（例如 id/名稱對應錯誤），會出現「落宮待核」或錯宮。 |

---

## 9 修復優先順序

### P0 必修

1. **確認命書組裝路徑與預期一致**  
   - 釐清：時間軸／四化落宮／能量集中／宮干飛化是否要從 **LifebookFindings** 讀，還是維持「chartJson + 即時 builder」？  
   - 若改為 findings 驅動：在 buildLifebookFindings（或上游）產出 **timelineSummary、sihuaPlacement、sihuaEnergy、natalFlows**（及必要時 interpretationContext），並讓 section 組裝只讀 findings，不再用 chartJson 直接呼叫 builder。

2. **流年命宮與四化落宮正確性**  
   - 對 1～2 張已知正確的盤（含 1972-08-02 申時男）做端到端比對：API 回傳之 `yearlyPalace`、命書 s15 之流年命宮、四化落宮段落是否與手排/iztro 一致。  
   - 若有落差，鎖定是 `liunian.branch`、`starByPalace` 還是宮干/四化表，並修正來源或對照表。

3. **小限文案與型別殘留清理**  
   - 移除或改寫註解/文案中的「小限」（含 SiHuaLayers 註、injectTimeModule 註、prompt 的「當年小限」「各宮位小限年份」等）。  
   - `LifebookFindings` 與相關型別中的 `xiaoxian`、`小限落宮` 例子的保留或改為「流年」等用語。  
   - 若不再使用 `minorFortuneByPalace` 做關鍵年份，改為純流年或大限邏輯並從介面移除。

### P1 建議

4. **統一四化段落用語**  
   - 12 宮的 `sihuaFlowSummary` 標題由「四化流向（本命／大限／流年）」改為與 s15 一致（例如「本命宮干飛化（本宮）」+ 能量總結），避免讀者混淆。

5. **transforms 單一來源**  
   - 本命層：考慮僅保留 `natal.flows`（宮干飛化），`natalTransforms`/`birthTransforms` 改為從 flows 衍生或廢棄，避免 overlap 本命邊與宮干飛化邊並存。

6. **Debug 開關**  
   - `FLOW_YEAR_DEBUG`、`FLOW_YEAR_SIHUA_DEBUG` 改為可關閉（例如依 env 或 request flag），避免 production 日誌過多。

### P2 重構

7. **Findings 擴充與單一真相**  
   - 若採用「命書只讀 findings」：在 buildTimeFindings 或專用 builder 產出 timelineSummary、sihuaPlacement、sihuaEnergy、natalFlows，寫入 LifebookFindings 或擴充的 TimeModuleFindings，section 組裝只做 placeholder 替換，不再呼叫 buildTimeModuleDisplayFromChartJson 等。

8. **大限／流年 flow（若產品需要）**  
   - 定義大限／流年「from 宮 → to 宮」規則（例如是否用限盤宮干、是否用流年宮干），實作後產出 `currentDecade.flows`、`yearlyHoroscope.flows`，並在模板中顯示。

9. **宮位與星曜分開解釋的結構**  
   - 若目標是「退回宮位、星曜分開解釋」：在 Findings 或 content 結構中明確區分「宮位層敘事」與「星曜層敘事」，並在模板與組裝流程中分開綁定，避免再次混在一起。

---

**報告結束。** 若需對某一節做程式級修補方案（含函式名與檔案位置），可指定章節再補。
