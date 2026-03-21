# Phase 5B-16：API 路由 natalFlowItems Hydration 修復報告

## 任務一／二：Hydration 邏輯已補齊

### 修改檔案

`worker/src/index.ts`

### 兩條路由皆已加入

1. **POST /api/life-book/section**（單章）：在 `if (PALACE_SECTION_KEYS.has(sectionKey))` 內、呼叫 `getPalaceSectionReaderOverrides(...)` 之前，加入 natalFlowItems hydration 與 debug log。
2. **POST /api/life-book/generate**（批次）：同上，在對應的 `if (PALACE_SECTION_KEYS.has(sectionKey))` 內、呼叫 `getPalaceSectionReaderOverrides(...)` 之前加入。

### Hydration 邏輯（與任務二對齊）

- 若 `p2.findings.natalFlowItems` 已有且長度 > 0：**不改動**。
- 若為空或不存在：
  1. 先從 `chartForSection` / `chartForGenerate` 取：`natal?.flows` → `natal?.birthTransforms` → `natalTransforms`。
  2. 若仍為空，再呼叫 `normalizeChart(chart)`，取 `normalized?.natal?.flows`；失敗則 `console.warn`，不拋錯。
  3. 以 `extractedFlows`（`unknown[]`）做 `.map()` 轉成 `{ fromPalace, toPalace, starName?, transform }`，`transform` 經 `validTransform()` 限為 `"祿"|"權"|"科"|"忌"`。
  4. `.filter(e => e.fromPalace && e.toPalace && e.transform)` 後寫入 `p2.findings.natalFlowItems`，未塞入未確認型別的 raw object。

---

## 任務三：Debug log 已加入

在 hydration 之後、`getPalaceSectionReaderOverrides(...)` 之前，兩條路由皆有：

```ts
console.log("[Hydration Debug] sectionKey:", sectionKey);
console.log("[Hydration Debug] natalFlowItems length:", p2.findings?.natalFlowItems?.length ?? 0);
console.log("[Hydration Debug] natalFlowItems first:", JSON.stringify(p2.findings?.natalFlowItems?.[0] ?? null));
```

單章與 batch 路徑都有。

---

## 任務四：實際 API 驗證

需在本地或部署環境實際打：

- **兄弟宮**：`POST /api/life-book/section` 或 `/api/life-book/generate`，`section_key: "s01"`（或 batch 中含 s01）。
- **夫妻宮**：同上，`section_key: "s07"`。

請在 server log 中確認：

1. **Hydration Debug** 三行輸出。
2. **natalFlowItems length** 是否 > 0（例如 31）。
3. **natalFlowItems first** 是否為一筆 `{ fromPalace, toPalace, starName?, transform }`。
4. 該次回應中 **【宮干飛化】** 是否已為非 fallback 內容（例如「來自【命宮】的巨門化祿飛入本宮。」等）。

---

## 本輪未改動

- `buildSihuaFlowBlock` / `buildSihuaPlacementBlock`
- skeleton / KV cache / 四化算法
- 未再查 key

---

## TypeScript / lint

- `read_lints` 對 `worker/src/index.ts` 無新錯誤。
- `npx tsc --noEmit` 中與本次修改相關的錯誤已排除；`index.ts` 仍存在兩處既有錯誤（646 DbContent、1254 WeightAnalysis），非本輪引入。

---

## 回報摘要

| 項目 | 狀態 |
|------|------|
| 單章 `/section` 是否已補 hydration | 是 |
| 批次 `/generate` 是否已補 hydration | 是 |
| Hydration Debug 輸出 | 已加，需實際打 API 後從 log 取得 |
| 夫妻宮【宮干飛化】是否已出現內容 | 需實際打 API 後依畫面確認 |
| TypeScript / lint | 本輪修改無新錯誤 |
