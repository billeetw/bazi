# s04（命主・身主・身宮）程式碼與模板檢查清單

供重寫 s04 前對齊：拿掉命宮、補足命主／身主／身宮星曜。

---

## 一、章節定義（lifeBookTemplates.ts）

| 欄位 | 目前設定 |
|------|----------|
| **section_key** | `s04` |
| **index** | 9 |
| **title** | 「你為這具身體準備了什麼？（命主・身主・身宮）」 |
| **description** | 「顯意識與潛意識、身宮轉向、中年後內在驅動。」 |
| **slice_types** | `["ziwei", "overlap", "sihua"]` |
| **palace_focus** | `["命宮", "福德"]` ← **命宮來源：會讓 s04 用命宮做宮位 context** |

**要改：** 若 s04 不再用「命宮」資料，需讓 s04 不綁宮位（見下方「宮位邏輯」）。

---

## 二、宮位邏輯（命宮如何被用進 s04）

### 2.1 getPalaceKeyForSection（lifeBookPrompts.ts 約 1647–1653 行）

- `palace_focus` 有值時取**第一個**：s04 → `"命宮"`。
- 若 `palace_focus` 為空，且 section 在 `["s00","s02","s03","s04",…]` 裡，**預設也是「命宮」**（1651 行）。

因此目前 **s04 一定會用命宮** 當 `palaceKey`，進而：

- `buildPalaceContext(s04, …)` 會用 **命宮** 的星曜、迴路、高壓組出 `ctx`。
- `getPlaceholderMapFromContext` 會填 `palace`, `palaceStarDetailBlock`, `sihuaFlowForPalace`, `loopSnippet`, `hpSnippet` 等，全部是**命宮**的資料。

**要拿掉命宮：**

- 做法 A：s04 的 `palace_focus` 改為 `undefined` 或 `[]`，並在 `getPalaceKeyForSection` 裡**把 s04 從「預設命宮」名單移除**，讓 s04 回傳 `undefined`，這樣 `buildPalaceContext(s04, …)` 會回傳 `null`，s04 就不會再帶任何宮位 block。
- 做法 B：在 `getPalaceKeyForSection` 中對 `sectionKey === "s04"` 直接回傳 `undefined`（不綁宮位）。

### 2.2 getSectionTechnicalBlocks（lifeBookPrompts.ts）

- 會呼叫 `buildPalaceContext(sectionKey, …)` → 對 s04 目前得到命宮的 context。
- 再呼叫 `getPlaceholderMapFromContext(ctx, { sectionKey, chartJson, content, config, contentLocale })`。
- 骨架用 `resolveSkeletonPlaceholders(sectionSkeleton.*, placeholderMap, …)` 解析。

**目前 s04 骨架沒有用任何 `{placeholder}`**，所以即使用命宮的 map，輸出不變；但技術版底層參數區塊（`underlyingParamsText`）仍會印出**命宮**的星曜／四化／迴路／高壓（因為 `ctx` 是命宮）。要拿掉命宮，就必須讓 s04 的 `ctx === null`（見上）。

---

## 三、s04 骨架（lifebookSection-zh-TW.json）

**路徑：** `worker/content/lifebookSection-zh-TW.json` → `s04`

```json
"s04": {
  "structure_analysis": "本章聚焦你的『個體運轉核心』：命主、身主、身宮三者的交會。\n命主：你的原生動力來源。\n身主：你後天主要的行動模式。\n身宮：你的生命體驗場景偏向。\n這三者共同決定你『如何使用自己』。",
  "behavior_pattern": "命主提供你最初的動力與渴望。\n身主決定你真正落地的行動方式。\n身宮決定你在哪些場景特別敏感。",
  "blind_spots": "若三者分裂，會出現『想法一套、行動一套、感受又另一套』的斷裂感。",
  "strategic_advice": "讓三者協同：動力（命主）× 行動（身主）× 體驗（身宮）。"
}
```

- **沒有使用任何 `{placeholder}`**，全是固定文案。
- 命主／身主／身宮的「星曜名稱與說明」沒有從資料灌進去，只出現在 GPT 的 notes 裡（見下）。

---

