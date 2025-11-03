# Google Cloud Console セットアップガイド

## 📋 概要

My Agent Analyticsアプリケーションで Google OAuth 2.0認証を使用するために、Google Cloud Consoleで正しいリダイレクトURIを設定する必要があります。

## 🔑 現在の認証情報

### OAuth 2.0 クライアント
- **クライアントID**: `201753771617-4tp9hainbiin2qir27g5bm0t9iunt71t.apps.googleusercontent.com`
- **クライアントシークレット**: `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`
- **プロジェクト名**: My Agent

## ⚙️ 設定手順

### ステップ1: Google Cloud Consoleにアクセス

1. ブラウザで [Google Cloud Console](https://console.cloud.google.com/) を開く
2. Googleアカウントでログイン
3. プロジェクト「My Agent」を選択

### ステップ2: 認証情報ページに移動

1. 左側のメニューから「APIとサービス」を選択
2. 「認証情報」をクリック
3. OAuth 2.0 クライアント ID のリストから該当のクライアントを探す
   - クライアントID: `201753771617-4tp9hainbiin2qir27g5bm0t9iunt71t`

### ステップ3: リダイレクトURIを追加

クライアントIDをクリックして編集画面を開き、以下のURIを「承認済みのリダイレクトURI」セクションに追加します。

#### 開発環境用URI
```
http://localhost:3000/auth/google/callback
```

#### Cloudflare Pages本番環境用URI
```
https://webapp.pages.dev/auth/google/callback
https://my-agent-analytics.pages.dev/auth/google/callback
```

#### Cloudflareカスタムドメイン用URI（設定する場合）
```
https://yourdomain.com/auth/google/callback
```

### ステップ4: 変更を保存

1. すべてのURIを追加したら、ページ下部の「保存」ボタンをクリック
2. 変更が反映されるまで数分待つ（通常は即座）

## 🔍 重要な注意事項

### リダイレクトURIのパス
アプリケーションコードで使用しているリダイレクトパスは:
```
/auth/google/callback
```

**注意**: PDFに記載されていた `/api/auth/callback/google` ではありません。

### HTTPSの要件
本番環境では必ずHTTPSを使用してください。Cloudflare Pagesは自動的にHTTPSを提供します。

### 開発環境とローカルテスト
- `http://localhost:3000` は開発用として許可されています
- 本番環境では必ずHTTPSを使用してください

## ✅ 設定確認方法

### 1. ローカル環境でテスト

```bash
# アプリケーションを起動
cd /home/user/webapp
pm2 start ecosystem.config.cjs

# ブラウザで以下のURLにアクセス
http://localhost:3000/auth/google
```

正しく設定されていれば、Googleのログイン画面にリダイレクトされます。

### 2. 本番環境でテスト

```bash
# Cloudflare Pagesにデプロイ後
https://your-project.pages.dev/auth/google
```

## 🐛 トラブルシューティング

### エラー: redirect_uri_mismatch

**原因**: Google Cloud Consoleに登録されているリダイレクトURIと、アプリケーションが送信しているURIが一致していません。

**解決方法**:
1. エラーメッセージに表示されているURIを確認
2. Google Cloud Consoleでそのまったく同じURIを追加
3. 保存後、数分待ってから再試行

### エラー: 403 Forbidden

**原因**: OAuth同意画面が正しく設定されていないか、アプリが検証されていません。

**解決方法**:
1. Google Cloud Console → 「OAuth同意画面」を確認
2. テストユーザーを追加（開発中の場合）
3. 本番公開する場合は、Googleの検証プロセスを完了

### エラー: invalid_client

**原因**: クライアントIDまたはクライアントシークレットが正しくありません。

**解決方法**:
1. `.dev.vars`ファイル（開発環境）を確認
2. Cloudflare Pages の環境変数（本番環境）を確認
3. Google Cloud Consoleで最新の認証情報を取得

## 📱 本番環境の環境変数設定

Cloudflare Pagesにデプロイする際は、以下の環境変数を設定してください:

```bash
# Wranglerを使用して設定
npx wrangler pages secret put GOOGLE_CLIENT_ID
# 入力: 201753771617-4tp9hainbiin2qir27g5bm0t9iunt71t.apps.googleusercontent.com

npx wrangler pages secret put GOOGLE_CLIENT_SECRET
# 入力: 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

npx wrangler pages secret put SESSION_SECRET
# 入力: 0WEleiAjVWW7/WEMDTRUouyR+6cZnzwRsuTnynxK7DI=
```

または、Cloudflare Dashboardから:
1. Workers & Pages → あなたのプロジェクト
2. Settings → Environment variables
3. Production環境に上記の変数を追加

## 🔐 セキュリティベストプラクティス

1. **クライアントシークレットを公開しない**
   - GitHubにコミットしない
   - `.dev.vars`を`.gitignore`に追加済み
   
2. **HTTPS使用を強制**
   - 本番環境では必ずHTTPSを使用
   - Cloudflare Pagesは自動的にHTTPSを強制

3. **OAuth同意画面の設定**
   - プライバシーポリシーと利用規約のURLを設定
   - スコープを必要最小限に限定

4. **定期的な認証情報のローテーション**
   - セキュリティインシデント発生時は即座にローテーション
   - 定期的に認証情報を更新

## 📚 参考リンク

- [Google OAuth 2.0 公式ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)

---

**最終更新**: 2025-10-30  
**対象バージョン**: My Agent Analytics v2.0.0
