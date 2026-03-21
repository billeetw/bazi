# 流月層與 iztro 結構對應（S19 進階分析用）

## 一、iztro 流月標記

在 iztro 的輸出中，**流月**對應的 key 為 **`monthly`**。

- 大限：`decadal`
- 流年：`yearly`
- **流月：`monthly`**
- 流日：`daily`
- 流時：`hourly`

---

## 二、iztro Horoscope 取得方式

```ts
// 呼叫方式（與流年一致）
const targetDate = new Date(year, month - 1, 15);  // 該月 15 日
const horoscope = astrolabe.horoscope(targetDate, timeIndex);
```

- `horoscope.monthly` 即為**該月**的運限資料。
- 若要做「某年某月」流月，傳入該年該月的日期即可（例如 2026 年 3 月 → `new Date(2026, 2, 15)`）。

---

## 三、monthly 結構（HoroscopeItem）

與 `decadal`、`yearly` 同型別：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `index` | number | 流月命宮所在宮位索引 (0–11) |
| `name` | string | 運限名稱（i18n 後為「流月」等） |
| `heavenlyStem` | string | 月干（如「甲」「丙」） |
| `earthlyBranch` | string | 月支（如「寅」「午」） |
| `palaceNames` | string[] | 該運限的十二宮名稱（iztro 語系 key） |
| **`mutagen`** | **StarName[]** | **四化星 [祿, 權, 科, 忌] 對應的星名** |
| `stars` | FunctionalStar[][] | 流耀（流月流耀） |

---

## 四、與本專案 Flow 的對應（from / to 與大限、流年一致）

| 本專案 | iztro 來源 | 說明 |
|--------|------------|------|
| **layer** | - | 固定 `"month"`（流月層） |
| **fromPalace** | 流月命宮 | `palaceNames[monthly.index]` 或 **`palaceByBranch[monthly.earthlyBranch]`**（建議與流年一致：用命盤宮序，不用 iztro 固定人事宮序） |
| **toPalace** | 本命盤星曜落宮 | 依 `mutagen[i]` 的星名，用 `findPalaceByStar(starsByPalace, star)` 得到飛入宮 |
| **triggerStem** | `monthly.heavenlyStem` | 月干 |
| **star** | `mutagen[0]`～`mutagen[3]` | 祿／權／科／忌 對應星名 |
| **transform** | 索引對應 | 0→祿, 1→權, 2→科, 3→忌 |

**飛星計算**：與大限、流年同一邏輯——  
**from 宮 = 流月命宮，to 宮 = 該四化星在本命盤的落宮**。  
iztro 已提供 **流月四化**（`mutagen`）與 **流月流耀**（`stars`），可直接使用，無須自算十干四化。

---

## 五、流月命宮宮名（與流年一致）

- **不要**直接用 iztro 的 `palaceNames[0]` 當「流月命宮」顯示名，因 iztro 可能是固定人事宮序。
- **要**與流年一樣：用 **`palaceByBranch[monthly.earthlyBranch]`**（由 `buildPalaceByBranch(mingBranch)` 建表），以命盤宮序得到正確的「命宮、兄弟宮…」名稱。

---

## 六、chartJson / API 建議結構（供 S19 使用）

若希望流月從 API 帶入、命書與 S19 共用，建議在 **worker 計算**時產出：

```ts
// 範例：某年某月流月
features.ziwei.monthlyHoroscope?: {
  year: number;
  month: number;           // 1–12 農曆或 1–12 西曆月
  stem: string;            // 月干
  branch: string;          // 月支
  palace: string;          // 流月命宮（zh-TW，命盤宮序）
  mutagenStars: { 祿: string; 權: string; 科: string; 忌: string };
  // 若需流月流耀，可再帶 stars 或對應結構
}
```

S19 進階分析時即可依此建 `GongGanFlow[]`（layer: `"month"`），from = 上表 `palace`，to = `findPalaceByStar(star)`。

---

## 七、摘要

| 項目 | 結論 |
|------|------|
| 結構對應 | iztro 流月 = **monthly**；宮位、四化、流耀皆在此 key 下。 |
| 飛星計算 | 與大限、流年一致：**from = 流月命宮，to = 四化星在本命盤落宮**；from/to 由 iztro 的 `monthly` + 本命 `starsByPalace` 推得。 |
| 流月四化／流耀 | 直接使用 iztro 的 **`monthly.mutagen`**（四化）與 **`monthly.stars`**（流耀），無須自算。 |
| 流月命宮名 | 用 **`palaceByBranch[monthly.earthlyBranch]`**（命盤宮序），與流年、大限一致。 |
