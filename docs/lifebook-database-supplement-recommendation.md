# 命書階段：資料庫與內容補足建議

## 一、目前已有（資料庫／內容）

| 類型 | 來源 | 用途 |
|------|------|------|
| **主星／輔星在不同宮位的表現** | D1 `ui_copy_texts`，`copy_key` = `starPalace.{星名}_{宮名}`（如 `starPalace.紫微_命宮`） | 命書 infer / generate-section 的【星曜宮位評語】、Viewer 直接顯示 |
| **星曜通用說明（命主・身主用）** | D1 `star.{星名}` → `content.stars` | 命主星、身主星的定義，用於 s04 及相關章節 |
| **宮位簡介** | D1 `palace.{宮名}` → `content.palaces` | 可作為 UI 或輔助說明（命書 prompt 目前未直接注入） |
| **十神 / 五行** | D1 已支援 `tenGod.{key}`、`wuxing.{key}` | **尚未接到命書**：命書目前仍用程式碼內 `SHISHEN_PHRASES`、`WUXING_WEAK_PHRASES` |
| **十神×12 宮** | D1 `tenGodPalace.{十神}_{宮名}` → `content.tenGodPalaces`；靜態 `content-zh-TW.json` 已含 120 筆 | 命書／內容 API 可依「該宮十神」注入對應特質（需在 buildSectionUserPrompt 依命盤十神帶入） |
| **五行×12 宮** | D1 `wuxingPalace.{木|火|土|金|水}_{宮名}` → `content.wuxingPalaces`；靜態已含 60 筆 | 命書／內容 API 可依「該宮五行」注入特質＋補X 建議（需依命盤五行與宮位帶入） |

---

## 二、建議此階段在資料庫補足／建立的項目

### 1. 輔星 × 宮位（與現有主星同一套 key）

- **不需改 schema**，沿用 `starPalace.{星名}_{宮名}`。
- **已提供**：`data/star-palace-20char-zh-TW.json` 內含 27 顆輔星 × 12 宮的 20 字內特質（祿存、天馬、天刑、天姚、左輔、右弼、天魁、天鉞、紅鸞、天喜、文昌、文曲、龍池、鳳閣、擎羊、陀羅、火星、鈴星、地空、地劫、解神、天巫、孤辰、寡宿、破碎、劫煞、大耗、蜚廉）。宮位 key 為：命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母。
- **匯入方式**：
  - **D1**：`node scripts/import-star-palace-20char.cjs sql > migrations/seed_star_palace_20char.sql`，再執行該 SQL；或直接 pipe 到 `wrangler d1 execute`。
  - **靜態 JSON**：`node scripts/import-star-palace-20char.cjs merge` 會將上述內容合併進 `worker/content/content-zh-TW.json` 的 `starPalaces`（同 key 會被覆寫）。
- 命書在該宮有輔星時，會帶入「輔星在該宮的表現」。

### 1b. 十神 × 12 宮（tenGodPalaces）

- **已提供**：`data/ten-god-palace-zh-TW.json` 內含 10 十神 × 12 宮共 120 筆（比肩、劫財、食神、傷官、偏財、正財、七殺、正官、偏印、正印）。宮位 key 與 starPalace 一致：命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母。
- **Content 層**：Worker `content-from-d1.ts` 已支援 `tenGodPalace.{十神}_{宮名}` → `content.tenGodPalaces`；靜態 `content-zh-TW.json` 已併入 120 筆，`GET /content/2026?locale=zh-TW` 會回傳。
- **匯入 D1**：`node scripts/import-ten-god-palace.cjs sql` 輸出 SQL，可寫入 `ui_copy_texts`；`node scripts/import-ten-god-palace.cjs merge` 可再次合併進靜態 JSON。
- **後續**：命書若要在章節中依「該宮十神」帶入特質，需在 `buildSectionUserPrompt` 依命盤 bazi 十神與宮位對應，從 `config` 或 content 讀取 `tenGodPalaces` 並注入對應區塊。

### 1c. 五行 × 12 宮（wuxingPalaces）

- **已提供**：`data/wuxing-palace-zh-TW.json` 內含 5 行 × 12 宮共 60 筆（木、火、土、金、水；每筆含該宮特質＋補X 建議）。宮位 key 同 starPalace：命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母。
- **Content 層**：Worker 已支援 `wuxingPalace.{五行}_{宮名}` → `content.wuxingPalaces`；靜態 `content-zh-TW.json` 已併入 60 筆。
- **匯入 D1**：`node scripts/import-wuxing-palace.cjs sql` 輸出 SQL；`node scripts/import-wuxing-palace.cjs merge` 可再次合併進靜態 JSON。
- **後續**：命書若要在章節中依「該宮五行」帶入特質與補運建議，需在 `buildSectionUserPrompt` 依命盤五行與宮位從 content 讀取 `wuxingPalaces` 並注入。

### 2. 十神句庫改由 D1 提供（可編輯、可多語系）

