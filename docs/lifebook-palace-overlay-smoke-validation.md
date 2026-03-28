# Palace overlay 單章生成 — Manual smoke validation

目的：在 **`/timeline` + 有 seed + 無 `sections`** 時，確認決策卡 → overlay → 按需生成 → 關閉回時間軸；並驗證離線重試與遙測事件。

## 前置條件

1. 開啟命書 Viewer（本機或預覽站），網址含 **`view=timeline`**（例：`…/lifebook-viewer.html?view=timeline` 或 rewrite 後的 `/timeline`）。
2. **有 session seed**（`localStorage` 內 `lifebook_v2_seed` 等，或主站已寫入），且 **`sections` 為空或無該宮 primary 章節**（可清掉 `lifebook_doc` 僅留 seed，依你們慣用流程）。
3. 開啟 **DevTools → Network**（驗證單章請求）與 **Console**（可選：確認無未攔錯誤）。
4. 若需驗 **gtag**：在 Console 暫存 `window.dataLayer` 或 GA DebugView（依你們埋設方式）。

---

## 驗收項目

| # | 項目 | 預期 |
|---|------|------|
| 1 | **Decision CTA 開啟 overlay** | 點時間決策卡「查看財帛宮／官祿宮 →」後，出現全螢幕宮位閱讀層（`data-testid="lifebook-palace-reader-overlay"`），網址 hash 為 `#palace-*`。 |
| 2 | **單章生成成功** | 出現「正在生成…」後，該宮正文載入（非永遠 loading）；Network 僅該章相關請求（按需一章）。 |
| 3 | **關閉回時間軸** | 點「← 返回時間軸」或等效關閉後，回到時間軸主畫面，`view=timeline` 仍成立，無卡在空白 viewer。 |
| 4 | **離線 + 重試 + 遙測** | 在 overlay **生成中或重試前** 於 DevTools 設 **Offline**，使請求失敗 → 應出現錯誤與「重試生成」。恢復 **Online** 後點重試 → 成功載入。並確認事件（見下表）。 |

### 遙測事件（gtag `event` 名稱）

失敗與重試路徑至少應看到（payload 含 `app_surface`、`palace_reader_surface` 等）：

| 時機 | 事件名 |
|------|--------|
| 開啟 overlay | `palace_overlay_opened` |
| 開始生成（含初次） | `palace_section_generate_started`（`generate_mode`: `initial`） |
| 成功 | `palace_section_generate_succeeded` |
| 請求失敗 | `palace_section_generate_failed`（`error_message`） |
| 點重試 | `palace_overlay_retry_clicked`，接著再一次 `palace_section_generate_started`（`generate_mode`: `retry`） |

---

## 完成後

跑完上表並簽核（或記錄環境／commit）後，再開下方 **Ticket：GA4 funnel**。

---

## Ticket（草稿）：GA4 funnel — palace overlay generation by surface

**標題（建議）**  
`GA4：Palace overlay 單章生成漏斗（依 surface）`

**描述（建議）**  
- 建立 **Exploration / Funnel**，步驟依序：  
  `palace_overlay_opened` → `palace_section_generate_started`（可篩 `generate_mode = initial`）→ `palace_section_generate_succeeded`  
- **維度／篩選**：`app_surface` 或 `palace_reader_surface`（`root` vs `timeline`），必要時再加 `palace_id` / `section_key`。  
- **流失分析**：`palace_section_generate_failed` 與 `palace_overlay_retry_clicked` 與成功步驟的關聯。  
- **對照組**：同一 funnel 複製一份僅篩 `palace_reader_surface = timeline`，與 root 對照。

**完成定義**  
- Dashboard 或報表可每週檢視；事件名與參數與 `HomeEventName` / `HomeEventPayload`（`types.ts`）一致。
