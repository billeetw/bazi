# Life Manual 敘事語料權威來源定義 (Narrative Canonical Sources)

本文件定義系統中各類敘事語料的 **唯一真理 (Single Source of Truth, SSOT)**。  
未來的 `narrativeFacade` 與所有單宮敘事 builder，均須嚴格遵守此來源對應表，以消除語意衝突與冗餘。

---

## 1. 權威來源清單 (Canonical Sources)

### A. 宮位語意 (Palace Semantics)

| 用途 | 權威來源 |
|------|----------|
| **Core Semantic** | `worker/src/lifebook/starSemanticDictionary.ts` → `PALACE_SEMANTIC_DICTIONARY` |
| **Narrative Context** | `worker/content/palaceContexts-zh-TW.json` |
| **Decision Theme** | `worker/content/decisionMatrix.json` → `palaceThemes` |
| **Decadal Theme** | `worker/content/decadalPalaceThemes.json` |

---

### B. 星曜語意 (Star Semantics)

| 用途 | 權威來源 |
|------|----------|
| **Primary Source** | `worker/src/lifebook/starSemanticDictionary.ts` → `STAR_SEMANTIC_DICTIONARY` |
| **Fallback** | `worker/content/starBaseCore-zh-TW.json` |
| **Fallback** | `worker/content/starBaseMeaning-zh-TW.json` |

---

### C. 星曜在宮位 (Star in Palace Semantics)

| 用途 | 權威來源 |
|------|----------|
| **主星落宮語意** | `worker/content/starPalacesMain-zh-TW.json` |
| **輔星落宮語意** | `worker/content/starPalacesAux-zh-TW.json` |
| **行動建議** | `worker/content/starPalacesAuxAction-zh-TW.json` |
| **風險提示** | `worker/content/starPalacesAuxRisk-zh-TW.json`、`worker/content/starMetadata.json` |

---

### D. 星曜組合 (Star Combinations / CCL3)

| 用途 | 權威來源 |
|------|----------|
| **組合語意** | `worker/content/ccl3/star-combinations.json`（配合 `starCombinationEngine` 使用） |

---

### E. 四化語意 (Transform / Sihua Semantics)

| 用途 | 權威來源 |
|------|----------|
| **命宮專屬四化** | `worker/content/ccl3/patterns/mingGongTransformMatrix` |
| **一般宮位四化** | `worker/src/lifebook/starPalaceTransformMatrix.ts` → `STAR_PALACE_TRANSFORM_MATRIX` |
| **Fallback** | `worker/content/transformIntoPalaceMeanings.json` |

---

## 2. 降級與備用來源 (Fallback Only)

當權威來源查無資料時，`narrativeFacade` 才允許讀取：

- `worker/content/starBaseCore-zh-TW.json`
- `worker/content/starBaseMeaning-zh-TW.json`
- `worker/content/transformIntoPalaceMeanings.json`
- `worker/content/ccl3/patterns/main-star-inference-hints.json`

---

## 3. 棄用候選名單 (Deprecated Candidates)

以下來源屬於歷史遺留或與權威來源高度重疊，  
後續重構應逐步停用，**嚴禁 `narrativeFacade` 直接讀取**：

- `js/calc/consultationScriptEngine.js` 中的 `PALACE_CONTEXTS`
- `worker/data/palace_consultation_dictionary.zh-TW.json`
- `worker/data/star_combinations.zh-TW.json`

---

## 4. 待重構之 Builder 標的

在 `narrativeFacade` 建立完成後，以下 Builder 必須改為透過 Facade 讀取資料：

1. `buildPalaceStarNarrativeBlock`
2. `buildStarNarrativeForPalace`
3. `buildMingGongTransformNarrative`
4. `buildPalaceTransformNarrative`
5. `buildSihuaFlowSummary`

---

## 5. narrativeFacade 建議介面設計

本層原則：**只整合敘事資料**；不做命理計算、不碰 chart normalization、不推導四化／飛化；只回傳結構化語意 block。

### 5.1 型別設計

