# 命書算法定義契約（Lifebook Algorithm Contract）

本文件明確定義系統內 **transforms** 與 **flows** 兩種概念，以及其實作與禁止事項。

---

## 1. 概念定義

### 1.1 transforms（層級四化落宮）

- **定義**：transforms = **層級四化落宮**。
- **來源**：
  - 本命天干 → 生年四化（祿／權／科／忌 對應之星曜）
  - 大限天干 → 該十年四化
  - 流年天干 → 該年四化
- **特徵**：
  - 單一落點（某星化祿／化權／化科／化忌「落在」某宮）。
  - **無 fromPalace**；僅有「星 + 化 + 落宮」。
- **用途**：回答「這一層哪四顆星被點名、各自落在哪一宮」。

### 1.2 flows（宮干飛化）

- **定義**：flows = **宮干飛化**。
- **特徵**：
  - 具有 **fromPalace**（發動飛化的宮位，由該宮宮干決定哪四顆星化祿／權／科／忌）。
  - 具有 **toPalace**（被點名之星在本命盤的所在宮位）。
  - 形成「從 fromPalace 出 → 飛某星 → 入 toPalace」的路徑。
- **用途**：回答「從哪一宮飛出、飛哪顆星、入哪一宮」。

---

## 2. 目前實作規則

### 2.1 已實作

- **只有 natal.flows 已實作。**
- natal.flows 由宮干飛化算法產出：palaceStemMap + starsByPalace + SIHUA_BY_STEM → buildGongGanFlows(layer: "natal") → gongGanFlowsToTransformEdges。

### 2.2 必須保持為空

- **currentDecade.flows** 與 **yearlyHoroscope.flows** 必須保持為空陣列 `[]`。
- 大限／流年層級目前不產「from → to」路徑；僅提供該層的「四化落宮」（transforms／mutagenStars + 落宮）。

---

## 3. 禁止事項

- **不得虛構 from → to 路徑**：在未定義且實作大限／流年宮干飛化規則前，不得為 currentDecade.flows 或 yearlyHoroscope.flows 填入任何邊。
- **不得將 transforms 誤稱為 flow**：層級四化落宮（某星化祿落在某宮）不得以「四化流向」「從 X 宮出、入 Y 宮」表述；大限／流年僅能使用「四化落宮」相關術語。

---

## 4. 小結

| 概念 | 定義 | 特徵 | 目前實作 |
|------|------|------|----------|
| transforms | 層級四化落宮 | 單一落點、無 fromPalace | 本命／大限／流年皆有（來源：各層天干） |
| flows | 宮干飛化 | fromPalace + toPalace | 僅 natal.flows 已實作；decade/year flows = [] |
