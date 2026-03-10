# 命書系統：星曜介紹／語義／宮位表現 資料來源盤點

目的：盤點 repo 內所有「星曜介紹、星曜語義、星曜在宮位中的表現」的資料來源、使用位置與資料結構，避免重複建設；並區分可直接重用、需 adapter、應淘汰三類。

---

## 1. 星曜語義字典

### 1.1 是否已有 starSemanticDictionary.ts 或等價檔案

**有。** 唯一檔案：`worker/src/lifebook/starSemanticDictionary.ts`。

### 1.2 是否已有 getStarSemanticPhrases(...)

**有。**

- `getStarSemantic(starName: string): StarSemantic | null` — 回傳完整語義物件。
- `getStarSemanticPhrases(starName: string): { coreForQuote: string; themesPhrase: string; name: string }` — 供「X 代表『…』」與主題列使用。
- `getStarThemesSentenceLead(starName: string): string` — 供「當涉及『themes』相關的事情時」替換。
- `getPalaceSemantic(palaceName: string): PalaceSemantic | null` — 宮位語義。
- `getTransformSemantic(transformKey: string): TransformSemantic | null` — 四化語義。

### 1.3 欄位有哪些

**星曜（StarSemantic）**

| 欄位   | 說明 |
|--------|------|
| `core` | 核心一句，如「領導、主導權與中心角色」 |
| `plain` | 人話一句，如「你在意自己是否有位置、有影響力…」 |
| `themes` | 主題陣列，如 ["領導", "權威", "決策", "位置感", "掌控感"] |
| `risk` | 風險句 |
| `advice` | 建議句 |

**宮位（PalaceSemantic）**

| 欄位   | 說明 |
|--------|------|
| `core` | 如「自我定位與人生方向」 |
| `plain` | 如「你是怎麼看待自己、怎麼活出自己的。」 |
| `short` | Flow 括號短版，如「自我定位與人生方向」 |

**四化（TransformSemantic）**：`label`、`core`、`plain`、`advice`。

### 1.4 目前哪些模組在用

| 模組 | 用途 |
|------|------|
| `lifeBookPrompts.ts` | `getPalaceSemantic`：s03 強弱宮評語前綴、主戰場敘事 |
| `narrativeToneEngine.ts` | `getPalaceSemantic`：mergeEvidenceVars 的 `palaceCore` |
| `patternPhraseLibraryRuleTypes.ts` | `getPalaceSemantic`：ruleType 模板的 `palaceCore` |
| `patternHitRenderer.ts` | `getStarSemanticPhrases`、`getPalaceSemantic`：evidence 替換、星×宮橋接句 fallback |
| `sihuaFlowEngine.ts` | `getPalaceSemantic`：flow 邊的 from/to 宮語義 |
| `dominantPalaceDetector.ts` | `getPalaceSemantic`：主戰場評語 |
| `engine/generateNarrative.ts` | `getStarSemanticPhrases`：敘事生成 |

**覆蓋星數**：`STAR_SEMANTIC_DICTIONARY` 僅 **14 顆**（紫微～破軍，含七殺、破軍），無輔星／雜曜。

---

## 2. 舊版星曜介紹文案來源

### 2.1 「太陰：沉澱的蓄水池…」「【此宮表現】…」來自哪裡

| 類型 | 來源檔案／欄位 | 說明 |
|------|----------------|------|
| **星曜通用解釋**（baseMeaning） | `worker/content/starBaseCore-zh-TW.json` | key 為 **camelCase 星 id**（ziWei, taiYin, tianTong…），僅 **14 主星**。例：`"taiYin": "沉澱的蓄水池與細膩的滋養，主導潛意識的直覺與情感。"` |
| **備援** | `content.stars[星名]`（content-zh-TW 的 `stars`） | key 為**中文星名**，命書組裝時若 `starBaseCore[starId]` 無則查此處，可支援 168 顆。 |
| **此宮表現**（meaningInPalace） | `starPalacesMain` → `starPalaces` → `starPalacesAux` | key 格式：`星名_宮名` 或 `星名_宮短名`（如 `天同_命宮`、`火星_財帛`）。見 `lifeBookPrompts.ts` buildPalaceContext（約 2207–2213 行）。 |
| **行動建議**（actionAdvice） | `content.starPalacesAuxAction?.[starPalaceKey]` | 同上 key 格式。 |

