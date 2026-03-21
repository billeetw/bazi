# Phase 5B-3：技術版實際跑出之 buildSihuaFlowSummary debug log

已用 `npx vitest run tests/debug-sihua-flow-summary.test.ts` 跑出 **財帛宮 (s05)**、**疾厄宮 (s06)** 兩段技術版，並擷取 `[buildSihuaFlowSummary]` 的 console 輸出。

---

## 一、財帛宮 (s05) 相關 log（節錄）

前 11 次呼叫（來自 **buildSiHuaContext** 的 12 宮迴圈，使用 `createEmptyFindings()`）：

| currentPalace | findingsExists | sihuaPlacementItems.length | targets | matchedItemsLengthRaw | matchedItemsLengthNormalized | palaceCanon |
|---------------|----------------|----------------------------|---------|------------------------|------------------------------|-------------|
| 命宮 | true | 0 | [] | 0 | 0 | 命宮 |
| 兄弟 | true | 0 | [] | 0 | 0 | 兄弟宮 |
| 夫妻 | true | 0 | [] | 0 | 0 | 夫妻宮 |
| 子女 | true | 0 | [] | 0 | 0 | 子女宮 |
| **財帛** | true | 0 | [] | 0 | 0 | **財帛宮** |
| 疾厄 | true | 0 | [] | 0 | 0 | 疾厄宮 |
| 遷移 | true | 0 | [] | 0 | 0 | 遷移宮 |
| 僕役 | true | 0 | [] | 0 | 0 | 僕役宮 |
| 官祿 | true | 0 | [] | 0 | 0 | 官祿宮 |
| 田宅 | true | 0 | [] | 0 | 0 | 田宅宮 |
| 福德 | true | 0 | [] | 0 | 0 | 福德宮 |
| 父母 | true | 0 | [] | 0 | 0 | 父母宮 |

最後一筆（來自 **getPlaceholderMapFromContext** 的 `map.sihuaFlowSummary`，使用傳入的 findings）：

| currentPalace | findingsExists | sihuaPlacementItems.length | targets | matchedItemsLengthRaw | matchedItemsLengthNormalized | palaceCanon |
|---------------|----------------|----------------------------|---------|------------------------|------------------------------|-------------|
| 父母宮 | true | 4 | ['福德宮', '田宅宮', '落宮待核宮', '僕役宮'] | 0 | 0 | 父母宮 |

同一次 run 裡，**sihuaPlacementItems from chart** 為：

- **length:** 4  
- **targets:** `['福德宮', '田宅宮', '落宮待核宮', '僕役宮']`

---

## 二、疾厄宮 (s06) 相關 log（節錄）

結構相同：前 12 次為 buildSiHuaContext 的 12 宮迴圈（findings 為空），最後一筆為 map 填寫時的一次呼叫。

最後一筆（有傳 findings 的那次）：

| currentPalace | findingsExists | sihuaPlacementItems.length | targets | matchedItemsLengthRaw | matchedItemsLengthNormalized | palaceCanon |
|---------------|----------------|----------------------------|---------|------------------------|------------------------------|-------------|
| 兄弟宮 | true | 4 | ['福德宮', '田宅宮', '落宮待核宮', '僕役宮'] | 0 | 0 | 兄弟宮 |

---

## 三、回報欄位整理（你要的那幾項）

- **findings 是否存在**：是，所有 log 的 `findingsExists` 皆為 `true`。
- **sihuaPlacementItems 是否有值**：  
  - 在 **buildSiHuaContext** 的 12 次呼叫裡：**沒有值**（length 0），因為用的是 `createEmptyFindings()`。  
  - 在 **map.sihuaFlowSummary** 那一次：**有值**，length 4，且與 `getSihuaPlacementItemsFromChart(chart)` 一致。
- **targetPalace 內容**：有值時為 `['福德宮', '田宅宮', '落宮待核宮', '僕役宮']`。  
  - 有一筆為 **targetPalace 格式異常**：`'落宮待核宮'`（應為「落宮待核」或排除不寫入）。
- **是「沒傳 findings」還是「宮名比對失敗」**：  
  - **技術版單宮 (s05/s06) 的「有傳 findings」那一次**：findings 有傳、sihuaPlacementItems 也有 4 筆，但 **currentPalace 與 targets 沒有交集**（財帛宮／疾厄宮 不在 `['福德宮','田宅宮','落宮待核宮','僕役宮']` 裡），所以是 **宮名比對失敗**（沒有命中該宮的項目），不是「沒傳 findings」。  
  - 另外，**buildSiHuaContext** 裡那 12 次是用 **空 findings**（沒傳真正 findings），所以那 12 次是 **沒傳 findings**（用 fallback 空 findings），導致所有宮位在該迴圈都輸出空白句。

---

## 四、結論與最小修正建議

1. **sihuaPlacementItems 不是「根本是空的」**  
   在技術版路徑、有傳 findings 的那次呼叫裡，`sihuaPlacementItems.length === 4`，且與 `getSihuaPlacementItemsFromChart(chart)` 一致。

2. **宮名比對**  
   - 本次測試 chart 的四化落宮只在 **福德宮、田宅宮、僕役宮**（以及一筆異常的「落宮待核宮」），所以 **財帛宮、疾厄宮** 本來就不會有命中，**matchedItemsLengthRaw / matchedItemsLengthNormalized 為 0 是預期**。  
   - 若正式環境的 chart 有財帛、疾厄的四化落宮，targets 會包含「財帛宮」「疾厄宮」，屆時比對就會有命中。

3. **targetPalace 格式異常**  
   - 出現一筆 `'落宮待核宮'`，應在 **getSihuaPlacementItemsFromChart**（或上游）過濾掉「落宮待核」或不要加上「宮」後綴，避免寫入 `targetPalace === '落宮待核宮'`。

4. **為何「所有宮位」都看到空白句**  
   - **buildSiHuaContext** 在 `opts?.chartJson` 時會用 **createEmptyFindings()** 對 12 宮各呼叫一次 **buildSihuaFlowSummary**，這 12 次一律 length 0，所以每宮在 **perPalaceFlow** 都會得到「（本宮目前無特殊四化能量引動，宜平穩發揮星曜本質。）」。  
   - 技術版單宮實際顯示的【動態引動與根因】來自 **map.sihuaFlowSummary** / **map.palaceSihuaSummaryBlock**，用的是 **有傳 findings** 的那一次；若該宮在 `sihuaPlacementItems` 裡沒有對應的 targetPalace，一樣會是空白句。  
   - **最小修正**：  
     - 若希望 **buildSiHuaContext** 的 perPalaceFlow 不要全部空白，應改為傳入 **opts?.findings**（或從 chart 組出的同一份 findings）給該迴圈使用，而不是 **createEmptyFindings()**。  
     - 另可一併修正「落宮待核」不要產出 `targetPalace: '落宮待核宮'`，並在 getSihuaPlacementItemsFromChart 過濾掉該類項目。

以上為實際跑出 2 個 palace section（財帛宮、疾厄宮）的 debug log 與回報欄位整理。
