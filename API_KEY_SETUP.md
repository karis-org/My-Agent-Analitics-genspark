# APIキー設定ガイド

My Agent Analyticsで各種APIを使用するための設定方法を説明します。

## 📋 必要なAPIキー一覧

### 1. Google OAuth（認証用）
- **GOOGLE_CLIENT_ID**: Google OAuthクライアントID
- **GOOGLE_CLIENT_SECRET**: Google OAuthクライアントシークレット

### 2. 不動産情報ライブラリAPI（国土交通省）
- **REINFOLIB_API_KEY**: 不動産情報ライブラリAPIキー

### 3. OpenAI API（AI分析用）
- **OPENAI_API_KEY**: OpenAI APIキー

### 4. e-Stat API（政府統計データ）
- **ESTAT_API_KEY**: e-Stat APIキー

### 5. イタンジAPI（賃貸物件情報）
- **ITANDI_API_KEY**: イタンジAPIキー

### 6. レインズ（不動産流通情報）
- **REINS_LOGIN_ID**: レインズログインID
- **REINS_PASSWORD**: レインズパスワード

### 7. セッション管理
- **SESSION_SECRET**: セッション暗号化用シークレット（ランダムな文字列）

---

## 🔧 ローカル開発環境の設定

### 手順1: .dev.varsファイルを編集

プロジェクトルートの `.dev.vars` ファイルを開き、取得したAPIキーを設定します：

```bash
# Google OAuth（必須 - ログイン機能に必要）
GOOGLE_CLIENT_ID=あなたのGoogleクライアントID
GOOGLE_CLIENT_SECRET=あなたのGoogleクライアントシークレット

# OpenAI API（任意 - AI分析機能に必要）
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxx

# e-Stat API（任意 - 政府統計データに必要）
ESTAT_API_KEY=あなたのe-StatAPIキー

# 不動産情報ライブラリAPI（必須 - 市場分析に必要）
REINFOLIB_API_KEY=あなたの不動産情報ライブラリAPIキー

# イタンジAPI（任意 - 賃貸物件情報に必要）
ITANDI_API_KEY=あなたのイタンジAPIキー

# レインズ（任意 - 不動産流通情報に必要）
REINS_LOGIN_ID=あなたのレインズID
REINS_PASSWORD=あなたのレインズパスワード

# Session Secret（必須 - セッション管理に必要）
SESSION_SECRET=ランダムな長い文字列を生成してください
```

### 手順2: サービスを再起動

APIキーを設定したら、開発サーバーを再起動します：

```bash
cd /home/user/webapp
pm2 restart my-agent-analytics
```

---

## 🚀 本番環境（Cloudflare Pages）の設定

### 方法1: Wrangler CLI（推奨）

```bash
cd /home/user/webapp

# Google OAuth
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name webapp
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name webapp

# OpenAI
npx wrangler pages secret put OPENAI_API_KEY --project-name webapp

# e-Stat
npx wrangler pages secret put ESTAT_API_KEY --project-name webapp

# 不動産情報ライブラリ
npx wrangler pages secret put REINFOLIB_API_KEY --project-name webapp

# イタンジ
npx wrangler pages secret put ITANDI_API_KEY --project-name webapp

# レインズ
npx wrangler pages secret put REINS_LOGIN_ID --project-name webapp
npx wrangler pages secret put REINS_PASSWORD --project-name webapp

# Session Secret
npx wrangler pages secret put SESSION_SECRET --project-name webapp
```

各コマンド実行後、プロンプトでAPIキーを入力します。

### 方法2: Cloudflare Dashboard

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Workers & Pages** > **webapp** を選択
3. **Settings** タブ > **Environment variables** セクション
4. **Add variable** ボタンをクリック
5. 各APIキーを名前と値のペアで追加
6. **Encrypt** オプションを有効にする（シークレット情報）
7. **Save** をクリック

---

## 🔑 各APIキーの取得方法

