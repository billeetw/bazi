# s15a Assembler Patch 草稿：先讀 findingsV2 primary，缺則 fallback

Batch 1 最小閉環：s15a 章節組裝改為「先讀 SECTION_V2_TARGET_MAP.s15a.primary，缺則沿用既有 chart/overlap」。

---

## 1. 目標行為

- **有 findingsV2 且具備 primary 欄位**（stackSignals、timeWindowScores、eventProbabilities 至少其一有資料）時，s15a 的 placeholder map 優先由 V2 產出，不執行既有「minor fortune overlap recompute、criticalRisks 彙總、buildOverlapDetailBlocks」等邏輯。
- **無 findingsV2 或 primary 皆空**時，維持現有邏輯：從 `chartJson.minorFortuneByPalace`、`chartJson.overlapAnalysis`、`buildOverlapDetailBlocks` 產出 shockBlocks、mineBlocks、wealthBlocks、minorFortuneTable、keyYearsDecisionTimeline 等。
- **fallback 保留**：content.decisionMatrix 仍用於決策建議文案；chart 在 V2 缺欄時唯讀補齊（見下）。

---

## 2. 改動位置

### 2.1 `worker/src/lifeBookPrompts.ts` — getPlaceholderMapFromContext

在 **timeModuleKeys.includes(opts?.sectionKey)** 且 **opts?.sectionKey === "s15a"** 的區塊**最前面**插入：

```ts
// s15a Batch 1：先讀 findingsV2 primary，缺則 fallback
if (opts?.sectionKey === "s15a") {
  const findingsV2 = (opts as { findingsV2?: LifebookFindingsV2 }).findingsV2;
  const v2Result = buildS15aPlaceholderMapFromV2(findingsV2);
  if (v2Result.usable) {
    for (const [k, v] of Object.entries(v2Result.map)) map[k] = v;
    // 仍須補 minorFortuneTable / minorFortuneTimelineTable / keyYearsDecisionTimeline 若 V2 未提供
    // 若 V2 未提供時間表，保留底下的 chart/minor fallback 僅填 table 與 decision timeline
  }
}
```

- **import**：`import { buildS15aPlaceholderMapFromV2 } from "./lifebook/v2/assembler/buildS15aMapFromV2.js";` 以及 `LifebookFindingsV2`。
- **後續既有區塊**：當 `v2Result.usable === true` 時，可選擇 **跳過** shockCount/mineCount/wealthCount 與 buildOverlapDetailBlocks 的計算，僅在 map 尚未有 `minorFortuneTable`、`minorFortuneTimelineTable`、`keyYearsDecisionTimeline` 時，仍從 `opts.chartJson.minorFortuneByPalace` 與 `content.decisionMatrix` 填表與決策時間軸（fallback）。

### 2.2 呼叫端傳入 findingsV2

- **index.ts**（或任何呼叫 getPlaceholderMapFromContext / getSectionTechnicalBlocks 的地方）：若本次請求有執行 V2 Reasoner 並產出 findingsV2，則將 findingsV2 一併傳入 opts，例如 `opts.findingsV2 = findingsV2`。
- 若未執行 V2 或 findingsV2 為空，不傳即可；getPlaceholderMapFromContext 內 `buildS15aPlaceholderMapFromV2(undefined)` 會回傳 `usable: false`，整段 fallback 至既有邏輯。

---

## 3. 保留的 fallback（不刪除）

| 來源 | 用途 |
|------|------|
| **chartJson.minorFortuneByPalace** | 當 V2 未提供時間表時，填 map.minorFortuneTable、map.minorFortuneTimelineTable。 |
| **chartJson.overlapAnalysis** | 僅在 usable === false 時用於 shockCount/mineCount/wealthCount 與 buildOverlapDetailBlocks。 |
| **content.decisionMatrix** | 決策建議文案與 keyYearsDecisionTimeline 的標籤；V2 不取代此 content。 |

---

## 4. 可刪除的邏輯（僅在 usable === true 時跳過）

- 從 overlapAnalysis.items / criticalRisks / maxOpportunities / volatileAmbivalences 彙總 shockCount、mineCount、wealthCount 與 palaceToTag（**僅 s15a 且 usable 時**）。
- 呼叫 buildOverlapDetailBlocks(overlap, …) 產出 shockBlocks、mineBlocks、wealthBlocks（**僅 s15a 且 usable 時**）。

其餘 time module 共用邏輯（如 decadalLimitsList、flowYear 等）不刪，照常執行。

---

## 5. 新增檔案（已實作）

- **worker/src/lifebook/v2/assembler/buildS15aMapFromV2.ts**
  - `buildS15aPlaceholderMapFromV2(findingsV2)`: 依 stackSignals、timeWindowScores、eventProbabilities 產出 s15a 用的 map 片段；無 primary 資料時回傳 `{ usable: false, map: {} }`。

---

## 6. Section assembler input schema（與合約一致）

s15a 組裝時建議傳入：

```ts
interface S15aAssemblerInput {
  section_key: "s15a";
  findings: LifebookFindings;
  findingsV2?: LifebookFindingsV2;  // 有則優先 primary
  chartJson?: Record<string, unknown>;  // fallback：minorFortuneByPalace, overlapAnalysis
  content?: { decisionMatrix?: DecisionMatrixConfig };
  config?: LifeBookConfig | null;
  contentLocale?: string;
}
```

getPlaceholderMapFromContext 的 opts 可擴充 `findingsV2?: LifebookFindingsV2`，不需改動其他 section。

---

## 7. 驗收

- 有 findingsV2 且 stackSignals 或 timeWindowScores 或 eventProbabilities 有資料時，s15a 的 map 含有 shockBlocks/mineBlocks/wealthBlocks 或 timeWindowScoresSummary/eventProbabilitiesSummary（由 V2 產出），且不依賴 overlap 重算。
- 無 findingsV2 或 primary 皆空時，s15a 行為與現有一致（overlap + minorFortuneByPalace + decisionMatrix）。
- 其他 section（s15, s16, …）不受影響。
