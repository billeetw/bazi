# S22／S23 優化建議 → 實作對照

## 建議摘要與落地狀態

| # | 建議 | 實作 |
|---|------|------|
| 一 | **命盤人格層** `getPalacePersonality(palace)` | ✅ `worker/src/lifebook/lifeModel/palacePersonality.ts`：`getPalacePersonality(structure, scoreResult)` → `style`（五類）+ `styleLabel`（中文）+ `pattern`。S22 取**較弱一端**宮位；S23 取**來源宮**（`bridgePersonality`）。 |
| 二 | 結構分流：S22 短、S23 中、LifeSummary 最強一句 | ✅ S22 改短；S23 中等；`hitLine` 在技術版表頭呈現（S22 與（參考）同行；S23 獨立一行後接（參考）），正文不再重複「關鍵一句」。 |
| 三 | S22 砍掉長五段 | ✅ punchline + 少段 + 人格一句 + **給你的建議** + **長期對策**。 |
| 四 | S23 加「人格原因」 | ✅ `bridgePersonality` 接在反轉句之後，說明來源宮節奏與行為傾向。 |
| 五 | 每條線「關鍵一句」 | ✅ `HIT_LINE`（S22）、`FLOW_HIT`（S23）；並寫入 `StructureLine.hitLine` / `TransformationFlow.hitLine`。 |
| 六 | `synonymPool` 避免重複 | ✅ `narrativeSynonyms.ts`：`pickSynonym(lemma, seed)` **決定性**選詞（非 `Math.random`），同一盤可重現。 |
| 七 | 升級順序 | 已依序併入：人格 → S22 縮短 → 命中句 → 同義輪替。 |

## 與「真隨機」的取捨

產品若堅持 **每次開啟文案略有不同**，可把 `seed` 改為含 `chartId + Date` 或 session id；目前採 **穩定 seed** 以利測試與除錯。

## 後續可加

- 主星規則表擴充（更多星曜 × 宮類型 × 亮度的細緻 `pattern`）。
- 讀者版 UI 單獨凸顯 `hitLine`（大字／引用樣式）。
