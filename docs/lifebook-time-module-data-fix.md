# 時間模組資料未出現：原因與修復

## 問題摘要

- 專家後台計算時有輸出**小限年份**、**疊宮**，但時間模組（s15/s15a/s16）中沒出現。
- 需要**實際小限年份資料**供後續年度重點整理。
- **大限宮位**（每十年）沒出現在時間模組。
- **四化**目前多數只看到祿、忌，沒有權、科。

---

## 原因說明

### 1. 小限年份（minorFortuneByPalace）未進 chart_json

- **Worker** 時間模組 s15a 依 `chartJson.minorFortuneByPalace` 產出 `xiaoXianTimelineTable`、`xiaoXianShockBlocks` 等。
- **adminExport.exportCalculationResults()** 原本**沒有**組 `minorFortuneByPalace`，只組了 `decadalLimits`、`yearlyHoroscope`（當年小限）。
- 專家後台組 `chartForApi` 時，`minorFortuneByPalace` 只在「有載入大限／小限／流年」時，由 `attachMinorFortuneByPalace()` 從 `ziwei.horoscope.horoscopeByYear` 組出來；若沒按「載入大限／小限／流年」，就不會帶小限年份。

**修復**：在 `js/calc/adminExport.js` 的「命書時間軸」區塊內，依年齡 0～99 呼叫 `BaziCore.getHoroscopeFromAge(age, ziwei, bazi, gender)`，按宮位彙整出「每宮第一次小限落宮的年份」，寫入 `results.minorFortuneByPalace`。這樣一鍵導出／生成命書時，不需先按「載入大限／小限／流年」也會帶小限年份。

### 2. 大限宮位（decadalLimits）未出現在 s15 內文

- **Worker** 已依 `chartJson.decadalLimits` 產出 `map.decadalLimitsList`、`map.decadalMainLineEnergy`。
- **lifebookSection-zh-TW.json** 的 s15 模板原本**沒有**使用這兩個 placeholder，所以組好的大限列表與十年主線能量沒有被塞進章節內文。

**修復**：在 s15 的 `structure_analysis` 中新增區塊，使用 `{decadalLimitsList}` 與 `{decadalMainLineEnergy}`，讓「十年大限一覽」與「十年主線能量」實際出現在時間模組輸出中。

### 3. 疊宮（overlapAnalysis）

- 疊宮資料來自 `window.overlapAnalysis`，`exportCalculationResults()` 已有 `results.overlapAnalysis = window.overlapAnalysis`。
- 只要計算流程有跑完疊宮並寫入 `window.overlapAnalysis`，送出的 `chart_json` 就會帶 `overlapAnalysis`；s15a 的 shock/mine/wealth 區塊與決策時間軸會依此產出。
- 若仍看不到疊宮，請確認：計算後是否有執行到 `window.overlapAnalysis = overlapAnalysis`（例如在 calc.js 流程中）。

### 4. 四化只有祿、忌沒有權、科

- **疊宮標籤**（criticalRisks / maxOpportunities / volatileAmbivalences）在現有實作裡，多數只依「祿」「忌」判斷標籤與評論；**權、科**較少被寫進這些結構。
- **Worker** 端四化摘要會從 `fourTransformations`（本命／大限／流年／小限）與 `overlapAnalysis.items` 組出；若前端 `overlapAnalysis` 或 `fourTransformations` 只產出祿/忌，命書時間模組就只會看到祿/忌。
- **後續可做**：在 `overlapAnalysis` 或四化彙整邏輯中，把權、科一併寫入（例如各層的 `mutagenStars` 已含權/科時，在 items 或 palaceMap 中一併輸出），命書與時間模組即可顯示權、科。

---

## 已實作修復

| 項目 | 檔案 | 修改 |
|------|------|------|
| 大限一覽出現在 s15 | `worker/content/lifebookSection-zh-TW.json` | s15 `structure_analysis` 新增【十年大限一覽】`{decadalLimitsList}` 與【十年主線能量】`{decadalMainLineEnergy}` |
| 小限年份一定帶出 | `js/calc/adminExport.js` | 在命書時間軸區塊內，依年齡 0～99 算小限落宮，組 `results.minorFortuneByPalace`（12 宮 × 每宮第一年），並依 `overlapAnalysis` 標註 note |

---

## 使用注意

- 專家後台「一鍵生成命書」前，請先執行一次**完整計算**（含疊宮），以確保 `window.overlapAnalysis`、`window.fourTransformations` 等已更新。
- 導出／生成時使用 `AdminExport.exportCalculationResults({ birthInfo })`，即會內含 `decadalLimits`、`minorFortuneByPalace`、`overlapAnalysis`；無須再按「載入大限／小限／流年」才會有小限年份。
- 若之後要「每年一筆」的完整小限時間軸（而非每宮一筆），可再擴充 `minorFortuneByPalace` 為每年一筆的陣列，並在 Worker s15a 用新 placeholder 輸出。
