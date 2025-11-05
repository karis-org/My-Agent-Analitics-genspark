# 実装・修正指示書（MyAgentAnalytics）

**作成日**: 2025年1月5日  
**対象**: Genspark フルスタック開発チーム  
**目的**: MyAgentAnalytics（MAA）を本番品質へ引き上げる

---

## 📋 目次

1. [優先度：高（リリース前必須）](#優先度高リリース前必須)
2. [優先度：中（初期フェーズ）](#優先度中初期フェーズ)
3. [優先度：低（拡張フェーズ）](#優先度低拡張フェーズ)
4. [リファクタリング](#リファクタリング)
5. [技術スタック・ツール](#技術スタックツール)

---

## 🟥 優先度：高（リリース前必須）

### 1. Itandi BB 賃貸相場機能の統合確認と実機テスト

**該当画面**: `/itandi/rental-market`

#### 対応内容

1. **認証情報の確認**
   ```bash
   # Cloudflare Pagesで環境変数が設定されているか確認
   npx wrangler pages secret list --project-name my-agent-analytics
   ```
   - 必要な環境変数:
     - `ITANDI_EMAIL`
     - `ITANDI_PASSWORD`
     - `ITANDI_API_KEY`

2. **セッション維持の確認**
   - Cookie処理が正しく行われているか
   - ログインセッションが維持されているか
   - タイムアウト処理の実装

3. **UI表示テスト**
   - 正常データ時の表示確認
   - 空データ時のfallback表示
   - APIエラー時のエラーメッセージ

4. **モックデータ残存の確認と削除**
   ```bash
   # 以下のファイルでモックデータを検索
   grep -r "mockData\|demoData\|DEMO_MODE" src/routes/itandi.tsx src/lib/itandi-client.ts
   ```

#### テストシナリオ

1. **正常系**:
   - 渋谷区で検索 → グラフ・数値が表示される
   - 港区で検索 → 異なるデータが表示される

2. **異常系**:
   - 存在しない地域で検索 → 適切なエラーメッセージ
   - API認証失敗 → 再ログイン促進メッセージ

3. **パフォーマンス**:
   - 初回ロード時間 < 3秒
   - 検索実行時間 < 5秒

#### 完了条件

- [ ] ステージング環境で実機テスト完了
- [ ] レスポンス例を保存（`docs/api-examples/itandi-response.json`）
- [ ] モックデータ完全削除確認
- [ ] エラーハンドリング実装完了

---

### 2. AI市場分析専用ページの新設

**新規ページ**: `/ai/market-analysis`

#### ファイル構成

```
src/
├── routes/
│   └── ai.tsx              # 新規作成
├── lib/
│   └── openai-client.ts    # 既存（拡張）
└── types/
    └── ai-analysis.ts      # 新規作成
```

#### 実装内容

##### 1. 型定義（`src/types/ai-analysis.ts`）

```typescript
export interface AIMarketAnalysisRequest {
  address?: string;
  keyword?: string;
  analysisType: 'market' | 'demographics' | 'comprehensive';
}

export interface AIMarketAnalysisResult {
  summary: string;
  keyFindings: string[];
  risks: string[];
  opportunities: string[];
  marketTrend: 'bullish' | 'neutral' | 'bearish';
  confidence: number; // 0-100
  generatedAt: string;
}
```

##### 2. フロントエンド（`src/routes/ai.tsx`）

```typescript
import { Hono } from 'hono';

const ai = new Hono();

ai.get('/market-analysis', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>AI市場分析 | My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold mb-6">AI市場分析</h1>
            
            <!-- 入力フォーム -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <form id="analysis-form">
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">対象住所</label>
                        <input type="text" name="address" 
                               class="w-full border rounded px-3 py-2"
                               placeholder="東京都渋谷区">
                    </div>
                    <button type="submit" 
                            class="bg-blue-600 text-white px-6 py-2 rounded">
                        分析開始
                    </button>
                </form>
            </div>
            
            <!-- ローディング -->
            <div id="loading" class="hidden">
                <div class="animate-pulse">分析中...</div>
            </div>
            
            <!-- 結果表示 -->
            <div id="result" class="hidden bg-white rounded-lg shadow p-6">
                <!-- 結果をここに表示 -->
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
        <script>
            document.getElementById('analysis-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                // AJAX実装
            });
        </script>
    </body>
    </html>
  `);
});

export default ai;
```

##### 3. API実装（`src/routes/api.tsx`に追加）

```typescript
api.post('/ai/market-analysis', authMiddleware, async (c) => {
  const { env } = c;
  const { address, keyword } = await c.req.json();

  // OpenAI GPT-4呼び出し
  const prompt = `
あなたは不動産市場の専門家です。
以下の地域について、詳細な市場分析を行ってください。

対象地域: ${address || keyword}

以下の観点で分析してください:
1. 現在の市場動向
2. 価格トレンド（過去3年）
3. 投資リスク
4. 投資機会
5. 将来展望

JSON形式で回答してください。
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }),
  });

  const data = await response.json();
  return c.json({ success: true, result: data });
});
```

#### UI要件

1. **ローディング表示**
   - スピナー or プログレスバー
   - 「分析中...（約30秒かかります）」

2. **エラー表示**
   - 「分析に失敗しました。再度お試しください。」
   - APIキー未設定時: 「管理者に連絡してください。」

3. **結果表示**
   - マークダウン形式でレンダリング
   - 「分析再実行」ボタン
   - PDF出力ボタン

#### 完了条件

- [ ] `/ai/market-analysis` ページ実装完了
- [ ] GPT-4 API統合完了
- [ ] UI実装完了（ローディング、エラー、結果表示）
- [ ] 分析履歴保存機能実装（D1データベース）
- [ ] モバイル対応確認

---

### 3. 事故物件調査（スティグマチェック）精度確認と強化

**対象**: `src/lib/stigma-checker.ts`, `src/lib/google-search-client.ts`

#### テストケース

##### 1. 大島てる掲載住所でテスト

```typescript
// テストアドレス（実際に大島てるに掲載されているもの）
const testAddresses = [
  '東京都港区六本木7-18-18',
  '東京都渋谷区道玄坂1-10-7',
  '東京都板橋区蓮根二丁目17-7',
];
```

**期待結果**:
- `hasStigma: true`
- `riskLevel: 'high'` または `'medium'`
- `findings` に大島てるの情報が含まれる

##### 2. 正常な物件でテスト

```typescript
const normalAddresses = [
  '東京都千代田区丸の内1-1-1', // 明らかに事故物件でない
];
```

**期待結果**:
- `hasStigma: false`
- `riskLevel: 'none'`

#### GPT-4プロンプト調整

**現在のプロンプトの問題点**:
- 検索結果の関連性判定が甘い可能性
- リスクレベルのしきい値が不明確

**改善案**:

```typescript
const improvedPrompt = `
あなたは不動産の心理的瑕疵調査の専門家です。

【重要な判定基準】
1. 住所が完全一致または近接している（番地まで一致）
2. 過去5年以内の事故・事件を優先
3. 自殺・他殺・孤独死・火災を特に重視
4. 単なる地域ニュースは除外

【リスクレベルの基準】
- high: 住所完全一致 + 自殺/他殺/火災
- medium: 住所近接 + 孤独死/その他事故
- low: 同じ地域の一般的な事件
- none: 該当情報なし

【検索結果】
${searchResultsText}

上記の基準に従い、厳密に判定してください。
`;
```

#### リスクレベルしきい値調整

```typescript
// src/lib/stigma-checker.ts
private calculateRiskLevel(findings: StigmaFinding[]): RiskLevel {
  if (findings.length === 0) return 'none';
  
  const hasHighRelevance = findings.some(f => f.relevance >= 90);
  const hasSeriousIncident = findings.some(f => 
    f.category === 'death' || f.category === 'crime'
  );
  
  if (hasHighRelevance && hasSeriousIncident) return 'high';
  if (hasHighRelevance || hasSeriousIncident) return 'medium';
  if (findings.length > 0) return 'low';
  
  return 'none';
}
```

#### 完了条件

- [ ] 3つのテストアドレスで正確な判定を確認
- [ ] GPT-4プロンプト改善実装
- [ ] リスクレベル計算ロジック実装
- [ ] 偽陽性（false positive）率 < 10%
- [ ] 偽陰性（false negative）率 < 5%

---

### 4. UI/UXガイドラインの徹底適用

#### 対応範囲

全ページ（特に以下）:
- `/properties/:id/analyze` - 収益分析フォーム
- `/properties/:id/comprehensive-report` - 統合レポート
- `/itandi/rental-market` - 賃貸相場分析
- `/stigma/check` - 事故物件調査

#### 実装内容

##### 1. プレースホルダー追加

```html
<!-- 修正前 -->
<input type="number" name="propertyPrice">

<!-- 修正後 -->
<input type="number" name="propertyPrice" 
       placeholder="例: 50000000"
       title="物件の購入価格（円）">
```

##### 2. ツールチップ追加

```html
<label class="flex items-center gap-2">
    NOI（営業純利益）
    <button type="button" 
            class="text-blue-600 hover:text-blue-800"
            title="Net Operating Income = 年間家賃収入 - 年間経費">
        <i class="fas fa-question-circle"></i>
    </button>
</label>
```

##### 3. モバイルビュー対応

```css
/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  display: none;
}

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
  }
  
  .desktop-nav {
    display: none;
  }
}
```

##### 4. 解説テキスト追加

各セクションに簡潔な日本語解説を追加:

```html
<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
    <p class="text-sm text-blue-800">
        <i class="fas fa-info-circle mr-2"></i>
        この分析では、物件の収益性をNOI、利回り、DSCR、LTVなどの指標で評価します。
    </p>
</div>
```

#### 完了条件

- [ ] 全フォームにプレースホルダー追加
- [ ] 金融指標にツールチップ追加
- [ ] モバイルビューでBottom Navigation表示確認
- [ ] 各セクションに解説追加
- [ ] フォント統一（NotoSansJP使用）

---

## 🟧 優先度：中（初期フェーズ）

### 5. 人口動態分析（e-Stat API）の初期実装

**新規ページ**: `/demographics/analyze`

#### ファイル構成

```
src/
├── routes/
│   └── demographics.tsx    # 新規作成
├── lib/
│   └── estat-client.ts     # 新規作成
└── types/
    └── demographics.ts     # 新規作成
```

#### 実装内容

##### 1. e-Stat APIクライアント（`src/lib/estat-client.ts`）

```typescript
export class EStatClient {
  private apiKey: string;
  private baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 国勢調査データ取得
   */
  async getPopulationData(areaCode: string): Promise<PopulationData> {
    const statsDataId = '0000030001'; // 国勢調査
    
    const url = new URL(`${this.baseUrl}/getStatsData`);
    url.searchParams.append('appId', this.apiKey);
    url.searchParams.append('statsDataId', statsDataId);
    url.searchParams.append('cdArea', areaCode);
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    return this.parsePopulationData(data);
  }

  /**
   * 住所から統計コードへ変換
   */
  async addressToCode(address: string): Promise<string> {
    // 実装: 住所文字列から都道府県・市区町村コードを取得
  }
}
```

##### 2. フロントエンド実装

**入力フォーム**:
- 都道府県ドロップダウン
- 市区町村ドロップダウン（連動）
- 住所入力（任意）

**出力UI**:
- 人口推移グラフ（Chart.js）
- 年齢別構成（円グラフ）
- 統計データテーブル

#### 完了条件

- [ ] e-Stat APIクライアント実装
- [ ] `/demographics/analyze` ページ実装
- [ ] グラフ表示実装
- [ ] キャッシュ実装（D1またはEdge KV）

---

### 6. 地図出力（Google Maps Static API）の強化

#### 対応内容

##### 1. 円形半径オーバーレイ追加

```typescript
function generateMapUrl(address: string, apiKey: string): string {
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
  
  // 中心座標取得
  const center = encodeURIComponent(address);
  
  // 200m円
  const circle200m = `color:0xff0000|weight:2|fillcolor:0xff000033|path=circle:center:${center}|radius:200`;
  
  // 1km円
  const circle1km = `color:0x0000ff|weight:2|fillcolor:0x0000ff33|path=circle:center:${center}|radius:1000`;
  
  return `${baseUrl}?center=${center}&zoom=15&size=800x600&scale=2&markers=${center}&path=${circle200m}&path=${circle1km}&key=${apiKey}`;
}
```

##### 2. PDF出力対応

**技術選択肢**:
- Puppeteer（サーバー生成）
- PDFKit（クライアント生成）

**実装例**（Puppeteer）:

```typescript
import puppeteer from 'puppeteer';

async function generatePDF(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(htmlContent);
  await page.setViewport({ width: 1200, height: 800 });
  
  const pdf = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
  });
  
  await browser.close();
  return pdf;
}
```

#### 完了条件

- [ ] 円形半径オーバーレイ実装
- [ ] 高解像度画像対応（scale=2）
- [ ] PDF出力機能実装
- [ ] エラーハンドリング実装

---

### 7. キャッシュ＆パフォーマンス最適化

#### 対応範囲

- 人口統計分析
- AI市場分析
- 事故物件調査

#### 実装方針

##### 1. D1データベースにキャッシュテーブル作成

```sql
-- migrations/0003_add_cache_tables.sql
CREATE TABLE IF NOT EXISTS analysis_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  cache_type TEXT NOT NULL, -- 'demographics' | 'ai_analysis' | 'stigma_check'
  data TEXT NOT NULL, -- JSON形式
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

CREATE INDEX idx_cache_key ON analysis_cache(cache_key);
CREATE INDEX idx_expires_at ON analysis_cache(expires_at);
```

##### 2. キャッシュキー生成

```typescript
function generateCacheKey(type: string, params: any): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as any);
  
  const paramsString = JSON.stringify(sortedParams);
  const hash = crypto.subtle.digest('SHA-256', new TextEncoder().encode(paramsString));
  
  return `${type}_${hash}`;
}
```

##### 3. キャッシュミドルウェア

```typescript
async function cacheMiddleware(c: Context, next: Function) {
  const cacheKey = generateCacheKey('ai_analysis', c.req.json());
  
  // キャッシュ確認
  const cached = await c.env.DB.prepare(
    'SELECT data FROM analysis_cache WHERE cache_key = ? AND expires_at > datetime("now")'
  ).bind(cacheKey).first();
  
  if (cached) {
    return c.json(JSON.parse(cached.data));
  }
  
  // 処理実行
  await next();
  
  // キャッシュ保存
  const result = c.res.json();
  await c.env.DB.prepare(
    'INSERT INTO analysis_cache (cache_key, cache_type, data, expires_at) VALUES (?, ?, ?, datetime("now", "+7 days"))'
  ).bind(cacheKey, 'ai_analysis', JSON.stringify(result)).run();
}
```

#### 完了条件

- [ ] キャッシュテーブル作成
- [ ] キャッシュミドルウェア実装
- [ ] キャッシュヒット率 > 70%確認
- [ ] レスポンスタイム改善確認（< 100ms）

---

## 🟩 優先度：低（拡張フェーズ）

### 8. 高度な分析機能（Phase 3構想）

#### 1. 10年DCFキャッシュフロー分析

**機能**:
- NPV（正味現在価値）計算
- IRR（内部収益率）計算
- 年別キャッシュフロー表

**実装ファイル**: `src/lib/dcf-calculator.ts`

#### 2. DRRスコア生成

**機能**:
- 人口動態スコア（e-Stat）
- 地価スコア（国土交通省）
- 再開発情報スコア
- 総合評価（A〜D）

**実装ファイル**: `src/lib/drr-score.ts`

#### 3. 地域資産性ヒートマップ

**機能**:
- 地価・交通利便性・賃料変化率をレイヤー表示
- Google Maps JavaScript API使用
- 色分けによる可視化

**実装ファイル**: `src/routes/heatmap.tsx`

---

## 📁 リファクタリング

### ディレクトリ構成・命名統一

#### 1. `api.tsx` 分割

**現状**: 3,800行の巨大ファイル

**改善案**:

```
src/routes/api/
├── index.ts              # ルートエクスポート
├── properties.ts         # 物件関連API
├── analysis.ts           # 分析関連API
├── ai.ts                 # AI関連API
├── itandi.ts             # イタンジBB API
├── stigma.ts             # 事故物件調査API
└── auth.ts               # 認証API
```

**実装例**:

```typescript
// src/routes/api/index.ts
import { Hono } from 'hono';
import properties from './properties';
import analysis from './analysis';
import ai from './ai';

const api = new Hono();

api.route('/properties', properties);
api.route('/analysis', analysis);
api.route('/ai', ai);

export default api;
```

#### 2. ファイル名誤字修正

```bash
# 修正前: My-Agent-Analitics
# 修正後: My-Agent-Analytics

# GitHub リポジトリ名変更は管理者権限が必要
# ローカルファイルのみ修正
```

#### 3. コンポーネント分割

**対象**: `src/routes/properties.tsx`（1,300行以上）

**分割案**:

```
src/components/
├── ReportCard.tsx        # レポートカード
├── ChartBox.tsx          # グラフ表示
├── FinancialForm.tsx     # 財務フォーム
└── PropertyList.tsx      # 物件一覧
```

#### 4. 型定義整理

**現状**: 各ファイルに型定義が散在

**改善案**:

```
src/types/
├── property.ts           # 物件関連型
├── analysis.ts           # 分析結果型
├── ai.ts                 # AI分析型
├── demographics.ts       # 人口動態型
└── index.ts              # 統合エクスポート
```

---

## 🛠️ 技術スタック・ツール

### フロントエンド
- **フレームワーク**: Hono (Cloudflare Workers)
- **スタイリング**: Tailwind CSS (CDN)
- **チャート**: Chart.js v4.x
- **HTTP**: Axios 1.6.0

### バックエンド
- **ランタイム**: Cloudflare Workers
- **データベース**: Cloudflare D1 (SQLite)
- **キャッシュ**: Cloudflare Edge KV（検討中）

### 外部API
- **OpenAI**: GPT-4o (AI分析)
- **Google Custom Search**: 事故物件検索
- **Google Maps Static**: 地図画像生成
- **e-Stat**: 人口統計データ
- **イタンジBB**: 賃貸相場データ
- **国土交通省**: 不動産取引データ

### 開発ツール
- **言語**: TypeScript 5.0
- **ビルド**: Vite
- **デプロイ**: Wrangler CLI
- **プロセス管理**: PM2 (開発環境)
- **テスト**: 包括的テストスクリプト

---

## 📝 実装手順

### Phase 1: 高優先度タスク（2週間）

1. Week 1:
   - [ ] Itandi BB実機テスト
   - [ ] AI市場分析ページ新設
   - [ ] スティグマチェック精度改善

2. Week 2:
   - [ ] UI/UXガイドライン適用
   - [ ] モバイル対応強化

### Phase 2: 中優先度タスク（3週間）

1. Week 3-4:
   - [ ] 人口動態分析実装
   - [ ] 地図出力強化

2. Week 5:
   - [ ] キャッシュ最適化
   - [ ] リファクタリング開始

### Phase 3: 低優先度タスク（4週間）

1. Week 6-9:
   - [ ] DCF分析実装
   - [ ] DRRスコア実装
   - [ ] ヒートマップ実装

---

## 📞 サポート・質問

**GitHub Issues**: https://github.com/koki-187/My-Agent-Analitics-genspark/issues

**必要情報**:
- 実装中の機能名
- エラーメッセージ
- 実行環境（ローカル/ステージング/本番）
- スクリーンショット

---

**作成者**: Genspark AI Assistant  
**最終更新**: 2025年1月5日  
**バージョン**: 1.0
