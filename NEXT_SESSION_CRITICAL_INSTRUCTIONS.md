# 🚨 次セッション開始時の最重要指示書

**作成日**: 2025年11月5日  
**優先度**: 🔥 CRITICAL  
**必読**: このドキュメントを読まずに作業を開始しないでください

---

## ⚠️ 作業開始前に必ずすること

### 1. 📖 過去のドキュメントを全て確認（30分程度）

次のドキュメントを**この順番で**読んでください：

```bash
cd /home/user/webapp

# 1. このセッションの引き継ぎドキュメント（最優先）
cat HANDOFF_2025-11-05.md

# 2. 6つの主要機能の実装状況
cat CORE_FEATURES_STATUS.md

# 3. 実際の問題と既実装機能
cat ACTUAL_ISSUES_FOUND.md

# 4. 作業継続ガイド
cat HOW_TO_CONTINUE_WORK.md

# 5. プロジェクト全体像
cat README.md
```

---

## 🎯 このプロジェクトの目的と制約

### プロジェクトの目的
**「簡単に実需用不動産・収益用不動産の精度の高い物件調査」**を実現する不動産投資分析ツール。

### 重要な制約条件
1. **ユーザーはAPIキーを入力しない** - 全て管理者が事前設定
2. **6つの主要機能が全て本番動作してからリリース** - デモモードではダメ
3. **事故物件調査は実際にウェブ検索が必要** - GPT-4だけでは不十分

---

## 🔥 最優先タスク（Phase 1: リリースブロッカー）

### Task 1: 事故物件調査の修正 🔥🔥🔥 **最重要**

#### 問題の詳細
- **現象**: 大島てるに登録されている物件でも「該当なし」と表示される
- **原因**: OpenAI GPT-4 APIはリアルタイムでウェブ検索できない
- **影響**: 機能が正常に動作していない（精度ゼロ）

#### 解決策
Google Custom Search API + OpenAI GPT-4の2段階処理を実装：

**Step 1: Google検索でデータ収集**
```typescript
// src/lib/google-search-client.ts (新規作成)
export class GoogleSearchClient {
  private apiKey: string;
  private searchEngineId: string;

  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async search(query: string): Promise<SearchResult[]> {
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    return (data.items || []).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));
  }
}
```

**Step 2: 検索結果をGPT-4で分析**
```typescript
// src/lib/stigma-checker.ts (修正)
import { GoogleSearchClient } from './google-search-client';

export class StigmatizedPropertyChecker {
  private googleSearch: GoogleSearchClient;
  private openai: any;

  constructor(googleApiKey: string, searchEngineId: string, openaiApiKey: string) {
    this.googleSearch = new GoogleSearchClient(googleApiKey, searchEngineId);
    this.openai = openaiApiKey; // OpenAI client初期化
  }

  async checkProperty(address: string, propertyName?: string): Promise<StigmaCheckResult> {
    // Step 1: 実際にウェブ検索
    const searchQuery = `${address} ${propertyName || ''} 事故 事件 火災 自殺 大島てる`;
    const searchResults = await this.googleSearch.search(searchQuery);

    if (searchResults.length === 0) {
      return {
        hasStigma: false,
        confidence: 'high',
        message: 'ウェブ検索の結果、関連する情報は見つかりませんでした。',
        sources: []
      };
    }

    // Step 2: 検索結果をGPT-4で分析
    const analysisPrompt = `
あなたは不動産の心理的瑕疵調査の専門家です。
以下のGoogle検索結果から、「${address}」に関する事故物件情報を分析してください。

検索結果:
${searchResults.map(r => `
タイトル: ${r.title}
URL: ${r.link}
概要: ${r.snippet}
`).join('\n---\n')}

