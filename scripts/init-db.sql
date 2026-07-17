-- Ashley 个人站数据库初始化

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_project ON feedback(project);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- 预置 admin 账号；password_hash 是 "123456" 用 SHA-256+固定 salt 计算的结果
-- salt = 'ashley-site-2026', hash = sha256(salt + '123456')
-- 计算：echo -n 'ashley-site-2026123456' | sha256sum
-- = 5b3a9f8b4a7e3d0e5c2b8f1d9a6b3c7e4d2f1a8b6c5d3e9f7a2b4c1d8e5f6a3b（示例，实际由脚本注入）
INSERT OR IGNORE INTO users (username, password_hash, display_name, created_at)
VALUES ('admin', '5d10357b0eddad237cad1dd38cf1688ac099d336ded63a3924ad5d4bffc12c41', 'Ashley 管理员', 1721145600);
