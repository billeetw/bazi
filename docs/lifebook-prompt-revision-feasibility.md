# 命書執行規則修正 — 可行性評估

## 結論：**可行**

需做兩類改動：(1) **資料面**：在送給 infer/generate-section 的 `chart_json` 裡加入時間軸結構 `decadalLimits`、`yearlyHoroscope`、`liunian`；(2) **Prompt 面**：更新 infer 前綴與 s15/s16/s20 題目指引。

---

## 一、你提供的修正內容摘要

- **執行規則（前綴）**：改為「伯彥老師」、任務改為依命盤 JSON（含本命、五行、大限、小限、流年四化）逐章輸出 insight；並約定「時間軸」資料結構。
- **時間軸結構**：
  - `decadalLimits`：12 筆大限，每筆含 `index`, `palaceIndex`, `startAge`, `endAge`, `palace`, `stem`, `mutagenStars`, `weights`, `type: "dalimit"`。
  - `yearlyHoroscopes`：小限，例：`age`, `activeLimitPalaceName`, `yearlyStem`, `mutagenStars`（你內文寫「每年小限」，實務上 s16/s20 只需**當年**一筆即可）。
  - `liunianList`：流年四化，例：`year`, `stem`, `branch`, `palace`, `mutagenStars`, `weights`, `type: "liunian"`（s16/s20 只需**當年**一筆即可）。
- **s01～s14**：維持現行模板。
- **s15**：改用 `chart_json.decadalLimits`，依 index 由小到大整合所有大限，寫 core_insight / evidence / implications / suggestions（含十年級距策略）。
- **s16**：改用該年 `yearlyHoroscope` + 該年 `liunian`，區分「流年＝外在事件」「小限＝心理濾鏡」，並給 3～5 條當年策略。
- **s20**：用當前大限 + 當年小限 + 當年流年 + `traffic_signals`，紅綠燈語言與具體建議。

以上邏輯與現有架構相容，**可行**。

---

## 二、資料面：目前缺什麼、要補什麼

### 2.1 目前 `chart_json` 的來源與內容

- 來源：專家後台一鍵生成時，`chartForApi = toSerializable(chartJson)`，其中 `chartJson = window.AdminExport.exportCalculationResults({ birthInfo })`。
- `exportCalculationResults` 會帶出：
  - `ziwei`, `bazi`, `overlapAnalysis`, `fourTransformations`, `fiveElements`, …
- `fourTransformations` 目前形狀（來自 `computeFourTransformations`）：
  - `benming`, `dalimit`, `liunian`, `xiaoxian`：各為**一筆**（當前年齡/當年）。
  - `summary`：含 `liunianStem`, `liunianBranch`, `liunianPalace`, `dalimitPalace`, `xiaoxianPalace` 等。

也就是說：**已有**「當前大限、當年流年、當年小限」各一筆，**沒有**「全部 12 段大限」的列表。

### 2.2 要補的三塊

| 欄位 | 說明 | 建議作法 |
|------|------|----------|
| **decadalLimits** | 12 筆大限，每筆含 palace, stem, mutagenStars, weights | 在前端組裝：用 `BaziCore.getDecadalLimits` 得到 12 筆 `{ index, palaceIndex, startAge, endAge }`，再依 index 算每段之 `palace`（宮名）、`stem`（大限天干），再以 `CalcHelpers.getMutagenStars(stem)` / `getSiHuaWeights(stem)` 得到 `mutagenStars`、`weights`，組出你給的格式。可寫在 `adminExport.js` 或專家後台組 `chartForApi` 時。 |
| **yearlyHoroscope** | 當年小限一筆（對應目前年齡） | 用 `BaziCore.getHoroscopeFromAge(age, ziwei, bazi, gender)` 已有；把回傳物件放進 `chart_json.yearlyHoroscope`（或保留在 `fourTransformations.xiaoxian` 並在 prompt 裡說明從這裡讀）。若希望與文件一致，可再複製一份為 `chart_json.yearlyHoroscope`。 |
| **liunian**（或 liunianList） | 當年流年四化一筆 | 已有 `fourTransformations.liunian`（含 stem, branch, palace, mutagenStars, weights, type）。可為與文件一致，在 `chart_json` 頂層加 `liunian: fourTransformations.liunian`，並補 `year: currentYear`。 |

- **decadalLimits** 需在前端算好再送 API（Worker 端沒有 BaziCore/CalcHelpers，無法重算）。
- **yearlyHoroscope** / **liunian** 可從現有 `fourTransformations` 取出並在組裝 `chartForApi` 時掛到頂層，方便 prompt 撰寫。

