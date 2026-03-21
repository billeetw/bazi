# 命書語氣語句庫總覽（供調整語氣用）

以下為目前 **narrativeTemplates** 與相關語句來源的完整內容；調整語氣時請只改這些來源，不改邏輯。

---

## 一、narrativeTemplates.ts（唯一模板入口）

**路徑：** `worker/src/lifebook/narrativeTemplates.ts`

**narrativeTemplates**（S18 四大分類）：每分類含 `overall`（positive / neutral / negative / conflict 各一至多句）與 `focus`（toOnly / fromTo / star 各一至多句）。placeholders：`{toPalace}`、`{fromPalace}`、`{star}`。詳見 `worker/src/lifebook/narrativeTemplates.ts`。

**dimensionTemplates**：`assets`（stable / unstable / mixed）、`network`（supportive / pressured / mixed）、`mindset`（stable / pressured / mixed），各為一句陣列。

**placeholder 說明：** `{toPalace}` 入宮、`{fromPalace}` 出宮、`{star}` 星名。

S18 四大分類各用 **overall**（positive / neutral / negative / conflict）與 **focus**（toOnly / fromTo / star）陣列；選句規則見「二、S18 語氣規則」。

---

## 二、S18 語氣規則與語句來源

S18 定位為 **分析層（interpretation）**，非建議層；用人稱「你」，不用「我們」、不用命令句。句長約 25～40 字，一段最多 2～3 句。**關鍵動因** 列 reasons 原文，2～4 條，不改寫；isConflicting 時保留正負兩邊。

### 2.1 整體看法（narrativeTemplates[cat].overall）

- 先看 **isConflicting** → 用 `conflict[0]`
- 否則 score ≥ 3 → `positive[0]`；score ≤ -3 → `negative[0]`；其餘 → `neutral[0]`

### 2.2 重點說明（narrativeTemplates[cat].focus）

- 有 fromPalace：第一句用 `fromTo[0]`（填 toPalace、fromPalace）
- 無 fromPalace：第一句用 `toOnly[0]`（填 toPalace）
- 若有代表性星曜：再補一句 `star[0]`（填 star）

### 2.3 今年主線與功課（buildMainThemeAndLesson）

- **主線**：`今年主線落在【{categoryLabel}】相關領域。重點會放在{人話}。`  
  人話：wealth→資源如何流動、累積與運用；career→角色、責任與成果如何推進；relationship→關係互動與合作如何影響整體狀態；mobility→外部機會、場域變化與對外發展。
- **功課有 sourcePalace**：`今年壓力主要集中在【{challengePalace}】相關領域。而且這份壓力，多半是由【{sourcePalace}】牽動而來。`
- **功課無 sourcePalace**：`今年壓力主要集中在【{challengePalace}】相關領域。這一塊的變動與負擔會比較明顯。`
- **收尾**：`這一年更重要的，不是做得更多，而是把真正牽動局勢的地方看清楚。`

### 2.4 三維度（dimensionTemplates）

- **資產與根基**：stable / unstable / mixed（依田宅・財帛 祿忌）
- **人脈與協作**：supportive / pressured / mixed（依僕役・兄弟・父母 祿權忌）
- **心態與壓力**：stable / pressured / mixed（依疾厄・福德・命宮與 hasConflict）

### 2.5 S18 範例對照（改寫後，同一 fixture）

**【事業】區塊範例**（score=-5, isConflicting=true, 官祿宮・僕役宮）：

- **改寫前**：整體看法用「這段時間，你在官祿宮這一塊比較容易有發揮空間」或負向/衝突句；重點說明「問題表現在官祿宮，但來源往往在僕役宮」；收尾「這一年的關鍵，在於順著優勢推進…」
- **改寫後**：  
  整體看法：這段時間工作上既有推進空間，也有明顯壓力，常會一邊往前、一邊感到受限。  
  重點說明：你在官祿宮感受到的壓力，多半不是單一事件，而是由僕役宮牽動而來。這種狀態也帶有武曲的特質，容易把責任、表現或掌控感放大。  
  關鍵動因：大限忌入官祿宮、大限忌由僕役宮飛入官祿宮（原文不變）。  
  主線：今年主線落在【財運】相關領域。重點會放在資源如何流動、累積與運用。  
  功課：今年壓力主要集中在【官祿宮】相關領域。而且這份壓力，多半是由【僕役宮】牽動而來。  
  收尾：這一年更重要的，不是做得更多，而是把真正牽動局勢的地方看清楚。

技術證據（關鍵動因、涉及宮位、四化與 from→to）仍完整保留；未新增第二套語句庫；signal / overlay 邏輯未改。

---

## 三、語義字典（starSemanticDictionary.ts）

**路徑：** `worker/src/lifebook/starSemanticDictionary.ts`  
用於「X代表『…』」、宮位一句、四化一句；**非** S18 解讀主來源，但會影響其他章節語氣。

### 3.1 宮位語義 PALACE_SEMANTIC_DICTIONARY（12 宮）

