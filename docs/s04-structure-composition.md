# s04（命主・身主・身宮）結構組成 — 修改指南

## 一、要改「最終輸出長相」改哪裡

**檔案：`worker/content/lifebookSection-zh-TW.json`**

找到 `"s04"` 物件，裡面有四個欄位，都會被替換成實際命盤內容：

- `structure_analysis` — 正文（目前是 5 段）
- `behavior_pattern` — 行為模式
- `blind_spots` — 盲點
- `strategic_advice` — 策略建議

你改這四個字串（含裡面的 `{占位符}`），就會直接影響 s04 的組成。

---

## 二、s04 目前結構（可直接複製去改）

### 1. `structure_analysis`（正文，5 段）

```
【1. 核心配置】

命主 {lifeLordName}：{destinyStarCore}

身主 {bodyLordName}：{bodyStarCore}

身宮落在 {bodyPalaceName}：{bodyPalaceCore}

命盤線索：命主／身主／身宮。

【2. 你的內在驅力（命主 × 身主）】

{destinyBodyDialogue}

命盤線索：命主×身主。

【3. 你的人生體感會落在哪裡（身宮）】

{bodyPalaceFocusBlock}

命盤線索：身宮落在 {bodyPalaceName}。

【4. 命身是否同步（命宮 vs 身宮）】

{bodyPalaceAlignmentNarrative}

命盤線索：命宮與身宮。

【5. 你最該學會怎麼使用自己】

{s04StrategyBlock}

命盤線索：命主＋身主＋身宮。
```

### 2. `behavior_pattern`

```
命主代表你的內在動力與渴望，身主代表你後天實際落地的行動方式，身宮代表生命體驗與敏感度集中的場域。當你跟隨命主的渴望行動時，實際表現會很像身主，而體感多半集中在身宮對應的領域。三者共同形成你「如何使用自己」的慣性。
```

### 3. `blind_spots`

```
若命主與身主不一致、或身宮與命宮不同宮，容易出現「想法一套、行動一套、感受又另一套」的斷裂感。常見的誤解是：把命主的渴望當成唯一方向而壓抑身主的行動模式，或只依身主行事而忽略命主給出的訊號；身宮若與命宮錯位，也容易在錯誤的場域拼命努力。
```

### 4. `strategic_advice`

```
讓命主的動力、身主的行動方式與身宮的場域協同：用身主帶動行動、用命主找方向、用身宮調整場景。在身宮對應的領域做決策時，先問命主真正想要的是什麼，再問身主會怎麼實際執行，把兩者對齊，就能在對的場域用對的方式前進。
```

---

## 三、占位符對照表（改結構時可用的變數）

| 占位符 | 來源 | 說明 |
|--------|------|------|
| `{lifeLordName}` | config.masterStars.命主.name | 命主星名，如「巨門」 |
| `{bodyLordName}` | config.masterStars.身主.name | 身主星名，如「火星」 |
| `{bodyPalaceName}` | config.bodyPalaceInfo.palace | 身宮宮位，如「財帛宮」 |
| `{destinyStarCore}` | 句庫 pickDestinyStarCore(命主名, seed) | 命主一句敘事（內在動力） |
| `{bodyStarCore}` | 句庫 pickBodyStarCore(身主名, seed) | 身主一句敘事（後天工具） |
| `{bodyPalaceCore}` | 句庫 pickBodyPalaceCore(身宮, seed) | 身宮一句敘事（人生體感） |
| `{bodyPalaceTension}` | 句庫 pickBodyPalaceTension(身宮, seed) | 身宮失衡／壓力一句 |
| `{bodyPalaceFocusBlock}` | bodyPalaceCore + bodyPalaceTension（僅非空，用 \n\n 接） | 第 3 段整段敘事 |
| `{destinyBodyDialogue}` | buildDestinyBodyDialogue(命主, 身主) | 命主×身主內外對話一句 |
| `{bodyPalaceAlignmentNarrative}` | buildBodyPalaceAlignmentNarrative("命宮", 身宮, seed) | 命宮×身宮同宮／錯位等一句 |
| `{s04StrategyBlock}` | buildS04StrategyIntegrated(命主, 身主, 身宮) 整合一句＋具體策略 | 第 5 段整段（非三句拼接） |

**還有但目前模板沒用到的（若要加回去可自訂）：**

