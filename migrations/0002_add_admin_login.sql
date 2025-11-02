-- Add password authentication for admin users
-- Created: 2025-10-30

-- Add password field to users table
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;

-- Create admin user with credentials
-- Email: admin@myagent.local
-- Password: kouki0187
-- Password Hash (SHA-256): e5b2d4dd461d4b4a7ca7fee1b1ff0b8377a448a5c927113ad8cd87a44f4393d6

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
  'e5b2d4dd461d4b4a7ca7fee1b1ff0b8377a448a5c927113ad8cd87a44f4393d6',
  'admin',
  1,
  CURRENT_TIMESTAMP
);

-- Create index for password lookups
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users(email, password_hash) WHERE password_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = 1;
