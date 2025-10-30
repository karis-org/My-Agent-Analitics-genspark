# My Agent Analytics

**AIを活用した不動産投資分析プラットフォーム**

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://pages.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Framework-Hono-blue)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🎯 プロジェクト概要

My Agent Analyticsは、不動産エージェントと投資家向けの包括的なデータ分析・レポート生成ツールです。物件データをアップロードするだけで、AIと政府統計データ（e-Stat）を活用した詳細な市場分析レポートを自動生成します。

### 🌟 主な特徴

- **📊 自動計算**: NOI、利回り、DSCR、LTVなどの投資指標を自動算出
- **📈 実データ分析**: 国土交通省の実取引価格データで市場動向を分析
- **🏢 価格推定**: 周辺取引事例から物件価格を自動推定
- **📄 PDFレポート**: プロフェッショナルなPDFレポートを生成
- **🏘️ 地価公示データ**: 最新5年分の鑑定評価書情報を活用
- **🤖 AI分析**: OpenAI GPT-4による高度な市場分析（実装予定）
- **📱 PWA対応**: スマートフォンにインストール可能、オフライン機能搭載

## 🚀 デモ

**Sandbox環境**: [https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai](https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai)

**GitHub リポジトリ**: [https://github.com/koki-187/My-Agent-Analitics-genspark](https://github.com/koki-187/My-Agent-Analitics-genspark)

**元のNext.jsリポジトリ**: [https://github.com/koki-187/My-Agent-analytics](https://github.com/koki-187/My-Agent-analytics)

## 📋 現在の実装状況

### ✅ 実装済み機能

#### Phase 1: 基盤構築
- [x] Hono フレームワークによるバックエンド
- [x] レスポンシブなランディングページ
- [x] API ヘルスチェック
- [x] PWA マニフェスト
- [x] Service Worker（オフライン対応）
- [x] 静的ファイル配信
- [x] TypeScript 完全対応
- [x] Vite ビルドシステム

#### Phase 2: 認証システム
- [x] Google OAuth 認証フロー
- [x] セッション管理（Cookie-based）
- [x] 認証ミドルウェア
- [x] ログイン/ログアウト機能
- [x] ユーザー管理
- [x] **設定ページ** - APIキー設定状況の可視化 🆕

#### Phase 3: データベース統合
- [x] Cloudflare D1 データベース
- [x] データベーススキーマ設計（7テーブル）
- [x] マイグレーション管理
- [x] CRUD操作ライブラリ
- [x] セッション管理テーブル

#### Phase 4: 投資指標計算
- [x] **投資指標計算エンジン**
  - NOI（純営業利益）
  - 表面利回り/実質利回り
  - DSCR（債務償還カバー率）
  - LTV（ローン対物件価値比率）
  - CCR（キャッシュ・オン・キャッシュ・リターン）
  - BER（損益分岐点比率）
  - リスク評価とレコメンデーション

#### Phase 5: 不動産情報ライブラリAPI統合 🆕
- [x] **国土交通省 不動産情報ライブラリAPI**
  - 不動産取引価格情報取得（2005年～）
  - 地価公示・鑑定評価書情報（2021～2025年）
  - 市区町村一覧取得
  - 市場動向分析（価格トレンド、取引件数）
  - 周辺取引事例検索（類似物件検索）
  - 価格推定機能（実取引データベース）

- [x] **市場分析API エンドポイント**
  - POST `/api/market/analyze` - 市場動向分析
  - GET `/api/market/trade-prices` - 取引価格情報取得
  - GET `/api/market/land-prices` - 地価公示データ取得
  - GET `/api/market/municipalities` - 市区町村一覧取得
  - POST `/api/market/comparables` - 周辺取引事例検索
  - POST `/api/market/estimate-price` - 物件価格推定

- [x] **物件管理API エンドポイント**
  - POST `/api/properties/analyze` - 財務分析
  - GET `/api/properties` - 物件一覧取得
  - GET `/api/properties/:id` - 物件詳細取得

### 🔄 実装中

- [ ] データ可視化（グラフ・チャート）
- [ ] PDF レポート生成
- [ ] イタンジAPI統合
- [ ] レインズデータ統合

### 📝 今後の実装予定

- [ ] e-Stat API 統合（人口統計、経済指標）
- [ ] OpenAI GPT-4 統合（AI市場分析）
- [ ] 物件比較機能
- [ ] 投資シミュレーション
- [ ] OpenAI API 統合（AI分析）
- [ ] レポート共有機能
- [ ] 複数物件の比較機能

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: Hono (Cloudflare Workers)
- **スタイリング**: Tailwind CSS (CDN)
- **アイコン**: Font Awesome
- **フォント**: Noto Sans JP

### バックエンド
- **ランタイム**: Cloudflare Workers
- **API**: Hono REST API
- **データベース**: Cloudflare D1 (SQLite)
- **ストレージ**: Cloudflare R2
- **キャッシュ**: Cloudflare KV

### 開発ツール
- **言語**: TypeScript 5.0
- **ビルド**: Vite
- **デプロイ**: Wrangler CLI
- **プロセス管理**: PM2 (開発環境)

## 📦 インストール

### 必要要件

- Node.js 18.x 以上
- npm または yarn
- Cloudflare アカウント（デプロイ用）

### セットアップ手順

1. **リポジトリをクローン**

```bash
git clone https://github.com/koki-187/My-Agent-Analitics-genspark.git
cd My-Agent-Analitics-genspark
```

2. **依存関係をインストール**

```bash
npm install
```

3. **環境変数を設定**

⚠️ **重要**: APIキーの設定が必要です

```bash
# APIキー設定状況を確認
bash check-api-keys.sh

# .dev.vars ファイルを編集
# 詳細な設定方法は API_KEY_SETUP.md を参照
```

**必須APIキー:**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - ログイン機能
- `REINFOLIB_API_KEY` - 市場分析機能
- `SESSION_SECRET` - セッション管理

**📖 詳細ガイド**: [API_KEY_SETUP.md](./API_KEY_SETUP.md) を参照

4. **ビルド**

```bash
npm run build
```

5. **開発サーバーを起動**

```bash
# PM2で起動（推奨）
pm2 start ecosystem.config.cjs

# または直接起動
npm run dev:sandbox
```

6. **ブラウザで確認**

http://localhost:3000 を開く

## 🚀 デプロイ

### Cloudflare Pages へのデプロイ

1. **Cloudflare API トークンを設定**

```bash
# GenSpark で setup_cloudflare_api_key を実行
```

2. **プロジェクトをビルド**

```bash
npm run build
```

3. **Cloudflare Pages プロジェクトを作成**

```bash
npx wrangler pages project create my-agent-analytics \
  --production-branch main
```

4. **デプロイ**

```bash
npm run deploy:prod
```

5. **環境変数を設定**

**必須APIキー:**
```bash
# Google OAuth（ログイン機能）
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name my-agent-analytics
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name my-agent-analytics

# 不動産情報ライブラリ（市場分析）
npx wrangler pages secret put REINFOLIB_API_KEY --project-name my-agent-analytics

# セッション管理
npx wrangler pages secret put SESSION_SECRET --project-name my-agent-analytics
```

**任意のAPIキー:**
```bash
# OpenAI（AI分析機能）
npx wrangler pages secret put OPENAI_API_KEY --project-name my-agent-analytics

# e-Stat（政府統計データ）
npx wrangler pages secret put ESTAT_API_KEY --project-name my-agent-analytics

# イタンジ（賃貸物件情報）
npx wrangler pages secret put ITANDI_API_KEY --project-name my-agent-analytics

# レインズ（不動産流通情報）
npx wrangler pages secret put REINS_LOGIN_ID --project-name my-agent-analytics
npx wrangler pages secret put REINS_PASSWORD --project-name my-agent-analytics
```

**📖 各APIキーの取得方法**: [API_KEY_SETUP.md](./API_KEY_SETUP.md) を参照

## 📖 APIドキュメント

### ヘルスチェック

```http
GET /api/health
```

**レスポンス:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "2.0.0"
}
```

### 物件財務分析

```http
POST /api/properties/analyze
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "propertyPrice": 50000000,
  "grossIncome": 5000000,
  "effectiveIncome": 4800000,
  "operatingExpenses": 1000000,
  "loanAmount": 40000000,
  "interestRate": 2.5,
  "loanTerm": 30,
  "downPayment": 10000000
}
```

**レスポンス:**
```json
{
  "success": true,
  "analysis": {
    "noi": 3800000,
    "grossYield": 10,
    "netYield": 7.6,
    "dscr": 1.89,
    "ltv": 80,
    "ccr": 38,
    "ber": 20,
    "operatingExpenseRatio": 20,
    "annualDebtService": 2013194,
    "monthlyCashFlow": 316666.67,
    "annualCashFlow": 3800000,
    "riskLevel": "medium",
    "riskFactors": ["LTV がやや高い（70%超）"],
    "recommendations": ["自己資金を増やしてLTVを下げることを検討"]
  }
}
```

### 市場動向分析 🆕

```http
POST /api/market/analyze
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "year": 2024,
  "area": "13",
  "city": "13102"
}
```

**レスポンス:**
```json
{
  "success": true,
  "analysis": {
    "area": "13102",
    "averagePrice": 45000000,
    "averagePricePerSquareMeter": 850000,
    "transactionCount": 156,
    "priceRange": {
      "min": 20000000,
      "max": 120000000,
      "median": 42000000
    },
    "pricetrend": {
      "currentQuarter": 45000000,
      "previousQuarter": 43500000,
      "changeRate": 3.45
    },
    "popularPropertyTypes": [
      { "type": "マンション", "count": 98, "percentage": 62.8 }
    ]
  }
}
```

### 不動産取引価格取得 🆕

```http
GET /api/market/trade-prices?year=2024&area=13&city=13102
```

**レスポンス:**
```json
{
  "success": true,
  "status": "success",
  "data": [
    {
      "Type": "中古マンション等",
      "TradePrice": "45000000",
      "Area": "65",
      "UnitPrice": "692000",
      "Period": "2024年第2四半期",
      "Municipality": "中央区"
    }
  ]
}
```

### 地価公示データ取得 🆕

```http
GET /api/market/land-prices?year=2024&area=13&division=00
```

**レスポンス:** 地価公示の詳細データ（標準地、価格、用途地域等）

### 価格推定 🆕

```http
POST /api/market/estimate-price
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "city": "13102",
  "area": 65,
  "propertyType": "中古マンション等",
  "buildingYear": "平成15年"
}
```

**レスポンス:**
```json
{
  "success": true,
  "estimation": {
    "estimatedPrice": 46200000,
    "pricePerSquareMeter": 710000,
    "confidence": "high",
    "comparableCount": 15,
    "priceRange": {
      "min": 40000000,
      "max": 52000000
    }
  }
}
```

### 周辺取引事例検索 🆕

```http
POST /api/market/comparables
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "city": "13102",
  "propertyType": "中古マンション等",
  "minArea": 55,
  "maxArea": 75,
  "limit": 10
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

