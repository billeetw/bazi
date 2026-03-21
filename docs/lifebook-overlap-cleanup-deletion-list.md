# 疊宮舊路徑清理：可刪除項目清單與影響面

原則：不再信任的資料來源直接刪除，不保留 fallback。命書寧可少內容也不輸出可能錯誤的四化飛星或疊宮。

**清理狀態**：已完成（見下方「一、可刪除／停用項目與影響」之處理結果）。

---

## 一、可刪除／停用項目與影響

### 1. collectAllFourTransformsForLayer 作為大限／流年飛星資料源

| 項目 | 說明 |
|------|------|
| **函式** | `collectAllFourTransformsForLayer(chartJson, "decadal" | "yearly")`（lifeBookPrompts.ts） |
| **行為** | 從 overlapAnalysis.items / criticalRisks / maxOpportunities / volatileAmbivalences 彙整指定層級四化，依賴舊 overlap 預算。 |
| **處理** | **刪除函式**。所有呼叫改為「公式有資料則用公式，否則空白」。 |
| **呼叫點與改法** | |
| 3629 | S15 大限四化：`formulaDecadalFlows` 無結果時目前 fallback 到 `collectAllFourTransformsForLayer(..., "decadal")` → 改為 `decadalLines = []`，產出 ""。 |
| 3944 | 非 S16 時用 `collectFourTransformsForPalace(..., ["yearly"])` 填流年區塊 → 改為無公式則 ""（見下）。 |
| 4519 | `buildTimeModuleDisplayForChart` 內用 `collectAllFourTransformsForLayer(chartJson, "yearly")` 建 timeAxis.flowYearSihuaFlyBlock → 改為用 buildYearlySihuaFlows 或 ""。 |
| 4634 | `injectTimeModuleDataIntoSection` 相容層用同上建 map.flowYearSihuaFlyBlock → 改為用公式或 ""。 |

### 2. flattenLegacyTransformations（from/to 推測路徑）

| 項目 | 說明 |
|------|------|
| **函式** | `flattenLegacyTransformations(t, fromPalaceName?)`（lifeBookPrompts.ts） |
| **行為** | 將舊格式 transformations 物件轉成陣列，toPalace 用對宮推測，與現行「toPalace = 本命盤該星所在宮」不符。 |
| **處理** | **刪除函式**。呼叫處改為不產出依賴此邏輯的內容。 |
| **呼叫點** | collectFourTransformsForPalace（384, 427）、collectAllFourTransformsForLayer（426）、buildOverlapDetailBlocks（1197, 1214, 1231）。刪除 collectAll 並停用 overlap 主邏輯後，一併移除。 |

### 3. collectFourTransformsForPalace 作為 overlap 來源

| 項目 | 說明 |
|------|------|
| **函式** | `collectFourTransformsForPalace(chartJson, palaceKey, layers?)`（lifeBookPrompts.ts） |
| **行為** | 從 overlap 取某宮、某層的 transformations。 |
| **處理** | **改為恆回傳 []**（不讀 overlap）。保留函式簽名避免大範圍改動，narrative 僅剩 fourTransformations.benming 或 ""。 |
| **呼叫點** | getMingGongTransformNarrativeByPriority（455）、getPalaceTransformNarrativeByPriority（491）、S16 外流年區塊（3944）。455/491 改為只依 fourTransformations.benming；3944 改為無公式則 ""。 |

### 4. 依賴 overlap 舊 transformations 的主邏輯

| 項目 | 說明 |
|------|------|
| **buildOverlapDetailBlocks** | 從 overlap.items / criticalRisks / maxOpportunities / volatileAmbivalences 產 shockBlocks / mineBlocks / wealthBlocks，內容含舊 transformations。 |
| **處理** | **停用產出**：函式開頭若無「信任的 overlay 資料」（目前無），直接回傳 `{ shockBlocks: "", mineBlocks: "", wealthBlocks: "" }`。不刪函式，待 buildPalaceOverlay 接上後再改為讀新資料。 |
| **呼叫處** | 3771（s15a）、3799（其他 time module）：改為收到空區塊；shockCount/mineCount/wealthCount 改為 0（或維持從 overlap 僅取計數、不取 transformations；為一致改為 0）。 |

### 5. BaziCore decadalLimits 作為命書權威

