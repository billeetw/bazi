# 命書章節 ↔ Placeholder 清單與語句庫索引

供組裝指令、D1 覆寫與擴充時對照，避免漏改或命名不一致。

---

## 一、章節 ↔ Placeholder 對照

### s00（這一局，你為什麼要來？）

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `benMingSiHuaList` | structure_analysis | 本命四化列表 |
| `daXianSiHuaList` | structure_analysis | 大限四化列表 |
| `liuNianSiHuaList` | structure_analysis | 流年四化列表 |
| `s00HotStars` | structure_analysis | 重點星曜（多層命中） |
| `s00HotPalaces` | structure_analysis | 重點宮位（多層命中） |
| `lifeArchetypeBlock` | structure_analysis | 人生主題／Archetype 區塊 |
| `s00MainNarrative` | structure_analysis | 全盤結構判讀主文 |
| `s00DominantPalaces` | structure_analysis | 命盤主戰場 |
| `s00YearlyAdvice` | structure_analysis | 今年行動方向 |

程式有填值但骨架未用：`s00PatternBlock`、`s00GlobalHighlights`、`s00NarrativeBlocks`、`s00DebugEvidence`、`s00HotSummary`、`s00PatternNarrative`、`s00PatternActions`。

---

### s02（命宮，解盤式敘事，僅 s02 使用）

**s02 專用模板**：你是帶著什麼狀態上場 → 主星定調 → 優勢與慣性 → 三方四正如何牽動 → 四化如何觸發 → 最容易失衡 → 成熟後如何運用

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `mingGongStarOpening` | structure_analysis | 主星人格上場方式（句庫 opening） |
| `palaceCoreDefinition` | structure_analysis | 命宮核心定義（pickMingGongCore） |
| `mainStarsLeadBlock` | structure_analysis | 主星定調 1/2 星一句 |
| `mingGongStarStrength` | structure_analysis | 主星優勢（句庫 strength） |
| `assistantStarsNarrative` | structure_analysis | 輔星整合一句（getMingGongAssistantNarrative） |
| `mingGongSanfangInsight` | structure_analysis | 三方四正洞察（getMingGongSanfangInsight） |
| `mingGongTransformNarrative` | structure_analysis | 四化觸發（本命→大限→流年→主星本身四化） |
| `sihuaNarrativeBlock` | structure_analysis | 四化區塊或 fallback |
| `mingGongStarTension` | structure_analysis | 最容易失衡（句庫 tension） |
| `mingGongStarMature` | structure_analysis | 成熟後如何運用（句庫 mature） |
| `palaceGlobalLinkHints` | strategic_advice | 全盤關聯提示 |
| `palaceSiHuaHints` | strategic_advice | 四化提示 |

---

### s01、s05～s14（其餘宮位，12 宮共用敘事型 structure_analysis）

**敘事型六段（共用）：** 上場方式 → 主星定調 → 優勢與慣性 → 三方四正與四化牽動 → 最容易失衡的方式 → 成熟後如何運用

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `palaceOpeningBlock` | structure_analysis | 上場方式：宮位核心＋人格（= palaceCoreDefinition ＋ mainStarSystemBlock，s08/s10 有後者） |
| `mainStarsLeadBlock` | structure_analysis | 主星定調：最多 1–2 顆主星＋亮度，一句 |
| `assistantStarsNarrative` | structure_analysis | 優勢與慣性：輔星＋煞星整合一句（不逐顆展開） |
| `sihuaNarrativeBlock` | structure_analysis | 四化牽動：有飛入用原文，無則 fallback |
| `sanFangSiZhengPalaces` | structure_analysis | 三方四正宮位 |
| `palaceRiskSummary` | structure_analysis, strategic_advice | 最容易失衡的方式／風險摘要 |
| `palaceActionAdvice` | structure_analysis, strategic_advice | 成熟後如何運用／行動建議 |
| `mainStarsSummary` | behavior_pattern | 本宮主星摘要 |
| `palaceName` | behavior_pattern, blind_spots, strategic_advice | 宮名 |
| `palaceGlobalLinkHints` | strategic_advice | 全盤關聯提示 |
| `palaceSiHuaHints` | strategic_advice | 四化提示 |

s02 專用 placeholder（mingGongStarOpening、mingGongStarStrength、mingGongStarTension、mingGongStarMature、mingGongSanfangInsight、mingGongTransformNarrative）在非 s02 時為空，僅 s02 模板使用。

---

### s03（命盤結構：主線 × 星曜群性 × 四化慣性）

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `wholeChartMainlineBlock` | structure_analysis | 全盤主線劇本 |
| `starGroupStatsBlock` | structure_analysis | 星曜能量節奏區塊 |
| `siHuaPatternTopBlocks` | structure_analysis | 四化慣性 Top 判讀 |
| `sihuaTopFlowsBlock` | structure_analysis | 四化流向區塊 |
| `loopSummaryBlock` | structure_analysis | 能量環摘要 |
| `starClusterBehaviorSummary` | behavior_pattern | 節奏切換描述 |
| `starEnergySummary` | behavior_pattern, blind_spots, strategic_advice | 星曜能量摘要 |
| `sihuaMapping` | blind_spots | 四化飛宮對照 |
| `weakPalace` | strategic_advice | 需補強宮位 |
| `strongPalace` | strategic_advice | 易發揮宮位 |