### 物件一覧取得

```http
GET /api/properties
```

**レスポンス:**
```json
{
  "success": true,
  "properties": [
    {
      "id": "prop_1",
      "name": "恵比寿レジデンス",
      "address": "東京都渋谷区恵比寿1-1-1",
      "price": 50000000,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 🗂️ プロジェクト構造

```
my-agent-analytics/
├── src/
│   ├── index.tsx              # メインアプリケーション
│   ├── types/
│   │   └── index.ts           # TypeScript型定義
│   ├── lib/
│   │   ├── utils.ts           # ユーティリティ関数
│   │   ├── db.ts              # データベース操作
│   │   ├── calculator.ts      # 投資指標計算エンジン
│   │   └── reinfolib.ts       # 不動産情報ライブラリAPI統合
│   ├── routes/
│   │   ├── auth.tsx           # 認証ルート
│   │   ├── dashboard.tsx      # ダッシュボード
│   │   ├── settings.tsx       # 設定ページ（APIキー管理） 🆕
│   │   ├── properties.tsx     # 物件管理UI
│   │   └── api.tsx            # API エンドポイント
│   └── middleware/
│       └── auth.ts            # 認証ミドルウェア
├── public/
│   ├── static/
│   │   ├── icons/             # PWAアイコン
│   │   └── manifest.json      # PWAマニフェスト
│   └── sw.js                  # Service Worker
├── migrations/                # D1データベースマイグレーション
│   └── 0001_initial_schema.sql
├── docs/                      # ドキュメント
│   ├── PROJECT_OVERVIEW.md
│   └── MIGRATION_PLAN.md
├── nextjs-backup/             # Next.js版のバックアップ
├── dist/                      # ビルド出力
├── wrangler.jsonc             # Cloudflare設定
├── vite.config.ts             # Viteビルド設定
├── tsconfig.json              # TypeScript設定
├── ecosystem.config.cjs       # PM2設定
├── seed.sql                   # テストデータ
├── package.json
└── README.md
```

## 🔐 セキュリティ

- **API Key管理**: すべてのAPIキーはCloudflare Secretsで管理
- **認証**: Google OAuthによる安全な認証
- **HTTPS**: すべての通信はHTTPSで暗号化
- **CORS**: 適切なCORS設定

## 📊 パフォーマンス

- ⚡ **API応答時間**: < 500ms
- 🎯 **初回表示**: < 2秒
- 📈 **Lighthouse スコア**: 目標 90点以上
- 🌍 **グローバルCDN**: Cloudflare の200+データセンター

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📄 ライセンス

このプロジェクトは [MIT ライセンス](LICENSE) の下で公開されています。

## 🔗 関連リンク

- [Hono ドキュメント](https://hono.dev/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [e-Stat API](https://www.e-stat.go.jp/api/)
- [OpenAI API](https://platform.openai.com/docs/)

## 🔧 トラブルシューティング

### プレビューに変更が反映されない

**原因**: ブラウザキャッシュまたはビルドキャッシュ

**解決方法:**
```bash
# 1. ビルドキャッシュをクリア
cd /home/user/webapp
rm -rf dist .wrangler

