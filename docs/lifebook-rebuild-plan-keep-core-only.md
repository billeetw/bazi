# 命書重做計畫：只保留命主・身主・身宮・12 宮・星曜解釋

目標：**只留** 身主、命主、身宮、12 宮位、星曜解釋；其餘章節與相關程式全部清除或重做，避免混亂與錯誤算法。

---

## 一、保留範圍（Core）

| 項目 | 章節 | 內容 | 資料來源 |
|------|------|------|----------|
| 命主 | s04 | 命主星名 + 一句解釋（destinyStarCore） | chart.ziwei → config.masterStars.命主；content 或 sentence library |
| 身主 | s04 | 身主星名 + 一句解釋（bodyStarCore） | chart.ziwei → config.masterStars.身主；sentence library |
| 身宮 | s04 | 身宮宮位 + 解釋（bodyPalaceCore、bodyPalaceFocusBlock）、命身是否同步 | chart.ziwei → config.bodyPalaceInfo；sentence library |
| 12 宮位 | s01, s02, s05～s14 | 每宮：宮位概述、核心特質、星曜在本宮表現、三方四正、星曜組合、建議 | chart（各宮主星／星曜）；content（各宮語句庫）；必要時輕量推論 |
| 星曜解釋 | 同上 | 各宮內「星曜在本宮表現」「星曜組合」等 | 星曜 × 宮位 的語句庫或組句邏輯 |

**新的章節順序建議**（僅此 13 段）：

1. **s04** — 命主・身主・身宮（你為這具身體準備了什麼）
2. **s02** — 命宮  
3. **s10** — 財帛宮  
4. **s01** — 福德宮  
5. **s05** — 父母宮  
6. **s06** — 兄弟宮  
7. **s07** — 僕役宮  
8. **s08** — 官祿宮  
9. **s09** — 田宅宮  
10. **s11** — 疾厄宮  
11. **s12** — 遷移宮  
12. **s13** — 夫妻宮  
13. **s14** — 子女宮  

（s03、s00、s15～s21 不再產出，或改為「本章重做中」一句）

---

## 二、要移除或停用的章節與功能

| 章節 | 標題 | 說明 |
|------|------|------|
| s00 | 靈魂行前簡報 | 四化人格、主戰場、核心槓桿、連鎖反應、今年怎麼走等 → 整段移除 |
| s03 | 命盤結構 | 主線劇本、星曜群性、四化慣性、能量流動、強弱宮、實戰指南等 → 整段移除 |
| s15 | 十年節奏（大限） | 時間軸、大限／流年四化、核心功課、關鍵年份等 → 整段移除 |
| s15a | 人生時間軸 | 已併入 s15，移除 |
| s16 | 今年主線與心理濾鏡 | 流年命宮／四化、年度分數等 → 移除 |
| s17～s21 | 十年×年度、盲點、行動策略、三盤疊加、靈魂總結 | 全部移除 |

**一併移除的「功能／算法」**（易錯或與上列章節強綁定）：

- 大限／流年四化計算與顯示（sihuaTimeBuilders、timeAxis、currentDecadeSihuaLine、flowYearSihuaLine 等）
- 四化飛星技術版與解釋（collectAllFourTransformsForLayer、decadalFourTransformBlocks、flowYearSihuaFlyBlock 等）
- LifebookFindings 整條線（buildLifebookFindingsFromChartAndContent、assembleS15/S18/S20、findingsSelectors、time module from findings）
- 模組二注入（injectTimeModuleDataIntoSection、assembleTimeModuleFromFindings）
- s00 專用：archetype、s00 敘事、四化人格、主戰場、穿透式診斷、今年建議（buildS00EventsFromChart、s00PatternEngine、s00Pipeline、patternHitRenderer 等）
- s03 專用：整盤結構、三方四正摘要、四化慣性、強弱宮、loopSummary（buildS03GlobalContext、assembleRiskProfile、resolveAssembleSnippets 等）
- overlap 分析依賴（overlapAnalysis / overlap 當作「唯一真相」的邏輯；若 12 宮只用 ziwei 主星可考慮不再讀 overlap）
- 小限／流年宮位表（若不再做流年章節）
- V2 reason（reasonFromChart、stackSignals、timeWindowScores、eventProbabilities、buildS15aMapFromV2、buildS16MapFromV2）— 若只保留核心可整包移除

---

## 三、建議執行步驟（分階段、可逆）

