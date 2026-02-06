# 專家後台管理界面測試連結

## 🔗 測試連結

### 本地測試（推薦）

1. **啟動本地服務器**：
   ```bash
   cd /Users/bill/bazi-project
   npx wrangler pages dev . --port 8788
   ```

2. **訪問後台界面**：
   ```
   http://localhost:8788/expert-admin.html
   ```

3. **登入資訊**：
   - 需要在 `.dev.vars` 文件中設置 `ADMIN_USER` 和 `ADMIN_PASSWORD`
   - 或使用環境變數
   - ⚠️ **安全提醒**：`.dev.vars` 文件包含敏感信息，已加入 `.gitignore`，請勿提交到 Git

### 生產環境（如果已部署）

如果項目已部署到 Cloudflare Pages：

```
https://your-domain.pages.dev/expert-admin.html
```

或

```
https://your-custom-domain.com/expert-admin.html
```

---

## 📝 使用步驟

### 1. 本地測試設置

1. **創建環境變數文件**（如果還沒有）：
   ```bash
   # 複製範例文件
   cp .dev.vars.example .dev.vars
   
   # 編輯 .dev.vars，設置：
   ADMIN_USER=your_admin_username
   ADMIN_PASSWORD=your_admin_password
   ```
   
   ⚠️ **重要**：`.dev.vars` 文件已加入 `.gitignore`，請勿提交到 Git。真實的帳號密碼只應存在本地。

2. **啟動服務器**：
   ```bash
   npx wrangler pages dev . --port 8788
   ```

3. **訪問後台**：
   打開瀏覽器訪問：`http://localhost:8788/expert-admin.html`

### 2. 測試流程

1. **登入**：
   - 輸入 `.dev.vars` 中設置的帳號和密碼
   - 點擊「登入」

2. **輸入數據**：
   - 出生資訊（必填）：年、月、日、時、分、性別
   - 專家問卷（可選）：填寫15題問卷
   - 經緯度校準（可選）：使用瀏覽器定位或手動輸入

3. **計算**：
   - 點擊「計算所有進階功能」
   - 等待計算完成（會顯示計算狀態）

4. **查看結果**：
   - 戰略標籤
   - 核心數據摘要
   - 健康預警
   - 月度健康風險心電圖
   - AI Prompt

5. **生成命書**：
   - 查看 AI Prompt
   - 複製或下載 Prompt
   - 使用「一鍵生成命書」功能

6. **導出數據**：
   - 導出 JSON
   - 或提交到後台 API

---

## 🔧 快速啟動腳本

創建一個快速啟動腳本 `start-admin.sh`：

```bash
#!/bin/bash
cd /Users/bill/bazi-project
npx wrangler pages dev . --port 8788
```

然後執行：
```bash
chmod +x start-admin.sh
./start-admin.sh
```

訪問：`http://localhost:8788/expert-admin.html`

---

## ⚠️ 注意事項

1. **環境變數**：
   - 本地測試需要 `.dev.vars` 文件
   - 生產環境需要在 Cloudflare Pages 設置環境變數

2. **API 端點**：
   - 本地測試：`http://localhost:8788/api/...`
   - 生產環境：`https://your-domain.com/api/...`

3. **認證**：
   - 所有後台 API 都需要 Basic Auth
   - 使用 `.dev.vars` 中設置的帳號密碼

4. **數據依賴**：
   - 需要 `data/ziweiWeights.json` 文件
   - 需要後端 API `/compute/all` 可用

---

## 🐛 故障排除

### 問題：無法登入
- 檢查 `.dev.vars` 文件是否存在
- 檢查 `ADMIN_USER` 和 `ADMIN_PASSWORD` 是否設置正確
- 檢查後端 API 是否正常運行

### 問題：計算失敗
- 檢查後端 API `/compute/all` 是否可用
- 檢查網絡連接
- 查看瀏覽器控制台錯誤訊息

### 問題：數據未顯示
- 檢查所有必要的 JavaScript 文件是否載入
- 檢查瀏覽器控制台是否有錯誤
- 確認計算已完成（查看計算狀態）

---

**測試連結**：`http://localhost:8788/expert-admin.html`（本地）  
**狀態**：✅ 獨立計算版本，登入後可直接使用
