# 模組二：組合流程與算法對照（逐段核對用）

本文件把「模組二組合」與「各段算法」拆開，方便一段一段核對資料來源與計算邏輯。

---

## 一、模組二組合流程總覽

### 1.1 入口與兩條路徑

- **入口**：`index.ts` 產生命書時，對 `sectionKey ∈ { s15, s15a, s16, s17, s18, s19, s20, s21 }` 呼叫  
  `injectTimeModuleDataIntoSection(sectionKey, structureAnalysisFinal, chartForGenerate, content, config, locale, injectOpts)`  
  其中 `injectOpts` 含 `findings`、`timeContext`、`findingsV2`（來自同一次的 `buildP2FindingsAndContext(chartForGenerate)`）。

- **路徑分支**（在 `injectTimeModuleDataIntoSection` 內）：
  - **P2 路徑**：`options?.findings && (options.findings.timeAxis != null || options.findings.sihuaPlacement != null)` 為真時：
    - `map = assembleTimeModuleFromFindings(options.findings, options.timeContext)`
    - 再用 `findings.timeAxis` 覆寫：`birthSihuaLine`, `currentDecadalPalace`, `currentDecadeSihuaLine`, `flowYearMingPalace`, `flowYearSihuaLine`, `flowYearSihuaNote`, `flowYearSihuaFlyBlock`, `flowYearSihuaFlyExplanations`
    - `sihuaFallByPalaceBlock` / `sihuaEnergyFocusBlock` / `natalGongganFlowBlock` 來自 `findings.sihuaPlacement` / `sihuaEnergy` / `natalFlows`
    - **其餘 s15 敘事**（核心功課、主戰場、關鍵年份、行動建議等）來自 `assembleS15(findings)`，即 selectors 從 findings 選出來的文字。
  - **相容路徑**（無 findings 或無 timeAxis）：
    - `display = buildTimeModuleDisplayFromChartJson(chartJson)`，再 `map = getPlaceholderMapFromContext(null, { chartJson, sectionKey, ... })`
    - 時間軸與流年四化／飛星一律用 `display` 與 chart 計算結果覆寫到 `map`；s15 敘事由 `getPlaceholderMapFromContext` 內用 chart + content 計算。

結論：**正式命書（有 findings）時，時間軸與大限／流年四化只來自 `findings.timeAxis`，而 `findings.timeAxis` 是在「產出 findings 的那一次」由 `buildSihuaTimeBlocksFromChart(chart)` 寫入。** 若當時的 `chart` 沒有正確的大限四化（例如沒有 `decadalLimits[].mutagenStars` 且沒有 `fourTransformations.decadal`），時間軸就會錯。

### 1.2 timeAxis 的寫入時機（P2）

- 在 `index.ts` 的 `buildP2FindingsAndContext(chartJson)` 裡：
  1. `result = buildLifebookFindingsFromChartAndContent({ chartJson, content })`
  2. `sihuaTime = buildSihuaTimeBlocksFromChart(chartJson)`
  3. `result.findings.timeAxis = sihuaTime.timeAxis`

因此 **timeAxis 與 findings 一定來自同一個 `chartJson`**。若實際命書仍顯示錯的大限四化，可能原因：
- 寫入 DB 的 findings 是較早版本，當時 chart 沒有大限四化欄位；或
- 命書組裝時用的 `chartForGenerate` 與寫入 findings 時用的 chart 不是同一份；或
- 上游 API 組的 chart 沒有填 `decadalLimits[].mutagenStars` / `fourTransformations.decadal`。

### 1.3 【四化飛星技術版】與解釋的來源（與 P2 無關）

- 【四化飛星技術版】和「大限四條飛星解釋」**不是**在 `injectTimeModuleDataIntoSection` 裡填的。
- 它們是在 **getSectionTechnicalBlocks** 裡，用 `placeholderMap` 組出來的：
  - `placeholderMap = getPlaceholderMapFromContext(ctx, { chartJson, sectionKey, content, config, contentLocale, findings, findingsV2 })`
  - 這裡**一律用 `chartJson` 計算**，不會用 `findings.timeAxis`。
  - s15：`decadalFourTransformBlocks`、`decadalFourTransformExplanations` 來自 `getPlaceholderMapFromContext` 內對 `chartJson` 的 `collectAllFourTransformsForLayer(chartJson, "decadal")` 與 `buildFlyStarExplanation(...)`。

