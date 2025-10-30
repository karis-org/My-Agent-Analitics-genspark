# My Agent Analytics - Cloudflare Pages移行計画

## 移行の目的

Next.jsアプリケーションをCloudflare Pages + Hono フレームワークに移行し、以下の目標を達成します：

1. **グローバルエッジデプロイ**: 世界中で低レイテンシーなアクセス
2. **コスト最適化**: Cloudflareの無料枠を最大活用
3. **スケーラビリティ**: 自動スケーリング
4. **開発効率**: シンプルで軽量なフレームワーク
5. **統合サービス**: D1, KV, R2との緊密な統合

## アーキテクチャ比較

### 現在（Next.js）

```
┌─────────────────┐
│   Vercel        │
│                 │
│  Next.js App    │
│  ├─ SSR/SSG     │
│  ├─ API Routes  │
│  └─ Static      │
└─────────────────┘
        ↓
┌─────────────────┐
│  External APIs  │
│  ├─ Google Auth │
│  ├─ OpenAI      │
│  └─ e-Stat      │
└─────────────────┘
```

### 移行後（Cloudflare Pages + Hono）

```
┌──────────────────────────────────────┐
│        Cloudflare Pages              │
│                                      │
│  ┌────────────┐    ┌──────────────┐ │
│  │   Hono     │───→│  D1 Database │ │
│  │  Workers   │    └──────────────┘ │
│  └────────────┘                      │
│       ↓                              │
│  ┌────────────┐    ┌──────────────┐ │
│  │   Static   │    │  KV Storage  │ │
│  │   Assets   │    └──────────────┘ │
│  └────────────┘                      │
│                     ┌──────────────┐ │
│                     │  R2 Storage  │ │
│                     └──────────────┘ │
└──────────────────────────────────────┘
        ↓
┌─────────────────┐
│  External APIs  │
│  ├─ OAuth       │
│  ├─ OpenAI      │
│  └─ e-Stat      │
└─────────────────┘
```

## 段階的移行プラン

### フェーズ 1: 基盤構築（1-2日）

#### 1.1 プロジェクトセットアップ
- [x] Honoプロジェクト初期化
- [ ] Cloudflare Pagesプロジェクト作成
- [ ] wrangler.jsonc設定
- [ ] TypeScript設定

#### 1.2 基本的なUI構築
- [ ] ホームページ
- [ ] レイアウトコンポーネント
- [ ] Tailwind CSS統合（CDN）
- [ ] PWAアイコンの設定

#### 1.3 静的ファイル配信
- [ ] public/static/ディレクトリ構造
- [ ] アイコン、画像の配置
- [ ] manifest.json設定

### フェーズ 2: データベース設計（1日）

#### 2.1 D1データベース作成
```bash
npx wrangler d1 create webapp-production
```

