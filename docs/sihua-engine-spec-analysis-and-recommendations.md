# 四化引擎規格分析與建議

本文分析「四化事件→Pattern→字典→命理敘事→決策」完整引擎規格，並給出實作建議與與現有 worker 的對齊方式。**若 OK，請提供規格中的 7 個資料庫／內容檔**，即可依此實作並通過 6 項必備測試。

---

## 一、規格與現有程式對照

| 規格項目 | 規格要求 | 現有程式（worker） | 建議 |
|----------|----------|---------------------|------|
| **型別** | SiHuaEvent (star, transform 祿/權/科/忌, from/to, layer) | NormalizedSiHuaEvent (transform: lu/quan/ke/ji, starId/starNameZh, from/to, layer) | 保留內部 lu/quan/ke/ji；**字典與主文輸出**才用「祿權科忌」。在 engine 邊界做一層轉換即可。 |
| **Diagnostics** | missingFields, unresolvedPalaceKey, unresolvedStarName | 已有 SiHuaDiagnostics，結構一致 | 直接對齊，必要時補 `raw` 到 missingFields。 |
| **PatternHit** | ruleId, severity, summary, evidence, payload | PatternHitV2（含 title, severity, summary, evidence, payload） | 規格用 severity 數字、我們用 high/medium/low；可保留我們的 severity，必要時做 1:1 映射。 |
| **R01/R02/R03** | 同星疊、同宮祿疊、同宮忌疊 | R01, R02_LU, R02_JI, R03 已實作 | 規格 R02=祿疊、R03=忌疊 與現有 R02_LU/R02_JI 對應；可保留現有 ruleId 或對外統一命名。 |
| **R11** | 飛宮導線 + **causality matrix 查表** | R11 有 summary，**無 matrix 查表** | **新增**：R11 渲染時查 `palace_causality_matrix`，命中用 consultation/advice；未命中用 fallback（不可空白）。 |
| **R30** | 2～3 宮環 | 已實作 2～3 宮環 | 保持。 |
| **去重** | R01→star, R02/R03→toPalace+transform, R11→from+to+transform, R30→loop set | dedupeByCanonicalKey(payload.canonicalKey) | 對齊規格 key；**R11 優先保留有 causality match 的 hit** 需在 merge 階段實作。 |
| **敘事** | 主文禁止 ruleId/raw；debug 必含 ruleId/evidence/diagnostics | renderMainNarrativeMergedByPalace + renderDebugEvidence | 可收斂為單一 generateNarrative pipeline，輸出結構相容現有 s00 placeholder。 |
| **決策** | decisionTags 統計 → top3，每條 ≤2 句 | 無 | **新增** decisionEngine.ts，輸入 events + R11 causality matches，輸出 top 3 建議。 |

---

## 二、檔案樹建議（與現有 repo 整合）

規格中的「Engine」與「Content」建議放在**同一 repo**，以便共用 canonical、型別與測試。

### 2.1 建議目錄（二選一）

**方案 A（推薦）：引擎與內容都進 worker**

- Engine：`worker/src/engine/`（與現有 `worker/src/lifebook/` 並存，之後可讓 s00 pipeline 呼叫 engine）
- Content：`worker/data/` 或 `worker/content/sihua-engine/`
- 優點：共用 `canonicalKeys`、`schema`、現有 normalizer/detector 邏輯可逐步遷移或委派。

**方案 B：專案根目錄獨立 engine**

- Engine：`src/engine/`（專案根下）
- Content：`data/`（專案根下）
- 需在 engine 內**複製或依賴**宮位／星曜 canonical 對照（與 worker 的 schema/canonicalKeys 一致），避免宮位名不一致。

建議採用**方案 A**，路徑對應如下（Content 放 worker 內）：

```
worker/
  src/
    engine/                    # 新：四化引擎
      types.ts
      normalizeSiHuaEvents.ts
      patternDetectors.ts
      patternMerge.ts
      generateNarrative.ts
      decisionEngine.ts
      __tests__/
        normalizeSiHuaEvents.test.ts
        patternDetectors.test.ts
        patternMerge.test.ts
        generateNarrative.test.ts
        decisionEngine.test.ts
    lifebook/                  # 既有：s00 pipeline 可改為呼叫 engine
      canonicalKeys.ts         # 共用
      s00Pipeline.ts
      ...
  data/                        # 新：引擎專用內容（或 content/sihua-engine/）
    star_consultation_dictionary.ts
    star_transform_dictionary.zh-TW.json
    palace_consultation_dictionary.zh-TW.json
    palace_transform_dictionary.zh-TW.json
    palace_causality_matrix.zh-TW.json
    major_patterns.zh-TW.json
    star_combinations.zh-TW.json
```

