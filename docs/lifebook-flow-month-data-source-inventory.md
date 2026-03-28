# 命書／流月資料來源盤點與收斂建議

> 產出日期：2026-03-07  
> 範圍：`worker/` 為主（compute、normalize、S17–S19、命書 inject、P2 findings）；不含前端長期快取實作細節（僅列風險）。  
> 原則：**先文件化與分級風險**；本輪**不**要求大規模重構命理核心。

---

## 1. 命書／流月相關多路徑清單

### A. 紫微資料主體位置

| 概念 | 可能來源路徑 | 目前讀取位置 | 別名／fallback | 建議唯一真相（SoT） | 風險 |
|------|----------------|----------------|----------------|---------------------|------|
| 紫微主體 | `chartJson.ziwei` | `normalizePalaces.ts`（`getStarByPalaceFromChart`、`buildPalaces`）、多數 normalize | **無** `features` 後備：僅認根節點 `ziwei` | **`chartJson.ziwei`**（命書／normalize 消費端） | **高**：若請求體僅含 `features.ziwei`、未先 flatten，星表／十二宮結構可能空或錯 |
| 紫微主體 | `chartJson.features?.ziwei` | `buildMonthlyFlowsForS19.ts`：`features?.ziwei?.monthlyHoroscope ?? ziwei?.monthlyHoroscope`；`buildS19MonthlyOutput.getMonthDisplay`：`features?.ziwei ?? ziwei` | 與根節點二選一 | **輸入兼容層**；進入命書主流程前應寫入 **`ziwei`** | 與上列不一致時，**流月讀得到、飛星用星表卻讀不到** |
| Flatten | `features.ziwei` → `ziwei` | `index.ts`（`life-book/generate-section`、`life-book/generate` 等）：若無 `ziwei` 則從 `features` 拷貝；並處理 `decadalLimits` 同步到根與 `ziwei` | 非全域：僅上述 API 路徑；`buildP2FindingsAndContext` 吃的是呼叫端傳入的 `chartJson` | **命書 API 入口**應保證與 `sanitizeLifebookRequestChartJson` 後圖一致 | 繞過命書 API、直接餵 `normalizeChart` 的測試／工具若未 flatten → **與線上行為不同** |

**結論（A）**：`compute/all` 正式輸出將紫微放在 `features.ziwei`（含 `monthlyHoroscope`、`decadalLimits`）。**normalize 與星表幾乎只認 `chartJson.ziwei` 與根上 `decadalLimits`**。命書 worker 已在多處 **手動 flatten**，但 **S19／getMonthDisplay 仍會讀 `features`**，形成「同一張盤、兩套入口」的認知負擔。

---

### B. 流月資料

| 概念 | 可能來源路徑 | 目前讀取位置 | 別名／fallback | 建議 SoT | 風險 |
|------|----------------|----------------|----------------|----------|------|
| 流月 payload 建置 | `iztro.horoscope(anchor).monthly` | `index.ts` → `buildMonthlyHoroscopePayload` | `anchor` 來自 `resolveFlowMonthSolarYmd(body, now)`（`flowMonthSolarDate` / `horoscopeAsOf` / 台北當日） | **`buildMonthlyHoroscopePayload` 產出之物件** 為 API 權威 | 與客戶端自行拼流月不一致時，以 **worker 輸出**為準 |
| 流月欄位名 | `monthlyHoroscope` | `features.ziwei.monthlyHoroscope`（compute 回傳） | — | **`monthlyHoroscope`** | — |
| 別名 | `monthly` | `getMonthDisplay`：`zObj?.monthlyHoroscope ?? zObj?.monthly` | 舊欄位兼容 | 正規化目標：**一律寫入 `monthlyHoroscope`** | 舊資料只寫 `monthly` 時，部分模組若未讀別名會漏 |
| 西曆錨點 | `solarYear` / `solarMonth` / `solarDay`、`solarTermSpan` | `buildMonthlyHoroscopePayload` 寫入；`getMonthDisplay` 優先讀 | 無 solar 時 → `resolveFlowMonthSolarYmd(chartJson, now)` + `buildFlowMonthSolarTermSpanZh`；再不行才斗數月序舊字串 | **與本次 `horoscope(anchor)` 同一組 y,m,d** | **標題與飛星錨點理論上應同源**；若 `monthlyHoroscope` 過期而標題用「今天」重算，可能 **標題 A、四化 B**（見下） |
| 流月四化飛星 | `stem`、`palace`（流月命宮）、`mutagenStars` | `buildMonthlyFlowsForS19` → `buildMonthlySihuaFlows`；資料自 `monthlyHoroscope` | `mutagenStars` 由 `iztro.monthly.mutagen` 經 `buildMutagenStarsFromHoroscopeMutagen` | **`monthlyHoroscope` 內 stem／palace／mutagenStars**（與該次 horoscope 一致） | **P0 級情境**：快取舊 `monthlyHoroscope` + 標題用新錨點 → 使用者看到月份對、飛星仍舊 |
| 請求錨點 | `flowMonthSolarDate`、`horoscopeAsOf` | `flowMonthContext.ts`；`buildMonthlyHoroscopePayload` 的 `body` 為 **compute 請求體** | 兩者皆 YYYY-MM-DD，前者優先 | **與 `/compute/*` 請求一併傳遞**；存入 `chart_json` 根節點才可讓 `getMonthDisplay` 在缺 solar 時對齊 | 命書若未把日期寫進 `chartJson`，`getMonthDisplay` 只能預設「今天」，與**當初算盤日**可能不同 |

