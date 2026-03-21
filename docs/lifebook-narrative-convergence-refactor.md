# 語句系統收斂重構 — 驗收與清單

## 一、已刪除檔案清單

以下 **15 個 SentenceLibrary** 已直接刪除：

- `worker/src/lifebook/mingGongSentenceLibrary.ts`
- `worker/src/lifebook/bodyPalaceSentenceLibrary.ts`
- `worker/src/lifebook/bodyStarSentenceLibrary.ts`
- `worker/src/lifebook/destinyStarSentenceLibrary.ts`
- `worker/src/lifebook/caiBoGongSentenceLibrary.ts`
- `worker/src/lifebook/guanLuGongSentenceLibrary.ts`
- `worker/src/lifebook/fuQiGongSentenceLibrary.ts`
- `worker/src/lifebook/fuDeGongSentenceLibrary.ts`
- `worker/src/lifebook/tianZhaiGongSentenceLibrary.ts`
- `worker/src/lifebook/ziNvGongSentenceLibrary.ts`
- `worker/src/lifebook/qianYiGongSentenceLibrary.ts`
- `worker/src/lifebook/puYiGongSentenceLibrary.ts`
- `worker/src/lifebook/jiEGongSentenceLibrary.ts`
- `worker/src/lifebook/fuMuGongSentenceLibrary.ts`
- `worker/src/lifebook/xiongDiGongSentenceLibrary.ts`

**其他變更：**

- `worker/content/narrativeCorpus-zh-TW.json`：已移除 openers / explainers / advisers（改為空陣列），僅保留結構與 connectors。
- `worker/src/lifebook/patternPhraseLibrary.ts`：改為每規則**單一** messageTemplate / actionTemplate / evidenceTemplate（無多句輪替、無 pickTemplateIndex）。
- `worker/src/lifebook/patternPhraseLibraryRuleTypes.ts`：改為每 ruleType **單一** messageTemplate / actionTemplate / evidenceTemplate。
- `worker/src/lifebook/bodyPalaceAlignment.ts`：移除 pickBySeed，改為固定取第一句。
- `worker/src/lifebook/brightnessNarrative.ts`：移除 pickBySeed，改為 firstTemplate（固定取第一句）。

---

## 二、narrativeTemplates.ts 完整內容

路徑：`worker/src/lifebook/narrativeTemplates.ts`

```ts
/**
 * 命書文案唯一語句入口。
 * 所有文案必須可對應：宮位 / 星曜 / 四化 / from → to。
 * 不允許隨機選句、多句輪替、抽象命理語氣。
 */

export const narrativeTemplates = {
  wealth: {
    positive: [
      "{star}化祿飛入{toPalace}，資源與機會較易在{toPalace}聚集。",
      "祿入{toPalace}，此宮可作為資源投入重點。",
    ],
    negative: [
      "{star}化忌自{fromPalace}飛入{toPalace}，壓力源在{fromPalace}、表象在{toPalace}。",
      "忌入{toPalace}，此宮宜設界線與停損。",
    ],
    conflict: [
      "{palace}同時有祿與忌，機會與壓力同區；先小步試錯再放大。",
    ],
  },
  career: {
    positive: [
      "{star}化權飛入{toPalace}，在{toPalace}易被推上前台或需主導。",
      "權入{toPalace}，此宮宜主動爭取權責範圍。",
    ],
    negative: [
      "忌自{fromPalace}飛入{toPalace}，根因在{fromPalace}、表象在{toPalace}。",
    ],
    conflict: [
      "{target}權忌同點，宜區分必須扛的與可委派的。",
    ],
  },
  relationship: {
    positive: [
      "祿入{toPalace}，關係與人脈較易在{toPalace}匯聚。",
    ],
    negative: [
      "忌自{fromPalace}飛入{toPalace}，關係壓力源在{fromPalace}。",
    ],
    conflict: [
      "{palace}祿忌同宮，關係上先設界線再加碼。",
    ],
  },
  mobility: {
    positive: [
      "祿入{toPalace}，外出或外部發展的資源較易在{toPalace}。",
    ],
    negative: [
      "忌自{fromPalace}飛入{toPalace}，遷移或外部壓力源在{fromPalace}。",
    ],
    conflict: [],
  },
};

export const dimensionTemplates = {
  assets: {
    stable: ["祿入{palace}，資源集中於{palace}。"],
    unstable: ["忌入{palace}，此宮壓力訊號明顯。"],
    mixed: ["{palace}祿忌同宮，資源與壓力並存。"],
  },
  network: {
    supportive: ["祿權入{palace}，人脈與主導易在{palace}發揮。"],
    pressured: ["忌自{fromPalace}飛入{toPalace}，人際壓力源在{fromPalace}。"],
    mixed: ["{palace}祿忌同宮，人際上先小步試錯再放大。"],
  },
  mindset: {
    stable: ["科入{palace}，方法與學習可在此宮加分。"],
    pressured: ["忌入{palace}，此宮宜設界線與回顧點。"],
    mixed: ["{target}權忌同點或科忌同點，宜拆責任、設門檻。"],
  },
};
```

---

## 三、確認：已無不合規來源

- **pickXXX**：已刪除所有 SentenceLibrary 及其 pick 函式；`pickTemplateIndex` 已自 patternPhraseLibrary 移除；`pickNarrativeIndex` 在 lifeBookPrompts 改為固定取 `set.message[0]`。
- **seed**：宮位核心定義改為 `pickPalaceCoreDefinition(palaceKey, _seed?)` 僅用 `getPalaceSemantic`，不依 seed；命宮輔星／煞星改為單一結構句；bodyPalaceAlignment / brightnessNarrative 改為固定取第一句。
- **隨機句庫**：patternPhraseLibrary / patternPhraseLibraryRuleTypes 僅保留單一模板 per rule / ruleType；narrativeCorpus 之 openers/explainers/advisers 已清空。
- **overlap 文案生成**：buildOverlapDetailBlocks 仍恆回傳空；s00NarrativeBlocks 改為僅由 `renderPatternHitsForModuleOne(s00Hits, 5)` 產出，不依 narrativeCorpus 語氣句；抽象句（演的主題、底色、舞台、課題、誤判、逃避、放大的舞台等）已改為結構化句或宮位／四化／from→to 對應句。

---

## 四、S18 輸出範例

S18 區塊由 `formatEventSignalsForSection(signals)` 產出，**reasons 直接使用 signals.reasons**，不改寫。範例（結構與實際欄位一致）：

```
【疊宮事件訊號】

【財運】
傾向：偏順（score=1） 能量強度：2
原因：天機化祿自命宮飛入財帛宮；武曲化權入官祿宮
涉及宮位：命宮、財帛宮、官祿宮

【事業】
傾向：偏壓力（score=-1） 能量強度：2 有正負拉扯
原因：巨門化忌自夫妻宮飛入官祿宮
涉及宮位：夫妻宮、官祿宮

【感情／一對一關係】
傾向：中性（score=0） 能量強度：1

涉及宮位：

【遷移／外出／外部發展】
傾向：偏順（score=1） 能量強度：1

涉及宮位：遷移宮

【關鍵宮位】
機會較強：財帛宮、遷移宮
壓力較強：官祿宮
```

以上為語句系統收斂重構之已刪除清單、narrativeTemplates 內容、合規確認與 S18 輸出範例。
