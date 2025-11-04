# 運用マニュアル - エラー対処法 v6.7.4

**最終更新**: 2025年11月04日  
**バージョン**: 6.7.4  
**対象者**: システム管理者、サポート担当者、開発者

---

## 📖 目次

1. [エラー対処の基本方針](#エラー対処の基本方針)
2. [エラーコード一覧](#エラーコード一覧)
3. [認証・ログインエラー](#認証ログインエラー)
4. [API連携エラー](#api連携エラー)
5. [データベースエラー](#データベースエラー)
6. [ファイルアップロードエラー](#ファイルアップロードエラー)
7. [パフォーマンス問題](#パフォーマンス問題)
8. [デプロイエラー](#デプロイエラー)
9. [監視・ログ確認](#監視ログ確認)
10. [緊急対応手順](#緊急対応手順)

---

## エラー対処の基本方針

### 対応の優先順位

1. **🔴 Critical（緊急）**: サービス停止、データ損失
2. **🟠 High（高）**: 主要機能停止、セキュリティ問題
3. **🟡 Medium（中）**: 一部機能停止、パフォーマンス劣化
4. **🟢 Low（低）**: UI問題、マイナー機能の不具合

### 対応フロー

```
エラー発生
    │
    ▼
1. エラー内容の把握
    │
    ▼
2. 影響範囲の確認
    │
    ▼
3. 優先度判定
    │
    ▼
4. 対処方法の決定
    │
    ▼
5. 対処実施
    │
    ▼
6. 動作確認
    │
    ▼
7. ドキュメント更新
```

---

## エラーコード一覧

### 認証関連エラー

| エラーコード | HTTPコード | 説明 | 優先度 |
|-------------|-----------|------|--------|
| **UNAUTHORIZED** | 401 | 認証が必要 | Medium |
| **INVALID_CREDENTIALS** | 401 | 認証情報が不正 | Medium |
| **SESSION_EXPIRED** | 401 | セッション期限切れ | Low |
| **GOOGLE_OAUTH_ERROR** | 500 | Google OAuth失敗 | High |
| **PASSWORD_MISMATCH** | 401 | パスワード不一致 | Medium |

### API統合関連エラー

| エラーコード | HTTPコード | 説明 | 優先度 |
|-------------|-----------|------|--------|
| **API_KEY_NOT_CONFIGURED** | 500 | APIキー未設定 | High |
| **INVALID_API_KEY** | 401 | APIキーが無効 | High |
| **RATE_LIMIT_EXCEEDED** | 429 | レート制限超過 | Medium |
| **API_SERVER_ERROR** | 500 | 外部APIサーバーエラー | High |
| **API_TIMEOUT** | 504 | API応答タイムアウト | Medium |

### データ処理関連エラー

| エラーコード | HTTPコード | 説明 | 優先度 |
|-------------|-----------|------|--------|
| **INVALID_IMAGE_FORMAT** | 400 | 画像形式エラー | Low |
| **PDF_NOT_SUPPORTED** | 400 | PDF非対応 | Low |
| **INVALID_JSON** | 400 | JSON解析エラー | Medium |
| **MISSING_REQUIRED_FIELD** | 400 | 必須項目不足 | Medium |
| **INVALID_PARAMETER_TYPE** | 400 | パラメータ型不正 | Medium |

### データベース関連エラー

| エラーコード | HTTPコード | 説明 | 優先度 |
|-------------|-----------|------|--------|
| **DATABASE_ERROR** | 500 | DB接続/クエリエラー | Critical |
| **PROPERTY_NOT_FOUND** | 404 | 物件が見つからない | Low |
| **DUPLICATE_ENTRY** | 409 | 重複エントリー | Medium |
| **FOREIGN_KEY_CONSTRAINT** | 400 | 外部キー制約違反 | Medium |

### その他のエラー

| エラーコード | HTTPコード | 説明 | 優先度 |
|-------------|-----------|------|--------|
| **INTERNAL_SERVER_ERROR** | 500 | 内部サーバーエラー | High |
| **NOT_FOUND** | 404 | リソース未検出 | Low |
| **METHOD_NOT_ALLOWED** | 405 | HTTPメソッド不正 | Low |
| **TOO_MANY_REQUESTS** | 429 | リクエスト過多 | Medium |

---

## 認証・ログインエラー

### エラー1: Google OAuth認証失敗

**症状**:
- 「Googleでログイン」ボタンをクリックしてもログインできない
- エラーメッセージ: `GOOGLE_OAUTH_ERROR`

**原因**:
1. Google OAuth APIキーが未設定
2. APIキーが無効または期限切れ
3. リダイレクトURIの設定ミス
4. Google Cloud Consoleでの権限不足

**対処法**:

#### ステップ1: APIキー確認
```bash
# 本番環境のシークレット確認
npx wrangler pages secret list --project-name my-agent-analytics

# GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET が存在するか確認
```

#### ステップ2: Google Cloud Console設定確認
1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを選択
3. 「APIとサービス」→「認証情報」
4. OAuth 2.0 クライアントIDの設定を確認:
   - **承認済みのリダイレクトURI**:
     - `https://3ccc9c44.my-agent-analytics.pages.dev/auth/google/callback`
     - `http://localhost:3000/auth/google/callback` (開発用)

#### ステップ3: APIキー再設定
```bash
# 新しいAPIキーを設定
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name my-agent-analytics
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name my-agent-analytics
```

#### ステップ4: デプロイと確認
```bash
# 再デプロイ
npm run build
npx wrangler pages deploy dist --project-name my-agent-analytics

# ブラウザでログインテスト
```

**参考ドキュメント**: `docs/GOOGLE_OAUTH_SETUP.md`

---

### エラー2: セッション期限切れ

**症状**:
- ダッシュボードにアクセスするとログインページへリダイレクト
- エラーメッセージ: `SESSION_EXPIRED`

**原因**:
- セッションの有効期限（7日間）が切れた
- Cookieが削除された

**対処法**:

**ユーザー向け**:
1. ログインページからログインし直す
2. 「ログイン状態を保持」を有効にする（将来実装）

**管理者向け**:
```sql
-- セッション期限延長（必要に応じて）
-- セッションテーブルのexpires_atを更新
UPDATE sessions
SET expires_at = datetime('now', '+30 days')
WHERE user_id = 'user-id';
```

---

### エラー3: パスワード認証失敗

**症状**:
- 管理者ログインでエラー
- エラーメッセージ: `PASSWORD_MISMATCH`

**原因**:
1. パスワードが間違っている
2. メールアドレスが間違っている
3. 大文字・小文字の区別ミス

**対処法**:

**正しい認証情報**:
```
メールアドレス: admin@myagent.local
パスワード: Admin@2025
```

**パスワードリセット**（緊急時）:
```bash
# ローカル環境で新しいパスワードハッシュを生成
node -e "const crypto = require('crypto'); console.log(crypto.createHash('sha256').update('NewPassword@2025').digest('hex'));"

# D1データベースで更新
npx wrangler d1 execute my-agent-analytics-production --command="UPDATE users SET password_hash='new-hash' WHERE email='admin@myagent.local'"
```

---

## API連携エラー

### エラー4: OpenAI API キーエラー

**症状**:
- OCR機能が動作しない
- AI分析が実行できない
- 事故物件調査がデモモードになる
- エラーメッセージ: `API_KEY_NOT_CONFIGURED` または `INVALID_API_KEY`

**原因**:
1. OpenAI APIキーが未設定
2. APIキーが無効
3. クォータ/残高不足

**対処法**:

#### ステップ1: APIキー確認
```bash
# 設定されているか確認
npx wrangler pages secret list --project-name my-agent-analytics | grep OPENAI
```

#### ステップ2: OpenAI ダッシュボード確認
1. https://platform.openai.com/ にアクセス
2. 「API keys」で有効なキーを確認
3. 「Usage」でクォータを確認

#### ステップ3: 新しいAPIキー作成と設定
```bash
# OpenAI ダッシュボードで新しいキーを作成

# Cloudflare Pagesに設定
npx wrangler pages secret put OPENAI_API_KEY --project-name my-agent-analytics
# 貼り付け: sk-proj-xxxxxxxxxxxxx
```

#### ステップ4: 動作確認
```bash
# テスト用cURLリクエスト
curl -X POST https://3ccc9c44.my-agent-analytics.pages.dev/api/properties/ocr \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your-session-id" \
  -d '{"image":"data:image/png;base64,iVBORw0..."}'
```

**デモモードの動作**:
- APIキーが未設定の場合、自動的にデモモードになります
- サンプルデータが返されます
- 黄色のバナーで「デモモード」と表示されます

---

### エラー5: レート制限超過

**症状**:
- APIリクエストが失敗する
- エラーメッセージ: `RATE_LIMIT_EXCEEDED`
- HTTPステータスコード: 429

**原因**:
- 1分間のリクエスト数が制限を超えた
  - 一般API: 100 req/min
  - AI分析: 20 req/min
  - 認証: 10 req/min

**対処法**:

**短期対応**:
1. 1分間待機してから再試行
2. リクエスト頻度を下げる

**中長期対応**:
```typescript
// src/middleware/rate-limiter.ts で制限を調整

// レート制限を緩和（必要に応じて）
const limits = {
  api: 200,      // 100 → 200 に増加
  ai: 40,        // 20 → 40 に増加
  auth: 20       // 10 → 20 に増加
};
```

**監視**:
```bash
# レート制限ヘッダーを確認
curl -I https://3ccc9c44.my-agent-analytics.pages.dev/api/health

# X-RateLimit-Remaining: 残りリクエスト数
# X-RateLimit-Reset: リセット時刻
```

---

### エラー6: 不動産情報ライブラリAPI エラー

**症状**:
- 市場分析で「データが見つかりません」
- エラーメッセージ: `API_SERVER_ERROR`

**原因**:
1. APIキーが無効
2. 市区町村コードが不正
3. API側のメンテナンス
4. ネットワークエラー

**対処法**:

#### ステップ1: 市区町村コード確認
**対応地域**:
- **東京23区**: 13101～13123
- **主要都市**: 横浜市(14100)、川崎市(14130)、大阪市(27100)、名古屋市(23100)、札幌市(01100)、福岡市(40130)

```javascript
// src/lib/reinfolib.ts の getCityCode() で対応マッピング確認
```

#### ステップ2: APIキー確認
```bash
# APIキー設定確認
npx wrangler pages secret list --project-name my-agent-analytics | grep REINFOLIB
```

#### ステップ3: API動作確認
```bash
# 直接APIをテスト
curl "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001?area=13&from=20241&to=20244&city=13113" \
  -H "Ocp-Apim-Subscription-Key: your-api-key"
```

#### ステップ4: エラーログ確認
```bash
# Cloudflare Pages のログを確認
npx wrangler pages deployment tail --project-name my-agent-analytics
```

---

## データベースエラー

### エラー7: データベース接続エラー

**症状**:
- 全てのページで500エラー
- エラーメッセージ: `DATABASE_ERROR`

**原因**:
1. D1データベースが削除された
2. バインディング設定ミス
3. マイグレーション未適用

**対処法**:

#### ステップ1: データベース存在確認
```bash
# D1データベース一覧
npx wrangler d1 list

# my-agent-analytics-production が存在するか確認
```

#### ステップ2: バインディング確認
```jsonc
// wrangler.jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-agent-analytics-production",
      "database_id": "your-database-id"
    }
  ]
}
```

#### ステップ3: マイグレーション適用
```bash
# ローカル環境
npx wrangler d1 migrations apply my-agent-analytics-production --local

# 本番環境
npx wrangler d1 migrations apply my-agent-analytics-production
```

#### ステップ4: テーブル存在確認
```bash
# テーブル一覧取得
npx wrangler d1 execute my-agent-analytics-production --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

### エラー8: 物件が見つからない

**症状**:
- 物件詳細ページで404エラー
- 統合レポートで「Property not found」
- エラーメッセージ: `PROPERTY_NOT_FOUND`

**原因**:
1. 物件が削除された
2. URLのIDが不正
3. 権限がない（他ユーザーの物件）

**対処法**:

#### ステップ1: 物件存在確認
```bash
# データベースで物件ID確認
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT id, name, user_id FROM properties WHERE id='property-id'"
```

#### ステップ2: 権限確認
```bash
# ユーザーIDと物件の所有者が一致するか確認
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT * FROM properties WHERE id='property-id' AND user_id='user-id'"
```

#### ステップ3: データ復旧（削除済みの場合）
```bash
# バックアップから復旧（プロジェクトバックアップが必要）
# tar.gz形式のバックアップを展開
# D1データベースをリストア
```

---

## ファイルアップロードエラー

### エラー9: PDF形式のアップロードエラー

**症状**:
- OCR機能でPDFをアップロードするとエラー
- エラーメッセージ: `PDF_NOT_SUPPORTED`
- HTTPステータスコード: 400

**原因**:
- OpenAI Vision APIはPDF形式に対応していない（仕様）

**対処法**:

**ユーザー向け**:
1. **PDFを画像に変換**:
   - オンラインツール: https://www.ilovepdf.com/ja/pdf_to_jpg
   - Adobe Acrobat: 「ファイル」→「書き出し」→「画像」
2. **スクリーンショット**:
   - PDFを開いて画面キャプチャ（Snipping Tool等）
3. **手動入力**:
   - OCRを使わず、フォームに直接入力

**エラーメッセージ（改善済み）**:
```json
{
  "error": "PDF形式は現在サポートされていません",
  "errorCode": "PDF_NOT_SUPPORTED",
  "suggestions": [
    "PDFを画像形式（JPG、PNG）に変換してください",
    "スクリーンショットを撮影してアップロードしてください",
    "手動で入力することもできます"
  ],
  "available": false,
  "canRetry": true
}
```

---

### エラー10: 画像形式エラー

**症状**:
- 画像アップロード時にエラー
- エラーメッセージ: `INVALID_IMAGE_FORMAT`

**原因**:
1. 非対応形式（HEIC、BMP等）
2. ファイルが破損
3. ファイルサイズが大きすぎる（100MB超）

**対処法**:

**対応形式**:
- ✅ JPG / JPEG
- ✅ PNG
- ❌ PDF
- ❌ HEIC (iOS写真)
- ❌ BMP
- ❌ GIF

**変換方法**:
```bash
# ImageMagick で変換
convert input.heic output.jpg

# オンラインツール
# https://convertio.co/ja/
```

**ファイルサイズ確認**:
```bash
# ファイルサイズ確認（Mac/Linux）
ls -lh image.jpg

# 100MB以下に圧縮
convert input.jpg -quality 85 output.jpg
```

---

## パフォーマンス問題

### エラー11: ページ読み込みが遅い

**症状**:
- ページ表示に3秒以上かかる
- APIレスポンスが遅い

**原因**:
1. キャッシュが効いていない
2. 大量データの取得
3. 外部API応答遅延
4. ネットワーク問題

**対処法**:

#### ステップ1: キャッシュ確認
```bash
# ブラウザのDevToolsでネットワークタブを確認
# Status列が「200 (from disk cache)」になっているか
```

#### ステップ2: パフォーマンス計測
```bash
# API応答時間測定
curl -o /dev/null -s -w 'Time: %{time_total}s\n' \
  https://3ccc9c44.my-agent-analytics.pages.dev/api/health
```

#### ステップ3: データベースクエリ最適化
```sql
-- インデックス追加例
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
```

#### ステップ4: キャッシング強化
```typescript
// src/lib/cache.ts でキャッシュTTL延長
const CACHE_TTL = {
  static: 86400,     // 24時間
  api: 300,          // 5分 → 600 (10分) に延長
  market: 1800       // 30分
};
```

---

### エラー12: Worker CPU制限超過

**症状**:
- 500エラーが頻発
- エラーメッセージ: `CPU limit exceeded`

**原因**:
- 1リクエストあたりのCPU時間が制限を超えた
  - 無料プラン: 10ms
  - 有料プラン: 30ms

**対処法**:

#### 短期対応:
1. **有料プランへアップグレード**:
   - Cloudflare Workers Paid ($5/month)
   - CPU時間: 10ms → 30ms

#### 中長期対応:
```typescript
// 重い処理を最適化

// ❌ 悪い例: 同期ループ
for (let i = 0; i < 10000; i++) {
  // 重い処理
}

// ✅ 良い例: バッチ処理、非同期
const results = await Promise.all(
  items.map(async (item) => await processItem(item))
);
```

---

## デプロイエラー

### エラー13: ビルドエラー

**症状**:
- `npm run build` が失敗する
- TypeScriptコンパイルエラー

**原因**:
1. 構文エラー
2. 型定義エラー
3. 依存関係の問題

**対処法**:

#### ステップ1: エラー内容確認
```bash
# ビルド実行
cd /home/user/webapp
npm run build

# エラーメッセージを確認
```

#### ステップ2: TypeScriptエラー修正
```typescript
// 型エラーの例
// ❌ Property 'data' does not exist on type 'Response'
const data = response.data;

// ✅ 修正
const response = await axios.get('/api/properties');
const data = response.data;
```

#### ステップ3: 依存関係更新
```bash
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

---

### エラー14: Wrangler デプロイエラー

**症状**:
- `npx wrangler pages deploy` が失敗する
- 認証エラー

**原因**:
1. Cloudflare APIキー未設定
2. プロジェクト名が間違っている
3. ネットワークエラー

**対処法**:

#### ステップ1: 認証確認
```bash
# Wrangler認証状態確認
npx wrangler whoami

# 未認証の場合
npx wrangler login
```

#### ステップ2: プロジェクト名確認
```bash
# 正しいプロジェクト名を使用
npx wrangler pages deploy dist --project-name my-agent-analytics

# プロジェクト一覧
npx wrangler pages project list
```

#### ステップ3: ビルドファイル確認
```bash
# dist/ディレクトリが存在するか
ls -la dist/

# 主要ファイル
# dist/_worker.js
# dist/_routes.json
# dist/static/
```

---

## 監視・ログ確認

### ログ確認方法

#### Cloudflare Pages ログ
```bash
# リアルタイムログ
npx wrangler pages deployment tail --project-name my-agent-analytics

# 特定デプロイメントのログ
npx wrangler pages deployment tail --project-name my-agent-analytics --deployment-id deployment-id
```

#### PM2ログ（ローカル）
```bash
# ログ表示
pm2 logs my-agent-analytics --nostream

# エラーログのみ
pm2 logs my-agent-analytics --err --nostream

# ログファイル
cat ~/.pm2/logs/my-agent-analytics-error.log
```

#### ブラウザコンソール
1. F12キーでDevToolsを開く
2. 「Console」タブでエラーメッセージ確認
3. 「Network」タブでAPIリクエスト確認

---

## 緊急対応手順

### 🚨 サービス完全停止

**症状**: 全ユーザーがアクセスできない

#### 即時対応:
1. **ステータスページ更新**: GitHub Issues等で告知
2. **ログ確認**: Cloudflare Pagesログで原因特定
3. **ロールバック**:
   ```bash
   # 前のバージョンにロールバック
   npx wrangler pages deployment list --project-name my-agent-analytics
   # 安定版のデプロイメントIDを確認して指定
   ```

#### 復旧手順:
1. 原因特定（ログ、エラーメッセージ）
2. 修正版をローカルでテスト
3. 段階的デプロイ（カナリアリリース）
4. 全体デプロイ
5. 動作確認
6. ポストモーテム作成

---

### 🔥 データ損失

**症状**: データベースが破損、データ消失

#### 即時対応:
1. **被害範囲確認**: どのテーブル、何件のデータか
2. **バックアップ確認**:
   ```bash
   # プロジェクトバックアップから復旧
   # https://page.gensparksite.com/project_backups/
   ```
3. **データベースダンプ**:
   ```bash
   # 現状のデータをダンプ（証拠保全）
   npx wrangler d1 export my-agent-analytics-production --output backup.sql
   ```

#### 復旧手順:
1. バックアップからDBリストア
2. 最新マイグレーション適用
3. データ整合性チェック
4. 復旧完了を確認
5. インシデントレポート作成

---

**エラー対処法作成者**: GenSpark AI Assistant  
**最終更新**: 2025-11-04  
**バージョン**: 6.7.4  
**ドキュメント種別**: エラー対処法マニュアル
