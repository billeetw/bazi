-- 登入使用者與命書 Viewer 狀態：一人一筆，換裝置登入可還原同一份 JSON
-- Apply: npx wrangler d1 migrations apply consult-db --local
--        npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS user_lifebook_documents (
  user_id TEXT PRIMARY KEY,
  document_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_lifebook_documents_updated ON user_lifebook_documents(updated_at);
