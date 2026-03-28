# P0.4：模組二時間真值修正報告

## 實際修改檔案

- `worker/src/lifeBookPrompts.ts`
- `worker/tests/lifeBookPrompts-module2.test.ts`

（未改 content/template。）

---

## 寫入點與覆寫順序（靜態整理）

| 欄位 | 寫入點 | 最後覆寫順序 |
|------|--------|--------------|
| **currentDecadalPalace** | ① getPlaceholderMapFromContext 內 timeModuleKeys：decadalLimits + nominalAge → currentLimit.palace → map（約 3489）。② timeModuleYearKeys 未再寫。③ injectTimeModuleDataIntoSection 相容層：decadalLimits + nominalAge → map.currentDecadalPalace（約 4393）。④ P2 路徑：axis.currentDecadalPalace → map（約 4350）。 | P2 時為 axis；相容層時為 ③。 |
| **currentDecadeSihuaLine** | ① getPlaceholderMapFromContext：timeDisplay.currentDecadeSihuaLine（現改為所有 timeModuleYearKeys 先跑 timeDisplay，故 3749 改前僅 s15/s16）。② injectTimeModuleDataIntoSection 相容層：display.currentDecadeSihuaLine（4380）。③ P2：axis.currentDecadeSihuaLine（4351）。 | P2 時為 ③；相容層為 ②。 |
| **flowYearMingPalace** | ① getPlaceholderMapFromContext：timeDisplay.flowYearMingPalace（現改為所有 timeModuleYearKeys 先寫，3750）。② injectTimeModuleDataIntoSection 相容層：display.flowYearMingPalace（4381）。③ P2：axis.flowYearMingPalace（4352）。 | P2 時為 ③；相容層為 ②。 |
| **flowYearSihuaLine** | ① 已刪除：getPlaceholderMapFromContext 內「liunianStr \|\| "（無流年四化資料）"」寫入（原 3746）。② getPlaceholderMapFromContext：timeDisplay.flowYearSihuaLine（3751，僅 s15/s16 時才有 timeDisplay）→ 現改為所有 timeModuleYearKeys 先跑 timeDisplay，故一律來自 buildTimeModuleDisplayFromChartJson。③ injectTimeModuleDataIntoSection 相容層：display.flowYearSihuaLine（4382）。④ P2：axis.flowYearSihuaLine（4353，含時間軸錯誤時覆寫為「時間軸驗證未通過…」）。 | 一律來自 timeDisplay/axis，不再用 liunianStr 寫入，故不會等於 currentDecadeSihuaLine（除非同天干導致內容相同）。 |
| **yearDecisionSummaryBlock** | ① getPlaceholderMapFromContext：decisionMatrix + yearly + overlap 宮位 tag → buildYearDecisionSummary → formatYearDecisionSummaryBlock；條件為 `!(sectionKey === "s16" && s16V2Usable)`（約 3805、3808）。 | 僅 fallback 路徑寫入；s16 V2-primary 時不寫（P0.3 已知問題）。 |

---

## 每一項 bug 的根因與修正內容

### 1. flowYearSihuaLine 可能等於 currentDecadeSihuaLine

- **根因**：getPlaceholderMapFromContext 裡先有 `map.flowYearSihuaLine = liunianStr || "（無流年四化資料）"`（liunianStr 來自 liunian / fourTransformations.liunian / overlap），再以 `timeDisplay.flowYearSihuaLine` 覆寫，但 timeDisplay 只對 s15/s16 跑，且 sihuaTimeBuilders 已禁止用 decadal 當流年四化；冗餘的第一次寫入仍可能在某些路徑留下錯誤印象或舊值。
- **修正**：改為「時間軸與流年宮位／四化一律來自 buildTimeModuleDisplayFromChartJson」。先對所有 timeModuleYearKeys（s15～s21）呼叫 buildTimeModuleDisplayFromChartJson 並寫入 map.birthSihuaLine、currentDecadeSihuaLine、flowYearMingPalace、flowYearSihuaLine，再對 s15/s16 做 liunianStr、flowYearSihua 等。刪除對 `map.flowYearSihuaLine = liunianStr || "（無流年四化資料）"` 的寫入，流年四化只由 timeDisplay 提供，不 fallback 到大限。

### 2. s20YearLine 出現字面「流年命宮」而非實際宮位

