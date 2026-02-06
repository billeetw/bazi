# GitHub 安全開發規範

## 🔒 核心原則

### 1. 禁止硬編碼
- ❌ **嚴禁**將任何 API Key、密碼、Token 或私密連線資訊寫在程式碼或註解中
- ✅ **統一使用** `.env` 或 `.dev.vars` 環境變數
- ✅ 所有敏感配置必須從環境變數讀取：`env.ADMIN_USER`、`env.ADMIN_PASSWORD`

### 2. 抽象化註解
- ❌ **禁止**在註解中寫具體的業務敏感數據（客戶名稱、真實帳號等）
- ✅ **統一使用**抽象代號：`Client_A`、`User_Example`、`[REDACTED]`
- ✅ 註解應描述「為什麼這樣做」，而非「具體數據是什麼」

### 3. 自動過濾 PII
- ✅ 在生成註解時，自動檢查是否包含個人敏感資訊（PII）
- ✅ 如果發現 PII，自動以 `[REDACTED]` 替代

## 📁 文件保護

### .gitignore 配置
以下文件**必須**在 `.gitignore` 中：

```
# 環境變數文件（包含敏感配置）
.dev.vars
.env
.env.local
.env.production

# 配置文件（如果包含敏感信息）
config/secrets.json
config/credentials.json

# 日誌文件（可能包含敏感信息）
*.log
logs/

# 臨時文件
tmp/
temp/
```

### 環境變數管理

#### 本地開發
1. 複製 `.dev.vars.example` 為 `.dev.vars`
2. 在 `.dev.vars` 中填入真實值（**不要提交**）
3. 確保 `.dev.vars` 在 `.gitignore` 中

#### 生產環境（Cloudflare Pages）
1. 前往 Pages 專案 → Settings → Environment variables
2. 設置 `ADMIN_USER` 和 `ADMIN_PASSWORD`
3. **不要**在程式碼中硬編碼

## 🔍 代碼審查檢查清單

在提交代碼前，請檢查：

- [ ] 沒有硬編碼的 API Key、密碼、Token
- [ ] 所有敏感配置都從環境變數讀取
- [ ] 註解中沒有具體的客戶名稱或真實數據
- [ ] `.dev.vars` 和 `.env` 文件在 `.gitignore` 中
- [ ] 沒有在註解中洩露業務邏輯細節
- [ ] 日誌輸出中沒有敏感信息

## 🛡️ 安全最佳實踐

### 1. 使用 Private Repository
- 如果專案包含核心業務邏輯，建議使用 Private Repository
- Private Repo 不會被 Google 搜尋到，安全性更高

### 2. 定期審查提交歷史
- 使用 `git log` 檢查歷史提交
- 如果發現敏感信息，使用 `git filter-repo` 或 BFG Repo-Cleaner 清理

### 3. 環境變數命名規範
- 使用大寫字母和下劃線：`ADMIN_USER`、`API_KEY`
- 明確標示用途：`DATABASE_PASSWORD`、`JWT_SECRET`

### 4. 錯誤處理
- 錯誤訊息中**不要**洩露敏感信息
- 使用通用錯誤訊息：`認證失敗` 而非 `密碼錯誤`

## 📝 範例

### ❌ 錯誤範例
```javascript
// 硬編碼密碼
const password = "admin123";

// 註解中寫真實客戶名稱
// 客戶「張三」的命盤計算邏輯

// 日誌輸出敏感信息
console.log("User password:", userPassword);
```

### ✅ 正確範例
```javascript
// 從環境變數讀取
const adminUser = env.ADMIN_USER;
const adminPass = env.ADMIN_PASSWORD;

// 抽象化註解
// Client_A 的命盤計算邏輯（為什麼需要特殊處理）

// 安全的錯誤處理
if (!cred || cred.user !== adminUser || cred.pass !== adminPass) {
  return unauthorized(); // 不洩露具體錯誤原因
}
```

## 🚨 如果已經洩密

如果發現已經 push 的提交包含敏感信息：

1. **立即更改**所有相關的密碼、Token、API Key
2. **使用 git filter-repo** 清理歷史：
   ```bash
   git filter-repo --path-sensitive --invert-paths --path .dev.vars
   ```
3. **強制推送**（需要團隊協調）：
   ```bash
   git push origin --force --all
   ```
4. **通知團隊成員**重新 clone repository

## 📚 參考資源

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [.gitignore Best Practices](https://github.com/github/gitignore)
