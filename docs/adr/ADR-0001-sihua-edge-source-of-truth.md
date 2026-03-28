# ADR-0001：四化 Edge（TransformEdge）單一真相來源

- **狀態**：Accepted（Phase 0）
- **日期**：2026-03-24
- **相關計劃**：[`../lifebook-four-edge-truth-rollout-plan.md`](../lifebook-four-edge-truth-rollout-plan.md)

## 情境

四化「流向」若同時從 `overlapAnalysis.items` 的幾何與各層 `mutagenStars` 的星名拼湊，會出現**混源**（星名對、邊錯）。需單一真相來源，供推理、章節、驗證與 CI 一致依循。

## 決策

1. **整條四化邊**（`starName`、`transform`、`fromPalace`、`toPalace`、層級）的**唯一事實來源**為：  
   **`normalizeChart(chartJson)` 產出之 `NormalizedChart` 內各層 `flows`**（本命／大限／流年等欄位以 `worker/src/lifebook/normalizedChart.ts` 為準）。
2. **採用路線 B（Worker 權威重建 edge）**：邊由 normalize 管線與宮干／盤面邏輯產出；**不得**再使用「overlap 給 from/to + mutagenStars 補 starName」的混合模式。
3. **`overlapAnalysis` 保留用途**（非 edge 權威）：
   - 標籤／摘要／風險列表（如 `criticalRisks`、`maxOpportunities`、`volatileAmbivalences`）供 signals、決策矩陣與文案補強；
   - **不**作為四化邊幾何或流向敘事的最終依據。
4. **`chartJson.sihuaLayers`（客戶端 wire）**：維持 deprecated，僅比對／除錯；權威為 `buildSiHuaLayers`（見 `docs/lifebook-sihua-single-source-phase1.md`）。

## 後果

- **正面**：敘事與 `validateTransformEdgeConsistency` 與同一套 `flows` 對齊；可對混源路徑做 code review 拒絕。
- **負面**：上游若仍大量依賴 overlap 視覺化邊，需改為消費 Worker 輸出或調整產品預期。
- **驗證**：CI 必須執行 `validateTransformEdgeConsistency` 相關測試；可選 `LIFEBOOK_STRICT_TRANSFORM_EDGES=1` 擋嚴重不一致。

## 審閱與修訂

若未來改採**路線 A**（上游提供完整 edge、Worker 僅驗證），須另開 ADR 修訂本決策，並更新 `validateTransformEdgeConsistency` 與契約。

---

## 附錄：盤點快照（`worker/src`，2026-03-24）

以下為 **overlap 仍出現之處**與用途（**非**完整邊權威者已註明）：

| 位置 | 用途 |
|------|------|
| `lifeBookInfer.ts` | 傳遞 `overlapAnalysis` 至下游推論脈絡 |
| `lifeBookPrompts.ts` | slice 可含 overlap；註釋已明：**四化流向正文**只讀 findings / `NormalizedChart.*.flows` |
| `timeModuleOverlapSnapshot.ts` | 讀 `items` 的 **palaceKey / palaceName / tag**（非 transformations） |
| `findings/buildLifebookFindings.ts` | 讀 overlap 作 **OverlapInput**（與 findings 組裝，邊以 chart 為準） |
| `engines/signals/signalsEngine.ts` | **criticalRisks / maxOpportunities / volatileAmbivalences** → 顏色訊號 |
| `normalize/normalizeTransforms.ts` | **明確廢止**從 `overlapAnalysis.items[].transformations` 讀取 |
| `overlapDetailBlocks.ts` | 註釋不讀舊 overlap transformations，改接 overlay 新資料 |
| `sectionDataDependencyMap.ts` | 文件化各章 **secondary** 仍參考 overlap；**逐章應改為 flows 優先**（見 rollout 計劃 Phase 3） |
| `index.ts` | API 回傳 `overlap_analysis` 供除錯／舊客戶端 |

**結論**：`transformations` 從 overlap 讀邊的路徑已**不**作為 normalize 來源；剩餘 overlap 使用多為 **tag／風險／快照**，與本 ADR 一致。後續 Phase 3 應把 dependency map 與章節模板收斂為 **flows 優先**。

**時間模組／宮位測試（Phase 3 範例）**

- `worker/tests/s17EdgeAuthority.test.ts`：`s17EdgeAuthority`、毒化 overlap 不改 `palaceOverlayBlocks`（同一 `NormalizedChart`）。
- `worker/tests/s18EdgeAuthority.test.ts`：`s18EdgeAuthority`（與 s17 同源）、毒化 overlap 不改 `s18SignalsBlocks`。
- `worker/tests/s19EdgeAuthority.test.ts`：S19 `meta.edgeAuthority`、毒化 overlap 不改主線輸出。
- `worker/tests/palaceFlowsAuthority.test.ts`：毒化 overlap 不改 `findings.natalFlowItems`（財帛／官祿等宮位章節所依之 findings）。
- `worker/tests/flowTransformAuthority.test.ts`：毒化 overlap 不改 `buildTransformFlowLines`／`getFlowBlockForPalace`（僅依 `NormalizedChart.*.flows`）。

**s05／s09 掃描（prompt／template／技術版，2026-03-24）**

- **`worker/content/lifebookSection-zh-TW.json`**：`s05`／`s09` 與其他宮位章節共用同一套 palace 骨架占位（`palaceOverview`…`palaceAdvice`），**無**以 overlap 承載四化邊之占位。
- **`worker/src/lifeBookPrompts.ts`**：宮位技術版／宮干飛化（`buildTechDebugForPalace`、`getFlowBlockForPalace`／findings 路徑）已註明只讀 **flows／findings**，與 `sectionDataDependencyMap` 中 s05／s09 之 **primary：`natalFlowItems`** 一致；overlap 僅作 secondary 標籤（見上表）。
- **`worker/src/lifebook/lifeModel/formatTechnicalBlocks.ts`**：S22／S23 結構線／轉化流格式化，**非** s05／s09 專屬，且不讀 overlap 邊。
