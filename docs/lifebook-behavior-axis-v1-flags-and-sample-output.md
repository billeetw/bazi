# Behavior Axis v1：Feature flags、窄開啟、驗收參考輸出

## 設計原則

- **三個獨立開關**（無單一總開關），方便驗收時分辨「哪一層在加分／搗亂」。
- **預設窄開啟**：僅 **命宮、福德宮、財帛宮、夫妻宮** 套用；要全 12 宮需另開 `behaviorAxisWideOpen`。
- **建議上線順序**（由淺入深）：
  1. `behaviorAxisV1` — 軸向微偏移（pitfall / decision 末句合併）
  2. `behaviorAxisConflictV1` — 星曜 × 軸衝突句（接在最後一條 pitfall 後）
  3. `behaviorAxisLoopV1` — Loop 句（**最有感、也最容易變重**，建議最後開）

## `LifeBookConfig` 欄位

| 欄位 | 預設 | 說明 |
|------|------|------|
| `behaviorAxisV1` | `false` | 啟用 pitfall／decision 末句與 Behavior Axis 合併 |
| `behaviorAxisConflictV1` | `false` | 啟用星曜 × 軸衝突句（疊在最後 pitfall） |
| `behaviorAxisLoopV1` | `false` | 啟用每宮最多一句 Loop（由表驅動） |
| `behaviorAxisWideOpen` | `false` | `true` 時 12 宮皆可套用；`false` 時僅上表四宮 |

**注意**：只要三個 flag 任一為 `true`，且命盤有 **`mingSoulBranch`**（命宮地支），管線才會對符合範圍的宮位生效。

## 範例設定（驗收用）

```ts
// 階段 1：只開 v1（建議先驗這個）
const stage1 = {
  behaviorAxisV1: true,
  behaviorAxisConflictV1: false,
  behaviorAxisLoopV1: false,
  behaviorAxisWideOpen: false,
};

// 階段 2：加上衝突層
const stage2 = {
  behaviorAxisV1: true,
  behaviorAxisConflictV1: true,
  behaviorAxisLoopV1: false,
  behaviorAxisWideOpen: false,
};

// 階段 3：全開（Loop 最後開）
const stage3 = {
  behaviorAxisV1: true,
  behaviorAxisConflictV1: true,
  behaviorAxisLoopV1: true,
  behaviorAxisWideOpen: false,
};

// 全 12 宮（產品確認語感後）
const wide12 = {
  ...stage3,
  behaviorAxisWideOpen: true,
};
```

## 參考輸出型態（結構）

`applyBehaviorAxisLayersToPalaceNarrative` 會回傳：

- `decisionPatterns` / `pitfalls`：字串陣列（**最後一條**會與軸向句／衝突句合併，有長度上限）
- `behaviorAxis`：`"dynamic" | "relational" | "introverted"`（由 **命宮地支** 決定）
- `behaviorLoopLine`：僅在 `behaviorAxisLoopV1` 且該宮有表內文案時出現
- `behaviorAxisApplied`：`{ v1, conflictV1, loopV1 }` 布林，便於 log／除錯

### 軸向句（`behaviorAxisV1` 合併用，節錄）

| Axis | Pitfall 尾巴（接在最後一條 pitfall） | Decision 尾巴（接在最後一條 decision） |
|------|--------------------------------------|----------------------------------------|
| dynamic | …這樣的節奏久了，很容易還沒站穩就已經換場 | …你不太會等到完全穩才動，通常會先試一段再調整 |
| relational | …這樣下來，很容易為了關係調整太多自己 | …你很少只看事情本身，也會同時評估人與關係 |
| introverted | …久了會變成卡在裡面，想動但啟動不了 | …你會先在心裡想清楚一輪，再決定要不要動 |

### Loop 在 renderer 中的呈現

當 `behaviorLoopLine` 有值時，`palaceNarrativeSampleRenderer` 會多一行：

```text
「一直在發生的」：{behaviorLoopLine}
```

例如福德宮表內預設句：

```text
「一直在發生的」：所以你會一直在「先讓自己好一點」與「事情其實還在」之間循環。
```

## 自動測試

`worker/tests/behaviorAxisV1.test.ts` 涵蓋軸向判定、衝突句、Loop、tone gate，以及 `applyBehaviorAxisLayersToPalaceNarrative` 在窄四宮上的行為。

## 實作位置（查 code 用）

- 旗標與預設：`worker/src/lifeBookPrompts.ts` → `LifeBookConfig` / `getDefaultConfig`
- 管線：`worker/src/lifebook/s17/palaceNarrative/behaviorAxisV1.ts`
- 接入敘事：`worker/src/lifebook/s17/palaceNarrative/PalaceNarrativeBuilder.ts`
- 渲染 Loop 行：`worker/src/lifebook/s17/palaceNarrative/palaceNarrativeSampleRenderer.ts`
- 命宮地支來源：`NormalizedChart.mingSoulBranch`（`normalizeChart` 寫入）

## 共用測試命盤與完整輸出

- **命盤 JSON**：`worker/tests/fixtures/lifebookCanonicalTestChart.ts` → `LIFEBOOK_CANONICAL_TEST_CHART_JSON`（`chartId: lifebook-canonical-test-v1`，命宮地支 **子**）
- **窄四宮 × baseline + Stage1–3 完整 Markdown**：[`lifebook-canonical-test-chart-sample-output.md`](./lifebook-canonical-test-chart-sample-output.md)
- **回歸快照**：`worker/tests/__snapshots__/lifebookCanonicalChart.test.ts.snap`
- **更新文件**：`cd worker && npm run gen:canonical-md`（會覆寫上述 `.md`）
- **合併／回朔流程**（宮干、生年四化、`liunian` 陷阱）：[`lifebook-canonical-test-chart-strategy.md`](./lifebook-canonical-test-chart-strategy.md)
