-- Add user status and activity logs
-- Created: 2025-11-02

-- Add is_active column to users table (default: active)
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Update existing users to active
UPDATE users SET is_active = 1 WHERE is_active IS NULL;

-- Create activity_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Create index for is_active
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
