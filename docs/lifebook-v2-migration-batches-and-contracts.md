# Lifebook V2 遷移：高優先級章節分批與 Batch 1 合約

依 SECTION_DATA_DEPENDENCY_MAP 將 high priority 章節分成三批，並為 Batch 1（s15a、s16）產出 migration contract 與 assembler input schema 草稿。

**相關常數**：`worker/src/lifebook/sectionDataDependencyMap.ts` → `SECTION_V2_TARGET_MAP`、`HIGH_PRIORITY_MIGRATION_BATCH`

---

## 任務 1：高優先級章節三批

### Batch 1：最適合最早切到 findingsV2

| 章節 | 說明 |
|------|------|
| **s15a** | 人生時間軸（小限・疊宮・關鍵年） |
| **s16** | 今年主線任務與心理濾鏡（流年） |

**為什麼放這批**

- 輸出結構已偏「時間視窗 + 事件/風險/機會」：s15a 是各宮小限年表 + 疊宮標籤（mine/wealth/shock）+ 決策時間軸；s16 是流年四化 + 今年決策摘要 + 今年在十年中的角色。與 V2 的 `timeWindowScores`、`eventProbabilities`、`stackSignals` 對齊度高，不需大改敘事骨架。
- 目前重算集中在「overlap 彙總、流年四化字串、year role」等，皆有 V2 等價物（eventProbabilities.window、timeWindowScores、triggeredPaths 摘要），移除後改讀 findingsV2 即可。
- 與其他運勢章相比，較少「整盤劇本」「命盤結構」等開放式敘事，改寫範圍可控。

**建議主要改讀的 findingsV2 欄位**

- **s15a**：`stackSignals`（疊宮類型與宮位）、`timeWindowScores`（decade/year 分數）、`eventProbabilities`（事件類型與機率、window 對應年/十年）、必要時 `triggeredPaths` 作「路徑觸發」摘要。
- **s16**：`eventProbabilities`（window.type === "year"）、`timeWindowScores`（windowType === "year"）、`triggeredPaths`（當年相關路徑）、既有 findings 的 `timeAxis` / `yearSignals` 可保留至 V2 產出穩定後再收斂。

**仍需保留的 chart/content fallback**

- **chart**：當 findingsV2 未提供或驗證未通過時，保留 `chartJson.yearlyHoroscope`（流年命宮/年）、`chartJson.decadalLimits`（當前大限宮位）、`chartJson.minorFortuneByPalace`（s15a 小限表）、`chartJson.overlapAnalysis`（items/criticalRisks 等）的唯讀 fallback，僅用於補齊缺失欄位，不做新邏輯推論。
- **content**：`content.decisionMatrix`（決策矩陣標籤與建議）保留，V2 不取代決策文案，只取代「哪一年/哪一宮風險機會」的資料來源。

**預估重構風險**

- **低～中**。介面改為「優先 findingsV2，缺則 fallback chart/content」即可；placeholder 名稱可維持，僅資料來源從重算改為讀取。風險點：V2 尚未產出 keyYears 等時，需保留既有 keyYears 與 minorFortuneByPalace 的對應邏輯直至 Reasoner 補齊。

---

### Batch 2：中等複雜度，明顯受益於 V2

| 章節 | 說明 |
|------|------|
| **s15** | 十年節奏（大限） |
| **s17** | 十年 × 年度交叉分析 |
| **s20** | 三盤疊加診斷（流年 × 大限 × 本命） |

**為什麼放這批**

- 都強依賴「時間層 + 疊宮/路徑」，V2 的 `timeWindowScores`、`stackSignals`、`triggeredPaths` 能直接取代大量 chart 直讀與 overlap 彙總；但章節內還有「十年主題敘事」「今年在十年中的角色」「三盤關係場範例」等需與既有 narrative 結構對齊，需適度改寫組裝邏輯。
- s15 的「大限四化 + 本命觸發 + 十年功課」、s17 的「大限宮 × 流年宮」、s20 的「本命/大限/流年三線 + 夫妻宮範例」在 V2 中可由 stackSignals + pathNarratives + timeWindowScores 組成，不需從頭發明新結構。

**建議主要改讀的 findingsV2 欄位**

- **s15**：`timeWindowScores`（windowType === "decade"）、`triggeredPaths`（decade 相關）、`stackSignals`（大限宮位疊宮）；既有 `keyYears`、`yearSignals`、`crossChartFindings` 保留。
- **s17**：`timeWindowScores`（decade + year）、`triggeredPaths`、`eventProbabilities`（window 含 year/decade）；保留 `keyYears`、`yearSignals`。
- **s20**：`stackSignals`（三層疊宮）、`crossChartFindings`、`triggeredPaths` / `pathNarratives`（關係場）；必要時 `transformEdges` 作簡要飛星來源。

**仍需保留的 chart/content fallback**

- **chart**：`decadalLimits`（宮位與年齡區間）、`yearlyHoroscope`、`overlapAnalysis`、`fourTransformations` 在 findingsV2 缺欄時唯讀補齊，不新增推論。
- **content**：無強依賴；若有「十年主題」等靜態文案可保留。

