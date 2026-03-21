# 大限宮干與四化飛星：以 iztro 為單一資料來源

## 一、錯誤根因（54–63 歲大限例）

### 正確基準

- 54–63 歲大限在 **甲辰宮**（僕役宮／交友宮）。
- **該步大限的宮干** = 甲（不是本命盤上僕役宮的宮干）。
- 甲干四化：廉貞化祿、破軍化權、武曲化科、太陽化忌。
- 四化飛星落宮 = 本命盤該星所在宮位（廉貞→兄弟、破軍→子女、武曲→田宅、太陽→事業）。

### 命書曾出現的三組錯用

| 來源 | 宮干 | 四化 | 說明 |
|------|------|------|------|
| 大限一覽 | 丙 | 天同祿、天機權、文昌科、廉貞忌 | 誤用丙干（流年或他步） |
| 本次大限四化飛星 | 戊 | 貪狼祿、太陰權、右弼科、天機忌 | 誤用**本命僕役宮宮干**順推 |
| 正確 | **甲** | 廉貞祿、破軍權、武曲科、太陽忌 | 該步大限宮干 = 甲辰的甲 |

### 程式邏輯錯誤點

1. **大限四化飛星**：原先用 `palaceStemMap[decadalPalace]`（本命盤該宮的宮干）當「大限宮干」。本命僕役宮可能是戊戌等，得到戊干四化，整組錯誤。
2. **大限一覽**：若 `decadalLimits` 來自前端 BaziCore，其 `stem` 為「命宮干 + 索引順推」，與 iztro 的「該步大限所在宮位的干支」未必一致，可能出現丙等錯誤。
3. **單一來源**：大限一覽與本次大限四化飛星應共用同一套「每步大限的 stem/branch」，且應來自 **iztro**（大限宮位干支），不與 BaziCore 順推宮干混用。

---

## 二、已實作修正

### 1. 大限四化飛星改用「該步大限的 stem」

- **檔案**：`worker/src/gonggan-flows.ts`、`worker/src/lifeBookPrompts.ts`
- **邏輯**：
  - `buildDecadalSihuaFlows` 新增可選參數 **`decadalStem`**。
  - 若有 `decadalStem`（來自 `decadalLimits[當前].stem`），則用其查十干四化，**不再**用 `palaceStemMap[decadalPalace]`。
  - `getPlaceholderMapFromContext` 呼叫時傳入 `firstLimit?.stem` 作為 `decadalStem`。
- **效果**：只要 `chart_json.decadalLimits[].stem` 是該步大限的宮干（建議來自 iztro），大限四化飛星即為甲干四化並正確飛入兄弟／子女／田宅／事業。

### 2. Worker /compute/all 產出 decadalLimits（12 步）來自 iztro

- **檔案**：`worker/src/index.ts`
- **邏輯**：
  - 依 `ziweiCore.wuxingju`（五行局）算 `baseStartAge`（水二局 2…火六局 6）。
  - 對 step 0..11 各呼叫一次 `astrolabe.horoscope(targetDate, timeIndex)`，其中 `targetDate` 取該步大限中點年齡（如 54–63 取 59 歲）。
  - 每步 **stem / branch / mutagenStars** 取自 iztro 的 `decadal.heavenlyStem`、`decadal.earthlyBranch`。
  - **大限宮位名（palace）**：必須依「命盤宮序」由 **`palaceByBranch[decadal.earthlyBranch]`** 取得，**不可**使用 iztro 的 `decadal.palaceNames[0]`。因 iztro 的 palaceNames 可能為固定人事宮序（命兄夫子財疾遷友官田福父），與實際命盤「命宮地支旋轉」後的順序（命→父→福→田→官→交→遷→疾→財→子→夫→兄）不一致，會導致 54–63 顯示成夫妻宮而非交友宮。
  - `palaceByBranch` 由 `buildPalaceByBranch(ziweiCore.minggongBranch)` 建表，與流年命宮查表同源。
  - 將此 12 筆陣列掛在 **`features.ziwei.decadalLimits`** 回傳。
