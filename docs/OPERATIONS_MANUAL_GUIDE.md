# 運用マニュアル - 日常運用ガイド v6.7.4

**最終更新**: 2025年11月04日  
**バージョン**: 6.7.4  
**対象者**: システム管理者、運用担当者

---

## 📖 目次

1. [日常運用タスク](#日常運用タスク)
2. [週次運用タスク](#週次運用タスク)
3. [月次運用タスク](#月次運用タスク)
4. [バックアップ運用](#バックアップ運用)
5. [監視運用](#監視運用)
6. [ユーザー管理](#ユーザー管理)
7. [APIキー管理](#apiキー管理)
8. [パフォーマンス管理](#パフォーマンス管理)
9. [セキュリティ管理](#セキュリティ管理)
10. [緊急時対応](#緊急時対応)

---

## 日常運用タスク

### 毎日実施（所要時間: 10分）

#### 1. システム稼働確認

**チェック項目**:
```bash
# ステップ1: ヘルスチェック
curl https://3ccc9c44.my-agent-analytics.pages.dev/api/health

# 期待結果: {"status":"ok","timestamp":"...","version":"2.0.0"}

# ステップ2: 主要ページの表示確認
# ブラウザで以下のURLを開く
- https://3ccc9c44.my-agent-analytics.pages.dev/
- https://3ccc9c44.my-agent-analytics.pages.dev/login
- https://3ccc9c44.my-agent-analytics.pages.dev/dashboard
```

**記録**:
- 日時
- 稼働状況（正常/異常）
- 応答時間
- 異常時の詳細

---

#### 2. エラーログ確認

**コマンド**:
```bash
# Cloudflare Pages のログを確認
npx wrangler pages deployment tail --project-name my-agent-analytics --format pretty

# エラーのみフィルタ
npx wrangler pages deployment tail --project-name my-agent-analytics --format pretty | grep -i error
```

**チェック内容**:
- 500エラーの有無
- 認証エラーの頻度
- API連携エラー
- データベースエラー

**対応基準**:
- **1-5件/日**: 正常範囲（記録のみ）
- **6-20件/日**: 注意（原因調査）
- **21件以上/日**: 警告（即座に対応）

---

#### 3. レート制限モニタリング

**コマンド**:
```bash
# レート制限ヘッダーを確認
curl -I https://3ccc9c44.my-agent-analytics.pages.dev/api/health

# X-RateLimit-Remaining: 残りリクエスト数
# X-RateLimit-Reset: リセット時刻
```

**チェック項目**:
- レート制限超過の頻度
- ピーク時間帯
- ユーザーごとのリクエスト数

**対応**:
- 頻繁に制限超過する場合は制限値を調整
- 不正アクセスの疑いがある場合はIPブロック

---

#### 4. パフォーマンス確認

**測定**:
```bash
# API応答時間（目標: <100ms）
curl -o /dev/null -s -w 'Total: %{time_total}s\n' \
  https://3ccc9c44.my-agent-analytics.pages.dev/api/health

# ページサイズ（目標: <200KB）
curl -s https://3ccc9c44.my-agent-analytics.pages.dev/ | wc -c
```

**記録**:
- 日時
- 応答時間
- ページサイズ
- トレンド（改善/悪化）

---

## 週次運用タスク

### 毎週実施（所要時間: 30分）

#### 1. データベースメンテナンス

**バキューム実行**:
```bash
# D1データベースの最適化
npx wrangler d1 execute my-agent-analytics-production \
  --command="VACUUM"

# データサイズ確認
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT 
    SUM(pgsize) as total_size, 
    COUNT(*) as table_count 
  FROM dbstat"
```

**古いデータクリーンアップ**:
```bash
# 90日以上前のセッションを削除
npx wrangler d1 execute my-agent-analytics-production \
  --command="DELETE FROM sessions 
  WHERE datetime(expires_at) < datetime('now', '-90 days')"

# 1年以上前のアクセスログを削除
npx wrangler d1 execute my-agent-analytics-production \
  --command="DELETE FROM report_access_log 
  WHERE datetime(accessed_at) < datetime('now', '-1 year')"
```

---

#### 2. バックアップ確認

**プロジェクトバックアップ**:
```bash
# 最新バックアップの確認
# https://page.gensparksite.com/project_backups/ にアクセス

# 最終バックアップ日時を記録
# webapp_backup_YYYYMMDD.tar.gz
```

**データベースバックアップ**:
```bash
# D1データベースのエクスポート
npx wrangler d1 export my-agent-analytics-production \
  --output backup_$(date +%Y%m%d).sql

# バックアップファイルを安全な場所に保存
# （例: Google Drive、AWS S3、外部ストレージ）
```

---

#### 3. セキュリティ監査

**アクセスログ確認**:
```bash
# 不正アクセスの検出
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT 
    ip_address, 
    COUNT(*) as access_count,
    datetime(MAX(accessed_at)) as last_access
  FROM report_access_log 
  WHERE datetime(accessed_at) > datetime('now', '-7 days')
  GROUP BY ip_address 
  ORDER BY access_count DESC 
  LIMIT 20"
```

**チェック項目**:
- 異常に多いアクセス（1000回以上/日）
- 深夜帯の大量アクセス
- 外国からの不審なアクセス

**対応**:
- 疑わしいIPアドレスをブロック
- レート制限の強化
- セキュリティログの詳細確認

---

#### 4. APIキー有効性確認

**テスト実行**:
```bash
# 各APIキーの動作確認スクリプト
bash check-api-keys.sh

# 期待結果: 全てのAPIキーが「✓ VALID」
```

**チェック項目**:
- Google OAuth: ログイン可能か
- OpenAI: OCR機能動作するか
- 不動産情報ライブラリ: 市場分析動作するか
- e-Stat: 統計データ取得できるか
- イタンジ: 賃貸相場取得できるか

**エラー時の対応**:
- APIキーの有効期限確認
- クォータ/残高確認
- 必要に応じて更新

---

## 月次運用タスク

### 毎月実施（所要時間: 1時間）

#### 1. 利用統計レポート

**データ集計**:
```bash
# ユーザー数
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT COUNT(*) as user_count FROM users"

# 登録物件数
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT COUNT(*) as property_count FROM properties"

# 月間分析実行数
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT COUNT(*) as analysis_count 
  FROM analyses 
  WHERE datetime(created_at) >= datetime('now', 'start of month')"

# 月間アクティブユーザー数
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT COUNT(DISTINCT user_id) as mau 
  FROM sessions 
  WHERE datetime(created_at) >= datetime('now', 'start of month')"
```

**レポート作成**:
| 指標 | 前月 | 当月 | 増減率 |
|------|------|------|--------|
| ユーザー数 | - | - | - |
| 登録物件数 | - | - | - |
| 分析実行数 | - | - | - |
| MAU | - | - | - |

---

#### 2. パフォーマンスレビュー

**ベンチマーク実行**:
```bash
# 包括的テスト実行
bash test-comprehensive-v3.sh

# 結果を記録
# - 合格率
# - 警告数
# - 失敗数
# - 平均応答時間
```

**改善計画**:
- 応答時間が遅い箇所の特定
- データベースクエリの最適化
- キャッシング戦略の見直し

---

#### 3. コスト分析

**Cloudflare 利用状況**:
1. Cloudflare ダッシュボードにアクセス
2. 「Analytics」→「Usage」で確認:
   - Workers リクエスト数
   - Pages ビルド数
   - D1 ストレージ使用量
   - KV ストレージ使用量（使用時）

**コスト予測**:
- 現在の使用量から月額コストを計算
- 無料プラン上限との比較
- 有料プラン移行の検討

---

#### 4. 依存関係更新

**パッケージ更新確認**:
```bash
# 古いパッケージ確認
npm outdated

# セキュリティ脆弱性チェック
npm audit

# 更新（慎重に）
npm update
```

**更新手順**:
1. **開発環境**でアップデート
2. **ビルドとテスト**実行
3. **ローカル動作確認**
4. **本番デプロイ前にバックアップ**
5. **本番デプロイ**
6. **動作確認**

---

## バックアップ運用

### 自動バックアップ設定（推奨）

**GitHub Actions設定例**:
```yaml
# .github/workflows/backup.yml
name: Daily Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時（UTC）

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Install Wrangler
        run: npm install -g wrangler
      
      - name: Export D1 Database
        run: |
          npx wrangler d1 export my-agent-analytics-production \
            --output backup_$(date +%Y%m%d).sql
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Upload to Storage
        # S3、Google Drive等にアップロード
```

---

### 手動バックアップ手順

#### プロジェクト全体バックアップ

**GenSpark ProjectBackup ツール**:
```bash
# プロジェクトバックアップ作成（ツール使用）
# GenSpark UI からProjectBackupツールを実行

# 出力先: https://page.gensparksite.com/project_backups/
# ファイル名: webapp_backup_YYYYMMDD.tar.gz
```

**手動バックアップ**:
```bash
# プロジェクトディレクトリ全体をtar.gz化
cd /home/user
tar -czf webapp_backup_$(date +%Y%m%d).tar.gz webapp/

# バックアップファイルを外部ストレージに保存
scp webapp_backup_*.tar.gz user@backup-server:/backups/
```

---

#### データベースバックアップ

```bash
# D1データベースのエクスポート
npx wrangler d1 export my-agent-analytics-production \
  --output db_backup_$(date +%Y%m%d).sql

# バックアップファイルの確認
ls -lh db_backup_*.sql

# 外部ストレージに保存
# Google Drive、Dropbox、AWS S3等
```

---

#### バックアップからの復旧

**プロジェクト復旧**:
```bash
# tar.gzを展開
tar -xzf webapp_backup_20251104.tar.gz

# 依存関係インストール
cd webapp
npm install

# ビルドとデプロイ
npm run build
npx wrangler pages deploy dist --project-name my-agent-analytics
```

**データベース復旧**:
```bash
# SQLファイルからリストア
npx wrangler d1 execute my-agent-analytics-production --file=db_backup_20251104.sql

# データ確認
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT COUNT(*) FROM users"
```

---

## 監視運用

### 監視項目一覧

| 項目 | 目標値 | 警告閾値 | 確認頻度 |
|------|--------|---------|---------|
| **稼働率** | 99.9% | <99% | 毎日 |
| **API応答時間** | <100ms | >500ms | 毎日 |
| **エラー率** | <0.1% | >1% | 毎日 |
| **データベースサイズ** | <500MB | >400MB | 週次 |
| **レート制限超過** | 0回/日 | >10回/日 | 毎日 |

---

### Cloudflare Analytics設定

**Web Analytics有効化**:
1. Cloudflare ダッシュボードにログイン
2. 「my-agent-analytics」プロジェクトを選択
3. 「Analytics」タブを開く
4. 「Enable Web Analytics」をクリック

**確認項目**:
- ページビュー数
- ユニークビジター数
- バウンス率
- 地域別アクセス
- デバイス別アクセス

---

### アラート設定（推奨）

**Cloudflare Workers Analytics**:
```javascript
// src/middleware/monitoring.ts

// 閾値設定
const ALERT_THRESHOLDS = {
  errorRate: 0.01,        // 1%
  responseTime: 500,      // 500ms
  rateLimitHits: 10       // 10回/日
};

// アラート送信（Slack、Email等）
async function sendAlert(message: string) {
  // Slack Webhook URL
  await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message })
  });
}
```

---

## ユーザー管理

### 新規ユーザー登録

**Google OAuth登録**:
- ユーザーが「Googleでログイン」を使用すると自動で登録
- データベースに`users`レコードが作成される

**管理者による手動登録**:
```bash
# パスワード認証ユーザーの追加
# 1. パスワードハッシュ生成
node -e "console.log(require('crypto').createHash('sha256').update('YourPassword@2025').digest('hex'))"

# 2. ユーザー追加
npx wrangler d1 execute my-agent-analytics-production \
  --command="INSERT INTO users (id, email, name, provider, password_hash, role, is_admin) 
  VALUES (
    '$(uuidgen)', 
    'newuser@example.com', 
    'New User', 
    'password', 
    'your-password-hash', 
    'user', 
    0
  )"
```

---

### ユーザー削除

**注意**: ユーザー削除は関連データも削除されるため、慎重に実行してください。

```bash
# ステップ1: ユーザーの関連データ確認
npx wrangler d1 execute my-agent-analytics-production \
  --command="SELECT 
    (SELECT COUNT(*) FROM properties WHERE user_id='user-id') as properties,
    (SELECT COUNT(*) FROM analyses WHERE user_id='user-id') as analyses,
    (SELECT COUNT(*) FROM sessions WHERE user_id='user-id') as sessions
  "

# ステップ2: 関連データ削除
npx wrangler d1 execute my-agent-analytics-production \
  --command="DELETE FROM sessions WHERE user_id='user-id'"

npx wrangler d1 execute my-agent-analytics-production \
  --command="DELETE FROM analyses WHERE user_id='user-id'"

npx wrangler d1 execute my-agent-analytics-production \
  --command="DELETE FROM properties WHERE user_id='user-id'"

# ステップ3: ユーザー削除
npx wrangler d1 execute my-agent-analytics-production \
  --command="DELETE FROM users WHERE id='user-id'"
```

---

### 管理者権限付与

```bash
# ユーザーを管理者に昇格
npx wrangler d1 execute my-agent-analytics-production \
  --command="UPDATE users 
  SET is_admin=1, role='admin' 
  WHERE email='user@example.com'"
```

---

## APIキー管理

### APIキー一覧

| APIキー名 | 必須/任意 | 更新頻度 | 費用 |
|----------|----------|---------|------|
| GOOGLE_CLIENT_ID | 必須 | 無期限 | 無料 |
| GOOGLE_CLIENT_SECRET | 必須 | 無期限 | 無料 |
| OPENAI_API_KEY | 必須 | 必要時 | 従量課金 |
| REINFOLIB_API_KEY | 必須 | 年次 | 有料 |
| ESTAT_API_KEY | 任意 | 無期限 | 無料 |
| ITANDI_API_KEY | 任意 | 契約期間 | 有料 |
| REINS_LOGIN_ID | 任意 | 契約期間 | 有料 |
| REINS_PASSWORD | 任意 | 契約期間 | 有料 |
| SESSION_SECRET | 必須 | 推奨年次 | - |

---

### APIキー更新手順

#### 1. Google OAuth キー

**更新が必要な場合**:
- クライアントIDが漏洩した
- セキュリティ強化のため

**手順**:
1. Google Cloud Console: https://console.cloud.google.com/
2. 「APIとサービス」→「認証情報」
3. 既存のOAuth 2.0クライアントIDを編集または新規作成
4. 新しいクライアントIDとシークレットを取得
5. Cloudflare Pagesに設定:
   ```bash
   npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name my-agent-analytics
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name my-agent-analytics
   ```

---

#### 2. OpenAI APIキー

**更新が必要な場合**:
- クォータ不足
- セキュリティ上の理由

**手順**:
1. OpenAI Platform: https://platform.openai.com/
2. 「API keys」→「Create new secret key」
3. 新しいキーをコピー
4. Cloudflare Pagesに設定:
   ```bash
   npx wrangler pages secret put OPENAI_API_KEY --project-name my-agent-analytics
   ```
5. 旧キーを削除（OpenAI Platformで）

---

#### 3. SESSION_SECRET 更新

**推奨頻度**: 年次または漏洩時

**手順**:
```bash
# 新しい32バイトシークレット生成
openssl rand -hex 32

# Cloudflare Pagesに設定
npx wrangler pages secret put SESSION_SECRET --project-name my-agent-analytics

# 注意: 更新後、全ユーザーのセッションが無効化されます
# ユーザーは再ログインが必要になります
```

---

## パフォーマンス管理

### パフォーマンス目標

| 指標 | 目標値 |
|------|--------|
| **TTFB** (Time To First Byte) | <200ms |
| **FCP** (First Contentful Paint) | <1.8s |
| **LCP** (Largest Contentful Paint) | <2.5s |
| **CLS** (Cumulative Layout Shift) | <0.1 |
| **API応答時間** | <100ms |

---

### 最適化チェックリスト

#### 毎月実施

**1. バンドルサイズチェック**:
```bash
# ビルド後のサイズ確認
ls -lh dist/_worker.js

# 目標: 10MB以下
# 警告: 5MB以上
```

**対策** (必要時):
- 未使用ライブラリの削除
- コード分割の実装
- Tree shaking の最適化

**2. データベースクエリ最適化**:
```bash
# 遅いクエリの特定
npx wrangler d1 execute my-agent-analytics-production \
  --command="EXPLAIN QUERY PLAN 
  SELECT * FROM properties WHERE user_id='user-id' ORDER BY created_at DESC"
```

**3. キャッシュヒット率確認**:
```bash
# Cloudflare Analytics でCache Hit Rateを確認
# 目標: 75%以上
```

---

## セキュリティ管理

### セキュリティチェックリスト

#### 週次確認

- [ ] 不正アクセスログの確認
- [ ] レート制限超過の確認
- [ ] 異常なトラフィックパターンの検出
- [ ] APIキーの有効性確認

#### 月次確認

- [ ] 依存関係の脆弱性スキャン（`npm audit`）
- [ ] パスワードポリシーの見直し
- [ ] HTTPS証明書の有効期限確認（Cloudflare自動管理）
- [ ] バックアップの復旧テスト

#### 年次確認

- [ ] SESSION_SECRETの更新
- [ ] 全APIキーの棚卸し
- [ ] セキュリティ監査の実施
- [ ] 災害復旧計画の見直し

---

## 緊急時対応

### エスカレーションフロー

```
Level 1: 運用担当者
    │
    ├─ 自己解決可能 → 対応実施 → 記録
    │
    └─ 解決不可 → エスカレーション
            │
            ▼
Level 2: システム管理者
    │
    ├─ 解決可能 → 対応実施 → ポストモーテム
    │
    └─ 解決不可 → エスカレーション
            │
            ▼
Level 3: 開発チーム / 外部サポート
    │
    └─ 根本対応 → 再発防止策
```

---

### 緊急連絡先

| 役割 | 連絡先 | 対応範囲 |
|------|--------|---------|
| **システム管理者** | admin@myagent.local | 全般 |
| **開発チーム** | GitHub Issues | バグ修正 |
| **Cloudflare サポート** | https://support.cloudflare.com/ | インフラ問題 |
| **OpenAI サポート** | https://help.openai.com/ | API問題 |

---

### インシデント記録テンプレート

```markdown
# インシデント報告書

**日時**: 2025-11-04 14:30 JST
**発見者**: 運用担当者名
**優先度**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

## 概要
[インシデントの簡潔な説明]

## 影響範囲
- 影響を受けたユーザー数: 
- 影響を受けた機能: 
- ダウンタイム: 

## 原因
[根本原因の詳細]

## 対応内容
[実施した対応の詳細]

## 再発防止策
[今後の対策]

## タイムライン
- 14:30 - インシデント発生
- 14:35 - 検知
- 14:40 - 対応開始
- 15:00 - 復旧完了
```

---

**運用ガイド作成者**: GenSpark AI Assistant  
**最終更新**: 2025-11-04  
**バージョン**: 6.7.4  
**ドキュメント種別**: 日常運用ガイド
