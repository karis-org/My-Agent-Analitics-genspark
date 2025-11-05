# 🧪 Phase 1 フィールドテスト手順書

**作成日**: 2025年11月5日  
**対象**: 事故物件調査機能・Itandi BB API  
**テスト環境**: 本番環境（https://216e52a6.my-agent-analytics.pages.dev）

---

## 📋 テスト前の確認

### 必要な情報
- ✅ **本番URL**: https://216e52a6.my-agent-analytics.pages.dev
- ✅ **GitHub**: https://github.com/koki-187/My-Agent-Analitics-genspark
- ✅ **最新コミット**: 06b176f
- ✅ **バックアップ**: https://page.gensparksite.com/project_backups/webapp_phase3_planning_complete_20251105.tar.gz

### 環境変数（設定済み）
- ✅ `GOOGLE_CUSTOM_SEARCH_API_KEY`
- ✅ `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`
- ✅ `OPENAI_API_KEY`
- ✅ `ITANDI_API_KEY`
- ✅ `REINS_LOGIN_ID`: 1340792731
- ✅ `REINS_PASSWORD`: gthome1120

---

## 🔥 テスト1: 事故物件調査機能フィールドテスト

### 目的
Google Custom Search API + OpenAI GPT-4の実地検証

### テスト対象物件

#### 物件1: 東京都港区六本木7-18-18
**期待結果**: 大島てる登録物件のため「該当あり」

**テスト手順**:
1. 本番環境にアクセス: https://216e52a6.my-agent-analytics.pages.dev
2. ログイン（Google OAuth またはパスワード）
3. 「事故物件調査」メニューをクリック
4. 住所入力: `東京都港区六本木7-18-18`
5. 「検索開始」ボタンをクリック
6. 結果を確認

**確認項目**:
- [ ] Google検索結果が取得できる（大島てる、ニュースサイト等）
- [ ] GPT-4分析が実行される（Loading表示→結果表示）
- [ ] リスクレベルが適切に判定される（low/medium/high）
- [ ] 推奨アクションが表示される ✨ NEW
  - [ ] リスクレベルに応じたステップ表示
  - [ ] 管理会社照会の費用（17,000〜20,000円/戸）表示
  - [ ] 国交省ガイドライン（2021）への言及
- [ ] 検索ソース一覧が表示される
- [ ] エラーが発生しない

#### 物件2: 東京都渋谷区道玄坂1-10-7
**期待結果**: 大島てる登録物件のため「該当あり」

**テスト手順**: 物件1と同様

**確認項目**: 物件1と同様

#### 物件3: Grand Soleil（東京都板橋区蓮根二丁目17-7）
**期待結果**: 事故物件情報なし「該当なし」または「低リスク」

**テスト手順**: 物件1と同様

**確認項目**:
- [ ] 「該当なし」または「低リスク」と判定される
- [ ] 推奨アクションが「現時点で心理的瑕疵の公知情報は確認されていません」と表示
- [ ] 最終確認のステップが表示される

#### 物件4: 任意の物件
**目的**: 一般的な物件での動作確認

**テスト住所例**:
- 東京都新宿区西新宿2-8-1（東京都庁）
- 東京都千代田区丸の内1-9-1（東京駅）

**確認項目**: 物件1と同様

---

### テスト2: 統合レポート内での事故物件調査

**テスト手順**:
1. 物件を新規登録または既存物件を選択
2. 「包括的レポート」をクリック
3. レポート内の「事故物件調査」セクションを確認

**確認項目**:
- [ ] 統合レポート内でも同様に動作する
- [ ] 推奨アクションが正しく表示される
- [ ] デザインが統一されている

---

## 🏢 テスト3: Itandi BB API動作確認

### 目的
Itandi BB本番APIの接続確認

### テスト手順

1. 本番環境にアクセス
2. 「賃貸相場分析（Itandi BB）」メニューをクリック
3. エリア検索フォームに入力
   - 住所例: `東京都渋谷区`
   - 半径: `1000m`
4. 「検索」ボタンをクリック
5. 結果を確認

### 確認項目

- [ ] ログイン処理が成功する
  - APIキー: `92c58BF851b80169b3676ed3046f1ea03`
  - ログインID: `1340792731`
  - パスワード: `gthome1120`
- [ ] 賃貸相場データが取得できる
- [ ] グラフが表示される
- [ ] エラーが発生しない

### エラー発生時の対応

