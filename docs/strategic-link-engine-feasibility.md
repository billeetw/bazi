# M7 戰略聯動引擎 buildStrategicLinks 可行性分析

---

## M7 對命書生成的效益、處理方式與需補強

### 一、M7 是否幫助命書生成？

**會。** M7 產出的 `StrategicLink[]` 是「結構化連動關係」，命書層可依 `link.type` 與 `link.key` 抓預設或動態文案，讓章節內容對應到：

- **疊宮**：今年流年某宮壓在原命某宮（overlay）
- **忌沖**：流年忌在某宮、沖對宮（ji_clash）
- **暗合**：兩宮地支暗合的隱藏牽引（hidden_merge）
- **身宮位移**：身宮在遷移/官祿且使用者無位移時的提示（body_move_hint）
- **化祿入口與流向**：今年祿從哪一宮進來（lu_gain）、祿流向哪一宮、複利或漏洞（lu_flow）

命書不用自己從原始命盤推這些關係，只要依 key 對表或組句即可，有利於口吻一致與維護。

---

### 二、本次實作的效益

| 效益 | 說明 |
|------|------|
| **結構化連動** | 不重算命盤，只在既有 compute/all 結果上產出 overlay、ji_clash、hidden_merge、body_move_hint、lu_gain、lu_flow，命書可依 key 對應文案。 |
| **單一 key 對應** | 命書層可用 `lu_gain.Wealth`、`ji_clash.Travel_to_Self`、`lu_flow.Wealth_to_Children` 等 key 查表或組句，易於 i18n 與 A/B 文案。 |
| **複利／漏洞標記** | lu_flow 帶 `isLeak`、`isCompound`，命書可直接用「祿流到有忌的宮＝漏」「流到無忌的宮＝有複利空間」敘事，無需再算。 |
| **上游可擴充** | luEvents 由上游（紫微盤計算）提供；化祿落點與祿轉忌不在 M7 內計算，上游補齊後 M7 只消費即可。 |
| **邊界安全** | luEvents 為空或 flowTo 為 null 時只產 lu_gain、不產 lu_flow，不影響其他 link 類型。 |

---

### 三、處理方式（資料流）

1. **前端**  
   - `buildStrategicContext(ziwei, overlapAnalysis, bodyPalaceReport, userBehavior, luEvents)` 建 ctx，`buildStrategicLinks(ctx)` 產出 `strategicLinks`。  
   - 結果掛在 **contract.strategicLinks**（ui.js 初次、calc.js 在 overlap 完成後覆寫）。  
   - 送命書 API 時，**chart_json** 應包含 `strategicLinks`（與 ziwei、overlapAnalysis 等一併傳入）。

2. **命書層（Worker）**  
   - 收到 **chart_json**（含 `chart_json.strategicLinks`）。  
   - 在組 **user prompt** 或 **slice** 時，把 `strategicLinks` 寫進命盤切片或說明區塊，讓模型知道「有哪些連動 key」；或先在後端依 key 查句庫組好一段「戰略聯動摘要」再塞進 prompt。

3. **文案對應**  
   - 命書可維護「key → 文案」對照表（或由 LLM 依 key 生成），例如：  
     - `overlay.Wealth_over_Parents` → 「今年流年財帛壓在原命父母宮，財與長輩、制度有關。」  
     - `ji_clash.Travel_to_Self` → 「流年忌在遷移，沖命宮，外出與自我定位需謹慎。」  
     - `lu_gain.Wealth` → 「今年祿從財帛宮進來。」  
     - `lu_flow.Wealth_to_Children` + isLeak → 「祿由財帛流向子女宮，但該宮有忌，易漏財或為子女耗損。」  
     - `lu_flow.Wealth_to_Children` + isCompound → 「祿由財帛流向子女宮，該宮無忌，有複利空間。」

---

### 四、需要補強的地方

| 項目 | 說明 | 建議 |
|------|------|------|
| **命書 API 尚未使用 strategicLinks** | Worker 的 lifeBookInfer / lifeBookPrompts 目前組 chart 切片時未讀取 `chart_json.strategicLinks`，也未把 strategicLinks 寫入 infer/narrate 的 user prompt。 | 在 `getChartSlice` 或組 prompt 處加入 `slice.strategicLinks = chartJson?.strategicLinks`，並在 prompt 模板中加入「戰略聯動」區塊（列舉 link.key 或預先組好摘要）。 |
| **前端送 chart 時需帶上 strategicLinks** | 呼叫命書 API 時，若 chart_json 來自前端 contract，需確保 **contract.strategicLinks** 一併序列化進 chart_json。 | 檢查呼叫命書的入口（例如 generate-section、infer、narrate）傳入的 chart_json 是否包含 `strategicLinks`；若從 contract 組裝，加入 `strategicLinks: contract.strategicLinks`。 |
| **luEvents 上游尚未產出** | 目前 luEvents 假設由上游（紫微盤計算）提供，專案中尚未有模組產出 `contract.luEvents`（化祿落點＋祿轉忌／flowTo）。 | 在紫微盤計算流程（或 Worker compute）中新增「化祿事件」計算：依流年四化與疊宮產出 `{ palace, flowTo }[]`，寫入 contract.luEvents；M7 僅消費。 |
| **key → 文案句庫未建** | 命書層若要用 key 對應固定文案，尚無統一「戰略聯動句庫」或模板。 | 建立句庫（例如 JSON 或 lifeBookTemplates 內 STRATEGIC_LINK_PHRASES），依 link.type + key（及 lu_flow 的 isLeak/isCompound）回傳對應句子，供 narrate 或 post-process 使用。 |
| **userBehavior 仍為選填** | body_move_hint 依 userBehavior.recentMoves / recentJobChanges 判斷；目前多為空，身宮在遷移/官祿時仍可能產出 body_move_hint。 | 若希望「僅在使用者有填寫位移行為時才提示」，可改為「無 userBehavior 時不產 body_move_hint」；或維持現狀，由命書文案說明「若你近年少有移動／換工作，可參考此提示」。 |