**是否存在「標題用 A、飛星用 B」**  
**會。** 機制如下：

- **飛星**只依 `monthlyHoroscope`（+ `getStarByPalaceFromChart` 的本命星表）。
- **標題**優先 `monthlyHoroscope.solar*`，否則用 **`chartJson` 根上日期覆寫 + 現在時間**，再否則舊斗數月序字串。

因此：**API 已統一於單次 compute**；**儲存體／快照／客戶快取**若不同步，仍會分裂。

---

### C. 流年／大限

| 概念 | 可能來源路徑 | 目前讀取位置 | 別名／fallback | 建議 SoT | 風險 |
|------|----------------|----------------|----------------|----------|------|
| 大限表 | `chartJson.decadalLimits` | `normalizeChart` **僅根節點** | — | **根節點 `decadalLimits`（iztro）** | 僅在 `ziwei.decadalLimits`、未升到根 → **normalize 大限為空** |
| 大限表 | `ziwei.decadalLimits` | `palaceOverlay.ts`：`chartJson.decadalLimits ?? ziwei?.decadalLimits` | 與 normalize **不一致** | 命書 API 已嘗試同步到根與 `ziwei`（`index.ts`） | **normalize vs overlay** 來源規則不同 → **P1** |
| 流年 | `chartJson.yearlyHoroscope` | `normalizeChart`、`resolveYearlyHoroscope` | `nominalAge` vs `age` | **`yearlyHoroscope`（根）**，年齡欄位統一為 **`nominalAge`（並保留讀 `age`）** | 只在 `ziwei.yearlyHoroscope` 時，**normalize 的年齡／流年可能缺** |
| 流年 | `ziwei.yearlyHoroscope` | `palaceOverlay`、`timeModuleS17S19ReaderSnapshot`（年齡／年） | `snapshot`：`chartJson.yearlyHoroscope ?? ziwei?.yearlyHoroscope` | 與上併：**最終應 flatten 到根** | **P1：不同模組合併規則不同** |
| 流年命宮／干 | `chartJson.liunian` | `normalizeChart`、`palaceOverlay`：`chartJson.liunian ?? ziwei?.liunian` | overlay 有 ziwei 後備，normalize **僅根** | **根 `liunian`** | 同上 |
| 流年天干（敘事／公式） | `yearlyHoroscope.stem`、`liunian.stem` | `normalizeChart` yearStem 鏈；`lifeBookPrompts.ts` 多處 | 多處 **ft?.\***、`mutagenStars` 鏈 | **公式層以 normalize 寫入之 edges 為準**；文案 map 另有多源 | **P2**：敘事 placeholder 與公式邊緣偶發不一致 |
| 年齡 | `nominalAge`、`age` | `resolveCurrentTimeContext`、`timeModuleS17S19ReaderSnapshot` | `nominalAge ?? age` | **語意統一文件化**；輸入可兩者並存，**內部優先 `nominalAge`** | 僅填 `age` 的舊盤仍可用，但易與「虛歲」誤解混淆（產品文案問題） |