#### 2.2 スキーマ設計
```sql
-- ユーザーテーブル
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 物件テーブル
CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  location TEXT,
  structure TEXT,
  total_floor_area REAL,
  age INTEGER,
  distance_from_station REAL,
  has_elevator BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 収益情報テーブル
CREATE TABLE property_income (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  average_rent REAL,
  units INTEGER,
  occupancy_rate REAL,
  gross_income REAL,
  effective_income REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 運営費テーブル
CREATE TABLE property_expenses (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  management_fee REAL,
  repair_cost REAL,
  property_tax REAL,
  insurance REAL,
  other_expenses REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 分析結果テーブル
CREATE TABLE analysis_results (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  noi REAL,
  gross_yield REAL,
  net_yield REAL,
  dscr REAL,
  ltv REAL,
  analysis_data TEXT, -- JSON形式
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- セッションテーブル
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- インデックス作成
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_property_income_property_id ON property_income(property_id);
CREATE INDEX idx_property_expenses_property_id ON property_expenses(property_id);
CREATE INDEX idx_analysis_results_property_id ON analysis_results(property_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

#### 2.3 マイグレーション実装
- [ ] マイグレーションファイル作成
- [ ] ローカルテスト
- [ ] 本番適用

### フェーズ 3: 認証システム（2-3日）

#### 3.1 OAuth実装
- [ ] Google OAuth設定
- [ ] 認証フロー実装
- [ ] セッション管理
- [ ] Cookie処理

#### 3.2 ミドルウェア
```typescript
// src/middleware/auth.ts
export const authMiddleware = async (c: Context, next: Next) => {
  const session = await getSession(c);
  if (!session) {
    return c.redirect('/login');
  }
  c.set('user', session.user);
  await next();
};
```

#### 3.3 保護ルート
- [ ] `/api/*` - API認証
- [ ] `/dashboard` - ダッシュボード
- [ ] `/properties/*` - 物件管理

### フェーズ 4: コア機能実装（3-4日）

#### 4.1 物件入力フォーム
- [ ] フォームコンポーネント
- [ ] バリデーション
- [ ] API: POST /api/properties

#### 4.2 計算エンジン
```typescript
// src/lib/calculator.ts
export function calculateNOI(income: number, expenses: number): number {
  return income - expenses;
}

export function calculateGrossYield(income: number, price: number): number {
  return (income / price) * 100;
}

export function calculateNetYield(noi: number, price: number): number {
  return (noi / price) * 100;
}

export function calculateDSCR(noi: number, annualDebt: number): number {
  return noi / annualDebt;
}

export function calculateLTV(loanAmount: number, price: number): number {
  return (loanAmount / price) * 100;
}
```

#### 4.3 分析結果表示
- [ ] ダッシュボードUI
- [ ] Chart.js統合（CDN）
- [ ] API: GET /api/analysis/:propertyId

#### 4.4 PDFエクスポート
- [ ] クライアントサイドPDF生成
- [ ] または Workers APIでPDF生成
- [ ] R2ストレージに保存

### フェーズ 5: 外部API統合（2-3日）

#### 5.1 e-Stat API
```typescript
// src/lib/estat.ts
export async function fetchPopulationData(areaCode: string) {
  const response = await fetch(
    `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?` +
    `appId=${process.env.ESTAT_API_KEY}&statsDataId=...`
  );
  return response.json();
}
```

#### 5.2 OpenAI API
```typescript
// src/lib/openai.ts
export async function analyzeProperty(propertyData: any) {
  const response = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '不動産投資分析の専門家として...'
          },
          {
            role: 'user',
            content: JSON.stringify(propertyData)
          }
        ]
      })
    }
  );
  return response.json();
}
```

### フェーズ 6: PWA機能（1日）

#### 6.1 Service Worker
- [ ] キャッシュ戦略
- [ ] オフライン対応
- [ ] バックグラウンド同期

#### 6.2 Manifest設定
```json
{
  "name": "My Agent Analytics",
  "short_name": "Analytics",
  "icons": [
    {
      "src": "/static/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/static/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af"
}
```

### フェーズ 7: テストとデプロイ（1-2日）

#### 7.1 ローカルテスト
```bash
npm run build
npm run dev:sandbox
```

#### 7.2 本番デプロイ
```bash
# ビルド
npm run build

# Cloudflare Pagesプロジェクト作成
npx wrangler pages project create my-agent-analytics \
  --production-branch main

# デプロイ
npx wrangler pages deploy dist --project-name my-agent-analytics
```

#### 7.3 環境変数設定
```bash
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name my-agent-analytics
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name my-agent-analytics
npx wrangler pages secret put OPENAI_API_KEY --project-name my-agent-analytics
npx wrangler pages secret put ESTAT_API_KEY --project-name my-agent-analytics
```

## 機能マッピング

| Next.js機能 | Cloudflare Pages実装 | 優先度 |
|------------|---------------------|--------|
| NextAuth.js | Cloudflare Workers OAuth | 高 |
| API Routes | Hono API Routes | 高 |
| SSR | Edge Rendering | 中 |
| Static Generation | Static Site | 高 |
| Image Optimization | Cloudflare Images | 低 |
| File Upload | R2 Storage | 中 |
| Database | D1 (SQLite) | 高 |
| Cache | KV Storage | 中 |
| Session | KV + Cookie | 高 |

## リスクと対策

### リスク 1: 認証の複雑さ
**対策**: 
- シンプルなOAuthフロー実装
- セッションはKVに保存
- フォールバックにJWT使用

### リスク 2: PDF生成の制限
**対策**:
- クライアントサイドで生成（html2canvas + jsPDF）
- または外部API使用（Puppeteer as a Service）

### リスク 3: データベースサイズ制限
**対策**:
- D1の制限を理解（無料: 5GB）
- 古いデータのアーカイブ
- R2に大きなファイルを保存

### リスク 4: API レート制限
**対策**:
- KVでキャッシング
- バックグラウンドジョブで事前取得
- レート制限エラーハンドリング

## 成功基準

1. ✅ すべてのコア機能が動作
2. ✅ Lighthouse スコア 90点以上
3. ✅ API応答時間 < 500ms
4. ✅ 初回表示 < 2秒
5. ✅ PWA インストール可能
6. ✅ モバイル対応完璧
7. ✅ セキュリティ監査通過

## タイムライン

| フェーズ | 期間 | 完了予定 |
|---------|------|---------|
| 1. 基盤構築 | 1-2日 | Day 2 |
| 2. データベース | 1日 | Day 3 |
| 3. 認証 | 2-3日 | Day 6 |
| 4. コア機能 | 3-4日 | Day 10 |
| 5. API統合 | 2-3日 | Day 13 |
| 6. PWA | 1日 | Day 14 |
| 7. テスト・デプロイ | 1-2日 | Day 16 |

**合計**: 約2-3週間

## 次のアクション

- [ ] Cloudflare アカウント確認
- [ ] API Key取得
- [ ] Honoプロジェクト初期化開始
- [ ] D1データベース作成
- [ ] 開発環境セットアップ
