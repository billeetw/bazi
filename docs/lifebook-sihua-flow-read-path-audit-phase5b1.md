# 四化／飛化讀取路徑全域收斂盤點報告（Phase 5B-1）

本報告盤點 Lifebook 系統中所有「四化」與「飛化」相關的讀取點，依章節分類，並標示是否已接 Findings、是否仍直讀 chart/overlap，最後提出收斂建議。**本輪僅盤點，不修改程式碼。**

---

## 2026-03 更新（與現況對齊）

- **buildSiHuaLayers**：權威為 **normalizeChart 落宮 + fourTransformations.mutagenStars**（及大限／流年 resolver）。**不讀** `chartJson.sihuaLayers` 作為輸出；該欄位僅供與 worker 比對（diff，需 env）。可選 **`chartJson.lifebookSiHuaDisplayOverride`**（Phase 3：audit + 部分層覆寫），見 `docs/lifebook-sihua-single-source-phase1.md`。
- **buildSiHuaContext**：列表與各宮摘要來自 **fourTransformations + findings**，不依賴 `sihuaLayers` wire。

---

## 一、四化／飛化讀取點總表

### 1. 四化落宮相關

| 模組／函式 | 所在檔案 | 用途 | 所屬區域 | 已接 Findings？ | 仍讀 chart？ | 仍讀 overlap？ | 備註 |
|-----------|----------|------|----------|-----------------|--------------|---------------|------|
| **buildSiHuaLayers** | lifeBookPrompts.ts | 從 chartJson 產出 **BuiltSiHuaLayers**（祿權科忌落宮）；normalize + mutagen；可選 lifebookSiHuaDisplayOverride 合併 | 多處共用 | 否 | 是 | 間接（mutagen 來自 chart；落宮來自 NormalizedChart） | **不採用** wire `sihuaLayers`；底層 builder |
| **getSihuaByLayerLines** | lifeBookPrompts.ts | 分層列出本命／大限／流年祿權科忌落宮（除錯用） | 技術版／debug | 否 | 是（經 buildSiHuaLayers） | — | 僅內部使用，未見對外呼叫 |
| **getSihuaPalaceListsFromLayers** | lifeBookPrompts.ts | 推導「祿權科忌各落在哪些宮位」清單 | 模組二（時間） | 否 | 是（經 buildSiHuaLayers） | — | 被 buildSihuaEnergyFocusBlock 呼叫 |
| **buildSiHuaContext** | lifeBookPrompts.ts | 四化高階 context（benMingSiHuaList、perPalaceFlow 等） | 全域 placeholder（含 12 宮、s00、s03） | 否 | 是 | — | 列表來自 fourTransformations；perPalaceFlow 來自 findings + buildSihuaFlowSummary；**不讀** sihuaLayers wire |
| **getSihuaPlacementItemsFromChart** | lifeBookPrompts.ts | 從 chart 產出結構化 sihuaPlacementItems | Findings 組裝（index） | — | 是 | — | **僅**在 buildP2FindingsAndContext / 產出 Findings 時呼叫，寫入 findings.sihuaPlacementItems |
| **getTransformsByLayer** | normalizeTransforms.ts | 從 overlap 產出 natal/decade/year TransformEdge[] | normalizeChart | — | — | 是（overlapAnalysis.items[].transformations） | 正規化層，產出給 NormalizedChart |
| **buildTransformEdgesFromOverlap** | normalizeTransforms.ts | 同上，底層實作 | normalizeTransforms.ts | — | — | 是 | getTransformsByLayer 內部呼叫 |

### 2. 飛化相關

