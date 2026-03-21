# 命盤宮位資料層與組裝邏輯盤點（s04–s17 優化基礎）

目標：建立「命盤資料 → 宮位敘事」的統一結構，供後續 12 宮優化使用。  
限制：不改動現有 API、不重寫引擎，僅做資料層與語義層整理。

---

## 1. 宮位資料來源盤點

### 1.1 權威結構：NormalizedChart.palaces

`normalizeChart(chartJson)` 產出 `NormalizedChart`，其中 `palaces: PalaceStructure[]` 為 12 宮標準結構。每宮 `PalaceStructure` 含：

| 欄位 | 型別 | 來源 | 目前使用情況 |
|------|------|------|----------------|
| **palace** | string | 宮名（命宮、兄弟宮…） | ✅ 全章節 |
| **mainStars** | StarInPalace[] | chartJson.ziwei.starByPalace / mainStars / palaces[].majorStars+minorStars+adjectiveStars → 依 STAR_ID 分類為「主星」 | ✅ 主星定調、leadMainStar、星組敘事 |
| **assistantStars** | StarInPalace[] | 同上，分類為輔星（文昌、文曲、左輔、右弼、祿存、天魁、天鉞、天馬、天姚、咸池） | ✅ 輔星修飾、S18/S19 星名 |
| **shaStars** | StarInPalace[] | 同上，分類為煞星（擎羊、陀羅、火星、鈴星、地空、地劫、天刑、天傷） | ✅ 煞星提醒、壓力敘事 |
| **miscStars** | StarInPalace[] | 其餘皆為雜曜 | ⚠️ 部分用於「現象」、多數僅列名 |
| **leadMainStar** | string? | 由 leadMainStarResolver(mainStars) 推得：1 顆即 lead，2 顆即 lead + coLead | ✅ 命宮／宮位主調 |
| **coLeadMainStars** | string[]? | 同上 | ✅ 雙主星敘事 |
| **natalTransformsIn** | TransformEdge[] | normalizeChart 由本命四化填入「飛入此宮」的邊 | ✅ 四化敘事、S18 計分 |
| **natalTransformsOut** | TransformEdge[] | 飛出此宮的邊 | ✅ 同左 |
| **decadalTransformsIn/Out** | TransformEdge[] | 大限四化 | ✅ 模組二、S18 |
| **yearlyTransformsIn/Out** | TransformEdge[] | 流年四化 | ✅ 模組二、S18/S19 |

### 1.2 StarInPalace 明細

| 欄位 | 型別 | 來源 | 目前使用情況 |
|------|------|------|----------------|
| **name** | string | 星曜中文名 | ✅ 必用 |
| **brightness** | 廟\|旺\|利\|平\|陷\|不? | 理論上來自 iztro palaces[].stars[].brightness | ⚠️ **目前未從 chartJson 注入**：buildPalaces() 只取星名，未讀 per-star brightness；brightnessNarrative 可接受參數但需呼叫方自行帶入 |
| **natalTransform** | 祿\|權\|科\|忌? | 理論上來自生年四化對應 | ⚠️ **目前未從 chartJson 注入**：buildPalaces 未填；四化由 TransformEdge 層級表達 |
| **riskLevel** | number? | 可選 | ❌ 目前未使用 |

### 1.3 chartJson 實際讀取路徑

- **宮位→星列表**：`chartJson.ziwei.starByPalace` 或 `chartJson.ziwei.mainStars`（宮名/ID → 星名陣列）或 `chartJson.ziwei.palaces[]`（依序對應 12 宮，每宮 `majorStars/minorStars/adjectiveStars[].name`）。
- **本命四化**：由 `palaceStemMap` + `starsByPalace` 經 `buildGongGanFlows` → `gongGanFlowsToTransformEdges` 產出，再 `assignEdgesToPalaces` 填入各宮的 natalTransformsIn/Out。
- **大限／流年四化**：來自 `chartJson.decadalLimits`、`chartJson.yearlyHoroscope`，同上填入 decadal/yearly TransformsIn/Out。

### 1.4 三方四正（relatedPalaces）

