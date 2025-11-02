-- Add agents table for AI agent management
-- Created: 2025-11-02

-- AIエージェントテーブル
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT DEFAULT 'analysis', -- 'analysis', 'market', 'comparison', 'report'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
  config TEXT, -- JSON形式の設定データ
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- エージェント実行履歴テーブル
CREATE TABLE IF NOT EXISTS agent_executions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  property_id TEXT,
  execution_type TEXT NOT NULL, -- 'analysis', 'market_research', 'comparison', 'report'
  input_data TEXT, -- JSON形式の入力データ
  result_data TEXT, -- JSON形式の結果データ
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_agent_type ON agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created_at ON agent_executions(created_at);

-- デフォルトエージェントの作成（admin用）
INSERT OR IGNORE INTO agents (
  id,
  user_id,
  name,
  description,
  agent_type,
  status,
  config,
  created_at
) VALUES (
  'agent-default-001',
  'admin-user-001',
  'デフォルト分析エージェント',
  '物件の総合分析を行うデフォルトエージェント',
  'analysis',
  'active',
  '{"features":["noi","yield","dscr","ltv","cash_flow"]}',
  CURRENT_TIMESTAMP
);