| 模組／函式 | 所在檔案 | 用途 | 所屬區域 | 已接 Findings？ | 仍讀 chart？ | 仍讀 overlap？ | 備註 |
|-----------|----------|------|----------|-----------------|--------------|---------------|------|
| **chart.natal.flows** | buildLifebookFindings.ts, buildTransformFlowLines.ts, buildNatalGongganFlowBlock 等 | 本命宮干飛化邊（fromPalace→toPalace, starName, transform） | Findings 組裝、12 宮技術版、模組二 | 是（Findings 組裝寫入 natalFlowItems） | 是（技術版、疊宮、模組二 fallback 仍讀 chart） | — | normalizeChart 產出；buildLifebookFindings 讀取並寫入 findings.natalFlowItems |
| **chart.currentDecade.flows** | buildTransformFlowLines.ts, getFlowBlockForPalace, buildFlowDebugEntries | 大限層飛化邊 | 12 宮技術版、疊宮 | 否 | 是 | — | 目前 normalizeChart 設為 []，未產出 |
| **chart.yearlyHoroscope.flows** | 同上 | 流年層飛化邊 | 同上 | 否 | 是 | — | 目前 normalizeChart 設為 []，未產出 |
| **getFlowBlockForPalace** | buildTransformFlowLines.ts | 依 chart 三層 flows 產出單宮【四化流向】區塊 | 12 宮技術版、疊宮（formatOverlapBlockItem） | 否 | 是（NormalizedChart） | — | 12 宮技術版 buildTechDebugForPalace、疊宮 buildOverlapDetailBlocks→formatOverlapBlockItem 使用 |
| **buildTransformFlowLines** | buildTransformFlowLines.ts | 依 chart 三層 flows 產出 natal/decade/year 流向字串陣列 | 被 formatTransformFlowBlocks、getFlowBlockForPalace 使用 | 否 | 是 | — | 底層 |
| **formatTransformFlowBlocks** | buildTransformFlowLines.ts | 產出「本命宮干飛化」區塊字串（模組二用） | 模組二（若直讀 chart 時） | 否 | 是 | — | 目前呼叫點未在本次 grep 顯現，可能經其他路徑 |
| **buildTopFlowsBlock** | sihuaFlowEngine.ts | 從 SiHuaEventForFlow[] 產出 Top 流向區塊文字 | s03（buildWholeChartContext） | 否 | 間接（events 來自 buildS00EventsFromChart(chart)） | — | s03 專用，events 由 chart 推導 |
| **buildSihuaEdges** | sihuaFlowEngine.ts | 從 SiHuaEventForFlow[] 產出 SiHuaEdge[] | s03、s00（buildPiercingDiagnosticBundle） | 否 | 間接（同上） | — | 穿透診斷、s03 四化慣性／能量環 |

### 3. 其他相關（overlap / 時間軸）

| 模組／函式 | 所在檔案 | 用途 | 所屬區域 | 已接 Findings？ | 仍讀 chart？ | 仍讀 overlap？ |
|-----------|----------|------|----------|-----------------|--------------|----------------|
| **buildS00EventsFromChart** | lifeBookPrompts.ts | 從 chart 產出三層四化事件陣列（SiHuaEvent[]） | s00、s03、穿透診斷 | 否 | 是（buildSiHuaLayers） | — |
| **buildPiercingDiagnosticBundle** | lifeBookPrompts.ts | 穿透式診斷包（tensions, rootCauses, reframes） | s00、s03 | 否 | 是 | — |
| **buildSihuaFallByPalaceBlock** | lifeBookPrompts.ts | 四化落宮核心資料段（本命／大限／流年各一組） | 模組二、Findings 時間區塊 | 可（P2 時讀 findings.sihuaPlacement） | 是（無 findings 時） | — |
| **buildSihuaEnergyFocusBlock** | lifeBookPrompts.ts | 祿權科忌「主要落在：宮A、宮B」 | 模組二、Findings 時間區塊 | 可（P2 時讀 findings.sihuaEnergy） | 是（無 findings 時） | — |
| **buildNatalGongganFlowBlock** | lifeBookPrompts.ts | 本命宮干飛化區塊（X宮化Z，飛星名，入W宮） | 模組二、Findings 時間區塊 | 可（P2 時讀 findings.natalFlows） | 是（normalizeChart + chart.natal.flows） | — |
| **buildOverlapDetailBlocks** | lifeBookPrompts.ts | 疊宮三組（劇烈震盪／地雷／機會）＋每宮四化流向 | 模組二（s15/s15a/s16/…） | 否 | 是（formatOverlapBlockItem 用 getFlowBlockForPalace(chart)） | 是（overlapAnalysis.items） |
| **buildTimeModuleDisplayFromChartJson** | lifeBookPrompts.ts | 時間軸顯示（birthSihuaLine, currentDecadeSihuaLine, flowYearSihuaLine 等） | s00、模組二 fallback | 可（P2 時用 findings.timeAxis） | 是（fourTransformations, overlap, liunian…） | 是 |
| **buildSihuaTimeBlocksFromChart** | lifeBookPrompts.ts | 產出 SihuaTimeBlocks（timelineSummary, sihuaPlacement, sihuaEnergy, natalFlows, timeAxis） | index（寫入 findings） | — | 是 | — | 僅 Worker 產出 Findings 時呼叫；命書組裝層應只讀 findings |

