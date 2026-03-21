# Phase P0.3：s15a / s16 render 驗收報告（靜態＋渲染檢查）

**範圍**：`worker/content/lifebookSection-zh-TW.json`、`worker/src/lifeBookPrompts.ts`、`worker/tests/lifebook-v2-reason.test.ts`，及 s15a/s16 相關 assembler。**僅盤點，未修改任何檔案。**

---

## 1. s15a / s16 新增 placeholder 填值路徑盤點

### s15a

| placeholder | 來源 | 寫入 map 位置 | V2 無值時 | 「template 已引用但常拿不到值」風險 |
|-------------|------|----------------|-----------|-------------------------------------|
| minorFortuneTimelineTable | fallback | getPlaceholderMapFromContext，chartJson.minorFortuneByPalace → timelineRows | 有 chart 就有；無 minor 則空 | 低（依 chart 是否有小限表） |
| overlapSummary | V2（hasStacks）／fallback（overlap） | V2: buildS15aPlaceholderMapFromV2；fallback: 同函式內 `!(s15a && s15aV2Usable)` 時寫入 | **V2 usable 但僅 hasScores/hasEvents 時 fallback 被跳過，V2 又只在 hasStacks 時寫 → 空** | **高**（V2 僅 scores/events 時整段空） |
| timeWindowScoresSummary | V2 only | buildS15aPlaceholderMapFromV2（hasScores） | 無 timeWindowScores 則空 | 中（依 V2 是否有 timeWindowScores） |
| eventProbabilitiesSummary | V2 only | buildS15aPlaceholderMapFromV2（hasEvents） | 無 eventProbabilities 則空 | 中（依 V2 是否有 eventProbabilities） |
| shockCount / mineCount / wealthCount | V2（hasStacks）／fallback（overlap） | 同上，V2 或 fallback 寫入 | **V2 usable 但無 hasStacks 時 fallback 不寫 → 空字串** | **高**（同上，統計會變成「 個宮位」） |
| shockBlocks / mineBlocks / wealthBlocks | V2（hasStacks）／fallback（overlap） | V2: blocksFromStackSignals；fallback: buildOverlapDetailBlocks | V2 無 stacks 且 fallback 被跳過 → 空 | 高（與 overlapSummary 同情境） |
| keyYearsDecisionTimeline | fallback only | getPlaceholderMapFromContext，decisionMatrix + minor → formatXiaoXianDecisionTimeline | 無 decisionMatrix 或無 minor 則 "" | 中（依 content + chart） |

### s16

| placeholder | 來源 | 寫入 map 位置 | V2 無值時 | 「template 已引用但常拿不到值」風險 |
|-------------|------|----------------|-----------|-------------------------------------|
| flowYearMingPalace / flowYearSihuaLine | fallback / P2 axis | timeModuleYearKeys 區塊 buildTimeModuleDisplayFromChartJson；P2 時 axis | 無 liunian/yearlyHoroscope 時可能「（無流年…）」 | 低 |
| yearTimeWindowScoresSummary | V2 only | buildS16PlaceholderMapFromV2（hasYearScores） | 無 year 維度 timeWindowScores 則空 | 中 |
| yearEventProbabilitiesSummary | V2 only | buildS16PlaceholderMapFromV2（hasYearEvents） | 無 year 維度 eventProbabilities 則空 | 中 |
| yearPathsSummary | V2 only | buildS16PlaceholderMapFromV2（hasYearPaths） | 無 triggeredPaths(year) 則空 | 中 |
| yearlyFourTransformSummary | V2（hasYearEdges）／fallback | V2: buildS16；fallback: **僅在 !s16V2Usable 時** buildFourTransformBlocksForPalace | **s16 V2-primary 時由 V2 寫；V2 無 edges 則空，且 fallback 不跑** | 中（V2 無 transformEdges 時整段空） |
| yearRoleInDecade | fallback | getPlaceholderMapFromContext，getYearRoleInDecadeAndWhy | 總會寫 | 低 |
| **yearDecisionSummaryBlock** | **fallback only** | getPlaceholderMapFromContext，decisionMatrix + yearly → buildYearDecisionSummary；**寫入條件為 !(s16 && s16V2Usable)** | **s16 V2-primary 時 fallback 不寫，V2 builder 也不產此 key → 一定空** | **高**（V2 路徑下永遠空） |
| yearOneLineAdvice | fallback | getRoleTakeaway(roleResult.role) | 總會寫 | 低 |

**小結**  
- **s15a**：V2 usable 但只有 scores/events（無 stackSignals）時，overlapSummary、shock/mine/wealth 全不寫，會出現「整體節奏」空段＋「統計摘要」數字與三區塊全空。  
- **s16**：V2-primary 時 `yearDecisionSummaryBlock` 從未寫入（fallback 被關閉、V2 不產），template 必為空。

---

## 2. structure_analysis 靜態推演（V2-primary vs fallback）

### s15a

- **V2-primary（hasStacks + hasScores + hasEvents）**  
  - 有值：minorFortuneTimelineTable（chart）、overlapSummary、timeWindowScoresSummary、eventProbabilitiesSummary、統計摘要與三區塊、keyYearsDecisionTimeline（若有 decisionMatrix+minor）。  
  - 最可能完整、閱讀連貫。

- **V2-primary（僅 hasScores 或僅 hasEvents，無 hasStacks）**  
  - 有值：minorFortuneTimelineTable、timeWindowScoresSummary 和／或 eventProbabilitiesSummary。  
  - **空**：overlapSummary、shockCount/mineCount/wealthCount、shockBlocks/mineBlocks/wealthBlocks。  
  - 結果：「整體節奏」段空、「統計摘要」為「劇烈震盪： 個宮位…」、三個區塊空，易顯得殘缺、重複標題無內容。

