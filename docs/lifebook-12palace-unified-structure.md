# 命宮（s02）修改套用到 12 宮：分析與套用說明

## 一、命宮目前結構 vs 其餘 11 宮

### 1.1 命宮（s02）現有結構（解盤式）

| 區塊 | 標題 | Placeholder | 資料來源（命宮專用） |
|------|------|-------------|----------------------|
| 1 | 【你是帶著什麼狀態上場】 | mingGongStarOpening, palaceCoreDefinition | buildMingGongStarNarrative( opening ), pickMingGongCore |
| 2 | 【主星定調】 | mainStarsLeadBlock, mainStarsBrightnessNarrative, mingGongStarStrength | 主星 1–2 句、buildBrightnessNarrative、buildMingGongStarNarrative( strength ) |
| 3 | 【優勢與慣性】 | assistantStarsNarrative | buildMingGongAssistantNarrative（輔煞短標籤＋句庫） |
| 4 | 【三方四正如何牽動】 | mingGongSanfangInsight | getMingGongSanfangInsight（矩陣 → starSanfangFamilies.mingPattern → fallback） |
| 5 | 【四化如何觸發】 | mingGongTransformNarrative, sihuaNarrativeBlock | buildMingGongTransformNarrative（命宮四化矩陣 → starPalaceTransformMatrix） |
| 6 | 【最容易失衡】 | mingGongStarTension | buildMingGongStarNarrative( tension ) |
| 7 | 【成熟後如何運用】 | mingGongStarMature | buildMingGongStarNarrative( mature ) |

### 1.2 其餘 11 宮（s01, s05–s14）修改前

- 【上場方式】palaceOpeningBlock  
- 【主星定調】mainStarsLeadBlock、mingGongStarNarrative（空）  
- 【優勢與慣性】assistantStarsNarrative  
- 【三方四正與四化牽動】sanFangSiZhengPalaces、mingGongSanfangInsight（空）、mingGongTransformNarrative（空）、sihuaNarrativeBlock  
- 【最容易失衡的方式】palaceRiskSummary  
- 【成熟後如何運用】palaceActionAdvice  

缺：亮度敘事、與命宮一致的區塊標題與順序。

---

## 二、套用策略：結構統一、placeholder 可逐宮補資料

### 2.1 原則

1. **12 宮共用同一「區塊標題 + 順序」**，讀感一致，之後一宮一宮補內容即可。  
2. **Placeholder 命名統一**：命宮專用（mingGong*）保留；其餘 11 宮用「共用 placeholder」，沒資料時為空。  
3. **亮度敘事**：mainStarsBrightnessNarrative 改為**所有宮位**都填（依該宮第一主星＋廟旺利平陷），不只 s02。  
4. **不新增 11 宮專用句庫**：先套結構與共用邏輯，之後你再逐宮補「主星定調／三方／四化／失衡／成熟」等句庫或 adapter。

### 2.2 統一後的 7 段結構（與命宮對齊）

| # | 區塊標題 | 命宮（s02） | 其餘 11 宮（s01, s05–s14） |
|---|----------|-------------|----------------------------|
| 1 | 【上場方式】 | （命宮用「你是帶著什麼狀態上場」保留） | palaceOpeningBlock |
| 2 | 【主星定調】 | mainStarsLeadBlock + mainStarsBrightnessNarrative + mingGongStarStrength | mainStarsLeadBlock + mainStarsBrightnessNarrative + mingGongStarNarrative（先空，後續可補各宮主星句） |
| 3 | 【優勢與慣性】 | assistantStarsNarrative | assistantStarsNarrative |
| 4 | 【三方四正如何牽動】 | mingGongSanfangInsight | sanFangSiZhengPalaces + mingGongSanfangInsight（後者先空，可逐宮補） |
| 5 | 【四化如何觸發】 | mingGongTransformNarrative + sihuaNarrativeBlock | mingGongTransformNarrative + sihuaNarrativeBlock（前者先空，可逐宮補） |
| 6 | 【最容易失衡】 | mingGongStarTension | palaceRiskSummary |
| 7 | 【成熟後如何運用】 | mingGongStarMature | palaceActionAdvice |

