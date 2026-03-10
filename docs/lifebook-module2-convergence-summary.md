# 模組二後半段（s16–s21）收斂說明

## 一、s16 / s17 如何縮成索引式

### s16「今年的主線任務與心理濾鏡」

- **原則**：不再出現「本章內容已整合至 s15……請見 s15」後又接長段舊說明；只保留三項索引。
- **改動**：
  - 模板改為僅三行：今年心理濾鏡落宮、今年在十年裡的角色、一句建議。
  - 使用 placeholders：`{xiaoXianPalaceName}`、`{yearRoleInDecade}`、`{yearOneLineAdvice}`。
- **程式**：`yearOneLineAdvice` 在 `getPlaceholderMapFromContext` 中由 `getRoleTakeaway(roleResult.role)` 產出；s15/s16/s17 共用同一套 year-role 與 yearly 資料。

### s17「十年 × 年度交叉分析」

- **原則**：只保留今年在十年裡的位置、關鍵年份索引、提示到 s15 看完整解釋。
- **改動**：
  - 模板改為：今年在十年裡的位置（`{yearRoleInDecade}`）+ 一句「地雷區／機會區／震盪區年份與完整解釋，見 s15 第 5 段與附錄」。
  - 不再重複附錄表格與統計句。
- **程式**：s17 仍會跑 time-module 與 year-role 區塊，故有 `yearRoleInDecade`；關鍵年份詳情僅在 s15 組版。

---

## 二、s18–s21 新版樣例（測試盤）

**測試盤條件**：當前大限僕役宮（54～63）、2026／55 歲、小限夫妻宮、關係承壓源自官祿壓力外溢（診斷有官祿→夫妻 rootCause）。

### s18「主要盲點」

- **改動**：不再用「某些宮位星曜組合特別極端」起手；改為對這段時間說話：誤判什麼、逃避什麼、把哪種壓力合理化。
- **樣例**（有 rootCause 時）：  
  「這段時間你最容易誤判的，是以為問題在夫妻宮；逃避的，是承認壓力其實從官祿宮溢進來。很多人會把夫妻宮的摩擦合理化，而不去看官祿宮才是源頭。」
- **Placeholder**：`{blindSpotsDecadalNarrative}`，由穿透診斷 `sourcePalace` / `symptomPalace` 或 `recurringHomeworkNarrative` 組出。

### s19「行動策略」

- **改動**：保留「立刻可做／長期累積／避開折損」三項，但內容與當前大限＋今年同步，不再用通用 checklist。
- **樣例**：  
  - 立刻可做：（由 `yearDecisionSummaryBlock` 或預設「從今天起，先做一件對齊今年主線的小事……」）  
  - 長期累積：一年內，把力氣集中在與今年主線最相關的一兩個領域，其他先放著。  
  - 避開折損：主戰場在僕役宮，先把這裡穩住、再往外擴。
- **Placeholders**：`{s19ActionNow}`、`{s19LongTerm}`、`{s19Avoid}`，由 `actionNowLayers` 拆成三段填入。

### s20「三盤疊加診斷」

- **改動**：保留本命／大限／流年三層，但對這盤說話；若有診斷「官祿→夫妻」，直接點出關係承壓源自官祿壓力外溢。
- **樣例**：  
  - 本命：本命給你的，是在關係與互動裡的慣性——怎麼愛、怎麼疏離、怎麼防禦，早已寫在命盤主星與四化裡。  
  - 大限：大限在練的，是「僕役宮這十年的主線」；這十年關係場的考題，會具體落在人際、界線與誰能一起走。  
  - 流年／小限：今年流年與小限把焦點推到夫妻宮，你最有感的會是一對一關係與界線；關係承壓其實源自官祿壓力外溢到夫妻，很多表面摩擦是這條線被放大的結果。
- **Placeholders**：`{s20BenmingLine}`、`{s20DecadalLine}`、`{s20YearLine}`；`s20YearLine` 在有 rootCause 時改寫為「關係承壓其實源自 {sourcePalace} 壓力外溢到 {symptomPalace}」。

### s21「靈魂總結」

- **改動**：縮短，不再重複前面所有系統說明；真正收束為「這一生反覆在學什麼、現在這段時間要看懂什麼」。
- **樣例**：  
  - 你反覆在學的：（由 `recurringHomeworkNarrative` 收斂或預設「你反覆在學的，是命盤中反覆被引動的那幾課……」）  
  - 現在這段時間真正要看懂的：主戰場在僕役宮、今年是這十年裡的一個節點；先把界線站穩、壓力分清，再談放大。
- **Placeholders**：`{s21LifelongLesson}`、`{s21NowSee}`。

---

## 三、處理前後差異摘要

| 項目 | 處理前 | 處理後 |
|------|--------|--------|
| **s16** | 「本章已整合至 s15」+ 長段小限／流年說明 | 極短索引：心理濾鏡落宮、十年角色、一句建議 |
| **s17** | 「本章已整合至 s15」+ 附錄表格與統計 | 極短索引：今年在十年位置 + 關鍵年份見 s15 |
| **s18** | 通用「某些宮位星曜組合特別極端」+ 三點列舉 | 對當前時間軸：誤判／逃避／合理化，用診斷或 recurring 敘事 |
| **s19** | 通用 checklist（今天少做一件…、選一個宮位…） | 與 s15 同源：立刻可做／長期／避開折損，由 actionNowLayers 拆出 |
| **s20** | 規則說明（本命／大限／流年各是什麼）+ 以夫妻宮為例 | 對這盤：本命慣性、大限在練什麼、流年小限放大；有 rootCause 時寫出壓力外溢 |
| **s21** | 長篇「靈魂運算圖」與系統元素列舉 | 兩句收束：反覆在學什麼、現在要看懂什麼 |
| **語氣** | 多處「詳見 s15」「與四化疊加有關」「某些宮位」 | 先結論再原因再命盤線索，命書口吻，不重複系統文件句 |
| **程式** | decadal 僅 s15；year-role 僅 s15 | decadal 跑 s15–s21；year-role 與 yearly 跑 s15–s21；s18–s21 新增 blindSpotsDecadalNarrative、s19*、s20*、s21* 組裝 |

---

## 四、相關檔案

- **worker/src/lifeBookPrompts.ts**：`TIME_MODULE_SECTION_KEYS`、decadal 區塊擴為 s15–s21；recurringHomeworkNarrative 在 s15/s18 組版；keyYears 僅 s15；year-role 與 actionNowLayers 在 s15–s21；s18–s21 的 blindSpotsDecadalNarrative、s19ActionNow/LongTerm/Avoid、s20 三句、s21LifelongLesson/NowSee；timeModuleYearKeys 讓 s17–s21 也有 yearly 與 xiaoXianPalaceName。
- **worker/content/lifebookSection-zh-TW.json**：s16/s17 改為極短索引模板；s18–s21 改為單一 narrative 或三句，僅用上述 placeholders，behavior_pattern/blind_spots/strategic_advice 清空以維持一致讀感。
