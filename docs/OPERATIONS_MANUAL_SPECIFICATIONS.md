# システム仕様書

**バージョン**: v6.7.4  
**最終更新日**: 2025年11月8日  
**対象**: 開発者、システム管理者

---

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [技術スタック](#技術スタック)
3. [データベース設計](#データベース設計)
4. [API仕様](#api仕様)
5. [セキュリティ](#セキュリティ)
6. [パフォーマンス](#パフォーマンス)
7. [デプロイ](#デプロイ)

---

## システムアーキテクチャ

### 概要

My Agent Analyticsは、Cloudflare Pagesにデプロイされたサーバーレスアプリケーションです。

```
[クライアント]
    ↓ HTTPS
[Cloudflare Pages/Workers]
    ↓
[Cloudflare D1 Database]
[External APIs]
    - OpenAI GPT-4 Vision (OCR)
    - Google Custom Search (Stigma Check)
    - Itandi BB API (賃貸相場)
    - Google Maps API (地図)
```

### アーキテクチャの特徴

- **エッジコンピューティング**: 世界中に分散されたエッジネットワークで高速レスポンス
- **サーバーレス**: サーバー管理不要、自動スケーリング
- **グローバル配信**: Cloudflare CDNによる高速コンテンツ配信

---

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **HTML/CSS/JavaScript** | ES2022 | UI実装 |
| **TailwindCSS** | CDN最新版 | スタイリング |
| **Chart.js** | v4.4.0 | データ可視化 |
| **FontAwesome** | v6.4.0 | アイコン |
| **Axios** | v1.6.0 | HTTP通信 |

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Hono** | v4.0.0 | Webフレームワーク |
| **TypeScript** | v5.0.0 | 型安全な開発 |
| **Wrangler** | v4.46.0 | Cloudflare CLI |
| **Vite** | v5.0.0 | ビルドツール |

### データベース

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Cloudflare D1** | - | SQLiteベースのグローバルDB |

### 外部API

| サービス | 用途 | コスト |
|---------|------|-------|
| **OpenAI GPT-4 Vision** | OCR機能 | 従量課金 |
| **Google Custom Search** | 事故物件調査 | 100クエリ/日（無料枠） |
| **Itandi BB API** | 賃貸相場調査 | 契約済み |
| **Google Maps API** | 地図表示 | 従量課金 |

---

## データベース設計

### テーブル一覧（24テーブル）

#### 1. users - ユーザー管理
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  is_admin INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### 2. properties - 物件情報
```sql
CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  price REAL NOT NULL,
  structure TEXT,
  floor_area REAL,
  age INTEGER,
  property_type TEXT,        -- Migration 0008で追加
  land_area REAL,            -- Migration 0008で追加
  registration_date TEXT,    -- Migration 0008で追加
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 3. property_income - 収益情報
```sql
CREATE TABLE property_income (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  annual_income REAL,        -- Migration 0009で追加
  monthly_rent REAL,         -- Migration 0009で追加
  other_income REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 4. property_expenses - 運営費
```sql
CREATE TABLE property_expenses (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  management_fee REAL,
  repair_reserve REAL,
  property_tax REAL,
  insurance REAL,
  utilities REAL,
  other_expenses REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 5. property_investment - 投資条件
```sql
CREATE TABLE property_investment (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  down_payment REAL,
  loan_amount REAL,
  interest_rate REAL,
  loan_term INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 6. analysis_results - 分析結果
```sql
CREATE TABLE analysis_results (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  gross_yield REAL,      -- 表面利回り
  net_yield REAL,        -- 実質利回り
  noi REAL,              -- 純営業利益
  dscr REAL,             -- 債務返済余裕率
  ltv REAL,              -- ローン比率
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 7. accident_investigations - 事故物件調査
```sql
CREATE TABLE accident_investigations (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  is_accident_property INTEGER,
  details TEXT,
  source_url TEXT,
  investigated_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 8. rental_market_data - 賃貸相場データ
```sql
CREATE TABLE rental_market_data (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  average_rent REAL,
  min_rent REAL,
  max_rent REAL,
  sample_count INTEGER,
  data_source TEXT,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 9. demographics_data - 人口動態
```sql
CREATE TABLE demographics_data (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  population INTEGER,
  population_change REAL,
  average_age REAL,
  household_count INTEGER,
  data_year INTEGER,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 10. ai_analysis_results - AI分析結果
```sql
CREATE TABLE ai_analysis_results (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  market_evaluation TEXT,
  risk_assessment TEXT,
  recommendations TEXT,
  future_forecast TEXT,
  confidence_score REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 11. property_maps - 地図データ
```sql
CREATE TABLE property_maps (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  nearby_stations TEXT,  -- JSON形式
  nearby_facilities TEXT, -- JSON形式
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

#### 12. activity_logs - アクティビティログ
```sql
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
```

---

## API仕様

### 認証エンドポイント

#### POST /auth/google
Google OAuth認証を開始

**Request**: なし

**Response**:
```json
{
  "redirect_url": "https://accounts.google.com/..."
}
```

#### GET /auth/google/callback
Google OAuth認証コールバック

**Query Parameters**:
- `code`: 認証コード（Google提供）

**Response**: Cookieにセッション情報を設定し、ダッシュボードにリダイレクト

#### GET /auth/logout
ログアウト

**Response**: ログインページにリダイレクト

---

### 物件管理API

#### GET /api/properties
物件一覧取得

**Headers**:
- `Cookie`: セッション情報（必須）

**Response**:
```json
{
  "success": true,
  "properties": [
    {
      "id": "prop-123",
      "name": "〇〇マンション",
      "address": "東京都渋谷区...",
      "price": 50000000,
      "structure": "RC造",
      "floor_area": 80.5,
      "age": 10,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/properties
物件登録

**Headers**:
- `Cookie`: セッション情報（必須）
- `Content-Type`: `application/json`

**Request**:
```json
{
  "name": "〇〇マンション",
  "address": "東京都渋谷区...",
  "price": 50000000,
  "structure": "RC造",
  "floor_area": 80.5,
  "age": 10
}
```

**Response**:
```json
{
  "success": true,
  "property_id": "prop-123"
}
```

#### GET /api/properties/:id
物件詳細取得

**Response**:
```json
{
  "success": true,
  "property": { /* 物件情報 */ },
  "income": { /* 収益情報 */ },
  "expenses": { /* 運営費 */ },
  "investment": { /* 投資条件 */ }
}
```

---

### OCR API

#### POST /api/ocr
PDFから物件情報を抽出

**Headers**:
- `Cookie`: セッション情報（必須）
- `Content-Type`: `application/json`

**Request**:
```json
{
  "pdf_data": "base64_encoded_pdf_data"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "〇〇マンション",
    "address": "東京都渋谷区...",
    "price": 50000000,
    "structure": "RC造",
    "floor_area": 80.5,
    "age": 10
  },
  "confidence": "high"
}
```

---

### 分析API

#### POST /api/analyze/:property_id
物件分析を実行

**Response**:
```json
{
  "success": true,
  "analysis": {
    "gross_yield": 8.5,
    "net_yield": 6.2,
    "noi": 3100000,
    "dscr": 1.5,
    "ltv": 80
  }
}
```

---

## セキュリティ

### 認証・認可

1. **Google OAuth 2.0**
   - 安全なユーザー認証
   - メールアドレス検証済み

2. **セッションベース認証**
   - HTTP-only Cookie使用
   - 30日間有効
   - CSRF対策実装

3. **権限管理**
   - ロールベースアクセス制御（RBAC）
   - 一般ユーザー、管理者、運営管理者の3階層

### データ保護

1. **通信暗号化**
   - HTTPS（TLS 1.3）必須

2. **APIキー管理**
   - Cloudflare Secretsで保管
   - 環境変数として注入
   - コードに直接記述しない

3. **パスワードハッシュ**
   - SHA-256ハッシュ化
   - ソルト使用

---

## パフォーマンス

### レスポンス時間目標

| エンドポイント | 目標時間 | 実測値 |
|---------------|---------|-------|
| 静的ページ | < 200ms | ~150ms |
| API（単純） | < 500ms | ~300ms |
| OCR処理 | < 10s | ~8s |
| 統合レポート生成 | < 3s | ~2.5s |

### キャッシュ戦略

1. **Cloudflare CDN**
   - 静的アセット: 30日間キャッシュ
   - HTML: キャッシュなし

2. **ブラウザキャッシュ**
   - CSS/JS: 1年間
   - 画像: 30日間

---

## デプロイ

### 本番環境

- **URL**: https://my-agent-analytics.pages.dev
- **Platform**: Cloudflare Pages
- **Database**: Cloudflare D1 (webapp-production)
- **Region**: Global（エッジ配信）

### デプロイコマンド

```bash
# ビルド
npm run build

# 本番デプロイ
npx wrangler pages deploy dist --project-name my-agent-analytics

# DBマイグレーション（本番）
npx wrangler d1 migrations apply webapp-production
```

### 環境変数

以下の環境変数をCloudflare Pagesに設定する必要があります：

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI APIキー | ✅ |
| `GOOGLE_CUSTOM_SEARCH_API_KEY` | Google Custom Search APIキー | ✅ |
| `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | 検索エンジンID | ✅ |
| `GOOGLE_MAPS_API_KEY` | Google Maps APIキー | ✅ |
| `ITANDI_EMAIL` | イタンジBBログインID | ✅ |
| `ITANDI_PASSWORD` | イタンジBBパスワード | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | ✅ |
| `SESSION_SECRET` | セッション暗号化キー | ✅ |

---

## バージョン管理

### Git/GitHub

- **リポジトリ**: `https://github.com/karis-org/My-Agent-Analitics-genspark`
- **ブランチ戦略**: mainブランチのみ（直接コミット）
- **コミットメッセージ**: `Session X: [変更内容]`

---

## 更新履歴

### v6.7.4 (2025-11-08)
- イタンジBB: 全47都道府県対応
- OCR: 構造認識精度向上
- 管理画面: ドキュメントセンター実装

### v6.7.3 (2025-11-07)
- Chart.js統合
- Migration 0008/0009適用

---

**技術サポート**: maa-unnei@support
