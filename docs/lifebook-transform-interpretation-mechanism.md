# 四化飛宮解釋共用機制

## 一、新增的資料檔

| 檔案 | 用途 |
|------|------|
| `worker/content/decadalPalaceThemes.json` | 大限落某宮的十年主題：`decadalPalaceThemes[宮位名]` → `{ theme, narrative }` |
| `worker/content/starTransformMeanings.json` | 星 × 四化：key 為 `星名_transform`（如 `天機_lu`），value 為 `{ text }` |
| `worker/content/transformIntoPalaceMeanings.json` | 四化 × 宮位：key 為 `transform_宮位名`（如 `lu_官祿宮`），value 為一句解釋 |

## 二、共用機制如何運作

- **引擎**：`worker/src/lifebook/transformInterpretationEngine.ts`
- **解釋優先順序**（`getTransformEdgeMeaning`）：
  1. **星 + 宮 + 四化**：既有 `starPalaceTransformMatrix` 有該組合 → 用其 meaning
  2. **星 + 四化**：`starTransformMeanings.json` 有該星與四化 → 用其 text
  3. **四化 + 宮**：`transformIntoPalaceMeanings.json` 有該四化與宮位 → 用其字串
  4. **Fallback**：`starSemantic + transformSemantic + palaceSemantic` 組句

- **對外 API**：
  - `getStarTransformMeaning(star, transform)`：星×四化
  - `getTransformIntoPalaceMeaning(transform, palace)`：四化×宮
  - `getTransformEdgeMeaning(star, fromPalace, toPalace, transform)`：飛宮邊（依上述優先順序）
  - `buildDecadalNarrative(limit)`：單一大限四段敘事

## 三、buildDecadalNarrative 輸出結構與樣例

**輸入**（`DecadalLimitInput`）：

- `palace`：大限命宮（如 `官祿宮`）
- `luStar` / `quanStar` / `keStar` / `jiStar`：該大限天干化出的四化星
- 可選 `transforms`：`{ star, type, toPalace }[]` 表示各四化飛入哪一宮

**輸出**（`DecadalNarrative`）：

1. **mainline**：十年主線（來自 `decadalPalaceThemes`）
2. **transformBaseline**：四化底色（來自 `starTransformMeanings`，每顆四化星一句）
3. **eventThemes**：最容易出現的事件／課題（每條飛宮用 `getTransformEdgeMeaning`）
4. **suggestion**：十年建議（依主題收束）

**樣例**（大限落官祿宮，天機祿、紫微權、太陰忌，祿飛財帛、忌飛夫妻）：

```json
{
  "mainline": "這十年大限落在官祿宮，代表事業、角色與社會責任會成為主軸。你在職場上的定位、承擔與成果會特別被放大。",
  "transformBaseline": [
    "天機化祿，代表思考、策略與判斷能力會變成你的重要資源。很多機會不是直接送上門，而是來自你比別人更早看懂局勢。",
    "紫微化權，代表你會更強烈地進入主導位置。這段時間你對方向、秩序與掌控感的需求會特別明顯。",
    "太陰化忌，代表內在感受、安全需求或情緒波動會成為壓力來源。很多表面問題，背後其實都和心裡的不安有關。"
  ],
  "eventThemes": [
    "天機化祿，代表思考、策略與判斷能力會變成你的重要資源。很多機會不是直接送上門，而是來自你比別人更早看懂局勢。",
    "忌入夫妻宮，代表親密關係與合作關係容易成為壓力與修正點。"
  ],
  "suggestion": "這十年主題是「事業與社會角色」。建議先穩住主線，再依四化落在的宮位，有意識地分配精力：祿權科處可多投入，忌處則留意界線與修復節奏。"
}
```

（上例中 eventThemes 第一條為星+四化、第二條為四化+宮；若矩陣有「星+宮+四化」會優先出現。）

## 四、未來共用到流年、小限、12宮與問答模式

- **流年**：同一套 `getStarTransformMeaning` / `getTransformIntoPalaceMeaning` / `getTransformEdgeMeaning`，輸入改為「流年天干化出的四化」與「流年四化飛入宮位」；可加一層 `buildYearlyNarrative(yearLimit)`，結構比照四段（當年主線可用流年宮位或流年命宮主題）。
- **小限**：同上，改為小限命宮與小限四化飛宮，必要時加 `buildXiaoxianNarrative(xiaoxianLimit)`。
- **12宮**：每個宮位敘事時，若該宮有「本命／大限／流年／小限」四化飛入，可直接呼叫 `getTransformEdgeMeaning(star, fromPalace, toPalace, transform)` 取得一句解釋，無需每宮手寫模板。
- **問答模式**：使用者問「今年事業如何」時，可篩出與官祿相關的飛宮邊，用 `getTransformEdgeMeaning` 組答；或問「天機化祿代表什麼」時用 `getStarTransformMeaning("天機", "lu")` 回傳。

以上皆不需新增「一個時段一個模板」，只要傳入對應的 limit／layer 與飛宮列表即可重用同一套資料與引擎。
