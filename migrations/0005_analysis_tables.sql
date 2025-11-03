-- Migration 0005: Analysis Tables for Cross-Feature Data Utilization
-- Created: 2025-11-03
-- Purpose: Add tables for storing various analysis results

-- 事故物件調査結果テーブル
CREATE TABLE IF NOT EXISTS accident_investigations (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  risk_level TEXT NOT NULL, -- none, low, medium, high
  summary TEXT,
  incidents_found TEXT, -- JSON array of incidents
  information_sources TEXT, -- JSON array of sources
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 賃貸相場データテーブル
CREATE TABLE IF NOT EXISTS rental_market_data (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  prefecture TEXT,
  city TEXT,
  town TEXT,
  room_type TEXT,
  average_rent REAL NOT NULL,
  median_rent REAL NOT NULL,
  min_rent REAL NOT NULL,
  max_rent REAL NOT NULL,
  sample_size INTEGER NOT NULL,
  rent_distribution TEXT, -- JSON array
  properties_data TEXT, -- JSON array of nearby properties
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 人口動態分析結果テーブル
CREATE TABLE IF NOT EXISTS demographics_data (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  pref_code TEXT NOT NULL,
  city_code TEXT,
  total_population INTEGER,
  population_growth_rate REAL,
  aging_rate REAL,
  household_count INTEGER,
  average_household_size REAL,
  population_density REAL,
  demographics_detail TEXT, -- JSON with detailed data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI分析結果テーブル（汎用）
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- market, property, comparison, etc.
  summary TEXT,
  investment_score INTEGER,
  strengths TEXT, -- JSON array
  weaknesses TEXT, -- JSON array
  opportunities TEXT, -- JSON array
  threats TEXT, -- JSON array
  recommendations TEXT, -- JSON array
  analysis_detail TEXT, -- JSON with detailed data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 地図データテーブル
CREATE TABLE IF NOT EXISTS property_maps (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  map_1km_url TEXT, -- Base64 or blob storage URL
  map_200m_url TEXT, -- Base64 or blob storage URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_accident_investigations_property_id 
  ON accident_investigations(property_id);
CREATE INDEX IF NOT EXISTS idx_accident_investigations_user_id 
  ON accident_investigations(user_id);

CREATE INDEX IF NOT EXISTS idx_rental_market_data_property_id 
  ON rental_market_data(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_market_data_user_id 
  ON rental_market_data(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_market_data_location 
  ON rental_market_data(prefecture, city, town);

CREATE INDEX IF NOT EXISTS idx_demographics_data_property_id 
  ON demographics_data(property_id);
CREATE INDEX IF NOT EXISTS idx_demographics_data_user_id 
  ON demographics_data(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_property_id 
  ON ai_analysis_results(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_user_id 
  ON ai_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_type 
  ON ai_analysis_results(analysis_type);

CREATE INDEX IF NOT EXISTS idx_property_maps_property_id 
  ON property_maps(property_id);
CREATE INDEX IF NOT EXISTS idx_property_maps_user_id 
  ON property_maps(user_id);

-- 既存の analysis_results テーブルを拡張
-- user_id と analysis_type カラムを追加（存在しない場合）
ALTER TABLE analysis_results ADD COLUMN user_id TEXT;
ALTER TABLE analysis_results ADD COLUMN analysis_type TEXT DEFAULT 'financial';

-- 既存データに対するインデックス追加
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id 
  ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type 
  ON analysis_results(analysis_type);
