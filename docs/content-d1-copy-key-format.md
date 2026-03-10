# content/2026 與 ui_copy_texts 對應格式

Worker 的 `GET /content/2026?locale=` 會優先從 D1 `ui_copy_texts` 讀取，無資料時用靜態 JSON fallback。

## copy_key 格式

| 類別 | copy_key 範例 | 對應 dbContent |
|------|---------------|----------------|
| 宮位 | `palace.命宮` | `palaces["命宮"]` |
| 宮位 (en) | `palace.soul` | `palaces["命宮"]`（en 模式宮位 key 仍用繁體，與前端一致） |
| 星曜 | `star.紫微` | `stars["紫微"]` |
| 星曜 (en) | `star.emperor` | `stars["emperor"]` |
| 星曜×宮位 | `starPalace.紫微_命宮` | `starPalaces["紫微_命宮"]`（宮名：命宮、兄弟、夫妻…父母，交友→僕役） |
| 輔星×宮位（戰術/行動/風險） | `starPalaceAux.文昌_財帛`、`starPalaceAuxAction.文昌_財帛`、`starPalaceAuxRisk.文昌_財帛` | `starPalacesAux` / `starPalacesAuxAction`（字串）/ `starPalacesAuxRisk`（1～5 數字）；三份 key 需一致 |
| 命書章節骨架 | `lifebookSection.s02` 或 `lifebookSection.s02.structure_analysis` | `lifebookSection["s02"]`（四欄）；section key 須為 s00～s21 |
| 十神 | `tenGod.比肩` | `tenGods["比肩"]` |
| 十神×宮位 | `tenGodPalace.比肩_命宮` | `tenGodPalaces["比肩_命宮"]`（宮名同 starPalace） |
| 五行 | `wuxing.木` | `wuxing["木"]` = `{headline, content}` |
| 五行×宮位 | `wuxingPalace.木_命宮` | `wuxingPalaces["木_命宮"]`（五行在該宮特質＋補X，宮名同 starPalace） |

## content 欄位

- **palace / star / tenGod**：`content` 為純文字
- **wuxing**：`content` 為 JSON 字串，例如：
  ```json
  {"headline":"策略模組","content":"木能量代表你的策略模組..."}
  ```

## locale

- `zh-TW`、`zh-CN`、`en` 皆支援
- 查詢時用請求的 locale；若該 locale 無資料，回傳靜態 JSON（zh-TW 或 en）

## 匯入範例

```sql
INSERT INTO ui_copy_texts (copy_key, locale, content, category, description, updated_by, updated_at, created_at)
VALUES 
  ('palace.命宮', 'zh-TW', '你的核心作業系統', 'content', '宮位解釋', 'admin', datetime('now'), datetime('now')),
  ('star.紫微', 'zh-TW', '核心本質：核心自我與統御力...', 'content', '星曜解釋', 'admin', datetime('now'), datetime('now')),
  ('star.emperor', 'en', 'Core Essence: Central Authority...', 'content', 'Star meaning', 'admin', datetime('now'), datetime('now'));
```

## Content 正規化約定（Validator 依此檢查）

以下約定用於靜態 JSON 與 D1 匯入，避免 key 不一致導致 lookup 落空。

### 宮位 key（星×宮、十神×宮、五行×宮）

- **唯一寫法**：`命宮`、`兄弟`、`夫妻`、`子女`、`財帛`、`疾厄`、`遷移`、`僕役`、`官祿`、`田宅`、`福德`、`父母`
- 僅「命宮」保留兩字；其餘一律**不加「宮」後綴**（例如用 `財帛` 不用 `財帛宮`）。
- 星曜×宮位 key 格式：`星名_宮位`，例如 `文昌_命宮`、`解神_財帛`。

### lifebookSection

- 頂層 key 必須與 `SECTION_ORDER` 完全一致，共 23 個：`s00`, `s03`, `s02`, `s10`, `s01`, `s05` … `s21`。
- 每個 section 必須有四個欄位：`structure_analysis`、`behavior_pattern`、`blind_spots`、`strategic_advice`（可為空字串，不可缺欄）。

### starPalacesAux / AuxAction / AuxRisk

- 三份物件的 **key 集合必須一致**：任一 key 若出現在 AuxAction 或 AuxRisk，必須也出現在 starPalacesAux。
- AuxRisk 的 value 必須為數字 1～5（風險等級）。

## Validator（本地檢查）

專案內已提供 content JSON 檢查腳本，上線或合併前建議執行：

```bash
npm run validate-content
```

- 檢查項目：`worker/content/lifebookSection-zh-TW.json` 的 section keys 與四欄；`starPalacesAux-zh-TW.json` 的 key 格式、宮位合法、Aux/AuxAction/AuxRisk key 對齊、AuxRisk 數值範圍。
- 失敗時會列出具體錯誤並 `process.exit(1)`，可接在 CI 或 `deploy` 前執行。

**CI**：`.github/workflows/content-validate.yml` 會在 push/PR 觸及 `worker/content/**` 或驗證腳本時自動執行 `npm run validate-content`。

### 正規化腳本（可選）

若 content 中出現「宮」後綴不一致（例如 `財帛宮` 應為 `財帛`），可執行：

```bash
npm run normalize-content-keys          # 僅預覽會改的 key
npm run normalize-content-keys:write    # 寫入並跑 validator
```

僅會正規化 `worker/content/starPalacesAux-zh-TW.json` 內三份物件的 key，不會改 lifebookSection。
