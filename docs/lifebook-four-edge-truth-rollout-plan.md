# 四化 Edge 單一真相：執行計劃（順序固定）

目標順序與你要求一致：

1. **先決定真相**（四化 edge 是什麼、從哪裡來）
2. **再讓全系統只能用這個真相**（Worker / 章節 / 前端禁止混源）
3. **再讓 CI 保護這個真相**（驗證 + 嚴格模式）
4. **再讓章節與 UI 只吃這個真相**（placeholder、Viewer、時間模組顯示）

下列與既有文件對齊：`lifebook-technical-debt-and-data-normalization-audit.md`、`lifebook-sihua-single-source-phase1.md`、`normalizeTransforms.ts`（已宣告不再從 `overlapAnalysis.items[].transformations` 讀取）。

---

## Phase 0 — 決定真相（ADR，1～2 天可定稿）

### 0.1 單句宣告（寫進 ADR）

- **四化「整條邊」`TransformEdge`（starName + transform + fromPalace + toPalace + layer）的唯一事實來源** = **`normalizeChart(chartJson)` 產出之 `NormalizedChart` 內各層 `flows`**（`natal` / `currentDecade` / `yearlyHoroscope`；若型別另有 `natalTransforms` 等相容別名，以 `normalizedChart.ts` 為準）。
- **禁止**：`overlap.items` 的幾何 + `mutagenStars` 補星名的**混源**（見技術債文件）。

### 0.2 路線確認（二選一，必須白紙黑字）

| 路線 | 含義 | 何時選 |
|------|------|--------|
| **B（Worker 重建 edge）** | 星名來自各層權威 mutagen；from/to 由宮干飛化與盤面推導 | 與現有 `normalizeChart` + `gonggan-flows` 方向一致時 |
| **A（上游 edge 權威）** | `overlap.items` 每筆完整且自洽，Worker 只驗證不重建 | 僅當上游保證幾何與星名同源且長期維護 |

**建議**：若目前管線已以 Worker 計算為主，**預設採 B**，並在 ADR 註明「overlap 僅標籤／摘要，不驅動 edge」。

### 0.3 交付物

- `docs/adr/ADR-XXXX-sihua-edge-source-of-truth.md`（或本 repo 慣用位置）含：路線、非目標、與 `buildSiHuaLayers`（顯示層）的關係。
- 更新 `sectionDataDependencyMap` 的「四化流向」列：**primary = `NormalizedChart.*.flows`**。

**Exit**：團隊審閱通過，無「邊從 overlap、星從 mutagen」的模糊表述。

---

## Phase 1 — 全系統只能使用這個真相（程式收斂）

### 1.1 Worker：單一寫入點

- **唯一寫入** `flows`：`worker/src/lifebook/normalize/**`（含 `normalizeChart` 與邊的組裝）。
- **盤點讀取點**：`rg "overlap.*transform|getTransformsByLayer|overlap\.items"` 於 `worker/src`，凡用於**四化邊或流向敘事**的，改為 **`chart.*.flows`** 或經 `getFlowBlockForPalace` / `buildTransformFlowLines`（已註明只讀 `NormalizedChart.*.flows`）。
- **保留 overlap**：僅用於 **tag／摘要／非 edge 統計**（若仍需要），並在註解標 `NOT_EDGE_AUTHORITY`。

### 1.2 與 Findings / 理由引擎一致

- `buildLifebookFindings` 等已讀 `chart.natal?.flows`；確認 **無第二條**從 raw `chartJson.overlap` 拼邊的路徑。

### 1.3 前端 / API 契約

- 命書 JSON 若需給前端「流向」，應來自 **Worker 已寫入 document 的欄位**（或明確序列化 `NormalizedChart` 快照），**不要**要前端自己從 `overlapAnalysis` 推邊。
- `chartJson.sihuaLayers`：**維持 deprecated**（僅 diff），與 `lifebook-sihua-single-source-phase1.md` 一致。

**Exit**：靜態搜尋無「流向敘事仍讀 overlap transformations」；code review checklist 勾選。

---

