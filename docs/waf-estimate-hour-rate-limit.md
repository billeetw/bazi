
# WAF 限流設定：推算時辰 API（階段一 1.3）

同 IP 在 1 分鐘內對 `/api/me/estimate-hour` 請求超過 10 次時，由 Cloudflare 觸發 **Managed Challenge**（驗證碼），在請求進入 Worker / D1 前即攔截。此設定需在 **Cloudflare Dashboard** 手動完成，無需改程式。

## 步驟

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 選擇你的網域（本專案對應的網域）。
3. 左側選 **Security** → **WAF**。
4. 在 **Custom rules**（或 **Rate limiting rules**）中點 **Create rule**。
5. 設定如下：

| 項目 | 值 |
|------|-----|
| **Rule name** | `estimate-hour rate limit`（或自訂名稱） |
| **Expression** | `(http.request.uri.path contains "/api/me/estimate-hour")` |
| **Rate limit** | 同一 IP，1 分鐘內超過 **10** 次 |
| **Action** | **Managed Challenge** |

6. 儲存規則。

## 說明

- 不需改程式；請求在進入 Pages Functions / D1 前就會被 Cloudflare 攔截。
- 與後端 1.1 的「每用戶每日 5 次、間隔 30 秒」互補：WAF 擋同 IP 短時間大量請求，後端擋單一帳號濫用。

完成後可於檢查清單勾選：WAF 規則已設：`/api/me/estimate-hour` 同 IP 1 分鐘 > 10 次 → Managed Challenge。