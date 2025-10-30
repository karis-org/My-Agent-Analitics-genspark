# My Agent Analytics - セットアップ完了チェックリスト

このチェックリストを使って、セットアップが正しく完了しているか確認してください。

## 📋 現在の状態

**最終更新:** 2025年10月30日  
**プロジェクト:** My Agent Analytics  
**バージョン:** 2.1.0

---

## ✅ フェーズ1: 事前準備

### 1.1 アカウント・認証情報

- [ ] **Google OAuth認証情報の取得**
  - [ ] Google Cloud Consoleにアクセス
  - [ ] プロジェクト作成: `my-agent-analytics`
  - [ ] OAuth同意画面を設定
  - [ ] 認証情報を作成（WebアプリケーションのOAuthクライアントID）
  - [ ] リダイレクトURI設定: `http://localhost:3000/auth/callback`
  - [ ] Client IDとClient Secretを取得・保存
  - 📖 詳細: [docs/API_KEY_SETUP_GUIDE.md - Section 1.1](./docs/API_KEY_SETUP_GUIDE.md#11-google-oauth認証必須)

- [ ] **Session Secretの生成**
  ```bash
  openssl rand -base64 32
  ```
  - [ ] コマンド実行
  - [ ] 生成された文字列を保存

- [ ] **REINFOLIB APIキーの申請**
  - [ ] https://www.reinfolib.mlit.go.jp/ から申請
  - [ ] メールでAPIキーを受領（1-3営業日）
  - 📖 詳細: [docs/API_KEY_SETUP_GUIDE.md - Section 1.3](./docs/API_KEY_SETUP_GUIDE.md#13-不動産情報ライブラリapi必須)

### 1.2 任意APIキーの取得（オプション）

- [ ] **OpenAI APIキー** (AI分析機能)
  - 📖 詳細: [docs/API_KEY_SETUP_GUIDE.md - Section 2.1](./docs/API_KEY_SETUP_GUIDE.md#21-openai-api任意)

- [ ] **e-Stat APIキー** (政府統計データ)
  - 📖 詳細: [docs/API_KEY_SETUP_GUIDE.md - Section 2.2](./docs/API_KEY_SETUP_GUIDE.md#22-e-stat-api任意)

- [ ] **イタンジAPIキー** (賃貸物件情報)
  - 📖 詳細: [docs/API_KEY_SETUP_GUIDE.md - Section 2.3](./docs/API_KEY_SETUP_GUIDE.md#23-イタンジapi任意)

- [ ] **レインズログイン情報** (不動産流通情報)
  - 📖 詳細: [docs/API_KEY_SETUP_GUIDE.md - Section 2.4](./docs/API_KEY_SETUP_GUIDE.md#24-レインズ任意)

---

## ✅ フェーズ2: プロジェクトセットアップ

### 2.1 プロジェクトの取得

- [x] **プロジェクトのクローン**
  ```bash
  git clone https://github.com/koki-187/My-Agent-Analitics-genspark.git
  cd My-Agent-Analitics-genspark
  ```
  - **確認方法:**
    ```bash
    pwd
    # 出力: /home/user/webapp または類似パス
    ```

- [x] **依存関係のインストール**
  ```bash
  npm install
  ```
  - **確認方法:**
    ```bash
    ls node_modules | wc -l
    # 出力: 200以上（依存関係がインストールされている）
    ```

### 2.2 環境変数の設定

- [ ] **.dev.varsファイルの作成と設定**
  
  **方法1: テキストエディタで編集**
  ```bash
  cd /home/user/webapp
  nano .dev.vars  # または vim, code など
  ```
  
  **方法2: テンプレートから作成**
  ```bash
  cp .dev.vars.example .dev.vars  # もし example がある場合
  ```
  
  **ファイル内容:**
  ```bash
  # 必須APIキー
  GOOGLE_CLIENT_ID=あなたのGoogle Client ID
  GOOGLE_CLIENT_SECRET=あなたのGoogle Client Secret
  SESSION_SECRET=あなたのSession Secret
  REINFOLIB_API_KEY=あなたのREINFOLIB APIキー
  
  # 任意APIキー（取得済みの場合のみ）
  OPENAI_API_KEY=あなたのOpenAI APIキー
  ESTAT_API_KEY=あなたのe-Stat APIキー
  ITANDI_API_KEY=あなたのイタンジAPIキー
  REINS_LOGIN_ID=あなたのレインズログインID
  REINS_PASSWORD=あなたのレインズパスワード
  ```
  
  - **確認方法:**
    ```bash
    bash check-api-keys.sh
    ```
    
    **期待される出力:**
    ```
    【必須】
    ✅ GOOGLE_CLIENT_ID: 設定済み
    ✅ GOOGLE_CLIENT_SECRET: 設定済み
    ✅ REINFOLIB_API_KEY: 設定済み
    ✅ SESSION_SECRET: 設定済み
    
    必須APIキー: 4/4 設定完了 ✅
    ```

### 2.3 ビルドとデータベース

- [x] **プロジェクトのビルド**
  ```bash
  npm run build
  ```
  - **確認方法:**
    ```bash
    ls dist/_worker.js
    # ファイルが存在すればOK
    ```

- [x] **PM2のインストール**（既にインストール済み）
  ```bash
  # PM2は sandbox 環境にプリインストールされています
  pm2 --version
  ```
  - **確認方法:**
    ```bash
    pm2 --version
    # 出力: 5.x.x 以上
    ```

- [x] **データベースマイグレーションの実行**
  ```bash
  npx wrangler d1 migrations apply webapp-production --local
  ```
  - **確認方法:**
    ```bash
    npx wrangler d1 execute webapp-production --local \
      --command="SELECT name FROM sqlite_master WHERE type='table';"
    ```
    
    **期待される出力:**
    ```json
    {
      "results": [
        { "name": "users" },
        { "name": "properties" },
        { "name": "property_income" },
        { "name": "property_expenses" },
        { "name": "property_investment" },
        { "name": "analysis_results" },
        { "name": "sessions" }
      ]
    }
    ```

---

## ✅ フェーズ3: サービス起動

### 3.1 サービスの起動

- [x] **サービスの起動**
  ```bash
  pm2 start ecosystem.config.cjs
  ```
  - **確認方法:**
    ```bash
    pm2 list
    ```
    
    **期待される出力:**
    ```
    ┌────┬────────────────────┬─────────┬────────┐
    │ id │ name               │ status  │ cpu    │
    ├────┼────────────────────┼─────────┼────────┤
    │ 0  │ my-agent-analytics │ online  │ 0%     │
    └────┴────────────────────┴─────────┴────────┘
    ```

### 3.2 ヘルスチェック

- [x] **ヘルスチェックの確認**
  ```bash
  curl http://localhost:3000/api/health
  ```
  - **期待される出力:**
    ```json
    {
      "status": "ok",
      "timestamp": "2025-10-30T12:00:00.000Z",
      "version": "2.0.0"
    }
    ```

- [ ] **PM2ログの確認**
  ```bash
  pm2 logs my-agent-analytics --nostream --lines 20
  ```
  - **期待される出力:**
    ```
    Your worker has access to the following bindings:
    - Vars:
      - GOOGLE_CLIENT_ID: "(hidden)"
      - GOOGLE_CLIENT_SECRET: "(hidden)"
      - REINFOLIB_API_KEY: "(hidden)"
      - SESSION_SECRET: "(hidden)"
    [wrangler:inf] Ready on http://0.0.0.0:3000
    ```
  
  - **エラーがある場合:**
    ```bash
    # PM2を再起動
    pm2 restart my-agent-analytics
    
    # またはクリーン再起動
    pm2 delete all
    pm2 start ecosystem.config.cjs
    ```

---

## ✅ フェーズ4: UI動作確認

### 4.1 UIの表示確認

- [ ] **ランディングページの表示**
  - ブラウザで `http://localhost:3000` を開く
  - [ ] ヘッダーロゴが表示される
  - [ ] 「ログイン」ボタンが表示される
  - [ ] 機能説明カードが表示される（6個）
  - [ ] フッターが表示される

### 4.2 Google OAuth認証の動作確認

- [ ] **ログインフローのテスト**
  1. 「ログイン」ボタンをクリック
  2. Googleログイン画面にリダイレクトされる
  3. Googleアカウントを選択
  4. 権限承認画面が表示される（初回のみ）
  5. 「許可」をクリック
  6. アプリケーションにリダイレクトされる

- [ ] **ダッシュボードへのログイン成功**
  - [ ] URLが `/dashboard` に変わる
  - [ ] 右上にユーザーのプロフィール画像と名前が表示される
  - [ ] ウェルカムメッセージが表示される
  - [ ] 統計カード（物件数、分析数など）が表示される
  - [ ] クイックアクションカードが表示される

### 4.3 システム情報ページの確認

- [ ] **設定ページへのアクセス**
  - 右上の⚙️アイコンをクリック
  - [ ] システム情報ページが表示される
  - [ ] 機能稼働率が表示される
  - [ ] 利用可能機能の一覧が表示される
    - ✅ ユーザー認証: 利用可能
    - ✅ 市場分析: 利用可能（REINFOLIB設定済みの場合）
    - ⚠️ AI分析: 準備中（OpenAI未設定の場合）
    - など

---

## 🔧 トラブルシューティング

### 問題: APIキーが読み込まれない

**症状:**
```bash
pm2 logs my-agent-analytics --nostream
# Output: Error: GOOGLE_CLIENT_ID is undefined
```

**解決策:**
```bash
# 1. .dev.vars ファイルが存在するか確認
ls -la /home/user/webapp/.dev.vars

# 2. ファイル内容を確認
cat /home/user/webapp/.dev.vars | grep GOOGLE_CLIENT_ID

# 3. 余計な空白やクォートを削除
# ❌ GOOGLE_CLIENT_ID = "123..."
# ✅ GOOGLE_CLIENT_ID=123...

# 4. PM2を完全再起動
pm2 delete all
pm2 start ecosystem.config.cjs

# 5. check-api-keys.sh で再確認
bash check-api-keys.sh
```

### 問題: Google OAuth エラー (redirect_uri_mismatch)

**症状:**
```
Error: redirect_uri_mismatch
```

**解決策:**
1. Google Cloud Console → 認証情報 → 作成したOAuthクライアント
2. 承認済みリダイレクトURIを確認
3. 以下が含まれているか確認:
   ```
   http://localhost:3000/auth/callback
   ```
4. 完全一致していることを確認（末尾の`/`にも注意）
5. 保存後、数分待ってから再試行

### 問題: データベースエラー

**症状:**
```
Error: D1_ERROR: no such table: users
```

**解決策:**
```bash
# マイグレーションを再実行
npx wrangler d1 migrations apply webapp-production --local

# テーブルが作成されたか確認
npx wrangler d1 execute webapp-production --local \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 問題: ポート3000が使用中

**症状:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解決策:**
```bash
# ポートを使用しているプロセスを確認
lsof -i :3000

# または
fuser -k 3000/tcp

# PM2を再起動
pm2 restart my-agent-analytics
```

---

## 📊 完了状態の確認

### すべてのチェック項目が完了している場合

✅ **おめでとうございます！セットアップが完了しました。**

**次のステップ:**

1. **物件を登録してみる**
   - ダッシュボード → 「新規物件登録」
   - サンプルデータで試す

2. **市場分析を実行**
   - 市場分析ページ → エリアを選択
   - 実取引価格データを確認

3. **投資指標を計算**
   - 物件詳細 → 「分析実行」
   - NOI、利回り等を確認

4. **本番環境にデプロイ**
   - 📖 [docs/CLOUDFLARE_DEPLOYMENT.md](./docs/CLOUDFLARE_DEPLOYMENT.md)

---

## 📞 サポート

**ドキュメント:**
- [docs/QUICK_START.md](./docs/QUICK_START.md) - 5分でセットアップ
- [docs/API_KEY_SETUP_GUIDE.md](./docs/API_KEY_SETUP_GUIDE.md) - APIキー詳細ガイド
- [docs/CLOUDFLARE_DEPLOYMENT.md](./docs/CLOUDFLARE_DEPLOYMENT.md) - 本番デプロイ手順

**問題が解決しない場合:**
- GitHub Issues: https://github.com/koki-187/My-Agent-Analitics-genspark/issues

---

## 📝 チェックリスト要約

### 現在の状態

```
✅ フェーズ1: 事前準備
   ⬜ Google OAuth認証情報 → 【要設定】
   ⬜ Session Secret → 【要生成】
   ⬜ REINFOLIB APIキー → 【要申請・取得】

✅ フェーズ2: プロジェクトセットアップ
   ✅ プロジェクトクローン
   ✅ 依存関係インストール
   ⬜ .dev.vars設定 → 【要設定】
   ✅ プロジェクトビルド
   ✅ PM2インストール
   ✅ データベースマイグレーション

✅ フェーズ3: サービス起動
   ✅ サービス起動
   ✅ ヘルスチェック確認
   ⬜ PM2ログ確認 → 【APIキー設定後に確認】

⬜ フェーズ4: UI動作確認
   ⬜ UIの表示確認 → 【要確認】
   ⬜ Google OAuth認証 → 【APIキー設定後に確認】
   ⬜ ダッシュボードログイン → 【APIキー設定後に確認】
```

### 次にやること

1. **Google OAuth認証情報を取得**
   - 📖 [docs/API_KEY_SETUP_GUIDE.md - Section 1.1](./docs/API_KEY_SETUP_GUIDE.md#11-google-oauth認証必須)

2. **Session Secretを生成**
   ```bash
   openssl rand -base64 32
   ```

3. **REINFOLIB APIキーを申請**
   - https://www.reinfolib.mlit.go.jp/

4. **.dev.varsファイルに設定**
   ```bash
   nano /home/user/webapp/.dev.vars
   ```

5. **設定を確認**
   ```bash
   bash check-api-keys.sh
   ```

6. **PM2を再起動**
   ```bash
   pm2 restart my-agent-analytics
   ```

7. **ブラウザで動作確認**
   - http://localhost:3000

---

**最終更新:** 2025年10月30日  
**現在のステータス:** プロジェクト基盤は完成、APIキー設定待ち  
**完成度:** 70% (APIキー設定後に100%)