---

## 二、按章節分類

### 2.1 12 宮正文

| 讀取點 | 資料來源 | 是否已接 Findings |
|--------|----------|-------------------|
| **palaceSihuaSummaryBlock**（【動態引動與根因】） | buildSihuaFlowSummary({ currentPalace, findings }) | ✅ 是，只讀 findings.sihuaPlacementItems + findings.natalFlowItems |
| 命宮專用 **mingGongSihuaSummary** | buildMingGongSihuaPlacementOnly(findings) | ✅ 是，只讀 findings.sihuaPlacementItems |
| **getNatalSihuaForStar**（主星旁標化祿化忌等） | chartJson.fourTransformations.benming.mutagenStars | ❌ 仍直讀 chart |
| **buildSiHuaContext** 填入的 map（sihuaFlowForPalace, benMingSiHuaList 等） | buildSiHuaContext(opts.chartJson) | ❌ 仍直讀 chart（opts?.chartJson 時） |

### 2.2 s00

| 讀取點 | 資料來源 | 是否已接 Findings |
|--------|----------|-------------------|
| **buildSiHuaLayers**（benmingSiHuaLine, decadalSiHuaLine, yearlySiHuaLine 等） | buildSiHuaLayers(opts.chartJson) | ❌ 仍直讀 chart |
| **buildS00EventsFromChart** → evaluateFourTransformPatterns, getHotStarsAndPalaces | buildS00EventsFromChart(opts.chartJson) | ❌ 仍直讀 chart |
| **buildSiHuaContext**（同上） | buildSiHuaContext(opts.chartJson) | ❌ 仍直讀 chart |
| **buildTimeModuleDisplayFromChartJson**（flowYear 等） | chartJson（decadalLimits, yearlyHoroscope, fourTransformations…） | ❌ 仍直讀 chart（無 findings 時） |

### 2.3 s03

| 讀取點 | 資料來源 | 是否已接 Findings |
|--------|----------|-------------------|
| **buildS03GlobalContext** 內 sihuaMapping | buildSiHuaLayers(chartJson) 或 chart.layers?.benMing?.transforms | ❌ 仍直讀 chart |
| **buildWholeChartContext**（siHuaEvents, siHuaPatterns, sihuaTopFlowsBlock, buildSihuaEdges…） | buildS00EventsFromChart(chart) → buildTopFlowsBlock / buildSihuaEdges | ❌ 仍直讀 chart |
| **buildPiercingDiagnosticBundle**（s03PiercingDiagnosisBlock） | buildS00EventsFromChart(chart) → buildSihuaEdges | ❌ 仍直讀 chart |
| **buildSiHuaContext**（同上） | buildSiHuaContext(opts.chartJson) | ❌ 仍直讀 chart |

### 2.4 模組二（時間模組 / s15、s15a、s16、s17、s18、s19、s20、s21）

