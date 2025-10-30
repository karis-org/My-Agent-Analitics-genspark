-- My Agent Analytics - Seed Data
-- Test data for development

-- テストユーザー
INSERT OR IGNORE INTO users (id, email, name, picture, provider) VALUES 
  ('user-001', 'test@example.com', 'テストユーザー', 'https://via.placeholder.com/150', 'google'),
  ('user-002', 'demo@example.com', 'デモユーザー', 'https://via.placeholder.com/150', 'google');

-- テスト物件
INSERT OR IGNORE INTO properties (id, user_id, name, price, location, structure, total_floor_area, age, distance_from_station, has_elevator) VALUES 
  ('prop-001', 'user-001', '東京マンション', 150000000, '東京都渋谷区', 'RC造', 800, 15, 5, 0),
  ('prop-002', 'user-001', '横浜アパート', 80000000, '神奈川県横浜市', '木造', 500, 10, 8, 0),
  ('prop-003', 'user-002', '大阪ビル', 300000000, '大阪府大阪市', 'SRC造', 1500, 20, 3, 1);

-- 収益情報
INSERT OR IGNORE INTO property_income (id, property_id, average_rent, units, occupancy_rate, gross_income, effective_income) VALUES 
  ('income-001', 'prop-001', 75000, 20, 0.95, 18000000, 17100000),
  ('income-002', 'prop-002', 60000, 10, 0.90, 7200000, 6480000),
  ('income-003', 'prop-003', 120000, 30, 0.98, 43200000, 42336000);

-- 運営費
INSERT OR IGNORE INTO property_expenses (id, property_id, management_fee, repair_cost, property_tax, insurance, other_expenses) VALUES 
  ('expense-001', 'prop-001', 500000, 300000, 400000, 100000, 100000),
  ('expense-002', 'prop-002', 300000, 200000, 250000, 80000, 70000),
  ('expense-003', 'prop-003', 800000, 500000, 600000, 150000, 150000);

-- 投資条件
INSERT OR IGNORE INTO property_investment (id, property_id, use_loan, loan_amount, interest_rate, loan_term) VALUES 
  ('invest-001', 'prop-001', 1, 100000000, 2.5, 30),
  ('invest-002', 'prop-002', 1, 60000000, 2.8, 25),
  ('invest-003', 'prop-003', 1, 200000000, 2.3, 35);

-- 分析結果
INSERT OR IGNORE INTO analysis_results (id, property_id, noi, gross_yield, net_yield, dscr, ltv, monthly_cash_flow) VALUES 
  ('analysis-001', 'prop-001', 15700000, 12.0, 10.47, 1.85, 66.67, '[]'),
  ('analysis-002', 'prop-002', 5580000, 9.0, 6.98, 1.52, 75.0, '[]'),
  ('analysis-003', 'prop-003', 40136000, 14.4, 13.38, 2.15, 66.67, '[]');
