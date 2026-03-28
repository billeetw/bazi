# 命書系統：技術債盤點、資料正規化與來源收斂建議（v2）

本文盤點命書／模組二相關的**技術債**、**資料正規化缺口**、**資料來源疊床架屋**，並提出修正建議。**v2 核心修正**：不再把 overlap.items 視為四化流向邊的唯一真相來源並用 mutagenStars 覆寫星名；改為「三種權威分離、禁止混源」，並在邊的產出上擇一（API 權威且驗證 vs worker 權威重建）。

**本期決策（可執行）**  
- **本期正式採路線 B。**  
- **模組二所有四化流向與統計，一律只讀 NormalizedChart.\*.flows。**

**進階規格評估**：命盤唯一基礎資料模型（NatalChart.palaceByBranch、流年命宮查表、四化僅由天干、每層 4 條、FLOW_DEBUG）見 **docs/lifebook-chart-unified-model-evaluation.md**。

---

## 一、引擎與模組清單（可能技術債來源）

| 模組／引擎 | 用途 | 主要輸入／輸出 | 備註 |
|------------|------|----------------|------|
| **normalizeChart** | chartJson → NormalizedChart（單一入口） | chartJson → NormalizedChart | 目前四化邊來自 overlap.items，星名再以 mutagenStars 覆寫 → **混源** |
| **normalizeTransforms / getTransformsByLayer** | 從 overlap 產出四化邊並分層 | chartJson → { natal, decade, year } TransformEdge[] | 只讀 overlap.items；小限層已移除 |
| **buildTransformFlowLines / getFlowBlockForPalace** | 依 NormalizedChart 四層產出流向敘事 | NormalizedChart → 流向字串 | 底層邊若來自 overlap，則「星名對、邊錯」仍會發生 |
| **resolveCurrentTimeContext** | 解析當前大限、流年 | decadalLimits, yearlyHoroscope, liunian → currentDecade, YearScope | 時間層僅 natal / decade / year |
| **buildLifebookFindings** | 協調四引擎產出 LifebookFindings | chart + content → LifebookFindings | P2 主路徑 |
| **spilloverEngine / crossChartEngine** | 壓力溢流、跨盤綜述 | NormalizedChart, rules → findings | 依賴 chart 的 transforms／flows |
| **diagnosticEngine / buildPiercingDiagnosticBundle** | 張力、根因、重構敘事 | chartJson（**不**含已廢止 sihuaLayers 權威）→ DiagnosticBundle | 與 normalizeChart 對齊時以 findings／四化單一契約為準 |
| **buildSiHuaContext / buildSiHuaLayers** | 四化層級（benming/decadal/yearly） | chartJson → SiHuaContext / SiHuaLayers | 與 overlap 並行，建議收斂或降級 |
| **buildSihuaFlowSummary** | 單宮「四化流向 + 四化能量總結」 | chartJson, palaceKey → 字串 | 已用 getFlowBlockForPalace；能量總結仍用 overlap |
| **buildTimeModuleDisplayFromChartJson** | 模組二時間／四化**顯示**字串 | chartJson → birth/decade/flowYear 四化 + 宮位 | **顯示層單一產出**，不讀 overlap；小限已移除 |
| **getPlaceholderMapFromContext** | 全 placeholder 組裝 | ctx, opts → map | 時間區塊應只吃 buildTimeModuleDisplayFromChartJson |
| **collectFourTransformsForPalace** | 單宮四化線（overlap） | chartJson, palaceKey → FourTransformLine[] | 僅讀 overlap；待收斂為只讀 chart.*.flows |
| **validateTimelineConsistency** | 時間軸一致性 | NormalizedChart → TimelineValidationIssue[] | 需擴充 **edge 層級** 驗證（見下） |

---

## 二、問題本質：混源導致「星名對、邊錯」

目前做法：

