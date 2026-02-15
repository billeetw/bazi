# WAF Bot Fight Mode（階段三 3.3）

Cloudflare **Bot Fight Mode** 可對疑似機器人流量進行挑戰或限制，降低惡意爬蟲與腳本對網站的影響。此設定需在 **Cloudflare Dashboard** 手動開啟，無需改程式。

## 步驟

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 選擇你的網域（本專案對應的網域）。
3. 左側選 **Security** → **Bots**。
4. 找到 **Bot Fight Mode**（或 **Configure** → **Bot Fight Mode**）。
5. 將 **Bot Fight Mode** 設為 **On**（若方案支援）。

## 說明

- **方案限制**：Bot Fight Mode 是否可用依 Cloudflare 方案而異；若畫面中無此選項，表示目前方案不支援。
- **效果**：Cloudflare 會對疑似機器人請求進行挑戰或限制，與階段一 WAF 限流、後端頻率限制互補。
- **可隨時開啟**：無需配合程式部署，隨時可在 Dashboard 開啟或關閉。

完成後可於檢查清單勾選：Bot Fight Mode 已開啟（若方案支援）。
