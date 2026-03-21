# s17「今年主線與流年四化」— 流年四化飛星盤點與實作評估

## 一、目標

在 **s16/s17**（今年主線與流年四化）中，接續做 **流年四化飛星**，與 **s15 大限四化飛星** 相同章節規格：

- 公式說明：流年天干 → 十干四化 → 飛入本命盤該星所在宮位（以干飛化，以星定宮）。
- 產出：**自 X 宮出，飛入 Y 宮** 的 4 條（祿權科忌各一），與大限區塊格式一致。

---

## 二、s15 大限四化飛星現況（對照規格）

| 項目 | 實作位置 | 說明 |
|------|----------|------|
| **公式** | `worker/src/gonggan-flows.ts` `buildDecadalSihuaFlows()` | 大限宮干 `decadalStem` + 大限宮位 `decadalPalace` → `SI_HUA_BY_STEM[stem]` → 祿權科忌星 → `findPalaceByStar(starsByPalace, star)` → 得到 toPalace。產出 `GongGanFlow[]`（fromPalace, toPalace, star, transform）。 |
| **資料來源** | `decadalLimits[當前].stem`、`decadalLimits[當前].palace`、`buildPalaceStemMap(chartJson)`、`getStarByPalaceFromChart(chartJson)` | 大限干支與宮位來自 iztro / decadalLimits；本命星落宮來自 chart。 |
| **轉成文案** | `lifeBookPrompts.ts`：formulaDecadalFlows → FourTransformLine[] → `buildFourTransformBlocksForPalace(decadalLines)` | layerLabel "大限"，techBlock 每行：`大限：{star}化{type}，自{from}宮出，飛入{to}宮`。 |
| **Fallback** | 若無公式結果則 `collectAllFourTransformsForLayer(chartJson, "decadal")` | 從 overlapAnalysis 篩 layerLabel "大限" 的條目。 |
| **章節模板** | `content/lifebookSection-zh-TW.json` s15 | `【本次大限四化飛星】\n公式：…\n\n{decadalFourTransformBlocks}`。 |

---

## 三、流年四化與飛星現況

### 3.1 已有（可直接沿用）

| 項目 | 來源 | 說明 |
|------|------|------|
| **流年天干** | `yearlyHoroscope.stem` / `liunian.stem` | iztro horoscope.yearly.heavenlyStem 或年干支；worker 已回傳。 |
| **流年四化星名** | `liunian.mutagenStars` / `fourTransformations.liunian` | 與大限同一表 `SI_HUA_BY_STEM[yearStem]`，祿權科忌四星已有。 |
| **流年命宮** | `flowYearMingPalace` = `palaceByBranch[yearlyBranch]` | 命盤宮序表，與大限命宮邏輯一致；`buildTimeModuleDisplayFromChartJson` 已產出。 |
| **本命星落宮** | `getStarByPalaceFromChart(chartJson)` → `starsByPalace` | 與大限四化飛星共用，可查「某星在本命盤哪一宮」。 |
| **輸出格式** | `buildFourTransformBlocksForPalace(lines)` | 同一函式可吃 FourTransformLine[]，產出「自X宮出，飛入Y宮」techBlock；僅需 layerLabel 改為「流年」。 |

### 3.2 目前缺口

| 項目 | 現況 | 說明 |
|------|------|------|
| **流年飛星「從哪宮入哪宮」** | 僅來自 **overlapAnalysis** | `collectAllFourTransformsForLayer(chartJson, "yearly")` 從 overlap 的 items / criticalRisks 等篩 `layerLabel === "流年"`。若 overlap 未預先算流年飛星，則 yearlyLines 為空 → `flowYearSihuaFlyBlock` / `yearlyFourTransformBlocks` 顯示「（本宮無四化飛星資料）」或空。 |
| **公式驅動的流年飛星** | **尚未實作** | 沒有等同 `buildDecadalSihuaFlows` 的 **buildYearlySihuaFlows**（流年天干 + 流年命宮 + 本命星落宮 → 4 條 from/to）。 |
| **s16/s17 模板** | 皆為「本章重做中」 | `lifebookSection-zh-TW.json` 的 s16、s17 的 structure_analysis 尚未接上流年四化飛星區塊。 |

---

## 四、算法是否可實作（與大限同規格）

**結論：可以，且與大限四化飛星同一套邏輯。**