---

### D. 身宮／命身

| 概念 | 可能來源路徑 | 目前讀取位置 | 優先順序 | 建議 SoT | 風險 |
|------|----------------|----------------|----------|----------|------|
| 身宮宮名 | `chartJson.shenGong` | `normalizeChart.resolveShenGongSource` / 身宮欄位 | **先 `shenGong` 再 `bodyPalace`** | **`shenGong` 為主展示欄**；`bodyPalace` 兼容 | 上游若分別填兩者且不一致 → **P2** |
| 身宮宮名 | `chartJson.bodyPalace` | 同上 | 第二順位 | 兼容欄位 | 與上 |
| 身宮敘事（非宮名） | `bodyPalaceByHour`（content） | `index.ts` `getBodyPalaceInfo`、命書 config | 依時辰組合 key | **文案來自 content DB／靜態**；與命盤欄位分層 | **P2**：宮名來自 chart，長文來自 content，易混為「同一欄位」 |

---

### E. 命書內容與 fallback（非核心命理、但影響顯示）

| 概念 | 來源 | 讀取位置 | fallback | 風險 |
|------|------|-----------|------------|------|
| 章節文案／星宮釋義等 | D1（`getContentForLocale`） | `index.ts` | 靜態 JSON（log 標 `source=static (fallback)`） | **P2**：語系或部署差異導致「同盤不同句」；與斗數公式無關但影響讀者觀感 |
| KV 命書 model 等 | `CACHE` | `life-book/generate-section` | 預設 model | **P2** |

---

### F. 快取與快照

| 機制 | 位置 | 行為 | `chartJson` 更新後是否自動重算 | 風險 |
|------|------|------|--------------------------------|------|
| `timeModuleS17S19ReaderSnapshot` | `timeModuleS17S19ReaderSnapshot.ts`；於 `buildP2FindingsAndContext`（`index.ts`）建一次 | 內含 `palaceOverlayBlocks`、`s18SignalsBlocks`、`s19MonthlyBlocks`（**字串快照**） | **否**：同一請求內固定；跨請求若重跑 P2 則重算 | **P1**：若下層把舊快照與新 `chartJson` 拼在一起 → **底層新、畫面舊** |
| `getPlaceholderMapFromContext` | `lifeBookPrompts.ts` | `s17/s18/s19`：**有 `findings.timeModuleS17S19ReaderSnapshot` 則只貼快照，不重算 overlay／S19** | 依是否傳入新 `findings` | 與上相同 |
| `injectTimeModuleDataIntoSection` | `lifeBookPrompts.ts` | `mergeInjectP2TimeModuleS17S19Snapshot` 依章節覆寫 | 同上 | **P1** |
| 無 findings 相容路徑 | 同上 | 即場 `buildPalaceOverlay` + `buildS19MonthlyOutput` | 每次計算 | 與 P2 路徑行為不一致 → **P2**（除錯時以為「統一」） |

**圖 chartJson 更新、快照是否失效**  
快照**沒有內建版本號**；是否更新完全依賴呼叫端是否 **重新執行 `buildP2FindingsAndContext`** 並把新 `findings` 傳入模板解析。

---

## 2. 風險分級

### P0（可能導致 S19 月份／四化／標題不一致）

1. **舊 `monthlyHoroscope`（無 `solarYear/solarMonth` 或內容過期）** + **標題用 `resolveFlowMonthSolarYmd(chartJson, now)` 或「今天」**：飛星仍舊、標題像新。  
2. **僅 `features.ziwei`、未 flatten 的 `chartJson`** 進入 **`normalizeChart` / `getStarByPalaceFromChart`**：星表空 → 流月飛星建不出或錯（與 `monthlyHoroscope` 存在與否疊加時更難查）。

### P1（高機率造成不同章節或不同層讀到不同資料）

