# 命書 S22／S23 規格（結構線 × 轉化流）

> **章節語意對照（定案）**  
> - **s22**＝**結構線**（對宮格局／平衡，無單向箭頭）  
> - **s23**＝**轉化流**（單向 A→B、轉化率／卡點）  
>
> 若口頭曾用「S21／S22」指格局／轉化，**程式 `section_key` 以本文為準**：**s22＝格局、s23＝轉化**。  
> 現有 **s21＝收束與總結**（`s21LifelongLesson` 等）**不佔用、不重定義**。

---

## 1. Section key 與定位

| Key | 產品定位 | 一句話 | 不吃什麼 |
|-----|----------|--------|----------|
| **s22** | **人生結構線**（對宮） | 「你**有多少**本錢／這個主題格局穩不穩、偏不偏」 | 單向轉化率、`from→to` 主敘事、流月 |
| **s23** | **人生轉化流**（體→用） | 「你**用出多少**—投入與結果是否成比例、卡在哪」 | 對宮「平衡／偏科」當主結論、僅用兩宮平均當轉化 |

**資料來源**：僅 **`normalizeChart` → `NormalizedChart`**，**不重寫 horoscope**、不新增命理引擎。Sprint 1 僅 **本命**層（`natal`）。

**實作順序（驗收）**：**先完成 s22，再完成 s23**（結構先打底，轉化共用 `getPalaceScore`）。

---

## 2. `PalaceStructure` 欄位對照（計分／判斷用）

來源型別：`worker/src/lifebook/normalizedChart.ts` — `PalaceStructure`。

| 欄位 | 用途（S22／S23 共用） |
|------|------------------------|
| `palace` | 對照十二宮 canonical 名（如 `財帛宮`） |
| `mainStars[]` | 主星與 **`brightness`（廟旺陷）** → 主星強度區間 |
| `assistantStars[]` | 吉星加權（左輔、右弼、昌曲、魁鉞等—與 normalize 分類一致） |
| `shaStars[]` | 煞星減分（擎羊、陀羅、火星、鈴星、地空、地劫、天刑、天傷—與 `normalizePalaces` 一致） |
| `miscStars[]` | Sprint 1 **可不計**或 **極輕量**，避免過擬合 |
| `natalTransformsIn[]` | **本命**飛入：粗調 ±（忌／祿權科） |
| `natalTransformsOut[]` | 可選：Sprint 1 僅當「宮內星自化」需展示時再用；計分以 **In 為主** 即可 |
| `leadMainStar` / `coLeadMainStars` | 可選：文案 tie-break，**不強制進公式** |

**注意**：API／內部型別若用 `wealth` / `career` 等 **slug**，須 **對照表** 映射到 **`財帛宮` / `官祿宮`** 等 canonical 中文宮名，與 `NormalizedChart.palaces[].palace` 一致。

---

## 3. `getPalaceScore` 規則（共用）

**函式意圖**：輸入單一 `PalaceStructure`，輸出 **單宮結構分 `score ∈ [1, 5]`**（可內部先算 `raw ∈ [0, 5]` 再 clamp）。

### 3.1 建議公式（Sprint 1 可測試版）

1. **主星基底** `baseMain`（0～2）  
   - 無主星（見 §6 空宮）：依 **v1 規則** 給固定或對宮衍生分，**不與「有星」混用同一套隱含假設**。  
   - 有主星：依每顆主星 **廟旺陷** 映射加總後壓縮到 0～2（例如：廟旺偏高、陷偏低；雙主星取平均或加總上限 2，需寫死表）。

2. **吉星** `+bonusAssist`（0～1.5）  
   - 每顆輔星固定小分，設 **上限 1.5**。

3. **煞星** `-penaltySha`（0～1.5）  
   - 每顆煞固定小分，設 **上限 1.5**。

4. **本命四化粗調** `mutagenNudge`（約 ±0.5）  
   - `natalTransformsIn` 中 **忌** 入本宮：`-0.5`（若多忌，Sprint 1 **只扣一次**或 **上限 -0.5**）。  
   - **祿／權／科** 入本宮：`+0.25` ～ `+0.5`（Sprint 1 **合計上限 +0.5**）。