- **公式**：流年天干 → `SI_HUA_BY_STEM[yearStem]` → 祿權科忌四星 → 各星在本命盤落宮 `findPalaceByStar(starsByPalace, star)` → **起點宮** = 流年命宮 `flowYearPalace`，**終點宮** = 該星落宮。
- **所需輸入**（皆已有或可從既有 chart 取得）：
  - `yearStem`：`yearlyHoroscope.stem` 或 `liunian.stem`（流年天干）
  - `flowYearPalace`：`flowYearMingPalace`（流年命宮，與 palaceByBranch 一致）
  - `starsByPalace`：`getStarByPalaceFromChart(chartJson)`
- **輸出**：與大限相同結構的 4 條 flow（fromPalace=流年命宮, toPalace=星落宮, star, transform），再轉成 FourTransformLine（layer "yearly", layerLabel "流年"）→ `buildFourTransformBlocksForPalace` → 得到與 s15 同規格的「流年：X化Y，自A宮出，飛入B宮」。

---

## 五、建議實作步驟

1. **新增 `buildYearlySihuaFlows`**（`worker/src/gonggan-flows.ts`）
   - 參數：`{ yearStem: string; flowYearPalace: string; starsByPalace: Record<string, string[]> | Map<string, string[]> }`。
   - 邏輯：與 `buildDecadalSihuaFlows` 相同，僅改為用 `yearStem` 查 `SI_HUA_BY_STEM`，fromPalace 固定為 `flowYearPalace`，layer 為 `"year"`（若 GongGanFlow 需區分則擴充，或僅在轉 FourTransformLine 時設 layer / layerLabel）。

2. **在 getPlaceholderMapFromContext 中接流年公式**（`worker/src/lifeBookPrompts.ts`）
   - 在 timeModule 區塊（s15/s16/s17 等）內：
     - 取 `flowYearStem` = yearly?.stem ?? liunian?.stem，`flowYearPalace` = map.flowYearMingPalace（或 timeDisplay.flowYearMingPalace）。
     - 若 `flowYearStem` 與 `flowYearPalace` 皆有且 `starsByPalace.size > 0`，則呼叫 `buildYearlySihuaFlows({ yearStem: flowYearStem, flowYearPalace, starsByPalace })`。
     - 將結果轉成 FourTransformLine[]（layer "yearly", layerLabel "流年"），再 `buildFourTransformBlocksForPalace` → 寫入 `map.yearlyFourTransformBlocks`（及可選的 `map.flowYearSihuaFlyBlock`）。
     - 若無公式結果，維持現有 fallback：`collectAllFourTransformsForLayer(opts.chartJson, "yearly")`。

3. **s16/s17 章節模板**
   - 在 `content/lifebookSection-zh-TW.json` 的 s16（及 s17，若標題為今年主線與流年四化）的 structure_analysis 中，加入與 s15 對齊的區塊，例如：
     - `【今年流年四化飛星】\n公式：流年天干 → 十干四化 → 飛入本命盤該星所在宮位（以干飛化，以星定宮）。\n\n{yearlyFourTransformBlocks}\n\n…`（其餘今年主線／建議沿用既有 placeholder）。

4. **P2 / findings 路徑**
   - 若 s16 使用 `buildS16PlaceholderMapFromV2` 且 findingsV2 有 `transformEdges`（layer === "year"），則已產出 `yearlyFourTransformBlocks`；公式路徑可與 V2 並存，以「有公式結果優先」即可。

---

## 六、小結

| 問題 | 結論 |
|------|------|
| 流年四化、流年命宮、本命星落宮資料是否足夠？ | **是**，皆已有或可由 chart 取得。 |
| 能否做成與大限四化飛星相同章節規格？ | **能**，同一套公式（天干→十干四化→飛入本命星宮）+ 同一輸出格式（自X宮出，飛入Y宮）。 |
| 需新增的算法？ | **buildYearlySihuaFlows**（流年版 buildDecadalSihuaFlows），其餘為既有函式串接與 placeholder 注入。 |
| s16/s17 模板？ | 目前重做中，可直接在 structure_analysis 中接上 `{yearlyFourTransformBlocks}` 與公式說明，與 s15 對齊。 |

依照上述步驟，即可在 s17（以及 s16）接續做出與大限四化飛星同規格的「今年流年四化飛星」區塊。
