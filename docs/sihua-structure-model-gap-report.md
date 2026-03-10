# 四化結構模型（Flow / Sink / Loop / Conflict）差異盤點報告

## 目標

對照「四化結構模型」目標能力，盤點現有系統具備的項目、資料流、輸出位置，列出差異（gap）、成本與風險，並提出分階段施作方案。

---

## A. 現況盤點

### A.1 四化資料來源與形態

| 項目 | 位置 | 說明 |
|------|------|------|
| **本命/大限/流年四化生成** | `worker/src/lifeBookPrompts.ts` | `buildSiHuaLayers(chartJson)`（約 999–1090 行）：若 `chartJson.sihuaLayers` 有 `benMing` / `daXianCurrent` / `liuNianCurrent` 的 `transforms[]`，直接使用；否則由 `chartJson.fourTransformations`（benming/decadal/yearly 的 `mutagenStars`）＋ `layerFromMutagen()` 推導每層祿/權/科/忌的星與落宮。 |
| **事件陣列（給引擎/規則用）** | 同上 | `buildS00EventsFromChart(chartJson)`（約 1105–1166 行）：產出 `SiHuaEvent[]`，每筆含 `layer`（natal/decade/year）、`transform`（lu/quan/ke/ji）、`starName`、`fromPalace`、`toPalace`。優先讀 `sihuaLayers.*.transforms`（含 `fromPalace`/`toPalace`）；若無則用 `buildSiHuaLayers` 結果，`fromPalace`＝星所在宮、`toPalace`＝`getOppositePalaceName(fromPalace)`。 |
| **星名化X → from宮/to宮** | 多處 | **有**：`buildS00EventsFromChart` 每筆即「星＋化X＋from/to」；`buildSiHuaLayers` 產出每層的 star+宮（palaceKey/palaceName）。**來源是否一致**：s00/s03 主要用 `buildSiHuaLayers` 與 `buildS00EventsFromChart`；s03 的 `sihuaMapping` 先看 `chartJson.sihuaLayers.benMing.transforms`（有 toPalace），否則用 `buildSiHuaLayers`＋`getOppositePalaceName`，兩路可能在不同 chart 結構下給出不同結果。 |
| **Normalize（星名/宮名）** | 多處 | **星名**：`worker/src/lifebook/canonicalKeys.ts` 的 `toStarName`；`STAR_ID_TO_DISPLAY_NAME` / `STAR_NAME_ZH_TO_ID` 用於 id↔顯示名。**宮名**：`normPalaceIdToName()`（lifeBookPrompts 約 1192 行）、`toPalaceCanonical()`（canonicalKeys）、engine 的 `toPalaceCanonical`；`PALACE_ID_TO_NAME` 做 id→中文。事件進入 engine 前會經 `normalizeSiHuaEvents`（`worker/src/engine/normalizeSiHuaEvents.ts`）轉成 canonical 宮/星。 |

### A.2 四化結構相關輸出

| 輸出 | 產生函式 / 位置 | 說明 |
|------|-----------------|------|
| **s00MainNarrative** | `lifeBookPrompts.ts` 約 2504–2506 行 | `generateNarrative(rawEvents)`（engine）→ `mainText`。Engine 用 `getMainHits` 取 Top1 R01、Top1 R02、最多 2 條 R11，組主文；**無** R03/R30 主文。 |
| **s00DominantPalaces** | 同上 2519–2524 行 | `detectDominantPalaces(chartJson, config, events)`（`dominantPalaceDetector.ts`）→ `formatDominantPalacesBlock(dominant)`。計分僅用「飛入該宮」的疊加（toPalace 方向），**無**「從該宮飛出」的 outScore。 |
| **siHuaPatternTopBlocks** | 同上 1894–1896 行 | `evaluateFourTransformPatterns(siHuaEvents)`（lifebook `s00PatternEngine.ts`，20 條規則 R01_SAME_STAR_OVERLAP～R20）+ `renderPatternHitsForModuleOne(..., 5, { forTechnicalOutput })`。s03 使用，標題「【四化慣性】」在 block 內。 |
| **sihuaMapping** | 同上 1615–1647 行 | 本命層：若存在 `chartJson.sihuaLayers.benMing.transforms` 則用其 `toPalace`；否則 `buildSiHuaLayers`＋`getOppositePalaceName(fromPalace)`。每行「星名化祿/權/科/忌 → 宮名」。`fromPalace` 為空或含「未知」則**跳過該行**，不輸出「未知宮位」。 |

