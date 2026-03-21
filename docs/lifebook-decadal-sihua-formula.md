# 大限四化飛星公式與實作對照

## 一、公式（飛星派標準）

- **核心**：大限宮位宮干 → 十干四化 → 飛入本命盤該星所在宮位  
- **結構式**：大限四化落宮 = f(大限宮干, 本命星曜位置)  
- **口訣**：以干飛化，以星定宮  

### 步驟

1. **找大限命宮**：依年齡取當前十年大限所在宮位（如 30 歲 → 大限在夫妻宮）。
2. **取大限宮干**：該宮位的宮干（如寅宮宮干 = 丙）。
3. **宮干飛四化**：用十干四化表得 化祿／化權／化科／化忌 對應星。
4. **定落宮**：四化落宮 = 本命盤該星所在宮位（化祿落宮 = 本命盤「化祿星」所在宮，餘同）。

---

## 二、系統實作對照

| 公式步驟 | 實作位置 | 說明 |
|----------|----------|------|
| 十干四化表 | `worker/src/sihua-stem-table.ts` 的 `SI_HUA_BY_STEM` | 甲→廉貞破軍武曲太陽、丙→天同天機文昌廉貞 等，與常見十干四化表一致。 |
| 每宮宮干 | `worker/src/gonggan-flows.ts` 的 `buildPalaceStemMap(chartJson)` | 優先 `chartJson.palaceStemMap` / `ziwei.palaceStemMap`，其次命宮天干＋順推。 |
| 星在本命盤何宮 | `gonggan-flows.ts` 的 `findPalaceByStar(starsByPalace, starName)` | 遍歷本命 `starByPalace`，回傳該星所在宮位（canonical 宮名）。 |
| 大限四化飛星（公式版） | `gonggan-flows.ts` 的 `buildDecadalSihuaFlows({ palaceStemMap, starsByPalace, decadalPalace })` | 只取「當前大限」一宮的宮干 → 十干四化 → 對每顆化星查本命落宮，產出 4 條邊（祿權科忌）。 |
| 本命宮干飛化 | `buildGongGanFlows({ layer: "natal", ... })` | 12 宮每宮依宮干飛四化，同一套十干四化＋以星定宮。 |

---

## 三、資料流（s15）

1. **當前大限宮位**：`getCurrentDecadalLimit(decadalLimits, currentAge)` → `firstLimit.palace`（canonical，如「夫妻宮」）。
2. **宮干**：`buildPalaceStemMap(chartJson)` → `palaceStemMap[decadalPalace]`。
3. **本命星曜分布**：`getStarByPalaceFromChart(chartJson)` → `Map<宮位, 星名[]>`。
4. **公式計算**：`buildDecadalSihuaFlows({ palaceStemMap, starsByPalace, decadalPalace })` → `GongGanFlow[]`（layer: "decade", fromPalace=大限宮, toPalace=本命該星所在宮）。
5. **s15 顯示**：轉成 `FourTransformLine[]` 後用既有 `buildFourTransformBlocksForPalace` 產出「大限：X化Y，自A宮出，飛入B宮」。

若公式可算出至少一筆（宮干與本命星曜齊全），s15 一律用公式結果；否則才 fallback 到 `overlapAnalysis` 的大限層。

---

## 四、與 overlap 的差異

- **overlap**：依上游排盤／分析產生的「大限層」飛星邊，可能有缺或格式不一。
- **公式**：僅依「大限宮干 + 十干四化 + 本命星曜位置」計算，不依賴 overlap；只要命盤有宮干與星曜分布，大限四化飛星即可產出且口訣一致（以干飛化，以星定宮）。
