# 小限殘留清理清單（Xiaoxian Cleanup Checklist）

本輪僅建立清單，不改底層算法。後續可依此逐項清理型別、註解、prompt 文案、builder、section skeleton。

---

## 1. 型別（Types）

| 檔案 | 位置／內容 | 說明 |
|------|------------|------|
| `worker/src/lifebook/lifebookFindings.ts` | `MainBattlefield.reasons` 例 `["小限落宮", ...]` | 註解中的例子，可改為「流年落宮」等 |
| `worker/src/lifebook/lifebookFindings.ts` | `SpilloverFinding.layer?: "natal" \| "decade" \| "year" \| "xiaoxian"` | 型別仍含 xiaoxian |
| `worker/src/lifebook/lifebookFindings.ts` | `PalacePatternFinding.layer?: ... \| "xiaoxian"` | 型別仍含 xiaoxian |
| `worker/src/lifebook/findings/buildLifebookFindings.ts` | `BuildLifebookFindingsInput.minorFortuneByPalace?` | 輸入仍含 minorFortuneByPalace |
| `worker/src/lifebook/findings/buildTimeFindings.ts` | `BuildTimeFindingsInput.minorFortuneByPalace?` | 同上 |
| `worker/src/lifeBookPrompts.ts` | 介面中的 `minorFortuneByPalace?`、`minorFortuneSummary?`、`minorFortuneTriggers?` | 選項／config 仍含小限相關欄位 |

---

## 2. 註解（Comments）

| 檔案 | 位置／內容 | 說明 |
|------|------------|------|
| `worker/src/lifeBookPrompts.ts` | 約 1281 行：`成本命／大限／流年／小限的 SiHuaLayers` | 註解仍提小限 |
| `worker/src/lifeBookPrompts.ts` | 約 2384 行：`大限導讀／流年小限` | 註解仍提小限 |
| `worker/src/lifeBookPrompts.ts` | 約 4096 行：`流年宮位／四化仍由 chartJson 組裝並與小限分開` | 註解仍提小限 |
| `worker/src/lifebook/findings/buildLifebookFindings.ts` | 約 58 行：`overlap / minorFortune / birthYear 取自 chartJson` | 註解仍提 minorFortune |
| `worker/src/lifebook/normalize/normalizeTransforms.ts` | 約 74、95 行：`小限`、`小限層邊不產出` | 註解說明濾掉小限 |
| `worker/src/lifebook/engines/crossChart/crossChartEngine.ts` | 約 2 行：`果=流年/小限` | 註解仍提小限 |
| `worker/src/lifebook/engines/signals/keyYearEngine.ts` | 約 2、3、29 行：`小限落宮`、`minorFortuneByPalace` | 註解仍提小限 |
| `worker/src/lifebook/transformInterpretationEngine.ts` | 約 2 行：`大限／流年／小限／12宮` | 註解仍提小限 |
| `worker/src/lifebook/diagnosticTypes.ts` | 約 3 行：`layer 對應本命／大限／流年／小限` | 註解仍提小限 |
| `worker/src/lifebook/timeDecisionEngine.ts` | 約 2、134、199 行：`小限宮位`、`單年小限資料`、`小限時間軸` | 註解仍提小限 |
| `worker/src/index.ts` | 約 855、993 行：`小限（horoscope）`、`大限／小限／流年` | 註解仍提小限 |

---

## 3. Prompt 文案（Prompts）

| 檔案 | 位置／內容 | 說明 |
|------|------------|------|
| `worker/src/lifeBookPrompts.ts` | 約 4349 行：`可引用「各宮位小限年份與注意事項」` | prompt 仍提小限 |
| `worker/src/lifeBookPrompts.ts` | 約 4384 行：`各宮位小限年份與注意事項` | prompt 仍提小限 |
| `worker/src/lifeBookPrompts.ts` | 約 4392 行：`【小限疊宮統計摘要】` | prompt 仍提小限 |
| `worker/src/lifeBookPrompts.ts` | 約 4399 行：`當年小限 + 流年四化` | prompt 仍提小限 |
| `worker/src/lifeBookPrompts.ts` | 約 4407 行：`當前大限／當年小限／當年流年` | prompt 仍提小限 |
| `worker/src/lifeBookInfer.ts` | 約 16 行：`星曜、宮位、大限、小限、流年、五行、四化` | 系統 prompt 仍提小限 |
| `worker/src/lifeBookInfer.ts` | 約 29 行：`yearlyHoroscope：當年小限` | 說明仍提小限 |
| `worker/src/lifeBookInfer.ts` | 約 38 行：`evidence 區分流年＝外在事件、小限＝心理濾鏡` | s16 說明仍提小限 |
| `worker/src/lifeBookInfer.ts` | 約 39 行：`當年小限`、`本命→大限→流年→小限疊加` | s20 說明仍提小限 |