| 占位符 | 來源 | 說明 |
|--------|------|------|
| `{lifeLordText}` | config.masterStars.命主.text（來自 lifeLordDecode） | 命主原始解碼文案 |
| `{bodyLordText}` | config.masterStars.身主.text（來自 bodyLordDecode） | 身主原始解碼文案 |
| `{bodyPalaceInterpretation}` | config.bodyPalaceInfo.interpretation | 身宮原始解讀（by 時辰） |
| `{lifeBodyRelationBlock}` | config.lifeBodyRelationSnippet 合併 | 命身同宮／錯位／內外對話的舊版片段 |

---

## 四、占位符是在哪裡被填進去的

**檔案：`worker/src/lifeBookPrompts.ts`**

- 約 **2935～2964 行**：`if (opts?.sectionKey === "s04" && opts?.config)` 裡會把上面表格的占位符全部寫進 `map`（例如 `map.destinyStarCore = ...`）。
- 之後 `resolveSkeletonPlaceholders(structure_analysis, map, ...)` 會把 `structure_analysis` 字串裡的 `{destinyStarCore}` 等換成 `map` 裡的值。

也就是說：
- **改「長相」**（幾段、標題、要不要某一段、要不要命盤線索）→ 只改 **`lifebookSection-zh-TW.json`** 的 `s04.structure_analysis`（或 behavior/blind_spots/strategic_advice）。
- **改「某一段的內容來源」**（例如改用 lifeLordText 或再加一個新占位符）→ 要改 **`lifeBookPrompts.ts`** 的 s04 那塊，在 `map.xxx = ...` 裡加或改。

---

## 五、句庫與模板函式（改「內容」時會動到）

| 你想改的 | 檔案 |
|----------|------|
| 命主各星一句（核心／失衡／策略） | `worker/src/lifebook/destinyStarSentenceLibrary.ts` |
| 身主各星一句 | `worker/src/lifebook/bodyStarSentenceLibrary.ts` |
| 身宮各宮一句（核心／失衡／策略） | `worker/src/lifebook/bodyPalaceSentenceLibrary.ts` |
| 命主×身主「內外對話」整句 | `worker/src/lifebook/destinyBodyDialogue.ts`（5×5 分類模板） |
| 命宮×身宮「同宮／錯位」整句 | `worker/src/lifebook/bodyPalaceAlignment.ts` |

---

## 六、JSON 裡實際長怎樣（方便你搜尋／貼上）

在 `lifebookSection-zh-TW.json` 裡，s04 是一整段字串，`\n` 是換行。你若要改結構，可以：

1. 打開 `worker/content/lifebookSection-zh-TW.json`
2. 搜尋 `"s04"`
3. 在 `"structure_analysis"` 的值裡改標題、段落順序、或增刪「命盤線索：……」那一行；占位符保持 `{xxx}` 不變即可。

若你希望改成「3 段」或「7 段」、或某一段改用 `{lifeLordText}`，只要在 **同一個** `structure_analysis` 字串裡改，並在 **三、占位符對照表** 裡確認用的占位符有在 **四、lifeBookPrompts** 裡被賦值即可。

---

## 七、修正紀錄（舊版混入／三欄清空／bodyPalaceFocusBlock／s04StrategyBlock）

### 1. 舊輸出來源與阻斷

- **來源一**：`worker/src/lifeBookPrompts.ts` 中 `sectionKey === "s04"` 時會組出 `underlyingParamsTextFinal`，內容為「【本題底層參數解析】、命主：X —— ...、身主：X —— ...、身宮：...、命身關係：、【身宮】...、【命身錯位】...、【命主與身主的內外對話】...」。
- **來源二**：`worker/src/index.ts` 在組 `technicalParts` 時會先 push `blocks.underlyingParamsText`，再 push `resolved.structure_analysis`，最後用 `technicalParts.join("\n")` 當成該次的 `structure_analysis` 輸出，因此 **技術版／預覽** 的正文會是「舊摘要 + 五段」。
- **阻斷方式**：
  - 在 lifeBookPrompts 中，對 s04 改為 `underlyingParamsTextFinal = ""`，不再寫入任何命主/身主/身宮/命身關係摘要。
  - 在 index 中，將 `skipDebugBlocks` 改為包含 `sectionKey === "s04"`，使 s04 不再把 `underlyingParamsText` 拼進輸出。兩處（單章技術版與批次 generate 技術版）都已改。