- **邊的 fromPalace / toPalace**：來自 **overlap.items[].transformations**
- **邊的 starName**：來自各層 **mutagenStars** 覆寫

結果是**混源**：星名與 from/to 來自不同事實來源。overlap.items 的 layer／star／from／to 可能不準，實務上已出現：

- 小限四化**顯示**正確（天機化忌）
- 四化**流向**卻寫「小限天機化忌：從官祿宮出，入夫妻宮」→ 星名對了，但**邊仍可能是錯的**

因此：**overlap.items 目前不是可靠的 edge authority**。不應把它文件化成「四化邊唯一來源」，否則會把 bug 變成 contract。

---

## 三、P0：三種權威資料，禁止混源

在修正前，必須先約定三種權威，且**不得混用**。

### 3.1 宮位權威

| 概念 | 權威來源 |
|------|----------|
| 大限宮位 | `decadalLimits[current].palace`（依 nominalAge 取當前大限） |
| 流年命宮 | `liunian.palace` / `liunian.destinyPalace`；缺時由 `liunian.branch` + `ziwei.core.minggongBranch` 推算 |

（小限已從系統移除；時間層僅保留本命／大限／流年。）

**前端排盤順序（地支→宮位）**：由 `ziwei.core.minggongBranch`（命宮地支）決定；前端 `buildSlotsFromZiwei` 使用與 worker 一致的 **寅起地支環**（寅=0 … 亥=9 子=10 丑=11），公式 `palaceIndex = (mingIdx - idx + 12) % 12`。命宮地支來源為 **API/iztro** 的 `earthlyBranchOfSoulPalace`；若與他平台（如午→疾厄）不一致，需查 iztro 起命宮規則或傳入參數是否正確。

### 3.2 四化星名權威（祿權科忌對應哪顆星）

| 層級 | 權威來源 |
|------|----------|
| 本命 | `fourTransformations.benming.mutagenStars` |
| 大限 | `decadalLimits[current].mutagenStars` |
| 流年 | `liunian.mutagenStars`（或 fourTransformations.liunian / yearlyHoroscope 依契約 fallback） |

### 3.3 四化流向權威（整條 edge：from / to / star / transform）

**必須擇一，不能「from/to 用 A、star 用 B」混搭。**

- **路線 A：API／前端提供完整且正確的四化邊**
  - overlap.items[].transformations 為**權威**，每筆須含：layer、star、transform、fromPalace、toPalace，且與各層 mutagenStars **同源**。
  - Worker 只**驗證**後使用；驗證不過則不採用（或報錯／降級）。
  - 優點：worker 簡單，不必重建飛星規則。缺點：上游錯則整條錯；目前實務即為此狀況。

- **路線 B：Worker 內以權威 transforms 重建 edge（建議）**
  - **星名與類型**：來自各層 mutagenStars／transforms。
  - **fromPalace**：由該星在本命盤實際落宮推得。
  - **toPalace**：由該層飛化規則算得。
  - overlap 僅做對照、標籤、摘要，**不當最終 edge 來源**。
  - 優點：單一真相來源，不再「星名對、邊錯」。缺點：worker 要實作完整規則，前期成本較高。

**契約條文建議：**

- **不得**再使用「overlap 給 from/to + mutagenStars 補 starName」的混合模式。
- 若採 **API 提供 edge**：overlap.items 為權威，worker 僅驗證後使用。
- 若採 **worker 重建 edge**：overlap.items 僅作輔助，不得用於生成最終流向。

---

## 四、資料來源對照（疊床架屋現狀）

### 4.1 四化星名與邊的雙軌

| 概念 | 顯示用（已收斂） | 流向用（目前混源） |
|------|------------------|----------------------|
| 本命四化 | fourTransformations.benming.mutagenStars | overlap.items（layer=本命）+ 星名可被覆寫 |
| 大限四化 | decadalLimits[current].mutagenStars | overlap.items（layer=大限）；from/to 仍來自 overlap |
| 流年四化 | liunian / yearlyHoroscope.mutagenStars | overlap.items；同上 |

