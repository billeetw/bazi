# 四化引擎在命書的落實方式

## 執行狀態

- **測試**：`cd worker && npm run test` → 26 個測試全過（含 engine 6 檔 + 既有 s00-pipeline）
- **建置**：`cd worker && npm run build` → Worker 可正常打包（含 `worker/data/*.json` 與 engine）

## 命書中哪裡用到

四化引擎的輸出會填進 **s00 章節**（「這一局，你為什麼要來？」）的 placeholder，由 `getPlaceholderMapFromContext()` 在 `worker/src/lifeBookPrompts.ts` 裡組好，再交給命書模板／API 使用。

### 資料流

1. **輸入**：`opts.chartJson`（命盤 JSON）  
   - 與先前相同，仍用 `buildS00EventsFromChart(opts.chartJson)` 產出四化事件（`layer`, `transform`, `starName`, `fromPalace`, `toPalace`）。

2. **新引擎**（`worker/src/engine/`）  
   - `generateNarrative(rawEvents)`：  
     - 內部：normalize → detect（R01/R02/R03/R11/R30）→ merge（去重、R11 優先因果命中）→ 字典查表  
     - 回傳：`mainText`、`debug`、`diagnostics`、`mergedHits`

3. **主文與建議**  
   - **s00MainNarrative** ← `narrativeResult.mainText`  
     - 由引擎依字典（星曜諮詢、宮位四化、因果矩陣）組出主文，**不含** ruleId／raw。  
   - **s00YearlyAdvice** ← `buildDecisionAdviceFromHits(narrativeResult.mergedHits)`  
     - 從 R11 因果命中的 `decisionTags` 彙總權重，產出最多 3 條建議、每條最多 2 句。  
     - 若引擎沒有建議，則退回原本的 `buildS00YearlyAdvice(hotStars, hotPalaces)`。

4. **技術／Debug 區塊**  
   - **s00DebugEvidence** ← `formatS00DebugFromEngine(narrativeResult.debug, narrativeResult.diagnostics)`  
     - 內容：每個 hit 的 ruleId、evidenceCount、causalityMatch、canonicalKey，以及 diagnostics（missingFields、unresolvedPalaceKey、unresolvedStarName、emptyReason）。

5. **主戰場宮位**（沿用既有邏輯）  
   - **s00DominantPalaces** ← 仍用既有 `normalizeSiHuaEventsLegacy`（lifebook 的 normalizer）把 raw events 轉成 `NormalizedSiHuaEvent[]`，再呼叫 `detectDominantPalaces` + `formatDominantPalacesBlock`。  
   - 這樣主戰場計分與格式不變，只把「主文」與「今年建議」換成新引擎產出。

### Placeholder 對照

| Placeholder           | 來源 |
|----------------------|------|
| `s00MainNarrative`   | 新引擎 `generateNarrative(...).mainText` |
| `s00YearlyAdvice`    | 新引擎 `buildDecisionAdviceFromHits(mergedHits)`，無則用舊 `buildS00YearlyAdvice` |
| `s00DebugEvidence`   | 新引擎 `formatS00DebugFromEngine(debug, diagnostics)` |
| `s00DominantPalaces` | 既有 `detectDominantPalaces` + `formatDominantPalacesBlock`（用 legacy normalizer 的 events） |

其餘 s00 相關 placeholder（如 `s00HotStars`、`s00PatternNarrative`、`s00NarrativeBlocks` 等）仍由既有 `evaluateFourTransformPatterns`、`getHotStarsAndPalaces`、`renderNarrativeBlocksAsString` 等填寫，**未改**。

## 小結

- **主文**：改由新四化引擎 + 字典 + 因果矩陣產出，R11 有因果命中時用 consultation/advice，否則用 fallback 句。  
- **今年建議**：改由新引擎的 `decisionEngine` 從 R11 因果命中的 `decisionTags` 彙總成最多 3 條。  
- **Debug／主戰場**：Debug 用新引擎的 debug + diagnostics；主戰場仍用既有 normalizer + 主戰場偵測，確保行為一致。  
- 命書其餘章節與 API 呼叫方式不變，僅 s00 的上述幾個 placeholder 改填新引擎結果。
