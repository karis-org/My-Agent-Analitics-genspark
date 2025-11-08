# API仕様書

**バージョン**: 15.0.0  
**最終更新**: 2025年11月8日

---

## 概要

My Agent Analytics APIは、不動産投資分析システムのバックエンドAPIです。RESTful設計に基づき、物件管理、財務分析、市場データ取得、AI分析などの機能を提供します。

### ベースURL

- **本番環境**: `https://e594a8b5.my-agent-analytics.pages.dev/api`
- **開発環境**: `http://localhost:3000/api`

### 認証

ほとんどのAPIエンドポイントは認証が必要です。Cookie-basedセッション認証を使用します。

**認証ヘッダー**:
```
Cookie: session_id=<session_id>
```

**認証エラー**:
```json
{
  "error": "Authentication required",
  "errorCode": "NO_SESSION"
}
```

### レート制限

APIコールは以下のレート制限が適用されます:

| エンドポイントタイプ | 制限 |
|-------------------|------|
| 一般API | 100 requests/minute |
| AI分析API | 20 requests/minute |
| 認証API | 10 requests/minute |

**レート制限エラー**:
```json
{
  "error": "Too many requests",
  "message": "レート制限に達しました。しばらく待ってから再試行してください。",
  "resetAt": "2025-11-08T05:00:00.000Z"
}
```

---

## エンドポイント一覧

### 1. ヘルスチェック

#### GET /health

システムの稼働状態を確認します。

**認証**: 不要

