# 🚨 本番D1データベース 緊急修正ガイド

## 📊 現状分析
- **本番D1テーブル数**: 11個（不足）
- **ローカルD1テーブル数**: 25個（正常）
- **欠落テーブル**: 14個
- **影響**: 統合レポート、事故物件調査、賃料相場、人口動態分析、タグ・メモ機能など

---

## 🔴 Critical Error #1: 統合レポートエラー
```
D1_ERROR: no such table: accident_investigations: SQLITE_ERROR
```

### 根本原因
本番D1データベースに以下のマイグレーションが**未適用**:
- ❌ **Migration 0004**: レポート共有・テンプレート（4テーブル）
- ❌ **Migration 0005**: 分析データテーブル（5テーブル + カラム追加）
- ❌ **Migration 0011**: タグ・メモ機能（3テーブル）

---

## 🛠️ 修正手順

### ⚠️ 重要な注意事項
1. **Cloudflare API Error 7403により、wranglerからの自動マイグレーション適用は不可能**
2. **Cloudflare Dashboardのコンソールから手動でSQL実行が必要**
3. **各マイグレーションは順番に実行してください（0004 → 0005 → 0011）**
4. **実行前に必ずバックアップ推奨（現在データ量は少ないため影響小）**

---

## 📋 Step 1: Cloudflare Dashboard Console へアクセス

1. **Cloudflare Dashboard にログイン**
   - URL: https://dash.cloudflare.com/

2. **Workers & Pages を選択**
   - 左サイドバーから "Workers & Pages" をクリック

3. **D1 データベースを選択**
   - "D1" タブをクリック
   - データベース名: `my-agent-analytics-production` を選択

4. **Console を開く**
   - "Console" タブをクリック

---

## 🔧 Step 2: Migration 0004 実行（レポート共有・テンプレート）

### 2-1. shared_reports テーブル作成

