# 命書存庫與未來登入規劃

## 已完成

### 1. 資料表 `life_books`

```sql
-- migrations/0013_life_books.sql
life_books: id, created_at, consultation_id, user_id, email, birth_info, sections_json, html_content
```

- `consultation_id`: 從報名紀錄「產生命書」時關聯
- `user_id`: 預留，未來要求登入時必填
- `email`: 諮詢報名者的 email（可從 consultation 帶入）

### 2. API

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | /api/admin/life-books | 儲存命書（需 admin auth） |
| GET | /api/admin/life-books | 列出命書 |
| GET | /api/admin/life-books/:id | 取得單一命書 |

### 3. 流程

- 專家後台生成命書後，自動呼叫 `POST /api/admin/life-books` 儲存
- 若從報名紀錄連結進入（`?consultation_id=xxx`），會帶入 `consultation_id`、`email`
- 報名紀錄後台可點「命書列表」查看已存命書，點「預覽」開啟 HTML

## 未來：登入要求

當要對「報名諮詢」或「購買自動化命書」的人要求登入時：

1. **user_id 必填**：儲存時需有登入用戶的 `user_id`
2. **使用者端 API**：`GET /api/me/life-books` 列出自己的命書
3. **權限**：僅能讀取 `user_id` 相符的命書
4. **關聯流程**：
   - 諮詢報名：報名時以 email 建立/關聯 user → 產生命書時填 `user_id`
   - 購買命書：登入後才能購買/生成，直接填 `user_id`
