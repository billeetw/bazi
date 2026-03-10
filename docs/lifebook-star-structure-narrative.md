# 12 宮【星曜結構】諮詢式敘事 — 可行性與實作說明

## 一、做法可行性

**結論：可行，已實作。**

- **主星**：沿用既有 `baseMeaning`、`meaningInPalace`（本宮表現）、`actionAdvice`，產出完整段落，僅把標題改為【本宮表現】／【行動建議】，並不再用 `---` 分隔。
- **輔星／煞星／雜曜**：改為逐顆 1～2 句，句型為「{星名}在這一宮，代表……」「{星名}也在這裡，表示……」「{星名}在此宮，意味著……」；若無 `meaningInPalace` 則用 `baseMeaning` +「在這個領域會被感受到。」；煞星結尾可補一句挑戰提醒。
- **順序**：主星 → 輔星 → 煞星 → 雜曜（依白名單分類）。
- **無 `---`**：星與星之間以 `\n\n` 自然段落銜接。

實作位置：

- `worker/src/lifebook/starNarrativeForPalace.ts`：`buildStarNarrativeForPalace`、`buildPalaceStarNarrativeBlock`。
- `worker/src/lifeBookPrompts.ts`：12 宮章節（`isPalaceSection`）的 `palaceStarsOnlySnippet` 改為呼叫 `buildPalaceStarNarrativeBlock`。

---

## 二、目前缺哪些資料、你要補什麼

| 資料 | 用途 | 目前狀態 | 建議 |
|------|------|----------|------|
| **meaningInPalace**（星×宮） | 輔／煞／雜「在這一宮，代表……」的內容句 | 來自 `starPalacesMain` / `starPalaces` / `starPalacesAux`，key = `星名_宮名`（如 `台輔_官祿宮`） | 若某星在某宮沒有 key，會 fallback 成「{baseMeaning} 在這個領域會被感受到。」；若要每顆都有專屬敘事，請補齊 **starPalacesAux**（或 starPalacesMain）的 星_官祿、星_田宅 等條目。 |
| **baseMeaning**（星通用） | 主星段落首段 + 輔煞雜 fallback 句 | 主星來自 `starBaseCore`（14 主星）；輔煞雜多數來自 `content.stars[星名]` 或無則 fallback | 輔星／煞星／雜曜若要有較好 fallback，可補 **starBaseCore** 或 content 的 **stars**（星名→一句通用說明）。 |
| **actionAdvice**（星×宮） | 主星段落結尾【行動建議】 | 來自 `starPalacesAuxAction[星名_宮名]` | 僅主星會顯示；若希望主星有行動建議，請補對應 key。 |
| **煞星挑戰句** | 煞星結尾提醒 | 目前為引擎內建一句：「煞星在此宮可能帶來壓力或推動，需留意節奏與界線。」 | 若要做成依星或依宮不同，可改為從 content 讀取（例如 `starPalacesShaChallenge[星名_宮名]`）或擴充 starNarrativeForPalace 參數。 |

**你要補的優先順序建議：**

1. **官祿宮、田宅宮** 的輔星／煞星／雜曜：在 **starPalacesAux**（或既有 starPalaces）補 key `星名_官祿宮`、`星名_田宅宮`，內容為 1～2 句諮詢式敘事（例如「地位穩固，形象加分。」），避免只出現「在這個領域會被感受到。」。
2. 若希望 **雜曜** 也有通用一句：在 content 的 **stars** 或 **starBaseCore** 補星名→一句（雜曜目前多無 baseMeaning）。
3. 可選：**主星** 的【行動建議】若要有內容，補 **starPalacesAuxAction** 的 主星_官祿宮、主星_田宅宮 等。

---

## 三、處理前後輸出差異（官祿宮、田宅宮）

### 官祿宮（假設有主星 + 台輔 + 旬空）

**處理前（卡片式 + ---）：**