### 4.2 Overlap 新舊格式

- **overlap.items[]**：新格式，被 getTransformsByLayer 讀取產邊；layer/star/from/to 可能不準。
- **criticalRisks / maxOpportunities / volatileAmbivalences**：舊格式，用於 tag 計數、部分顯示補齊；不參與目前邊產出。

---

## 五、修正建議（改寫版）

### 5.1 短期（立約與止損）

1. **文件化「四化流向邊的單一事實來源」與禁止混源（取代原 4.1.1）**
   - **不要**寫成：「四化邊唯一來自 overlap.items」。
   - **要**寫成：
     - 四化流向邊的**單一事實來源必須一致**（整條 edge 的 star / transform / fromPalace / toPalace 同源）。
     - 現階段**不得**再使用「overlap 邊 + mutagenStars 覆寫星名」的混合模式。
     - 若採 **API 提供 edge**：overlap.items 為權威，worker 僅驗證後使用。
     - 若採 **worker 重建 edge**：overlap.items 僅作輔助，不得用於生成最終流向。

2. **單一時間／四化顯示函式**
   - 模組二時間與四化**顯示**字串，**唯一**由 `buildTimeModuleDisplayFromChartJson()` 產出（birthSihuaLine、currentDecadeSihuaLine、flowYearMingPalace、flowYearSihuaLine、xiaoXianPalaceName、xiaoXianSihuaLine）。
   - 此層**不再讀 overlap**；其 fallback 順序（decadalLimits 當前大限、fourTransformations、ziwei 等）寫入契約。

3. **chartJson 契約（三種權威簡表）**
   - 在契約中明確列出：
     - **宮位權威**：decadalLimits[current].palace、liunian.palace/destinyPalace、resolveXiaoXianPalaceByAge(nominalAge)。
     - **四化星名權威**：fourTransformations.benming、decadalLimits[current].mutagenStars、liunian.mutagenStars、yearlyHoroscope.mutagenStars。
     - **四化流向權威**：二選一（overlap.items 且通過驗證 vs worker 重建），並註明「不得混源」。

### 5.2 Edge 層級驗證（新增）

在既有 `validateTimelineConsistency` 之外，新增 **validateTransformEdgeConsistency(chart)**，專門檢查每一層 edge 與權威四化是否一致：

| 檢查項 | 說明 |
|--------|------|
| **星名一致** | 該層 edge 出現的星名必須在該層 mutagenStars 中；例如小限層不可出現「太陽化忌、廉貞化祿」若權威為貪狼祿、太陰權、右弼科、天機忌。 |
| **層級一致** | 大限 edge 不可出現小限星名；小限 edge 不可出現流年星名。 |
| **目標宮位一致** | 若某年標示「小限在夫妻宮」，該年小限 edge 的 toPalace（或相關宮位）應與夫妻宮一致，否則可報 warning。 |
| **缺邊／缺層** | 若某層應有四化但 edge 為空，報 warning 或 error。 |

### 5.3 三層修法（徹底修正）

- **第一層：顯示層**  
  全部只吃單一函式 `buildTimeModuleDisplayFromChartJson()`，產出 birthSihuaLine、currentDecadePalace、currentDecadeSihuaLine、flowYearMingPalace、flowYearSihuaLine、xiaoXianPalaceName、xiaoXianSihuaLine。**此層不再讀 overlap。**

- **第二層：NormalizedChart 層**  
  只存「已正規化後的權威層資料」，並**拆成兩種欄位**：
  - **transforms（星名＋類型）**：chart.natal.transforms、chart.currentDecade.transforms、chart.yearlyHoroscope.transforms、chart.xiaoXian.transforms。
  - **flows（整條 edge）**：chart.natal.flows、chart.currentDecade.flows、chart.yearlyHoroscope.flows、chart.xiaoXian.flows。  
  不再用同一個 `transforms` 同時表示「星名」與「邊」；邊的 from/to 與 star 必須同源（路線 A 或 B 擇一）。

