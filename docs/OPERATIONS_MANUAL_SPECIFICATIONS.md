# 運用マニュアル - システム仕様書 v6.7.4

**最終更新**: 2025年11月04日  
**バージョン**: 6.7.4  
**対象者**: システム管理者、開発者、第三者引き継ぎ担当者

---

## 📖 目次

1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [アーキテクチャ](#アーキテクチャ)
4. [データベース仕様](#データベース仕様)
5. [API仕様](#api仕様)
6. [認証・セキュリティ](#認証セキュリティ)
7. [外部API統合](#外部api統合)
8. [デプロイメント仕様](#デプロイメント仕様)
9. [環境変数](#環境変数)
10. [パフォーマンス仕様](#パフォーマンス仕様)
11. [制限事項](#制限事項)

---

## システム概要

### プロジェクト情報

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | My Agent Analytics |
| **バージョン** | 6.7.4 |
| **リリース日** | 2025年11月04日 |
| **開発チーム** | My Agent Team |
| **リポジトリ** | https://github.com/koki-187/My-Agent-Analitics-genspark |
| **本番URL** | https://3ccc9c44.my-agent-analytics.pages.dev |
| **完成度** | 95% (ドキュメント作成中) |

### システム目的

不動産エージェントと投資家向けの包括的なデータ分析・レポート生成ツール。AIと政府統計データを活用し、物件データ入力だけで詳細な市場分析レポートを自動生成します。

### 主要機能（13機能）

1. **投資指標自動計算** - NOI、利回り、DSCR、LTV等
2. **市場分析** - 国土交通省実取引データ分析
3. **マイソクOCR** - OpenAI Vision APIによる画像認識
4. **AI市場分析** - OpenAI GPT-4o統合
5. **人口統計分析** - e-Stat API統合
6. **賃貸相場分析** - イタンジBB API統合
7. **事故物件調査** - AI搭載心理的瑕疵調査
8. **ファクトチェック** - AI検証システム
9. **投資シミュレーション** - キャッシュフロー予測
10. **レポート共有** - 共有リンク、パスワード保護
11. **データエクスポート** - CSV/Excel出力
12. **Google Maps統合** - 地図表示、周辺施設検索
13. **統合レポート生成** - インタラクティブダッシュボード

---

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Tailwind CSS** | CDN Latest | UIスタイリング |
| **Font Awesome** | 6.4.0 | アイコン |
| **Noto Sans JP** | Google Fonts | 日本語フォント |
| **Chart.js** | v4.x | データ可視化 |
| **Axios** | 1.6.0 | HTTPクライアント |

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Hono** | 4.0.0+ | Webフレームワーク |
| **TypeScript** | 5.0+ | プログラミング言語 |
| **Cloudflare Workers** | - | ランタイム環境 |
| **Cloudflare D1** | - | SQLiteデータベース |
| **Cloudflare Cache API** | - | エッジキャッシング |
| **Cloudflare KV** | - | キーバリューストア（任意） |

### 開発ツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| **Vite** | 5.0+ | ビルドツール |
| **Wrangler** | 3.78.0+ | Cloudflare CLI |
| **PM2** | Latest | プロセス管理（開発環境） |
| **Git** | - | バージョン管理 |

---

## アーキテクチャ

### システムアーキテクチャ図

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare CDN                    │
│              (Global Edge Network)                  │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Cloudflare Pages/Workers                │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │           Hono Web Framework               │    │
│  │  ┌──────────────────────────────────────┐  │    │
│  │  │  Routes (8 files)                    │  │    │
│  │  │  - auth.tsx    - properties.tsx      │  │    │
│  │  │  - api.tsx     - stigma.tsx          │  │    │
│  │  │  - dashboard   - itandi.tsx          │  │    │
│  │  │  - help.tsx    - settings.tsx        │  │    │
│  │  └──────────────────────────────────────┘  │    │
│  │                                              │    │
│  │  ┌──────────────────────────────────────┐  │    │
│  │  │  Middleware                          │  │    │
│  │  │  - Authentication                    │  │    │
│  │  │  - Rate Limiting                     │  │    │
│  │  │  - CORS                              │  │    │
│  │  └──────────────────────────────────────┘  │    │
│  │                                              │    │
│  │  ┌──────────────────────────────────────┐  │    │
│  │  │  Libraries (15+ files)               │  │    │
│  │  │  - calculator.ts  - reinfolib.ts     │  │    │
│  │  │  - db.ts          - stigma-checker   │  │    │
│  │  │  - utils.ts       - fact-checker     │  │    │
│  │  └──────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌──────────────┐
│ Cloudflare D1 │ │ External APIs │ │ Static Files │
│   Database    │ │               │ │   (public/)  │
│               │ │ - OpenAI      │ │              │
│ 11 Tables     │ │ - e-Stat      │ │ - Icons      │
│ 4 Migrations  │ │ - Reinfolib   │ │ - Manifest   │
│               │ │ - Itandi      │ │ - SW.js      │
└───────────────┘ └───────────────┘ └──────────────┘
```

### データフロー

```
User Request
    │
    ▼
Cloudflare Edge (CDN)
    │
    ├─ Static Files → Cache → Return
    │
    └─ Dynamic Request
        │
        ▼
    Hono Router
        │
        ├─ Auth Middleware → Check Session
        │
        ├─ Rate Limiter → Check Limits
        │
        └─ Route Handler
            │
            ├─ Database Query (D1)
            │
            ├─ External API Call
            │   ├─ OpenAI GPT-4o
            │   ├─ e-Stat API
            │   ├─ Reinfolib API
            │   └─ Itandi BB API
            │
            ├─ Business Logic
            │
            └─ Response
                │
                ▼
            JSON/HTML
                │
                ▼
            User
```

---

## データベース仕様

### Cloudflare D1 (SQLite)

**データベース名**: `my-agent-analytics-production`

### テーブル一覧（11テーブル）

#### 1. users
**用途**: ユーザーアカウント管理

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| email | TEXT | UNIQUE NOT NULL | メールアドレス |
| name | TEXT | NOT NULL | 名前 |
| picture | TEXT | - | プロフィール画像URL |
| provider | TEXT | DEFAULT 'google' | 認証プロバイダー |
| password_hash | TEXT | - | パスワードハッシュ（管理者用） |
| role | TEXT | DEFAULT 'user' | ロール |
| is_admin | INTEGER | DEFAULT 0 | 管理者フラグ |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

#### 2. sessions
**用途**: セッション管理

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | セッションID |
| user_id | TEXT | NOT NULL | ユーザーID |
| expires_at | TEXT | NOT NULL | 有効期限 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

#### 3. properties
**用途**: 物件情報

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | 物件ID |
| user_id | TEXT | NOT NULL | 所有ユーザーID |
| name | TEXT | NOT NULL | 物件名 |
| address | TEXT | - | 住所 |
| price | REAL | - | 価格 |
| area | REAL | - | 専有面積 |
| land_area | REAL | - | 土地面積 |
| structure | TEXT | - | 構造 |
| age | INTEGER | - | 築年数 |
| floors | INTEGER | - | 階数 |
| rooms | TEXT | - | 間取り |
| gross_income | REAL | - | 満室想定賃料 |
| effective_income | REAL | - | 実効賃料 |
| operating_expenses | REAL | - | 運営経費 |
| loan_amount | REAL | - | 借入金額 |
| interest_rate | REAL | - | 金利 |
| loan_term | INTEGER | - | 返済期間 |
| down_payment | REAL | - | 頭金 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新日時 |

#### 4. analyses
**用途**: 財務分析結果

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | 分析ID |
| property_id | TEXT | - | 物件ID |
| user_id | TEXT | NOT NULL | ユーザーID |
| noi | REAL | - | 純営業利益 |
| gross_yield | REAL | - | 表面利回り |
| net_yield | REAL | - | 実質利回り |
| dscr | REAL | - | 債務償還カバー率 |
| ltv | REAL | - | ローン対物件価値比率 |
| ccr | REAL | - | キャッシュ・オン・キャッシュ |
| ber | REAL | - | 損益分岐点比率 |
| risk_level | TEXT | - | リスクレベル |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

#### 5. ai_agents
**用途**: AIエージェント管理

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | エージェントID |
| user_id | TEXT | NOT NULL | ユーザーID |
| name | TEXT | NOT NULL | エージェント名 |
| description | TEXT | - | 説明 |
| model | TEXT | DEFAULT 'gpt-4' | モデル名 |
| system_prompt | TEXT | - | システムプロンプト |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

#### 6. executions
**用途**: エージェント実行履歴

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | 実行ID |
| agent_id | TEXT | NOT NULL | エージェントID |
| user_id | TEXT | NOT NULL | ユーザーID |
| input_data | TEXT | - | 入力データ |
| output_data | TEXT | - | 出力データ |
| status | TEXT | DEFAULT 'pending' | ステータス |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

#### 7. shared_reports
**用途**: 共有レポート管理

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | 共有ID |
| user_id | TEXT | NOT NULL | ユーザーID |
| property_id | TEXT | - | 物件ID |
| token | TEXT | UNIQUE NOT NULL | 共有トークン |
| password_hash | TEXT | - | パスワードハッシュ |
| expires_at | TEXT | - | 有効期限 |
| max_views | INTEGER | - | 最大閲覧回数 |
| view_count | INTEGER | DEFAULT 0 | 閲覧回数 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

#### 8. report_access_log
**用途**: レポートアクセスログ

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | ログID |
| shared_report_id | TEXT | NOT NULL | 共有レポートID |
| ip_address | TEXT | - | IPアドレス |
| user_agent | TEXT | - | ユーザーエージェント |
| accessed_at | TEXT | DEFAULT CURRENT_TIMESTAMP | アクセス日時 |

#### 9. report_templates
**用途**: カスタムテンプレート

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | テンプレートID |
| user_id | TEXT | NOT NULL | ユーザーID |
| name | TEXT | NOT NULL | テンプレート名 |
| category | TEXT | NOT NULL | カテゴリー |
| is_default | INTEGER | DEFAULT 0 | デフォルトフラグ |
| is_public | INTEGER | DEFAULT 0 | 公開フラグ |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

#### 10. template_sections
**用途**: テンプレートセクション

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | セクションID |
| template_id | TEXT | NOT NULL | テンプレートID |
| section_type | TEXT | NOT NULL | セクション種別 |
| title | TEXT | NOT NULL | タイトル |
| content | TEXT | - | コンテンツ |
| order_index | INTEGER | NOT NULL | 表示順 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

#### 11. oauth_states
**用途**: OAuth認証状態管理

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| state | TEXT | PRIMARY KEY | ステート |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

### マイグレーション履歴

| ファイル | 説明 | 適用日 |
|---------|------|--------|
| 0001_initial_schema.sql | 初期スキーマ | 2024-10-30 |
| 0002_password_auth.sql | パスワード認証拡張 | 2024-10-31 |
| 0003_ai_agents.sql | AIエージェント機能 | 2024-11-01 |
| 0004_sharing_templates.sql | 共有・テンプレート | 2024-11-02 |

---

## API仕様

### エンドポイント一覧（100+）

#### 基本API

```http
GET  /api/health                 # ヘルスチェック
```

#### 認証API

```http
GET  /auth/google                # Google OAuth開始
GET  /auth/google/callback       # OAuth コールバック
POST /auth/login                 # パスワードログイン
GET  /auth/logout                # ログアウト
```

#### 物件管理API

```http
POST   /api/properties                    # 物件新規登録
GET    /api/properties                    # 物件一覧取得
GET    /api/properties/:id                # 物件詳細取得
PUT    /api/properties/:id                # 物件更新
DELETE /api/properties/:id                # 物件削除
POST   /api/properties/analyze            # 財務分析
POST   /api/properties/ocr                # OCR画像認識
POST   /api/properties/residential/evaluate  # 実需用評価
```

#### 市場分析API

```http
POST /api/market/analyze          # 市場動向分析
GET  /api/market/trade-prices     # 取引価格取得
GET  /api/market/land-prices      # 地価公示取得
GET  /api/market/municipalities   # 市区町村一覧
POST /api/market/comparables      # 周辺取引事例検索
POST /api/market/estimate-price   # 価格推定
```

#### AI分析API

```http
POST /api/ai/analyze-market       # AI市場分析
POST /api/ai/analyze-property     # AI物件評価
POST /api/ai/compare-properties   # AI物件比較
```

#### 事故物件調査API

```http
POST /api/properties/stigma-check # 心理的瑕疵調査
```

#### ファクトチェックAPI

```http
POST /api/properties/fact-check   # レポート検証
```

#### 投資シミュレーションAPI

```http
POST /api/simulate/investment     # 投資シミュレーション
POST /api/simulate/scenarios      # シナリオ比較
POST /api/simulate/monte-carlo    # モンテカルロ分析
```

#### データエクスポートAPI

```http
GET  /api/export/properties       # 物件リストCSV
POST /api/export/analysis         # 分析結果CSV
POST /api/export/simulation       # シミュレーションCSV
POST /api/export/market           # 市場分析CSV
GET  /api/export/properties-excel # 物件リストExcel
POST /api/export/simulation-excel # シミュレーションExcel
```

#### 共有レポートAPI

```http
POST   /api/sharing/create        # 共有リンク作成
GET    /api/sharing/:token        # 共有レポート取得
POST   /api/sharing/:token/verify # パスワード検証
GET    /api/sharing/my-shares     # 自分の共有一覧
PUT    /api/sharing/:token        # 共有設定更新
DELETE /api/sharing/:token        # 共有削除
GET    /api/sharing/:token/logs   # アクセスログ取得
```

### レスポンス形式

#### 成功レスポンス

```json
{
  "success": true,
  "data": { /* データ */ },
  "timestamp": "2025-11-04T00:00:00.000Z"
}
```

#### エラーレスポンス

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "errorCode": "ERROR_CODE",
  "suggestions": ["提案1", "提案2"],
  "timestamp": "2025-11-04T00:00:00.000Z"
}
```

---

## 認証・セキュリティ

### 認証方式

#### 1. Google OAuth 2.0
- **プロバイダー**: Google
- **スコープ**: openid, profile, email
- **フロー**: Authorization Code Flow

#### 2. パスワード認証
- **対象**: 管理者のみ
- **ハッシュ**: Web Crypto API (SHA-256)
- **アカウント**: admin@myagent.local

### セッション管理

- **ストレージ**: Cloudflare D1
- **有効期限**: 7日間
- **Cookie**: HttpOnly, Secure, SameSite=Lax

### セキュリティ対策

#### レート制限

| エンドポイント | 制限 |
|--------------|------|
| API | 100 req/min |
| AI分析 | 20 req/min |
| 認証 | 10 req/min |

#### その他

- **CORS**: 適切なOrigin設定
- **XSS対策**: 入力エスケープ
- **SQLインジェクション対策**: パラメータバインディング
- **HTTPS**: 全通信暗号化（Cloudflare自動）

---

## 外部API統合

### API一覧（9種類）

| API名 | 用途 | 必須/任意 |
|-------|------|----------|
| **Google OAuth** | 認証 | 必須 |
| **OpenAI GPT-4o** | AI分析、OCR | 必須 |
| **不動産情報ライブラリ** | 市場分析 | 必須 |
| **e-Stat** | 政府統計 | 任意 |
| **イタンジBB** | 賃貸相場 | 任意 |
| **レインズ** | 不動産流通 | 任意 |

### 環境変数名

```bash
# 必須
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
REINFOLIB_API_KEY
SESSION_SECRET
OPENAI_API_KEY

# 任意
ESTAT_API_KEY
ITANDI_API_KEY
REINS_LOGIN_ID
REINS_PASSWORD
```

---

## デプロイメント仕様

### 本番環境

- **プラットフォーム**: Cloudflare Pages
- **プロジェクト名**: my-agent-analytics
- **本番ブランチ**: main
- **URL**: https://3ccc9c44.my-agent-analytics.pages.dev

### ビルド設定

```bash
# ビルドコマンド
npm run build

# 出力ディレクトリ
dist/

# Node.jsバージョン
18.x以上
```

### デプロイコマンド

```bash
# ビルド
npm run build

# デプロイ
npx wrangler pages deploy dist --project-name my-agent-analytics
```

---

## 環境変数

### ローカル開発 (.dev.vars)

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
OPENAI_API_KEY=your-openai-key
REINFOLIB_API_KEY=your-reinfolib-key
ESTAT_API_KEY=your-estat-key
ITANDI_API_KEY=your-itandi-key
REINS_LOGIN_ID=your-reins-id
REINS_PASSWORD=your-reins-password
SESSION_SECRET=your-32-byte-secret
```

### 本番環境 (Cloudflare Secrets)

```bash
# 設定コマンド
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name my-agent-analytics
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name my-agent-analytics
# ... 以下同様
```

---

## パフォーマンス仕様

### 目標値

| 指標 | 目標値 | 実測値 |
|------|--------|--------|
| API応答時間 | < 100ms | 3ms |
| 初回表示 | < 1s | - |
| ページサイズ | < 200KB | 14KB |
| バンドルサイズ | < 10MB | 609.83KB |

### キャッシング戦略

- **Edge Cache**: 静的アセット 24時間
- **API Cache**: レスポンス 5分
- **Market Data**: 市場データ 30分
- **Memory Cache**: ワーカー内キャッシュ

---

## 制限事項

### Cloudflare Workers制限

- **CPU時間**: 10ms (無料)、30ms (有料)
- **バンドルサイズ**: 10MB
- **メモリ**: 128MB
- **リクエストサイズ**: 100MB

### データベース制限

- **D1サイズ**: 500MB (無料)
- **クエリ実行時間**: 30秒

### 機能制限

- **PDF読み込み**: 非対応（OpenAI Vision API制限）
- **WebSocket**: 非対応（Workers制限）
- **ファイルシステム**: 非対応（Workers制限）

---

**仕様書作成者**: GenSpark AI Assistant  
**最終更新**: 2025-11-04  
**バージョン**: 6.7.4  
**ドキュメント種別**: システム仕様書