```
武曲（廟） 化權

剛毅與執行力，重成果與紀律。

【此宮表現】
在事業宮代表用實力與節奏建立地位，適合需要扛責與兌現的舞台。

【行動建議】
把權用在對的責任邊界，避免過度承擔。

---

台輔
地位穩固，形象加分。

---

旬空
（無 baseMeaning 時為空或僅星名）
```

**處理後（諮詢式、無 ---）：**

```
武曲（廟） 化權

剛毅與執行力，重成果與紀律。

【本宮表現】
在事業宮代表用實力與節奏建立地位，適合需要扛責與兌現的舞台。

【行動建議】
把權用在對的責任邊界，避免過度承擔。

台輔在這一宮，代表地位穩固，形象加分。

旬空也在這裡，表示（若無 meaningInPalace 且無 baseMeaning 則該星不輸出，或 fallback）在這個領域會被感受到。
```

### 田宅宮（假設有主星 + 煞星）

**處理前：**

```
天府（得）

穩定與累積，重視根基與安全感。

【此宮表現】
在田宅宮代表家庭與資產傾向穩健配置，不喜冒進。

---

火星（陷）
（內容若為「容易急躁、行動快」等）

【行動建議】
（若有）
```

**處理後：**

```
天府（得）

穩定與累積，重視根基與安全感。

【本宮表現】
在田宅宮代表家庭與資產傾向穩健配置，不喜冒進。

火星也在這裡，表示容易急躁、行動快。煞星在此宮可能帶來壓力或推動，需留意節奏與界線。
```

---

## 四、星曜分類與順序

- **主星**：紫微、天機、太陽、武曲、天同、廉貞、天府、太陰、貪狼、巨門、天相、天梁、七殺、破軍（14）。
- **輔星**：左輔、右弼、文昌、文曲、祿存、天馬、天魁、天鉞（8）。
- **煞星**：擎羊、陀羅、火星、鈴星、地空、地劫（6）。
- **雜曜**：其餘（如台輔、旬空、截路、三台、八座等，依 star-registry 或未列入主/輔/煞者）。

輸出順序：主星 → 輔星 → 煞星 → 雜曜；同一類內維持 chart 原序。

---

## 五、測試建議

1. 用一盤 **官祿宮** 有主星 + 至少一顆輔星或雜曜（如台輔）的命盤，對比【星曜結構】新舊輸出。
2. 用一盤 **田宅宮** 有主星 + 至少一顆煞星（如火星）的命盤，確認煞星句尾有「煞星在此宮可能……」且無 `---`。
3. 檢查無 `meaningInPalace` 的輔星／雜曜是否出現 fallback「在你的{context}中會被特別感受到。」；若需避免，請補 starPalacesAux 或 starBaseMeaning。

---

## 六、已接資料與後續要補

**已接上：**

- **starPalacesAux**：官祿宮（台輔、天壽、天月、紅鸞、空亡、地空）、田宅宮（台輔、旬空、截路、孤辰、天刑）已補諮詢式敘事。
- **starBaseMeaning**（`worker/content/starBaseMeaning-zh-TW.json`）：約 40 顆輔／煞／雜曜通用一句，fallback 用。
- **palaceContexts**（`worker/content/palaceContexts-zh-TW.json`）：12 宮語境短句；fallback 句為「{base}在你的{context}中會被特別感受到。」

**引擎優先順序**：1️⃣ starPalacesAux → 2️⃣ baseMeaning + palaceContext → 3️⃣ 無 baseMeaning 則不輸出。

**後續要補（其他星曜與宮位）：**

| 類型 | 檔案／key | 說明 |
|------|-----------|------|
| 其餘 10 宮 輔／煞／雜 | starPalacesAux-zh-TW.json，key `星名_宮短名`（如 `台輔_財帛`、`地空_夫妻`） | 每星 1～2 句諮詢式敘事，格式同官祿／田宅 |
| 更多雜曜 baseMeaning | starBaseMeaning-zh-TW.json 的 `starBaseMeaning` | 星名→一句，命盤會出現但尚未列入的星可補 |
| 主星【行動建議】 | starPalacesAuxAction，key `主星_宮短名` | 該宮主星段落才會有【行動建議】 |
