# Mini C 共振改動對命書生成與前端 UI 的影響評估

本文件評估「四化疊宮分析（overlap / fourTransformations）層」加入 Mini C 共振（hasDoubleJi、hasDoubleLu、resonance、以及對 criticalRisks / maxOpportunities 的補充 push）後，對**命書生成**與**未來前端 UI 優化**的影響。不涉及程式改動，僅為現況與建議整理。

---

## 一、資料流簡述

1. **overlap 產出**：`fourTransformations.calculateOverlapTransformations()` → `palaceMap`（每宮 hasDoubleJi、hasDoubleLu、resonance、resonanceDescriptions）、`criticalRisks`、`maxOpportunities`、`volatileAmbivalences`。
2. **命書權重**：前端以 `chart_json`（內含 overlapAnalysis）呼叫 `lifeBookEngine.weightAnalysis(chartJson)` → 得到 `weight_analysis`（含 traffic_signals、risk_palaces、top_focus_palaces、stable_palaces 等）；此結果送給 Worker 的 infer / generate。
3. **命書內容**：Worker 的 buildSectionUserPrompt 僅在 s20 時會讀取 `weight_analysis.traffic_signals` 組裝「三盤紅綠燈摘要」；chart 切片中的 `overlapAnalysis` 仍整包送給 AI，AI 未直接讀取 palaceMap 內 hasDoubleJi / resonance 等欄位。
4. **前端主站**：`calc.js` 產出 overlapAnalysis 後存到 `window.overlapAnalysis` / State，供儀表板、諮詢腳本、專家後台、疊宮報告等使用。

---

## 二、對命書生成的影響

### 2.1 正面影響

- **risk_palaces / top_focus 更完整**  
  Mini C 在「忌≥2」「祿≥2」時會補一筆進 criticalRisks / maxOpportunities（若該宮尚未在列表中）。因此：
  - **weightAnalysis** 的 `risk_palaces`（= criticalRisks.map(r => r.palace)）可能多出僅因「雙忌共振」而入列的宮位；
  - **top_focus_palaces** 仍由分數排序前 3 宮決定，但宮位分數會因 overlapCoef（該宮在 criticalRisks/maxOpportunities/volatileAmbivalences 則 +2）而提高，**有機會**讓共振宮位更容易進 top3；
  - **traffic_signals** 的 red 來自 risk_palaces，因此「雙忌共振」宮位會自然變成紅燈，s20 的「三盤紅綠燈摘要」會多出這些宮位，AI 會收到更完整的紅燈列表並在 structure_analysis / blind_spots / strategic_advice 中發揮。

- **s20 與整體權重一致**  
  紅綠燈摘要與底層疊宮邏輯一致：紅＝風險宮位（含雙忌共振）、黃＝優先關注、綠＝穩定；命書 s20 的敘述會更貼近實際計算結果。

### 2.2 潛在風險與相容性

- **criticalRisks / maxOpportunities 的項目形狀不一致**  
  - **既有項目**：`{ palace, jiCount/luCount, transformations, description }`  
  - **Mini C 補充項目**：`{ palace, reason: 'double_ji'|'double_lu', source: 'resonance' }`（無 transformations、jiCount/luCount、description）
  - **影響**：凡「依 criticalRisks / maxOpportunities 逐項取用 transformations、jiCount、luCount、description」的程式，遇到 resonance 補充項時會拿到 `undefined`，可能產生執行錯誤或文案異常。

- **已知受影響處**  
  - **overlapAnalysis.js** 的 `generateOverlapComments`：  
    - 對 criticalRisks 使用 `risk.transformations`、`risk.jiCount` 組評論（例如「${jiCount}重化忌疊加」）；  
    - 對 maxOpportunities 使用 `opportunity.transformations`、`opportunity.luCount`。  
  - 若陣列中含「僅 reason/source」的項目，會出現 `transformations` 為 undefined 的存取，以及「undefined重化忌疊加」之類的文案。  
  - **建議**：在 generateOverlapComments 中對單筆 risk/opportunity 做防禦性處理——若缺少 transformations/jiCount/luCount，則依 reason/source 產生簡短通用句（例如「共振：雙忌／雙祿」），或跳過該筆不生成詳細評論。

- **命書 Worker 端**  
  - infer / generate 只收到 **chart_json**（含整包 overlapAnalysis）與 **weight_analysis**（含 traffic_signals、risk_palaces 等）。  
  - Worker 不直接遍歷 criticalRisks 陣列或讀取單筆的 transformations/description；AI 看到的是整份 JSON 與 s20 的紅綠燈摘要文字。  
  - 因此**命書生成流程本身**對「陣列項目形狀不一致」不敏感；影響主要在**前端**使用 overlap 報告與評論的模組（見下）。

---

## 三、對未來前端 UI 優化的影響

### 3.1 已有資料可支援的 UI