| 讀取點 | 資料來源 | 是否已接 Findings |
|--------|----------|-------------------|
| **injectTimeModuleDataIntoSection** 有 options.findings 時 | findings.timeAxis, findings.sihuaPlacement, findings.sihuaEnergy, findings.natalFlows | ✅ 是，P2 路徑只讀 findings |
| **injectTimeModuleDataIntoSection** 無 findings 時（相容層） | buildSihuaFallByPalaceBlock(chartJson), buildSihuaEnergyFocusBlock(chartJson), buildNatalGongganFlowBlock(chartJson), buildTimeModuleDisplayFromChartJson(chartJson) | ❌ 仍直讀 chart |
| **getPlaceholderMapFromContext** 模組二區塊（overlap 疊宮） | opts.chartJson.overlapAnalysis / overlap, buildOverlapDetailBlocks(overlap, { chartJson… }) | ❌ 仍直讀 chart + overlap；formatOverlapBlockItem 用 getFlowBlockForPalace(chart) |
| **buildSihuaTimeBlocksFromChart**（僅 Worker 產出 Findings 時） | buildSihuaFallByPalaceBlock, buildSihuaEnergyFocusBlock, buildNatalGongganFlowBlock | 寫入 findings，不給正文直讀 chart 用 |

### 2.5 技術版／debug 區塊

| 讀取點 | 資料來源 | 是否已接 Findings |
|--------|----------|-------------------|
| **buildTechDebugForPalace**（【本命宮干飛化（本宮）】） | getFlowBlockForPalace(chart, ctx.palaceName), buildFlowDebugEntries(chart) | ❌ 仍直讀 chart（normalizeChart(chartJson)） |
| **getSihuaByLayerLines** | buildSiHuaLayers(chartJson) | ❌ 仍直讀 chart（目前僅內部使用） |

### 2.6 其他（疊宮／palace 摘要區塊）

| 讀取點 | 資料來源 | 是否已接 Findings |
|--------|----------|-------------------|
| **buildOverlapDetailBlocks** → **formatOverlapBlockItem** | getFlowBlockForPalace(chart, item.palaceName) 或 getFlowTransformationsText(item.transformations) | ❌ 仍直讀 chart（疊宮每宮四化流向） |
| **overlapAnalysis / overlap**（items, criticalRisks, maxOpportunities, volatileAmbivalences） | chartJson.overlapAnalysis ?? chartJson.overlap | ❌ 仍直讀 overlap（模組二疊宮、s00 等） |

---

## 三、已接 Findings vs 仍直讀 chart/overlap 彙整

### 已改為只讀 Findings 的讀取點

- **12 宮正文**  
  - **palaceSihuaSummaryBlock**：buildSihuaFlowSummary 只讀 findings.sihuaPlacementItems + findings.natalFlowItems。  
  - **命宮**：buildMingGongSihuaPlacementOnly 只讀 findings.sihuaPlacementItems。
- **模組二（P2 路徑）**  
  - injectTimeModuleDataIntoSection 在傳入 options.findings 且 findings.timeAxis / sihuaPlacement 存在時，只讀 findings（timeAxis, sihuaPlacement, sihuaEnergy, natalFlows），不再呼叫 buildSihuaFallByPalaceBlock / buildSihuaEnergyFocusBlock / buildNatalGongganFlowBlock(chartJson)。

### 仍直接讀 chart 的讀取點

- **全域 placeholder（opts?.chartJson）**  
  - buildSiHuaContext(opts.chartJson) → map.benMingSiHuaList, map.sihuaFlowForPalace 等，所有 section 共用。  
- **12 宮**  
  - getNatalSihuaForStar(starName, chartJson) → chartJson.fourTransformations.benming.mutagenStars。  
- **s00**  
  - buildSiHuaLayers(opts.chartJson)、buildS00EventsFromChart(opts.chartJson)、buildTimeModuleDisplayFromChartJson 等。  
- **s03**  
  - buildS03GlobalContext、buildWholeChartContext、buildPiercingDiagnosticBundle 皆用 chart 推導四化／飛化相關內容。  
- **模組二（無 findings 相容層）**  
  - buildSihuaFallByPalaceBlock(chartJson)、buildSihuaEnergyFocusBlock(chartJson)、buildNatalGongganFlowBlock(chartJson)、buildTimeModuleDisplayFromChartJson(chartJson)。  
- **技術版**  
  - buildTechDebugForPalace → getFlowBlockForPalace(chart), buildFlowDebugEntries(chart)。  