- **第三層：敘事模組**  
  關鍵年份【四化流向】、三盤疊加【四化流向】、單宮四化統計，**一律只從** chart.*.flows 篩選產出，不再回頭讀 overlap 或 chartJson。

### 5.4 資料模型升級建議

```ts
type TransformType = "祿" | "權" | "科" | "忌";

/** 該層四化定義：星名 + 類型，來源為權威 mutagenStars */
type TransformDef = {
  star: string;
  transform: TransformType;
  source: "benming" | "decade" | "year" | "xiaoxian";
};

/** 整條流向邊：同源產出，可驗證 */
type TransformFlow = {
  layer: "natal" | "decade" | "year" | "xiaoxian";
  star: string;
  transform: TransformType;
  fromPalace: string;
  toPalace: string;
  sourceOfTruth: "api-edge" | "worker-derived";
};

/** 每層結構 */
interface TimeScopeWithFlows {
  palace: string;
  transforms: TransformDef[];   // 權威星名+類型
  flows: TransformFlow[];       // 權威邊，敘事只讀此
}
```

每層（natal / currentDecade / yearlyHoroscope / xiaoXian）皆具備 `palace`、`transforms`、`flows`，便於驗證與單一讀取。

### 5.5 中長期

1. **邊產出擇一落實**：要麼 API 權威（overlap.items 完整且通過 validateTransformEdgeConsistency），要麼 worker 權威重建 edge；徹底廢除「overlap 邊 + mutagenStars 覆寫星名」。
2. **sihuaLayers 收斂或降級**：worker 已改為 **wire 不驅動正文**、僅 diff；與 NormalizedChart **同源**的顯示層為 `buildSiHuaLayers`（見 `lifebook-sihua-single-source-phase1.md`）。
3. **模組二只吃 Findings + 單一時間顯示**：時間章節 placeholder 盡量來自 LifebookFindings + timeContext；顯示字串唯一經 buildTimeModuleDisplayFromChartJson 寫入。

---

## 六、下一步執行順序（P0–P3）

| 階段 | 內容 |
|------|------|
| **P0** | 立約：寫一份簡短契約，只講三件事——(1) 宮位顯示權威是誰、(2) 四化星名權威是誰、(3) 四化流向 edge 權威是誰（二選一）；三件事不再模糊。 |
| **P1** | 止混源：程式上**全面禁止**「overlap 給 from/to + mutagenStars 補 starName」；若目前仍存在此路徑，改為報錯或降級，不產出流向。 |
| **P2** | 拍板 edge 由誰產：要麼上游權威生成 edge（並實作驗證），要麼 worker 權威生成 edge；不能兩邊各出一半。 |
| **P3** | **Phase 1–3（worker）已完成**：`buildSiHuaLayers` 為權威；`sihuaLayers` wire 已 deprecated（僅 diff）；顯式覆寫用 `lifebookSiHuaDisplayOverride`（見 `docs/lifebook-sihua-single-source-phase1.md`）。**剩餘**：前端／API 停止把 `sihuaLayers` 當權威送進來；舊文件與呼叫端全面改指單一契約。 |

---

## 七、小結與總評

| 類型 | 現狀 | 建議 |
|------|------|------|
| **技術債** | 引擎多、同一概念多處產出；邊與星名曾混源 | 三種權威分離；禁止混源；edge 擇一產出；顯示層單一函式 |
| **資料正規化** | NormalizedChart 有，但邊仍來自 overlap + 星名覆寫 → 混源 | 拆成 transforms（星名）與 flows（邊）；flows 與星名同源 |
| **疊床架屋** | 大限／流年／小限在 decadalLimits、fourTransformations、overlap 多處；流向邊依 overlap | 宮位／星名／邊三權威寫入契約；邊僅一源（API 驗證 或 worker 重建） |
| **再發防範** | 曾以「分層再篩選 + 星名覆寫」改善顯示，但邊仍錯 | 立約 + edge 驗證 + 禁止混源；敘事只讀 chart.*.flows |

