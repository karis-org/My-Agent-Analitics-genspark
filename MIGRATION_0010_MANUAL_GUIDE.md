# Migration 0010 本番適用マニュアル

## 概要
Migration 0010は、管理者ユーザー（user-000）の表示名を「テストタロウ」から「運営管理者」に修正します。

## 背景
- **問題**: 管理者ユーザーの名前が「テストタロウ」と表示される
- **原因**: データベースのusersテーブルで誤った名前が設定されている
- **対策**: UPDATE文でuser-000の名前を「運営管理者」に変更

## API権限の問題
Wranglerを使用したリモート適用（`npx wrangler d1 migrations apply webapp-production --remote`）を試みましたが、以下のエラーで失敗しました：

```
Error: The given account is not valid or is not authorized to access this service [code: 7403]
```

これは、現在のCloudflare APIトークンにD1データベースへの書き込み権限がないためです。

## 手動適用手順（Cloudflare Dashboard経由）

### ステップ1: Cloudflare Dashboardにログイン
1. https://dash.cloudflare.com/ にアクセス
2. Cloudflareアカウントでログイン

### ステップ2: D1データベースを開く
1. 左サイドバーから **Workers & Pages** を選択
2. **D1 SQL Database** タブをクリック
3. データベース一覧から **webapp-production** を選択

### ステップ3: Console (SQL Query Editor)を開く
1. データベース詳細ページ上部の **Console** タブをクリック
2. SQLクエリエディタが表示されます

### ステップ4: 現在のデータを確認（オプション）
以下のSQLを実行して、現在の管理者ユーザー情報を確認します：

```sql
SELECT id, email, name, is_admin, created_at 
FROM users 
WHERE id = 'user-000';
```

**期待される結果:**
```
id: user-000
email: maa-unnei@support
name: テストタロウ  ← これを修正します
is_admin: 1
created_at: 2024-10-29 ...
```

### ステップ5: Migration 0010を実行
以下のSQLをコピー&ペーストして実行します：

```sql
-- Migration: Fix admin user name
-- Created: 2025-11-07
-- Purpose: Update admin user name from "テストタロウ" to "運営管理者"

UPDATE users 
SET name = '運営管理者' 
WHERE id = 'user-000' AND email = 'maa-unnei@support';
```

**期待される結果:**
```
1 row(s) affected
```

### ステップ6: 更新を確認
以下のSQLを実行して、更新が正しく適用されたか確認します：

```sql
SELECT id, email, name, is_admin, created_at 
FROM users 
WHERE id = 'user-000';
```

**期待される結果:**
```
id: user-000
email: maa-unnei@support
name: 運営管理者  ← 正しく更新されました！
is_admin: 1
created_at: 2024-10-29 ...
```

### ステップ7: アプリケーションで動作確認
1. ブラウザで https://d8221925.my-agent-analytics.pages.dev/ にアクセス
2. ログイン後、右上のユーザー名表示を確認
3. **「運営管理者」**と表示されていれば成功！

## トラブルシューティング

### エラー: "no such table: users"
- データベースが正しく初期化されていません
- 他のマイグレーション（0001～0009）を先に実行する必要があります

### エラー: "0 rows affected"
- WHERE条件が一致しませんでした
- 以下を確認してください：
  - user-000が存在するか: `SELECT * FROM users WHERE id = 'user-000';`
  - メールアドレスが一致するか（maa-unnei@support）

### 更新後も「テストタロウ」と表示される
1. ブラウザのキャッシュをクリア（Ctrl+Shift+R / Cmd+Shift+R）
2. ログアウトして再度ログイン
3. それでも表示されない場合は、セッション情報が古い可能性があります

## 補足情報

### ローカル環境での確認
ローカル開発環境では、すでにMigration 0010が適用されています：

```bash
# ローカルDBでの確認
cd /home/user/webapp
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM users WHERE id = 'user-000';"
```

### Migration履歴
- 0001～0009: 既に本番環境に適用済み
- 0010: **本ガイドで手動適用が必要**

### Migration ファイル位置
`/home/user/webapp/migrations/0010_fix_admin_user_name.sql`

## 完了チェックリスト
- [ ] Cloudflare Dashboardでuser-000の名前を確認（実行前）
- [ ] UPDATE文を実行（1 row affected）
- [ ] 更新後のデータを確認（name = '運営管理者'）
- [ ] アプリケーションでログイン名を確認
- [ ] 「運営管理者」と表示されることを確認

## 注意事項
- **本番データベースを直接操作します。慎重に実行してください。**
- SQL文をコピー&ペーストする際は、余分な改行やスペースが入らないよう注意してください
- 実行前に必ず現在のデータを確認してください
- エラーが発生した場合は、このガイドのトラブルシューティングセクションを参照してください

## サポート
問題が解決しない場合は、以下の情報を添えて管理者に連絡してください：
- エラーメッセージ（スクリーンショット）
- 実行したSQL文
- 実行結果（affected rows数）
- ユーザーID（user-000）の現在のデータ