**A宮→B宮敘述**：

- **有**：R11 類（如 engine 的 `detectR11`、lifebook 的 `R11_JI_FROM_A_TO_B`）產出「from→to」的句子（例如「壓力源頭在 A，顯化在 B」）。
- **形態**：目前是「規則命中 → 自然語句」，**不是**結構化 edge 陣列；沒有統一的 `edges: Array<{ fromPalace, toPalace, transformType, layer, starName }>` 再據此算分與敘述。

### A.3 Debug / 規則碼 / 驗收訊息處理

| 項目 | 現況 |
|------|------|
| **[Rxx_*] 是否進入 production** | **有條件**：`renderPatternHitsForModuleOne` 僅在 `forTechnicalOutput === true` 時在每條前加 `[${hit.ruleId}]`（patternHitRenderer 約 160、207、223 行）。s00/s03 組裝時 `skipDebugForSection = (sectionKey === "s00" \|\| sectionKey === "s03")`，故 `forTechnicalOutput: false`，**正常情境下不會**在 s00/s03 出現 ruleId。**額外防線**：`worker/src/index.ts` 在產出 s03 的 `structure_analysis` 時會再 filter 掉整行符合 `^\[R\d+_.*\]$` 的內容（約 1422、1707 行）。 |
| **「模組一驗收未通過」** | 同上，index 在 s03 會過濾整行符合 `^（模組一驗收未通過：.*）$`。若仍有他處寫入該字串，僅在未經此 filter 的 path 可能漏出。 |
| **未知宮位** | sihuaMapping 組裝時 `if (!fromPalace \|\| fromPalace.includes("未知")) continue`，**不輸出該行**。`layerFromMutagen` 在無法解析宮位時回傳 `null`，不寫入「未知」字樣。 |
| **Fallback 策略** | 無 toPalace 時：sihuaMapping 該條略過。buildS00EventsFromChart 在無 sihuaLayers 時用 `getOppositePalaceName(fromPalace)` 推 to；若 from 也無則 to 為空，事件仍會進陣列（engine normalizer 會記入 diagnostics）。 |

---

## B. 目標模型能力對照

### Flow

| 能力 | 現況 | 說明 |
|------|------|------|
| 四化可轉成 edge：`{ fromPalace, toPalace, transformType, layer, starName }` | **部分** | 事件已有 from/to/transform/layer/star，但**沒有**統一「Edge」型別與單一 `edges[]` 陣列；R11 等是「每條事件一 hit」，非先建 edges 再算分。 |
| 可計算 edgeScore（時間層權重 × 四化類型權重） | **未做** | 無統一 edge 物件，也就沒有「edgeScore」欄位或排序用分數。R11 僅用 severity（忌=3, 權=2, 其他=1），未乘層級權重。 |
| 可輸出 Top 2~3 條 flow（不同盤會不同） | **部分** | 主文取「最多 2 條 R11」；lifebook 20 條規則中有 R11_JI_FROM_A_TO_B 等，但非「先算 edgeScore 再取 Top 2~3 flow」的穩定介面。 |

### Sink / Source

| 能力 | 現況 | 說明 |
|------|------|------|
| 宮位 inScore / outScore（被指向 / 指向出去） | **僅 inScore 概念** | `detectDominantPalaces` 只依「飛入該宮」計分（toPalace＋層級×四化權重），**無** outScore（fromPalace 方向）。 |
| Top sinks（壓力/資源匯聚點） | **部分** | Dominant 宮即「分數高」的宮，概念接近 sink，但沒有明確「sink/source」名義與 in/out 分開計算。 |

### Loop

| 能力 | 現況 | 說明 |
|------|------|------|
| 在 palace graph 中找短迴路（長度 2～4） | **有** | Engine `patternDetectors.ts` 的 `detectR30`、lifebook `s00DetectorsV2.ts` 的 `detectR30` 都有建 adj、visit 找 cycle（2～4 宮）。 |
| 可輸出 Top 1~2 條 loop（或無 loop 的 fallback） | **未接上** | R30 在 engine 被視為「僅 debug」不進主文；lifebook 20 條規則**沒有** R30，故 siHuaPatternTopBlocks（s03）**不會**出現「能量環」類輸出。Loop 有算、沒進目標輸出。 |

