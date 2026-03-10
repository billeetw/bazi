# Phase 2：權重 + 風險等級 & 語料組裝引擎 — 可行性評估

在**不破壞現有 copy_key 與 content 結構**的前提下，評估「星曜權重／風險／主輔敘事／語氣切換」的可行性、需補充內容與風險。

---

## 一、星曜「基礎權重 / 風險」資料層

### 1.1 現狀

| 項目 | 現狀 |
|------|------|
| **14 主星** | `worker/src/lifebook/schema.ts` 有 `STARS`、`MainStarId`、`STAR_NAME_ZH_TO_ID`；**沒有** base_weight / base_risk。 |
| **輔星／煞星** | 無統一 id，僅在 content 中以**中文名**出現（`文昌_命宮`、`擎羊_財帛` 等）；`MAIN_STAR_NAMES` / `SHA_STAR_NAMES` 在 lifeBookPrompts 內硬編碼。 |
| **starPalacesAuxRisk** | 已存在，key = `星名_宮位`，value = 1～5，目前僅涵蓋輔星+煞星（無 14 主星×宮位）。 |

### 1.2 可行做法

- **新增一層「星曜 metadata」**（建議**新 JSON**，不一定要 D1 table，方便與靜態 content 一起版控、validator 一起檢查）  
  - 建議檔名：`worker/content/starMetadata-zh-TW.json`（或與 locale 無關的 `starMetadata.json`，因權重／風險為結構性資料）。  
- 每筆至少：`star_id`（與現有對齊）、`name_zh`、`category`、`base_weight`、`base_risk`。  
  - **star_id**：14 主星用既有 `MainStarId`（ziWei, tianJi, …）；輔星／煞星／雜曜目前無 id，可採「中文名即 id」或為其訂立英文 id（如 `wenChang`, `qingYang`），並在 content key 仍維持 `文昌_命宮`，lookup 時用 name_zh 對應。  
- **category**：`主星` | `輔星` | `煞星` | `雜曜`（與現有 MAIN_STAR_NAMES / SHA_STAR_NAMES 對齊）。  
- **base_weight**：數值，供排序「誰主敘事」；建議 1–10 或 0–1，需與 aggregator 約定一致。  
- **base_risk**：1–5，與現有 AuxRisk 同尺度。

**你需要補充的內容：**

- 為**每一顆**會出現在命書宮位中的星曜補一筆 metadata（14 主星 + 目前 Aux 裡出現的所有輔星／煞星／雜曜）。  
- 若日後擴充星曜，只要在 metadata 與（若適用）Aux/AuxAction/AuxRisk 補 key，validator 檢查通過即可。

### 1.3 與 starPalacesAuxRisk 的統一規則（建議）

- **星曜基礎風險**：`base_risk`（star-level）。  
- **星曜×宮位修正**：沿用現有 `starPalacesAuxRisk["星名_宮位"]`（palace-level）。  
- **最終 risk 規則（建議）**：  
  - 若該星在該宮有 `starPalacesAuxRisk` 值，則取 **max(base_risk, palace_risk)** 或 **加權平均**（例如 0.4×base_risk + 0.6×palace_risk）再 round 到 1–5。  
  - 若無 palace 值（例如 14 主星目前多數沒有 AuxRisk 條目），則用 **base_risk**。  
- 建議在技術說明中寫死一條公式（例如「最終 risk = clamp(1, 5, round(0.4×base_risk + 0.6×palace_risk))，缺宮位時用 base_risk」），避免之後各處各自解讀。

### 1.4 型別 / schema 與 validator

- 在程式內（例如 `worker/src/lifebook/` 或 `worker/src/lifebookNarrative.ts`）定義型別：  
  `StarMetadata { star_id: string; name_zh: string; category: string; base_weight: number; base_risk: number }`。  
- **validate-content** 擴充：  
  - 讀取 `starMetadata.json`（或你定的檔名）。  
  - 檢查：所有在 `starPalacesAux` 的 key 裡出現的「星名」+ schema 的 14 主星，在 metadata 中**皆存在**且**具備 base_weight、base_risk**（且 base_risk 1–5）。  
  - 若有遺漏或型別錯誤，報錯並 exit(1)。

**風險與注意：**