| 項目 | 說明 |
|------|------|
| **位置** | worker/src/index.ts：命書 generate 時 `decadalLimitsForLifebook = iztro ?? chartForGenerate.decadalLimits`。 |
| **處理** | **僅用 iztro**：若無 iztro（features.ziwei.decadalLimits / ziwei.decadalLimits），設為 `[]`，不 fallback 到 chart 頂層（可能為 BaziCore）。 |
| **影響** | 未先跑 worker 計算時，命書大限一覽與大限四化無資料（空白／unavailable），不顯示錯誤宮干。 |

### 6. minorFortune 參與疊宮主邏輯

| 項目 | 說明 |
|------|------|
| **位置** | buildOverlapDetailBlocks 的 opts.minorFortuneByPalace；s15a 已傳 []，其他 section 傳 minor。 |
| **處理** | **一律傳 []**：所有呼叫 buildOverlapDetailBlocks 處皆傳 `minorFortuneByPalace: []`，疊宮區塊不再使用小限。 |
| **影響** | 疊宮區塊內不再出現小限年份／年齡；key year 等若僅用於附錄可保留傳遞，但不參與疊宮主邏輯。 |

### 7. 流年四化字串（flowYearSihuaLine）的 overlap fallback

| 項目 | 說明 |
|------|------|
| **位置** | worker/src/lifebook/sihuaTimeBuilders.ts：flowYearTransforms 缺時從 overlap.criticalRisks/volatileAmbivalences/maxOpportunities 湊 liunianStr。 |
| **處理** | **刪除 overlap fallback**：僅用 liunian?.mutagenStars ?? ft?.liunian?.mutagenStars；無則 "（無流年四化資料）"。 |

### 8. getAllOverlapTransformations 用於 sihuaGlobalSummary

| 項目 | 說明 |
|------|------|
| **位置** | lifeBookPrompts.ts ~2011：用 getAllOverlapTransformations(chartJson) 計 toPalace 次數產 sihuaGlobalSummary。 |
| **處理** | **改為不依 overlap**：getAllOverlapTransformations 改為回傳 []，或改 sihuaGlobalSummary 邏輯用公式產出的 flows 計算；暫採回傳 []，保留預設 sihuaGlobalSummary 文案。 |

---

## 二、保留不刪（僅調整呼叫方）

- **getFlowBlockForPalace**：只讀 NormalizedChart.*.flows，不讀 overlap，保留。
- **buildNatalGongganFlowBlock / buildDecadalSihuaFlows / buildYearlySihuaFlows**：公式路徑，保留。
- **overlapAnalysis 傳遞**：API 仍可收發 overlapAnalysis，僅命書內不再用其 transformations 作權威。

---

## 三、缺資料時處理

- 大限四化：無 iztro decadalLimits 或公式無結果 → 空白。
- 流年四化：無 yearStem / flowYearPalace 或公式無結果 → 空白。
- 疊宮三區塊（shock/mine/wealth）：停用舊 overlap 內容 → 空白；計數 0。

不補算、不猜、不沿用舊路徑。

---

## 四、清理完成後下一步

1. **buildPalaceOverlay(...) 已實作**（`worker/src/lifebook/palaceOverlay.ts`）  
   - 輸入：`chartJson`、`options?: { currentAge?, flowYear? }`。  
   - 輸出：12 宮陣列，每宮 `{ palace, natalStars, decadalIncoming, decadalOutgoing, yearlyIncoming, yearlyOutgoing }`。  
   - 資料來源：本命 `getStarByPalaceFromChart`，大限 `buildDecadalSihuaFlows`，流年 `buildYearlySihuaFlows`。不讀 overlap、不納入 minorFortune、第一版不含本命宮干飛化。  
   - 驗收：`debugPalaceOverlay(overlay)` 可印出 12 宮摘要；`worker/tests/palaceOverlay.test.ts` 通過。  
   - 後續：確認資料層正確後，再實作 events/signals 與展示層；暫不接回舊 overlap 顯示層、不做 tag（shock/mine/wealth）。

2. **測試調整**  
   - 大限／流年飛星改為僅依公式產出後，fixture 需具備 `decadalLimits[].stem`、`ziwei.starByPalace`、`yearlyHoroscope.stem` 等，公式才會產出內容。  
   - S16 無公式資料時保留 V2 已寫入的 `yearlyFourTransformBlocks`（不覆寫為空）。
