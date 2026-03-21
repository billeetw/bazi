# 【動態引動與根因】區塊：邏輯、組成與資料來源

本文件說明 12 宮 section 中「【動態引動與根因】」區塊的邏輯、組成與資料來源。當此區塊顯示「（本宮目前無特殊四化能量引動，宜平穩發揮星曜本質。）」時，代表**沒有命中本宮的四化落宮與本命宮干飛化資料**，或**上游 Findings 未提供資料**。

---

## 一、區塊在畫面上的位置與模板

- **位置**：每個宮位 section（s02 命宮、s01 兄弟、s05 子女… s14 父母）的 **structure_analysis** 中，四個主區塊的第三塊。
- **模板**（`worker/content/lifebookSection-zh-TW.json`）：
  ```text
  【動態引動與根因】
  {palaceSihuaSummaryBlock}
  ```
  即：標題固定，內容由 placeholder **`palaceSihuaSummaryBlock`** 替換。

---

## 二、邏輯與組成（誰產出 palaceSihuaSummaryBlock）

### 2.1 讀者路徑（正式命書）

1. 請求進來後先得到 **Findings**：`p2 = buildP2FindingsAndContext(chartJson)`，`findings = p2.findings`。
2. 對 12 宮 section 呼叫 **`getPalaceSectionReaderOverrides(sectionKey, chartJson, config, content, locale, findings)`**。
3. 內部用 **`getPlaceholderMapFromContext(ctx, { ..., findings })`** 建出 placeholder map，其中：
   - **命宮**：`palaceSihuaSummaryBlock = buildMingGongSihuaPlacementOnly(findings)`
   - **其餘 11 宮**：`palaceSihuaSummaryBlock = map.sihuaFlowSummary || SIHUA_FLOW_EMPTY_MESSAGE`  
     而 `map.sihuaFlowSummary = buildSihuaFlowSummary({ currentPalace: ctx.palaceName, findings })`
4. 用 **`resolveSkeletonPlaceholders(sectionSkeleton.structure_analysis, placeholderMap)`** 把模板裡的 `{palaceSihuaSummaryBlock}` 換成上面算出的字串，得到 **resolvedStructureAnalysis**。
5. API 回傳的 section 的 **structure_analysis** 使用這份 **resolvedStructureAnalysis**（即整段已解析，含【動態引動與根因】）。

因此：  
- **邏輯上**：【動態引動與根因】的內容 = 該宮的 **palaceSihuaSummaryBlock**。  
- **組成**：  
  - 命宮：只來自「四化落宮」（見下 3.1）。  
  - 其餘 11 宮：來自「四化落宮」+「本命宮干飛化」（見下 3.2）。

---

## 三、內容由誰產出（Builder）

### 3.1 命宮（s02）

- **函式**：`buildMingGongSihuaPlacementOnly(findings)`（`lifeBookPrompts.ts`）
- **只讀**：`findings.sihuaPlacementItems`
- **規則**：篩選 `targetPalace === "命宮"`（經 `toPalaceDisplayName` 正規化後比對）。
- **有資料時**：每筆一句「本宮受到{本命|大限|流年}的{星名}化{祿|權|科|忌}引動。」
- **無資料時**：回傳固定句 **`SIHUA_FLOW_EMPTY_MESSAGE`**：「（本宮目前無特殊四化能量引動，宜平穩發揮星曜本質。）」

### 3.2 其餘 11 宮（s01, s05～s14）

- **函式**：`buildSihuaFlowSummary({ currentPalace, findings })`（`lifeBookPrompts.ts`）
- **讀取**：
  - `findings.sihuaPlacementItems`（四化落宮）
  - `findings.natalFlowItems`（本命宮干飛化，from→to）
- **規則**：
  - **四化落宮**：篩選 `item.targetPalace === 本宮`（正規化後）。
  - **本命宮干飛化**：篩選 `e.fromPalace === 本宮` 或 `e.toPalace === 本宮`（正規化後）。
- **有資料時**：
  - 落宮：同上「本宮受到{層級}的{星}化{化}引動。」
  - 飛出本宮：「本宮宮干化出{星}化{化}，飛入並牽動了【{目標宮}】。」
  - 飛入本宮：「來自【{來源宮}】的{星}化{化}飛入本宮，帶來直接影響。」
- **兩類都沒有時**：回傳 **`SIHUA_FLOW_EMPTY_MESSAGE`**（同上固定句）。

---

## 四、資料來源（Findings 從哪來）

【動態引動與根因】**只讀 LifebookFindings**，不直接讀 chart。兩類資料來源如下。

### 4.1 四化落宮：`findings.sihuaPlacementItems`

| 項目 | 說明 |
|------|------|
| **寫入時機** | 在 **index.ts** 的 **`buildP2FindingsAndContext(chartJson)`** 中，於 `buildLifebookFindingsFromChartAndContent` 之後補寫：`result.findings.sihuaPlacementItems = getSihuaPlacementItemsFromChart(chartJson)` |
| **產出函式** | **`getSihuaPlacementItemsFromChart(chartJson)`**（`lifeBookPrompts.ts`） |
| **底層資料** | **`buildSiHuaLayers(chartJson)`**：從 chart 讀本命／大限／流年三層，每層的祿、權、科、忌對應的星與**落宮**（`palaceName` / `palaceKey`） |
| **結構** | `SihuaPlacementItem[]`：`{ layer: "natal"|"decade"|"year", transform: "祿"|"權"|"科"|"忌", starName, targetPalace }` |
| **過濾** | 會排除 `palaceName` 含「待核」「未知」或為空者 |

