# 命書引擎 Architecture Spec v1 — Phase 0 盤點與評估

## 目標

建立「本地推理引擎 + 結構化資料庫」，穩定產出高階命術書；本文件盤點既有資料、對齊六層架構、標示正規化缺口與需補充項目，**既有優先使用、不疊床架屋**。

---

## 一、既有資料與六層對應總覽

| Spec 層 | 既有對應 | 狀態 | 備註 |
|--------|----------|------|------|
| **Layer 1 Normalize** | `exportCalculationResults()` 輸出、`chart_json`、`buildAssembleInput`、`buildS00EventsFromChart` 輸入 | 分散、無單一型別 | 需收斂為 `NormalizedChart`，單一入口 |
| **Layer 2 CCL3** | 見下表 12 張表對應 | 部分有、部分缺 | 需正規化 key、補表或從既有 JSON 重組 |
| **Layer 3 Inference** | diagnosticEngine、rootCauseEngine、tensionEngine、sihuaFlowEngine、chartToAssembleInput、getCurrentDecadalLimit、overlap 標籤 | 邏輯在、未收斂為 5 大 Engine 介面 | 可重構為 palace / sanfang / transformFlow / crossChart / signals |
| **Layer 4 Findings** | `DiagnosticBundle`（tensions, rootCauses, reframes）、`RootCauseFinding`、`TensionFinding` | 已有部分型別，無全書唯一 `LifebookFindings` | 需定義統一 Findings 結構並讓引擎只寫入此處 |
| **Layer 5 Section Assembly** | `getPlaceholderMapFromContext`、各 section 吃 map 的 key | 章節直接或間接讀 chart + content | 需改為「章節只吃 Findings」的組裝層 |
| **Layer 6 Narrative** | `lifebookSection-zh-TW.json`、`resolveSkeletonPlaceholders` | 模板內仍混入判斷用 placeholder（如 currentDecadalPalace） | 模板應只收 findings 產出的欄位 + 語氣 |

---

## 二、Layer 1 Normalize — 既有 vs 目標

### 既有 chart 來源

- **前端**：`adminExport.exportCalculationResults()` → `chart_json`（含 `ziwei`, `bazi`, `fourTransformations`, `overlapAnalysis`, `decadalLimits`, `yearlyHoroscope`, `minorFortuneByPalace` 等）。
- **Worker**：同一 `chart_json`；若無 `sihuaLayers` 則用 `buildSiHuaLayers(chartJson)` 推四化；宮位星曜來自 `ziwei.mainStars` 或 `ziwei.palaces`（majorStars/minorStars/adjectiveStars）。

### 目標 NormalizedChart 與缺口

- **已有**：`chartId`（可從 options 帶入）、`locale`、`nominalAge`/`yearlyHoroscope.age`、`decadalLimits`（需統一 `startAge`/`endAge`/`palace`）、`yearlyHoroscope`、小限可從 `minorFortuneByPalace` + 當年推算。
- **需補**：
  - **mingGong / shenGong**：需從 `ziwei.basic` 或等同欄位明確產出；若目前只有命宮起宮，身宮要從既有邏輯抽一層。
  - **palaces: PalaceStructure[]**：目前星曜在 `ziwei.mainStars`（宮名→星名[]），四化在 `fourTransformations`/`sihuaLayers`，**沒有「單一宮位物件內含 mainStars + assistantStars + shaStars + transformsIn/Out」**。需由現有資料組出 12 個 `PalaceStructure`，且 **四化必須掛在宮位結構上**（現有 edges 可依 toPalace/fromPalace 分到各宮）。
  - **natalTransforms / decadalTransforms**：已有 `buildS00EventsFromChart` → `buildSihuaEdges`；可產出 edge 陣列，再按宮位分為 In/Out。
- **正規化**：宮位 key 統一（例如一律 `命宮`、`僕役宮`）；星曜建議統一用中文名或 star_id 一種為主，與 CCL3 的 `star` 對齊。

**建議**：實作 `normalizeChart(chartJson): NormalizedChart`，內部呼叫既有 `buildSiHuaLayers`、`buildS00EventsFromChart` 與 ziwei 解析，產出單一結構，**不再讓下游直接讀多種 chart 形狀**。

---

## 三、Layer 2 CCL3 — 12 張表與既有內容對應

### 1. stars（星曜核心象）

- **既有**：`worker/content/starMetadata.json`（star id、name_zh、category、base_weight、base_risk）、`starBaseCore-zh-TW.json`（星→一句核心）、`starBaseShadow`、`archetypeStar`。
- **對應**：`star` = star id 或中文名（需定一種為 canonical）、`title` 可從 archetypeStar 或星名、`coreSymbol`/`plainMeaning` 從 starBaseCore 拆或補。
- **缺口**：無統一 `stars` 表 schema；建議以 starMetadata 為底，補 `title`、`coreSymbol`、`plainMeaning` 欄位，或由 starBaseCore + archetypeStar 合併成一表。

