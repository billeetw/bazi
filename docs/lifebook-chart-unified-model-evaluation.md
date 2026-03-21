# 命盤唯一基礎資料模型與算法規格 — 評估

本文評估「命盤唯一基礎資料模型、流年命宮算法、四化來源與數量、UI/命書規則、Worker FLOW_DEBUG」等建議，並對照現有實作給出結論與可行改動。

---

## 一、命盤唯一基礎資料模型（NatalChart）

### 建議內容

- 所有算法建立在**同一份盤面資料**。
- 命盤必須先產生：
  - `palaceByBranch: Record<Branch, Palace>`（地支 → 宮位）
  - `starsByPalace: Record<Palace, Star[]>`（宮位 → 星曜）
- 此 branch→palace mapping 為**整個系統唯一權威**，後續算法一律使用它。

### 現狀

| 項目 | 現狀 | 缺口 |
|------|------|------|
| **palaceByBranch** | 未以單一結構存在。前端 `buildSlotsFromZiwei` 與 worker `computeFlowYearPalaceFromBranch(liunianBranch, mingBranch)` 各自用「命宮地支 + 寅起地支環 + offset」**公式**推導，結果一致（例：命宮亥、流年午 → 疾厄宮），但**沒有**「先建好一張表、再查表」的單一權威。 | 缺少 `NatalChart.palaceByBranch`；流年命宮等仍依公式重算。 |
| **starsByPalace** | Worker：`normalizePalaces.buildPalaces()` 從 `chartJson.ziwei.starByPalace` / `mainStars` 產出 `PalaceStructure[]`（宮位→星曜）。前端：`buildSlotsFromZiwei` 內用 `getStarsForPalace(ziwei, palaceName)`。 | 兩邊來源皆為同一份 chartJson，但型別上沒有統一的 `NatalChart` 介面。 |

### 評估結論

- **建議方向正確**：以「先產生命盤（含 branch→palace、palace→stars），再讓所有算法只讀這份資料」可降低重複公式與不一致風險。
- **可行做法**：
  1. 在 **Worker**（或共用層）定義 `NatalChart`（或擴充現有 `NormalizedChart`）：
     - 在**正規化時**由 `minggongBranch` 建出 `palaceByBranch`（寅起地支環 + 命宮旋轉，公式只用在這裡一次）。
     - `starsByPalace` 可對應現有 `palaces[]` 或從 `getStarByPalaceFromChart` 產出。
  2. **API 回傳**與**命書 / 前端**一律使用此 `palaceByBranch`（例如流年命宮 = `chart.palaceByBranch[liunian.branch]`），不再在流年路徑上重複「命宮旋轉 offset」公式。
- **注意**：`palaceByBranch` 的 key 必須與現有約定一致（例如 12 地支字串、寅起環順序），以利前端與 Worker 共用。

---

## 二、流年命宮算法（完整規格）

### 建議內容

- **輸入**：`liunian.branch`、`chart.palaceByBranch`
- **算法**：`getFlowYearPalace(branch, chart) { return chart.palaceByBranch[branch] }`
- **例**：2026 = 午 → `palaceByBranch["午"]` = 疾厄宮 → 流年命宮 = 疾厄宮。
- **絕對禁止**：`palaceOrder[branchIndex]` 或「命宮旋轉 offset」在**流年命宮**的計算路徑上使用（即不應在「算流年命宮」時再套一次公式，應改為查表）。

### 現狀

- Worker：`computeFlowYearPalaceFromBranch(yearlyBranch, mingBranch)` 用 `(mingIndex - liunianIndex + 12) % 12` 與 `PALACE_BY_OFFSET[offset]` 得到宮位，結果與「亥→命宮、午→疾厄」一致。
- 該公式實質上就是在「給定命宮地支」下建出整張 branch→palace 對應；只是目前這張表是**隱式**的（每次用公式算），沒有顯式寫成 `palaceByBranch`。

### 評估結論

