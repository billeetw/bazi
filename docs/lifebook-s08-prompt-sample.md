# 命書 s08（事業、成就、工作舞台／官祿宮）完整 Prompt 組裝示範

本文件示範「官祿宮」一題的 system + user prompt 結構，用於自檢：Soul Advisor persona、描述在前技術在後、三維資訊（星曜＋十神＋五行）皆已帶入。

---

## 一、System Prompt 結構

來源：`getSystemPrompt(config)` = `EXPERT_PERSONA` + `GENERAL_RULES`。

- **Soul Advisor 人格**：諮商式指導者、人生遊戲任務書、描述在前技術在後、三維整合觀念（星曜＝事件、十神＝關係角色、五行＝能量順逆）。
- **總則**：語氣規範、描述在前技術在後（最後一段〈技術依據〉條列星曜與四化、十神、五行）、執行規則、結構規範、輸出 JSON 格式。

（內容即 `lifeBookPrompts.ts` 的 `EXPERT_PERSONA` 與 `GENERAL_RULES`，此處不重複貼全文。）

---

## 二、User Prompt 結構（s08 官祿宮）

來源：`buildSectionUserPrompt("s08", chartJson, weightAnalysis, config)`。

當 `config.tenGodByPalace` / `config.wuxingByPalace` 由 `chart_json` 帶入時，會出現【技術背景（本宮）】區塊。

### 2.1 範例骨架（有十神＋五行時）

```
【題號】8/22
【標題】事業、成就、工作舞台（官祿宮）

【該題分析指引】
（此處為 S08_OFFICIAL_TEMPLATE：GENERAL_TEMPLATE + 官祿宮特別提示）
- 技術依據規範（描述在前、技術在後）、四欄說明、語氣、輸出格式
- 【官祿宮特別提示】星曜描述事業型態、十神描述與權力／上司／體制的關係、五行描述順不順

【篇幅】800–1200字（依 importance 可能為 500–800 或 1200–1600）

【命盤切片】
{"ziwei":{...},"overlap":{...},"sihua":{...}}

【權重摘要】
{"importance_map":{"s08":"medium",...},"top_focus_palaces":[],"risk_palaces":[],"stable_palaces":[]}

【技術背景（本宮）】
【宮位】官祿
【十神】此宮位對應的十神為「傷官」，代表你與此領域之間的關係角色與互動模式。
【五行】此宮位五行屬「金」，請你在分析時考慮五行生剋，作為能量順逆與強弱的參考。

【星曜宮位評語（會直接顯示給當事人）】
（若有 config.starPalaces 則列出該題用到的宮位評語）

【命主・身主星曜定義】
（若有 config.masterStars 則列出）

【五行弱項句庫】【十神句庫】
（依題目與權重帶入的句庫）
```

### 2.2 自檢要點

| 項目 | 說明 |
|------|------|
| Soul Advisor | system 內含 EXPERT_PERSONA（Soul Advisor、三維觀念、描述在前技術在後）。 |
| 描述在前、技術在後 | GENERAL_TEMPLATE + TECHNICAL_BASIS_RULE 要求先完成 ①～④ 人話，最後一段才寫〈技術依據〉。 |
| 三維資訊 | 【技術背景（本宮）】帶入【宮位】官祿、【十神】傷官、【五行】金；模板要求〈技術依據〉條列星曜與四化、十神、五行。 |
| 官祿宮加強 | S08_OFFICIAL_TEMPLATE 額外提示：星曜＝事業型態、十神＝與權力／上司／體制關係、五行＝這條路順不順。 |

若上游未提供十神或五行，`config.tenGodByPalace` / `config.wuxingByPalace` 為空物件，【技術背景（本宮）】仍會出現【宮位】官祿，十神／五行兩行則不會出現；模板已說明「若某宮沒有十神或沒有五行資訊，〈技術依據〉只寫有的部分，不要硬掰」。

---

## 三、現在就可以用嗎？要補什麼？

### 現在就可以用

- 不傳 `tenGodByPalace`、`wuxingByPalace` 也能正常生成命書。Worker 會用 `{}`，prompt 只帶【宮位】，模型照樣輸出四段＋〈技術依據〉（僅星曜與四化部分有依據，十神／五行若無資料會略過或簡述）。
- 已上線的「描述在前、技術在後」與 12 宮模板、官祿／財帛／子女／疾厄加強都照常生效。

### 若要完整「三維」（星曜＋十神＋五行）

需要**上游在呼叫命書 API 時**，把這兩欄算好並放進 `chart_json`：

| 欄位 | 含義 | 誰來算、放哪裡 |
|------|------|----------------|
| `chart_json.tenGodByPalace` | 各宮位對應的十神（如 `{ "命宮": "比肩", "官祿宮": "傷官", "財帛": "偏財" }`） | 由八字：依「宮位↔柱」對應（命宮=日柱、兄弟=月柱…）取該柱天干，對日干算十神。需在組裝 chart_json 的地方（例如專家後台或主站命書流程）實作並寫入。 |
| `chart_json.wuxingByPalace` | 各宮位對應的五行（如 `{ "命宮": "火", "官祿": "金" }`） | 由紫微宮位地支或八字宮位五行：每個宮位對應一個五行。需在組裝 chart_json 的地方實作並寫入。 |

- **key 格式**：支援「官祿」或「官祿宮」、「財帛」或「財帛宮」等，Worker 會自動對應。
- **沒給的宮位**：不報錯，該題〈技術依據〉只寫有資料的部分。

目前專案內有「日干 vs 他干」的十神計算（`js/calc/helpers.js`），但**尚無「12 宮 → 十神／五行」的組裝**。若要完整三維，下一步就是在產生命書、組裝 `chart_json` 的那一段（例如專家後台呼叫 generate-section 前，或主站 lifeBookEngine 組 payload 處）加上上述計算，並把結果塞進 `chart_json.tenGodByPalace` 與 `chart_json.wuxingByPalace`。
