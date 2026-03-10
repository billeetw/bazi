# 「四化論斷」核心動態邏輯 — 可行性分析與需補充處

## 一、目標與邊界（對齊需求）

- **目標**：統一輸入結構 → 5 個 pattern detector（R01/R02/R03/R11/R30）→ 排序去重 → s00 只輸出「高階判讀句」+ 證據進 debug/技術區塊。
- **邊界**：不改既有資料來源（`buildS00EventsFromChart`、`buildSiHuaLayers`、chartJson 結構），只做 **normalize 層** 與 **新輸出格式**；宮位 key 遵守既有正規化（命宮、兄弟…父母）。

---

## 二、現況對照

| 項目 | 現況 | 需求 | 差距 |
|------|------|------|------|
| **事件格式** | `SiHuaEvent`: layer(natal/decade/year), starName, transform, fromPalace, toPalace | layer 含 **minor**；缺欄位要進 diagnostics，不丟事件 | ① 無 minor；② 缺欄位時仍 push 事件（空字串）且未記錄 missingFields |
| **小限** | `buildS00EventsFromChart` 只讀 benming/decadal/yearly；`SihuaLayers` 有 xiaoXianCurrent 但未納入 | 支援 layer=minor | ③ 需在 normalizer 或事件來源處納入小限（不改既有函數簽名則由 normalizer 從 chartJson 再讀一層） |
| **Detector 輸出** | `PatternHit`: ruleId, priority, evidence(k/v), message, action | ruleId, **title**, **severity**, **summary**, **evidence（事件列表）**, payload | ④ 無 title/severity；evidence 為 key-value 非「命中的 events 列表」 |
| **R02 祿/忌分開** | R02 同宮疊不區分祿疊/忌疊；R09/R10 才分忌/祿 | R02 祿疊、忌疊分開計算 | ⑤ R02 需拆成或內部分成「同宮祿疊」「同宮忌疊」兩類輸出 |
| **R30 能量環** | 無 | 有向圖找 2～3 宮閉環，evidence 列出形成 loop 的邊 | ⑥ 全新實作（建圖 + cycle 檢測） |
| **排序與去重** | 依 priority 排序；去重只做「同 message 不重複」 | 同一 ruleId + 同一 core key 只出現一次；順序固定 R01→R02→R30→R03→R11 | ⑦ 需 canonical key 去重與固定順序 |
| **s00 主文** | 多段模板句 + 有時帶 [R01_...] 標籤 | 只輸出：Top 1 同星疊、Top 1 同宮疊、全部忌因果（最多 2 條）、證據僅在 debug | ⑧ 主文結構與證據分離需接在新 pipeline 上 |
| **Diagnostics** | 無 | missingFields / unresolvedPalaceKey / unresolvedStarName；hits 空時說明原因 | ⑨ 全新 diagnostics 物件與 debug 區塊 |

---

## 三、需補充的地方（實作清單）

### A. 統一輸入與 normalizer（不改既有來源）

1. **新增型別**（建議放在 `worker/src/lifebook/s00Types.ts` 或同目錄）
   - `NormalizedSiHuaEvent`: `layer: "natal"|"decade"|"year"|"minor"`, `star: string`, `transform: "lu"|"quan"|"ke"|"ji"`, `fromPalace: string`, `toPalace: string`（皆為中文宮名，遵守既有正規化）。
   - `SiHuaDiagnostics`: `missingFields: Array<{ eventIndex?: number; fields: string[]; raw?: unknown }>`, `unresolvedPalaceKey: string[]`, `unresolvedStarName: string[]`。

