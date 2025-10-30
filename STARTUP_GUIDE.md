# My Agent Analytics - アプリ起動手順書

**作成日**: 2025年10月30日  
**対象者**: ITリテラシーがない方でも理解できるよう、わかりやすく説明します

---

## 📖 この手順書について

この手順書では、My Agent Analyticsアプリケーションを起動する方法を、ステップバイステップで説明します。
専門用語はできるだけ避け、初めての方でも理解できるよう工夫しています。

---

## 🎯 必要なもの

アプリを起動する前に、以下が準備されている必要があります:

1. **コンピュータ**
   - Windows、Mac、またはLinux
   - インターネット接続

2. **ソフトウェア**
   - Node.js（バージョン18以上）
   - テキストエディタ（メモ帳、VSCode など）

3. **APIキー** ※管理者が設定済みの場合はスキップ可能
   - Google OAuth認証情報
   - Session Secret
   - REINFOLIB APIキー

---

## 📂 ステップ1: プロジェクトフォルダを開く

### 1-1. ターミナルを開く

**Windows**:
1. スタートメニューを開く
2. 「cmd」または「コマンドプロンプト」と入力
3. 「コマンドプロンプト」をクリック

**Mac**:
1. Launchpadを開く
2. 「ターミナル」を検索
3. 「ターミナル」をクリック

### 1-2. プロジェクトフォルダに移動

黒い画面（ターミナル）が開いたら、以下のコマンドを入力します:

```bash
cd /home/user/webapp
```

**説明**: `cd`は「Change Directory（フォルダを移動する）」という意味です。

**確認方法**:
```bash
pwd
```
と入力すると、現在いるフォルダの場所が表示されます。
`/home/user/webapp` と表示されていればOKです。

---

## ⚙️ ステップ2: 環境変数の設定（初回のみ）

### 2-1. .dev.vars ファイルを確認

このファイルには、アプリが動作するために必要な「秘密の情報」が書かれています。

**確認コマンド**:
```bash
ls -la .dev.vars
```

**結果の見方**:
- ファイルが表示される → すでに設定済み（ステップ3へ）
- 「No such file」と表示される → これから作成が必要

### 2-2. ファイルを作成・編集する（必要な場合）

**方法1: テキストエディタで編集**
```bash
nano .dev.vars
```

**方法2: コマンドで作成**
```bash
cat > .dev.vars << 'EOF'
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
SESSION_SECRET=your-session-secret-here
REINFOLIB_API_KEY=your-reinfolib-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
ESTAT_API_KEY=your-estat-api-key-here
ITANDI_API_KEY=your-itandi-api-key-here
REINS_LOGIN_ID=your-reins-login-id-here
REINS_PASSWORD=your-reins-password-here
EOF
```

**保存方法（nanoを使った場合）**:
1. `Ctrl + O` を押す（保存）
2. `Enter` を押す（確認）
3. `Ctrl + X` を押す（終了）

### 2-3. 設定を確認

```bash
bash check-api-keys.sh
```

**期待される結果**:
```
必須APIキー: 4/4 設定完了 ✅
```

---

## 🔨 ステップ3: アプリをビルドする

### 3-1. ビルドとは？

「ビルド」とは、人間が書いたプログラムを、コンピュータが実行できる形に変換することです。
料理で例えると「材料を調理する」ようなものです。

### 3-2. ビルドコマンドを実行

```bash
npm run build
```

**実行時間**: 約30秒〜1分

**成功のサイン**:
- 緑色の文字で `✓ built in 〜ms` と表示される
- `dist/` フォルダが作成される

**エラーが出た場合**:
```bash
# 依存関係を再インストール
npm install

# もう一度ビルド
npm run build
```

---

## 🚀 ステップ4: アプリを起動する

### 4-1. PM2とは？

PM2は「プロセスマネージャー」というツールです。
アプリを**バックグラウンドで動かし続ける**ことができます。

**例え話**:
- 普通の起動方法 → 電気のスイッチを手で押し続ける（離すと消える）
- PM2での起動 → 電気のスイッチをONにする（自動で点灯し続ける）

### 4-2. 起動前の準備（ポート3000をクリーンアップ）

```bash
fuser -k 3000/tcp 2>/dev/null || true
```

**説明**: 既に3000番ポートを使っているプログラムがあれば終了させます。

### 4-3. PM2で起動

```bash
pm2 start ecosystem.config.cjs
```

**成功のサイン**:
```
┌────┬──────────────────┬─────────┬─────────┬──────────┬────────┐
│ id │ name             │ status  │ cpu     │ mem      │ uptime │
├────┼──────────────────┼─────────┼─────────┼──────────┼────────┤
│ 0  │ my-agent-analytics│ online │ 0%      │ 50.0mb   │ 0s     │
└────┴──────────────────┴─────────┴─────────┴──────────┴────────┘
```

**statusが「online」になっていればOK！**

---

## ✅ ステップ5: 動作確認

### 5-1. ブラウザで確認

以下のURLをブラウザで開きます:

```
http://localhost:3000
```

**表示されるべきもの**:
- My Agent Analyticsのロゴ
- 「ログイン」ボタン
- 機能紹介カード

### 5-2. APIが動いているか確認

ターミナルで以下のコマンドを実行:

```bash
curl http://localhost:3000/api/health
```

**期待される結果**:
```json
{"status":"ok","timestamp":"2025-10-30T12:00:00.000Z","version":"2.0.0"}
```

### 5-3. ログを確認（問題がある場合）

