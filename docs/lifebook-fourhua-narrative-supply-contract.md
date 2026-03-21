# 四化語料補給契約（全十二宮 × 模組二／逐宮讀者敘事 共用）

## 目標

- **一套資料**，同時服務：
  - **逐宮讀者敘事**（各宮位章節內「星曜結構解析」裡的「本命四化」小節；**非**命書疊宮章 `s17`）
  - **模組二**後段：**本命／大限／流年／疊宮**相關敘事（只要能拿到 `star + 宮位 + 四化種類 + 時間層`）
- 你補語料時**不需要**為每個畫面各寫一份；由程式做**查表 + 時間層修飾 + 多條合併**。

---

## 建議的「唯一主表」結構

已存在型別：`StarPalaceTransformMeaning`（`worker/src/lifebook/starPalaceTransformMatrix.ts`）

每筆一列，欄位：

| 欄位 | 說明 |
|------|------|
| `star` | **化星**名稱，與盤上一致（例：`武曲`，不用寫「武曲化祿」） |
| `palace` | **四化所落的宮位**（論「這顆星坐在哪一宮帶這個化象」時，與讀者看的那個宮一致）。建議**一律用「XX宮」**（`財帛宮` 不要寫 `財帛`），避免比對失敗。 |
| `transform` | `祿` \| `權` \| `科` \| `忌` |
| `meaning` | 給讀者看的**完整一段話**（人話、可獨立閱讀；避免「會發生」可改成「較容易／傾向」以符合現有語氣規範亦可） |

**查表鍵：** `(star, palace, transform)` — 命中就直接用 `meaning`，**全宮位通用**。

---

## 與現有程式的接點（你補完後會去哪裡）

1. **模組二／palace 適配**  
   `createNarrativeFacade().getTransformSemantic(祿｜權｜科｜忌, starName, palaceName)`  
   已會優先查 **`STAR_PALACE_TRANSFORM_MATRIX`**，再退階 `transformIntoPalaceMeanings.json`、再退階通用四化字典。

2. **逐宮讀者敘事「本命四化」**  
   `PalaceNarrativeBuilder` 已優先 `getTransformSemantic`，沒命中再 `buildTransformNarrative`（模板 + `starTransformMeanings.json`），與模組二同源。

---

## 本命 / 大限 / 流年 / 疊宮 —— 要怎麼寫、程式怎麼用

### 原則

- **資料仍以「星 × 宮 × 四化」為核心**；時間層多半是**語氣與範圍**不同，不必一開始就 4 倍篇幅。

### 作法 A（推薦起步）：一條 `meaning` + 程式加前綴

- 表內只存**中性／本命可讀**的 `meaning`。  
- 大限／流年套用時，由程式在句首或段首加：**「這十年大限」「今年流年」** 等（資料不重複）。

### 作法 B（同一組合在某一層文案差很多）

在單一列擴充（型別需程式配合；可第二階段再做）：

```text
meaningNatal
meaningDecade   // 可選；缺則用 meaning
meaningYear     // 可選；缺則用 meaning 或 meaningDecade
```

**疊宮**：不是第四種 key。  
**疊宮 = 同一宮位上多層都有四化／飛化** → 程式對每一層各查一次（必要時各加層級前綴），再**條列合併**成一段「本命…；大限…；流年…」，避免你把所有疊加寫成一條無法維護的長文。

### 飛星（從 A 宮飛入 B 宮）

- **落在 B 宮的化象**：仍以 **`star` + `palace = B宮` + `transform`** 查主表（與「化星在 B」的生年四化敘事一致）。
- **額外要講「從哪飛來」**：屬 **flow 邊**，可用現有 `NormalizedChart.*.flows` + 短句模板；若要濃縮解讀，可另開小表 `edgeNarrative`（第二階段）。

---

## 你補給我的順序建議

1. **財帛宮 × 祿權科忌** × 各主星（你已有一部分）→ 先匯入主表。  
2. 其餘十一宮用**同一份 CSV/JSON schema**逐宮補滿。  
3. 若某宮只想先補「化忌」高風險組合，也可只加忌條，其餘走退階句。  

---

## JSON 匯入範例（你可從試算表匯出）

```json
[
  {
    "star": "武曲",
    "palace": "財帛宮",
    "transform": "祿",
    "meaning": "（此處貼你的讀者向全文或精煉版）"
  }
]
```

匯入實作：append 到 `STAR_PALACE_TRANSFORM_MATRIX` 陣列，或（資料變大時）改為 `worker/content/starPalaceTransformMatrix.json` 由建置載入。

---

## 與「財帛宮 wealthPalaceProfiles」的分工

| 資料 | 用途 |
|------|------|
| `wealthPalaceProfiles` 等 **星×宮靜態** | 宮裡有什麼星、用錢／做事**體質** |
| **本表 星×宮×四化** | 該星在該宮的**化象動力**（祿權科忌） |

兩者疊加才會變成完整財帛（或其它宮）讀者體驗，不互相取代。