2. **Normalizer 函數**
   - 輸入：現有 `SiHuaEvent[]`（來自 `buildS00EventsFromChart`）+ 可選「小限事件」來源（例如從 chartJson 再讀一層，不改 `buildS00EventsFromChart` 內部）。
   - 輸出：`{ events: NormalizedSiHuaEvent[], diagnostics: SiHuaDiagnostics }`。
   - 邏輯：
     - 遍歷每筆事件，若 `fromPalace`/`toPalace` 缺或無效，仍產出一筆 normalized（可填空字串），並在 `diagnostics.missingFields` 記錄（eventIndex 或 raw 以便 debug）。
     - 宮位一律經既有 `toPalaceCanonical`（或現有 norm）轉成 12 宮中文 key；無法解析的 key 進 `unresolvedPalaceKey`。
     - 星名無法解析的進 `unresolvedStarName`。
   - **小限**：若 chartJson 有 `sihuaLayers.xiaoXianCurrent.transforms` 或 buildSiHuaLayers 可產出小限，在 normalizer 內單獨讀取並轉成 `layer: "minor"` 的 NormalizedSiHuaEvent，併入 events；不要求改動既有 `buildS00EventsFromChart` 回傳型別。

3. **缺 palace 的處理**
   - 需求：「任何缺 palace 的事件不要丟掉，要列入 diagnostics.missingFields[]」→ 不丟棄，寫入 missingFields，事件仍進 list（from/to 可為空或標記值）。

---

### B. 五個 Pattern Detector（回傳 hits + evidence 事件列表）

1. **共通輸出型別**
   - `PatternHitV2`: `ruleId`, `title`, `severity: "low"|"medium"|"high"`, `summary`, `evidence: NormalizedSiHuaEvent[]`（命中的事件），`payload?: Record<string, unknown>`。

2. **R01 同星疊**
   - 條件：同一 `star` 在不同 layer 出現 ≥ 2（建議支援 3）。
   - evidence：列出命中的各筆事件（layer + star + transform + from → to）；可從現有 R01 邏輯擴充，改為回傳「對應的 events 子集」。

3. **R02 同宮疊**
   - 條件：同一 `toPalace` 被不同 layer 的 **祿** 命中 ≥ 2 → 一類；**忌** 命中 ≥ 2 → 另一類；祿疊、忌疊分開計算，不混在一起。
   - evidence：列出命中的事件（同上格式）。

4. **R03 同化疊**
   - 條件：同一 `transform` 在同層或跨層集中到同一宮（多個 lu 飛同宮等）。
   - 輸出「同化集中到哪個宮位」；evidence 為命中的事件列表。

5. **R11 忌從哪到哪**
   - 條件：任一 `transform=ji` 事件。
   - summary 必須包含：`{fromPalace} → {toPalace}`，並保留 star（例：「巨門化忌：官祿 → 夫妻」）；evidence 為該 ji 事件（或最多 2 條最嚴重）。

6. **R30 能量環（新增）**
   - 有向圖：node = 宮位，edge = fromPalace → toPalace（每條 event 一條邊）。
   - 找 2～3 宮的 cycle（閉環）；evidence 列出形成 loop 的邊（對應的 events）。
   - 需新檔或新函數：建 adjacency、做 DFS/並查集找小環。

---

### C. 排序與去重

1. **Canonical key**
   - R01: `star`（或 star 名）。
   - R02: `toPalace + transform`（祿疊 / 忌疊分開，故 key 已區分）。
   - R30: 以 loop 的宮位集合或首宮做 key（例如排序後宮名串）。
   - R03: `toPalace + transform`。
   - R11: `fromPalace + toPalace`（或單筆 ji 的 id）。

2. **去重**
   - 同一 ruleId + 同一 canonical key 只保留一筆 hit（可合併 evidence 列表）。

3. **排序**
   - 固定順序：**R01 → R02 → R30 → R03 → R11**（與需求一致）。

4. **同宮同化合併**
   - 若同一宮位同時命中 R02 與 R03，保留較高 severity 在前，其餘可合併 evidence 或降級為「附屬說明」，不重複同一句。

---

### D. s00 使用方式

1. **主文只允許**
   - Top 1 同星疊（R01）
   - Top 1 同宮疊（R02，祿疊或忌疊擇一或各一，依產品決定）
   - 忌因果導線（R11）最多 2 條最嚴重
   - （可選）R30 能量環一則
   - 每段為「高階判讀句」，**不**出現 [R01_...] 等硬標籤。

