# 監視設定ガイド - My Agent Analytics v6.7.4

## 📊 概要

このドキュメントは、My Agent Analyticsの監視とアナリティクス設定の完全ガイドです。

**作成日**: 2025年11月4日  
**対象バージョン**: v6.7.4  
**対象者**: システム管理者、DevOpsエンジニア

---

## 🎯 監視項目

### 1. Cloudflare Analytics（Web Analytics）
### 2. エラーログ監視（Wrangler Tail）
### 3. パフォーマンス監視
### 4. セキュリティ監視

---

## 📈 1. Cloudflare Analytics設定

### 1.1 Cloudflare Web Analytics有効化

**手順**:

1. **Cloudflareダッシュボードにログイン**
   ```
   https://dash.cloudflare.com/
   ```

2. **Pagesプロジェクトを選択**
   - プロジェクト名: `my-agent-analytics`

3. **Analytics タブを開く**
   - 左メニュー: `Analytics`
   - サブメニュー: `Web Analytics`

4. **Web Analyticsを有効化**
   ```
   Settings → Web Analytics → Enable
   ```

5. **トラッキングコードを取得**（不要 - Cloudflare Pagesは自動）
   - Cloudflare Pagesでホストされているサイトは自動的にアナリティクスが有効

### 1.2 監視する主要メトリクス

#### トラフィックメトリクス
- **ページビュー数**: 日次/週次/月次
- **ユニークビジター数**: DAU, WAU, MAU
- **セッション数**: 平均セッション時間
- **直帰率**: ランディングページ別

#### パフォーマンスメトリクス
- **ページ読み込み時間**: 中央値、95パーセンタイル
- **First Contentful Paint (FCP)**: 目標 < 1.8秒
- **Time to Interactive (TTI)**: 目標 < 3.8秒
- **Cumulative Layout Shift (CLS)**: 目標 < 0.1

#### ユーザー行動
- **人気ページ**: 上位10ページ
- **参照元**: 直接、検索、SNS、リファラル
- **デバイス分布**: デスクトップ vs モバイル vs タブレット
- **ブラウザ分布**: Chrome, Safari, Firefox, Edge

#### 地理情報
- **国別アクセス**: 日本、その他
- **地域別アクセス**: 都道府県別（可能な場合）

### 1.3 ダッシュボードアクセス

```bash
# Cloudflare Dashboardでアクセス
https://dash.cloudflare.com/[ACCOUNT_ID]/pages/view/my-agent-analytics/analytics

# 主要メニュー:
# 1. Traffic - ページビュー、ビジター
# 2. Performance - Core Web Vitals
# 3. Behavior - ページフロー、滞在時間
# 4. Devices - デバイス、ブラウザ、OS
# 5. Geography - 国、都市
```

### 1.4 アラート設定（Cloudflare Notifications）

```bash
# Cloudflare Dashboard → Notifications → Create Notification

# アラート設定例:
1. Traffic Anomaly Detection (トラフィック異常)
   - Threshold: 50% decrease in traffic
   - Notification: Email + Slack

2. High Error Rate (エラー率上昇)
   - Threshold: > 5% 5xx errors
   - Notification: Email + Slack

3. Performance Degradation (パフォーマンス低下)
   - Threshold: Average response time > 500ms
   - Notification: Email

4. Security Events (セキュリティイベント)
   - DDoS attack detected
   - Rate limit exceeded
   - Notification: Email + SMS
```

---

## 🔍 2. エラーログ監視設定

### 2.1 Wrangler Taillによるリアルタイム監視

**基本コマンド**:

```bash
# リアルタイムログストリーム
cd /home/user/webapp
npx wrangler pages deployment tail

# エラーのみフィルタ
npx wrangler pages deployment tail --format pretty | grep -i error

# 特定のデプロイメント
npx wrangler pages deployment tail --deployment-id <DEPLOYMENT_ID>

# JSON形式で出力
npx wrangler pages deployment tail --format json > logs.json
```

### 2.2 ログ分析スクリプト

**`scripts/analyze-logs.sh`** を作成:

```bash
#!/bin/bash
# エラーログ分析スクリプト

LOG_FILE="${1:-logs.json}"
OUTPUT_FILE="log-analysis-$(date +%Y%m%d-%H%M%S).txt"

echo "=== エラーログ分析レポート ===" > "$OUTPUT_FILE"
echo "分析日時: $(date)" >> "$OUTPUT_FILE"
echo "ログファイル: $LOG_FILE" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# エラー数カウント
ERROR_COUNT=$(grep -c '"level":"error"' "$LOG_FILE")
echo "総エラー数: $ERROR_COUNT" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# エラータイプ別集計
echo "=== エラータイプ別 ===" >> "$OUTPUT_FILE"
grep '"level":"error"' "$LOG_FILE" | \
  jq -r '.message' | \
  sort | uniq -c | sort -rn >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# エンドポイント別エラー
echo "=== エンドポイント別エラー ===" >> "$OUTPUT_FILE"
grep '"level":"error"' "$LOG_FILE" | \
  jq -r '.request.url' | \
  sort | uniq -c | sort -rn | head -20 >> "$OUTPUT_FILE"

echo "分析完了: $OUTPUT_FILE"
```

**使用方法**:

```bash
# 実行権限付与
chmod +x scripts/analyze-logs.sh

# ログ収集と分析
npx wrangler pages deployment tail --format json > logs.json
./scripts/analyze-logs.sh logs.json
```

### 2.3 エラー監視ダッシュボード

**Cloudflare Workers Analytics**でエラー監視:

```bash
# Cloudflare Dashboard → Workers & Pages → my-agent-analytics → Metrics

監視項目:
1. Requests - 総リクエスト数
2. Errors - エラー数、エラー率
3. CPU Time - CPU使用時間
4. Duration - レスポンスタイム
5. Bandwidth - 帯域幅使用量
```

### 2.4 エラー通知設定

**Slack通知の設定例**:

```javascript
// src/lib/error-notification.ts
export async function notifyError(error: Error, context: any) {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  
  if (!SLACK_WEBHOOK_URL) {
    console.error('Slack webhook URL not configured');
    return;
  }
  
  const payload = {
    text: '🚨 *My Agent Analytics - エラー発生*',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*エラーメッセージ*: ${error.message}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*URL*: ${context.request?.url || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*ユーザーID*: ${context.user?.id || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*タイムスタンプ*: ${new Date().toISOString()}`
          },
          {
            type: 'mrkdwn',
            text: `*スタックトレース*: \`\`\`${error.stack || 'N/A'}\`\`\``
          }
        ]
      }
    ]
  };
  
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to send Slack notification:', err);
  }
}
```

**環境変数設定**:

```bash
# Slack Webhook URLを設定
npx wrangler pages secret put SLACK_WEBHOOK_URL --project-name my-agent-analytics
```

---

## ⚡ 3. パフォーマンス監視

### 3.1 Core Web Vitals監視

**自動監視（Cloudflare Analytics）**:

- **LCP (Largest Contentful Paint)**: 目標 < 2.5秒
- **FID (First Input Delay)**: 目標 < 100ms
- **CLS (Cumulative Layout Shift)**: 目標 < 0.1
- **TTFB (Time to First Byte)**: 目標 < 600ms

**手動チェック**:

```bash
# Lighthouseレポート生成
npx lighthouse https://my-agent-analytics.pages.dev --output html --output-path report.html

# PageSpeed Insights
https://pagespeed.web.dev/analysis?url=https://my-agent-analytics.pages.dev
```

### 3.2 API パフォーマンス監視

**レスポンスタイム目標**:

- **認証API**: < 200ms
- **物件一覧API**: < 300ms
- **AI分析API**: < 2000ms（OpenAI依存）
- **市場データAPI**: < 1000ms（外部API依存）

**監視スクリプト** (`scripts/monitor-api.sh`):

```bash
#!/bin/bash
# APIパフォーマンス監視

BASE_URL="https://my-agent-analytics.pages.dev"
ENDPOINTS=(
  "/api/health"
  "/api/properties"
  "/api/analyses"
)