**預估重構風險**

- **中**。需調整 getPlaceholderMapFromContext 內 s15/s17/s20 分支：改為先組裝來自 findingsV2 的區塊，再以 chart 補缺；敘事模板若有「十年主線能量」「今年角色」等固定句，可保留並只替換資料來源。

---

### Batch 3：依賴較多、需重寫敘事結構

| 章節 | 說明 |
|------|------|
| **s00** | 這一局，你為什麼要來？（靈魂行前簡報） |
| **s03** | 你的命盤結構（主線劇本 × 星曜群性 × 四化慣性） |

**為什麼放這批**

- 兩章都是「整盤級」綜論：s00 用 runS00Pipeline、buildFourTransformPersonality、buildSiHuaLayers、buildWholeChartContext；s03 用 buildS03GlobalContext、buildWholeChartContext、buildPiercingDiagnosticBundle、buildSiHuaLayers。依賴面廣，且敘事結構（開場總覽、命盤結構、星曜群性、四化慣性）與當前 prompt/placeholder 深度綁定。
- 要切到 findingsV2-only，需重新定義「開場一章」與「結構一章」的輸入：由 `transformEdges`、`triggeredPaths`、`stackSignals`、`pathNarratives`、`mainBattlefields` 等組出高階摘要，再交給 prompt；等於重寫 section assembler 的輸入契約與模板邏輯。

**建議主要改讀的 findingsV2 欄位**

- **s00**：`transformEdges`（三層摘要）、`triggeredPaths`、`pathNarratives`、`stackSignals`（高 severity 或主題句）、既有 `mainBattlefields`；timeAxis 類由 V2 產出寫回 findings 後使用。
- **s03**：`triggeredPaths`、`pathNarratives`、`stackSignals`、`palacePatterns`、`crossChartFindings`；`transformEdges` 作四化慣性與飛星結構摘要。

**仍需保留的 chart/content fallback**

- **chart**：在 V2 未覆蓋前，保留 `overlapAnalysis`、`fourTransformations`、`decadalLimits`、`yearlyHoroscope`、`ziwei`、`sihuaLayers` 的唯讀 fallback，僅用於補齊缺失、不新增判斷。
- **content**：星曜群性、宮位語義等靜態文案保留；config（assembleInput）在 s03 可保留至 V2 能產出等價「主線劇本」摘要為止。

**預估重構風險**

- **高**。需設計「開場/結構」專用的 V2 摘要結構（或擴充 pathNarratives / 新增 openingSummary），並改寫 s00/s03 的 placeholder 清單與 prompt 任務描述；建議在 Batch 1、Batch 2 穩定後再動，並做 A/B 比對。

---

## 任務 2：Batch 1 Migration Contract（s15a、s16）

### s15a Migration Contract

**1. 現在使用的 primaryFindings / secondaryChartContent**

| 類型 | 來源 |
|------|------|
| **primaryFindings** | `keyYears` |
| **secondaryChartContent** | `chartJson.minorFortuneByPalace`、`chartJson.overlapAnalysis`（items、criticalRisks、maxOpportunities、volatileAmbivalences）、`content.decisionMatrix` |

**2. 建議改用的 findingsV2 欄位**

| 用途 | findingsV2 欄位 |
|------|------------------|
| 疊宮／風險機會標籤 | `stackSignals`（stackType、palace、severity、theme） |
| 時間視窗分數（十年/年） | `timeWindowScores`（wealthScore、careerScore、cashflowRiskScore、pressureScore 等） |
| 事件與機率 | `eventProbabilities`（eventType、probability、confidence、window.type / window.decadeRange / window.year） |
| 關鍵年／小限表 | 仍用 findings.`keyYears`，或由 V2 擴充「keyYears 來自 timeWindowScores + eventProbabilities」 |

**3. 可刪除的 prompt 內重算邏輯**

- 從 `overlapAnalysis.items` / `criticalRisks` / `maxOpportunities` / `volatileAmbivalences` 彙總 shockCount、mineCount、wealthCount 與 palaceToTag 的邏輯（改為由 stackSignals + eventProbabilities 推得或由 Reasoner 寫入 keyYears/keyYearTags）。
- `buildOverlapDetailBlocks(overlap, { chartJson, content, … })` 中依 overlap 重算 shockBlocks、mineBlocks、wealthBlocks 的邏輯（改為讀 stackSignals + eventProbabilities 組裝同義區塊）。
- 若 decisionMatrix 僅用於「依 tag 選文案」，則保留 content 讀取，刪除從 chart/overlap 推 tag 的程式路徑，改為從 findingsV2 的 eventProbability.window + score 或 keyYear 標籤取得。

**4. 仍需保留的 chart/content fallback**

- **chart**：當 `findingsV2.timeWindowScores` / `eventProbabilities` 為空或驗證未通過時，保留對 `chartJson.minorFortuneByPalace`、`chartJson.overlapAnalysis` 的唯讀，用於產生 minorFortuneTable、timeline 表與標籤，不新增推論。
- **content**：`content.decisionMatrix`（palaceThemes、eventLabels、決策建議文案）保留；V2 只提供「哪一年/哪一宮/哪類事件」，不取代決策矩陣的標籤與敘事。