- 輔星／煞星／雜曜數量多，若 metadata 用「中文名」當 id，要與 content 的 key 嚴格一致（含簡繁體、全形半形）。  
- 權重與風險的**數值尺度**要一次定好（例如 weight 1–10、risk 1–5），之後語料與 aggregator 都依同一尺度，避免後期大改。

---

## 二、「宮位總權重 / 總風險」計算邏輯（aggregator）

### 2.1 可行做法

- **獨立模組**（例如 `worker/src/lifebook/palaceWeightRiskAggregator.ts` 或 `worker/src/lifebookNarrative.ts` 內一組函式）：  
  - 輸入：本宮星曜列表（含 id/name）、各星在該宮的 effective risk（依上節規則由 base_risk + starPalacesAuxRisk 算出）、各星 base_weight、可選「宮位背景」係數。  
  - 輸出：  
    - `mainStars`：1–2 顆，依 base_weight（及可選亮度、宮位重要性）排序，取前 1–2。  
    - `supportStars`：其餘星。  
    - `totalRisk`：加權分數（例如每星 effective_risk 依 weight 加權後平均，或簡單平均）。  
    - `riskLevel`：將 totalRisk 對應到 1–5（例如區間切分或 round）。

- **與現有接軌**：  
  - 目前 `buildPalaceContext` 已產出 `ctx.stars`（含 name、strength、meaningInPalace、actionAdvice），並有 mainStars/assistantStars/shaStars 的**分類**（依 MAIN_STAR_NAMES / SHA_STAR_NAMES）。  
  - Phase 2 可在此之上加一層：用 aggregator 依 **base_weight + 宮位** 決定「誰是 mainStars[0]」（主敘事）、誰是 supportStars，並算出該宮 **totalRisk / riskLevel**，再寫入同一 context 或擴充型別（例如 `PalaceContext.narrativeLead`、`PalaceContext.riskLevel`）。

### 2.2 你需要補充的內容

- **主星排序規則**：當一宮有多顆主星時，除 base_weight 外是否要考慮「亮度」（廟旺利陷）、「宮位主題」（例如財帛宮偏重武曲）？若需要，要訂出簡單規則（例如 weight + 0.2×亮度分數）或查表，否則實作會先以 base_weight 為主。  
- **totalRisk → riskLevel 對應表**：例如 (0,2]→1、(2,3]→2、(3,4]→3、(4,4.5]→4、(4.5,5]→5；或直接用加權平均再 round。建議在技術說明中寫死，方便調參。

### 2.3 風險

- 若 base_weight 全設成同值，每宮主敘事會變成「名單第一顆」；需至少給主星差異化權重。  
- 大限／流年章節（s15/s16）若也共用同一 aggregator，要確認傳入的「本宮星曜」是否為疊宮後的集合，以及 risk 是否要考慮「本命+大限+流年」疊加；若 Phase 2 只做本命 12 宮，可先不處理疊加，文件註明即可。

---

## 三、語料組裝引擎（narrative engine v1）

### 3.1 可行做法

- **不改 lifebookSection 四欄結構**：仍用既有 placeholder 填基礎文字（星曜解釋、在宮表現、四化等）。  
- **新增一層組裝邏輯**（在 `getPlaceholderMapFromContext` 或其呼叫端）：  
  - 依 aggregator 的 `mainStars` / `supportStars`，決定**主星敘事順序**：mainStars[0] 的敘述放最前，其餘主星與輔星／煞星依序或精簡成一句。  
  - 依 `riskLevel` 決定是否插入「高風險提醒」、以及 **strategic_advice / action** 的語氣（積極 vs 保守）。

- **新增 placeholder（建議）**：  
  - `palaceMainStarSummary`：主星主敘事（1–2 顆的完整或摘要句）。  
  - `palaceRiskSummary`：依 riskLevel 輸出的風險狀況總結（可從固定句型或小型語料表選一句）。  
  - `palaceActionAdvice`：依 riskLevel 選「可積極布局」或「宜保守以守成」等（見下）。  