組裝流程：`buildPalaceContext()` 從 chart 取宮內星 id 列表，對每顆星查 `meaningInPalace`、`baseMeaning`、`actionAdvice`，產出 `ctx.stars[]`。

### 2.2 是否依亮度（廟旺利平陷）有不同文案

**否。**  
`starBaseCore`、`starPalacesMain`、`starPalacesAux` 皆**無**依亮度分 key 或分句。亮度來自 **chart**（`strengthByStar`／廟旺利平陷），僅與星名一起顯示（如「天同（廟）」），不替換文案內容。

### 2.3 是否依宮位不同有不同文案

**是。**  
「此宮表現」即 **星×宮**：同一顆星在不同宮位有不同條目（`星名_宮名`）。  
「星曜通用解釋」則一星一條，不依宮位。

---

## 3. 星系／三方家族文案

### 3.1 「太陰財庫系三方」「天同療癒系三方」來自哪裡

**單一來源**：`worker/content/starSanfangFamilies-zh-TW.json`。

結構：`starSanfangFamilies` 為 `Record<主星名, StarSanfangFamily>`。

**StarSanfangFamily 欄位**（見 `worker/src/lifebook/assembler.ts`）：

| 欄位 | 說明 |
|------|------|
| `familyLabel` | 如「太陰財庫系三方」「天同療癒系三方」 |
| `coreStars` | 該星系常見星名陣列 |
| `roleSummary` | 星系角色一句 |
| `mingPattern` | 命宮用 pattern |
| `caiPattern` | 財帛用 pattern |
| `guanPattern` | 官祿用 pattern |

取得方式：`getSanfangFamilyForPalace(palaceKey, chartJson, content)`（`worker/src/utils/starSanfangFamilies.ts`）依宮位主星從 `content.starSanfangFamilies` 取出對應 family。

### 3.2 使用於哪些章節

- **s10（財帛）、s08（官祿）**：`mainStarSystemBlock` 會組「【主星星系視角】你屬於「○○系三方」…」並寫入 `palaceOpeningBlock`（`lifeBookPrompts.ts` 約 2531–2561 行）。
- **s02（命宮）**：已**不再**輸出主星星系區塊（主星星系／星系重點已從 s02 移除，僅技術版 underlyingParams 對 s10/s08 仍可帶出）。

### 3.3 是否可作為命宮／各宮敘事素材

**可。**  
- `mingPattern`、`caiPattern`、`guanPattern` 已是敘事句，可直接當「星系脈絡」插入命宮／財帛／官祿。  
- 命宮目前改用 `mingGongStarMatrix` + `mingGongSanfangInsight`（命宮專用三方句），若希望與星系文案統一，可讓 `getMingGongSanfangInsight` 在無專用句時 fallback 到 `starSanfangFamilies[主星].mingPattern`。

---

## 4. 宮位星曜結構來源

### 4.1 palaceStarStructureBlock / palaceStarsOnlySnippet / mainStarsSummary / assistantStarsSummary / shaStarsSummary 的來源

| Placeholder | 來源 |
|-------------|------|
| **palaceStarsOnlySnippet** | `ctx.stars` 逐顆組：`星名（亮度） 生年四化` + `baseMeaning` + `【此宮表現】meaningInPalace` + `【行動建議】actionAdvice`，多星用 `---` 分隔。即「完整星曜詳解＋此宮表現」整段。 |
| **palaceStarStructureBlock**、**palaceStarDetailBlock**、**palacePureStarsBlock**、**pureStarListBlock** | 皆與 `palaceStarsOnlySnippet` **同源同值**（map 裡指向同一字串）。 |
| **mainStarsSummary** | 主星列表（`mainStars` slice(0,2) 或權重排序後），格式：`星名（亮度）… — 主線劇本（人格／行動／世界觀）`。 |
| **assistantStarsSummary** | 輔星列表 + 「— 修補／補強／加成」。 |
| **shaStarsSummary** | 煞星列表 + 「— 壓力／推動／事件加速器」。 |

