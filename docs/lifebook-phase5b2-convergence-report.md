# Phase 5B-2 四化／飛化讀取路徑收斂實作回報

本輪依 Phase 5B-1 盤點結果，將 **12 宮正文**、**技術版/debug**、**模組二疊宮** 三區改為只讀 Findings（`findings.sihuaPlacementItems`、`findings.natalFlowItems`），不新增命理算法、不修改 s00/s03、不修改 Findings 結構。

---

## 一、12 宮正文：已改為 Findings 的讀取點

| 讀取點 | 原本 | 現在 |
|--------|------|------|
| **主星旁「化祿／化忌」標註** | `getNatalSihuaForStar(starName, chartJson)`，讀 `chartJson.fourTransformations.benming.mutagenStars` | 有 `opts?.findings` 時改為 `getNatalSihuaForStarFromFindings(starName, findings)`，只讀 `findings.sihuaPlacementItems`（layer === "natal"） |
| **palaceStarsOnlySnippet 的 getNatalSihua** | 同上，chart 直讀 | 同上，優先 FromFindings |
| **非 isPalaceSection 的 pureStarLines 內 natalSihua** | `getNatalSihuaForStar(s.name, chartJson)` | 有 findings 時 `getNatalSihuaForStarFromFindings(s.name, findings)`，否則保留 chart 路徑 |

**實作細節**

- 新增 `getNatalSihuaForStarFromFindings(starName, findings)`：自 `findings.sihuaPlacementItems` 篩選 `layer === "natal"`，依 `starName` 回傳對應標籤（化祿／化權／化科／化忌）。
- `getPlaceholderMapFromContext` 內：`getNatalSihua` 在 `opts?.findings != null` 時改為呼叫 FromFindings，否則維持 `getNatalSihuaForStar(starName, chartJson)` 相容路徑。
- **四化落宮**：12 宮【動態引動與根因】原本就已用 `buildSihuaFlowSummary({ currentPalace, findings })`／`buildMingGongSihuaPlacementOnly(findings)`，本輪未改。
- **本命宮干飛化**：同上，已只讀 `findings.natalFlowItems`，本輪未改。

---

## 二、技術版 / debug：已改為 Findings 的讀取點

| 讀取點 | 原本 | 現在 |
|--------|------|------|
| **【本命宮干飛化（本宮）】區塊** | `getFlowBlockForPalace(chart, ctx.palaceName)`，chart 來自 `normalizeChart(chartJson)` | 有 `opts?.findings` 時改為 `buildNatalFlowBlockFromFindings(findings, ctx.palaceName)`，只讀 `findings.natalFlowItems` |
| **【FLOW_DEBUG】區塊** | `buildFlowDebugEntries(chart)`，讀 `chart.natal?.flows` 等 | 有 findings 時改為 `buildFlowDebugEntriesFromFindings(findings)`，只讀 `findings.natalFlowItems` |
| **星曜詳解內主星「化X」標註** | `getNatalSihuaForStar(s.name, chartJson)` | 有 findings 時 `getNatalSihuaForStarFromFindings(s.name, findings)` |

**實作細節**

- 新增 `buildNatalFlowBlockFromFindings(findings, palaceName)`：依 `findings.natalFlowItems` 篩選該宮（from/to 含該宮），產出與 `getFlowBlockForPalace` 等價之「本命星化X：從A出，入B」多行字串。
- 新增 `buildFlowDebugEntriesFromFindings(findings)`：自 `findings.natalFlowItems` 產出與 `buildFlowDebugEntries(chart)` 相同形狀的 `FlowDebugEntry[]`（layer 固定 "natal"）。
- `buildTechDebugForPalace` 新增參數 `opts?.findings`；若存在則上述兩區塊與主星化X 皆改為只讀 findings，否則保留原有 chart 路徑。
- `getSectionTechnicalBlocks` 呼叫 `buildTechDebugForPalace` 時傳入 `findings`，使技術版在有 findings 時不再依賴 chart。

---

## 三、模組二疊宮：已改為 Findings 的讀取點

