# Content JSON 正規化 + 本地 Validator 評估與建議

## 一、現況：資料規模與 mapping 複雜度

### 1.1 資料量

| 類型 | 規模 | 說明 |
|------|------|------|
| worker/content/*.json | ~300KB+（zh-TW 合計） | 18+ 檔案，content-zh-TW 合併多檔後約 64KB |
| starPalacesAux-zh-TW | 約 280 keys（星名_宮名） | 單檔 64KB，持續擴充丙/丁級星×宮位 |
| lifebookSection-zh-TW | 23 sections（s00～s21） | 44KB，每 section 四欄長文案 |
| 宮位×星曜 key 總量 | 12 宮 × 多星 | starPalaces / starPalacesMain / starPalacesAux / AuxAction / AuxRisk 需 key 一致 |
| 來源層 | 靜態 JSON + D1 (ui_copy_texts) + KV 快取 | 合併順序：KV → D1 → static，copy_key 約定多種前綴 |

### 1.2 現有 mapping 與約定

- **宮位 key 不統一**
  - `starPalacesAux` 等：**命宮** 用「命宮」、其餘用「財帛」「兄弟」…（無「宮」後綴）。
  - 程式多處以 `replace(/宮$/, "")`、`=== "命" ? "命宮" : ...` 做雙向對應。
  - `PALACE_ID_TO_NAME` / `PALACE_NAME_ZH_TO_ID`（schema）與 `FIXED_PALACES_ZH_TW`（palace-map）為權威，但 **content JSON 的 key 仍混用「命宮」vs「財帛」**。
- **section_key**
  - 固定 23 個：s00, s03, s02, s10, … , s21。lifebookSection 的 key 必須與 `SECTION_TEMPLATES` 一致，否則該 section 無骨架。
- **星曜名**
  - 程式用 `STAR_NAME_ZH_TO_ID`、`STAR_ID_TO_NAME` 對照；content 用中文 key（如「文昌_命宮」）。若 JSON 錯字（如「文昌_命官」）會靜默 miss。
- **copy_key 約定（D1）**
  - 前綴多種：`starPalace.`, `starPalaceAux.`, `lifebookSection.s02`, `wuxing.energy.wood.strong`…，依字串解析組出巢狀結構，無 schema 驗證。

### 1.3 現有驗證

- **命書章節 JSON（AI 產出）**：`js/calc/lifeBookEngine.js` 有 `validateSectionJson`（檢查 section_key, title, 四欄）。
- **Content / DbContent**：**無**結構或 key 驗證；僅一處 sample 檢查：`content.starPalaces["紫微_命宮"]` 是否存在（index.ts）。
- **合併後 content**：無檢查 lifebookSection 是否缺 key、starPalacesAux 與 AuxAction/AuxRisk 是否同 key 集合。

---

## 二、風險：正式上線可能遇到的問題

1. **Key  typo / 宮位不一致**
   - 新增內容時「財帛宮」寫成「財帛宮」或漏「命宮」特例，導致 lookup 落空、該段變空白或 fallback。
2. **Aux / AuxAction / AuxRisk 三份 key 不對齊**
   - 有 Aux 無 Action 或有 Risk 無 Aux，執行期仍可跑，但行為不一致（例如缺行動建議、風險不標示）。
3. **lifebookSection 與 SECTION_TEMPLATES 不同步**
   - 新增 section 或改 key 時只改一邊，另一邊缺 key 或舊 key，該章節用錯骨架或無骨架。
4. **D1 的 copy_key 與靜態 JSON 約定不一致**
   - 滲入「宮」後綴或錯誤前綴，合併後覆蓋/遺失，難以除錯。
5. **Schema 漂移**
   - TypeScript 的 `DbContent` 與實際 JSON 結構脫節（例如新增欄位只改 JSON 未改 type），型別仍通過但執行期欄位 undefined。

---

## 三、是否值得做「JSON 正規化 + 本地 Validator」

### 結論：**值得做，但建議分階段、以「關鍵 path + 低成本」優先。**

理由簡述：

- 資料量與 key 數量已到「手動對齊容易出錯」的程度，且會持續增加（更多星×宮、更多 section 文案）。
- 目前幾乎沒有 content 側的驗證，上線後問題多會以「版面缺字、錯宮、行為不一致」形式出現，難以追到單一 key。
- 正規化 + Validator 能讓問題在 **建置/CI 或匯入時** 就暴露，而不是在生產環境。

---

## 四、建議方案

### 4.1 第一階段：正規化約定（不強制改歷史檔，先訂規則）

- **宮位 key 單一約定**
  - 建議：content 端 **一律用短 key**（命宮、兄弟、夫妻、…、父母），其中「命宮」保留兩字（與現有 starPalacesAux 一致）；程式 lookup 時已支援「命宮」與「財帛」兩種寫法，可保留向後相容，但 **新資料與文件** 只寫一種（例如一律「命宮」「財帛」…）。
- **星名 × 宮位 key 格式**
  - 明訂：`星名_宮位`，宮位用上面短 key。在 `docs/content-d1-copy-key-format.md`（或同類）寫清楚，並在 Validator 裡檢查「宮位 ∈ 12 宮集合」。
- **lifebookSection keys**
  - 明訂：必須等於 `SECTION_ORDER` / `SECTION_TEMPLATES` 的 `section_key` 集合；Validator 檢查「無多餘、無缺少」。

以上可以只做文件 + 小量程式註解，成本低。

### 4.2 第二階段：本地 Validator（建議先做）

- **時機**：`npm run build` 或 `npm run validate`（或 CI）時執行。
- **範圍建議**：
  1. **lifebookSection**
     - 每個 key ∈ { s00, s01, …, s21 }；
     - 每個 section 具備四欄（structure_analysis, behavior_pattern, blind_spots, strategic_advice），欄位可為空字串但必須存在。
  2. **starPalacesAux / AuxAction / AuxRisk**
     - 三份 key 集合一致（或至少 AuxRisk 的 key ⊆ Aux 的 key，依產品需求二選一）；
     - 每個 key 符合 `星名_宮位`，宮位 ∈ 12 宮列表。
  3. **可選**：檢查 starPalacesMain、starPalaces 的 key 是否為「星名_宮位」且宮位合法。
- **實作方式**
  - 用 **Node 腳本** 讀取 `worker/content/*.json` 與 `lifebookSection-zh-TW.json`，依上面規則檢查，失敗則 process.exit(1)。
  - 不需上 Zod/AJV 也能做；若希望與 TypeScript 型別一致，可後補 Zod schema 驗證 DbContent 形狀。

這樣可在不改動現有 runtime 邏輯的前提下，在開發/CI 階段抓到 key 錯誤與缺欄。

### 4.3 第三階段：JSON 正規化（可選、漸進）

- **目標**：所有 content JSON 的宮位 key 統一為同一套（例如一律短 key），避免「命宮 vs 財帛」混用。
- **做法**：寫一腳本掃描 `worker/content` 與 D1 export，把 key 正規化（例如「財帛宮」→「財帛」、「命」→「命宮」），產出新 JSON 或更新 D1；再搭配 Validator 確保之後新增的內容都符合約定。
- **成本**：需回歸測試（尤其是 lookup 邏輯有無依賴舊 key），建議在分支執行、確認無 regression 再合併。

### 4.4 不建議（或延後）

- **在 runtime（Worker）對每次 getContentForLocale 做完整 schema 驗證**：會增加延遲與複雜度；較適合在「建置時 / 匯入 D1 時」驗證。
- **一次把全部 content 改成英文 key（如 starId_palaceId）**：改動過大，且現有文案與 copy_key 皆為中文，效益不如先統一「中文 key 的格式」並做 Validator。

---

## 五、總結建議

| 項目 | 建議 |
|------|------|
| 是否值得做 | **值得**，尤其 Validator 成本低、能顯著降低上線後 mapping 問題。 |
| 優先順序 | 先做 **本地 Validator**（lifebookSection + starPalacesAux/AuxAction/AuxRisk + 宮位/星名格式）；再訂 **正規化約定** 與文件；最後視需要做 **JSON 正規化腳本**。 |
| 正規化範圍 | 先鎖定「宮位 key 單一約定」與「section_key 與 SECTION_TEMPLATES 一致」，其餘漸進。 |
| 實作成本 | Validator 約 1～2 天（一腳本 + 數條規則）；正規化約定與文件約半天；JSON 正規化腳本與回歸約 1 天。 |

若你願意，下一步可以從「第二階段：本地 Validator」的具體規則與腳本骨架開始實作（例如在 `scripts/validate-content-json.mjs` 或 `worker/scripts/validate-content.ts` 中實現上述檢查）。