# 2. 再ビルド
npm run build

# 3. PM2を完全再起動
pm2 delete all
pm2 start ecosystem.config.cjs

# 4. ブラウザでスーパーリロード
# - Chrome/Edge: Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)
# - Firefox: Ctrl + F5 (Windows) / Cmd + Shift + R (Mac)
```

### APIキーが読み込まれない

**確認方法:**
```bash
# APIキー設定状況を確認
bash check-api-keys.sh

# PM2ログを確認
pm2 logs my-agent-analytics --nostream
```

**または Web UI で確認:**
- ログイン後、右上の⚙️アイコンから設定ページにアクセス
- 各APIキーの設定状況を確認
- 必要なAPIキーの取得方法も表示されます

**解決方法:**
1. `.dev.vars` ファイルを確認
2. APIキーに余計な空白やクォートがないか確認
3. PM2を再起動: `pm2 restart my-agent-analytics`

### データベースエラー

**解決方法:**
```bash
# データベースをリセット
npm run db:reset

# マイグレーションを再実行
npm run db:migrate:local
```

### その他の問題

詳細なトラブルシューティングは以下を参照:
- **APIキー関連**: [API_KEY_SETUP.md](./API_KEY_SETUP.md)
- **技術的な問題**: [GitHubのIssue](https://github.com/koki-187/My-Agent-Analitics-genspark/issues)

## 📞 サポート

問題が解決しない場合は、[GitHubのIssue](https://github.com/koki-187/My-Agent-Analitics-genspark/issues)を作成してください。

**必要情報:**
- エラーメッセージ
- 実行したコマンド
- 環境（ローカル/Sandbox/本番）
- ブラウザとバージョン

---

**開発チーム**: My Agent Team  
**最終更新**: 2025年10月30日  
**バージョン**: 2.1.0
