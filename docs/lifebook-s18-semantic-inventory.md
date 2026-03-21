# S18 語義資產盤點

目標：讓 S18「重點說明」與星曜補充句更好懂；12 宮與星曜皆有固定可讀短句；優先沿用既有資產，不足再補。

---

## 一、A. 宮位短句解釋盤點

**盤點範圍**：`worker/src/lifebook/starSemanticDictionary.ts`（`PALACE_SEMANTIC_DICTIONARY`）、`worker/content/decadalPalaceThemes.json`、schema 宮位 label。

### 既有資產：starSemanticDictionary.ts

| 宮位 | existing | source | 既有 short | 既有 core |
|------|----------|--------|------------|-----------|
| 命宮 | ✅ | starSemanticDictionary.ts | 自我定位與人生方向 | 自我定位與人生方向 |
| 兄弟宮 | ✅ | starSemanticDictionary.ts | 同儕、手足與合作 | 同儕、手足與合作關係 |
| 夫妻宮 | ✅ | starSemanticDictionary.ts | 親密關係與一對一合作 | 親密關係與合作關係 |
| 子女宮 | ✅ | starSemanticDictionary.ts | 創造與延伸成果 | 創造、延伸成果與內在產出 |
| 財帛宮 | ✅ | starSemanticDictionary.ts | 金錢、資源配置與投入回報 | 資源、收入、交換與現實配置 |
| 疾厄宮 | ✅ | starSemanticDictionary.ts | 身心壓力與修復 | 身心壓力、修復與耗損 |
| 遷移宮 | ✅ | starSemanticDictionary.ts | 外部環境與移動 | 外部環境、移動與與世界互動 |
| 僕役宮 | ✅ | starSemanticDictionary.ts | 團隊、人脈與人際 | 團隊、人脈與人際系統 |
| 官祿宮 | ✅ | starSemanticDictionary.ts | 事業、角色與責任 | 事業、角色、責任與社會位置 |
| 田宅宮 | ✅ | starSemanticDictionary.ts | 穩定感、歸屬與生活根基 | 安全感、根基、居所與可安放之處 |
| 福德宮 | ✅ | starSemanticDictionary.ts | 情緒、內在狀態與精神能量 | 內在狀態、精神能量與情緒底盤 |
| 父母宮 | ✅ | starSemanticDictionary.ts | 權威、支持與價值框架 | 權威、支持來源與價值框架 |

**結論（宮位）**：  
- 12 宮在專案內**都有**可沿用的語義（`core`、`short`），來源單一：`worker/src/lifebook/starSemanticDictionary.ts`。  
- 既有為「一句話」或「頓號分隔」 (、)，**不是** S18 要求的「短句1／短句2／短句3」、每條 3 個短語、一眼看懂。  
- **需補齊**：S18 專用 **palaceShortLabelMap**（12 宮都要），格式統一為「短句1／短句2／短句3」，便於 S18 顯示「工作／責任／角色（官祿宮）」這類用法。

---

## 二、B. 星曜短句解釋盤點

**盤點範圍**：`worker/src/lifebook/starSemanticDictionary.ts`（`STAR_SEMANTIC_DICTIONARY`）、`worker/content/starTransformMeanings.json`。

### 既有資產：STAR_SEMANTIC_DICTIONARY（主星 14 顆）

| 星曜 | existing | source | core（可壓成短句） | themes（前幾項可當短句） |
|------|----------|--------|--------------------|---------------------------|
| 紫微 | ✅ | starSemanticDictionary.ts | 領導、主導權與中心角色 | 領導、權威、決策、位置感、掌控感 |
| 天機 | ✅ | starSemanticDictionary.ts | 思考、策略、變化與判斷 | 思考、判斷、策略、規劃、變化 |
| 太陽 | ✅ | starSemanticDictionary.ts | 行動、表現、責任與外在成就 | 責任、表現、成就、外在形象、付出 |
| 武曲 | ✅ | starSemanticDictionary.ts | 資源管理、成果、金錢與現實回報 | 金錢、資源、成果、效率、責任分配 |
| 天同 | ✅ | starSemanticDictionary.ts | 情緒、安全感與舒適節奏 | 情緒、安全感、舒服、人際溫度、生活節奏 |
| 廉貞 | ✅ | starSemanticDictionary.ts | 慾望、權力、界線與突破 | 慾望、界線、權力、吸引力、突破 |
| 天府 | ✅ | starSemanticDictionary.ts | 穩定、承接、累積與資源保存 | 穩定、累積、保存、承接、長期配置 |
| 太陰 | ✅ | starSemanticDictionary.ts | 感受、內在需求、情感與細膩觀察 | 情感、內在需求、安全需求、關係感受、細膩 |
| 貪狼 | ✅ | starSemanticDictionary.ts | 機會、慾望、社交與擴張 | 機會、社交、慾望、擴張、吸引 |
| 巨門 | ✅ | starSemanticDictionary.ts | 觀點、溝通、辯證與理解真相 | 溝通、辯論、資訊、觀點、真相 |
| 天相 | ✅ | starSemanticDictionary.ts | 平衡、秩序、協調與制度感 | 平衡、協調、秩序、制度、公平 |
| 天梁 | ✅ | starSemanticDictionary.ts | 保護、價值感、道德判斷與承擔 | 保護、照顧、價值感、道德、承擔 |
| 七殺 | ✅ | starSemanticDictionary.ts | 果斷、破局、壓力下的決斷與重建 | 決斷、破局、壓力處理、重建、果敢 |
| 破軍 | ✅ | starSemanticDictionary.ts | 變革、拆解、重新開始與推翻舊框架 | 變革、重來、更新、拆解、新局 |