2. **證據與 debug**
   - 每段對應的 evidence（事件列表：layer + star + transform + from → to）只放在 **技術區塊 / debug 區塊**，不混入主文。

3. **實作接點**
   - 在產生 s00 的流程：先 **normalize → detectors → dedupe/sort → render 主文** + **組 debug 區塊（證據 + diagnostics）**；不改既有 content 結構，只新增輸出欄位/placeholder（例如 `s00MainNarrative`, `s00DebugEvidence`, `s00Diagnostics`）。

---

### E. Debug / Diagnostics（必做）

1. **欄位**
   - `diagnostics.missingFields[]`：缺 from/to 或必填欄位的事件描述。
   - `diagnostics.unresolvedPalaceKey[]`：無法對應到 12 宮的 key。
   - `diagnostics.unresolvedStarName[]`：無法解析的星名。

2. **hits 為空時**
   - 顯示「為何空」：例如缺 from/to、資料未進入 normalize、或所有事件被過濾掉；可寫進 debug 區塊或 `diagnostics.emptyReason`。

3. **每次產出 s00**
   - 若 hits 為空，必須在 debug/diagnostics 區塊說明原因（不靜默）。

---

### F. 測試（至少 4 個案例）

| Case | 情境 | 預期 |
|------|------|------|
| 1 | 本命/大限/流年同星（天同） | 命中 R01，evidence 含 3 筆事件 |
| 2 | 同一宮位被本命祿 + 大限祿 命中 | 命中 R02（祿疊），evidence 含 2 筆事件 |
| 3 | ji 從 A→B | 命中 R11，summary 含 fromPalace → toPalace，保留 star |
| 4 | A→B、B→A（或 A→B→C→A） | 命中 R30，evidence 列出形成 loop 的邊 |

驗收：4 個案例跑完，hits 數量與 ruleId 符合預期；輸出自訂順序 R01→R02→R30→R03→R11。

---

## 四、與既有程式碼的關係

- **不改**：`buildS00EventsFromChart`、`buildSiHuaLayers`、chartJson 的 key 與 D1/copy_key 結構。
- **可沿用**：現有 R01/R02/R03/R11 的「條件判斷」邏輯，改為回傳 **evidence 事件列表** 與 **title/severity/summary**；宮位正規化沿用 `toPalaceCanonical` 與現有 norm。
- **新增**：NormalizedSiHuaEvent + SiHuaDiagnostics、normalizer、R30 能量環、統一排序去重、s00 主文與 debug 分離的 render、diagnostics 寫入 debug 區塊。

---

## 五、建議實作順序

1. **A**：型別 + normalizer（含 diagnostics），小限在 normalizer 內從 chart 補讀。
2. **B**：R01/R02/R03/R11 改為輸出 PatternHitV2（含 evidence 事件列表），R02 拆祿疊/忌疊；新增 R30。
3. **C**：Canonical key 去重 + 固定順序 R01→R02→R30→R03→R11。
4. **E**：hits 為空時寫 emptyReason；產出 s00 時必帶 diagnostics。
5. **D**：s00 只輸出 Top 1 R01、Top 1 R02、最多 2 條 R11、證據進 debug；placeholder 接上。
6. **F**：4 個測試案例通過。

完成後，s00 主文會收斂為「主角星／主舞台／因果導線」等高階判讀句，證據與缺欄位說明一律在技術/debug 區塊，且可追溯、不重複、不靜默丟失缺欄位事件。

---

## 六、做完後命書會怎麼變（對照你看到的那段亂掉輸出）