## Phase 2 — CI 保護這個真相

### 2.1 已有基礎（加強沿用）

- `validateTransformEdgeConsistency(chart)`：`worker/src/lifebook/validators/validateTransformEdgeConsistency.ts`
- 測試：`worker/tests/validateTransformEdgeConsistency.test.ts`（含 canonical chart）
- 嚴格模式：`LIFEBOOK_STRICT_TRANSFORM_EDGES=1` 時 `buildLifebookFindingsFromChartAndContent` 可拋錯（見測試）

### 2.2 CI 必做項

| 項目 | 動作 |
|------|------|
| **固定跑** | `cd worker && npx vitest run tests/validateTransformEdgeConsistency.test.ts`（已含於 `npm test`，確認 CI 有跑 worker 全量或至少此檔） |
| **擴充 fixture** | 除 `LIFEBOOK_CANONICAL_TEST_CHART_JSON` 外，**再 1～2 張**代表性情境（不同大限／流年組合），normalize 後 **error severity = 0** |
| **可選 gate** | PR 或 main：對 **production infer 路徑** 在 strict 模式下跑一輪 smoke（若成本可接受） |

### 2.3 開發者體驗

- 在 `package.json` 或 `worker/package.json` 增加顯式腳本：`verify:transform-edges` → 只跑上述測試，方便本地快速檢查。

**Exit**：CI 紅燈即代表「真相被破壞」，無人靠口頭約定補救。

---

## Phase 3 — 章節與 UI 只吃這個真相

### 3.1 章節（Worker 組字）

- **時間／四化顯示字串**：唯一經 `buildTimeModuleDisplayFromChartJson`（或文件已指定的單一函式）；**敘事裡的「流向」**經 `getFlowBlockForPalace` / `buildTransformFlowLines` → **底層只讀 `NormalizedChart.*.flows`**。
- **逐章清查**：依 `sectionDataDependencyMap.ts`，將 **secondary 仍列 overlap** 的章節改為：**敘事用 findings 或 flows，overlap 僅 fallback 標籤**（並在章節 README 註明）。

### 3.2 UI（lifebook-viewer）

- **不自行算四化邊**；若畫面需要「節點／宮位連結」，只吃 **document 內已算好的欄位**（與 `buildHomeSummaryFromDocument`、gate 契約一致）。
- **匯出 JSON**：維持略過 `sihuaLayers` wire；若未來加「正規化快照」，應序列化 **與 Worker 一致的結構**，不重算邊。

### 3.3 文件同步

- `lifebook-technical-debt-and-data-normalization-audit.md` §「下一步」：標 **Phase 1–3 完成度**與剩餘例外（若有）。

**Exit**：新章節範本明寫「禁止直讀 overlap 組邊」；Viewer 無新增混源 PR。

---

## 依賴關係（不可顛倒）

```
ADR（真相定義）
    → Worker 單一寫入 + 讀取點收斂
        → CI 驗證 + strict
            → 章節模板 + UI 契約
```

**禁止**：在 ADR 未定前大改章節；在 CI 未攔前先宣稱「已單一真相」。

---

## 建議時程（可滾動）

| 週次 | 重點 |
|------|------|
| W1 | Phase 0 ADR + Phase 1.1 盤點與第一批改動 |
| W2 | Phase 1 收尾 + Phase 2 fixture / verify 腳本 |
| W3+ | Phase 3 分章節批次（每批 2～3 章） |

---

## 驗收清單（最終）

- [ ] ADR 發布且連結到本計劃  
- [ ] `rg` 無「邊敘事」混源路徑（或僅剩標註 deprecated 的讀取）  
- [ ] CI 綠燈含 edge 驗證 + 多 fixture  
- [ ] `LIFEBOOK_STRICT_TRANSFORM_EDGES` 行為與文件一致  
- [ ] 章節 dependency map 與 Viewer 行為與 ADR 一致  

---

*本計劃為執行順序的單一入口；細節演算法仍以 `normalizedChart.ts`、`validateTransformEdgeConsistency.ts`、`normalizeTransforms.ts` 實作為準。*