**總評**：盤點在技術債與來源拆解上**合理且完整度高**；扣分點在於先前仍把「四化邊唯一來自 overlap.items」列為短期建議，等於把不可靠的現狀制度化。v2 已改為：**四化流向邊的單一事實來源必須一致，禁止 overlap 邊 + mutagenStars 覆寫星名的混合模式**，並以 P0–P3 與三層修法、edge 驗證、資料模型升級為徹底修正路徑。

---

## 附錄 A：輸出讀取矩陣

以下列出與**宮位／四化／時間**相關的輸出欄位，其**唯一允許讀取來源**與**禁止來源**。實作時所有消費端（模板替換、組裝、敘事模組）應只從「唯一來源」讀取；禁止來源不得用於產出該欄位。

| 輸出欄位 | 唯一來源 | 禁止來源 |
|----------|----------|----------|
| **birthSihuaLine**（生年四化字串） | `buildTimeModuleDisplayFromChartJson(chartJson).birthSihuaLine`；其內部讀取 `fourTransformations.benming.mutagenStars`（可 fallback ziwei） | 不得從 overlap.items、collectFourTransformsForPalace、sihuaLayers 組此欄位 |
| **currentDecadalPalace**（目前大限宮位） | 依 nominalAge 從 `decadalLimits` 取當前大限之 `palace`（可 fallback ziwei.decadalLimits）；或 timeContext.currentDecadePalace（P2） | 不得從 overlap、fourTransformations、流年宮位 推得 |
| **currentDecadeSihuaLine**（目前大限四化字串） | `buildTimeModuleDisplayFromChartJson(chartJson).currentDecadeSihuaLine`；其內部優先 `decadalLimits[current].mutagenStars`，再 fallback `fourTransformations.decadal` | 不得從 overlap.items（layer=大限）、sihuaLayers.decadal 組此欄位 |
| **flowYearMingPalace**（流年命宮） | `buildTimeModuleDisplayFromChartJson(chartJson).flowYearMingPalace`；其內部讀取 liunian.palace / destinyPalace，缺時由 liunian.branch + ziwei.core.minggongBranch 推算 | 不得從 yearlyHoroscope.activeLimitPalaceName、overlap、大限宮位 當流年命宮 |
| **flowYearSihuaLine**（流年四化字串） | `buildTimeModuleDisplayFromChartJson(chartJson).flowYearSihuaLine`；其內部讀取 liunian.mutagenStars / fourTransformations.liunian / yearlyHoroscope（禁止大限 fallback） | 不得從 fourTransformations.decadal、overlap.items（layer=大限）組此欄位 |
| **xiaoXianPalaceName**（小限宮位） | `resolveXiaoXianPalaceByAge(nominalAge)`（固定順序）；或 timeContext.xiaoXianPalace（P2） | 不得從 overlap、流年命宮、yearlyHoroscope.activeLimitPalaceName 當小限宮位權威 |
| **xiaoXianSihuaLine**（小限四化字串） | `buildTimeModuleDisplayFromChartJson(chartJson).xiaoXianSihuaLine`；其內部讀取 yearlyHoroscope.mutagenStars / fourTransformations.xiaoxian（禁止流年／大限 fallback） | 不得從 liunian、decadal、overlap.items（layer=流年/大限）組此欄位 |
| **currentDecadalTheme**（大限主題敘事） | getDecadalPalaceTheme(currentDecadalPalace) + 本命／大限四化敘事；四化星名來自 decadalLimits[current].mutagenStars | 不得從 overlap 的 star 當大限星名權威 |
| **currentDecadalHomework**（十年核心功課） | 同上；星名與類型僅來自 decadalLimits[current].mutagenStars | 同上 |
| **關鍵年份【四化流向】**（每宮段落內） | `getFlowBlockForPalace(chart, item.palaceName)`，其中 chart 為 NormalizedChart；**只讀 chart.*.flows**（實作升級後）或通過驗證的 chart.*.transforms（過渡期） | 不得從 overlap.items[].transformations、collectFourTransformsForPalace 產出；禁止「overlap 邊 + mutagenStars 覆寫星名」 |
| **三盤疊加【四化流向】**（單宮技術區塊） | 同上；只讀 chart.*.flows（或通過驗證的 transforms） | 同上 |
| **單宮 sihuaFlowSummary**（12 宮四化流向+能量總結） | buildSihuaFlowSummary：流向段只讀 getFlowBlockForPalace(chart, palaceKey)；能量總結可仍用 overlap 彙總至另有契約為止 | 流向段禁止從 collectFourTransformsForPalace、raw overlap 產出 |
| **四化統計（祿／忌幾重）** | 由 chart.*.flows 篩選該宮後統計（實作升級後）；過渡期可從 overlap 彙總但不得與流向段混源 | 不得與流向段使用不同層級的邊來源 |
| **xiaoXianMineBlocks / xiaoXianWealthBlocks / xiaoXianShockBlocks**（關鍵年份疊宮區塊） | buildOverlapDetailBlocks(overlap, opts)；區塊內【四化流向】須來自 getFlowBlockForPalace(chart, item.palaceName)，不從 item.transformations 組流向 | 區塊內四化流向禁止僅從 item.transformations（overlap）產出 |
| **yearRoleInDecade / yearOneLineAdvice** 等 | LifebookFindings + timeContext（P2）；或 getPlaceholderMapFromContext 內從 chart + content 推導；不依賴 overlap 的 edge | 不依賴 overlap.items 的 layer/star 當權威 |

