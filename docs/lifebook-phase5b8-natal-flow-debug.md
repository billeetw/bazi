# Phase 5B-8：natalFlowItems 命中驗證 Debug

## 目標

確認 12 宮【動態引動與根因】為什麼沒有吃到本命宮干飛化，並判斷最小修正點是在：
- **Findings 寫入**（natalFlowItems 沒被填）
- **宮名比對**（有資料但 filter 沒命中本宮）
- **Fallback 覆蓋**（理論上不應發生：有產出句子卻被蓋成空白）

## 實作

在 `buildSihuaFlowSummary` 內對以下宮位打 log（Phase 5B-8）：

- 子女宮
- 夫妻宮
- 父母宮
- **命宮**（此宮對讀者顯示用 `buildMingGongSihuaPlacementOnly`，但 buildSihuaFlowSummary 仍會被呼叫一次，可一併看 findings 與命中數）

### 輸出欄位

| 欄位 | 說明 |
|------|------|
| `currentPalace` | 傳入的宮名（ctx.palaceName） |
| `palaceCanon` | 正規化後宮名（toPalaceDisplayName） |
| `findings.natalFlowItems.length` | 全盤本命宮干飛化筆數 |
| `matchedNatalFlows` | 命中本宮的 flow 筆數（from 或 to = 本宮） |
| `matchedPlacements` | 命中本宮的四化落宮筆數 |
| `finalBuiltLines` | 實際產出的句子陣列 |
| `outputIsEmpty` | 是否回傳固定空白句 |
| `reasonEmpty` | 若為空白，可能原因（見下） |
| `sampleFlows` | 前 5 筆 flow 的 from / to / star / transform（方便對照宮名格式） |

### reasonEmpty 解讀

- **Findings 寫入**：`natalFlowItems` 與 `sihuaPlacementItems` 皆無資料 → 檢查 `buildP2FindingsAndContext`、chart 是否提供四化與宮干／星曜落宮。
- **宮名比對**：有資料但 `matchedNatalFlows`、`matchedPlacements` 皆 0 → 比對失敗，檢查 `sampleFlows` 的 from/to 與 `palaceCanon` 是否一致（例如 僕役宮 vs 奴僕宮）。
- **邏輯**：有命中但未產出句子 → 理論上不應出現，若有則查 builder 內條件。
- **—**：有產出句子（`finalBuiltLines.length > 0`），若畫面上仍是空白，問題在後端（placeholder 解析或未使用 resolvedStructureAnalysis）。

## 如何跑

請求任一個 12 宮 section（建議一次請求 命宮、子女宮、夫妻宮、父母宮），看 console 的 `[buildSihuaFlowSummary Phase5B-8]`。依 `reasonEmpty` 與上表即可判斷最小修正點。
