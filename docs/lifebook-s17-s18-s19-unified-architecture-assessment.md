# S17 / S18 / S19 宮位優化後統一架構評估與建議

## 名詞對照（避免與章節編號混淆）

| 稱呼 | 指什麼 |
|------|--------|
| **命書章節 `s17`** | `section_key === "s17"` 的**疊宮分析**章（獨立章節）。 |
| **逐宮讀者敘事** | 十二個宮位章節（s02、s10…）內，`PalaceNarrativeBuilder` → `renderPalaceNarrativeSample` 產出的**讀者向正文**；實作目錄慣用 `worker/src/lifebook/s17/palaceNarrative/`，**勿**口頭簡稱成「S17 敘事」以免誤會成疊宮章。 |
| **`S18` / `S19`** | 仍為命書章節編號與對應事件／月報管線，與上列並列。 |

## 一、現狀：兩條並行資料路徑

| 路徑 | 入口 | 產出 | 消費者 |
|------|------|------|--------|
| **A** | `normalizeChart(chartJson)` | `NormalizedChart`（含 `palaces[].natalTransformsIn/Out`、decadal/yearly、findings） | buildLifebookFindings、組裝 S15/S20、validators |
| **B** | `buildPalaceOverlay(chartJson)` | `PalaceOverlayEntry[]`（本命星曜、大限/流年 incoming/outgoing） | S17 疊宮區塊、S18 `buildEventSignals`、S19 月報 |

兩條路徑**各自**從 `chartJson` 做：

- 星曜落宮：`getStarByPalaceFromChart(chartJson)`
- 宮干：`buildPalaceStemMap(chartJson)`
- 本命／大限／流年四化：`buildGongGanFlows` / `buildDecadalSihuaFlows` / `buildYearlySihuaFlows`

因此同一請求若既跑 findings（內含 `normalizeChart`）又跑 S17/S18/S19（內含 `buildPalaceOverlay`），**等於重算一次宮位與三層四化**。

---

## 二、潛在問題

### 2.1 系統負荷

- **重複計算**：`lifeBookPrompts` 在 s17/s18/s19 各 section 分別呼叫 `buildPalaceOverlay(opts.chartJson, …)`，且若前段已為 findings 呼叫過 `normalizeChart`，則宮位與四化會被算兩遍。
- **建議**：整本書只做一次 `normalizeChart`，S17/S18/S19 所需 overlay 由 `NormalizedChart` 衍生，避免再對 `chartJson` 做一次完整解析。

### 2.2 資料不一致

- **兩套真相**：宮位結構與四化若只在 `normalizeChart` 或只在 `buildPalaceOverlay` 調整（例如本命四化來源、大限宮干、流年命宮），容易出現「findings 與 S18/S19 顯示不同」。
- **型別分叉**：`PalaceOverlayEntry` 用 `GongGanFlow[]`，`NormalizedChart.palaces` 用 `TransformEdge[]`；語義相同但若轉換漏寫或欄位對錯，會產生不一致。
- **建議**：以 **NormalizedChart 為唯一真相來源**，overlay 與**逐宮讀者敘事**皆由 chart 導出，不再從 `chartJson` 另建一套。

### 2.3 正規化／重構需求

- **逐宮讀者敘事**：目前 `PalaceNarrativeBuilder` 吃的是 `PalaceRawInput`（可含 `natalTransformsIn/Out`），若實際組裝仍用 `buildPalaceOverlay` 的結果而沒有從 `chart.palaces` 轉成 `PalaceRawInput`，則本命四化與「宮位優化後」的結構無法對齊。
- **S18/S19**：邏輯可維持只吃「overlay 形狀」的輸入，但**資料來源**應改為「由 NormalizedChart 產生的 overlay」，以利日後只改一處（normalizeChart）即全書一致。

---

## 三、建議方案（不改既有對外 API）

### 3.1 單一正規化入口

- 組裝層（例如 `lifeBookPrompts` 或上層 orchestrator）在處理一本書時：
  - **只呼叫一次** `normalizeChart(chartJson)`（或沿用既有 `buildLifebookFindingsFromChartAndContent` 內部的 chart）。
  - 將得到的 `NormalizedChart` 傳給所有需要「宮位 + 三層四化」的模組，**不再**對同一 `chartJson` 再呼叫 `buildPalaceOverlay`。

### 3.2 由 NormalizedChart 衍生 Overlay（適配器）

- **新增**：`buildPalaceOverlayFromNormalizedChart(chart: NormalizedChart, options?: { currentAge?, flowYear? }): PalaceOverlayEntry[]`
  - 從 `chart.palaces` 讀取每宮：
    - `natalStars`：由 `mainStars` / `assistantStars` / `shaStars` / `miscStars` 的 `name` 組成。
    - `decadalIncoming` / `decadalOutgoing`：由 `palace.decadalTransformsIn` / `decadalTransformsOut` 轉成 `GongGanFlow[]`（`TransformEdge` → `{ star, transform, fromPalace, toPalace, layer }`）。
    - `yearlyIncoming` / `yearlyOutgoing`：同上，用 `yearlyTransformsIn` / `yearlyTransformsOut`。
  - 如此 S17 疊宮、S18、S19 仍吃同一形狀的 `PalaceOverlayEntry[]`，只是來源改為 chart，**無須改 S18/S19 的介面與演算法**。