若你堅持「必備檔案樹」完全符合你給的 `src/engine/` 與 `data/`，也可改為專案根目錄的 `src/engine/` + `data/`，但**宮位／星曜必須與 worker 的 canonical 一致**（見下）。

### 2.2 必備檔案樹（缺一不可）— 對規格清單的勾選

| 類型 | 路徑 | 狀態 |
|------|------|------|
| Engine | src/engine/types.ts | ✅ 依規格實作（可 re-export 或對齊 worker 型別） |
| Engine | src/engine/normalizeSiHuaEvents.ts | ✅ 依規格；可 wrap 或遷移 worker s00Normalizer |
| Engine | src/engine/patternDetectors.ts | ✅ 依規格 R01/R02/R03/R11/R30；可 wrap 或遷移 s00DetectorsV2 |
| Engine | src/engine/patternMerge.ts | ✅ 依規格去重 + R11 優先 causality match |
| Engine | src/engine/generateNarrative.ts | ✅ 敘事總管：events→hits→merge→dictionary→主文+debug |
| Engine | src/engine/decisionEngine.ts | ✅ 決策引擎：decisionTags→top3 |
| Content | data/star_consultation_dictionary.ts | ⏳ **需你提供** |
| Content | data/star_transform_dictionary.zh-TW.json | ⏳ **需你提供** |
| Content | data/palace_consultation_dictionary.zh-TW.json | ⏳ **需你提供** |
| Content | data/palace_transform_dictionary.zh-TW.json | ⏳ **需你提供** |
| Content | data/palace_causality_matrix.zh-TW.json | ⏳ **需你提供** |
| Content | data/major_patterns.zh-TW.json | ⏳ **需你提供** |
| Content | data/star_combinations.zh-TW.json | ⏳ **需你提供** |
| Tests | src/engine/__tests__/*.test.ts（5 檔） | ✅ 依規格 6 項測試撰寫 |

---

## 三、與現有 worker 的對齊要點

1. **宮位 canonical**  
   一律使用與 `worker/src/lifebook/canonicalKeys.ts` 相同的輸出：**命宮、兄弟宮、夫妻宮、子女宮、財帛宮、疾厄宮、遷移宮、僕役宮、官祿宮、田宅宮、福德宮、父母宮**（皆帶「宮」）。  
   你提供的 JSON/TS 內容若用「兄弟」「財帛」等簡稱，loader 內需用 `toPalaceCanonical` 正規化後再查表。

2. **星曜 canonical**  
   與 `toStarName` / schema 的 STAR_ID / 中文名一致（例如：紫微、天機、太陽、武曲、天同、廉貞、天府、太陰、貪狼、巨門、天相、天梁、七殺、破軍）。

3. **transform 對應**  
   - 內部／程式：可維持 `lu | quan | ke | ji`。  
   - 字典與主文：使用「祿」「權」「科」「忌」。  
   - 在「查字典 / 產出主文」的邊界做一層轉換即可，不需改動既有 event 結構。

4. **R11 與 causality matrix**  
   - 查表 key 建議：`(fromPalace, toPalace, transform)`，其中 transform 用「祿」|「權」|「科」|「忌」。  
   - 未命中時 fallback 規則：**不可空白**；例如：「{fromPalace} 的壓力／資源會在 {toPalace} 顯化，可留意兩宮之間的連動。」（可再依 transform 微調用詞。）

5. **Loader / Validator**  
   - 所有 content 載入時：必填欄位檢查、宮位／星曜經 canonical 映射後合法、transform 僅 祿/權/科/忌、**palace_causality_matrix 同 (from,to,transform) 不可重複**。

---

## 四、建議採用的「一次性總工程指令」修正版

以下可直接貼給 Cursor，在**你提供 7 個資料檔後**使用。修正重點：路徑可選、canonical 與 fallback 寫死、測試 6 項明列。

```text
【Cursor 任務：建立「四化事件→Pattern→字典→命理敘事→決策」完整引擎】

目錄約定（二選一，請依專案現狀擇一）：
- 方案 A：Engine 放在 worker/src/engine/，Content 放在 worker/data/（或 worker/content/sihua-engine/），
  與 worker/src/lifebook/canonicalKeys.ts、schema 共用宮位／星曜正規化。
- 方案 B：Engine 放在專案根 src/engine/，Content 放在專案根 data/；
  宮位必須與 worker 一致：命宮、兄弟宮、夫妻宮、子女宮、財帛宮、疾厄宮、遷移宮、僕役宮、官祿宮、田宅宮、福德宮、父母宮。

建立/補齊檔案：
1. src/engine/types.ts — SiHuaEvent（star, transform 祿|權|科|忌, fromPalace, toPalace, layer）, SiHuaDiagnostics, PatternHit（ruleId, severity, summary, evidence, payload）.
2. src/engine/normalizeSiHuaEvents.ts — 輸入：buildS00EventsFromChart / buildSiHuaLayers / chartJson；輸出 events + diagnostics；缺欄位不刪事件，記入 diagnostics.missingFields；unresolved 記入 diagnostics.
3. src/engine/patternDetectors.ts — R01/R02/R03/R11/R30；PatternHit 含 evidence + payload（R11 含 fromPalace, toPalace, transform；R30 含 loop 陣列）.
4. src/engine/patternMerge.ts — 去重 key：R01→star, R02/R03→toPalace+transform, R11→transform+from+"->"+to, R30→loop 排序後 join；同 key 只留一筆；R11 優先保留有 causality matrix 命中的 hit.
5. src/engine/generateNarrative.ts — pipeline：normalize→detect→merge→dictionary 查表→產出主文區塊＋debug 區塊；主文禁止 ruleId、禁止 raw events；debug 必含 ruleId、evidence、diagnostics、R11 causality match 結果；策略最多 3 條、每條 ≤2 句.
6. src/engine/decisionEngine.ts — 輸入：events + R11 hits（含 causality 命中結果與 decisionTags）；依權重（忌>權>祿>科，year>decade>minor>natal）與 decisionTags 累加，輸出 top 3 建議，每條 ≤2 句.

內容檔（需已存在於 data/ 或指定路徑）：
- data/star_consultation_dictionary.ts（14 主星：themes, tension, strategy）
- data/star_transform_dictionary.zh-TW.json（56 條：meaning, counsel, do, dont）
- data/palace_consultation_dictionary.zh-TW.json（12 宮：domain, description）
- data/palace_transform_dictionary.zh-TW.json（48 條：meaning, advice）
- data/palace_causality_matrix.zh-TW.json（from, to, transform, meaning, consultation, advice, decisionTags；同 (from,to,transform) 唯一）
- data/major_patterns.zh-TW.json（格局/結構）
- data/star_combinations.zh-TW.json（星曜組合語義）

R11 渲染：查 palace_causality_matrix；命中則用 consultation + advice；未命中必須 fallback，禁止空白（例如：「{fromPalace} 的壓力會在 {toPalace} 顯化，可留意兩宮連動。」）

主文禁止：「你天生就是…」「遇到X類議題代表你是…」；必須：判讀＋原因＋策略。

測試至少 6 項：
(1) R01 同星疊命中
(2) R02 同宮祿疊命中
(3) R11 忌 A→B 且 causality matrix 命中
(4) R30 至少 3 宮 loop 命中
(5) Normalizer：缺欄位時事件仍保留且 diagnostics 有記錄
(6) 去重後主文不重複且不含 ruleId；debug 必含 diagnostics 與 evidence
```

---

## 五、結論與下一步

- **做法評估**：規格完整、與現有 s00 邏輯相容，僅需補 R11 causality 查表、patternMerge 的 R11 優先保留、decisionEngine、以及 7 個內容檔與 loader/validator。  
- **建議**：  
  - 採用**方案 A**（engine + content 進 worker），以共用 canonical 與型別。  
  - 內部保留 `lu/quan/ke/ji`，只在字典與主文邊界轉成「祿權科忌」。  
  - 7 個內容檔由你提供後，再依「必備檔案樹」與上述指令實作並跑滿 6 項測試。

**資料狀態（worker/data/）：**

| 檔案 | 狀態 |
|------|------|
| palace_transform_dictionary.zh-TW.json | ✅ 已寫入（48 條） |
| palace_causality_matrix.zh-TW.json | ✅ 已寫入（114 條，已去重） |
| major_patterns.zh-TW.json | ✅ 已寫入（9 條） |
| star_combinations.zh-TW.json | ✅ 已寫入（40 條） |
| star_consultation_dictionary.ts | ✅ 已寫入（14 主星） |
| star_transform_dictionary.zh-TW.json | ✅ 已寫入（56 條） |
| palace_consultation_dictionary.zh-TW.json | ✅ 已寫入（12 宮） |

**7 個內容檔已齊，可接 engine 實作與測試。** 詳見 `worker/data/README.md`。