也就是說：**chart 必須能提供本命／大限／流年各層的祿權科忌落宮**，`sihuaPlacementItems` 才會有資料；否則該陣列為空，落宮類句子都不會出現。

### 4.2 本命宮干飛化：`findings.natalFlowItems`

| 項目 | 說明 |
|------|------|
| **寫入時機** | 在 **lifebook/findings/buildLifebookFindings.ts** 的 **`buildLifebookFindings(input)`** 中：`chart = input.normalizedChart`，`natalFlows = chart.natal?.flows ?? chart.natal?.birthTransforms ?? chart.natalTransforms`，再 `f.natalFlowItems = natalFlows.map(...)` |
| **產出來源** | **NormalizedChart**：`normalizeChart(chartJson)` 產出；其中 **`chart.natal.flows`** 由 **`gongGanFlowsToTransformEdges(buildGongGanFlows(...))`** 產出（`normalizeChart.ts` + `gonggan-flows.ts`） |
| **所需 chart 資料** | **宮干表** `palaceStemMap`（每宮天干）、**星曜落宮** `starsByPalace`（查某星在哪一宮）。若缺其一，`buildGongGanFlows` 無法產出完整 from→to，`natal.flows` 會空或不全 |
| **結構** | `NatalFlowItem[]`：`{ fromPalace, toPalace, starName?, transform: "祿"|"權"|"科"|"忌" }` |

也就是說：**chart 必須能建出 `palaceStemMap` 與星曜落宮**，normalize 後才會有 `natal.flows`，進而才有 `natalFlowItems`；否則本命宮干飛化句都不會出現。

---

## 五、為何會「都沒資料」、只看到固定句

當畫面上【動態引動與根因】整段都是：

- 「（本宮目前無特殊四化能量引動，宜平穩發揮星曜本質。）」

代表 **該宮** 的 `palaceSihuaSummaryBlock` 被設成了 **`SIHUA_FLOW_EMPTY_MESSAGE`**，也就是：

- **命宮**：`buildMingGongSihuaPlacementOnly` 篩選後沒有 `targetPalace === "命宮"` 的落宮。
- **其餘 11 宮**：`buildSihuaFlowSummary` 篩選後沒有「落宮命中本宮」且沒有「from 或 to 命中本宮」的 flow。

可能原因可對照下面檢查：

| 情況 | 可能原因 | 建議檢查 |
|------|----------|----------|
| 所有宮都空白 | **findings 沒傳進 reader**（例如 `p2.findings` 為 null，改用 `createEmptyFindings()`） | 確認 `buildP2FindingsAndContext(chartJson)` 是否成功、是否有把 `p2.findings` 傳給 `getPalaceSectionReaderOverrides` |
| 所有宮都空白 | **sihuaPlacementItems 與 natalFlowItems 都為空** | chart 是否含本命／大限／流年四化落宮？是否含可建 `palaceStemMap` 與星曜落宮的結構？ |
| 僅部分宮有內容 | 該宮剛好有落宮或飛化命中，其餘宮沒有 | 屬正常：只有「與本宮直接相關」的才會顯示 |
| 模組二有【本命宮干飛化】但 12 宮區塊沒字 | 模組二可能用不同資料路徑（例如直接讀 chart 或 overlap），而 12 宮區塊只讀 **findings.natalFlowItems** | 確認 `buildLifebookFindings` 是否產出 `natalFlowItems`（即 `normalizeChart` 是否產出 `natal.flows`） |

若要快速確認「是否有資料進到 builder」，可看 **Phase 5B-7 debug**（子女宮、夫妻宮、父母宮）的 console log：`[buildSihuaFlowSummary Phase5B-7]` 會印出 `findings.natalFlowItems.length`、`findings.sihuaPlacementItems.length`、`matchedPlacementItems`、`matchedNatalFlowItems`、`outputIsEmpty`，即可判斷是「全盤沒資料」還是「有資料但該宮沒命中」。

---

## 六、流程總覽（簡圖）

```text
chart_json (API 請求)
    │
    ├─► buildP2FindingsAndContext(chartJson)
    │       ├─► buildLifebookFindingsFromChartAndContent → findings（含 natalFlowItems）
    │       └─► getSihuaPlacementItemsFromChart(chartJson) → 寫入 findings.sihuaPlacementItems
    │
    └─► 12 宮 section 組裝（讀者路徑）
            getPalaceSectionReaderOverrides(sectionKey, chartJson, ..., findings)
                buildPalaceContext → ctx.palaceName
                getPlaceholderMapFromContext(ctx, { findings })
                    ├─ 命宮：palaceSihuaSummaryBlock = buildMingGongSihuaPlacementOnly(findings)
                    └─ 他宮：palaceSihuaSummaryBlock = buildSihuaFlowSummary({ currentPalace: ctx.palaceName, findings })
                resolveSkeletonPlaceholders(structure_analysis, placeholderMap) → resolvedStructureAnalysis
            ► 回傳 section.structure_analysis = resolvedStructureAnalysis
```

【動態引動與根因】區塊 = 上述 **resolvedStructureAnalysis** 中對應「【動態引動與根因】\n\n{palaceSihuaSummaryBlock}」的那一段，其內容完全由 **findings.sihuaPlacementItems** 與 **findings.natalFlowItems** 經上述 builder 產出；若兩者對該宮皆無命中，則顯示固定空白句。