### 2.3 小結（資料面）

- 修正案中的「時間軸」結構與用法是可行的。
- 實作上：在專家後台（或 `adminExport`）組裝送給 `/api/life-book/infer` 與 `/api/life-book/generate-section` 的 `chart_json` 時：
  - 新增並填入 **decadalLimits**（12 筆，格式如你範例）。
  - 新增 **yearlyHoroscope**（當年小限一筆）、**liunian**（當年流年一筆，可帶 `year`）。
- s15/s16/s20 的 prompt 改為從 `chart_json.decadalLimits`、`chart_json.yearlyHoroscope`、`chart_json.liunian` 讀取（或從 `fourTransformations` 對應欄位讀，兩者擇一約定即可）。

---

## 三、Prompt 面：要改哪裡

### 3.1 執行規則（前綴）

- **Infer**：  
  - 目前：`worker/src/lifeBookInfer.ts` 的 `INFER_SYSTEM_PROMPT`。  
  - 作法：可替換或改寫為你提供的「執行規則（前綴）」+「時間軸結構說明」+「章節通用格式」；若保留「星曜宮位定義／命主身主定義」等既有說明，可接在後面。
- **Generate-section**：  
  - 目前：`worker/src/lifeBookPrompts.ts` 的 `getSystemPrompt()` = `EXPERT_PERSONA` + `GENERAL_RULES`。  
  - 作法：若要與 infer 一致，可把同一套「執行規則（前綴）」與「時間軸結構」也放進 system，或放在各題的 user 前綴；s01～s14 維持現行模板即可。

### 3.2 s15 / s16 / s20 題目指引

- **s15**：  
  - 目前：`worker/src/lifeBookTemplates.ts` 的 `SECTION_TEMPLATES` 中 s15 用 `GENERAL_TEMPLATE`（或 S15 專用模板，目前是 S15_TEMPLATE 小限疊宮雷達）。  
  - 作法：改為你提供的 **★ s15：十年大限（所有大限）** 指引，並在 `buildSectionUserPrompt`（或 Worker 組 user 的邏輯）中，對 s15 明確帶入 `chart_json.decadalLimits`（或從 slice 裡傳入 decadalLimits），不必改 s01～s14。
- **s16**：  
  - 改用你提供的 **★ s16：流年（小限疊宮飛星）** 指引，並在組 prompt 時帶入 `chart_json.yearlyHoroscope` 與 `chart_json.liunian`（或 fourTransformations 對應欄位）。
- **s20**：  
  - 改用你提供的 **★ s20：三盤疊加紅綠燈策略** 指引，並帶入當前大限（可從 decadalLimits 依年齡篩出，或沿用 fourTransformations.dalimit）、當年小限、當年流年、`weight_analysis.traffic_signals`（若已有）。

### 3.3 小結（Prompt 面）

- 前綴與 s15/s16/s20 的修正都可以在現有 Worker 與模板架構下完成。
- 實作時只要：  
  - 更新 **INFER_SYSTEM_PROMPT**（與必要時 **getSystemPrompt**）為你的執行規則 + 時間軸結構；  
  - 將 s15/s16/s20 的 template 或專用指引改成你寫的 **★ s15 / s16 / s20** 內容；  
  - 確保這三題的 user prompt 會帶入對應的 `decadalLimits`、`yearlyHoroscope`、`liunian`（及 s20 的 traffic_signals）。

---

## 四、實作檢查清單（簡要）

- [ ] **前端**：在組裝命書用 `chart_json` 時  
  - [ ] 新增 `decadalLimits`（12 筆，每筆含 palace, stem, mutagenStars, weights, type: "dalimit"）。  
  - [ ] 新增 `yearlyHoroscope`（當年小限）、`liunian`（當年流年，可帶 year）。
- [ ] **Worker**：  
  - [ ] 更新 infer 的 system（與必要時 generate-section 的 system）為你的執行規則（前綴）+ 時間軸結構說明。  
  - [ ] s15：改用新指引，並從 `chart_json.decadalLimits` 讀取。  
  - [ ] s16：改用新指引，並從 `chart_json.yearlyHoroscope`、`chart_json.liunian` 讀取。  
  - [ ] s20：改用新指引，並帶入當前大限、當年小限、當年流年、`traffic_signals`。
- [ ] **文件**：可將你提供的完整修正文案收進 `docs/` 或 `worker/` 的註解，方便日後對照與再調整。

整體而言，**此修正可行**，且與現有「infer → narrate」或「generate-section」流程相容；只要補齊上述資料與 prompt 兩塊即可落地。
