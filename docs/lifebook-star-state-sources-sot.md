# 主星／星曜「多狀態表現」資料來源盤點（Source of Truth）

目的：把 repo 內**既有**、可機讀的星曜狀態語料列成單一清單，供 **S22／S23**（與其他命書模組）依 **宮位場景、宮位強弱、煞星、化忌** 等條件選版，組出可讀欄位：`corePattern`、`underStress`、`blindSpot`、`tone`、`punchline`。

**原則**：不新建平行句庫；優先 **查表 → 組句**；缺資料時才 fallback 到語義字典／矩陣。

---

## 1. 欄位與語意（契約）

| 欄位 | 用途（命書可讀性） | 建議來源優先序（見 §2） |
|------|-------------------|-------------------------|
| **corePattern** | 此宮＋此星「主敘事／場景核心」 | 星×宮 `starPalacesMain` / `starPalacesAux` → `starLogicMain` → `STAR_SEMANTIC`（`plain`/`core`）→ `starBaseCore` |
| **underStress** | 壓力下外顯或內在狀態（銜接弱宮、煞、忌） | `star-stress-patterns`（煞／主星條目）→ `starTransformMeanings`（化忌句）→ `STAR_SEMANTIC.risk` |
| **blindSpot** | 易忽略的慣性、陰影 | `star-psychology.shadow` → `star-life-lessons.shadowPattern` → `starBaseShadow` |
| **tone** | 語氣標籤（模板選擇用） | 由 **規則層**依 `palaceScore`、煞數、`忌` 是否入宮、亮度推導（見 §3） |
| **punchline** | 一句收束、好記 | `star-life-lessons.lesson` → `star-psychology.growthLesson` → `STAR_SEMANTIC.advice` 截短 → 化忌句首句 |

程式入口：`worker/src/lifebook/lifeModel/starStateNarrativeSlice.ts` → `buildStarStateNarrativeSlice(palace, scoreResult)`，回傳含 **`provenance`**（每欄寫入來源 id，便於除錯與編輯對稿）。

---

## 2. Source of Truth 清單（檔案／結構）

### 2.1 星×宮「場景版」敘事（最細、最適合 corePattern）

| 檔案 | 結構 | 亮度分版？ | 備註 |
|------|------|------------|------|
| `worker/content/starPalacesMain-zh-TW.json` | `starPalacesMain["星_宮"]` 長文；`starLogicMain["星"]` 單宮邏輯一句 | **否** | key 多為 `星_財帛`、`星_財帛宮` 等，查表時需 **多 key fallback**（與 `palaceAdapters` 一致） |
| `worker/content/starPalacesAux-zh-TW.json` | 補充星×宮、雜曜 | **否** | 與 Main 並列備援 |

### 2.2 14 主星「通用人設」與風險／建議（跨宮）

| 檔案 | 欄位 | 用途對應 |
|------|------|----------|
| `worker/src/lifebook/starSemanticDictionary.ts` | `core` `plain` `themes` `risk` `advice` | corePattern／blindSpot／underStress／punchline 的 **字典層 fallback** |
| `worker/content/starBaseCore-zh-TW.json` | starId → 一句本質 | corePattern（無宮位稿時） |
| `worker/content/starBaseShadow-zh-TW.json` | starId → 一句陰影 | blindSpot |
| `worker/content/starBaseMeaning-zh-TW.json` | 中文星名 → 一句（輔煞雜） | 非 14 主星時可併入 underStress／core 補丁 |

### 2.3 命宮專用「四態」矩陣（opening／strength／tension／mature）

| 檔案 | 說明 |
|------|------|
| `worker/src/lifebook/mingGongStarMatrix.ts` | 僅 **命宮** 主星；**非命宮**應走 `palaceAdapters.buildPalaceStarNarrative` 同一套優先序，避免重複維護 |

### 2.4 CCL3 批次：心理、壓力、人生功課、組合

