# 命書系統：未用資料與邏輯／合理性缺口

目的：盤點「有資料但完全沒用／應善用」的項目，以及系統合理性、邏輯性應補強或優化的部分。

---

## 一、有資料但完全沒用

### 1.1 原型文案（archetypeElement / archetypeStar）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **archetypeElement-zh-TW.json** | 未用 | 五行原型（英雄／戰士／看守者等）載入並傳入 content，但 **detectLifeArchetype() 完全沒讀**；人生主題來自硬編碼 `LIFE_ARCHETYPES` + 主戰場／星群／四化規則。 |
| **archetypeStar-zh-TW.json** | 未用 | 星曜原型（王者／智者等）同上，僅在 content 裡，敘事與 archetype 判定皆未引用。 |

**建議**：二選一。  
- **A**：若希望「人生主題」可依內容客製，改寫 `detectLifeArchetype` 或 `formatLifeArchetypeBlock`，在命中某 archetype 時改從 `content.archetypeElement` / `content.archetypeStar` 取 name/description，取代硬編碼。  
- **B**：若維持現行邏輯即足，可將這兩份 JSON 標註為「保留／未來用」或從主線 content 載入清單移除，避免誤以為有在用。

---

### 1.2 心識宮位（consciousPalace）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **consciousPalace-zh-TW.json** | 未用 | 載入並併入 content；**resolveAssembleSnippets() 只取 neuralLoops 與 highPressure**，從未讀取 consciousPalace。組裝結果也沒有「心識宮位」維度。 |

**建議**：  
- 若「心識宮位」是規格一部分：在 assembler 的規則或 AssembleResult 中增加心識維度，並在 resolveAssembleSnippets 中依結果組出 consciousPalace 文案。  
- 若暫無規格：在文件註明「content 有 consciousPalace，目前未接組裝與敘事」，避免重複建同質資料。

---

### 1.3 星曜陰影面（starBaseShadow）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **starBaseShadow-zh-TW.json** | 未用 | 與 starBaseCore 並列載入；**buildPalaceContext() 與 palace 敘事只查 starBaseCore（及 content.stars）**，沒有任何程式讀取 starBaseShadow。 |

**建議**：  
- 若「陰影面」要出現在命書：在組裝星曜說明（例如 palaceStarsOnlySnippet 或星曜結構）時，對 14 主星在 baseMeaning 之後可選加「陰影：{starBaseShadow[starId]}」。  
- 若暫不呈現：在 lifebook-star-sources-inventory 註明「starBaseShadow 已載入，目前未用於任何輸出」。

---

### 1.4 十神×宮位文案（tenGodPalacesById）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **tenGodPalacesById-zh-TW.json** | 未用於命書敘事 | 載入並併入 content；**getPlaceholderMapFromContext 中 map.tenGod / map.tenGodBehavior 被固定為 ""**。十神僅用於組裝規則（tengod_palace_excess）與 AssembleInput，從未注入讀者可見的宮位敘事。 |

**建議**：  
- 若命書要呈現「此宮十神角色」：在對應宮位區塊（或技術版）加入 placeholder（如 tenGodPalaceRole），並在 getPlaceholderMapFromContext 依該宮 tenGodByPalace 查 tenGodPalacesById 填寫。  
- 若僅作規則用：在文件註明「十神宮位文案僅供組裝條件，讀者版未使用」。

---

### 1.5 五行能量標籤（wuxingEnergy）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **wuxingEnergy-zh-TW.json** | 未用於命書敘事 | 載入並併入 content；**getPlaceholderMapFromContext 中 map.wuxingEnergyLabel / map.wuxingEnergyShadow 固定為 ""**。五行僅用於組裝規則（wuxing_extreme），未進入任何讀者可見段落。 |

**建議**：  
- 若命書要呈現五行強弱／能量描述：在 s00 或對應章節增加 placeholder，並從 assembleInput.wuxingStrength + content.wuxingEnergy 組出短句填入。  
- 若暫不呈現：文件註明「wuxingEnergy 僅供組裝條件，讀者版未使用」。

