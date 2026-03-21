# Phase 5B-15：buildSihuaFlowBlock 命中與回傳除錯報告

## 任務一：Debug 已加入

在 `buildSihuaFlowBlock` 內對 **兄弟宮**、**夫妻宮** 印出：

- `natalFlowItems.length`
- `matchedInFlows`（JSON）
- `matchedOutFlows`（JSON）
- `builtLines`（JSON）
- `finalReturn`（先存成變數 `finalReturnValue` 再 return）

## 任務二：Match / push 邏輯檢查

- **飛入**：對 `matchedInFlows` 做 `lines.push(\`來自【${fromDisplay}】的${star}化${e.transform}飛入本宮。\`)`，無過濾。
- **飛出**：對 `matchedOutFlows` 做 `lines.push(...)`，無過濾。
- **starName 為空**：使用 `e.starName ?? "星"`，不會因空而跳過，不會過濾掉。
- 無其他 if 會讓命中的 flow 不寫進 `lines`；僅有 `lines.length >= maxTotal` 時停止再 push（最多 4 條）。

## 任務三：Fallback 是否覆蓋非空 lines

Return 邏輯為：

```ts
const finalReturnValue = lines.length > 0 ? lines.join("\n") : SIHUA_FLOW_BLOCK_EMPTY_MESSAGE;
return finalReturnValue;
```

測試結果：**夫妻宮** 的 `lines.length` 為 4，`finalReturn` 為多行字串，**不會**被 fallback 覆蓋。

## 任務四：若 finalReturn 非空但畫面仍 fallback

若 `buildSihuaFlowBlock("夫妻宮", findings)` 的 `finalReturn` 有內容但畫面仍是 fallback，表示問題在 **render 路徑**：

1. **map.palaceSihuaFlowBlock**：在 `getPlaceholderMapFromContext` 中設為 `buildSihuaFlowBlock(palaceName, findingsForPalace)`；若 `opts?.findings` 為空或未傳，則 `findingsForPalace` 會是空 findings，導致 `natalFlowItems` 為空、回傳 fallback。
2. **resolveSkeletonPlaceholders**：用 `\{([^}]+)\}` 取出 key（如 `palaceSihuaFlowBlock`），以 `map[key.trim()]` 替換；skeleton 中為 `{palaceSihuaFlowBlock}`，key 一致。
3. **section.structure_analysis**：reader 路徑由 `getPalaceSectionReaderOverrides` 產出 `resolvedStructureAnalysis`，內含 `resolveSkeletonPlaceholders(sectionSkeleton.structure_analysis, placeholderMap, ...)`；Phase 5B-11 已在單章／batch 最終組裝前強制用 `overrides.resolvedStructureAnalysis` 覆寫，避免被 AI 或舊 merge 蓋掉。

結論：**buildSihuaFlowBlock 本身會正確組出字串**；若畫面上仍是 fallback，應檢查 **reader 路徑是否傳入帶有 `natalFlowItems` 的 findings**（即 `buildP2FindingsAndContext` 是否有被呼叫且 findings 有傳進 `getPlaceholderMapFromContext`）。

---

## 回報內容（夫妻宮）

### 1. 夫妻宮的 matchedInFlows

```json
[
  { "fromPalace": "命宮", "toPalace": "夫妻宮", "starName": "巨門", "transform": "祿" },
  { "fromPalace": "命宮", "toPalace": "夫妻宮", "starName": "太陽", "transform": "權" },
  { "fromPalace": "夫妻宮", "toPalace": "夫妻宮", "starName": "巨門", "transform": "權" },
  { "fromPalace": "子女宮", "toPalace": "夫妻宮", "starName": "太陽", "transform": "忌" },
  { "fromPalace": "遷移宮", "toPalace": "夫妻宮", "starName": "巨門", "transform": "忌" },
  { "fromPalace": "田宅宮", "toPalace": "夫妻宮", "starName": "太陽", "transform": "祿" },
  { "fromPalace": "福德宮", "toPalace": "夫妻宮", "starName": "巨門", "transform": "祿" },
  { "fromPalace": "福德宮", "toPalace": "夫妻宮", "starName": "太陽", "transform": "權" }
]
```

### 2. 夫妻宮的 matchedOutFlows

```json
[
  { "fromPalace": "夫妻宮", "toPalace": "遷移宮", "starName": "破軍", "transform": "祿" },
  { "fromPalace": "夫妻宮", "toPalace": "夫妻宮", "starName": "巨門", "transform": "權" }
]
```

### 3. 夫妻宮的 builtLines

```json
[
  "來自【命宮】的巨門化祿飛入本宮。",
  "來自【命宮】的太陽化權飛入本宮。",
  "來自【夫妻宮】的巨門化權飛入本宮。",
  "來自【子女宮】的太陽化忌飛入本宮。"
]
```

### 4. 夫妻宮的 finalReturn

```
來自【命宮】的巨門化祿飛入本宮。
來自【命宮】的太陽化權飛入本宮。
來自【夫妻宮】的巨門化權飛入本宮。
來自【子女宮】的太陽化忌飛入本宮。
```

### 5. 是 builder 沒組出字串，還是 render 沒吃到？

**是 render 沒吃到（或上游沒給 findings）。**  
在測試環境下，只要 `findings.natalFlowItems` 有 31 筆，`buildSihuaFlowBlock("夫妻宮", findings)` 會回傳上述 4 行內容，不會回傳 fallback。若實際畫面上【宮干飛化】仍為 fallback，應檢查：

- 該次請求的 12 宮 section 是否走 reader 路徑（`getPalaceSectionReaderOverrides`）。
- 該路徑是否帶入 `buildP2FindingsAndContext(chart)` 的 findings（含 `natalFlowItems`）給 `getPlaceholderMapFromContext`。
- 是否有舊快取或 AI 回傳覆寫了 `structure_analysis`（Phase 5B-11 的強制覆寫應已防止此情況）。
