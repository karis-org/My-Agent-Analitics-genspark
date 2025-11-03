# 本番環境デプロイメントガイド

## 📋 概要

このガイドでは、My Agent Analytics v2.0.0 を Cloudflare Pages にデプロイする手順を説明します。

## 🔑 前提条件

### 必要なアカウント
- ✅ Cloudflare アカウント（無料プランでOK）
- ✅ Google Cloud Console アカウント（OAuth設定用）
- ✅ GitHub アカウント（コードリポジトリ）

### 必要なツール
- ✅ Node.js 18以上
- ✅ npm または yarn
- ✅ Git
- ✅ Wrangler CLI（`npm install -g wrangler`）

## 🚀 デプロイ手順

### ステップ1: Cloudflare APIキーの設定

1. **Cloudflare ダッシュボードにアクセス**
   - https://dash.cloudflare.com/
   - ログイン

2. **API トークンを作成**
   - 右上のプロフィールアイコン → My Profile
   - API Tokens タブ → Create Token
   - テンプレート: "Edit Cloudflare Workers" を選択
   - Zone Resources: Include - All zones
   - Account Resources: Include - All accounts
   - Create Token をクリック

3. **APIトークンをコピー**
   ```bash
   # 環境変数として設定（このセッション中のみ有効）
   export CLOUDFLARE_API_TOKEN=your-api-token-here
   ```

### ステップ2: 本番用D1データベースの作成

#### 2-1. D1データベースを作成

```bash
cd /home/user/webapp

# 本番用D1データベースを作成
npx wrangler d1 create my-agent-analytics-production
```

**出力例:**
```
✅ Successfully created DB 'my-agent-analytics-production'

[[d1_databases]]
binding = "DB"
database_name = "my-agent-analytics-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### 2-2. wrangler.jsonc を更新

`database_id` を上記の出力から取得して更新:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-agent-analytics",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-agent-analytics-production",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // ← ここを更新
    }
  ]
}
```

#### 2-3. マイグレーションを適用

```bash
# 本番データベースにマイグレーションを適用
npx wrangler d1 migrations apply my-agent-analytics-production

# 確認
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT COUNT(*) as user_count FROM users"
```

### ステップ3: 環境変数の設定

#### 3-1. Cloudflare Pages Secretsを設定

```bash
# プロジェクト名を確認
PROJECT_NAME="my-agent-analytics"

# Google OAuth認証情報
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name $PROJECT_NAME
# 入力: 201753771617-4tp9hainbiin2qir27g5bm0t9iunt71t.apps.googleusercontent.com

npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name $PROJECT_NAME
# 入力: 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

# セッションシークレット
npx wrangler pages secret put SESSION_SECRET --project-name $PROJECT_NAME
# 入力: 0WEleiAjVWW7/WEMDTRUouyR+6cZnzwRsuTnynxK7DI=

# その他のAPIキー（任意）
npx wrangler pages secret put OPENAI_API_KEY --project-name $PROJECT_NAME
npx wrangler pages secret put ESTAT_API_KEY --project-name $PROJECT_NAME
npx wrangler pages secret put REINFOLIB_API_KEY --project-name $PROJECT_NAME
npx wrangler pages secret put ITANDI_API_KEY --project-name $PROJECT_NAME
```

#### 3-2. 設定確認

```bash
# 設定済みのSecretsを確認
npx wrangler pages secret list --project-name $PROJECT_NAME
```

### ステップ4: Google OAuth リダイレクトURIの設定

1. **Google Cloud Console にアクセス**
   - https://console.cloud.google.com/
   - プロジェクト「My Agent」を選択

2. **認証情報を編集**
   - APIとサービス → 認証情報
   - OAuth 2.0 クライアントIDを選択
   - 承認済みのリダイレクトURIに追加:

```
https://my-agent-analytics.pages.dev/auth/google/callback
```

3. **保存**

### ステップ5: Cloudflare Pagesプロジェクトの作成

#### 5-1. プロジェクトを作成

```bash
# Cloudflare Pagesプロジェクトを作成
npx wrangler pages project create my-agent-analytics \
  --production-branch main \
  --compatibility-date 2024-01-01
```

#### 5-2. ビルド設定を確認

Cloudflare Dashboard で設定:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`
- **Node.js version**: `18` または `20`

### ステップ6: デプロイ実行

#### 6-1. プロジェクトをビルド

```bash
cd /home/user/webapp

# ビルド
npm run build
```

#### 6-2. Cloudflare Pagesにデプロイ

```bash
# デプロイ実行
npx wrangler pages deploy dist --project-name my-agent-analytics

# または package.json スクリプトを使用
npm run deploy:prod
```

**出力例:**
```
✨ Compiled Worker successfully
✨ Uploading... (X files)
✨ Success! Uploaded X files (Y seconds)

✨ Deployment complete! Take a peek over at
   https://3730971.my-agent-analytics.pages.dev
