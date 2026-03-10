# 靜態資源路徑規範（避免 clean URL 下 404）

## 問題

當頁面以 **clean URL** 提供（例如 `/divination` 而非 `/divination.html`）時，相對路徑會以「目前路徑」為基準解析：

- `dist/app.js` 在 `/divination` 下會變成 `/divination/dist/app.js` → **404**
- JS 裡的 `fetch("data/xxx.json")` 會變成 `/divination/data/xxx.json` → **404**

腳本載入失敗會導致頁面報錯（例如「divination 1」且無詳細內容）、按鈕無反應。

## 規範

### 1. 根目錄入口頁（可能被 rewrite 成 clean URL 的頁面）

- 在 `<head>` 中 **緊接 `<meta charset="UTF-8" />` 之後** 加上：
  ```html
  <base href="/" />
  ```
- 所有 **dist 資源** 使用 **根相對路徑**：
  - `href="/dist/tailwind.css"`
  - `src="/dist/app.js"`、`src="/dist/divination.js"`、`src="/dist/expert-admin.js"` 等

這樣無論網址是 `/divination`、`/divination.html`、`/consultation` 等，資源都會從站根載入；JS 內的 `fetch("data/...")` 也會依 `<base>` 解析為 `/data/...`。

**已套用頁面**：`index.html`、`divination.html`、`consultation.html`、`expert-admin.html`、`startup.html`、`articles.html`、`taisui-rules.html`、`admin.html`。

### 2. 子目錄頁（例如 `articles/*.html`）

- **不要** 在這些頁面加 `<base href="/" />`，否則站內相對連結（如 `../index.html`、同目錄文章連結）會錯。
- 僅將 **共用的 dist 資源** 改為根相對路徑：
  - `href="/dist/tailwind.css"`（不要用 `../dist/tailwind.css`）

**已套用**：`articles/*.html` 的 tailwind 已改為 `/dist/tailwind.css`。

### 3. 新增頁面檢查清單

- 若新頁面可能以 clean URL 提供（例如 `/新頁`），請：
  1. 加上 `<base href="/" />`
  2. 所有 `dist/`、`data/` 的引用使用根相對路徑（`/dist/...`、或在 JS 中依 document base 解析）
- 上線前用 **實際會用的 URL** 測一次（例如 `https://www.17gonplay.com/divination`），不要只測 `divination.html`。

## 參考

- 修復紀錄：占卦頁在 `/divination` 下出現「divination 1」無內容錯誤，原因為相對路徑導致 `dist/divination.js` 404。
- HTML 規範：[\<base\>](https://html.spec.whatwg.org/multipage/semantics.html#the-base-element) 會影響文件中與腳本內相對 URL 的解析基準。
