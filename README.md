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
- **📈 データ可視化**: インタラクティブなグラフとチャートで投資リターンを視覚化
- **📄 PDFレポート**: プロフェッショナルなPDFレポートを生成
- **🗺️ 役所調査支援**: 都市計画情報、ハザードマップ、建築制限の統合
- **🤖 AI分析**: OpenAI GPT-4による高度な市場分析
- **📱 PWA対応**: スマートフォンにインストール可能、オフライン機能搭載

## 🚀 デモ

**Sandbox環境**: [https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai](https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai)

**GitHub リポジトリ**: [https://github.com/koki-187/My-Agent-Analitics-genspark](https://github.com/koki-187/My-Agent-Analitics-genspark)

**元のNext.jsリポジトリ**: [https://github.com/koki-187/My-Agent-analytics](https://github.com/koki-187/My-Agent-analytics)

## 📋 現在の実装状況

### ✅ 実装済み機能

- [x] Hono フレームワークによるバックエンド
- [x] レスポンシブなランディングページ
- [x] API ヘルスチェック
- [x] PWA マニフェスト
- [x] Service Worker（オフライン対応）
- [x] 静的ファイル配信
- [x] TypeScript 完全対応
- [x] Vite ビルドシステム

### 🔄 実装中

- [ ] Google OAuth 認証
- [ ] D1 データベース統合
- [ ] 物件入力フォーム
- [ ] 投資指標計算エンジン
- [ ] グラフ・チャート表示

### 📝 今後の実装予定

- [ ] e-Stat API 統合（政府統計データ）
- [ ] OpenAI API 統合（AI分析）
- [ ] PDF レポート生成
- [ ] ユーザーダッシュボード
- [ ] 物件データベース管理
- [ ] レポート共有機能

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

`.dev.vars` ファイルを編集して、必要なAPI キーを設定：

```bash
# .dev.vars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
ESTAT_API_KEY=your-estat-api-key
SESSION_SECRET=your-session-secret
```

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

```bash
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name my-agent-analytics
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name my-agent-analytics
npx wrangler pages secret put OPENAI_API_KEY --project-name my-agent-analytics
npx wrangler pages secret put ESTAT_API_KEY --project-name my-agent-analytics
```

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
  "version": "1.0.0"
}
```

### Hello World

```http
GET /api/hello
```

**レスポンス:**
```json
{
  "message": "Hello from My Agent Analytics!"
}
```

## 🗂️ プロジェクト構造

```
my-agent-analytics/
├── src/
│   └── index.tsx              # メインアプリケーション
├── public/
│   ├── static/
│   │   ├── icons/             # PWAアイコン
│   │   └── manifest.json      # PWAマニフェスト
│   └── sw.js                  # Service Worker
├── migrations/                # D1データベースマイグレーション
├── docs/                      # ドキュメント
│   ├── PROJECT_OVERVIEW.md
│   └── MIGRATION_PLAN.md
├── nextjs-backup/             # Next.js版のバックアップ
├── dist/                      # ビルド出力
├── wrangler.jsonc             # Cloudflare設定
├── vite.config.ts             # Viteビルド設定
├── tsconfig.json              # TypeScript設定
├── ecosystem.config.cjs       # PM2設定
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

## 📞 サポート

問題が発生した場合は、[GitHubのIssue](https://github.com/koki-187/My-Agent-Analitics-genspark/issues)を作成してください。

---

**開発チーム**: My Agent Team  
**最終更新**: 2024年10月30日  
**バージョン**: 1.0.0
