# 主應用程式 Bundle

## 說明

主流程 JS 已由約 50 個獨立 script 合併為單一 `dist/app.js`，可減少 HTTP 請求、改善快取。

## 建置

```bash
npm run build:main
# 或
npx vite build --config vite.main.config.ts
```

產出：`dist/app.js`（約 340KB，gzip 後約 107KB）

## 開發流程

1. 修改 `js/` 下任何檔案後，需重新執行 `npm run build:main`
2. 接著執行 `npx wrangler pages dev . --port 8788` 預覽

## 部署前

建議在部署前執行：

```bash
npm run build:main
```

確保 `dist/app.js` 為最新版本。

## 還原為獨立 script（除錯用）

若需還原為載入個別檔案（例如除錯某模組），可從 git 還原 `index.html` 中該區塊的 script 標籤。
