# s00 組裝指令（精簡用）

章節：**這一局，你為什麼要來？（靈魂行前簡報）**  
對應檔案：`worker/content/lifebookSection-zh-TW.json` 的 `s00` 鍵。

---

## 一、可用 placeholder 一覽

| 變數 | 說明 | 來源 |
|------|------|------|
| `{benMingSiHuaList}` | 本命四化列表（星名化祿、星名化權…） | 命盤組裝 |
| `{daXianSiHuaList}` | 大限四化列表 | 命盤組裝 |
| `{liuNianSiHuaList}` | 流年四化列表 | 命盤組裝 |
| `{s00HotStars}` | 重點星曜（多層命中，頓號分隔） | 四化模組一 |
| `{s00HotPalaces}` | 重點宮位（多層命中，頓號分隔） | 四化模組一 |
| `{s00MainNarrative}` | 全盤結構判讀主文（四化引擎產出，含字典＋因果） | 四化引擎 |
| `{s00DominantPalaces}` | 四化結構結論／命盤主戰場 Top 宮位 | 主戰場偵測 |
| `{s00YearlyAdvice}` | 今年操作建議（最多 3 條，四化引擎 decisionTags 彙總） | 四化引擎 |

以下 placeholder 目前**未**在 s00 骨架內使用，但程式有填值，若要精簡可略過或另段使用：  
`s00PatternBlock`、`s00GlobalHighlights`、`s00NarrativeBlocks`、`s00DebugEvidence`（技術版用）、`s00HotSummary`、`s00PatternNarrative`、`s00PatternActions`。

---

## 二、現行四欄內容（供你分段改）

改完後直接回傳「二、」的某一欄或全部，我會幫你寫回 `lifebookSection-zh-TW.json`。

### structure_analysis（結構分析／技術資料＋判讀＋結論＋建議）

```
【技術資料】

本命四化：{benMingSiHuaList}
大限四化：{daXianSiHuaList}
流年四化：{liuNianSiHuaList}

四化有三個時間層：本命 → 天生慣性；大限 → 十年主題；流年 → 當年風向。三層疊加後，會形成你此局的行動節奏與敏感區域。詳細配置請以上方技術區塊為準。

【本局關鍵摘要】

重點星曜：{s00HotStars}
重點宮位：{s00HotPalaces}

【全盤結構判讀】

{s00MainNarrative}

【四化結構結論】

{s00DominantPalaces}

【今年操作建議】

{s00YearlyAdvice}
```

---

### behavior_pattern（行為模式）

```
（目前為空字串，可補一句或留空）
```

---

### blind_spots（盲點）

```
【盲點】

1. 把「忌」當成壞運標籤
忌星不是叫你放棄，而是提醒「這裡要慢一點、看清楚一點」。

2. 忽略「權」與「科」的操作空間
權星代表你可以怎麼主動出手，科星代表你可以怎麼學習與修正。

3. 把「祿」當成唯一答案
祿星宮位有資源，但若所有決策都只看那裡，會變成偏食。

4. 混淆時間層級
本命是一輩子的慣性，大限是十年課題，流年只是今年風向。

5. 沒發現自己正在「四化自動駕駛」
覺察祿權科忌落在哪裡，就能減少反射性衝動。
```

---

### strategic_advice（策略建議）

```
【今年建議】

{s00YearlyAdvice}
```

---

## 三、撰寫約定（可依你精簡策略調整）

- **structure_analysis**：技術資料＋摘要＋判讀＋結論＋今年建議，可合併小標或刪減說明句。
- **behavior_pattern**：可留空或一句總述本局四化與行為的關係。
- **blind_spots**：可縮成 3 點或改為一句；與 strategic_advice 重複處可刪。
- **strategic_advice**：可只保留 `{s00YearlyAdvice}`，或加一句總起／收束。

你改好「二、」的任一欄或全部後貼給我，我依你的版本更新 `lifebookSection-zh-TW.json` 的 s00。
