# 事故物件調査精度テスト結果

**テスト日**: 2025年1月5日  
**対象物件**: 東京都葛飾区新小岩二丁目27-2 パトリック・ガーデン3階  
**デプロイURL**: https://d2279d49.my-agent-analytics.pages.dev

---

## 📋 テスト概要

ユーザーからの報告により、大島てるに掲載されている物件で事故物件調査を実施し、システムが正しく検出・報告できるかを確認。

---

## 🔍 テスト実施

### テスト1: 完全な住所 + 物件名

**検索条件**:
```json
{
  "address": "東京都葛飾区新小岩二丁目27-2",
  "propertyName": "パトリック・ガーデン3階"
}
```

**結果**:
```json
{
  "success": true,
  "testMode": true,
  "hasStigma": false,
  "riskLevel": "none",
  "findings": [],
  "summary": "提供された検索結果には、東京都葛飾区新小岩二丁目27-2 (パトリック・ガーデン3階)に関する事故物件情報や心理的瑕疵に該当する情報は見つかりませんでした。検索結果は、調査対象物件とは関連性のない情報や異なる地域に関する内容が含まれており、該当する事象は確認できませんでした。",
  "sourcesChecked": [
    {
      "name": "Google検索",
      "url": "https://www.google.com",
      "checked": true,
      "foundIssues": 12
    },
    {
      "name": "事故物件公示サイト（大島てる等）",
      "url": "https://www.oshimaland.co.jp",
      "checked": true,
      "foundIssues": 0
    },
    {
      "name": "ニュースサイト",
      "url": "https://news.google.com",
      "checked": true,
      "foundIssues": 0
    }
  ],
  "checkedAt": "2025-11-05T13:00:48.819Z",
  "mode": "full"
}
```

**分析**:
- ✅ Google検索: 12件の結果を取得
- ❌ **問題**: AIが関連性がないと判断
- ⚠️ **偽陰性（False Negative）の可能性**

### テスト2: 短縮形の住所

**検索条件**:
```json
{
  "address": "東京都葛飾区新小岩2-27-2"
}
```

**結果**:
- 同様に `hasStigma: false` と判定

---

## 🐛 問題点の分析

### 1. **AIの判定が甘い可能性**

**問題**:
- Google検索で12件の結果を取得しているにもかかわらず、AIが「関連性がない」と判断
- 実際に大島てるに掲載されている物件が検出されていない

**根本原因の仮説**:

#### 仮説A: GPT-4のプロンプトが不十分
現在のプロンプトでは、住所の「ゆらぎ」（表記の違い）に対応できていない可能性。

**問題のある表記例**:
- 「二丁目」vs「2丁目」vs「2-」
- 「27-2」vs「27番2号」
- 物件名の有無

#### 仮説B: Google検索結果の関連性判定が厳しすぎる
AIが「完全一致」を求めすぎて、近似した住所を除外している可能性。

#### 仮説C: 大島てるのサイト構造
大島てるのサイトが JavaScript で動的にコンテンツを生成している場合、Google Custom Search APIでは取得できない可能性。

### 2. **検索クエリの最適化が不足**

**現在の検索クエリ**:
```typescript
const queries = [
  `${address}${propertyName ? ' ' + propertyName : ''} 事故 事件 大島てる`,
  `${address}${propertyName ? ' ' + propertyName : ''} 自殺 他殺 火災`,
  `site:oshimaland.co.jp ${address}${propertyName ? ' ' + propertyName : ''}`,
];
```

**改善案**:
```typescript
const queries = [
  // 住所の様々なバリエーション
  `"${address}" 事故 事件 大島てる`,
  `"${normalizedAddress}" 事故 事件`,  // 正規化された住所
  `"${shortAddress}" 自殺 他殺 火災`,  // 短縮形
  `site:oshimaland.co.jp "${address}"`,
  `site:oshimaland.co.jp "${normalizedAddress}"`,
  // 物件名を含む
  `"${propertyName}" ${address} 事故`,
];
```