資料源頭：`ctx.stars` 來自 `buildPalaceContext()`，其 `baseMeaning` / `meaningInPalace` 來自 2.1 的 content 查表。

### 4.2 目前是否仍在直接輸出給使用者

- **s02（命宮）**：**否**。s02 的 `structure_analysis` 已改為解盤式敘事，**未**使用 `palaceStarsOnlySnippet`、`palaceStarStructureBlock`、`mainStarsSummary` 等於主文；僅 `behavior_pattern`／`strategic_advice` 在**其他宮位**仍用 `mainStarsSummary`／`assistantStarsSummary`／`shaStarsSummary`（見 lifebookSection-zh-TW.json s01, s05–s14 的 behavior_pattern）。
- **技術版**：`buildTechDebugForPalace()` 會輸出「星曜詳解（星曜說明與此宮表現）」與【此宮表現】，等同 `palaceStarsOnlySnippet` 內容，供專家／除錯用。

### 4.3 是否適合拆成語義素材而不是整段輸出

**適合。**  
- `baseMeaning`／`meaningInPalace` 本身是「單星單宮」語義，可當作敘事引擎的**輸入**，由模板或 adapter 組成「主星定調」「優勢與慣性」等段落，而不是整段貼上。  
- 目前 s02 已示範：主星人格用 `mingGongStarMatrix`（opening/strength/tension/mature），輔煞用 `getMingGongAssistantNarrative` 整合一句，不再逐顆卡片展開。

---

## 5. 星曜×宮位／星曜×四化既有句

### 5.1 repo 內是否已有類似 matrix / mapping / template

**有，多處。**

| 檔案 | 內容 | 維度 |
|------|------|------|
| **starPalaceTransformMatrix.ts** | `STAR_PALACE_TRANSFORM_MATRIX` 陣列 + `findStarPalaceTransformMeaning(star, palace, transform)` | **星 × 宮 × 四化**（祿權科忌）→ 一句 meaning。約 30 條，涵蓋財帛／夫妻／福德／官祿／子女／田宅／遷移／父母／僕役等。 |
| **patternHitRenderer.ts** 內 | `STAR_PALACE_BRIDGE_TEMPLATES`（Record<string, string>） | **星 × 宮** 橋接句，key 如 `天同|命宮`。若無 key 則用 `getStarSemanticPhrases` + `getPalaceSemantic` 動態拼一句。 |
| **mingGongStarMatrix.ts** | `MING_GONG_STAR_MATRIX` + `getMingGongStarInsight(starName)` | **星**（僅命宮主星）× **四欄**（opening, strength, tension, mature）。14 主星。 |
| **mingGongTransformMatrix.ts** | `MING_GONG_TRANSFORM_MATRIX`（key: `星名|lu/quan/ke/ji`）+ `getMingGongTransformMeaning(starName, type)` | **星 × 四化**，**僅命宮**使用；四化飛入命宮或命宮主星本身四化時用。 |
| **mingGongSanfangMatrix.ts** | `MING_GONG_SANFANG_BY_STAR` + `getMingGongSanfangInsight(starName, seed)` | **星**（命宮主星）→ 命／財／官／遷 三方四正整合句，14 主星 + fallback。 |

### 5.2 與 mingGongStarMatrix / mingGongTransformMatrix 的重疊

- **語義層**：  
  - `starSemanticDictionary.ts` 的 `STAR_SEMANTIC_DICTIONARY` 與 `mingGongStarMatrix` 皆提供「主星人格」類句子，但**用途不同**：前者為「主題／引用句」（core、themes），後者為命宮專用「上場／優勢／失衡／成熟」四段，**重疊在概念，不重疊在句型**。  
  - 若未來要統一「主星一句 core」，可考慮讓命宮矩陣 fallback 到 `getStarSemantic(starName).core`，避免重複維護兩套「一句話形容這顆星」。

- **星×四化**：  
  - **starPalaceTransformMatrix**：全宮位、多宮多星，30 條；用於 **pattern hit 判讀**（四化慣性）。  
  - **mingGongTransformMatrix**：**僅命宮**、星+祿權科忌各一句；用於 **s02 命宮「四化如何觸發」**。  
  - 兩者**維度不同**（全宮 vs 命宮），命宮若同時命中兩邊，目前邏輯是命宮專用矩陣在 `getMingGongTransformNarrativeByPriority` 使用，pattern 端用 `findStarPalaceTransformMeaning`；**同一命宮四化事件**可能兩邊都可命中，實務上命宮 narrative 以 mingGong 為準即可。