- **效果**：大限一覽的「大限命宮」與四化飛星、十年功課的宮位一致，且 54–63 正確為僕役／交友宮（甲辰）。

### 3. 十年主線與功課

- 十年主線與功課依 `currentDecadalHomework`，其內容依 `firstLimit?.mutagenStars`（或 fourTransformations.decadal）與 `getStarTransformMeaning` 等組句。
- 若 `decadalLimits[].mutagenStars` 改為由 iztro 的 stem 計算（如上），則主線與功課的論述會自動建立在正確四化上。

---

## 三、前端與命書需配合處

### 1. 命書用 chart 時，decadalLimits 應來自 iztro

- 產生命書時傳入的 **chart_json**，其 **decadalLimits** 應為 worker `/compute/all` 回傳的 **`features.ziwei.decadalLimits`**（或與 iztro 一致的來源）。
- 若前端用 BaziCore 自算 `decadalLimits` 並覆蓋掉 worker 回傳，會導致大限一覽與四化飛星再次錯用「非該步大限」的宮干。
- **已實作（expert-admin.html）**：組 `chartForApi` 時，若存在 `window.contract.ziwei.decadalLimits`（即本次計算來自 worker 且回傳了 iztro 的 12 步），則以它覆寫 `chartForApi.decadalLimits` 與 `chartForApi.ziwei.decadalLimits`，不再使用 `exportCalculationResults()` 內 BaziCore 的 decadalLimits。

### 2. 12 宮位顯示天干＋地支（可選）

- 使用者希望 12 宮位顯示「天干＋地支」（例如甲辰、乙巳）。
- iztro 的 astrolabe 若提供每宮的 `heavenlyStem` / `earthlyBranch`，可由 worker 在回傳的 `features.ziwei.palaces`（或新欄位）帶出各宮干支，前端僅顯示即可。
- 若目前 iztro 回傳的 palaces 只有地支或無干支，需再查 iztro 文件或原始型別，補上宮位干支後，前端再引用顯示。

---

## 四、資料流整理（單一來源）

```
iztro astrolabe.horoscope(該步中點年齡)
  → 每步 decadal: { heavenlyStem, earthlyBranch, palaceNames }
  → worker：stem/branch 用 iztro；palace 用 palaceByBranch[earthlyBranch]（命盤宮序），不用 palaceNames
  → decadalLimits[]（stem, branch, palace, mutagenStars）回傳 features.ziwei.decadalLimits

前端（計算後）
  → 以 features.ziwei.decadalLimits 作為 chart 的 decadalLimits（不覆蓋為 BaziCore）
  → 產生命書時 chart_json.decadalLimits = 上述來源

命書 worker
  → 大限一覽：decadalLimitsList 來自 chart_json.decadalLimits（每步 stem/branch）
  → 本次大限四化飛星：firstLimit.stem → buildDecadalSihuaFlows(..., decadalStem)
  → 十年主線與功課：firstLimit.mutagenStars（由 stem 推得）
```

這樣可保證：**大限一覽**、**本次大限四化飛星**、**十年主線與功課** 三者都建立在同一組「該步大限宮干（iztro）」上，不再混用丙干、戊干或本命宮干順推。

### 五、大限宮位順序與驗證

- **命盤宮序**（順行大限依此）：由命宮地支起，地支順時針（寅→卯→…→丑）對應的宮位，即 `buildPalaceByBranch(命宮地支)`。例：命宮在亥則順序為 命(亥)→父(子)→福(丑)→田(寅)→官(卯)→交(辰)→遷(巳)→疾(午)→財(未)→子(申)→夫(酉)→兄(戌)。
- **快速檢查**：若 54–63 歲顯示為「夫妻宮」或「疾厄宮」而非「交友／僕役宮」，代表大限宮位名未依命盤宮序、誤用了固定人事宮序或 iztro 的 `palaceNames`；修正後應為 `palaceByBranch[iztro.decadal.earthlyBranch]`。
