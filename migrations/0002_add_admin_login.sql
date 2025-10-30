-- Add password authentication for admin users
-- Created: 2025-10-30

-- Add password field to users table
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;

-- Create admin user with credentials
-- Email: admin@myagent.local
-- Password: Admin@2025
-- Password Hash (SHA-256): fcf7bb6d546cfb82d2e55486984ae7a1862a666acb441e0cf8b4ed34a4fcf9d7

INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  provider,
  password_hash,
  role,
  is_admin,
  created_at
) VALUES (
  'admin-user-001',
  'admin@myagent.local',
  '管理者',
  'password',
  'fcf7bb6d546cfb82d2e55486984ae7a1862a666acb441e0cf8b4ed34a4fcf9d7',
  'admin',
  1,
  CURRENT_TIMESTAMP
);

-- Create index for password lookups
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users(email, password_hash) WHERE password_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = 1;
