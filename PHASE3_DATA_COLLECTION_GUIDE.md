# 📊 Phase 3 データ収集ガイド

**作成日**: 2025年11月5日  
**対象**: 将来資産価値分析機能（10年DCF・DRRスコア・ヒートマップ）  
**ステータス**: Phase 1-2完了後に実施  
**更新頻度**: 月次

---

## 🎯 データ収集の目的

Phase 3の将来資産価値分析機能を実装するため、以下のデータを収集します：

1. **地価公示データ** - Asset Scoreの地価モメンタム計算用
2. **賃料指数データ** - Asset Scoreの賃料モメンタム計算用
3. **再開発プロジェクト情報** - DRRスコアのRedevelopment分析用

---

## 📋 データ収集リスト

### 1. 地価公示データ

#### データソース
**国土交通省「地価公示」**
- URL: https://www.land.mlit.go.jp/landPrice/AriaServlet?MOD=2&TYP=0
- ダウンロード形式: CSV
- 更新頻度: 年1回（毎年3月）

#### 必要なデータ
- **対象年**: 2020年〜2025年（過去5年分）
- **対象エリア**: 東京都、神奈川県、埼玉県、千葉県
- **データ項目**:
  - 都道府県コード
  - 市区町村コード
  - 地点名
  - 所在地
  - 地価（円/m²）
  - 前年比変動率（%）
  - 用途地域
  - 最寄り駅

#### ダウンロード手順

1. **国土交通省サイトにアクセス**
   ```
   https://www.land.mlit.go.jp/landPrice/AriaServlet?MOD=2&TYP=0
   ```

2. **検索条件設定**
   - 調査年: 2020年〜2025年（各年ごと）
   - 都道府県: 東京都、神奈川県、埼玉県、千葉県
   - データ形式: CSV

3. **CSVダウンロード**
   - ファイル名例: `land_price_tokyo_2024.csv`
   - 保存先: `/home/user/webapp/data/land_price/`

4. **データ整形**
   ```bash
   # CSVヘッダー確認
   head -1 land_price_tokyo_2024.csv
   
   # 必要なカラムのみ抽出
   cut -d',' -f1,2,3,4,5,6,7,8 land_price_tokyo_2024.csv > land_price_tokyo_2024_clean.csv
   ```

#### データ量見積もり
- 東京都: 約2,000地点
- 神奈川県: 約1,200地点
- 埼玉県: 約800地点
- 千葉県: 約700地点
- **合計**: 約4,700地点 × 5年 = **約23,500レコード**

---

### 2. 賃料指数データ

#### データソース1: 東京カンテイ「分譲マンション賃料」

**公開情報**:
- URL: https://www.kantei.ne.jp/release/
- 形式: PDF（月次レポート）
- 更新頻度: 月1回

**取得可能データ**:
- 首都圏平均賃料（円/m²）
- 都道府県別平均賃料
- 前月比変動率
- 前年同月比変動率

**手動収集が必要**:
1. 月次レポートPDFをダウンロード
2. 表データを手動でExcelに転記
3. CSVに変換して保存

**ファイル名例**: `rent_index_kanto_202411.csv`

#### データソース2: 東京都宅建協会「分譲マンション賃料」

**公開情報**:
- URL: https://www.tokyo-takken.or.jp/re-port/
- 形式: ニュース記事
- 更新頻度: 月1回

**取得可能データ**:
- 首都圏平均賃料
- 東京都・神奈川県・埼玉県・千葉県の平均賃料
- 前月比変動率

**手動収集が必要**:
記事からテキストをコピーしてExcelに整形

#### データ整形テンプレート

**rent_index.csv**:
```csv
year,month,prefecture,average_rent_per_sqm,monthly_change_rate,yearly_change_rate
2024,11,13,4614,-1.2,+2.5
2024,11,14,2512,-0.8,+1.8
2024,11,11,2115,-1.0,+1.2
2024,11,12,2058,-0.6,+0.9
```

#### データ量見積もり
- 4都県 × 12ヶ月 × 5年 = **240レコード**

---

### 3. 再開発プロジェクト情報

#### データソース1: 国土交通省「都市再生プロジェクト」

**URL**: https://www.mlit.go.jp/toshi/city/sigaiti/toshi_urbanmainte_tk_000042.html

**取得可能データ**:
- プロジェクト名
- 所在地
- 事業主体
- 事業期間
- 事業規模
- 完成予定時期

#### データソース2: 各自治体の再開発情報