| 概念 | 來源 | 目前使用情況 |
|------|------|----------------|
| 命宮三方四正 | 命宮 + 財帛 + 官祿 + 遷移（固定） | rhythmEngineV2、starGroupNarrative、mingGongSanfangMatrix、dominantPalaceDetector「三方核心」 |
| 任意宮三方四正 | bodyPalaceAlignment.sanfangSizhengSet(mingPalace)、tensionEngine 同主線分組 | 身宮對齊、主線標籤 |
| 財／官／命 星系 | getSanfangFamilyForPalace（starSanfangFamilies / palaceAdapters）→ caiPattern、guanPattern、roleSummary、familyLabel | 宮位洞察、s02 等 |
| 軸線語義 | crossChart axisLookup（PalaceAxisLinkRow：palaces / fromPalace+toPalace → axis） | spillover 敘事 |

**小結**：主星／輔星／煞星／雜曜、本命／大限／流年四化入出、leadMainStar 均有使用；**brightness、StarInPalace.natalTransform 型別存在但當前 pipeline 未從 chart 注入**；三方四正以「命財官遷」與星系/軸線兩種方式使用。

---

## 2. 星曜語義表（semantics mapping）

原則：**同一顆星語義一致，不隨宮位改變**，供 S17/S18/S19 與宮位敘事共用。

### 2.1 主星（14 顆）

| 星名 | 核心語義（core） | 主題詞（themes） | 出處 |
|------|------------------|------------------|------|
| 紫微 | 領導、主導權與中心角色 | 領導、權威、決策、位置感、掌控感 | STAR_SEMANTIC_DICTIONARY |
| 天機 | 思考、策略、變化與判斷 | 思考、判斷、策略、規劃、變化 | 同上 |
| 太陽 | 行動、表現、責任與外在成就 | 責任、表現、成就、外在形象、付出 | 同上 |
| 武曲 | 資源管理、成果、金錢與現實回報 | 金錢、資源、成果、效率、責任分配 | 同上 |
| 天同 | 情緒、安全感與舒適節奏 | 情緒、安全感、舒服、人際溫度、生活節奏 | 同上 |
| 廉貞 | 慾望、權力、界線與突破 | 慾望、界線、權力、吸引力、突破 | 同上 |
| 天府 | 穩定、承接、累積與資源保存 | 穩定、累積、保存、承接、長期配置 | 同上 |
| 太陰 | 感受、內在需求、情感與細膩觀察 | 情感、內在需求、安全需求、關係感受、細膩 | 同上 |
| 貪狼 | 機會、慾望、社交與擴張 | 機會、社交、慾望、擴張、吸引 | 同上 |
| 巨門 | 觀點、溝通、辯證與理解真相 | 溝通、辯論、資訊、觀點、真相 | 同上 |
| 天相 | 平衡、秩序、協調與制度感 | 平衡、協調、秩序、制度、公平 | 同上 |
| 天梁 | 保護、價值感、道德判斷與承擔 | 保護、照顧、價值感、道德、承擔 | 同上 |
| 七殺 | 果斷、破局、壓力下的決斷與重建 | 決斷、破局、壓力處理、重建、果敢 | 同上 |
| 破軍 | 變革、拆解、重新開始與推翻舊框架 | 變革、重來、更新、拆解、新局 | 同上 |

**短標（S18/敘事用）**：starShortLabels — 例：武曲→資源／執行／回報，天相→協調／平衡／規則，天機→變動／判斷／調整。

### 2.2 輔星

| 星名 | 語義／短標 | 出處 |
|------|------------|------|
| 文昌 | 邏輯／規則／結構；溝通、規則與邏輯 | starShortLabels；eventSignals STAR_TRAIT；mingGongAdapters 文采 |
| 文曲 | 表達／感受／細節；表達、感受與細節 | 同上 |
| 左輔 | 支持／分工／穩定合作；輔助 | starShortLabels；mingGongAdapters |
| 右弼 | 協作／互動／人際配合；輔助 | 同上 |
| 祿存 | 存祿 | mingGongAdapters |
| 天馬 | 變動 | mingGongAdapters；eventSignals 可擴 |
| 天魁、天鉞 | 貴人 | mingGongAdapters |
| 天姚、咸池 | （可歸類為桃花/人際） | 目前多為列名，語義可統一補 |

### 2.3 煞星

