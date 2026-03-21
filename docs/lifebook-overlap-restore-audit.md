# 疊宮恢復前現況盤點報告

目的：確認目前哪些算法與資料源已足夠支撐「本命＋大限四化飛星＋流年四化飛星」的疊宮分析，並區分可直接重用／可改寫後重用／應淘汰，最後給出最小可行疊宮重啟建議。

---

## 一、本命盤固定資料來源

### 1.1 palaces

| 項目 | 現況 |
|------|------|
| **定義** | `worker/src/lifebook/schema.ts` 的 `PALACES`：12 宮固定順序（命宮→兄弟→…→父母），與 `FIXED_PALACES_ZH_TW` / 前端 `PALACE_DEFAULT` 一致。 |
| **使用處** | `normalizePalaces.ts` 的 `CANONICAL_PALACE_ORDER`、`buildPalaces()`；`gonggan-flows.ts` 的 `PALACE_ORDER`（buildPalaceStemMap 順推宮干）。 |
| **是否足夠** | ✅ 是。順序固定、id/name 對應完整，為本命盤宮位順序的單一權威。 |

### 1.2 starsByPalace

| 項目 | 現況 |
|------|------|
| **來源** | `getStarByPalaceFromChart(chartJson)`（`lifebook/normalize/normalizePalaces.ts`）。優先 `chartJson.ziwei.starByPalace` / `core.starByPalace` / `basic.starByPalace`，其次 `ziwei.mainStars`。 |
| **輸出** | `Map<string, string[]>`，key = `toPalaceCanonical(宮)`，value = 該宮星名陣列。 |
| **使用處** | 本命宮干飛化、大限四化飛星、流年四化飛星皆用此 Map + `findPalaceByStar()` 決定 toPalace。 |
| **是否足夠** | ✅ 是。本命盤星落宮唯一權威，大限／流年飛星「飛入宮」皆查此表。 |

### 1.3 宮位命名與順序 normalization

| 項目 | 現況 |
|------|------|
| **Canonical** | `toPalaceCanonical()`（`lifebook/canonicalKeys.ts`）：id/中文名 → 統一「X宮」。 |
| **地支→宮位** | `buildPalaceByBranch(mingBranch)`（`palace-map.ts`）：命宮地支 → 寅…丑 各地支對應之宮位（PALACE_BY_OFFSET 旋轉）。流年命宮、大限宮名皆依此表。 |
| **順序** | 本命盤「人事宮順序」= PALACES（命兄夫…父）；「命盤宮序」（依命宮地支旋轉）= palaceByBranch 之 value 順序（依 BRANCH_RING 寅→丑）。 |
| **是否足夠** | ✅ 是。命名與雙序（固定序／命盤序）皆有單一入口，疊宮可依同一套 key 對齊。 |

---

## 二、大限資料鏈

### 2.1 decadalLimits 的實際來源

| 層級 | 來源 | 說明 |
|------|------|------|
| **Worker /compute/all** | iztro 單一來源 | 依 `astrolabe.horoscope(targetDate, timeIndex)` 每步取 `decadal.heavenlyStem/earthlyBranch`；宮名用 `palaceByBranch[decadal.earthlyBranch]`，不直接用 iztro 的 palaceNames。產出 `features.ziwei.decadalLimits`（12 筆，含 stem, branch, palace, startAge, endAge, mutagenStars）。 |
| **前端 expert-admin** | 先 BaziCore 再覆寫 | `exportCalculationResults()` 內用 BaziCore 建 `decadalLimits`（宮序為 PALACE_DEFAULT[palaceIndex]、stem 為命宮干順推）。組 `chartForApi` 時若存在 `window.contract.ziwei.decadalLimits` 則**覆寫** `chartForApi.decadalLimits` 與 `chartForApi.ziwei.decadalLimits`，故命書 API 收到的是 worker 回傳的 iztro 版（前提是使用者有先按「計算」）。 |
| **命書 API（generate / generate-section）** | 優先 iztro | 取 `features.ziwei.decadalLimits ?? ziwei.decadalLimits ?? chart_json.decadalLimits`，寫回 `chartForGenerate.decadalLimits` 與 `chartForGenerate.ziwei.decadalLimits`，下游只讀這份。 |