- **現在**：同一宮位（如財帛宮）被 R02、R03、R10、R20 各打一次，主文重複多段類似句子，且帶 [R02_...] 標籤，證據散落或像報表。
- **做完後**：
  - **主文**只會有一段「主舞台（同宮疊）」：例如「財帛宮出現雙祿疊加 → 代表資源匯聚，適合做可複利的布局」，不再出現 [R01_...]、[R02_...]，也不會同一句重複 N 次。
  - **技術區塊**才列出對應 evidence：例如「本命化祿：天同 飛入 財帛宮」「大限化祿：天同 飛入 財帛宮」。
  - **主角星**一段（Top 1 同星疊）、**因果導線**最多 2 條忌（R11），格式固定、可追溯。
- **缺資料時**：若缺 from/to 導致無法命中某規則，會在 debug 區塊的 `diagnostics.missingFields` 列出，並說明「因此哪些規則無法命中」，不會靜默。

---

## 七、Detector 規格（5 個含 R30）— 工程定稿

### 共同輸入（normalized events）

- **events: NormalizedSiHuaEvent[]**
- 每個 event 必含：
  - **layer**: `"natal"` | `"decade"` | `"year"` | `"minor"`
  - **transform**: `"祿"` | `"權"` | `"科"` | `"忌"`（中文，與現有 lu/quan/ke/ji 對應）
  - **starId?** / **starNameZh?**（至少一個）
  - **fromPalace?**: PalaceKey | null
  - **toPalace?**: PalaceKey | null
  - **raw?**：保留來源片段，供 diagnostics

### 共同輸出（PatternHitV2）

- **ruleId**: `"R01"` | `"R02_LU"` | `"R02_JI"` | `"R30"` | `"R03"` | `"R11"`
- **title**: string
- **severity**: `"high"` | `"medium"` | `"low"`
- **summary**: string（高階命理師語句，給主文用）
- **evidence**: NormalizedSiHuaEvent[]（命中的事件列表，只給 debug）
- **payload**: object（canonical key 的來源資料，如 starId / toPalace / loopNodes）

---

### R01 同星疊（Same Star Overlap）

- **定義**：同一 starId 在不同 layer 的四化事件中出現 ≥ 2（可設定 ≥3 才 high）。
- **Group key**：starId
- **命中**：unique(layers) >= 2
- **排序**：先依 unique(layers) 多→少；再依 maxSeverity(transform)（忌 > 權 > 科 > 祿）
- **輸出**：只要 1 條 Top hit（放主文）
- **canonicalKey**：`star:<starId>`

---

### R02 同宮疊（拆成祿疊 / 忌疊）

**R02_LU 同宮祿疊**

- 定義：同一 toPalace，transform="祿" 的事件跨 layer ≥ 2
- Group key：toPalace
- 命中：countDistinctLayer(events where toPalace && transform=祿) >= 2
- **canonicalKey**：`to:<toPalace>|t:祿`
- 輸出：Top 1（放主文）

**R02_JI 同宮忌疊**

- 同上，transform="忌"
- **canonicalKey**：`to:<toPalace>|t:忌`
- 輸出：Top 1；若同時命中祿疊與忌疊，主文只取 severity 更高者，另一條留 debug

---

### R30 能量環（Energy Loop / Cycle）

- **定義**：由四化飛星的 from→to 形成 2～3 宮的有向循環。Nodes = PalaceKey；Edges = 只取 fromPalace && toPalace 都存在的事件（缺欄位不參與 cycle）。
- **規格**：只找 2-cycle（A→B 且 B→A）或 3-cycle（A→B, B→C, C→A）；同一組宮位集合只留一個 hit。
- **2-cycle key**：`loop:A-B`（字典序排序後 join）
- **3-cycle key**：`loop:A-B-C`
- **evidence**：必須列出構成 loop 的那幾條 edge 對應的 events（2 或 3 條）
- **severity**：若 loop 中含任一 transform="忌" → high；含權 → medium；否則（祿/科）→ low
- **ruleId**：固定 `"R30"`
- **canonicalKey**：`loop:<sortedNodesJoined>`

---

### R03 同化疊（Same Transform Concentration）

