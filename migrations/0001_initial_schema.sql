-- My Agent Analytics - Initial Database Schema
-- Created: 2024-10-30

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  provider TEXT DEFAULT 'google',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 物件テーブル
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  location TEXT,
  structure TEXT,
  total_floor_area REAL,
  age INTEGER,
  distance_from_station REAL,
  has_elevator BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 収益情報テーブル
CREATE TABLE IF NOT EXISTS property_income (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  average_rent REAL,
  units INTEGER,
  occupancy_rate REAL,
  gross_income REAL,
  effective_income REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- 運営費テーブル
CREATE TABLE IF NOT EXISTS property_expenses (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  management_fee REAL,
  repair_cost REAL,
  property_tax REAL,
  insurance REAL,
  other_expenses REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- 投資条件テーブル
CREATE TABLE IF NOT EXISTS property_investment (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  use_loan BOOLEAN DEFAULT 0,
  loan_amount REAL,
  interest_rate REAL,
  loan_term INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- 分析結果テーブル
CREATE TABLE IF NOT EXISTS analysis_results (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  noi REAL,
  gross_yield REAL,
  net_yield REAL,
  dscr REAL,
  ltv REAL,
  monthly_cash_flow TEXT, -- JSON配列
  analysis_data TEXT, -- JSON形式の詳細データ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- セッションテーブル
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_property_income_property_id ON property_income(property_id);
CREATE INDEX IF NOT EXISTS idx_property_expenses_property_id ON property_expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_property_investment_property_id ON property_investment(property_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_property_id ON analysis_results(property_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
