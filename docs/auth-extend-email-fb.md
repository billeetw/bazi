# 擴充登入方式：Email、Facebook 建議方案

目前為 **Google OAuth**（code → 後端換 token → 取 userinfo → 寫入 `users` → 回傳 JWT）。若要新增 **Email** 與 **Facebook**，可依下列方式進行。

---

## 一、整體建議

| 方式 | 建議優先順序 | 難度 | 說明 |
|------|----------------|------|------|
| **Facebook 登入** | 先做 | 低 | 流程與 Google 幾乎相同，後端多一個 route、前端多一個按鈕即可。 |
| **Email（魔法連結）** | 次之 | 中 | 免密碼、體驗好，但需「發信」服務（如 Resend / SendGrid）。 |
| **Email + 密碼** | 可選 | 中 | 不需發信，需密碼雜湊、註冊/登入/忘記密碼流程。 |

同一套 **JWT** 與 **users / user_charts** 可共用，僅 `provider`、`provider_user_id` 來源不同。

---

## 二、Facebook 登入

### 1. 與 Google 的對應關係

| 項目 | Google | Facebook |
|------|--------|----------|
| 後端 route | `POST /api/auth/google` | `POST /api/auth/facebook` |
| 環境變數 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` |
| 換 token | `oauth2.googleapis.com/token` | `graph.facebook.com/oauth/access_token` |
| 取使用者 | `oauth2/v2/userinfo` | `graph.facebook.com/me?fields=id,name,email` |
| 寫入 DB | `provider='google'`, `provider_user_id=google id` | `provider='facebook'`, `provider_user_id=facebook id` |
| 回傳 | 同一個 JWT（現有 `sign()`） | 同一個 JWT |

### 2. 實作步驟摘要

1. **Facebook 開發者後台**  
   建立應用程式 → 取得 **App ID**、**App Secret** → 在「Facebook 登入」設定 **有效 OAuth 重新導向 URI**（例如 `https://www.17gonplay.com`、`http://localhost:8788`）。

2. **後端**  
   - 新增 `functions/api/auth/facebook.js`：  
     - 收 `code`、`redirect_uri`（可選）。  
     - 用 `code` 向 Facebook 換 `access_token`。  
     - 用 `access_token` 呼叫 Graph API `me?fields=id,name,email`。  
     - 與 Google 相同：依 `provider='facebook'` + `provider_user_id` 查/建 `users`，再 `sign()` 出 JWT 回傳。
   - 在 `functions/_routes.json` 或對應路由註冊 `POST /api/auth/facebook`。
   - 本機 `.dev.vars`、正式機 Environment variables 新增：`FACEBOOK_APP_ID`、`FACEBOOK_APP_SECRET`。

3. **前端**  
   - 在 `auth-service.js` 中：  
     - 若用 **Facebook SDK (JavaScript)**：初始化後用 `FB.login` 取得授權，再從回傳取得 `code` 或 `access_token`；若取得 `code`，就 `POST /api/auth/facebook { code, redirect_uri }`，與 Google 流程一致。  
     - 或改為 **重新導向**：導向 `https://www.facebook.com/v18.0/dialog/oauth?client_id=...&redirect_uri=...&scope=email,public_profile`，使用者在 Facebook 授權後被導回你站上的 `?code=xxx`，前端把 `code` 送給 `POST /api/auth/facebook`。
   - UI：在登入區塊多加一個按鈕「使用 Facebook 登入」，點擊後觸發上述流程；登入成功後一樣 `setAuth(token, user)`，無需改「我的命盤」或 JWT 使用方式。

4. **DB**  
   - `users` 表已支援任意 `provider`，不需改 schema；只要後端一律用 `provider='facebook'`、`provider_user_id=Facebook 的 id` 即可。

---

## 三、Email 登入（兩種路線）

### A. 魔法連結（Magic Link，免密碼）

- **流程**：使用者輸入 email → 後端產生一次性 token、存進 D1、寄出含連結的信 → 使用者點連結 → 後端驗證 token，查/建 `users`（例如 `provider='email'`、`provider_user_id=email`）→ 回傳 JWT。
- **後端**  
  - 新增表：例如 `magic_links (email, token, expires_at)`，或簡化用 KV 存 token→email。  
  - `POST /api/auth/email/send-link`：收 `email`，產生 token、寫入 DB、**呼叫發信 API** 寄出連結（例如 `https://www.17gonplay.com/?magic=TOKEN` 或專用頁 `/auth/verify?token=TOKEN`）。  
  - `GET` 或 `POST /api/auth/email/verify`：收 `token`，驗證並過期刪除，查/建 user，回傳 JWT（或 redirect 帶 hash 讓前端存 token）。
