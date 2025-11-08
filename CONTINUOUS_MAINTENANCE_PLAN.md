# 継続的なテストとメンテナンス計画

**作成日**: 2025年11月8日  
**目的**: アプリケーションの品質を長期的に維持し、継続的な改善を実現する

---

## 🎯 継続的メンテナンスの原則

1. **テストファーストアプローチ**: 全ての変更前にテストを実行
2. **定期的な監査**: 週次/月次でシステム全体をレビュー
3. **ドキュメント更新**: コード変更時に必ずドキュメントを更新
4. **段階的リリース**: 大規模変更は段階的にリリース

---

## 📅 定期メンテナンススケジュール

### 🔴 毎日（Daily）

#### 1. モーニングチェック（10分）
```bash
# 本番環境ヘルスチェック
curl -s https://36190686.my-agent-analytics.pages.dev/api/health | jq .

# エラーログ確認（Cloudflare Dashboard）
# - 500エラーがないか
# - レスポンスタイムが正常か（< 100ms）
```

#### 2. テスト実行（開発時のみ、5分）
```bash
cd /home/user/webapp
npm test
# 期待結果: 28/28 (100%)
```

---

### 🟡 毎週（Weekly）

#### 1. 包括的テストと監査（30分 - 毎週月曜日）
```bash
# 1. 全テスト実行
cd /home/user/webapp
npm test

# 2. ビルドサイズチェック
npm run build
# 期待値: < 611KB（現在値を維持）

# 3. 依存関係の脆弱性チェック
npm audit
npm audit fix

# 4. Git状態確認
git status
git log --oneline -5
```

#### 2. パフォーマンステスト（20分 - 毎週水曜日）
- Lighthouse スコア確認:
  - Performance: > 90
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90
- LCP (Largest Contentful Paint): < 2.5秒
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

#### 3. セキュリティチェック（15分 - 毎週金曜日）
```bash
# APIキーの有効期限確認
npx wrangler pages secret list --project-name my-agent-analytics

# Cookie設定の確認
# - HttpOnly: ✓
# - Secure: ✓
# - SameSite: Lax/Strict

# CORS設定の確認
curl -H "Origin: https://malicious.com" \
  https://36190686.my-agent-analytics.pages.dev/api/health -v
# 期待: CORS errorまたは適切な制限
```

---

### 🟢 毎月（Monthly）

#### 1. 包括的コードレビュー（2時間 - 毎月1日）
- [ ] 新規追加コードの品質確認
- [ ] テストカバレッジの確認（28/28維持）
- [ ] 不要なコードの削除（デッドコード検出）
- [ ] リファクタリング候補の特定

#### 2. データベース保守（1時間 - 毎月10日）
```bash
# ローカルD1データベースのバックアップ
cd /home/user/webapp
npm run db:backup  # 要実装

# 本番D1データベースの統計確認
npx wrangler d1 execute webapp-production --command="
  SELECT 
    COUNT(*) as total_properties,
    COUNT(DISTINCT user_id) as total_users
  FROM properties
"

# テーブルサイズ確認
npx wrangler d1 execute webapp-production --command="
  SELECT 
    name, 
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table') as table_count
  FROM sqlite_master 
  WHERE type='table'
"
```

#### 3. ドキュメント更新（1時間 - 毎月15日）
- [ ] README.md の最新化
- [ ] KNOWN_ISSUES.md の更新
- [ ] API仕様書の見直し
- [ ] ユーザーマニュアルの改善

#### 4. 依存関係の更新（1時間 - 毎月20日）
```bash
# 依存関係の確認
npm outdated

# マイナーバージョンアップ
npm update

# メジャーバージョンアップ（慎重に）
# 1つずつテストしながら更新
npm install hono@latest
npm test  # 必ずテスト実行
```

---

## 🧪 テスト戦略

### 1. ユニットテスト（10個）
**実行頻度**: コード変更時、毎日
```bash
npm run test:unit
```

**対象**:
- 財務計算ロジック（NOI, 利回り, DSCR, LTV）
- データ変換関数（千円単位変換、年間賃料の月額変換）
- バリデーション（築年数範囲チェック、異常値検出）

**期待結果**: 10/10 (100%)

---

### 2. インテグレーションテスト（18個）
**実行頻度**: デプロイ前、毎週
```bash
npm run test:integration
```

