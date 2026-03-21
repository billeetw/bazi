# Phase P0.1：命書 Section Coverage 與 Template 引用盤點報告

**說明**：本報告為靜態分析結果，未修改任何程式碼、template 或檔案結構。

---

## 一、Section Coverage 表

| sectionKey | dataSource | V2Primary | fallback | templateUsage | testsCoverage |
|------------|------------|-----------|----------|---------------|---------------|
| s00 | chartJson + content + prompt 內重算 | NO | 無 fallback | 已引用（s00 專用 placeholders） | YES（s00-pipeline.test.ts） |
| s01 | findings + chartJson（宮位組裝） | NO | 無 | 已引用（palaceOverview 等） | PARTIAL（getSectionTechnicalBlocks s05/s06） |
| s02 | findings + chartJson | NO | 無 | 已引用 | PARTIAL |
| s03 | chartJson + content | NO | 無 | 已引用（starGroupStatsBlock, s03PiercingDiagnosisBlock 等） | PARTIAL |
| s04 | chartJson + content | NO | 無 | 已引用（lifeLordName, bodyPalaceName 等） | NO |
| s05 | findings + chartJson | NO | 無 | 已引用 | PARTIAL（debug-sihua-flow-summary） |
| s06 | findings + chartJson | NO | 無 | 已引用 | PARTIAL |
| s07 | findings + chartJson | NO | 無 | 已引用 | NO |
| s08 | findings + chartJson | NO | 無 | 已引用 | NO |
| s09 | findings + chartJson | NO | 無 | 已引用 | NO |
| s10 | findings + chartJson | NO | 無 | 已引用 | NO |
| s11 | findings + chartJson | NO | 無 | 已引用 | NO |
| s12 | findings + chartJson | NO | 無 | 已引用 | NO |
| s13 | findings + chartJson | NO | 無 | 已引用 | NO |
| s14 | findings + chartJson | NO | 無 | 已引用 | NO |
| s15 | chartJson（decadalLimits, fourTransformations, overlap, time module）+ content | NO | chartJson only（無 findingsV2） | 已引用（含 mineBlocks, wealthBlocks, shockBlocks 等） | PARTIAL（經 time module / s16 測試間接） |
| s15a | findingsV2 | YES | findingsV2 → fallback chartJson（overlap / minorFortuneByPalace）；有 s15aV2Usable 不覆寫 | UNUSED_PLACEHOLDER（見下 s15a 小表） | YES（lifebook-v2-reason.test.ts） |
| s16 | findingsV2 | YES | findingsV2 → fallback chartJson（yearlyHoroscope / liunian）；有 s16V2Usable 不覆寫 | UNUSED_PLACEHOLDER（見下 s16 小表） | YES（lifebook-v2-reason.test.ts, lifeBookPrompts-module2） |
| s17 | chartJson（time module）+ content | NO | 無 | 已引用（yearRoleInDecade） | NO |
| s18 | findings（assembleS18） | NO | 無（blindSpotsDecadalNarrative 來自 chartJson 但 template 未引用） | 已引用（s18BlindSpotLine, s18BodyLine, s18AdviceLine） | NO |
| s19 | chartJson（time module, actionNowLayers）+ content | NO | 無 | 已引用（s19ActionNow, s19LongTerm, s19Avoid） | NO |
| s20 | chartJson（time module, piercing）+ content | NO | 無 | 已引用（s20BenmingLine, s20DecadalLine, s20YearLine, s20CrossChartLine） | NO |
| s21 | chartJson（time module, recurringHomeworkNarrative）+ content | NO | 無 | 已引用（s21LifelongLesson, s21NowSee） | NO |

**dataSource 說明**：
- **findings**：來自 normalizeChart + lifebookFindings 組裝（如 assemblePalace、assembleS18、assembleTimeModuleFromFindings）。
- **findingsV2**：來自 V2 reason 管線（reasonFromChart → buildS15aPlaceholderMapFromV2 / buildS16PlaceholderMapFromV2）。
- **chartJson**：直接讀取 chart 的 overlap、decadalLimits、yearlyHoroscope、liunian、piercing 等。
- **content**：content 包（narrativeCorpus、overrides 等）。
- **prompt 內重算**：getPlaceholderMapFromContext 內建 buildS00EventsFromChart、evaluateFourTransformPatterns、buildPiercingDiagnosticBundle 等。

---

## 二、s15a placeholder 使用情況

### builderProduced（buildS15aPlaceholderMapFromV2）

