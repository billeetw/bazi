# 命書 Viewer 部署驗證（避免「改了程式、線上像沒改」）

## 為何常白忙一陣

- **`dist/` 在 `.gitignore`**：線上的 `dist/lifebook-viewer.html`、`dist/lifebook-viewer.js` **不會**隨 git 更新，必須在**部署前**於本機或 CI **重新 build**。

### 為什麼「以前都用 `./deploy.sh` 都沒事」、現在才卡住？

- **以前**：多半只動到 **JS bundle**（`dist/lifebook-viewer.js` / `dist/app.js`），或 **main** 常更新、本機 deploy 與線上認知一致，就比較少察覺「HTML 沒換」。
- **這次**：邏輯加在 **`lifebook-viewer.html` 內嵌腳本**裡；若 **www** 實際吃的是 **Cloudflare「Production = main」** 上**舊的遠端 build**，而不是你本機剛打好的 `dist/lifebook-viewer.html`，就會出現「本機 4k、線上 2k」——**不是 `./deploy.sh` 壞掉**，而是 **「誰在更新掛在 www 上的那份 Production」** 變成兩條路（**本機 wrangler upload** vs **Git 自動建 main**）要對齊。
- 若 Dashboard 顯示 **Automatic deployments** 且 **Production 仍是 main、幾天／一天前**，而新 commit 都在 **feature 分支**，則 **www** 不會跟 feature 上的 Preview 同步；需 **merge 到 main** 或確認 **direct upload 真的更新了 Production**（見下文「本機已 4k」一節）。
- **`wrangler pages deploy .` 上傳的是當下目錄**：若沒跑完 build、或用了舊的 `dist/`，上線的就是舊檔。
- **清 CDN 快取無法補救「源檔沒換」**：Purge 只讓邊緣重新抓；若 Pages 上的檔案仍是舊的，怎麼清都一樣。

命書頁同時依賴 **HTML 內嵌腳本** 與 **JS bundle**；只改 TS/JS 卻沒重新產出 **`dist/lifebook-viewer.html`**，就會出現版本不一致（例如網址不補 `view=timeline`）。

---

## 部署前最短檢查（建議列為固定流程）

`./deploy.sh` 在 **Pages 部署前**會強制檢查 `dist/lifebook-viewer.html` 是否含 `searchParams.set("view", "timeline")`；若沒有會**中止**，避免再上傳舊檔。若你**不用** `deploy.sh` 而手動 `wrangler pages deploy`，請自行做下列步驟。

1. 在**專案根目錄**執行（與 `deploy.sh` 對齊）：
   - `npm run build:lifebook-viewer`
   - `npm run build:main`（主站 `dist/app.js` 含「開啟命書」的 query）
2. 再執行 **`wrangler pages deploy .`**（或 `./deploy.sh`）。
3. 部署後跑（對正式網域）：
   ```bash
   npm run verify:lifebook-viewer-deploy
   ```
   - 應看到 HTML 含 **`searchParams.set("view", "timeline")`**（或等價邏輯）。
   - 若線上 HTML 約 **2k bytes**、本機 build 約 **4k+ bytes**，代表 **線上仍是舊 `dist/lifebook-viewer.html`**，先別懷疑瀏覽器，先確認 **build 與部署目錄**。
4. 必要時再對 **`/dist/lifebook-viewer.html`**、**`/dist/lifebook-viewer.js`**、**`/dist/app.js`** 做 Cloudflare **Purge**。

---

## 可選：瀏覽器 E2E（需網路 + Playwright）

```bash
npx playwright install chromium
LIFEBOOK_E2E_PROD=1 npm run test:e2e:lifebook-prod
```

（需設 `LIFEBOOK_E2E_PROD=1`；詳見 `playwright.lifebook-prod.config.cjs`。）

---

## 相關檔案

| 用途 | 路徑 |
|------|------|
| 線上 HTML/部署一致性檢查 | `scripts/verify-lifebook-viewer-deploy.mjs`（`npm run verify:lifebook-viewer-deploy`） |
| 正式站網址 `view=timeline` E2E | `e2e/lifebook-viewer/prod-view-url.spec.ts` |
| 入口 HTML 內嵌補 `view` | `lifebook-viewer.html`（build 後在 `dist/lifebook-viewer.html`） |
| 入口 JS 同步補 `view` | `src/lifebook-viewer/syncDefaultTimelineUrl.ts` |
| 主站跳轉加 `view=timeline` | `js/ui.js`（進 `dist/app.js`） |
| HTML 勿長快取 | `_headers` 內 `/dist/lifebook-viewer.html` |

---

## 本機已是 ~4k bytes，線上仍 ~2237 bytes（verify 一直失敗）

代表 **掛在 www.17gonplay.com 的那次 Cloudflare Pages 部署，並沒有帶上你本機剛 build 的 `dist/lifebook-viewer.html`**。清快取無法解決。

請依序排查：

1. **你到底用哪一種方式上線？**
   - **A. 本機 `wrangler pages deploy .`**：必須在**含最新 `dist/` 的專案根目錄**執行，且 `--project-name` 須為**綁定該網域**的專案（例如 `deploy.sh` 裡的 `bazi`）。在別台電腦、子目錄、或沒先 build 就 deploy，線上都不會變。
   - **B. Git 連動 Cloudflare Pages（push 後自動建置）**：線上 `dist/` 來自 **Cloudflare 遠端 build**，**不是**你筆電裡的 `dist/`。若 **Build command** 沒跑 `npm run build:lifebook-viewer`，或 **`npm run build` 在 CI 因 `tsc` 失敗而從未完成**，產物會一直是舊的或缺檔。請到 **Workers & Pages → 專案 → Settings → Builds** 看 **Build command / Output**，並看最近一次 **Build logs** 是否成功、是否執行到 lifebook-viewer 的 build。

2. **網域是否指到同一個 Pages 專案？**  
   在 **Custom domains** 確認 `www.17gonplay.com` 綁在**你正在 deploy 的那個**專案上；若有多個 Pages 專案，可能改錯專案。

3. **部署成功後再 Purge**  
   確認 **Dashboard 上該次 deployment 時間**晚於你本機 deploy 之後，再對 `/dist/lifebook-viewer.html` 做 Purge。

---

*本備忘因實務上「光檢查瀏覽器與快取」無法發現源檔未更新而整理。*