---

### s04（命主／身主／身宮）

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `lifeLordName` | structure_analysis, behavior_pattern | 命主名 |
| `lifeLordText` | structure_analysis | 命主說明 |
| `bodyLordName` | structure_analysis | 身主名 |
| `bodyLordText` | structure_analysis | 身主說明 |
| `bodyPalaceName` | structure_analysis, behavior_pattern, strategic_advice | 身宮宮名 |
| `bodyPalaceInterpretation` | structure_analysis | 身宮詮釋 |
| `lifeBodyRelationBlock` | structure_analysis, blind_spots | 命身關係 |

---

### s15（十年大限）

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `decadalLimitsList` | structure_analysis | 十年大限一覽 |
| `decadalMainLineEnergy` | structure_analysis | 十年主線能量 |

---

### s15a（疊宮／小限）

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `xiaoXianTimelineTable` | structure_analysis | 小限年份一覽表 |
| `shockCount` | structure_analysis | 劇烈震盪數量 |
| `mineCount` | structure_analysis | 超級地雷數量 |
| `wealthCount` | structure_analysis | 大發財機會數量 |
| `xiaoXianShockBlocks` | structure_analysis | 劇烈震盪區塊 |
| `xiaoXianMineBlocks` | structure_analysis | 超級地雷區塊 |
| `xiaoXianWealthBlocks` | structure_analysis | 大發財機會區塊 |
| `xiaoXianDecisionTimeline` | structure_analysis | 決策建議時間軸 |

---

### s16（流年）

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `flowYear` | structure_analysis, behavior_pattern, blind_spots, strategic_advice | 流年年份 |
| `xiaoXianPalaceName` | structure_analysis | 小限落宮 |
| `yearlyFourTransformBlocks` | structure_analysis | 流年四化區塊 |
| `yearlyFourTransformSummary` | structure_analysis | 年度主題摘要 |
| `yearDecisionSummaryBlock` | structure_analysis | 今年決策建議 |

---

### s17（十年 × 年度交叉）

| Placeholder | 欄位 | 說明 |
|-------------|------|------|
| `xiaoXianTimelineTable` | structure_analysis | 小限年限表 |
| `shockCount`, `mineCount`, `wealthCount` | structure_analysis | 同 s15a |
| `xiaoXianShockBlocks`, `xiaoXianMineBlocks`, `xiaoXianWealthBlocks` | structure_analysis | 同 s15a |
| `overlapDataMissingNotice` | structure_analysis | 疊宮資料缺件提示 |

---

### s18～s21（盲點／策略／總結）

s18～s21 多為固定敘事，較少動態 placeholder；若由 D1 覆寫整欄則以 `lifebookSection.{sectionKey}.{field}` 為準。

---

## 二、語句庫索引（程式內常數／模板）

| 檔案 | 內容 | 用途 |
|------|------|------|
| `worker/src/lifebook/starSemanticDictionary.ts` | `PALACE_SEMANTIC_DICTIONARY`（含 `plain`/`core`/`short`） | 宮位語義、Flow 括號、主戰場評語前綴 |
| `worker/src/lifebook/dominantPalaceDetector.ts` | `PALACE_TAG_COMMENT`、`PALACE_TAG_PAIR_COMMENT`、`PALACE_TAG_TRIPLE_COMMENT` | 主戰場宮位評語（單 tag／雙 tag／三 tag） |
| `worker/src/lifebook/patternHitRenderer.ts` | `STAR_PALACE_BRIDGE_TEMPLATES`（星\|宮 → 橋接句） | 四化慣性星×宮橋接句 |
| `worker/src/lifebook/starPalaceTransformMatrix.ts` | `STAR_PALACE_TRANSFORM_MATRIX`（星×宮×四化 → 判讀句） | 四化慣性優先判讀 |
| `worker/src/lifebook/sihuaFlowEngine.ts` | `PALACE_FLOW_TEMPLATES`、`LOOP_TEMPLATE_2`、`LOOP_TEMPLATE_3PLUS` | 四化流向與能量環文案 |
| `worker/src/lifebook/archetypeModel.ts` | `LIFE_ARCHETYPES`、`detectLifeArchetype`、`formatLifeArchetypeBlock` | 人生主題區塊（s00） |
| `worker/src/lifebook/rhythmEngineV2.ts` | 節奏四段敘事（segment1～4） | s03 行為模式／盲點／策略摘要 |
| `worker/content/narrativeCorpus-zh-TW.json` | `s00` → ruleKey → openers/explainers/advisers | 全盤結構判讀命理師語氣句 |
| `worker/src/lifebook/patternPhraseLibraryRuleTypes.ts` | ruleType → message/action/evidence 模板（含 `palaceCore`） | 四化模組一判讀句與證據 |

---

## 三、Placeholder 命名約定（簡要）

- 全小寫 + 駝峰：`palaceName`、`s00HotStars`。
- 章節前綴：`s00*`、`decadal*`、`yearly*`、`xiaoXian*` 表章節或資料來源。
- 區塊後綴：`*Block`、`*Summary`、`*List` 表多句或列表。
- 宮位相關：`palace*`、`*Palace`、`*Palaces`；語義用 `palaceCore`、`palaceCoreDefinition`。

詳見 `docs/lifebook-content-convention.md`。
