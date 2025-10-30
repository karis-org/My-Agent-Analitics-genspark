# APIキー設定ガイド - 完全版

このガイドでは、My Agent Analyticsで必要なすべてのAPIキーの取得方法と設定方法を詳しく説明します。

## 📋 目次

1. [必須APIキー](#1-必須apiキー)
   - [Google OAuth認証](#11-google-oauth認証-必須)
   - [Session Secret](#12-session-secret-必須)
   - [不動産情報ライブラリAPI](#13-不動産情報ライブラリapi-必須)
2. [任意APIキー](#2-任意apiキー)
   - [OpenAI API](#21-openai-api-任意)
   - [e-Stat API](#22-e-stat-api-任意)
   - [イタンジAPI](#23-イタンジapi-任意)
   - [レインズ](#24-レインズ-任意)
3. [ローカル環境への設定](#3-ローカル環境への設定)
4. [Cloudflare本番環境への設定](#4-cloudflare本番環境への設定)

---

## 1. 必須APIキー

### 1.1 Google OAuth認証（必須）

ユーザーログイン機能に必要です。

#### **手順:**

**ステップ1: Google Cloud Consoleにアクセス**
```
https://console.cloud.google.com/
```

**ステップ2: プロジェクトを作成**
1. 左上のプロジェクト選択ドロップダウンをクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名: `my-agent-analytics`（任意）
4. 「作成」をクリック

**ステップ3: OAuth同意画面を設定**
1. 左メニューから「APIとサービス」→「OAuth同意画面」
2. ユーザータイプ: **外部** を選択
3. 「作成」をクリック
4. アプリ情報を入力:
   - アプリ名: `My Agent Analytics`
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス
5. 「保存して次へ」を3回クリック（スコープとテストユーザーはスキップ）

**ステップ4: 認証情報を作成**
1. 左メニューから「認証情報」をクリック
2. 「認証情報を作成」→「OAuthクライアントID」
3. アプリケーションの種類: **ウェブアプリケーション**
4. 名前: `My Agent Analytics Web Client`
5. **承認済みのリダイレクトURI** に以下を追加:
   ```
   # ローカル開発用
   http://localhost:3000/auth/callback
   
   # Sandbox環境用
   https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai/auth/callback
   
   # 本番環境用（デプロイ後に追加）
   https://your-cloudflare-pages-url.pages.dev/auth/callback
   ```
6. 「作成」をクリック
7. **クライアントID** と **クライアントシークレット** が表示されます
8. これらをコピーして保存してください

**取得した情報:**
```
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ABcdEFghIJklMNopQRstUVwxYZ12
```

---

### 1.2 Session Secret（必須）

セッション管理に使用する秘密鍵です。

#### **生成方法:**

**方法1: OpenSSLコマンド（推奨）**
```bash
openssl rand -base64 32
```

出力例:
```
jK8pL9mN2qR4sT6vW8xY0zA1bC3dE5fG7hI9jK0lM2n=
```

**方法2: オンラインジェネレーター**
```
https://www.random.org/strings/
- Length: 32
- Characters: Alphanumeric + special characters
```

**取得した情報:**
```
SESSION_SECRET=jK8pL9mN2qR4sT6vW8xY0zA1bC3dE5fG7hI9jK0lM2n=
```

---

### 1.3 不動産情報ライブラリAPI（必須）

国土交通省の実取引価格データ・地価公示データにアクセスするために必要です。

#### **手順:**

**ステップ1: 不動産情報ライブラリにアクセス**
```
https://www.reinfolib.mlit.go.jp/
```

**ステップ2: API利用申請**
1. トップページから「API」メニューをクリック
2. 「API利用申請」をクリック
3. 利用目的を記入:
   ```
   不動産投資分析ツール「My Agent Analytics」における
   市場動向分析・物件価格推定機能のため
   ```
4. 必要情報を入力:
   - 氏名・組織名
   - メールアドレス
   - 利用予定期間
5. 申請を送信

**ステップ3: APIキーを受け取る**
- 通常1-3営業日でメールにてAPIキーが送付されます
- メールに記載されているAPIキーをコピー

**取得した情報:**
```
REINFOLIB_API_KEY=reinfolib_abcd1234efgh5678ijkl9012mnop3456
```

#### **API詳細:**
- **API仕様書**: https://www.reinfolib.mlit.go.jp/help/apiManual/
- **利用制限**: 1日あたり10,000リクエスト
- **レスポンス形式**: JSON/XML

---

## 2. 任意APIキー

### 2.1 OpenAI API（任意）

GPT-4を使ったAI市場分析機能に必要です。

#### **手順:**

**ステップ1: OpenAI Platformにアクセス**
```
https://platform.openai.com/
```

**ステップ2: アカウント作成・ログイン**
- Googleアカウントまたはメールアドレスで登録

**ステップ3: APIキーを作成**
1. 右上のアカウントメニューから「API keys」をクリック
2. 「Create new secret key」をクリック
3. 名前: `My Agent Analytics`
4. 権限: **All** または **Read & Write**
5. 「Create secret key」をクリック
6. 表示されたキーをコピー（⚠️ 一度しか表示されません）

**ステップ4: 支払い情報を登録**
1. 左メニューから「Billing」→「Payment methods」
2. クレジットカード情報を登録
3. 初回$5-10の残高をチャージ

**取得した情報:**
```
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP
```

#### **料金:**
- GPT-4o: $2.50 / 1M input tokens
- GPT-4o-mini: $0.15 / 1M input tokens
- **推奨**: GPT-4o-mini（コスパ◎）

---

### 2.2 e-Stat API（任意）

政府統計データ（人口、経済指標）にアクセスするために必要です。

#### **手順:**

**ステップ1: e-Statにアクセス**
```
https://www.e-stat.go.jp/
```

**ステップ2: アカウント登録**
1. 右上の「API」をクリック
2. 「アプリケーションID取得」をクリック
3. 「新規登録」からアカウント作成
4. メールアドレスで認証

**ステップ3: アプリケーションID取得**
1. ログイン後、「マイページ」→「アプリケーション管理」
2. 「新規アプリケーション登録」
3. アプリケーション名: `My Agent Analytics`
4. 利用目的: `不動産投資分析における地域統計データ活用`
5. 「登録」をクリック
6. アプリケーションIDが発行されます

**取得した情報:**
```
ESTAT_API_KEY=abcd1234efgh5678ijkl9012mnop3456qrst7890
```

#### **利用可能データ:**
- 人口統計（国勢調査）
- 経済センサス
- 住宅・土地統計
- 家計調査

---

### 2.3 イタンジAPI（任意）

賃貸物件情報・賃料相場データにアクセスするために必要です。

#### **手順:**

**ステップ1: イタンジ公式サイトにアクセス**
```
https://www.itandi.co.jp/
```

**ステップ2: API利用申請**
1. サイト下部の「お問い合わせ」をクリック
2. 問い合わせ種別: **API利用について**
3. 内容を記入:
   ```
   不動産投資分析ツールにおける賃料相場データ活用のため、
   イタンジAPIの利用を希望します。
   
   利用目的: 賃貸物件の収益性分析
   予定利用規模: 月間XX件
   ```
4. 送信

**ステップ3: 契約・APIキー発行**
- 担当者から連絡が来ます
- 契約内容・料金プランを確認
- 契約後、APIキーとドキュメントが提供されます

**取得した情報:**
```
ITANDI_API_KEY=itandi_live_abcd1234efgh5678ijkl9012mnop3456
```

#### **料金:**
- 要問合せ（利用規模により変動）
- 無料トライアルあり

---

### 2.4 レインズ（任意）

不動産流通情報・成約事例にアクセスするために必要です。

#### **手順:**

**ステップ1: レインズ会員資格の確認**
- レインズは**宅地建物取引業者のみ**利用可能
- 所属している不動産会社がレインズ会員であることが必要

**ステップ2: 会員IDの取得**
1. 所属する不動産会社の管理者に連絡
2. レインズのユーザーIDとパスワードを発行してもらう
3. 所属する地域のレインズ（東日本、中部、近畿、西日本）を確認

**ステップ3: ログイン情報の確認**
```
ログインID: 会社から発行されたID（例: 12345-67890）
パスワード: 設定したパスワード
```

**取得した情報:**
```
REINS_LOGIN_ID=12345-67890
REINS_PASSWORD=YourSecurePassword123
```

#### **注意事項:**
- ⚠️ レインズ情報の外部公開は禁止
- 分析結果のみ表示し、元データは保存しない設計が必要
- 利用規約を必ず確認

---

## 3. ローカル環境への設定

取得したAPIキーをローカル開発環境に設定します。

### **手順:**

**ステップ1: .dev.vars ファイルを編集**

```bash
# プロジェクトディレクトリに移動
cd /home/user/webapp

# .dev.vars ファイルを編集
nano .dev.vars  # または vim, code など
```

**ステップ2: APIキーを貼り付け**

```bash
# 必須APIキー
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ABcdEFghIJklMNopQRstUVwxYZ12
SESSION_SECRET=jK8pL9mN2qR4sT6vW8xY0zA1bC3dE5fG7hI9jK0lM2n=
REINFOLIB_API_KEY=reinfolib_abcd1234efgh5678ijkl9012mnop3456

# 任意APIキー（取得済みの場合のみ）
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890
ESTAT_API_KEY=abcd1234efgh5678ijkl9012mnop3456qrst7890
ITANDI_API_KEY=itandi_live_abcd1234efgh5678ijkl9012mnop3456
REINS_LOGIN_ID=12345-67890
REINS_PASSWORD=YourSecurePassword123
```

**ステップ3: ファイルを保存**
- Nano: `Ctrl + O` → `Enter` → `Ctrl + X`
- Vim: `ESC` → `:wq` → `Enter`

**ステップ4: 設定を確認**

```bash
# APIキー設定状況を確認
bash check-api-keys.sh
```

出力例:
```
=== My Agent Analytics - APIキー設定確認 ===

✅ GOOGLE_CLIENT_ID: 設定済み
✅ GOOGLE_CLIENT_SECRET: 設定済み
✅ SESSION_SECRET: 設定済み
✅ REINFOLIB_API_KEY: 設定済み
✅ OPENAI_API_KEY: 設定済み
⚠️  ESTAT_API_KEY: 未設定（任意）
⚠️  ITANDI_API_KEY: 未設定（任意）
⚠️  REINS_LOGIN_ID: 未設定（任意）
⚠️  REINS_PASSWORD: 未設定（任意）

必須APIキー: 4/4 設定完了
任意APIキー: 1/5 設定完了
```

**ステップ5: サービスを再起動**

```bash
# PM2でサービスを再起動
pm2 restart my-agent-analytics

# ログを確認
pm2 logs my-agent-analytics --nostream
```

出力例:
```
Your worker has access to the following bindings:
- Vars:
  - GOOGLE_CLIENT_ID: "(hidden)"
  - GOOGLE_CLIENT_SECRET: "(hidden)"
  - REINFOLIB_API_KEY: "(hidden)"
  - OPENAI_API_KEY: "(hidden)"
  ...
```

---

## 4. Cloudflare本番環境への設定

本番環境（Cloudflare Pages）にAPIキーを設定します。

### **前提条件:**

1. Cloudflare APIトークンの設定
2. プロジェクトのデプロイ完了

### **方法1: Wrangler CLI（推奨）**

**ステップ1: Cloudflare認証を設定**

```bash
# GenSparkでCloudflare APIキーをセットアップ
# setup_cloudflare_api_key ツールを実行
```

**ステップ2: 各APIキーを設定**

```bash
# 必須APIキー
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name webapp
# 入力プロンプトが表示されたら、Google Client IDを貼り付け

npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name webapp
# Google Client Secretを貼り付け

npx wrangler pages secret put SESSION_SECRET --project-name webapp
# Session Secretを貼り付け

npx wrangler pages secret put REINFOLIB_API_KEY --project-name webapp
# REINFOLIB APIキーを貼り付け

# 任意APIキー（取得済みの場合）
npx wrangler pages secret put OPENAI_API_KEY --project-name webapp
npx wrangler pages secret put ESTAT_API_KEY --project-name webapp
npx wrangler pages secret put ITANDI_API_KEY --project-name webapp
npx wrangler pages secret put REINS_LOGIN_ID --project-name webapp
npx wrangler pages secret put REINS_PASSWORD --project-name webapp
```

**ステップ3: 設定を確認**

```bash
# 設定済みのSecretを確認
npx wrangler pages secret list --project-name webapp
```

出力例:
```
[
  {
    "name": "GOOGLE_CLIENT_ID",
    "type": "secret_text"
  },
  {
    "name": "GOOGLE_CLIENT_SECRET",
    "type": "secret_text"
  },
  {
    "name": "SESSION_SECRET",
    "type": "secret_text"
  },
  {
    "name": "REINFOLIB_API_KEY",
    "type": "secret_text"
  },
  ...
]
```

### **方法2: Cloudflare Dashboard（GUI）**

**ステップ1: Cloudflare Dashboardにログイン**
```
https://dash.cloudflare.com/
```

**ステップ2: プロジェクトを選択**
1. 左メニューから「Workers & Pages」をクリック
2. プロジェクト `webapp` をクリック

**ステップ3: 環境変数を設定**
1. 「Settings」タブをクリック
2. 「Environment variables」セクションまでスクロール
3. 「Add variable」をクリック

**ステップ4: 各APIキーを追加**

| Variable name | Value | Environment |
|--------------|-------|-------------|
| `GOOGLE_CLIENT_ID` | `123456789012-abcd...` | Production |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-ABcd...` | Production |
| `SESSION_SECRET` | `jK8pL9mN2q...` | Production |
| `REINFOLIB_API_KEY` | `reinfolib_abcd...` | Production |
| `OPENAI_API_KEY` | `sk-proj-abcd...` | Production |
| ... | ... | Production |

**注意:**
- Type: **Secret** を選択（値が暗号化されます）
- Environment: **Production** を選択

**ステップ5: 保存して再デプロイ**
1. 「Save」をクリック
2. 最新のデプロイメントを再実行:
   ```bash
   npm run deploy:prod
   ```

---

## 5. トラブルシューティング

### **問題1: APIキーが読み込まれない**

**症状:**
```
Error: GOOGLE_CLIENT_ID is not defined
```

**解決方法:**
1. `.dev.vars` ファイルの存在を確認
   ```bash
   ls -la /home/user/webapp/.dev.vars
   ```

2. ファイル内容を確認
   ```bash
   cat /home/user/webapp/.dev.vars
   ```

3. 余計な空白やクォートがないか確認
   ```bash
   # ❌ 間違い
   GOOGLE_CLIENT_ID = "123456..."
   GOOGLE_CLIENT_ID='123456...'
   
   # ✅ 正しい
   GOOGLE_CLIENT_ID=123456...
   ```

4. サービスを完全再起動
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.cjs
   ```

### **問題2: Google OAuth認証エラー**

**症状:**
```
Error: redirect_uri_mismatch
```

**解決方法:**
1. Google Cloud Consoleで承認済みリダイレクトURIを確認
2. 現在のURL（Sandbox URL）を追加:
   ```
   https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai/auth/callback
   ```
3. 完全一致していることを確認（末尾の`/`にも注意）

### **問題3: Cloudflare Secretsが反映されない**

**症状:**
- Wranglerで設定したが、アプリで読み込めない

**解決方法:**
1. Secretsのスコープを確認
   ```bash
   npx wrangler pages secret list --project-name webapp
   ```

2. 再デプロイが必要
   ```bash
   npm run deploy:prod
   ```

3. 環境変数の名前が正確か確認（大文字小文字を区別）

---

## 6. セキュリティのベストプラクティス

### **必ず守ること:**

1. ✅ `.dev.vars` をGitにコミットしない
   ```bash
   # .gitignore に追加済みか確認
   grep ".dev.vars" .gitignore
   ```

2. ✅ APIキーを定期的にローテーション
   - 3-6ヶ月ごとに新しいキーを生成

3. ✅ 環境ごとに異なるキーを使用
   - 開発環境 ≠ 本番環境

4. ✅ 最小権限の原則
   - 必要な権限のみを付与

### **やってはいけないこと:**

1. ❌ GitHubにAPIキーをコミット
2. ❌ フロントエンドコードにAPIキーを記述
3. ❌ APIキーをURLパラメータに含める
4. ❌ 公開チャンネルでAPIキーを共有

---

## 7. まとめチェックリスト

### **ローカル開発環境:**

- [ ] `.dev.vars` ファイルを作成
- [ ] Google OAuth認証情報を設定
- [ ] Session Secretを生成・設定
- [ ] REINFOLIB APIキーを設定
- [ ] （任意）その他のAPIキーを設定
- [ ] `bash check-api-keys.sh` で確認
- [ ] PM2を再起動
- [ ] ブラウザでログイン機能をテスト

### **Cloudflare本番環境:**

- [ ] Cloudflare APIトークンを設定
- [ ] Wrangler CLIで全てのSecretsを設定
- [ ] `npx wrangler pages secret list` で確認
- [ ] 本番環境に再デプロイ
- [ ] 本番URLでログイン機能をテスト
- [ ] システム情報ページで機能状態を確認

---

## 📞 サポート

問題が解決しない場合:

1. **ログを確認:**
   ```bash
   pm2 logs my-agent-analytics --lines 50
   ```

2. **GitHub Issue:**
   https://github.com/koki-187/My-Agent-Analitics-genspark/issues

3. **API公式ドキュメント:**
   - Google OAuth: https://developers.google.com/identity/protocols/oauth2
   - REINFOLIB: https://www.reinfolib.mlit.go.jp/help/apiManual/
   - OpenAI: https://platform.openai.com/docs/
   - e-Stat: https://www.e-stat.go.jp/api/

---

**最終更新:** 2025年10月30日  
**バージョン:** 1.0