**說明**：上表僅涵蓋與時間／四化／宮位權威直接相關的欄位。其餘 placeholder（如 s15MainBattlefield、recurringHomeworkNarrative、各宮星曜敘事等）依既有 lifebook-source-of-truth 與 section 組裝契約，其唯一來源見各節說明。

---

## 附錄 B：Edge 驗證規格

本附錄定義 **validateTransformEdgeConsistency(chart)** 的錯誤分級、驗證失敗時的降級策略，以及路線 A／B 各自的驗證條件。實作時應依所選路線與分級產出 `TimelineValidationIssue[]` 或等價結構，並依降級策略決定是否使用該層 flows。

### B.1 錯誤分級（error / warning）

| 等級 | 代碼建議 | 情境 | 說明 |
|------|----------|------|------|
| **error** | E_EDGE_STAR_MISMATCH | 該層 edge 中出現的 (star, transform) 不在該層權威 mutagenStars 中 | 例如小限層權威為天機忌、貪狼祿…，卻出現「太陽化忌」「廉貞化祿」 |
| **error** | E_EDGE_LAYER_CROSS | 大限 edge 出現小限或流年星名；小限 edge 出現流年或大限星名；流年 edge 出現大限或小限星名 | 層級與權威星名所屬層級不符 |
| **error** | E_EDGE_SOURCE_MIX | 偵測到「邊的 from/to 來自 A、星名來自 B」的混源產出（例如邊來自 overlap、星名來自 mutagenStars 覆寫） | 契約禁止之混源模式 |
| **warning** | W_EDGE_TO_PALACE_MISMATCH | 該層標示宮位（如小限在夫妻宮）與該層 edge 的 toPalace 分布不一致（例如無任何 edge 的 toPalace 為夫妻宮） | 目標宮位與標示可能不符 |
| **warning** | W_EDGE_LAYER_EMPTY | 該層應有四化（有 mutagenStars 或契約要求），但 flows 為空 | 缺邊／缺層，可能導致流向段落為空 |
| **warning** | W_EDGE_FROM_TO_INVALID | 單筆 edge 的 fromPalace 或 toPalace 為空、或不在 12 宮 canonical 名單內 | 邊不完整或宮位 key 錯誤 |