| 宮位 | core | plain |
|------|------|--------|
| 命宮 | 自我定位與人生方向 | 你是怎麼看待自己、怎麼活出自己的。 |
| 兄弟宮 | 同儕、手足與合作關係 | 你怎麼與同輩互動、協作與分工。 |
| 夫妻宮 | 親密關係與合作關係 | 你在一對一關係裡如何投入、期待與磨合。 |
| 子女宮 | 創造、延伸成果與內在產出 | 你創造出來的東西，以及你如何對待延伸出去的成果。 |
| 財帛宮 | 資源、收入、交換與現實配置 | 你怎麼賺、怎麼花、怎麼衡量投入與回報。 |
| 疾厄宮 | 身心壓力、修復與耗損 | 你在壓力下怎麼撐、怎麼累、怎麼修復自己。 |
| 遷移宮 | 外部環境、移動與與世界互動 | 你離開熟悉場域後，怎麼面對外界與變化。 |
| 僕役宮 | 團隊、人脈與人際系統 | 你怎麼在群體、人脈與合作網絡裡運作。 |
| 官祿宮 | 事業、角色、責任與社會位置 | 你怎麼做事、扛責任、建立成績與定位。 |
| 田宅宮 | 安全感、根基、居所與可安放之處 | 你怎麼建立穩定感、歸屬感與生活根基。 |
| 福德宮 | 內在狀態、精神能量與情緒底盤 | 你怎麼休息、怎麼感受、怎麼與自己相處。 |
| 父母宮 | 權威、支持來源與價值框架 | 你如何面對規範、期待、權威與支撐系統。 |

### 3.2 四化語義 TRANSFORM_SEMANTIC_DICTIONARY

| key | label | core | plain | advice |
|-----|--------|------|--------|--------|
| lu | 祿 | 資源與機會的流動 | 這裡比較容易出現可利用的資源、機會與回報。 | 先看怎麼累積，而不是只看眼前好處。 |
| quan | 權 | 責任、主導與推動力 | 這裡容易出現需要你主動決定、主動扛起的情況。 | 先定規則與分工，再往前推。 |
| ke | 科 | 修正、理解與方法 | 這裡適合靠學習、方法與系統優化來改善。 | 先找對方法，再加大努力。 |
| ji | 忌 | 壓力、卡點與修正點 | 這裡比較容易出現卡住、反覆、焦慮或需要修正的感覺。 | 先穩住節奏與界線，再處理問題本身。 |

---

## 四、JSON 語義庫（content/）

### 4.1 starTransformMeanings.json

- **用途：** 星+四化一句（如「天機化祿，代表…」）。
- **key 格式：** `星名_lu` | `星名_quan` | `星名_ke` | `星名_ji`。
- **範例：**
  - `"天機_lu": { "text": "天機化祿，代表思考、策略與判斷能力會變成你的重要資源。很多機會不是直接送上門，而是來自你比別人更早看懂局勢。" }`
  - `"太陽_ji": { "text": "太陽化忌，代表付出、責任、表現與自我價值容易成為壓力來源。很多時候你不是做不來，而是太習慣自己撐。" }`

### 4.2 transformIntoPalaceMeanings.json

- **用途：** 四化入某宮一句（祿/權/科/忌 × 12 宮）。
- **key 格式：** `lu_命宮`、`ji_財帛宮` 等。
- **範例：**
  - `"lu_財帛宮": "祿入財帛宮，代表金錢、資源與回報領域容易出現助力與紅利。"`
  - `"ji_官祿宮": "忌入官祿宮，代表角色、責任與職場壓力容易成為這段時間的核心功課。"`

### 4.3 flyPathMeanings.json

- **用途：** 飛星路徑「自 A 出、飛入 B」一句。
- **key 格式：** `出宮_入宮`（如 `僕役宮_官祿宮`）。
- **範例：**
  - `"僕役宮_官祿宮": "自僕役宮出、飛入官祿宮，代表人脈與合作會流進事業與角色；貴人、團隊或合夥容易表現在職場。"`
  - `"夫妻宮_官祿宮": "自夫妻宮出、飛入官祿宮，代表關係與合作會流進事業與角色；伴侶或合夥容易影響工作與成果。"`

### 4.4 decadalPalaceThemes.json

- **用途：** 大限落某宮的主題與敘事（theme + narrative）。
- **key：** 12 宮名（命宮、兄弟宮…父母宮）。
- **範例：**
  - `"官祿宮": { "theme": "事業與社會角色", "narrative": "這十年大限落在官祿宮，代表事業、角色與社會責任會成為主軸。你在職場上的定位、承擔與成果會特別被放大。" }`

---

## 五、與 S18 語氣直接相關的檔案

| 檔案 | 用途 |
|------|------|
| `worker/src/lifebook/narrativeTemplates.ts` | S18 四大分類 overall／focus、dimensionTemplates |
| `worker/src/lifebook/s18/eventSignals.ts` | 整體看法／重點說明／關鍵動因、三維度、主線／功課／收尾 |

其餘（starSemanticDictionary、patternPhraseLibrary、content JSON）主要影響 S00／飛星解釋／大限主題等，改語氣時可一併考慮，但 **S18 螢幕文案** 以 narrativeTemplates + eventSignals 內建句為主。
