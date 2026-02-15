# 五行生剋系統：想法、建議與施作步驟

本文件針對「五行生剋系統：完整概念與實作計劃」spec，結合專案既有資料與架構，整理想法、建議與可執行施作步驟；並在必要處依既有環境做修正。

---

## 一、整體想法與建議

### 1. 與既有架構的關係

- **既有資源可直接沿用**：
  - `js/calc/constants.js` 已有 **十天干**（`STEMS`）、**地支順序**（`BRANCH_ORDER`、`BRANCH_RING`）、**地支藏干**（`CANGGAN_DATA`，格式為 `{ "子": { "癸": 1.0 }, "丑": { "己": 0.6, "癸": 0.3, "辛": 0.1 }, ... }`）。
  - 相生／相剋已有 **中文鍵** 的對照：`SHENG_MAP`、`KE_MAP`（木火土金水）。
  - 五行診斷與文案：`getStrongestWeakest`、`generateFiveElementComment`、`getBoyanBoard`、`GENERATION_POST_STYLE`、`OVERCOMING_POST_STYLE` 等，可與新「生剋流量／制衡壓力」報告**並存**或**漸進替換**。
- **建議定位**：本系統做「**可驗證、可回測的五行向量與生剋圖**」，與現有「紫微＋五行強弱＋戰略看板」互補：  
  - 輸入：**四柱**（年／月／日／時 干＋支）。  
  - 輸出：`v_raw`、`v_season`、相生流量／瓶頸、相剋壓力、三層報告＋病例式文本。  
  若目前 五行數據來自**紫微或他源**（如 `bazi.wuxing.surface`／`strategic`），可並行保留；新管線**僅由四柱**產出，方便日後對同一命盤做「紫微五行 vs 純八字五行」對照與回測。

### 2. 設計原則的落實建議

- **規則進 KB、運算簡單**：  
  - 生剋邊、月令係數、語意描述一律放在 **靜態 JSON（或 YAML）**，程式只做：查表、加權、min／比值、排序。  
  - 不在程式裡寫死「水生木」等字串，改由 `flow_descriptions.json` 等以 `id` 對應。
- **中間數值可輸出、可記錄**：  
  - 管線每一階段輸出 **可序列化結構**（如 `v_raw`、`v_season`、`production`、`control`、`chain_stats`、`control_stats`）。  
  - 日後可寫入 DB 或 log，供「事件回測」與調參（例如月令係數、alpha／beta）。

### 3. 資料與鍵值約定

- **五行 ID**：spec 用英文 `wood / fire / earth / metal / water` 有利程式與 JSON 一致；既有前端多處用 **中文** `木火土金水`。建議：  
  - **KB 與核心演算法**：統一用 **英文 id**（`wood`, `fire`, ...）。  
  - **對外介面／報告**：在輸出層做一層 **id → 中文** 對照（可從 `elements[].zh` 來），這樣既符合 spec 又與現有 `SHENG_MAP`、雷達圖等相容。
- **藏干格式**：既有 `CANGGAN_DATA` 為 `{ "子": { "癸": 1.0 }, ... }`。spec 用 `hidden: [["癸", 1.0], ...]`。建議在 **KB** 中採用 spec 的 `[["天干", 比例], ...]`，**載入時**轉成程式易用的 `{ "癸": 1.0 }`，或寫一層薄適配，從既有 `CANGGAN_DATA` 讀入亦可，避免重複維護兩份藏干。

### 4. 月令係數與「當令／生我／我生／剋我／我剋」

- spec 的 `seasonal_multiplier` 以「當令五行」為中心，其餘依生剋關係給係數（當令 1.30，生我 1.10，我生 1.00，剋我 0.95，我剋 0.90）。  
- 建議：  
  - 在 **KB** 的 `month_branches` 中，每個月支對應一組 `seasonal_multiplier`（五個元素各一數），由腳本或手動依「當令＋生剋」規則產生，**不要**在 runtime 再算一層「生我／我生」邏輯，以維持「規則在 KB、程式只查表」。  
  - 若未來要調參，只改 KB 或 config，不動程式。

### 5. 報告與既有文案的整合

- **三層報告**（向量總表、相生鏈診斷、制衡壓力）可作為 **新區塊** 或 **新 API** 回傳，與現有「五行強弱＋戰略看板」並列。  
- **病例式欄位**（`chief_complaint`、`findings`、`diagnosis`、`falsifiable_predictions`）可對接既有 `getBoyanBoard`、`generateFiveElementDiagnosis` 的風格，或先獨立輸出，再由上層決定是否與紫微／流年混搭呈現。

### 6. 回測與調參

- 建議 **第一版** 先完成：KB ＋ 向量與生剋運算 ＋ 報告生成；**回測**（記錄每次分析的中間數值、版本、參數）列為 Phase 2，在管線穩定後再加「寫入 DB／檔案」與查詢介面，避免首版範圍過大。

---

## 二、依既有環境的修正與對齊

### 2.1 四柱來源