### 3.3 逐宮讀者敘事由 chart.palaces 驅動

- **新增**：`palaceStructureToPalaceRawInput(palace: PalaceStructure): PalaceRawInput`
  - 將 `PalaceStructure`（mainStars/assistantStars/shaStars/miscStars、brightness、natalTransformsIn/Out）映射為既有 `PalaceRawInput`。
  - 組裝**逐宮讀者敘事**時，對 `chart.palaces` 每宮呼叫此函數再 `buildPalaceNarrativeInput`，則「本命四化」與星曜結構解析皆來自同一份正規化資料，避免與 S18/S19 不同調。

### 3.4 型別與語義對齊

- **TransformEdge ↔ GongGanFlow**：在 `buildPalaceOverlayFromNormalizedChart` 中做唯一轉換點；欄位對應（starName→star, transform, fromPalace, toPalace, layer）寫清楚並加簡單單元測試，避免兩邊日後各自演進導致不一致。
- **宮位 canonical**：overlay 與 chart 皆使用同一套宮名（例如 `toPalaceCanonical`），避免「田宅」vs「田宅宮」等細微差異。

---

## 四、實作優先順序建議

1. **Phase 1**：實作 `buildPalaceOverlayFromNormalizedChart`，並在測試中比對「同一 chartJson 經 normalizeChart 再轉 overlay」與「直接 buildPalaceOverlay(chartJson)」的結果一致（或僅允許預期內的差異，例如 mutagenStars 覆寫）。
2. **Phase 2**：組裝層改為「若已有 NormalizedChart，則 overlay = buildPalaceOverlayFromNormalizedChart(chart)」，否則保留 fallback `buildPalaceOverlay(chartJson)`，確保既有 API 與呼叫方式不變。
3. **Phase 3**：實作 `palaceStructureToPalaceRawInput`，並在**逐宮讀者敘事**組裝時改用 `chart.palaces` → PalaceRawInput → builder，使本命四化與星曜結構解析完全來自 NormalizedChart。

---

## 五、風險與注意事項

- **大限／流年時序**：NormalizedChart 的 `currentDecade`、`yearlyHoroscope` 已含當前大限／流年；overlay 適配器應使用同一時間脈絡（currentAge、flowYear），避免 S18/S19 與 findings 的「當前」不一致。
- **向後相容**：若上游暫時無法傳入 NormalizedChart，保留「僅 chartJson → buildPalaceOverlay」路徑，避免現有整合失敗。
- **S18/S19 不改版**：兩者仍只消費 overlay（與必要時 chartJson 的少數字段）；不變更其函式簽名或規則邏輯，僅改變 overlay 的**產生方式**，以降低改動面與回歸範圍。

---

## 六、小結

| 項目 | 現狀風險 | 建議 |
|------|----------|------|
| 系統負荷 | 重複計算宮位與三層四化 | 單一 normalizeChart，overlay 由 chart 衍生 |
| 資料不一致 | 兩套真相、型別分叉 | NormalizedChart 為唯一來源；TransformEdge↔GongGanFlow 單一轉換點 |
| 正規化 | 逐宮讀者敘事未接 chart | 新增 palaceStructureToPalaceRawInput，由 chart.palaces 驅動 |
| API | - | 不對外改 API；S18/S19 仍吃 overlay，僅改 overlay 的產出方式 |

依上述順序實作後，宮位優化與本命四化接軌只需改 NormalizedChart 與適配器，S17/S18/S19 皆自動跟隨，且不增加多餘負荷與雙源不一致。

---

## 實作完成紀錄（Phase 1～3）

- **Phase 1**：`buildPalaceOverlayFromNormalizedChart(chart)` 已實作於 `palaceOverlay.ts`；`PalaceOverlayEntry` 新增選填 `natalIncoming`/`natalOutgoing`；S18 `buildEventSignals` 無 chartJson 時改由 overlay 的 `natalIncoming` 彙總本命四化。對照測試：`tests/palaceOverlayFromNormalizedChart.test.ts`。
- **Phase 2**：`getPlaceholderMapFromContext` 支援選填 `opts.normalizedChart`；若提供則 S17/S18/S19 使用 `buildPalaceOverlayFromNormalizedChart(opts.normalizedChart)` 產 overlay，否則沿用 `buildPalaceOverlay(opts.chartJson)`。
- **Phase 3**：`palaceStructureToPalaceRawInput(palace)` 與 `buildPalaceNarrativeInputsFromChart(chart)` 已實作；**逐宮讀者敘事**可改吃 `chart.palaces`。組裝層 **`getPalaceSectionReaderOverrides(..., normalizedChart)`** 已於單章／批次路徑傳入 `p2.normalizedChart`，與本階段對齊。
- **逐宮讀者敘事 · 本命四化**：`PalaceNarrativeBuilder.buildNatalTransformItems` 已優先 **`getTransformSemantic`**，與模組二／`narrativeFacade` 同源；驗證見 `docs/lifebook-per-palace-reader-narrative-deployment-notes.md`。