因此：**時間軸（含目前大限四化）** 來自 findings；**四化飛星技術版與解釋** 來自當次傳入的 chart。若兩者不同源，可能出現「時間軸寫流年四化、技術版卻寫大限四化」的不一致。

---

## 二、s15 模板與 placeholder 逐段對照

模板來自 `worker/content/lifebookSection-zh-TW.json` 的 `s15.structure_analysis`。替換時機：**injectTimeModuleDataIntoSection** 的 `resolveSkeletonPlaceholders(structureAnalysis, map, …)`（P2 用 findings 組的 map，相容用 chart 組的 map）。

| 段落／區塊 | 模板 placeholder | 資料來源（P2） | 資料來源（相容） | 算法／備註 |
|------------|------------------|----------------|------------------|------------|
| 時間軸校對總覽 | `{birthSihuaLine}` | `findings.timeAxis.birthSihuaLine` | `display.birthSihuaLine` | 見 §3.1 |
| 同上 | `{currentDecadalPalace}` | `findings.timeAxis.currentDecadalPalace` | `display.currentDecadalPalace` | 見 §3.2 |
| 同上 | `{currentDecadeSihuaLine}` | `findings.timeAxis.currentDecadeSihuaLine` | `display.currentDecadeSihuaLine` | **大限四化**，見 §3.3 |
| 同上 | `{flowYearMingPalace}` | `findings.timeAxis.flowYearMingPalace` | `display.flowYearMingPalace` | 見 §3.4 |
| 同上 | `{flowYearSihuaLine}` | `findings.timeAxis.flowYearSihuaLine` | `display.flowYearSihuaLine` | **流年四化**，見 §3.5 |
| 同上 | `{flowYearSihuaNote}` | `findings.timeAxis.flowYearSihuaNote` | 同大限=流年時註記 | 同天干時「大限與流年四化相同」 |
| 同上 | `{flowYearSihuaFlyBlock}` | `findings.timeAxis.flowYearSihuaFlyBlock` | 從 chart 算流年飛星 | 見 §3.6 |
| 同上 | `{flowYearSihuaFlyExplanations}` | `findings.timeAxis.flowYearSihuaFlyExplanations` | 同上，解釋版 | 見 §3.6 |
| 本命／大限／流年四化落宮 | `{sihuaFallByPalaceBlock}` | `findings.sihuaPlacement` | `buildSihuaFallByPalaceBlock(chartJson)` | 若 findings 無則空 |
| 四化能量集中 | `{sihuaEnergyFocusBlock}` | `findings.sihuaEnergy` | `buildSihuaEnergyFocusBlock(chartJson)` | 同上 |
| 本命宮干飛化 | `{natalGongganFlowBlock}` | `findings.natalFlows` | `buildNatalGongganFlowBlock(chartJson)` | 同上 |
| 你正站在哪一個人生章節 | `{currentDecadalPalace}`, `{currentDecadalTheme}` | 同上 + assembleS15 的 theme | getPlaceholderMapFromContext | theme 來自宮位對照表 |
| 這十年的核心功課 | `{currentDecadalHomework}` | **assembleS15** → `decade.coreHomework`（findings） | **getPlaceholderMapFromContext** → 用 **大限** mutagenStars 組句 | 見 §3.7，兩路徑來源不同 |
| 主戰場／次戰場 | `{s15MainBattlefield}`, `{s15SecondaryBattlefield}` | assembleS15(findings) | getPlaceholderMapFromContext（overlap/keyYears） | selectors 選 findings |
| 今年角色 | `{yearRoleInDecade}`, `{yearRoleWhy}` | assembleS15 | getPlaceholderMapFromContext | 同上 |
| 十年×年度交叉 | `{s15TopCrossChartSynthesis}`, `{s15TopCrossChartAdvice}` | assembleS15 | getPlaceholderMapFromContext | 同上 |
| 關鍵年份 | `{mineBlocks}`, `{wealthBlocks}`, `{shockBlocks}` | assembleS15（keyYears） | getPlaceholderMapFromContext | 同上 |
| 重演的功課 | `{recurringHomeworkNarrative}` | assembleS15 | getPlaceholderMapFromContext | 同上 |
| 現在／一年內／這十年 | `{s15ActionNow}`, `{s15ActionOneYear}`, `{s15ActionDecade}` | assembleS15 | getPlaceholderMapFromContext | 同上 |
| 收束 | `{s15ClosingLesson}`, `{s15ClosingNowSee}` | assembleS15 | getPlaceholderMapFromContext | 同上 |