- spec 假設輸入為 `pillars`（年／月／日／時 的 stem＋branch）。  
- 專案中 **八字／四柱** 若已存在於：  
  - 前端：`bazi` 或計算結果中的 `year`/`month`/`day`/`hour`（各含 `stem`、`branch`），或  
  - 後端：`/api/admin/calculation-results` 或類似 API 回傳的結構，  
  則 **vectorize 的輸入** 可直接約定為 `{ year, month, day, hour }`，每柱 `{ stem, branch }`。  
- 若目前沒有統一四柱結構，建議在 **calculation-flow 或 API 契約** 中明確定義一層 `pillars`，供五行生剋管線專用。

### 2.2 地支與月支

- 月令以 **月支** 為準（寅月、卯月…）。若現有資料只有「月份數字」，需有一層對應：  
  - 節氣月：依節氣切換月支（精確）；或  
  - 簡化：`month_branch = BRANCH_RING[(月份 - 1 + 2) % 12]` 之類（寅=農曆正月），並在文件註明為簡化規則。  
- 月令係數表 `month_branches` 以 **月支** 為 key（如 `yin`、`mao`），與 `branches[].id` 對齊。

### 2.3 藏干資料來源

- **選項 A**：沿用 `constants.js` 的 `CANGGAN_DATA`，在 KB 中只放 `elements`、`gen_edges`、`ctl_edges`、`stems`、`month_branches`、`flow_descriptions`；vectorize 時由程式從 `CalcConstants.CANGGAN_DATA` 讀入。  
- **選項 B**：KB 新增 `branches`（含 `hidden`），與 spec 一致，程式只讀 KB；必要時寫一小段從 `CANGGAN_DATA` 生成 `branches.json`，避免手動重打。

### 2.4 語意描述與既有文案

- spec 的 **flow_descriptions**（5 生 + 5 剋）與現有 `GENERATION_POST_STYLE`、`OVERCOMING_POST_STYLE`、`ELEMENT_CORE_MEANING_*` 有重疊概念。建議：  
  - **flow_descriptions** 專注「單一有向邊」的 positive／stress／archetype，供 **瓶頸／壓力** 段落使用。  
  - 既有 **戰略看板／五行診斷** 仍用現有常數，不強求合一；之後若有需要，再從 flow_descriptions 抽語句填到既有模板，或反過來。

---

## 三、施作步驟（可依此拆任務）

### Phase 1：靜態 KB 與型別

1. **新增／整理靜態 KB 檔案**（建議目錄：`data/wuxing/` 或 `data/` 下獨立檔案）  
   - `elements.json`：五行 id、zh、gen、ctl；`gen_edges`、`ctl_edges`（與 spec 一致）。  
   - `stems.json`：十天干 → 五行 id（與 spec 一致）。  
   - `branches.json`：十二支 id、zh、main、hidden（`[["癸",1.0],...]`）；可從既有 `CANGGAN_DATA` 轉出或手動對齊。  
   - `month_branches.json`：月支 → `in_season`、`seasonal_multiplier`（五個元素各一數）；依「當令 1.30、生我 1.10、我生 1.00、剋我 0.95、我剋 0.90」填滿 12 月。  
   - `flow_descriptions.json`：5 條相生 ＋ 5 條相剋，每條含 id、label、role、archetype、positive、stress（與 spec 2.5 一致）。

2. **型別與向量工具**（可在 `js/calc/` 下新檔，例如 `wuxingFlowTypes.js` 或直接寫在模組內）  
   - `ElementId`、`ElementVector`（如 `{ wood, fire, earth, metal, water }`）。  
   - 基本工具：向量加、乘（常數）、排序（回傳強→弱順序）、從 KB 載入 elements／edges／stems／branches／month_branches／flow_descriptions。

### Phase 2：運算管線

3. **vectorize(pillars, stem_w, branch_w)**  
   - 輸入：`{ year, month, day, hour }`，每柱 `{ stem, branch }`。  
   - 依 `stems` 表把天干對到五行，`v[elem] += stem_w`。  
   - 依 `branches` 藏干（或 `CANGGAN_DATA`）＋`stems`，`v[elem] += branch_w * weight`。  
   - 回傳 `v_raw`（ElementVector）。

4. **applySeason(month_branch, v_raw)**  
   - 以月支查 `month_branches` 的 `seasonal_multiplier`，`v_season[elem] = v_raw[elem] * m[elem]`。  
   - 回傳 `v_season`。

5. **computeFlows(v, alpha, beta)**  
   - 依 `gen_edges` 算每段 `production[key] = min(v[up], v[down]) * alpha`。  
   - 依 `ctl_edges` 算每段 `control[key] = min(v[ctl], v[to]) * beta`。  
   - 回傳 `{ production, control }`。

6. **analyzeBottlenecks(v)**  
   - 相生鏈固定順序，算每段 ratio、throughput；標記 `bottleneck_by_throughput`、`bottleneck_by_ratio`（可選）。  
   - 回傳 `{ stats, bottleneck_by_throughput, bottleneck_by_ratio }`。

