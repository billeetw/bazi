# KV 綁定設定（Pages 專案）

專案使用 **wrangler.toml** 作為設定來源時，Cloudflare Dashboard 的 **Settings → Bindings → Add** 會是**灰色無法點擊**（由設定檔統一管理）。

## 做法：在 wrangler.toml 裡綁定 KV

1. **建立 KV namespace**  
   - 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**。  
   - 左側選 **KV**。  
   - 點 **Create namespace**，名稱例如 `BAZI_CACHE`。  
   - 建立後在列表中找到該 namespace，複製其 **Namespace ID**（一串 UUID）。

2. **寫入 wrangler.toml**  
   - 專案根目錄的 `wrangler.toml` 已包含 KV 綁定區塊，例如：
     ```toml
     [[kv_namespaces]]
     binding = "CACHE"
     id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"
     ```
   - 將 `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` 替換成上一步複製的 **Namespace ID**。  
   - 存檔。

3. **部署**  
   - 提交並 push（若用 Git 連動），或在本機執行 `npx wrangler pages deploy`。  
   - 部署完成後，Functions 即可透過 `env.CACHE` 使用該 KV（例如 `estimate-hour-stats` 的 1 小時快取）。

## 參考

- 防濫用計畫：`docs/abuse-prevention-implementation-plan.md` 的 Step 2.3。
