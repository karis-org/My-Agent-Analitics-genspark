# My Agent Analytics - モニタリング設定ガイド

## 📊 Cloudflare Analytics（標準）

### アクセス方法
1. Cloudflare Dashboard: https://dash.cloudflare.com/
2. Pages > my-agent-analytics > Analytics

### 利用可能なメトリクス
- **リクエスト数**: 日次/週次/月次
- **帯域幅使用量**: データ転送量
- **エラーレート**: 4xx/5xx エラー統計
- **レスポンスタイム**: P50/P95/P99
- **地理的分布**: 国別アクセス統計

## 🎯 推奨モニタリング項目

### 1. 可用性モニタリング
```bash
# 定期的なヘルスチェック（cron jobで実行）
*/5 * * * * curl -s https://ad43ed29.my-agent-analytics.pages.dev/api/health
```

### 2. パフォーマンスモニタリング
- **目標値**: 
  - レスポンスタイム < 200ms (P95)
  - エラーレート < 0.1%
  - 可用性 > 99.9%

### 3. セキュリティモニタリング
- 異常なアクセスパターン
- DDoS攻撃の兆候
- 認証失敗の急増

## 🔔 アラート設定（推奨）

### Cloudflare Workers Analytics
- エラーレート > 1%
- レスポンスタイム > 500ms
- CPU使用率 > 80%

### 外部モニタリングツール（オプション）

#### 1. UptimeRobot（無料プラン）
- URL: https://uptimerobot.com/
- 5分間隔でヘルスチェック
- メール/SMS通知

#### 2. Pingdom（有料）
- URL: https://www.pingdom.com/
- 1分間隔モニタリング
- 詳細なレポート

#### 3. Better Uptime（無料プラン）
- URL: https://betteruptime.com/
- Incident management
- Status page

## 📈 ログ管理

### Cloudflare Workers Logs
```bash
# リアルタイムログ表示（開発用）
npx wrangler pages deployment tail

# 過去のログ確認
# Cloudflare Dashboard > Workers > Logs
```

### カスタムログ実装
- アクティビティログテーブル（実装済み）
- エラーログテーブル（今後実装）
- アクセスログテーブル（今後実装）

## 🎯 モニタリングダッシュボード

### 現在利用可能
1. **Cloudflare Analytics**: 標準装備
2. **D1 Database Console**: データベース監視
3. **Workers Analytics**: CPU/メモリ使用率

### 今後の実装予定
1. カスタムダッシュボード（/admin/monitoring）
2. リアルタイムアラート
3. カスタムメトリクス収集

## 📝 定期チェックリスト

### 毎日
- [ ] ヘルスチェック実行
- [ ] エラーログ確認
- [ ] パフォーマンス指標確認

### 毎週
- [ ] トラフィック統計レビュー
- [ ] セキュリティログ確認
- [ ] データベースサイズ確認

### 毎月
- [ ] パフォーマンス分析レポート作成
- [ ] コスト分析
- [ ] 最適化機会の特定

## 🚨 インシデント対応

### 緊急度: 高
- サイトダウン（5分以上）
- データベース障害
- セキュリティ侵害

### 対応手順
1. Cloudflare Status確認
2. Workers Logs確認
3. ロールバック検討
4. インシデントレポート作成

## 📞 サポート

### Cloudflare Community
- Forum: https://community.cloudflare.com/
- Discord: Cloudflare Developers

### ドキュメント
- Workers: https://developers.cloudflare.com/workers/
- Pages: https://developers.cloudflare.com/pages/
- D1: https://developers.cloudflare.com/d1/

---

**作成日**: 2025-11-08  
**最終更新**: 2025-11-08
