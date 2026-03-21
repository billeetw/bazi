# 命書敘事資料來源盤點（Narrative Inventory）

為單宮內容重構做準備，盤點所有敘事相關資料來源，並標記 **USED** / **UNUSED** / **DUPLICATED**。

---

## 1️⃣ 宮位語意資料

| 來源 | 位置 | 說明 | 狀態 |
|------|------|------|------|
| **palaceThemes** | `worker/content/decisionMatrix.json` → `palaceThemes` | 宮位 → 主題短句（決策矩陣用） | **USED**：`index.ts` 注入 content；`timeDecisionEngine.ts`、`content-from-d1.ts` 讀取做決策敘事 |
| **palaceContexts** | `worker/content/palaceContexts-zh-TW.json` → `palaceContexts` | 宮位 → 語境短句（如「個性與人生方向」「職涯與社會角色」） | **USED**：`index.ts` 注入 content；`lifeBookPrompts.ts` 傳入 `buildPalaceStarNarrativeBlock`；`starNarrativeForPalace.ts` 用於「在你的{context}中會被特別感受到」 |
| **PALACE_CONTEXTS**（inline） | `js/calc/consultationScriptEngine.js` 約 314–328 行 | 宮位 → 開場句（如「你天生就有種」「你在這個領域有一種」） | **USED**：前端諮詢腳本話術；與 worker `palaceContexts` 語意重疊、格式不同 | **DUPLICATED** |
| **SECTION_TEMPLATES.description** | `worker/src/lifeBookTemplates.ts` → `SECTION_TEMPLATES[].description` | 每 section（含宮位 s02/s10/…）的章節描述，亦作「宮位核心意涵」 | **USED**：`lifeBookPrompts.ts` 填入 `palaceCoreMeaning`、宮位核心定義句 |
| **palace_consultation_dictionary** | `worker/data/palace_consultation_dictionary.zh-TW.json` | 12 宮：`domain[]`、`description` | **UNUSED**：`loadData.ts` 有型別 `PalaceConsultationRow`，未見命書組裝或 engine 讀取 |
| **PALACE_SEMANTIC_DICTIONARY** | `worker/src/lifebook/starSemanticDictionary.ts` | 宮位 → `{ core, plain, short? }` 語義 | **USED**：`getPalaceSemantic()` 被 `lifeBookPrompts`、`palaceAdapters`、`patternHitRenderer`、`dominantPalaceDetector`、`narrativeToneEngine`、`sihuaFlowEngine`、`patternPhraseLibraryRuleTypes` 呼叫 |
| **decadalPalaceThemes** | `worker/content/decadalPalaceThemes.json` → `decadalPalaceThemes` | 宮位 → `{ theme, narrative }`（大限落該宮的十年主題） | **USED**：`transformInterpretationEngine.ts` 的 `getDecadalPalaceTheme()`；`lifeBookPrompts.ts` 取 `currentDecadalTheme`、`currentDecadalHomework` 等 |

---

## 2️⃣ 星曜語意資料

