-- 命書：生成後存庫，未來可依 user_id/consultation_id 查詢
-- Apply: npx wrangler d1 migrations apply consult-db --local
--       npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS life_books (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,

  -- 關聯（未來要求登入時 user_id 必填）
  consultation_id TEXT,
  user_id TEXT,
  email TEXT,

  -- 內容
  birth_info TEXT NOT NULL,
  sections_json TEXT NOT NULL,
  html_content TEXT,

  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_life_books_consultation ON life_books(consultation_id);
CREATE INDEX IF NOT EXISTS idx_life_books_user ON life_books(user_id);
CREATE INDEX IF NOT EXISTS idx_life_books_email ON life_books(email);
CREATE INDEX IF NOT EXISTS idx_life_books_created ON life_books(created_at);