**【四化飛星技術版】與大限四條解釋** 不在上述 template 裡，而是 **getSectionTechnicalBlocks** 的 `underlyingParamsText` 裡附加的，來源是 **getPlaceholderMapFromContext(chartJson)** 的：
- `decadalFourTransformBlocks` → §3.8
- `decadalFourTransformExplanations` → §3.9  

因此 **P2 路徑下，技術版與解釋永遠來自「當次 getSectionTechnicalBlocks 用的 chartJson」**，與 findings 是否為同一份 chart 要看呼叫端是否同源。

---

## 三、各段算法說明（可逐段核對）

### 3.1 生年四化 `birthSihuaLine`

- **檔案**：`worker/src/lifebook/sihuaTimeBuilders.ts`，`buildTimeModuleDisplayFromChartJson`
- **輸入**：`chartJson.fourTransformations.benming.mutagenStars`（或 `chartJson.ziwei.fourTransformations.benming.mutagenStars`）
- **算法**：`fmt(benming.mutagenStars)` → 祿權科忌 依序組「星化祿、星化權、星化科、星化忌」，無則「（無生年四化資料）」

### 3.2 目前大限宮位 `currentDecadalPalace`

- **檔案**：同上
- **輸入**：`chartJson.decadalLimits`（或 ziwei.decadalLimits），`yearlyHoroscope.nominalAge` / `age`，`birthInfo.year` / `bazi.year`
- **算法**：依當前年齡落在哪一檔大限，取該檔的 `palace`；無則「（當前大限）」

### 3.3 目前大限四化 `currentDecadeSihuaLine`（單一真值）

- **檔案**：`worker/src/lifebook/sihuaTimeBuilders.ts`
- **輸入**：
  1. **優先**：`decadalLimits[當前步].mutagenStars`（依當前年齡取到的那一檔）
  2. **缺項時**：`chartJson.fourTransformations.decadal.mutagenStars`
  3. **再缺項**：`overlap` 裡 **僅「大限」層** 的 transformation（不讀 liunian／流年）
- **算法**：`getDecadeSihuaMapFromOverlap(chartJson, decadeMutagenSource)` → 得到 `{ 祿, 權, 科, 忌 }` 對星名，再 `formatDecadeSihuaLineFromMap` 組成一串「星化祿、星化權、…」
- **禁止**：使用 `liunian`、`fourTransformations.liunian`、流年任何欄位

### 3.4 流年命宮 `flowYearMingPalace`

- **檔案**：同上
- **輸入**：`liunian.branch` + `palaceByBranch`（由命宮地支建表），或 `liunian.palace` / `destinyPalace` / `palaceName`
- **算法**：`getFlowYearPalace(liunian.branch, palaceByBranch)` 或直接用 liunian 的宮名字串（補「宮」尾）

### 3.5 流年四化 `flowYearSihuaLine`（單一真值）

- **檔案**：同上
- **輸入**：**僅** `liunian.mutagenStars` 或 `fourTransformations.liunian.mutagenStars`（或 overlap 內 transformations.liunian）
- **禁止**：使用大限、decadalLimits、fourTransformations.decadal

### 3.6 流年四化飛星 block 與解釋

