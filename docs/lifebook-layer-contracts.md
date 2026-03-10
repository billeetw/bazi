# 命術書引擎 — Layer 5/6 合約（章節與模板只讀 Findings）

## 原則

**命術書系統的核心輸入不是 chart，而是 findings。**  
Chart 只進 normalize 與 inference engine；章節、模板、輸出一律只讀 findings。

## 允許

| 角色 | 可讀 |
|------|------|
| **Section Assembler**（如 assembleS15） | findings、section metadata、template registry |
| **renderSection** | template、placeholder map（且該 map 僅由 findings + assembly context 產出） |
| **placeholderMapBuilders** | 僅從 findings、assembly context 取值 |

## 禁止

- 在**模板渲染階段**直接讀 chart
- 在**章節組裝階段**重新跑命理規則（同一件事只算一次，由 engine 寫入 findings）
- 在 **section JSON / lifebookSection** 裡綁 chart 欄位名（如 `currentDecadalPalace` 應改為 findings 產出的欄位，例如 `crossChartFindings[0].climate` 或專用 key）

## 實作檢查

- 若某章節或模板 placeholder 目前從 `getPlaceholderMapFromContext(chartJson, …)` 取得「對 chart 的推算結果」，應改為：  
  1. 由 inference engine 將該結果寫入 `LifebookFindings` 對應欄位；  
  2. Section Assembly 從 findings 組出該章的 placeholder map；  
  3. 模板只引用該 map，不引用 chart。

- P3 重構模組二（s15/s18/s19/s20/s21）時，以「只吃 findings」為驗收標準。