- **與建議一致**：流年命宮應為「對該盤的 branch→palace 對應」的查表結果，而不是在流年邏輯裡再寫一次 offset。
- **實作建議**：
  1. 在產生命盤時，用現有「命宮地支 + 寅起環」邏輯**只算一次**，產出 `palaceByBranch`（12 地支 → 宮位名）。
  2. 流年命宮：`getFlowYearPalace(liunian.branch, chart) = chart.palaceByBranch[liunian.branch]`，**禁止**在該函式內再使用 `palaceOrder[branchIndex]` 或 offset 公式。
  3. 現有 `computeFlowYearPalaceFromBranch` 可保留為「**建表用**」的內部函式（由 mingBranch 建出整張 palaceByBranch），但對外 API 與命書只暴露「查表」結果。

---

## 三、四化星來源（唯一規格）

### 建議內容

- 四化**只由天干決定**；並給定十天干 → 祿／權／科／忌 星曜對照表。
- 各層天干來源：本命 = 出生年干、大限 = 大限干、流年 = 流年干。

### 現狀

| 位置 | 實作 | 對應建議 |
|------|------|----------|
| **前端** | `js/calc/constants.js` 內有 `SI_HUA_MAP`（十天干 → 祿權科忌星），與建議表一致（見 `SI_HUA_VERIFICATION.md`）。 | 已符合「天干 → 四化」唯一規格。 |
| **Worker** | `/compute` 等處由 iztro 的 `horoscope.decadal.mutagen`、`horoscope.yearly.mutagen` 等經 `buildMutagenStars(mutagen)` 得到 `mutagenStars`（祿/權/科/忌 → 星名）。iztro 本身為天干驅動。 | 實質為「天干→四化」；若需與前端完全同源，可改為 Worker 內建同一張天干表，由 stem 查表產出 mutagenStars，避免依賴 iztro 欄位格式。 |

### 評估結論

- **建議正確**：四化應僅由天干決定，且全系統共用同一張表。
- **可行改動**：在 Worker 內建與前端一致的「天干 → 祿權科忌」表（或共用一份 JSON），本命/大限/流年皆用「該層 stem → 表」產出四化星名；iztro 的 mutagen 可僅作校驗或 fallback，不作為唯一來源，以符合「唯一規格」。

---

## 四、四化數量與不可跨層

### 建議內容

- 每層（本命／大限／流年）**必須 4 條**（祿、權、科、忌各一）。
- **不可跨層**：natal 星不可出現在 decade flow。

### 現狀

- `normalizeTransforms` 已禁止小限層，只產出 natal / decade / year。
- 各層邊的 starName 由該層 `mutagenStars` 覆寫（`overwriteEdgeStarNames`），不會用他層星名。
- 「每層 4 條」：overlap 端若漏欄位或層級錯置，可能導致某層少於 4 條或出現「化科→（無）」。

### 評估結論

- **數量**：若採用「天干 → 四化」唯一表，每層有 stem 就應產出 4 顆星；實作上應**強制**每層 4 條（祿權科忌各一），缺則標註來源問題而非顯示「（無）」。
- **不跨層**：現有設計已區分層級；需在驗證／組裝時確保 edge 的 layer 與 starName 皆來自同層 mutagenStars，不混用。

---

## 五、UI / 命書顯示規則

### 建議內容

- 四化流向：本命、大限、流年，**每層最多 4 條**。
- **絕對不應出現**「化科→（無）」— 因為每層必有科星（天干表保證）。

### 現狀

- 命書「四化能量總結」與「分層落宮」中，若某層 `layerFromMutagen` 或 `buildSiHuaLayers` 未解析到科星（例如 starByPalace 找不到科星所在宮），會出現「科→（無）」。
- 原因常為：該層有 stem 與 mutagenStars（祿權科忌星名），但**星落何宮**是依 `starByPalace` 查詢；若資料缺漏或 key 不一致，科星落宮會漏。

### 評估結論

- **合理**：有 stem 就有 4 化，不應出現「化科→（無）」。
- **可行改動**：
  1. **落宮解析**：若依 stem 表得到科星名，但 `starByPalace` 查不到該星，應有明確 fallback（例如標「科星：X，落宮待核」或用該層命宮/大限宮作為預設落宮邏輯），避免直接顯示「（無）」。
  2. **資料端**：確保前端/API 傳入的 `starByPalace`（或等同結構）與 iztro 一致，且宮位 key 與 Worker 正規化一致，以減少「有星無宮」。
  3. **顯示層**：在命書組裝時，若某層四化缺任一條，可打 log 並在技術版輸出 FLOW_DEBUG（見下），方便排查。

---