- **語料來源**：  
  - 可在既有 `starPalacesAuxAction` 上加**建議類型**（例如在 content 中為每個 key 對應兩句：`aggressive` / `conservative`），或另建一個小表：  
    - 例如 `palaceRiskAdvice`：key = 宮位或 riskLevel，value = 一句話；  
    - 或 `starPalaceRiskAdvice.星名_宮位` 下再分 `advice_type: aggressive | conservative`（若希望細到星×宮）。  
  - 命名建議（與現有 copy_key 一致）：  
    - 星曜×宮位且與風險建議相關 → **starPalaceRiskAdvice.星名_宮位**（value 可為 JSON：`{ "conservative": "...", "aggressive": "..." }` 或兩條 copy_key）。  
    - 或宮位級通用 → **palaceRiskAdvice.宮位** 或 **palaceRiskAdvice.riskLevel_1** … **riskLevel_5**，由 aggregator 的 riskLevel 選一條。  

- **組裝規則**：  
  - 主星 narrative 永遠由 **mainStars[0]** 開頭。  
  - 若 **totalRisk ≥ 門檻**（例如 riskLevel ≥ 4），優先選「保守型」action 語料；否則可選積極型。門檻建議寫死在程式或 config，並在技術說明中註明。

### 3.2 你需要補充的內容

- **保守／積極句庫**：  
  - 至少每宮或每個 riskLevel 各一句「保守」與「積極」建議（或每宮兩句，依 riskLevel 二選一）。  
  - 若用 starPalaceRiskAdvice，則要決定覆蓋範圍（僅關鍵宮位 vs 12 宮 × 若干星）。  
- **palaceRiskSummary 句型**：riskLevel 1–5 各對應一句「風險狀況總結」（可先固定 5 句，再依產品需求擴充為宮位或星×宮）。

### 3.3 風險

- 若語料尚未齊全，可先做「邏輯接好、缺料時 fallback 到現有 behavior_pattern / strategic_advice」，避免整章空白或報錯。  
- 新增的 placeholder 要與現有 lifebookSection 骨架**同時更新**（例如 s02、s10、s08 等宮位章節的 structure_analysis / strategic_advice 模板中加入 `{palaceRiskSummary}`、`{palaceActionAdvice}`），否則會看不到效果。

---

## 四、整合現有 content / copy_key

### 4.1 命名方案（建議）

| 用途 | copy_key / 結構 | 說明 |
|------|------------------|------|
| 星曜基礎 metadata | 新 JSON `starMetadata.json`，不經 copy_key | 結構性資料，與 locale 無關或單一 locale。 |
| 星曜×宮位風險建議（保守/積極） | **starPalaceRiskAdvice.星名_宮位**，content 為字串或 JSON `{ "conservative": "...", "aggressive": "..." }` | 與現有 starPalaceAux / AuxAction 同 key 格式，易對齊。 |
| 宮位級風險總結 | **palaceRiskSummary.riskLevel_1** … **riskLevel_5** 或 **palaceRiskSummary.命宮** 等 | 依 riskLevel 或宮位選一句。 |
| 宮位級行動建議（保守/積極） | **palaceActionAdvice.riskLevel_1** … **riskLevel_5** 或依宮位 | 供 placeholder `palaceActionAdvice` 使用。 |

- 若 D1 的 `ui_copy_texts` 要支援，copy_key 需與上表一致；GET /content/2026 組裝時把這些 key 對應到 `dbContent.starPalaceRiskAdvice`、`dbContent.palaceRiskSummary`、`dbContent.palaceActionAdvice` 等（需在 `content-from-d1.ts` 與 DbContent 型別中擴充）。  
- **ui_copy_texts**：只要不刪改既有 key，就不會破壞原界面；新增 key 僅為命書與 narrative 使用。

### 4.2 Validator 擴充

- 除 1.4 的 metadata 檢查外：  
  - 若有 **starPalaceRiskAdvice** 或 **palaceRiskSummary** / **palaceActionAdvice** 的 JSON/字典，validator 可檢查：  
    - key 格式符合「星名_宮位」或「riskLevel_1」等；  
    - 必備欄位存在（若為 JSON）。  
- 可選：檢查 starPalaceRiskAdvice 的 key 為 Aux  key 的子集或與其對齊，避免孤兒 key。

---

## 五、與命書實際輸出的接合（s02 / s15 或 s16 示範）

### 5.1 可行做法

