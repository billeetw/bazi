# P0.6：s15a key-level fallback 修正報告

## 1️⃣ 修改檔案

- `worker/src/lifeBookPrompts.ts`
- `worker/tests/lifeBookPrompts-module2.test.ts`

（未改：buildS15aPlaceholderMapFromV2.ts、template、reason engine、s16。）

---

## 2️⃣ Fallback 邏輯差異

**原本（block-level fallback）**

- 條件：`if (!(opts?.sectionKey === "s15a" && s15aV2Usable))` 時才：
  - 計算 overlap 計數（shockCount, mineCount, wealthCount）與 palaceToTag
  - 寫入 map.overlapSummary、map.shockCount、map.mineCount、map.wealthCount、map.shockBlocks、map.mineBlocks、map.wealthBlocks 等
- 結果：只要 `s15aV2Usable === true`，整段 fallback 都不跑，V2 沒產的 key（例如只有 scores/events、沒有 stackSignals）就全部空白。

**現在（key-level fallback）**

- **Overlap 計數**：不論 s15a 是否 V2 usable，只要在 timeModuleKeys 內都**一律**計算 shockCount、mineCount、wealthCount、palaceToTag（供 s15a 補 key 與 s15 等使用）。
- **寫入 map**：
  - **sectionKey === "s15a"**：依 key 判斷是否為空；只有 `isEmpty(map.xxx)` 時才用 overlap 結果寫入該 key。  
    補寫的 key：overlapSummary、shockCount、mineCount、wealthCount、shockBlocks、mineBlocks、wealthBlocks、keyYearsMineLead、keyYearsWealthLead、keyYearsShockLead、volatileSection、criticalRisksSection、opportunitiesSection。
  - **sectionKey !== "s15a"**（含 s15）：維持原本整段寫入，邏輯不變。

**isEmpty**：`v === undefined || (typeof v === "string" && !v.trim())`，V2 有非空字串就不覆寫。

---

## 3️⃣ 測試結果

- 執行：`npm test -- --run lifeBookPrompts-module2.test.ts lifebook-v2-reason.test.ts`
- 結果：**2 個檔案 39 個測試全部通過**（含 3 個 P0.6 新增用例）。

| 測試 | 驗收 | 結果 |
|------|------|------|
| **s15a V2-primary with only scores still fills overlap + shock/mine/wealth** | timeWindowScoresSummary 有值；overlapSummary、shockCount、mineCount、wealthCount 皆由 fallback 補齊、非空 | ✅ pass |
| **s15a V2-primary with only events still fills fallback blocks** | eventProbabilitiesSummary 有值；shockBlocks、mineBlocks、wealthBlocks 由 fallback 補齊 | ✅ pass |
| **s15a full V2 does not get fallback overwrite** | overlapSummary 含「劇烈震盪」、shockCount "1"、mineCount "0"、wealthCount "0"（V2 stackSignals 結果），chart 的 overlap 未覆寫 V2 | ✅ pass |

---

## 4️⃣ 風險

- **s15**：未改行為。s15 時走 `else` 分支，仍是一次寫入整段 overlap／shock／mine／wealth，與修改前一致。
- **buildOverlapDetailBlocks**：s15a key-level 時會多呼叫一次（僅在需要補 shockBlocks/mineBlocks/wealthBlocks 時）；s15 原本就會呼叫，負擔不變。
- **V2 與 fallback 內容不一致**：若 chart 有 overlap 而 V2 只有部分 key（例如只有 timeWindowScores），會出現「時間窗來自 V2、統計與區塊來自 chart overlap」的混合；屬預期（key-level 補洞），不視為錯誤。
