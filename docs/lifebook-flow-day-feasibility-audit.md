# Flow-Day（流日）可行性盤點 — Feasibility Audit Checklist

**目的**：在承諾「Timeline 首頁／今日關鍵」前，盤點 **紫微流日（iztro `horoscope.daily`）** 與 **日柱（四柱之日干支）** 兩條路，並依盤點結果決定是否進 P0。  
**產品核心判斷**：能不能讓「今天」每天都講得通、可對帳、可降級 — 不只是「能不能算」。

**盤點日期**：2026-03-28（repo + 本機 runtime 抽樣）  
**iztro 版本**：worker 依賴 `iztro@^2.5.0`（見 `worker/package.json`）

---

## 產品共識決策（已拍板 · 2026-03-28）

以下為團隊共識，作為後續工程與內容的**單一依據**；**不趕時程**，以可長期維護、可對使用者負責為優先。

### 1️⃣ `timezone_strategy`

| 項目 | 決策 |
|------|------|
| **原則** | 以 **使用者本地時區（client / IANA）** 為準。 |
| **理由** | 符合「今天」直覺；不在 server 側猜測時區；快取與 API 可帶明確時區，便於除錯與 deterministic。 |
| **實作提示** | `day_key` 應與「該時區下的日曆日」一致；請求 body 或 query 帶 `timeZone`（或等價欄位）；**cache key** 必含 **`chart` + `day_key` + `timeIndex` + `timeZone`**。 |

### 2️⃣ 紫微流日為主、管線優先

| 項目 | 決策 |
|------|------|
| **一致性** | 以 **紫微 `horoscope.daily`（流日）** 作為「今日」斗數語境的**主軸**，與現有命書／宮位／GongGan 敘事對齊。 |
| **上線節奏** | **產品管線（DayContract、可解釋 anchors、降級）完成後**，才將流日提升為 **主訊息**；**先有能力講清楚，再談命理能力外顯**。 |
| **日柱** | 僅作必要時的 **保底／輔助**，且須與紫微流日 **語境分離**（避免混源）。 |

### 3️⃣ Timeline 視覺與資訊層級（day vs month）

| 層級 | 角色 | 說明 |
|------|------|------|
| **主視覺** | **Decision Task** | 「你現在該做什麼」— 行動與 CTA 核心。 |
| **輔助** | **今日（語感）** | 強語氣、可行動的一句／短區塊；不搶任務主位。 |
| **底層穩定** | **流月** | 提供連續性與背景，避免「每天像亂跳」。 |

### 4️⃣ 子時與「今日」`day_key`（技術拍板 · 與出生排盤分流）

| 區分 | 規則 | 備註 |
|------|------|------|
| **出生排盤 — 子時歸日** | **晚子**（23:00–24:00）歸**次日**、**早子**（00:00–01:00）歸**本日** | 與主站 `js/ui.js` → `compute/all` 一致；**僅**影響盤的年月日，**不**用來定義「今日流日」 |
| **流日／Timeline／KV／`time_context.day_key`** | **民曆日曆日**：在 **client IANA** 下以 `Intl` 求得之 **YYYY-MM-DD**（**不**套用晚子換日） | 與「牆上今天」一致；**23:59 仍屬同一 `day_key`**，避免與四柱換日混談 |
| **未來 `horoscope(anchorDate, timeIndex)`（dailyFlows）** | **錨點西曆日** = 上列 **同一 `day_key`**；**`timeIndex`（0–11）** 由**當地本地時鐘**所屬**十二時辰**推導 | **不**套用出生晚子規則；deterministic 輸入 = `chart` + `day_key` + `timeIndex` + `timeZone`（與 §1 cache 提示一致） |
| **農曆日界／日柱一句** | 若產品要顯示 **八字日干支** 或農曆日，**另開管線與標籤**，與紫微流日 **語境分離**（見 §十） | 避免與 `civil_client_tz` 的 `day_key` 混成同一個「今天」 |

**結論**：**先拍板本節**，再實作 **dailyFlows**；子時換日規則在「排盤」與「流日錨點」兩條線 **刻意分流**，契約才可 deterministic、UX 才可解釋。

**原則**：按部就班、不犧牲品質；以**可傳世、有長期價值**的產品為第一要務。

---

## 1️⃣ 命理可行性（Reality Check）

### 問題：iztro 是否提供流日命宮、流日四化、與本命／流年／流月的關係？

