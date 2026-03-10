# 身宮 12 宮 BodyPalaceEngine：可行性分析與執行計畫

## 一、建議摘要

BodyPalaceEngine 負責三件事：

1. **根據 bodyPalace → 查出該宮位的「行為矩陣」**（BODY_BEHAVIOR_MAP）
2. **根據 lifePalace vs bodyPalace → 判斷有沒有命身錯位**（getMisalignmentMessage）
3. **根據 bodyPalace + 雙忌狀態 → 判斷是否進入極端風險模式（Double Ji）**（DOUBLE_JI_EFFECTS）

輸出給 LLM／前端 UI 使用，用於命書口吻與身宮說明卡片。

---

## 二、可行性分析

### 2.1 資料來源是否齊全

| 輸入 | 來源 | 現狀 |
|------|------|------|
| **lifePalace** | 命宮固定為 12 宮之首 | ✅ 命宮即 `PALACE_DEFAULT[0]`，或可對應為 `"self"`（命身同宮時） |
| **bodyPalace** | 身宮所在宮位 | ✅ 已有 `findShengongPalace(ziwei)`（consultationScriptEngine.js）：依 `ziwei.core.shengongBranch` + `minggongBranch` 算出身宮在 PALACE_DEFAULT 的索引，回傳宮位名（命宮、兄弟、夫妻…） |
| **雙忌：流年忌 + 小限忌** | 四化疊宮 | ✅ `fourTransformations` + `calculateOverlapTransformations` 已為每個宮位注入 `transformations.liunian`、`transformations.xiaoxian`；可遍歷 `palaceMap` 找出「同時有 liunian.type === '忌' 且 xiaoxian.type === '忌'」的宮位，即為 doubleJiPalace |

結論：**命宮、身宮、流年／小限化忌疊宮資料皆已存在**，只需對接與封裝。

### 2.2 宮位 ID 對應

建議書用英文 `PalaceId`（self, siblings, spouse…），專案目前用中文（命宮、兄弟、夫妻…）。需要一層對應：

- **中文 → PalaceId**：命宮→self、兄弟→siblings、夫妻→spouse、子女→children、財帛→wealth、疾厄→health、遷移→travel、僕役→friends、官祿→career、田宅→property、福德→fortune、父母→parents
- **PalaceId → 中文**：供 UI 顯示或 LLM 文案使用

實作時在 engine 內維護雙向對照即可。

### 2.3 雙忌定義與現有邏輯一致

建議書定義：**流年忌 + 小限忌 疊在同一宮** = 雙忌。  
現有 `criticalRisks` 是「同一宮位 jiCount >= 2」（任意兩層以上化忌即算）。  
若嚴格限定「流年忌 + 小限忌」才觸發 BodyPalace 的「極端風險模式」，可單獨在 engine 內判斷：該宮同時有 `liunian.type === '忌'` 且 `xiaoxian.type === '忌'`，再回傳 DOUBLE_JI_EFFECTS。

---

## 三、執行計畫

### Phase 1：核心引擎（可共用前端 + API）

1. **新增 `js/calc/bodyPalaceEngine.js`**（或 `worker/src/body-palace-engine.ts` 若希望命書僅在 Worker 用）
   - 定義 `PalaceId`、`BodyBehavior`、`BODY_BEHAVIOR_MAP`、`getMisalignmentMessage`、`DoubleJiContext`、`DoubleJiEffect`、`DOUBLE_JI_EFFECTS`、`BodyPalaceInput`、`BodyPalaceReport`、`computeBodyPalaceReport`。
   - 宮位對應：內部使用英文 PalaceId，對外可接受「中文宮位名」或 PalaceId；提供 `zhToPalaceId` / `palaceIdToZh` 對照表（對齊 PALACE_DEFAULT）。
   - **輸入**：`lifePalace`、`bodyPalace`（皆可為中文或 PalaceId）、`doubleJi?: { hasLiuNianJi, hasXiaoXianJi, doubleJiPalace? }`。
   - **輸出**：`BodyPalaceReport`（behavior、misalignmentMessage、doubleJiEffect 等）。

