# 命書文案生成語句資產盤點

盤點範圍：lifebook / prompts / narrative 相關檔案、V2（stackSignals）文案、舊 overlap 輸出、各章節模板（s15/s16/s17/s18）、hardcode 中文描述句。

---

## 一、可重用（Reusable）

條件：客觀描述、可對應結構（宮位/四化/flow）、不依賴 overlap 舊資料。

| text | source | usage |
|------|--------|--------|
| `{star}化{transform}，自{fromPalace}飛入{toPalace}` | worker/src/lifebook/palaceOverlay.ts (formatOverlayFlow) | S17 疊宮、任意 from/to flow 顯示 |
| `本命星曜：{stars}` / `大限飛入：` / `流年飛出：` 等固定欄位標題 | worker/src/lifebook/palaceOverlay.ts (formatPalaceOverlayBlock) | S17 每宮五欄結構化 |
| `【疊宮事件訊號】`、`【財運】`、`傾向：偏順（score=…）`、`原因：…`、`涉及宮位：…`、`機會較強：…`、`壓力較強：…` | worker/src/lifebook/s18/eventSignals.ts (formatEventSignalsForSection, CATEGORY_LABEL) | S18 Phase 1 四類 + keyPalaces |
| `祿入{宮}，代表…`、`權入{宮}…`、`忌入{宮}…`（每宮每四化一句） | worker/content/transformIntoPalaceMeanings.json | 四化×宮位、可對應 flow toPalace |
| `自{from}出、飛入{to}，代表…`（宮對宮路徑） | worker/content/flyPathMeanings.json | 飛星路徑解釋、對應 from/to |
| `{star}_lu/quan/ke/ji` 對應的 text（星+四化一句） | worker/content/starTransformMeanings.json | getStarTransformMeaning、大限/流年飛星解釋 |
| `{palace} 被 {layers} 同時點亮`、`證據：{layers} 四化皆入 {palace}`、`{star}化忌：壓力源頭在 {fromPalace}，但事件會在 {toPalace} 爆出來` | worker/content/narrativeCorpus-zh-TW.json、worker/src/lifebook/patternPhraseLibrary.ts | s00 語氣、規則 R01～R12；變數 palace/star/fromPalace/toPalace/layers |
| `這十年大限落在{宮}，代表…`（theme + narrative） | worker/content/decadalPalaceThemes.json | s15 大限主題、currentDecadalTheme |
| 壓力年/修正年/收成年/推進年 的 role + why + takeaway | worker/src/lifebook/timeModulePlaceholders.ts (getYearRoleInDecadeAndWhy, getRoleTakeaway) | s16 今年角色、不依 overlap |
| `今年流年命宮在{flowYearMingPalace}`、`四化：…` | lifeBookPrompts（組 s16 摘要） | s16 技術版、可對應 flow 公式 |
| 星曜語義 core/plain/themes、宮位語義 core/short、四化語義 core/advice | worker/src/lifebook/starSemanticDictionary.ts | buildFlyStarExplanation、任意星/宮/四化組句 |
| `{star}化{label}自{from}宮飛入{to}宮，` + 星象徵 + 化X帶來 + 代表…能量流向… | worker/src/lifebook/transformInterpretationEngine.ts (buildFlyStarExplanation) | s15/s16 飛星解釋、純公式 flow |
| `不是每一年都一樣重要，以下標出這段時間裡的地雷區、機會區與震盪區，供你安排節奏。` | lifeBookPrompts.ts (keyYearsIntro) | s15/s16 關鍵年區塊開場 |
| decadalMainLineEnergyHumanized：來自 decadalPalaceThemes.narrative | lifeBookPrompts.ts + decadalPalaceThemes.json | 大限主題一句、可對應大限宮位 |
| `{palace}：{theme}（{stackType}）` | worker/src/lifebook/v2/assembler/buildS15aMapFromV2.ts (blocksFromStackSignals) | V2 s15a 每條訊號一行；可對應 stackSignals 結構 |
| `劇烈震盪/吉凶並見：N 個宮位；超級地雷區：N 個宮位；大發財機會：N 個宮位`、`大限 X～Y 歲：財富… 事業… 壓力…`、`{year} 年：財富… 事業… 壓力…` | buildS15aMapFromV2 (overlapSummary、timelineSummaryFromScores) | V2 摘要與時間表；資料來自 stackSignals/timeWindowScores |