- **檔案**：`lifeBookPrompts.ts` 的 `buildSihuaTimeBlocksFromChart`、`injectTimeModuleDataIntoSection` 相容路徑
- **算法**：`yearlyLines = collectAllFourTransformsForLayer(chartJson, "yearly")` → `buildFourTransformBlocksForPalace(yearlyLines).techBlock`，以及對每條 `buildFlyStarExplanation(starName, type, from, to)` 拼成解釋。  
- **layer**：overlap 裡 `layerLabel === "流年"`（targetKey `"yearly"`）

### 3.7 核心功課 `currentDecadalHomework`

- **P2**：`assembleS15(findings)` → `decade.coreHomework`，來自 selector `selectCurrentDecadeNarrative(findings, chart).coreHomework`。即 **findings 裡已算好的「十年核心功課」文字**，不再用 chart 四化重算。
- **相容**：`getPlaceholderMapFromContext` 內：
  - `firstLimit = getCurrentDecadalLimit(decadalLimits, currentAge)`
  - 大限星來源：`decadalMutagenForDisplay = firstLimit?.mutagenStars ?? ft?.decadal?.mutagenStars`（禁止 liunian）
  - 再用 `getStarTransformMeaning(star, key)` 組「大限四化給你的底色」等句，拼成 `currentDecadalHomework`

若 P2 的 findings 裡 `coreHomework` 當初是用錯的星（例如流年星）算的，就會一直錯；相容路徑則以 chart 的「大限」星為準。

### 3.8 大限四化飛星技術版 `decadalFourTransformBlocks`

- **檔案**：`lifeBookPrompts.ts`，`getPlaceholderMapFromContext`（time-module 區塊）
- **輸入**：`chartJson.overlapAnalysis` / `chartJson.overlap`
- **算法**：`decadalLines = collectAllFourTransformsForLayer(chartJson, "decadal")` → 只保留 `layerLabel === "大限"`，祿權科忌各留一筆 → `buildFourTransformBlocksForPalace(decadalLines).techBlock`
- **格式**：每行「大限：星化X，自X宮出，飛入Y宮」

### 3.9 大限四條飛星解釋 `decadalFourTransformExplanations`

- **檔案**：同上
- **輸入**：與 §3.8 同一份 `decadalLines`
- **算法**：對 `decadalLines` 每一條 `buildFlyStarExplanation(l.starName, l.type, l.fromPalaceName ?? l.fromPalaceKey, l.toPalaceName ?? l.toPalaceKey)`，再 `filter(Boolean).join("\n\n")`
- **一致性**：技術版第 i 條與解釋第 i 段必須對同一筆 `decadalLines[i]`（星+祿權科忌+路徑），否則會出現「技術版寫化祿、解釋寫化科」等錯位。

### 3.10 overlap 結構要求（四化飛星技術版要出四條）

- **新格式**：`overlap.items[]`，每項 `transformations[]` 裡要有 `layerLabel: "大限"` 且 `starName`、`type`（祿/權/科/忌）、`fromPalaceName`、`toPalaceName` 齊全；**祿權科忌各至少一筆**，`collectAllFourTransformsForLayer(..., "decadal")` 會按 type 去重各留一筆。
- **舊格式**：`criticalRisks` / `volatileAmbivalences` / `maxOpportunities` 的 `transformations.decadal` 會被攤平，同樣要能湊齊四種 type。

若 overlap 裡大限只有一筆（例如只有化祿），技術版就只會有一條；解釋也僅對應那一條。

---

## 四、核對清單（逐段用）

1. **時間軸「目前大限」四化**  
   - 看 `findings.timeAxis.currentDecadeSihuaLine` 的來源：是否為 `buildSihuaTimeBlocksFromChart(chart)`，且該 chart 的 `decadalLimits[當前].mutagenStars` 或 `fourTransformations.decadal.mutagenStars` 為大限星（非流年星）。

2. **「核心功課」段落**  
   - P2：看 findings 裡 `coreHomework` 是誰寫的、是否用大限星。  
   - 相容：看 `getPlaceholderMapFromContext` 的 `decadalMutagenForDisplay` 是否為大限來源。

