# D1 資料庫 Migration 說明

後台「活動報名」若出現「讀取失敗（可能尚未執行 event_registrations 的 migration）」  
代表 D1 尚未建立 `event_registrations` 表，請在本機終端機執行下列指令。

## 1. 本機開發（wrangler pages dev 時使用）

```bash
npx wrangler d1 migrations apply consult-db --local
```

## 2. 正式環境（已部署的 Cloudflare Pages）

請先登入 Cloudflare（`npx wrangler login`），再執行：

```bash
npx wrangler d1 migrations apply consult-db --remote
```

若尚未登入，會提示你開瀏覽器完成登入。

## 確認

- 本機：執行 `--local` 後，用 `wrangler pages dev` 開後台，活動報名應可正常讀取。
- 正式：執行 `--remote` 後，重新整理後台頁面即可。

資料庫名稱與 ID 見 `wrangler.toml`（`consult-db`）。