---

## 二、可改寫後重用（Refactorable）

邏輯正確但語氣過於抽象或不夠結構化。

| original | problem | suggestedRewrite |
|----------|---------|-------------------|
| `這十年你要演的主題是「${themeLabel}」。`、`大限四化給你的底色是：…`、`這十年真正要學的，是在壓力與修正點最明顯的地方先穩住…` | 抽象「演」「底色」；可保留邏輯，改為「大限落在{宮}，主題是{theme}；四化…」 | 大限命宮在{decadalPalace}，主題：{theme}。四化：{星祿/權/科/忌}。建議：{一句對應忌/祿的動作}。 |
| `你的舞台與考題會具體落在被四化點亮的宮位；先看清主戰場…` | 「舞台」「考題」較抽象 | 四化飛入的宮位為：{宮位列表}；可優先關注這些領域的資源與壓力。 |
| `你最容易重演的模式，是命盤中反覆被四化引動的宮位與星曜慣性。`、`表面上看是某類事件一再發生，底層其實是同一課還沒畢業…` | 依賴 diagnostic bundle（rootCause/symptomPalace），非純 flow；語氣抽象 | 若保留：改為「壓力常從{sourcePalace}經四化牽動到{symptomPalace}；建議先處理{sourcePalace}。」 |
| `這段時間你最容易誤判的，是以為問題在${rc.symptomPalace}；逃避的，是承認壓力其實從${rc.sourcePalace}溢進來。` | 依賴 rootCause；「誤判」「逃避」較重 | 壓力路徑：{sourcePalace} → {symptomPalace}。建議先檢視{sourcePalace}的狀態，再處理{symptomPalace}。 |
| s19 fallback：`從今天起，先做一件對齊今年主線的小事…`、`一年內，把力氣集中在與今年主線最相關的一兩個領域…` | 泛用、未綁宮位/四化 | 今年主線在{flowYearPalace}，四化{祿權科忌}。建議：{一項與 flow 對應的具體動作}。 |
| s20：`本命給你的，是在關係與互動裡的慣性——怎麼愛、怎麼疏離…` | 抽象、未對應星或宮 | 本命夫妻宮/命宮主星與四化：…；大限在練的：{decadalTheme}；今年流年：{flowYearPalace}。 |
| keyYearsMineLead：`這一年真正危險的，不是表面事件，而是壓力已經累積到會從這個宮位爆出來。` | lifeBookPrompts.ts | 可改為模板：`這一年壓力易從{palace}顯現；建議…` |
| keyYearsWealthLead：`這一年不是平白幸運，而是既有實力終於有了放大的舞台。` | lifeBookPrompts.ts | 抽象「舞台」；可改為「這一年{palace}有資源/機會匯聚，可把握。」 |
| keyYearEngine：`該年小限落此宮，宜保守` / `可把握機會` / `吉凶並見`、`避免重大決策` / `可積極布局` / `謹慎決策` | lifebook/engines/signals/keyYearEngine.ts | 依 note 關鍵字推論；句子泛用。保留邏輯，改為模板：`{year}年小限在{palace}，{signal}；建議{advice}。` |
| 命宮句庫 MING_GONG_CORE / MING_GONG_IMBALANCE | 部分句偏「人生哲學」、未綁星或四化 | 保留可對應「主星+亮度」的句子；其餘改為「命宮主星{star}，…」開頭。 |
| 各宮 SentenceLibrary 的 pickXxx(seed) 輪替句 | 依 seed 隨機取一句，未對應結構 | 改為「依宮位+主星+四化」選句，或標記為 Refactorable：同一 key 多句擇一改為「依規則選一句」。 |

