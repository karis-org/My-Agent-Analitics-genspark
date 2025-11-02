-- Check user-000 status
SELECT id, email, name, role, is_admin, is_active FROM users WHERE id = 'user-000';

-- Update user-000 to active if needed
UPDATE users SET is_active = 1 WHERE id = 'user-000';

-- Verify the update
SELECT id, email, name, role, is_admin, is_active FROM users WHERE id = 'user-000';