- **疊宮**  
  - formatOverlapBlockItem(it, chart) → getFlowBlockForPalace(chart, item.palaceName)。

### 仍直接讀 overlap 的讀取點

- **buildSiHuaContext**：列表與 perPalaceFlow 來自 **fourTransformations + findings／buildSihuaFlowSummary**；**不讀** `chartJson.sihuaLayers` wire。  
- **getTransformsByLayer / buildTransformEdgesFromOverlap**：overlapAnalysis.items[].transformations → NormalizedChart 的 decade/year transforms。  
- **buildOverlapDetailBlocks**：overlapAnalysis.items（或 criticalRisks / maxOpportunities / volatileAmbivalences）。  
- **模組二 placeholder**：opts.chartJson.overlapAnalysis ?? opts.chartJson.overlap（疊宮統計與明細）。  
- **buildTimeModuleDisplayFromChartJson**：流年四化 fallback 會參考 overlap 的 transformations.liunian。

### 歷史殘留／僅寫入 Findings 不給正文直讀

- **getSihuaPlacementItemsFromChart**：僅在 index buildP2FindingsAndContext 時呼叫，寫入 findings.sihuaPlacementItems；正文不應再呼叫。  
- **buildSihuaTimeBlocksFromChart**：僅在 index 產出 findings 時呼叫，寫入 findings 時間／四化區塊；命書組裝層契約為只讀 findings。

---

## 四、收斂建議

### A. 可立即收斂到 Findings 的

| 項目 | 說明 |
|------|------|
| **12 宮 getNatalSihuaForStar** | 主星旁「化祿／化忌」等標註目前用 chartJson.fourTransformations.benming.mutagenStars。可改為由 findings 提供「星→化X」對照（或從 findings.sihuaPlacementItems / natalFlowItems 推導），避免 12 宮正文再讀 chart。 |
| **模組二疊宮「四化流向」** | formatOverlapBlockItem 內 getFlowBlockForPalace(chart, item.palaceName) 可改為依 findings.natalFlowItems（＋未來若有 decade/year flow items）按宮位篩選後組裝區塊，不再傳 chart 進 formatOverlapBlockItem。 |
| **技術版【本命宮干飛化（本宮）】** | buildTechDebugForPalace 可改為依 findings.natalFlowItems 篩選該宮後產出文字，不再呼叫 getFlowBlockForPalace(chart)、buildFlowDebugEntries(chart)；若需保留 FLOW_DEBUG 結構，可改為從 findings 或專用 debug 結構組裝。 |

### B. 暫時保留 chart / overlap 的

| 項目 | 說明 |
|------|------|
| **s00** | 依賴 buildS00EventsFromChart、evaluateFourTransformPatterns、buildSiHuaLayers、buildTimeModuleDisplayFromChartJson 等高階四化事件與時間軸；目前 Findings 未涵蓋「四化規則命中（pattern hits）」「hot stars/palaces」「s00 時間軸原子欄位」等完整結構。若要把 s00 全面改為只讀 findings，需先在 Findings 或 timeAxis 中擴充對應欄位並由 Worker 寫入。 |
| **s03** | 依賴 buildWholeChartContext 的 siHuaEvents、siHuaPatterns、sihuaTopFlowsBlock、buildSihuaEdges、buildPiercingDiagnosticBundle 等，屬整盤四化慣性與高階診斷。Findings 目前無「全盤四化事件陣列」「pattern hits」「穿透診斷包」等；若未來要收斂，需在 Findings 或專用 context 中產出並寫入，再由 s03 只讀該 context。 |
| **模組二（無 findings 相容層）** | 當未傳 options.findings 或 findings 缺少 timeAxis/sihuaPlacement 時，仍從 chart 計算。保留此 fallback 可支援未走 P2 的舊路徑或除錯；若全線強制 P2，可考慮標記為 deprecated 並逐步移除。 |
| **buildSiHuaContext（全域 map）** | 目前所有 section 在 opts?.chartJson 時都會拿到 buildSiHuaContext(chartJson) 的結果（benMingSiHuaList、sihuaFlowForPalace 等）。要收斂需：要么在 Findings 中提供等價欄位並改為只讀 findings，要么改為僅在仍需要 chart 的 section（如 s00、s03）呼叫，其餘從 findings 組裝。 |