---

## 三、應淘汰（Deprecated）

依賴 overlapAnalysis、舊四化邏輯、或無法對應 from/to flow。

| 項目 | 位置 | 原因 |
|------|------|------|
| buildOverlapDetailBlocks 產出的 shockBlocks / mineBlocks / wealthBlocks 內容 | lifeBookPrompts（已恆回傳空）、原邏輯依 overlap items | 依賴 overlap 舊資料；現已停用，僅保留標題與 V2 路徑 |
| overlap 計數與 overlapSummary 拼接：`劇烈震盪/吉凶並見：${shockCount} 個宮位；超級地雷區：${mineCount}…` 當資料來自 overlap items 時 | lifeBookPrompts（getPlaceholderMapFromContext）、buildS15aMapFromV2 亦有同格式 | 若資料源為 V2 stackSignals 則可保留標題與格式；若仍從 overlap 讀取計數則 Deprecated |
| 舊疊宮單一項：`化忌：${item.jiCount} 重 \| 化祿：${item.luCount} 重`、`四化統計：化忌…／化祿…` | lifeBookPrompts（buildOverlapDetailBlocks 相關、已清空） | 來自 overlap item 重數，無法對應公式 flow |
| 任何依 `overlapAnalysis.items[].transformations` 或 `overlap.items` 產出的敘事句 | 已刪除的 flattenLegacyTransformations、collectAllFourTransformsForLayer、getAllOverlapTransformations 等 | 已報廢，僅列為 Deprecated 提醒勿再接回 |
| s15a 技術版「⚡ 劇烈震盪／吉凶並見」「⚠️ 超級地雷區」「✨ 大發財機會」**內容**來自 buildOverlapDetailBlocks 時 | getSectionTechnicalBlocks、injectTimeModuleDataIntoSection | buildOverlapDetailBlocks 已恆回傳空，故實際內容現僅來自 V2；標題字串可保留，舊 overlap 路徑屬 Deprecated |

---

## 四、特別標記

### A. 模板型語句（優先保留）

| 語句 / 模式 | 來源 | 備註 |
|-------------|------|------|
| `{palace} 被 {layers} 同時點亮`、`{layers} 四化皆入 {palace}` | narrativeCorpus-zh-TW.json、patternPhraseLibrary | 變數明確，可直接作 narrativeTemplates |
| `{star}化{transform}自{fromPalace}飛入{toPalace}` | palaceOverlay.formatOverlayFlow、transformInterpretationEngine.buildFlyStarExplanation | 已用於 S17 / s15 飛星解釋 |
| `祿入{宮}，代表…`、`忌入{宮}…` | transformIntoPalaceMeanings.json | key = 四化_宮位，可擴充為模板 |
| `自{from}出、飛入{to}，代表…` | flyPathMeanings.json | key = from_to，可擴充 |
| `{star}化忌：壓力源頭在 {fromPalace}，但事件會在 {toPalace} 爆出來` | patternPhraseLibrary R11 | 可對應 flow from/to |
| `{宮位}出現資源流入`、`機會較強：{宮位列表}`、`壓力較強：{宮位列表}` | s18 formatEventSignalsForSection、eventSignals keyPalaces | 結構化，可作 S18 narrativeTemplates |

### B. 分類語句庫（可直接升級為 narrativeTemplates）