以下のJSON形式で分析結果を返してください:
{
  "hasStigma": boolean,  // 心理的瑕疵の可能性があるか
  "confidence": "high" | "medium" | "low",  // 判定の確信度
  "incidents": [  // 発見された事件・事故
    {
      "type": "自殺" | "他殺" | "孤独死" | "火災" | "その他",
      "date": "YYYY年MM月" または "不明",
      "description": "事件の概要",
      "source": "情報源URL"
    }
  ],
  "message": "総合判定のメッセージ"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: analysisPrompt }],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return {
      ...analysis,
      sources: searchResults.map(r => ({
        title: r.title,
        url: r.link
      }))
    };
  }
}
```

**Step 3: APIエンドポイント修正**
```typescript
// src/routes/api.tsx (修正箇所)
api.post('/properties/stigma-check', authMiddleware, async (c) => {
  const { env } = c;
  const { address, propertyName } = await c.req.json();
  
  // 環境変数チェック
  if (!env.GOOGLE_CUSTOM_SEARCH_API_KEY || !env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
    return c.json({
      success: false,
      mode: 'demo',
      error: 'Google Custom Search APIキーが設定されていません'
    });
  }

  const { StigmatizedPropertyChecker } = await import('../lib/stigma-checker');
  const checker = new StigmatizedPropertyChecker(
    env.GOOGLE_CUSTOM_SEARCH_API_KEY,
    env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
    env.OPENAI_API_KEY || 'demo'
  );
  
  try {
    const result = await checker.checkProperty(address, propertyName);
    
    return c.json({
      success: true,
      mode: 'full',
      ...result
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});
```

#### 環境変数設定（Cloudflare Secrets）
```bash
# Google Custom Search API設定
npx wrangler pages secret put GOOGLE_CUSTOM_SEARCH_API_KEY --project-name my-agent-analytics
# 入力: YOUR_GOOGLE_API_KEY

npx wrangler pages secret put GOOGLE_CUSTOM_SEARCH_ENGINE_ID --project-name my-agent-analytics
# 入力: YOUR_SEARCH_ENGINE_ID

# OpenAI APIキー設定（既存確認）
npx wrangler pages secret list --project-name my-agent-analytics | grep OPENAI_API_KEY
```

#### テスト方法
```bash
# 1. ローカル開発環境で .dev.vars に追加
cat >> .dev.vars << EOF
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id
EOF

# 2. サービス再起動
pm2 restart my-agent-analytics

# 3. テスト実行（実際に大島てるに登録されている住所を使用）
curl -X POST http://localhost:3000/api/properties/stigma-check \
  -H "Content-Type: application/json" \
  -d '{"address": "東京都渋谷区道玄坂1-2-3", "propertyName": "〇〇マンション"}'
```

---

### Task 2: イタンジBB本番API統合 🔥

#### 必要な作業
1. **ユーザーから認証情報を取得**
   - イタンジBBアカウントのメールアドレス
   - イタンジBBアカウントのパスワード

2. **Cloudflare Secretsに設定**
```bash
npx wrangler pages secret put ITANDI_EMAIL --project-name my-agent-analytics
# 入力: user@example.com

npx wrangler pages secret put ITANDI_PASSWORD --project-name my-agent-analytics
# 入力: password123
```

3. **デプロイ後の動作確認**
   - デモモードバナーが消えることを確認
   - 実際の賃料データが取得されることを確認

---

## 📋 Phase 2: 機能完成（高優先度）

### Task 3: AI市場分析専用ページ作成

#### 実装内容
```typescript
// src/routes/ai-market.tsx (新規作成)
import { Hono } from 'hono';

const aiMarket = new Hono();

aiMarket.get('/market-analysis', authMiddleware, async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>AI市場分析 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100">
        <div class="container mx-auto p-8">
            <h1 class="text-3xl font-bold mb-6">AI市場分析</h1>
            
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">物件情報入力</h2>
                <form id="market-analysis-form">
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">住所</label>
                        <input type="text" id="address" class="w-full border rounded px-3 py-2" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">物件種別</label>
                        <select id="property-type" class="w-full border rounded px-3 py-2">
                            <option value="mansion">分譲マンション</option>
                            <option value="house">戸建て</option>
                            <option value="land">土地</option>
                        </select>
                    </div>
                    <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-lg">
                        AI分析を実行
                    </button>
                </form>
            </div>
            
            <div id="analysis-result" class="hidden bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold mb-4">分析結果</h2>
                <div id="result-content"></div>
            </div>
        </div>
        
        <script>
            document.getElementById('market-analysis-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                // API呼び出しとレンダリング実装
            });
        </script>
    </body>
    </html>
  `);
});

export default aiMarket;
```

#### 既存APIの確認
```typescript
// src/routes/api.tsx 内の既存実装を確認
// POST /api/ai/market-analysis エンドポイントが存在するはず
```

---

### Task 4: 人口動態分析機能実装

#### e-Stat API統合
```typescript
// src/lib/estat-client.ts (新規作成)
export class EStatClient {
  private apiKey: string;
  private baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPopulationData(prefCode: string, cityCode: string) {
    const statsId = '0003410379'; // 人口推計統計ID
    const url = `${this.baseUrl}/getStatsData?appId=${this.apiKey}&statsDataId=${statsId}&cdArea=${prefCode}${cityCode}`;
    
    const response = await fetch(url);
    const data = await response.json();
    return this.parsePopulationData(data);
  }
}
```

---

## 🔑 環境変数チェックリスト

作業開始前に以下を確認：

```bash
# Cloudflare Secretsの確認
npx wrangler pages secret list --project-name my-agent-analytics

# 必要な環境変数:
# ✅ OPENAI_API_KEY - 事故物件調査、AI市場分析
# ⚠️ GOOGLE_CUSTOM_SEARCH_API_KEY - 事故物件調査（新規）
# ⚠️ GOOGLE_CUSTOM_SEARCH_ENGINE_ID - 事故物件調査（新規）
# ⚠️ ITANDI_EMAIL - イタンジBB
# ⚠️ ITANDI_PASSWORD - イタンジBB
# 🔲 ESTAT_API_KEY - 人口動態分析（Phase 2）
# 🔲 GOOGLE_MAPS_API_KEY - 地図生成（Phase 2）
```

---

## 📊 成功の定義

次のセッション終了時に以下の状態を目指す：

### Phase 1完了の条件（最低限）
- ✅ 事故物件調査が実際に大島てるを検索できる
- ✅ 実際の大島てる登録物件でテスト成功
- ✅ イタンジBB本番APIで動作（デモモード脱却）

### Phase 2完了の条件（理想）
- ✅ AI市場分析専用ページ作成
- ✅ 人口動態分析ページ実装
- ✅ 6つの主要機能が全て本番動作

---

## 🚫 やってはいけないこと

### ❌ ドキュメントを読まずに作業開始
- 必ず HANDOFF_2025-11-05.md と CORE_FEATURES_STATUS.md を読む

### ❌ 既存実装を確認せずに「未実装」と判断
- 必ず grep 検索と実際のファイル確認を行う

### ❌ テストせずにデプロイ
- ローカルで必ず動作確認してからデプロイ

### ❌ 環境変数なしで本番デプロイ
- Cloudflare Secretsを設定してからデプロイ

---

## 📞 ユーザーへの確認事項

作業開始時に以下を確認してください：

### 1. API認証情報の確認
```
□ Google Custom Search APIキーを取得済みか？
  - https://developers.google.com/custom-search/v1/overview
  
□ イタンジBBアカウントのメールアドレス・パスワード
  - ユーザーに確認が必要
  
□ e-Stat APIキー（Phase 2で必要）
  - https://www.e-stat.go.jp/api/
```

### 2. 優先順位の確認
```
ユーザーに確認:
「次の優先順位で進めます。よろしいですか？」

1位: 事故物件調査の修正（Google検索統合）
2位: イタンジBB本番API統合
3位: AI市場分析専用ページ作成
4位: 人口動態分析実装
```

---

## 🎯 作業フロー

### Step 1: 環境確認（15分）
```bash
cd /home/user/webapp

# ドキュメント確認
cat HANDOFF_2025-11-05.md
cat CORE_FEATURES_STATUS.md

# サービス確認
pm2 list
curl http://localhost:3000/api/health
```

### Step 2: ユーザー確認（5分）
- API認証情報の有無を確認
- 優先順位を確認
- 期待する成果物を確認

### Step 3: 実装（本作業）
- Task 1から順番に実装
- 1つのタスクを完了してから次へ

### Step 4: テスト（各タスク後）
```bash
# ビルド
npm run build

# サービス再起動
pm2 restart my-agent-analytics

# 動作確認
curl http://localhost:3000/api/health
bash comprehensive-test.sh
```

### Step 5: コミット＆デプロイ
```bash
# コミット
git add .
git commit -m "Task 1完了: 事故物件調査にGoogle検索統合"

# GitHubプッシュ
git push origin main

# Cloudflare Pagesデプロイ
npx wrangler pages deploy dist --project-name my-agent-analytics
```

### Step 6: 本番環境テスト
```bash
# 本番環境での動作確認
curl https://9983b0ad.my-agent-analytics.pages.dev/api/health
```

---

## 📚 重要ファイルの場所

```
/home/user/webapp/
├── HANDOFF_2025-11-05.md           ⭐ このセッションの引き継ぎ
├── CORE_FEATURES_STATUS.md         ⭐ 6機能の実装状況
├── ACTUAL_ISSUES_FOUND.md          ⭐ 既知の問題
├── HOW_TO_CONTINUE_WORK.md         ⭐ 作業継続ガイド
├── NEXT_SESSION_CRITICAL_INSTRUCTIONS.md  ⭐ このファイル
├── src/
│   ├── lib/
│   │   ├── stigma-checker.ts       🔧 要修正
│   │   ├── google-search-client.ts 🆕 新規作成
│   │   ├── itandi-client.ts        ✅ 実装済み
│   │   └── estat-client.ts         🆕 新規作成（Phase 2）
│   └── routes/
│       ├── api.tsx                 🔧 要修正
│       ├── stigma.tsx              ✅ 実装済み
│       ├── itandi.tsx              ✅ 実装済み
│       ├── ai-market.tsx           🆕 新規作成（Phase 2）
│       └── demographics.tsx        🆕 新規作成（Phase 2）
└── .dev.vars                       🔧 環境変数追加
```

---

## 🎓 技術的な注意事項

### Cloudflare Workers/Pagesの制約
- ❌ Node.js APIは使えない（fs, path, etc.）
- ✅ Fetch API、Web Crypto APIを使う
- ✅ 外部APIは全てfetchで呼び出す

### TypeScript型定義
```typescript
// src/types/stigma.ts に型定義追加
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface StigmaCheckResult {
  hasStigma: boolean;
  confidence: 'high' | 'medium' | 'low';
  incidents?: Array<{
    type: string;
    date: string;
    description: string;
    source: string;
  }>;
  message: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
}
```

---

## 📞 問題が発生したら

### サービスが起動しない
```bash
fuser -k 3000/tcp
pm2 delete all
pm2 start ecosystem.config.cjs
```

### ビルドエラー
```bash
rm -rf dist .wrangler node_modules/.vite
npm run build
```

### デプロイエラー
```bash
npx wrangler whoami
npx wrangler pages deploy dist --project-name my-agent-analytics
```

---

## 🎯 最終チェックリスト

作業完了前に以下を確認：

```
Phase 1完了チェック:
□ 事故物件調査でGoogle検索が動作
□ 実際の大島てる登録物件でテスト成功
□ イタンジBB本番APIで動作
□ Cloudflare Secretsに環境変数設定
□ 本番環境でテスト成功
□ GitHubにプッシュ完了
□ ドキュメント更新完了

Phase 2完了チェック:
□ AI市場分析専用ページ作成
□ 人口動態分析ページ作成
□ 6つの主要機能が全て本番動作
□ デモモード表示が全て消えている
```

---

## 📝 このセッションで更新すべきドキュメント

作業完了後に以下を更新：

1. **CORE_FEATURES_STATUS.md**
   - 各機能の実装状況を更新
   - 本番動作の確認状況を更新

2. **ACTUAL_ISSUES_FOUND.md**
   - 修正した問題を記録
   - 新たに発見した問題を記録

3. **README.md**
   - 機能一覧を最新化
   - デプロイ手順を確認

4. **HANDOFF_[日付].md** (新規作成)
   - このセッションの作業内容
   - 次セッションへの引き継ぎ

---

## 🚀 作業開始の合図

以下を確認したら作業開始：

```bash
# 1. ドキュメント確認完了
echo "✅ HANDOFF_2025-11-05.md 確認完了"
echo "✅ CORE_FEATURES_STATUS.md 確認完了"

# 2. ユーザー確認完了
echo "✅ API認証情報確認完了"
echo "✅ 優先順位確認完了"

# 3. 環境確認完了
pm2 list
curl http://localhost:3000/api/health

# 4. 作業開始
echo "🚀 Task 1: 事故物件調査の修正 開始"
```

---

**最終確認**: このドキュメントと HANDOFF_2025-11-05.md を読んでから作業を開始してください。

**緊急連絡先**: プロジェクトの過去ログ、ACTUAL_ISSUES_FOUND.md、HOW_TO_CONTINUE_WORK.md を参照してください。

**成功を祈ります！🎉**