### C. 可標記 deprecated 的模組

| 項目 | 說明 |
|------|------|
| **getSihuaByLayerLines** | 僅內部使用、且為除錯用分層列印；可標記 deprecated，或保留僅供技術版／開發除錯。 |
| **直接從 chart 組裝「本命宮干飛化」的舊路徑** | buildNatalGongganFlowBlock(chartJson) 在「無 findings」時仍用 normalizeChart + chart.natal.flows；若 P2 全線覆蓋，此路徑可標記為相容用 deprecated。 |
| **formatOverlapBlockItem 的 chart 參數** | 改為依 findings 組裝後，傳 chart 的呼叫可標記 deprecated。 |

---

## 五、建議的全域收斂順序

1. **12 宮正文**  
   - 將 getNatalSihuaForStar 改為由 findings 或 findings 推導的「星→化X」對照提供，使 12 宮正文完全不再讀 chart 四化。  
   - 可選：將 buildSiHuaContext 中與「單宮」相關的欄位（如 sihuaFlowForPalace）改為從 findings.sihuaPlacementItems / natalFlowItems 推導，僅在無 findings 時 fallback 到 buildSiHuaContext(chartJson)。

2. **技術版／debug**  
   - buildTechDebugForPalace 改為只讀 findings.natalFlowItems（＋必要時 findings.sihuaPlacementItems）產出【本命宮干飛化（本宮）】與 FLOW_DEBUG，不再呼叫 getFlowBlockForPalace(chart)、buildFlowDebugEntries(chart)。

3. **模組二疊宮**  
   - buildOverlapDetailBlocks / formatOverlapBlockItem 改為接受 findings（或已組好的「宮位→流向文字」map），依 findings.natalFlowItems 等組裝每宮四化流向，不再傳 chart 與 getFlowBlockForPalace。

4. **模組二時間軸／四化區塊**  
   - 已具 P2 路徑；可將「無 findings」分支標記為相容用，並在文件／註解中註明正式路徑為只讀 findings。

5. **s00 / s03**  
   - 在 Findings（或專用 context）中擴充「四化規則命中」「全盤四化事件」「穿透診斷」「s00 時間軸原子」等欄位，由 Worker 寫入；再將 s00、s03 改為只讀這些欄位，不再呼叫 buildS00EventsFromChart、buildWholeChartContext、buildSiHuaContext 等直讀 chart/overlap 的 builder。

6. **buildSiHuaContext 全域替換**  
   - 最後階段：要麼在 Findings 提供等價欄位並讓 getPlaceholderMapFromContext 只讀 findings，要麼縮小 buildSiHuaContext 的呼叫範圍至僅 s00/s03，其餘 section 一律從 findings 組裝。

---

## 六、normalizeChart 與 Findings 補充說明

- **normalizeChart**：產出 `NormalizedChart`，其中 `natal.flows` 來自 `gongGanFlowsToTransformEdges(buildGongGanFlows(...))`（宮干飛化）；`currentDecade.flows` 與 `yearlyHoroscope.flows` 目前為 `[]`。
- **buildLifebookFindings**：讀取 `chart.natal?.flows`（或 birthTransforms），寫入 `findings.natalFlowItems`，結構為 `{ fromPalace, toPalace, starName, transform }[]`。
- **index（P2）**：`findings.sihuaPlacementItems = getSihuaPlacementItemsFromChart(chartJson)`；時間／四化區塊由 `buildSihuaTimeBlocksFromChart(chartJson)` 寫入 findings（timelineSummary, sihuaPlacement, sihuaEnergy, natalFlows, timeAxis）。  
因此，**本命宮干飛化** 已存在於 normalizeChart → natal.flows 與 buildLifebookFindings → findings.natalFlowItems；收斂重點在於**正文與技術版／疊宮不再直讀 chart，改為只讀 findings（及必要時 timeAxis）**。

---

*報告完成。未修改任何程式碼。*
