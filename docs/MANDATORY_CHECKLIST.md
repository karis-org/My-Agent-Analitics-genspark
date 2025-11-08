# 🔴 必読チェックリスト - 作業開始前に必ず確認

## ⚠️ このドキュメントの重要性

**このチェックリストは、過去の失敗から学んだ教訓をまとめたものです。**  
作業開始前に必ず全項目を確認し、同じ問題を繰り返さないでください。

---

## 📋 作業開始前の必須確認事項

### 1. 現在のプロジェクト状態を把握する

- [ ] **README.mdを読む** - プロジェクト概要、最新デプロイURL、完了機能を確認
- [ ] **PHASE_4_PLAN.mdを読む** - 次の実装計画と優先度を確認
- [ ] **KNOWN_ISSUES.mdを読む** - 既知の問題と回避策を確認
- [ ] **HANDOFF_TO_NEXT_AI.mdを読む** - 前回のセッション内容と引き継ぎ事項を確認

### 2. 技術スタックとアーキテクチャの確認

- [ ] **Hono Framework** - Cloudflare Workers向けの軽量フレームワーク使用
- [ ] **Cloudflare Pages** - エッジデプロイメント（Node.js APIは使用不可）
- [ ] **TypeScript** - 全コードはTypeScriptで記述
- [ ] **Tailwind CSS** - CDN版を使用（ビルドプロセスなし）
- [ ] **Cloudflare D1** - SQLiteベースの分散データベース
- [ ] **PM2** - 開発環境のプロセス管理

### 3. 開発環境の制約

**Cloudflare Workers環境の制限を理解する:**
- ❌ Node.js固有のAPI使用不可（`fs`, `path`, `crypto`, `child_process`等）
- ❌ ファイルシステムアクセス不可（実行時にファイル読み書きできない）
- ❌ 長時間実行プロセス不可（10ms CPU制限）
- ✅ Web標準API使用（Fetch API, Web Crypto API）
- ✅ 静的ファイルは`public/static/`に配置し`serveStatic`で配信
- ✅ データベースはCloudflare D1使用

### 4. Git & GitHubの重要ルール

**CRITICAL: GitHub Appの権限制限を理解する:**
- ❌ `.github/workflows/`ファイルを直接pushできない
- ✅ `setup_github_environment`を呼び出してから操作
- ✅ Workflowファイルはユーザーが手動でGitHub UIから作成
- ✅ `docs/GITHUB_ACTIONS_SETUP.md`に完全な手順が記載済み

**Git操作のベストプラクティス:**
- ✅ 作業開始前に`git pull origin main`で最新を取得
- ✅ 頻繁にコミット（機能単位で）
- ✅ 明確なコミットメッセージ（日本語、絵文字使用可）
- ✅ pushする前にテストを実行（`npm test`）

### 5. テストとデプロイメント

**テスト実行:**
```bash
cd /home/user/webapp && npm test
# 期待値: 28/28 PASS (100%)
```

**ローカルサーバー起動:**
```bash
# ポートクリーンアップ
fuser -k 3000/tcp 2>/dev/null || true

# ビルド（初回または大きな変更後）
cd /home/user/webapp && npm run build

# PM2で起動
cd /home/user/webapp && pm2 start ecosystem.config.cjs

# 動作確認
curl http://localhost:3000
```

**本番デプロイ:**
```bash
# 1. setup_cloudflare_api_keyを呼び出し
# 2. ビルド
cd /home/user/webapp && npm run build

# 3. デプロイ
npx wrangler pages deploy dist --project-name my-agent-analytics
```

### 6. ドキュメント更新ルール

**変更後は必ずドキュメントを更新:**
- [ ] **README.md** - 新機能、デプロイURL、バージョン番号を更新
- [ ] **KNOWN_ISSUES.md** - 新しく発見した問題を追加
- [ ] **HANDOFF_TO_NEXT_AI.md** - セッション終了時に作業内容を記録

### 7. ファイル構造の理解

```
/home/user/webapp/
├── src/
│   ├── index.tsx              # メインアプリケーション
│   ├── routes/                # ページとAPIルート
│   │   ├── properties.tsx     # 物件管理（172KB → 91KB最適化済み）
│   │   ├── dashboard.tsx      # ダッシュボード
│   │   ├── itandi.tsx         # 賃貸相場分析
│   │   └── api.tsx            # APIエンドポイント
│   ├── lib/                   # ライブラリ
│   └── types/                 # 型定義
├── public/static/             # 静的ファイル（/static/*でアクセス）
├── migrations/                # D1マイグレーション
├── docs/                      # ドキュメント
│   ├── MANDATORY_CHECKLIST.md # このファイル
│   ├── KNOWN_ISSUES.md        # 既知の問題
│   ├── HANDOFF_TO_NEXT_AI.md  # 引き継ぎ
│   └── GITHUB_ACTIONS_SETUP.md # CI/CDセットアップ
├── .github/workflows/         # GitHub Actions（手動設定必要）
├── PHASE_4_PLAN.md            # Phase 4実装計画
├── README.md                  # プロジェクト概要
├── ecosystem.config.cjs       # PM2設定
├── wrangler.jsonc             # Cloudflare設定
└── package.json               # 依存関係とスクリプト
```

