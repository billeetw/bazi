# SectionPalaceTemplate 驗收清單（Phase 1：十二宮預覽）

目的：在擴到 RootViewModel 之前，先證明**同一模板可複製**。  
Viewer「宮位速覽」預覽區現含 **十二宮課題**（`PALACE_TEMPLATE_PREVIEW_SECTION_KEYS`：命／官祿／財帛／夫妻／疾厄／遷移／福德／田宅／**父母／兄弟／僕役／子女**）。

**自動化驗收（fixture／URL 解析／十二鍵對齊）：** 專案根目錄執行 `npm run verify:palace-preview`（`worker/tests/gateFixturesPalacePreview.test.ts`）。

---

## 里程碑：12 宮模板化完成（目標）

**Definition of done**

- 十二宮課題章節皆走同一 `SectionPalaceTemplate`，皆由 **VM + `palaceId`／preset** 驅動  
- 無宮位專屬 **raw** 直讀（模板不直接吃 `chart_json`／原始 `section`）  
- **preview／focus／fixture** 行為一致（焦點置頂、URL 對應、`#lifebook-palace-preview-<palaceId>` 捲動、無效 `palace` 不重排）  
- **theme 差異**全來自 preset（無元件內依宮硬編色）  
- **signal／gate** 與現版矩陣一致，不另開特例分支  

**建議節奏（降尾端風險）：** 分批擴張後跑 `verify:palace-preview`，再手動抽驗焦點 URL，不要一次堆到最後才驗。

**刻意往後排：** Root 頁主流程、Home 大改版、gate／signal 特例擴充——待本里程碑完成再開。

### 預設本機連結（專案約定）

| 項目 | 約定 |
|------|------|
| 啟動 | `npm run dev`；若希望瀏覽器直接開命書頁，可用 **`npm run dev:lifebook`** |
| 入口檔 | 根目錄 **`lifebook-viewer.html`**（見 `vite.config.ts` 多頁輸入） |
| Base URL | **`http://localhost:5173/lifebook-viewer.html`**（埠以終端機 Vite 輸出為準；被占用時常為 `5174`） |

**常用完整 URL（請整段複製）：**

- Gate 全開：`http://localhost:5173/lifebook-viewer.html?fixture=open`
- Gate 半開 + **官祿**（預覽與 TOC 官祿在前）：`http://localhost:5173/lifebook-viewer.html?fixture=partial&palace=guanlu`
- Gate 半開 + **財帛／夫妻／疾厄**（焦點置頂、`data-palace-preview-focus` 與捲動錨點對應）：`…&palace=caibo`、`…&palace=fuqi`、`…&palace=jie`（或 `s10`／`s13`／`s11`、中文宮名）
- Gate 半開 + **遷移／福德／田宅**：`…&palace=qianyi`、`…&palace=fude`、`…&palace=tianzhai`（或 `s12`／`s01`／`s09`、`遷移宮`／`福德宮`／`田宅宮`）
- 非 fixture、僅 Viewer + 官祿：`http://localhost:5173/lifebook-viewer.html?view=viewer&palace=guanlu`
- 非 fixture + 財帛：`?view=viewer&palace=caibo`（`fuqi`／`jie`／`qianyi`／`fude`／`tianzhai`／`fumu`／`xiongdi`／`nuppu`／`zinv` 同理）
- 打包後靜態檔（相對於站台根）：`/dist/lifebook-viewer.html?fixture=teaser`（若用 `file://` 或子路徑部署，請在路徑前加你的網域）

---

## 驗收項

