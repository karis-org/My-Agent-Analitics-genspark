# クイックスタートガイド

My Agent Analyticsを**5分で起動**する最短手順です。

## 🚀 最速セットアップ（必須APIキーのみ）

### **ステップ1: APIキーを取得**

まず、以下の3つのAPIキーを取得してください：

1. **Google OAuth** （5分）
   - https://console.cloud.google.com/
   - プロジェクト作成 → OAuth認証情報作成
   - 詳細: [docs/API_KEY_SETUP_GUIDE.md](./API_KEY_SETUP_GUIDE.md#11-google-oauth認証必須)

2. **Session Secret** （1分）
   ```bash
   # ターミナルで実行
   openssl rand -base64 32
   ```

3. **REINFOLIB API** （申請後1-3営業日）
   - https://www.reinfolib.mlit.go.jp/
   - API利用申請
   - 詳細: [docs/API_KEY_SETUP_GUIDE.md](./API_KEY_SETUP_GUIDE.md#13-不動産情報ライブラリapi必須)

---

### **ステップ2: .dev.vars ファイルを編集**

#### **方法1: テキストエディタで編集（推奨）**

```bash
# プロジェクトディレクトリに移動
cd /home/user/webapp

# ファイルを開く（お好みのエディタで）
nano .dev.vars   # または vim, code など
```

#### **ファイル内容:**

```bash
# Development environment variables
# DO NOT commit this file to git!

# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ABcdEFghIJklMNopQRstUVwxYZ12

# OpenAI API (ChatGPT)
OPENAI_API_KEY=your-openai-api-key-here

# e-Stat API (政府統計API)
ESTAT_API_KEY=your-estat-api-key-here

# 不動産情報ライブラリAPI（国土交通省）
REINFOLIB_API_KEY=reinfolib_abcd1234efgh5678ijkl9012mnop3456

# イタンジAPI
ITANDI_API_KEY=your-itandi-api-key-here

# レインズ（REINS）ログイン情報
REINS_LOGIN_ID=your-reins-login-id-here
REINS_PASSWORD=your-reins-password-here

# Session Secret
SESSION_SECRET=jK8pL9mN2qR4sT6vW8xY0zA1bC3dE5fG7hI9jK0lM2n=
```

#### **編集のポイント:**

✅ **正しい形式:**
```bash
GOOGLE_CLIENT_ID=123456789012-abcdefg...
```

❌ **間違った形式:**
```bash
GOOGLE_CLIENT_ID = "123456789012-abcdefg..."  # スペースとクォート不要
GOOGLE_CLIENT_ID='123456789012-abcdefg...'    # シングルクォート不要
```

#### **保存方法:**
- **Nano**: `Ctrl + O` → `Enter` → `Ctrl + X`
- **Vim**: `ESC` → `:wq` → `Enter`
- **VSCode**: `Ctrl + S` (Windows) / `Cmd + S` (Mac)

---

### **ステップ3: 設定を確認**

```bash
# APIキー設定状況を確認
bash check-api-keys.sh
```

**期待される出力:**
```
=== My Agent Analytics - APIキー設定確認 ===

✅ GOOGLE_CLIENT_ID: 設定済み
✅ GOOGLE_CLIENT_SECRET: 設定済み
✅ SESSION_SECRET: 設定済み
✅ REINFOLIB_API_KEY: 設定済み
⚠️  OPENAI_API_KEY: 未設定（任意）
⚠️  ESTAT_API_KEY: 未設定（任意）
⚠️  ITANDI_API_KEY: 未設定（任意）
⚠️  REINS_LOGIN_ID: 未設定（任意）
⚠️  REINS_PASSWORD: 未設定（任意）

必須APIキー: 4/4 設定完了 ✅
任意APIキー: 0/5 設定完了

✅ すべての必須APIキーが設定されています。
```

---

### **ステップ4: サービスを起動**

```bash
# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# ログを確認
pm2 logs my-agent-analytics --nostream
```

**期待される出力:**
```
Your worker has access to the following bindings:
- Vars:
  - GOOGLE_CLIENT_ID: "(hidden)"
  - GOOGLE_CLIENT_SECRET: "(hidden)"
  - SESSION_SECRET: "(hidden)"
  - REINFOLIB_API_KEY: "(hidden)"
[wrangler:inf] Ready on http://0.0.0.0:3000
```

---

### **ステップ5: ブラウザで確認**

```
http://localhost:3000
```

1. 「ログイン」ボタンをクリック
2. Googleアカウントで認証
3. ダッシュボードに遷移
4. 🎉 完了！

---

## 📝 方法2: コマンドで一括編集

テキストエディタを使わずに、コマンドで直接編集する方法です。

### **テンプレートをダウンロード**

```bash
cd /home/user/webapp

# 既存の .dev.vars をバックアップ
cp .dev.vars .dev.vars.backup

# 新しい .dev.vars を作成
cat > .dev.vars << 'EOF'
# Development environment variables
# DO NOT commit this file to git!

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OpenAI API (ChatGPT)
OPENAI_API_KEY=your-openai-api-key-here

# e-Stat API (政府統計API)
ESTAT_API_KEY=your-estat-api-key-here

# 不動産情報ライブラリAPI（国土交通省）
REINFOLIB_API_KEY=your-reinfolib-api-key-here

# イタンジAPI
ITANDI_API_KEY=your-itandi-api-key-here

# レインズ（REINS）ログイン情報
REINS_LOGIN_ID=your-reins-login-id-here
REINS_PASSWORD=your-reins-password-here

# Session Secret
SESSION_SECRET=your-session-secret-here
EOF
```

### **sedコマンドで値を置換**

```bash
# Google OAuth
sed -i 's|your-google-client-id-here|123456789012-abcdefg...|g' .dev.vars
sed -i 's|your-google-client-secret-here|GOCSPX-ABcdEF...|g' .dev.vars

# Session Secret
sed -i 's|your-session-secret-here|jK8pL9mN2qR4sT6v...|g' .dev.vars

# REINFOLIB
sed -i 's|your-reinfolib-api-key-here|reinfolib_abcd1234...|g' .dev.vars

# 任意APIキー（取得済みの場合）
sed -i 's|your-openai-api-key-here|sk-proj-abcd...|g' .dev.vars
sed -i 's|your-estat-api-key-here|abcd1234efgh...|g' .dev.vars
sed -i 's|your-itandi-api-key-here|itandi_live_...|g' .dev.vars
sed -i 's|your-reins-login-id-here|12345-67890|g' .dev.vars
sed -i 's|your-reins-password-here|YourPassword123|g' .dev.vars
```

### **確認**

```bash
# ファイル内容を確認（パスワードが表示されるので注意）
cat .dev.vars

# または check-api-keys.sh で確認
bash check-api-keys.sh
```

---

## 🔧 トラブルシューティング

### **問題1: APIキーが読み込まれない**

```bash
# 問題: PM2ログに "undefined" が表示される
pm2 logs my-agent-analytics --nostream
# Output: Error: GOOGLE_CLIENT_ID is undefined

# 解決策:
# 1. ファイルが存在するか確認
ls -la /home/user/webapp/.dev.vars

# 2. ファイル内容を確認
cat /home/user/webapp/.dev.vars | grep GOOGLE_CLIENT_ID

# 3. 余計な空白やクォートがないか確認
# ❌ GOOGLE_CLIENT_ID = "123..."
# ✅ GOOGLE_CLIENT_ID=123...

# 4. PM2を完全再起動
pm2 delete all
pm2 start ecosystem.config.cjs
```

### **問題2: Google OAuth エラー**

```bash
# 問題: redirect_uri_mismatch

# 解決策:
# Google Cloud Console → 認証情報 → OAuthクライアント
# 承認済みリダイレクトURIに追加:
http://localhost:3000/auth/callback
```

### **問題3: チェックスクリプトがない**

```bash
# 問題: bash: check-api-keys.sh: command not found

# 解決策:
cd /home/user/webapp
bash check-api-keys.sh

# または絶対パス
bash /home/user/webapp/check-api-keys.sh
```

---

## 📋 チェックリスト

最終確認用のチェックリストです。

### **APIキー取得:**

- [ ] Google OAuth（Client ID + Secret）
- [ ] Session Secret（`openssl rand -base64 32`）
- [ ] REINFOLIB API（申請済み・受領済み）

### **ローカル設定:**

- [ ] `.dev.vars` ファイルを編集
- [ ] APIキーを貼り付け（余計な空白・クォートなし）
- [ ] ファイルを保存
- [ ] `bash check-api-keys.sh` で確認
- [ ] 必須APIキー: 4/4 設定完了

### **サービス起動:**

- [ ] `npm run build` でビルド
- [ ] `pm2 start ecosystem.config.cjs` で起動
- [ ] `pm2 logs --nostream` でログ確認
- [ ] `curl http://localhost:3000/api/health` でヘルスチェック

### **動作確認:**

- [ ] ブラウザで http://localhost:3000 を開く
- [ ] 「ログイン」ボタンをクリック
- [ ] Googleアカウントで認証成功
- [ ] ダッシュボードが表示される
- [ ] 右上の⚙️から「システム情報」を確認
- [ ] 利用可能機能が表示される

---

## 🎯 次のステップ

### **基本機能を試す:**

1. **物件を登録**
   - ダッシュボード → 「新規物件登録」
   - 物件情報を入力

2. **投資指標を計算**
   - 物件詳細ページ → 「分析実行」
   - NOI、利回り、DSCR等が自動計算

3. **市場分析を実行**
   - 市場分析ページ → エリア選択
   - 実取引価格データを確認

### **追加機能を有効化:**

任意APIキーを取得して、さらに機能を拡張：

- **OpenAI API**: AI市場分析・レポート生成
- **e-Stat API**: 人口統計・経済指標
- **イタンジAPI**: 賃貸相場データ
- **レインズ**: 成約事例データ

取得方法: [docs/API_KEY_SETUP_GUIDE.md](./API_KEY_SETUP_GUIDE.md)

### **本番環境にデプロイ:**

Cloudflare Pagesにデプロイして、世界中からアクセス可能に：

詳細手順: [docs/CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

---

## 📞 ヘルプ

**ドキュメント:**
- [API_KEY_SETUP_GUIDE.md](./API_KEY_SETUP_GUIDE.md) - APIキー取得の詳細
- [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - 本番デプロイ手順
- [README.md](../README.md) - プロジェクト概要

**サポート:**
- GitHub Issues: https://github.com/koki-187/My-Agent-Analitics-genspark/issues

---

**最終更新:** 2025年10月30日  
**所要時間:** 5分（APIキー取得時間を除く）
