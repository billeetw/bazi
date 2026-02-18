# content/2026 與 ui_copy_texts 對應格式

Worker 的 `GET /content/2026?locale=` 會優先從 D1 `ui_copy_texts` 讀取，無資料時用靜態 JSON fallback。

## copy_key 格式

| 類別 | copy_key 範例 | 對應 dbContent |
|------|---------------|----------------|
| 宮位 | `palace.命宮` | `palaces["命宮"]` |
| 宮位 (en) | `palace.soul` | `palaces["命宮"]`（en 模式宮位 key 仍用繁體，與前端一致） |
| 星曜 | `star.紫微` | `stars["紫微"]` |
| 星曜 (en) | `star.emperor` | `stars["emperor"]` |
| 十神 | `tenGod.比肩` | `tenGods["比肩"]` |
| 五行 | `wuxing.木` | `wuxing["木"]` = `{headline, content}` |

## content 欄位

- **palace / star / tenGod**：`content` 為純文字
- **wuxing**：`content` 為 JSON 字串，例如：
  ```json
  {"headline":"策略模組","content":"木能量代表你的策略模組..."}
  ```

## locale

- `zh-TW`、`zh-CN`、`en` 皆支援
- 查詢時用請求的 locale；若該 locale 無資料，回傳靜態 JSON（zh-TW 或 en）

## 匯入範例

```sql
INSERT INTO ui_copy_texts (copy_key, locale, content, category, description, updated_by, updated_at, created_at)
VALUES 
  ('palace.命宮', 'zh-TW', '你的核心作業系統', 'content', '宮位解釋', 'admin', datetime('now'), datetime('now')),
  ('star.紫微', 'zh-TW', '核心本質：核心自我與統御力...', 'content', '星曜解釋', 'admin', datetime('now'), datetime('now')),
  ('star.emperor', 'en', 'Core Essence: Central Authority...', 'content', 'Star meaning', 'admin', datetime('now'), datetime('now'));
```