**5. Section assembler input schema 草稿（s15a）**

```ts
interface SectionAssemblerInputS15a {
  section_key: "s15a";
  findings: LifebookFindings;
  findingsV2?: LifebookFindingsV2;

  // 優先從 findingsV2 填寫；缺則 fallback
  timeWindowScores?: TimeWindowScore[];        // 來自 findingsV2.timeWindowScores
  eventProbabilities?: EventProbability[];     // 來自 findingsV2.eventProbabilities
  stackSignals?: StackSignal[];                // 來自 findingsV2.stackSignals

  // 既有 findings，V2 未覆蓋前仍用
  keyYears?: KeyYearFinding[];                // 來自 findings.keyYears

  // fallback：V2 缺欄時才用
  chartJson?: Record<string, unknown>;        // minorFortuneByPalace, overlapAnalysis
  content?: { decisionMatrix?: DecisionMatrixConfig };
  locale?: string;
}
```

---

### s16 Migration Contract

**1. 現在使用的 primaryFindings / secondaryChartContent**

| 類型 | 來源 |
|------|------|
| **primaryFindings** | `yearSignals`、`keyYears`、`timeAxis` |
| **secondaryChartContent** | `chartJson.yearlyHoroscope`、`chartJson.liunian`、`chartJson.fourTransformations.liunian`、`chartJson.overlapAnalysis`、`content.decisionMatrix` |

**2. 建議改用的 findingsV2 欄位**

| 用途 | findingsV2 欄位 |
|------|------------------|
| 今年事件與機率 | `eventProbabilities`（window.type === "year"、window.year） |
| 今年分數 | `timeWindowScores`（windowType === "year"、flowYear） |
| 今年觸發路徑 | `triggeredPaths`（layers 含 "year"、或依 flowYear 篩） |
| 流年四化摘要 | 由 `transformEdges`（layer === "year"）組字串，或保留 findings.timeAxis.flowYearSihuaLine（由 V2 寫回） |

**3. 可刪除的 prompt 內重算邏輯**

- 從 `chartJson.liunian` / `fourTransformations.liunian` 組 `flowYearSihua`、`flowYearSihuaLine` 的邏輯（改為從 findingsV2.transformEdges 篩 layer=== "year" 或從 findings.timeAxis 讀取 V2 寫回值）。
- 從 overlap + yearly 推「今年流年命宮對應的 tag（mine/wealth/shock）」再呼叫 `buildYearDecisionSummary` 的邏輯（改為從 eventProbabilities + timeWindowScores 取得今年風險/機會類型，decisionMatrix 僅負責文案映射）。
- `getYearRoleInDecadeAndWhy` 等「今年在十年中的角色」若改由 V2 產出（例如 pathNarratives 或專用 yearRole 欄位），則可刪除依 liunianMutagen + decadalPalace 的推論，改讀 findingsV2。

**4. 仍需保留的 chart/content fallback**

- **chart**：當 findingsV2 或 findings.timeAxis 無流年資料時，保留對 `chartJson.yearlyHoroscope`（year、palaceNames）、`chartJson.liunian`、`chartJson.fourTransformations.liunian` 的唯讀，用於 flowYear、flowYearMingPalace、flowYearSihuaLine。
- **content**：`content.decisionMatrix` 保留，用於今年決策建議文案。

**5. Section assembler input schema 草稿（s16）**

```ts
interface SectionAssemblerInputS16 {
  section_key: "s16";
  findings: LifebookFindings;
  findingsV2?: LifebookFindingsV2;

  // 優先從 findingsV2 填寫
  eventProbabilities?: EventProbability[];     // window.type === "year", window.year
  timeWindowScores?: TimeWindowScore[];        // windowType === "year"
  triggeredPaths?: TriggeredPath[];            // 當年相關
  transformEdges?: TransformEdgeV2[];         // layer === "year" 作流年四化摘要

  // 既有 findings
  timeAxis?: TimeAxisSummary;                 // flowYearMingPalace, flowYearSihuaLine 等
  yearSignals?: YearSignal[];
  keyYears?: KeyYearFinding[];

  // fallback
  chartJson?: Record<string, unknown>;        // yearlyHoroscope, liunian, fourTransformations
  content?: { decisionMatrix?: DecisionMatrixConfig };
  locale?: string;
}
```

---

## 任務 3：SECTION_V2_TARGET_MAP 使用處

`SECTION_V2_TARGET_MAP` 已定義於 `worker/src/lifebook/sectionDataDependencyMap.ts`，結構如下（含 Batch 1～3 全部 high 章節）：

- **primary**：建議改讀的 findingsV2 欄位（字串陣列）。
- **fallback**：仍需保留的 chart/content 路徑（字串陣列）。
- **removePromptRecalc**：可刪除的 prompt 內重算邏輯描述（字串陣列，供實作時對照）。

程式可直接 import `SECTION_V2_TARGET_MAP`，依 `section_key` 取得該章遷移目標，驅動「先讀 V2、缺則 fallback」與「移除重算」清單。