### B.2 驗證失敗的降級策略

| 情境 | 建議行為 |
|------|----------|
| 任一 **error** 存在 | **不採用**該層 edge 作為流向產出來源；該層 flows 視為不可信，敘事模組不讀取該層，或改為輸出「（該層四化流向驗證未通過，暫不顯示）」；可將 issue 回傳給呼叫端／log。 |
| 僅 **warning** 存在 | 仍可採用該層 edge，但應 log 或回傳 issue，供除錯與上游修正；若為 W_EDGE_LAYER_EMPTY，該層流向段自然為空。 |
| 混源偵測（E_EDGE_SOURCE_MIX） | 立即停止使用「overlap 邊 + mutagenStars 覆寫」路徑；若尚未實作路線 A 或 B，降級為不產出流向，或僅產出「星名列表」不含 from/to。 |

### B.3 路線 A（API 提供 edge）的驗證條件

當契約約定「overlap.items 為四化流向邊權威」時，worker 在採用前**必須**通過以下驗證：

| 檢查項 | 條件 | 失敗時 |
|--------|------|--------|
| 星名一致 | 每筆 overlap.items[].transformations 的 (layer, star, transform) 與該層權威 mutagenStars 一致（本命→fourTransformations.benming；大限→decadalLimits[current]；流年→liunian；小限→yearlyHoroscope） | E_EDGE_STAR_MISMATCH，不採用該筆或該層 |
| 層級一致 | 每筆 transformation 的 layer 與其 star 所屬層級一致（不得大限層出現小限星名等） | E_EDGE_LAYER_CROSS，不採用該筆或該層 |
| 邊完整 | 每筆含 fromPalace、toPalace、star、transform（及 layer） | 缺欄位時 W_EDGE_FROM_TO_INVALID 或等價，可選擇不採用該筆 |
| 宮位合法 | fromPalace、toPalace 皆為 12 宮 canonical 名稱 | W_EDGE_FROM_TO_INVALID |

**通過條件**：上述無 error 且可接受之 warning 依產品策略決定後，始將 overlap.items 轉成 chart.*.flows 供敘事讀取。

### B.4 路線 B（Worker 重建 edge）的驗證條件

當契約約定「worker 以權威 transforms 重建 edge」時，驗證用於**產出後自檢**，確保重建結果與權威一致：

| 檢查項 | 條件 | 失敗時 |
|--------|------|--------|
| 星名一致 | 每筆 flow 的 (star, transform) 必須在該層 TransformDef[]（來自權威 mutagenStars）中存在 | E_EDGE_STAR_MISMATCH；表示重建邏輯錯誤，應修 worker 規則 |
| 層級一致 | flow.layer 與該星所屬層級一致；不得跨層 | E_EDGE_LAYER_CROSS |
| 來源標記 | 每筆 flow 的 sourceOfTruth 為 "worker-derived"；不得再從 overlap 寫入 flow | E_EDGE_SOURCE_MIX 若偵測到來自 overlap |
| 目標宮位 | 若該層有標示宮位（如小限在夫妻宮），至少部分 flow 的 toPalace 應與之相關（依產品規則可為 warning） | W_EDGE_TO_PALACE_MISMATCH |
| 缺層 | 若某層有 mutagenStars 但 flows 為空，應報 W_EDGE_LAYER_EMPTY（可能為飛星規則未覆蓋該層） | 視為實作未完成或規則限制 |

**通過條件**：重建後執行 validateTransformEdgeConsistency，無 error 即視為該層 flows 可輸出；有 error 則該層不輸出流向並修復重建邏輯。