2. **雙忌輸入的組裝**
   - 新增一層：`buildDoubleJiFromOverlap(overlapAnalysis): DoubleJiContext | null`。
   - 邏輯：遍歷 overlapAnalysis.palaceMap（或等價結構），找任一宮位同時具備 `transformations.liunian?.type === '忌'` 且 `transformations.xiaoxian?.type === '忌'`；若有，回傳 `{ hasLiuNianJi: true, hasXiaoXianJi: true, doubleJiPalace: 該宮之 PalaceId }`；若無則回傳 null 或 hasLiuNianJi/hasXiaoXianJi 依實際有無流年忌／小限忌設為 true/false（依產品需求決定）。

### Phase 2：身宮資料注入（前端 + compute 流程）

3. **抽出或共用「身宮所在宮位」**
   - 將 `findShengongPalace(ziwei)` 抽到 `js/calc/helpers.js` 或 `js/calc/baziCore.js`，或獨立 `js/calc/shengongPalace.js`，供 engine 與其他模組使用。
   - 命宮：固定為 `PALACE_DEFAULT[0]` 或由 ziwei 的命宮地支對應之宮名。

4. **在 compute 流程中產生 BodyPalaceReport**
   - 在 `js/calc.js` 或現有「算完 ziwei + horoscope + fourTransformations + overlapAnalysis」的流程中：
     - 呼叫 `findShengongPalace(ziwei)` 得 bodyPalace（中文）；
     - lifePalace = 命宮（中文）；
     - 呼叫 `buildDoubleJiFromOverlap(overlapAnalysis)` 得 doubleJi；
     - 呼叫 `computeBodyPalaceReport({ lifePalace, bodyPalace, doubleJi })` 得 report。
   - 將 **report** 掛在 contract / payload 的適當欄位（例如 `features.bodyPalaceReport` 或 `ziwei.bodyPalaceReport`），讓前端與 API 都能讀到。

### Phase 3：前端 UI

5. **身宮說明卡片**
   - 使用 `report.behavior.core`、`report.behavior.advice` 渲染「身宮在 XX 宮」的說明與顧問建議。
   - 若 `report.doubleJiEffect` 存在，顯示紅色警戒區塊 + 對應 `genericStrategy` + 可選 CTA「建議找專業」。

6. **命身錯位**
   - 顯示 `report.misalignmentMessage`（命身同宮 vs 不同宮的說明）。

### Phase 4：命書 API / LLM

7. **Worker 命書**
   - 若 compute/all 或命書 API 已收到 chart 內含 `overlapAnalysis`、`ziwei`，可在 Worker 內重算或接收前端傳來的 **BodyPalaceReport**（建議 report 隨 chart 一併傳入，避免 Worker 重複依賴 iztro 與四化邏輯）。
   - 命書 prompt 模板中新增一段：將 `BodyPalaceReport`（behavior、misalignmentMessage、doubleJiEffect）以結構化方式寫入，供 LLM 生成「身宮在 12 宮」的命書口吻。

8. **generateBodyPalaceText(report)**
   - 可為單一函數：輸入 `BodyPalaceReport`，輸出命書用段落或 bullet；實作可以是「模板拼接」或再呼叫 LLM 做短段生成（依產品需求）。

---

## 四、檔案與依賴

| 項目 | 說明 |
|------|------|
| **新增** | `js/calc/bodyPalaceEngine.js`（或 `worker/src/body-palace-engine.ts`） |
| **抽出/共用** | `findShengongPalace` → helpers / baziCore / 或獨立 shengong 模組 |
| **依賴** | ziwei（core.shengongBranch, minggongBranch）、overlapAnalysis（palaceMap）、PALACE_DEFAULT / BRANCH_RING |
| **輸出** | BodyPalaceReport 寫入 contract / features，供前端與 API 使用 |