| 檔案 | 結構 | 用途對應 |
|------|------|----------|
| `worker/content/ccl3/star-psychology.json` | `items[].star, egoCore, shadow, defenseMechanism, growthLesson` | blindSpot、growth、punchline |
| `worker/content/ccl3/star-stress-patterns.json` | `items[].star, innerState, outerState, patternName…` | underStress（尤其 **煞星／指定主星**） |
| `worker/content/ccl3/star-life-lessons.json` | `items[].lesson, shadowPattern` | punchline、blindSpot |
| `worker/content/ccl3/star-combinations.json` | 同宮兩星組合 | **同宮雙主星**時可升級 corePattern（由 `starCombinationEngine` 命中後併入，slice 內標 `provenance`） |

### 2.5 四化（化忌優先）

| 檔案 | 結構 | 用途對應 |
|------|------|----------|
| `worker/content/starTransformMeanings.json` | `「星_ji」` 等 → `text` | 宮內有 **化忌** 或該星 **坐忌** 時 underStress／punchline 加強 |

### 2.6 亮度（廟旺陷）— 狀態「修飾」而非另一份長稿

| 來源 | 說明 |
|------|------|
| `worker/src/lifebook/starNarrativeForPalace.ts` | `BRIGHTNESS_NARRATIVE`：廟／旺／陷 → 短語（「在此處較不穩定」等） |
| Chart：`mainStars[].brightness` | **不**單獨成庫；與 §2.1～2.2 組句時 **前綴或插入** 即可 |

**重要**：既有 JSON **大多不依亮度分 key**（見 `docs/lifebook-star-sources-inventory.md` §2.2）。若要「亮度分版」長文，屬 **新資料資產**，應擴充 content key 或新增子表，並在本文更新 SoT。

### 2.7 其他（輔助、非單星狀態表）

| 檔案 | 用途 |
|------|------|
| `worker/content/starSanfangFamilies-zh-TW.json` | 星系語境，可修飾 tone 或 core 的「家族」註腳 |
| `worker/content/ming-dual-main-stars-zh-TW.json` | **命宮雙主星**長敘；與組合表分工（命宮專用） |
| `worker/content/ccl3/patterns/palace-transform-star-matrix.json` | 宮位×四化×星：偏 **規則矩陣**，可驅動條件而非直接長句 |
| `worker/src/lifebook/starPersonalityMap.ts` | 動／智／穩等 **標籤統計**，供 tone 或節奏，不當作文案本體 |

---

## 3. 條件 → 選版規則（建議）

1. **Lead 主星**：`mainStars[0]`（無則空宮流程：corePattern 改走宮位語義＋對宮／三方敘事，見 `starNarrativeForPalace` 無主星段）。
2. **宮位場景**：`palace` 正規化後組 `星_宮` key 查 `starPalacesMain` → `starPalacesAux`。
3. **宮位強弱**：`getPalaceScore` 已產 `score`／`isEmptyPalace`；弱端 **提高** `star-stress-patterns`、`starTransformMeanings(忌)`、`risk` 權重。
4. **煞星**：`shaStars.length` 與煞名；命中 `star-stress-patterns` 的該煞列 → 併入 underStress；`sha >= 2` 傾向 **tone = 高壓敘事**。
5. **化忌**：`natalTransformsIn` 等與本宮相連之 **忌**（與 `transformationFlows`／`palaceScore` 一致）→ 取 `starTransformMeanings` 對應星之 `ji` 句。
6. **雙主星**：可呼叫既有 `matchStarCombination` 結果，將 `psychology` 或 `lifePattern` 併入 corePattern 註記。

---

## 4. 與既有文件的關係

- **星曜介紹總表**：`docs/lifebook-star-intro-sources.md`
- **程式使用盤點**：`docs/lifebook-star-sources-inventory.md`
- **宮位資料稽核**：`docs/lifebook-palace-data-and-narrative-audit.md`

本文 **聚焦「多狀態／可選版」SoT 與 S22/S23 欄位對接**；若擴充亮度分版或新 JSON，請同步更新 §2 與 `starStateNarrativeSlice` 的 `provenance` 規則。

---

## 5. 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-03-07 | 初版：盤點 SoT + 欄位對照 + `buildStarStateNarrativeSlice` 實作 |
