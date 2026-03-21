# s15 內容改版：大限宮位一覽 + 本次大限四化與飛宮

## 需求摘要

- **大限宮位**：列出「所有大限」的歲數區間（幾歲～幾歲）與對應宮位。
- **本次大限四化**：列出當前大限的四化（祿權科忌對應星名），以及**四化飛到哪一宮**（自 X 宮出、飛入 Y 宮）。

---

## 一、現有資料與演算法盤點

### 1. 大限列表（所有大限、幾歲到幾歲、對應宮位）

| 項目 | 來源 | 說明 |
|------|------|------|
| **decadalLimits** | `chartJson.decadalLimits` | 陣列，每筆含 `palace`、`startAge`、`endAge`、`stem?`、`mutagenStars?`。前端／排盤產出，Worker 不重算。 |
| **decadalLimitsList** | 已實作（`lifeBookPrompts.ts` getPlaceholderMapFromContext） | 每步一行：`大限N：{宮位} {startAge}～{endAge}歲` ＋ 天干 ＋ 四化星名。可直接用於 s15 或再格式化。 |

**結論**：**已有完整支援**。只要 `chartJson.decadalLimits` 有 12 步且每步含 `startAge`、`endAge`、`palace`，即可產出「所有大限、幾歲到幾歲、對應宮位」。

---

### 2. 本次大限的四化（祿權科忌對應星名）

| 項目 | 來源 | 說明 |
|------|------|------|
| **mutagenStars** | `decadalLimits[當前].mutagenStars` 或 `fourTransformations.decadal.mutagenStars` | 祿／權／科／忌 → 星名（如「廉貞化祿」）。當前大限依 `nominalAge` 落在哪個區間決定。 |
| **currentDecadeSihuaLine** / **decadalMainLineEnergy** | 已實作 | 字串如「廉貞化祿、破軍化權、武曲化科、太陽化忌」，供顯示與敘事。 |

**結論**：**已有完整支援**。

---

### 3. 本次大限「四化飛到哪一宮」（自 X 宮出、飛入 Y 宮）

| 項目 | 來源 | 說明 |
|------|------|------|
| **大限層飛星邊** | `overlapAnalysis.items[].transformations`，且 `layerLabel === "大限"` | 每筆需含 `fromPalaceName`/`fromPalaceKey`、`toPalaceName`/`toPalaceKey`、`starName`、`type`（祿/權/科/忌）。 |
| **getTransformsByLayer(chartJson).decade** | `normalizeTransforms.ts` | 從 overlap 拆出大限層 `TransformEdge[]`（fromPalace, toPalace, starName, transform）。 |
| **collectAllFourTransformsForLayer(chartJson, "decadal")** | 已實作 | 彙整成全盤大限四化飛星列表（祿權科忌各一筆，含自 X 宮出、飛入 Y 宮）。 |
| **decadalFourTransformBlocks** / **decadalFourTransformExplanations** | 已實作（同上區段） | `buildFourTransformBlocksForPalace(decadalLines)` 產出技術版條列（`大限：X化Y，自A宮出，飛入B宮`）與解釋段。 |

**結論**：演算法與 placeholder **已支援**；**前提是 chart 帶有 overlap 且內含大限層的飛宮**（from/to 宮位）。若 overlap 未提供大限層或未含飛宮，則只會有「四化星名」、不會有「飛到哪一宮」。

---

## 二、資料依賴整理

| 區塊 | 依賴 | 無資料時行為 |
|------|------|--------------|
| 大限宮位一覽 | `chartJson.decadalLimits`（每步 palace, startAge, endAge） | 列表為空或僅一筆時，可顯示「（無大限資料）」或 fallback 文案。 |
| 本次大限四化星名 | `decadalLimits[當前].mutagenStars` 或 `fourTransformations.decadal` | 可顯示「（無大限四化資料）」。 |
| 本次大限四化飛宮 | `overlapAnalysis.items[].transformations`（layerLabel=大限，且含 from/to 宮） | 可僅顯示四化星名，不顯示飛宮；或顯示「（本大限無四化飛宮資料）」。 |

---

## 三、建議做法

### 方案 A：單章節 s15，兩段式內容（推薦）

s15 維持一章，內容分兩段，用既有 placeholder 組裝：

