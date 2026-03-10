# 命書系統：Source of Truth 與 Fallback 順序

開發時請依下列順序與來源取用／補齊內容，避免段落缺失或重複維護兩套資料。詳見 `lifebook-star-sources-inventory.md`。

---

## 1. 主星一句核心

| 項目 | Source of truth | Fallback 順序 |
|------|-----------------|----------------|
| **全盤／pattern 引用** | `worker/src/lifebook/starSemanticDictionary.ts` — `STAR_SEMANTIC_DICTIONARY`、`getStarSemanticPhrases(starName)` | 無命中則不輸出該句，或使用句庫通用句。 |
| **命宮四段內的「主星人格」** | `worker/src/lifebook/mingGongStarMatrix.ts` — `MING_GONG_STAR_MATRIX`、`getMingGongStarInsight(starName)` | (1) 矩陣 (2) `getStarSemantic(starName).core`／plain (3) `starBaseCore` 一句。 |

**約定**：命宮專用矩陣為命宮的擴充，不取代語義字典；若未來要統一「一句核心」，可讓矩陣缺星時 fallback 到 `getStarSemantic(starName)`。

---

## 2. 星在宮長文（此宮表現）

| 項目 | Source of truth | Fallback 順序 |
|------|-----------------|----------------|
| **baseMeaning（星曜通用一句）** | `worker/content/starBaseCore-zh-TW.json`（camelCase 星 id） | `content.stars[星名]`（content-zh-TW 的 stars）。 |
| **meaningInPalace（此宮表現）** | `starPalacesMain` → `starPalaces` → `starPalacesAux`（key：`星名_宮名` 或 `星名_宮短名`） | 無則該星不輸出「此宮表現」段落，僅輸出星名＋亮度＋baseMeaning（若有）。 |
| **actionAdvice** | `content.starPalacesAuxAction?.[starPalaceKey]` | 無則不輸出【行動建議】。 |

**組裝**：`buildPalaceContext()` 從 chart 取宮內星 id，對每顆星查 meaningInPalace、baseMeaning、actionAdvice，產出 `ctx.stars[]`；`palaceStarsOnlySnippet` 由此組出。

---

## 3. 命宮四段（上場／優勢／失衡／成熟）

| 項目 | Source of truth | Fallback 順序 |
|------|----------------|----------------|
| **opening / strength / tension / mature** | `worker/src/lifebook/mingGongStarMatrix.ts` — `MING_GONG_STAR_MATRIX`、`getMingGongStarInsight(starName)` | (1) 矩陣 (2) 語義字典＋句庫 (3) 無主星時：`buildPalaceStarNarrative` 用 leadStar = palaceStars[0]，或句庫保底（opening／tension／mature）。 |
| **輔煞整合** | `worker/src/lifebook/mingGongSentenceLibrary.ts` — `getMingGongAssistantNarrative`、句庫 | 無則「此宮由主星與四化主導，輔煞影響較小。」 |

**約定**：命宮專用四段以 mingGongStarMatrix 為 source of truth；其他宮若未來做同構矩陣，建議宮位專用檔案或共用矩陣加宮位維度。

---

## 4. 四化判讀

### 4.1 命宮四化敘事（s02 四化如何觸發）

| 順序 | 來源 | 說明 |
|------|------|------|
| (1) | `worker/src/lifebook/mingGongTransformMatrix.ts` — `getMingGongTransformMeaning(starName, typeKey)` | 命宮專用星×祿權科忌。 |
| (2) | `worker/src/lifebook/starPalaceTransformMatrix.ts` — `findStarPalaceTransformMeaning(starName, "命宮", type)` | 全宮位矩陣，命宮補漏。 |
| (3) | 通用 fallback | `buildMingGongTransformNarrative` 內：`MING_GONG_TRANSFORM_FALLBACK`（「命宮的四化會透過本命、大限、流年層級牽動此宮…」）。 |
| (3') | 宮位通用 sihuaNarrativeBlock | 在 `getPlaceholderMapFromContext` 中，若命宮且 `palaceTransformNarrative` 仍空，以 `sihuaNarrativeBlock` 或固定句補齊。 |

**實作**：`mingGongAdapters.buildMingGongTransformNarrative`；命宮區塊在 `lifeBookPrompts` 中再補一層「命宮且為空 → sihuaNarrativeBlock」。

### 4.2 其餘 11 宮四化敘事

| 順序 | 來源 | 說明 |
|------|------|------|
| (1) | `findStarPalaceTransformMeaning(starName, palaceKey, type)` | 星×宮×四化。 |
| (2) | 宮位通用 sihuaNarrativeBlock | 「此宮雖未被本命四化直接點亮…」等。 |

### 4.3 R11 飛宮導線（因果矩陣）

| 順序 | 來源 | 說明 |
|------|------|------|
| (1) | `worker/data/palace_causality_matrix.zh-TW.json` — `lookupCausality(matrix, from, to, transform)` | consultation + advice。 |
| (2) | 固定 fallback | `worker/src/engine/generateNarrative.ts` — `R11_CAUSALITY_FALLBACK(from, to)`：「{from} 的壓力／資源會在 {to} 顯化，可留意兩宮之間的連動。」 |

**約定**：R11 主文不可空白；因果矩陣未命中時一律輸出 fallback，不省略段落。

---

## 5. 此宮提醒（12 宮風險與建議）

| 項目 | Source of truth | 輸出條件 |
|------|-----------------|----------|
| **palaceRiskSummary** | `worker/content/palaceRiskCorpus-zh-TW.json` — `palaceRiskSummary[riskLevel_1..5]` | 由 `aggregatePalaceWeightRisk` 得 riskLevel，再查表。 |
| **palaceActionAdvice** | 同上 — `palaceActionAdvice[riskLevel_1..5]` | 同上。 |
| **【此宮提醒】區塊** | 模板 placeholder `{palaceRiskReminderBlock}` | 僅當 summary 與 advice 皆非空時組出「【此宮提醒】\n\n{summary}\n\n{advice}」；兩者皆空則整塊不輸出（placeholder 為空字串）。 |

---

## 附：關鍵檔案與常數

| 用途 | 路徑／常數 |
|------|------------|
| 主星一句核心 | `starSemanticDictionary.ts`；`mingGongStarMatrix.ts` |
| 星在宮長文 | `starBaseCore-zh-TW.json`；`starPalacesMain` / `starPalacesAux` |
| 命宮四段 | `mingGongStarMatrix.ts`；`mingGongSentenceLibrary.ts`；`mingGongAdapters.ts` |
| 命宮四化 | `mingGongTransformMatrix.ts`；`starPalaceTransformMatrix.ts`；`MING_GONG_TRANSFORM_FALLBACK`（mingGongAdapters） |
| R11 因果 fallback | `R11_CAUSALITY_FALLBACK`（engine/generateNarrative.ts） |
| 此宮提醒 | `palaceRiskCorpus-zh-TW.json`；`palaceRiskReminderBlock`（lifeBookPrompts） |
