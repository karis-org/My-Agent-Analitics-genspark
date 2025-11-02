# 本番データベースセットアップガイド

## ⚠️ 重要: ログインできない原因

現在、本番環境（https://2d4a5223.my-agent-analytics.pages.dev）でログインできないのは、
**本番データベース（Cloudflare D1）にデータが存在しない**ためです。

## 🔧 解決方法

### ステップ1: Cloudflareダッシュボードにアクセス

1. https://dash.cloudflare.com にログイン
2. 左メニューから **Workers & Pages** を選択
3. **D1 SQL Database** タブをクリック
4. **webapp-production** データベースを選択

### ステップ2: SQLを実行

**Console** タブで、プロジェクトルートの `PRODUCTION_DATABASE_SETUP.sql` ファイルの内容をコピー＆ペーストして実行してください。

または、以下のSQLを直接実行：

```sql
-- すべてのテーブルを作成
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  provider TEXT DEFAULT 'google',
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  is_admin BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 管理者ユーザーを作成
INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  provider,
  password_hash,
  role,
  is_admin,
  created_at
) VALUES (
  'admin-user-001',
  'realestate.navigator01@gmail.com',
  '管理者',
  'password',
  'e5b2d4dd461d4b4a7ca7fee1b1ff0b8377a448a5c927113ad8cd87a44f4393d6',
  'admin',
  1,
  datetime('now')
);

-- 確認クエリ
SELECT id, email, name, is_admin FROM users WHERE email = 'realestate.navigator01@gmail.com';
```

### ステップ3: 確認

最後のSELECTクエリの結果、以下のような出力が表示されるはずです：

```
id              | email                              | name   | is_admin
admin-user-001  | realestate.navigator01@gmail.com   | 管理者  | 1
```

### ステップ4: ログインテスト

https://2d4a5223.my-agent-analytics.pages.dev/auth/login にアクセスして、以下の認証情報でログインしてください：

- **メールアドレス**: realestate.navigator01@gmail.com
- **パスワード**: kouki0187

## 📝 認証情報

### 本番環境ログイン
- **Email**: realestate.navigator01@gmail.com
- **Password**: kouki0187
- **Password Hash (SHA-256)**: e5b2d4dd461d4b4a7ca7fee1b1ff0b8377a448a5c927113ad8cd87a44f4393d6

## 🔍 トラブルシューティング

### ログイン時にエラーが表示される場合

1. **Cloudflare D1コンソール**で以下のクエリを実行してユーザーが存在するか確認：
   ```sql
   SELECT * FROM users WHERE email = 'realestate.navigator01@gmail.com';
   ```

2. ユーザーが存在しない場合、上記のINSERT文を再実行

3. パスワードハッシュが正しいか確認：
   ```sql
   SELECT password_hash FROM users WHERE email = 'realestate.navigator01@gmail.com';
   ```
   
   期待される値: `e5b2d4dd461d4b4a7ca7fee1b1ff0b8377a448a5c927113ad8cd87a44f4393d6`

## ✅ セットアップ完了後

データベースセットアップが完了すると、以下が可能になります：

1. ✅ 本番環境でログイン
2. ✅ ダッシュボードへのアクセス
3. ✅ すべての機能の利用
4. ✅ Remember Me機能（30日間セッション）

## 📞 サポート

問題が解決しない場合は、以下を確認してください：

1. Cloudflare D1データベースが正しく作成されているか
2. wrangler.jsonc のdatabase_idが正しいか
3. ブラウザのコンソールにエラーが表示されていないか

---

**注意**: ローカル開発環境では正常にログインできます。
本番環境のみデータベースセットアップが必要です。