## 六、Worker 必須輸出 FLOW_DEBUG

### 建議內容

- Worker 輸出 debug 結構，例如：
  - `FLOW_DEBUG { layer, star, star_palace, fromPalace, toPalace, transform }`
- 例：`layer: natal`, `star: 天梁`, `star_palace: 官祿`, `from: 官祿`, `to: 命宮`, `transform: 祿`。

### 現狀

- 目前有 `FLOW_YEAR_DEBUG`、`FLOW_YEAR_SIHUA_DEBUG` 等 log，但**沒有**結構化、可輸出的「每條 flow 一筆」的 FLOW_DEBUG 物件陣列。

### 評估結論

- **建議有用**：便於核對每條四化邊的層級、星、星所在宮、from/to、化類，利於驗證「唯一權威」與除錯。
- **可行做法**：
  1. 在 `buildTransformFlowLines` 或 `getFlowBlockForPalace` 路徑上，遍歷 `chart.natal.flows`、`chart.currentDecade.flows`、`chart.yearlyHoroscope.flows`，對每條 `TransformEdge` 產出一筆：
     - `layer`, `star` (starName), `star_palace` (該星所在宮，需從 palaces 或 starByPalace 解析), `fromPalace`, `toPalace`, `transform`。
  2. 將此陣列掛在 response 的 debug 欄位（例如 `debug.flowEntries`）或僅在開發/技術版命書中輸出，避免生產環境過度暴露。

---

## 七、總結與建議優先序

| 項目 | 評估 | 建議 |
|------|------|------|
| **1. NatalChart.palaceByBranch 為唯一權威** | 同意；可消除重複公式、單一真相來源。 | 在正規化階段建出 `palaceByBranch`；所有依「地支→宮位」的邏輯（含流年命宮）改為查表。 |
| **2. 流年命宮 = chart.palaceByBranch[branch]** | 同意；禁止在流年路徑再用 offset/ palaceOrder[branchIndex]。 | 流年命宮僅能由 `getFlowYearPalace(branch, chart)` 查表取得；建表邏輯保留在單一處。 |
| **3. 四化只由天干表** | 同意。 | Worker 內建與前端一致的天干→祿權科忌表；本命/大限/流年皆由 stem 查表產出。 |
| **4. 每層 4 條、不跨層** | 同意。 | 強制每層 4 條；驗證不混層；缺邊時 log + 可選 FLOW_DEBUG。 |
| **5. 絕不顯示「化科→（無）」** | 同意。 | 有 stem 必產 4 星；落宮查不到時用 fallback 或標「落宮待核」，不輸出「（無）」。 |
| **6. FLOW_DEBUG 結構化輸出** | 同意。 | 在 flow 組裝處產出 `{ layer, star, star_palace, fromPalace, toPalace, transform }[]`，掛到 debug 或技術版。 |

建議實作順序：**（1）（2）→（3）（4）（5）→（6）**，先確立「一盤一表」與流年命宮查表，再收斂四化來源與顯示，最後加上 FLOW_DEBUG 方便長期驗證。

---

## 已執行實作（本輪）

- **palaceByBranch 唯一權威**：`worker/src/palace-map.ts` 新增 `buildPalaceByBranch(mingBranch)`、`getFlowYearPalace(branch, palaceByBranch)`；`NormalizedChart` 新增 `palaceByBranch`；`normalizeChart` 建表一次，流年命宮改為查表；`index.ts` 與 `buildTimeModuleDisplayFromChartJson` 改為查表。
- **四化由天干表產出**：`worker/src/sihua-stem-table.ts` 新增十天干→祿權科忌表與 `getMutagenStarsFromStem(stem)`；`index.ts` 本命／大限／流年 mutagenStars 優先由 stem 查表，fallback 為 iztro mutagen。
- **絕不顯示「化科→（無）」**：`layerFromMutagen` 有星名無落宮時改為回傳「落宮待核」；`getSihuaByLayerLines` 顯示「科→X星（落宮待核）」；四化能量彙總不納入「落宮待核」。
- **FLOW_DEBUG**：`buildTransformFlowLines.ts` 新增 `buildFlowDebugEntries(chart)`；技術版命書（`buildTechDebugForPalace`）在四化流向區塊後輸出【FLOW_DEBUG】每條邊的 layer / star / star_palace / from / to / transform。