### 2. star_tags（星曜標籤）

- **既有**：starMetadata 有 `category`；無 element、archetype、psychologyTags、stressTags、bodyTags、riskWeight、shockWeight。
- **對應**：`riskWeight` 可對 base_risk；category 可對 archetype 部分。
- **需補**：element（五行）、archetype、psychologyTags、stressTags、bodyTags、shockWeight 需新表或新欄位；若不想疊床，可先做「星→標籤陣列」一表，從既有敘述萃取或手填。

### 3. star_psychology

- **既有**：`neuralLoops-zh-TW.json` 為「迴路名→敘事」，非以星為 key；`highPressure` 有情境敘事。
- **缺口**：無「star → egoCore, shadow, defenseMechanism, growthLesson」。
- **建議**：新增 `star_psychology` 表；若預算有限可先做 14 主星，其餘留空或從 starPalacesMain 的敘述反推關鍵詞。

### 4. star_stress_patterns

- **既有**：highPressure 為情境式；無 per-star 的 patternName、innerState、outerState、bodySignals。
- **建議**：新表；可與 star_psychology 一起規劃（同一星可有多筆 stress_patterns）。

### 5. star_life_lessons

- **既有**：分散在 starPalacesMain、narrativeCorpus、各章結論句。
- **建議**：新表 star → lesson, shadowPattern；可從既有敘述整理出每星 1～3 條。

### 6. palaces（宮位核心）

- **既有**：`decadalPalaceThemes.json` 每宮有 theme、narrative；`transformIntoPalaceMeanings.json` 為「祿/權/科/忌_宮位」→ 敘事。
- **對應**：`palace`、`coreTheme` 從 decadalPalaceThemes；`plainMeaning` 可從 narrative 精簡或另欄。
- **缺口**：無單一「宮位核心意涵」表；建議以 decadalPalaceThemes 為底，補 `plainMeaning` 或拆成 coreTheme / plainMeaning。

### 7. palace_tags

- **既有**：`palaceRiskCorpus-zh-TW.json` 為 riskLevel_1～5 的 summary/advice，非 per-palace tags；`decisionMatrix.json` 的 palaceEventWeights 可視為「宮位×決策類型」。
- **缺口**：themeTags、riskTags、opportunityTags、roleType 無現成表。
- **建議**：新表或由 overlap 的 criticalRisks/maxOpportunities/volatileAmbivalences 與宮位對應，產出 riskTags/opportunityTags；themeTags 可從 decadalPalaceThemes 的 theme 拆關鍵詞。

### 8. palace_axis_links（宮位連動）

- **既有**：rootCauseEngine 內隱含「父疾線、財帛→福德、官祿忌入夫妻」等；無顯式 axis 表。
- **建議**：新表 axis, fromPalace, toPalace, meaning；把現有 rootCause 規則與常用軸線（命遷、子田、夫官、兄僕等）寫成資料，供 crossChart / transformFlow 查詢。

### 9. star_pair_patterns（星曜組合象）

- **既有**：`worker/data/star_combinations.zh-TW.json`（若有）；部分邏輯在 tensionEngine 或星曜敘事中。
- **缺口**：需確認 star_combinations 結構；若無則新表 patternKey（如「紫微+鈴星」）, symbol, psychology, scene, bodySignal, diagnosticLine。

### 10. palace_star_patterns（星在宮的特殊診斷）

- **既有**：`starPalacesMain-zh-TW.json`、`starPalacesAux-zh-TW.json` 為「星_宮」→ 敘事；`starPalacesAuxRisk` 為「星_宮」→ 風險等級。
- **對應**：patternKey = 星_宮，diagnosis/scene 即現有敘事；riskHint 可從 AuxRisk 來。
- **正規化**：key 統一為「star_id 或 中文名_宮位標準名」，與 Normalize 層一致。

### 11. cross_chart_rules（三盤聯動規則）

- **既有**：rootCauseEngine 內 R1～R4 為程式碼（overflow, translation, overcompensation, relationship_displacement）；敘事與建議寫死在程式。
- **建議**：**抽出為資料表** ruleId, trigger（如「官祿忌入夫妻」）, diagnosis, lifePattern, advice；現有四類改為讀表，邏輯只負責「比對 edge 與 trigger」，避免疊床。

### 12. risk_signals（紅綠燈）

- **既有**：overlapAnalysis 的 criticalRisks（地雷）、maxOpportunities（機會）、volatileAmbivalences（震盪）；decisionMatrix 的 palaceEventWeights；palaceRiskCorpus 的 riskLevel 文案。
- **對應**：signalId, color（紅/綠/黃）, trigger（宮位+疊加條件）, label, advice 可從既有標籤與 palaceRiskCorpus 組出。
- **建議**：新表或從現有 overlap 結構 + decisionMatrix 產出；trigger 需明確定義（例如「該宮為 criticalRisk 且當年小限落此宮」→ 紅）。

