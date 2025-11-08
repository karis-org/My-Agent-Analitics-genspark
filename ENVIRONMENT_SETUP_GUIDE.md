# 🔑 本番環境 環境変数設定ガイド

**プロジェクト名**: my-agent-analytics  
**作成日**: 2025-11-08

---

## 📝 必要な環境変数一覧

以下の環境変数を本番環境に設定する必要があります。

### 🔴 **必須項目**（機能動作に必要）

#### 1. OpenAI API（OCR機能用）
```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name my-agent-analytics
# 入力プロンプト: [あなたのOpenAI APIキーを入力]
```
**取得方法**: https://platform.openai.com/api-keys

#### 2. セッション管理
```bash
npx wrangler pages secret put SESSION_SECRET --project-name my-agent-analytics
# 入力プロンプト: [ランダムな64文字以上の文字列]
# 生成例: openssl rand -base64 64
```

### 🟡 **推奨項目**（一部機能に必要）

#### 3. Google Maps API（地図生成用）
```bash
npx wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name my-agent-analytics
# 入力プロンプト: [あなたのGoogle Maps APIキー]
```
**取得方法**: https://console.cloud.google.com/apis/credentials

#### 4. Google Custom Search API（事故物件調査用）
```bash
npx wrangler pages secret put GOOGLE_CUSTOM_SEARCH_API_KEY --project-name my-agent-analytics
# 入力プロンプト: [あなたのGoogle Custom Search APIキー]

npx wrangler pages secret put GOOGLE_CUSTOM_SEARCH_ENGINE_ID --project-name my-agent-analytics
# 入力プロンプト: [あなたのSearch Engine ID]
```
**取得方法**: https://programmablesearchengine.google.com/

### 🟢 **オプション項目**（特定機能に必要）

#### 5. イタンジBB API（賃貸相場分析用）
```bash
npx wrangler pages secret put ITANDI_EMAIL --project-name my-agent-analytics
# 入力プロンプト: [イタンジBBのメールアドレス]

npx wrangler pages secret put ITANDI_PASSWORD --project-name my-agent-analytics
# 入力プロンプト: [イタンジBBのパスワード]
```
**取得方法**: https://bb.itandi.co.jp/

#### 6. REINS API（不動産データベース）
```bash
npx wrangler pages secret put REINS_LOGIN_ID --project-name my-agent-analytics
# 入力プロンプト: [REINSのログインID]

npx wrangler pages secret put REINS_PASSWORD --project-name my-agent-analytics
# 入力プロンプト: [REINSのパスワード]
```

---

## 🚀 設定手順

### ステップ1: ローカル環境で確認
```bash
# ローカルの .dev.vars ファイルを確認
cd /home/user/webapp
cat .dev.vars
```

### ステップ2: 本番環境に設定
各APIキーを順番に設定してください。

```bash
# 例: OpenAI APIキーを設定
cd /home/user/webapp
npx wrangler pages secret put OPENAI_API_KEY --project-name my-agent-analytics

# プロンプトが表示されます:
# Enter a secret value: [ここにAPIキーを入力してEnter]
# 🌀 Creating the secret for the Pages project "my-agent-analytics"
# ✨ Success! Uploaded secret OPENAI_API_KEY
```

### ステップ3: 設定済み環境変数の確認
```bash
npx wrangler pages secret list --project-name my-agent-analytics
```

### ステップ4: 再デプロイ（必要に応じて）
環境変数は即座に反映されますが、念のため再デプロイ:
```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name my-agent-analytics
```

---

## 🔒 セキュリティ注意事項

### ✅ 実施すること
- [ ] 本番用の強力なSESSION_SECRETを生成
- [ ] 各APIキーの使用制限を設定
- [ ] APIキーの定期的なローテーション
- [ ] .dev.varsファイルをGitに含めない（.gitignoreで除外済み）

### ❌ 実施しないこと
- ❌ APIキーをコードに直接記述
- ❌ APIキーをGitHubにコミット
- ❌ 本番とローカルで同じAPIキーを使用
- ❌ 不要なAPIキーを設定

---

## 📊 環境変数の優先度

| 優先度 | 環境変数 | 影響する機能 |
|--------|---------|-------------|
| 🔴 必須 | OPENAI_API_KEY | OCR機能、AI分析 |
| 🔴 必須 | SESSION_SECRET | ログイン、認証 |
| 🟡 推奨 | GOOGLE_MAPS_API_KEY | 地図生成 |
| 🟡 推奨 | GOOGLE_CUSTOM_SEARCH_* | 事故物件調査 |
| 🟢 オプション | ITANDI_* | 賃貸相場分析 |
| 🟢 オプション | REINS_* | 不動産データ取得 |

---

## 🧪 設定後のテスト

### 1. ヘルスチェック
```bash
curl https://b31d4128.my-agent-analytics.pages.dev/api/health
# 期待される応答: {"status":"ok","timestamp":"...","version":"2.0.0"}
```

### 2. OCR機能テスト
1. https://b31d4128.my-agent-analytics.pages.dev/auth/login にアクセス
2. ログイン
3. 新規物件登録でマイソクをアップロード
4. 自動入力されることを確認

### 3. エラーログ確認
```bash
# リアルタイムでログを監視
npx wrangler pages deployment tail --project-name my-agent-analytics
```

---

## 💡 トラブルシューティング

### Q: 環境変数が反映されない
**A**: 以下を確認してください:
```bash
# 1. 環境変数が正しく設定されているか確認
npx wrangler pages secret list --project-name my-agent-analytics

# 2. 再デプロイ
npm run build && npx wrangler pages deploy dist --project-name my-agent-analytics

# 3. キャッシュクリア後、ブラウザを再起動
```

### Q: APIキーエラーが出る
**A**: 
- APIキーの有効期限を確認
- APIキーの使用制限を確認
- 課金状況を確認（特にOpenAI）

### Q: SESSION_SECRETはどう生成する？
**A**: 
```bash
# 方法1: OpenSSLを使用
openssl rand -base64 64

# 方法2: Node.jsを使用
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# 方法3: オンラインツール
# https://www.random.org/strings/ で64文字生成
```

---

## 📞 サポート

問題が発生した場合:
1. **ログ確認**: `npx wrangler pages deployment tail`
2. **GitHub Issues**: https://github.com/karis-org/My-Agent-Analitics-genspark/issues
3. **緊急連絡先**: navigator-187@docomo.ne.jp

---

**最終更新**: 2025-11-08  
**ドキュメントバージョン**: 1.0