5. **合成**  
   `raw = baseMain + bonusAssist - penaltySha + mutagenNudge`  
   `score = clamp(round(raw), 1, 5)`（或先 clamp 再 round，二選一寫死）。

### 3.2 與既有模組邊界

- **S18 `PalaceSignal.score`**：以 **四化流** 為主的「順／卡」場域分，**語意不同**，**不可直接當 `getPalaceScore`**。  
- **前端 `js/calc.js` 單宮分**：若未與 worker 共用，Sprint 1 **以 worker 本規格為準**，日後再抽共用。

### 3.3 測試要求

至少 **單元測試**：空宮 v1、單主星廟／陷、雙主星、多煞、單忌入宮。

---

## 4. s22（結構線）— `balanceType` 決策表

**輸出型別（概念）**：每條線含 `palaceA`、`palaceB`、`scoreA`、`scoreB`、`totalScore`、`gapScore`、`balanceType`、`summary`、`insight`。

- `totalScore = (scoreA + scoreB) / 2`（可 1 位小數再顯示）  
- `gapScore = abs(scoreA - scoreB)`

### 4.1 Sprint 1 三條線（對宮）

| `id` | 主題 | palaceA | palaceB |
|------|------|---------|---------|
| `wealth_happiness` | 財福線 | `財帛宮` | `福德宮` |
| `asset_storage` | 子田線 | `子女宮` | `田宅宮` |
| `career_relationship` | 官夫線 | `官祿宮` | `夫妻宮` |

### 4.2 `balanceType` 決策（優先序由上而下）

| 條件 | `balanceType` | 產品語感 |
|------|----------------|----------|
| `scoreA >= 3.5` **且** `scoreB >= 3.5` **且** `gapScore <= 1.0` | `balanced` | 兩端都夠力、落差不大，結構完整 |
| `scoreA < 2.5` **且** `scoreB < 2.5` **且** `totalScore < 2.5` | `weak` | 整條線底子偏弱，格局難自然成形 |
| **其餘** | `biased` | 一端明顯強於另一端，或單端未達 balanced 門檻 |

**邊界說明**：若僅一端 ≥3.5、另一端介於 2.0～3.4 → **一律 `biased`**，避免落入模糊區。

### 4.3 文案禁區（s22）

- 不出現 **轉化率**、`A→B` **效率**、`flowType`、`leaking`／`blocked` 等 **單向轉化語彙**（可一句話引用 s23「見下一章」除外）。

---

## 5. s23（轉化流）— `conversionRate` / `flowType` 決策表

**輸出型別（概念）**：`from`、`to`、`sourceScore`、`targetScore`、`conversionRate`（0～1 或 0～100%）、`flowType`、`summary`、`advice`。

### 5.1 Sprint 1 三條流（單向）

| `id` | 主題 | `from` | `to` |
|------|------|--------|------|
| `career_to_money` | 事業→收入 | `官祿宮` | `財帛宮` |
| `money_to_asset` | 現金→資產 | `財帛宮` | `田宅宮` |
| `mind_to_opportunity` | 內在→機會 | `福德宮` | `遷移宮` |

### 5.2 `conversionRate`（Sprint 1）

1. `sourceScore = getPalaceScore(fromPalace)`  
2. `targetScore = getPalaceScore(toPalace)`  
3. 若 `sourceScore < 1` → `conversionRate = 0`  
4. 否則 `conversionRate = targetScore / sourceScore`  
5. `conversionRate = min(conversionRate, 1)`  

### 5.3 輕量阻力修正（在分桶**前**套用）

| 條件 | 修正（可疊加，設上下限） |
|------|----------------------------|
| `to` 宮 `natalTransformsIn` 含 **忌** | `conversionRate -= 0.2` |
| `from` 宮 `natalTransformsIn` 含 **忌** | `conversionRate -= 0.1` |
| `to` 或 `from` **煞星**達門檻（如 ≥2） | `conversionRate -= 0.1`～`0.2` |
| `to` 或 `from` 有 **祿／權** 入宮（Sprint 1 粗） | `conversionRate += 0.1`（上限 cap） |