### 2.3 已套用修改（實作層）

- **lifebookSection-zh-TW.json**  
  - s01, s05–s14 的 `structure_analysis` 改為與命宮**同一 7 段結構與標題**，並在【主星定調】中插入 `mainStarsBrightnessNarrative`。  
  - 標題統一為：  
    【上場方式】／【主星定調】／【優勢與慣性】／【三方四正如何牽動】／【四化如何觸發】／【最容易失衡】／【成熟後如何運用】  
  - s02 維持現有「你是帶著什麼狀態上場」與命宮專用 placeholder，不改。

- **lifeBookPrompts.ts**  
  - 所有宮位（isPalaceSection）都填 **mainStarsBrightnessNarrative**：  
    `buildBrightnessNarrative(mainStars[0]?.name, mainStars[0]?.strength, seed)`  
  - 其餘 11 宮的 mingGongStarNarrative、mingGongSanfangInsight、mingGongTransformNarrative 維持目前邏輯（空或既有），之後可依宮位鍵補資料。

---

## 三、之後「一宮一宮補充資料」可做的事

每宮可視需要補齊（建議順序）：

1. **主星定調一句**（對應 mingGongStarNarrative）  
   - 可做：各宮「主星在此宮的定調句」句庫或 adapter（如 caiGongStarTone、guanGongStarTone），或共用 buildPalaceStarNarrative(starName, "strength", palaceKey)。

2. **三方四正如何牽動**（對應 mingGongSanfangInsight）  
   - 命宮已有 mingGongSanfangMatrix + starSanfangFamilies.mingPattern。  
   - 他宮可做：各宮「命／財／官／遷」或該宮三方四正一句（例如財帛宮用 starSanfangFamilies.caiPattern 或新矩陣）。

3. **四化如何觸發**（對應 mingGongTransformNarrative）  
   - 命宮已有 buildMingGongTransformNarrative。  
   - 他宮可做：依宮位呼叫 findStarPalaceTransformMeaning(star, 該宮名, type)，或各宮專用四化句庫。

4. **最容易失衡 / 成熟後如何運用**  
   - 命宮用 mingGongStarTension / mingGongStarMature。  
   - 他宮目前用 palaceRiskSummary / palaceActionAdvice；之後可加各宮「失衡／成熟」句庫或 adapter，再對接到同一 placeholder。

5. **上場方式**（可選）  
   - 命宮用 mingGongStarOpening + palaceCoreDefinition。  
   - 他宮目前用 palaceOpeningBlock；若要更解盤式，可做各宮「上場方式」一句（宮位核心＋主星在此宮的 opening）。

---

## 四、Placeholder 對照總表（套用後）

| Placeholder | s02（命宮） | s01, s05–s14（他宮） |
|-------------|-------------|----------------------|
| 上場 | mingGongStarOpening, palaceCoreDefinition | palaceOpeningBlock（內含 palaceCoreDefinition + mainStarSystemBlock） |
| 主星定調 | mainStarsLeadBlock, mainStarsBrightnessNarrative, mingGongStarStrength | mainStarsLeadBlock, mainStarsBrightnessNarrative, mingGongStarNarrative（目前空） |
| 優勢與慣性 | assistantStarsNarrative | assistantStarsNarrative |
| 三方四正 | mingGongSanfangInsight | sanFangSiZhengPalaces, mingGongSanfangInsight（目前空） |
| 四化 | mingGongTransformNarrative, sihuaNarrativeBlock | mingGongTransformNarrative（目前空）, sihuaNarrativeBlock |
| 失衡 | mingGongStarTension | palaceRiskSummary |
| 成熟 | mingGongStarMature | palaceActionAdvice |

套用完成後，你只要在引擎裡依 `sectionKey` 或宮位鍵填入上述「他宮」欄的內容，即可一宮一宮補齊，不需再改模板結構。
