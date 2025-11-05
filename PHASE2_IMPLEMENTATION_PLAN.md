# 📋 Phase 2 実装計画書

**作成日**: 2025年11月5日  
**ステータス**: Phase 1完了後に実装開始  
**優先度**: 高  
**推定工数**: 5-7日

---

## 🎯 Phase 2の目的

Phase 1完了後、以下の2つの機能を実装してMy Agent Analyticsの機能完成度を向上させます：

1. **人口動態分析機能** - e-Stat API連携
2. **AI市場分析専用ページ** - 既存APIの活用

---

## 📊 Task 1: 人口動態分析機能実装

### 概要
e-Stat（政府統計の総合窓口）APIを活用し、地域の人口統計データを取得・分析する機能を実装します。

### 実装内容

#### 1.1 e-Stat APIクライアント (`src/lib/estat-client.ts`)

**必要なAPI**:
- 人口推計（月次）: 統計表ID `0003410379`
- 国勢調査（年齢・男女別人口）: 統計表ID `0000010101`

**主要メソッド**:
```typescript
class EstatClient {
  // 人口推計データ取得
  async getPopulationEstimate(prefCode: string, year: number): Promise<PopulationData>
  
  // 年齢階級別人口データ取得
  async getDemographicsData(prefCode: string, year: number): Promise<DemographicsData>
  
  // 人口推移データ取得（5年間）
  async getPopulationTrend(prefCode: string, startYear: number, endYear: number): Promise<PopulationTrendData>
}
```

**注意事項**:
- ❌ **デモモードは作らない**（e-Stat APIが必須）
- ✅ APIキーエラー時は明確なエラーメッセージを表示
- ✅ データはCloudflare D1にキャッシュ（1ヶ月）

#### 1.2 APIエンドポイント (`src/routes/api.tsx`)

```typescript
// POST /api/demographics/analyze
app.post('/api/demographics/analyze', async (c) => {
  const { prefCode, year } = await c.req.json();
  
  // e-Stat API呼び出し
  const client = new EstatClient(c.env.ESTAT_API_KEY);
  const population = await client.getPopulationEstimate(prefCode, year);
  const demographics = await client.getDemographicsData(prefCode, year);
  const trend = await client.getPopulationTrend(prefCode, year - 5, year);
  
  // D1データベースに保存
  await c.env.DB.prepare(`
    INSERT INTO analysis_results (property_id, type, result_data, created_at)
    VALUES (?, 'demographics', ?, datetime('now'))
  `).bind(null, JSON.stringify({ population, demographics, trend })).run();
  
  return c.json({ population, demographics, trend });
});
```

#### 1.3 フロントエンドページ (`src/routes/demographics.tsx`)

**URL**: `/demographics/analyze`

**機能**:
- 都道府県選択ドロップダウン
- 年選択（2019-2024）
- 分析実行ボタン

**表示内容**:
1. **総人口推移グラフ** (Chart.js - 折れ線グラフ)
   - 過去5年の人口推移
   - 前年比増減率

2. **年齢階級別人口グラフ** (Chart.js - 積み上げ棒グラフ)
   - 0-14歳（年少人口）
   - 15-64歳（生産年齢人口）
   - 65歳以上（老年人口）

3. **主要指標カード**
   - 総人口
   - 生産年齢人口比率
   - 高齢化率
   - 年少人口比率

4. **人口動態サマリー**
   - 転入超過/転出超過
   - 自然増減（出生-死亡）
   - 社会増減（転入-転出）

### データベーススキーマ

```sql
-- 人口動態分析結果テーブル（既存のanalysis_resultsを使用）
-- type = 'demographics'
```

### テスト計画

**テストケース**:
1. 東京都（13000）の2024年データ取得
2. 神奈川県（14000）の2020-2024年推移取得
3. APIキー未設定時のエラーハンドリング
4. e-Stat API障害時のエラーハンドリング

---

## 🤖 Task 2: AI市場分析専用ページ実装

### 概要
既存の`POST /api/ai/market-analysis` APIを活用した専用ページを作成します。

### 実装内容

#### 2.1 フロントエンドページ (`src/routes/ai-market-analysis.tsx`)

**URL**: `/ai/market-analysis`

**機能**:
- 住所入力フォーム
- 物件タイプ選択（マンション/一戸建て/商業/土地）
- 分析内容選択（市場動向/競合分析/価格予測/需要予測）
- 分析実行ボタン

**表示内容**:
1. **AI分析結果**
   - OpenAI GPT-4による詳細分析レポート
   - Markdown形式で読みやすく表示

2. **市場トレンドグラフ** (Chart.js)
   - 地価推移（過去5年）
   - 賃料推移（過去5年）
   - 成約件数推移

3. **競合物件情報**
   - 周辺類似物件の価格帯
   - 平均築年数
   - 平均占有面積

4. **投資判断サマリー**
   - 総合評価（5段階）
   - リスク要因
   - 機会要因
   - 推奨アクション

#### 2.2 既存APIの拡張 (`src/routes/api.tsx`)

既存の`POST /api/ai/market-analysis`は実装済みのため、フロントエンドのみ実装します。

**必要な変更**:
- なし（既存APIをそのまま使用）

#### 2.3 デザイン統一