### 2. behavior_pattern / blind_spots / strategic_advice 清空

- 在 `worker/content/lifebookSection-zh-TW.json` 的 s04 下，已將 `behavior_pattern`、`blind_spots`、`strategic_advice` 全部設為 `""`，讀者版與技術版都不再輸出這三欄。

### 3. bodyPalaceFocusBlock 組法

- **定義**：`bodyPalaceFocusBlock` = 第一段 `bodyPalaceCore` + 若 `bodyPalaceTension` 非空則換行後接第二段 `bodyPalaceTension`；若其中一句為空則只輸出有值者。
- **實作**：在 `getPlaceholderMapFromContext` 的 s04 區塊中，`map.bodyPalaceFocusBlock = core && tension ? core + "\n\n" + tension : core || tension || ""`。
- **使用**：s04 第 3 段改為「【3. 你的人生體感會落在哪裡（身宮）】\n\n{bodyPalaceFocusBlock}\n\n命盤線索：身宮落在 {bodyPalaceName}。」

### 4. s04StrategyBlock 新組法

- **不再**：把 `pickDestinyStarStrategy`、`pickBodyStarStrategy`、`pickBodyPalaceStrategy` 三句直接拼接。
- **改為**：由 `worker/src/lifebook/s04StrategyIntegrated.ts` 的 `buildS04StrategyIntegrated(destinyName, bodyName, bodyPalaceKey)` 產出：
  - 一句整合式總結：例如「不是壓住巨門的懷疑，也不是削掉火星的爆發，而是讓『先看清楚』和『再快速出手』變成同一套節奏。」
  - 一句具體策略：例如「尤其在資源、安全感與現實配置的議題上，先分辨真假與輕重，再決定怎麼推進，你就比較不會在最有感的地方因急而失準。」
- 命主/身主/身宮有缺時，fallback 為：「你真正要練的，是讓命主的方向感、身主的行動方式與身宮的體感場域彼此配合，而不是彼此拉扯。」

### 5. 新版輸出樣例（命主巨門／身主火星／身宮財帛宮）

**【1. 核心配置】**  
命主 巨門：命主是巨門，你的靈魂深處帶著觀察與懷疑，你不輕信，這讓你精明也讓你孤獨。  
身主 火星：身主是火星，代表你真正出手時靠的是速度、反應與爆發力。很多事你不是慢慢醞釀，而是感覺到了就會立刻動。  
身宮落在 財帛宮：身宮落在財帛宮，代表你的人生體感很容易集中在資源、安全感與現實回報上。很多事情你最後都會問：值不值得、穩不穩、能不能長久。  
命盤線索：命主／身主／身宮。

**【2. 你的內在驅力（命主 × 身主）】**  
你靈魂裡習慣先想清楚再動，但身主是爆發型，一有感覺就容易立刻出手。內在的「再等一下」與外在的「先做了再說」常會打架；成熟後要練的是：讓思考定方向，讓爆發力在對的時機出手。  
命盤線索：命主×身主。

**【3. 你的人生體感會落在哪裡（身宮）】**  
身宮落在財帛宮，代表你的人生體感很容易集中在資源、安全感與現實回報上。很多事情你最後都會問：值不值得、穩不穩、能不能長久。

最容易失衡的地方，是把太多事情都翻譯成得失與配置，讓自己變得很難真正放鬆。  
命盤線索：身宮落在 財帛宮。

**【4. 命身是否同步（命宮 vs 身宮）】**  
命宮與身宮不同宮，代表你的人生體感會落在與「自我定位」不同的場域，有時會覺得想的方向和真正有感的領域不太一樣。要練的是：認清身宮才是你真正敏感的地方，決策與資源可以多放一點在那裡。  
命盤線索：命宮與身宮。

**【5. 你最該學會怎麼使用自己】**  
你真正要練的，不是壓住巨門的懷疑，也不是削掉火星的爆發，而是讓『先看清楚』和『再快速出手』變成同一套節奏。尤其在資源、安全感與現實配置的議題上，先分辨真假與輕重，再決定怎麼推進，你就比較不會在最有感的地方因急而失準。  
命盤線索：命主＋身主＋身宮。