| 類型 | 來源 | 說明 |
|------|------|------|
| 財運/事業/感情/遷移 四類標籤與一句傾向 | s18/eventSignals.ts CATEGORY_LABEL、formatEventSignalsForSection | 已有 category → 標題 + score/intensity/reasons；可擴為每類多句 narrativeTemplates |
| 星×四化一句 | starTransformMeanings.json | 鍵 = 星_lu/quan/ke/ji，可直接作 narrativeTemplates.wealth/career/… 的「星化X」句 |
| 四化×宮位一句 | transformIntoPalaceMeanings.json | 鍵 = lu/quan/ke/ji_宮位，可作「X入Y宮」narrativeTemplates |
| 宮對宮路徑一句 | flyPathMeanings.json | 鍵 = from_to，可作「飛星路徑」narrativeTemplates |
| s00 同星/同宮/祿忌同星/同宮/權忌科忌/十年流年同步等 | narrativeCorpus-zh-TW.json、patternPhraseLibrary LIB | openers/explainers/advisers 已分組，可對應規則 R01～R12 作 narrativeTemplates |
| 大限主題一句（每宮） | decadalPalaceThemes.json | theme + narrative，可作「大限在{宮}」narrativeTemplates |
| 今年角色一句（壓力年/修正年/收成年/推進年） | timeModulePlaceholders.ts | 可作「流年角色」narrativeTemplates |

### C. 隨機生成語句（高風險）

| 位置 | 說明 |
|------|------|
| mingGongSentenceLibrary：pickMingGongCore(seed)、pickMingGongImbalance(seed) | 依 seed 取陣列中一句，同一命盤不同次可能不同句 → 高風險 |
| bodyPalaceSentenceLibrary、bodyStarSentenceLibrary、destinyStarSentenceLibrary：pickXxx(starName, seed) | 同上，依 seed 輪替 → 高風險 |
| 各宮 XxxGongSentenceLibrary：pickXxx(seed) | 兄弟/父母/疾厄/僕役/遷移/子女/田宅/福德/夫妻/官祿/財帛 等句庫皆用 seed 取一句 → 高風險 |
| patternPhraseLibrary：messageTemplates/actionTemplates/evidenceTemplates 多句擇一 | 若上層用隨機選一句則高風險；若改為「依規則/證據選一句」則可降風險 |
| narrativeCorpus-zh-TW.json：openers/explainers/advisers 陣列 | 若前端或組裝時隨機取則高風險；應改為依 hit 類型與變數選一句 |
| brightnessNarrative | 亮度敘事若依 seed 輪替 → 高風險 |

---

## 五、輸出總結

### 1. 可直接轉為 narrativeTemplates 的語句清單

- **飛星結構**：`{star}化{transform}，自{fromPalace}飛入{toPalace}`（palaceOverlay、S17）。
- **四化×宮**：transformIntoPalaceMeanings.json 全表（祿/權/科/忌 × 12 宮）。
- **路徑**：flyPathMeanings.json 全表（from_to → 一句）。
- **星×四化**：starTransformMeanings.json 全表（星_lu/quan/ke/ji）。
- **s00 規則句**：narrativeCorpus-zh-TW.json + patternPhraseLibrary 之 message/action/evidence（變數：palace, star, layers, fromPalace, toPalace, transform, target, evidenceText）。
- **大限**：decadalPalaceThemes.json（theme + narrative）。
- **流年角色**：timeModulePlaceholders getYearRoleInDecadeAndWhy / getRoleTakeaway（壓力年/修正年/收成年/推進年）。
- **S18 四類**：formatEventSignalsForSection 之標題與「傾向/原因/涉及宮位/機會較強/壓力較強」結構；CATEGORY_LABEL（財運/事業/感情/遷移）。
- **星曜/宮位/四化語義**：starSemanticDictionary（core/plain/themes/risk/advice）、getPalaceSemantic、getTransformSemantic → 用於組句模板變數。

### 2. 建議刪除或不再擴充的模組／檔案