| # | 項目 | 預期 | 如何驗（建議） |
|---|------|------|----------------|
| 1 | 預覽 vs 正文分離 | 預覽卡只做「要不要點進去」，長文仍在下方章節 | **預覽**：`PalacePreviewCard`（固定高度、僅 `displaySignals[0]`、無 whisper／流月長文）。**完整宮位殼**（若路由有掛）：`SectionPalaceTemplate` |
| 2 | 僅 VM + `palaceId` / preset 差異 | 除資料與主題 id 外無額外分支 | 各 `section_key` 經 `SECTION_KEY_TO_PALACE_ID` 得 `palaceId`（含 `qianyi`／`fude`／`tianzhai` 等）；不傳 `palaceId` prop，由 VM 帶入 |
| 3 | 無 component 內宮位色硬編 | 色與 token 來自 preset / `[data-palace]` / 共用 CSS | 檢視 `SectionPalaceTemplate.tsx`：無依宮位寫死 hex palette；視覺由 `resolvePalacePreset` + `palace-section-themes.css` |
| 4 | 無 raw `section` / `chart_json` 直讀 | 模板只依 `SectionViewModel`，不碰原始 API 形狀 | `SectionPalaceTemplate` 不 import / 不讀 `chart_json`；章節原文僅經 VM 欄位進入 |
| 5 | `displaySignals` 可正常 render | 殼層 rune 區顯示 resolver 標籤 | 開啟預覽；必要時開 template debug：應見 `DISPLAY_CODES` 與 `SIGNALS_SRC` |
| 6 | gate / preview / cta 行為符合矩陣 | 與 `resolveGateContract` 四組一致 | **建議用固定 fixture + URL query**（見下），勿手改 `meta`；檢查試讀／面紗／CTA 是否對應 `open·full·none`、`partial·teaser·soft-upgrade`、`teaser·teaser·upgrade`、`locked·hidden·upgrade-hard` |

### Gate fixture（可重播）

實作：`src/lifebook-viewer/testing/gateFixtures.ts`。帶 `?fixture=` 時會注入最小 `LifeBookViewerState`、**自動進入 Viewer**（不經 Home Shell），且不影響未帶參數的正式路徑。

| 情境 | URL 範例（開發時） |
|------|-------------------|
| open · full · none | `?fixture=open` |
| partial · teaser · soft-upgrade（命宮半開） | `?fixture=partial` 或 `?fixture=partial&palace=ming` |
| partial（官祿半開） | `?fixture=partial&palace=guanlu` |
| partial（財帛／夫妻／疾厄半開） | `?fixture=partial&palace=caibo`（或 `fuqi`／`jie`） |
| partial（遷移／福德／田宅半開） | `?fixture=partial&palace=qianyi`（或 `fude`／`tianzhai`） |
| partial（父母／兄弟／僕役／子女半開） | `?fixture=partial&palace=fumu`（或 `xiongdi`／`nuppu`／`zinv`） |
| teaser · teaser · upgrade | `?fixture=teaser` |
| locked · hidden · upgrade-hard（鎖命宮） | `?fixture=locked` 或 `?fixture=locked&palace=ming` |
| locked（鎖官祿） | `?fixture=locked&palace=guanlu` |
| locked（鎖財帛／夫妻／疾厄） | `?fixture=locked&palace=caibo`（或 `fuqi`／`jie`） |
| locked（鎖遷移／福德／田宅） | `?fixture=locked&palace=qianyi`（或 `fude`／`tianzhai`） |
| locked（鎖父母／兄弟／僕役／子女） | `?fixture=locked&palace=fumu`（或 `xiongdi`／`nuppu`／`zinv`） |

根節點會帶 `data-gate-fixture="open|partial|teaser|locked"`，方便自動化辨識。

載入時若指定焦點宮（`palace=` 與 `PalacePreviewFocus` 一致，含十二宮 id），會 **`data-palace-preview-focus="<焦點>"`**，並將 **多宮預覽與章節 TOC 的該章節置前**，且捲動至 `#lifebook-palace-preview-<palaceId>`（例如 `#lifebook-palace-preview-fumu`）。

### 常見原因：以為「一直轉到命宮」

1. **預設 Home Shell**：未帶 `?fixture=` 時會進 Home，看不到多宮預覽；請加 **`?view=viewer`** 再驗證，例如：`?view=viewer&palace=guanlu`（或 `section=s08` / `focus=guanlu`）。
2. **版面順序**：先前預覽與長文區塊皆 **命宮在前**；現已支援 **任意焦點宮優先**（見上）。
3. **參數名**：除 `palace=` 外，也可用 `focus=`、`section=`（如 `section=s08`）。