---

## 🚫 絶対にやってはいけないこと

### 1. ファイル削除・移動
- ❌ **既存のドキュメントを削除しない**（README.md, docs/配下）
- ❌ **マイグレーションファイルを削除・変更しない**（migrations/）
- ❌ **テストスクリプトを削除しない**（tests/）

### 2. 構造変更
- ❌ **プロジェクト構造を大幅に変更しない**（事前相談なし）
- ❌ **依存関係を勝手に追加しない**（package.jsonの変更は慎重に）
- ❌ **D1データベーススキーマを直接変更しない**（マイグレーション経由で変更）

### 3. デプロイ
- ❌ **テスト未実行でデプロイしない**
- ❌ **ビルドエラーを無視してデプロイしない**
- ❌ **本番環境で直接テストしない**（ローカルで検証）

### 4. Git操作
- ❌ **`.github/workflows/`を直接pushしない**（GitHub App制限）
- ❌ **force push しない**（`git push -f`は緊急時のみ）
- ❌ **`.env`や`.dev.vars`をコミットしない**（機密情報）

---

## ✅ 推奨される作業フロー

### 標準作業手順:

1. **準備**
   ```bash
   # 最新を取得
   cd /home/user/webapp && git pull origin main
   
   # 必読ドキュメント確認
   cat docs/MANDATORY_CHECKLIST.md
   cat docs/KNOWN_ISSUES.md
   cat docs/HANDOFF_TO_NEXT_AI.md
   ```

2. **実装**
   ```bash
   # ファイル編集（Read → Edit/MultiEdit）
   # 変更をローカルでテスト
   npm run build
   pm2 restart webapp
   curl http://localhost:3000
   ```

3. **テスト**
   ```bash
   # 全テスト実行
   npm test
   # 期待値: 28/28 PASS
   ```

4. **コミット**
   ```bash
   # 変更をコミット
   git add -A
   git commit -m "✨ 機能追加: 説明"
   ```

5. **デプロイ**
   ```bash
   # Cloudflareにデプロイ
   npx wrangler pages deploy dist --project-name my-agent-analytics
   ```

6. **プッシュ**
   ```bash
   # GitHubにプッシュ（setup_github_environment実行後）
   git push origin main
   ```

7. **ドキュメント更新**
   ```bash
   # README.md更新
   # HANDOFF_TO_NEXT_AI.md更新
   ```

8. **バックアップ**
   ```bash
   # ProjectBackup toolを使用してバックアップ作成
   ```

---

## 📞 問題が発生したら

### デバッグ手順:

1. **エラーメッセージを注意深く読む**
   - エラーの種類を特定（ビルドエラー、実行時エラー、デプロイエラー）
   - エラーメッセージをKNOWN_ISSUES.mdで検索

2. **ログを確認**
   ```bash
   # PM2ログ
   pm2 logs --nostream
   
   # ビルドログ
   npm run build
   ```

3. **リセット・再試行**
   ```bash
   # キャッシュクリア
   rm -rf dist .wrangler node_modules
   npm install
   npm run build
   ```

4. **KNOWN_ISSUES.mdを確認**
   - 同じ問題が記載されているか確認
   - 記載されている解決策を試す

5. **それでも解決しない場合**
   - HANDOFF_TO_NEXT_AI.mdに問題を詳細に記録
   - ユーザーに報告

---

## 📚 関連ドキュメント

- **[KNOWN_ISSUES.md](./KNOWN_ISSUES.md)** - 既知の問題と解決策
- **[HANDOFF_TO_NEXT_AI.md](./HANDOFF_TO_NEXT_AI.md)** - 引き継ぎドキュメント
- **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** - CI/CDセットアップ手順
- **[PHASE_4_PLAN.md](../PHASE_4_PLAN.md)** - 次の実装計画
- **[README.md](../README.md)** - プロジェクト概要

---

**最終更新**: 2025-11-08（Session 16）  
**バージョン**: 1.0.0  
**作成者**: GenSpark AI Assistant
