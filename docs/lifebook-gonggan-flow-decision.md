# 四化流向改為「宮干飛化」— 判斷與實作摘要

## 判斷結論

**方向正確，照此修正。**

- 目前 flow 來自 `overlapAnalysis.items[].transformations`，from/to 為前端或上游計算，可能含固定跳格（+4/+6/+8/+10）或混用，**非**「宮干飛化」。
- **宮干飛化**：每宮以**該宮宮干**查四化表 → 得祿/權/科/忌 四星 → 再查該星**在本命盤何宮** → 得到「從該宮出、入星所在宮」。此為正確模型。
- **本版實作範圍**：
  - **本命**：flows 僅存宮干飛化結果（建 `palaceStemMap`、`starsByPalace`、`buildGongGanFlows`），技術版／命書「從 X 宮出，入 Y 宮」只來自此。
  - **大限／流年**：暫不產「從 X 出入 Y」的 flow；只顯示「大限化祿落在：福德宮」等**四化落宮**，不混用層級四化當 flow。
- **必須移除／停用**：任何以 overlap 或舊 step 算出的 natal flow；不產生 `toPalace: null` 的邊。

## 資料與演算法分離

- **層級四化（transforms）**：本命年干／大限干／流年干 → 哪四顆星被點名；保留於 `chart.natal.transforms` 等，供「四化落宮」等使用。
- **宮干飛化（flows）**：每宮宮干 → 飛到哪一宮；僅 `chart.natal.flows` 存此結果，且僅來自 `buildGongGanFlows`。

## 宮干來源優先順序

1. 盤面既有：`chartJson.palaceStemMap` 或 `chartJson.ziwei.palaceStemMap`（若前端傳入）。
2. 命宮天干順推：`chartJson.ziwei.core.minggongStem` + 宮位索引 → 各宮干。
3. 年干 + 命宮地支推命宮天干，再順推（與前端 BaziCore 一致）；不可用大限／流年干當 fallback。

## 找不到星時

- `findPalaceByStar` 回傳 `null` 時，**不**產該條 flow，避免 `{ toPalace: null }` 髒資料。

---

## 已實作

- **worker/src/gonggan-flows.ts**：`GongGanFlow` 型別、`findPalaceByStar`、`buildPalaceStemMap`、`buildGongGanFlows`、`gongGanFlowsToTransformEdges`。使用既有 `SI_HUA_BY_STEM`（sihua-stem-table）。
- **normalizeChart**：建 `palaceStemMap`（優先 chart 既有、其次 `minggongStem` 順推、再次 bazi 年干+命宮地支推命宮天干後順推）；本命 `flows` 改為 `gongGanFlowsToTransformEdges(buildGongGanFlows({ layer: "natal", ... }))`；`currentDecade.flows`、`yearlyHoroscope.flows` 設為 `[]`。本命宮位 In/Out 改為依宮干飛化邊填入。
- **NormalizedChart**：新增 `palaceStemMap?: Record<string, string>`。
- **overlap**：仍用於 `birthTransforms`／`transforms`（層級四化）；**不再**用於本命 flow 內容，本命 flow 僅來自宮干飛化。