### Phase 1：只改「章節清單 + 模板」，不砍程式（可逆）

1. **改 SECTION_ORDER**  
   - 檔案：`worker/src/lifeBookTemplates.ts`  
   - 新順序只保留：`["s04", "s02", "s10", "s01", "s05", "s06", "s07", "s08", "s09", "s11", "s12", "s13", "s14"]`  
   - 暫時不刪 s00/s03/s15 等 key，可從 SECTION_TEMPLATES 裡拿掉或標記 deprecated。

2. **改 lifebookSection-zh-TW.json**  
   - 保留 s04 與 s01, s02, s05～s14 的 `structure_analysis`（及 behavior_pattern / blind_spots / strategic_advice 若需要）。  
   - s00、s03、s15、s15a、s16、s17、s18、s19、s20、s21：  
     - 選項 A：改為一句「本章重做中，敬請期待。」  
     - 選項 B：直接從 JSON 移除這些 key，並在 index 產生命書時跳過這些 section_key。

3. **產生命書時跳過已移除章節**  
   - 在 `index.ts` 組 section 的迴圈裡，若 `sectionKey` 不在新 SECTION_ORDER，則不產出該段或產出固定一句。

4. **驗收**  
   - 跑一版命書：只應出現 s04 + 12 宮，其餘不出現或顯示「本章重做中」。

這樣可以先把「書長什麼樣」收斂到你要的範圍，再動程式。

---

### Phase 2：從「入口」切掉對移除章節的呼叫（可逆）

1. **index.ts**  
   - 不再呼叫 `buildP2FindingsAndContext`、`injectTimeModuleDataIntoSection`（或僅在 sectionKey 屬於時間模組時才呼叫，而新 SECTION_ORDER 已無時間模組，等同不呼叫）。  
   - 產生命書的迴圈只遍歷新的 SECTION_ORDER；getSectionTechnicalBlocks / resolve 只處理 s04 與 12 宮。

2. **getSectionTechnicalBlocks**  
   - 僅在 sectionKey 為 s04 或 PALACE_SECTION_KEYS 時組裝技術區塊；s00、s03、s15～s21 分支可刪或改為 early return。

3. **getPlaceholderMapFromContext**  
   - 只保留 `opts.sectionKey === "s04"` 與「PALACE_SECTION_KEYS 含 12 宮」的邏輯；  
   - 刪掉或註解：s00 專用（lifeArchetypeBlock、s00MainNarrative、s00PiercingDiagnosisBlock、s00YearlyAdvice 等）、s03 專用、TIME_MODULE_SECTION_KEYS 整塊（大限／流年、decadalFourTransform、flowYear 等）。

4. **驗收**  
   - 再跑一版命書，確認 s04 + 12 宮內容正常，且沒有任何 s00/s03/s15 等段落或 placeholder 被填。

---

### Phase 3：刪除或搬離「僅供已移除章節」的程式（需測試）

依賴關係較單純、可整包移除或改為 stub 的模組建議如下（實際刪前建議用搜尋確認無被 core 引用）：

| 類型 | 路徑／模組 | 說明 |
|------|------------|------|
| 時間軸／大限流年 | `lifebook/sihuaTimeBuilders.ts` | 大限／流年四化、timeAxis、flowYear 命宮 |
| 時間軸 | `lifeBookPrompts.ts` 內 buildSihuaTimeBlocksFromChart、injectTimeModuleDataIntoSection、collectAllFourTransformsForLayer、buildFourTransformBlocksForPalace、flowYear* / decadal* 相關 | 可整段刪或移到 deprecated 檔 |
| Findings | `lifebook/findings/`（buildLifebookFindings、assembleS15/S18/S20、assembleTimeModuleFromFindings、findingsSelectors） | 模組二與 s00/s03 依賴 |
| 組裝 | `lifebook/assemblers/assembleS15.ts`、assembleS18、assembleS20 | 僅時間模組 |
| s00 | `lifebook/s00*.ts`、s00Pipeline、s00PatternEngine、s00FourTransformRules、archetypeModel、s00DetectorsV2、patternHitRenderer（僅 s00 部分） | 靈魂簡報、四化人格、主戰場 |
| s03 | `lifeBookPrompts.ts` 內 buildS03GlobalContext、buildPiercingDiagnosticBundle（若僅 s00/s03 用） | 整盤結構 |
| 診斷／張力 | diagnosticEngine、tensionEngine、rootCauseEngine、reframingEngine、diagnosticTypes | 若只被 s00/s03 用可刪 |
| overlap／時間 | `lifebook/engines/` 下 crossChart、keyYear、signals、palaceInference（若 12 宮不依賴）、v2/reason、v2/assembler（buildS15a/S16） | 依實際 12 宮是否還用 overlap 決定刪或留 |
| 決策／小限 | timeDecisionEngine、decisionEngine、formatXiaoXianDecisionTimeline 等 | 流年／決策用 |