- shockCount  
- mineCount  
- wealthCount  
- shockBlocks  
- mineBlocks  
- wealthBlocks  
- overlapSummary  
- volatileSection  
- criticalRisksSection  
- opportunitiesSection  
- timeWindowScoresSummary  
- eventProbabilitiesSummary  
- keyYearsMineLead  
- keyYearsWealthLead  
- keyYearsShockLead  

（另：minorFortuneTimelineTable、keyYearsDecisionTimeline 由 fallback 路徑從 chartJson/overlap 產出，非 V2 builder。）

### templateUsed（lifebookSection-zh-TW.json s15a structure_analysis）

- minorFortuneTimelineTable  
- shockCount  
- mineCount  
- wealthCount  
- shockBlocks  
- mineBlocks  
- wealthBlocks  
- keyYearsDecisionTimeline  

### unusedPlaceholders（builder 已產出但 template 未引用）

- **overlapSummary**  
- **volatileSection**  
- **criticalRisksSection**  
- **opportunitiesSection**  
- **timeWindowScoresSummary**  
- **eventProbabilitiesSummary**  

keyYearsMineLead、keyYearsWealthLead、keyYearsShockLead 為 s15 補字用，s15a template 未引用，若僅 s15a 視角則亦為未使用。

---

## 三、s16 placeholder 使用情況

### builderProduced（buildS16PlaceholderMapFromV2 + fallback）

- **V2 builder**：yearEventProbabilitiesSummary, yearTimeWindowScoresSummary, yearPathsSummary, yearlyFourTransformSummary, yearlyFourTransformBlocks  
- **Fallback（lifeBookPrompts）**：yearDecisionSummaryBlock, flowYearMingPalace, flowYearSihuaLine, yearRoleInDecade, yearOneLineAdvice 等  

### templateUsed（lifebookSection-zh-TW.json s16 structure_analysis）

- flowYearMingPalace  
- flowYearSihuaLine  
- yearRoleInDecade  
- yearOneLineAdvice  

### unusedPlaceholders（builder 已產出但 template 未引用）

- yearEventProbabilitiesSummary  
- yearTimeWindowScoresSummary  
- yearPathsSummary  
- yearlyFourTransformSummary  
- yearlyFourTransformBlocks  
- yearDecisionSummaryBlock  

---

## 四、重點章節深度檢查（s15a, s16, s17, s18, s19, s20, s21）

### s15a

- **Builder 產生的 placeholder**：見上「builderProduced」。
- **Template 使用的 placeholder**：見上「templateUsed」。
- **Fallback 是否可能覆蓋 V2**：否。程式有 `s15aV2Usable` 判斷，V2 可用時不寫入 overlap/chartJson 的 fallback 值，不會覆寫 V2。
- **未使用 placeholder**：overlapSummary, volatileSection, criticalRisksSection, opportunitiesSection, timeWindowScoresSummary, eventProbabilitiesSummary；以及 keyYearsMineLead, keyYearsWealthLead, keyYearsShockLead（s15a 未引用）。

### s16

- **Builder 產生的 placeholder**：見上「builderProduced」。
- **Template 使用的 placeholder**：見上「templateUsed」。
- **Fallback 是否可能覆蓋 V2**：否。有 `s16V2Usable` 保護，year/eventProbabilities/timeWindowScores/transformEdges 等 V2 有值時不覆寫。
- **未使用 placeholder**：yearEventProbabilitiesSummary, yearTimeWindowScoresSummary, yearPathsSummary, yearlyFourTransformSummary, yearlyFourTransformBlocks, yearDecisionSummaryBlock。

### s17

- **Builder**：無獨立 V2 builder；placeholders 來自 getPlaceholderMapFromContext 的 time module（如 yearRoleInDecade）。
- **Template 使用**：yearRoleInDecade。
- **Fallback 覆寫 V2**：不適用（無 V2）。
- **未使用 placeholder**：無。

### s18

- **Builder**：assembleS18(findings) 產出 s18BlindSpotLine, s18BodyLine, s18AdviceLine。
- **Template 使用**：s18BlindSpotLine, s18BodyLine, s18AdviceLine。
- **Fallback**：getPlaceholderMapFromContext 會設 blindSpotsDecadalNarrative（chartJson piercing），但 **s18 template 未引用** blindSpotsDecadalNarrative，故為未使用。
- **未使用 placeholder**：blindSpotsDecadalNarrative（若視為 s18 相關產出）。

### s19

