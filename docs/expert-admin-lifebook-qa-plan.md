# 專家後台命書：API 統一 + 問題答案列表 調整建議

## 現況

- **expert-admin**：已使用 `POST /api/life-book/generate-section` 逐章呼叫（20 次）
- **20 個預設問題**：對應 `SECTION_ORDER` s01~s20，主題來自 `life-book-prompts.ts` 的 `SECTION_DESCRIPTIONS`
- **API 回傳**：每章 JSON 含 `structure_analysis`、`behavior_pattern`、`blind_spots`、`strategic_advice`
- **目前 UI**：僅顯示進度文字，完成後開新頁 + 下載 HTML，**沒有**問題與答案列表

---

## 建議調整

### 1. 在「一鍵生成命書」下方新增「問題與答案列表」

**位置**：AI Prompt 與命書生成區塊下方，或獨立一個可摺疊區塊

**結構**：
```
[一鍵生成命書] [複製 Prompt] [下載 Prompt]
[textarea: AI Prompt]

--- 新增 ---
## 問題與答案列表
（生成完成後顯示，或逐章完成時即時更新）

| # | 問題（章節主題） | 答案摘要 | 狀態 |
|---|-----------------|----------|------|
| 1 | 命主／身主／身宮… | structure_analysis 前 80 字… | ✓ |
| 2 | 命宮三方四正… | … | ✓ |
...
```

**實作方式**：
- 在 `generateLifeBook()` 迴圈中，每取得一章 `sections[sectionKey]` 就即時 append 到列表
- 問題文字：用 `SECTION_DESCRIPTIONS[sectionKey]` 或 API 回傳的 `title`
- 答案：可顯示完整四段（structure_analysis、behavior_pattern、blind_spots、strategic_advice），或摘要 + 點擊展開
- 支援「單章重試」：某章失敗時可只重跑該章

### 2. 統一 API 使用

**目前**：expert-admin 已用 `generate-section`，無需改動

**若「兩邊」指**：
- **專家後台 vs. 未來用戶端購買流程**：兩者都應呼叫 `generate-section`（逐章），避免 Worker 逾時
- **Worker 的 generate vs. generate-section**：建議統一用 `generate-section`，`generate` 可保留作為備用

### 3. 優化方向

- **單章編輯**：列表可支援「編輯單章答案」後再重新組裝 HTML（進階）
- **匯出 Q&A**：可匯出 JSON 或 Markdown 格式的問題答案列表
- **快取**：若同一命盤已生成過，可先載入既有 sections 再顯示列表，僅重跑失敗章節

---

## 需釐清

1. **「兩邊」具體指什麼？**
   - A) 專家後台 vs. 未來用戶端購買流程
   - B) 專家後台 vs. 報名紀錄後台（admin.html）
   - C) Worker 的 generate（一次 20 章）vs. generate-section（逐章）
   - D) 其他

2. **問題答案列表的顯示方式**
   - 簡要：每行只顯示「問題 + 答案前 80 字 + 狀態」
   - 完整：四段（structure_analysis、behavior_pattern、blind_spots、strategic_advice）分開顯示
   - 可摺疊：預設收合，點擊展開

3. **是否需要單章重試**
   - 某章失敗時，是否提供「重試該章」按鈕，而不必重跑全部 20 章？

---

## 實作步驟（依你確認後執行）

1. 在 expert-admin 的「AI Prompt 與命書生成」區塊下方新增 `<div id="lifeBookQaList">`
2. 修改 `generateLifeBook()`：每完成一章即更新 DOM，顯示該章問題與答案
3. 若需單章重試：為每章加「重試」按鈕，失敗時可點擊只重跑該章
4. 可選：匯出 Q&A 為 JSON 按鈕