### 3. **住所の正規化が未実装**

**問題**:
- 「二丁目」と「2丁目」の違いを吸収できていない
- 「27-2」と「27番2号」の違いを吸収できていない

**改善案**:
```typescript
function normalizeAddress(address: string): string[] {
  const variations = [];
  
  // バリエーション1: 漢数字 → 算用数字
  variations.push(address.replace(/一丁目/g, '1丁目')
                         .replace(/二丁目/g, '2丁目')
                         .replace(/三丁目/g, '3丁目'));
  
  // バリエーション2: 丁目 → ハイフン形式
  variations.push(address.replace(/([0-9]+)丁目/g, '$1-'));
  
  // バリエーション3: 番地の省略形
  variations.push(address.replace(/番/g, '-').replace(/号/g, ''));
  
  return variations;
}
```

---

## 🔧 推奨される改善策

### 優先度：高（即座に実装）

#### 改善1: GPT-4プロンプトの強化

**現在のプロンプト**:
```typescript
const prompt = `
あなたは不動産の心理的瑕疵調査の専門家です。
以下のGoogle検索結果から、「${address}」に関する事故物件情報を分析してください。
...
`;
```

**改善後のプロンプト**:
```typescript
const prompt = `
あなたは不動産の心理的瑕疵調査の専門家です。

【重要】以下の点に特に注意して分析してください：
1. 住所の表記ゆれを考慮する
   - 「二丁目」と「2丁目」は同じ
   - 「27-2」と「27番2号」は同じ
   - 「葛飾区新小岩」と「葛飾区新小岩2」は近接
   
2. 物件名の有無を考慮する
   - 物件名がなくても住所が一致すれば関連性あり
   - 物件名の一部一致も考慮する

3. 近隣の事故も報告する
   - 同じ番地の別の号
   - 同じ建物の別の階

【調査対象】
住所: ${address}
物件名: ${propertyName || 'なし'}

【Google検索結果】
${searchResultsText}

【判定基準】
- 住所が80%以上一致 → 高関連性
- 住所が60%以上一致 → 中関連性
- 物件名が一致 → 高関連性
`;
```

#### 改善2: 住所正規化の実装

**新規ファイル**: `src/lib/address-normalizer.ts`

```typescript
export function normalizeAddress(address: string): string[] {
  const variations = new Set<string>();
  
  // 元の住所を追加
  variations.add(address);
  
  // 漢数字 → 算用数字
  let normalized = address
    .replace(/一丁目/g, '1丁目')
    .replace(/二丁目/g, '2丁目')
    .replace(/三丁目/g, '3丁目')
    .replace(/四丁目/g, '4丁目')
    .replace(/五丁目/g, '5丁目')
    .replace(/六丁目/g, '6丁目')
    .replace(/七丁目/g, '7丁目')
    .replace(/八丁目/g, '8丁目')
    .replace(/九丁目/g, '9丁目')
    .replace(/十丁目/g, '10丁目');
  variations.add(normalized);
  
  // 丁目 → ハイフン形式
  normalized = normalized.replace(/([0-9]+)丁目/g, '$1-');
  variations.add(normalized);
  
  // 番地の正規化
  normalized = normalized
    .replace(/番/g, '-')
    .replace(/号/g, '');
  variations.add(normalized);
  
  // 全角 → 半角
  normalized = normalized.replace(/[０-９]/g, (s) => 
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );
  variations.add(normalized);
  
  return Array.from(variations);
}
```

**使用例**:
```typescript
const addressVariations = normalizeAddress('東京都葛飾区新小岩二丁目27-2');
// 結果: [
//   '東京都葛飾区新小岩二丁目27-2',
//   '東京都葛飾区新小岩2丁目27-2',
//   '東京都葛飾区新小岩2-27-2',
//   '東京都葛飾区新小岩2-27-2',  // 番号は既に半角
// ]

// 各バリエーションで検索
for (const addr of addressVariations) {
  await this.search(`"${addr}" 事故 事件`);
}
```

