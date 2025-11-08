# 🔴 既知の問題リスト

## ⚠️ このドキュメントの目的

このドキュメントは、プロジェクトで発見された既知の問題、制限事項、回避策をまとめたものです。  
新しい問題が発見された場合は、このファイルに追記してください。

---

## 🚨 重大な問題（対応必須）

### 1. GitHub Actions Workflows の権限制限

**問題**: GenSpark GitHub Appには`workflows`権限がないため、`.github/workflows/`ファイルを直接pushできない

**エラーメッセージ**:
```
! [remote rejected] main -> main (refusing to allow a GitHub App to create or update workflow `.github/workflows/deploy.yml` without `workflows` permission)
```

**現在の状態**:
- ✅ `test.yml`と`deploy.yml`ファイルは作成済み（`.github/workflows/`に存在）
- ❌ GitHubリポジトリには未反映（push不可）

**解決策**:
1. ユーザーがGitHub Web UIから手動でworkflowファイルを作成する
2. 詳細手順は`docs/GITHUB_ACTIONS_SETUP.md`を参照
3. ファイル内容は`.github/workflows/test.yml`と`.github/workflows/deploy.yml`をコピー

**回避策**:
- Workflowファイル以外の変更は通常通りpush可能
- CI/CDは手動設定後に自動化される

**関連ドキュメント**: `docs/GITHUB_ACTIONS_SETUP.md`

---

## ⚠️ 制限事項（設計上の制約）

### 2. Cloudflare Workers/Pagesの実行環境制限

**問題**: Cloudflare Workers環境ではNode.js固有のAPIが使用できない

**使用不可なAPI**:
- ❌ `fs` - ファイルシステムアクセス
- ❌ `path` - パス操作（Web標準の`URL`使用）
- ❌ `crypto` - Node.js crypto（Web Crypto API使用）
- ❌ `child_process` - 子プロセス実行
- ❌ `net`, `dgram`, `dns` - ネットワーク低レベルAPI

**影響**:
- 実行時にファイルを読み書きできない
- 静的ファイルは`public/static/`に配置し、ビルド時に含める必要がある
- PDFやExcel生成は外部APIまたはブラウザ側で行う

**解決策**:
- Web標準APIを使用（Fetch API, Web Crypto API等）
- 静的ファイルは`serveStatic`で配信
- 動的ファイル生成はクライアントサイドで実装

### 3. CPU時間制限

**問題**: Cloudflare Workersは10ms（無料プラン）または30ms（有料プラン）のCPU時間制限がある

**影響**:
- 複雑な計算や大量データ処理に制約
- 同期的な重い処理は実行できない

**解決策**:
- 重い処理は外部API経由で実行（OpenAI, Google等）
- データベースクエリを最適化
- キャッシュを積極的に活用

### 4. バンドルサイズ制限

**問題**: Cloudflare Workersは10MB（圧縮後）のサイズ制限がある

**現在のサイズ**: 613KB（問題なし）

**解決策**:
- 大きなライブラリは避ける
- CDNからライブラリを読み込む（Chart.js, Tailwind等）
- 必要に応じてコード分割

---

## 🐛 軽微な問題（改善推奨）

### 5. モバイル最適化の完了度

**問題**: 主要3ページ（properties, dashboard, itandi）はモバイル最適化済みだが、他のページは未対応

**未対応ページ**:
- agents.tsx（エージェント管理）
- settings.tsx（設定ページ）
- help.tsx（ヘルプページ）

**影響**: モバイルデバイスでの表示が最適化されていない可能性

**解決策**: Phase 4で対応予定（PHASE_4_PLAN.md参照）

**優先度**: 中

### 6. イタンジBB API環境変数

**問題**: 環境変数`ITANDI_EMAIL`と`ITANDI_PASSWORD`が一部環境で未設定の可能性

**現在の状態**:
- 本番環境（Cloudflare Pages）: 設定済み
- ローカル開発環境: `.dev.vars`で設定

**影響**: API認証失敗時にデモモードにフォールバック

**解決策**:
- 本番環境では設定済みのため問題なし
- 新しい環境では以下のコマンドで設定:
  ```bash
  npx wrangler pages secret put ITANDI_EMAIL --project-name my-agent-analytics
  npx wrangler pages secret put ITANDI_PASSWORD --project-name my-agent-analytics
  ```

**優先度**: 低（既に対応済み）

---

## 📝 改善提案（将来の実装）

### 7. E2Eテストの欠如