---

## Definition of done（一句話）

**同一 `SectionPalaceTemplate`、無 raw chart/section 直讀、`displaySignals` 可渲染、theme 全由 preset 驅動、gate 矩陣行為一致。**

---

## 工程決策（本輪共識）

### 現在先做什麼

1. **小里程碑：命宮／官祿基線 + 十二宮預覽**  
   對 `open` / `partial` / `teaser` / `locked` **四態**，命宮與官祿各至少驗一次；**十二宮**：`npm run verify:palace-preview` 通過後，手動抽驗任兩組 `?fixture=partial&palace=`（預覽十二卡、焦點置頂、捲動錨點）。

2. **擴十二宮，不先做 Root 主流程**  
   **命主／身主／身宮**等 Root 頁尚無正式 `RootViewModel`——**往後排**。

3. **十二宮分三批擴**（不要一次全開）

   | 批次 | 宮位（敘事角色） | section_key（對照 `SECTION_KEY_TO_PALACE_ID`） |
   |------|------------------|-----------------------------------------------|
   | 第一批（已併入預覽） | 財帛／夫妻／疾厄 | `s10`（caibo）、`s13`（fuqi）、`s11`（jie） |
   | 第二批（已併入預覽） | 遷移／福德／田宅 | `s12`（qianyi）、`s01`（fude）、`s09`（tianzhai） |
   | 第三批（已併入預覽） | 父母／兄弟／僕役／子女 | `s05`（fumu）、`s06`（xiongdi）、`s07`（nuppu）、`s14`（zinv） |

### 現在先不要做什麼

| 項目 | 理由 |
|------|------|
| **fixture 與真命書「合併模式」** | Gate 驗收要的是穩定、可重現、不受其他資料干擾；**整包最小 state** 正確，合併模式往後再談。 |
| **Home 全面改吃 `DisplaySignal`** | 解析層單一路徑已夠；UI 全切往後排。 |
| **Root 大頁主流程** | 值得做，但時機不如先把十二宮模板站穩。 |

### 本輪已落地的關鍵能力（摘要）

- `SectionViewModel` 主路徑、`displaySignals` 單一路徑、gate／preview／cta 最小矩陣  
- 命宮／官祿可重播驗收；`gateFixtures` 可給未來 debug／E2E 共用（`data-gate-fixture` 等）

---

## 正文區策略（方案 **A** 已落地於 Viewer）

| 方案 | 作法 | 取捨 |
|------|------|------|
| **A** | `SectionPalaceTemplate` 為 **宮位課題正文殼**；**`SectionLayout` 給非宮位章節**（開場、時間模組等）。 | theme／palace 與閱讀路徑一致；`PalacePreviewCard`＝決策入口，正文＝完整殼。 |
| **B** | 僅 preview 用 palace 殼，正文永遠 `SectionLayout`。 | （未採用） |

**實作要點：** `constants.isSectionKeyPalaceShell(sectionKey)`（依 `SECTION_KEY_TO_PALACE_ID`，含 **s02／s04** 等映射）。`ModuleGroup`：宮位 → `SectionPalaceTemplate` + VM；非宮位 → 原 `SectionLayout`。專家模式時宮位章節下方仍附 **底層技術依據**摺疊（與原 `SectionLayout` 行為對齊）。錨點 `id={sectionKey}` 在包裹層，TOC／預覽卡捲動仍有效。

---

## 接下來請避免的兩個坑

### 坑 1：不要過快擴充 signal code / label / severity

單一路徑剛立住時，最容易再加 code、再細分嚴重度。**先讓命宮／官祿跑順**，再談擴充。

### 坑 2：不要一邊擴十二宮、一邊回頭改 gate 語意

gate 矩陣先以現版固定跑；**除非實際體驗明顯不對**，否則不要立刻再拆 `partial` 或其他態。
