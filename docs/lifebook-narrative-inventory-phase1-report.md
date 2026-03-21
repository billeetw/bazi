# 命書敘事盤點 — 階段一報告

**文件性質**：階段一交付報告  
**對應文件**：`docs/lifebook-narrative-inventory.md`（命書敘事資料來源盤點）  
**目的**：為單宮內容重構做準備，完成敘事相關資料來源的盤點與狀態標記。

---

## 一、階段一目標與範圍

| 項目 | 說明 |
|------|------|
| **目標** | 盤點所有命書敘事相關資料來源，並標記 **USED** / **UNUSED** / **DUPLICATED**，收斂權威來源建議 |
| **範圍** | 宮位語意、星曜語意、星曜組合、四化語意、橋接模板、Builder（敘事組裝）、其他敘事來源 |
| **產出** | 完整盤點表（見 narrative-inventory）、重複／缺口摘要、單宮重構可依賴的權威來源建議 |

---

## 二、盤點結果摘要

### 2.1 宮位語意（7 項）

- **USED**：`palaceThemes`、`palaceContexts`、`SECTION_TEMPLATES.description`、`PALACE_SEMANTIC_DICTIONARY` / `getPalaceSemantic()`、`decadalPalaceThemes`
- **DUPLICATED**：前端 `consultationScriptEngine.js` 內 `PALACE_CONTEXTS` 與 worker `palaceContexts` 語意重疊、格式不同
- **UNUSED**：`palace_consultation_dictionary.zh-TW.json`（`loadData` 有型別，未見命書組裝或 engine 讀取）

### 2.2 星曜語意（8 項）

- **USED**：`STAR_SEMANTIC_DICTIONARY`、`starBaseCore`、`starBaseMeaning`、`starBaseShadow`、`starPalacesMain` / `starPalaces` / `starPalacesAux`（含 Action / Risk）、`starMetadata`
- **N/A**：專案內無 `STAR_TRAITS` / `STAR_ACTIONS` 字面常數；語意散見上述來源

### 2.3 星曜組合（4 項）

- **USED**：`ccl3/star-combinations.json` + `starCombinationEngine` → `StarCombinationFinding[]`；前端 `evaluateMainStarCombination`（幸運指數，非命書敘事）
- **UNUSED**：`worker/data/star_combinations.zh-TW.json`（若存在，文件指未載入）

### 2.4 四化語意（5 項）

- **USED**：`mingGongTransformMatrix`、`starPalaceTransformMatrix.ts`、`transformIntoPalaceMeanings.json`、`starSemanticDictionary` 內四化語意
- **DUPLICATED / 待確認**：`starTransformMeanings.json` 若與 STAR_PALACE_TRANSFORM_MATRIX 同維度則重疊

### 2.5 橋接與 Builder（8 項）

- **USED**：`buildStarNarrativeForPalace`、`buildPalaceStarNarrativeBlock`、`buildMingGongTransformNarrative`、`buildPalaceTransformNarrative`、`buildSihuaFlowSummary`
- **N/A**：無 `buildPalaceNarrative`、`buildPalaceNarratives`、`buildTransformNarrative`、`bridgeTemplates` 字面命名；宮位敘事由上述 builder 與語意來源組合完成

### 2.6 其他敘事來源（8 項）

- **USED**：`narrativeCorpus`、`mingGongStarMatrix`、`mingGongSentenceLibrary`、CCL3 `palace-transform-star-matrix` / `main-star-inference-hints`、`starSanfangFamilies`、`palaceRiskCorpus`、`generateNarrative.ts` 等；高壓／迴路／意識宮依實際注入與讀取判斷

---

## 三、重複與缺口（需決策）

| 類型 | 項目 | 建議 |
|------|------|------|
| **DUPLICATED** | 宮位語境：worker `palaceContexts` vs 前端 `PALACE_CONTEXTS`（consultationScriptEngine） | 單宮重構若統一語意，可擇一為權威，或拆成「命書用」與「諮詢用」兩份 |
| **UNUSED** | `worker/data/palace_consultation_dictionary.zh-TW.json` | 納入宮位語意來源或標註為備用 |
| **UNUSED** | `worker/data/star_combinations.zh-TW.json`（若存在） | 與 ccl3/star-combinations 擇一或分工 |
| **N/A** | STAR_MEANINGS / STAR_TRAITS / SIHUA_TEMPLATES / bridgeTemplates 等字面常數 | 專案內無此命名；對應語意散見既有字典與 builder |

---

## 四、單宮重構可依賴的權威來源（建議）

單宮內容重構時，建議以以下來源為權威，避免混源與重複定義：

- **宮位語意**：`palaceContexts`（worker）、`SECTION_TEMPLATES[].description`、`PALACE_SEMANTIC_DICTIONARY` / `getPalaceSemantic`、`decadalPalaceThemes`
- **星曜語意**：`starBaseCore`、`starBaseMeaning`、`starPalacesMain` / `starPalaces` / `starPalacesAux`、`STAR_SEMANTIC_DICTIONARY` / `getStarSemantic`
- **星曜組合**：`worker/content/ccl3/star-combinations.json` + `starCombinationEngine` → `findings.starCombinations`
- **四化語意**：`mingGongTransformMatrix`、`starPalaceTransformMatrix.ts`、`transformIntoPalaceMeanings.json`、`getDecadalPalaceTheme`
- **單宮敘事組裝**：`buildPalaceStarNarrativeBlock`、`buildMingGongTransformNarrative`、`buildPalaceTransformNarrative`、`buildSihuaFlowSummary`

---

## 五、階段一結論與建議下一步

- **階段一已完成**：敘事資料來源盤點與 USED/UNUSED/DUPLICATED 標記、權威來源建議均已產出，可作為單宮重構對照與收斂依據。
- **建議下一步（階段二）**：  
  - 依權威來源清單收斂讀取路徑（例如宮位語境擇一、UNUSED 是否啟用或標註棄用）。  
  - 單宮內容重構實作時，僅從上述權威來源組裝，不再混用 DUPLICATED 或未標記來源。

以上為命書敘事盤點階段一報告。