```bash
pm2 logs my-agent-analytics --nostream
```

**正常なログの例**:
```
[wrangler:inf] Ready on http://0.0.0.0:3000
Your worker has access to the following bindings:
- D1 Databases: DB
- Vars: GOOGLE_CLIENT_ID: "(hidden)"
```

---

## 🛑 ステップ6: アプリを停止する

### 6-1. 停止コマンド

```bash
pm2 stop my-agent-analytics
```

### 6-2. 完全削除（再起動前）

```bash
pm2 delete my-agent-analytics
```

---

## 🔄 ステップ7: 再起動する

コードを変更した後や、設定を変更した後は、アプリを再起動する必要があります。

### 7-1. 簡単な再起動（コード変更なし）

```bash
pm2 restart my-agent-analytics
```

### 7-2. 完全な再起動（コード変更あり）

```bash
# 1. ポートをクリーンアップ
fuser -k 3000/tcp 2>/dev/null || true

# 2. PM2から削除
pm2 delete my-agent-analytics

# 3. 再ビルド
npm run build

# 4. 再起動
pm2 start ecosystem.config.cjs
```

---

## 📊 ステップ8: PM2の便利なコマンド

### サービス一覧を確認
```bash
pm2 list
```

### ログをリアルタイム表示（Ctrl+Cで終了）
```bash
pm2 logs my-agent-analytics
```

### ログを一度だけ表示（止まらない）
```bash
pm2 logs my-agent-analytics --nostream
```

### メモリ使用量・CPU使用率を確認
```bash
pm2 monit
```

### サービスの詳細情報
```bash
pm2 show my-agent-analytics
```

### すべてのサービスを停止
```bash
pm2 stop all
```

### すべてのサービスを削除
```bash
pm2 delete all
```

---

## ❓ よくある問題と解決方法

### 問題1: 「npm: command not found」

**原因**: Node.jsがインストールされていない

**解決方法**:
1. https://nodejs.org/ にアクセス
2. LTS版（推奨版）をダウンロード
3. インストール後、ターミナルを再起動
4. `node --version` で確認

---

### 問題2: 「port 3000 is already in use」

**原因**: 既に3000番ポートが使用されている

**解決方法**:
```bash
# 方法1: ポートを強制的にクリーンアップ
fuser -k 3000/tcp

# 方法2: PM2で動いているサービスを確認
pm2 list

# 方法3: すべて停止
pm2 delete all
```

---

### 問題3: ブラウザで「Cannot connect」

**原因**: アプリが起動していない

**解決方法**:
```bash
# 1. サービスの状態を確認
pm2 list

# 2. statusが「stopped」または「errored」の場合
pm2 restart my-agent-analytics

# 3. それでもダメなら完全再起動
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete all
npm run build
pm2 start ecosystem.config.cjs
```

---

### 問題4: ログインできない（Google OAuth エラー）

**原因**: APIキーが設定されていない、または間違っている

**解決方法**:
```bash
# 1. APIキーの設定状況を確認
bash check-api-keys.sh

# 2. .dev.vars ファイルを確認
cat .dev.vars

# 3. 管理者ログインを試す
# ブラウザで http://localhost:3000/auth/login
# メール: admin@myagent.local
# パスワード: Admin@2025
```

---

### 問題5: 「Migration error」（データベースエラー）

**原因**: データベースが初期化されていない

**解決方法**:
```bash
# データベースをリセット
npm run db:reset

# サービスを再起動
pm2 restart my-agent-analytics
```

---

## 🔐 管理者ログイン情報

Google OAuthが設定されていない場合でも、管理者としてログインできます:

**ログイン画面**: http://localhost:3000/auth/login

**管理者アカウント**:
- メールアドレス: `admin@myagent.local`
- パスワード: `Admin@2025`

---

## 📞 サポート

この手順書で解決できない問題がある場合:

1. **ログを保存**:
   ```bash
   pm2 logs my-agent-analytics --nostream > error.log
   ```

2. **システム情報を保存**:
   ```bash
   node --version > system-info.txt
   npm --version >> system-info.txt
   pm2 list >> system-info.txt
   ```

3. **GitHubでIssueを作成**:
   - https://github.com/koki-187/My-Agent-Analitics-genspark/issues
   - `error.log`と`system-info.txt`を添付

---

## 📝 チェックリスト

起動前の最終確認:

- [ ] Node.jsがインストールされている（`node --version`）
- [ ] プロジェクトフォルダにいる（`pwd`で確認）
- [ ] `.dev.vars`ファイルが存在する（`ls -la .dev.vars`）
- [ ] APIキーが設定されている（`bash check-api-keys.sh`）
- [ ] ビルドが成功した（`npm run build`）
- [ ] PM2でサービスが起動している（`pm2 list`）
- [ ] ブラウザでアクセスできる（http://localhost:3000）
- [ ] ログインできる（Google OAuthまたは管理者アカウント）

---

## 🎉 起動完了！

すべてのステップが完了したら、以下の機能が使えるようになります:

1. **ダッシュボード**: 物件一覧と統計情報
2. **物件登録**: 新しい投資物件を登録
3. **投資分析**: NOI、利回り、DSCRなど7つの指標を自動計算
4. **市場分析**: 国土交通省のデータを使った市場動向分析
5. **価格推定**: 周辺取引事例から物件価格を推定

---

**最終更新**: 2025年10月30日  
**バージョン**: 2.0.0  
**作成者**: My Agent Team