### 2.2 是否還有覆蓋或重算

- **前端**：若未先呼叫 worker 計算，`chartForApi` 仍會帶 BaziCore 的 decadalLimits（錯誤宮干／宮序風險）。有呼叫計算則被 contract.ziwei.decadalLimits 覆寫。
- **命書 worker**：不再用 BaziCore；收到之 chart 若帶 `features.ziwei.decadalLimits` 或 `ziwei.decadalLimits` 即用，否則用 top-level decadalLimits（可能來自前端舊資料）。
- **結論**：資料鏈已統一為「iztro + palaceByBranch 宮名」，但前端在「未先計算」時仍會送 BaziCore 版；疊宮若只吃命書 API 收到的 chart，則以當前邏輯為準，已足夠。

---

## 三、大限四化飛星算法

### 3.1 目前函式、輸入、輸出

| 項目 | 內容 |
|------|------|
| **函式** | `buildDecadalSihuaFlows(params)`（`worker/src/gonggan-flows.ts`）。 |
| **輸入** | `palaceStemMap`、`starsByPalace`、`decadalPalace`、`decadalStem?`（優先 decadalLimits[當前].stem）。 |
| **輸出** | `GongGanFlow[]`：每條 `layer: "decade"`, `fromPalace`, `toPalace`, `star`, `transform`, `triggerStem`, `sourceOfTruth: "gonggan-fly"`。 |
| **公式** | decadalStem → SI_HUA_BY_STEM → 祿權科忌四星 → findPalaceByStar(starsByPalace, star) → toPalace；fromPalace = toPalaceCanonical(decadalPalace)。 |

### 3.2 fromPalace / toPalace 的決定方式

- **fromPalace**：當前大限宮位 `decadalPalace`（來自 decadalLimits[當前].palace，該 palace 來自 iztro branch + palaceByBranch）。
- **toPalace**：本命盤該四化星所在宮，即 `findPalaceByStar(starsByPalace, star)`，純本命盤查表。

### 3.3 是否仍存在 fallback 或舊資料源

- **主路徑**：getPlaceholderMapFromContext 內有 `decadalPalace`、`decadalStem`、`starsByPalace` 時一律走 `buildDecadalSihuaFlows`。
- **Fallback**：僅在無公式結果時 `collectAllFourTransformsForLayer(opts.chartJson, "decadal")`，從 overlap 篩 layerLabel "大限"。疊宮恢復時若不再依賴 overlap 的大限條目，此 fallback 可視為備援，不影響「公式為準」的契約。

---

## 四、流年資料鏈

### 4.1 yearStem

| 項目 | 現況 |
|------|------|
| **來源** | S16 公式路徑：`yearlyHoroscope.stem ?? liunian.stem ?? ziwei.yearlyHoroscope.stem`。iztro 為 `horoscope.yearly.heavenlyStem`；前端 BaziCore 為 `yearlyHoroscope.yearlyStem`。 |
| **單一性** | 命書 worker 以 chart 內欄位為準；若 chart 來自 worker 計算則為 iztro。前端未計算時可能僅有 BaziCore 的 yearlyStem。 |

### 4.2 flowYearPalace

| 項目 | 現況 |
|------|------|
| **來源** | `buildTimeModuleDisplayFromChartJson`：優先 `palaceByBranch[liunian.branch]`（即 getFlowYearPalace(liunian.branch, palaceByBranch)）；缺則 liunian.palace / destinyPalace / palaceName；再缺則 fallback 為「年份+地支位」字串。 |
| **palaceByBranch** | 來自 chartJson.palaceByBranch 或由 `buildPalaceByBranch(mingBranch)` 建，與大限宮名同源。 |
| **單一性** | 流年命宮以「命宮地支 + 流年地支」之查表為權威，與大限命盤宮序一致。 |

