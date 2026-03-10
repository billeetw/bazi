# 命主・身主・身宮（s04）重構報告

## 一、新增檔案

| 檔案 | 說明 |
|------|------|
| `worker/src/lifebook/bodyPalaceSentenceLibrary.ts` | 身宮 12 宮句庫：`BODY_PALACE_SENTENCE_LIBRARY`（core / tension / strategy），`pickBodyPalaceCore`、`pickBodyPalaceTension`、`pickBodyPalaceStrategy` |
| `worker/src/lifebook/bodyStarSentenceLibrary.ts` | 身主星曜句庫：`BODY_STAR_SENTENCE_LIBRARY`（15 星），`pickBodyStarCore`、`pickBodyStarTension`、`pickBodyStarStrategy` |
| `worker/src/lifebook/destinyStarSentenceLibrary.ts` | 命主星曜句庫：`DESTINY_STAR_SENTENCE_LIBRARY`（17 星），`pickDestinyStarCore`、`pickDestinyStarTension`、`pickDestinyStarStrategy` |
| `worker/src/lifebook/destinyBodyDialogue.ts` | 命主×身主關係：先分類（命主 5 型／身主 5 型）再套模板，`buildDestinyBodyDialogue(destinyStar, bodyStar)` |
| `worker/src/lifebook/bodyPalaceAlignment.ts` | 命宮×身宮關係：同宮／同向／錯位／張力型錯位／補償型錯位，`buildBodyPalaceAlignmentNarrative(mingPalace, bodyPalace, seed)` |

## 二、身宮 12 宮句庫是否已補齊

是。`bodyPalaceSentenceLibrary.ts` 內含 12 宮：

- 命宮、兄弟宮、夫妻宮、子女宮、財帛宮、疾厄宮、遷移宮、僕役宮、官祿宮、田宅宮、福德宮、父母宮  

每宮皆有 `core`、`tension`、`strategy` 陣列（至少 2～3 句），並提供：

- `pickBodyPalaceCore(palaceKey, seed)`
- `pickBodyPalaceTension(palaceKey, seed)`
- `pickBodyPalaceStrategy(palaceKey, seed)`

## 三、命主×身主、命宮×身宮是否已用模板產出

- **命主×身主**：是。`destinyBodyDialogue.ts` 將命主分為思辨型／感受型／權力型／實作型／變動型，身主分為爆發型／穩推型／柔化型／開創型／策略型，以 5×5 模板產出單一敘事句，不做 14×14 全排列，且不輸出「例如」「戰略語氣應」。
- **命宮×身宮**：是。`bodyPalaceAlignment.ts` 依命宮與身宮判斷 同宮／同向／錯位／張力型錯位／補償型錯位，並依類型選一句敘事（可依 seed 選變體）。

## 四、命主巨門／身主火星／身宮財帛 新版輸出樣例

以下為占位符填入後之示意（實際以句庫與 seed 選句為準）。

---

**【1. 核心配置】**

命主 巨門：命主是巨門，你的靈魂深處帶著觀察與懷疑，你不輕信，這讓你精明也讓你孤獨。

身主 火星：身主是火星，代表你真正出手時靠的是速度、反應與爆發力。很多事你不是慢慢醞釀，而是感覺到了就會立刻動。

身宮落在 財帛宮：身宮落在財帛宮，代表你的人生體感很容易集中在資源、安全感與現實回報上。很多事情你最後都會問：值不值得、穩不穩、能不能長久。

命盤線索：命主／身主／身宮。

---

**【2. 你的內在驅力（命主 × 身主）】**

你靈魂裡習慣先想清楚再動，但身主是爆發型，一有感覺就容易立刻出手。內在的「再等一下」與外在的「先做了再說」常會打架；成熟後要練的是：讓思考定方向，讓爆發力在對的時機出手。

命盤線索：命主×身主。

---

**【3. 你的人生體感會落在哪裡（身宮）】**

你的人生體感會集中在財帛宮所代表的領域。最容易失衡的地方，是把太多事情都翻譯成得失與配置，讓自己變得很難真正放鬆。

命盤線索：身宮財帛宮。

---

**【4. 命身是否同步（命宮 vs 身宮）】**

命宮與身宮不同宮，代表你的人生體感會落在與「自我定位」不同的場域，有時會覺得想的方向和真正有感的領域不太一樣。要練的是：認清身宮才是你真正敏感的地方，決策與資源可以多放一點在那裡。

命盤線索：命宮與身宮。

---

**【5. 你最該學會怎麼使用自己】**

你真正要練的，是讓看見問題變成解題能力，而不是自我消耗。 你真正要練的，不是壓住火，而是讓火有方向。 成熟後的財帛宮身宮，代表你能把資源感建立在結構上，而不只是情緒起伏。

命盤線索：命主＋身主＋身宮。

---

## 五、已修正的問題與去重

- 正文已移除：「例如命宮在……」「戰略語氣應強調……」「戰略語氣應觸及……」及任何示例型句子（未命中此盤者不輸出）。
- 命主說明、身主說明、身宮說明、命身錯位、命主與身主的內外對話：各段只出現一次；核心配置段為命主／身主／身宮各一句，身宮長說明僅在段 1，段 3 改為體感落在哪裡＋失衡（tension）一句。
- `lifeBodyRelation-zh-TW.json` 已改為不帶「例如」與「戰略語氣」的通用句；`getLifeBodyRelationSnippet` 不再附加「戰略語氣：」。
- s04 的 `structure_analysis` 改為 5 段（核心配置、內在驅力、人生體感落在哪裡、命身是否同步、最該學會怎麼使用自己），每段先命書敘事，最後可加一行「命盤線索：……」。

## 六、實作位置摘要

| 項目 | 位置 |
|------|------|
| s04 五段模板 | `worker/content/lifebookSection-zh-TW.json` → `s04.structure_analysis` |
| s04 新 placeholders | `worker/src/lifeBookPrompts.ts` → `getPlaceholderMapFromContext`（destinyStarCore, bodyStarCore, bodyPalaceCore, bodyPalaceTension, destinyBodyDialogue, bodyPalaceAlignmentNarrative, s04StrategyBlock） |
| 命身 snippet 不再附加戰略語氣 | `worker/src/index.ts` → `getLifeBodyRelationSnippet` |
| 命身關係文案去示例化 | `worker/content/lifeBodyRelation-zh-TW.json` |