---

## 4. Builder / 邏輯（Builders）

| 檔案 | 位置／內容 | 說明 |
|------|------------|------|
| `worker/src/lifeBookPrompts.ts` | 約 826、849、3244、3305、3320、3331 行 | minorFortuneByPalace、minorFortuneTable、minorFortuneTimelineTable 等組裝 |
| `worker/src/lifeBookPrompts.ts` | 約 4348–4407 行 | prompt 組裝中依 minorFortuneByPalace、minorFortuneSummary、minorFortuneTriggers 推送小限相關字串 |
| `worker/src/lifebook/findings/buildLifebookFindings.ts` | 約 66、79、173 行 | 從 chartJson 讀 minorFortuneByPalace 並傳入 buildTimeFindings |
| `worker/src/lifebook/findings/buildTimeFindings.ts` | 約 42 行 | 將 minorFortuneByPalace 傳入 runKeyYearFromMinorFortune |
| `worker/src/lifebook/engines/signals/keyYearEngine.ts` | runKeyYearFromMinorFortune：依 minorFortuneByPalace 產 KeyYearFinding[]，narrative 含「該年小限落此宮」 | 關鍵年份仍依小限資料產出 |
| `worker/src/lifebook/findings/buildActionFindings.ts` | 約 116、118 行：`對照大限與小限，有意識分配精力。` | 行動建議文案仍提小限 |
| `worker/src/lifebook/timeDecisionEngine.ts` | 約 186、199 行及整份邏輯 | 決策／時間軸仍依小限相關資料與文案 |
| `worker/src/index.ts` | 約 1474–1475、1532、1809–1810、1867 行 | minorFortuneSummary、minorFortuneTriggers、minor_fortune_by_palace 等傳遞 |

---

## 5. Section Skeleton / 模板（Templates）

| 檔案 | 位置／內容 | 說明 |
|------|------------|------|
| `worker/content/lifebookSection-zh-TW.json` | s15a：`{minorFortuneTimelineTable}`、附錄「宮位年限與風險標示」 | s15a 仍使用小限時間軸 placeholder |

---

## 6. 其他專案檔（i18n / Demo）

| 檔案 | 位置／內容 | 說明 |
|------|------------|------|
| `data/i18n/zh-CN.json` | `feature2Body`: "大限、小限、流月讯号。" | 文案仍提小限 |
| `public/demo-lifebook.json` | structure_analysis 內「原命、大運、流年與小限疊加」 | 示範文案仍提小限 |

---

## 7. 測試與文件

| 檔案 | 位置／內容 | 說明 |
|------|------------|------|
| `worker/tests/lifeBookPrompts-module2.test.ts` | 註解：`s16 含流年命宮／流年四化（小限已移除）` | 僅註解，可保留或改寫為「無小限」 |

---

## 清理優先建議（僅供參考，本輪不實作）

- **型別**：將 `xiaoxian` 自 layer 聯合型別移除或標為 deprecated；`minorFortuneByPalace` 若不再使用可自 Input 移除。
- **註解**：將「小限」改為「流年」或刪除小限相關描述。
- **Prompt**：改寫為僅大限／流年，或移除小限專用區塊。
- **Builder**：keyYear 若改為僅依流年／大限，則 runKeyYearFromMinorFortune 可改為不依 minorFortuneByPalace；action 文案改為「對照大限與流年」。
- **Section**：s15a 可改為流年／大限時間軸或移除 minorFortuneTimelineTable placeholder。