- **fallback**  
  - 有值：minorFortuneTimelineTable（有 minor 時）、overlapSummary（有 overlap 時）、統計與三區塊、keyYearsDecisionTimeline（有 decisionMatrix+minor 時）。  
  - **空**：timeWindowScoresSummary、eventProbabilitiesSummary（僅 V2 產，fallback 不寫）。  
  - 結果：導語「從時間窗評分來看…」「若從事件機率來看…」後接空內容（replace 為 ""）。

### s16

- **V2-primary**  
  - 有值：flowYearMingPalace、flowYearSihuaLine、yearRoleInDecade、yearOneLineAdvice；若 V2 有則 yearTimeWindowScoresSummary、yearEventProbabilitiesSummary、yearPathsSummary、yearlyFourTransformSummary。  
  - **一定空**：yearDecisionSummaryBlock（見上）。  
  - 結果：「做決策時，可以優先抓住這個摘要：」後無內容。

- **fallback**  
  - 有值：flowYearMingPalace、flowYearSihuaLine、yearRoleInDecade、yearOneLineAdvice、yearlyFourTransformSummary（chart 有流年四化時）、yearDecisionSummaryBlock（decisionMatrix + yearly 時）。  
  - 空：yearTimeWindowScoresSummary、yearEventProbabilitiesSummary、yearPathsSummary（僅 V2 產）。

---

## 3. 閱讀不自然風險

- **s15a**  
  - **整體節奏（overlapSummary）與統計摘要＋三區塊重複**：兩處都在講震盪/地雷/機會的數量與區塊；V2 有 stacks 時兩段都有內容，易重複感。  
  - **導語＋空內容**：fallback 時「從時間窗評分來看…」「若從事件機率來看…」後為空；V2 僅 scores/events 時「整體節奏」段空、「統計摘要」與三區塊空，形成空標題＋空段落。  
  - **統計摘要數字缺漏**：V2 usable 且無 stacks 時 shockCount/mineCount/wealthCount 未寫，會變成「劇烈震盪： 個宮位；超級地雷： 個；大發財機會： 個。」語句殘缺。

- **s16**  
  - **決策摘要段必空（V2-primary）**：「做決策時，可以優先抓住這個摘要：」後永遠無內容，語句懸空。  
  - **多段導語＋空內容**：fallback 或 V2 缺某維度時，年度分數／事件機率／路徑／四化摘要等段落可能僅有導語、無內文（replace 為 ""），連續多段空會不自然。

---

## 4. 下一步最值得修的 3 件事

| # | 問題 | 影響 | 建議修法 |
|---|------|------|----------|
| 1 | **s16 V2-primary 時 yearDecisionSummaryBlock 永遠為空**（fallback 被關閉、V2 不產此 key） | 「做決策時，可以優先抓住這個摘要：」後無內容，閱讀斷裂。 | **builder 微調**：buildS16PlaceholderMapFromV2 在 usable 時也產出 yearDecisionSummaryBlock（可從 decisionMatrix + chart 當年簡化產出，或從既有 time decision 邏輯抽一層共用）；或 **fallback 微調**：s16 在 V2-primary 時仍允許寫入 yearDecisionSummaryBlock（僅此 key 不因 s16V2Usable 而跳過）。 |
| 2 | **s15a V2 usable 但無 stackSignals 時 overlapSummary 與 shock/mine/wealth 全空**（fallback 整塊被跳過） | 「整體節奏」段空、「統計摘要」數字與三區塊空，版面與語意殘缺。 | **fallback 微調**：s15a 在 s15aV2Usable 時，若 V2 map 未提供 overlapSummary / shockCount 等，仍用現有 overlap 邏輯補寫這些 key（僅在 map 尚未有值時寫入），避免 V2 只有 scores/events 時整段消失。 |
| 3 | **多處「導語＋空內容」**（timeWindowScoresSummary、eventProbabilitiesSummary、yearPathsSummary 等僅單一來源） | 讀者看到小標與導語後沒有內文，體感像缺料或 bug。 | **template 微調**：對「僅 V2 有、fallback 常無」的段落，改為條件式呈現（例如用一個複合 placeholder 在 builder 端組好「有則導語+內文，無則一句簡短說明或隱藏」）；或 **builder 微調**：fallback 路徑對這些 key 產出「（本年度無時間窗／事件機率／路徑資料，可參照上方流年與四化）」等固定短句，避免完全空白。 |

---

## 精簡清單

### s15a render 風險

- overlapSummary／shock/mine/wealth 在「V2 usable 但無 stackSignals」時全空，整體節奏＋統計＋三區塊皆空或數字缺漏。  
- timeWindowScoresSummary、eventProbabilitiesSummary 僅 V2 產，fallback 時導語後空內容。  
- 整體節奏與統計摘要＋三區塊語意重複，有 stacks 時易顯冗餘。

### s16 render 風險

- yearDecisionSummaryBlock 在 V2-primary 下永遠空（fallback 不寫、V2 不產）。  
- yearTimeWindowScoresSummary、yearEventProbabilitiesSummary、yearPathsSummary 僅 V2 產，fallback 或 V2 缺維度時導語後空內容。  
- 多段「導語＋空內容」連在一起時閱讀不自然。

### 下一步最值得修的 3 件事

1. **s16 yearDecisionSummaryBlock 在 V2 路徑為空** → builder 或 fallback 微調，讓 V2-primary 時也有一行決策摘要。  
2. **s15a V2 僅 scores/events 時 overlap 與三區塊全空** → fallback 微調：V2 未提供時仍用 overlap 補寫 overlapSummary 與 shock/mine/wealth。  
3. **導語＋空內容** → template 或 builder 微調：單一來源 placeholder 在無值時改為短句說明或條件隱藏，避免整段空白。
