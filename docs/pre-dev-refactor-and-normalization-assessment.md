# 繼續開發前：重構、資料正規化、程式碼拆解評估

本文整理目前（Phase 1 & 2 之後）**是否需要在繼續開發前**做重構、資料正規化、程式碼拆解，以及建議優先順序。

---

## 一、目前狀態摘要

- **命書產出**：只產 **s04（命主・身主・身宮）+ 12 宮**，共 13 段；s00、s03、s15～s21 為「本章重做中」。
- **入口**：`SECTION_ORDER` / `SECTION_TEMPLATES` 僅含上述 13 段；`buildP2FindingsAndContext` / `injectTimeModuleDataIntoSection` 僅在時間模組章節時呼叫（目前不會觸發）。
- **既有文件**：`lifebook-technical-debt-and-data-normalization-audit.md`、`lifebook-data-contract.md`、`lifebook-rebuild-plan-keep-core-only.md` 已盤點技術債與資料契約。

---

## 二、是否需要重構？

### 建議：**要，但可與開發並行、分階段做**

| 項目 | 現狀 | 建議 | 是否擋開發 |
|------|------|------|-------------|
| **lifeBookPrompts.ts ~4900 行** | 單檔過大，placeholder、s04、12 宮、s00/s03/時間模組邏輯全在一起 | 拆成：`placeholders/`（s04、12 宮、共用工廠）、`sectionTechnicalBlocks.ts`、保留主檔只做組裝與 export | 否，可先加註「僅用 s04/12 宮區塊」再逐步抽檔 |
| **index.ts ~2250 行** | HTTP 路由、單節/整本產出、hydration、P2、技術/讀者模式混在一起 | 抽成：`routes/lifebook.ts`、`lifebook/generateSection.ts`、`lifebook/generateFullBook.ts`，index 只做 router + env | 否，可邊加 feature 邊抽 |
| **死碼** | s00/s03/s15～s21 的組裝與 P2 仍存在，只是不被呼叫 | Phase 3 再刪；若先動可先加 `// deprecated: 僅時間模組，目前 SECTION_ORDER 未含` | 否 |
| **重複常數** | `["s15",...,"s21"]`、`PALACE_SECTION_KEYS`、`TIME_MODULE_SECTION_KEYS` 多處定義 | 收斂到單一常數檔（如 `lifebook/sectionKeys.ts`）再 import | 否，屬整理型重構 |

**結論**：有重構需求，但**不建議「先全面重構再開發」**。建議：**先約定「核心章節邊界」與「資料來源」（見下），再邊開發邊做小步拆檔與常數收斂。**

---

## 三、是否需要資料正規化？

### 建議：**要，且應在加新 feature 前先約定**

| 項目 | 現狀 | 建議 | 是否擋開發 |
|------|------|------|-------------|
| **Chart 來源不一** | 命主/身主/身宮、12 宮用 `ziwei` / `config`；時間模組（已停用）用 `decadalLimits`、`liunian`、`overlap`；四化邊有 overlap vs natal.flows 混源問題 | **核心 13 段**明訂：命主/身主/身宮只讀 `ziwei`（或 config 由 index 從 ziwei 組）；12 宮只讀 `ziwei.palaces` / `mainStars`（與 chartToAssembleInput 一致）；不依賴 overlap 做「唯一真相」 | 是，建議先寫進契約再擴充 12 宮或 s04 |
| **Content 與 i18n 分流** | `data/i18n/` 給前端 UI；`worker/content/*.json` 給命書語句、宮位/星曜解釋 | 命書語句若未來要多語，可約定：key 結構一致，依 locale 選 `worker/content/content-{locale}.json` 或沿用 zh-TW；不與 `data/i18n` 混用 key | 否，可之後再統一 |
| **12 宮語句庫分散** | 各宮有 `*GongSentenceLibrary.ts` + content JSON（starPalacesMain、palaceContexts 等） | 約定「宮位 × 星曜」解釋的單一來源（例如 content 的某棵結構 + 組句函式只讀該處），避免多檔重複定義 | 建議在動 12 宮邏輯前約定，不一定要先改完 |
| **Findings 與正式版** | 契約寫「命書正式版只讀 LifebookFindings」；目前核心 13 段不經 findings，直接 chart + content | 若堅持「正式版只讀 findings」：需讓 s04/12 宮也寫入 findings 再由組裝讀；若接受「核心段可直讀 chart+content」：在契約中註明例外 | 建議先決定再擴充，避免之後又要大改 |

