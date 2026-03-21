# Phase 5B-7：12 宮動態引動區塊接線修復報告

## 任務 1：palaceSihuaSummaryBlock 是否真的來自 buildSihuaFlowSummary？

**結論：是。**

- **命宮（s02）**：`palaceSihuaSummaryBlock` 來自 `buildMingGongSihuaPlacementOnly(opts?.findings)`，**只顯示四化落宮**（`sihuaPlacementItems`），不顯示本命宮干飛化。
- **其餘 11 宮**：`palaceSihuaSummaryBlock` 來自 `map.sihuaFlowSummary`，而 `map.sihuaFlowSummary` 由 **`buildSihuaFlowSummary({ currentPalace: ctx.palaceName, findings: opts?.findings ?? createEmptyFindings() })`** 產出。

接線位置：`worker/src/lifeBookPrompts.ts` 約 2743–2759 行：

```ts
map.sihuaFlowSummary = buildSihuaFlowSummary({
  currentPalace: ctx.palaceName ?? "",
  findings: opts?.findings ?? createEmptyFindings(),
});
// ...
map.palaceSihuaSummaryBlock = isMingGong
  ? buildMingGongSihuaPlacementOnly(opts?.findings ?? createEmptyFindings())
  : (map.sihuaFlowSummary ?? "").trim() || SIHUA_FLOW_EMPTY_MESSAGE;
```

讀者路徑會用 `getPlaceholderMapFromContext(ctx, { ..., findings })` 取得上述 map，再以 `resolveSkeletonPlaceholders(sectionSkeleton.structure_analysis, placeholderMap)` 解析模板，故 **【動態引動與根因】** 區塊內容即為 `palaceSihuaSummaryBlock`，其餘 11 宮確實由 `buildSihuaFlowSummary` 產出。

---

## 任務 2：buildSihuaFlowSummary 是否同時處理 sihuaPlacementItems 與 natalFlowItems？

**結論：有。**

`buildSihuaFlowSummary` 內部：

1. **sihuaPlacementItems**：依 `currentPalace` 過濾 `targetPalace`（以 `toPalaceDisplayName` 正規化後比對），有則輸出「本宮受到{層級}的{星}化{祿/權/科/忌}引動。」
2. **natalFlowItems**：依 `fromPalace` / `toPalace` 是否命中本宮過濾（同樣用 `toPalaceDisplayName`），有則輸出：
   - 本宮飛出：`本宮宮干化出{星}化{化}，飛入並牽動了【{目標宮}】。`
   - 飛入本宮：`來自【{來源宮}】的{星}化{化}飛入本宮，帶來直接影響。`
3. **Fallback**：僅當 `relevantTransforms.length === 0 && relevantFlows.length === 0` 時回傳 `SIHUA_FLOW_EMPTY_MESSAGE`（固定空白句）。

程式已同時處理兩者，並在兩者皆無時才回傳空白句，沒有「先建好再被 fallback 覆蓋」的邏輯錯誤。

---

## 任務 3：子女宮、夫妻宮、父母宮 debug 輸出

已在 `buildSihuaFlowSummary` 內加入 **Phase 5B-7 debug**（僅在 `currentPalace` 正規化後為 子女宮、夫妻宮、父母宮 時打 log）：

- `currentPalace` / `palaceCanon`
- `findings.natalFlowItems.length` / `findings.sihuaPlacementItems.length`
- `matchedPlacementItems` / `matchedNatalFlowItems`
- `sampleFlows`：前 5 筆 flow 的 from / to / star / transform
- `finalBuiltLines`：實際輸出的行陣列
- `outputIsEmpty`：是否為 fallback 空白句

請求 12 宮任一宮（尤其是子女宮、夫妻宮、父母宮）時，看 console 的 `[buildSihuaFlowSummary Phase5B-7]` 即可判斷：

- 若 `findings.natalFlowItems.length === 0` → findings 沒有本命宮干飛化資料（上游 chart / normalize 未產出）。
- 若 `natalFlowItems.length > 0` 但 `matchedNatalFlowItems === 0` → 宮名比對有問題（例如別名 奴僕 vs 僕役）。
- 若 `matchedNatalFlowItems > 0` 且 `finalBuiltLines` 有內容但畫面上仍是空白 → 問題在 placeholder 解析或讀者路徑未使用 `resolvedStructureAnalysis`（Phase 5B-6 已修）。