#### 改善3: 検索クエリの最適化

**修正ファイル**: `src/lib/google-search-client.ts`

```typescript
async searchStigmatizedProperty(address: string, propertyName?: string): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];
  
  // 住所の正規化
  const { normalizeAddress } = await import('./address-normalizer');
  const addressVariations = normalizeAddress(address);
  
  const queries = [];
  
  // 各住所バリエーションで検索
  for (const addr of addressVariations) {
    queries.push(
      `"${addr}" 事故 事件 大島てる`,
      `site:oshimaland.co.jp "${addr}"`,
      `"${addr}" 自殺 他殺 火災`
    );
    
    // 物件名がある場合
    if (propertyName) {
      queries.push(
        `"${propertyName}" "${addr}" 事故`,
        `"${propertyName}" 事故 事件`
      );
    }
  }
  
  // 重複を削除
  const uniqueQueries = Array.from(new Set(queries));
  
  // 各クエリで検索（最大10クエリまで）
  for (const query of uniqueQueries.slice(0, 10)) {
    try {
      const results = await this.search(query, { num: 10 });
      allResults.push(...results);
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.warn(`Search failed for query: ${query}`, error);
    }
  }
  
  // 重複を削除（URLベース）
  const uniqueResults = allResults.filter((result, index, self) =>
    index === self.findIndex(r => r.link === result.link)
  );
  
  return uniqueResults;
}
```

### 優先度：中（検証後に実装）

#### 改善4: 大島てるAPIの直接使用（検討）

現在はGoogle Custom Search経由で大島てるを検索していますが、大島てるが公式APIを提供している場合、直接使用することで精度が向上する可能性があります。

#### 改善5: 機械学習モデルの使用

住所の類似度判定に機械学習モデル（例: BERT）を使用することで、より柔軟な判定が可能になります。

---

## 📊 テスト結果まとめ

| 項目 | 結果 | 評価 |
|------|------|------|
| Google Custom Search API統合 | ✅ 動作 | 合格 |
| 検索結果の取得 | ✅ 12件取得 | 合格 |
| AI分析の実行 | ✅ 実行成功 | 合格 |
| **事故物件の検出** | ❌ **未検出** | **不合格** |
| 偽陰性率 | ⚠️ **高い** | **要改善** |

**総合評価**: ❌ **不合格 - 要改善**

---

## 🎯 次のアクション

### 即座に実施（1-2時間）

1. **GPT-4プロンプトの強化**
   - 住所表記ゆれへの対応
   - 判定基準の明確化
   - より詳細な指示

2. **住所正規化の実装**
   - `address-normalizer.ts` の作成
   - 各種バリエーションの生成
   - テストケースの作成

3. **検索クエリの最適化**
   - 住所バリエーションでの検索
   - ダブルクォートによる完全一致検索
   - 検索数の増加（最大10クエリ）

### 検証後に実施（1週間）

4. **再テスト**
   - 同じ物件で再度テスト
   - 他の大島てる掲載物件でもテスト
   - 偽陰性率の測定

5. **チューニング**
   - GPT-4プロンプトの微調整
   - 検索クエリの最適化
   - しきい値の調整

---

## 📚 参考情報

### 関連ファイル

- `src/lib/google-search-client.ts` - Google検索クライアント
- `src/lib/stigma-checker.ts` - AI分析ロジック
- `src/routes/api.tsx` - APIエンドポイント

### 大島てる掲載確認方法

実際に大島てるのサイトで手動検索して確認：
1. https://www.oshimaland.co.jp/ にアクセス
2. 「東京都葛飾区新小岩二丁目27-2」で検索
3. 検索結果の有無を確認

---

**作成日**: 2025年1月5日  
**テスト実施者**: Claude Code (Genspark AI Assistant)  
**ステータス**: 改善策を実装中
