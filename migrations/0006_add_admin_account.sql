-- Add admin account for operations team
-- Created: 2025-11-02

-- Create admin account
-- Email: maa-unnei@support
-- Password: karis0227
-- Password Hash (SHA-256): 0d17927d6d2763f7c165279291f66c8b54bfb7d3de901aab5cb75d9aff41a426

INSERT INTO users (
  id,
  email,
  name,
  provider,
  password_hash,
  role,
  is_admin,
  created_at,
  updated_at
) VALUES (
  'user-000',
  'maa-unnei@support',
  '運営管理者',
  'password',
  '0d17927d6d2763f7c165279291f66c8b54bfb7d3de901aab5cb75d9aff41a426',
  'super_admin',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Add super_admin role check (for future role-based access control)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'super_admin';
