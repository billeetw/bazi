# 【星曜組合】皆顯示「本宮目前無已定義的星曜組合」— 診斷說明

## 資料流

1. **顯示文案**：`buildStarCombinationAnalysis(palaceName, findings)`（`lifeBookPrompts.ts`）
   - 從 `findings?.starCombinations` 篩選「本宮」的組合。
   - 比對用 `normPalaceForMatch(palaceName)` 與 `normPalaceForMatch(c.palace)`（皆為去掉「宮」、命→命宮）。

2. **findings 來源**：`buildLifebookFindingsFromChartAndContent({ chartJson, content: P2_CONTENT })`（`index.ts`）
   - 成功時回傳的 `findings.starCombinations` 來自：
     - `runStarCombinationEngine(chart.palaces, content.ccl3.starCombinationsTable)`（`buildLifebookFindings.ts`）
   - 同宮星曜兩兩配對 → 查 `worker/content/ccl3/star-combinations.json` 的 `items`（key = 兩星名排序後 `__` 串接）。

3. **宮內星曜來源**：`normalizeChart(chartJson).palaces`
   - `buildPalaces(chartJson)` 用 `getStarByPalaceFromChart(chartJson)` 取得「宮位 → 星曜名[]」。
   - 只認 `chartJson.ziwei.starByPalace` 或（若前者無）`chartJson.ziwei.mainStars`，key 可為宮位 id（如 `ming`、`guanglu`）或中文（如 `命宮`、`官祿`），會經 `toPalaceCanonical` 轉成「X宮」。

---

## 可能原因（三類）

### A. findings 為 null → 使用 createEmptyFindings()，starCombinations 恆為 []

- **情境**：`buildLifebookFindingsFromChartAndContent` 回傳 `null`（例如 `chartJson` 無效、或內部 `normalizeChart` / 引擎執行拋錯被 catch）。
- **結果**：`p2.findings ?? createEmptyFindings()` 得到空 findings，故 **所有** 12 宮的【星曜組合】都是「本宮目前無已定義的星曜組合」。
- **排查**：在產生命書的流程中 log 是否曾得到 `result === null`，或直接 log `p2.findings?.starCombinations?.length`；若常為 0 且 findings 非 null，再往下看 B/C。

### B. 命盤 normalize 後各宮星曜為空 → 沒有可配對的兩星

- **情境**：`chartJson.ziwei` 沒有 `starByPalace` / `mainStars`，或 key 與 `toPalaceCanonical` 對不上，導致 `getStarByPalaceFromChart` 回傳的 Map 全空或多數宮為空。
- **結果**：`runStarCombinationEngine` 沒有任何「同宮兩星」可配對，`starCombinations` 為 []。
- **排查**：在 `getStarByPalaceFromChart` 後或 `buildPalaces` 後 log 各宮星數；確認前端／API 傳來的 `chartJson.ziwei.starByPalace`（或 `mainStars`）結構與 key 是否與上述一致。

### C. 有星但組合表沒有對應定義 → 該宮不命中

- **情境**：星曜組合表 `star-combinations.json` 的 `items` 只包含部分「兩星組合」；命盤某宮的兩星配對後 key 不在表內。
- **結果**：該宮 `forPalace.length === 0`，該宮顯示「本宮目前無已定義的星曜組合」；**若每宮的配對都不在表內，就會 12 宮都顯示**。
- **說明**：表內為「主星＋主星」「主星＋輔星」等有限組合（如紫微天府、天機巨門、武曲祿存…）；若命盤多為「輔星＋雜曜」等未收錄組合，就不會命中。

---

## 建議步驟

1. **確認 findings 是否有值**  
   在 12 宮組裝處（例如 `index.ts` 使用 `findingsForPalace` 的地方）暫時 log：  
   `findingsForPalace?.starCombinations?.length`。  
   - 若始終為 0 且 `findingsForPalace` 來自 `createEmptyFindings()` → 屬 **A**，需查 `buildLifebookFindingsFromChartAndContent` 為何回傳 null。  
   - 若來自正常 findings 但 `starCombinations.length === 0` → 屬 **B 或 C**。

2. **確認命盤是否有星**  
   在 `buildLifebookFindings` 或 `runStarCombinationEngine` 前後 log：  
   `chart.palaces.map(p => ({ palace: p.palace, totalStars: main+assistant+sha+misc }))`。  
   - 若多數宮 totalStars &lt; 2 → 屬 **B**，需修正 chart 來源或 `getStarByPalaceFromChart` 的讀取方式。  
   - 若多宮有 ≥2 星仍無組合 → 屬 **C**，可考慮擴充 `star-combinations.json` 的 `items`。

3. **確認組合表已載入**  
   確認執行時 `P2_CONTENT.ccl3.starCombinationsTable.items` 為陣列且長度 &gt; 0（例如在 `runStarCombinationEngine` 開頭 log `table?.items?.length`），避免表為空或打包後遺失。

---

## 小結

| 現象 | 較可能原因 |
|------|------------|
| 12 宮全部顯示「本宮目前無已定義的星曜組合」 | **A** 未取得 findings（null → 空）或 **B** 命盤各宮星曜為空 |
| 僅部分宮有組合、其餘無 | **C** 該宮星曜配對未在 `star-combinations.json` 定義 |
| 表已擴充仍無命中 | **B** 命盤星曜來源／key 與 normalize 不一致，或 **A** 該次請求未帶入有效 findings |

目前程式與語料（`star-combinations.json`）已存在且會參與運算；若畫面上全部為「無已定義的星曜組合」，優先檢查 **findings 是否為 null** 以及 **chart 的 ziwei.starByPalace / mainStars 是否正確填入**。