```ts
export type SemanticSource =
  | "PALACE_SEMANTIC_DICTIONARY"
  | "palaceContexts"
  | "palaceThemes"
  | "decadalPalaceThemes"
  | "STAR_SEMANTIC_DICTIONARY"
  | "starBaseCore"
  | "starBaseMeaning"
  | "starPalacesMain"
  | "starPalacesAux"
  | "starPalacesAuxAction"
  | "starPalacesAuxRisk"
  | "starMetadata"
  | "mingGongTransformMatrix"
  | "STAR_PALACE_TRANSFORM_MATRIX"
  | "transformIntoPalaceMeanings";

export interface SemanticMeta {
  source: SemanticSource | null;
  fallbackUsed: boolean;
  missing: boolean;
}
```

### 5.2 宮位語意 block

- **core**：宮位核心語義  
- **context**：敘事語境  
- **theme**：決策／主題性語句  
- **decadalTheme / decadalNarrative**：十年主題用，非單宮必用，但建議先留  

`PalaceSemanticBlock`：`palaceName`、`core`、`context`、`theme`、`decadalTheme?`、`decadalNarrative?`、`meta: { core, context, theme, decadal? }`（每欄位對應 `SemanticMeta`）。

### 5.3 星曜語意 block

- **core**：核心特質；**plain**：白話版；**themes**：關鍵主題詞；**risk / advice**：風險與建議  
- **meta.primary**：主要來源；**meta.fallbacks**：是否從 starBaseCore / starBaseMeaning 降級  

`StarSemanticBlock`：`starName`、`core`、`plain`、`themes`、`risk`、`advice`、`meta: { primary, fallbacks }`。

### 5.4 星曜在宮位語意 block

- **baseMeaning**：星曜本身基礎意義  
- **meaningInPalace**：星在此宮的主要語句  
- **actionAdvice**：多半來自 aux action  
- **riskLevel / riskText**：風險結構  

`StarInPalaceSemanticBlock`：`starName`、`palaceName`、`baseMeaning`、`meaningInPalace`、`actionAdvice`、`riskLevel`、`riskText`、`meta: { meaningInPalace, actionAdvice, risk }`。

### 5.5 四化語意 block

- **meaning**：這條四化敘事的主句  
- **tone**：若原始資料能拆出語氣可留；拆不出可先為 null  
- **advice**：若有建議語句可填  
- **palaceName**：命宮特化或一般宮位查詢都可用  

`TransformSemanticBlock`：`transform`、`starName`、`palaceName?`、`meaning`、`tone`、`advice`、`meta: { primary, fallbacks }`。

### 5.6 Facade 方法簽名

- `getPalaceSemantic(palaceName: string): PalaceSemanticBlock`
- `getStarSemantic(starName: string): StarSemanticBlock`
- `getStarInPalaceSemantic(starName: string, palaceName: string): StarInPalaceSemanticBlock`
- `getTransformSemantic(transform: "祿"|"權"|"科"|"忌", starName: string, palaceName?: string): TransformSemanticBlock`

### 5.7 讀取順序（實作須嚴格照此）

1. **getPalaceSemantic**：PALACE_SEMANTIC_DICTIONARY → palaceContexts → palaceThemes → decadalPalaceThemes（若有需要）。
2. **getStarSemantic**：STAR_SEMANTIC_DICTIONARY → starBaseCore → starBaseMeaning。
3. **getStarInPalaceSemantic**：starPalacesMain → starPalacesAux → starPalacesAuxAction → starPalacesAuxRisk → starMetadata（只做 risk 補充，不作主語意）。
4. **getTransformSemantic**：若 `palaceName === "命宮"` → mingGongTransformMatrix → STAR_PALACE_TRANSFORM_MATRIX → transformIntoPalaceMeanings；否則 → STAR_PALACE_TRANSFORM_MATRIX → transformIntoPalaceMeanings。

### 5.8 實作原則

- **必須遵守**：facade 只做資料整合與 fallback；不做命理算法；不呼叫 normalizeChart；不讀 chartJson 做推導；不生成 transforms / flows。
- **允許做**：lookup、fallback、field normalization、meta/source tracing。
