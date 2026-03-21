# S18 疊宮分析章節 — 實作驗收

## 一、章節定位

- S18 建立在 **buildPalaceOverlay(...)** 與 **buildEventSignals(...)** 之上。
- S18 **不**：重算四化、重算大限/流年命宮、讀取 overlapAnalysis、使用舊疊宮邏輯、污染 S17。

## 二、輸出結構（完整）

S18 章節依序包含：

1. **【疊宮事件訊號】**（標題）
2. **四大主分類**：財運、事業、感情／一對一關係、遷移／外出／外部發展  
   每類：傾向（偏順/偏壓力/中性，score=X）、能量強度、有正負拉扯（若 isConflicting）、原因（2～4 條，原文）、涉及宮位、解讀。
3. **【資產與根基】**、**【人脈與協作】**、**【心態與壓力】**（三維度，不新增 category、不重算 score）
4. **【關鍵宮位】**：機會較強、壓力較強（直接使用 signals.keyPalaces）
5. **【今年主線與功課】**：主線、功課、收尾句（固定模板）

## 三、新增函式

### 1. buildMainThemeAndLesson(signals: EventSignals)

回傳：

```ts
{
  mainTheme: { category, palace, text },
  challenge: { category, palace, sourcePalace, text },
  debug: {
    mainCategory,
    mainPalace,
    challengeCategory,
    challengePalace,
    sourcePalace
  }
}
```

- **主線**：mainCategory = score 最高；mainPalace = strongestOpportunity[0] 或 signals[mainCategory].palacesInvolved[0]。
- **功課**：challengeCategory = score 最低；challengePalace = strongestPressure[0]；sourcePalace = 該 category 中「忌入 challengePalace」的 fromPalace（若無則 null）。

### 2. signalsToNarrative(signals: EventSignals, overlay: PalaceOverlayEntry[]): string

產出完整 S18 章節字串，僅使用 signals + overlay + narrativeTemplates；reasons 原文不改寫。

## 四、buildMainThemeAndLesson debug 輸出範例

以 fixture chart（1972 年生、大限僕役宮、流年疾厄宮）為例：

```json
{
  "mainCategory": "wealth",
  "mainPalace": "財帛宮",
  "challengeCategory": "career",
  "challengePalace": "官祿宮",
  "sourcePalace": "僕役宮"
}
```

- 主線：財運 score 最高，機會較強第一宮為財帛宮。
- 功課：事業 score 最低，壓力較強第一宮為官祿宮；忌由僕役宮飛入官祿宮 → sourcePalace = 僕役宮。

## 五、S18 完整章節輸出範例（節錄）

```
【疊宮事件訊號】

【財運】
傾向：偏順（score=3.5） 能量強度：4.5 有正負拉扯
原因：
- 流年祿入財帛宮
- 大限忌入官祿宮
涉及宮位：財帛宮、官祿宮、僕役宮
解讀：財帛宮同時有祿與忌，機會與壓力同區；先小步試錯再放大。

【事業】
傾向：偏壓力（score=-5） 能量強度：5 有正負拉扯
原因：
- 大限忌入官祿宮
- 大限忌由僕役宮飛入官祿宮
涉及宮位：官祿宮、僕役宮
解讀：忌自僕役宮飛入官祿宮，根因在僕役宮、表象在官祿宮。

【感情／一對一關係】
傾向：偏順（score=3） 能量強度：2.5
原因：
- 流年科入夫妻宮
涉及宮位：夫妻宮、僕役宮
解讀：祿入夫妻宮，關係與人脈較易在夫妻宮匯聚。

【遷移／外出／外部發展】
傾向：中性（score=0） 能量強度：1
涉及宮位：官祿宮
解讀：此宮（官祿宮）在當前疊宮中顯示為焦點之一，可對照上方原因與宮位。

【資產與根基】
祿入田宅或財帛，資源集中於該宮位。

【人脈與協作】
忌自僕役、兄弟或父母宮飛入他宮，人際壓力源在該宮。

【心態與壓力】
忌入疾厄、福德或命宮，此宮宜設界線與回顧點。
部分分類有正負拉扯，宜拆責任、設門檻。

【關鍵宮位】
機會較強：財帛宮、夫妻宮
壓力較強：官祿宮、僕役宮

【今年主線與功課】
主線：今年主線落在【財運】，動能集中在【財帛宮】，代表祿入財帛宮，此宮可作為資源投入重點。
功課：壓力集中在【官祿宮】，且多由【僕役宮】牽動而來。表示忌自僕役宮飛入官祿宮，根因在僕役宮、表象在官祿宮。
這一年的關鍵，在於順著優勢推進，同時處理壓力來源，而不是單純增加投入。
```

## 六、reasons 與 palacesInvolved 對照

| category   | reasons（原文，2～4 條） | palacesInvolved |
|-----------|---------------------------|-----------------|
| wealth    | 流年祿入財帛宮；大限忌入官祿宮 | 財帛宮、官祿宮、僕役宮 |
| career    | 大限忌入官祿宮；大限忌由僕役宮飛入官祿宮 | 官祿宮、僕役宮 |
| relationship | 流年科入夫妻宮 | 夫妻宮、僕役宮 |
| mobility  | （無） | 官祿宮 |

reasons 由 collectSignalReasons 產出，未改寫；capReasons 僅做 2～4 條與 isConflicting 時正負並保留。

## 七、驗收確認

- **S17 未被修改**：僅改動 worker/src/lifebook/s18/eventSignals.ts、lifeBookPrompts（s18 區塊改為 signalsToNarrative）、tests。
- **未引入 overlap**：無讀取 overlapAnalysis、無舊疊宮邏輯。
- **未新增隨機句庫**：解讀僅用 narrativeTemplates + 宮位/from→to 填寫。
- **只使用 signals + overlay + narrativeTemplates**：signalsToNarrative(signals, overlay)、buildMainThemeAndLesson(signals)、三維度從 overlay 彙總、解讀從 narrativeTemplates 取句。

## 八、檔案與匯出

- **worker/src/lifebook/s18/eventSignals.ts**
  - buildMainThemeAndLesson(signals)
  - signalsToNarrative(signals, overlay)
  - formatEventSignalsForSection(signals)（相容用）
  - CATEGORY_LABEL、MainThemeAndLesson 型別
- **worker/src/lifeBookPrompts.ts**：s18 時以 signalsToNarrative(signals, overlay) 寫入 map.s18SignalsBlocks。
