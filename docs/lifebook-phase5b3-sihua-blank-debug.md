# Phase 5B-3：12 宮四化落宮空白 Debug 報告

## 任務一：buildSihuaFlowSummary 內 debug 已加入

在 `buildSihuaFlowSummary` 內已加入 `console.log("[buildSihuaFlowSummary]", { ... })`，輸出：

- **currentPalace**：傳入的宮位名稱（例如 `"命宮"`, `"財帛宮"`）
- **findingsExists**：`findings != null`
- **findings.sihuaPlacementItems.length**：陣列長度
- **findings.sihuaPlacementItems.map(x => x.targetPalace)**：所有項目的 `targetPalace`
- **matchedItemsLengthRaw**：原始比對 `item.targetPalace === currentPalace` 的符合數
- **matchedItemsLengthNormalized**：正規化比對 `toPalaceDisplayName(item.targetPalace) === palaceCanon` 的符合數
- **palaceCanon**：`toPalaceDisplayName(currentPalace)` 的結果

請在 **技術版**（`output_mode === "technical"`）請求任一本命／12 宮 section，看 server 或 terminal 的 console 輸出，即可判斷是「沒傳 findings」「sihuaPlacementItems 為空」還是「宮名比對失敗」。

---

## 任務二：正式命書輸出路徑中，非命宮是否有傳 findings

### 技術版（output_mode === "technical"）

- **有傳 findings**。  
  - 單章：`index.ts` 約 1486 行 `const p2Technical = buildP2FindingsAndContext(chartForSection)`，接著 `getSectionTechnicalBlocks(..., p2Technical.findings ?? undefined)`，所以 **所有 section（含 12 宮）** 都會把 `p2.findings` 傳進技術版組裝。
  - 全書：約 1830、1844 行同理，`buildP2FindingsAndContext(chartForGenerate)` 後把 `p2Technical.findings` 傳給 `getSectionTechnicalBlocks`。
- **getSectionTechnicalBlocks** 再呼叫 `getPlaceholderMapFromContext(ctx, { ..., findings })`，所以 **非命宮的 palace section（s01, s05~s14）也會拿到 findings**。
- 結論：技術版路徑下，**findings 有傳**，且會進到 `buildSihuaFlowSummary`。

### 讀者版（AI 回傳 JSON）

- 讀者版 **不會** 用我們的 placeholder 解析來產生【動態引動與根因】內文。  
- `structure_analysis` 來自 **AI 回傳** 的 `parsed.structure_analysis`（即 `four.structure_analysis`），不是由 `resolveSkeletonPlaceholders` 從模板算出來的。
- 只有 **getPalaceSectionReaderOverrides** 會用 findings 建 placeholderMap，但只拿來算 `behavior_pattern` / `blind_spots` / `strategic_advice` 和 `starBlockToAppend`，**沒有** 用這個 map 去改寫整段 `structure_analysis`。
- 因此：若你看到空白的是 **讀者版**，那是 AI 沒寫出四化內容，與 findings 是否傳入無關。  
- 若你看到空白的是 **技術版**，才是底下要談的 findings / sihuaPlacementItems / 比對問題。

---

## 任務三：buildP2FindingsAndContext 是否把 sihuaPlacementItems 寫入 findings

- **有寫入**。  
  在 `index.ts` 的 `buildP2FindingsAndContext` 內（約 155 行）：

  ```ts
  result.findings.sihuaPlacementItems = getSihuaPlacementItemsFromChart(chartJson);
  ```

- 所以只要 `buildP2FindingsAndContext(chartJson)` 被呼叫且 `chartJson` 有效，**findings.sihuaPlacementItems** 一定會被賦值（可能為 `[]`）。
- **sihuaPlacementItems 的內容** 完全來自 **getSihuaPlacementItemsFromChart(chartJson)**，而該函式內部用 **buildSiHuaLayers(chartJson)** 產出各層祿權科忌，再依 `toPalaceNameForSummary(s.palaceName ?? s.palaceKey)` 得到 `targetPalace`。
- 若 **chart 沒有提供** `fourTransformations` / `sihuaLayers` 等 buildSiHuaLayers 需要的結構，**getSihuaPlacementItemsFromChart** 會回傳 **[]**，於是所有宮位在 buildSihuaFlowSummary 裡都會 0 筆符合，輸出固定句。

---

## 回報：如何解讀 debug 並判斷原因

