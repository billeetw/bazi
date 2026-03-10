-- 命書：新增 document_json 儲存完整 LifeBookDocument
-- 一鍵生成時可寫入；詳情頁優先用 document_json，無則 fallback sections_json
-- Apply: npx wrangler d1 migrations apply consult-db --local
--        npx wrangler d1 migrations apply consult-db

ALTER TABLE life_books ADD COLUMN document_json TEXT;