| 星名 | 語義／短標 | 出處 |
|------|------------|------|
| 擎羊 | 推動 | mingGongAdapters SHA_STAR_SHORT_LABELS |
| 陀羅 | 拖延 | 同上 |
| 火星 | 爆發 | 同上 |
| 鈴星 | 焦慮 | 同上 |
| 地空 | 變動 | 同上 |
| 地劫 | 波動 | 同上 |
| 天刑 | 壓力／規範（建議統一） | 分類在 normalizePalaces 煞星；語義可與 壓力/規範 對齊 |
| 天傷 | （多為列名） | 同上 |

### 2.4 雜曜 → 現象（建議統一）

| 星名 | 建議語義 | 備註 |
|------|----------|------|
| 旬空 | 空感、不落實、易落空 | 可作為「現象」phenomena 使用 |
| 截路 | 阻斷、中途卡關 | 同上 |
| 孤辰 | 獨處、孤單感、少援 | 同上 |
| 天馬 | 變動、移動、驛動 | 已列輔星，可兼作現象 |
| 天刑 | 壓力、規範、紀律 | 已列煞星，語義一致 |
| 其餘雜曜 | 依 content/starPalacesAux 或後續擴充 | 目前多為列名 |

**實作建議**：在 starSemanticDictionary 或獨立 starPhenomenonMap 中擴充「主星 + 輔星 + 煞星 + 常用雜曜」的單一語義表，S17/S18/S19 與宮位組裝皆由此查表，不隨宮位改寫語義。

---

## 3. 宮位組裝邏輯

### 3.1 主星如何定調（最多 2 顆）

- **leadMainStarResolver(mainStars)**：0 顆 → mode "none"；1 顆 → leadMainStar，mode "single"；2 顆及以上 → 第一顆為 leadMainStar，其餘為 coLeadMainStars，mode "dual"。
- **定調來源**：命宮用 mingGongStarMatrix（opening/strength/tension/mature）→ getStarSemantic → 通用 core/themes；他宮用 getStarSemantic + 宮位語境（getPalaceSemantic）。
- **亮度**：brightnessNarrative(starName, brightness) 產出一句（廟／旺／利／平／陷），**目前 brightness 多需由呼叫方傳入**，chart 端未注入時可省略或 fallback 中性。

### 3.2 輔星如何修飾

- 命宮：mingGongAdapters ASSISTANT_STAR_SHORT_LABELS → 整合為輔星短句。
- 通用：starNarrativeForPalace 將輔星視為「1～2 句」內容，若有 meaningInPalace（content）則取前 1～2 句，否則 baseMeaning + 宮位 context。
- S18/S19：STAR_TRAIT（文昌、文曲、左輔、右弼等）用於 flow 語義與場景詞。

### 3.3 雜曜如何轉為「現象」

- **現狀**：多數雜曜僅列名；部分經 content（starPalacesAux 等）提供 meaningInPalace。
- **建議規則**：雜曜名稱 → 現象關鍵詞（如旬空→空感、截路→阻斷、孤辰→獨處），填入 **phenomena[]**，供敘事模板使用「容易出現…」「需留意…」等句。

### 3.4 廟旺陷如何影響語氣

- **brightnessNarrative**：廟→成熟、得位；旺→明顯、活躍；利→可發揮需練習；平→中性、靠整合；陷→敏感、易失衡。
- **語氣**：廟旺偏「強／穩定」，利平偏「中性／可塑」，陷偏「弱／偏差／需修正」。若無 brightness 則不輸出亮度句或使用中性敘事。

### 3.5 如何生成四類輸出

| 輸出類型 | 目前來源 | 建議規則 |
|----------|----------|----------|
| **核心結構（summary）** | 主星 core + 宮位 core；S18 pattern.summary | 主星（最多 2 顆）core/themes + 宮位 short/core → 一句總括 |
| **決策行為（behavior）** | 各章節 prompt / 星組敘事 | 主星 advice + 輔星修飾 + 四化（權/科）傾向 |
| **運作機制（mechanism）** | 四化 in/out、三方四正、節奏 | 本宮四化進出 + 三方四正/軸線 + 亮度 → 「如何被牽動、如何運作」 |
| **盲點（pitfalls）** | findingsSelectors blindSpotLine、星 risk、煞星提醒 | risk 句 + 煞星挑戰句 + 壓力宮/忌疊提醒 |