echo "=== APIパフォーマンステスト ==="
echo "テスト日時: $(date)"
echo ""

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing: $endpoint"
  
  # cURLでレスポンスタイム測定
  time_total=$(curl -o /dev/null -s -w '%{time_total}' "$BASE_URL$endpoint")
  
  echo "  レスポンスタイム: ${time_total}秒"
  
  # 閾値チェック（500ms = 0.5秒）
  if (( $(echo "$time_total > 0.5" | bc -l) )); then
    echo "  ⚠️  警告: レスポンスタイムが500msを超えています"
  else
    echo "  ✅ 正常"
  fi
  echo ""
done
```

### 3.3 バンドルサイズ監視

**現在のバンドルサイズ**: 609.69 KB

**目標**: < 800 KB（Cloudflare Workers 10MB制限の10%未満）

**監視方法**:

```bash
# ビルド時にサイズチェック
npm run build

# バンドルサイズ詳細分析
npx vite-bundle-visualizer

# または
npm install --save-dev rollup-plugin-visualizer
```

---

## 🔒 4. セキュリティ監視

### 4.1 Rate Limit監視

**現在の設定**:

- **API**: 100リクエスト/分
- **AI**: 20リクエスト/分
- **認証**: 10リクエスト/分

**監視項目**:

```bash
# Rate limit違反ログ
npx wrangler pages deployment tail | grep "Rate limit exceeded"

# IPアドレス別違反集計
npx wrangler pages deployment tail --format json | \
  jq 'select(.message | contains("Rate limit")) | .request.headers["cf-connecting-ip"]' | \
  sort | uniq -c | sort -rn
```

### 4.2 認証失敗監視

**監視項目**:

- **ログイン失敗回数**: > 5回/時間で警告
- **無効なトークン**: 頻度が高い場合は調査
- **セッション期限切れ**: 正常範囲内か確認

**ログクエリ**:

```bash
# 認証失敗ログ
npx wrangler pages deployment tail | grep "Authentication failed"

# ログイン失敗が多いIP
npx wrangler pages deployment tail --format json | \
  jq 'select(.message | contains("Authentication failed")) | .request.headers["cf-connecting-ip"]' | \
  sort | uniq -c | sort -rn | head -20
```

### 4.3 DDoS攻撃監視

**Cloudflare自動保護**:

- **Rate Limiting**: 自動適用
- **DDoS Protection**: L3/L4/L7全層で有効
- **WAF (Web Application Firewall)**: 無料プランでは制限あり

**手動確認**:

```bash
# 異常なトラフィックパターン
Cloudflare Dashboard → Security → Events

# 攻撃ログ
Cloudflare Dashboard → Security → Analytics
```

---

## 📊 5. 定期監視タスク

### 5.1 日次タスク（10分）

```bash
# 1. アナリティクス確認
# Cloudflare Dashboard → Analytics
# - ページビュー数
# - エラー率
# - レスポンスタイム

# 2. エラーログ確認
npx wrangler pages deployment tail --format json > daily-logs.json
grep '"level":"error"' daily-logs.json | wc -l

# 3. パフォーマンスチェック
./scripts/monitor-api.sh
```

### 5.2 週次タスク（30分）

```bash
# 1. ログ分析
npx wrangler pages deployment tail --format json > weekly-logs.json
./scripts/analyze-logs.sh weekly-logs.json

# 2. パフォーマンストレンド分析
# - 先週比でレスポンスタイム変化
# - バンドルサイズ変化

# 3. セキュリティレビュー
# - Rate limit違反数
# - 認証失敗数
# - 不審なアクセスパターン
```

### 5.3 月次タスク（1時間）

```bash
# 1. 月次レポート作成
# - MAU（月間アクティブユーザー）
# - 総ページビュー
# - 平均レスポンスタイム
# - エラー率
# - 人気機能ランキング

# 2. Lighthouseレポート
npx lighthouse https://my-agent-analytics.pages.dev \
  --output html --output-path monthly-lighthouse-$(date +%Y%m).html