### 4.3 流年命宮的判定方式

- **公式**：流年地支 + 命盤「地支→宮位」表。`getFlowYearPalace(yearlyBranch, palaceByBranch)`；palaceByBranch 由命宮地支建，與 `palace-map.ts` 一致。
- **無 branch 時**：使用 liunian.palace / 其他欄位或「年份+地支位」字串，避免斷裂。

---

## 五、流年四化飛星算法

### 5.1 目前是否可與大限同規格

| 項目 | 現況 |
|------|------|
| **函式** | `buildYearlySihuaFlows({ yearStem, flowYearPalace, starsByPalace })`（`gonggan-flows.ts`）。 |
| **輸出** | `GongGanFlow[]`，layer: "year"，結構與大限相同；fromPalace = flowYearPalace，toPalace = findPalaceByStar(星)。 |
| **規格** | 與大限一致：飛出宮 = 流年命宮；飛入宮 = 本命盤該星所在宮。S16 僅用公式，不以 overlap 為 fallback。 |

### 5.2 是否有任何 overlap/fallback 依賴

- **S16**：流年四化飛星僅由 `buildYearlySihuaFlows` 產出，不接 `collectAllFourTransformsForLayer(..., "yearly")`。
- **S15 的 yearly**：仍用 `collectFourTransformsForPalace(..., ["yearly"])` 產出 yearly 區塊（非 S16）。
- **injectTimeModuleDataIntoSection 相容層**：無 findings 時會用 `collectAllFourTransformsForLayer(chartJson, "yearly")` 填 `flowYearSihuaFlyBlock` 等，僅影響未走 S16 公式的相容路徑；疊宮若只吃「公式產出的三層飛星」，不依賴此 fallback。

---

## 六、舊疊宮分析殘留

### 6.1 相關函式 / 型別 / 模板 / placeholder

| 類型 | 名稱 | 位置 | 說明 |
|------|------|------|------|
| 型別 | `OverlapItemForBlock` | lifeBookPrompts.ts | 疊宮一筆：palaceName, tag, jiCount, luCount, transformations, year/age/feeling/advice 等。 |
| 型別 | `FlowTransformationEntry` | lifeBookPrompts.ts | 單條四化：layerLabel, starName, type, fromPalaceName, toPalaceName。 |
| 函式 | `buildOverlapDetailBlocks` | lifeBookPrompts.ts | 從 overlapAnalysis（items 或 criticalRisks/maxOpportunities/volatileAmbivalences）產出 shockBlocks/mineBlocks/wealthBlocks。 |
| 函式 | `formatOverlapBlockItem` | lifeBookPrompts.ts | 單一疊宮項：【宮名】+ 四化文字 + 忌/祿重數 + 結構／感受／建議。 |
| 函式 | `flattenLegacyTransformations` | lifeBookPrompts.ts | 舊格式 transformations 物件 → 大限→流年→本命 有序陣列；fromPalace 用對宮推測。 |
| 函式 | `collectAllFourTransformsForLayer` | lifeBookPrompts.ts | 從 overlap 篩 layerLabel（大限/流年）產 FourTransformLine[]；資料來自 overlap，非公式。 |
| 函式 | `collectFourTransformsForPalace` | lifeBookPrompts.ts | 從 overlap.items 或 risks/opps/vol 取某宮、某層的 transformations。 |
| 資料 | overlapAnalysis | chart 上傳 / API | 新格式 items[] 或舊格式 criticalRisks, maxOpportunities, volatileAmbivalences；可能含錯誤大限/小限。 |
| 資料 | minorFortuneByPalace | chart / 前端 | 各宮小限年份；模組二技術版已清空不輸出，但仍傳給 API。 |
| placeholder | minorFortuneTable, minorFortuneTimelineTable | lifeBookPrompts | 模組二時強制為空。 |
| placeholder | overlapDataMissingNotice | lifeBookPrompts | 「疊宮資料尚未產出…」提示。 |
| 組裝 | s15a shockBlocks/mineBlocks/wealthBlocks | lifeBookPrompts / content | 來自 buildOverlapDetailBlocks，依 overlap 的 tag 與 transformations。 |
| 除錯/附錄 | minorFortuneSummary, minorFortuneTriggers | index 等 | 若 body 有傳則帶入 chart；技術版 debug 會打出小限疊宮摘要／引爆說明。 |

