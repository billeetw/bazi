# S17：疊宮分析章節

## 定位

- S17 為**獨立章節**，專門顯示「本命盤 ＋ 大限四化飛星 ＋ 流年四化飛星」三層疊宮後的**每宮 overlay**。
- 不屬於大限章（s15）、不屬於流年章（s16）；不讀舊 overlapAnalysis、不接任何已刪除的 fallback。
- 第一版僅做**結構化疊宮展示**，不做事件推理、tag（shock/mine/wealth）、感受／建議、本命宮干飛化。

## 唯一資料來源

- `buildPalaceOverlay(chartJson, { currentAge?, flowYear? })`  
  S17 只接受此資料，不重算四化、不重算流年／大限命宮。

## 顯示內容

- 按 **12 宮** 逐宮展示，每宮 5 個欄位：
  1. **本命星曜**：`overlayItem.natalStars` → 「本命星曜：太陽、天梁」或「本命星曜：無」
  2. **大限飛入**：`overlayItem.decadalIncoming`（toPalace === 當前宮）
  3. **大限飛出**：`overlayItem.decadalOutgoing`（fromPalace === 當前宮）
  4. **流年飛入**：`overlayItem.yearlyIncoming`（toPalace === 當前宮）
  5. **流年飛出**：`overlayItem.yearlyOutgoing`（fromPalace === 當前宮）

## 飛星顯示格式

- 每一條飛星**完整**顯示：星名、四化、fromPalace、toPalace。  
  格式：`星名化X，自 fromPalace 飛入 toPalace`  
  例：`太陽化忌，自僕役宮飛入官祿宮`、`廉貞化祿，自僕役宮飛入兄弟宮`  
- 不縮寫為「飛往兄弟宮」或「廉貞化祿 → 兄弟宮」。

## 無資料時

- 本命星曜空 → 「本命星曜：無」
- 飛入／飛出空 → 「- 無」
- 欄位固定，不省略。

## 實作摘要

- **Formatters**（`worker/src/lifebook/palaceOverlay.ts`）  
  - `formatOverlayFlow(flow)` → 單條飛星字串  
  - `formatPalaceOverlayBlock(item)` → 單宮 5 欄位區塊  
  - `buildPalaceOverlayBlocks(overlay)` → 【疊宮分析】+ 12 宮
- **模板**（`worker/content/lifebookSection-zh-TW.json`）  
  - s17.structure_analysis = `{palaceOverlayBlocks}`
- **接線**（`worker/src/lifeBookPrompts.ts`）  
  - 當 `sectionKey === "s17"` 時呼叫 `buildPalaceOverlay(opts.chartJson, { currentAge, flowYear })`，再 `buildPalaceOverlayBlocks(overlay)` 寫入 `map.palaceOverlayBlocks`。不讀 overlap、不依賴 s15/s16 placeholders。

---

## S17 實際輸出範例（節錄 3 宮）

```
【命宮】
本命星曜：紫微、天梁
大限飛入：
- 無
大限飛出：
- 無
流年飛入：
- 無
流年飛出：
- 無

【兄弟宮】
本命星曜：廉貞
大限飛入：
- 廉貞化祿，自僕役宮飛入兄弟宮
大限飛出：
- 無
流年飛入：
- 廉貞化忌，自疾厄宮飛入兄弟宮
流年飛出：
- 無

【僕役宮】
本命星曜：武曲
大限飛入：
- 武曲化科，自僕役宮飛入僕役宮
大限飛出：
- 廉貞化祿，自僕役宮飛入兄弟宮
- 破軍化權，自僕役宮飛入子女宮
- 武曲化科，自僕役宮飛入僕役宮
- 太陽化忌，自僕役宮飛入官祿宮
流年飛入：
- 無
流年飛出：
- 無
```

---

## Debug 對照（3 宮原始 overlay）

**命宮**

- palace: "命宮"
- natalStars: ["紫微", "天梁"]
- decadalIncoming: []
- decadalOutgoing: []
- yearlyIncoming: []
- yearlyOutgoing: []

**兄弟宮**

- palace: "兄弟宮"
- natalStars: ["廉貞"]
- decadalIncoming: [{ star: "廉貞", transform: "祿", fromPalace: "僕役宮", toPalace: "兄弟宮" }]
- decadalOutgoing: []
- yearlyIncoming: [{ star: "廉貞", transform: "忌", fromPalace: "疾厄宮", toPalace: "兄弟宮" }]
- yearlyOutgoing: []

**僕役宮**

- palace: "僕役宮"
- natalStars: ["武曲"]
- decadalIncoming: [{ star: "武曲", transform: "科", fromPalace: "僕役宮", toPalace: "僕役宮" }]
- decadalOutgoing: [
  { star: "廉貞", transform: "祿", fromPalace: "僕役宮", toPalace: "兄弟宮" },
  { star: "破軍", transform: "權", fromPalace: "僕役宮", toPalace: "子女宮" },
  { star: "武曲", transform: "科", fromPalace: "僕役宮", toPalace: "僕役宮" },
  { star: "太陽", transform: "忌", fromPalace: "僕役宮", toPalace: "官祿宮" }
]
- yearlyIncoming: []
- yearlyOutgoing: []

顯示層與資料層一一對應：每條「大限飛入／飛出」「流年飛入／飛出」皆為 overlay 的 decadalIncoming / decadalOutgoing / yearlyIncoming / yearlyOutgoing，格式為「星名化X，自 fromPalace 飛入 toPalace」。

---

## 驗收

- `npm test -- palaceOverlay.test.ts` 通過（含 S17 formatter、buildPalaceOverlayBlocks、getPlaceholderMapFromContext(s17) 的 palaceOverlayBlocks）。
- 執行 `npm test -- palaceOverlay.test.ts -t "S17 實際輸出"` 可再次印出上述 3 宮範例與原始 overlay。