| 讀取點 | 原本 | 現在 |
|--------|------|------|
| **每宮【四化流向】文字** | `formatOverlapBlockItem(it, chart)` 內使用 `getFlowBlockForPalace(chart, item.palaceName)` | `BuildOverlapDetailBlocksOpts` 新增 `findings`；`formatOverlapBlockItem(item, chart, findings)` 在 `findings != null` 時改為 `buildNatalFlowBlockFromFindings(findings, item.palaceName)`，不再用 chart 產出本命宮干飛化 |

**實作細節**

- `formatOverlapBlockItem` 簽名改為 `(item, chart?, findings?)`。有 findings 時：`flowText = buildNatalFlowBlockFromFindings(findings, item.palaceName) || getFlowTransformationsText(item.transformations)`，不再呼叫 `getFlowBlockForPalace(chart, ...)`。
- `buildOverlapDetailBlocks`：opts 新增 `findings?: LifebookFindings`；僅在 `opts.findings == null` 時才 `normalizeChart(opts.chartJson)` 取得 chart；`formatGroup` 改為傳入 `findings`。
- 模組二 placeholder 組裝處（`getPlaceholderMapFromContext` 內 timeModuleKeys 區塊）呼叫 `buildOverlapDetailBlocks(overlap, { ..., findings: opts.findings })`，使疊宮在 P2 路徑有 findings 時只讀 findings。

---

## 四、可標記 deprecated 的舊路徑（本輪僅標記、未移除）

| 項目 | 說明 |
|------|------|
| **getNatalSihuaForStar(starName, chartJson)** | 12 宮正文與技術版在有 findings 時已改用 FromFindings；保留供無 findings 相容，可於文件註解標「優先改用 getNatalSihuaForStarFromFindings」。（已於註解標示 Phase 5B-2） |
| **formatOverlapBlockItem 的 chart 參數** | 有 findings 時不再使用 chart 產出本命宮干飛化；無 findings 時仍用 chart，chart 參數可標記為「無 findings 時相容用」。 |
| **buildTechDebugForPalace 內 chart 路徑** | 有 findings 時已不走 `normalizeChart` / `getFlowBlockForPalace` / `buildFlowDebugEntries(chart)`；無 findings 時之 chart 路徑可標為相容用。 |

---

## 五、未改動範圍（依本輪規範）

- **s00、s03**：未修改。
- **buildSiHuaContext**：未修改，仍為全域高階路徑。
- **無 findings 時的相容 fallback**：保留；12 宮、技術版、疊宮在無 findings 時仍可選用 chart。
- **normalizeChart、buildGongGanFlows、Findings 結構、四化算法**：未修改。

---

## 六、TypeScript / lint 結果

- **lifeBookPrompts.ts**：已補上遺漏常數 `FLOWS_NOT_VERIFIED_MESSAGE`（技術版 flowsNotVerified 時顯示用）；其餘修改通過 lint。
- **專案整體**：`npx tsc --noEmit` 仍有多處既有錯誤（其他檔案，如 engine、lifebook/s00PatternEngine、crossChart 等），非本輪修改引入。本輪僅變更 `lifeBookPrompts.ts`，且未新增型別錯誤。

---

## 七、修改檔案清單

| 檔案 | 變更摘要 |
|------|----------|
| **worker/src/lifeBookPrompts.ts** | 新增 `getNatalSihuaForStarFromFindings`、`buildNatalFlowBlockFromFindings`、`buildFlowDebugEntriesFromFindings`；新增常數 `FLOWS_NOT_VERIFIED_MESSAGE`；12 宮 getNatalSihua 改為優先 Findings；`buildTechDebugForPalace` 支援 findings 並改為只讀 findings 產出飛化／DEBUG；`formatOverlapBlockItem` 與 `buildOverlapDetailBlocks` 支援 findings，疊宮本命宮干飛化改為只讀 findings；模組二呼叫 `buildOverlapDetailBlocks` 時傳入 `opts.findings`；`getSectionTechnicalBlocks` 傳 findings 給 `buildTechDebugForPalace`。 |
| **worker/src/lifeBookPrompts.ts**（import） | 自 `buildTransformFlowLines.js` 新增匯入 `type FlowDebugEntry`。 |

---

*Phase 5B-2 收斂實作完成。*
