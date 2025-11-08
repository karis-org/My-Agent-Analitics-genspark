# エラー対処法

**バージョン**: v6.7.4  
**最終更新日**: 2025年11月8日  
**対象**: 運営管理者、システム管理者

---

## 目次

1. [一般的なエラー対処](#一般的なエラー対処)
2. [認証エラー](#認証エラー)
3. [OCRエラー](#ocrエラー)
4. [データベースエラー](#データベースエラー)
5. [API接続エラー](#api接続エラー)
6. [パフォーマンス問題](#パフォーマンス問題)
7. [緊急対応手順](#緊急対応手順)

---

## 一般的なエラー対処

### エラーメッセージの読み方

エラーメッセージは通常、以下の形式で表示されます：

```
[エラーコード] エラータイトル
詳細メッセージ
```

**例**:
```
[500] サーバーエラー
データベース接続に失敗しました
```

### 基本的なトラブルシューティング手順

1. **ブラウザのリロード**
   - `Ctrl + R` (Windows) または `Cmd + R` (Mac)
   - スーパーリロード: `Ctrl + Shift + R` または `Cmd + Shift + R`

2. **ブラウザコンソールの確認**
   - `F12`キーを押してデベロッパーツールを開く
   - `Console`タブでエラーメッセージを確認

3. **Cookieのクリア**
   - ブラウザ設定 → プライバシー → Cookieをクリア

4. **別のブラウザで試す**
   - Chrome → Firefox または Edge

---

## 認証エラー

### Error: ログインできない

**症状**:
- Googleログインボタンをクリックしても反応しない
- 「認証に失敗しました」と表示される

**原因**:
1. Google OAuth認証の設定問題
2. セッションCookieの問題
3. ブラウザのCookie設定が無効

**対処法**:

#### Step 1: Cookieを有効にする
```
Chrome: 設定 → プライバシーとセキュリティ → Cookieと他のサイトデータ → 「Cookieをすべて受け入れる」
```

#### Step 2: シークレットモードで試す
```
Chrome: Ctrl + Shift + N
```

#### Step 3: Google OAuth設定を確認
```bash
# Cloudflare Pages設定を確認
# 環境変数が正しく設定されているか確認
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

---

### Error: セッションが切れる

**症状**:
- ログイン後、数分で自動ログアウトされる

**原因**:
- セッション有効期限が短く設定されている
- Cookieが保存されない

**対処法**:

#### Step 1: SESSION_SECRET環境変数を確認
```bash
npx wrangler pages deployment list --project-name my-agent-analytics
```

#### Step 2: セッション設定を確認
```typescript
// src/middleware/auth.ts
// session有効期限を確認（デフォルト30日）
```

---

## OCRエラー

### Error: 物件概要書が読み取れない

**症状**:
- PDFをアップロードしても「読み取りに失敗しました」と表示される
- 一部のフィールドが空欄になる

**原因**:
1. PDFの画質が低い
2. 手書き文字が含まれている
3. OpenAI APIのレート制限
4. APIキーの期限切れ

**対処法**:

#### Step 1: PDFの品質を確認
- 解像度: 300 DPI以上推奨
- ファイルサイズ: 10MB以下
- 形式: PDF（画像PDF可）

#### Step 2: OpenAI APIキーを確認
```bash
# Cloudflare Pages環境変数を確認
OPENAI_API_KEY=sk-...

# APIキーの有効性をテスト
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### Step 3: 手動入力に切り替え
- OCRで読み取れない場合は、手動入力フォームを使用

---

### Error: 構造タイプが空欄になる

**症状**:
- OCR後、「構造」フィールドが空白または「未設定」と表示される

**原因**:
- OCRプロンプトが構造タイプを正しく認識していない
- PDFに構造情報が記載されていない

**対処法**:

#### Step 1: バリデーション警告を確認
- 黄色の警告ボックスが表示されていないか確認
- 表示されている場合は、手動で修正

#### Step 2: 正しい構造タイプを選択
- RC造（鉄筋コンクリート造）
- SRC造（鉄骨鉄筋コンクリート造）
- 鉄骨造（S造）
- 木造（W造）

---

### Error: 築年数が異常値（71400など）

**症状**:
- OCR後、築年数に「71400」のような異常な数値が入る

**原因**:
- OCRが坪単価（¥71,400/㎡）を築年数と誤認識

**対処法**:

#### Step 1: バリデーション警告を確認
- Session 11で実装した3層防御が機能しているか確認
- 黄色の警告ボックスが表示されるはず

#### Step 2: 手動で修正
- 築年数フィールドを正しい値に修正（通常0-100年）

---

## データベースエラー

### Error: データベース接続エラー

**症状**:
- 「Database connection failed」エラー
- 物件が登録できない

**原因**:
1. Cloudflare D1の一時的な障害
2. Migration未適用
3. 接続設定の問題

**対処法**:

#### Step 1: Cloudflare D1ステータスを確認
```bash
# D1データベースの状態を確認
npx wrangler d1 info webapp-production
```

#### Step 2: Migrationを確認
```bash
# 適用済みMigrationを確認
npx wrangler d1 migrations list webapp-production

# 未適用Migrationがある場合は適用
npx wrangler d1 migrations apply webapp-production
```

#### Step 3: ローカルテスト
```bash
# ローカル環境でテスト
npx wrangler d1 migrations apply webapp-production --local
npm run build
pm2 start ecosystem.config.cjs
```

---

### Error: Migration適用エラー

**症状**:
- `Error 7403: You do not have permission`
- Migrationが適用できない

**原因**:
- Cloudflare API権限不足

**対処法**:

#### Step 1: Cloudflare Dashboard経由で手動適用
```
1. Cloudflare Dashboard → D1 → webapp-production
2. Console タブを開く
3. migrations/ ディレクトリのSQLを手動実行
```

#### Step 2: API Token権限を確認
```
Cloudflare Dashboard → My Profile → API Tokens
必要な権限: D1 Edit
```

---

## API接続エラー

### Error: イタンジBBに接続できない

**症状**:
- 「検索に失敗しました」エラー
- 検索結果が空

**原因**:
1. 認証情報の期限切れ
2. API接続エラー
3. ネットワーク問題

**対処法**:

#### Step 1: 認証情報を確認
```bash
# Cloudflare Pages環境変数を確認
ITANDI_EMAIL=1340792731
ITANDI_PASSWORD=gthome1120
```

#### Step 2: 検索条件を変更
- 検索範囲を広げる
- 別の都道府県で試す

#### Step 3: ネットワーク確認
```bash
# ブラウザコンソールでNetwork タブを確認
# APIリクエストのレスポンスを確認
```

---

### Error: Google Maps APIエラー

**症状**:
- 地図が表示されない
- 「This page can't load Google Maps correctly」エラー

**原因**:
- APIキーの無効化
- 利用制限超過
- APIキーの設定ミス

**対処法**:

#### Step 1: Google Cloud ConsoleでAPIキーを確認
```
1. Google Cloud Console → APIs & Services → Credentials
2. APIキーのステータスを確認
3. API制限を確認（Maps JavaScript API有効化）
```

#### Step 2: 利用状況を確認
```
Google Cloud Console → APIs & Services → Dashboard
Maps JavaScript API の利用状況を確認
```

#### Step 3: 新しいAPIキーを発行
```
1. 新しいAPIキーを作成
2. Cloudflare Pagesの環境変数を更新
3. 再デプロイ
```

---

## パフォーマンス問題

### 問題: ページ読み込みが遅い

**症状**:
- ページ表示に10秒以上かかる
- タイムアウトエラー

**原因**:
1. 大量のデータ読み込み
2. 外部API呼び出しの遅延
3. ネットワークの遅延

**対処法**:

#### Step 1: ブラウザコンソールで確認
```
F12 → Network タブ
どのリクエストが遅いか確認
```

#### Step 2: キャッシュをクリア
```bash
# ブラウザキャッシュをクリア
Ctrl + Shift + Delete
```

#### Step 3: Cloudflare Analyticsで確認
```
Cloudflare Dashboard → Analytics
パフォーマンスメトリクスを確認
```

---

### 問題: OCR処理が遅い

**症状**:
- OCR処理に30秒以上かかる

**原因**:
- PDFサイズが大きい
- OpenAI APIの混雑

**対処法**:

#### Step 1: PDFサイズを確認
- 10MB以下に圧縮

#### Step 2: 時間帯を変える
- ピークタイムを避ける（日本時間 9-18時）

---

## 緊急対応手順

### レベル1: 軽微な問題（影響：1ユーザー）

**対応時間**: 24時間以内

**手順**:
1. ユーザーからの報告を記録
2. ログを確認
3. 再現テストを実施
4. 修正をスケジュール

---

### レベル2: 中程度の問題（影響：複数ユーザー）

**対応時間**: 4時間以内

**手順**:
1. 即座に問題を確認
2. 影響範囲を特定
3. 暫定的な回避策を案内
4. 修正を優先実装
5. テスト後デプロイ

---

### レベル3: 重大な問題（影響：全ユーザー）

**対応時間**: 即時

**手順**:
1. **即座に運営管理者に連絡**
2. 影響範囲を特定
3. メンテナンスモードに切り替え（必要に応じて）
4. 原因を特定
5. 緊急修正を実装
6. テスト（最小限）
7. 即座にデプロイ
8. 動作確認
9. ユーザーに通知

---

## エラーログの確認方法

### Cloudflare Pages ログ

```bash
# デプロイメントログを確認
npx wrangler pages deployment list --project-name my-agent-analytics

# 特定のデプロイメントのログを確認
npx wrangler pages deployment tail --project-name my-agent-analytics
```

### ブラウザコンソールログ

```javascript
// コンソールでエラーを確認
F12 → Console タブ

// エラーの詳細を出力
console.error('Error details:', error);
```

---

## お問い合わせ

### サポート連絡先

- **メール**: maa-unnei@support
- **緊急連絡**: 営業時間外の重大障害の場合のみ使用

### エスカレーション

1. **レベル1**: サポート担当 → 24時間以内に回答
2. **レベル2**: システム管理者 → 4時間以内に対応
3. **レベル3**: 運営管理者 → 即時対応

---

## 更新履歴

### v6.7.4 (2025-11-08)
- OCR構造認識エラーの対処法を追加
- イタンジBB接続エラーの対処法を追加

### v6.7.3 (2025-11-07)
- Migrationエラーの対処法を追加

---

**このドキュメントは継続的に更新されます。**