- **星×宮橋接**：  
  - `STAR_PALACE_BRIDGE_TEMPLATES` 與 `mingGongSanfangInsight` 不同：前者是「星在該宮」的橋接句（用於 pattern 敘事），後者是「命宮主星＋三方四正」的整合句，**無直接重疊**。

---

## 6. 結論與分類

### 6.1 三類分類

| 分類 | 項目 | 說明 |
|------|------|------|
| **A. 可直接重用** | • `starSemanticDictionary.ts`（STAR_SEMANTIC_DICTIONARY、PALACE_SEMANTIC_DICTIONARY、getStarSemanticPhrases、getPalaceSemantic）<br>• `starSanfangFamilies-zh-TW.json`（mingPattern / caiPattern / guanPattern、roleSummary）<br>• `starPalaceTransformMatrix.ts`（全宮位四化判讀）<br>• `starBaseCore-zh-TW.json`、`starPalacesMain`／`starPalaces`／`starPalacesAux`（baseMeaning、meaningInPalace） | 已廣泛用於 pattern、flow、主戰場、命宮 fallback；語義穩定，可直接當作敘事與橋接的輸入。 |
| **B. 可重用但需 adapter** | • **palaceStarsOnlySnippet / ctx.stars 的 baseMeaning＋meaningInPalace**：適合當「語義素材」，由各宮敘事模板或 adapter 取用（例如：主星取第一顆的 baseMeaning 作短句、meaningInPalace 併入「此宮表現」一句），而非整段輸出。<br>• **mainStarsSummary / assistantStarsSummary / shaStarsSummary**：其他宮（s01, s05–s14）仍用於 behavior_pattern；若改為「解盤式」敘事，可改為「主星 1–2 顆名＋一句整合」的 adapter，避免長列表。<br>• **starSanfangFamilies 的 mingPattern**：命宮若希望與財帛／官祿一致使用「星系一句」，可為 `getMingGongSanfangInsight` 加 fallback 到 `starSanfangFamilies[主星].mingPattern`。 | 資料已有，但需一層邏輯或模板才能變成「解盤式」輸出，不直接整段貼。 |
| **C. 不適合重用，應淘汰或只留作 debug** | • **技術版「星曜詳解（星曜說明與此宮表現）」整段**：與 `palaceStarsOnlySnippet` 同源，適合僅在技術／專家版保留，一般讀者版不輸出。<br>• **舊版「宮位：命宮」「此宮表現」標題＋整段列表**：已禁止在模組一出現（lifeBookPrompts 驗收），不再當作命書主文來源。<br>• **依亮度分 key 的星曜文案**：目前不存在；若未來要建「廟旺／陷」不同句，建議與現有 baseMeaning／meaningInPalace **分開 key 或欄位**，避免替換掉現有唯一句。 | 僅供除錯或淘汰，不作為新敘事的 source of truth。 |

### 6.2 建議：命書系統的星曜解釋應保留幾層

建議保留 **三層**，由上而下：

1. **全盤／主戰場層**：主星語義（`starSemanticDictionary`）、宮位語義（`getPalaceSemantic`）、四化語義（`getTransformSemantic`）、星系標籤（`starSanfangFamilies`）。用於 s00、s03、主戰場、flow、pattern 判讀。
2. **宮位敘事層**：各宮「解盤式」一句或短段（主星定調、優勢與慣性、失衡、成熟）。命宮已用：`mingGongStarMatrix`、`mingGongTransformMatrix`、`mingGongSanfangMatrix`、`mingGongSentenceLibrary`；其他宮可沿用「主星 1–2 顆＋輔煞整合一句＋四化 fallback」。
3. **素材／查詢層**：`starBaseCore`、`starPalacesMain`／`starPalaces`／`starPalacesAux` 的 baseMeaning／meaningInPalace。不直接整段輸出，而是作為「可引用的一句」或 adapter 的輸入（例如：無專用矩陣時取 baseMeaning 或 meaningInPalace 第一句）。