**対象**:
- API エンドポイント（health, properties, market, ai）
- UI 画面（login, dashboard, properties, help）
- データベース接続（properties, agents）
- 認証フロー（password, logout）
- 外部API統合（Itandi BB, 実需用評価, Stigma Check）

**期待結果**: 18/18 (100%)

---

### 3. E2Eテスト（将来的に導入）
**実行頻度**: リリース前
**ツール**: Playwright / Cypress

**対象シナリオ**:
1. ユーザー登録 → ログイン → 物件登録 → レポート閲覧
2. OCR機能でPDFアップロード → データ抽出 → 物件保存
3. 統合レポート生成 → PDF出力 → ダウンロード

---

## 🚨 インシデント対応プロトコル

### レベル1: クリティカル（即座対応）
**定義**: 本番環境が完全に停止、全ユーザーに影響

**対応手順**:
1. **即座に状況確認**:
   ```bash
   curl -s https://36190686.my-agent-analytics.pages.dev/api/health
   ```

2. **Cloudflare Dashboard確認**:
   - Pagesデプロイメント状態
   - エラーログの確認

3. **ロールバック実行**（5分以内）:
   ```bash
   # 前回の正常デプロイに戻す
   npx wrangler pages deployment list --project-name my-agent-analytics
   # 前回デプロイIDをコピーして再デプロイ
   ```

4. **原因調査と恒久対策**:
   - エラーログ分析
   - CRITICAL_ERRORS.mdに記録
   - 再発防止策の実施

---

### レベル2: 重大（1時間以内対応）
**定義**: 特定機能が使用不可、一部ユーザーに影響

**対応手順**:
1. **影響範囲の特定**:
   - どの機能が影響を受けているか
   - 何人のユーザーに影響があるか

2. **一時的な回避策**:
   - 該当機能の無効化
   - ユーザーへの告知

3. **修正とテスト**:
   ```bash
   # 修正実施
   # 必ずテスト実行
   npm test
   # 成功確認後デプロイ
   npm run deploy:prod
   ```

---

### レベル3: 軽微（1営業日以内対応）
**定義**: UI表示の乱れ、パフォーマンス低下

**対応手順**:
1. **KNOWN_ISSUES.mdに記録**
2. **次回メンテナンスウィンドウで修正**
3. **ユーザーフィードバック収集**

---

## 📊 品質メトリクス

### 必須メトリクス（毎週確認）
| メトリクス | 目標値 | 現在値 | 確認方法 |
|----------|-------|-------|---------|
| テスト成功率 | 100% | 28/28 | `npm test` |
| ビルドサイズ | < 611KB | 611KB | `npm run build` |
| ヘルスチェック | 200 OK | ✓ | `curl /api/health` |
| レスポンスタイム | < 100ms | - | Cloudflare Analytics |
| エラー率 | < 1% | - | Cloudflare Analytics |

---

## 🔄 バージョン管理戦略

### ブランチ戦略
```
main (本番環境)
  ├── develop (開発環境)
  │   ├── feature/xxx (機能開発)
  │   ├── bugfix/xxx (バグ修正)
  │   └── hotfix/xxx (緊急修正)
```

### リリースフロー
1. **feature/xxx** ブランチで開発
2. **develop** ブランチにマージ前に必ずテスト実行
3. **main** ブランチへのマージ前に再度テスト実行
4. **main** ブランチへのマージ後、自動デプロイ（Phase 3でCI/CD導入後）

---

## 📝 定期報告

### 週次レポート（毎週金曜日）
- テスト結果サマリー（28/28状況）
- 発生したインシデント（あれば）
- パフォーマンスメトリクス
- 次週の予定

### 月次レポート（毎月末）
- 全体的な品質状況
- 改善提案
- 技術的負債の状況
- 次月の重点項目

---

## 🎯 成功基準

1. **稼働率**: 99.9%以上（月間ダウンタイム < 43分）
2. **テスト成功率**: 100%維持（28/28）
3. **セキュリティインシデント**: ゼロ
4. **ユーザー満足度**: 高（フィードバック収集）
5. **パフォーマンス**: Lighthouse スコア > 90

---

**このドキュメントは生きたドキュメントです。定期的に見直し、改善してください。**
