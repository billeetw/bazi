# s03 組裝指令（精簡用）

章節：**你的命盤結構（主線劇本 × 星曜群性 × 四化慣性）**  
對應檔案：`worker/content/lifebookSection-zh-TW.json` 的 `s03` 鍵。

---

## 一、可用 placeholder 一覽

| 變數 | 說明 | 來源 |
|------|------|------|
| `{wholeChartMainlineBlock}` | 全盤主線劇本（資源／關係／事業／內在舞台＋證據） | 命盤組裝（四化＋星群） |
| `{starGroupStatsBlock}` | 星曜能量節奏區塊（含數字統計，依主線宮或全盤） | buildStarEnergyRhythmBlock |
| `{siHuaPatternTopBlocks}` | 四化慣性區塊（模組一規則 Top 5 判讀，標題【四化慣性】） | 四化模組一 renderPatternHitsForModuleOne |
| `{starClusterBehaviorSummary}` | 星曜群性在命財官遷四宮間切換的節奏描述 | 星群統計＋narrative 選句 |
| `{starEnergySummary}` | 星曜能量／群性摘要（多句以；分隔） | 星群分布計算 |
| `{sihuaMapping}` | 四化飛宮對照（星名化祿/權/科/忌 → 宮名，多行） | 本命四化列表＋宮位 |
| `{weakPalace}` | 最弱／需補強宮位一句（或「（此處無資料）」） | weight_analysis / 主星分布 |
| `{strongPalace}` | 最強／易發揮宮位一句（或「（此處無資料）」） | weight_analysis / 主星分布 |

缺資料時上述欄位可能為「（此處無資料）」；`wholeChartMainlineBlock`／`siHuaPatternTopBlocks` 有內建 fallback 句。

其他 s03 脈絡有計算但**目前未**在骨架內使用的變數（可選用）：  
`mingQuadSummary`、`caiQuadSummary`、`guanQuadSummary`、`qianQuadSummary`（命／財／官／遷一句）、`mingMain`、`mingTrio`、`mingTrioSummary`、`relationshipTrio`、`careerTrio`、`sihuaPersonality`。

---

## 二、現行四欄內容（供你分段改）

改完後直接回傳「二、」的某一欄或全部，我會幫你寫回 `lifebookSection-zh-TW.json`。

### structure_analysis（結構分析／主線＋星曜群性＋四化慣性）

```
【本題底層參數解析】

這一章從「整張命盤結構」來看你的主線劇本（主線劇本 × 星曜群性 × 四化慣性），不引用命宮章既有文案。

{wholeChartMainlineBlock}

{starGroupStatsBlock}

{siHuaPatternTopBlocks}
```

---

### behavior_pattern（行為模式）

```
【行為模式】

當命宮三方四正啟動時，你會：

– 先從「命宮」的自我定位出發，
– 再用「財帛」的方式思考資源、風險與交換，
– 透過「官祿」的舞台實際運作，
– 最後在「遷移」的外部世界，被環境與他人的回饋修正。

星曜群性會決定你在這四宮之間切換的節奏：

{starClusterBehaviorSummary}

而四化則在背後決定「你特別在意哪一塊」：

– 本命祿忌顯示，你終身一直在調整的主題。
– 大限祿忌顯示，你這十年特別專注的功課。
– 流年祿忌顯示，你今年最敏感的開關。
```

---

### blind_spots（盲點）

```
你的盲點主要來自三個來源：

【一、三方四正的偏食】
若三方四正中某宮過強或過弱，你會過度依賴該宮的模式，例如把「命宮」或「官祿」的慣性當成唯一解法。

【二、星曜群性的極端】
{starEnergySummary}
當這個能量過度強化時，你可能：
– 太急／太慢
– 想太多／過度衝動
– 過度控制／過度迎合

【三、四化慣性的反射性反應】
{sihuaMapping}
這些宮位一旦被引動，你容易啟動不自覺的反射（祿→追求、權→控制、科→合理化、忌→自我攻擊或逃避）。
```

---

### strategic_advice（策略建議）

```
要讓你的命盤結構達到最佳運作，可以採用以下策略：

1. 用「三方四正」找主軸
多觀察命宮、官祿、財帛、田宅的訊號。這些是你最穩的力量來源。

2. 釐清自身能量節奏
善用你的星曜群性（{starEnergySummary}）行事，而不是與其對抗。

3. 管理四化的力量
當祿權科忌被引動時，意識到「我又要往 {sihuaMapping} 那些宮位走了」，覺察即可減少失序。

4. 補強最弱宮位
{weakPalace} 是你最需要刻意練習的地方，可以帶來整張命盤的翻轉效果。

5. 發揮最強宮位
{strongPalace} 是你天生的力量源泉，越用越順。
```

---

## 三、撰寫約定（可依你精簡策略調整）

- **structure_analysis**：開場句可縮短；三塊（主線／星曜節奏／四化慣性）可併段或保留小標，缺資料時依 fallback 顯示。
- **behavior_pattern**：命財官遷四步＋星曜節奏＋三層祿忌，可改為總述一句或保留現有結構。
- **blind_spots**：三來源（三方偏食、星曜極端、四化反射）可縮成三句或合併為一段；`{starEnergySummary}`／`{sihuaMapping}` 若為「（此處無資料）」可考慮改寫或隱藏。
- **strategic_advice**：五點可併成三點或保留；`{weakPalace}`／`{strongPalace}` 為缺資料時可改為通用句。

你改好「二、」的任一欄或全部後貼給我，我依你的版本更新 `lifebookSection-zh-TW.json` 的 s03。