| 來源 | 位置 | 說明 | 狀態 |
|------|------|------|------|
| **STAR_SEMANTIC_DICTIONARY** | `worker/src/lifebook/starSemanticDictionary.ts` | 星名 → `{ core, plain, themes[], risk, advice }` | **USED**：`getStarSemantic()` / `getStarSemanticPhrases()` 被 mingGongAdapters、palaceAdapters、transformInterpretationEngine、patternHitRenderer、generateNarrative 使用 |
| **starBaseCore** | `worker/content/starBaseCore-zh-TW.json`；content 注入 | 星 id → 核心一句 | **USED**：`lifeBookPrompts.ts` 解析星曜時取 `baseMeaning`；mingGongAdapters fallback；palace 敘事 fallback |
| **starBaseMeaning** | `worker/content/starBaseMeaning-zh-TW.json`；content 注入 | 星名 → 基礎意涵 | **USED**：`lifeBookPrompts.ts` 取 `starBaseMeaning?.[name]` 作為 baseMeaning 來源之一 |
| **starBaseShadow** | worker content（starBaseShadow-zh-TW.json） | 星之陰影面語意 | **USED**：若已注入 content，可被敘事或 archetype 引用；需以實際注入路徑為準 |
| **starPalacesMain / starPalaces / starPalacesAux** | `worker/content/starPalacesMain-zh-TW.json` 等；content 注入 | 星_宮 key → 該星在此宮的意涵（meaningInPalace） | **USED**：`lifeBookPrompts.ts` 組裝宮位星曜時取 `meaningInPalace`；`starNarrativeForPalace` 的 base + 宮位語境 |
| **starPalacesAuxAction / starPalacesAuxRisk** | content 注入 | 輔星_宮 → 行動建議；輔星_宮 → 風險等級 | **USED**：`lifeBookPrompts` 用於 actionAdvice、風險標註與敘事 |
| **starMetadata** | `worker/content/starMetadata.json` | 星曜權重、風險等 metadata | **USED**：宮位權重／風險聚合與 narrative engine 使用 |
| **STAR_TRAITS / STAR_ACTIONS**（字面常數） | 搜尋結果 | 無以全大寫常數名存在 | **N/A**：專案內未見此二常數名；星特質／行動散見 STAR_SEMANTIC_DICTIONARY、starPalaces、ccl3 等 |

---

## 3️⃣ 星曜組合資料

| 來源 | 位置 | 說明 | 狀態 |
|------|------|------|------|
| **star-combinations.json (CCL3)** | `worker/content/ccl3/star-combinations.json` | CCL3 star_combinations：兩星組合 → patternName、psychology、lifePattern 等 | **USED**：`index.ts` 載入為 `starCombinationsTable`；`starCombinationEngine.ts` 產出 `StarCombinationFinding[]`；findings 的 `starCombinations` |
| **StarCombinationsTable / runStarCombinationEngine** | `worker/src/lifebook/engines/starCombination/` | 同宮兩星 canonical 排序後查表 | **USED**：buildLifebookFindings → buildPalaceFindings → palaceLayer.starCombinations |
| **star_combinations.zh-TW.json (data)** | `worker/data/` 文件提及 | 若存在則為另一份星曜組合語義 | **UNUSED**：文件指「未載入」或待整合；目前引擎以 ccl3/star-combinations.json 為準 |
| **STAR_SYSTEMS / starGroups**（字面） | 搜尋結果 | 無以該名稱存在的常數 | **N/A**：星群／系統語意散見 starSanfangFamilies、rhythm 等 |
| **evaluateMainStarCombination** | `js/calc/luckIndex.js` | 前端主星組合評估（非命書敘事） | **USED**：前端幸運指數等；與命書 CCL3 starCombinations 不同用途 |

---

## 4️⃣ 四化語意模板

| 來源 | 位置 | 說明 | 狀態 |
|------|------|------|------|
| **mingGongTransformMatrix** | `worker/content/ccl3/patterns/` 或專用矩陣 | 命宮四化專用矩陣 | **USED**：`mingGongAdapters.ts` → `getMingGongTransformMeaning()`；命宮四化敘事優先來源 |
| **starPalaceTransformMatrix (STAR_PALACE_TRANSFORM_MATRIX)** | `worker/src/lifebook/starPalaceTransformMatrix.ts` | 星×宮×四化 → meaning（inline 陣列） | **USED**：`findStarPalaceTransformMeaning()`；命宮 fallback、其餘 11 宮四化敘事 |
| **transformIntoPalaceMeanings.json** | `worker/content/transformIntoPalaceMeanings.json` | key：`transform_宮位`（如 lu_官祿宮）→ 一句解釋 | **USED**：`transformInterpretationEngine.ts` 的 `getTransformIntoPalaceMeaning()` |
| **starTransformMeanings.json** | `worker/content/starTransformMeanings.json` | 星×四化語意（若為此結構） | 需依實際 key 結構確認；若為「星+四化→句」則可能與 STAR_PALACE_TRANSFORM_MATRIX 重疊 | **DUPLICATED**（若同維度）或 **USED**（若不同用途） |
| **TransformSemantic / getStarSemantic 等** | `worker/src/lifebook/starSemanticDictionary.ts` | 四化 label/core/plain/advice | **USED**：語義字典內；與四化敘事串接 |
| **SIHUA_TEMPLATES**（字面常數） | 搜尋結果 | 無以此名稱存在 | **N/A** |

