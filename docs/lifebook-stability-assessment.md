# 命書系統水平穩定度評估與可加強部分

## 一、評估範圍

- **s00 四化 pipeline**：normalizer → 5 detectors → dedupe → 主文/debug 渲染、Dominant Palace
- **命書 placeholder 組裝**：`getPlaceholderMapFromContext`、content/config 依賴
- **錯誤處理與邊界**：chartJson 缺漏、buildEvents/buildAssembleInput 拋錯、content 缺 key
- **測試與回歸**：單元測試覆蓋、關鍵路徑保護

---

## 二、目前較穩的部分

| 項目 | 說明 |
|------|------|
| **buildS00EventsFromChart** | 接受 `chartJson \| undefined`，無資料時回傳 `[]`，不拋錯 |
| **normalizer** | 缺欄位仍產出事件並寫入 diagnostics，不丟事件 |
| **Detectors** | 輸入為空陣列時回傳 `[]`，無依賴外部 I/O |
| **s03 驗證** | `validateModuleOneOutput` 對模組一輸出做結構檢查（禁止「宮位：命宮」、要求數字統計） |
| **Content 合併** | `mergeContent` 有 base + overlay，D1 缺 key 時有靜態 fallback |

---

## 三、可加強部分（依優先順序）

### 1. **s00 區塊：chartJson 未傳入時防護**（高）

**現況**：`getPlaceholderMapFromContext` 在 `opts?.sectionKey === "s00"` 時直接呼叫  
`runS00Pipeline(opts.chartJson, { buildEvents, config })`。  
`opts.chartJson` 為 optional，可能為 `undefined`。

**風險**：  
- `runS00Pipeline` 型別為 `chartJson: Record<string, unknown>`，傳入 `undefined` 時 TypeScript 可能未攔截（視呼叫端型別而定）。  
- `detectDominantPalaces({ chartJson, ... })` 內會呼叫 `buildAssembleInput(chartJson)`；若 `chartJson` 為 `undefined`，在嚴格存取或未來重構時較易出錯。

**建議**：  
- 僅在 `opts.chartJson != null` 時執行 s00 pipeline；否則寫入安全預設值：

```ts
if (opts?.sectionKey === "s00") {
  // ... 既有 s00Events / s00Hits / narrative 等 ...
  if (opts.chartJson != null) {
    const pipeline = runS00Pipeline(opts.chartJson, { buildEvents: buildS00EventsFromChart, config: opts.config ?? null });
    map.s00MainNarrative = pipeline.mainNarrative || "（本局四化結構見下方技術區塊。）";
    map.s00DebugEvidence = pipeline.debugEvidence;
    map.s00DominantPalaces = pipeline.dominantPalacesBlock;
  } else {
    map.s00MainNarrative = "（本局四化結構見下方技術區塊。）";
    map.s00DebugEvidence = "";
    map.s00DominantPalaces = "";
  }
}
```

- 若希望型別與 runtime 一致，可將 `runS00Pipeline` 第一參數改為 `chartJson: Record<string, unknown> | undefined`，函數內先 `if (!chartJson) return defaultResult;` 再往下執行。

---

### 2. **s00 pipeline 與 Dominant Palace 的 try/catch**（高）

**現況**：  
- `runS00Pipeline` 內無 try/catch；  
- `buildS00EventsFromChart`、`buildSiHuaLayers`、`buildAssembleInput` 等若因異常 chart 結構拋錯，會直接中斷整段 placeholder 組裝。

**風險**：單一命盤資料異常導致整本命書 s00 區塊空白或請求失敗。

**建議**：  
- 在 **呼叫端**（例如 `getPlaceholderMapFromContext` 的 s00 區塊）用 try/catch 包住 `runS00Pipeline`，catch 時寫入 fallback 文案並可選寫入 `diagnostics.emptyReason` 或 log（不把內部錯誤直接暴露給使用者）。  
- 或在 **runS00Pipeline 內部** 包 try/catch，失敗時回傳 `{ mainNarrative: fallback, debugEvidence: "", diagnostics: { ..., emptyReason: "計算時發生錯誤" }, dominantPalacesBlock: "", hitCount: 0 }`，由呼叫端一律收到穩定結構。

---

### 3. **Normalizer 輸入型別防禦**（中）

**現況**：`normalizeSiHuaEvents(input: NormalizerInputEvent[])` 假設 `input` 為陣列；若呼叫端傳入 `null`/`undefined` 會拋錯。

**建議**：  
- 函數開頭：`const list = Array.isArray(input) ? input : [];`，後續一律使用 `list`。  
- 或型別改為 `input?: NormalizerInputEvent[] | null`，同上預設 `[]`。

---

### 4. **Detectors 與 canonicalKeys 的邊界**（中）

**現況**：  
- `toPalaceCanonical("")`、`toStarName("")` 回傳 `""`；  
- R30 以 `fromPalace`/`toPalace` 建圖，若宮位字串不一致（例如同一宮有「財帛」「財帛宮」兩種寫法），可能漏邊或重複節點。

**建議**：  
- 事件進入 normalizer 時已統一宮位；detector 內凡用到宮位處一律經 `toPalaceCanonical` 再比對，避免混用未正規化字串。  
- R30 的 2-cycle/3-cycle 去重已用 `sortedNodesJoined`；可加單元測試：同一組宮位不同順序的邊只產出一個 R30 hit。

---

### 5. **Content / config 缺 key 時的降級**（中）

**現況**：  
- `opts.content?.narrativeCorpus?.s00` 缺時已有 fallback 句；  
- 其他區塊（如宮位章節）若 `content.starPalaces`、`content.starPalacesMain` 等缺 key，多處用 `??` 層層 fallback，但少數路徑可能仍出現「（此欄位資料不足）」或空白。

