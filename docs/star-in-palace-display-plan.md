# 星曜在宮位特定表現：前端命盤顯示實作分析

## 一、現況

### 1.1 資料結構

| 類別 | copy_key 格式 | dbContent | 說明 |
|------|---------------|-----------|------|
| 宮位 | `palace.命宮` | `palaces["命宮"]` | 宮位通用解釋 |
| 星曜 | `star.紫微` | `stars["紫微"]` | **星曜通用解釋**（不區分宮位） |

目前 `stars` 只有「星曜本身」的解釋，沒有「某星在某宮」的特定表現。

### 1.2 宮位詳解顯示流程（palace-detail.js）

點選宮位時，`selectPalace(name, options)` 會：

1. 取得該宮位的星曜列表：`getStarsForPalace(ziwei, name)`
2. 顯示宮位解釋：`dbContent.palaces[name]`
3. 對每顆星顯示：`dbContent.stars[s]`（**同一顆星在所有宮位都顯示相同內容**）

```javascript
// 現有邏輯（約 192–212 行）
stars.map((s) => {
  var starRaw = ContentUtils.getContentValue(dbContent, "stars", s, null);
  var explain = starRaw || t("ziwei.starNoData");
  // 只用到 stars[s]，沒有「星+宮」的組合查詢
  return `<div>【${s}】${explain}</div>`;
});
```

---

## 二、目標

點選宮位時，每顆星的顯示應為：

1. **星曜通用解釋**（既有 `stars[s]`）
2. **該星在該宮的特定表現**（新增）

例如：紫微在命宮 vs 紫微在財帛宮，應有不同的「宮位特定表現」說明。

---

## 三、資料格式設計

### 3.1 新增 copy_key 格式：`starPalace.{星名}_{宮名}`

| copy_key | content | 說明 |
|----------|---------|------|
| `starPalace.紫微_命宮` | 紫微在命宮：核心自我與領導力在此宮發揮… | 主星在命宮的特定表現 |
| `starPalace.火星_官祿宮` | 火星在官祿：事業上容易衝動決策… | 煞星在官祿的特定表現 |
| `starPalace.文昌_夫妻` | 文昌在夫妻：理性思維影響親密關係… | 輔星在夫妻宮的特定表現 |

**命名規則**：

- 星名：與 iztro / content 一致（紫微、天機、火星、文昌…）
- 宮名：與 `PALACE_DEFAULT` 一致（命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母）
- 分隔符：底線 `_`（避免與現有 `palace.`、`star.` 衝突）

### 3.2 宮位 key 對照

`constants.js` 的 `PALACE_DEFAULT` 為：

```
命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母
```

注意：部分 content 可能用「官祿宮」等全名，需統一。建議 copy_key 一律用簡稱（兄弟、夫妻、官祿…）與前端一致。

---

## 四、實作步驟

### 4.1 後端：擴充 content 結構

**檔案**：`worker/src/content-from-d1.ts`

```typescript
// 擴充 DbContent
export interface DbContent {
  palaces: Record<string, string>;
  stars: Record<string, string>;
  starPalaces: Record<string, string>;  // 新增：key = "星名_宮名"
  tenGods: Record<string, string>;
  wuxing: Record<string, { headline: string; content: string }>;
}

// buildContentFromRows 中新增
if (prefix === "starPalace") {
  out.starPalaces[key] = String(content);
}
```

**D1 匯入範例**：

```sql
INSERT INTO ui_copy_texts (copy_key, locale, content, category, description, updated_by, updated_at, created_at)
VALUES 
  ('starPalace.紫微_命宮', 'zh-TW', '紫微在命宮：你的核心自我與統御力在此發揮。領導特質明顯，容易成為群體中心。', 'content', '紫微在命宮的特定表現', 'admin', datetime('now'), datetime('now')),
  ('starPalace.火星_官祿', 'zh-TW', '火星在官祿：事業上容易衝動決策，行動力強但需注意人際摩擦。', 'content', '火星在官祿的特定表現', 'admin', datetime('now'), datetime('now'));
```

### 4.2 靜態 JSON fallback

**檔案**：`worker/content/content-zh-TW.json`（或對應 locale）

```json
{
  "palaces": { ... },
  "stars": { ... },
  "starPalaces": {
    "紫微_命宮": "紫微在命宮：你的核心自我與統御力在此發揮…",
    "火星_官祿": "火星在官祿：事業上容易衝動決策…"
  }
}
```