**保留但精簡**：

- **chartToAssembleInput / buildAssembleInput**：若 12 宮仍需要「各宮主星」與基本星曜列表，保留；可砍掉只給 s00/s03 用的欄位。
- **lifeBookPrompts**：保留 getPlaceholderMapFromContext 的 s04 區塊與 12 宮區塊；保留 resolveSkeletonPlaceholders、getSectionTechnicalBlocks 中對 s04 與 PALACE_SECTION_KEYS 的處理。
- **index.ts**：保留命主／身主／身宮的組裝（getMasterStarsFromZiwei、getBodyPalaceFromZiwei、lifeBookConfig.masterStars / bodyPalaceInfo）、保留 12 宮的 content 與 chart 傳遞。

---

### Phase 4：內容與資料精簡

1. **content**  
   - 保留：命主／身主／身宮相關（如 lifeLord-bodyLord-zh-TW.json、bodyPalace 相關）、12 宮各宮語句庫（starPalacesMain、各 *GongSentenceLibrary）。  
   - 可移出或刪：僅供 s00/s03/s15～s21 的模板與語句。

2. **config / slice_types**  
   - 新 SECTION_ORDER 只有 s04 + 12 宮，slice_types 可只留 ziwei（與 12 宮、命主身主身宮所需）；overlap、sihua、fourTransform 等可改為選用或之後重做再接。

---

## 四、保留用的最小檔案清單（對照用）

以下為「只做命主・身主・身宮・12 宮・星曜解釋」時，**預期會用到的檔案**（其餘可視為待刪或待重做）：

- **Schema／基礎**：`lifebook/schema.ts`、`palace-map.ts`、`star-map.ts`（宮位與星曜 ID）
- **Chart → 輸入**：`lifebook/chartToAssembleInput.ts`（buildAssembleInput / starByPalace）、`lifebook/normalize/normalizeChart.ts`（若仍用 normalizedChart）
- **s04**：`lifebook/s04StrategyIntegrated.ts`、`lifebook/destinyBodyDialogue.ts`、`lifebook/bodyPalaceAlignment.ts`、`lifebook/destinyStarSentenceLibrary.ts`、`lifebook/bodyStarSentenceLibrary.ts`、`lifebook/bodyPalaceSentenceLibrary.ts`、content（命主／身主／身宮）
- **12 宮 + 星曜**：`lifeBookPrompts.ts`（getPlaceholderMapFromContext 的 palace 區塊、resolveSkeletonPlaceholders）、各宮 sentence library、`lifebook/starNarrativeForPalace.ts` 或等同「星曜在該宮表現」的組句
- **組裝入口**：`lifeBookTemplates.ts`（新 SECTION_ORDER、SECTION_TEMPLATES 僅 s04 + 12 宮）、`index.ts`（只遍歷新章節、只呼叫 s04/12 宮所需邏輯）
- **模板**：`lifebookSection-zh-TW.json`（僅 s04 + s01,s02,s05～s14）

---

## 五、建議的「怎麼開始」（一句話）

1. **先做 Phase 1**：改 `SECTION_ORDER` 與 `lifebookSection-zh-TW.json`，讓命書只產出 s04 + 12 宮，其餘章節改為「本章重做中」或直接不產出。  
2. **再做 Phase 2**：在 index 與 getPlaceholderMapFromContext / getSectionTechnicalBlocks 裡，切掉對 s00、s03、s15～s21 的依賴與呼叫。  
3. **最後做 Phase 3**：依「僅供已移除章節」清單，逐模組刪除或移到 deprecated，並跑測試確認 s04 + 12 宮仍正常。

這樣可以**先收斂產出、再清程式**，每一步都可單獨驗收、必要時可逆。

若你願意，下一步可以從 Phase 1 的具體 diff（SECTION_ORDER + lifebookSection-zh-TW.json 的改動）開始，我依你現有檔案幫你寫出精確的修改版。
