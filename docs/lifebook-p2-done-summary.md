# Lifebook P2 Inference Layer — 完成摘要

## 資料流（已打通）

```
chartJson
  → normalizeChart()           [worker/src/lifebook/normalize/]
  → NormalizedChart
  → starCombinationEngine       [engines/starCombination/]
  → palaceInferenceEngine       [engines/palaceInference/]
  → crossChartRuleEngine        [engines/crossChart/]
  → signalsEngine + keyYearEngine [engines/signals/]
  → buildLifebookFindings()     [findings/buildLifebookFindings.ts]
  → LifebookFindings
  → assembleTimeModuleFromFindings() → placeholder map
  → injectTimeModuleDataIntoSection(..., { findings, timeContext })
  → s15 / s18 / s19 / s20 / s21 章節輸出
```

**章節與模板只讀 LifebookFindings**：當 `options.findings` 傳入時，`injectTimeModuleDataIntoSection` 僅用 `assembleTimeModuleFromFindings(findings, timeContext)` 產出 placeholder，不再讀 chartJson。

---

## 實作清單

### Task 1：normalize 層
- `worker/src/lifebook/normalize/normalizeChart.ts` — 單一入口，產出 NormalizedChart
- `normalizePalaces.ts` — 從 ziwei 產出 PalaceStructure[]，宮位 canonical、星曜分類
- `normalizeTransforms.ts` — 從 overlapAnalysis.items[].transformations 產出 TransformEdge[]
- `resolveCurrentTimeContext.ts` — currentDecade、yearlyHoroscope、xiaoXian

### Task 2：leadMainStarResolver
- `worker/src/lifebook/engines/palaceInference/leadMainStarResolver.ts` — 0→none、1→single、2→dual（第一顆 lead、第二顆 coLead）

### Task 3：starCombinationEngine
- `worker/src/lifebook/engines/starCombination/starCombinationEngine.ts` — 宮內兩星 canonical 排序、查 `star-combinations.json`，產出 StarCombinationFinding[]

### Task 4：palaceInferenceEngine
- `worker/content/ccl3/patterns/palace-transform-star-matrix.json` — 15 筆高價值矩陣
- `worker/content/ccl3/patterns/main-star-inference-hints.json` — 主星 fallback 語義
- `palaceInferenceEngine.ts` + `palacePatternMatcher.ts` — (palace, leadMainStar, transform) 查表 / fallback → PalacePatternFinding[]

### Task 5：crossChartRuleEngine
- `worker/src/lifebook/engines/crossChart/crossChartRuleEngine.ts` — 依 triggerType（edgeMatch、samePalaceTransformMix、groupMatch）查 `cross-chart-rules.json` → SpilloverFinding[]

### Task 6：signalsEngine + keyYearEngine
- `signalsEngine.ts` — overlap.criticalRisks/maxOpportunities/volatileAmbivalences → YearSignal[]
- `keyYearEngine.ts` — minorFortuneByPalace → KeyYearFinding[]

### Task 7：buildLifebookFindings
- `worker/src/lifebook/findings/buildLifebookFindings.ts` — 彙總各 engine 產出，填滿 LifebookFindings（含 mainBattlefields、pressureOutlets、spilloverFindings、yearSignals、keyYears、lifeLessons、actionItems、starCombinations、palacePatterns）

### Task 8：模組二只讀 findings
- `assembleTimeModuleFromFindings.ts` — 從 LifebookFindings + timeContext 產出 currentDecadalPalace、s18/s19/s20/s21 等 placeholder
- `lifeBookPrompts.ts` — `injectTimeModuleDataIntoSection` 新增第 7 參數 `options?: { findings, timeContext }`；有 findings 時只讀 findings
- `index.ts` — 四處呼叫前先 `buildP2FindingsAndContext(chartJson)`，再傳入 `injectOpts`

---

## 四化最小推理單位

- 矩陣與 fallback 皆以 **transform + targetPalace + leadMainStar** 為單位，不在章節／模板層單獨解釋四化。

---

## P2 Done 標準對照

| 條件 | 狀態 |
|------|------|
| normalizeChart() 可穩定輸出 NormalizedChart | ✅ |
| palaceInferenceEngine 可用 transform + palace + mainStar 產出 PalacePatternFinding | ✅ |
| starCombinationEngine 可命中 star-combinations.json | ✅ |
| crossChartRuleEngine 可取代舊 rootCause 硬編碼 | ✅（查表；舊 rootCause 仍存在可漸進替換） |
| buildLifebookFindings() 可輸出至少 8 類 findings | ✅（含 palacePatterns 共 9 類） |
| s15 完全 findings 化 | ✅（經 assembleTimeModuleFromFindings + injectOpts） |
| s18 或 s20 至少一章 findings 化 | ✅（s18/s19/s20/s21 皆走 findings 路徑） |

---

## 部署與後續

- Worker 已能 build 通過（`npm run build` / `wrangler deploy --dry-run`）。
- CCL3 內容為靜態 import：`star-combinations.json`、`cross-chart-rules.json`、`palace-transform-star-matrix.json`、`main-star-inference-hints.json`。
- 後續可做：擴充矩陣條目、將 rootCause 呼叫改為僅用 crossChartRuleEngine、補齊 lifeLessons/actionItems 來源（如 star_life_lessons、decisionMatrix）。
