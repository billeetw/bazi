# s00 改寫計劃：可行性分析與實作摘要

## 目標

s00 從「四化科普」改為**判讀引擎輸出**：把本命／大限／流年三層四化轉成「核心推力＋核心考題＋衝突／疊加／引爆點」，再產出可渲染的判讀句型與操作建議。

## 可行性結論：✅ 可行

### 現有資料是否足夠

| 項目 | 狀態 | 說明 |
|------|------|------|
| 三層四化結構化陣列 | ✅ 已有／可組 | `buildSiHuaLayers(chartJson)` 產出 benming/decadal/yearly，每層 lu/quan/ke/ji → starName + palaceName；`chartJson.sihuaLayers` 或 overlap 的 transformations 含 fromPalace/toPalace。 |
| 統一 event 格式 | ✅ 可實作 | 從 SiHuaLayers 或 sihuaLayers.transforms 組出 `{ layer, transform, starName, fromPalace, toPalace }[]`。Worker 內已有 `getOppositePalaceName`、`normPalaceIdToName`、`collectFourTransformsForPalace` 等，可組出完整 from/to。 |
| 規則觸發條件 | ✅ 可實作 | 20 條規則的 when 皆為「對 events 陣列的集合／計數／跨層比對」，無需 DSL，用判斷函式即可。 |
| 句型與建議產出 | ✅ 可實作 | 每條規則帶 messageTemplate / actionTemplate，placeholder 由 evidence 填入，產出 narrativeBlocks 與 action 前 N 條。 |
| 接回 s00 文案 | ✅ 可實作 | getPlaceholderMapFromContext 已對 s00 填寫多個 placeholder；新增 s00PatternNarrative、s00PatternActions 等，s00 模板改為「技術表＋命中規則 Top N＋今年建議」。 |
| 去重與瘦身 | ✅ 可實作 | 依 priority 排序、同句去重、同義規則留高優先級，文字量可降 30–50%。 |

### 風險與注意

- **fromPalace/toPalace 完整性**：若前端未送 `sihuaLayers`，目前由 mutagenStars + starByPalace 推「落宮」，再以對宮當 toPalace；若命盤邏輯與前端不一致，需對齊一處（建議以 Worker 推導為準）。
- **規則數量**：20 條先全上，之後可依命中率與反饋關閉或微調優先級。

---

## 實作步驟對應

| Step | 內容 | 產物 |
|------|------|------|
| 1 | 盤點並產出統一 events 陣列 | `buildS00Events(chartJson)` → `SiHuaEvent[]` |
| 2 | 規則引擎骨架 | `evaluateFourTransformPatterns(events)` → `PatternHit[]` |
| 3 | 20 條規則實作 | 規則庫 TS + 每條 when/evidence/message/action |
| 4 | 接回 s00 文案 | placeholder 注入 + s00 模板改用判讀區塊 |
| 5 | 去重與瘦身 | 輸出前 sort by priority、句子去重、同義留一 |

---

## 輸出規格（引擎）

- **輸入**：`chartJson`（已有 fourTransformations、decadalLimits、yearlyHoroscope、sihuaLayers／overlap 等）。
- **輸出**（供 s00 使用）：
  - `hotStars[]`：被多層命中的星
  - `hotPalaces[]`：被多層命中的宮
  - `patterns[]`：命中的規則（ruleId, priority, evidence）
  - `narrativeBlocks[]`：每條規則對應的判讀句（可渲染成 s00 段落）
  - 今年建議：取 rule.action 前 3 條，去重。

以上為討論基礎；規則庫與引擎實作見 `worker/src/lifebook/s00FourTransformRules.ts` 與 `s00PatternEngine.ts`。