### 1. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. **APIとサービス** > **認証情報** に移動
4. **認証情報を作成** > **OAuthクライアントID**
5. アプリケーションタイプ: **ウェブアプリケーション**
6. 承認済みのリダイレクトURI:
   - ローカル: `http://localhost:3000/auth/google/callback`
   - 本番: `https://your-domain.pages.dev/auth/google/callback`
7. クライアントIDとシークレットをコピー

### 2. 不動産情報ライブラリAPI

1. [不動産情報ライブラリ](https://www.reinfolib.mlit.go.jp/) にアクセス
2. **API利用申請** ページに移動
3. 必要事項を記入して申請
4. 承認後、メールでAPIキーが送付されます

**必要情報:**
- 利用者種別
- 氏名
- メールアドレス
- 利用目的
- 法人または団体名（該当する場合）

### 3. OpenAI API

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウント作成/ログイン
3. **API Keys** セクションに移動
4. **Create new secret key** をクリック
5. APIキーをコピー（一度しか表示されません）

### 4. e-Stat API

1. [e-Stat](https://www.e-stat.go.jp/) にアクセス
2. **API機能** > **API利用登録** に移動
3. 利用者情報を登録
4. appIdが発行されます

### 5. イタンジAPI

イタンジAPIの利用は企業契約が必要です。
1. [イタンジ](https://corp.itandi.co.jp/) に問い合わせ
2. API利用契約を締結
3. APIキーが発行されます

### 6. レインズ

レインズは不動産業者専用のシステムです。
1. 所属する不動産業界団体（宅建協会等）に問い合わせ
2. レインズ利用申請
3. ログインIDとパスワードが発行されます

**注意**: レインズにはAPIが存在しないため、現在はログイン情報のみを保存しています。

---

## ✅ 設定確認

### ローカル環境

```bash
# APIキーが正しく読み込まれているか確認
cd /home/user/webapp
pm2 logs my-agent-analytics --nostream | grep -i "api"
```

### APIエンドポイントテスト

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# 市区町村一覧取得（不動産情報ライブラリAPI）
curl "http://localhost:3000/api/market/municipalities?area=13"

# 取引価格情報取得
curl "http://localhost:3000/api/market/trade-prices?year=2024&area=13"
```

---

## 🔒 セキュリティのベストプラクティス

### ✅ 必ず実施

1. **APIキーを直接コードに書かない**
   - 環境変数を使用する
   - `.dev.vars` ファイルを `.gitignore` に追加（既に追加済み）

2. **本番環境では暗号化**
   - Cloudflare Pagesの環境変数は自動的に暗号化されます

3. **定期的なキーのローテーション**
   - 3-6ヶ月ごとにAPIキーを更新

4. **最小権限の原則**
   - 必要な権限のみを持つAPIキーを使用

### ❌ 禁止事項

1. APIキーをGitHubにコミットしない
2. APIキーをクライアント側JavaScriptに埋め込まない
3. APIキーを他人と共有しない
4. APIキーをログに出力しない

---

## 🆘 トラブルシューティング

### 問題: 「Unauthorized」エラーが発生

**解決方法:**
1. APIキーが正しく設定されているか確認
2. `.dev.vars` ファイルに空白やタイポがないか確認
3. サービスを再起動: `pm2 restart my-agent-analytics`

### 問題: APIレスポンスが空

**解決方法:**
1. APIキーが有効か確認（期限切れの可能性）
2. API利用制限に達していないか確認
3. ネットワーク接続を確認

### 問題: 環境変数が読み込まれない

**解決方法:**
1. `.dev.vars` ファイルがプロジェクトルートにあるか確認
2. ファイル名が正確に `.dev.vars` であるか確認
3. PM2を完全に再起動: `pm2 delete all && pm2 start ecosystem.config.cjs`

---

## 📞 サポート

問題が解決しない場合は、[GitHubのIssue](https://github.com/koki-187/My-Agent-Analitics-genspark/issues)を作成してください。

**必要情報:**
- エラーメッセージ
- 実行したコマンド
- 環境（ローカル/本番）
- 該当するAPIサービス
