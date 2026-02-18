# E2E 煙霧測試指南

部署前執行關鍵流程驗證，減少意外上線。

## 首次設定

```bash
# 安裝 Playwright 瀏覽器（只需執行一次）
npx playwright install chromium
```

## 快速開始

```bash
# 一鍵執行（會 build + 啟動 wrangler pages dev + 跑測試）
npm run test:e2e
```

或手動分步：

```bash
# 1. Build
npm run build:main

# 2. 開一個終端，啟動 wrangler pages dev（port 3000 同源代理，避免 CORS）
npx wrangler pages dev . --port 3000

# 3. 另一個終端執行測試
npx playwright test --config=playwright.config.cjs
```

**為何用 wrangler 而非 serve？**  
`serve` 只提供靜態檔，API 會直接打 `bazi-api.billeetw.workers.dev`，瀏覽器會因 CORS 阻擋。`wrangler pages dev` 會跑 Pages Functions，`/compute/*` 由同源代理到遠端 Worker，無跨域問題。

## 測試內容

1. **推算時辰按鈕**：點擊「點我推算」不觸發 JS 錯誤（如 `openModal is not defined`）
2. **計算流程**：填表單 → 點「開始人生分析」→ 結果區顯示

## 若 wrangler 啟動失敗

可改用手動啟動後設 `reuseExistingServer: true`，或改用 `npx serve . -l 3000`（但會遇到 CORS，計算功能無法測試）。

## 部署前檢查清單

- [ ] `npm run build:main` 成功
- [ ] `npm run test:e2e` 通過
- [ ] 本地手動點一次「推算時辰」「開始人生分析」確認無誤
- [ ] `npm run deploy:pages` 或 `npm run deploy`
