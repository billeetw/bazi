# 384 爻加權運算與進階解釋

> 依 Gemini 討論的「位、應、時、量」架構實作

---

## 資料結構

### `data/iching/lines-384.json`
- 64 卦 × 6 爻 = 384 爻
- 每爻：`yang`, `correct`, `resonance`, `base`, `mag`, `text`, `hint`
  - `text`：完整爻辭（來自 hexagrams.json）
  - `hint`：白話建議（節錄 + 解讀）
- **當位**：1,3,5 陽、2,4,6 陰 = +10，反之 -10
- **應與**：1-4, 2-5, 3-6 陰陽配 = +15，同性 -15

### 流年加權（2026 丙午火年）
| 卦宮五行 | 係數 | 說明 |
|----------|------|------|
| 火 | 1.2 | 比和，能量極強 |
| 土 | 1.3 | 火生土，最穩定 |
| 金 | 0.8 | 火剋金，高壓 |
| 木 | 0.9 | 木生火，洩氣 |
| 水 | 1.0 | 水火博弈 |

### 運算公式
```
Score = (base + correct + resonance) × yearWeight
```

---

## 384 爻參數（已補齊）

八宮 64 卦 384 爻已全部採用 Gemini 精修參數，涵蓋當位、應與、基礎分、量級與白話建議。

若要調整，可編輯 `scripts/build-lines-384.js` 的 `LINE_PARAMS`，再執行：

```bash
node scripts/build-lines-384.js
```

---

## 產品功能

1. **半年趨勢**：6 個月運勢條，動爻月標 ★
2. **動爻深度解析**：使用 lines-384 的 `hint` 白話建議
3. **分享文案**：一鍵複製 #人生說明書 模板

---

## 預警與追蹤文案（divinationReminders.js）

- **負分月預警**：當某月 score < 0，顯示「轉折月預警」卡片，採用 #深度貼文 風格
- **第 6 月專屬**：上爻物極必反，提醒「保持清醒比保持衝勁更重要」
- **動爻月專屬**：強調「關鍵轉折」與行動指南
- **進度反饋**：`getProgressFeedbackPrompt()` 供未來推播使用（動爻月結束後詢問）

---

## 互卦與變卦深度解釋

- **data/iching/hexagram-summaries.json**：64 卦卦辭白話 + 核心性格
- **js/calc/divinationInterpretation.js**：
  - `getMutualInterpretation()`：互卦 = 第 3–4 月轉型期、隱藏因果
  - `getTransformedInterpretation()`：變卦 = 第 6 月後定調、最終歸宿
- 五行特徵：金壓力、木洩氣、水博弈、火旺盛、土得助

---

## 後續可做

- 推播整合：將 `getNegativeMonthAlert` / `getProgressFeedbackPrompt` 接入後端排程
- 查看命盤引流：卦宮五行 vs 八字喜用神
- 情境切換：問事業／感情／財運的解釋語氣
