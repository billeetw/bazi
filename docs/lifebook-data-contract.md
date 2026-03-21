# 命書資料模型契約（Lifebook Data Contract）

本文件定義 **NormalizedChart** 與 **LifebookFindings** 的權威資料來源與讀取規則。所有命書正式版產出必須遵守此契約。

**核心章節例外**：目前產出的 **13 段（s04 命主・身主・身宮 + 12 宮）** 允許正式版**直接讀取 chart + content**，不強制經 LifebookFindings。詳見 **`lifebook-core-sections-contract.md`**。以下 §1.2、§1.3 對「非核心」章節（若恢復 s00/s03/s15～s21）仍適用。

---

## 1. 權威資料來源

### 1.1 palaceByBranch

- **palaceByBranch** 是計算 **流年命宮** 的唯一權威來源。
- 流年命宮必須且僅能透過查表取得：`flowYearPalace = palaceByBranch[liunian.branch]`（或等價之 `getFlowYearPalace(liunian.branch, palaceByBranch)`）。
- 禁止使用其他公式或 offset 推算流年命宮（例如禁止 `palaceOrder[branchIndex]`、禁止僅依地支環 offset 而不經 palaceByBranch）。

### 1.2 命書正式版讀取規則

- **非核心章節**（s00、s03、s15～s21，若恢復產出）：命書正式版只准讀取 LifebookFindings；組裝層不得直接讀取 `chartJson` / `NormalizedChart` 做為正式版內容來源。路徑：`chartJson` → 正規化／引擎 → **LifebookFindings** → 命書組裝。
- **核心章節**（s04 + 12 宮，目前唯一產出）：允許正式版**直接讀取** `chartJson`、`content`、s04 時之 `config`；不強制經 LifebookFindings。見 **`lifebook-core-sections-contract.md`**。

### 1.3 模板層級限制

- **模板層級不得推導或計算命理算法**（例如飛星、四化、宮位推算、流年命宮公式、宮干飛化公式）。
- **模板只允許做文字組裝與 placeholder 替換。**
- 所有命理相關的「數值／宮位／星曜／四化」必須已預先計算並寫入 LifebookFindings（或經契約允許的擴充欄位），模板僅負責將這些欄位填入版面。

---

## 2. 本命層級規則

### 2.1 本命飛化流向

- 命書中「**本命飛化流向**」唯一來源為 **natal.flows**。
- natal.flows 由宮干飛化算法產出（buildGongGanFlows + gongGanFlowsToTransformEdges）；不得使用 overlap 或其它來源的邊做為本命「從 X 宮出、入 Y 宮」的顯示。

### 2.2 natalTransforms / birthTransforms

- **natalTransforms**、**birthTransforms** 保留為相容資料（例如既有引擎或除錯仍可能引用）。
- **命書正式版不得再讀取** natalTransforms 或 birthTransforms 做為「本命四化流向」或「本命宮干飛化」的內容。
- 命書正式版之本命飛化敘事只准來自 LifebookFindings 中與 natal.flows 對應的欄位（例如 natalFlows）。

---

## 3. 小結

| 項目 | 規則 |
|------|------|
| 流年命宮 | 唯一權威來源：palaceByBranch |
| 命書正式版資料來源 | **核心 13 段**：可直讀 chart + content（見 lifebook-core-sections-contract.md）；**其餘章節**：只准讀取 LifebookFindings |
| 模板職責 | 僅文字組裝與 placeholder 替換；禁止推導／計算命理 |
| 本命飛化流向 | 唯一來源：natal.flows |
| natalTransforms / birthTransforms | 保留相容；命書正式版不得讀取 |
