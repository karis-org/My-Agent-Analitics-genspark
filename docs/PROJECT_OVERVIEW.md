# My Agent Analytics - プロジェクト概要

## イントロダクション

**My Agent Analytics**は、不動産業界向けのデータ分析・自動レポート生成ツールです。不動産エージェントが物件データをアップロードし、政府統計データ（e-Stat）と組み合わせて、包括的な市場分析レポートを自動生成します。

## プロジェクト構成

My Agent Analyticsは、以下の大きなエコシステムの一部です：

- **My Agent Assistant** - メインのAIアシスタント（チャットインターフェース）
- **My Agent PRO** - プロフェッショナル向け機能
- **My Agent Analytics** - データ分析・レポート生成（本プロジェクト）
- **宅建BOOST** - 宅建試験対策サービス

## 主な機能

### 実装済み機能

1. **Google OAuth認証**
   - NextAuth.jsを使用した安全な認証システム
   - Google アカウントでのログイン

2. **物件評価フロー**
   - 物件情報入力フォーム
   - PDFアップロード機能
   - NOI（純営業利益）計算
   - 利回り計算（表面利回り・実質利回り）
   - DSCR（債務返済カバー率）計算
   - LTV（ローン・トゥ・バリュー）計算

3. **データ可視化**
   - 月次キャッシュフローグラフ
   - 投資指標のバッジ表示
   - インタラクティブなチャート

4. **PDFレポート生成**
   - html2canvas + jsPDF による日本語対応PDF出力
   - Noto Sans JPフォント使用
   - 分析結果の自動レイアウト

5. **PWA対応**
   - オフライン機能
   - ホーム画面へのインストール
   - Service Worker実装済み

6. **役所調査支援**
   - 都市計画情報の自動取得
   - ハザードマップ情報の統合
   - 建築制限の確認

### 未実装機能（今後のロードマップ）

1. **データソース統合**
   - e-Stat API（政府統計）の完全統合
   - Google Sheets連携
   - REINS（不動産流通標準情報システム）データ統合

2. **高度な分析機能**
   - OpenAI APIを使用したAI分析
   - 感度分析
   - 比較分析機能

3. **レポートテンプレート**
   - カスタマイズ可能なレポート形式
   - 標準化されたPDF/HTMLテンプレート

4. **通知システム**
   - Slack/LINE通知
   - レポート完成時の自動通知

5. **データ共有・コラボレーション**
   - チームでのレポート共有
   - コメント機能

## 技術スタック

### 現在の構成（Next.js版）

- **フレームワーク**: Next.js 14
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **認証**: NextAuth.js (Google Provider)
- **PWA**: next-pwa
- **PDF生成**: html2canvas + jsPDF
- **テスト**: Playwright
- **CI/CD**: GitHub Actions

### 移行先の構成（Cloudflare Pages版）

- **フレームワーク**: Hono (Cloudflare Workers)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS (CDN)
- **認証**: Cloudflare Workers OAuth
- **データベース**: Cloudflare D1 (SQLite)
- **ストレージ**: Cloudflare R2
- **キャッシュ**: Cloudflare KV
- **デプロイ**: Wrangler CLI

## データモデル

### 物件情報

```typescript
interface PropertyData {
  // 基本情報
  price: number;              // 物件価格
  location: string;           // 所在地
  structure: string;          // 構造（RC造、木造など）
  totalFloorArea: number;     // 延床面積
  age: number;                // 築年数
  distanceFromStation: number; // 駅距離
  hasElevator: boolean;       // エレベーター有無
  
  // 収益情報
  averageRent: number;        // 平均賃料
  units: number;              // 戸数
  occupancyRate: number;      // 稼働率
  grossIncome: number;        // 満室想定収入
  effectiveIncome: number;    // 実収入
  
  // 運営費
  managementFee: number;      // 管理費
  repairCost: number;         // 修繕費
  propertyTax: number;        // 固定資産税
  insurance: number;          // 保険料
  otherExpenses: number;      // その他費用
  
  // 投資条件
  useLoan: boolean;           // ローン利用
  loanAmount: number;         // 借入額
  interestRate: number;       // 金利
  loanTerm: number;           // 期間
  
  // 市場情報
  vacancyRate: number;        // エリア空室率
  averageAreaRent: number;    // エリア平均賃料
  populationTrend: string;    // 人口動態
}
```