上述可收斂為：由 **PalaceNarrativeInput**（coreThemes, modifiers, phenomena, tone）驅動模板，產出 summary / behavior / mechanism / pitfalls 四塊。

---

## 4. 統一中間結構（PalaceNarrativeInput）

以下型別作為「命盤資料 → 宮位敘事」的統一輸入，供後續 12 宮寫作模板與 S17/S18/S19 共用。

```ts
/** 宮位敘事語調：正面 / 中性 / 風險偏多 */
export type PalaceNarrativeTone = "positive" | "neutral" | "risk";

/**
 * 單一宮位的敘事輸入（資料層 → 寫作模板）。
 * 由主星定調、輔星修飾、雜曜現象、廟旺陷與四化綜合成。
 */
export interface PalaceNarrativeInput {
  /** 宮位名稱（canonical，如 命宮、財帛宮） */
  palace: string;
  /** 核心主題（來自主星 core/themes，最多 2 顆主星，1～3 條） */
  coreThemes: string[];
  /** 修飾語（輔星、亮度、本命四化對該宮的影響） */
  modifiers: string[];
  /** 現象關鍵詞（雜曜、煞星轉成的現象：變動、空感、卡關、壓力、獨處等） */
  phenomena: string[];
  /** 語調：正面 / 中性 / 風險 */
  tone: PalaceNarrativeTone;
  /** 可選：主星名（leadMainStar），用於模板指名 */
  leadMainStar?: string;
  /** 可選：共主星（第二顆主星） */
  coLeadMainStars?: string[];
  /** 可選：三方四正相關宮位或軸線描述，用於「與他宮牽動」 */
  relatedPalacesNote?: string;
}
```

### 4.1 與現有資料的對應

| PalaceNarrativeInput 欄位 | 建議來源 |
|---------------------------|----------|
| palace | PalaceStructure.palace |
| coreThemes | leadMainStar + coLeadMainStars → getStarSemantic(star).core / themes（前 2～3 條） |
| modifiers | 輔星短標（文昌→邏輯/規則…）+ brightness 一句 + 本宮四化入/出簡述 |
| phenomena | 煞星短標（擎羊→推動…）+ 雜曜現象表（旬空→空感、截路→阻斷、孤辰→獨處、天刑→壓力/規範） |
| tone | 依四化（忌多→risk）、亮度（陷→risk）、煞星多→risk；祿科多→positive；其餘 neutral |
| leadMainStar / coLeadMainStars | leadMainStarResolver(mainStars) |
| relatedPalacesNote | getSanfangFamilyForPalace 的 roleSummary / caiPattern / guanPattern，或 axis 描述 |

### 4.2 使用方式

- **寫作模板**：以 `PalaceNarrativeInput` 為唯一輸入，產出 summary、behavior、mechanism、pitfalls 四段。
- **S17/S18/S19**：由同一語義表與 phenomena 關鍵詞對齊「星曜→語義」與「現象→敘事」，避免同一星在不同章節語義不一致。

---

## 附錄：相關檔案索引

| 用途 | 檔案 |
|------|------|
| 宮位標準結構 | worker/src/lifebook/normalizedChart.ts |
| 宮位建構 | worker/src/lifebook/normalize/normalizePalaces.ts |
| 主星定調 | worker/src/lifebook/engines/palaceInference/leadMainStarResolver.ts |
| 星曜語義 | worker/src/lifebook/starSemanticDictionary.ts |
| 星曜短標 | worker/src/lifebook/s18/starShortLabels.ts；worker/src/lifebook/s18/eventSignals.ts（STAR_TRAIT） |
| 輔星/煞星短標 | worker/src/lifebook/mingGongAdapters.ts |
| 亮度敘事 | worker/src/lifebook/brightnessNarrative.ts |
| 宮位星曜敘事 | worker/src/lifebook/starNarrativeForPalace.ts |
| 命宮主星敘事 | worker/src/lifebook/mingGongAdapters.ts；mingGongStarMatrix |
| 三方四正 | worker/src/lifebook/bodyPalaceAlignment.ts；worker/src/lifebook/palaceAdapters.ts；worker/src/lifebook/engines/crossChart/axisLookup.ts |
| 章節資料依賴 | worker/src/lifebook/sectionDataDependencyMap.ts |
| 宮位 findings 組裝 | worker/src/lifebook/findings/buildPalaceFindings.ts |
