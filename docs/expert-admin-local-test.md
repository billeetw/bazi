# 專家後台 — 本地測試指南

## 快速開始（本地測試）

### 方式 A：只用遠端 API（最簡單）

不需跑 Worker，命書 API 走已部署的 Worker。

```bash
# 1. 建置
npm run build:expert-admin
npm run build:tailwind

# 2. 啟動 Pages
npx wrangler pages dev . --port 8788
# 或：./start-dev.sh 8788
```

瀏覽器開啟：**http://localhost:8788/expert-admin.html**

- 登入用專案根目錄 `.dev.vars` 的 `ADMIN_USER` / `ADMIN_PASSWORD`
- 一鍵生成命書、模型選單（gpt-4.1 / gpt-5.x）會打遠端 Worker

---

### 方式 B：本地 Worker + Pages（測 Worker 改動）

適合測 Worker 的 model/temperature、命書 generate-section 等。

```bash
# 1. 建置
npm run build:expert-admin
npm run build:tailwind

# 2. 終端 1：啟動本地 Worker（port 8787）
cd worker
npx wrangler dev

# 3. 終端 2：啟動 Pages（port 8788）
cd ..   # 回專案根目錄
npx wrangler pages dev . --port 8788
```

瀏覽器開啟：**http://localhost:8788/expert-admin.html?api=local**

- `?api=local` 會讓命書 API 打 `http://localhost:8787`
- 本地 Worker 需在 **worker/.dev.vars** 設定 `OPENAI_API_KEY`（若無此檔可從 `worker/.dev.vars.example` 複製）

---

## 一、前置準備

### 1. 環境變數

**Pages / 後台登入（專案根目錄）**

```bash
cp .dev.vars.example .dev.vars
# 編輯 .dev.vars：ADMIN_USER=... ADMIN_PASSWORD=...
```

**本地 Worker（僅方式 B 需要）**

```bash
# worker/.dev.vars（若不存在可建空檔後只加 OPENAI_API_KEY）
OPENAI_API_KEY=sk-...
```

### 2. Build

```bash
npm run build:expert-admin
npm run build:tailwind
# 若有改主站：npm run build:main
```

---

## 二、啟動

```bash
npx wrangler pages dev . --port 8788
```

或：`./start-dev.sh 8788`

---

## 三、訪問

- **專家後台**：http://localhost:8788/expert-admin.html
- **主站**：http://localhost:8788/
- **用本地 Worker**：http://localhost:8788/expert-admin.html**?api=local**

---

## 四、API 說明

- 專家後台在 `localhost:8788` 且**未加** `?api=local` 時，API 走同源（`/api/...`），由 Pages 代理到遠端 Worker。
- 加上 **?api=local** 時，命書與 compute 等請求改打 `http://localhost:8787`（本地 Worker）。

---

## 五、測試項目建議

1. **模型選單**：選 gpt-4.1 / gpt-4.1-turbo / gpt-5.0 等，一鍵生成時確認請求帶 `model`、`temperature: 0.7`。
2. **詳情頁**：命書列表點「詳情」，右側 ExpertPanel 應顯示「模型版本：gpt-4.1」等（或「(未知模型版本)」）。
3. **自訂問答**：輸入出生資料 → 計算 → 自訂問答區選模型 → 「🚀 生成回答」。

---

## 六、使用本地 Worker（方式 B 詳解）

```bash
# 終端 1
cd worker
npx wrangler dev

# 終端 2（專案根目錄）
npx wrangler pages dev . --port 8788
```

瀏覽器：**http://localhost:8788/expert-admin.html?api=local**

注意：本地 Worker 需在 `worker/.dev.vars` 設定 `OPENAI_API_KEY`。