**問題**: 現在のテストスイートは28テスト（ユニット10、インテグレーション18）だが、E2Eテストがない

**影響**: ブラウザでの実際のユーザー操作をテストできない

**提案**: Phase 4-5でPlaywright E2Eテストを導入（PHASE_4_PLAN.md参照）

**優先度**: 低

### 8. パフォーマンス最適化の余地

**問題**: 現在のビルドサイズは613KB（問題ないレベル）だが、さらなる最適化の余地あり

**改善案**:
- 画像最適化（WebP形式、lazy loading）
- コード分割（route-based code splitting）
- Service Worker強化（キャッシュ戦略最適化）

**提案**: Phase 4-4でパフォーマンス最適化実施（PHASE_4_PLAN.md参照）

**優先度**: 中

### 9. データ可視化の強化

**問題**: 現在のグラフ機能はChart.jsで実装済みだが、インタラクティブ性が低い

**改善案**:
- インタラクティブチャート（zoom, pan, drill-down）
- 物件比較機能（複数物件のグラフ比較）
- エクスポート機能強化（PNG, SVG, データCSV）

**提案**: Phase 4-1でデータ可視化強化実施（PHASE_4_PLAN.md参照）

**優先度**: 高

---

## 🔍 過去に修正された問題（参考）

### 10. OCR築年数認識の問題（✅ 修正済み）

**問題**: 和暦表記（昭和、平成）を正しく認識できなかった

**修正内容**: OCR APIプロンプトに和暦変換ロジックを追加

**修正日**: Session 5（2025-11-06）

### 11. 統合レポートの評価実行ボタンリセット（✅ 修正済み）

**問題**: 「評価実行」ボタンをクリックすると、すべての選択がリセットされる

**修正内容**: イベントハンドラーのバブリング問題を修正

**修正日**: Session 5（2025-11-06）

### 12. properties.tsxファイルサイズ問題（✅ 修正済み）

**問題**: properties.tsxが172KBと巨大で、メンテナンス困難

**修正内容**: ファイル分割（172KB → 91KB、47%削減）

**修正日**: Session 12（Phase 2-1）

### 13. GitHub Actions workflows pushエラー（⚠️ 部分的に解決）

**問題**: `.github/workflows/`ファイルをpushできない

**現在の対応**: 
- ✅ ドキュメント作成（GITHUB_ACTIONS_SETUP.md）
- ✅ 手動設定手順の提供
- ⏳ ユーザーによる手動設定待ち

**最終解決**: ユーザーがGitHub Web UIから手動設定する必要あり

---

## 🛠️ トラブルシューティング

### よくある問題と解決策

#### ビルドエラー: "Module not found"
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

#### PM2起動エラー: "Port 3000 already in use"
```bash
# ポートをクリーンアップ
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete all
pm2 start ecosystem.config.cjs
```

#### デプロイエラー: "Wrangler authentication failed"
```bash
# Cloudflare API keyを再設定
# setup_cloudflare_api_key toolを呼び出し
```

#### テスト失敗: "Server not responding"
```bash
# サーバーが起動しているか確認
pm2 list
curl http://localhost:3000

# 起動していない場合
pm2 start ecosystem.config.cjs
```

---

## 📚 関連ドキュメント

- **[MANDATORY_CHECKLIST.md](./MANDATORY_CHECKLIST.md)** - 作業開始前の必須確認事項
- **[HANDOFF_TO_NEXT_AI.md](./HANDOFF_TO_NEXT_AI.md)** - 引き継ぎドキュメント
- **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** - CI/CDセットアップ手順
- **[PHASE_4_PLAN.md](../PHASE_4_PLAN.md)** - 次の実装計画

---

## 📝 新しい問題を報告する際の形式

新しい問題を発見した場合、以下の形式でこのファイルに追記してください:

```markdown
### X. 問題のタイトル（🚨/⚠️/🐛 適切なアイコン）

**問題**: 問題の簡潔な説明

**エラーメッセージ**:（ある場合）
\`\`\`
エラーメッセージをここに貼り付け
\`\`\`

**現在の状態**: 問題の現状

**影響**: この問題がプロジェクトに与える影響

**解決策**: 恒久的な解決策

**回避策**: 一時的な回避方法

**優先度**: 高/中/低

**関連ドキュメント**: 関連ファイルへのリンク
```

---

**最終更新**: 2025-11-08（Session 16）  
**バージョン**: 1.0.0  
**総問題数**: 13件（重大: 1, 制限: 4, 軽微: 2, 改善提案: 3, 修正済み: 4）