---

### 1.6 宮風險與行動建議（palaceRiskSummary / palaceActionAdvice）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **palaceRiskCorpus**（palaceRiskSummary / palaceActionAdvice） | 已算未顯 | 已依 aggregatePalaceWeightRisk 結果填入 map.palaceRiskSummary、map.palaceActionAdvice（riskLevel_1..5），但 **lifebookSection-zh-TW.json 的 12 宮 structure_analysis 模板中沒有任何 {palaceRiskSummary} 或 {palaceActionAdvice}**，讀者看不到。 |

**建議**：  
- 若希望「此宮風險等級＋建議」出現在命書：在 12 宮 structure_analysis 適當位置（例如【最容易失衡】之後）加入可選區塊，例如「【此宮風險與建議】{palaceRiskSummary} {palaceActionAdvice}」，並在無資料時留空。  
- 若僅供技術版：在技術版區塊明確輸出；讀者版維持不顯示即可，但需在文件註明。

---

### 1.7 引擎用資料未載入（major_patterns / star_combinations）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **worker/data/major_patterns.zh-TW.json** | 未載入 | 規格與 README 有列，但 **loadData.ts 未 import**，沒有任何程式讀取。 |
| **worker/data/star_combinations.zh-TW.json** | 未載入 | 同上。 |

**建議**：  
- 若四化／格局敘事要引用「格局」或「星曜組合」：在 engine 的 generateNarrative 或命書組裝處 import 並查表，產出對應句。  
- 若暫不實作：在 loadData 或 engine 文件註明「major_patterns / star_combinations 尚未整合」。

---

### 1.8 宮位諮詢字典（getPalaceConsultationDictionary）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **palace_consultation_dictionary.zh-TW.json** | 已載入未用 | loadData 匯出 getPalaceConsultationDictionary()，**engine 內無任何呼叫**（generateNarrative、decisionEngine 皆未使用）。 |

**建議**：  
- 若 R11 或宮位敘事要使用「宮位 domain/description」：在 R11 渲染或宮位總論處呼叫並填入。  
- 若規格已棄用：從 loadData 與 engine index 移除匯出，避免誤解為有使用。

---

## 二、有資料但未善用（應考慮接上）

### 2.1 星系文案（starSanfangFamilies）僅部分宮位

| 項目 | 狀態 | 說明 |
|------|------|------|
| **mingPattern / caiPattern / guanPattern** | 僅命／財／官 | 命宮、財帛、官祿有使用；**其餘 9 宮** getSanfangFamilyForPalace 只回傳 roleSummary，沒有「此宮專用一句」的 pattern。若希望各宮都有星系脈絡，可擴充 starSanfangFamilies 結構（例如 perPalacePattern）或接受僅命財官有專句。 |

### 2.2 主星語義僅 14 顆（starSemanticDictionary）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **STAR_SEMANTIC_DICTIONARY** | 僅 14 主星 | 輔星／雜曜無 core/themes；pattern 橋接與敘事 fallback 時輔星只能靠 starPalacesAux／baseMeaning。若希望「輔星一句核心」一致，可擴充字典或約定用 starBaseCore/starPalacesAux 當唯一來源。 |

### 2.3 星×宮×四化（starPalaceTransformMatrix）與命宮矩陣分工

| 項目 | 狀態 | 說明 |
|------|------|------|
| **findStarPalaceTransformMeaning** | 全宮位約 30 條 | 與命宮專用 mingGongTransformMatrix 分工清楚，但 **命宮目前優先用命宮矩陣**，只有 fallback 才用 findStarPalaceTransformMeaning；若命宮矩陣缺某星×四化，可明確 fallback 到 findStarPalaceTransformMeaning，避免空白。 |

---

## 三、邏輯／合理性應補強或優化

### 3.1 無主星宮位：首星與句庫一致