**東京都**:
- URL: https://www.toshiseibi.metro.tokyo.lg.jp/

**神奈川県**:
- URL: https://www.pref.kanagawa.jp/

**埼玉県**:
- URL: https://www.pref.saitama.lg.jp/

**千葉県**:
- URL: https://www.pref.chiba.lg.jp/

#### データ整形テンプレート

**redevelopment_projects.csv**:
```csv
project_name,prefecture,city,station_name,distance_m,start_year,completion_year,project_scale,impact_level
渋谷駅桜丘口地区再開発,東京都,渋谷区,渋谷駅,300,2023,2027,large,high
横浜駅西口地区再開発,神奈川県,横浜市,横浜駅,200,2022,2026,large,high
大宮駅東口再開発,埼玉県,さいたま市,大宮駅,150,2024,2028,medium,medium
```

**カラム定義**:
- `project_name`: プロジェクト名
- `prefecture`: 都道府県
- `city`: 市区町村
- `station_name`: 最寄り駅
- `distance_m`: 駅からの距離（m）
- `start_year`: 着工年
- `completion_year`: 完成予定年
- `project_scale`: 規模（large/medium/small）
- `impact_level`: 影響度（high/medium/low）

#### データ量見積もり
- 主要駅周辺の再開発プロジェクト: **約50-100件**

---

### 4. JR東日本乗降人員データ

#### データソース
**JR東日本「各駅の乗車人員」**
- URL: https://www.jreast.co.jp/company/data/passenger/
- 形式: PDF
- 更新頻度: 年1回

#### 必要なデータ
- 駅名
- 1日平均乗車人員（定期・定期外）
- 年度

#### 手動収集手順

1. PDFをダウンロード
2. 主要駅（上位100駅）のデータを抽出
3. Excelに転記
4. CSVに変換

**station_power.csv**:
```csv
station_name,year,regular_passengers,non_regular_passengers,total_passengers
新宿駅,2024,350178,336631,686809
池袋駅,2024,260234,238894,499128
東京駅,2024,218237,216327,434564
横浜駅,2024,186843,186167,373010
```

#### データ量見積もり
- 主要駅100駅 × 5年 = **500レコード**

---

## 📂 ディレクトリ構造

```
/home/user/webapp/
├── data/
│   ├── land_price/           # 地価公示データ
│   │   ├── 2020/
│   │   │   ├── tokyo.csv
│   │   │   ├── kanagawa.csv
│   │   │   ├── saitama.csv
│   │   │   └── chiba.csv
│   │   ├── 2021/
│   │   ├── 2022/
│   │   ├── 2023/
│   │   ├── 2024/
│   │   └── 2025/
│   │
│   ├── rent_index/           # 賃料指数データ
│   │   ├── 2020_monthly.csv
│   │   ├── 2021_monthly.csv
│   │   ├── 2022_monthly.csv
│   │   ├── 2023_monthly.csv
│   │   ├── 2024_monthly.csv
│   │   └── 2025_monthly.csv
│   │
│   ├── redevelopment/        # 再開発プロジェクト情報
│   │   └── projects.csv
│   │
│   ├── station_power/        # 駅乗降人員データ
│   │   └── jr_east_2024.csv
│   │
│   └── README.md             # データ収集記録
```

---

## 🔄 データ更新フロー

### 初回データ収集（Phase 3実装前）

**Week 1**: 地価公示データ収集
- Day 1-2: 2020-2025年の東京都データダウンロード
- Day 3-4: 神奈川県・埼玉県・千葉県データダウンロード
- Day 5: データ整形・クリーニング

**Week 2**: 賃料指数データ収集
- Day 1-3: 東京カンテイ月次レポート収集（2020-2025年）
- Day 4-5: データ整形・CSV変換

**Week 3**: 再開発・駅力データ収集
- Day 1-2: 再開発プロジェクト情報収集
- Day 3-4: JR東日本乗降人員データ収集
- Day 5: データ整形・CSV変換

### 定期更新（月次）

**毎月1日**: 賃料指数データ更新
1. 東京カンテイ月次レポート確認
2. 前月データをCSVに追加
3. Git commit & push

**毎年3月**: 地価公示データ更新
1. 国土交通省サイトから最新データダウンロード
2. 新年度フォルダ作成
3. データ整形・クリーニング
4. Git commit & push

**毎年6月**: JR東日本乗降人員データ更新
1. 前年度データをPDFからダウンロード
2. CSV更新
3. Git commit & push