7. **analyzeControl(v)**  
   - 每條剋線算 `control_ratio = v[ctl]/v[to]`；標記 `max_pressure`。  
   - 回傳 `{ stats, max_pressure }`。

### Phase 3：報告生成

8. **報告組裝**  
   - 層 1：`v_raw`、`v_season`、排序、top2／bottom2 摘要。  
   - 層 2：`production`、`chain_stats`、`bottleneck`、從 `flow_descriptions` 取對應 id 的 **positive／stress** 填 `bottleneck_explanation`。  
   - 層 3：`control`、`control_stats`、`max_pressure`、對應剋線的 **stress** 填 `max_pressure_explanation`。  
   - 病例欄位：依規則從上述結果組 `chief_complaint`、`findings`、`diagnosis`、`falsifiable_predictions`（預測可先做簡單版：例如「若流年加強 X，則 Y 段流量預期上升」）。

### Phase 4：與現有系統接軌（可選、分步）

9. **輸入接軌**  
   - 從現有 `bazi` 或 API 結果組出 `pillars`，呼叫上述管線，得到三層報告＋病例文本。  
   - 可新增 **API**（例如 `GET/POST .../wuxing-flow-report`）或在前端 **計算流程** 中多一步「五行生剋報告」，與現有五行區塊並列。

10. **輸出接軌**  
    - 若前端已有「五行」或「戰略看板」區塊，可新增一區「生剋流量／制衡壓力」或「病例式診斷」，資料來源為本管線輸出。  
    - 必要時做一層 **id → 中文**（或 zh）對照，與現有 `FIVE_ELEMENTS_ORDER`、`SHENG_MAP`、`KE_MAP` 一致。

### Phase 5：回測與調參（建議第二階段）

11. 設計 **分析記錄** 結構（如：命盤識別、`v_raw`、`v_season`、`production`、`control`、bottleneck／max_pressure、KB 版本、參數 alpha／beta、時間戳）。  
12. 實作「寫入 DB 或檔案」與查詢介面，供日後事件回測與調參使用。

---

## 四、檔案與目錄建議

- **靜態 KB**：`data/wuxing/elements.json`、`stems.json`、`branches.json`、`month_branches.json`、`flow_descriptions.json`（或合併為少數幾個 JSON，依可讀性取捨）。  
- **演算法與報告**：`js/calc/wuxingFlowPipeline.js`（或拆成 `wuxingVectorize.js`、`wuxingFlowAnalyzer.js`、`wuxingReportBuilder.js`）。  
- **型別／常數**：可放在同一模組或從 `constants.js` 擴充一區塊「五行生剋用常數」，避免與現有紫微／五行強弱常數混在一起。  
- **測試**：可為 `vectorize`、`applySeason`、`computeFlows`、`analyzeBottlenecks`、`analyzeControl` 各寫單元測試（固定 pillars 與 KB，比對預期向量與瓶頸／壓力）。

---

## 五、小結

- **想法**：spec 的「可驗證、可回測、規則進 KB、運算簡單」與專案既有五行／紫微架構相容，建議新系統**專注四柱→向量→生剋圖→報告**，與現有五行強弱／戰略看板並存，再視需求整合。  
- **建議**：五行 ID 在 KB 與演算用英文，對外與既有 UI 用中文；藏干可從既有 `CANGGAN_DATA` 轉出或適配；月令係數寫死於 KB；回測留作 Phase 2。  
- **施作**：按 Phase 1（KB＋型別）→ Phase 2（管線）→ Phase 3（報告）→ Phase 4（接軌）→ Phase 5（回測）順序執行，並依四柱來源與月支約定做最小必要修正。

---

## 六、使用方式（已實作）

- **KB**：`data/wuxing/` 下已建立 `elements.json`、`stems.json`、`branches.json`、`month_branches.json`、`flow_descriptions.json`。
- **管線**：`js/calc/wuxingFlowPipeline.js` 已掛在 `window.WuxingFlowPipeline`，並在 `index.html` 引入。
- **四柱**：`buildPillarsFromBazi(bazi)` 支援兩種格式：(1) `bazi.display`（yG/yZ, mG/mZ, dG/dZ, hG/hZ）；(2) `bazi.year`、`bazi.month`、`bazi.day`、`bazi.hour` 各含 `stem`、`branch`。
- **一鍵執行**：
  1. `const kb = await WuxingFlowPipeline.loadKB('/data/wuxing');`（或傳入已載好的 kb）
  2. `const pillars = WuxingFlowPipeline.buildPillarsFromBazi(contract.bazi);`
  3. 若 `pillars` 非 null：`const out = WuxingFlowPipeline.runPipeline(pillars, kb);`，`out.report` 即三層報告與 `chief_complaint`、`findings`、`diagnosis`、`falsifiable_predictions`。
- **接軌 UI**：可在計算完成、`contract` 設定後，非同步執行上述步驟並將 `out.report` 存到 `window.wuxingFlowReport` 或 `contract.bazi.wuxingFlowReport`，供戰略看板或新區塊使用。
