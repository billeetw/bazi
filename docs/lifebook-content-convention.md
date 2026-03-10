# 命書內容與 Placeholder 規範（D1 與本地）

命書章節內容、placeholder 命名與 D1 覆寫的約定，供擴充與維護時保持一致。

---

## 一、Placeholder 命名約定

- **格式**：`{camelCase}`，僅英數字，無底線。例：`palaceName`、`s00HotStars`。
- **章節前綴**（可選）：表資料來源或章節，避免衝突。
  - `s00*`：全盤章 s00
  - `decadal*`：十年大限
  - `yearly*`：流年
  - `xiaoXian*`：小限／疊宮
- **語意後綴**：
  - `*Block`：多句或整段（可含換行）
  - `*Summary`：摘要句
  - `*List`：列舉（頓號或換行）
  - `*Table`：表格式字串
- **宮位相關**：`palace`、`*Palace`、`*Palaces`；語義用 `palaceCore`（單句）、`palaceCoreDefinition`（整段定義）。

---

## 二、章節四欄約定

命書每章對應 **四欄**，與 `lifebookSection-zh-TW.json` 及 D1 鍵一致：

| 欄位 | 用途 |
|------|------|
| `structure_analysis` | 結構分析／技術資料＋判讀＋主文 |
| `behavior_pattern` | 行為模式 |
| `blind_spots` | 盲點 |
| `strategic_advice` | 策略建議 |

- 模板內只使用 `{placeholderName}`，不混用其他語法。
- 缺值時由程式填入 `missingReplacement`（如「（此處無資料）」），或留空不輸出整段。

---

## 三、D1 與本地 Content 關係

- **本地**：`worker/content/lifebookSection-zh-TW.json` 為預設骨架；`narrativeCorpus-zh-TW.json` 為 s00 命理師語氣句庫。
- **D1**：`content-from-d1.ts` 將 DB 的 `ui_copy_texts` 轉成 `DbContent`。
  - 命書章節：`copy_key` = `lifebookSection.{sectionKey}` 時，value 為 **整章四欄 JSON**（含 `structure_analysis`、`behavior_pattern`、`blind_spots`、`strategic_advice`）。
  - 單欄覆寫：`copy_key` = `lifebookSection.{sectionKey}.{field}` 時，value 為 **該欄字串**，會與 base 合併（overlay 優先）。
- **合併規則**：`mergeLifebookSections(overlay, base)`，即 D1 有則覆寫，無則沿用 base；同一章可混用「整章 JSON」與「單欄」覆寫。

---

## 四、Placeholder 與語句庫擴充注意

- 新增 placeholder 時：在 `getPlaceholderMapFromContext`（`lifeBookPrompts.ts`）填值，並在 **章節骨架**（本地 JSON 或 D1）中使用 `{newKey}`。
- 新增語句庫（如新 tag 評語、新 Flow 句型）：在對應模組（如 `dominantPalaceDetector.ts`、`sihuaFlowEngine.ts`）擴充常數，並在 `docs/lifebook-placeholder-index.md` 的「語句庫索引」補一列。
- 若 D1 提供 **整章** 覆寫，該章模板內的 placeholder 名稱須與程式產出的 key 一致，否則會以未替換形式輸出。

---

## 五、語句庫與語義來源

- **宮位語義**：`starSemanticDictionary.ts` 的 `PALACE_SEMANTIC_DICTIONARY`（`plain`／`core`／`short`），供主戰場評語、Flow 括號、narrative 的 `palaceCore` 等使用。
- **主戰場評語**：`dominantPalaceDetector.ts` 的 `PALACE_TAG_*`，依 tag 組合選句；忌疊+科疊時僅保留一條科疊句。
- **四化慣性**：`patternHitRenderer.ts`（星×宮橋接）、`starPalaceTransformMatrix.ts`（星×宮×四化優先判讀）、`patternPhraseLibraryRuleTypes.ts`（ruleType 模板，含 `palaceCore`）。
- **四化流向／能量環**：`sihuaFlowEngine.ts` 的 `PALACE_FLOW_TEMPLATES`、`LOOP_TEMPLATE_2`／`LOOP_TEMPLATE_3PLUS`。
- **人生主題**：`archetypeModel.ts` 的 `LIFE_ARCHETYPES` 與 `formatLifeArchetypeBlock`，僅用於 s00。

以上約定與 `docs/lifebook-placeholder-index.md` 對照使用，可減少漏改與命名不一致。