- **命宮 s02**：  
  - 在 `buildPalaceContext` 或其後一步呼叫 aggregator，傳入 s02 對應宮位星曜 + metadata + starPalacesAuxRisk。  
  - 取得 mainStars（1–2）、supportStars、totalRisk、riskLevel。  
  - 在 `getPlaceholderMapFromContext` 中：  
    - 將 mainStars[0] 的敘述排在最前（已有 mainStarsSummary 時可改為依 mainStars[0] 開頭組字串）。  
    - 填入 `palaceRiskSummary`、`palaceActionAdvice`（依 riskLevel 從語料選句）。  
  - lifebookSection s02 的 structure_analysis / strategic_advice 模板預留 `{palaceRiskSummary}`、`{palaceActionAdvice}`（或合併進既有 strategic_advice 一段）。

- **s15 或 s16**：  
  - 若該章節是「單宮」視角（例如大限命宮），同樣可呼叫同一 aggregator，傳入該宮星曜與 risk 資料。  
  - 若為「多宮綜覽」，可選擇：只對「當前焦點宮」算 riskLevel，或對多宮分別算再取 max/平均；Phase 2 建議先做單宮示範，多宮邏輯列為後續。

### 5.2 技術說明文件（建議）

- 在專案內新增 **docs/lifebook-narrative-engine.md**，內容包含：  
  - 權重與風險怎麼算（base_risk、starPalacesAuxRisk、最終 effective risk、totalRisk → riskLevel）。  
  - 語氣如何依 riskLevel 切換（門檻、保守 vs 積極語料選擇規則）。  
  - 之後要新增星曜或宮位語料時，需滿足的欄位（metadata 必備 base_weight/base_risk；Aux 三件 key 對齊；若用 starPalaceRiskAdvice 則 key 與格式一致），以及 validator 會檢查的項目。

---

## 六、總結：可行性與建議順序

| 項目 | 可行性 | 備註 |
|------|--------|------|
| 星曜 metadata（base_weight / base_risk） | ✅ 高 | 新 JSON + validator 擴充即可；需你補齊每顆星的數值。 |
| 統一 base + 宮位 risk 規則 | ✅ 高 | 公式寫死並文件化即可。 |
| 宮位總權重/總風險 aggregator | ✅ 高 | 獨立模組，輸入輸出明確；需訂主星排序與 totalRisk→riskLevel 對應。 |
| 語料組裝引擎（主敘事順序 + 風險語氣） | ✅ 高 | 在既有 placeholder 流程上加一層；需補語料（保守/積極、riskSummary）。 |
| copy_key 與 GET /content/2026 整合 | ✅ 高 | DbContent 與 content-from-d1 擴充；validator 檢查新 key。 |
| s02 / s15 或 s16 示範接合 | ✅ 高 | 依現有 buildPalaceContext → getPlaceholderMap 接上即可。 |

**建議實作順序：**

1. 訂出 **starMetadata** 結構與範例，補齊 14 主星 + 現有 Aux 星曜的 base_weight / base_risk，並擴充 validator。  
2. 實作 **aggregator**（含 base_risk + palace 修正規則、totalRisk → riskLevel）。  
3. 在 **getPlaceholderMapFromContext** 中接上 mainStars[0] 順序與 riskLevel，並新增 placeholder（palaceRiskSummary、palaceActionAdvice）。  
4. 新增語料（保守/積極、riskSummary）與 copy_key 命名，擴充 DbContent / content-from-d1 / validator。  
5. 以 **s02 命宮** 與 **s15 或 s16** 一節做端到端示範，並撰寫 **docs/lifebook-narrative-engine.md**。

**你需要補充的內容總覽：**

- **權重**：每顆星（至少 14 主星 + 輔星 + 煞星）的 base_weight 數值表。  
- **風險**：每顆星的 base_risk（1–5）；starPalacesAuxRisk 已有則為宮位修正。  
- **語料**：依 riskLevel 的「風險總結」句、保守/積極「行動建議」句（可先 5 級各一或每宮各二）。  
- **特殊應用**：大限/流年疊宮是否在本階段納入 risk 疊加、主星排序是否要考慮亮度或宮位主題，需你決定並寫入技術說明。

完成以上後，Phase 2 可在不破壞現有 copy_key 與 lifebookSection 結構的前提下落地，並為後續「更細的語氣與個人化」預留擴充點。