---

## 四、Layer 3 Inference — 既有引擎與 5 大 Engine 對齊

| Spec Engine | 既有邏輯 | 產出對齊 | 建議 |
|-------------|----------|----------|------|
| **palaceInferenceEngine** | buildPalaceContext、starNarrativeForPalace、tensionEngine、palaceWeightRiskAggregator、getPalaceSemantic | 目前輸出分散在 placeholderMap 與 content 混用 | 定義 `PalaceFinding`（宮位主題、星曜敘事、張力、成熟用法），單一函式輸入 PalaceStructure、輸出 PalaceFinding |
| **sanfangInferenceEngine** | starSanfangFamilies、主星星系、部分宮位聯動 | 無獨立 axisConflict / compensationPath | 新做或從現有星系+宮位關係產出；輸入為宮位+三方四正+對宮結構 |
| **transformFlowEngine** | buildSihuaEdges、buildDiagnosticBundle 的 edges、rootCauses、resourceFlows 概念 | 已有 DiagnosticEdge、RootCauseFinding；無統一 resourceFlows/pressureFlows/stackedSignals 型別 | 明確定義輸出型別（resourceFlows, pressureFlows, stackedSignals），由現有 edges + rootCause 邏輯填寫 |
| **crossChartEngine** | getCurrentDecadalLimit、year role、recurringHomeworkNarrative、yearRoleFilterTheme | 已有「當前大限、今年角色、一句建議」等 | 收斂為 cause, climate, result, yearRole 四塊；輸入為本命/大限/流年/小限（來自 NormalizedChart） |
| **signalsEngine** | overlap 標籤（mine/wealth/shock）、decisionMatrix、keyYears | 已有 xiaoXian 地雷/機會/震盪、keyYears 區塊 | 明確定義 redSignals, greenSignals, shockSignals；輸入為四化疊加、煞星、年份（與 overlap + minorFortune 對齊） |

**原則**：同一件事只算一次。例如「官祿忌入夫妻」在 transformFlowEngine 或 crossChartEngine 只產出一筆 Finding，Section Assembly 只引用該 Finding，不重複計算。

---

## 五、Layer 4 Findings — 統一診斷物件

### 既有型別

- `DiagnosticBundle`: tensions, rootCauses, reframes
- `RootCauseFinding`: type, sourcePalace, symptomPalace, evidence, narrative, advice
- `TensionFinding`: label, severity, palaces, evidence, narrative, cost, advice

### Spec 的 LifebookFindings 與對應

| Finding 型別 | 既有對應 | 缺口 |
|--------------|----------|------|
| MainBattlefield | 分散在 s00 主戰場、currentDecadalPalace 等 | 明確定義 palace, label, reason, layer；由 palace + crossChart + transformFlow 產出 |
| PressureOutlet | 部分在 TensionFinding、高壓情境 | 補 type, bodySignals, narrative |
| OpportunityField | 分散在 overlap 機會區、敘事 | 補 palace, source, narrative |
| SpilloverFinding | 即 RootCauseFinding（sourcePalace→targetPalace） | 對齊 severity, narrative, advice；可視為 RootCauseFinding 的別名或擴充 |
| CrossChartFinding | 目前為多個 placeholder（currentDecadalTheme, yearRole, recurringHomework） | 收斂為 cause, climate, result, narrative, yearRole |
| YearSignal | 小限/流年標籤（地雷/機會/震盪） | 補 year, palace, color, label, advice |
| KeyYearFinding | keyYearsMine/Wealth/Shock 區塊 | 補 year, age, palace, signal, narrative, advice |
| LifeLessonFinding | recurringHomeworkNarrative、s21 收束 | 補 theme, line, source |
| ActionItem | actionNowLayers、s19 立刻可做/長期/避開 | 補 horizon, do, avoid, why |

**建議**：定義 `LifebookFindings` 為單一物件，內含以上各陣列/欄位；所有 Engine 只寫入此物件，**章節與模板僅能讀 LifebookFindings，不讀 chart**。

---

## 六、Layer 5 Section Assembly — 章節只吃 Findings

### 現狀

- 各 section 透過 `getPlaceholderMapFromContext(chartJson, sectionKey, content, …)` 取得一組 key-value；map 內混入 chart 推算結果（如 currentDecadalPalace）與 content 文案。
- 章節與 chart、content 緊耦合。

### 目標

