-- Migration: Add shared reports and custom templates tables
-- Version: 0004
-- Date: 2025-11-02

-- Shared Reports Table
-- レポート共有リンク管理
CREATE TABLE IF NOT EXISTS shared_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'property', 'analysis', 'simulation', 'comparison'
  report_id TEXT NOT NULL, -- Property ID, Analysis ID, etc.
  share_token TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  permission TEXT DEFAULT 'view', -- 'view', 'comment', 'edit'
  password_hash TEXT, -- Optional password protection
  expires_at DATETIME, -- Optional expiration date
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER, -- Optional max access limit
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Report Access Log
-- レポートアクセスログ
CREATE TABLE IF NOT EXISTS report_access_log (
  id TEXT PRIMARY KEY,
  shared_report_id TEXT NOT NULL,
  accessed_by TEXT, -- IP address or user ID
  user_agent TEXT,
  accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shared_report_id) REFERENCES shared_reports(id) ON DELETE CASCADE
);

-- Custom Report Templates
-- カスタムレポートテンプレート
CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- 'property', 'analysis', 'comparison', 'custom'
  format TEXT DEFAULT 'html', -- 'html', 'pdf', 'both'
  template_data TEXT, -- JSON data for template configuration
  sections TEXT, -- JSON array of section configurations
  styles TEXT, -- JSON object with CSS styles
  is_default BOOLEAN DEFAULT 0,
  is_public BOOLEAN DEFAULT 0, -- Can be shared with other users
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Template Sections
-- テンプレートセクション定義
CREATE TABLE IF NOT EXISTS template_sections (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  section_type TEXT NOT NULL, -- 'header', 'summary', 'details', 'charts', 'footer', 'custom'
  section_name TEXT NOT NULL,
  section_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT 1,
  config TEXT, -- JSON configuration for the section
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_reports_user ON shared_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON shared_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_reports_expires ON shared_reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_report_access_log_shared_report ON report_access_log(shared_report_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_user ON report_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_template_sections_template ON template_sections(template_id);

-- Note: Default templates will be inserted after first user login
-- or can be inserted manually with a valid user_id