- **根因**：s17～s21 從未在 getPlaceholderMapFromContext 寫入 flowYearMingPalace（只有 s15/s16 有 timeDisplay），s20 區塊用 `flowPalace = map.flowYearMingPalace ?? "流年命宮"` 時 map 為空，故出現字面「流年命宮」。P2 路徑下 assembleS20 的 fallback 也用 `yearPalace = chart.yearlyHoroscope?.destinyPalace ?? "流年命宮"`，minimalChart 無 yearlyHoroscope 時同樣是「流年命宮」。
- **修正**：  
  - 在 getPlaceholderMapFromContext：所有 timeModuleYearKeys 先跑 timeDisplay 並寫入 flowYearMingPalace（及 currentDecadeSihuaLine、flowYearSihuaLine），s20 再用 `flowPalace = map.flowYearMingPalace ?? "今年流年"`（避免字面「流年命宮」）。  
  - 在 injectTimeModuleDataIntoSection（P2）：若 sectionKey === "s20" 且 map.flowYearMingPalace 存在且 map.s20YearLine 含「流年命宮」，則將 s20YearLine 內「流年命宮」替換為 map.flowYearMingPalace。

### 3. 讀者版出現「（本題無對應宮位或無法解析）」等 technical 句

- **根因**：buildTechDebugForPalace 在 ctx 為 null 時 push「（本題無對應宮位或無法解析）」。
- **修正**：改為「（此宮暫無星曜與四化資料）」，避免讀者版出現 technical/debug 用語。

### 4. buildSihuaFallByPalaceBlock / buildSihuaEnergyFocusBlock / buildNatalGongganFlowBlock 資料來源

- **靜態結論**：buildSihuaFallByPalaceBlock、buildSihuaEnergyFocusBlock 使用 `buildSiHuaLayers(chartJson)`（**權威**：fourTransformations、decadalLimits、yearlyHoroscope、liunian；**不**讀已廢止 `chartJson.sihuaLayers` wire）。buildNatalGongganFlowBlock（sihuaTimeBuilders）使用 normalizeChart(chartJson) 與 chart.natal?.flows。目前未發現與 normalized chart 契約不符的寫法；s15 四化落宮／能量集中／本命宮干飛化在相容層由 injectTimeModuleDataIntoSection 呼叫 buildSihuaFallByPalaceBlock(chartJson)、buildSihuaEnergyFocusBlock(chartJson)、buildNatalGongganFlowBlock(chartJson) 寫入 map，未改動。

### 5. 小限／minor／xiaoxian 混入 s15～s21 正文與四化技術版

- **靜態結論**：template（lifebookSection-zh-TW.json）無「小限」；模組二 structure_analysis 的 placeholder 來源（timeDisplay、axis、overlap、V2）均不產出「小限：」；四化技術版（decadalFourTransformBlocks、yearlyFourTransformBlocks、shock/mine/wealth blocks）亦無。minorFortuneByPalace / minorFortuneTimelineTable 僅用於 s15a 附錄與關鍵年份列表，依題意保留。未新增移除小限的程式改動。

---

## 測試結果

- 執行：`npm test -- --run lifeBookPrompts-module2.test.ts lifebook-v2-reason.test.ts`
- 結果：**2 個檔案 36 個測試全部通過**（含新增 3 個 P0.4 用例）。

新增用例：

1. **大限四化與流年四化不同時，輸出不可相同**：chart 設不同 decadal vs liunian mutagenStars，注入後大限四化與流年四化兩行不相等。  
2. **flowYearMingPalace 必須顯示實際宮位（s20 不出現字面「流年命宮」）**：s20 注入後輸出含實際宮位（如財帛宮）、不含「流年命宮」。  
3. **s15 structure_analysis 內不可再出現「小限：」**：s15 片段注入後不含「小限：」。

---

## 還剩哪些已知問題

- **yearDecisionSummaryBlock 在 s16 V2-primary 時為空**（P0.3）：fallback 在 s16V2Usable 時不寫，V2 builder 也不產此 key；需 builder 或 fallback 微調。  
- **s15a 在 V2 僅 scores/events 無 stackSignals 時** overlapSummary 與 shock/mine/wealth 全空（P0.3）：需 fallback 微調在 V2 未提供時仍用 overlap 補寫。  
- **buildSiHuaLayers** 註解仍寫「本命／大限／流年／小限」，實作僅三層；若未來要支援小限層需另加。  
- **s20 P2 路徑**：assembleS20 仍用 `yearPalace = chart.yearlyHoroscope?.destinyPalace ?? "流年命宮"`，依賴 inject 後以 flowYearMingPalace 替換「流年命宮」；若希望 P2 從頭就不產「流年命宮」，可改為傳入 timeContext.flowYearMingPalace 給 assembleS20。