**レスポンス**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T04:41:16.339Z",
  "version": "2.0.0"
}
```

---

### 2. 物件管理

#### GET /properties

物件一覧を取得します。

**認証**: 必要

**クエリパラメータ**:
- なし

**レスポンス**:
```json
[
  {
    "id": "prop-123",
    "name": "サンプル物件",
    "address": "東京都渋谷区",
    "price": 50000000,
    "age": 10,
    "structure": "RC造",
    "total_floor_area": 100.5,
    "created_at": "2025-11-08T00:00:00.000Z"
  }
]
```

#### POST /properties

新規物件を登録します。

**認証**: 必要

**リクエストボディ**:
```json
{
  "name": "物件名",
  "address": "住所",
  "price": 50000000,
  "age": 10,
  "structure": "RC造",
  "total_floor_area": 100.5,
  "land_area": 50.0,
  "property_type": "マンション"
}
```

**レスポンス**:
```json
{
  "id": "prop-456",
  "message": "Property created successfully"
}
```

#### GET /properties/:id

特定の物件情報を取得します。

**認証**: 必要

**パスパラメータ**:
- `id`: 物件ID

**レスポンス**:
```json
{
  "id": "prop-123",
  "name": "サンプル物件",
  "address": "東京都渋谷区",
  "price": 50000000,
  "age": 10,
  "structure": "RC造",
  "total_floor_area": 100.5
}
```

#### PUT /properties/:id

物件情報を更新します。

**認証**: 必要

**パスパラメータ**:
- `id`: 物件ID

**リクエストボディ**:
```json
{
  "name": "更新後の物件名",
  "price": 55000000
}
```

**レスポンス**:
```json
{
  "message": "Property updated successfully"
}
```

#### DELETE /properties/:id

物件を削除します。

**認証**: 必要

**パスパラメータ**:
- `id`: 物件ID

**レスポンス**:
```json
{
  "message": "Property deleted successfully"
}
```

---

### 3. OCR（画像認識）

#### POST /properties/ocr

物件概要書の画像からデータを抽出します。

**認証**: 不要（レート制限あり）

**リクエストボディ**:
```json
{
  "image": "base64_encoded_image_data"
}
```

**レスポンス**:
```json
{
  "name": "抽出された物件名",
  "address": "抽出された住所",
  "price": 50000000,
  "age": 10,
  "structure": "RC造",
  "total_floor_area": 100.5,
  "monthly_rent": 400000
}
```

---

### 4. 財務分析

#### POST /properties/analyze

物件の財務分析を実行します。

**認証**: 必要

**リクエストボディ**:
```json
{
  "propertyId": "prop-123",
  "propertyPrice": 50000000,
  "grossIncome": 4800000,
  "operatingExpenses": 1000000,
  "loanAmount": 40000000,
  "interestRate": 2.5,
  "loanTerm": 30,
  "downPayment": 10000000
}
```

**レスポンス**:
```json
{
  "noi": 3800000,
  "grossYield": 9.6,
  "netYield": 7.6,
  "ltv": 80.0,
  "dscr": 1.9,
  "monthlyPayment": 158000,
  "annualPayment": 1896000,
  "monthlyCashFlow": 158333,
  "annualCashFlow": 1900000
}
```

---

### 5. 市場分析

#### POST /market/analyze

市場動向を分析します。

**認証**: 不要

**リクエストボディ**:
```json
{
  "year": 2024,
  "area": "13",
  "city": "13102"
}
```

**レスポンス**:
```json
{
  "averagePrice": 550000,
  "transactionCount": 150,
  "priceRange": {
    "min": 300000,
    "max": 800000
  }
}
```

#### GET /market/trade-prices

実取引価格データを取得します。

**認証**: 不要

**クエリパラメータ**:
- `year`: 取得年
- `area`: 都道府県コード
- `city`: 市区町村コード（オプション）

**レスポンス**:
```json
{
  "data": [
    {
      "price": 50000000,
      "area": 100.5,
      "unitPrice": 497512,
      "transactionDate": "2024-Q1"
    }
  ]
}
```

---

### 6. AI分析

#### POST /estat/population

人口統計データを取得します。

**認証**: 不要（AI制限レート）

**リクエストボディ**:
```json
{
  "prefecture": "東京都",
  "city": "渋谷区"
}
```

**レスポンス**:
```json
{
  "population": 228000,
  "households": 145000,
  "ageDistribution": {
    "0-14": 11.2,
    "15-64": 71.5,
    "65+": 17.3
  }
}
```

---

### 7. エージェント管理

#### GET /agents

AIエージェント一覧を取得します。

**認証**: 必要

**レスポンス**:
```json
[
  {
    "id": "agent-123",
    "name": "市場分析エージェント",
    "type": "market",
    "status": "active",
    "created_at": "2025-11-08T00:00:00.000Z"
  }
]
```

#### POST /agents

新規エージェントを作成します。

**認証**: 必要

**リクエストボディ**:
```json
{
  "name": "エージェント名",
  "type": "market",
  "description": "説明"
}
```

**レスポンス**:
```json
{
  "id": "agent-456",
  "message": "Agent created successfully"
}
```

---

## エラーコード

| コード | 説明 |
|-------|------|
| 200 | 成功 |
| 400 | リクエストが不正 |
| 401 | 認証が必要 |
| 403 | アクセス権限がない |
| 404 | リソースが見つからない |
| 429 | レート制限超過 |
| 500 | サーバーエラー |

### エラーレスポンス例

```json
{
  "error": "エラーメッセージ",
  "errorCode": "ERROR_CODE",
  "details": ["詳細1", "詳細2"]
}
```

---

## バージョン履歴

### v15.0.0 (2025-11-08)
- Phase 3-2: モバイル最適化完了（agents, settings, help）
- Phase 3-4: ドキュメント整備完了（API仕様書作成、マニュアル拡充）
- Phase 3-5: CI/CD導入完了（GitHub Actions自動テスト・デプロイ）
- テストスイート: 28/28 (100%合格)

### v14.0.0 (2025-11-08)
- Phase 3-1: パフォーマンス最適化（ビルドサイズ36%削減）
- Phase 3-3: セキュリティ監査完了
- Errorテスト実施（5/5合格）

### v13.0.0 (2025-11-08)
- Phase 2完全達成（テストスイート28/28）
- 包括的テストカバレッジ100%

### v12.0.0 (2025-11-08)
- Phase 2-4: テストスイート作成完了

---

## サポート

質問や問題がある場合は、GitHubのIssueを作成してください:
https://github.com/karis-org/My-Agent-Analitics-genspark/issues