### 4.3 Worker GET /content/2026

確保 `buildContentFromRows` 與 `mergeContent` 都處理 `starPalaces`，並在靜態 fallback 中合併。

### 4.4 前端：ContentUtils 查詢

**檔案**：`js/ui/utils/content-utils.js`

```javascript
/**
 * 取得「星曜在該宮位」的特定表現
 * @param {Object} dbContent
 * @param {string} starName - 星曜名稱（如 紫微、火星）
 * @param {string} palaceName - 宮位名稱（如 命宮、官祿）
 * @param {string} [defaultText]
 * @returns {string|null}
 */
function getStarInPalaceContent(dbContent, starName, palaceName, defaultText) {
  var dict = dbContent && dbContent.starPalaces;
  if (!dict || typeof dict !== "object") return defaultText != null ? defaultText : null;
  var key = starName + "_" + palaceName;
  var val = dict[key];
  if (val != null && val !== "") return val;
  return defaultText != null ? defaultText : null;
}
```

並在 `ContentUtils` 導出此函式。

### 4.5 前端：palace-detail.js 顯示邏輯

**修改位置**：約 191–212 行，星曜卡片區塊

```javascript
// 原本
var explain = starRaw || t("ziwei.starNoData");

// 改為：通用解釋 + 宮位特定表現
var explain = starRaw || t("ziwei.starNoData");
var starInPalace = ContentUtils && typeof ContentUtils.getStarInPalaceContent === "function"
  ? ContentUtils.getStarInPalaceContent(dbContent, s, name, null)
  : null;

var fullExplain = explain;
if (starInPalace && starInPalace.trim()) {
  fullExplain = explain + "\n\n📍 " + t("ziwei.starInPalaceLabel") + "\n" + starInPalace;
}
```

**i18n 新增**（`data/i18n/zh-TW.json`）：

```json
"ziwei": {
  "starInPalaceLabel": "此星在此宮的表現"
}
```

### 4.6 顯示樣式建議

| 區塊 | 內容 | 樣式 |
|------|------|------|
| 星曜標題 | 【紫微】化祿 | 既有 |
| 通用解釋 | 核心本質：核心自我與統御力… | 既有 |
| 宮位特定表現 | 📍 此星在此宮的表現：紫微在命宮：你的核心自我… | 新增，可用不同顏色或縮排區隔 |

---

## 五、資料量估算

- 主星 14 × 宮位 12 = 168 筆
- 輔星 14 × 12 = 168 筆（若全寫）
- 煞星 6 × 12 = 72 筆（若全寫）
- 雜曜 38 × 12 = 456 筆（可選填）

**建議**：優先填寫主星、輔星、煞星在 12 宮的表現；雜曜可依需求逐步補齊。

---

## 六、您現有設定的對應方式

若您已有「主星、輔星、煞星在不同宮位的不同表現」的設定（例如在 Excel、Notion 或另一份 JSON），可：

1. **轉成 copy_key 格式**：每筆為 `starPalace.{星名}_{宮名}`，content 為該表現文字
2. **匯入 D1**：透過 admin-copy 或 migration/INSERT
3. **或直接寫入靜態 JSON**：在 `content-zh-TW.json` 的 `starPalaces` 中預填，再逐步遷到 D1

若您的設定格式與上述不同，可提供範例，再調整 key 命名與匯入腳本。

---

## 七、檢查清單

- [x] `content-from-d1.ts` 新增 `starPalaces` 與 `starPalace.` 解析
- [x] `content-zh-TW.json` 新增 `starPalaces` 區塊（14 主星 × 12 宮 = 168 筆）
- [x] Worker `mergeContent` 合併 `starPalaces`
- [x] `content-utils.js` 新增 `getStarInPalaceContent`
- [x] `palace-detail.js` 在星曜卡片中加上宮位特定表現
- [x] i18n 新增 `starInPalaceLabel`
- [x] 靜態 JSON 已填入 14 主星 × 12 宮的實際內容

---

## 八、替代方案：僅用既有 stars 擴充

若不想新增 `starPalaces` 結構，可考慮：

- 在 `stars` 的 content 中用結構化格式，例如 `---PALACE---\n命宮:xxx\n官祿:yyy`，前端解析後依宮位取對應段落。  
- 缺點：單一 key 內容過長、不易維護，且與現有「星曜通用解釋」混在一起，不建議。

**建議**：採用獨立的 `starPalaces` 結構，語意清晰、易擴充。