### 計算指標

```typescript
interface AnalysisMetrics {
  noi: number;                // 純営業利益
  grossYield: number;         // 表面利回り
  netYield: number;           // 実質利回り
  dscr: number;               // 債務返済カバー率
  ltv: number;                // ローン・トゥ・バリュー
  monthlyCashFlow: number[];  // 月次キャッシュフロー
  annualReturn: number;       // 年間リターン
}
```

## API統合

### e-Stat API（政府統計）

- **用途**: 人口統計、経済指標、地域データ
- **エンドポイント**: https://api.e-stat.go.jp/
- **必要な資格情報**: ESTAT_API_KEY

### Google Sheets API

- **用途**: データ入出力、レポート保存
- **必要な資格情報**: GOOGLE_SHEETS_API_KEY, GOOGLE_SHEETS_SPREADSHEET_ID

### OpenAI API

- **用途**: AI分析、自然言語処理
- **必要な資格情報**: OPENAI_API_KEY

## デプロイ環境

### 開発環境（DEV）
- **URL**: https://dev.your-app.com/
- **用途**: 開発・機能テスト
- **App ID**: a578fd0981fac20319ceeaf14aba5fe5a68487ae

### ステージング環境（STG）
- **URL**: https://stg.your-app.com/
- **用途**: 本番リリース前の最終検証
- **App ID**: 69b1befb356031a1b72e1ade9151548278648ed5

### 本番環境（PROD）
- **URL**: https://analyze.myagent.jp/
- **用途**: エンドユーザー向け本番環境
- **App ID**: e8ee4b4e6337f05bd7a96f84ec624a0022477acf

## ディレクトリ構造

```
webapp/
├── docs/                   # ドキュメント
│   ├── PROJECT_OVERVIEW.md
│   ├── MIGRATION_PLAN.md
│   └── API_DOCUMENTATION.md
├── src/                    # Honoアプリケーション（新規）
│   ├── index.tsx          # メインエントリーポイント
│   ├── routes/            # APIルート
│   └── types/             # TypeScript型定義
├── public/                # 静的ファイル
│   ├── icons/             # PWAアイコン
│   └── static/            # その他の静的アセット
├── migrations/            # D1データベースマイグレーション
├── wrangler.jsonc         # Cloudflare設定
├── package.json
└── README.md
```

## セキュリティ考慮事項

1. **API Key管理**
   - すべてのAPIキーはCloudflare Secretsで管理
   - `.dev.vars`は`.gitignore`に追加
   - 本番環境では`wrangler secret put`を使用

2. **認証**
   - セッションベース認証
   - CSRF保護
   - レート制限

3. **データ保護**
   - 個人情報の暗号化
   - HTTPS強制
   - 適切なCORS設定

## パフォーマンス目標

- **初回表示**: 2秒以内
- **API応答時間**: 500ms以内
- **PDF生成**: 5秒以内
- **Lighthouse スコア**: 90点以上（全カテゴリ）

## 次のステップ

1. ✅ 元のNext.jsコードをGitHubに保存
2. 🔄 Hono + TypeScriptでCloudflare Pages版を構築
3. ⏳ D1データベースのスキーマ設計
4. ⏳ 認証システムの実装
5. ⏳ コア機能の移行
6. ⏳ テストとデプロイ

## 参考資料

- [My Agent Analytics 元のリポジトリ](https://github.com/koki-187/My-Agent-analytics)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Hono フレームワーク](https://hono.dev/)
- [e-Stat API](https://www.e-stat.go.jp/api/)
