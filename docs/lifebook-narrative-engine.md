# 命書 Narrative Engine（權重／風險／語氣）

Phase 2：星曜權重、宮位風險等級與語料組裝，讓命書依 riskLevel 切換語氣（開拓／盤整／防禦）。

---

## 一、starMetadata 欄位與數值範圍

- **來源**：`worker/content/starMetadata.json`（配置檔，可審核後再接 runtime）。
- **結構**：
  - `starNameZhToId`：中文星名 → 英文 star_id（與 content 的「星名_宮位」key 對齊）。
  - `stars`：star_id → `{ name_zh, category, base_weight, base_risk }`。
- **category**：`主星` | `輔星` | `煞星` | `雜曜`。
- **base_weight**（敘事權重）：
  - 主星：90–100
  - 六吉與重要輔星：60–80
  - 煞星：50–70（風險大但不蓋過主星）
  - 一般雜曜：20–40
- **base_risk**（星本身風險 1～5）：
  - 六煞：4–5
  - 高波動主星（七殺、破軍、貪狼、廉貞）：3–4
  - 穩定主星：2–3
  - 六吉與福星：1–2

Validator 會檢查：starPalacesAux / starPalacesAuxRisk 內出現的星名皆在 starNameZhToId，且對應 star 具備 base_weight、base_risk（1～5）。

---

## 二、Effective_Risk 計算公式（唯一算法）

- **公式**：  
  `Effective_Risk(star, palace) = clamp(1, 5, base_risk(star) + palace_offset)`
- **palace_offset**：  
  - 若存在 `starPalacesAuxRisk["星名_宮位"]` 的值 R，則 `palace_offset = R - base_risk(star)`。  
  - 若無該 key，則 `palace_offset = 0`。
- **實務**：有宮位風險資料時，effective_risk 即為該宮位值 R（clamp 1～5）；無資料時用 base_risk。

程式內僅實作此一種算法，見 `worker/src/lifebook/palaceWeightRiskAggregator.ts` 的 `effectiveRisk()`。

---

## 三、宮位 Aggregator：輸入／輸出

- **模組**：`worker/src/lifebook/palaceWeightRiskAggregator.ts`  
  `aggregatePalaceWeightRisk(palaceStars, palaceKey, metadata, auxRisk)`

- **輸入**：
  - `palaceStars`：該宮星曜列表 `{ name, strength? }`（strength = 廟旺利平陷等）。
  - `palaceKey`：宮位名（命宮、財帛…）。
  - `metadata`：starMetadata（starNameZhToId + stars）。
  - `auxRisk`：starPalacesAuxRisk（星名_宮位 → 1～5）。

- **輸出**：
  - `mainStars`：1～2 顆主敘事星（依 WeightScore 排序）。
  - `supportStars`：其餘星。
  - `totalRisk`：1～5，加權平均後 clamp。
  - `riskLevel`：1～5 整數（round(totalRisk)），供語氣與語料選用。

- **mainStars 選擇**：  
  `WeightScore = base_weight + (brightness_score × 2)`，依 WeightScore 降序取前 1～2。  
  亮度分數：廟 +2、旺 +1.5、利/得 +1、平 0、陷 -1.5。

- **totalRisk**：各星 effective_risk 依 base_weight 加權平均，再 clamp(1, 5)；riskLevel = round(totalRisk)。

---

## 四、riskLevel 與語氣（開拓／盤整／防禦）

| riskLevel | 區間     | 語氣     | 建議用字 |
|-----------|----------|----------|----------|
| 1–2       | 開拓期   | 偏積極   | 嘗試、布局、擴張、開展 |
| 3         | 盤整期   | 中性     | 調整、維持、盤點、觀察 |
| 4–5       | 防禦期   | 保守     | 減碼、保守、延後、收縮、避險、留有餘裕、斷捨離；禁止 all-in 或過度樂觀 |

語料來源（通用）：`palaceRiskSummary.riskLevel_1`～`riskLevel_5`、`palaceActionAdvice.riskLevel_1`～`riskLevel_5`（現為 `worker/content/palaceRiskCorpus-zh-TW.json`）。  
之後可再補 starPalaceRiskAdvice.*，依既有 copy_key 規則接進 DbContent 即可。

---

## 五、Placeholder 與接合

- **新增 placeholder**：  
  - `{palaceRiskSummary}`：一句話總結「現在屬於哪種期＋為何」。  
  - `{palaceActionAdvice}`：依 riskLevel 語氣的一小段行動建議。  
  - `{palaceMainStarSummary}`：主敘事用 1～2 顆星標籤。  
  - `{palaceRiskLevel}`：數字 1～5（除錯或進階用）。

- **主敘事順序**：主星 narrative 由 aggregator 的 mainStars[0] 開頭；`mainStarsSummary` 已依 mainStars 順序重排。

- **示範章節**：s02 命宮已接上 `{palaceRiskSummary}`、`{palaceActionAdvice}`；其餘宮位可逐步擴展。

---

## 六、新增星曜或宮位語料時

- 在 **starMetadata** 補齊該星的 `star_id`、`name_zh`、`category`、`base_weight`、`base_risk`；並在 `starNameZhToId` 加上中文名對照。
- 若為星×宮 content（Aux / AuxAction / AuxRisk），key 維持「星名_宮位」，宮位用 12 宮約定（命宮、兄弟、…、父母）。
- 執行 `npm run validate-content` 確保通過（含 starMetadata 一致性、duplicate key、palaceActionAdvice.riskLevel_4/5 存在）。