| 項目 | 結論 | 證據 |
|------|------|------|
| **daily palace（流日命宮所落宮名，命盤宮序）** | **可推得，但與流月同一規則**：須用 **`earthlyBranch` + `buildPalaceByBranch(命宮地支)`**，**不可**直接用 `palaceNames[index]`（與流月文件一致）。 | 文件：[`docs/lifebook-monthly-iztro-mapping.md`](lifebook-monthly-iztro-mapping.md)（流日 key 為 `daily`）；實作參考：`worker/src/index.ts` 之 `buildMonthlyHoroscopePayload`（`monthly` 分支）。 |
| **daily transformations（流日四化星名）** | **有**：`horoscope.daily.mutagen` 為長度 4 的星名陣列（祿權科忌順序）。 | Runtime 抽樣（`astro.bySolar(...).horoscope(new Date('2026-3-28'), 0).daily.mutagen`）可得。 |
| **流日流曜** | **有**：`horoscope.daily.stars`（十二宮陣列，與 monthly 結構類似）。 | 同上，`daily.stars` 存在。 |
| **與本命／流年／流月交互** | **庫有各層 `horoscope`**；**本 repo 未建「日層 GongGan / overlap」管線**。流年／流月與飛星已有慣例（見 `worker/src/gonggan-flows.ts`，`GongGanFlow.layer` 目前含 `month`，**不含 `day`**）。 | `grep` worker：`horoscope` 多用於 `decadal` / `yearly` / `monthly`；**無** `horoscope.daily` 的正式 payload 輸出。 |

### 呼叫型態

| 方式 | 說明 |
|------|------|
| **可直接呼叫** | `astrolabe.horoscope(targetDate, timeIndex)` 回傳物件含 **`daily`**（與 `monthly`、`yearly` 並列）。 |
| **需自行組合** | **流日命宮（命盤宮序）**、**宮干飛化邊（若要做與 S19 流月同級的敘事）** 須依現有 **流月模式** 補 adapter +（建議）擴充 `GongGanFlow.layer` 或平行型別。 |
| **不完整／不穩** | 本 repo **尚未**對 `daily` 做完整性檢查（對照 `monthlyHoroscopeCompleteness`）。需在接入前對 `daily` 做同樣欄位檢查與缺欄降級。 |

### 與「日柱」的區分（避免混談）

| 來源 | 意義（本 repo） |
|------|-----------------|
| **`rawDates.chineseDate.daily` / lunar-lite 日干支** | 四柱之**日柱**，用於八字顯示等（見 `worker/src/index.ts` 組 `bazi.display`）。 |
| **`horoscope.daily`** | 紫微**流日運限**（日干支、流日四化、流日流曜）。 |

→ **產品上「流日 Flow-Day」若指紫微日層，應以 `horoscope.daily` 為準；若指「今日干支一句」，可用日柱，兩者敘事與解釋路徑不同。**

**本節小結（盤點色）**：命理可行性 **🟡 偏綠** — iztro **有** `daily` 且結構完整；**缺口**在 **本 repo 尚未產品化、未接 GongGan 日層、未寫入 chart 契約**。

---

## 2️⃣ 資料契約（DayContract）

### Appendix A（凍結 · `DayContractV1`）

工程型別與驗證：`worker/src/lifebook/dailyFlow.ts` 之 **`DayContractV1`**、`validateDayContractV1`。欄位：

| 欄位 | 說明 |
|------|------|
| `day_key` | `YYYY-MM-DD`（民曆、client 時區） |
| `time_zone` | IANA |
| `time_index` | 0–11（與 `horoscope` 第二參數一致） |
| `palace` | 流日命宮（繁體宮名）或降級時之流月宮等；可 `null` |
| `flows` | 日層宮干飛化（現階段可 `[]`，待 GongGan 日層） |
| `signals` | 產品短句 |
| `anchors` | 機讀錨點 |
| `surface_label_key` | `zwds_daily` \| `bazi_day` \| `monthly`（**唯一驅動標題**） |
| `surface_label` | 必須等於 `surfaceLabelZh(surface_label_key)`（`shared/dayContractSurface.ts`） |
| `is_fallback` | 是否走 §八 降級 |
| `fallback_tier` | 可選：`bazi_day` \| `monthly` |
| `fallback_reason` | 可選：`daily_incomplete` \| `no_destiny_palace` \| `parse_failed` \| `monthly_only`（telemetry／排錯） |
| `missing` | 可選：缺欄列表（debug） |

