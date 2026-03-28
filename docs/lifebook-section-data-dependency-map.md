# SECTION_DATA_DEPENDENCY_MAP 說明

依四部分架構（關於命主／運勢／12宮分析／此生任務），對每個 section_key（s00–s21、s15a）列出資料依賴、prompt 內重算與否、是否可 findingsV2-only、重構優先級。

**TypeScript 常數位置**：`worker/src/lifebook/sectionDataDependencyMap.ts`

---

## 1. 欄位定義

| 欄位 | 說明 |
|------|------|
| **primaryFindings** | 主要依賴的 findings / findingsV2 欄位；章節敘事應優先從此讀取。 |
| **secondaryChartContent** | 次要依賴的 chart 或 content 欄位／來源；用於星曜、宮位、時間層、靜態文案等。 |
| **hasPromptRecalc** | 是否仍在 prompt 組裝前於程式內重算四化／飛星／疊宮／診斷包等（true = 需收斂到 Reasoner）。 |
| **canSwitchFindingsV2Only** | 是否可改為「只讀 findingsV2、不直讀 chart」即產出該章（true = 已可或極易切換）。 |
| **refactorPriority** | 重構優先級：high = 運勢核心、重算多；medium = 12宮或任務；low = 已近乎只組裝。 |

---

## 2. 第一部分：關於命主

| section_key | 主要 findings | 次要 chart/content | prompt 重算 | findingsV2-only | 優先級 |
|-------------|----------------|--------------------|------------|-----------------|--------|
| **s04** | — | config (命主/身主/身宮解碼)、content (lifeBodyRelation 等) | 否 | 是 | low |

- **說明**：s04 不綁單宮，只組裝命主・身主・身宮與命身關係；資料來自 config（由 chart + content 預先建好）與 content 靜態文案，無四化／飛星重算。
- **重構**：已可視為 findingsV2-only（實際是 config+content-only）；優先級低。

---

## 3. 第二部分：運勢

| section_key | 主要 findings | 次要 chart/content | prompt 重算 | findingsV2-only | 優先級 |
|-------------|----------------|--------------------|------------|-----------------|--------|
| **s00** | (可選) mainBattlefields | overlapAnalysis, fourTransformations, decadalLimits, yearlyHoroscope, ziwei；`sihuaLayers`（deprecated，僅比對）；`lifebookSiHuaDisplayOverride`（可選，Phase 3 顯式覆寫+audit） | 是 | 否 | high |
| **s03** | crossChartFindings, palacePatterns | ziwei, overlapAnalysis, fourTransformations, decadalLimits；`sihuaLayers`（deprecated）；`lifebookSiHuaDisplayOverride`（可選）；config | 是 | 否 | high |
| **s15** | keyYears, yearSignals, crossChartFindings | decadalLimits, fourTransformations, yearlyHoroscope, overlapAnalysis, minorFortuneByPalace | 是 | 否 | high |
| **s15a** | keyYears | minorFortuneByPalace, overlapAnalysis (items/criticalRisks/…), content.decisionMatrix | 是 | 否 | high |
| **s16** | yearSignals, keyYears, timeAxis | yearlyHoroscope, liunian, fourTransformations.liunian, overlapAnalysis, decisionMatrix | 是 | 否 | high |
| **s17** | keyYears, yearSignals | minorFortuneByPalace, overlapAnalysis, decadalLimits, yearlyHoroscope | 是 | 否 | high |
| **s20** | crossChartFindings | buildPiercingDiagnosticBundle(chart), yearlyHoroscope, decadalLimits, map 脈絡 | 是 | 否 | high |

- **說明**：運勢 7 章均大量依賴 chart 直讀與 prompt 前重算（buildSiHuaLayers、runS00Pipeline、buildPiercingDiagnosticBundle、collectFourTransformsForPalace、buildOverlapDetailBlocks 等）。四化顯示層權威為 **normalizeChart + fourTransformations**（`buildSiHuaLayers`）；**不得**以 `chartJson.sihuaLayers` 為權威；實驗覆寫用 **`lifebookSiHuaDisplayOverride`**（見 `docs/lifebook-sihua-single-source-phase1.md`）。
- **findingsV2 對齊**：改為只讀 findingsV2 時，需由 Reasoner 提供：`transformEdges`、`triggeredPaths`、`stackSignals`、`timeWindowScores`、`eventProbabilities`、`pathNarratives`；timeAxis / timelineSummary 可由 V2 時間層產出寫回 findings。
- **重構**：優先級皆 **high**；V2 上線後改為「只讀 findingsV2 + 既有 findings 時間/行動欄位」，關閉上述 chart 直讀與重算。

---

## 4. 第三部分：12宮分析

| section_key | 主要 findings | 次要 chart/content | prompt 重算 | findingsV2-only | 優先級 |
|-------------|----------------|--------------------|------------|-----------------|--------|
| **s02, s10, s01, s05, s06, s07, s08, s09, s11, s12, s13, s14** | sihuaPlacementItems, natalFlowItems, starCombinations, palacePatterns, mainBattlefields, pressureOutlets | ziwei.palaces (星曜、亮度), overlap (迴路、高壓), content.starPalacesMain, narrativeFacade, config | 是 | 否 | medium |