```

#### 6-3. 本番URLにアクセス

```
Production: https://my-agent-analytics.pages.dev
```

### ステップ7: D1データベースのバインディング確認

Cloudflare Dashboard で確認:
1. Workers & Pages → my-agent-analytics
2. Settings → Functions
3. D1 database bindings セクションで確認:
   - Variable name: `DB`
   - D1 database: `my-agent-analytics-production`

### ステップ8: デプロイメント検証

#### 8-1. ヘルスチェック

```bash
curl https://my-agent-analytics.pages.dev/api/health
```

**期待される出力:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T16:30:00.000Z",
  "version": "2.0.0"
}
```

#### 8-2. 認証テスト

ブラウザで以下のURLにアクセス:
```
https://my-agent-analytics.pages.dev/auth/login
```

- 管理者ログイン: `admin@myagent.local` / `Admin@2025`
- Google OAuth: 動作確認

#### 8-3. データベーステスト

```bash
# ユーザー数を確認
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT COUNT(*) FROM users"

# 管理者ユーザーを確認
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT email, name, is_admin FROM users WHERE is_admin = 1"
```

## 🔧 トラブルシューティング

### エラー: "Error: Authentication error"

**原因**: Cloudflare API トークンが設定されていない

**解決方法**:
```bash
export CLOUDFLARE_API_TOKEN=your-api-token-here
npx wrangler whoami  # 認証確認
```

### エラー: "Database not found"

**原因**: D1データベースが作成されていないか、IDが間違っている

**解決方法**:
```bash
# データベース一覧を確認
npx wrangler d1 list

# wrangler.jsonc の database_id を確認
```

### エラー: "OAuth redirect_uri_mismatch"

**原因**: Google Cloud ConsoleのリダイレクトURIが正しく設定されていない

**解決方法**:
1. Google Cloud Console で認証情報を確認
2. 承認済みのリダイレクトURIに以下を追加:
   ```
   https://my-agent-analytics.pages.dev/auth/google/callback
   ```

### エラー: "Build failed"

**原因**: 依存関係の問題またはビルドエラー

**解決方法**:
```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install

# ビルドを再実行
npm run build
```

### パフォーマンス問題

**症状**: ページの読み込みが遅い

**解決方法**:
1. キャッシングが有効になっているか確認
2. Cloudflare Analytics でパフォーマンスを確認
3. 静的アセットのCDN配信を確認

## 📊 デプロイ後の確認事項

### ✅ 必須チェックリスト

- [ ] ヘルスチェックAPIが正常に応答する
- [ ] 管理者ログインが機能する
- [ ] Google OAuth認証が機能する
- [ ] D1データベースが正しくバインドされている
- [ ] 環境変数（Secrets）がすべて設定されている
- [ ] リダイレクトURIが正しく設定されている
- [ ] PWAマニフェストが正しく読み込まれる
- [ ] 静的アセット（画像、CSS、JS）が正しく配信される

### ✅ 機能チェックリスト

- [ ] 物件の登録・編集・削除
- [ ] 物件の分析（利回り計算など）
- [ ] 物件調査（心理的瑕疵チェック）
- [ ] 価格影響度計算
- [ ] 物件比較機能
- [ ] PDFレポート生成
- [ ] データ可視化（チャート）
- [ ] 市場分析API

## 🔄 継続的デプロイ (CI/CD)

### GitHub Actionsとの連携

`.github/workflows/deploy.yml` を作成:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: my-agent-analytics
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Secrets設定

リポジトリ設定 → Secrets and variables → Actions → New repository secret:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 📈 モニタリング

### Cloudflare Analytics

1. Cloudflare Dashboard → Workers & Pages → my-agent-analytics
2. Analytics タブで以下を確認:
   - リクエスト数
   - エラー率
   - レイテンシー
   - データ転送量

### ログの確認

```bash
# リアルタイムログ
npx wrangler pages deployment tail

# 特定のデプロイメントのログ
npx wrangler pages deployment list --project-name my-agent-analytics
```

## 🔐 セキュリティ

### 本番環境でのベストプラクティス

1. **環境変数の管理**
   - `.dev.vars` をGitにコミットしない（`.gitignore`に追加済み）
   - 本番環境では必ず Secrets を使用

2. **認証情報のローテーション**
   - 定期的にAPIキーを更新
   - Google OAuth認証情報を定期的に確認

3. **HTTPS強制**
   - Cloudflare Pagesは自動的にHTTPSを強制
   - カスタムドメインでもHTTPSを使用

4. **CORS設定**
   - 必要最小限のオリジンのみ許可
   - APIルートのみCORSを有効化

## 📚 参考リンク

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database ドキュメント](https://developers.cloudflare.com/d1/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

**最終更新**: 2025-10-30  
**対象バージョン**: My Agent Analytics v2.0.0