---

## M7 v1.5：化祿複利（lu_gain / lu_flow）可行性

- **祿入口**：overlapAnalysis.palaceMap 每宮已有 `transformations.liunian.type`，可設 `hasLu = (type === '祿')`，凡 hasLu 的宮位即「今年祿從哪一宮進來」。✅
- **祿流向**：流年祿落在宮位 A，A 壓在原命宮位 B（overlayMap[A]=B），則 flowTo = B 即「祿最後流向哪一宮」；可由 M7 從既有 overlayMap 推導，無需 API 新增欄位。✅
- **複利 vs 漏洞**：flowTo 宮位若 transit.palaces[flowTo].hasLu → 複利；若 hasJi → 漏洞；否則標 "flow"。✅
- **luEvents**：由 M7 在 buildStrategicContext 內從 overlapAnalysis + overlayMap 組出（入口=有祿的宮位，flowTo=overlayMap[入口]）；若日後上游改為傳入 luEvents，可改為 `ctx.transit.luEvents ?? 自建` 相容。✅

結論：可行，已實作於 M7 v1.5。

---

## 一、目標

在現有 compute/all 結果之上，不重新算命盤，只負責找出「連動關係」並輸出 `StrategicLink[]`，供命書層依 key 抓文案。

## 二、四類 link 與資料來源

| Link 類型 | 說明 | 資料來源 | 現狀 |
|-----------|------|----------|------|
| **overlay.xxx_over_xxx** | 流年 A 宮壓在原命 B 宮 | 流年地支 + 命宮地支 → 每宮地支，比對得 overlayMap | ✅ 命宮地支 `ziwei.core.minggongBranch`、流年地支 `ziwei.horoscope.yearlyBranch` 皆有；可依固定公式算 流年/原命 每宮地支並建 overlayMap |
| **ji_clash.from_to_to** | 流年有化忌的宮位 + 對宮 | 疊宮分析 palaceMap（liunian.type===忌）+ 對宮表 | ✅ `overlapAnalysis.palaceMap` 每宮有 `transformations.liunian?.type`；對宮邏輯已有 `computeRelatedPalaces` / OPPOSITE_PALACE_MAP（命宮↔遷移、兄弟↔僕役…） |
| **hidden_merge.a_b** | 地支暗合六組 | HIDDEN_MERGE_PAIRS + 原命每宮地支 | ✅ 原命每宮地支可由 `minggongBranch` + PALACE_DEFAULT 順序算出；暗合為 子丑、寅亥、卯戌、巳申、午未、酉辰 |
| **body_move_hint.*** | 身宮 + 使用者位移行為 | 身宮所在宮位 + userBehavior（可選） | ✅ 身宮已有 `bodyPalaceReport.bodyPalace`；userBehavior 目前無欄位，可選填或後續由問卷補 |

結論：**四類 link 所需資料皆可從現有 compute/all 結果（含前端疊宮、身宮報告）取得，可行性高。**

## 三、Context 對應（StrategicContext ← 專案實際結構）

- **base.palaces**：由 `ziwei.core.minggongBranch` + BRANCH_RING + PALACE_DEFAULT 算出每宮地支；宮位 id 用英文 PalaceId（與 bodyPalaceEngine 一致）。
- **base.bodyPalace**：`bodyPalaceReport.bodyPalace`（PalaceId）。
- **transit.palaces**：由 `overlapAnalysis.palaceMap` 遍歷，依中文宮位名對應 PalaceId，`hasJi = transformations.liunian?.type === '忌'`。
- **transit.overlayMap**：由 流年地支、命宮地支 算出「流年第 k 宮」與「原命第 j 宮」地支相同者，得到 `overlayMap[transitPalaceId] = basePalaceId`。
- **userBehavior**：可選；目前可傳 `{}`，日後由問卷或表單補 `recentMoves`、`recentJobChanges`。

## 四、宮位 ID 與對宮

- PalaceId 順序與 PALACE_DEFAULT 一致：self, siblings, spouse, children, wealth, health, travel, friends, career, property, fortune, parents（對應 命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母）。
- 對宮：self↔travel, siblings↔friends, spouse↔career, children↔property, wealth↔fortune, health↔parents（與 consultationScriptEngine OPPOSITE_PALACE_MAP 一致）。

## 五、實作位置與串接

- **引擎**：`js/calc/strategicLinkEngine.js`，提供 `buildStrategicContext(ziwei, overlapAnalysis, bodyPalaceReport, userBehavior?)` 與 `buildStrategicLinks(ctx)`，回傳 `StrategicLink[]`。
- **呼叫時機**：
  - **ui.js**：設定 contract 後立即用當前 `overlapAnalysis`（State/window，可能為 null）建 ctx 並算出 `contract.strategicLinks`（無 overlap 時 ji_clash 為空，其餘 overlay / hidden_merge / body_move_hint 仍可用）。
  - **calc.js**：在 `overlapAnalysis` 計算完成並寫入 State 後，再以完整 ctx 重算並覆寫 `contract.strategicLinks`（含 ji_clash），並可選寫入 `BaziApp.State.setState("strategicLinks", ...)`。
- **命書**：命書 API 收到的 chart_json 可包含 `strategicLinks`；建議前端隨 chart 一併傳給命書，命書層依 `link.key` 抓文案。
