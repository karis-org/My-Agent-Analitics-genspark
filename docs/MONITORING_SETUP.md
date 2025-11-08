# 監視設定ガイド

**バージョン**: v6.7.4  
**最終更新日**: 2025年11月8日  
**対象**: システム管理者、運営管理者

---

## 目次

1. [監視の概要](#監視の概要)
2. [Cloudflare Analytics設定](#cloudflare-analytics設定)
3. [アラート設定](#アラート設定)
4. [ログ監視](#ログ監視)
5. [パフォーマンス監視](#パフォーマンス監視)
6. [外部API監視](#外部api監視)
7. [ダッシュボード構築](#ダッシュボード構築)

---

## 監視の概要

### 監視項目

| カテゴリ | 監視項目 | 目標値 | アラート閾値 |
|---------|---------|-------|------------|
| **可用性** | アップタイム | 99.9% | < 99% |
| **パフォーマンス** | レスポンス時間 | < 500ms | > 2s |
| **エラー** | エラー率 | < 1% | > 5% |
| **セキュリティ** | 不正アクセス試行 | 0件/日 | > 10件/日 |
| **リソース** | D1クエリ数 | < 100,000/日 | > 500,000/日 |
| **コスト** | 月額費用 | < $100 | > $500 |

### 監視ツール

1. **Cloudflare Analytics**（標準）
   - リクエスト数
   - エラー率
   - レスポンス時間
   - 帯域幅

2. **Wrangler CLI**（コマンドライン）
   - デプロイメントログ
   - リアルタイムログ

3. **カスタムダッシュボード**（オプション）
   - Grafana
   - Datadog
   - New Relic

---

## Cloudflare Analytics設定

### アクセス方法

1. Cloudflare Dashboard にログイン
2. Pages → `my-agent-analytics` を選択
3. **Analytics** タブをクリック

### 主要メトリクス

#### 1. Requests（リクエスト数）

- **表示期間**: 過去24時間 / 7日間 / 30日間
- **確認頻度**: 毎日
- **目標**: 1,000+ リクエスト/日

#### 2. Data Transfer（データ転送量）

- **表示期間**: 月次
- **確認頻度**: 週次
- **目標**: < 100GB/月

#### 3. Response Time（レスポンス時間）

- **表示期間**: 過去24時間
- **確認頻度**: 毎日
- **目標**: p50 < 300ms, p95 < 1s, p99 < 2s

#### 4. Error Rate（エラー率）

- **表示期間**: 過去24時間
- **確認頻度**: 毎日
- **目標**: < 1%

---

### Web Analytics統合（推奨）

#### 設定手順

1. Cloudflare Dashboard → Web Analytics
2. 新しいサイトを追加
3. JavaScript Snippetを取得
4. `src/routes/*.tsx` の `<head>` タグに追加:

```html
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

#### 取得できるメトリクス

- ページビュー
- ユニークビジター
- 訪問元（地域、デバイス）
- ページ滞在時間
- 離脱率

---

## アラート設定

### Cloudflare Notifications

#### Step 1: Notificationsページにアクセス

1. Cloudflare Dashboard → Notifications
2. **Create** ボタンをクリック

#### Step 2: アラート種類を選択

推奨設定:

##### 1. Pages Project Error Rate Increase

- **イベント**: Pages Project Error Rate
- **プロジェクト**: my-agent-analytics
- **閾値**: エラー率 > 5%
- **期間**: 5分間
- **通知先**: メールアドレス
- **頻度**: 1回/時間

##### 2. Pages Project Build Failure

- **イベント**: Pages Project Build Failed
- **プロジェクト**: my-agent-analytics
- **通知先**: メールアドレス
- **頻度**: 即時

##### 3. D1 Query Rate Limit

- **イベント**: D1 Database Query Rate Approaching Limit
- **データベース**: webapp-production
- **閾値**: 80%到達時
- **通知先**: メールアドレス
- **頻度**: 1回/日

---

### メール通知設定

#### 推奨受信者

| アラート種類 | 受信者 | 優先度 |
|-------------|-------|--------|
| **エラー率増加** | システム管理者、運営管理者 | 高 |
| **ビルド失敗** | 開発者、システム管理者 | 中 |
| **クォータ上限** | 運営管理者 | 中 |
| **セキュリティアラート** | 全管理者 | 最高 |

---

## ログ監視

### リアルタイムログ監視

#### Wrangler CLI

```bash
# リアルタイムログストリーミング
npx wrangler pages deployment tail --project-name my-agent-analytics

# エラーのみフィルター
npx wrangler pages deployment tail --project-name my-agent-analytics \
  | grep -i error

# 特定のユーザーIDでフィルター
npx wrangler pages deployment tail --project-name my-agent-analytics \
  | grep "user-123"
```

---

### ログ保存

#### ログ出力先

Cloudflare Pagesはデフォルトでログを7日間保持します。

#### 長期保存（推奨）

**オプション1: Cloudflare Workers Analytics Engine**

```typescript
// src/middleware/logger.ts
import { Hono } from 'hono';

app.use('*', async (c, next) => {
  const start = Date.now();
  
  await next();
  
  const duration = Date.now() - start;
  
  // Analytics Engineに送信
  c.env.ANALYTICS.writeDataPoint({
    blobs: [c.req.path, c.req.method],
    doubles: [duration, c.res.status],
    indexes: [c.get('user')?.id || 'anonymous']
  });
});
```

**オプション2: 外部ログサービス**

- **Logtail**: 簡単なセットアップ、無料枠あり
- **Datadog**: 高度な分析機能
- **Splunk**: エンタープライズ向け

---

## パフォーマンス監視

### Core Web Vitals

#### 測定方法

1. **Lighthouse**（Chrome DevTools）
   ```
   F12 → Lighthouse タブ → Generate report
   ```

2. **PageSpeed Insights**
   ```
   https://pagespeed.web.dev/
   ```

#### 目標値

| メトリクス | 目標値 | 現状 |
|-----------|-------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | ~1.2s |
| **FID** (First Input Delay) | < 100ms | ~50ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ~0.05 |
| **FCP** (First Contentful Paint) | < 1.8s | ~0.8s |
| **TTI** (Time to Interactive) | < 3.8s | ~2.5s |

---

### レスポンス時間監視

#### 手動測定

```bash
# エンドポイントのレスポンス時間を測定
curl -w "@curl-format.txt" -o /dev/null -s https://my-agent-analytics.pages.dev

# curl-format.txt の内容:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

#### 自動監視（Cron Job推奨）

```bash
#!/bin/bash
# monitor-performance.sh

ENDPOINTS=(
  "https://my-agent-analytics.pages.dev"
  "https://my-agent-analytics.pages.dev/dashboard"
  "https://my-agent-analytics.pages.dev/api/properties"
)

for endpoint in "${ENDPOINTS[@]}"; do
  response_time=$(curl -w "%{time_total}" -o /dev/null -s "$endpoint")
  
  if (( $(echo "$response_time > 2.0" | bc -l) )); then
    echo "ALERT: $endpoint is slow ($response_time seconds)"
    # メール送信またはSlack通知
  fi
done
```

---

## 外部API監視

### OpenAI API

#### 利用状況確認

1. OpenAI Dashboard → Usage
2. 月間使用量を確認
3. コスト見積もり

#### アラート設定

OpenAI Dashboard:
1. Settings → Limits
2. 月間上限を設定（例: $50/月）
3. 通知メールアドレスを設定

---

### Google APIs

#### クォータ確認

```
Google Cloud Console → APIs & Services → Dashboard
```

確認項目:
- Maps JavaScript API: 28,000リクエスト/月（無料枠）
- Custom Search API: 100クエリ/日（無料枠）

#### アラート設定

Google Cloud Console:
1. Billing → Budgets & alerts
2. 予算を設定（例: $10/月）
3. 80%到達時にメール通知

---

### Itandi BB API

#### 手動監視

```bash
# 接続テスト
curl -X POST https://itandi-bb-api.example.com/search \
  -H "Authorization: Bearer TOKEN" \
  -d '{"prefecture": "東京都"}'
```

#### 監視項目

- 認証エラー（401）
- レート制限エラー（429）
- サーバーエラー（500）

---

## ダッシュボード構築

### シンプルなダッシュボード（Cloudflare標準）

Cloudflare Analyticsで十分なケースが多いです。

---

### カスタムダッシュボード（Grafana）

#### メリット

- 複数のデータソースを統合
- カスタムグラフ作成
- 高度なアラート設定

#### セットアップ（Grafana Cloud - 無料枠）

1. **Grafana Cloudアカウント作成**
   ```
   https://grafana.com/
   ```

2. **Cloudflare Logpushの設定**
   ```bash
   npx wrangler logpush create \
     --destination="https://your-grafana-instance.com/api/v1/logs" \
     --dataset=pages \
     --name=my-agent-analytics-logs
   ```

3. **ダッシュボード作成**
   - リクエスト数グラフ
   - エラー率グラフ
   - レスポンス時間グラフ
   - ユーザー数グラフ

---

### 監視ダッシュボードの例

```
┌─────────────────────────────────────────┐
│  My Agent Analytics - System Dashboard │
├─────────────────────────────────────────┤
│                                         │
│  ■ アップタイム:         99.95%        │
│  ■ 今日のリクエスト数:    1,234        │
│  ■ 平均レスポンス時間:    342ms        │
│  ■ エラー率:             0.5%          │
│                                         │
├─────────────────────────────────────────┤
│  [リクエスト数グラフ - 過去24時間]      │
│  ▁��▃▅▆▇█▇▆▅▃▂▁                        │
├─────────────────────────────────────────┤
│  [エラー率グラフ - 過去7日間]           │
│  ▁▁▁▂▁▁▁                               │
├─────────────────────────────────────────┤
│  最近のアラート:                        │
│  ⚠️  エラー率が3%に上昇 (2時間前)      │
│  ✅  解決済み (1時間前)                │
└─────────────────────────────────────────┘
```

---

## まとめ

### 監視のベストプラクティス

1. **重要なメトリクスに集中**
   - アップタイム、エラー率、レスポンス時間

2. **アラート疲れを避ける**
   - 適切な閾値設定
   - 通知頻度の制限

3. **定期的なレビュー**
   - 週次レポート
   - 月次レビュー

4. **自動化**
   - 手動チェックを最小限に
   - スクリプトで自動化

---

## お問い合わせ

### サポート

- **メール**: maa-unnei@support

---

## 更新履歴

### v6.7.4 (2025-11-08)
- ドキュメント初版作成

---

**このドキュメントは継続的に更新されます。**