1. **`decadalLimits`：`normalizeChart` 只讀根** vs **`palaceOverlay` 讀根或 `ziwei`**。  
2. **`yearlyHoroscope` / `liunian`：normalize 多讀根** vs **overlay／snapshot 合併 `ziwei`**。  
3. **`timeModuleS17S19ReaderSnapshot` 字串快取** 與後續更新的 `chartJson` 未一併失效。  
4. **`lifeBookPrompts` 內大限／流年敘事** 與 `ft.*`、`mutagenStars` 多鏈來源（與 normalize 公式邊不完全同一入口）。

### P2（短期可接受，長期易混淆）

1. `monthly` vs `monthlyHoroscope` 別名。  
2. `age` vs `nominalAge`。  
3. `shenGong` vs `bodyPalace` 雙欄。  
4. D1 vs 靜態 JSON 文案 fallback。  
5. 有／無 P2 `findings` 兩條 placeholder 路徑行為差異。

---

## 3. 最小收斂方案（不重構整條命理核心）

### Level 1：文件化唯一真相（本文件 + 後續可摘一頁到 `docs/lifebook-content-convention.md` 或連結）

| 概念 | 建議 SoT（消費端） |
|------|---------------------|
| 紫微盤面與星表 | **`chartJson.ziwei`**（`features.ziwei` 僅作 **API 輸入**，進命書前必須 flatten） |
| 流月四化與流月命宮 | **`chartJson.ziwei.monthlyHoroscope`**（或 flatten 後與 `features` 同步之同一物件） |
| 流月西曆標題與節氣說明 | **與產生該次 `monthlyHoroscope` 的錨點一致**：優先 **`monthlyHoroscope.solarYear/solarMonth/solarTermSpan`**；請求級覆寫放在 **`chartJson.flowMonthSolarDate` / `horoscopeAsOf`** |
| 大限 | **`chartJson.decadalLimits`（iztro）**；並保證與 `ziwei.decadalLimits` 同步（若保留雙寫） |
| 流年上下文（年齡、流年宮、干） | **`chartJson.yearlyHoroscope` + `chartJson.liunian`（根）** |
| 身宮宮名 | **`shenGong` 優先**；`bodyPalace` 僅兼容 |

**顯示標題年月與飛星**：理想上 **禁止**「標題單獨用另一套日期、飛星仍讀舊 `monthlyHoroscope`」；若資料過舊，應 **整包重算** 或 **明確標註「流月資料可能過期」**（產品決策）。

### Level 2：normalize 前置收斂（建議實作層級與順位）

**最划算的一層**：在 **`sanitizeLifebookRequestChartJson` 之後、第一個 `normalizeChart` / `buildP2FindingsAndContext` 之前** 做單一函式（名稱可如 `canonicalizeChartJsonForLifebook`）：

1. 若存在 `features.ziwei` 且根無 `ziwei` → **淺拷貝到 `chartJson.ziwei`**（與現有 generate-section 邏輯對齊）。  
2. 若 `decadalLimits` 只在 `ziwei` → **升到根**（與現有片段對齊）。  
3. 可選：`monthly` → 複製為 `monthlyHoroscope`（若僅存在別名）。  
4. 可選：`yearlyHoroscope` / `liunian` 僅在 `ziwei` 時 → 升到根（讓 **normalize 與 overlay 同一來源**）。

**效益**：改一處，**normalize、palaceOverlay、S19、snapshot** 同吃一份形狀，P1 多項可降級。

### Level 3：舊快取與 snapshot 防呆

| 條件 | 建議 |
|------|------|
| `monthlyHoroscope` 缺 `solarYear`/`solarMonth` | 視為 **v1 流月 payload**；UI／log 可標「建議重算」；**不要**與「斗數月序」混同為西曆月。 |
| `chartJson` 內容變更（chartId、birth、或 `monthlyHoroscope` 欄位 hash） | **必須**重跑 `buildP2FindingsAndContext`，不可沿用舊 `timeModuleS17S19ReaderSnapshot`。 |
| 客戶端長期快取 `compute/all` | **不宜**長期持有舊 `monthlyHoroscope`；至少以 **日期或版本欄** 失效（例如與 `solarYear/solarMonth` 或 worker `meta.version` 綁定）。 |
| Snapshot 版本 | 可在 `LifebookFindings` 增 **`timeModuleSnapshotSchemaVersion`** 或 **`chartJsonHash`**；不符則忽略快照、改即場算（漸進、低風險）。 |