---

## 五、風險與注意

- **宮位順序**：PALACE_DEFAULT 與 iztro/現有 buildSlots 一致，`findShengongPalace` 已依同一套 BRANCH_RING 與命宮索引計算，不需改動。
- **雙忌定義**：若日後要納入「大限忌 + 流年忌」等其它組合，可在 `buildDoubleJiFromOverlap` 或 engine 內擴充，不影響現有 BODY_BEHAVIOR_MAP / DOUBLE_JI_EFFECTS 結構。
- **語系**：BODY_BEHAVIOR_MAP / DOUBLE_JI_EFFECTS 目前為中文；若未來要 i18n，可改為 key 對應多語系文案。

---

## 六、結論與建議

- **可行性**：高。身宮宮位、命宮、流年／小限化忌疊宮資料皆已存在，只需封裝成 BodyPalaceEngine 與 BodyPalaceReport，並在 compute 流程中組裝 doubleJi 與 report。
- **建議實作順序**：Phase 1（engine + 宮位對照 + buildDoubleJiFromOverlap）→ Phase 2（身宮注入 + 掛上 report）→ Phase 3（前端 UI）→ Phase 4（命書 API / LLM）。
- **建議檔名**：專案以 JS 為主則用 `bodyPalaceEngine.js` 置於 `js/calc/`；若命書僅在 Worker 且希望 TypeScript 則可 `worker/src/body-palace-engine.ts`，並在 build 時讓前端透過既有 pipeline 取得 report（例如由 compute 算出後寫入 payload）。

若你願意，下一步可從 Phase 1 開始：新增 `bodyPalaceEngine.js`（含你提供的 BODY_BEHAVIOR_MAP、DOUBLE_JI_EFFECTS、computeBodyPalaceReport），並實作 `buildDoubleJiFromOverlap` 與宮位中英對照。

---

## 七、調整：同一顆引擎，兩種濃度（UI 輕量 / 命書 Pro）

### 7.1 設計要點

- **前端 UI**：只顯示輕量建議（不下禁令、不嚇人）。
- **後端命書**：改用 Pro 版（本質 + 戰略建議，可給 LLM 或模板拼接）。
- **同一顆引擎**：一份資料結構，依使用端選「濃度」。

### 7.2 建議資料結構

**身宮一般文案（一引擎兩濃度）**

```js
const BODY_COPY = {
  [palaceId]: {
    ui: {
      title: string,     // 給前端卡片標題用
      oneLiner: string,  // 一句 summary
      tip: string        // 一句輕量建議（不下禁令、不嚇人）
    },
    pro: {
      core: string[],    // 命書在講「本質」時可以用的句子
      advice: string[]  // 命書在給「戰略建議」時可以用的句子
    }
  }
};
```

**身宮 + 雙忌時（僅在 bodyPalace === doubleJiPalace 時使用）**

```js
const BODY_DOUBLE_JI_TEXT = {
  [palaceId]: {
    cause: string,     // 原因／狀態
    pattern: string,   // 模式／慣性
    directive: string  // 一句明確指引（可給 LLM 或直接組字串）
  }
};
```

組合範例（雙忌在身宮時給 LLM／命書用）：

```js
if (doubleJi && doubleJi.doubleJiPalace === bodyPalace) {
  const tone = BODY_DOUBLE_JI_TEXT[bodyPalace];
  const text = `${tone.cause} ${tone.pattern} ${tone.directive}`;
}
```

### 7.3 可行性結論