---

## 任務 4：規格與最小修正

### 規格（已符合）

| 宮位 | 【動態引動與根因】內容 | 實作 |
|------|------------------------|------|
| 命宮 | 僅四化落宮（sihuaPlacementItems） | `buildMingGongSihuaPlacementOnly(findings)` |
| 其餘 11 宮 | 四化落宮 + 本命宮干飛化（from/to 命中本宮的 natalFlowItems） | `buildSihuaFlowSummary`（placement + flows） |
| 兩者皆無時 | 固定空白句 | `relevantTransforms.length === 0 && relevantFlows.length === 0` 時 return `SIHUA_FLOW_EMPTY_MESSAGE` |

**結論：規格已正確接線，無需改邏輯。**

### 若 12 宮仍全部顯示空白句，可能原因與最小修正

1. **findings 未傳入**  
   - 讀者路徑：`getPalaceSectionReaderOverrides(..., p2.findings)`、`getPlaceholderMapFromContext(ctx, { ..., findings })` 已接好；單宮與 batch 皆用 `p2.findings`。  
   - 若 `buildP2FindingsAndContext(chart)` 回傳 `findings: null`（例如 chart 無效），則會用 `createEmptyFindings()`，此時 12 宮都會是空白句。  
   - **最小修正**：確認請求的 `chart_json` 可讓 `buildLifebookFindingsFromChartAndContent` 成功產出 findings（含 `natalFlowItems`）。

2. **findings.natalFlowItems 為空**  
   - `natalFlowItems` 來自 `normalizeChart(chartJson).natal.flows`，而 `natal.flows` 由 `gongGanFlowsToTransformEdges(buildGongGanFlows(...))` 產出，需要 `chartJson` 能提供 `palaceStemMap`（或可推導之命宮天干）與 `starsByPalace`（星曜落宮）。  
   - 若前端送出的 chart 缺少上述資料，`natal.flows` 會是 `[]`，導致所有宮位都只會看到四化落宮或空白句。  
   - **最小修正**：確認請求的 chart 包含可建出 `palaceStemMap` 與 `getStarByPalaceFromChart` 的結構（例如 ziwei / 宮位星曜），使 `normalizeChart` 能產出 `natal.flows`。

3. **宮名不一致**  
   - 目前以 `toPalaceDisplayName` 統一成「X宮」再比對；若 findings 內為「僕役宮」而模板/ctx 為「奴僕宮」，可能不匹配。  
   - 若 debug 出現 `natalFlowItems.length > 0` 但 `matchedNatalFlowItems === 0`，再考慮在過濾時同時支援 奴僕/僕役 等別名。

---

## 回報摘要

| 項目 | 結果 |
|------|------|
| palaceSihuaSummaryBlock 是否接到 buildSihuaFlowSummary？ | **是**（命宮除外，命宮用 buildMingGongSihuaPlacementOnly） |
| buildSihuaFlowSummary 是否有處理 natalFlowItems？ | **有**（過濾 from/to 命中本宮並輸出飛入/飛出句） |
| 子女宮/夫妻宮/父母宮有 flow 卻仍空白可能原因？ | (1) findings 為 null 或 createEmptyFindings()；(2) findings.natalFlowItems 為 []（chart 未產出 natal.flows）；(3) 宮名比對不一致（可依 debug 再查） |
| 最小修正方案 | 接線與規格已正確；若仍空白，請依 Phase 5B-7 debug log 確認 `natalFlowItems.length` 與 `matchedNatalFlowItems`，並確保請求 chart 能產出 `natal.flows`（含 palaceStemMap、starsByPalace）。 |

---

## 變更檔案

- **worker/src/lifeBookPrompts.ts**
  - 移除舊的 Phase 5B-3 通用 debug log。
  - 在 `buildSihuaFlowSummary` 尾端新增 Phase 5B-7 針對 **子女宮、夫妻宮、父母宮** 的 debug log（currentPalace、matched counts、sampleFlows、finalBuiltLines、outputIsEmpty）。
