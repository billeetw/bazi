# 10 ruleType 句庫 ＋ 星曜群性統計引擎：可行性與實作摘要

## 一、10 個 ruleType 句庫（完整整理）

已實作於 **worker/src/lifebook/patternPhraseLibraryRuleTypes.ts**，可直接給 Cursor / 前端 / DB 使用。

| ruleType Id | 標籤 | message 數 | action 數 | evidence 數 |
|-------------|------|------------|-----------|-------------|
| lu_overlap_palace | 同宮祿疊加（資源集中） | 3 | 3 | 2 |
| ji_overlap_palace | 同宮忌疊加（高壓區） | 3 | 3 | 2 |
| lu_ji_same_palace | 祿忌同宮（機會×壓力） | 3 | 3 | 2 |
| lu_ji_same_star | 同星祿忌（人格拉扯） | 3 | 3 | 2 |
| decade_year_sync | 十年×流年同步 | 3 | 3 | 2 |
| quan_ji_same_point | 權忌同點（壓力型責任） | 3 | 3 | 2 |
| ke_resolve_ji | 科解忌（修復能力） | 3 | 3 | 2 |
| lu_into_palace | 祿入宮（資源流入） | 3 | 3 | 2 |
| ji_out_palace | 忌出宮（壓力來源） | 3 | 3 | 2 |
| multi_palace_link | 多宮連動（事件鏈） | 3 | 3 | 2 |

- **Placeholder**：`{palace}` `{palaceA}` `{palaceB}` `{fromPalace}` `{star}` `{star1}` `{star2}` `{layer1}` `{layer2}`，渲染時替換。
- **AI 渲染版**：不含數值、risk、ruleId；技術版可另帶 ruleType id。

---

## 二、星曜群性統計引擎

### 1. 星曜群性分類資料庫

**worker/src/lifebook/starPersonalityMap.ts** — `STAR_PERSONALITY_MAP`（星名 → 標籤陣列）

- **六類**：動星、智星、穩星、權星、財星、情緒星（一星可屬多類）
- **主星 14**：七殺/破軍/貪狼(動)、天機/巨門/天梁(智)、武曲/天府/天相(穩)、紫微/廉貞/太陽(權)、太陰/天同(情緒)、武曲/天府/太陰(財) 等
- **輔星**：文昌/文曲(智)、左輔/右弼(穩)、天魁/天鉞(權)、祿存(財)、天馬(動)

### 2. 統計算法

- **calculateStarGroupStats(starNames: string[])**  
  輸入全盤星名，輸出 `{ 動星, 智星, 穩星, 權星, 財星, 情緒星, totalStars }`。  
  多標籤全加（例：武曲 → 穩星+1、財星+1）。

### 3. 判讀規則

- **主導**：某類 > 30%（以 totalStars 為分母）
- **次要**：20%～30%
- **極端**：> 45%
- **缺乏**：< 10%
- **getTopTwoGroups(stats)**：依 count 降序取前 2 群，供模組一只輸出 Top 2。

### 4. 命書句庫（六類主導）

**worker/src/lifebook/starGroupNarrative.ts** — 動星／智星／穩星／權星／財星／情緒星 主導時：

- 每類 **3 個 message**、**3 個 action**
- **buildStarEnergyRhythmBlock(starNames, patternPalace?)**：產出【星曜能量節奏】整段（統計 + Top 2 群 + message + action）；若有 `patternPalace` 則追加一句與四化串聯。

### 5. 模組一使用方式

- **s03 模組一**：`starGroupStatsBlock` 改由 **buildStarEnergyRhythmBlock** 產出。
- 輸出內容：
  - 你的命盤星曜分布：動星 n、智星 n、穩星 n、權星 n、財星 n、情緒星 n
  - 其中 X 比例最高 → message + action
  - （可選）你的命盤偏 X 型，而今年的四化又點亮 Y 宮，代表……
  - 次之：第二群 message + action
- **只輸出 Top 2 群**，每群只講一次；不含 ruleId／數值標籤（AI 版）。

---

## 三、檔案清單

| 檔案 | 說明 |
|------|------|
| worker/src/lifebook/patternPhraseLibraryRuleTypes.ts | 10 ruleType 句庫（TS 常數 + getPhraseSetByRuleType） |
| worker/src/lifebook/starPersonalityMap.ts | STAR_PERSONALITY_MAP、calculateStarGroupStats、getTopTwoGroups、判讀占比 |
| worker/src/lifebook/starGroupNarrative.ts | 六類主導 message/action、buildStarEnergyRhythmBlock、與 pattern 串聯 |
| worker/src/lifebook/index.ts | 匯出上述模組 |
| worker/src/lifeBookPrompts.ts | buildWholeChartContext 改為使用 buildStarEnergyRhythmBlock + 六類統計；validateModuleOneOutput 接受【星曜能量節奏】 |

---

## 四、與 patternHits 串聯

- 模組一在產出【星曜能量節奏】時，若第一條 pattern hit 有宮位（evidence.toPalace 或 palace），則傳入 **patternPalace**，在 Top 1 群敘述後追加：  
  「你的命盤偏{行動/思考/穩定/責任/資源/感受}型，而今年的四化又點亮{宮位}，代表很多機會來自實際行動與布局。」

---

## 五、JSON / DB 使用建議

- **10 ruleType**：可從 `PATTERN_PHRASE_LIBRARY_BY_RULE_TYPE` 用 `JSON.stringify` 產出 JSON，或對應成 DB 表（rule_type_id, label, message_templates[], action_templates[], evidence_templates[]）。
- **星曜群性**：`STAR_PERSONALITY_MAP` 可匯出為 JSON；統計與判讀為純函式，不需存表。