| 項目 | 結論 |
|------|------|
| **同一顆引擎** | ✅ 可行。引擎只負責依 bodyPalace 查表 + 命身錯位 + 雙忌判斷；輸出層依「前端 vs 命書」選用 `BODY_COPY[].ui` 或 `BODY_COPY[].pro`。 |
| **前端只顯示輕量** | ✅ 可行。前端只讀 `report.behaviorUi`（即 BODY_COPY[bodyPalace].ui：title、oneLiner、tip），不讀 pro。 |
| **命書用 Pro** | ✅ 可行。Worker／命書 prompt 只讀 `report.behaviorPro`（BODY_COPY[bodyPalace].pro：core、advice）；雙忌時再疊加 `BODY_DOUBLE_JI_TEXT[bodyPalace]`（cause、pattern、directive）或預組字串。 |
| **雙忌文案分離** | ✅ 建議。雙忌用 BODY_DOUBLE_JI_TEXT（諮詢語氣、李伯彥版），與一般 BODY_COPY 分開，邏輯清晰、日後替換方便。 |

### 7.4 建議的 Report 輸出結構

引擎輸出建議統一為一份 report，由前端／API 各取所需：

```ts
interface BodyPalaceReport {
  lifePalace: PalaceId;
  bodyPalace: PalaceId;
  // 前端用（輕量）
  behaviorUi: { title: string; oneLiner: string; tip: string };
  // 命書用（Pro）
  behaviorPro: { core: string[]; advice: string[] };
  misalignmentMessage: string;
  // 雙忌在身宮時才有
  doubleJiCopy?: { cause: string; pattern: string; directive: string } | null;
}
```

- **前端**：只取 `behaviorUi`（+ 若有 `doubleJiCopy` 可顯示輕量警示，例如只顯示 directive 或「今年此宮壓力大，建議謹慎」）。
- **命書**：取 `behaviorPro` + `misalignmentMessage`；若存在 `doubleJiCopy`，再疊加 `${cause} ${pattern} ${directive}` 或單獨一段「雙忌提醒」。

### 7.5 實作建議

1. **單一資料檔**：`BODY_COPY`（含 ui / pro）與 `BODY_DOUBLE_JI_TEXT` 放在同一模組（如 bodyPalaceEngine.js），便於維護與 i18n 擴充。
2. **雙忌觸發條件不變**：仍為「流年忌 + 小限忌 疊在同一宮」且「該宮 = 身宮」時才寫入 `doubleJiCopy`。
3. **命書模板**：Pro 段用 `behaviorPro.core`、`behaviorPro.advice`；雙忌段用 `doubleJiCopy.cause / pattern / directive` 或預組好的單一文案，避免前後端口吻混用。
4. **前端雙忌**：若要顯示雙忌，建議用一句輕量句（例如只取 `directive`，或另加一句「今年此宮壓力較大，決策宜謹慎」），不下重話，與命書 Pro 版區隔。

### 7.6 前端 UI 預計呈現位置

- **頁面**：主頁 `index.html`。
- **區塊**：**「行動策略 · 流月與戰術」**（`#ws-act`）底下的 **「2026 戰術建議（動態決策）」**（`#ws-strategy`）。
- **容器**：目前戰略內容全部灌進 **`#tacticalBox`**，由 `strategic-panel.js` 的 `renderStrategicPanel()` 一次輸出（命主、身主、五行、十神戰略）。
- **建議做法**：在 **strategic-panel.js** 內，於 **命主／身主區塊之後、五行區塊之前**，新增一節「身宮在 XX 宮」輕量卡片：
  - 顯示 `report.behaviorUi.title`、`report.behaviorUi.oneLiner`、`report.behaviorUi.tip`（資料來自 contract 的 `bodyPalaceReport`，由 compute 流程寫入）。
  - 若存在 `report.doubleJiCopy`，可在同一張卡下方加一句輕量提示（例如只顯示 `directive` 或固定句「今年此宮壓力較大，決策宜謹慎」），不重話、不嚇人。
- **不需**：另開新 section、新 nav chip 或新頁；與現有命主／身主同屬「戰略／行為脈絡」，放在同一 tacticalBox 內最連貫。