### 既有資產：starTransformMeanings.json（四化一句）

- **內容**：星+四化（如 天機_lu、太陽_ji）的「一句代表…」長句，**不是**「短句1／短句2／短句3」。
- **用途**：適合四化敘事，**不適合**直接當 S18 星曜補充句的短標（例如「這種狀態比較偏向：工作／責任／角色（太陽）」）。
- **輔星**：文曲、文昌、左輔、右弼 僅在 starTransformMeanings 有長句，**沒有**在 STAR_SEMANTIC_DICTIONARY；若 S18 要顯示輔星短句，需另補。

**結論（星曜）**：  
- **可沿用**：14 顆主星在 `starSemanticDictionary.ts` 已有 `core` 與 `themes`，可**衍生成**「短句1／短句2／短句3」（例如取 core 或 themes 前 3 項，以 ／ 串起）。  
- **不足／需你補齊**：  
  - 若希望與 S18 例句**完全一致**（例如 太陽→工作／責任／角色、天機→變動／判斷／調整），建議由你補 **starShortLabelMap**，專案內目前沒有這份對照。  
  - 文曲、文昌、左輔、右弼 無 `core`/themes，若 S18 要顯示這四顆的短句，也需在 starShortLabelMap 或同類表中補齊。

---

## 三、補齊方案（本次實作）

### 3.1 12 宮：S18 專用 palaceShortLabelMap（已補）

既有資產不夠精簡、格式非「短句／短句／短句」，因此補一份 **S18 專用** 對照，12 宮都有，每宮 3 個短語、一眼看懂。

**格式**：宮位 → 短句1／短句2／短句3（見下表；實作見 `worker/src/lifebook/s18/palaceShortLabels.ts`）。

| 宮位 | S18 短句（palaceShortLabelMap） |
|------|----------------------------------|
| 命宮 | 自己／狀態／選擇 |
| 兄弟宮 | 同儕／合作／平行關係 |
| 夫妻宮 | 感情／伴侶／一對一關係 |
| 子女宮 | 子女／創作／延伸成果 |
| 財帛宮 | 收入／現金流／資源調度 |
| 疾厄宮 | 壓力／身心／內在負荷 |
| 遷移宮 | 外部／環境／對外發展 |
| 僕役宮 | 人際／客戶／團隊 |
| 官祿宮 | 工作／責任／角色 |
| 田宅宮 | 資產／基礎／留存能力 |
| 福德宮 | 心態／精神／內在狀態 |
| 父母宮 | 制度／長輩／支持系統 |

### 3.2 星曜：由你補齊 starShortLabelMap

- **不自動補**：依你要求「若專案已有可直接沿用者，優先沿用；沒有另外補」；專案有 `core`/themes 可衍生，但沒有「太陽→工作／責任／角色」這類固定短標。  
- **請你補**：  
  - 主星 14 顆（及 S18 會用到的輔星如 文昌、文曲、左輔、右弼）的 **starShortLabelMap**，格式：`星曜 → 短句1／短句2／短句3`。  
  - 範例：  
    - 太陽：工作／責任／角色  
    - 天機：變動／判斷／調整  

補齊後可放在同一份 S18 語義模組或你指定的 JSON/TS 中，再讓 S18 重點說明與星曜補充句讀取。

---

## 四、S18 使用格式（約定，尚未改 S18 程式）

1. **宮位**  
   - 重點說明時優先把宮位翻成人話再括號標宮名。  
   - 例：官祿宮 → 工作／責任／角色（官祿宮）；僕役宮 → 人際／客戶／團隊（僕役宮）。

2. **星曜**  
   - 星曜補充句固定格式：  
     - `這種狀態比較偏向：工作／責任／角色（太陽）`  
     - `這種狀態比較偏向：變動／判斷／調整（天機）`  
   - 先出短句，括號內標星曜，一眼看懂是哪顆星、什麼特質。

---

## 五、摘要

| 項目 | 可沿用 | 不足／需補 |
|------|--------|------------|
| **12 宮短句** | 有 core/short（starSemanticDictionary），但非「／」三分短語 | ✅ 已補 **palaceShortLabelMap**（12 宮，見上表與 `s18/palaceShortLabels.ts`） |
| **星曜短句** | 14 主星有 core/themes 可衍生短句 | 請你補 **starShortLabelMap**（主星＋必要輔星），以符合 S18 例句格式 |

本次僅做盤點與 12 宮補齊，**未改** S18 的 eventSignals / narrativeTemplates；待 starShortLabelMap 補齊後，再一起接上 S18 顯示邏輯。
