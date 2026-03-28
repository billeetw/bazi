# 命書內容治理：誰蓋誰？

給工程／編輯／營運：**同一欄位可能同時存在「D1／靜態 JSON 模板」與「程式強制覆寫」**。改文案前請先查本表，避免「改了 JSON 卻沒上線」的錯覺。

## 1. 資料從哪裡來？

| 來源 | 說明 |
|------|------|
| **`worker/content/*.json`** | 預設內容；部署時可同步至 D1／KV。 |
| **D1／KV `lifebookSection`** | 線上覆寫；若與程式覆寫衝突，**以程式為準**（見下表）。 |
| **`lifeBookPrompts.ts` 等** | 執行期組裝、`getSectionTechnicalBlocks` 強制骨架、`injectTimeModuleDataIntoSection` 代入。 |

## 2. 章節 × `structure_analysis` 行為

| section_key | 靜態／D1 骨架角色 | 技術版 `getSectionTechnicalBlocks` | `injectTimeModuleDataIntoSection`（模組二） |
|---------------|-------------------|-------------------------------------|---------------------------------------------|
| s15–s16 | 模板 + placeholder | 沿用模板解析 | 是（時間軸、四化、overlap 等） |
| s17 | 可含 `{palaceOverlayBlocks}` | **強制** `{palaceOverlayBlocks}` | 是 |
| s18 | 可含 `{s18SignalsBlocks}` | **強制** `{s18SignalsBlocks}` | 是 |
| s19 | 常被填「重做中」 | **強制** `{s19MonthlyBlocks}` | 是 |
| s20 | 建議含 s20* placeholder | **強制** 三盤四段模板 | 是 |
| s22 | 建議 `{structureLinesBlock}` | **強制** `{structureLinesBlock}` | 是（P2 路徑亦補區塊） |
| s23 | 建議 `{transformationFlowsBlock}` | **強制** `{transformationFlowsBlock}` | 是 |
| s21 | 建議收束 placeholder | **強制** 收束模板 | 是 |
| s00–s14 等宮位題 | 模板為主 | 讀模板 + 星曜技術區 | 否（非 timeModuleKeys） |

**結論**：s17–s21（含 s22、s23）在**技術版**幾乎不依賴 D1 那句「本章重做中」；**讀者版／AI 版**若仍吃舊 D1 字串，需更新線上內容或重生成章節。

## 3. S22／S23 引擎單一入口

結構線／轉化流文字由 **`worker/src/lifebook/timeModule/s22s23LifeModelPlaceholders.ts`** 的 `mergeS22S23BlocksIntoMap` 寫入 `structureLinesBlock`、`transformationFlowsBlock`，供：

- `getPlaceholderMapFromContext`（技術版／讀者 placeholder）
- `injectTimeModuleDataIntoSection`（P2 findings 路徑）

命盤來源：`normalizeChart(chartJson)`，**Sprint 1 不讀大限／流年**（見 `docs/lifebook-s22-s23-spec.md`）。

## 4. 章節順序

唯一來源：**`worker/data/lifebook-section-order.json`**。流程見 **`docs/lifebook-section-order.md`**。

## 5. 建議流程（編輯改文案）

1. 確認欄位是否被 **程式覆寫**（上表）。  
2. 若覆寫：改 **`structureLines.ts`／`transformationFlows.ts`／`formatTechnicalBlocks.ts`** 或對應 assembler，而非只改 JSON。  
3. 改 JSON 順序：改 **`lifebook-section-order.json`** → `npm run sync:section-order`。  
4. 跑 **`npm run verify:lifebook`**（專案根目錄）。