**建議**：  
- 對關鍵 content 路徑（例如組裝 s00/s03 或宮位主星敘事）做「最小必要 key」檢查或清單，在 doc 或註解註明；若未來有 content 驗證腳本，可一併檢查。  
- 若 D1 回傳的 content 與靜態 schema 不一致，考慮在 merge 後跑一輪輕量驗證（例如必備 section 是否存在），失敗時 fallback 到純靜態 content 或明確錯誤訊息，避免半成品輸出。

---

### 6. **單元測試覆蓋**（中）

**現況**：  
- 僅有 `tests/lifebook-assembler.test.ts` 等少數命書相關測試；  
- s00 normalizer、5 detectors、dedupe、R30 環偵測、Dominant Palace 計分等尚無獨立單元測試。

**建議**：  
- **優先**：為 `normalizeSiHuaEvents`、`runAllDetectors`、`dedupeByCanonicalKey`、`renderMainNarrative` 寫單元測試，涵蓋：空輸入、僅一層事件、R01/R02_LU/R02_JI/R11/R30 各一組典型輸入。  
- **R30**：2-cycle（A→B, B→A）、3-cycle（A→B→C→A）各一案例，預期 hit 數與 canonicalKey。  
- **Dominant Palace**：mock chartJson + events，預期 Top 3 與 score 相對大小。  
- 可放在 `worker/src/lifebook/` 同目錄的 `*.test.ts` 或專用 `tests/`，用 Vitest 或既有測試 runner 跑。

---

### 7. **s00 與舊版輸出的並存**（低）

**現況**：  
- s00 同時寫入新 pipeline 的 `s00MainNarrative`、`s00DebugEvidence`、`s00DominantPalaces` 以及舊的 `s00GlobalHighlights`、`s00NarrativeBlocks`、`s00PatternBlock`。  
- 模板中新舊並列，若未來要收斂為單一來源，需決定是否只保留新 pipeline 輸出並讓舊 placeholder 改讀新欄位或移除。

**建議**：  
- 短期可維持並存，便於 A/B 或逐步切換。  
- 若產品確定只保留「高階判讀 + 命盤主舞台 + debug」，可規劃一步：模板改為只依賴 `s00MainNarrative`、`s00DominantPalaces`、`s00DebugEvidence`，其餘改為空或從新欄位衍生，以減少重複與不一致。

---

### 8. **小限（minor）層納入**（低）

**現況**：  
- Normalizer 型別已支援 `layer: "minor"`；  
- `buildS00EventsFromChart` 目前僅產出 natal/decade/year，未納入小限；若前端或 D1 有 `sihuaLayers.xiaoXianCurrent`，目前不會進入 pipeline。

**建議**：  
- 在 **不改 buildS00EventsFromChart 簽名** 的前提下，由呼叫端（或 lifeBookPrompts 內）從 chartJson 讀取小限事件，轉成與 SiHuaEvent 同形的陣列並標記 `layer: "minor"`，與 `buildS00EventsFromChart` 回傳的陣列 concat 後再傳入 normalizer。  
- 如此 normalizer 與 detectors 不必改動，僅擴充輸入來源即可支援 minor。

---

## 四、小結

| 優先級 | 項目 | 預期效果 |
|--------|------|----------|
| 高 | chartJson 未傳入時 s00 防護 | 避免 undefined 傳入 pipeline / buildAssembleInput，型別與 runtime 一致 |
| 高 | s00 pipeline / Dominant Palace try/catch | 單一命盤異常不拖垮整本命書，回傳穩定 fallback |
| 中 | normalizer 空輸入防禦 | 避免 `null`/`undefined` 導致拋錯 |
| 中 | R30 / 宮位正規化一致性 | 環偵測與去重結果穩定、可測 |
| 中 | content 缺 key 策略與驗證 | 減少「資料不足」或半成品輸出 |
| 中 | 單元測試（normalizer、detectors、R30、Dominant Palace） | 回歸安全、重構放心 |
| 低 | s00 新舊輸出收斂 | 維護單一真相、減少重複 |
| 低 | 小限層納入 | 功能完整、與規格一致 |

先完成 **chartJson 防護** 與 **try/catch** 兩項，即可明顯提升 s00 在異常資料與邊界情境下的水平穩定度；其餘可依排程逐步補齊。

---

## 五、已實作之加強（本輪）

- **chartJson 防護**：`getPlaceholderMapFromContext` 的 s00 區塊改為僅在 `opts.chartJson != null` 時呼叫 `runS00Pipeline`，否則寫入預設空字串與 fallback 主文。
- **try/catch**：同上區塊內以 try/catch 包住 `runS00Pipeline`，catch 時寫入相同 fallback，避免單一命盤異常導致整段 placeholder 組裝拋錯。
- **normalizer 空輸入**：`normalizeSiHuaEvents` 接受 `input?: NormalizerInputEvent[] | null`，內部以 `Array.isArray(input) ? input : []` 防禦，避免 `null`/`undefined` 拋錯。
- **單元測試**：`worker/tests/s00-pipeline.test.ts` — normalizer 空輸入、Case1 R01、Case2 R02_LU、Case3 R11、Case4 R30、輸出順序、dedupe、renderMainNarrative 無 ruleId；執行 `cd worker && npm run test`。
- **R30 宮位正規化**：R30 建圖前將每條 edge 的 fromPalace/toPalace 以 `toPalaceCanonical` 正規化，同一宮不同寫法（如財帛／財帛宮）視為同一節點，避免漏環或重複。
