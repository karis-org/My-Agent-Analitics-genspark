-- Fix admin user ID to follow member number convention
-- Change admin-user-001 to user-001
-- Created: 2025-11-02

-- Delete dependent records first
DELETE FROM sessions WHERE user_id = 'admin-user-001';
DELETE FROM properties WHERE user_id = 'admin-user-001';
DELETE FROM agents WHERE user_id = 'admin-user-001';
DELETE FROM report_templates WHERE user_id = 'admin-user-001';
DELETE FROM shared_reports WHERE user_id = 'admin-user-001';

-- Store admin user data
-- Delete old admin user
DELETE FROM users WHERE id = 'admin-user-001';

-- Create new admin user with proper ID (user-001)
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
  'user-001',
  'realestate.navigator01@gmail.com',
  '管理者',
  'password',
  'e5b2d4dd461d4b4a7ca7fee1b1ff0b8377a448a5c927113ad8cd87a44f4393d6',
  'admin',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
