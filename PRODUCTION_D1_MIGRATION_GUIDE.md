# 🗄️ 本番D1マイグレーション適用ガイド

## ✅ 最新情報（2024-11-06 19:30）：マイグレーション適用済み

**確認結果**: 本番データベース（webapp-production）には既に以下のフィールドが存在します：
- ✅ `property_type` (TEXT) - 物件種別（投資用 or 実需用）
- ✅ `land_area` (REAL) - 土地面積（㎡）
- ✅ `registration_date` (TEXT) - 登記日

**結論**: このマイグレーションは既に適用済みです。以下の手順は参考情報として残します。

---

## 📋 適用済みの確認方法

```bash
# 本番データベースのスキーマ確認
npx wrangler d1 execute webapp-production --command="PRAGMA table_info(properties);"

# 上記3つのフィールドが表示されればOK
```

---

## ⚠️ （参考）未適用の場合の手順

以下は、マイグレーションが未適用の場合の手順です（現在は不要）：

---

## 📋 適用手順（Cloudflare Dashboard）

### ステップ1：Cloudflare Dashboardにログイン

1. ブラウザで https://dash.cloudflare.com を開く
2. Cloudflareアカウントでログイン

### ステップ2：D1 Databaseに移動

1. 左サイドバーの **「Workers & Pages」** をクリック
2. 上部タブの **「D1 SQL Database」** をクリック
3. データベース一覧から **「webapp-production」** をクリック

### ステップ3：Consoleタブを開く

1. データベース詳細画面で **「Console」** タブをクリック
2. SQLクエリ入力欄が表示されます

### ステップ4：マイグレーションSQLを実行

以下のSQLをコピーして、クエリ入力欄に貼り付けます：

```sql
-- Migration 0008: Add missing property fields
-- 統合レポート機能に必要なフィールドを追加

-- 1. property_type フィールド追加（デフォルト: residential）
ALTER TABLE properties ADD COLUMN property_type TEXT DEFAULT 'residential';

-- 2. land_area フィールド追加（土地面積）
ALTER TABLE properties ADD COLUMN land_area REAL;

-- 3. registration_date フィールド追加（登記日）
ALTER TABLE properties ADD COLUMN registration_date TEXT;

-- 4. property_type用のインデックス作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
```

### ステップ5：実行とエラーチェック

1. **「Execute」** ボタンをクリック
2. 成功メッセージが表示されることを確認
3. エラーが表示された場合：
   - エラーメッセージをコピー
   - 既にフィールドが存在する場合は問題なし

### ステップ6：確認クエリを実行

以下のクエリで新しいフィールドが追加されたことを確認します：

```sql
PRAGMA table_info(properties);
```

**確認ポイント**：
- `property_type` (TEXT, default: 'residential')
- `land_area` (REAL)
- `registration_date` (TEXT)

が一覧に表示されればOKです。

---

## ✅ 適用後の動作確認

### 1. 統合レポートページにアクセス

1. https://861df363.my-agent-analytics.pages.dev にアクセス
2. Google OAuth でログイン
3. 物件一覧から既存の物件を選択
4. **「統合レポート」** ボタンをクリック

### 2. エラーがないことを確認

- ✅ 「レポートの読み込みに失敗しました」エラーが表示されない
- ✅ 物件情報が正常に表示される
- ✅ 築年数、土地面積、登記日などのフィールドが表示される

### 3. 免責文が表示されることを確認

レポートの下部に以下の免責文が表示されることを確認：

```
本ツールは不動産の情報整理・分析支援を目的とした参考情報であり、
投資判断・契約判断の勧誘や約束を行うものではありません。
最終判断はご自身の責任で行ってください。
数値は出典に基づく推計であり、将来の結果を保証しません。
```

---

## 🚨 トラブルシューティング

### エラー: "table properties has no column named property_type"

**原因**: マイグレーションがまだ適用されていません。

**解決策**: 上記の手順に従ってマイグレーションを実行してください。

### エラー: "duplicate column name: property_type"

**原因**: 既にマイグレーションが適用されています。

**解決策**: 問題ありません。次のステップに進んでください。

### エラー: "レポートの読み込みに失敗しました"

**原因1**: マイグレーションが未適用
**解決策1**: マイグレーションを適用

**原因2**: 物件データが存在しない
**解決策2**: 物件登録フォームから新しい物件を登録

**原因3**: 認証エラー
**解決策3**: ログアウトして再度Google OAuthでログイン

---

## 📊 Migration 0008の詳細

### 追加されるフィールド

| フィールド名 | 型 | デフォルト値 | 用途 |
|------------|----|-----------|----|
| `property_type` | TEXT | 'residential' | 物件種別（'investment' or 'residential'） |
| `land_area` | REAL | NULL | 土地面積（㎡）- 坪単価計算に使用 |
| `registration_date` | TEXT | NULL | 登記日 - 統合レポート詳細セクションに表示 |

### インデックス

- `idx_properties_property_type` - property_type フィールドの検索を高速化

### 既存データへの影響

- ✅ 既存の物件データは**保持されます**
- ✅ 新しいフィールドにはデフォルト値またはNULLが設定されます
- ✅ データベース構造のみが変更されます

---

## 🔗 関連ドキュメント

- [SESSION_7_SUMMARY.md](./SESSION_7_SUMMARY.md) - Session 7の作業内容
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) - 既知の問題リスト
- [HANDOFF_TO_NEXT_AI.md](./HANDOFF_TO_NEXT_AI.md) - 次のAIへの引き継ぎ

---

## 📅 作成日：2024-11-06 19:10 JST

**このマイグレーションを適用することで、統合レポート機能が正常に動作します。**