**Error: Authentication failed**
- Cloudflare Secretsの設定を確認
- APIキーの有効期限を確認

**Error: No data found**
- 検索条件を変更して再テスト
- エリア名を正確に入力

**Error: API rate limit**
- 数分待ってから再テスト

---

## 📊 テスト結果記録テンプレート

### 事故物件調査テスト結果

| 物件 | 住所 | 期待結果 | 実際の結果 | リスクレベル | 推奨アクション | 合否 |
|------|------|---------|-----------|-------------|---------------|------|
| 物件1 | 東京都港区六本木7-18-18 | 該当あり | | | | |
| 物件2 | 東京都渋谷区道玄坂1-10-7 | 該当あり | | | | |
| 物件3 | 板橋区蓮根二丁目17-7 | 該当なし | | | | |
| 物件4 | （任意） | - | | | | |

**推奨アクション機能の確認**:
- [ ] ステップが番号付きで表示される
- [ ] 費用情報（17,000〜20,000円/戸）が表示される
- [ ] 必須/推奨の区別が明確
- [ ] 国交省ガイドラインへの言及がある

### Itandi BB APIテスト結果

| テスト項目 | 期待結果 | 実際の結果 | 合否 |
|-----------|---------|-----------|------|
| ログイン処理 | 成功 | | |
| データ取得 | 成功 | | |
| グラフ表示 | 正常 | | |
| エラーハンドリング | 正常 | | |

---

## ⚠️ 既知の問題と回避策

### 問題1: 事故物件調査で「APIキーエラー」
**原因**: Cloudflare Secretsが設定されていない  
**回避策**: 
```bash
npx wrangler pages secret put GOOGLE_CUSTOM_SEARCH_API_KEY --project-name my-agent-analytics
npx wrangler pages secret put GOOGLE_CUSTOM_SEARCH_ENGINE_ID --project-name my-agent-analytics
npx wrangler pages secret put OPENAI_API_KEY --project-name my-agent-analytics
```

### 問題2: Itandi BBで「認証エラー」
**原因**: APIキーまたはログイン情報が正しくない  
**回避策**:
```bash
npx wrangler pages secret put ITANDI_API_KEY --project-name my-agent-analytics
npx wrangler pages secret put REINS_LOGIN_ID --project-name my-agent-analytics
npx wrangler pages secret put REINS_PASSWORD --project-name my-agent-analytics
```

### 問題3: Google検索結果が取得できない
**原因**: Custom Search APIの割り当て超過  
**回避策**: 翌日まで待つ（無料枠: 100クエリ/日）

---

## 📝 テスト完了後のアクション

### テスト合格時
1. [ ] テスト結果を記録
2. [ ] スクリーンショットを保存
3. [ ] Phase 2の実装を開始

### テスト不合格時
1. [ ] エラー内容を詳細に記録
2. [ ] ログを確認（`pm2 logs --nostream` または Cloudflare Pages ダッシュボード）
3. [ ] 問題を修正
4. [ ] 再ビルド・再デプロイ
5. [ ] 再テスト

---

## 🔗 重要リンク

- **本番環境**: https://216e52a6.my-agent-analytics.pages.dev
- **GitHub**: https://github.com/koki-187/My-Agent-Analitics-genspark
- **Cloudflare Pages ダッシュボード**: https://dash.cloudflare.com/
- **大島てる**: https://www.oshimaland.co.jp/

---

## 📞 トラブルシューティング

### ログの確認方法

**ローカル環境**:
```bash
cd /home/user/webapp
pm2 logs my-agent-analytics --nostream
```

**本番環境**:
1. Cloudflare Pages ダッシュボードにアクセス
2. プロジェクト「my-agent-analytics」を選択
3. 「Logs」タブをクリック
4. リアルタイムログを確認

### デバッグモード

**APIレスポンスの確認**:
```bash
# 事故物件調査API
curl -X POST https://216e52a6.my-agent-analytics.pages.dev/api/properties/stigma-check \
  -H "Content-Type: application/json" \
  -d '{"address": "東京都港区六本木7-18-18"}'

# Itandi BB API
curl -X POST https://216e52a6.my-agent-analytics.pages.dev/api/itandi/rental-analysis \
  -H "Content-Type: application/json" \
  -d '{"address": "東京都渋谷区", "radius": 1000}'
```

---

**作成日**: 2025年11月5日  
**最終更新**: 2025年11月5日  
**ステータス**: テスト実施待ち  
**次のアクション**: Phase 1フィールドテスト実施
