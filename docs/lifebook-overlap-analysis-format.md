# 命書 s15a 疊宮分析資料格式

s15a「各宮位小限年份與疊宮引爆分析」章節會依 `chart_json.overlapAnalysis` 產出三類詳細區塊：劇烈震盪、超級地雷區、大發財機會。Worker 支援**兩種**格式，可擇一或並存。

---

## 一、現有格式（Legacy，已支援）

目前專家後台／`window.overlapAnalysis` 的結構可直接使用，Worker 會從中組出詳細文案：

- **criticalRisks**：`Array<{ palace, jiCount?, transformations? }>`
- **maxOpportunities**：`Array<{ palace, luCount?, transformations? }>`
- **volatileAmbivalences**：`Array<{ palace, jiCount?, luCount?, transformations? }>`

其中 **transformations** 為一物件，key 為層級、value 為該層四化：

- `benming`：本命
- `dalimit`：大限
- `liunian`：流年
- `xiaoxian`：小限

每個 value 形狀：`{ type: '祿'|'權'|'科'|'忌', star: '星名', weight?: number }`。

Worker 會依「大限 → 流年 → 本命 → 小限」順序組句，並在最後一個化忌／化祿後加上「（n重化忌）」／「（n重化祿）」。

當有傳入 `chartJson`／`content`／`config`（例如命書 generate-section 流程）時，s15a 會產出**時間診斷專章**的完整版：每宮一段含「結構／怎麼感受／建議操作」三小段，並自動帶入該宮本命星曜摘要（來自 buildPalaceContext）與依 tag 的泛用感受／建議句；若新格式 item 帶有 `feelingSnippet`、`adviceSnippet` 則優先使用。

**前端無須改動**即可使用；只要 `overlapAnalysis` 有 `criticalRisks` / `maxOpportunities` / `volatileAmbivalences` 且每筆帶 `transformations`（與現有 `fourTransformations.calculateOverlapTransformations` 產出一致），s15a 就會顯示上述詳細區塊。

---

## 二、新格式（可選，便於擴充）

若希望由 domain／專家後台**直接產出**已分類、已標好 tag 的清單，可改為提供 **overlapAnalysis.items**，Worker 會優先使用此格式。

### 2.1 形狀定義

**overlapAnalysis.items**：`Array<OverlapItem>`

**OverlapItem**：

| 欄位 | 型別 | 說明 |
|------|------|------|
| **palaceKey** | string | 宮位代碼（命、兄弟、夫妻、財帛…） |
| **palaceName** | string | 宮位中文名（命宮、兄弟宮…）；若後端有 map 可只傳 key 由 Worker 轉 |
| **year** | number | 該小限年（可選） |
| **age** | number | 歲數（可選） |
| **heavenlyStem** | string | 年干（甲乙丙…），用於小限年份表（可選） |
| **tag** | string | 分類：`"shock"` \| `"mine"` \| `"wealth"` \| `"normal"` |
| **tagLabel** | string | 對應中文結論，如「劇烈震盪/吉凶並見（成敗一線間）」 |
| **jiCount** | number | 此宮所有層級加總的化忌次數 |
| **luCount** | number | 此宮所有層級加總的化祿次數 |
| **feelingSnippet** | string | 選填。該宮「怎麼感受」文案，未填時 Worker 依 tag 用泛用句。 |
| **adviceSnippet** | string | 選填。該宮「建議操作」文案，未填時 Worker 依 tag 用泛用句。 |
| **transformations** | array | 見下表 |

**transformations[]** 每個元素：

| 欄位 | 型別 | 說明 |
|------|------|------|
| **layer** | string | 層級代碼：`"decadal"` \| `"annual"` \| `"natal"` \| `"xiaoXian"` |
| **layerLabel** | string | 中文：大限、流年、本命、小限 |
| **starName** | string | 星曜名稱（廉貞、貪狼…） |
| **type** | string | 化型代碼：`"ji"` \| `"lu"` \| `"quan"` \| `"ke"` |
| **typeLabel** | string | 中文：化忌、化祿、化權、化科 |

### 2.2 tag 對應

- **shock** → 劇烈震盪/吉凶並見（成敗一線間）→ 填入 **xiaoXianShockBlocks**
- **mine** → 超級地雷區（必須絕對避開）→ 填入 **xiaoXianMineBlocks**
- **wealth** → 大發財機會（建議積極把握）→ 填入 **xiaoXianWealthBlocks**
- **normal** → Worker 會略過，不列入三區塊

### 2.3 範例（items 一筆）

```json
{
  "palaceKey": "財帛",
  "palaceName": "財帛宮",
  "tag": "shock",
  "tagLabel": "劇烈震盪/吉凶並見（成敗一線間）",
  "jiCount": 2,
  "luCount": 2,
  "transformations": [
    { "layer": "decadal", "layerLabel": "大限", "starName": "廉貞", "type": "ji", "typeLabel": "化忌" },
    { "layer": "annual", "layerLabel": "流年", "starName": "廉貞", "type": "ji", "typeLabel": "化忌" },
    { "layer": "natal", "layerLabel": "本命", "starName": "廉貞", "type": "lu", "typeLabel": "化祿" },
    { "layer": "xiaoXian", "layerLabel": "小限", "starName": "貪狼", "type": "lu", "typeLabel": "化祿" }
  ]
}
```

---

## 三、Worker 行為摘要

1. 若存在 **overlapAnalysis.items** 且為非空陣列 → 使用**新格式**，依 `tag` 分 shock / mine / wealth，各組內依宮位順序（命→兄弟→…→父母）排序後組文案。
2. 否則使用 **criticalRisks / maxOpportunities / volatileAmbivalences**（舊格式），從各筆的 `transformations` 物件轉成有序陣列再組文案。
3. 三組區塊對應的 placeholder：**xiaoXianShockBlocks**、**xiaoXianMineBlocks**、**xiaoXianWealthBlocks**，已接在 s15a 骨架的「⚡ 劇烈震盪…」「⚠️ 超級地雷區…」「✨ 大發財機會…」標題下。

---

## 四、前端若要改為產出新格式

需要補足的部分：

1. **tag / tagLabel**：依現有邏輯（ji≥2 且 lu≥2 → shock；僅 ji≥2 → mine；僅 lu≥2 → wealth）寫入每筆。
2. **palaceName**：若目前只有宮位 key（如「兄弟」），可後端自己建 key→中文名 map，或沿用現有 `PALACE_DEFAULT` 對應。
3. **year / age / heavenlyStem**：若 s15a 小限年份表要與疊宮「同一年」對齊，可從現有小限計算帶入；若無則可省略，Worker 不強制。
4. **transformations 陣列**：可由現有 `palaceData.transformations`（benming/dalimit/liunian/xiaoxian）轉成陣列，每筆補上 layer / layerLabel / type / typeLabel。

其餘（jiCount、luCount、星名與化型）目前前端已有，只需對齊上述欄位名稱與 tag 即可。

**宮位名稱**：請統一使用完整中文宮名（例如「兄弟宮」「財帛宮」），由前端或 domain 補齊「宮」字；Worker 不再自動補「宮」，以避免輸出不一致。
