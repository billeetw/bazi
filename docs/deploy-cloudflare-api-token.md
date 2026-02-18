# 部署用 CLOUDFLARE_API_TOKEN（本機與 CI 行為一致）

當 `CLOUDFLARE_API_TOKEN` 存在時，wrangler 會使用它進行部署，不再需要 `wrangler login` 瀏覽器登入。本機與 CI 可共用同一套認證方式。

## 1. 取得 API Token

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **My Profile** → **API Tokens** → **Create Token**
3. 使用 **Edit Cloudflare Workers** 範本，或自訂權限：
   - Account: Workers Scripts (Edit)、Workers KV Storage (Edit)、D1 (Edit)、Pages (Edit)
   - Zone: 若需綁定自訂網域則加上 Pages (Edit)
4. 建立後複製 token（只顯示一次）

## 2. 本機部署

```bash
export CLOUDFLARE_API_TOKEN="your_token_here"
# 可選：若 wrangler 無法自動偵測 account
export CLOUDFLARE_ACCOUNT_ID="your_account_id"

npm run deploy
```

或寫入 `.env.deploy`（已加入 .gitignore）後：

```bash
source .env.deploy && npm run deploy
```

## 3. CI 部署（GitHub Actions 範例）

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

在 GitHub 專案 **Settings → Secrets and variables → Actions** 新增：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`（可選，多數情況 wrangler 可從 token 推得）

## 4. 行為對照

| 環境 | 無 token | 有 CLOUDFLARE_API_TOKEN |
|------|----------|--------------------------|
| 本機 | 需 `wrangler login` 瀏覽器登入 | 直接 deploy，無互動 |
| CI   | 失敗（無法開啟瀏覽器） | 直接 deploy |

建議：本機與 CI 皆設定 token，行為一致、無需登入。
