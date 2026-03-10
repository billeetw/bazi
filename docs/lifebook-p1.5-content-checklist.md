# P1.5 補資料清單 v1 — 執行摘要

僅補 content 與 schema，不碰 engine。目標：CCL3 + 規則表 + signals 能穩定支撐 P2。

---

## 一、CCL3 星曜四張表

| 表名 | 變更 | 筆數 |
|------|------|------|
| **star_tags** | 第一批 16 顆（紫微～文曲）+ 第二批 15 顆（左輔～天傷） | 31 |
| **star_psychology** | 第一批 16 + 第二批 5（左輔、右弼、祿存、擎羊、陀羅） | 21 |
| **star_stress_patterns** | 9 顆壓力星 + 補充 3（擎羊、陀羅、咸池） | 12 |
| **star_life_lessons** | 12 顆 + 補充 5（祿存、擎羊、陀羅、地空、地劫） | 17 |

- 欄位與用途依你提供的 schema（element, archetype, psychologyTags, stressTags, bodyTags, shockWeight / egoCore, shadow, defenseMechanism, growthLesson / patternName, innerState, outerState, bodySignals / lesson, shadowPattern）。
- 檔案位置：`worker/content/ccl3/*.json`。

---

## 二、cross_chart_rules

- **R1 壓力外溢**：保留既有 3 條（官祿→夫妻、財帛→福德、父母→疾厄）。
- **R2 安全感轉譯**：保留 2 條 + 新增 田宅→子女（`R2_security_translate_creation`）。
- **R3 過度補償**：新增 1 條，`trigger`: `{ "samePalace": true, "hasTransforms": ["祿","忌"] }`。
- **R4 relationship_displacement**：新增 1 條，`trigger`: `{ "transform": "忌", "sourceGroup": "pressure", "targetGroup": "relationship" }`。
- `meta.triggerTypes` 已註明三種 trigger 型別（R1/R2 具體宮位、R3 同宮祿忌、R4 宮位群組），供 P2 engine 比對用。

---

## 三、risk_signals 與 mapping

- **overlap mapping**（寫在 `meta.overlapMapping`）：  
  `criticalRisks` → red，`maxOpportunities` → green，`volatileAmbivalences` → yellow。
- **decisionMatrix mapping**（寫在 `meta.decisionMatrixMapping`）：  
  `avoid` → red，`caution` → yellow，`encourage` → green。
- 既有 4 筆 signal 保留，其中一筆改為使用 `trigger.source: "overlap.criticalRisks"` 範例；P2 可由 overlap / decisionMatrix 產出 signal 時對照此 schema。

---

## 四、star_combinations（新表）

- 新檔：`worker/content/ccl3/star-combinations.json`。
- Schema：`comboId`, `stars`, `patternType`, `patternName`, `psychology`, `lifePattern`, `bodySignals`（選）, `narrativeHint`（選）, `shockLevel`。
- **patternType**：personality | mind | expression | strategy | wealth | stress | relationship | desire。
- 首批 15 組：紫微天府、紫微七殺、天機巨門、廉貞貪狼、天機文昌、巨門文曲、廉貞文昌、武曲祿存、七殺祿存、紫微鈴星、巨門鈴星、七殺火星、破軍地劫、太陰咸池、貪狼天姚。
- Layer 4 新增型別：`StarCombinationFinding`（comboId, palace, patternName, psychology, lifePattern, shockLevel）；`LifebookFindings.starCombinations: StarCombinationFinding[]`；`createEmptyFindings()` 已含 `starCombinations: []`。

---

## 五、P2 使用方式（約定）

- **星曜表**：engine 依宮位主星/輔星/煞星查 `star_tags`、`star_psychology`、`star_stress_patterns`、`star_life_lessons` 組 s04/s18/s21 與疾厄/福德敘事。
- **cross_chart_rules**：依 `triggerType` 分派（edgeMatch / samePalaceTransformMix / groupMatch），命中則寫入 `crossChartFindings`。
- **risk_signals**：依 `sourceType` 選資料來源，依 `trigger.bucket` 或 decision 對照 meta mapping 決定 color，再從 items 選 label/advice。
- **star_combinations**：每宮兩星先依 `meta.canonicalStarOrder` 排序後再查表，命中則寫入 `findings.starCombinations`。

---

## 六、P2 開工前三項約定（schema 正規化）

1. **star_combinations 星序正規化**  
   - `stars` 欄位只接受一種順序（例：`["紫微","鈴星"]`，不接受 `["鈴星","紫微"]`）。  
   - `meta.canonicalStarOrder` 已寫死；查表前 engine 須將宮內兩星依此序排序後再比對，避免漏命中。

2. **cross_chart_rules trigger 辨識**  
   - 每筆規則皆有 `triggerType` 辨識：`edgeMatch`（fromPalace + toPalace）、`samePalaceTransformMix`（同宮祿忌）、`groupMatch`（sourceGroup + targetGroup）。  
   - P2 matcher 依 `triggerType` 分派比對邏輯即可。

3. **risk_signals 來源與條件分離**  
   - `sourceType`：資料來源（`overlap` | `decisionMatrix` | `keyYear`）。  
   - `trigger`：邏輯條件（如 `bucket`, `palace`, `jiCount`）；overlap 用 `bucket`（criticalRisks / maxOpportunities / volatileAmbivalences），不再把 source 寫在 trigger 裡。  
   - 同一 signal 若可由不同來源命中，可拆成多筆或由 engine 依 sourceType 組裝。

---

## 七、未在 P1.5 執行的項目

- Engine 邏輯（含 starCombinationEngine、rootCause 改查表）：留待 P2。
- 其他星曜或組合的擴充：可依同一 schema 後續追加。