---

## 5️⃣ 橋接模板

| 來源 | 位置 | 說明 | 狀態 |
|------|------|------|------|
| **buildStarNarrativeForPalace** | `worker/src/lifebook/starNarrativeForPalace.ts` | 單星在單宮的敘事句（baseMeaning + 宮位語境） | **USED**：`buildPalaceStarNarrativeBlock` 內對非主星呼叫 |
| **buildPalaceStarNarrativeBlock** | `worker/src/lifebook/starNarrativeForPalace.ts` | 整宮星曜結構區塊（主星段 + 輔煞雜 1～2 句） | **USED**：`lifeBookPrompts.ts` 的 `palaceStarsOnlySnippet`（isPalaceSection 時） |
| **buildPalaceNarrative**（字面） | 搜尋結果 | 無以該名稱存在的函式 | **N/A**：宮位敘事由 buildPalaceStarNarrativeBlock、palaceAdapters、getPalaceSemantic 等組合完成 |
| **bridgeTemplates**（字面） | 搜尋結果 | 無以此名稱存在 | **N/A** |

---

## 6️⃣ Builder（敘事組裝）

| 來源 | 位置 | 說明 | 狀態 |
|------|------|------|------|
| **buildPalaceStarNarrativeBlock** | `worker/src/lifebook/starNarrativeForPalace.ts` | 見上「橋接模板」 | **USED** |
| **buildStarNarrativeForPalace** | 同上 | 見上「橋接模板」 | **USED** |
| **buildMingGongTransformNarrative** | `worker/src/lifebook/mingGongAdapters.ts` | 命宮四化敘事（矩陣 → starPalaceTransform → 通用 fallback） | **USED**：`lifeBookPrompts` 的 `getMingGongTransformNarrativeByPriority`、命宮 palaceTransformNarrative |
| **buildPalaceTransformNarrative** | `worker/src/lifebook/palaceAdapters.ts` | 各宮四化敘事（命宮委託 mingGong；其餘 findStarPalaceTransformMeaning） | **USED**：`lifeBookPrompts` 的 `getPalaceTransformNarrativeByPriority`、`palaceTransformNarrative` |
| **buildPalaceNarratives**（複數） | 搜尋結果 | 無以該名稱存在 | **N/A** |
| **buildTransformNarrative** | 搜尋結果 | 無以該名稱存在；四化敘事由 buildMingGongTransformNarrative / buildPalaceTransformNarrative 與 transformInterpretationEngine 等負責 | **N/A** |
| **buildSihuaFlowSummary** | `worker/src/lifeBookPrompts.ts` | 單宮「本命宮干飛化（本宮）」+ 四化能量總結 | **USED**：12 宮 placeholder `sihuaFlowSummary` |
| **buildPalaceContext**（若存在） | 未在本次搜尋列出 | 若有則多為組裝宮位上下文 | 以專案搜尋為準 |

---

## 7️⃣ 其他敘事相關來源

