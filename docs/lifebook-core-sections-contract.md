# 核心章節資料契約（s04 + 12 宮）

本文件定義**目前產出的 13 段**（s04 命主・身主・身宮 + 12 宮）的權威資料來源與讀取規則。與 `lifebook-data-contract.md` 的關係：**核心章節為契約例外**，允許正式版直讀 chart + content；其餘章節（若恢復）仍依主契約「正式版只讀 LifebookFindings」。

---

## 1. 範圍

- **核心章節**：`s04`、`s02`、`s10`、`s01`、`s05`、`s06`、`s07`、`s08`、`s09`、`s11`、`s12`、`s13`、`s14`（共 13 段）。
- **不適用**：s00、s03、s15～s21 目前不產出；若日後恢復，依主契約或另訂補充契約。

---

## 2. 正式版讀取規則（核心章節例外）

- **核心 13 段之命書正式版，允許直接讀取 `chartJson` 與 `content`（AssembleContentLookup），不強制經由 LifebookFindings。**
- 組裝路徑：`chartJson` + `content` +（s04 時）`config`（命主/身主/身宮）→ getPlaceholderMapFromContext / getSectionTechnicalBlocks → 模板替換 → 輸出。
- 若日後改為「核心段也寫入 findings 再讀」，可廢除此例外並更新本契約。

---

## 3. 權威資料來源（核心章節）

### 3.1 命主・身主・身宮（s04）

| 資料 | 權威來源 | 禁止 |
|------|----------|------|
| 命主星名 | `chartJson.ziwei` → index 組 `config.masterStars.命主`（getMasterStarsFromZiwei）；或 content 對照 | 不得用 overlap、fourTransformations、decadalLimits 當命主來源 |
| 身主星名 | 同上，`config.masterStars.身主` | 同上 |
| 身宮宮位 | `chartJson.ziwei` → index 組 `config.bodyPalaceInfo.palace`（getBodyPalaceFromZiwei 等） | 不得用流年命宮、大限宮位當身宮 |
| 命主/身主/身宮一句解釋 | content 或 sentence library：`destinyStarSentenceLibrary`、`bodyStarSentenceLibrary`、`bodyPalaceSentenceLibrary`；lifeLord-bodyLord、bodyPalace 相關 JSON | 不得用 findings 當唯一來源（目前 findings 不寫入 s04 專用欄位） |

- **單一事實**：命主/身主/身宮的「是誰、落在哪」只來自 **ziwei + index 組出的 config**；解釋文案只來自 **content / sentence library**。

### 3.2 12 宮（s01, s02, s05～s14）

| 資料 | 權威來源 | 禁止 |
|------|----------|------|
| 各宮主星／星曜列表 | `chartJson.ziwei`（palaces / mainStars）或經 `chartToAssembleInput` 產出的 `starByPalace`；與 PALACE_ID / 宮位順序一致 | **不得以 overlap.items 或 overlap 的 transformations 做為「各宮星曜」的唯一真相**；overlap 僅可做輔助、標籤、摘要 |
| 宮位概述、核心特質、星曜在本宮表現、三方四正、星曜組合、建議 | content：`starPalacesMain`、`palaceContexts`、各宮語句庫（*GongSentenceLibrary）、`lifebookSection` 模板 | 命書正式版不讀 findings 的該宮敘事（除非日後改寫 findings 再讀） |
| 四化／宮干飛化（若 12 宮顯示） | 若沿用現有實作：findings 的 `sihuaPlacementItems`、`natalFlowItems` 或 chart 的 `natal.flows` / 宮干飛化算法；見主契約 2.1 | 不得用 overlap 的邊做為本命飛化「從 X 出、入 Y」的唯一來源；與 technical-debt 文件「禁止混源」一致 |

- **單一事實**：各宮「有哪些星」只來自 **ziwei（或 buildAssembleInput 的 starByPalace）**；「星曜解釋、宮位特質」只來自 **content**；四化流向若顯示，來自 **natal.flows / findings 對應欄位**，不來自 overlap 單獨當唯一真相。

### 3.3 overlap 的角色（核心章節）

- **overlapAnalysis / overlap** 在核心 13 段**不得**作為以下項目的唯一權威來源：
  - 命主、身主、身宮的星名或宮位；
  - 各宮主星／星曜列表；
  - 本命四化流向邊（from/to/star）。
- 允許：overlap 用於標籤、計數、輔助顯示（例如「此地雷區」），但若與 ziwei / content / natal.flows 衝突，以 ziwei / content / natal.flows 為準。

---

## 4. Content 與 locale

- 核心章節使用之語句庫、模板、對照表以 **worker/content/** 與 **lifebookSection-zh-TW.json** 為準。
- 若未來支援多語，約定：key 結構一致，依 locale 選用對應 content 檔（例如 content-zh-CN.json）；不與 `data/i18n` 的 UI key 混用。

---

## 5. 小結

| 項目 | 規則 |
|------|------|
| 核心章節範圍 | s04 + s02, s10, s01, s05～s14（共 13 段） |
| 正式版資料來源 | **允許**直讀 chart + content（+ s04 時 config）；不強制經 LifebookFindings |
| 命主/身主/身宮 | 只讀 ziwei → config；解釋只讀 content / sentence library |
| 12 宮星曜 | 只讀 ziwei / starByPalace；不讀 overlap 當唯一真相 |
| 12 宮解釋與建議 | 只讀 content（starPalacesMain、palaceContexts、各宮語句庫等） |
| 四化流向（若顯示） | 本命層只讀 natal.flows 或 findings 對應欄位；禁止 overlap 單獨當唯一來源 |
| overlap | 僅輔助；不得作為星曜列表或四化邊的唯一權威 |