## 四、命主／身主／身宮的資料來源與注入方式

### 4.1 資料從哪裡來（index.ts）

- **命主／身主星名：** `getMasterStarsFromZiwei(chart.ziwei)`  
  - 讀 `ziwei.basic.masterStar` / `ziwei.core.命主` → 命主  
  - 讀 `ziwei.basic.bodyStar` / `ziwei.core.身主` → 身主  
  - 正規化為繁體星名（如給 content 用）。
- **命主／身主說明：** `getMasterStarsWithDefs(masterStars, content.stars, { lifeLordDecode, bodyLordDecode })`  
  - 優先：`content.lifeLordDecode[命主星名]`、`content.bodyLordDecode[身主星名]`  
  - 沒有再用 `content.stars[星名]`。
- **身宮（依生時）：** `getBodyPalaceInfo(chart, content.bodyPalaceByHour)`  
  - 依命盤時辰組（子午、卯酉、寅申…）對 `bodyPalaceByHour` 取 `{ palace, tagline, interpretation }`。
- **命身關係片段：** `getLifeBodyRelationSnippet(bodyPalaceInfo, content.lifeBodyRelation, masterStarsWithDefs)`  
  - 命身同宮 → `lifeBodySamePalace`  
  - 命身錯位 → `lifeBodyPivot`  
  - 命主與身主內外對話 → `lifeLordBodyLordDialogue`  
  - 組出字串陣列 `lifeBodyRelationSnippet`。

以上在 **generate-section / generate** 時都會算好，放進 `sectionConfigWithStarPalaces` / 全書 config：

- `masterStars: { 命主?: { name, text }, 身主?: { name, text } }`
- `bodyPalaceInfo: { palace, tagline, interpretation }`
- `lifeBodyRelationSnippet: string[]`

### 4.2 目前如何給 GPT 用（未進骨架）

- **lifeBookPrompts.ts（約 2355–2363 行）**  
  - 若 `config.masterStars` 有 命主/身主，會把「命主（星名）：說明」「身主（星名）：說明」推入 **notes**。  
  - 若 `sectionKey === "s04"` 且 `config.lifeBodyRelationSnippet.length > 0`，會把「命身・身宮」整段推入 **notes**。  
- 因此：**命主／身主／身宮內容只出現在 GPT 的 notes，沒有變成 s04 的 placeholder，技術版與解析骨架也看不到。**

---

## 五、Content 檔案（命主・身主・身宮星曜文案）

### 5.1 lifeLord-bodyLord-zh-TW.json

- **lifeLordDecode**：命主星名 → 一句靈魂解讀（例：貪狼、巨門、祿存、文曲、廉貞、武曲、破軍）。
- **bodyLordDecode**：身主星名 → 一句工具箱解讀（例：火星、天相、天梁、天同、文昌、天機）。
- **bodyPalaceByHour**：時辰組 key（子午、卯酉、寅申、辰戌、巳亥、丑未）→ `{ palace, tagline, interpretation }`（身宮宮位、標語、解讀）。

### 5.2 lifeBodyRelation-zh-TW.json

- **lifeBodySamePalace**：命身同宮時的 `tagline`、`interpretation`、`strategy_tone`。
- **lifeBodyPivot**：命身錯位時的說明與戰略語氣。
- **lifeLordBodyLordDialogue**：命主與身主內外對話的說明與戰略語氣。

`getLifeBodyRelationSnippet` 會依「是否同宮」「是否有命主／身主」組出 1～3 段文字，放進 `config.lifeBodyRelationSnippet`。

---

## 六、重寫 s04 時建議的程式改動

1. **拿掉 s04 的命宮**
   - **lifeBookTemplates.ts**：s04 的 `palace_focus` 改為 `undefined` 或 `[]`。
   - **lifeBookPrompts.ts**：`getPalaceKeyForSection` 中，讓 `sectionKey === "s04"` 時回傳 `undefined`（或從「預設命宮」名單移除 s04），使 `buildPalaceContext(s04, …)` 為 `null`。  
   - 結果：s04 技術版不再有命宮星曜／四化／迴路／高壓 block；placeholder 也不再帶命宮資料。

