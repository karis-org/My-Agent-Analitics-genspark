# 運用ガイド

**バージョン**: v6.7.4  
**最終更新日**: 2025年11月8日  
**対象**: 運営管理者、システム管理者

---

## 目次

1. [日常運用タスク](#日常運用タスク)
2. [ユーザー管理](#ユーザー管理)
3. [データベース管理](#データベース管理)
4. [バックアップ・リストア](#バックアップリストア)
5. [監視とアラート](#監視とアラート)
6. [デプロイ手順](#デプロイ手順)
7. [メンテナンス計画](#メンテナンス計画)

---

## 日常運用タスク

### 毎日のチェックリスト

#### 朝（9:00）

- [ ] **システムヘルスチェック**
  ```bash
  curl -I https://my-agent-analytics.pages.dev
  # 期待値: HTTP 200 OK
  ```

- [ ] **アクティビティログ確認**
  - 管理画面 → 最近のアクティビティ
  - 異常な操作がないか確認

- [ ] **エラーログ確認**
  ```bash
  npx wrangler pages deployment tail --project-name my-agent-analytics
  # エラーがないか確認
  ```

- [ ] **API利用状況確認**
  - OpenAI API: 利用料金確認
  - Google APIs: クォータ残量確認

#### 夕方（17:00）

- [ ] **ユーザー数確認**
  - 管理画面 → 統計カード
  - 新規ユーザー数を記録

- [ ] **パフォーマンス確認**
  - Cloudflare Analytics → レスポンス時間
  - 目標: 平均 < 500ms

---

### 週次タスク

#### 毎週月曜日

- [ ] **データベースバックアップ**
  ```bash
  # D1データベースのエクスポート
  npx wrangler d1 execute webapp-production \
    --command=".dump" \
    --remote > backup_$(date +%Y%m%d).sql
  ```

- [ ] **ユーザーアクティビティレポート**
  - 管理画面 → CSV出力
  - 週次レポートを作成

- [ ] **APIクォータ確認**
  - OpenAI: 月間使用量
  - Google: 残りクォータ

#### 毎週金曜日

- [ ] **セキュリティアップデート確認**
  ```bash
  cd /home/user/webapp
  npm audit
  ```

- [ ] **ドキュメント更新**
  - 今週の変更点をドキュメントに反映

---

### 月次タスク

#### 毎月1日

- [ ] **月次レポート作成**
  - 総ユーザー数
  - 新規登録数
  - アクティブユーザー数
  - 物件登録数
  - API使用料金

- [ ] **パフォーマンスレビュー**
  - 平均レスポンス時間
  - エラー率
  - アップタイム

- [ ] **コスト分析**
  - Cloudflare: Pages料金
  - OpenAI: API料金
  - Google: API料金

---

## ユーザー管理

### 新規ユーザー承認

#### 自動承認（デフォルト）

- Google OAuthで認証されたユーザーは自動的に登録されます
- 初期権限: 一般ユーザー

#### 手動での権限変更

1. 管理画面にアクセス
2. ユーザー一覧で対象ユーザーを検索
3. **<i class="fas fa-user-cog"></i>** アイコンをクリック
4. 権限を選択（一般ユーザー / 管理者 / 運営管理者）
5. 「変更」ボタンをクリック

---

### ユーザーの無効化

#### 無効化が必要な場合

- 規約違反行為
- 退職したスタッフ
- 長期間未使用のアカウント

#### 無効化手順

1. 管理画面にアクセス
2. ユーザー一覧で対象ユーザーを検索
3. **<i class="fas fa-ban"></i>** アイコンをクリック
4. 確認ダイアログで「OK」

#### 再有効化

1. ユーザー一覧でステータスフィルターを「無効」に設定
2. 対象ユーザーの **<i class="fas fa-check-circle"></i>** アイコンをクリック

---

### ユーザーデータのエクスポート

#### CSV出力

1. 管理画面にアクセス
2. **「CSV」** ボタンをクリック
3. `users_YYYY-MM-DD.csv` がダウンロードされます

#### 出力内容

- ユーザーID
- メールアドレス
- 名前
- 権限
- ステータス
- 物件数
- 分析数
- 登録日時

---

## データベース管理

### Migration適用

#### ローカル環境

```bash
cd /home/user/webapp

# Migrationを確認
npx wrangler d1 migrations list webapp-production --local

# 適用
npx wrangler d1 migrations apply webapp-production --local
```

#### 本番環境

```bash
# Migrationを確認
npx wrangler d1 migrations list webapp-production

# 適用（⚠️ 慎重に実行）
npx wrangler d1 migrations apply webapp-production
```

#### ⚠️ Migration適用時の注意事項

1. **バックアップを取る**
   ```bash
   npx wrangler d1 execute webapp-production \
     --command=".dump" \
     --remote > backup_before_migration.sql
   ```

2. **ローカルで事前テスト**
   ```bash
   npx wrangler d1 migrations apply webapp-production --local
   # 動作確認
   ```

3. **ピーク時間を避ける**
   - 推奨時間帯: 平日 22:00-翌6:00

---

### データベースのクリーニング

#### 古いログの削除（90日以上前）

```sql
DELETE FROM activity_logs
WHERE created_at < datetime('now', '-90 days');
```

#### 無効ユーザーのデータ削除（180日以上前）

```sql
-- ⚠️ 慎重に実行
DELETE FROM properties
WHERE user_id IN (
  SELECT id FROM users
  WHERE is_active = 0
  AND updated_at < datetime('now', '-180 days')
);
```

---

## バックアップ・リストア

### バックアップ

#### 自動バックアップ（推奨）

GitHub Actionsで自動化（設定必要）:

```yaml
# .github/workflows/backup.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時（UTC）
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup D1 Database
        run: |
          npx wrangler d1 execute webapp-production \
            --command=".dump" \
            --remote > backup_$(date +%Y%m%d).sql
      - name: Upload to Storage
        run: |
          # R2やS3にアップロード
```

#### 手動バックアップ

```bash
# D1データベース全体をエクスポート
npx wrangler d1 execute webapp-production \
  --command=".dump" \
  --remote > backup_$(date +%Y%m%d).sql

# 圧縮
gzip backup_$(date +%Y%m%d).sql
```

---

### リストア

#### Step 1: バックアップファイルを確認

```bash
# バックアップファイルの内容を確認
gunzip -c backup_20250108.sql.gz | head -100
```

#### Step 2: テスト環境でリストア

```bash
# ローカル環境で事前テスト
npx wrangler d1 execute webapp-production \
  --local \
  --file=backup_20250108.sql
```

#### Step 3: 本番環境にリストア

```bash
# ⚠️ 本番環境のデータが上書きされます
npx wrangler d1 execute webapp-production \
  --remote \
  --file=backup_20250108.sql
```

---

## 監視とアラート

### Cloudflare Analytics

#### アクセス方法

1. Cloudflare Dashboard → Pages
2. `my-agent-analytics` プロジェクトを選択
3. Analytics タブ

#### 確認項目

| メトリクス | 目標値 | アラート条件 |
|-----------|-------|------------|
| **リクエスト数** | 1,000+/日 | < 100/日 |
| **エラー率** | < 1% | > 5% |
| **レスポンス時間** | < 500ms | > 2s |
| **帯域幅** | < 100GB/月 | > 500GB/月 |

---

### エラー率監視

#### 手動確認

```bash
# 過去24時間のエラーログを確認
npx wrangler pages deployment tail --project-name my-agent-analytics \
  | grep -i error
```

#### 自動アラート（設定推奨）

Cloudflare Notifications:
1. Cloudflare Dashboard → Notifications
2. 新規通知を作成
3. イベント: Pages Project Error Rate
4. 閾値: 5%以上
5. 通知先: メールアドレス

---

## デプロイ手順

### 通常デプロイ（新機能追加）

#### Step 1: コード変更

```bash
cd /home/user/webapp
# コード修正...
```

#### Step 2: ローカルテスト

```bash
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000
```

#### Step 3: Git commit

```bash
git add .
git commit -m "Session X: [変更内容]"
git push origin main
```

#### Step 4: 本番デプロイ

```bash
npm run build
npx wrangler pages deploy dist --project-name my-agent-analytics
```

#### Step 5: 動作確認

```bash
curl -I https://my-agent-analytics.pages.dev
# 期待値: HTTP 200 OK
```

---

### 緊急デプロイ（ホットフィックス）

#### 条件

- レベル3の重大問題
- 全ユーザーに影響

#### 手順（簡略化）

```bash
# 1. 即座に修正
cd /home/user/webapp
# ... 修正 ...

# 2. 最小限のテスト
npm run build
curl http://localhost:3000

# 3. 即座にデプロイ
npx wrangler pages deploy dist --project-name my-agent-analytics

# 4. Git commit（事後）
git add .
git commit -m "Hotfix: [問題の説明]"
git push origin main
```

---

### ロールバック

#### デプロイ履歴を確認

```bash
npx wrangler pages deployment list --project-name my-agent-analytics
```

#### 特定のデプロイにロールバック

Cloudflare Dashboard経由:
1. Pages → my-agent-analytics
2. Deployments タブ
3. 以前のデプロイを選択
4. "Rollback to this deployment"

---

## メンテナンス計画

### 定期メンテナンス

#### 月次メンテナンス

- **日時**: 毎月第2火曜日 22:00-24:00
- **内容**:
  - Dependency更新
  - データベースクリーニング
  - パフォーマンス最適化

#### 通知

メンテナンス1週間前にユーザーに通知:
- ダッシュボード上部にバナー表示
- メール通知（管理者のみ）

---

### 緊急メンテナンス

#### 実施条件

- 重大なセキュリティ脆弱性発見
- データベース障害
- 外部API大規模障害

#### 手順

1. **即座に通知**
   - ダッシュボードにメンテナンスバナー表示

2. **メンテナンスモード有効化**
   ```typescript
   // src/index.tsx に一時的に追加
   app.use('/*', (c) => {
     return c.html(`
       <html>
         <body style="text-align: center; padding: 50px;">
           <h1>メンテナンス中</h1>
           <p>現在システムメンテナンス中です。</p>
           <p>完了予定: XX:XX</p>
         </body>
       </html>
     `, 503);
   });
   ```

3. **作業実施**

4. **メンテナンスモード解除**

5. **動作確認**

6. **完了通知**

---

## お問い合わせ

### 運用に関する質問

- **メール**: maa-unnei@support
- **営業時間**: 平日 9:00-18:00

---

## 更新履歴

### v6.7.4 (2025-11-08)
- ドキュメント初版作成

---

**このドキュメントは継続的に更新されます。**