- **現狀**：十神一句（如「比肩：我要靠自己。」）寫在 `lifeBookTemplates.ts` 的 `SHISHEN_PHRASES`，命書 generate 時用 `config.shishen`（預設即該常數）。
- **建議**：
  - 在 D1 建立 `tenGod.比肩`、`tenGod.劫財` … 等 10 筆（locale = zh-TW，若要多語再補 zh-CN / en）。
  - **Worker 接線**：在組裝命書 config 時，若 `content.tenGods` 有資料，就帶入 `config.shishen = content.tenGods`（或合併覆寫），讓 `buildSectionUserPrompt` 用的十神句庫來自 DB。
- **效益**：後台可改十神文案、多語系、A/B 測試，不用改 code。

### 3. 五行弱項句庫改由 D1 提供

- **現狀**：五行弱項建議（如「金：你的邏輯、規則…補金＝把標準寫下來」）寫在 `WUXING_WEAK_PHRASES`，命書 s03 / s11 等題用 `config.wuxing`。
- **建議**：
  - 方案 A：沿用現有 `wuxing.{木|火|土|金|水}`，但 D1 的 `content` 目前是 `{ headline, content }`；命書需要的是「一句建議」。可新增一類 key，例如 **`wuxingWeak.木`**（純字串），專門給五行弱項句庫用。
  - 方案 B：在現有 `wuxing.木` 的 JSON 裡加欄位，例如 `weak_advice`，Worker 讀取後組出 `config.wuxing["木"] = parsed.weak_advice`。
- **Worker 接線**：組裝命書 config 時，若 content 有五行弱項資料（上述任一種），就寫入 `config.wuxing`，讓 `getWuxingWeakPhrases` 使用 DB 版。
- **效益**：五行補運文案可後台維護、多語系。

### 4. 星曜「一句 feature」插入位（可選，Soul Advisor 模板用）

- **需求**：模板裡「【主星與輔星 feature 插入位】」希望每顆星有一句精簡標籤（如「天相：協調、穩定」），放在段落最上方，再由 AI 展開。
- **建議**：
  - 新增一類 key：**`starFeature.{星名}`**，content 為一句話（如「協調、穩定」或「天相：協調、穩定」）。
  - 在 `content-from-d1.ts` 增加 `starFeatures: Record<string, string>`，Worker 組 prompt 時依命盤出現的星曜，把對應的 `starFeature` 列在該題的【星曜 feature 插入位】區塊。
- **效益**：主星／輔星的一句話標籤可集中維護、多語系，且與「星曜在該宮的完整表現」（starPalace）分離。

### 5. 命書章節標題／描述可編輯（可選）

- **現狀**：22 章標題與 description 都在 `lifeBookTemplates.ts` 的 `SECTION_TEMPLATES`。
- **建議**：若希望營運在「不發版」下微調標題或章節說明：
  - 新增 **`section.{section_key}`**（如 `section.s00`），content 為 JSON：`{ "title": "這一局，你為什麼要來？", "description": "…" }`。
  - Worker 讀取 `content.sections` 後，在組裝每題時若存在該 section_key 的覆寫，就取代 template 的 title / description。
- **效益**：標題人話化、活動標題可暫時改動，不需改 code。

### 6. 多語系完整性檢查

- **建議**：若命書或內容會支援 zh-CN / en：
  - 檢查各 locale 的 `starPalace.*`、`star.*` 是否與 zh-TW 的 key 對齊（至少主星×12 宮、命主身主用星要有）。
  - 十神、五行弱項、starFeature 若上線 DB，也建議各語系一組，避免 fallback 到靜態或空字串。

---

## 三、實作優先順序建議

| 優先 | 項目 | 改動量 | 說明 |
|------|------|--------|------|
| 1 | 輔星 × 宮位 補齊 | 僅 D1 資料 | 沿用既有 starPalace key，補齊輔星在常用宮位的表現 |
| 2 | 十神句庫接 D1 | D1 資料 + Worker 接線 | 命書 config 組裝時帶入 `content.tenGods` → `config.shishen` |
| 3 | 五行弱項接 D1 | D1 資料 + 新 key 或欄位 + Worker 接線 | 同上，`config.wuxing` 來自 content |
| 4 | starFeature 插入位 | D1 新前綴 + content-from-d1 + Worker prompt 組裝 | Soul Advisor 段落上方一句標籤 |
| 5 | 章節標題可編輯 | D1 新前綴 + Worker 覆寫邏輯 | 非必須，有營運需求再做 |

---

## 四、不需為命書新增的資料表

- **命書章節內容**：仍由 OpenAI 依 prompt 即時生成，不需在 DB 存「章節範本正文」。
- **命盤 / 權重 / 大限流年**：皆由前端或 compute 即時計算，僅命書結果可選擇存進 life_books 等表（既有設計）。
- **紅綠燈 / traffic_signals**：由權重分析即時產出，不需在 DB 建表。

---

## 五、小結

- **已有**：主星（與部分輔星）在不同宮位的表現（starPalace）、命主身主用星（stars）、宮位（palaces）；D1 也支援 tenGod、wuxing，但命書尚未使用。
- **建議此階段補足**：  
  1）輔星×宮位內容補齊；  
  2）十神、五行弱項改由 D1 提供並在 Worker 接上 config；  
  3）（可選）星曜一句 feature（starFeature）、章節標題可編輯（section.*）。  
- 依上表優先順序分步做，可先完成 1、2，再視需求做 3～5。