### 建議形狀（草案 · 與 Appendix A 合併後之抽象）

```ts
type DayContract = {
  day_key: string;           // 建議：YYYY-MM-DD（與時區策略一致後再凍結）
  palace: string;            // 流日命宮（繁體、命盤宮序，與流月 palace 同規範）
  flows: FlowEdge[];          // 與 NormalizedChart / GongGan 邊一致之型別；日層需先定 layer: "day" | 獨立型別
  signals: string[];         // 產品可讀短句（每句需可回溯 anchors）
  anchors: string[];          // 例如：palaceId、flow id、chart path、或「巨門化忌入財帛」等機讀錨點
};
```

### 產品標籤（語境牆 · Fallback Labeling · 已拍板）

凡**非**紫微流日主線之內容，UI 必須帶專屬標籤，避免使用者以八字判詞對照紫微星盤：

| 情境 | 標籤文案 |
|------|----------|
| 紫微流日（`horoscope.daily`）成功、可作為「今日」主語境 | **今日紫微** |
| 降級至日柱／八字日干支一句 | **今日氣運（八字）** |
| 降級至流月摘要 | **本月提醒** |

**標題綁定（必守）**：唯一真相在 **`shared/dayContractSurface.ts`**。`surface_label_key` 僅能為 `zwds_daily` \| `bazi_day` \| `monthly`；**顯示文案**必須等於 `surfaceLabelZh(surface_label_key)`，禁止前端自造標題。Viewer 自 `flowDaySurfaceLabels.ts` 再匯出。

### 附錄：`timeIndex` 與本地 24 小時制對照（凍結）

**唯一實作與映射版本**：`shared/iztroTimeIndex.ts`（`clockHourToTimeIndex`、`IZTRO_TIME_INDEX_MAPPING_VERSION`）。Worker `compute/all`、`dailyFlow`、Viewer 皆由此匯入，禁止複製公式。

與 iztro `horoscope(anchorDate, timeIndex)` 之 **`timeIndex`（0–11）** 一致；**本地時鐘**指 **client IANA 時區**下之時分（**DST 當日仍依轉換後之本地 wall clock slot 映射**）。

| `timeIndex` | 時辰 | 本地時間（左閉右開） |
|-------------|------|----------------------|
| 0 | 子 | 23:00–24:00 **與** 00:00–01:00 |
| 1 | 丑 | 01:00–03:00 |
| 2 | 寅 | 03:00–05:00 |
| 3 | 卯 | 05:00–07:00 |
| 4 | 辰 | 07:00–09:00 |
| 5 | 巳 | 09:00–11:00 |
| 6 | 午 | 11:00–13:00 |
| 7 | 未 | 13:00–15:00 |
| 8 | 申 | 15:00–17:00 |
| 9 | 酉 | 17:00–19:00 |
| 10 | 戌 | 19:00–21:00 |
| 11 | 亥 | 21:00–23:00 |

**邊界（§4）**：**23:00–23:59** 為子時（`timeIndex === 0`），但 **`anchorDate`／`day_key` 仍為當日民曆日**（不套用四柱「晚子歸次日」）。Viewer 自 `timeIndexFromWallClockInTimeZone` 讀本地時再呼叫 `clockHourToTimeIndex`（見 `shared/iztroTimeIndex.ts`）。

### 檢查結果

| 檢查項 | 結論 |
|--------|------|
| **能否穩定產出** | **可**，前提是：錨點日期 + `timeIndex` + 命盤與流月同一套 `palaceByBranch` 規則；並對 `daily` 做缺欄處理。 |
| **與 `NormalizedChart.flows` 相容** | **需擴充**：現有邊多為 natal / decade / year / month；日層要嘛新增 **layer `day`**，要嘛獨立 `dailyFlows` 再於 UI 合併，**需明確決策避免混源**（對齊 ADR 精神）。 |
| **Viewer 可解釋** | **條件式**：若 flows 與 anchors 由 **同一管線**（GongGan + 本命 starsByPalace）產出，可對到章節；若僅文案拼貼則 **否**。 |

**本節小結**：契約 **🟡** — **可定**，但需 **工程凍結**（layer 名稱、與 month/year 合併規則、anchors 格式）。

---

## 3️⃣ 工程複雜度（Complexity）