### 6.3 哪一層作為 source of truth

- **星曜「一句核心」與「主題」**：以 **starSemanticDictionary.ts** 的 `STAR_SEMANTIC_DICTIONARY` 為 source of truth；命宮專用矩陣（mingGongStarMatrix）可視為命宮的**擴充**，不取代字典。
- **星在宮「此宮表現」長文案**：以 **starPalacesMain / starPalaces / starPalacesAux**（及 D1 copy_key）為 source of truth；命書僅在需要時「引用」或擷取一句，不重複建一套宮位長文。
- **命宮專用四段（上場／優勢／失衡／成熟）**：以 **mingGongStarMatrix** 為命宮的 source of truth；若未來其他宮要做同構矩陣，建議**宮位專用檔案**（如 caiGongStarMatrix）或共用矩陣加「宮位」維度，而不是再複製一份 14 星表。

### 6.4 哪些新檔案其實不需要再新增

- **不需要**：再建一套「14 主星 core 一句」的獨立 JSON（與 `STAR_SEMANTIC_DICTIONARY` 重複）。  
- **不需要**：全宮位通用的「星×宮×四化」大矩陣擴充到每宮每星（已有 starPalaceTransformMatrix 與各宮專用矩陣即可）。  
- **可選**：若希望「星曜介紹」與「命宮四段」用語一致，可讓 **mingGongStarMatrix** 在缺少某星時 fallback 到 `getStarSemantic(starName)` 的 core／plain 組一句，而不是新增一個「星曜介紹句庫」檔案。

---

## 附：檔案與函式速查

| 類型 | 路徑 | 主要匯出／用途 |
|------|------|----------------|
| 星曜／宮位語義 | `worker/src/lifebook/starSemanticDictionary.ts` | STAR_SEMANTIC_DICTIONARY, PALACE_SEMANTIC_DICTIONARY, getStarSemantic, getStarSemanticPhrases, getStarThemesSentenceLead, getPalaceSemantic, getTransformSemantic |
| 星曜通用句（14 主星） | `worker/content/starBaseCore-zh-TW.json` | camelCase 星 id → 一句 |
| 星在宮表現（主星） | `worker/content/starPalacesMain-zh-TW.json` | 星名_宮名 → 此宮表現 |
| 星在宮表現（輔煞雜） | `worker/content/starPalacesAux-zh-TW.json` | 同上 |
| 星系／三方 | `worker/content/starSanfangFamilies-zh-TW.json` | 主星名 → familyLabel, mingPattern, caiPattern, guanPattern, roleSummary |
| 星×宮×四化（全宮） | `worker/src/lifebook/starPalaceTransformMatrix.ts` | STAR_PALACE_TRANSFORM_MATRIX, findStarPalaceTransformMeaning |
| 命宮主星四段 | `worker/src/lifebook/mingGongStarMatrix.ts` | MING_GONG_STAR_MATRIX, getMingGongStarInsight |
| 命宮星×四化 | `worker/src/lifebook/mingGongTransformMatrix.ts` | MING_GONG_TRANSFORM_MATRIX, getMingGongTransformMeaning |
| 命宮三方四正 | `worker/src/lifebook/mingGongSanfangMatrix.ts` | MING_GONG_SANFANG_BY_STAR, getMingGongSanfangInsight |
| 命宮句庫 | `worker/src/lifebook/mingGongSentenceLibrary.ts` | MING_GONG_CORE, MING_GONG_IMBALANCE, getMingGongAssistantNarrative, pickMingGongCore, pickMingGongImbalance |
| **命宮 adapter** | `worker/src/lifebook/mingGongAdapters.ts` | buildMingGongStarNarrative（矩陣→語義→starBaseCore）, buildMingGongAssistantNarrative（輔煞短標籤＋句庫）, buildMingGongTransformNarrative（命宮四化矩陣→星×宮×四化） |
| 星×宮橋接 | `worker/src/lifebook/patternHitRenderer.ts` | STAR_PALACE_BRIDGE_TEMPLATES（內建）+ getStarSemanticPhrases / getPalaceSemantic fallback |
