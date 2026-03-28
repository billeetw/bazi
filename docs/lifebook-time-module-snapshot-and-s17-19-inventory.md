# 時間模組 Snapshot 清單（現況）與 s17–s19 盤點

本文件為**盤點用**：記錄已收斂的 findings 快照、P2 inject 合併順序，以及仍依賴 chart 即時算的區段。若與 `worker/src` 行為不一致，以程式為準。

---

## 1. 時間模組 snapshot 清單

| 項目 | 型別／欄位（`LifebookFindings`） | 建置時機 | 消費時機（原則） | 狀態 |
|------|----------------------------------|----------|------------------|------|
| **疊宮／計數／區塊** | `timeModuleOverlap` | `buildLifebookFindingsFromChartAndContent` 內 | `getPlaceholderMapFromContext`：快照優先；P2：`mergeInjectP2TimeModuleOverlapSnapshot` | **已收斂** |
| **決策矩陣輸出** | `timeModuleDecision` | 同上 | `getPlaceholderMapFromContext`：快照優先；P2：`mergeInjectP2TimeModuleDecisionSnapshot` | **已收斂** |
| **穿透式診斷** | `piercingDiagnosticBundle` | `buildP2FindingsAndContext`（與 request **effective** `LifeBookConfig` 同源） | `getPlaceholderMapFromContext`：`piercingBundleFromFindingsOrChart`（快照優先） | **已收斂** |
| **s17–s19 技術版三欄** | `timeModuleS17S19ReaderSnapshot`（＋`chartInputFingerprint`） | `buildP2FindingsAndContext` 內 `buildTimeModuleS17S19ReaderSnapshot` | `getPlaceholderMapFromContext`／`mergeInjectP2TimeModuleS17S19Snapshot`：**指紋與當前 `chartJson` 一致才用快照**，否則即場重算／不覆寫 | **已收斂 + 防呆** |
| **小限表／時間軸表** | （尚無獨立 findings 欄位） | 仍於 `getPlaceholderMapFromContext` 由 `chartJson.minorFortuneByPalace` 等組表 | placeholder 層 | **候選** 小限快照化 |
| **時間真值** | `timeAxis` 等 | P2 路徑寫入 findings | `injectTimeModuleDataIntoSection` 優先 findings | **既有** |
| **V2 reason（s15a/s16）** | `findingsV2` | 組裝端傳入 | `buildS15aPlaceholderMapFromV2`／`buildS16PlaceholderMapFromV2` 於 P2 inject 內依 **sectionKey** 合併 | **另一軌** |

**仍可能即時讀 chart 的區塊（候選下一輪）**

- 大限列表、大限／流年飛星公式、`flowYear*`、`decadalFourTransform*` 等（`TIME_MODULE_SECTION_KEYS` 大段）。
- **content**：`lifebookSection` 模板、runtime KV 與建置 JSON 是否一致需自行對照。

---

## 2. s17–s19：資料來源（更新後）

### 2.1 主路徑：`getPlaceholderMapFromContext`

- **有** `findings.timeModuleS17S19ReaderSnapshot` 且 **`chartInputFingerprint` 與當前 `chartJson` 一致**（或快照無指紋＝舊資料）：**只讀快照**寫入三欄。
- **無**快照、**指紋不符**、或過期：fallback 即場算（`normalizedChart` 優先，否則 `buildPalaceOverlay(chartJson)`），s19 與 s18 共用同一批 `EventSignals`。

### 2.2 `piercingDiagnosticBundle`（s00／s03／recurring／s18 後段等）

- 建置於 findings：**`buildPiercingDiagnosticBundle(chart, config)`** 與 prompts 同源 config。
- 消費：**findings 快照優先**，無快照才即場算。

### 2.3 s19 行動三欄（`s19ActionNow`／`s19LongTerm`／`s19Avoid`）

- **已改為**與 `actionNowLayers` 同批字串直接賦值（`nowBlock`／`yearAdjust`／`decadeRemember`），**不再**對 `actionNowLayers` 做 `split`/標題搜尋。

### 2.4 技術版骨架：`getSectionTechnicalBlocks`

- s17／s18／s19 仍強制 `structure_analysis` 為 `{palaceOverlayBlocks}`／`{s18SignalsBlocks}`／`s19MonthlyBlocks}`，與上列快照欄位對齊。

---

## 3. P2 `injectTimeModuleDataIntoSection` 合併順序（固定）

完整步驟以 `injectTimeModuleDataIntoSection` 檔頭註解為準。摘要：

1. `assembleTimeModuleFromFindings`
2. `timeAxis` 覆寫
3. findings 四化／本命飛化字串欄
4. `findingsV2`（**僅** s15a、s16）
5. `mergeInjectP2TimeModuleOverlapSnapshot`
6. `mergeInjectP2TimeModuleDecisionSnapshot`
7. `mergeInjectP2TimeModuleS17S19Snapshot`（**僅** s17、s18、s19 覆寫技術版三欄）
8. s20 流年命宮字串替換

新增欄位時請標明落在哪一步，避免與 s17–s19 快照或 V2 合併衝突。

---

## 4. 開發除錯

- Worker `Env.LIFEBOOK_DEBUG` 設為 `1` 或 `true` 時：除原有 s18 完整 prompt 外，**hydration** 與 **Phase5B-10** 相關 `console.log` 才會輸出；未設定時不生產噪音。

---

*文件產生自程式碼盤點；若路徑或行為變更，請以實際 `worker/src` 為準。*