跑一次技術版（例如 GET/POST 某宮 section，`output_mode=technical`），看 console 的 `[buildSihuaFlowSummary]`：

| 現象 | 解讀 |
|------|------|
| **findingsExists === false** | 該路徑沒傳 findings（依上面追蹤，技術版應不會發生）。 |
| **findings.sihuaPlacementItems.length === 0** | **沒傳 findings** 或 **getSihuaPlacementItemsFromChart(chartJson) 回傳 []**。多數情況是 chart 格式沒有四化資料（缺少 `fourTransformations` / `sihuaLayers` 等），或 buildSiHuaLayers 沒產出任何一筆。 |
| **targetPalace 陣列有值，但 matchedItemsLengthRaw 與 matchedItemsLengthNormalized 都是 0** | **宮名比對失敗**。例如 targetPalace 是 `"財帛宮"` 而 currentPalace 是 `"財帛"`（少「宮」），或反過來；或一端是英文 key（如 `cai`）另一端是中文。 |
| **matchedItemsLengthNormalized > 0** | 比對有過，不應再出現固定空白句；若仍出現，請再確認是否看錯區塊或另有覆寫。 |

- **findings 是否存在**：看 `findingsExists`。  
- **sihuaPlacementItems 是否有值**：看 `findings.sihuaPlacementItems.length` 與 `map(x=>x.targetPalace)`。  
- **targetPalace 內容**：看 `findings.sihuaPlacementItems.map(x => x.targetPalace)`。  
- **是「沒傳 findings」還是「宮名比對失敗」**：  
  - length 為 0 → 偏向「沒傳 findings」或「chart 沒四化資料」。  
  - length > 0 且 matched 皆 0 → 「宮名比對失敗」。

---

## 最小修正方案建議

1. **若 debug 顯示 sihuaPlacementItems.length === 0**
   - **原因**：chart 未帶四化結構，或 buildSiHuaLayers / getSihuaPlacementItemsFromChart 依的欄位名與前端/CL3 輸出一致。
   - **最小修正**：  
     - 確認正式請求的 `chart_json` 是否包含 `fourTransformations`（或 `sihuaLayers`），且結構與 `buildSiHuaLayers` 預期一致（例如 `benming.mutagenStars`、各層 `toPalace` 等）。  
     - 若 chart 來自別處（例如 CL3），在寫入 findings 前先轉成 buildSiHuaLayers 能吃的格式，或改為從已有結構（如 `sihuaLayers`）直接組出 sihuaPlacementItems，避免依賴不存在的欄位。

2. **若 debug 顯示 targetPalace 與 currentPalace 格式不一致**
   - **原因**：一邊是「財帛宮」、一邊是「財帛」，或英文 key 與中文名混用。
   - **最小修正**：在 **buildSihuaFlowSummary** 的 filter 裡，**一律用正規化比對**（已做），並確認 **getSihuaPlacementItemsFromChart** 寫入的 `targetPalace` 與 **buildPalaceContext** 的 `ctx.palaceName` 使用同一套正規化（例如都經 `toPalaceDisplayName` 或都帶「宮」）。若目前 toPalaceNameForSummary 與 toPalaceDisplayName 對同一輸入結果不同，可統一改用 toPalaceDisplayName 產 targetPalace，或兩邊都先 toPalaceDisplayName 再比。

3. **若希望讀者版也出現四化**
   - 讀者版目前 **沒有** 用 findings 去解析【動態引動與根因】的模板；若要一致，需在讀者版也做「以 findings 解析 skeleton 的 structure_analysis」或至少把 palaceSihuaSummaryBlock 插進 AI 回傳的 structure_analysis（例如在 getPalaceSectionReaderOverrides 或 index 的 palace 處理分支裡，用與技術版相同的 placeholderMap 解析含 `{palaceSihuaSummaryBlock}` 的模板後再輸出）。這屬於較大改動，可列為後續需求。

---

## 小結

- **buildSihuaFlowSummary** 已加 debug，可用 console 一次看出 currentPalace、findings 是否存在、sihuaPlacementItems 長度與 targetPalace、以及原始/正規化比對數量。
- **技術版**：findings 有傳；**buildP2FindingsAndContext** 有把 **sihuaPlacementItems** 寫入 findings。
- 空白多數來自：(1) **sihuaPlacementItems 為 []**（chart 缺四化或格式不符），或 (2) **宮名比對失敗**。依 debug 結果套用上面對應的最小修正即可。