- **發信**：需第三方服務，例如 [Resend](https://resend.com)、[SendGrid](https://sendgrid.com)、[Mailgun](https://www.mailgun.com)；或 Cloudflare Email Workers。  
  - 在 Cloudflare Workers/Pages 內用 `fetch` 呼叫該服務的 API 發信即可。
- **前端**：登入區塊加「用 Email 登入」→ 輸入 email → 呼叫 `POST /api/auth/email/send-link` → 顯示「請到信箱點連結」；點連結進站後由前端或後端處理 `token` 並呼叫 verify，拿到 JWT 後一樣 `setAuth(token, user)`。

**優點**：免密碼、體驗好、安全性高。**缺點**：需發信服務與模板、需處理過期與重送。

### B. Email + 密碼

- **流程**：註冊（email + 密碼）→ 後端雜湊密碼存進 DB；登入（email + 密碼）→ 驗證雜湊，回傳 JWT。
- **DB**：在 `users` 加欄位（例如 `password_hash TEXT`），或另建 `email_credentials (email UNIQUE, password_hash)`，再與 `users` 關聯（例如用 email 當 provider_user_id，provider='email'）。
- **後端**  
  - 雜湊：Cloudflare Workers 環境可用 **Web Crypto** `crypto.subtle` 做 PBKDF2（salt + 迭代）產生雜湊，勿存明碼。  
  - `POST /api/auth/email/register`：收 `email`、`password`，檢查格式、檢查是否已註冊，寫入 password_hash 與 user。  
  - `POST /api/auth/email/login`：收 `email`、`password`，查 user、驗證雜湊，通過則 `sign()` 回傳 JWT。
- **前端**：登入區塊加「Email 登入」→ 表單（email + 密碼）；可再加「註冊」表單或頁面；若要「忘記密碼」再考慮魔法連結或重設密碼信。

**優點**：不需發信即可完成註冊/登入。**缺點**：要處理密碼強度、重設密碼、帳號鎖定等。

---

## 四、建議實作順序

1. **先做 Facebook**  
   - 複用現有 Google 流程與 JWT、users 表，改寫一個 `facebook.js` + 前端按鈕即可上線。
2. **再選一種 Email**  
   - 若要**最少維運**、願意接發信 API → 選 **魔法連結**。  
   - 若希望**完全不依賴發信**、可接受密碼與註冊流程 → 選 **Email + 密碼**。
3. **帳號綁定（可選）**  
   - 若同一人可能用 Google、Facebook、Email 登入，可後續再做「帳號連結」（例如用 email 當共同鍵，或讓使用者在設定頁把多個 provider 綁到同一個 user_id）。

---

## 五、與現有程式碼的相容性

- **JWT**：`sign()` 的 payload 可繼續用 `sub`（user id）、`email`、`name` 等；Facebook / Email 登入後端都回傳同一格式的 JWT，前端不需區分來源。
- **users 表**：已具備 `provider`、`provider_user_id`、`email`、`name`，Facebook 與 Email 都可直接寫入。
- **auth-service.js**：`getAuthHeaders()`、`isLoggedIn()`、`setAuth()`、`clearAuth()` 保持不變；僅在「登入」區塊多接 Facebook 按鈕或 Email 表單，登入成功後一樣呼叫 `setAuth(token, user)` 並 dispatch `auth-state-changed`。

- **「點我推算時辰」未登入時觸發登入**：  
  - 目前：未登入點「點我推算時辰」會呼叫 `AuthService.triggerLogin()`（等同 Google 登入），並設 flag；登入成功後 `auth-state-changed` 觸發，自動打開推算時辰問卷。  
  - **新增 Email / FB 後仍可行**：  
    1. **登入成功後自動開問卷**：不論用哪一種方式登入，只要登入流程最後呼叫 `setAuth(token, user)`，就會觸發 `auth-state-changed`；`birth-time-identifier.js` 只認「已登入 + flag」，不區分 provider，故 Email / Facebook 登入完成後一樣會自動打開問卷。  
    2. **triggerLogin() 的擴充**：  
       - **做法 A**：維持 `triggerLogin()` 只開 Google，其他方式由導覽列「登入」進入；使用者若從「點我推算時辰」進來就只會看到 Google，登入成功後仍會自動開問卷。  
       - **做法 B**：將 `triggerLogin()` 改為先顯示「登入方式選擇」（例如小 modal：Google / Email / Facebook），使用者選哪一種就觸發該流程；任一方式完成後一樣 `setAuth()` → `auth-state-changed` → 自動開問卷。  
  結論：不需改「點我推算時辰」的 flag 與 `auth-state-changed` 邏輯，只要新登入方式在成功時呼叫 `setAuth(token, user)` 即可相容。

若你決定先做其中一種（例如只做 Facebook，或只做 Email 魔法連結），可以再往下拆成具體的 API 規格與欄位設計，我可以依你現有專案結構寫出對應的範例程式碼草稿。