```sql
CREATE TABLE IF NOT EXISTS shared_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_id TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  permission TEXT DEFAULT 'view',
  password_hash TEXT,
  expires_at DATETIME,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 2-2. report_access_log テーブル作成

```sql
CREATE TABLE IF NOT EXISTS report_access_log (
  id TEXT PRIMARY KEY,
  shared_report_id TEXT NOT NULL,
  accessed_by TEXT,
  user_agent TEXT,
  accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shared_report_id) REFERENCES shared_reports(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 2-3. report_templates テーブル作成

```sql
CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL,
  format TEXT DEFAULT 'html',
  template_data TEXT,
  sections TEXT,
  styles TEXT,
  is_default BOOLEAN DEFAULT 0,
  is_public BOOLEAN DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 2-4. template_sections テーブル作成

```sql
CREATE TABLE IF NOT EXISTS template_sections (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  section_type TEXT NOT NULL,
  section_name TEXT NOT NULL,
  section_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT 1,
  config TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 2-5. Migration 0004 インデックス作成

```sql
CREATE INDEX IF NOT EXISTS idx_shared_reports_user ON shared_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON shared_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_reports_expires ON shared_reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_report_access_log_shared_report ON report_access_log(shared_report_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_user ON report_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_template_sections_template ON template_sections(template_id);
```

✅ **実行確認**: "Success" メッセージ表示（複数回）

---

## 🔧 Step 3: Migration 0005 実行（分析データテーブル） ⚡ **Critical**

### 3-1. accident_investigations テーブル作成（統合レポートエラーの直接原因）

```sql
CREATE TABLE IF NOT EXISTS accident_investigations (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  summary TEXT,
  incidents_found TEXT,
  information_sources TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示
🎯 **これで統合レポートエラーが解決します！**

---

### 3-2. rental_market_data テーブル作成

```sql
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
  rent_distribution TEXT,
  properties_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 3-3. demographics_data テーブル作成

```sql
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
  demographics_detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 3-4. ai_analysis_results テーブル作成

```sql
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  summary TEXT,
  investment_score INTEGER,
  strengths TEXT,
  weaknesses TEXT,
  opportunities TEXT,
  threats TEXT,
  recommendations TEXT,
  analysis_detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 3-5. property_maps テーブル作成

```sql
CREATE TABLE IF NOT EXISTS property_maps (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  map_1km_url TEXT,
  map_200m_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 3-6. Migration 0005 インデックス作成

```sql
CREATE INDEX IF NOT EXISTS idx_accident_investigations_property_id ON accident_investigations(property_id);
CREATE INDEX IF NOT EXISTS idx_accident_investigations_user_id ON accident_investigations(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_market_data_property_id ON rental_market_data(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_market_data_user_id ON rental_market_data(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_market_data_location ON rental_market_data(prefecture, city, town);
CREATE INDEX IF NOT EXISTS idx_demographics_data_property_id ON demographics_data(property_id);
CREATE INDEX IF NOT EXISTS idx_demographics_data_user_id ON demographics_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_property_id ON ai_analysis_results(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_user_id ON ai_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_type ON ai_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_property_maps_property_id ON property_maps(property_id);
CREATE INDEX IF NOT EXISTS idx_property_maps_user_id ON property_maps(user_id);
```

✅ **実行確認**: "Success" メッセージ表示（複数回）

---

### 3-7. analysis_results テーブル拡張（重要）

```sql
ALTER TABLE analysis_results ADD COLUMN user_id TEXT;
ALTER TABLE analysis_results ADD COLUMN analysis_type TEXT DEFAULT 'financial';
```

✅ **実行確認**: "Success" メッセージ表示（2回）

---

### 3-8. analysis_results 追加インデックス作成

```sql
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analysis_results(analysis_type);
```

✅ **実行確認**: "Success" メッセージ表示（2回）

---

## 🔧 Step 4: Migration 0011 実行（タグ・メモ機能）

### 4-1. tags テーブル作成

```sql
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 4-2. property_tags テーブル作成

```sql
CREATE TABLE IF NOT EXISTS property_tags (
    property_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (property_id, tag_id),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 4-3. notes テーブル作成

```sql
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

✅ **実行確認**: "Success" メッセージ表示

---

### 4-4. Migration 0011 インデックス作成

```sql
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_property_tags_property_id ON property_tags(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tags_tag_id ON property_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_notes_property_id ON notes(property_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
```

✅ **実行確認**: "Success" メッセージ表示（6回）

---

### 4-5. デフォルトタグ挿入（オプション）

```sql
INSERT OR IGNORE INTO tags (id, name, color, user_id) VALUES
    ('tag-favorite', 'お気に入り', '#EF4444', 'user-000'),
    ('tag-high-yield', '高利回り', '#10B981', 'user-000'),
    ('tag-under-review', '要検討', '#F59E0B', 'user-000'),
    ('tag-archived', 'アーカイブ', '#6B7280', 'user-000');
```

✅ **実行確認**: "Success" メッセージ表示

---

## ✅ Step 5: 検証（Verification）

### 5-1. テーブル数確認

```sql
SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';
```

**期待結果**: `table_count = 24~25` （現在11個 → 25個に増加）

---

### 5-2. 欠落テーブルの存在確認

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

**期待結果**: 以下のテーブルが**全て存在する**こと
- ✅ accident_investigations
- ✅ ai_analysis_results
- ✅ demographics_data
- ✅ notes
- ✅ property_maps
- ✅ property_tags
- ✅ rental_market_data
- ✅ report_access_log
- ✅ report_templates
- ✅ shared_reports
- ✅ tags
- ✅ template_sections

---

### 5-3. analysis_results テーブルのカラム確認

```sql
PRAGMA table_info(analysis_results);
```

**期待結果**: `user_id` と `analysis_type` カラムが存在すること

---

## 🎯 修正完了後の動作確認

### 統合レポート機能テスト
1. 本番環境にアクセス: https://my-agent-analytics.pages.dev
2. ログイン後、「統合レポート」タブをクリック
3. 「テスト物件」（¥10,000,000）を検索
4. **エラーメッセージが表示されず、レポートページが正常に表示されること** ✅

---

## 📊 修正による影響範囲

### ✅ 修正により復旧する機能
1. **統合レポート機能** - accident_investigations テーブル復旧
2. **事故物件調査** - accident_investigations テーブル利用可能
3. **賃料相場分析** - rental_market_data テーブル利用可能
4. **人口動態分析** - demographics_data テーブル利用可能
5. **AI分析機能** - ai_analysis_results テーブル利用可能
6. **地図表示機能** - property_maps テーブル利用可能
7. **タグ機能** - tags, property_tags テーブル利用可能
8. **メモ機能** - notes テーブル利用可能
9. **レポート共有機能** - shared_reports テーブル利用可能
10. **カスタムテンプレート** - report_templates テーブル利用可能

---

## ⚠️ トラブルシューティング

### エラー: "FOREIGN KEY constraint failed"
**原因**: 参照先のレコードが存在しない
**対処**: デフォルトタグ挿入時に `user_id = 'user-000'` が存在しない場合は、既存の管理者ユーザーIDに変更してください。

```sql
-- 既存ユーザーID確認
SELECT id, email, role FROM users WHERE is_admin = 1 LIMIT 1;
```

取得したIDを使用して、デフォルトタグ挿入SQLの `'user-000'` を実際のIDに置き換えてください。

---

### エラー: "column already exists"
**原因**: カラムがすでに存在する（部分的にマイグレーション済み）
**対処**: エラーは無視して次のステップに進んでください。`ALTER TABLE ... ADD COLUMN` は冪等性がないため、既存カラムがある場合はエラーになりますが、問題ありません。

---

## 📝 修正完了報告テンプレート

マイグレーション完了後、以下の情報を報告してください：

```
✅ Migration 0004 完了（4テーブル + 7インデックス）
✅ Migration 0005 完了（5テーブル + 12インデックス + 2カラム + 2インデックス）
✅ Migration 0011 完了（3テーブル + 6インデックス + 4デフォルトタグ）

本番D1テーブル数: 11個 → 25個 ✅
統合レポートテスト: [成功/失敗]
```

---

## 🚀 次のステップ

修正完了後：
1. **Phase 3: 5名テスター全機能エラーチェック** 実施
2. **アクティビティログ機能修正** 着手
3. **物件価格最小値300万円バリデーション** 追加
4. **GitHub Push, Backup, Deploy, Handoff** 実行

---

## 📌 重要なリマインダー

- ⚠️ **wranglerからの自動マイグレーションは不可（Error 7403）**
- ✅ **必ず手動でCloudflare Dashboard Consoleから実行**
- ✅ **マイグレーション順序を厳守（0004 → 0005 → 0011）**
- ✅ **各ステップで検証クエリを実行して確認**

---

**作成日**: 2025-11-13  
**対象Session**: Session 25 Phase 2  
**優先度**: 🔴 Critical - 即座に対応が必要