- **已停用邏輯**：buildOverlapDetailBlocks 本體（已恆回傳空）、getAllOverlapTransformations、collectFourTransformsForPalace、buildTransformEdgesFromOverlap / getTransformsByLayer（已刪）。勿再接回 overlap 產出的 shock/mine/wealth **內容**。
- **僅標題可保留**：s15a「劇烈震盪/吉凶並見」「超級地雷區」「大發財機會」等標題與格式可保留，但內容只應來自 V2 stackSignals 或未來 S18 擴充，不應再從 overlap 計數組句。
- **不建議再擴充**：依 overlap 計數或 overlap items 的舊 summary 拼接邏輯；任何依 `overlapAnalysis.items` 的敘事產出。

### 3. 是否存在「多套語氣風格衝突」

- **存在**。  
  - **客觀結構化**：S17 疊宮（純欄位）、S18 訊號（score/intensity/reasons）、flyPathMeanings/transformIntoPalace/starTransformMeanings（一句一鍵）、patternPhraseLibrary 的 evidence 句。  
  - **命書口吻**：decadalPalaceThemes 的 narrative、timeModulePlaceholders 的 why/takeaway、s15「這十年你要演的主題」、recurringHomeworkNarrative、blindSpotsDecadalNarrative、buildFlyStarExplanation 的「因此…」。  
  - **句庫輪替**：各宮 SentenceLibrary、MING_GONG_CORE、narrativeCorpus openers/explainers/advisers 多句擇一。  
- **衝突點**：同一章節內混用「結構化列點」與「一段式命書口吻」、或同一概念有時用「演/底色/舞台」有時用「四化飛入{宮}」會造成語氣不統一。  
- **建議**：將「可對應結構」的語句收斂為 narrativeTemplates（變數明確）；命書口吻句集中標記為「語氣層」，與「資料層」分離，並盡量用同一套變數（宮位/星/四化/from/to）驅動，以減少風格混雜。

---

## 六、檔案索引（命書文案相關）

| 檔案 | 性質 |
|------|------|
| worker/content/narrativeCorpus-zh-TW.json | 模板型（s00 同星/同宮/祿忌等） |
| worker/content/decadalPalaceThemes.json | 大限主題（可重用） |
| worker/content/starTransformMeanings.json | 星×四化（可重用） |
| worker/content/transformIntoPalaceMeanings.json | 四化×宮（可重用） |
| worker/content/flyPathMeanings.json | 宮對宮路徑（可重用） |
| worker/src/lifebook/patternPhraseLibrary.ts | 規則 R01～R12 模板（可重用，注意隨機風險） |
| worker/src/lifebook/timeModulePlaceholders.ts | 流年角色（可重用） |
| worker/src/lifebook/transformInterpretationEngine.ts | buildFlyStarExplanation、getStarTransformMeaning（可重用） |
| worker/src/lifebook/starSemanticDictionary.ts | 星/宮/四化語義（可重用） |
| worker/src/lifebook/palaceOverlay.ts | S17 格式（可重用） |
| worker/src/lifebook/s18/eventSignals.ts | S18 訊號與區塊格式（可重用） |
| worker/src/lifebook/mingGongSentenceLibrary.ts | 命宮句庫（可改寫；隨機取句高風險） |
| worker/src/lifebook/bodyPalaceSentenceLibrary.ts、bodyStarSentenceLibrary.ts、destinyStarSentenceLibrary.ts | 身宮/身主/命主（可改寫；隨機高風險） |
| worker/src/lifebook/*GongSentenceLibrary.ts（各宮） | 各宮句庫（可改寫；隨機高風險） |
| worker/src/lifebook/v2/assembler/buildS15aMapFromV2.ts | V2 標題與格式（可保留）；內容來自 stackSignals |
| worker/src/lifeBookPrompts.ts | 大段 s15/s16/s18/s19/s20 硬碼句（部分可改寫、部分可重用） |
| worker/src/lifebook/assemblers/assembleS18.ts | s18BlindSpotLine/BodyLine/AdviceLine fallback（可改寫） |

以上為命書文案生成語句資產盤點與分類；**只做盤點與分類**，未改動程式邏輯。
