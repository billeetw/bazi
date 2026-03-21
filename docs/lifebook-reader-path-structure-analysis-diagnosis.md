# 正式命書 12 宮【動態引動與根因】路徑診斷與修復

## 一、結論（先講）

- **【動態引動與根因】** 的內容**應該**來自 **`palaceSihuaSummaryBlock`** placeholder（模板：`【動態引動與根因】\n\n{palaceSihuaSummaryBlock}`）。
- **修復前**：正式命書讀者版 12 宮的 `structure_analysis` **直接採用 AI 回傳文本**，**沒有**用 placeholderMap 解析模板，所以 **`palaceSihuaSummaryBlock` 從未被注入正文**。AI 若回傳固定句或空白，讀者就會看到每宮都是「（本宮目前無特殊四化能量引動，宜平穩發揮星曜本質。）」。
- **修復後**：讀者版 12 宮改為優先使用 **以 placeholder 解析後的 `structure_analysis`**（含 `palaceContextBlock`、`palaceStarNarrativeBlock`、**`palaceSihuaSummaryBlock`**、`palaceAdviceBlock`），只有當沒有解析結果時才退回 AI 文本 + 星曜區塊注入。

---

## 二、正式命書 12 宮 section 的組裝路徑（修復前）

### 1. 讀者版（單章 POST /api/life-book/section，或全書 generate 的 AI 回傳）

| 步驟 | 說明 |
|------|------|
| 1 | 前端請求時帶 `chart_json`，後端組好 prompt，把 **lifebookSection-zh-TW.json** 的 skeleton（含 `{palaceSihuaSummaryBlock}` 等）當「本章節骨架」送給 AI。 |
| 2 | AI 回傳 JSON，內含 `structure_analysis`、`behavior_pattern`、`blind_spots`、`strategic_advice`。 |
| 3 | 後端取 **`four.structure_analysis`**（即 AI 的 `parsed.structure_analysis`）直接當成 **`structureAnalysisOut`**。 |
| 4 | 若為 12 宮 section，會呼叫 **`getPalaceSectionReaderOverrides`**，只拿 `starBlockToAppend`、`behavior_pattern`、`blind_spots`、`strategic_advice`。**沒有**拿「以 placeholder 解析後的 structure_analysis」。 |
| 5 | 僅對 **【星曜結構】** 做插入/覆蓋：若有 `【星曜結構】` 則用 `starBlockToAppend` 替換該段；否則把 `starBlockToAppend` 接到文末。**其餘內文（含【動態引動與根因】）完全不改**，等於 100% 是 AI 寫的。 |
| 6 | 最終輸出的 `structure_analysis` = 上述處理後的 `structureAnalysisOut`。 |

因此：

- **structure_analysis 是否直接採用 AI 回傳文本？** → **是**。整段都是 AI 的 `structure_analysis`，只對【星曜結構】那一段做替換/追加。
- **palaceSihuaSummaryBlock 是否被注入正文？** → **否**。placeholder 從未在讀者版被解析進最終正文，所以【動態引動與根因】底下永遠是 AI 寫的內容（常是同一句固定句）。

### 2. 技術版（output_mode=technical）

- 技術版走 **getSectionTechnicalBlocks** → **resolveSkeletonPlaceholders(sectionSkeleton.structure_analysis, placeholderMap)**，所以 **`palaceSihuaSummaryBlock` 有被注入**，【動態引動與根因】會是 findings 算出的內容。

---

## 三、修復內容（簡述）

1. **getPalaceSectionReaderOverrides**（lifeBookPrompts.ts）  
   - 除原本回傳的 `starBlockToAppend`、`behavior_pattern`、`blind_spots`、`strategic_advice` 外，新增 **`resolvedStructureAnalysis`**：用同一個 `placeholderMap` 對 **sectionSkeleton.structure_analysis** 做 **resolveSkeletonPlaceholders**，得到已代入 `palaceContextBlock`、`palaceStarNarrativeBlock`、**`palaceSihuaSummaryBlock`**、`palaceAdviceBlock` 的全文。

2. **讀者版單章**（index.ts，POST /api/life-book/section）  
   - 若 `overrides.resolvedStructureAnalysis` 存在且非空，則 **直接採用為 `structureAnalysisOut`**，不再以 AI 的 `structure_analysis` 為底。僅在沒有 `resolvedStructureAnalysis` 時，才維持原本「AI 文本 + 星曜區塊插入」的行為。

3. **讀者版全書 generate**（index.ts，POST /api/life-book/generate）  
   - 同上：有 `resolvedStructureAnalysis` 時優先使用，否則再 fallback 到 AI 文本 + starBlockToAppend。

修復後，正式命書 12 宮的【動態引動與根因】會與技術版一致，來自 **palaceSihuaSummaryBlock**（即 **buildSihuaFlowSummary** / **buildMingGongSihuaPlacementOnly** 的結果），有 findings 且該宮有四化/飛化時會顯示實際內容，沒有時才顯示「（本宮目前無特殊四化能量引動，宜平穩發揮星曜本質。）」。

---

## 四、小結

- **【動態引動與根因】** 段落：設計上來自 **palaceSihuaSummaryBlock** placeholder。
- 修復前讀者版：**沒有**用該 placeholder 的解析結果，整段 **structure_analysis 直接等於 AI 回傳**，所以 **palaceSihuaSummaryBlock 從未被注入**，每宮容易都顯示同一句。
- 修復後：讀者版 12 宮改為**優先採用「以 placeholder 解析後的 structure_analysis」**，因此 **palaceSihuaSummaryBlock 已注入正文**，行為與技術版一致。