2. **為 s04 專用 placeholder 灌入命主／身主／身宮**
   - 在 **getPlaceholderMapFromContext** 中，當 `opts?.sectionKey === "s04"` 且 `opts?.config` 存在時：
     - 從 `config.masterStars` 填：`lifeLordName`, `lifeLordText`, `bodyLordName`, `bodyLordText`（或你定的 key）。
     - 從 `config.bodyPalaceInfo` 填：`bodyPalaceName`, `bodyPalaceTagline`, `bodyPalaceInterpretation`。
     - 從 `config.lifeBodyRelationSnippet` 組一段或數段文字填進 `lifeBodyRelationBlock`（或拆成同宮／錯位／內外對話三個 key）。
   - 若沒有資料，可填空字串或 `"[此處資料缺失，可略過]"`。

3. **s04 骨架改版（lifebookSection-zh-TW.json）**
   - 將上述 placeholder 寫進 s04 的 `structure_analysis` / `behavior_pattern` / `blind_spots` / `strategic_advice`，例如：
     - 命主：`{lifeLordName}`、`{lifeLordText}`
     - 身主：`{bodyLordName}`、`{bodyLordText}`
     - 身宮：`{bodyPalaceName}`、`{bodyPalaceInterpretation}` 或 `{bodyPalaceTagline}`
     - 命身關係：`{lifeBodyRelationBlock}` 或分開的 `{lifeBodySameOrPivot}`、`{lifeLordBodyLordDialogue}` 等。
   - 這樣技術版與 GPT 潤飾都會直接看到命主／身主／身宮星曜與身宮解讀。

4. **技術版 s04 底層參數（可選）**
   - 當 `sectionKey === "s04"` 且 `ctx === null`，`getSectionTechnicalBlocks` 目前會用 `buildTechDebugForPalace(null, …)` 得到「本題無對應宮位」。若希望技術版仍有一段「命主・身主・身宮」的 raw 資料，可在同處加分支：改為組一段僅含 `config.masterStars`、`config.bodyPalaceInfo`、`config.lifeBodyRelationSnippet` 的文字（或結構化 block），不呼叫 `buildTechDebugForPalace`。

---

## 七、檔案對照表

| 用途 | 檔案路徑 |
|------|----------|
| 章節定義（含 palace_focus） | `worker/src/lifeBookTemplates.ts` |
| 宮位 key 對應、placeholder、技術 block | `worker/src/lifeBookPrompts.ts` |
| s04 四欄骨架 | `worker/content/lifebookSection-zh-TW.json` → `s04` |
| 命主／身主／身宮資料取得與組 snippet | `worker/src/index.ts`（getMasterStarsFromZiwei, getMasterStarsWithDefs, getBodyPalaceInfo, getLifeBodyRelationSnippet） |
| 命主／身主星曜解讀、身宮依時辰解讀 | `worker/content/lifeLord-bodyLord-zh-TW.json` |
| 命身同宮／錯位／命主身主對話 | `worker/content/lifeBodyRelation-zh-TW.json` |
| GPT notes 注入命主・身主・命身身宮 | `worker/src/lifeBookPrompts.ts`（buildSectionUserPrompt 內，約 2355–2363 行） |

---

## 八、摘要

- **命宮**：s04 目前透過 `palace_focus: ["命宮", "福德"]` 與「預設命宮」邏輯，用**命宮**做整題宮位 context，技術版會出命宮星曜／四化／迴路／高壓；骨架本身沒用 placeholder，所以呈現是固定文案。
- **命主／身主／身宮**：資料在 **index** 已算好並放進 **config**（masterStars、bodyPalaceInfo、lifeBodyRelationSnippet），但只注入 **GPT notes**，**沒有**進 **placeholderMap**，也**沒有**在 s04 骨架裡用 `{placeholder}`。
- **重寫 s04**：拿掉命宮（改 palace_focus + getPalaceKeyForSection）、在 getPlaceholderMapFromContext 為 s04 填命主／身主／身宮／命身關係的 placeholder、再把 s04 骨架改為使用這些 placeholder，即可「命宮資料拿掉、命主身主身宮星曜補足並重寫 s04」。