### Conflict

| 能力 | 現況 | 說明 |
|------|------|------|
| 同宮祿忌（同宮既有機會又有壓力） | **有** | 規則 R05_SAME_PALACE_LU_JI，when 與 message 都有。 |
| 同星祿忌（同星同時扛資源+壓力） | **有** | 規則 R04_SAME_STAR_LU_JI；patternPhraseLibraryRuleTypes 有 `lu_ji_same_star`。 |
| 多層時間衝突（本命/大限/流年指向不同重點） | **部分** | R08/R09/R10 做「大限＋流年同步」敘述，**沒有**「多層指向不同宮位」的衝突標記與專用輸出。 |

---

## C. 差異清單（Gap List）

| Gap 名稱 | 現況 | 需改檔案/函式 | 估計成本 | 風險 | 驗收方式 |
|----------|------|----------------|----------|------|----------|
| **G1. Edge 物件化** | 未做：四化未統一成 edges 陣列 | 新增 `types.ts` 的 `SiHuaEdge`；在 lifeBookPrompts 或 engine 由 `buildS00EventsFromChart` 結果建 `edges[]`（fromPalace, toPalace, transformType, layer, starName） | M | 低 | 單元測試：同一 chart 產出 edges 條數與事件數一致；from/to 與既有事件一致 |
| **G2. Edge scoring** | 未做：無可調權重排序最強 flow | 在 edge 上算 `edgeScore = layerWeight[layer] * transformWeight[transform]`；新增「取 Top 2~3 flow」函式並回傳結構化列表 | S | 低 | 不同命盤 Top flow 不同；權重可配置 |
| **G3. Sink/Source 分數** | 僅有「疊」與 to 方向計分 | 由 edges 算每宮 `inScore`（指向該宮的 edgeScore 和）、`outScore`（從該宮指出的 edgeScore 和）；可沿用/擴充 dominantPalaceDetector 或新模組 | M | 低 | 每宮 in/out 數值合理；Top sinks 與現有 dominant 可對照 |
| **G4. Short loop 輸出** | 有 R30 計算、未進 s03/s00 主輸出 | 將 R30（或 s00DetectorsV2 的 loop）結果納入 lifebook 規則或單獨 block；s03 增加「能量環」段落或 placeholder（Top 1~2 條）；無 loop 時 fallback 句 | M | 中 | s03 有 loop 時出現 1~2 條；無 loop 時不出錯、有 fallback 句 |
| **G5. Conflict 模型完整** | 同宮/同星祿忌有；多層衝突無 | 定義「多層指向不同重點」條件（例如本命忌 A、流年祿 B 且 A≠B）；可新規則或擴充 R08/R09/R10；輸出建議句 | S～M | 中 | 有衝突盤產出衝突描述；無則不亂報 |
| **G6. Production 清洗機制** | 部分：s03 有 line filter；forTechnicalOutput 控制 [ruleId] | 統一入口：所有最終給使用者的字串都經一層「清洗」（移除 `[R\d+_.*]`、`模組一驗收未通過`、`未知宮位`）；或文件約定「僅經 getPlaceholderMap / getSectionTechnicalBlocks 的 path 才可輸出」 | S | 低 | 搜尋 codebase 無直接拼接上述字串到 production 的 path；E2E 檢查 s00/s03 無規則碼與驗收句 |

---

## D. 施作提案（分階段）

### 會新增/改動的輸出（placeholder 或 block）

- **v1**：`sihuaEdges`（或內部 `edges`）、`topFlows`（Top 2~3 條 flow 文案或結構）。
- **v2**：`sinkScores` / `topSinks`（可選 placeholder）、`loopSummary`（Top 1~2 條 loop 或 fallback 句）。
- **v3**：`conflictSummary`（多層衝突時一句）、必要時擴充 s00/s03 的既有 block 引用上述欄位。

### 會影響的章節

- **s00**：可選在「全盤結構判讀」或「命盤主戰場」引用 topFlows / topSinks / loopSummary（brief）。
- **s03**：最適合在「四化慣性」區塊加入「主要流向」「能量環」「壓力匯聚」等，引用 topFlows、loopSummary、topSinks。

