# S18 Phase 1：疊宮分析 Signals 層

## 目標

基於 `buildPalaceOverlay(chartJson, { currentAge?, flowYear? })` 的輸出，新增 `buildEventSignals(overlay: PalaceOverlayEntry[])`，產出 S18 第一版事件分析 signals，供下一步文案層使用。

## 資料來源與原則

- **唯一資料來源**：`buildPalaceOverlay(...)` 的輸出。
- S18 不重算四化、不重算大限/流年命宮、不改動 S17、不回寫 overlay、不混入 s15/s16 placeholder。

## 實作位置

- **型別與主邏輯**：`worker/src/lifebook/s18/eventSignals.ts`
- **測試**：`worker/tests/s18EventSignals.test.ts`

## 型別

- `EventCategory`: `"wealth" | "career" | "relationship" | "mobility"`
- `EventSignal`: category, score, intensity, isConflicting, reasons, palacesInvolved, incomingFlows, outgoingFlows
- `EventSignals`: wealth, career, relationship, mobility, keyPalaces { strongestOpportunity, strongestPressure }

## 層級權重

- 大限飛星：1.0  
- 流年飛星：1.5  

## Debug 輸出

執行 `npm test -- s18EventSignals.test.ts` 會呼叫 `debugEventSignals(signals)`，印出四類的 score、intensity、isConflicting、reasons、palacesInvolved 以及 keyPalaces。

---

## 完整範例（fixture chart：1972 年生，54 歲，流年 2026，大限僕役宮甲干，流年疾厄宮丙干）

### Debug 輸出（節錄）

```
[S18] wealth: score=3.5 intensity=4.5 isConflicting=true
[S18] wealth reasons: [ '流年祿入財帛宮', '大限忌入官祿宮' ]
[S18] wealth palacesInvolved: [ '財帛宮', '官祿宮', '僕役宮' ]

[S18] career: score=-5 intensity=5 isConflicting=true
[S18] career reasons: [ '大限忌入官祿宮', '大限忌由僕役宮飛入官祿宮' ]
[S18] career palacesInvolved: [ '官祿宮', '僕役宮' ]

[S18] relationship: score=3 intensity=2.5 isConflicting=false
[S18] relationship reasons: [ '流年科入夫妻宮' ]
[S18] relationship palacesInvolved: [ '夫妻宮', '僕役宮' ]

[S18] mobility: score=0 intensity=1 isConflicting=false
[S18] mobility reasons: []
[S18] mobility palacesInvolved: [ '官祿宮' ]

[S18] keyPalaces.strongestOpportunity: [ '財帛宮', '夫妻宮' ]
[S18] keyPalaces.strongestPressure: [ '官祿宮', '僕役宮' ]
```

### 結構確認

- 未重新引入 overlap 舊資料；輸入僅為 `buildPalaceOverlay` 的 12 宮 overlay。
- S17 未改動；S18 目前只做到 signals 層，尚未做長文 narrative。
