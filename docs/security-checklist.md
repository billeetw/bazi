# 安全設定檢查清單

部署後請在 Cloudflare Dashboard 驗證下列項目。

## 一、推算時辰 API 限流（WAF）

**目標**：同 IP 短時間大量請求後觸發驗證碼，在進入 D1 前攔截。

| 項目 | 狀態 |
|------|------|
| 網域已選：Pages 部署網域（如 www.17gonplay.com）或 Workers API 網域 | ☐ |
| Security → WAF → Custom rules | ☐ |
| 規則名稱：`estimate-hour rate limit` | ☐ |
| Expression：`(http.request.uri.path contains "/api/me/estimate-hour")` | ☐ |
| 限流：同 IP 1 分鐘內 > 10 次 | ☐ |
| Action：**Managed Challenge** | ☐ |

**說明**：若 API 部署於 `17gonplay-api.billeetw.workers.dev`，需在該 Workers 綁定的網域下設定 WAF（Workers 可綁自訂網域，WAF 規則套用於該網域）。

**詳見**：[waf-estimate-hour-rate-limit.md](waf-estimate-hour-rate-limit.md)

---

## 二、後端與前端防護（程式碼已實作）

| 項目 | 檔案 | 狀態 |
|------|------|------|
| 每用戶每日 5 次、間隔 30 秒 | `functions/api/me/estimate-hour.js` | ☐ 已部署 |
| 前端 q1～q19 完整驗證 | `js/ui/components/birth-time-identifier.js` | ☐ 已部署 |

---

## 三、環境變數（敏感資訊勿提交）

| 變數 | 用途 |
|------|------|
| ADMIN_USER、ADMIN_PASSWORD | 後台 Basic Auth |
| JWT_SECRET | 登入 JWT 簽章 |
| GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET | Google 登入 |

**本機**：`.dev.vars`（已加入 .gitignore）  
**正式**：Cloudflare Pages → Settings → Environment variables