- **現狀**：無 14 主星時以 palaceStars[0] 為 leadStar，並用 buildPalaceStarNarrative / 句庫保底。  
- **建議**：確認「無主星」時 tension/mature 句庫的 key（palaceKeyForNarrative）與「有主星」時一致，且句庫涵蓋所有 12 宮，避免某宮無主星時缺句。

### 3.2 命宮 archetype 與 content 原型脫鉤

- **現狀**：人生主題完全由 detectLifeArchetype 規則 + LIFE_ARCHETYPES 硬編碼決定；content 的 archetypeElement/archetypeStar 未參與。  
- **建議**：若未來要「依命盤選原型、依內容出文案」，應在 detectLifeArchetype 產出 id 後，用 id 對應 content 的 label/title/description；否則在文件註明「人生主題為程式規則＋硬編碼，與 content 原型表無關」。

### 3.3 神經迴路／高壓與心識宮位維度

- **現狀**：AssembleResult 只有 loops + highPressureKeys；consciousPalace 雖在 content，但組裝規則與結果都沒有「心識宮位」維度。  
- **建議**：若規格需要「心識宮位」敘事，須在規則與 AssembleResult 中顯式加入，並在 resolveAssembleSnippets 或新函式中組出對應文案；否則文件註明「心識宮位僅為 content 欄位，未參與組裝」。

### 3.4 R11 與 causality matrix 的 consultation 使用

- **現狀**：docs 提到 R11 應查 palace_causality_matrix 用 consultation/advice；需確認 patternHitRenderer 或 generateNarrative 在 R11 命中時是否真的查表並輸出，且未命中時有固定 fallback（不空白）。  
- **建議**：若尚未實作，補上「R11 渲染時查 causality matrix，命中用 consultation+advice，未命中用一句通用 fallback」。

### 3.5 讀者版 placeholder 與技術版一致

- **現狀**：命書版已移除「資料不足」「rule id」等；palaceRiskSummary/palaceActionAdvice 等有算但未出現在讀者模板。  
- **建議**：若希望「技術版與讀者版同一套資料、讀者版只少技術標記」，可讓讀者版模板也包含可選的風險／建議區塊（空則不顯示），避免兩套邏輯分叉。

### 3.6 單一 source of truth 的約定

- **現狀**：lifebook-star-sources-inventory 已約定星曜一句＝starSemanticDictionary、星在宮長文＝starPalacesMain/Aux、命宮四段＝mingGongStarMatrix。  
- **建議**：在程式註解或 RULE 中明確寫出「主星一句不從 starBaseCore 單獨當人格句」「命宮四段缺星時 fallback 順序：mingGongStarMatrix → getStarSemantic → starBaseCore」，減少之後改動時破壞一致性的風險。

---

## 四、總結表（應用／應修／可選）

| 類別 | 項目 | 建議 |
|------|------|------|
| **應用** | archetypeElement / archetypeStar | 接上 detectLifeArchetype 或 formatLifeArchetypeBlock，或註明未用 |
| **應用** | consciousPalace | 接上組裝與 resolveAssembleSnippets，或註明未用 |
| **應用** | starBaseShadow | 接上星曜結構／陰影句，或註明未用 |
| **應用** | tenGodPalacesById | 接上宮位十神敘事 placeholder，或註明僅規則用 |
| **應用** | wuxingEnergy | 接上五行敘事 placeholder，或註明僅規則用 |
| **應用** | palaceRiskSummary / palaceActionAdvice | 在 12 宮模板或技術版中輸出，或註明僅內部用 |
| **載入／用** | major_patterns / star_combinations | 在 engine 載入並用於敘事，或註明未整合 |
| **用** | getPalaceConsultationDictionary | 在 R11 或宮位敘事使用，或移除匯出 |
| **邏輯** | 無主星句庫、R11 causality、archetype 與 content 對齊、心識維度 | 依上列各小節補強或文件化 |

以上為「有資料但沒用／應善用」與「邏輯／合理性應補強」的整理；實作時可依優先級（讀者可見 > 技術版 > 文件註明）排程。
