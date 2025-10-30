# Cloudflare Pages デプロイメント完全ガイド

My Agent AnalyticsをCloudflare Pagesにデプロイする手順を詳しく説明します。

## 📋 目次

1. [事前準備](#1-事前準備)
2. [Cloudflare API トークンの取得](#2-cloudflare-api-トークンの取得)
3. [プロジェクトのビルドとデプロイ](#3-プロジェクトのビルドとデプロイ)
4. [環境変数（Secrets）の設定](#4-環境変数secretsの設定)
5. [カスタムドメインの設定](#5-カスタムドメインの設定)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. 事前準備

### **必要なもの:**

- ✅ Cloudflareアカウント（無料）
- ✅ GitHubアカウント
- ✅ 本番用APIキー（すべて取得済み）
- ✅ プロジェクトコード（ビルド済み）

### **Cloudflareアカウント作成:**

1. https://dash.cloudflare.com/sign-up にアクセス
2. メールアドレスとパスワードで登録
3. メール認証を完了

---

## 2. Cloudflare API トークンの取得

Wrangler CLIを使ってデプロイするために、APIトークンが必要です。

### **方法1: GenSparkでの取得（推奨）**

```bash
# GenSparkツールを実行
setup_cloudflare_api_key
```

このツールが以下を自動で行います:
- Cloudflare APIトークンの検証
- 環境変数への設定
- Git認証情報の設定

### **方法2: 手動での取得**

**ステップ1: Cloudflare Dashboardにログイン**
```
https://dash.cloudflare.com/
```

**ステップ2: APIトークンページへ移動**
1. 右上のアカウントアイコンをクリック
2. 「マイプロフィール」→「APIトークン」

**ステップ3: トークンを作成**
1. 「トークンを作成」をクリック
2. テンプレート: **Cloudflare Pages の編集** を選択
3. 「トークンの作成を続ける」
4. トークンが表示されます（⚠️ 一度しか表示されません）
5. コピーして安全な場所に保存

**ステップ4: トークンをテスト**
```bash
# トークンが正しいか確認
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type:application/json"
```

成功すると:
```json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": {
    "id": "...",
    "status": "active"
  }
}
```

**ステップ5: 環境変数に設定**
```bash
# .bashrc または .zshrc に追加
export CLOUDFLARE_API_TOKEN="your-token-here"

# 即座に反映
source ~/.bashrc  # または source ~/.zshrc
```

---

## 3. プロジェクトのビルドとデプロイ

### **ステップ1: プロジェクトをビルド**

```bash
cd /home/user/webapp
npm run build
```

出力:
```
✓ 50 modules transformed.
dist/_worker.js  95.45 kB
✓ built in 521ms
```

### **ステップ2: D1データベースを作成**

```bash
# 本番用D1データベースを作成
npx wrangler d1 create webapp-production
```

出力:
```
✅ Successfully created DB 'webapp-production'
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "47496192-3bb1-46d7-95dc-915941ea6eb6"
```

**重要:** この `database_id` を `wrangler.jsonc` に設定:

```jsonc
{
  "name": "webapp",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "47496192-3bb1-46d7-95dc-915941ea6eb6"  // ここに貼り付け
    }
  ]
}
```

### **ステップ3: マイグレーションを実行**

```bash
# 本番データベースにスキーマを作成
npx wrangler d1 migrations apply webapp-production
```

出力:
```
Migrations to be applied:
  - 0001_initial_schema.sql
✅ Successfully applied 1 migration
```

### **ステップ4: Cloudflare Pagesプロジェクトを作成**

```bash
# プロジェクトを作成（初回のみ）
npx wrangler pages project create webapp \
  --production-branch main \
  --compatibility-date 2024-01-01
```

出力:
```
✅ Successfully created the 'webapp' project.
```

### **ステップ5: デプロイ**

```bash
# distディレクトリをデプロイ
npx wrangler pages deploy dist --project-name webapp
```

出力:
```
✨ Compiled Worker successfully
✨ Uploading...
✨ Deployment complete! Take a peek over at https://abcd1234.webapp.pages.dev
```

**デプロイURL:**
- **本番:** `https://<random-id>.webapp.pages.dev`
- **ブランチ:** `https://main.webapp.pages.dev`

### **ステップ6: デプロイを確認**

```bash
# ヘルスチェック
curl https://your-deployment-url.pages.dev/api/health
```

---

## 4. 環境変数（Secrets）の設定

本番環境のAPIキーを設定します。

### **方法1: Wrangler CLI（推奨）**

```bash
# 必須APIキー
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name webapp
# プロンプトが表示されたら、値を貼り付けて Enter

npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name webapp
npx wrangler pages secret put SESSION_SECRET --project-name webapp
npx wrangler pages secret put REINFOLIB_API_KEY --project-name webapp

# 任意APIキー（取得済みの場合）
npx wrangler pages secret put OPENAI_API_KEY --project-name webapp
npx wrangler pages secret put ESTAT_API_KEY --project-name webapp
npx wrangler pages secret put ITANDI_API_KEY --project-name webapp
npx wrangler pages secret put REINS_LOGIN_ID --project-name webapp
npx wrangler pages secret put REINS_PASSWORD --project-name webapp
```

### **方法2: Cloudflare Dashboard（GUI）**

**ステップ1: プロジェクト設定へ移動**
```
https://dash.cloudflare.com/ → Workers & Pages → webapp → Settings
```

**ステップ2: Environment variablesセクションへ**
1. 「Environment variables」まで下にスクロール
2. 「Add variable」をクリック

**ステップ3: 各APIキーを追加**

| Variable name | Value | Type | Environment |
|--------------|-------|------|-------------|
| `GOOGLE_CLIENT_ID` | `123456789012-...` | **Secret** | Production |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | **Secret** | Production |
| `SESSION_SECRET` | `jK8pL9mN2q...` | **Secret** | Production |
| `REINFOLIB_API_KEY` | `reinfolib_...` | **Secret** | Production |
| `OPENAI_API_KEY` | `sk-proj-...` | **Secret** | Production |

**注意点:**
- **Type**: 必ず「Secret」を選択（値が暗号化されます）
- **Environment**: 「Production」を選択
- 「Plain Text」は使用しないでください（セキュリティリスク）

**ステップ4: 保存**
1. 「Save」をクリック
2. 確認ダイアログで「Save」

### **設定を確認**

```bash
# 設定済みSecretsの一覧
npx wrangler pages secret list --project-name webapp
```

出力:
```json
[
  { "name": "GOOGLE_CLIENT_ID", "type": "secret_text" },
  { "name": "GOOGLE_CLIENT_SECRET", "type": "secret_text" },
  { "name": "SESSION_SECRET", "type": "secret_text" },
  { "name": "REINFOLIB_API_KEY", "type": "secret_text" },
  { "name": "OPENAI_API_KEY", "type": "secret_text" }
]
```

### **環境変数を反映させる**

環境変数を追加・変更した後は、**再デプロイが必要**です:

```bash
npm run deploy:prod
```

---

## 5. カスタムドメインの設定

独自ドメインを設定する方法です（任意）。

### **前提条件:**

- 独自ドメインを所有している（例: `myagent.example.com`）
- ドメインのDNS設定ができる

### **ステップ1: Cloudflareでドメインを管理**

**方法A: Cloudflareでドメインを購入**
1. Cloudflare Dashboard → ドメイン → 購入

**方法B: 既存ドメインをCloudflareに移管**
1. Cloudflare Dashboard → ドメイン → 追加
2. ネームサーバーをCloudflareのものに変更

### **ステップ2: カスタムドメインを追加**

**Cloudflare Dashboard:**
1. Workers & Pages → `webapp` → Custom domains
2. 「Set up a custom domain」をクリック
3. ドメイン名を入力: `myagent.example.com`
4. 「Activate domain」をクリック

**Wrangler CLI:**
```bash
npx wrangler pages domain add myagent.example.com --project-name webapp
```

### **ステップ3: DNS設定**

Cloudflareが自動でCNAMEレコードを作成します:

```
Type: CNAME
Name: myagent
Content: webapp.pages.dev
Proxy: Enabled (オレンジ色の雲)
```

### **ステップ4: SSL証明書の確認**

- Cloudflareが自動でSSL証明書を発行（数分～数時間）
- ステータスが「Active」になれば完了

### **ステップ5: Google OAuthリダイレクトURIを更新**

1. Google Cloud Console → 認証情報
2. 作成したOAuthクライアントを編集
3. 承認済みリダイレクトURIに追加:
   ```
   https://myagent.example.com/auth/callback
   ```
4. 保存

---

## 6. トラブルシューティング

### **問題1: デプロイエラー "Authentication error"**

**症状:**
```
Error: Authentication error
```

**解決方法:**
```bash
# APIトークンを再確認
echo $CLOUDFLARE_API_TOKEN

# トークンが設定されていない場合
export CLOUDFLARE_API_TOKEN="your-token-here"

# または setup_cloudflare_api_key を再実行
```

### **問題2: "Project not found"**

**症状:**
```
Error: Project 'webapp' not found
```

**解決方法:**
```bash
# プロジェクトを作成
npx wrangler pages project create webapp

# プロジェクト一覧を確認
npx wrangler pages project list
```

### **問題3: D1 Databaseエラー**

**症状:**
```
Error: D1 database 'webapp-production' not found
```

**解決方法:**
```bash
# D1データベース一覧を確認
npx wrangler d1 list

# データベースを作成
npx wrangler d1 create webapp-production

# wrangler.jsonc の database_id を更新
```

### **問題4: 環境変数が読み込まれない**

**症状:**
- アプリで `env.GOOGLE_CLIENT_ID` が undefined

**解決方法:**
```bash
# 1. Secretsが設定されているか確認
npx wrangler pages secret list --project-name webapp

# 2. 変数名のスペルミスを確認
# 正: GOOGLE_CLIENT_ID
# 誤: GOOGLE_CLIENTID, GoogleClientID

# 3. 再デプロイ
npm run deploy:prod
```

### **問題5: OAuth redirect_uri_mismatch**

**症状:**
```
Error: redirect_uri_mismatch
```

**解決方法:**
1. Google Cloud Console → 認証情報
2. 承認済みリダイレクトURIに以下を追加:
   ```
   https://your-actual-deployment-url.pages.dev/auth/callback
   ```
3. URLが完全一致しているか確認（末尾の`/`にも注意）

### **問題6: ビルドエラー**

**症状:**
```
Error: Build failed
```

**解決方法:**
```bash
# ローカルでビルドをテスト
npm run build

# エラーメッセージを確認
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# 再ビルド
npm run build
```

---

## 7. デプロイメントフロー図

```
┌─────────────────────────────────────────────────┐
│ 1. ローカル開発環境                               │
│    - コードを編集                                 │
│    - npm run build                               │
│    - ローカルでテスト（PM2）                      │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 2. GitHubにプッシュ                               │
│    - git add .                                   │
│    - git commit -m "..."                         │
│    - git push origin main                        │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 3. Cloudflare APIトークン設定                     │
│    - setup_cloudflare_api_key 実行               │
│    - または手動でトークン取得                      │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 4. D1データベース作成                             │
│    - npx wrangler d1 create webapp-production   │
│    - wrangler.jsonc に database_id を設定        │
│    - マイグレーション実行                         │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 5. Cloudflare Pagesプロジェクト作成               │
│    - npx wrangler pages project create webapp   │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 6. 初回デプロイ                                   │
│    - npx wrangler pages deploy dist             │
│    - デプロイURLを確認                            │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 7. 環境変数（Secrets）設定                        │
│    - Wrangler CLI または Dashboard              │
│    - 全てのAPIキーを設定                          │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 8. 再デプロイ（環境変数を反映）                    │
│    - npm run deploy:prod                        │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 9. Google OAuth設定                              │
│    - 本番URLをリダイレクトURIに追加               │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 10. 本番環境でテスト                              │
│     - ログイン機能                                │
│     - 物件登録                                    │
│     - 市場分析                                    │
│     - レポート生成                                │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ 11. カスタムドメイン設定（任意）                   │
│     - Cloudflare Dashboard                      │
│     - DNS設定                                    │
│     - SSL証明書確認                               │
└─────────────────────────────────────────────────┘
```

---

## 8. 便利なコマンド集

### **デプロイ関連:**

```bash
# ビルド → デプロイ（一発）
npm run deploy:prod

# デプロイメント一覧
npx wrangler pages deployment list --project-name webapp

# 特定のデプロイメントをロールバック
npx wrangler pages deployment rollback <deployment-id> --project-name webapp
```

### **D1データベース関連:**

```bash
# データベース一覧
npx wrangler d1 list

# SQLを直接実行
npx wrangler d1 execute webapp-production \
  --command="SELECT * FROM users LIMIT 5"

# SQLファイルを実行
npx wrangler d1 execute webapp-production --file=seed.sql

# マイグレーション一覧
npx wrangler d1 migrations list webapp-production
```

### **ログ確認:**

```bash
# リアルタイムログ（本番環境）
npx wrangler pages deployment tail --project-name webapp

# 特定のデプロイメントのログ
npx wrangler pages deployment logs <deployment-id> --project-name webapp
```

### **Secrets管理:**

```bash
# Secret一覧
npx wrangler pages secret list --project-name webapp

# Secretを削除
npx wrangler pages secret delete OPENAI_API_KEY --project-name webapp
```

---

## 9. まとめチェックリスト

### **初回デプロイ:**

- [ ] Cloudflareアカウント作成
- [ ] Cloudflare APIトークン取得
- [ ] D1データベース作成
- [ ] `wrangler.jsonc` に database_id を設定
- [ ] マイグレーション実行
- [ ] Cloudflare Pagesプロジェクト作成
- [ ] 初回デプロイ
- [ ] 環境変数（Secrets）設定
- [ ] 再デプロイ
- [ ] Google OAuthリダイレクトURI更新
- [ ] 本番環境でテスト

### **日常的な更新:**

- [ ] コードを変更
- [ ] ローカルでテスト
- [ ] GitHubにプッシュ
- [ ] `npm run deploy:prod` で本番デプロイ
- [ ] 本番環境で動作確認

---

## 📞 サポート

**公式ドキュメント:**
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- D1 Database: https://developers.cloudflare.com/d1/

**問題が解決しない場合:**
- GitHub Issue: https://github.com/koki-187/My-Agent-Analitics-genspark/issues
- Cloudflare Community: https://community.cloudflare.com/

---

**最終更新:** 2025年10月30日  
**バージョン:** 1.0