### 6.2 哪些仍被使用

- **仍被使用**：overlapAnalysis 的 items / risks / opps / vol 仍被 s15a、keyYears、tag 計數、collectFourTransformsForPalace／collectAllFourTransformsForLayer 讀取；buildOverlapDetailBlocks 仍產三組疊宮區塊；FlowTransformationEntry / FourTransformLine 仍為四化展示與技術版共用型別。
- **部分使用**：minorFortuneByPalace 仍傳給 API 且用於關鍵年份表等，但模組二正文與四化技術版已不輸出小限表；minorFortuneSummary/Triggers 僅在技術版/debug 出現。

### 6.3 哪些依賴舊的錯誤大小限資料

- **overlap 內 transformations**：若來自前端/舊 pipeline，可能含 BaziCore 大限宮干或舊小限邏輯，layerLabel 為「大限」「流年」但 from/to 未必與現行公式一致。
- **flattenLegacyTransformations**：fromPalaceName 用對宮推測，toPalace 非「本命盤該星所在宮」，與現行公式規格不符。
- **collectAllFourTransformsForLayer**：完全依賴 overlap 預先算好的條目，若 overlap 未用 iztro/公式重算，則大限/流年可能錯。

---

## 七、三類整理

### 可直接重用

- **本命盤**：`PALACES`、`toPalaceCanonical`、`getStarByPalaceFromChart`、`buildPalaceByBranch`、`getFlowYearPalace`、`buildPalaceStemMap`（本命宮干）。
- **大限**：`buildDecadalSihuaFlows`、`getCurrentDecadalLimit`、decadalLimits 來自 iztro + palaceByBranch 的產出格式（stem, branch, palace, startAge, endAge, mutagenStars）。
- **流年**：`buildYearlySihuaFlows`、flowYearPalace 來自 palaceByBranch[branch]、yearStem 來自 yearlyHoroscope/liunian。
- **共用**：`findPalaceByStar`、`SI_HUA_BY_STEM`、`buildFourTransformBlocksForPalace`（FourTransformLine[] → 技術版條列）、`GongGanFlow` 型別。

### 可改寫後重用

- **overlap 結構**：保留 `overlapAnalysis` 的「每宮一筆、tag、重數」等介面，但「每宮四化條目」改為由三層公式產出填入（本命宮干飛化 + buildDecadalSihuaFlows + buildYearlySihuaFlows），不再依賴前端/BaziCore 預算的 transformations。
- **buildOverlapDetailBlocks / formatOverlapBlockItem**：輸入改為「公式產出的三層飛星 per 宮」或統一疊宮結構，仍可產出【宮名】+ 四化說明 + 結構／感受／建議；feeling/advice 可保留或改為依 tag 與祿忌重數的泛用句。
- **FlowTransformationEntry / FourTransformLine**：保留型別與「layerLabel + from/to + star + type」格式，改為由 GongGanFlow 轉入，不從 overlap 舊欄位反推。
- **s15a 區塊**：shockBlocks/mineBlocks/wealthBlocks 可改為依「公式飛星 + 祿忌重數」重算 tag 與內容，或先做「每宮三層飛星」再套現有 tag 邏輯。

### 應淘汰

