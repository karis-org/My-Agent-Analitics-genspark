# Phase 4 計画書

**作成日**: 2025年11月8日  
**バージョン**: 1.0.0  
**プロジェクト**: My Agent Analytics

---

## 📋 Phase 4 概要

Phase 3（パフォーマンス最適化、モバイル最適化、セキュリティ監査、ドキュメント整備、CI/CD導入）が完了し、プロジェクトは本番運用可能な状態になりました。

Phase 4では、**ユーザー体験の向上**と**機能拡張**に焦点を当てます。

---

## 🎯 Phase 4 目標

### 主要目標
1. **データ可視化の強化** - より直感的なデータ表示
2. **ユーザーエクスペリエンスの向上** - 使いやすさの改善
3. **新機能の追加** - ユーザーからのフィードバックに基づく機能追加
4. **パフォーマンスの継続的改善** - さらなる高速化

### 成功指標
- ユーザー満足度の向上
- ページ読み込み時間の短縮（< 0.5秒）
- モバイルユーザーの増加
- 新機能の利用率

---

## 🗂️ Phase 4 タスク分類

### Phase 4-1: データ可視化強化（優先度: 高）

#### 目標
Chart.jsを活用した高度なデータ可視化機能の実装

#### タスク
1. **インタラクティブチャートの実装** (3-4時間)
   - 現状: 静的なChart.jsグラフ
   - 改善: ホバー時の詳細情報表示、ズーム機能
   - ファイル: `src/routes/properties.tsx`（統合レポート）
   - 技術: Chart.js plugins（zoom, datalabels）

2. **ダッシュボードグラフの追加** (2-3時間)
   - 現状: 数値のみ表示
   - 改善: 物件別利回り比較グラフ、時系列トレンドグラフ
   - ファイル: `src/routes/dashboard.tsx`
   - 技術: Chart.js Bar Chart, Line Chart

3. **物件比較機能** (4-5時間)
   - 現状: 個別物件のみ分析可能
   - 改善: 複数物件の並列比較（利回り、NOI、DSCR等）
   - ファイル: 新規 `src/routes/comparison.tsx`
   - 技術: Chart.js Radar Chart, Bar Chart

4. **エクスポート機能の強化** (2-3時間)
   - 現状: 印刷のみ対応
   - 改善: Excel/CSV/PDFエクスポート
   - ファイル: `src/lib/export-utils.ts`（新規）
   - 技術: SheetJS（xlsx）, jsPDF

**想定時間**: 11-15時間

---

### Phase 4-2: UX改善（優先度: 高）

#### 目標
ユーザーの使いやすさを大幅に向上させる

#### タスク
1. **オンボーディング機能** (3-4時間)
   - 新規ユーザー向けチュートリアル
   - 各機能の使い方ガイド（インタラクティブツアー）
   - ファイル: `src/components/onboarding.tsx`（新規）
   - 技術: Intro.js または独自実装

2. **通知システム** (2-3時間)
   - 分析完了時の通知
   - エラー時のユーザーフレンドリーなメッセージ
   - ファイル: `src/components/notifications.tsx`（新規）
   - 技術: Toast notifications（react-hot-toast風）

3. **検索・フィルター機能の強化** (3-4時間)
   - 物件一覧の高度なフィルタリング
   - 利回り範囲、価格範囲、構造タイプなど
   - ファイル: `src/routes/properties.tsx`
   - 技術: URLパラメータ、クエリビルダー

4. **お気に入り機能** (2-3時間)
   - 物件をお気に入り登録
   - お気に入り一覧表示
   - ファイル: Migration 0011（新規）, `src/routes/favorites.tsx`（新規）
   - データベース: `favorites` テーブル追加

**想定時間**: 10-14時間

---

### Phase 4-3: 新機能追加（優先度: 中）

#### 目標
ユーザーからのフィードバックに基づく新機能の実装

#### タスク
1. **ポートフォリオ管理** (4-5時間)
   - 複数物件を1つのポートフォリオとして管理
   - ポートフォリオ全体の利回り計算
   - ファイル: Migration 0012（新規）, `src/routes/portfolio.tsx`（新規）
   - データベース: `portfolios` テーブル、`portfolio_properties` テーブル

2. **ローン返済シミュレーション** (3-4時間)
   - 月次返済額の詳細シミュレーション
   - 繰上返済のシミュレーション
   - ファイル: `src/lib/loan-simulator.ts`（新規）, `src/routes/loan-simulator.tsx`（新規）
   - 技術: 財務計算ライブラリ

3. **税金計算機能** (3-4時間)
   - 固定資産税、都市計画税の概算計算
   - 不動産取得税の概算計算
   - ファイル: `src/lib/tax-calculator.ts`（新規）
   - 技術: 税率データベース

4. **リスク評価の詳細化** (2-3時間)
   - 現状: DSCR、LTV、BERのみ
   - 改善: 空室リスク、金利上昇リスク、修繕リスクの定量評価
   - ファイル: `src/lib/risk-assessment.ts`（新規）
   - 技術: Monte Carlo Simulation（簡易版）

**想定時間**: 12-16時間

---

### Phase 4-4: パフォーマンス最適化（優先度: 中）

#### 目標
さらなる高速化とユーザー体験の向上

#### タスク
1. **画像最適化** (2-3時間)
   - ロゴ・アイコンのWebP変換
   - レスポンシブ画像の実装
   - ファイル: `public/static/icons/` 配下
   - 技術: WebP変換ツール

2. **コード分割** (3-4時間)
   - 現状: 単一バンドル（612KB）
   - 改善: ルートベースのコード分割
   - ファイル: `vite.config.ts`
   - 技術: Vite dynamic imports