# 3. コスト分析
# Cloudflare Dashboard → Billing
# - リクエスト数
# - 帯域幅使用量
# - 無料枠の残り
```

---

## 🚨 6. アラート基準

### 6.1 Critical（即座に対応）

| 項目 | 基準 | 対応 |
|------|------|------|
| **サービスダウン** | Health check失敗 | 即座にロールバック |
| **エラー率** | > 10% | 原因調査、緊急修正 |
| **レスポンスタイム** | > 5秒 | パフォーマンス調査 |
| **DDoS攻撃** | トラフィック異常 | Cloudflareダッシュボード確認 |

### 6.2 Warning（24時間以内に対応）

| 項目 | 基準 | 対応 |
|------|------|------|
| **エラー率** | > 5% | ログ分析、修正計画 |
| **レスポンスタイム** | > 1秒 | 最適化検討 |
| **Rate limit違反** | > 100件/日 | IP調査、制限調整 |
| **バンドルサイズ** | > 800KB | コード最適化 |

### 6.3 Info（定期レビューで対応）

| 項目 | 基準 | 対応 |
|------|------|------|
| **トラフィック減少** | > 30%減 | ユーザー調査 |
| **新機能利用率** | < 10% | UI改善検討 |
| **モバイル利用率** | 変化あり | レスポンシブ調整 |

---

## 📝 7. ログ保存とバックアップ

### 7.1 ログ保存戦略

```bash
# 日次ログバックアップ（cron設定）
0 2 * * * cd /home/user/webapp && npx wrangler pages deployment tail --format json > /backups/logs/$(date +\%Y\%m\%d)-logs.json

# 週次ログ圧縮
0 3 * * 0 cd /backups/logs && tar -czf weekly-$(date +\%Y\%W).tar.gz $(date +\%Y\%m)*-logs.json && rm $(date +\%Y\%m)*-logs.json

# 月次ログアーカイブ（S3/R2へアップロード）
0 4 1 * * cd /backups/logs && npx wrangler r2 object put my-agent-analytics-logs/monthly-$(date +\%Y\%m).tar.gz --file=weekly-*.tar.gz
```

### 7.2 保存期間

- **リアルタイムログ**: Cloudflareで24時間
- **日次バックアップ**: ローカル7日間
- **週次アーカイブ**: ローカル4週間
- **月次アーカイブ**: R2に1年間

---

## 🎯 8. 監視ダッシュボード構築（オプション）

### 8.1 Grafana + Prometheus

**推奨構成**（将来の拡張用）:

```yaml
# docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 8.2 カスタムダッシュボード

**主要メトリクス**:

1. **リクエスト数/秒**: リアルタイムグラフ
2. **エラー率**: 時系列グラフ
3. **P50/P95/P99レスポンスタイム**: パーセンタイルグラフ
4. **アクティブユーザー数**: ゲージ
5. **API別リクエスト分布**: 円グラフ

---

## 📚 9. まとめ

### 9.1 監視チェックリスト

- [ ] Cloudflare Analytics有効化
- [ ] エラーログ監視スクリプト設定
- [ ] Slack通知設定（オプション）
- [ ] 日次/週次/月次タスクのスケジュール設定
- [ ] アラート基準の文書化
- [ ] ログバックアップの自動化

### 9.2 関連ドキュメント

- [運用ガイド](./OPERATIONS_MANUAL_GUIDE.md) - 日常運用手順
- [エラー対処法](./OPERATIONS_MANUAL_ERROR_HANDLING.md) - エラー解決手順
- [システム仕様書](./OPERATIONS_MANUAL_SPECIFICATIONS.md) - 技術仕様

### 9.3 サポート

**問題が発生した場合**:

1. [エラー対処法](./OPERATIONS_MANUAL_ERROR_HANDLING.md)を参照
2. Cloudflare Supportに連絡: https://support.cloudflare.com/
3. GitHub Issueを作成: （プロジェクトURL）

---

**ドキュメントバージョン**: 1.0.0  
**最終更新**: 2025年11月4日  
**作成者**: My Agent Analytics Team