**統合レポートとの整合性**:
- 同じグラスモーフィズムデザイン
- 同じカラースキーム（紫-青グラデーション）
- 同じアイコンライブラリ（Font Awesome）
- 同じグラフライブラリ（Chart.js）

---

## 📅 実装スケジュール

### Week 1: 人口動態分析機能（3-4日）

**Day 1**: e-Stat APIクライアント実装
- `src/lib/estat-client.ts` 作成
- APIレスポンスパーサー実装
- ユニットテスト作成

**Day 2**: APIエンドポイント実装
- `POST /api/demographics/analyze` 実装
- D1データベース保存処理
- エラーハンドリング

**Day 3**: フロントエンド実装
- `/demographics/analyze` ページ作成
- Chart.jsグラフ実装
- 都道府県選択UI

**Day 4**: テスト・バグ修正
- e-Stat API実地テスト
- エラーケースのテスト
- UI/UXの微調整

---

### Week 2: AI市場分析専用ページ（2-3日）

**Day 5**: フロントエンド実装
- `/ai/market-analysis` ページ作成
- 入力フォーム実装
- 既存API連携

**Day 6**: グラフ・可視化実装
- Chart.jsグラフ追加
- Markdown表示実装
- レスポンシブデザイン調整

**Day 7**: 統合・テスト
- 統合レポートとのデザイン統一
- 全体テスト
- バグ修正

---

## ✅ 完了基準

### 人口動態分析機能
- [ ] e-Stat APIから実データ取得成功
- [ ] グラフが正しく表示される
- [ ] エラーハンドリングが適切
- [ ] **デモモードなし**
- [ ] D1データベースに保存される
- [ ] レスポンス時間 < 3秒

### AI市場分析専用ページ
- [ ] 既存APIと正しく連携
- [ ] 分析結果が読みやすく表示される
- [ ] グラフが正しく表示される
- [ ] 統合レポートとデザインが統一されている
- [ ] レスポンシブデザイン対応

---

## 🔧 技術スタック

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **API** | e-Stat REST API | 人口統計データ取得 |
| **API** | OpenAI GPT-4o | AI市場分析 |
| **フレームワーク** | Hono | バックエンドAPI |
| **データベース** | Cloudflare D1 | 分析結果保存 |
| **グラフ** | Chart.js | データ可視化 |
| **スタイル** | Tailwind CSS | UI構築 |
| **アイコン** | Font Awesome | アイコン表示 |

---

## ⚠️ 重要な注意事項

### デモモード禁止
- ❌ **デモモードは作らない**
- ❌ **モックデータは使わない**
- ✅ APIキーが揃うまで機能は非公開
- ✅ 認証情報不足時は明確なエラー表示

### e-Stat API制約
- **レート制限**: なし（政府統計API）
- **データ更新頻度**: 月次
- **無料**: 完全無料
- **APIキー取得**: https://www.e-stat.go.jp/api/

### Cloudflare Pages互換性
- ✅ すべての機能がCloudflare Pages互換
- ✅ e-Stat APIはHTTP REST API（Fetch対応）
- ✅ Chart.jsはCDNから読み込み
- ✅ 10ms CPU時間制限内で処理可能

---

## 📊 期待される効果

### ビジネス価値
1. **データ駆動型の提案** - 客観的な人口統計データで説得力向上
2. **AI分析の活用** - GPT-4の高度な分析を単独ページで提供
3. **ユーザー体験向上** - 専用ページで使いやすさ向上

### 技術的価値
1. **e-Stat API統合** - 政府統計データの活用基盤確立
2. **Chart.js活用** - データ可視化の標準化
3. **API再利用** - 既存のAI分析APIを効率的に活用

---

## 📝 実装チェックリスト

### 人口動態分析
- [ ] `src/lib/estat-client.ts` 実装
- [ ] `POST /api/demographics/analyze` 実装
- [ ] `/demographics/analyze` ページ実装
- [ ] Chart.jsグラフ実装
- [ ] エラーハンドリング実装
- [ ] e-Stat API実地テスト
- [ ] ユニットテスト作成

### AI市場分析専用ページ
- [ ] `/ai/market-analysis` ページ実装
- [ ] 入力フォーム実装
- [ ] 既存API連携
- [ ] Chart.jsグラフ実装
- [ ] Markdown表示実装
- [ ] デザイン統一
- [ ] レスポンシブデザイン調整

### 統合・テスト
- [ ] ビルドエラーゼロ
- [ ] 全機能テスト合格
- [ ] Git commit & push
- [ ] Cloudflare Pages deploy
- [ ] プロジェクトバックアップ

---

## 🔗 関連ドキュメント

- **e-Stat API仕様**: https://www.e-stat.go.jp/api/
- **Chart.js ドキュメント**: https://www.chartjs.org/docs/
- **Cloudflare D1 ドキュメント**: https://developers.cloudflare.com/d1/
- **CORE_FEATURES_STATUS.md**: 機能実装状況
- **PHASE1_FIELD_TEST_GUIDE.md**: Phase 1テスト手順

---

**作成日**: 2025年11月5日  
**最終更新**: 2025年11月5日  
**ステータス**: Phase 1完了後に実装開始  
**次のアクション**: Phase 1フィールドテスト完了を待つ
