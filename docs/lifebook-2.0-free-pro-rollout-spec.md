# 人生說明書 2.0：免費＋收費分層規格（實作版）

目的：把命書拆成
- 基礎版（模組1 + 12宮）：免費
- 進階版（模組二）：收費

此文件聚焦工程可落地方案，供 API、前端、後台、營運共用。

---

## 1) 產品分層定義

### 1.1 Tier 定義

- `free`：提供「自我結構認識」，不提供完整時間策略。
- `pro`：提供「時間軸 + 行動策略 + 收束」完整命書。

### 1.2 章節切分（v1 建議）

依 `worker/src/lifeBookTemplates.ts` 與 `worker/data/lifebook-section-order.json`：

- **Free（基礎）**
  - `s00,s03,s04,s02,s10,s01,s05,s06,s07,s08,s09,s11,s12,s13,s14`
  - 可選：`s22,s23`（若要提高免費留存可開；若要提高轉換可放 Pro）
- **Pro（進階）**
  - `s15,s15a,s16,s17,s18,s19,s20,s21`
  - 建議含 `s22,s23`（若不放 free）

### 1.3 商業建議（先上線版本）

- 先採：`s22,s23` 放 **Pro**（可讀性強、差異感高，適合作為付費亮點）。
- 第一次 A/B：
  - A：`s22,s23` Free
  - B：`s22,s23` Pro
  - 指標：升級率、7日回訪、平均閱讀完成率。

---

## 2) API 與資料契約

### 2.1 新增請求欄位（向後相容）

在 `/api/life-book/generate` 與 `/api/life-book/generate-section` 請求中增加：

- `plan_tier`: `"free" | "pro"`（預設 `free`）
- `unlock_sections?`: `string[]`（可選；企業方案或活動解鎖）
- `beta_invite_code?`: `string`（可選；後端驗證通過可提升為 `pro`）

### 2.2 回應欄位（供前端 gating）

在回應 payload 增加：

- `plan_tier`
- `available_sections: string[]`
- `locked_sections: Array<{ section_key, is_locked, lock_reason, teaser }>`
- `is_locked`（單章 API 回應）
- `lock_reason`（例如 `requires_pro`）

### 2.3 行為規則

- `generate`：
  - 只產生 `available_sections`。
  - 仍回 `locked_sections`（含 teaser payload），不生成 AI 文案，避免浪費 token。
- `generate-section`：
  - 若該 `section_key` 不在可用集合，回傳 `200` + `is_locked=true` + `lock_reason=requires_pro` + `teaser`。
  - 前端可直接顯示升級卡片，不視為系統錯誤。

### 2.4 Beta 邀請碼驗證 API（新增）

- `POST /api/life-book/beta/redeem`
  - Request: `{ "invite_code": "..." }`
  - Success: `{ "ok": true, "plan_tier": "pro", "unlock_sections": [], "redeemed_at": "..." }`
  - Failure: `{ "ok": false, "error": "邀請碼無效" }`
- 後端由 `LIFEBOOK_BETA_CODES`（逗號分隔）作為白名單真值來源。
- 不提供內建永久測試碼；封測名單一律由後端 `LIFEBOOK_BETA_CODES` 管理。

---

## 3) 權限與章節矩陣（單一真值）

### 3.1 新增權限設定檔

新增檔案：`worker/data/lifebook-plan-matrix.json`

```json
{
  "free": {
    "sections": ["s00","s03","s04","s02","s10","s01","s05","s06","s07","s08","s09","s11","s12","s13","s14"],
    "optional_sections": []
  },
  "pro": {
    "sections": ["s00","s03","s04","s02","s10","s01","s05","s06","s07","s08","s09","s11","s12","s13","s14","s15","s15a","s16","s17","s18","s19","s20","s22","s23","s21"],
    "optional_sections": []
  }
}
```

### 3.2 判斷順序

1. 讀 `plan_tier` 對應白名單
2. 套用 `unlock_sections`（若有）
3. 與 `SECTION_ORDER` 交集後作為最終可用章節

---

## 4) 後端改動點（最小侵入）

### 4.1 Worker 端

- 檔案：`worker/src/index.ts`
  - 在 `generate` 與 `generate-section` 入口解析 `plan_tier`。
  - 先算 `available_sections` 再進入生成流程。
  - 對 locked 章節直接回 403（單章）或略過（整本）。

### 4.2 Prompts 層

- 檔案：`worker/src/lifeBookPrompts.ts`
  - 保持既有能力，不改演算法。
  - 僅在生成前就做好章節篩選，避免進入 prompt 組裝。