- **說明**：12 宮共同依賴 buildPalaceContext(chart, config, content) 取得星曜與結構；getPlaceholderMapFromContext 時若有 findings 則四化／宮干飛化改讀 `sihuaPlacementItems`、`natalFlowItems`，否則仍 fallback chart。`buildSiHuaContext` 之 perPalaceFlow 依 **findings + buildSihuaFlowSummary**（不依賴已 deprecated 之 `sihuaLayers` wire）。
- **findingsV2 對齊**：單宮可再讀 `findingsV2.pathNarratives`（過濾 relatedPathIds 含本宮）、`triggeredPaths`（touchedPalaces 含本宮）、必要時 `stackSignals`（palace 為本宮）。
- **重構**：優先級 **medium**；先確保 findings 穩定寫入 sihuaPlacementItems / natalFlowItems，再讓 12 宮一律不讀 chart 四化；最後補 pathNarratives 等 V2 欄位。

---

## 5. 第四部分：此生任務

| section_key | 主要 findings | 次要 chart/content | prompt 重算 | findingsV2-only | 優先級 |
|-------------|----------------|--------------------|------------|-----------------|--------|
| **s18** | lifeLessons, crossChartFindings | buildPiercingDiagnosticBundle(chart), map.recurringHomeworkNarrative, map.currentDecadalPalace | 是 | 否 | medium |
| **s19** | actionItems | map.actionNowLayers (來自 s15/s16), chart year/decade context, content.decisionMatrix | 否 | 否 | medium |
| **s21** | lifeLessons | map.recurringHomeworkNarrative, map.yearRoleInDecade, map.currentDecadalPalace | 否 | 否 | medium |

- **說明**：s18 仍呼叫 buildPiercingDiagnosticBundle(chart)；s19/s21 以 map 上已算好的脈絡與 findings 組裝為主，重算少。
- **findingsV2 對齊**：s19 行動建議可改讀 findingsV2.eventProbabilities、既有 actionItems（或 V2 擴充）；s18/s21 可讀 riskLines、lifeLessons、pathNarratives 摘要。
- **重構**：優先級 **medium**；s18 改為只讀 findings + findingsV2 後可設 canSwitchFindingsV2Only = true。

---

## 6. 高優先級三批遷移（Batch 1 / 2 / 3）

High priority 章節再細分為三批，見 **`docs/lifebook-v2-migration-batches-and-contracts.md`**；Batch 1（s15a、s16）含完整 migration contract 與 section assembler input schema 草稿。

| 批次 | 章節 | 說明 |
|------|------|------|
| **Batch 1** | s15a, s16 | 最適合最早切 findingsV2；時間/事件結構與 V2 對齊度高 |
| **Batch 2** | s15, s17, s20 | 中等複雜度；明顯受益於 timeWindowScores、stackSignals、triggeredPaths |
| **Batch 3** | s00, s03 | 依賴多、需重寫敘事結構；開場與整盤結構 |

常數：`sectionDataDependencyMap.ts` → `HIGH_PRIORITY_MIGRATION_BATCH`、`SECTION_V2_TARGET_MAP`、`getSectionsByMigrationBatch(batch)`。

---

## 7. 彙總表（依優先級）

| 優先級 | section_key 列表 |
|--------|------------------|
| **high** | s00, s03, s15, s15a, s16, s17, s20 |
| **medium** | s02, s10, s01, s05, s06, s07, s08, s09, s11, s12, s13, s14, s18, s19, s21 |
| **low** | s04 |

---

## 8. 與 findingsV2 的對應（V2 上線後可填）

| findingsV2 欄位 | 建議供給章節 | 用途 |
|-----------------|--------------|------|
| transformEdges | s00, s03, s15, s15a, s16, s17, s20, 12宮 | 三層＋宮干飛星唯一來源，取代 chart 直讀與 buildSiHuaLayers |
| triggeredPaths | s00, s03, s15, s16, s20, 12宮 | 路徑辨識、財線／風險線摘要 |
| stackSignals | s03, s15, s15a, s20 | 疊宮、祿忌同宮、自化等 |
| timeWindowScores | s15, s15a, s16, s17 | 十年／年度分數，取代部分 overlap 直讀 |
| eventProbabilities | s15a, s16, s19 | 事件機率與行動建議 |
| pathNarratives | s00, s03, 12宮 | 路徑敘事摘要，單宮可篩 relatedPathIds |
| wealthLines / riskLines | s03, s10, s08, s15, s20 | 財富／風險線重點章節 |

---

## 9. 使用方式（程式）

```ts
import {
  SECTION_DATA_DEPENDENCY_MAP,
  getSectionsByPriority,
  getSectionsWithPromptRecalc,
  getSectionsCanSwitchFindingsV2Only,
} from "./lifebook/sectionDataDependencyMap.js";

// 高優先級重構章節
const high = getSectionsByPriority("high"); // ["s00", "s03", "s15", "s15a", "s16", "s17", "s20"]

// 仍有 prompt 內重算的章節
const recalc = getSectionsWithPromptRecalc();

// 已可 findingsV2-only 的章節
const v2Only = getSectionsCanSwitchFindingsV2Only(); // ["s04"]

// 單章依賴
const s15Dep = SECTION_DATA_DEPENDENCY_MAP.s15;
```

---

## 10. 維護注意

- **primaryFindings**：若 buildLifebookFindings 或 index 寫入新欄位（如 timeAxis、sihuaPlacementItems），應同步更新此表。
- **canSwitchFindingsV2Only**：V2 Reasoner 產出穩定、assembler 改為只讀 findingsV2 後，將對應章節改為 true。
- **refactorPriority**：完成 high 後可將該章改為 medium/low；全數改為 findingsV2-only 後可再調降。