- 每章明確定義「只吃哪些 Findings」；Assembly 層負責從 `LifebookFindings` 取出對應欄位，組成該章所需的「章節輸入」結構（例如 s00 吃 mainBattlefields, spilloverFindings, yearSignals, lifeLessons）。
- 你已列的 s00/s03/s02～s14/s15/s18～s21 對應表可直接當作 Section Assembly 的 spec；實作時改為「由 Findings 組裝」，不再呼叫 getPlaceholderMapFromContext 讀 chart。

### 需補

- 每個 section_key 對應一介面（例如 S00Input、S15Input），其欄位全部來自 LifebookFindings；Assembly 函式簽名為 `assembleSection(sectionKey, findings): SectionInput`。

---

## 七、Layer 6 Narrative Template — 只做語氣

### 現狀

- `lifebookSection-zh-TW.json` 的 structure_analysis 內有 `{currentDecadalPalace}`、`{yearRoleInDecade}` 等，這些來自「對 chart 的判斷」。
- 若嚴格遵守「模板不讀命盤」，應改為 `{currentDecadalLabel}`、`{yearRoleLabel}` 等由 **Findings 產出** 的欄位；模板只負責句式與語氣（如你列的 Template 1～5）。

### 建議

- 模板參數全部改為「Findings 或 Assembly 產出的欄位」；例如「你這段時間真正的主題，不是{surface}，而是{coreTheme}」中的 surface/coreTheme 來自 CrossChartFinding 或 MainBattlefield，不來自 chart。
- 現有 placeholders 可逐一對照：若該 key 目前由 chart 推算，則改為由 Findings 提供，模板只保留句型。

---

## 八、資料正規化要點

1. **宮位**：全專案統一用「命宮、兄弟宮、…、父母宮」或統一用 id（如 ming, xiongdi, …）；建議 CCL3 與 NormalizedChart 同一套，現有 toPalaceCanonical / normPalace 可收斂為單一 normalizer。
2. **星曜**：starMetadata 用 star_id；starPalacesMain 用「紫微_命宮」中文。建議 CCL3 表用 star_id + 宮位 id，對外顯示再轉中文；或全用中文，但一致。
3. **四化**：已有 TransformType = lu|quan|ke|ji；邊的 from/to 與層級（birth/decade/year）與現有 DiagnosticEdge 一致，Normalize 層產出 edges 時即用此型別。
4. **單一來源**：同一事實只存一處（例如「當前大限宮位」只在 LifebookFindings 的 CrossChartFinding 或專用欄位；章節與模板只讀此處）。

---

## 九、需你決策或補充的項目

1. **身宮**：目前 repo 身宮從何處來？若已有（例如 bodyPalace、身主），請指出欄位與計算來源，以便寫入 NormalizedChart.shenGong。
2. **star_psychology / star_stress_patterns**：是否接受「先做 14 主星、其餘後補」？若希望全覆蓋，需估計從既有敘述萃取或手填的工作量。
3. **cross_chart_rules 表**：是否同意把 rootCauseEngine 的 R1～R4 改為「規則表 + 通用比對邏輯」？若同意，我會建議表結構與一筆範例（如「官祿忌入夫妻」）。
4. **紅綠燈 trigger**：risk_signals 的 trigger 要多細？例如「小限落宮 + 該宮為 criticalRisk」一筆、「流年忌疊該宮」另一筆，還是先粗分「地雷/機會/震盪」三色即可？
5. **Phase 1 範圍**：你列的先做 star_tags, palace_tags, star_psychology, star_pair_patterns, cross_chart_rules, risk_signals；其中 star_psychology、star_pair_patterns 目前缺口較大，是否 Phase 1 先做「有既有資料可對齊」的 4 張（star_tags, palace_tags, cross_chart_rules, risk_signals），其餘 Phase 1.5？

---

## 十、施工順序建議（不變更你原訂 Phase 0～6）

- **Phase 0**：以本文件為盤點結果；必要時補一頁「既有檔案清單」與「NormalizedChart 欄位與現有 key 對照表」。
- **Phase 1**：CCL3 先建「有現成資料可對應」的表（stars, palaces, palace_star_patterns 從既有 JSON 重組；cross_chart_rules、risk_signals 從現有邏輯抽表）；star_tags / palace_tags 補欄位；star_psychology / star_pair_patterns 視你決策做部分或延後。
- **Phase 2**：定義 LifebookFindings schema，並讓現有 DiagnosticBundle / RootCauseFinding / TensionFinding 對應進去，再補其餘 Finding 型別。
- **Phase 3**：五個 Engine 介面與實作；優先 palaceInference、transformFlow、crossChart，輸入改為 NormalizedChart 或 Findings 寫入處。
- **Phase 4～6**：依你原訂模組二改造 → 模組一回收 → AI 僅語氣。

若你提供身宮來源與上述決策（2）（3）（4）（5），我可以下一版直接產出「NormalizedChart 型別定義」、「LifebookFindings 型別定義」與「CCL3 表 schema 初稿」三個具體檔案草案，供你貼進 repo。
