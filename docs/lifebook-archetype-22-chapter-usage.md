# 22 章「插入原型職業」用法規則（給 Cursor refactor 用）

本題底層參數區塊已包含：**角色原型（星曜）**、**能量原型（五行）**。以下為各章節如何運用這些原型的規則級說明，不需為每章寫長文，依規則插入即可。

---

## 1. 哪些章節會用到原型？

- **有 `palace_focus` 的宮位題**：命宮、福德、父母、兄弟、僕役、官祿、田宅、疾厄、遷移、夫妻、子女、財帛。
- **有「主軸」的總結型章節**：s00（行前簡報）、s17（靈魂使命）、s18（業力）、s19（行動清單）、s21（總結）。

---

## 2. 宮位題：統一開頭模板

在這些題的 **structure_analysis 第一小段**，可加統一模板（由模型依 prompt 內已有之 archetype / wuxingEnergy / starBaseCore 等自然產出）：

- 在「{宮位名稱}」這一格，你上場時扮演的角色，像是 **「{星曜原型.title}」＋「{五行原型.title}」**。
- 這意味著，在這個領域裡，你傾向用「{星曜原型.label}的方式」去看世界，再加上「{五行原型.label}的能量」，例如：{一句話簡短說明，由 GPT 潤飾}。

Prompt 已提供：`archetypeStar[starId].title/description`、`archetypeElement[wuxingId].title/description`、`wuxingEnergy`、`starBaseCore/Shadow`，模型可據此寫出「你在事業宮就像一個帶著精密策略的裁判型智者……」等語感。

---

## 3. 總論型章節的用法

| 章節 | 用法 |
|------|------|
| **s00（行前簡報）** | 把「命宮主星原型＋本命五行原型」當玩家主職業。例：你這一局選的主職業是「智者型玩家（天機）」＋「裁判者能量（金行）」。 |
| **s17（靈魂使命）** | 用「星曜原型 + 極強五行原型」描述靈魂主題。例：靈魂在這一世主要想練習的，是從「王者原型」走向「守護者原型」，把統御變成庇護。 |
| **s18（業力）** | 若有命中迴路＋陰影原型，可寫：當「反叛者（廉貞）」＋「神秘者（水）」走向失衡，就會反覆上演某種關係戲碼…… |
| **s19（行動）** | 三條立刻可做／長期累積可綁原型升級。例：對戰士原型的你來說，「學會適時休息」反而是最高級的修煉。 |
| **s21（總結）** | 直接總結：你這局扮演的，是一個「○○原型」逐步升級為「□□原型」的旅程，過程中會經過哪幾個場景（以宮位對應），你可以怎麼玩。 |

---

## 4. 資料來源（已接好）

- **五行原型**：`DbContent.archetypeElement`，key = wood | fire | earth | metal | water；靜態 `worker/content/archetypeElement-zh-TW.json`。
- **星曜原型**：`DbContent.archetypeStar`，key = ziWei | tianJi | …；靜態 `worker/content/archetypeStar-zh-TW.json`。
- **底層參數區塊**：`buildUnderlyingParamsBlock` 已輸出「角色原型（星曜）」「能量原型（五行）」兩行，有資料才印，沒有則略過。

Refactor 時只需依上述規則調整 prompt 說明或章節模板，無須改動 JSON 或 DbContent 結構。
