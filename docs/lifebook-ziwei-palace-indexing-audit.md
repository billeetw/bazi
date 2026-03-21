# 紫微宮位對應與命書錯宮問題稽核（2026-03）

## 一、你遇到的現象（1972-08-02 申時，命宮應為太陰）

- 讀者版出現 **武曲＋天相** 在命宮、其餘宮位連鎖錯位。
- 同一時期曾出現 **財帛見紫微**、與實盤不符等狀況。

這類「整張盤像被旋轉錯一格或多格」的症狀，**高度指向：宮位對應演算法與 chart 來源不一致**，而不是單一星曜句庫錯誤。

---

## 二、根因（機制說明）

### 2.1 iztro `palaces[]` 的真相（以 `iztro@2.x` 為準）

- `astro.js` 以 `for (i = 0..11)` 建 12 格；每格有 **`name`**（已由 i18n 轉成語系下的宮名，如 zh-TW：`命宮`、`財帛`…）。
- 陣列順序為 **從寅宮起算的地支序**（與專案內 `BRANCH_RING` 寅=0… 一致）。
- **最可靠的對宮方式**：直接讀每格的 **`palaces[i].name`**，再對到本系統的 `toPalaceCanonical`，**不必**憑第二來源「猜」哪一格是命宮。

### 2.2 先前 worker 的兩個問題

1. **命宮地支讀取順序與前端不一致**  
   - 前端 `buildSlotsFromZiwei` 使用 **`ziwei.core.minggongBranch`**（沒有時才 fallback `'寅'`）。  
   - worker `readZiweiSoulBranch` 曾 **優先** `earthlyBranchOfSoulPalace`，若與 `minggongBranch` **不一致**，旋轉公式 `(mingIdx - i + 12) % 12` 會把**整盤宮名對錯**，命宮變成別宮的星組（例如像錯一格的武曲天相）。

2. **僅用旋轉、忽略 `name`**  
   - 即使 iztro 已給每格正確宮名，若仍只依地支旋轉 + 錯的「命宮地支」來源，一樣會錯。

### 2.3 「authority 盤」與 starByPalace

- 在具備 **12 格 `palaces`** 時，命書 normalize 路徑應 **只信盤面格內的星曜與宮名**，**不要用**可能由舊邏輯／快取寫壞的 `starByPalace` 再聯集，否則錯星會黏在錯宮上。

---

## 三、已實作的修正（worker）

| 項目 | 說明 |
|------|------|
| `readZiweiSoulBranch` | **優先 `core.minggongBranch`**，與前端網格一致；再退回 `earthlyBranchOfSoulPalace`。 |
| `resolvePalaceCanonForSlot` | 每格 **有 `name` 時以 `name` 為準**（經 `palaceNameToZhTW` + `toPalaceCanonical`）；**無 `name` 時**才用命宮地支旋轉。 |
| `buildAuthoritativeStarMapFromZiweiPalaces` | 滿 12 格時用上述規則建星表；任一格無法解析則退回舊路徑（避免半套資料硬算）。 |
| `mergeStarNamesFromZiweiPalaces` | 與上列同一套 `resolvePalaceCanonForSlot`，避免合併時宮位對錯。 |
| `findZiweiPalaceSlotIndexForCanonical` | 亮度／strength 讀取改為 **依宮名找對 `palaces[i]`**，不再誤用「固定宮序＝陣列索引」。 |

---

## 三點五、硬規則（Spec 建議落版）

### 規則 A（name 鎖宮即禁止旋轉覆蓋）

- **只要 `ziwei.palaces[i].name` 存在且可正規化到 canonical 宮名，該格宮位即鎖定。**
- 此時不得再以 rotation（`minggongBranch` / `earthlyBranchOfSoulPalace`）覆蓋該格宮位歸屬。
- rotation 僅允許在「該格無 `name`」時作 fallback。

### 規則 B（同格同源，不得混源）

- 一旦某宮由 `palaces[i].name` 鎖定，該宮 render input 的：
  - 主星（major）
  - 輔星（minor）
  - 雜曜（adjective / 其他）
  - 亮度（brightness/strength）
- **必須全部來自同一個 `palaces[i]`。**
- 禁止把 `starByPalace` 或其他 palace-indexed source 的資料 merge 回此宮覆蓋。

### 規則 C（starByPalace 角色）

- 若 `ziwei.palaces` 為完整 12 宮，則 `palaces` 為 render input 唯一來源。
- `starByPalace` 僅可用於 debug/比對，不得 merge 進正式渲染輸入。
- 只有在 `palaces` 不完整（缺格/缺關鍵欄位）時，才可啟用 fallback 路徑。

---

## 四、D1 / KV 是否會造成「命宮星變錯」？

| 來源 | 是否會改 **chart 星曜** | 說明 |
|------|-------------------------|------|
| **KV / D1（content）** | **不會** | 快取的是 **文案／骨架**（如 `lifebookSection`），不存你個人命盤。頂多造成 **段落模板舊**，不會把武曲寫進命宮。 |
| **POST body 的 chartJson** | **會** | 命宮主星完全由 **`ziwei.palaces` / `starByPalace` / 命宮地支欄位** 決定；若前端送錯或舊快取，就會錯。 |
| **瀏覽器／中介快取 chart** | **可能** | 若 UI 重用舊的 `contract.ziwei` 而沒重算，可能送舊盤給 worker。 |

結論：**此問題首先當成「盤資料與對宮演算法」處理**；D1/KV 不是主因，除非另有未知 pipeline 把 chart 存進 D1（目前命書讀者路徑以請求內容為準）。

---

## 五、建議你部署後如何驗證

1. 重新排盤或強制刷新前端，確認請求 body 內 `ziwei.core.minggongBranch` 與你紙盤命宮地支一致。
2. 抽查 `ziwei.palaces`：**找到 `name === '命宮'`（或 en 之對應）那一格**，其 `majorStars` 應含 **太陰**。
3. 再開命書「命宮」章節，主星應與該格一致。

---

## 六、後續技術債（可選）

- `worker/src/index.ts` 內 `extractZiweiMainStars` 若仍單獨依 `earthlyBranchOfSoulPalace` 旋轉，與本 normalize 路徑可能不一致；若其他 API 仍依賴該函式，建議對齊 **name-first + minggongBranch 優先**。

---

## 七、參考程式位置

- `worker/src/lifebook/normalize/normalizePalaces.ts` — `readZiweiSoulBranch`、`resolvePalaceCanonForSlot`、`getStarByPalaceFromChart`
- `worker/src/lifeBookPrompts.ts` — `getPalaceStarsStrengthMap`（改為 `findZiweiPalaceSlotIndexForCanonical`）
- `js/calc.js` — `buildSlotsFromZiwei`（前端對照）
- `worker/node_modules/iztro/lib/astro/astro.js` — `palaces[i].name` 來源