**四半期ごと**: 再開発プロジェクト情報更新
1. 新規プロジェクト追加
2. 完成済みプロジェクトのステータス更新
3. Git commit & push

---

## 📊 データ品質チェック

### チェック項目

**1. データ完全性**:
- [ ] 全ての年度データが揃っている
- [ ] 全ての都県データが揃っている
- [ ] 欠損値がない（または適切に処理されている）

**2. データ整合性**:
- [ ] 日付形式が統一されている（YYYY-MM-DD）
- [ ] 数値フォーマットが統一されている
- [ ] 都道府県コードが正しい（13000=東京都）

**3. データ精度**:
- [ ] 明らかな外れ値がない
- [ ] 前年比変動率が合理的な範囲内（-20%〜+20%）
- [ ] 地価・賃料が常識的な範囲内

### データ検証スクリプト

```bash
# CSVヘッダー確認
head -1 data/land_price/2024/tokyo.csv

# レコード数確認
wc -l data/land_price/2024/*.csv

# 欠損値確認
grep -c ",," data/land_price/2024/tokyo.csv

# 重複確認
sort data/land_price/2024/tokyo.csv | uniq -d | wc -l
```

---

## 🛠️ データインポート手順（Phase 3実装後）

### D1データベースへのインポート

```bash
# 地価公示データインポート
cd /home/user/webapp
npx wrangler d1 execute my-agent-analytics --local --file=./scripts/import_land_price.sql

# 賃料指数データインポート
npx wrangler d1 execute my-agent-analytics --local --file=./scripts/import_rent_index.sql

# 再開発プロジェクトデータインポート
npx wrangler d1 execute my-agent-analytics --local --file=./scripts/import_redevelopment.sql

# 駅力データインポート
npx wrangler d1 execute my-agent-analytics --local --file=./scripts/import_station_power.sql
```

### インポートスクリプトサンプル

**scripts/import_land_price.sql**:
```sql
-- 地価公示データテーブル作成
CREATE TABLE IF NOT EXISTS land_price_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefecture_code TEXT NOT NULL,
  city_code TEXT NOT NULL,
  area_name TEXT NOT NULL,
  address TEXT NOT NULL,
  price_per_sqm INTEGER NOT NULL,
  yearly_change_rate REAL,
  land_use_zone TEXT,
  nearest_station TEXT,
  year INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CSVデータをインポート（手動で変換が必要）
-- INSERT INTO land_price_data (prefecture_code, city_code, ...) VALUES (...);
```

---

## ✅ データ収集チェックリスト

### 初回収集
- [ ] 地価公示データ（2020-2025年）
  - [ ] 東京都
  - [ ] 神奈川県
  - [ ] 埼玉県
  - [ ] 千葉県
- [ ] 賃料指数データ（2020-2025年・月次）
  - [ ] 首都圏全体
  - [ ] 東京都
  - [ ] 神奈川県
  - [ ] 埼玉県
  - [ ] 千葉県
- [ ] 再開発プロジェクト情報
  - [ ] 主要駅周辺50-100件
- [ ] JR東日本乗降人員データ（2020-2024年）
  - [ ] 主要駅100駅

### 定期更新
- [ ] 賃料指数（月次）
- [ ] 地価公示（年次・3月）
- [ ] 乗降人員（年次・6月）
- [ ] 再開発プロジェクト（四半期ごと）

---

## 🔗 関連リンク

### 公的データソース
- **国土交通省 地価公示**: https://www.land.mlit.go.jp/landPrice/AriaServlet?MOD=2&TYP=0
- **e-Stat 政府統計**: https://www.e-stat.go.jp/
- **JR東日本 乗車人員**: https://www.jreast.co.jp/company/data/passenger/

### 民間データソース
- **東京カンテイ**: https://www.kantei.ne.jp/release/
- **東京都宅建協会**: https://www.tokyo-takken.or.jp/re-port/

### 関連ドキュメント
- **FUTURE_ASSET_VALUE_ANALYSIS_PLAN.md**: Phase 3詳細仕様
- **FUTURE_ASSET_VALUE_SUMMARY.md**: Phase 3サマリー
- **PHASE2_IMPLEMENTATION_PLAN.md**: Phase 2実装計画

---

**作成日**: 2025年11月5日  
**最終更新**: 2025年11月5日  
**ステータス**: Phase 1-2完了後に収集開始  
**次のアクション**: Phase 1-2完了を待つ
