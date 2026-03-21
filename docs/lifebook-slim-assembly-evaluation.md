# 命書精簡組裝（s04 + 12 宮 + 大限 s15）評估

## 你遇到的現象

1. **模組二只出標題、內容全空**：時間主線與功課、今年主線與流年四化等章節只有標題，內文空白。
2. **Viewer 順序仍錯**：s04 沒有在 s02 之前（或用 `./deploy.sh` 後仍不對）。
3. **希望**：把 s04、12 宮位、大限（原 s15）重新組裝成新檔案，其他模組再補，避免一直改既有 lifebook prompt。

---

## 1. 內容全空：根因與已做修正

### 根因

- **技術版**（`output_mode === "technical"`）產出章節時，會呼叫 `getSectionTechnicalBlocks(sectionKey, chartJson, ...)` 取得「骨架＋ placeholder 填入結果」。
- 該函式原本**只處理「核心章節」**：`sectionKey === "s04"` 或 12 宮（s02, s10, s01, s05～s14）。其餘一律 `return {}`。
- 因此 **s15、s16、s15a、s17～s21 都會拿到空物件**，沒有 `resolvedSkeleton`，後續 `injectTimeModuleDataIntoSection` 收到的是空字串，最終只會輸出標題、沒有內文。

### 已做修正（本次）

- 在 `worker/src/lifeBookPrompts.ts` 的 `getSectionTechnicalBlocks`：
  - **放寬條件**：除了「s04 + 12 宮」外，**時間模組（s15～s21）也進入組裝流程**，不再對它們 `return {}`。
  - 時間模組同樣會：
    - 從 `content.lifebookSection[sectionKey]` 讀取模板（`lifebookSection-zh-TW.json`），
    - 用 `getPlaceholderMapFromContext(..., sectionKey: "s15" 等)` 取得 placeholder 對照表，
    - 產出 `resolvedSkeleton`（含 `structure_analysis` 等）。
- 並將 **TIME_MODULE_KEYS** 擴充為 s15～s21，讓 s18～s21 也走時間模組分支（不誤走宮位 debug 區塊）。

**部署 worker 後**，技術版命書的 s15／s16 等應會出現大限一覽、四化飛星、十年功課等內文（前提是請求裡的 `chart_json` 含有 `decadalLimits`、`ziwei.starByPalace`、`palaceStemMap` 等）。

---

## 2. Viewer 順序（s04 在 s02 前）

### 目前設計

- **Worker**：`SECTION_ORDER` = `["s04", "s02", "s10", ...]`（s04 已在 s02 前）。
- **Viewer**：`SECTION_ORDER` = `["s00", "s03", "s04", "s02", "s10", ...]`（s04 也在 s02 前）。
- 顯示順序是 **Viewer 用自家 `SECTION_ORDER` 過濾並排序**：`SECTION_ORDER.filter(k => k in sections)`，所以理論上會是 s04 → s02 → …

### 若你仍看到順序錯，可能原因

1. **前端未重新建置／部署**：`./deploy.sh` 會跑 `npm run build:lifebook-viewer` 並部署 Pages；若沒跑完或用了舊 bundle，會沿用舊的 `SECTION_ORDER`。
2. **命書資料來源是舊的**：若畫面上的命書是之前產生的 JSON（例如從匯入／快取來），當時 worker 可能用舊的 `SECTION_ORDER` 寫入，而 Viewer 是依「目前收到的 `sections` 的 key」＋ 自己的 `SECTION_ORDER` 排序；只要 **API 回傳的 `sections` 裡有 s04 和 s02**，Viewer 會依自己的 `SECTION_ORDER` 排，s04 應在 s02 前。若你看到不是，多半是前端 bundle 或快取問題。
3. **單一真相**：目前 worker 與 viewer 各有一份 `SECTION_ORDER`，若之後再改一邊忘改另一邊，就會出現順序或章節遺漏。建議長期改為「單一來源」（見下文）。

---

## 3. 重組成「新的 lifebook prompt／組裝檔」的可行性

### 你的目標

- 把 **s04、12 宮、大限（原 s15）** 先整理成**一組新的組裝流程／檔案**；
- 其他模組（s00, s03, s15a, s16～s21）之後再補；
- **少動既有、錯綜的 lifebook prompt**，避免越改越亂。

### 評估結論：可行，且建議分階段做

#### 方案 A：在現有架構內「精簡清單」（最小改動）

- **做法**：
  - 在 worker 增加一個「精簡版」章節清單，例如 `SECTION_ORDER_SLIM = ["s04", "s02", "s10", "s01", "s05", "s06", "s07", "s08", "s09", "s11", "s12", "s13", "s14", "s15"]`。
  - 新增一個 **API 或 output_mode**（例如 `output_mode: "technical_slim"` 或新 route），只依 `SECTION_ORDER_SLIM` 產出命書（只寫入這 14 個 section）。
  - 使用同一套 `lifebookSection-zh-TW.json` 與現有 `getSectionTechnicalBlocks` / `getPlaceholderMapFromContext`，**不新增模板檔**，只是「少產出章節」。