最後 **`conversionRate = clamp(conversionRate, 0, 1)`**。

### 5.4 `flowType` 決策表（依修正後 `conversionRate`）

| 條件 | `flowType` | 使用者感受 |
|------|------------|------------|
| `>= 0.8` | `smooth` | 很順 |
| `>= 0.5` 且 `< 0.8` | `stuck` | 有能力或基底，但轉成結果不順 |
| `>= 0.3` 且 `< 0.5` | `leaking` | 明顯耗損、成果不成比例 |
| `< 0.3` | `blocked` | 幾乎轉不動 |

### 5.5 文案禁區（s23）

- 不以 **兩宮平均** 當主結論；主軸永遠是 **`from` 投入 vs `to` 承接**。  
- 主標籤不用 **`balanced` / `biased` / `weak`**（那是 s22）。

---

## 6. 空宮 v1 規則

**定義**：該宮 `mainStars.length === 0`（以 normalize 後 `PalaceStructure` 為準）。

**v1（Sprint 1）建議**（二選一，實作選定後寫進 release note）：

| 策略 | 行為 | 優點 | 缺點 |
|------|------|------|------|
| **A（保守，預設）** | `baseMain` 固定 **0.5～1.0**，其餘仍算吉煞與四化 In | 簡單、可測、不偷借星假設 | 可能低估「借對宮」的盤 |
| **B（補償）** | 查 **對宮** `getPalaceScore(opposite)`，`baseMain = oppositeScore * k`（如 `k=0.35`）上限 2 | 較贴近部分流派「借星」體感 | 需與前端／iztro 是否已填星 **對齊說明**，避免雙重計算 |

**產品文案**：可在卡片角註 **「此宮無主星，分數為保守估算」**（可選）。

**禁止**：Sprint 1 在 worker 內 **另寫一套**與 `normalizePalaces` 無關的借星表而不寫入 spec。

---

## 7. 與現有 s20／s21 的邊界

| 章節 | 現況 | 與 s22／s23 關係 |
|------|------|------------------|
| **s20** | 時間模組一節（placeholder 偏夫妻／流年敘事等） | **不重用 key**；s22／s23 **不寫入** s20 欄位 |
| **s21** | **收束與總結**（`s21LifelongLesson`、`s21NowSee`） | **不重定義**；讀者動線上 s22→s23 可再接 s21 收束 |
| **s22** | **新增**：僅結構線 | 只回答格局／平衡／弱，**不搶** s18 疊宮、不搶 s17 逐宮正文 |
| **s23** | **新增**：僅轉化流 | 只回答單向效率，**不混** s22 的對宮平衡標籤 |

**時間軸**：s22／s23 Sprint 1 **不讀**大限／流年；未來 V2 可加「流年覆寫」另案。

---

## 8. Sprint 1 驗收案例（建議最少集）

實作順序：**先 s22，再 s23**。下列案例以 **人工或可重播 fixture** 建 `NormalizedChart`（或最小 `PalaceStructure` 對）做 **快照斷言**。

### 8.1 s22（結構線）

| # | 設定概要 | 預期 `balanceType`（示例方向） |
|---|----------|--------------------------------|
| S22-1 | 財帛／福德 皆高星＋廟、gap 小 | 財福線 `balanced` |
| S22-2 | 財帛高、福德低、gap 大 | 財福線 `biased` |
| S22-3 | 子田兩宮皆低、少星多煞 | 子田線 `weak` |
| S22-4 | 官祿強、夫妻極弱 | 官夫線 `biased` |

### 8.2 s23（轉化流）— 共用 `getPalaceScore`

| # | 設定概要 | 預期（示例方向） |
|---|----------|------------------|
| S23-1 | 官祿高、財帛更高、無忌 | `career_to_money` 高 `conversionRate` → `smooth` |
| S23-2 | 官祿高、財帛低 | `stuck` 或 `leaking`（依分數與修正） |
| S23-3 | 財帛高、田宅低、田宅化忌 | `money_to_asset` 修正後下降 → `blocked` 或 `leaking` |
| S23-4 | `sourceScore` 極低 | `conversionRate = 0`、`flowType` `blocked` |
| S23-5 | 空宮 v1 策略 A 或 B | 與 §6 一致，且不與 s22 同一張卡混語彙 |