- **定義**：同一 transform 在整體 events 中「集中於少數宮位」，形成明顯主戰場（同化集中，非僅同宮跨層）。
- **簡版 v1**：統計每個 toPalace 在某 transform 下的計數；若某 transform 的 top1 palace 計數 ≥ 2 且占該 transform 總數 ≥ 50% → 命中。
- 輸出：最多 1 條（放 debug 或主文第 3 優先）
- **canonicalKey**：`t:<transform>|topTo:<toPalace>`

---

### R11 忌從哪到哪（Ji From A to B）

- **定義**：transform="忌" 且 fromPalace / toPalace 皆存在。
- **命中**：所有符合者都可列；主文最多 2 條。
- **排序**：優先顯示「toPalace 在當前其它 hits 中也被點亮」者（例如同時是 R02_JI 的 toPalace）。
- **canonicalKey**：`from:<from>|to:<to>|star:<starId?>`

---

## 八、渲染規則（主文 vs debug）

### 1) 主文輸出（s00MainNarrative）

固定只輸出：

- **Top 1**：R01（若有）
- **Top 1**：R02_LU 或 R02_JI（擇 severity 高者；若兩者皆有可只取一條）
- **最多 2 條**：R11（只挑最有關聯的）
- **R30、R03** 預設放 debug（除非主文要更長才開）

主文不得出現 [Rxx] 標籤；每段為高階判讀句（summary）。

### 2) debug 輸出（s00DebugEvidence）

- 分段列出每個 hit：ruleId + title + canonicalKey
- evidence events 逐條列：layer / transform / star / from→to
- diagnostics：missingFields / unresolvedPalaceKey / unresolvedStarName
- **hits 為空時**：明確列 emptyReason（例如「events 全部缺 from/to」「minor 層未讀到」「四化層級只剩單層無法疊」）

---

## 九、強烈諮詢導向：Severity 判定規格

目標：每個 hit 能回答「這件事重要到什麼程度？需要採取什麼行動？」

| 等級 | 含義     | 命書語氣       |
|------|----------|----------------|
| HIGH | 命運主戰場 | 必須優先處理   |
| MEDIUM | 關鍵機會或壓力 | 應該留意     |
| LOW | 背景趨勢 | 了解即可       |

### R01 同星疊 — 靈魂主角

- **判定**：same star across layers；3+ layers → **HIGH**；2 layers → **MEDIUM**
- **諮詢語氣**  
  - HIGH：這顆星是此局的核心主題。你的人生很多事件都會圍繞它展開。  
  - MEDIUM：這顆星在不同時間層級被重複點名，代表它會反覆成為你的決策焦點。

### R02_LU 同宮祿疊

- 3 layers → **HIGH**；2 layers → **MEDIUM**
- HIGH：這個宮位是命盤中的資源匯聚點。很多機會會在這裡出現。  
- MEDIUM：這個領域容易出現資源與機會，適合長期經營。

### R02_JI 同宮忌疊

- 2+ layers → **HIGH**
- HIGH：這個宮位是命盤中的壓力集中點。很多困難會從這裡開始顯化。

### R03 同化疊（能量純度）

- transform count ≥3 → **HIGH**；=2 → **MEDIUM**
- HIGH：整體命盤出現明顯的能量偏向，代表事件會以相似的形式重複出現。  
- MEDIUM：某種能量在此局中比較活躍，會影響你的決策傾向。

### R11 忌從哪到哪（因果導線）

- from/to 同時為核心宮（命、官、財、夫妻）→ **HIGH**；其他 → **MEDIUM**
- HIGH：你以為問題在 toPalace，但真正的源頭在 fromPalace。  
- MEDIUM：這兩個宮位之間存在壓力連動。

### R30 能量環

- 含忌 → **HIGH**；含權 → **MEDIUM**；其他 → **LOW**
- HIGH：這幾個宮位形成壓力循環。事情會在這幾個領域之間反覆發生。  
- MEDIUM：這幾個領域之間存在明顯的連動。

