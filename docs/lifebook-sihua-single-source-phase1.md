# 四化單一權威（Phase 1 + Phase 2）

## 宣告

- **Worker 為唯一權威**：`normalizeChart` → 星曜落宮與飛化邏輯；`buildSiHuaLayers` 產出 **BuiltSiHuaLayers**（本命／大限／流年）供 s00／s03／findings 等使用。
- **`chartJson.sihuaLayers`（客戶端 wire，型別 ClientSihuaLayers）已 deprecated**：**不影響**正式輸出。

## 型別命名（已收斂）

| 語意 | 型別名 | 說明 |
|------|--------|------|
| Worker 產物 | `BuiltSiHuaStar`, `BuiltSiHuaLayer`, `BuiltSiHuaLayers` | 定義於 `worker/src/lifebook/builtSiHuaTypes.ts` |
| 客戶端請求 wire | `ClientSihuaLayerTransform`, `ClientSihuaLayers` | `chartJson.sihuaLayers` 形狀；僅比對／除錯 |
| 相容舊名 | `SiHuaLayers`, `SiHuaLayer`, `SiHuaStar` | @deprecated，等同 Built* |
| 相容舊名 | `SihuaLayers`, `SiHuaLayerTransform` | @deprecated，等同 Client* |

與 **S00 事件層**的 `SiHuaLayer`（`"natal" \| "decade" \| "year"`，見 `s00PatternEngine`）不同，請勿混用。

## 比對與觀測（Phase 2）

- **正式管線預設不在 `buildSiHuaLayers` 內打 log**。僅當 **`LIFEBOOK_CLIENT_SIHUA_DIFF_LOG=1`** 時，於 `buildSiHuaLayers` 結尾呼叫 `maybeLogClientSihuaLayersDiff`（且請求須帶有 client `sihuaLayers`）。
- **無偏差時的 `console.info`**：另需 **`LIFEBOOK_CLIENT_SIHUA_DIFF_VERBOSE=1`**（避免刷屏）。
- **比對工具／debug endpoint**：可直接呼叫 `compareClientSihuaLayersToWorker(chartJson, buildSiHuaLayers(chartJson))`，不依賴上述 env。

實作：`worker/src/lifebook/sihuaLayersClientDiff.ts`（`isClientSihuaLayersDiffLogEnabled`、`hasClientSihuaLayers`、`compareClientSihuaLayersToWorker`、`maybeLogClientSihuaLayersDiff`）。

## 計算路徑與 wire 隔離（安全／防誤用）

- **`buildSiHuaLayers` 計算時**（未開 diff log）會淺拷貝並 **省略 `chartJson.sihuaLayers`**（`omitClientSihuaWireForCompute`），避免下游誤讀與日誌帶入大型 client 物件。
- **`LIFEBOOK_CLIENT_SIHUA_DIFF_LOG=1`**：保留 wire，供 `maybeLogClientSihuaLayersDiff` 比對。
- **`LIFEBOOK_KEEP_CLIENT_SIHUA_WIRE=1`**：即使未開 diff，也保留 wire（相容舊除錯／外層仍需要完整 chart 快照時）。
- **前端**：請勿再送 `sihuaLayers` 作為權威；`expert-admin` 等組 `chart_json` 時可刪除該鍵以縮小 payload。
- **API（Worker）**：`/api/life-book/ask`、`infer`、`narrate`（附 chart 時）、`generate-section`、`generate` 在進入命書邏輯前會呼叫與 `omitClientSihuaWireForCompute` 相同的清理（預設略過 wire；`LIFEBOOK_CLIENT_SIHUA_DIFF_LOG=1` 或 `LIFEBOOK_KEEP_CLIENT_SIHUA_WIRE=1` 時保留），避免惡意或舊客戶端把大型 wire 塞進 prompt。
- **命書 Viewer**：`normalizeApiResponse`／`buildLifeBookDocument` 寫入 `chart_json` 前會略過 `sihuaLayers`，匯出 JSON 不含已廢止 wire。

## Phase 3（顯式覆寫，已完成）

- **欄位**：`chartJson.lifebookSiHuaDisplayOverride`（常數 `LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_KEY`）。
- **形狀**：`{ enabled: true, audit: { reason: string, source?, correlationId? }, layers: Partial<BuiltSiHuaLayers> }`。
- **語意**：在 worker 已算出 `BuiltSiHuaLayers` 後，依 `layers` 內**有出現的鍵**覆寫對應層（本命／大限／流年）；未出現的層仍用 normalize+mutagen 結果。
- **稽核**：`audit.reason` 必填（非空字串）；套用成功時會 `console.info` 一行 JSON（`tag: lifebook/sihua-display-override`）。
- **Kill switch**：`LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_DISABLE=1` 時一律不套用覆寫。
- **與舊 wire 關係**：不得用 `chartJson.sihuaLayers` 覆寫；實驗／地區規則請用本欄位 + audit。

實作：`worker/src/lifebook/sihuaDisplayOverride.ts`；`buildSiHuaLayers` 結尾合併覆寫後再跑 client diff log（若開啟）。

---

## 維護清單（後續增量）

1. **文件**：其他 `docs/*.md` 若仍寫「無 `sihuaLayers` 則 fallback」或把 wire 當權威，應改指本文件與 `buildSiHuaLayers`。（核心路徑已掃過一輪。）
2. **前端／API**：停止依賴 `chartJson.sihuaLayers` 作為顯示來源；實驗覆寫一律經 `lifebookSiHuaDisplayOverride` + audit。（`expert-admin` 送出 `chart_json` 前會刪除 `sihuaLayers`。）
3. **觀測**：可選將 diff／override log 接到集中式 metrics（目前為 `console`）。