1. **【大限宮位一覽】**  
   - 使用 **decadalLimitsList**（或由同一資料產出更口語的一覽表）。  
   - 文案範例：列出所有大限的「第 N 大限：XX宮，幾歲～幾歲」。

2. **【本次大限的四化】**  
   - 先寫當前大限的**四化星名**（**currentDecadeSihuaLine** / **decadalMainLineEnergy** 既有內容）。  
   - 若有**四化飛宮**，再接 **decadalFourTransformBlocks**（或 **decadalFourTransformExplanations**）呈現「飛到哪一宮」。  
   - 若無飛宮資料，則只顯示四化星名，不顯示飛宮段落，或加一句「（本大限無飛宮資料）」即可。

**優點**：不動章節結構、不新增 API，只改 s15 的 `structure_analysis` 模板與必要時少許組裝邏輯。  
**實作**：在 `lifebookSection-zh-TW.json` 的 s15 中，將 `structure_analysis` 改為使用上述 placeholder（例如 `{decadalLimitsList}`、`{currentDecadeSihuaLine}`、`{decadalFourTransformBlocks}` 等），並在 inject 時確保 time module 路徑有寫入這些 key（已有則略過）。

---

### 方案 B：拆成兩章（僅在希望「大限一覽」獨立成章時）

- **s15a 或新章**：僅「大限宮位一覽」（所有大限、幾歲到幾歲、對應宮位）。  
- **s15**：僅「本次大限的四化」（含四化星名 + 四化飛到哪一宮）。

**優點**：讀者可以單獨查大限一覽、或單獨查當前大限四化。  
**缺點**：章節與 SECTION_ORDER 需調整，前端導覽與錨點也要配合。

---

### 方案 C：大限一覽與四化飛宮分開區塊、同一章（折衷）

同方案 A，但模板內明確分三塊：

1. **【大限宮位一覽】**：`decadalLimitsList`  
2. **【本次大限的四化星】**：`currentDecadeSihuaLine`（或既有 decadal 相關一句話）  
3. **【本次大限四化飛宮】**：`decadalFourTransformBlocks`；若為空則不渲染或顯示「（本大限無四化飛宮資料）」。

同一章內結構清楚，且不增加章節數。

---

## 四、建議採用的實作步驟（方案 A / C）

1. **模板**  
   - 在 `worker/content/lifebookSection-zh-TW.json` 的 s15 中，將 `structure_analysis` 改為兩段（或三段）結構，使用：
     - `decadalLimitsList`（大限一覽）
     - `currentDecadeSihuaLine` 或既有 decadal 能量文案（本次大限四化星）
     - `decadalFourTransformBlocks` 或 `decadalFourTransformExplanations`（四化飛到哪一宮）

2. **Placeholder 檢查**  
   - 確認 time module 注入路徑（`getPlaceholderMapFromContext` 與 `injectTimeModuleDataIntoSection`）在 s15 時會寫入：
     - `decadalLimitsList`
     - `decadalFourTransformBlocks`、`decadalFourTransformExplanations`  
   - 目前已在 TIME_MODULE_SECTION_KEYS 區段寫入，若 s15 在該區段內則無需再改。

3. **無資料時的 fallback**  
   - `decadalLimitsList` 為空：顯示「（暫無大限宮位資料）」或省略該段。  
   - `decadalFourTransformBlocks` 為空：僅顯示四化星名，或加「（本大限無四化飛宮資料）」。

4. **（可選）口語化大限一覽**  
   - 若希望「第 1 大限：命宮，0～9 歲」這種更口語的一覽，可新增一個專用 placeholder（例如 `decadalLimitsTable`），由 `decadalLimits` 迴圈產出，再在模板中只引用該 key。

---

## 五、小結

- **大限宮位（所有大限、幾歲到幾歲、對應宮位）**：資料與 placeholder（**decadalLimitsList**）已具備，可直接用於 s15。  
- **本次大限四化（星名 + 飛到哪一宮）**：星名已有；飛宮依賴 **overlap 大限層**，演算法與 **decadalFourTransformBlocks** / **decadalFourTransformExplanations** 已支援，僅需在 s15 模板中引用並處理無資料情況。  
- **建議**：採方案 A 或 C，單章兩段（或三段），不拆章；若日後要將「大限一覽」獨立成章再考慮方案 B。