| 評級 | 條件 | 本 repo 現狀 |
|------|------|----------------|
| **低** | 直接轉發 iztro `daily` JSON、不做飛星與宮名修正 | 可行但不建議單獨作「首頁主訊號」（可解釋性弱）。 |
| **中** | 對齊流月：`buildDailyHoroscopePayload`（類 `buildMonthlyHoroscopePayload`）+ `palaceByBranch` + mutagenStars + 完整性檢查 | **合理 P0 技術形態**（若產品接受「日層敘事對齊流月管線」）。 |
| **高** | 日層與流年／流月 **疊加規則**、與 overlap / findings 全面對齊、大量邊界案例 | 若首頁要「命理上疊加所有層」且一次到位 → **偏 P1**。 |

### 預估（粗估，待排期會再細拆）

| 項目 | 預估值 |
|------|--------|
| **estimated files touched** | `worker/src/index.ts`（或抽出 `buildDailyHoroscopePayload`）、`worker/src/gonggan-flows.ts`（layer 擴充或日層專用 builder）、`worker/src/flowMonthContext.ts` 類比之 **`flowDayContext.ts`**、`worker/src/lifebook/normalizedChart.ts`（若納入 flows）、`canonicalizeChartJsonForLifebook`（若寫入 `features.ziwei.dailyHoroscope`）、前端 `buildHomeSummaryFromDocument` / Timeline 元件、**新增 vitest**。 |
| **estimated days** | **中複雜度管線**：約 **5–10 人日**（含測試與文件）；若加上「與 year/month 優先級、衝突策略」全實作與 E2E，**10–15 人日** 量級。 |

**本節小結**：**🟡 中**（在「複用流月模式、不一次做疊宮全解」前提下）。

---

## 4️⃣ 成本與效能（Performance）

| 檢查項 | 建議 |
|--------|------|
| **可 cache** | **可**。建議 key：**命盤 fingerprint（或 chart id） + `day_key` + `timeIndex` + `timezone_id`（若影響錨點日）**。 |
| **是否每次重算** | 同一使用者同一天多次開啟 → **應命中快取**；除非「現在」跨日切換。 |
| **時區** | **已拍板**：以 **使用者本地時區** 定義「今天」與 `day_key`（見本檔「產品共識決策」）。既有 `flowMonthContext` 若以台北為預設，接流日時需 **逐步對齊** client 時區策略，避免流月／流日錨點不一致。 |
| **Worker CPU** | 單次 `horoscope(date)` 與現有 compute 相比為**同一量級**；若**每請求**對 365 天預算則會炸 — **禁止**。 |

**必填欄位（建議值）**