**已實作（2026-03-07）— 時間模組指紋**

- **`buildTimeModuleChartFingerprint(chartJson)`**（`worker/src/lifebook/timeModuleChartFingerprint.ts`）：依 `chartId`、`flowMonthSolarDate`／`horoscopeAsOf`、生日、`monthlyHoroscope`（含 solar／干支／宮）、`yearlyHoroscope`、`liunian`、`decadalLimits` 摘要組出決定性指紋。
- **`TimeModuleS17S19ReaderSnapshot.chartInputFingerprint`**：由 `buildTimeModuleS17S19ReaderSnapshot` 寫入。
- **過期則即場重算**：`getPlaceholderMapFromContext` 若指紋與當前 `chartJson` 不符，改走 overlay／S19 即場路徑；`mergeInjectP2TimeModuleS17S19Snapshot(map, snap, sectionKey, chartJson)` 傳入 `chartJson` 時，不符則不覆寫技術版三欄。
- **向後相容**：快照**無** `chartInputFingerprint`（舊資料）時不視為過期，行為與先前一致。

**客戶端快取建議（仍須產品／前端配合）**

- 快取 key 建議含：`chartId` + `monthlyHoroscope.solarYear/solarMonth/solarDay`（或 `flowMonthSolarDate`）+ 命書 API 版本字串。
- 隔日換月或使用者改流月錨點時應視為不同快取條目；勿只依「生日」當 key。

---

## 4. 計劃可行性結論

- **盤點與分級**：合理且已完成（本文件）。  
- **Level 2 已實作**（2026-03-07）：
  - **`worker/src/lifebook/canonicalizeChartJsonForLifebook.ts`**：`features` → 根 `ziwei`／`bazi`、`monthly` → `monthlyHoroscope`、`yearlyHoroscope`／`liunian` 自 `ziwei` 升級至根、大限表與 `ziwei.decadalLimits` 同步。
  - **選項** `emptyDecadalLimitsWhenNoIztro`：`life-book/generate` 設為 `true`（與舊行為「無 iztro 則 []」一致）；`generate-section`／`infer`／`ask`／`narrate` 用預設（無 iztro 時可保留根上大限或維持不寫入）。
  - **接入點**：`worker/src/index.ts` 於上述命書 API 在 `sanitizeLifebookRequestChartJson` 之後呼叫。
  - **測試**：`worker/tests/canonicalizeChartJsonForLifebook.test.ts`。

---

## 5. 關鍵檔案索引（便於實作時跳轉）

| 檔案 | 用途 |
|------|------|
| `worker/src/index.ts` | `buildMonthlyHoroscopePayload`、`buildP2FindingsAndContext`、`sanitizeLifebookRequestChartJson`、命書 flatten 片段 |
| `worker/src/flowMonthContext.ts` | `flowMonthSolarDate` / `horoscopeAsOf`、節氣區間 |
| `worker/src/lifebook/s19/buildS19MonthlyOutput.ts` | `getMonthDisplay` |
| `worker/src/lifebook/s19/buildMonthlyFlowsForS19.ts` | 流月飛星資料來源 |
| `worker/src/lifebook/normalize/normalizeChart.ts` | 大限／流年 normalize（根欄位假設） |
| `worker/src/lifebook/normalize/normalizePalaces.ts` | `getStarByPalaceFromChart`（僅 `ziwei`） |
| `worker/src/lifebook/palaceOverlay.ts` | 大限／流年 overlay（根與 `ziwei` 合併） |
| `worker/src/lifebook/timeModuleS17S19ReaderSnapshot.ts` | S17/S18/S19 快照建置與年齡來源 |
| `worker/src/lifebook/timeModuleChartFingerprint.ts` | 時間模組 chart 指紋、快照是否過期 |
| `worker/src/lifeBookPrompts.ts` | `getPlaceholderMapFromContext`、snapshot 優先 vs 即場算、inject |