### 4.3 DB 儲存

- 目前 `life_books` 已有 `document_json`（見 admin API）。
- 建議新增欄位（migration）：
  - `plan_tier TEXT`（`free`/`pro`）
  - `unlocked_sections_json TEXT`（快取可用章節）
  - `upgrade_from_book_id TEXT`（升級追蹤）

---

## 5) 前端與閱讀器流程

### 5.1 章節列表顯示

- Free 使用者看得到全章節目錄，但對 locked 章節顯示：
  - 標題
  - 一句 preview（非 AI 生成，可用固定模板）
  - 升級 CTA

### 5.2 交互建議

- 點 locked 章節：
  - 不打開空白頁
  - 顯示「本章屬於進階模組：時間主線／十年策略／行動建議」
- 在 `s14` 結尾插入升級導流最自然（從 12宮過渡到時間模組）。

---

## 6) 升級策略（重算成本控制）

### 6.1 升級路徑

- 既有 free 命書升級 pro 時：
  - 不重跑已存在的 free 章節
  - 只補算 pro 章節並合併到 `document_json`

### 6.2 快取策略

- `document_json` 內以 `sections[section_key]` 為粒度存儲。
- 升級時計算缺失章節集合：
  - `missing = proSections - existingSections`

### 6.3 Cache Key（建議定版）

- 每章快取鍵建議：
  - `(user_id, section_key, input_hash, plan_matrix_version)`
- `input_hash` 建議至少包含：
  - 出生資料（年月日、時辰、曆法、時區）
  - 性別（若影響盤面）
  - 主要 chart 算法版本（若有）

### 6.4 Invalidation 規則（先定死）

- **升級 free → pro**：
  - 只補算 `missing sections`
  - 已存在且 `input_hash` 相同的章節直接重用
- **使用者改出生資料**：
  - 視為新 `input_hash`，整本重算（舊資料保留歷史版本，不覆蓋）
- **降級 pro → free**：
  - 不刪章節資料，只在顯示層做權限隱藏
- **plan matrix 改版**：
  - 依權益策略決定是否重算（見 §6.5）

### 6.5 Plan Matrix 版本策略（建議採用）

- 建議：**凍結版本（freeze by first generation）**
  - 使用者首次生成時，寫入 `user_plan_matrix_version`
  - 後續都用該版本判斷 `available/locked`
- 優點：
  - 權益穩定，不會因營運調整而「章節忽然消失」
  - 客訴與法務風險最低
- 若要改成動態制，需在 UI 明確告知權益會隨版本更新調整

---

## 7) 指標與驗收

### 7.1 追蹤指標

- `free_to_pro_conversion_rate`
- `locked_section_click_rate`
- `first_paid_section_read_completion`
- `7d_retention`（free vs pro）

### 7.2 驗收條件（技術）

- `generate`：free 不可返回 pro 章節內容
- `generate-section`：locked 必回 403 + machine-readable reason
- 升級後可在同一份命書看到新增章節（不覆蓋舊章）
- `verify:lifebook` 測試通過 + 新增 tier 測試

---

## 8) 分期上線計畫

### Phase A（1 週）

- 完成 plan matrix + API gating + 前端 locked card
- 不改 prompt 不改內容

### Phase B（1 週）

- 上線升級補算（delta generation）
- 加上 admin 可查 `plan_tier`

### Phase C（1-2 週）

- A/B 測試 `s22/s23` 放 free 或 pro
- 根據數據調整最終切層

---

## 9) 風險與對策

- **風險**：免費版太完整，升級動機不足
  - **對策**：把時間決策（s15-s21）維持在 Pro；必要時加 `s22/s23` 到 Pro
- **風險**：章節互相引用導致文案斷裂
  - **對策**：locked 章節顯示「對應摘要卡」與導流文案，不留空
- **風險**：雙來源數據不一致
  - **對策**：模組二以 findings/timeAxis 為唯一真值（沿用現況）

---

## 10) 需要同步更新的檔案清單

- `worker/src/index.ts`（API gating）
- `worker/data/lifebook-plan-matrix.json`（新增）
- `functions/api/life-book/[[path]].js`（如需透傳 `plan_tier` 監控）
- 前端命書 viewer（章節鎖定 UI）
- DB migration（`plan_tier` 等欄位）

---

## 11) 決策備註

- 本規格不更動命理算法本體，僅做「章節層的產品分發」。
- 先用最小改動驗證商業模型，再決定是否把「進階章節語氣/深度」做二階段差異化。

---

## 12) Teaser 與一頁式轉換頁（參考稿，待你補完）