| 欄位 | 建議 |
|------|------|
| **cache_strategy** | `KV` 或 edge cache：**key = hash(chartFingerprint + day_key + timeIndex + timeZone)`**，TTL 24–48h；跨日自動失效。 |
| **timezone_strategy** | **已拍板**：**client 本地時區（IANA）**；請求帶入時區，**不得**依賴 server 猜測使用者所在地。 |

### KV 鍵規格（已定稿 · 本版實作）

| 用途 | 函式（Worker） | 鍵形（概念） |
|------|----------------|--------------|
| **單章 generate-section** | `lifebookSectionCacheKey` | `lb:sec:v{LIFEBOOK_CACHE_ALG_VERSION}:{fingerprint}:{sectionKey}:{sanitizedTz}:{day_key}` |
| **日層流日**（`horoscope.daily` 等） | `lifebookDailyHoroscopeCacheKey` | `lb:daily:v{LIFEBOOK_DAILY_CACHE_ALG_VERSION}:{fingerprint}:{sanitizedTz}:{day_key}:ti{00-11}:idxmap{IZTRO_TIME_INDEX_MAPPING_VERSION}` |

- **必含欄位**：`fingerprint`、**IANA 時區**、**民曆 `day_key`**；日層輸出隨**時辰**變動時必含 **`timeIndex`（0–11）**。  
- **版本號**：`LIFEBOOK_CACHE_ALG_VERSION`（整包／單章）、`LIFEBOOK_DAILY_CACHE_ALG_VERSION`（日層管線）、`idxmap` 與 `shared/iztroTimeIndex.ts` 之 **`IZTRO_TIME_INDEX_MAPPING_VERSION`** 同步 bump（映射表變更）。**iztro 套件大版本升級**時應 bump `LIFEBOOK_DAILY_CACHE_ALG_VERSION` 或另加鍵欄位，避免吃到舊快取。

**本節小結**：**🟢** 可設計得省；**紅線**是時區與 `day_key` 未定就寫前端。

---

## 5️⃣ 可解釋性（Explainability）

| 規則 | 結論 |
|------|------|
| **每個 signal 能否對應 flows / palace** | **若** signal 由 **GongGan + 流日命宮 + mutagen** 規則產生 → **可以**。 |
| **能否在 Viewer 找到證據** | **若** Viewer 章節依同一 `chart_json` 與錨點，且導流連到帶 `palace` / `section` 的 deep link → **可以**；否則僅能當「軟提示」。 |

**若不能**：依你方規則 → **不可用於 Timeline 主訊號**（可作次要列或「參考」）。

**本節小結**：**🟡** — 完全可解釋需 **補齊日層飛星／敘事管線**，不是只顯示 `daily.mutagen` 四個星名。

---

## 6️⃣ 與現有時間層關係（day vs month vs year）

| 必填欄位 | **已拍板（2026-03-28）** |
|----------|---------------------------|
| **priority_order（首屏敘事）** | **主視覺 = Decision Task**；**輔助 = 今日語感**（紫微流日管線就緒後）；**底層穩定 = 流月**。時間堆疊上仍可依命理慣例 **流年 → 流月 → 流日** 作後端／解釋順序，**不與「誰站 C 位」混淆**。 |
| **conflict_strategy** | **建議維持**：不允許兩套互相否定的判詞並列為同級主標；若日／月衝突 → **降級／標「參考」**；telemetry 可記 `conflict_resolved`。 |

**本節小結**：**🟢** — 與「產品共識決策」一致；工程需落實 **Decision Task 置頂** 與 **今日／流月層級**。

---

## 7️⃣ 一致性（Deterministic）

| 問題 | 結論 |
|------|------|
| **same user + same `day_key` → deterministic?** | **在相同輸入下應為 YES**：同一 `chart_json`、同一錨點西曆日、同一 `timeIndex`、同一 iztro 版本 → `horoscope.daily` 應一致。 |
| **風險** | **時區／跨日邊界**、**快取舊結果**、**iztro 升級** → 需在測試中固定種子日期與版本。 |

**必填**：`deterministic: **YES**（條件式：錨點與時區政策固定）`

---

## 8️⃣ 降級策略（Fallback）

| 情境 | **fallback_strategy**（建議） |
|------|------------------------------|
| `daily` 缺欄或完整性檢查失敗 | 不顯示紫微流日主句 → 改 **流月摘要一句** 或 **流年** 或 **僅 Decision Task**。 |
| 無法算 GongGan 日層 | 僅顯示 **mutagen 星名列表**（弱解釋）或 **不顯示**。 |
| 產品選擇「日柱一句」保底 | 使用 **四柱日干支**（已有 bazi 路徑）產出**與紫微無關**的短句，**明確標示「非紫微流日」**，避免混源。 |

**必填**：`fallback_strategy: **tiered** — daily 完整 → daily 弱 → monthly → decision task only`（可再細化）

---

## 九、盤點後決策規則（寫死）

| 燈號 | 條件 | 結論 |
|------|------|------|
| 🟢 | 命理可行（本 repo：**可接到 iztro daily**）+ 契約可定 + 可解釋（**需完成日層管線**）+ 複雜度低～中 | **流日可進 P0**（建議與 **Decision Task** 並列，時程要實打估）。 |
| 🟡 | 可算但可解釋弱 **或** 複雜度高（疊層、全 Viewer 對齊） | **流日 → P1**；**P0 用 fallback signal**（流月／任務／日柱保底擇一）。 |
| 🔴 | 無法穩定算、無契約、或不可解釋 | **P0 不做流日**；首頁改以非日層策略驗 habit。 |

**本次盤點粗判**：**🟡（偏 🟢）** — iztro **已具備 daily**；**repo 缺口**在 **產品化管線與契約**。**建議**：**P0 可先上「錨點 + Decision Task + 流月／流年一句」**；**紫微流日進 P0 需再排「日層 GongGan + DayContract + 時區政策」閉環**（約中複雜度）。

---

## 十、紫微流日 vs 日柱顯示（供決策）

| 維度 | **紫微 `horoscope.daily`** | **日柱（四柱日干支）** |
|------|---------------------------|-------------------------|
| 命理語境 | 斗數流日命宮、流日四化、流曜 | 八字日柱 |
| 與現有命書 | 可對齊 GongGan / palace / Viewer | 多走 bazi 顯示，與紫微章節 **另一套敘事** |
| 工程 | 中（類流月管線） | 低（已部分有 display） |
| 首頁「決策感」 | 高（若做飛星 + 任務） | 中（偏一句運勢，易流於泛） |

**建議決策順序**：先依本文件 **🟢/🟡/🔴** 決定「流日做不做進 P0」；若 **🟡**，再選 **日柱保底** 是否足夠支撐「每天一句」直到紫微流日就緒。

---

## 十一、附錄：Runtime 證據摘要（抽樣）

- **環境**：`node` + `require('iztro')` + `astro.bySolar('2000-5-15', 0, '男')`。  
- **`horoscope(new Date('2026-3-28'), 0)`**  
  - `horoscope` 頂層 keys 含：`decadal`, `yearly`, `monthly`, **`daily`**, `hourly` 等。  
  - `daily` 含：`index`, `name`, `heavenlyStem`, `earthlyBranch`, `palaceNames`, `mutagen`, `stars`。  
  - 範例 `mutagen`：`["巨门","太阳","文曲","文昌"]`（實際依日期與命盤而變）。

（完整 JSON 請在開發機執行同段腳本重現；**勿**將此檔當作命理結論依據。）

---

## 十二、下一步（共識後）

1. ~~產品拍板：時區、`day_key`、day vs month 主視覺~~ → **已見「產品共識決策」**。~~子時 vs 流日錨點~~ → **已見 §4「子時與今日 day_key」**。剩餘細節：與既有 `flowMonthContext` **時區對齊**、**DayContract** 欄位凍結。  
2. **紫微流日主訊息**：待 **完整管線 + 可解釋** 後再上；此前 **Decision Task + 流月底層 + 今日語感（fallback）** 按部就班。  
3. 開發 **DayContract**／**dailyFlows** 時：PR 附 **touched files + 測試 + 快取 key 含 timeZone + `day_key`**；telemetry 帶 **`time_context`**（含 `day_key_mode` / `timezone_source`）。

---

## 十三、上線門檻檢核（A 契約 / B UX / C 邊界）

| 類別 | 項目 | 上線前須滿足 |
|------|------|----------------|
| **A 契約** | **timezone source** | 請求帶 **IANA**；回應 `time_context.timezone_source` 標示 `client_iana` 或 `fallback_utc` |
| **A** | **deterministic** | 相同 `chart` + **`day_key` + `timeIndex`（日層）+ `timeZone` + iztro 版本** → 相同 `horoscope.daily` 輸出（測試固定種子） |
| **A** | **cache key** | 已含 **fingerprint + section + `timeZone` + `day_key`**（`generate-section`）；日層全量快取另含 **`timeIndex`** |
| **A** | **fallback labeling** | API 層 **`day_key_mode: civil_client_tz`**；若用日柱／非紫微流日保底，UI **顯式標籤**（見上「產品標籤」表；程式：`flowDaySurfaceLabels.ts`） |
| **B UX** | **時區提示** | `fallback_utc` 或與使用者設定不一致時，可解釋之提示（設定入口／一句話） |
| **B** | **fallback 標籤切換** | 依 §八 tier；主標不並列兩套互相否定的判詞 |
| **B** | **day / month 主次** | 已拍板：**Decision Task 主**、**今日輔**、**流月底**（§3、§6） |
| **C 邊界** | **DST** | `day_key` 以 **IANA + `Intl`** 推導（過渡日由 runtime 處理）；補 vitest／快照 |
| **C** | **子時** | **排盤**用 §4 上表「出生」列；**流日錨點**用「民曆 `day_key`」，**兩者不同步屬預期** |
| **C** | **跨月 / 跨時區旅行** | 跨日 = `day_key` 變更 → 快取未命中；跨時區 = **以目前 client 時區為準**（不重算出生地） |
| **Telemetry** | **`time_context` 全量** | Viewer：`enrichTelemetryPayload` 固定附 `time_zone` / `day_key` / `client_now_iso` / `day_key_mode` / `timezone_source`；`generate-section` 成功事件優先附 **API 回傳**之 `time_context`；日層事件可附 **`fallback_reason`**（`daily_incomplete` \| `no_destiny_palace` \| `parse_failed` \| `monthly_only`） |

