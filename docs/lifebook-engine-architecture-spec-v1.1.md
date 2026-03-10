# 命術書引擎 Architecture Spec v1.1（施工補充規格）

## 核心原則（寫在最前）

**命術書系統的核心輸入不是 chart，而是 findings。**  
Chart 只進 normalize 與 inference engine；章節、模板、輸出一律只讀 findings。

---

## 一、Layer 1：NormalizedChart 與 normalizeChart()

### 1.1 最終型別

見程式碼：`worker/src/lifebook/normalizedChart.ts`

- `NormalizedChart`：chartId, locale, nominalAge, flowYear, mingGong, shenGong, shenGongSource?, lifeLord?, bodyLord?, palaces[], natalTransforms[], decadalLimits[], currentDecade?, yearlyHoroscope?, xiaoXian?
- `PalaceStructure`：palace, mainStars[], assistantStars[], shaStars[], miscStars[], leadMainStar?, coLeadMainStars?, 各層 TransformsIn/Out
- `StarInPalace`：name, brightness?, natalTransform?, riskLevel?
- `TransformEdge`：fromPalace, toPalace, transform（祿|權|科|忌）, layer, starName?
- `BodyPalaceSource`：`"chart.shenGong"` | `"chart.bodyPalace"` | `"derived"` | `"missing"`

### 1.2 身宮來源（spec 寫死）

1. 優先：`chartJson.shenGong`
2. 其次：`chartJson.bodyPalace`
3. 若盤資料沒有，才走既有推導邏輯
4. 若仍無，設 `shenGong = undefined`，不可亂補
5. normalize 時寫入 `shenGongSource`，方便 debug

### 1.3 normalizeChart() 職責（只做標準化，不做命理判斷）

- 統一宮名：官祿/官祿宮 → 官祿宮（`toPalaceCanonical`）
- 統一星名：去空白、支援別名正規化
- 亮度標準化：廟/旺/得/利/平/陷/不；**得 → 利** 單一規則（`toBrightnessCanonical`）
- 四化標準化：祿權科忌 / lu quan ke ji → 單一 enum（`toTransformDisplay`）
- 建立 palaces[]、natalTransforms、decadalLimits、yearlyHoroscope、xiaoXian
- 依 nominalAge 找出 currentDecade

---

## 二、Layer 2：CCL3 表（缺表補齊）

Schema 與種子資料見 `worker/content/ccl3/`：

| 表名 | 檔案 | 用途 |
|------|------|------|
| star_tags | star-tags.json | 星曜標籤（五行、原型、心理/壓力/體感、shockWeight） |
| star_psychology | star-psychology.json | 星曜心理（egoCore, shadow, defenseMechanism, growthLesson） |
| star_stress_patterns | star-stress-patterns.json | 星曜壓力模式（patternName, innerState, outerState, bodySignals） |
| star_life_lessons | star-life-lessons.json | 星曜人生功課（lesson, shadowPattern） |
| palace_tags | palace-tags.json | 宮位標籤（themeTags, riskTags, opportunityTags, roleType） |
| palace_axis_links | palace-axis-links.json | 宮位連動軸（父疾線、子田線、夫官線等） |
| cross_chart_rules | cross-chart-rules.json | 三盤聯動規則（trigger: transform+from+to, diagnosis, lifePattern, advice） |
| risk_signals | risk-signals.json | 紅綠燈（signalId, color, trigger, label, advice） |

**cross_chart_rules**：程式只做「比對 edge、查表、組 findings」，不在 engine 裡硬寫 diagnosis 句。

---

## 三、Layer 4：LifebookFindings 定稿

見程式碼：`worker/src/lifebook/lifebookFindings.ts`

- `LifebookFindings`：mainBattlefields[], pressureOutlets[], spilloverFindings[], crossChartFindings[], yearSignals[], keyYears[], lifeLessons[], actionItems[]
- 各子型別：MainBattlefield, PressureOutlet, SpilloverFinding, CrossChartFinding, YearSignal, KeyYearFinding, LifeLessonFinding, ActionItem

章節、模板、section assembler **一律只讀 LifebookFindings**，不准直接讀 chart。

---

## 四、Layer 5 / 6：章節與模板只讀 Findings（硬規範）

### 允許

- **assembleS15 等 assembler** 可讀：findings、section metadata、template registry
- **renderSection** 只能讀：template、placeholder map
- **placeholderMapBuilders** 只能從：findings、assembly context 取值

### 禁止

- 直接在模板渲染階段讀 chart
- 直接在章節階段重新跑命理規則
- 直接在 section JSON 裡綁 chart 欄位名（如 currentDecadalPalace 應改為 findings 產出的欄位）

---

## 五、施工順序

| Phase | 內容 |
|-------|------|
| **P0** | 定 contract：NormalizedChart、normalizeChart()、LifebookFindings、章節只讀 Findings 原則寫進 docs ✅ |
| **P1** | 補 CCL3 資料表：star_tags → star_psychology → star_stress_patterns → star_life_lessons → palace_tags → palace_axis_links → cross_chart_rules → risk_signals |
| **P2** | 重構 engine：normalize 層落地、rootCauseEngine → cross_chart_rules、overlap/decisionMatrix → risk_signals、findings builder 出總物件 |
| **P3** | 重構模組二：s15、s18、s19、s20、s21 只吃 findings |

---

## 六、資料正規化（最終決定）

- **宮位**：全系統統一「X宮」（命宮、兄弟宮、…、父母宮）；僕役宮與交友宮視為同宮，正規化為僕役宮。
- **星名**：CCL3 與 Findings 使用中文名（紫微、天機、…）；NormalizedChart 內星名亦統一中文，與 starPalacesMain 一致。
- **亮度**：得 → 利；允許值廟|旺|利|平|陷|不。
- **四化**：祿權科忌；TransformEdge 使用 display 型（祿|權|科|忌），與 cross_chart_rules.trigger 一致。