- **Builder**：無獨立 builder；s19ActionNow, s19LongTerm, s19Avoid 由 getPlaceholderMapFromContext 自 actionNowLayers 拆解與預設值產出。
- **Template 使用**：s19ActionNow, s19LongTerm, s19Avoid。
- **未使用 placeholder**：無。

### s20

- **Builder**：無獨立 builder；s20* 由 getPlaceholderMapFromContext 依 chartJson（decadalTheme, flowYearMingPalace, piercing）與固定文案產出。
- **Template 使用**：s20BenmingLine, s20DecadalLine, s20YearLine, s20CrossChartLine。
- **未使用 placeholder**：無。

### s21

- **Builder**：無獨立 builder；s21LifelongLesson, s21NowSee 由 getPlaceholderMapFromContext 自 recurringHomeworkNarrative、decadalPalace、yearRoleInDecade 等產出。
- **Template 使用**：s21LifelongLesson, s21NowSee。
- **未使用 placeholder**：無。

---

## 五、發現的問題清單

1. **Builder 產出但 template 未引用（s15a）**  
   - overlapSummary, volatileSection, criticalRisksSection, opportunitiesSection, timeWindowScoresSummary, eventProbabilitiesSummary  
   - 以及 keyYearsMineLead, keyYearsWealthLead, keyYearsShockLead（s15a 未用，s15 有補字用）

2. **Builder 產出但 template 未引用（s16）**  
   - yearEventProbabilitiesSummary, yearTimeWindowScoresSummary, yearPathsSummary, yearlyFourTransformSummary, yearlyFourTransformBlocks, yearDecisionSummaryBlock  

3. **Fallback 不會覆寫 V2**  
   - s15a、s16 均有 V2 可用時不寫入 fallback 的邏輯，無「fallback 覆寫 V2」問題。

4. **Placeholder 命名／用途不一致**  
   - s18：getPlaceholderMapFromContext 產出 **blindSpotsDecadalNarrative**，但 template 使用的是 assembleS18 的 **s18BlindSpotLine / s18BodyLine / s18AdviceLine**，blindSpotsDecadalNarrative 未被任何 template 引用。

5. **Section 測試覆蓋不足**  
   - 有專屬或間接測試：s00, s15a, s16；s03/s05/s06 有部分觸及。  
   - 完全未見於測試的 section：s04, s07, s08, s09, s10, s11, s12, s13, s14, s17, s18, s19, s20, s21。

6. **s15a / s16 新 V2 欄位未在 template 曝光**  
   - 事件機率、時間窗評分、路徑摘要、四化摘要、決策摘要等均已在 builder 或 fallback 產出，但 template 仍只使用舊的少數欄位，新內容未呈現在命書文案中。

---

## 六、檢查 s15a template 引用（指定欄位）

| 欄位 | builder 產出 | template 引用 |
|------|--------------|----------------|
| overlapSummary | ✅ buildS15aPlaceholderMapFromV2 | ❌ 未引用 |
| shockBlocks | ✅ | ✅ |
| mineBlocks | ✅ | ✅ |
| wealthBlocks | ✅ | ✅ |
| eventProbabilitiesSummary | ✅ | ❌ 未引用 |
| timeWindowScoresSummary | ✅ | ❌ 未引用 |
| volatileSection | ✅ | ❌ 未引用 |
| criticalRisksSection | ✅ | ❌ 未引用 |
| opportunitiesSection | ✅ | ❌ 未引用 |

**結論**：overlapSummary, eventProbabilitiesSummary, timeWindowScoresSummary, volatileSection, criticalRisksSection, opportunitiesSection 為 **builder 已產出、template 未引用**。

---

## 七、檢查 s16 template 引用（指定欄位）

| 欄位 | builder 產出 | template 引用 |
|------|--------------|----------------|
| yearEventProbabilitiesSummary | ✅ buildS16PlaceholderMapFromV2 | ❌ 未引用 |
| yearTimeWindowScoresSummary | ✅ | ❌ 未引用 |
| yearPathsSummary | ✅ | ❌ 未引用 |
| yearlyFourTransformSummary | ✅ | ❌ 未引用 |
| yearlyFourTransformBlocks | ✅ | ❌ 未引用 |
| yearDecisionSummaryBlock | ✅ fallback（lifeBookPrompts） | ❌ 未引用 |

**結論**：以上六個欄位均為 **builder/fallback 已產出、template 未引用**。

---

*報告結束。僅分析與整理，未修改任何程式碼或 template。*