現行 API 鎖章 `teaser` 為簡短欄位：`{ section_key, title, teaser }`（`teaser` 為一句說明字串）。

**下一階**可擴充為「轉換頁／升級卡」共用結構，與一頁式 landing 對齊，例如：

```json
{
  "title": "你的未來，不該只有「努力」這一個選項",
  "hook": "你已經知道自己的才華在哪，也知道這幾年一直覺得使不上力的原因。不是你不夠好，而是你現在走的方向，正在限縮你的未來。",
  "insight": "你現在的處境，其實是一個關鍵轉換期。如果繼續用原來的方式硬撐，不但會越做越累，還會錯失更好的結果。",
  "open_loop": "如果能在最佳的時機轉換人生跑道，未來的發展會完全不同。人與人之間的差別不在能力，而是在有沒有看清人生最重要的關鍵時間點！。",
  "cta_hint": "現在就看清你未來三年的前景、在最關鍵的時刻、做出改變人生的關鍵選擇，別再錯過翻轉人生的最好機會！"
}
```

**欄位語意（建議）**

| 欄位 | 用途 |
|------|------|
| `title` | 大標／情緒錨點 |
| `hook` | 共鳴＋痛點，承接讀者現狀 |
| `insight` | 重新框定（reframe），不給完整解法 |
| `open_loop` | 半揭露，留懸念促升級 |
| `cta_hint` | 行動暗示（與付費價值連結） |

**實作順序建議**：先固定 **全站一組** 預設文案（或依 `plan_matrix_version` 換檔）；再視需要接 **rule-based**（章節／命盤訊號）或輕量 AI。**不與現行命理章節內容混為一體**，避免與付費正文搶語意空間。

### 12.1 Rich Teaser 文案庫（已對齊版本）

可先作為固定模板（不吃命盤），後續再做 rule-based 個人化。

#### A) 財運

```json
{
  "title": "你不是賺不到錢，而是用錯了放大的方式",
  "hook": "你其實有能力賺更多，但這幾年卻一直卡在差不多的狀態。不是你不夠努力，而是你現在的方式，很難讓收入真正放大。",
  "insight": "有些時候努力會有回報，但有些時候再努力都只是維持現狀。你現在正處在一個容易「用錯力氣」的階段。",
  "open_loop": "有些人會在對的時間點放大成果，看起來像運氣，其實只是踩對了節奏。而你現在，其實已經接近那個會開始拉開差距的時間點上。",
  "cta_hint": "現在就看清你未來三年的財運節奏，別再把力氣花在回報有限的地方。"
}
```

#### B) 感情

```json
{
  "title": "為什麼你的關係總是卡在同一個地方？",
  "hook": "你遇到的問題，很可能不是對方，而是某種模式一直在重複。這種感覺，你應該已經經歷過不只一次。",
  "insight": "關係一開始都很好，但到某個階段就開始卡住，這不是巧合，而是一個正在循環的狀態。",
  "open_loop": "如果沒有看清這個模式，就算換一個人，過一段時間還是會走到類似的地方。而你現在，其實正處在這個循環的關鍵位置上。",
  "cta_hint": "現在就看清你接下來的關係走向，別再把時間花在重複的錯誤裡。"
}
```

#### C) 人生轉折

```json
{
  "title": "你的人生轉折，其實已經在發生了",
  "hook": "如果你最近開始想改變，卻又不確定該怎麼走，那不是偶然。這個轉折，其實已經開始了。",
  "insight": "有些時間點適合推進，有些時間點反而要收斂。問題是，大多數人是在做錯之後才看懂差別。",
  "open_loop": "很多人會在關鍵時刻做出看起來合理，但之後代價很高的決定。而你現在，其實已經站在那個會開始拉開差距的時間點上。",
  "cta_hint": "現在就看清你接下來的關鍵轉折，別再把時間用在錯的決定上。"
}
```

#### D) 天賦 / 定位

```json
{
  "title": "你卡住的原因，可能只是站錯位置",
  "hook": "你現在的吃力感，不一定是能力問題，而是你所在的位置，沒有讓你的優勢被放大。這種落差，你其實已經感覺到了。",
  "insight": "有些人一換環境就變得很順，有些人怎麼努力都很吃力。差別不在努力，而在位置對不對。",
  "open_loop": "如果方向沒有對，就算短期有成果，長期還是會感到消耗。而你現在，其實正處在一個可以重新對齊的位置上。",
  "cta_hint": "現在就看清你真正適合的方向，別再把時間花在不會放大的位置上。"
}
```
