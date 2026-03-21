# 命書 section_key 契約（避免「無效的 section_key」）

## 問題現象

- 前端顯示「模組二：時間主線與功課」時，若 worker 的 `SECTION_ORDER` / `SECTION_TEMPLATES` **未包含**該 section_key，API 會回傳 `無效的 section_key`，章節整段消失或顯示錯誤。
- 曾發生：僅加入 s15，導致 s16～s21 全部無效。

## 契約

1. **前端**（`src/lifebook-viewer/constants.ts`）  
   - `SECTION_ORDER`、`MODULE_MAP` 定義了會向使用者展示的章節（含 s15, s15a, s16～s21）。

2. **Worker**（`worker/src/lifeBookTemplates.ts`）  
   - `SECTION_ORDER`：API 驗證 `section_key` 時，只接受此陣列內的值。  
   - `SECTION_TEMPLATES`：每個 `SECTION_ORDER` 中的 key 都必須有一筆對應的 template（`section_key`、`title`、`description` 等）。

3. **一致範圍**  
   - 凡前端會請求生成或顯示的 section_key（尤其是**模組二＋收束**：s15, s15a, s16, s17, s18, s19, s20, s21），**必須同時存在於** worker 的 `SECTION_ORDER` 與 `SECTION_TEMPLATES`。

## 未來避免類似錯誤的辦法

### 1. 新增章節時必做

- 在前端 `constants.ts` 新增或調整 section_key 時，**同步**在 worker `lifeBookTemplates.ts`：
  - 將該 key 加入 `SECTION_ORDER`；
  - 在 `SECTION_TEMPLATES` 新增一筆對應的 template（`section_key`, `title`, `description`, `slice_types`, `palace_focus` 等）。
- 若只改前端不改 worker，該章節在呼叫 generate/narrate API 時會回傳「無效的 section_key」。

### 2. 自動化防呆：測試

- **`worker/tests/sectionKeyValidation.test.ts`**：
  - 斷言「模組二＋收束」的 section_key 全在 `SECTION_ORDER` 且各有 `SECTION_TEMPLATES` 條目；
  - 斷言 `SECTION_ORDER` 與 `SECTION_TEMPLATES` 的 section_key 集合一致；
  - 驗證 s15 的 placeholder（如 `decadalLimitsList`、`decadalFourTransformBlocks`、`currentDecadalHomework`）能正確產出。
- 新增前端章節時，若該章節會打 worker API，請**一併**在 `TIME_MODULE_SECTION_KEYS`（或對應常數）加入新 key，並跑一次上述測試，確保 worker 已支援。

### 3. 可選：單一來源清單

- 若希望「前端與 worker 共用同一份 section 清單」，可考慮：
  - 將「所有會打 API 的 section_key」抽成共用的 JSON 或 TS 常數（例如在 `shared/` 或由 worker 匯出、前端 import）；
  - 或至少在文件中維護一份「會打 API 的 section_key 清單」，新增章節時對表更新兩端。
- 目前以「測試強制一致」為主，單一來源可作為後續重構選項。

## 參考

- Worker 驗證：`worker/src/index.ts` 中 `SECTION_ORDER.includes(sectionKey)` 與 `SECTION_TEMPLATES.find(t => t.section_key === sectionKey)`。
- 前端章節順序與分組：`src/lifebook-viewer/constants.ts` 的 `SECTION_ORDER`、`MODULE_MAP`。
- 測試：`worker/tests/sectionKeyValidation.test.ts`。
