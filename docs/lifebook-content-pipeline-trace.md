# 命書內容 Pipeline 追蹤：資料完整性與缺失原因

## Pipeline 總覽

```
birth chart (前端/API) → buildPalaceContext → getPlaceholderMapFromContext → resolveSkeletonPlaceholders → lifebookSection 模板
                    ↓
            buildSiHuaContext / collectFourTransformsForPalace
            getPalaceStarsStrengthMap (亮度)
```

---

## 一、左輔化科在夫妻宮未顯示

### 資料來源

1. **perPalaceFlow（各宮四化摘要）**  
   - 來源：`buildSiHuaContext(chartJson).perPalaceFlow["夫妻"]` 或 `["夫妻宮"]`。  
   - **現況**：由 **findings + `buildSihuaFlowSummary`**（或相容路徑的 `collectFourTransformsForPalace`）組裝；**不**以 `chartJson.sihuaLayers` wire 為權威（該欄位已 deprecated，見 `lifebook-sihua-single-source-phase1.md`）。

2. **collectFourTransformsForPalace**  
   - 只從 **overlapAnalysis.items**（或舊格式 overlap 的 criticalRisks / maxOpportunities / volatileAmbivalences）讀取。  
   - **重要**：`overlap.items` 多數實作只包含 **tag 非 normal** 的宮位（例如 shock / mine / wealth），**夫妻宮若被標為 normal 就不在 items 裡**，因此不會有任何四化條目，自然也不會出現「左輔化科在夫妻宮」。

### 斷層結論

| 層級 | 可能原因 |
|------|----------|
| birth chart | overlap 只輸出「非 normal」宮位時，夫妻宮未進 items；與是否送 `sihuaLayers` wire 無關（wire 不驅動正文）。 |
| buildSiHuaContext | perPalaceFlow 依 buildSihuaFlowSummary → collectFourTransformsForPalace；夫妻宮不在 overlap.items 則為空。 |
| placeholder map | sihuaFlowForPalace / fourTransformSummaryForPalace 直接來自 perPalaceFlow 或 buildSihuaFlowSummary，上游空則此地也空。 |
| 模板 | 有使用 {fourTransformSummaryForPalace}，非斷層點。 |

**建議**：  
- 若要「左輔化科在夫妻宮」穩定出現，需在**計算層**擴充 **overlap** 結構，讓 **items 涵蓋 12 宮**（含 normal），並在每宮的 transformations 中列出該宮四化（含權、科）；或確保 findings 內 natal／flow 資料完整。**不要**依賴已廢止的 `sihuaLayers` wire。

---

## 二、星曜亮度未顯示

### 資料來源

1. **buildPalaceContext** 內：  
   - `strengthByStar = getPalaceStarsStrengthMap(chartJson, palaceId)`  
   - 對每顆星：`strength = strengthByStar[name] ?? strengthByStar[code] ?? (i === 0 ? strengthFirst : undefined)`  

2. **getPalaceStarsStrengthMap / getPalaceStarStrength**  
   - 讀取 **chartJson.ziwei.palaces[idx]**（idx 依宮位對應 0～11）。  
   - 對 **majorStars**、**minorStars** 每個元素取 `star.brightness ?? star.strength`，並用 BRIGHTNESS_TO_ZH 轉成中文（廟/旺/利/陷/平/得/不）。  
   - 若 **ziwei.palaces** 不存在、或各宮沒有 **majorStars/minorStars**、或星曜物件沒有 **brightness/strength** 欄位，則回傳空物件／undefined。

### 斷層結論

| 層級 | 可能原因 |
|------|----------|
| birth chart | 前端/計算回傳的 **ziwei** 沒有 `palaces` 陣列，或 palaces[i] 沒有 `majorStars`/`minorStars`，或星曜沒有 `brightness`/`strength`。iztro 若未在 API 回傳每顆星的亮度，則需在計算端依派別補算後寫入。 |
| buildPalaceContext | 若 getPalaceStarsStrengthMap 回傳 {}，則 ctx.stars[].strength 多為 undefined，僅第一顆可能用 strengthFirst（只取 majorStars[0]）。 |
| placeholder map | palaceStarsOnlySnippet / brightnessBlock 等依 ctx.stars[].strength；無 strength 則不顯示亮度，brightnessSectionOptional 為空。 |
| 模板 | brightnessSectionOptional 有則顯示、無則不顯示；若曾出現「此欄位資料不足」為舊 placeholder 未清空，見下方優化。 |

**建議**：  
- 確認 **iztro** 或目前排盤 API 是否回傳每宮 **majorStars/minorStars** 的 **brightness** 或 **strength**。Worker 讀取為 `chartJson.ziwei.palaces[idx].majorStars[]/.minorStars[]` 的 `brightness ?? strength`，並以 BRIGHTNESS_TO_ZH 對應（miao→廟、wang→旺、li→利、xian→陷、ping→平、de→得、bu→不）。  
- 若 iztro 未提供，需在計算 pipeline（前端或 Worker）依天干地支與星曜表補算亮度後，寫入 **ziwei.palaces[i].majorStars/minorStars[].brightness**（或 strength）。

---

## 三、亮度區塊與「此欄位資料不足」

- 目前邏輯：**有任一颗星有 strength 才組 brightnessBlock / brightnessSectionOptional**，否則為空字串，模板不應出現「此欄位資料不足」來自亮度。  
- 若仍出現，多半是其他 placeholder（如 wuxingEnergyLabel、tenGod 等）被設為 MISSING_PLACEHOLDER；宮位章節已將這些清空，理論上僅在非宮位章節或未覆寫處可能出現。  
- 優化：**無亮度資料時完全不輸出亮度段落**（已實作）；並可統一將宮位章節缺資料時的 fallback 改為空字串，避免任何「此欄位資料不足」出現在讀者版。

---

## 四、工程數據（如「風險1」）僅專家版顯示

- **風險等級**（祿存（風險1）、地劫（風險5））目前由 **getRiskSuffix(s.name)** 在 getPlaceholderMapFromContext 中附加到星名。  
- 同一份 placeholder map 被用於：(1) **技術／專家版**（output_mode === "technical"）、(2) **AI 渲染版**（送 GPT 的骨架與最終命書）。  
- 因此若不在組裝時區分，讀者版也會看到「風險N」。  
- **作法**：在 **getPlaceholderMapFromContext** 增加選項 **forTechnicalOutput**。當 **forTechnicalOutput === true** 時才附加 getRiskSuffix；否則一律不附加，AI 版與讀者版即不會出現「（風險N）」。

以上為內容層級追蹤與斷層說明；實作優化見程式與模板變更。