**結論**：**需要做資料正規化與契約收斂**，尤其是：**(1) 核心 13 段只用的 chart/content 來源寫成契約；(2) 四化邊／overlap 不當唯一真相（與既有 technical-debt 文件一致）。** 這部分**建議在繼續開發前先寫一版「核心章節資料契約」**，再依契約加功能。

---

## 四、是否需要程式碼拆解？

### 建議：**要，以「邊界清晰、可測」為目標，不必一次拆完**

| 項目 | 現狀 | 建議 | 是否擋開發 |
|------|------|------|-------------|
| **getPlaceholderMapFromContext** | 單一巨型函式，內含 s00/s03/s04/時間模組/12 宮 | 拆成：`getPlaceholderMapS04`、`getPlaceholderMapPalace`、共用工廠（chart→星曜、宮位）；主函式依 sectionKey 分派 | 否，可先保留主函式，把 s04 與 12 宮區塊抽成子函式呼叫，利於單測 |
| **getSectionTechnicalBlocks** | 已做 Phase 2 early return（僅 s04/12 宮），內部仍呼叫 assembleRiskProfile、getPlaceholderMapFromContext | 核心路徑可抽成 `buildCoreSectionBlocks(sectionKey, chart, config, content)`，其餘不變 | 否 |
| **index 產書流程** | 單節 / 整本 / technical / 讀者 / hydration 同檔 | 拆成：`generateSectionTechnical`、`generateSectionWithAI`、`generateFullBook`、`hydrateSection`，由路由呼叫 | 否，可與新 feature 一起抽 |
| **測試邊界** | 多數測整條鏈；單一「s04 只吃 config」「12 宮只吃 chart+content」的單元測較少 | 拆出 s04/palace placeholder 組裝後，為其寫「給定 chart/config/content → 預期 map」的單測 | 建議在改 12 宮或 s04 前補一兩則，方便之後重構不壞 |

**結論**：**有拆解需求**，優先目標是**邊界清楚、可單測**。不必在繼續開發前全部拆完，但建議：**(1) 先拆 getPlaceholderMapFromContext 的 s04 與 12 宮區塊成可測函式；(2) 產書流程拆成少數幾個 named 函式。** 其餘可隨 feature 逐步拆。

---

## 五、建議優先順序（繼續開發前 vs 並行）

| 優先級 | 項目 | 類型 | 建議時機 |
|--------|------|------|----------|
| **P0** | **核心章節資料契約**：s04 + 12 宮只讀的 chart/content 欄位、不讀 overlap 做唯一真相、命主/身主/身宮來源 | 資料正規化 | **繼續開發前**寫一版（可放在 `lifebook-data-contract.md` 或新檔 `lifebook-core-sections-contract.md`） |
| **P0** | **決定「正式版是否仍只讀 Findings」**：若否，在契約中註明核心 13 段可直讀 chart+content | 資料正規化 | **繼續開發前**決定並更新契約 |
| **P1** | **getPlaceholderMapFromContext** 中 s04 / 12 宮區塊抽成 `getPlaceholderMapS04`、`getPlaceholderMapPalace`（或同名私有函式），主函式只分派 | 程式碼拆解 | 可與下一輪 12 宮或 s04 開發**並行** |
| **P1** | **為 s04 與單一 12 宮** 各寫 1 則「給定 chart/config/content → 預期 placeholder 片段」的單元測試 | 可測性 | **繼續開發前**或緊接 P1 拆解後 |
| **P2** | 常數收斂：`SECTION_ORDER`、`PALACE_SECTION_KEYS`、`TIME_MODULE_SECTION_KEYS`、section 列表集中到一處 | 重構 | 並行，不擋開發 |
| **P2** | index 產書流程拆成 named 函式（generateSectionTechnical、generateFullBook 等） | 重構 | 並行 |
| **P3** | Phase 3：刪除或移出僅供 s00/s03/s15～s21 的程式與 content | 清理 | 確認不再恢復後再做 |
| **P3** | lifeBookPrompts 大檔拆成多檔（placeholders、sectionTechnicalBlocks） | 重構 | 並行，可晚於 P1/P2 |

---

## 六、一句話建議

- **需要重構與拆解**，但不必「全部做完才開發」；建議**先做 P0（核心章節資料契約 + 正式版是否只讀 Findings）**，再邊開發邊做 P1 拆解與單測、P2 常數與 index 整理。
- **資料正規化**要優先約定：**核心 13 段只用 ziwei/config/content，不把 overlap 當唯一真相**；與既有 `lifebook-technical-debt-and-data-normalization-audit.md`、`lifebook-data-contract.md` 對齊後再擴充功能較安全。

若你願意，下一步可以從 **P0：撰寫「核心章節（s04 + 12 宮）資料契約」** 開始，或指定先做 P1 的哪一項。
