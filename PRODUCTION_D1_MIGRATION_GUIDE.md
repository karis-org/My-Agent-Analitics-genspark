# 🚨 本番D1データベース マイグレーション手動適用ガイド

## 📋 問題の説明

**症状**: 物件登録時に「物件の登録に失敗しました: Failed to create property」エラーが発生

**根本原因**: 本番環境のCloudflare D1データベースに**Migration 0008と0009が適用されていない**

**影響範囲**: 
- 物件登録機能が使用不可
- 統合レポート機能が不完全
- Chart.js グラフ機能が動作しない

---

## 🔧 手動適用手順

### Step 1: Cloudflare Dashboardにログイン

1. https://dash.cloudflare.com/ にアクセス
2. Cloudflareアカウントでログイン

### Step 2: D1データベースを開く

1. 左サイドバーから **Workers & Pages** を選択
2. **D1 SQL Database** タブをクリック
3. データベース一覧から **webapp-production** を選択

### Step 3: Console タブを開く

1. 画面上部のタブから **Console** を選択
2. SQLクエリ入力欄が表示されます

### Step 4: Migration 0008を実行

以下のSQLクエリをコピーして、Console の入力欄に貼り付け、**Execute** ボタンをクリック:

```sql
-- Migration 0008: Add missing property fields
ALTER TABLE properties ADD COLUMN property_type TEXT DEFAULT 'residential';
ALTER TABLE properties ADD COLUMN land_area REAL;
ALTER TABLE properties ADD COLUMN registration_date TEXT;
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
```

**期待される結果**:
```
✅ Query executed successfully
Rows affected: 0
Duration: ~50ms
```

### Step 5: Migration 0009を実行

次のSQLクエリを貼り付けて実行:

```sql
-- Migration 0009: Add revenue fields
ALTER TABLE properties ADD COLUMN annual_income REAL DEFAULT 0;
ALTER TABLE properties ADD COLUMN monthly_rent REAL DEFAULT 0;
ALTER TABLE properties ADD COLUMN annual_expense REAL DEFAULT 0;
ALTER TABLE properties ADD COLUMN gross_yield REAL DEFAULT 0;
ALTER TABLE properties ADD COLUMN net_yield REAL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_properties_annual_income ON properties(annual_income);
CREATE INDEX IF NOT EXISTS idx_properties_gross_yield ON properties(gross_yield);
```

**期待される結果**:
```
✅ Query executed successfully
Rows affected: 0
Duration: ~70ms
```

### Step 6: スキーマ確認

マイグレーションが正しく適用されたか確認するため、以下のクエリを実行:

```sql
PRAGMA table_info(properties);
```

**期待される結果**:
20個のフィールドが表示されるはずです:
1. id
2. user_id
3. name
4. price
5. location
6. structure
7. total_floor_area
8. age
9. distance_from_station
10. has_elevator
11. created_at
12. updated_at
13. **property_type** ← Migration 0008
14. **land_area** ← Migration 0008
15. **registration_date** ← Migration 0008
16. **annual_income** ← Migration 0009
17. **monthly_rent** ← Migration 0009
18. **annual_expense** ← Migration 0009
19. **gross_yield** ← Migration 0009
20. **net_yield** ← Migration 0009

---

## ✅ 動作確認

### 1. アプリケーションで物件登録をテスト

1. https://968b71c0.my-agent-analytics.pages.dev にアクセス
2. ログイン
3. 「物件管理」→「新規物件登録」
4. 以下の最小限の情報を入力:
   - 物件名: テスト物件
   - 価格: 10,000,000
5. 「登録」ボタンをクリック

**期待される結果**:
```
✅ 物件が正常に登録されました
```

### 2. エラーが解消されたか確認

- ❌ **修正前**: "物件の登録に失敗しました: Failed to create property"
- ✅ **修正後**: 物件が正常に登録され、物件一覧に表示される

---

## 🐛 トラブルシューティング

### エラー1: "column already exists"

**原因**: 既にそのフィールドが存在している

**対処**:
- 該当フィールドのALTER TABLE文をスキップ
- 次のフィールドから続行

### エラー2: "syntax error near ALTER"

**原因**: 複数のALTER TABLE文を一度に実行しようとしている

**対処**:
- 1行ずつ実行する
- または、セミコロン`;`で区切られた各文を個別に実行

### エラー3: "table properties does not exist"

**原因**: データベース名が間違っている

**対処**:
- 正しいデータベース（webapp-production）を選択しているか確認

---

## 📊 Migration 0010と0011について

### Migration 0010 (運営管理者名の修正)

**状態**: 手動適用済み（Session 10で対応）

**内容**:
```sql
UPDATE users SET name = '運営管理者' WHERE id = 'user-000' AND email = 'maa-unnei@support';
```

### Migration 0011 (タグ＆ノート機能)

**状態**: ローカルのみ適用、本番は未適用

**内容**:
- tags テーブル作成
- property_tags テーブル作成
- notes テーブル作成

**影響**: Phase 4-3のタグ＆ノート機能が本番環境で使用不可

**適用方法**: 必要に応じて、以下のSQLを実行:
```sql
-- Migration 0011を適用する場合
-- /home/user/webapp/migrations/0011_add_tags_and_notes.sql の内容をコピー＆ペースト
```

---

## 📞 サポート

マイグレーション適用で問題が発生した場合:

1. エラーメッセージのスクリーンショットを撮る
2. 実行したSQLクエリをコピー
3. 開発者（AI）に報告

---

## 📅 最終更新日: 2025年11月10日

**作成者**: Claude (Session 25)  
**関連Issue**: KNOWN_ISSUES.md Issue #6  
**関連セッション**: Session 9, Session 10, Session 25
