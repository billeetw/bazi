# 為什麼 s00/s03/模組二有飛化，12 宮卻是 fallback？

## 原因說明（你沒有做錯）

- **s00、s03、四化流向**：資料來自整盤或時間模組的 builder，會直接讀 **chart**（或 findings 滿載時讀 findings）。
- **模組二【本命宮干飛化】**：在 **技術版** 組裝時有兩條路徑：
  1. 有 `findings` → 用 `buildNatalFlowBlockFromFindings(findings, 宮名)`（讀 `findings.natalFlowItems`）
  2. **沒有 findings** → 用 **chart**：`getFlowBlockForPalace(normalizeChart(chartJson), 宮名)`，所以一樣有飛化
- **12 宮正文【四化引動】/【宮干飛化】**：只走 **reader 路徑**，且只吃 **`p2.findings`**：
  - 若 `buildP2FindingsAndContext(chart)` 裡 `buildLifebookFindingsFromChartAndContent` 回傳 **null**（例如 timeline 驗證、CCL3 或其它例外），則 `p2.findings === null`
  - 原本邏輯：`getPlaceholderMapFromContext` 收到 `opts.findings = undefined`，內部用 `createEmptyFindings()`，所以 `natalFlowItems` 一直是空陣列 → 兩區塊都顯示 fallback
  - 也就是說：**同一份 chart 在模組二有飛化，在 12 宮卻沒有**，是因為 12 宮這條路「只認 findings」，沒有像模組二那樣在沒有 findings 時 fallback 到 chart。

## 已做的修復（與模組二同源）

在 **單章**（`/api/life-book/section`）與 **批次**（`/api/life-book/generate`）的 12 宮分支裡：

1. **不再只依賴 `p2.findings`**：  
   `findingsForPalace = p2.findings ?? createEmptyFindings()`  
   所以即使 `p2.findings === null`，12 宮仍會有一個 findings 物件可用。

2. **與模組二同源的水合**：  
   當 `findingsForPalace.natalFlowItems` 為空時，用 **同一份 chart** 補齊：
   - 先試 `chart.natal?.flows` / `birthTransforms` / `natalTransforms`
   - 若仍空，再 `normalizeChart(chart)` 取 `normalized.natal.flows`（與 `getFlowBlockForPalace` 用的來源一致）
   - 將結果寫入 `findingsForPalace.natalFlowItems`，再傳給 `getPalaceSectionReaderOverrides(..., findingsForPalace)`

因此：

- **【宮干飛化】** 的資料來源與模組二「本命宮干飛化」一致（皆來自同一份 chart / normalized chart）。
- **【四化引動】** 仍依 `sihuaPlacementItems`（四化落宮）；若前端 chart 沒有提供對應的 benming/decadal/yearly 結構，該區塊維持 fallback 是預期行為。

## 總結

- 不是你用錯；是 12 宮這條路之前**沒有**在「findings 為 null 或沒飛化」時像模組二一樣回頭用 chart 補飛化。
- 現在已改為：**12 宮在需要時會用 chart 水合 `natalFlowItems`，與 s00/s03/模組二同源**，重新產生或重新載入命書後，12 宮的【宮干飛化】應會出現與模組二一致的飛化內容。