| 來源 | 位置 | 說明 | 狀態 |
|------|------|------|------|
| **narrativeCorpus** | `worker/content/narrativeCorpus-zh-TW.json` | s00 等 openers/explainers/advisers/connectors | **USED**：`lifeBookPrompts.ts` 的 s00 相關組裝 |
| **mingGongStarMatrix** | 命宮主星四段（opening/strength/tension/mature） | **USED**：`mingGongAdapters.buildMingGongStarNarrative`；命宮專用 |
| **mingGongSentenceLibrary** | `worker/src/lifebook/mingGongSentenceLibrary.js` | 命宮句庫、getPalaceSemantic 等 | **USED**：命宮核心定義、輔煞敘事、getPalaceSemantic 等 |
| **palace-transform-star-matrix (CCL3)** | `worker/content/ccl3/patterns/palace-transform-star-matrix.json` | 四化×宮位×主星推理矩陣 | **USED**：palaceInferenceEngine、palacePatterns |
| **main-star-inference-hints** | `worker/content/ccl3/patterns/main-star-inference-hints.json` | 主星推論提示 | **USED**：palaceInference 主星 fallback |
| **starSanfangFamilies** | `worker/content/starSanfangFamilies-zh-TW.json` | 命/財/官/遷 pattern、roleSummary 等 | **USED**：palaceAdapters、節奏與主戰場敘事 |
| **palaceRiskCorpus** | `worker/content/palaceRiskCorpus-zh-TW.json` | 宮位風險語料 | **USED**：若已注入 content，用於風險敘事 |
| **highPressure / neuralLoops / consciousPalace 等** | worker/content/*.json | 高壓、迴路、意識宮等 | 依實際注入與讀取判斷 | **USED**（若有引用） |
| **generateNarrative.ts** | `worker/src/engine/generateNarrative.ts` | 四化事件→normalize→detect→字典→主文 | **USED**：舊版／引擎敘事管線；與 lifeBookPrompts 並存 |

---

## 8️⃣ 重複與缺口摘要

| 類型 | 項目 | 建議 |
|------|------|------|
| **DUPLICATED** | 宮位語境：worker `palaceContexts` vs 前端 `consultationScriptEngine` 的 inline `PALACE_CONTEXTS` | 若單宮重構要統一語意，可擇一為權威或拆成「命書用」與「諮詢用」兩份 |
| **UNUSED** | `worker/data/palace_consultation_dictionary.zh-TW.json` | 可納入宮位語意來源或標註為備用 |
| **UNUSED** | `worker/data/star_combinations.zh-TW.json`（若存在） | 文件指未載入；與 ccl3/star-combinations 擇一或分工 |
| **N/A** | STAR_MEANINGS / STAR_TRAITS / STAR_ACTIONS / SIHUA_TEMPLATES / bridgeTemplates / buildPalaceNarratives / buildTransformNarrative 等字面常數或函式名 | 專案內無此命名；對應語意散見 STAR_SEMANTIC_DICTIONARY、starPalaces、四化矩陣與各 builder |

---

## 9️⃣ 單宮重構可依賴的權威來源（建議）

- **宮位語意**：`palaceContexts`（worker）、`SECTION_TEMPLATES[].description`、`PALACE_SEMANTIC_DICTIONARY` / `getPalaceSemantic`、`decadalPalaceThemes`（大限主題）。
- **星曜語意**：`starBaseCore`、`starBaseMeaning`、`starPalacesMain` / `starPalaces` / `starPalacesAux`、`STAR_SEMANTIC_DICTIONARY` / `getStarSemantic`。
- **星曜組合**：`worker/content/ccl3/star-combinations.json` + `starCombinationEngine` → `findings.starCombinations`。
- **四化語意**：`mingGongTransformMatrix`、`starPalaceTransformMatrix.ts`、`transformIntoPalaceMeanings.json`、`getDecadalPalaceTheme`。
- **單宮敘事組裝**：`buildPalaceStarNarrativeBlock`、`buildMingGongTransformNarrative`、`buildPalaceTransformNarrative`、`buildSihuaFlowSummary`（本命宮干飛化+能量總結）。

以上為命書敘事資料來源盤點，供單宮內容重構時對照與收斂來源。
