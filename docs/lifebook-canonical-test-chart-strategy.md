# 共用測試命盤（canonical）策略：合併、維護、回朔

## 單一真相來源

| 項目 | 位置 |
|------|------|
| **命盤 JSON** | `worker/tests/fixtures/lifebookCanonicalTestChart.ts` → `LIFEBOOK_CANONICAL_TEST_CHART_JSON` |
| **敘事／Behavior 範例** | `docs/lifebook-canonical-test-chart-sample-output.md`（由測試產生） |
| **敘事回歸快照** | `worker/tests/__snapshots__/lifebookCanonicalChart.test.ts.snap` |

以下測試已改為 **import 上述 JSON**，不再內嵌重複盤面：

- `worker/tests/palaceOverlay.test.ts`
- `worker/tests/palaceOverlayFromNormalizedChart.test.ts`
- `worker/tests/s18EventSignals.test.ts`
- `worker/tests/lifebookCanonicalChart.test.ts`

## 盤面已合併的欄位

- **`palaceStemMap`**：12 宮宮干，供 `normalizeChart` 宮干飛化與 `buildPalaceOverlayFromNormalizedChart` 之 `natalIncoming` 對照。
- **`fourTransformations.benming.mutagenStars`**：生年四化星名；**星曜落點須與 `starByPalace` 一致**（廉貞／破軍／武曲／太陽各在對應宮）。
- **流年**：`yearlyHoroscope.stem: "丙"`；`liunian` 僅 **`palace` + `stem`**（見下節「陷阱」）。

## 已知設計取捨（避免之後誤改）

### 1. `liunian.branch` 與 `liunian.palace` 勿衝突

命宮地支為 **子** 時，若同時傳 **`branch: "午"`** 與 **`palace: "疾厄宮"`**，`buildPalaceOverlay` 會 **優先用 `getFlowYearPalace(午, palaceByBranch)`**，流年飛出宮變成 **遷移宮**，與預期的 **疾厄宮** 不一致。

**測試盤**固定以 **`palace` + `stem`** 指定流年宮（不傳 `branch`），使疊宮／S18 與「丙干自疾厄飛出」對齊。

### 2. 丙干四化須四顆星在盤上

流年 **丙** 飛 **祿權科忌** 時，`gonggan-flows` 會用 **`findPalaceByStar`**。若盤上 **缺文昌**，則 **疾厄宮 `yearlyOutgoing` 只有 3 條**。

**測試盤**在 **夫妻宮** 帶 **文昌**，以湊齊四條飛出。

### 3. 天同化祿所入之宮

**天同**坐 **子女宮** 時，丙干 **天同化祿** 飛入 **子女宮**，不是財帛宮；舊斷言若以「財帛收祿」為準，需改為 **子女宮** 或改星曜配置。

## 變更後的標準流程（避免靜默走樣）

1. 改 `LIFEBOOK_CANONICAL_TEST_CHART_JSON` 後執行：  
   `cd worker && npx vitest run`
2. 若敘事快照預期變更：  
   `npx vitest run tests/lifebookCanonicalChart.test.ts --update`
3. 同步人讀 Markdown：  
   `npm run gen:canonical-md`
4. **Code review**：對照 snapshot diff 與 `docs/lifebook-canonical-test-chart-sample-output.md`，確認語意合理，不是只綠燈。

## 出錯時如何回朔、檢查、修正

### A. Git 回朔（最快恢復可開發狀態）

```bash
# 尚未 commit：還原單一檔
git checkout -- worker/tests/fixtures/lifebookCanonicalTestChart.ts
git checkout -- worker/tests/__snapshots__/lifebookCanonicalChart.test.ts.snap
git checkout -- docs/lifebook-canonical-test-chart-sample-output.md

# 已 commit：整段還原
git log --oneline -5   # 找合併 canonical 前的 commit
git revert <commit-sha>   # 或 git reset --hard <good-sha>（僅本地、未 push 時）
```

建議在 **大改盤面前** 先打標籤，方便 diff：

```bash
git tag -a lifebook-canonical-pre-v2 -m "before canonical merge tweak"
```

### B. 半回朔：只還原盤面、保留測試結構

若只想退回 **某欄位**（例如 `liunian`），在 **`lifebookCanonicalTestChart.ts`** 用註解標記「與某某測試綁定」，再改回並重跑 **§變更後的標準流程**。

### C. 檢查清單（紅燈時）

| 現象 | 可能原因 |
|------|----------|
| 流年飛出 ≠ 4 條 | 缺 **文昌**（丙科）或其它四化星不在 `starByPalace` |
| 飛出宮不是疾厄 | `liunian.branch` 與 `palace` 衝突（見上） |
| overlay JSON／Chart 不一致 | `normalizeChart` 與 raw JSON 星曜分類不同；檢查 **主星／輔星** 分類 |
| 敘事快照大變但盤只小改 | 預期內；請對 **夫妻／子女** 等改星逐段閱讀 |

## 何時仍用「微型 fixture」

以下情況可 **不** 用 canonical，另建 **極小 JSON** 於單一測試檔內，並在檔首註解 **目的**：

- 只測 **空盤**、**單邊**、**無效輸入**。
- 必須固定 **亥／子** 等不同地支的 **索引數學**（如 `findZiweiPalaceSlotIndexForCanonical`）。

目前 **normalize／slot 索引** 類測試仍可能保留 **亥** 小盤**，與本 canonical **並存**，屬預期。

## 相關指令

```bash
cd worker && npx vitest run
cd worker && npm run gen:canonical-md
```

---

*本文件與 `LIFEBOOK_CANONICAL_TEST_CHART_JSON` 同步維護；變更盤面規則時請更新本頁。*
