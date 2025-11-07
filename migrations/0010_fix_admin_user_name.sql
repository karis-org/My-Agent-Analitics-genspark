-- Migration: Fix admin user name
-- Created: 2025-11-07
-- Purpose: Update admin user name from "テストタロウ" to "運営管理者"

-- Update user-000 (運営管理者) name
UPDATE users 
SET name = '運営管理者' 
WHERE id = 'user-000' AND email = 'maa-unnei@support';

-- Verify update
-- SELECT id, email, name, is_admin FROM users WHERE id = 'user-000';
