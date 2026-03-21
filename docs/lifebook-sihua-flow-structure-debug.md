# 12 宮四化／飛化全 fallback 結構除錯

## 階段一：已加入的 raw data dump

在 `worker/src/lifeBookPrompts.ts` 中已於下列兩處加入 debug（僅在 `currentPalace` 為 **兄弟宮 / 夫妻宮 / 兄弟 / 夫妻** 時印 log）：

- **buildSihuaPlacementBlock** 函式最上方
- **buildSihuaFlowBlock** 函式最上方

### 印出內容

- `placement length`、`flow length`
- `Placement 第1筆`、`Flow 第1筆`（`JSON.stringify`）
- `Placement keys`、`Flow keys`（`Object.keys` 第 1 筆）

---

## 階段二：型別與 filter key 對照

### 型別定義（lifebookFindings.ts）

- **SihuaPlacementItem**：`layer`, `transform`, `starName`, **targetPalace**
- **NatalFlowItem**：**fromPalace**, **toPalace**, `starName?`, `transform`

### 目前 builder 使用的 key

- **buildSihuaPlacementBlock**：`item.targetPalace`（與型別一致）
- **buildSihuaFlowBlock**：`e.fromPalace`、`e.toPalace`（與型別一致）

### 資料寫入來源

- **sihuaPlacementItems**：`index.ts` 的 `getSihuaPlacementItemsFromChart(chartJson)`，內部落宮來自 `buildSiHuaLayers`，寫入時用 **targetPalace**（`toPalaceNameForSummary(s.palaceName ?? s.palaceKey)`）。
- **natalFlowItems**：`buildLifebookFindings` 從 `chart.natal?.flows` 映射，寫入 **fromPalace**, **toPalace**。

若 runtime 寫入的 key 與型別不同（例如用了 `palaceName` / `palace` 或 `from` / `to`），dump 的 `Placement keys` / `Flow keys` 會顯示實際 key，再依此修正 filter。

---

## 階段三：宮名正規化

目前使用 **normPalaceForMatch**（去宮字）：

- `"兄弟宮"` → `"兄弟"`
- `"夫妻宮"` → `"夫妻"`
- `"命宮"` / `"命"` → `"命宮"`（命單獨保留為命宮）

比對時用 `normPalaceForMatch(currentPalace) === normPalaceForMatch(item.targetPalace)`，故「兄弟宮」與「兄弟」會視為同一宮。

若 dump 出現 **僕役宮 / 奴僕宮 / 交友宮** 或 **官祿宮 / 事業宮**、**疾厄宮 / 健康宮** 等混用，再在回報中註明，本輪不擴充 alias 表。

---

## 如何取得 log

1. 啟動 worker：`cd worker && npm run dev`（或 deploy 後打正式環境）。
2. 對 **兄弟宮（s01）**、**夫妻宮（s07）** 發一筆 section 請求（例如 `POST /api/life-book/section` 帶 `section_key: "s01"` 或 `"s07"` 與有效 `chart_json`）。
3. 在 terminal 搜尋 `[結構檢查 - 兄弟宮]`、`[結構檢查 - 夫妻宮]`，即可看到上述欄位。

---

## 回報時請貼出

1. 兄弟宮的 **Placement 第1筆** JSON  
2. 兄弟宮的 **Flow 第1筆** JSON  
3. 夫妻宮的 **Placement 第1筆** JSON  
4. 夫妻宮的 **Flow 第1筆** JSON  
5. **Placement keys**  
6. **Flow keys**  
7. 依實際 key 決定：**buildSihuaPlacementBlock** 應使用哪個 key  
8. 依實際 key 決定：**buildSihuaFlowBlock** 應使用哪個 key  

若 length 為 0，則第 1 筆為 null、keys 為 []，代表問題在 **findings 未填資料**（上游 chart / 寫入邏輯），而非 filter key 寫錯。

---

## 實際 dump 結果（vitest 測試用 chart）

執行 `npm run test -- tests/sihua-structure-debug.test.ts` 後得到：

### 兄弟宮

- **Placement length**: 0（此 chart 無 `buildSiHuaLayers` 的 benming/decadal/yearly 結構，故 `sihuaPlacementItems` 為空）
- **Flow length**: 31
- **Placement 第1筆**: null
- **Flow 第1筆**: `{"fromPalace":"命宮","toPalace":"夫妻宮","starName":"巨門","transform":"祿"}`
- **Placement keys**: []（無第一筆）
- **Flow keys**: `['fromPalace', 'toPalace', 'starName', 'transform']`

### 夫妻宮

- **Placement length**: 0  
- **Flow length**: 31  
- **Placement 第1筆**: null  
- **Flow 第1筆**: `{"fromPalace":"命宮","toPalace":"夫妻宮","starName":"巨門","transform":"祿"}`  
- **Placement keys**: []  
- **Flow keys**: `['fromPalace', 'toPalace', 'starName', 'transform']`

### 結論（階段二校對）

1. **buildSihuaPlacementBlock** 應繼續使用 **`item.targetPalace`**（與型別及寫入端一致）。目前為空是因為測試 chart 沒有四化落宮的 layer 資料，不是 key 錯誤。
2. **buildSihuaFlowBlock** 應繼續使用 **`e.fromPalace`** / **`e.toPalace`**；實際 JSON 的 key 即為 `fromPalace`、`toPalace`、`starName`、`transform`，無需修改。

因此 **12 宮全 fallback 不是因為 filter 的 key 寫錯**，而是：

- **【四化引動】**：`sihuaPlacementItems` 在實際請求中常為空（chart 未提供或未經 `buildSiHuaLayers` 產出落宮）。
- **【宮干飛化】**：若 production 仍全 fallback，需檢查 reader 路徑是否確實把 `findings`（含 `natalFlowItems`）傳入 `getPlaceholderMapFromContext`，或上游 `buildP2FindingsAndContext` 是否在該路徑有被呼叫並寫入 `natalFlowItems`。