### 8.3 文件／管線驗收

- [x] `SECTION_ORDER` 唯一來源：`worker/data/lifebook-section-order.json`（`npm run sync:section-order`）— 見 `docs/lifebook-section-order.md`  
- [ ] `sectionDataDependencyMap`（若適用）註明 s22／s23 依賴 `chartJson` / normalized only  
- [ ] 本 spec 與程式 `balanceType`／`flowType` 枚舉 **字串一致**  
- [x] 內容治理與產品定位：`docs/lifebook-content-governance.md`、`docs/lifebook-product-positioning.md`  
- [x] 敘事快照：`worker/tests/s22s23NarrativeSnapshot.test.ts`（`npm run verify:lifebook`）

---

## 9. 敘事輸出契約（生活化）

### 9.1 現行（v2：短敘事 + 人格層）

- **人格層**：`getPalacePersonality(palace, scoreResult)`（`palacePersonality.ts`）依主星＋強弱輸出 `style`（保守／控制／衝動／焦慮／策略）與一句行為素描，插入 S22／S23 內文。
- **S22**：**短 + 給你的建議**；表頭為 `【線名】副標` 後接 **`「hitLine」`與（參考：…）同一行**，正文 punchline 用 **行首空格 +「而是／是…」**；2～4 句畫面 + **人格參考**；**`insight` 前綴「長期對策：」**。不再使用長版五段 `【情境】…【行動】`。
- **S23**：**中等長度**：表頭 **`「hitLine」` 獨立一行**，下一行（參考：轉化率 …）；正文反轉句 + **人格原因**（`bridgePersonality`：「這跟你自己的特性有關——你帶一點「○○型」傾向：…」）+ 收尾；**`advice` 前綴「給你的建議：」**；`leaking` 且「事業→收入」時用「從你在『A→B』的狀態來看…」開頭；`stuck` 收尾依 flow 分流。
- **同義輪替**：`pickSynonym(lemma, seed)`（`narrativeSynonyms.ts`）以 **穩定 seed** 選詞，避免整篇重複「累積／結構／系統」；**非真隨機**，利於測試與重現。
- **技術版排版**：`formatTechnicalBlocks.ts` **不重複「命中句：」標籤**；`hitLine` 嵌入表頭（S22 與參考同行，S23 與參考分兩行）。

### 9.2 舊版（v1，已汰換）

- 長版五段標籤與純模板句為舊契約；快照見 `s22s23NarrativeSnapshot.test.ts` 更新後內容。

## 10. 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-03-23 | 初版：s22＝結構、s23＝轉化；實作順序先 s22 後 s23 |
| 2026-03-23 | **實作落地**：`worker/src/lifebook/lifeModel/` — `getPalaceScore`、`getStructureLines`、`getTransformationFlows`；單元測試 `worker/tests/lifeModelStructureFlow.test.ts`。`SECTION_ORDER` 順序為 `… s20, s22, s23, s21`。 |
| 2026-03-07 | **敘事升級**：S22／S23 改為因果＋未來＋行動模板；禁止空話；`formatTechnicalBlocks` 短標生活化。 |
| 2026-03-07 | **表頭與句型**：S22 `「命中」+（參考）` 同行；內文「給你的建議／長期對策」；S23 命中獨行；`bridgePersonality` 改「這跟你自己的特性有關」；事業→收入 `leaking` 命中句與主文句型更新。 |

## 11. 實作回報（借星／權重）

- **借星**：`normalizeChart`／`normalizePalaces` **未**把對宮主星複製進空宮；空宮仍為 `mainStars: []`。v1 採 **策略 A**，`baseMain = 0.75`，**不推導借星**。
- **權重**：主星亮度點數、吉煞每顆固定分、四化 ± 為 **工程預設**；若產品要調手感，可只改 `palaceScore.ts` 常數表。
- **`sourceScore === 0`**：整數 `score` 恒為 **1–5**；s23 用 **`raw < 1`** 時 `conversionRate = 0` 對應「源頭極弱」。