---

## 十、命書實際效果對照（產品面）

**現在（問題）**：s00 主文混入 [Rxx] 標籤 + 重複段落；句子像機器（模板句 + 同義重複）；證據不清。

**Phase 2 做完後（預期）**：

- 主文像高階命理師：只講「結論 + 操作」，不貼 ruleId。
- 每個結論都有證據：在 debug 可看到「哪顆星、哪個層級、從哪到哪」。
- 不再重複：canonical key 去重，主文輸出數量受控（Top1 / Top1 / Top2）。
- 小限納入但不破壞現有函數：normalizer 補 layer="minor" 事件即可。

**範例**：

- 現在：財帛宮被多層資源點亮 × 3 段
- 未來：你的命盤有一個明顯的資源集中點：財帛宮。本命與大限的祿星同時落在這裡，代表資源與機會容易在這個領域累積。若要放大人生槓桿，可以優先經營與財務、資源、投資相關的方向。

---

## 十一、命盤主戰場偵測器（Dominant Palace Detector）

### 目的

從整張命盤找出：最容易發生重大事件的宮位、人生資源集中點、壓力與課題集中點。影響 s00、模組一、模組二。

### 工程定義

- **函數**：`detectDominantPalaces(chart)`
- **輸出**：`DominantPalace[]`，每個元素：
  - **palace**: PalaceKey
  - **score**: number
  - **tags**: string[]
  - **evidence**: object[]

### 計分系統

- **四化**：祿 +3、權 +2、科 +1、忌 +3；跨層：本命 +2、大限 +1、流年 +1、小限 +1
- **主星**：紫微/天府 +3；武曲/天相/七殺/破軍/廉貞 +2
- **煞星**：擎羊/陀羅/火星/鈴星 各 +1（增加事件密度）
- **三方四正**：命宮/財帛/官祿/遷移 +2

### 分類

- score ≥10 → 核心主戰場
- score 6～9 → 次要舞台
- score ≤5 → 背景宮位  
輸出 **Top 3**。

### 命書應用

在 s00 加一段「你的命盤主舞台」：在整張命盤中，有三個宮位被能量集中點亮（財帛宮 / 官祿宮 / 夫妻宮 …），各一句資源核心 / 責任與轉折 / 情緒考題等。

### 工程流程

normalize events → detect four transform patterns → **detect dominant palaces** → merge results → render s00。

---

## 十二、實作狀態（Phase 2）

- **型別**：`worker/src/lifebook/s00UnifiedTypes.ts` — NormalizedSiHuaEvent、SiHuaDiagnostics、PatternHitV2、RuleIdV2、Severity、DominantPalace。
- **Normalizer**：`s00Normalizer.ts` — normalizeSiHuaEvents(input) → { events, diagnostics }；缺欄位記入 missingFields，宮/星經 canonicalKeys 正規化。
- **5 Detectors**：`s00DetectorsV2.ts` — R01/R02_LU/R02_JI/R30/R03/R11，含 severity（諮詢導向表）、summary、evidence 事件列表、canonicalKey。
- **Pipeline**：`s00Pipeline.ts` — runS00Pipeline(chartJson, { buildEvents, config }) → mainNarrative、debugEvidence、diagnostics、dominantPalacesBlock；主文僅 Top1 R01、Top1 R02、Top2 R11；證據與 emptyReason 進 debug。
- **Dominant Palace**：`dominantPalaceDetector.ts` — detectDominantPalaces({ chartJson, config, events }) → Top 3；計分含四化/主星/煞星/三方四正；formatDominantPalacesBlock 供 s00 使用。
- **s00 接點**：`lifeBookPrompts.ts` 在 sectionKey===s00 時呼叫 runS00Pipeline，寫入 s00MainNarrative、s00DebugEvidence、s00DominantPalaces；`lifebookSection-zh-TW.json` s00 模板加入【高階判讀】{s00MainNarrative}、【命盤主舞台】{s00DominantPalaces}。