3. **Service Worker強化** (2-3時間)
   - オフライン対応の改善
   - キャッシュ戦略の最適化
   - ファイル: `public/sw.js`
   - 技術: Workbox（検討）

4. **データベースクエリ最適化** (2-3時間)
   - N+1問題の解決
   - インデックスの追加
   - ファイル: Migration 0013（新規）, `src/routes/api.tsx`
   - 技術: SQL EXPLAIN分析

**想定時間**: 9-13時間

---

### Phase 4-5: E2Eテストと品質保証（優先度: 低）

#### 目標
自動テストカバレッジのさらなる向上

#### タスク
1. **Playwright E2Eテスト導入** (4-5時間)
   - ユーザーフロー全体の自動テスト
   - ファイル: `e2e/` ディレクトリ（新規）
   - 技術: Playwright

2. **ビジュアルリグレッションテスト** (3-4時間)
   - UI変更の自動検出
   - ファイル: `e2e/visual/` ディレクトリ（新規）
   - 技術: Playwright Screenshots

3. **パフォーマンステスト** (2-3時間)
   - Lighthouse CI統合
   - Core Web Vitals監視
   - ファイル: `.github/workflows/performance.yml`（新規）
   - 技術: Lighthouse CI

**想定時間**: 9-12時間

---

## 📅 Phase 4 スケジュール

### 推奨実施順序

#### Week 1: Phase 4-1 データ可視化強化
- **Day 1-2**: インタラクティブチャートの実装
- **Day 3**: ダッシュボードグラフの追加
- **Day 4-5**: 物件比較機能
- **Day 6**: エクスポート機能の強化

#### Week 2: Phase 4-2 UX改善
- **Day 1-2**: オンボーディング機能
- **Day 3**: 通知システム
- **Day 4-5**: 検索・フィルター機能の強化
- **Day 6**: お気に入り機能

#### Week 3: Phase 4-3 新機能追加
- **Day 1-2**: ポートフォリオ管理
- **Day 3-4**: ローン返済シミュレーション
- **Day 5**: 税金計算機能
- **Day 6**: リスク評価の詳細化

#### Week 4: Phase 4-4 & 4-5 最適化とテスト
- **Day 1-2**: パフォーマンス最適化
- **Day 3-4**: E2Eテスト導入
- **Day 5**: 統合とデバッグ
- **Day 6**: ドキュメント更新とリリース

**総想定時間**: 51-70時間（約4週間）

---

## 🔧 技術選定

### 新規導入予定のライブラリ

#### データ可視化
- **Chart.js plugins**:
  - `chartjs-plugin-zoom`: ズーム機能
  - `chartjs-plugin-datalabels`: データラベル表示
  - CDN: https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom

#### データエクスポート
- **SheetJS (xlsx)**: Excel/CSVエクスポート
  - CDN: https://cdn.jsdelivr.net/npm/xlsx
- **jsPDF**: PDFエクスポート
  - CDN: https://cdn.jsdelivr.net/npm/jspdf

#### UX改善
- **Intro.js**: オンボーディングツアー
  - CDN: https://cdn.jsdelivr.net/npm/intro.js
- **Toast Notifications**: カスタム実装（ライブラリ不要）

#### テスト
- **Playwright**: E2Eテスト
  - インストール: `npm install -D @playwright/test`
- **Lighthouse CI**: パフォーマンステスト
  - インストール: `npm install -D @lhci/cli`

---

## 📊 優先度マトリックス

### 高優先度（すぐに実施すべき）
- ✅ Phase 4-1: データ可視化強化
- ✅ Phase 4-2: UX改善

### 中優先度（余裕があれば実施）
- ⚠️ Phase 4-3: 新機能追加
- ⚠️ Phase 4-4: パフォーマンス最適化

### 低優先度（必要に応じて実施）
- ⏳ Phase 4-5: E2Eテストと品質保証

---

## 🎯 Phase 4 成功の定義

### 必須達成項目
- [ ] インタラクティブチャートの実装（Phase 4-1）
- [ ] オンボーディング機能の実装（Phase 4-2）
- [ ] 検索・フィルター機能の強化（Phase 4-2）
- [ ] 全テスト28/28合格維持

### オプション達成項目
- [ ] 物件比較機能の実装（Phase 4-1）
- [ ] ポートフォリオ管理の実装（Phase 4-3）
- [ ] E2Eテストカバレッジ70%以上（Phase 4-5）

---

## 📝 次のセッションへの推奨事項

### Session 16で実施すべきこと
1. **Phase 4-1の開始**: インタラクティブチャートの実装
2. **ユーザーフィードバックの収集**: 現在の機能に対する評価
3. **Phase 3完了の確認**: GitHub Actions手動設定の完了確認

### 準備が必要なこと
- Chart.js pluginsの調査
- SheetJSのAPI確認
- Intro.jsのドキュメント確認

---

## 🔗 関連ドキュメント

- **Phase 3完了レポート**: `HANDOFF_SESSION_15.md`
- **API仕様書**: `docs/API_SPECIFICATION.md`
- **ユーザーマニュアル**: `docs/USER_MANUAL.md`
- **GitHub Actions セットアップ**: `docs/GITHUB_ACTIONS_SETUP.md`

---

## 📞 フィードバック

Phase 4の計画について質問や提案がある場合は、GitHubのIssueを作成してください:
https://github.com/karis-org/My-Agent-Analitics-genspark/issues

---

**作成者**: Claude (Anthropic) - Session 15  
**最終更新**: 2025年11月8日  
**バージョン**: 1.0.0