- **依賴 overlap 預算大限/流年 from→to 的路徑**：不再用 `collectAllFourTransformsForLayer` 作為大限/流年飛星的資料源；疊宮恢復後改為只讀公式產出的邊。
- **flattenLegacyTransformations 的 from/to 推測**：對宮推測與「toPalace = 本命盤該星所在宮」不符，疊宮不應再依此產飛星邊。
- **小限當作疊宮主資料**：模組二已不輸出小限；疊宮若重啟，不應再把 minorFortune 當大限/流年替代；minorFortuneSummary/Triggers 可保留僅供附錄/debug，不參與「本命＋大限＋流年」疊宮主邏輯。
- **前端 BaziCore 的 decadalLimits 作為命書唯一來源**：已由 expert-admin 覆寫為 contract.ziwei.decadalLimits；若還有其他入口送 chart 而未經 worker 計算，應改為只接受 iztro 版或後端重算。

---

## 八、最小可行疊宮重啟建議

### 8.1 目標

- 疊宮 = 每宮一筆，含「本命宮干飛化 + 大限四化飛星 + 流年四化飛星」三層，每層皆為「自 X 宮出、飛入 Y 宮」的公式結果，不依賴 overlap 預算的 transformations。

### 8.2 輸入

- **chart_json**：具備 ziwei（含 decadalLimits、core.minggongBranch）、yearlyHoroscope/liunian（stem, branch）、bazi、palaceByBranch（或可從 mingBranch 建）、starByPalace/mainStars、palaceStemMap（或可推）。
- **當前年齡**（或當年）：用於 getCurrentDecadalLimit、當年流年。

### 8.3 輸出格式建議

- **Per 宮**：  
  `{ palace, natalFlows[], decadalFlows[], yearlyFlows[] }`  
  其中每條 flow 為 `{ fromPalace, toPalace, star, transform, layer }`（與 GongGanFlow 對齊）。可再加 jiCount/luCount、tag（shock/mine/wealth/normal）供 s15a 區塊與感受/建議用。
- **彙總**：可保留現有 shockBlocks/mineBlocks/wealthBlocks 字串格式，或改為由上述 per 宮結構產出。

### 8.4 應建立的新函式

1. **buildStackedPalaceFlows(chartJson, options?: { currentAge?, flowYear? })**  
   - 對 12 宮每宮產出：本命宮干飛化（現有 natal flows 過濾 by toPalace）、當前大限四化飛星（buildDecadalSihuaFlows 後過濾 by toPalace 或 fromPalace）、當年流年四化飛星（buildYearlySihuaFlows 後過濾）。  
   - 回傳 `Array<{ palace, natalFlows, decadalFlows, yearlyFlows }>` 或等價結構。

2. **computeOverlapTagFromFlows(flows)**（可選）  
   - 依三層飛星之祿忌重數與規則，回傳 tag（shock/mine/wealth/normal），供現有 s15a 區塊或新疊宮區塊使用。

3. **stackedPalaceToOverlapItems(stacked)**（可選）  
   - 將 buildStackedPalaceFlows 的結果轉成現有 overlap.items 相容格式，便於沿用 buildOverlapDetailBlocks 的輸出格式，而不改動其介面過大。

### 8.5 不要再接回來的舊函式／路徑

- 不要用 **collectAllFourTransformsForLayer** 或 **collectFourTransformsForPalace** 的結果作為大限/流年飛星的權威來源。
- 不要用 **flattenLegacyTransformations** 產生的 from/to 作為疊宮的飛星邊。
- 不要依賴 **overlapAnalysis** 內既有 transformations 作為大限/流年「自 X 宮出、飛入 Y 宮」的依據；overlap 僅可作為「tag、重數、感受/建議」的載體或輸出目標，資料源改為三層公式。

### 8.6 小結

- **本命、大限、流年** 的資料源與公式（本命宮干、buildDecadalSihuaFlows、buildYearlySihuaFlows）已就緒，且 from/to 規格明確（飛出宮 = 該層命宮，飛入宮 = 本命盤該星所在宮）。
- **疊宮恢復** 最小可行版：新增「按宮彙總三層飛星」的 builder，輸出統一結構；疊宮展示可改寫現有 buildOverlapDetailBlocks 或新寫一層，只讀該結構，不再依賴 overlap 內舊的 transformations 計算。