3. **四化飛星技術版只有一條**  
   - 看當次 chart 的 `overlapAnalysis.items[].transformations` 裡 `layerLabel === "大限"` 的筆數與祿權科忌是否齊全。

4. **技術版與解釋不一致（例如第一條寫化祿、解釋寫化科）**  
   - 確認 `decadalFourTransformExplanations` 是對 `decadalLines` 逐條 `buildFlyStarExplanation(l.starName, l.type, ...)`，且沒有打亂順序或混用流年。

5. **本命／大限／流年四化落宮、四化能量集中、本命宮干飛化為空**  
   - P2：看 `findings.sihuaPlacement`、`findings.sihuaEnergy`、`findings.natalFlows` 是否在 `buildSihuaTimeBlocksFromChart` 或別處有寫入。

---

## 五、檔案索引（方便對照程式）

| 用途 | 檔案路徑 |
|------|----------|
| 時間軸五欄位、大限／流年四化單一真值 | `worker/src/lifebook/sihuaTimeBuilders.ts` |
| timeAxis 寫入 findings、P2 組裝 | `worker/src/index.ts`（buildP2FindingsAndContext、inject 呼叫處） |
| 模組二注入、P2 vs 相容分支 | `worker/src/lifeBookPrompts.ts`（injectTimeModuleDataIntoSection） |
| 大限／流年飛星彙整、技術版與解釋 | `worker/src/lifeBookPrompts.ts`（collectAllFourTransformsForLayer、buildFourTransformBlocksForPalace、getPlaceholderMapFromContext 內 decadalFourTransform*） |
| s15 敘事（findings 路徑） | `worker/src/lifebook/assemblers/assembleS15.ts`、`worker/src/lifebook/findings/findingsSelectors.ts` |
| s15 模板 | `worker/content/lifebookSection-zh-TW.json`（s15.structure_analysis） |
| 技術版附加到章節 | `worker/src/lifeBookPrompts.ts`（getSectionTechnicalBlocks，s15 時附加 decadalFourTransformBlocks + decadalFourTransformExplanations） |

以上可依「段落 → placeholder → 來源 → 算法」逐段核對，找出哪一段的資料來源或算法與預期不符。

---

## 六、「若你看到…則檢查…」速查

| 你看到的現象 | 優先檢查 |
|--------------|----------|
| 「目前大限」四化顯示成天同、天機、文昌、廉貞（流年四化） | timeAxis 來源：buildSihuaTimeBlocksFromChart 用的 chart 是否有 decadalLimits[].mutagenStars 或 fourTransformations.decadal；getDecadeSihuaMapFromOverlap 是否誤用 liunian |
| 「核心功課」裡出現天同化祿、文昌化科等流年星 | P2：findings 的 coreHomework 是誰產的、是否用大限星；相容：getPlaceholderMapFromContext 的 mutagenStars 是否為 firstLimit/ft.decadal（非 liunian） |
| 四化飛星技術版只有一條 | chart.overlapAnalysis.items[].transformations 裡 layerLabel===「大限」的條數；collectAllFourTransformsForLayer(..., "decadal") 回傳長度 |
| 技術版寫「廉貞化祿」、解釋寫「廉貞化科」 | decadalLines 與 decadalFourTransformExplanations 是否同一陣列、同順序；buildFlyStarExplanation 的 type 是否與該條的 l.type 一致 |
| 【本命／大限／流年四化落宮】或【四化能量集中】為空 | P2：findings.sihuaPlacement / sihuaEnergy 是否有寫入；buildSihuaTimeBlocksFromChart 是否有呼叫 buildSihuaFallByPalaceBlock / buildSihuaEnergyFocusBlock 並寫入 findings |
| 主戰場、關鍵年份、今年角色、行動建議為空或 generic | assembleS15 的 selectors（selectTopBattlefieldsForS15、selectKeyYearsByLabel、selectCurrentYearRole、selectS15ActionItems 等）在當前 findings 下是否回傳有效值 |