- **每宮燈號**  
  - `weight_analysis.traffic_signals` 已提供每宮 "red" | "yellow" | "green"，前端可直接用於：  
    - 命書 Viewer 的權重/燈號區塊、s20 章節旁標示；  
    - 主站儀表板「12 宮地圖」上每宮顯示紅黃綠（若未來要做）。

- **每宮共振標記**  
  - `overlapAnalysis.palaceMap` 每宮現有：  
    - `hasDoubleJi`、`hasDoubleLu`、`resonance`（'double_ji'|'double_lu'|null）  
    - `resonanceDescriptions`（原共振描述陣列）  
  - 可做：  
    - 宮位卡片或 tooltip 顯示「雙忌／雙祿共振」標籤；  
    - 疊宮報表或專家後台「共振」篩選／排序。

- **風險／機會來源區分**  
  - criticalRisks / maxOpportunities 中每筆現可有 `reason`、`source`（例如 source: 'resonance'）。  
  - UI 可區分「一般疊宮風險」與「共振風險」（雙忌／雙祿），例如不同 icon 或說明文案。

### 3.2 需注意的相容性

- **依賴 risk/opportunity 具備 transformations、description 的 UI**  
  - 若前端有元件是「遍歷 criticalRisks / maxOpportunities 並假設每筆都有 transformations、jiCount、description」，遇到 Mini C 補充項會缺欄位。  
  - **建議**：任何新 UI 或既有報表在讀取 criticalRisks / maxOpportunities 時，以 optional chaining 或檢查 `risk.reason`/`risk.source` 做分支，避免直接依賴 description/transformations。

- **resonance 語意變更**  
  - 原先 `palaceData.resonance` 為「共振描述」陣列，已改為 `resonanceDescriptions`；`resonance` 改為 'double_ji'|'double_lu'|null。  
  - 若有程式或報表曾讀取 `palaceData.resonance` 並當陣列使用（例如疊宮報告的 details 來自 spread palaceData），現在會拿到字串或 null。  
  - **目前**：overlapAnalysis.js 的 generateOverlapComments 只使用 palaceMap.forEach 的 palaceData 的 luCount/jiCount/transformations 等，未使用 .resonance 陣列；generateOverlapReport 的 details 是 spread palaceData，會帶出 resonance（新語意）與 resonanceDescriptions，若未來有 UI 依 details[].resonance 做「描述列表」需改為使用 resonanceDescriptions。

### 3.3 建議的 UI 優化方向（不改演算法）

1. **命書 Viewer**  
   - 在權重摘要區或 s20 旁顯示 traffic_signals（紅黃綠），或每宮小燈號，與 s20 文案一致。

2. **主站儀表板／疊宮區**  
   - 若顯示「超級地雷區／大發財機會」列表，對僅有 reason/source 的項目顯示通用文案（如「共振：雙忌」），避免依賴 description/transformations。

3. **專家後台／報表**  
   - 可新增「共振」篩選或欄位：依 palaceMap 的 hasDoubleJi、hasDoubleLu、resonance 或 criticalRisks/maxOpportunities 的 reason、source 顯示，方便除錯與內容對照。

---

## 四、總結表

| 面向 | 影響 | 說明 |
|------|------|------|
| 命書生成（weight_analysis） | ✅ 正面 | risk_palaces / traffic_signals 更完整，s20 紅綠燈摘要會涵蓋雙忌共振宮位；公式與既有欄位未改。 |
| 命書生成（Worker / AI） | ✅ 無需改動 | Worker 只消費 weight_analysis 與 chart_json 整包；不直接依 criticalRisks 單筆結構。 |
| 命書 s20 文案 | ✅ 正面 | AI 收到的紅燈／黃燈／綠燈列表與底層疊宮＋共振一致，敘述更一致。 |
| overlap 評論（generateOverlapComments） | ⚠️ 需防禦 | 若 criticalRisks/maxOpportunities 含「僅 reason/source」項，需避免存取 undefined 並可改為通用句或跳過。 |
| 前端 UI（燈號／共振標籤） | ✅ 可擴充 | traffic_signals、palaceMap.hasDoubleJi/hasDoubleLu/resonance 可直接用於新 UI。 |
| 前端 UI（既有報表／列表） | ⚠️ 相容 | 遍歷 risk/opportunity 時需容許缺少 description/transformations，或依 reason/source 分支。 |
| resonance 欄位語意 | ⚠️ 已變更 | palaceData.resonance 由陣列改為 enum；陣列改存 resonanceDescriptions，若有依舊語意讀取處需更新。 |

**結論**：Mini C 改動對命書生成與未來紅綠燈／共振 UI 為正向且可擴充；惟需在**依 criticalRisks/maxOpportunities 逐項產文案或報表**的模組（以 overlapAnalysis.generateOverlapComments 為首）加上對「僅 reason/source」項目的防禦處理，並確認所有讀取 `palaceData.resonance` 的地方改為使用新語意或 resonanceDescriptions。