### 避免 debug 混入 production

- 所有新 block 僅在「已清洗」或 `forTechnicalOutput: false` 的 path 填入 placeholder。
- 不在新輸出中寫入 ruleId、驗收訊息、未知宮位；若需技術版，另欄位或另 endpoint。

---

## E. 分階段方案（v1 / v2 / v3）

### v1（Flow 基礎）— 可驗收

- **目標**：Edge 物件化 + Edge scoring + Top 2~3 flow 輸出。
- **產出**：  
  - 統一 `SiHuaEdge[]` 與 `buildSihuaEdges(events)`（或由既有 events 轉）。  
  - `edgeScore = f(layer, transform)`，可配置權重。  
  - `getTopFlows(edges, 3)` 回傳結構化 Top 2~3。  
- **輸出**：新 placeholder 如 `topFlowsBlock`（或併入既有 block），s03（可選 s00）引用。  
- **驗收**：單測 edge 數與 score 一致；不同盤 Top flow 不同；s03 文案出現 2~3 條流向且無 [Rxx]。

### v2（Sink + Loop 輸出）— 可驗收

- **目標**：inScore/outScore、Top sinks、Short loop 納入正式輸出。
- **產出**：  
  - 由 edges 算每宮 inScore/outScore；Top N sinks。  
  - 沿用現有 R30 或 s00DetectorsV2 的 loop 結果，產出 `loopSummary`（Top 1~2 條或「本盤未見明顯能量環」）。  
- **輸出**：`topSinksBlock`、`loopSummary`；s03 四化區塊引用。  
- **驗收**：有 loop 的盤出現 1~2 條；無 loop 有 fallback；s00/s03 無 ruleId/debug。

### v3（Conflict 與清洗統一）— 可驗收

- **目標**：多層衝突描述、production 清洗單一化。
- **產出**：  
  - 多層指向不同重點的判斷與一句 `conflictSummary`。  
  - 統一清洗：所有最終輸出的 structure_analysis / 主文 經同一 filter（或唯一出口），移除 [Rxx]、模組驗收句、未知宮位。  
- **輸出**：`conflictSummary`（可選）；文件與 code 約定「production 僅經此出口」。  
- **驗收**：有衝突盤有描述；無不誤報；全站搜尋確認無漏寫 debug 的 path。

---

## F. 可能踩坑與對策

| 風險點 | 對策 |
|--------|------|
| **Mapping 來源不一致 → 未知宮位** | 約定：s00/s03 的「四化宮位」單一來源（建議以 `buildSiHuaLayers`＋`buildS00EventsFromChart` 為準）；sihuaMapping 與 edge 的 toPalace 都從此來源推；無法解析則 skip，不寫「未知宮位」。 |
| **Fallback 到全盤造成結果同質** | 節奏引擎已限「命/財/官/遷」；Flow/Sink 建議也限「有 edge 的宮位」或「命財官遷＋有飛星」再算分，避免全盤平均化。 |
| **Placeholder 自帶標題 vs skeleton 再包一次** | s03 已改為 placeholder 內含標題、skeleton 不重複包；新 block（topFlows、loopSummary）比照：**標題放在 block 內**，skeleton 只做前後文、不重複標題。 |
| **Debug（[Rxx_] / 驗收未通過）混入** | 新程式一律不寫 [Rxx_] / 驗收句進使用者可見字串；v3 統一清洗出口；保留 forTechnicalOutput 僅在技術/除錯 endpoint 使用。 |

---

## G. 總結：目標模型核心能力缺漏

- ❌ **Edge 物件化**：四化未統一成 `edges[]`（from/to/type/layer/star）。  
- ❌ **Edge scoring**：無可調權重排序最強 flow。  
- ❌ **Sink/Source 分數**：無 inScore/outScore（目前只有「飛入」疊加）。  
- ❌ **Short loop 輸出**：有 R30 計算，但未進 s03/s00 主輸出。  
- ⚠️ **Conflict**：同星/同宮祿忌已有；多層時間衝突未完整。  
- ⚠️ **Production 清洗**：s03 有 line filter、forTechnicalOutput 控制 [ruleId]，但未做到「單一出口、全站一致」清洗。

以上已納入 gap 表與 v1/v2/v3 施作方案，每個版本皆可單獨驗收並降低重複輸出與 debug 漏出風險。