- **優點**：改動小、不碰既有 prompt 邏輯，馬上可讓「只給 s04 + 12 宮 + s15」的流程穩定。
- **缺點**：order 與 template 仍分散在現有檔案，長期仍要記得兩邊一致。

#### 方案 B：獨立「精簡組裝」模組（新檔案、單一順序）

- **做法**：
  - 新增例如 `worker/src/lifebookAssemblySlim.ts`（或 `lifebook-slim/` 小模組）：
    - 定義 **唯一** 的 `SECTION_ORDER_SLIM` 與對應的 section 標題／描述（或只讀一份精簡 template JSON）。
    - 只負責「s04、12 宮、s15」的組裝：依序對每個 key 呼叫現有的「取 skeleton + 填 placeholder」邏輯（可封裝成一個共用函式，從現有 `getSectionTechnicalBlocks` 抽出來），產出 `sections` 物件。
  - 命書模板可選：
    - **沿用** `lifebookSection-zh-TW.json` 的 s04、s02、s10、…、s15 鍵；
    - 或另建 `lifebookSection-slim-zh-TW.json`，只含這 14 個 key，避免被其他 key 干擾。
  - Worker 的 generate 主流程：若偵測到「精簡模式」（例如 query 或 body 參數），改走 `lifebookAssemblySlim`，只產這 14 章並回傳。
- **優點**：
  - 順序與範圍集中在一個檔案，之後要加「只加 s16」等再擴充同一模組即可。
  - 既有 `lifeBookPrompts` / `getSectionTechnicalBlocks` 可漸進重構為「被 slim 與完整版共用」，而不必一次大改。
- **缺點**：需要一點重構（抽出共用的「取 template + 填 placeholder」），並決定 slim 是否共用同一 content 來源（建議先共用 `lifebookSection-zh-TW.json`）。

#### 方案 C：單一 SECTION_ORDER 來源（順序不再錯）

- **做法**：
  - 在 **monorepo 內** 建一個兩邊都可讀的「契約檔」：例如 `shared/lifebook-section-order.ts` 或 JSON，只匯出 `SECTION_ORDER`（與可選的 section 標題對照）。
  - Worker 與 Viewer 都從這裡 import；或由 build 時把同一份 JSON 打進 worker 與 viewer。
- **優點**：s04 在 s02 前、模組二順序等只定義一次，不會再出現「一邊改了一邊沒改」。
- **可與 A 或 B 並行**：例如 `SECTION_ORDER_SLIM` 也從同一契約檔匯出，或由契約檔衍生。

### 建議執行順序

1. **立刻**：已做的修正（讓 s15～s21 在 `getSectionTechnicalBlocks` 產出 skeleton）**部署 worker**，確認模組二內容不再全空。
2. **短期**：確認 `./deploy.sh` 有正確建置並部署 **lifebook-viewer**，且清除快取或重新產一本命書，確認 s04 在 s02 前；若仍錯，再查是否還有別處用 `Object.keys(sections)` 沒依 `SECTION_ORDER` 排序。
3. **中期**：採用 **方案 A 或 B**，把「s04 + 12 宮 + s15」收斂成精簡組裝（新 API 或新模組），其他模組之後在精簡流程裡再加。
4. **長期**：引入 **方案 C** 單一 SECTION_ORDER 來源，避免順序與章節清單再次分叉。

---

## 4. deploy.sh 是否導致錯誤結果

- `./deploy.sh` 會：建主 bundle、專家後台、命書 Viewer、占卦頁 → D1 migrations → **部署 Worker** → **部署 Pages**。
- 因此 **Worker 與 Viewer 都會被部署**；不會「只部署 worker 不部署 viewer」。
- 若你一直用 `./deploy.sh` 仍看到順序錯或內容空，較可能是：
  - **內容空**：之前是 `getSectionTechnicalBlocks` 對 s15 等 return {} 的 bug（已修），需**重新部署 worker** 並**重新產生命書**（或清除快取）。
  - **順序錯**：Viewer 的 bundle 未更新（例如 CDN／瀏覽器快取），或命書 JSON 是舊的；可試無痕視窗或強制重新整理，並再產一本新命書比對。

---

## 5. 總結

| 項目 | 狀態／建議 |
|------|------------|
| 模組二內容全空 | 已修正：`getSectionTechnicalBlocks` 改為對 s15～s21 也產出 skeleton；部署 worker 後應有內文。 |
| s04 在 s02 前 | Worker / Viewer 的 SECTION_ORDER 皆已為 s04 在前；若仍錯，檢查 viewer 建置與快取，並考慮單一 SECTION_ORDER 來源。 |
| 重組成新檔（s04+12宮+s15） | 可行：方案 A 精簡清單＋新 output_mode，或方案 B 獨立 slim 組裝模組；建議先 A 再 B，並搭配方案 C 單一順序來源。 |
| deploy.sh | 會同時部署 Worker 與 Viewer；不會單獨造成「只錯一邊」的狀況，修正後需重新部署並重新產命書驗證。 |

若你決定先做「精簡組裝」新檔（方案 A 或 B），我可以再幫你具體列出要新增的檔案與要改的 entry point（例如哪個 route 或哪個 output_mode 用 slim）。
