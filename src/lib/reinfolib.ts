// 不動産情報ライブラリAPI統合ライブラリ
// National Land and Real Estate Information Library API Integration

/**
 * 不動産取引価格情報
 */
export interface TradePrice {
  Type: string; // 取引の種類
  Region: string; // 地区
  MunicipalityCode: string; // 市区町村コード
  Prefecture: string; // 都道府県名
  Municipality: string; // 市区町村名
  DistrictName: string; // 地区名
  TradePrice: string; // 取引価格（総額）
  PricePerUnit: string; // 坪単価
  FloorPlan: string; // 間取り
  Area: string; // 面積（㎡）
  UnitPrice: string; // 取引価格（㎡単価）
  LandShape: string; // 土地の形状
  Frontage: string; // 間口
  TotalFloorArea: string; // 延床面積
  BuildingYear: string; // 建築年
  Structure: string; // 建物の構造
  Use: string; // 用途
  Purpose: string; // 今後の利用目的
  Direction: string; // 前面道路：方位
  Classification: string; // 前面道路：種類
  Breadth: string; // 前面道路：幅員
  CityPlanning: string; // 都市計画
  CoverageRatio: string; // 建蔽率
  FloorAreaRatio: string; // 容積率
  Period: string; // 取引時点
  Renovation: string; // 改装
  Remarks: string; // 取引の事情等
}

/**
 * 地価公示情報
 */
export interface LandPriceInfo {
  year: string; // 価格時点
  standardLandNumber: string; // 標準地番号
  pricePerSquareMeter: number; // 1㎡当たりの価格
  address: string; // 所在地
  landArea: number; // 地積（㎡）
  landShape: string; // 形状
  frontRoadDirection: string; // 前面道路方位
  frontRoadWidth: number; // 前面道路幅員
  useDistrict: string; // 用途地域
  buildingCoverageRatio: number; // 建蔽率
  floorAreaRatio: number; // 容積率
  nearestStation: string; // 最寄駅
  distanceFromStation: number; // 駅からの距離
  transactionPrice?: number; // 比準価格
  latitude: number; // 緯度
  longitude: number; // 経度
}

/**
 * 市区町村情報
 */
export interface Municipality {
  id: string; // 市区町村コード
  name: string; // 市区町村名
}

/**
 * 市場分析データ
 */
export interface MarketAnalysis {
  area: string; // 地域
  averagePrice: number; // 平均取引価格
  averagePricePerSquareMeter: number; // 平均㎡単価
  transactionCount: number; // 取引件数
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  pricetrend: {
    currentQuarter: number;
    previousQuarter: number;
    changeRate: number; // 変化率（%）
  };
  popularPropertyTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * 不動産情報ライブラリAPIクライアント
 */
export class ReinfolibClient {
  private baseUrl = 'https://www.reinfolib.mlit.go.jp/ex-api/external';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * API リクエストヘッダーを取得
   */
  private getHeaders(): HeadersInit {
    return {
      'Ocp-Apim-Subscription-Key': this.apiKey,
      'Accept-Encoding': 'gzip',
    };
  }

  /**
   * 不動産取引価格情報を取得
   * @param params - 検索パラメータ
   */
  async getTradePrices(params: {
    year: number; // 取引年（2005~）
    quarter?: number; // 四半期（1-4）
    area?: string; // 都道府県コード（2桁）
    city?: string; // 市区町村コード（5桁）
    station?: string; // 駅コード（6桁）
    priceClassification?: '01' | '02'; // 01:取引価格のみ, 02:成約価格のみ
  }): Promise<{ status: string; data: TradePrice[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('year', params.year.toString());
    if (params.quarter) queryParams.append('quarter', params.quarter.toString());
    if (params.area) queryParams.append('area', params.area);
    if (params.city) queryParams.append('city', params.city);
    if (params.station) queryParams.append('station', params.station);
    if (params.priceClassification) queryParams.append('priceClassification', params.priceClassification);

    const url = `${this.baseUrl}/XIT001?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: 'success',
        data: data.data || [],
      };
    } catch (error) {
      console.error('getTradePrices error:', error);
      throw error;
    }
  }

  /**
   * 地価公示情報を取得
   * @param params - 検索パラメータ
   */
  async getLandPrices(params: {
    year: number; // 価格時点（2021~2025）
    area: string; // 都道府県コード（2桁）
    division: string; // 用途区分（00:住宅地, 05:商業地, 等）
  }): Promise<{ status: string; data: any[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('year', params.year.toString());
    queryParams.append('area', params.area);
    queryParams.append('division', params.division);

    const url = `${this.baseUrl}/XCT001?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: 'success',
        data: data.data || [],
      };
    } catch (error) {
      console.error('getLandPrices error:', error);
      throw error;
    }
  }

  /**
   * 市区町村一覧を取得
   * @param prefectureCode - 都道府県コード（2桁）
   */
  async getMunicipalities(prefectureCode: string): Promise<{ status: string; data: Municipality[] }> {
    const url = `${this.baseUrl}/XIT002?area=${prefectureCode}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: 'success',
        data: data.data || [],
      };
    } catch (error) {
      console.error('getMunicipalities error:', error);
      throw error;
    }
  }

  /**
   * 市場分析データを生成
   * 指定した地域の取引価格データから市場動向を分析
   */
  async analyzeMarket(params: {
    year: number;
    area?: string;
    city?: string;
  }): Promise<MarketAnalysis> {
    // 当該四半期と前四半期のデータを取得
    const currentQuarter = Math.ceil(new Date().getMonth() / 3);
    
    const [currentData, previousData] = await Promise.all([
      this.getTradePrices({ ...params, quarter: currentQuarter }),
      this.getTradePrices({ ...params, quarter: currentQuarter - 1 || 4 }),
    ]);

    // データ分析
    const prices = currentData.data
      .map(item => parseFloat(item.TradePrice))
      .filter(price => !isNaN(price) && price > 0);

    const pricesPerSqm = currentData.data
      .map(item => parseFloat(item.UnitPrice))
      .filter(price => !isNaN(price) && price > 0);

    const sortedPrices = [...prices].sort((a, b) => a - b);
    
    // 物件タイプ別集計
    const typeCount: Record<string, number> = {};
    currentData.data.forEach(item => {
      const type = item.Type || '不明';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const popularTypes = Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / currentData.data.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // 価格トレンド計算
    const currentAvg = prices.reduce((sum, p) => sum + p, 0) / prices.length || 0;
    const previousPrices = previousData.data
      .map(item => parseFloat(item.TradePrice))
      .filter(price => !isNaN(price) && price > 0);
    const previousAvg = previousPrices.reduce((sum, p) => sum + p, 0) / previousPrices.length || 0;
    
    const changeRate = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

    return {
      area: params.area || params.city || '全国',
      averagePrice: Math.round(currentAvg),
      averagePricePerSquareMeter: Math.round(
        pricesPerSqm.reduce((sum, p) => sum + p, 0) / pricesPerSqm.length || 0
      ),
      transactionCount: currentData.data.length,
      priceRange: {
        min: sortedPrices[0] || 0,
        max: sortedPrices[sortedPrices.length - 1] || 0,
        median: sortedPrices[Math.floor(sortedPrices.length / 2)] || 0,
      },
      pricetrend: {
        currentQuarter: Math.round(currentAvg),
        previousQuarter: Math.round(previousAvg),
        changeRate: Math.round(changeRate * 100) / 100,
      },
      popularPropertyTypes: popularTypes,
    };
  }

  /**
   * 市区町村名から市区町村コードを取得するヘルパー関数
   * 主要な市区町村のみサポート（東京23区と主要都市）
   */
  private getCityCode(cityName: string): string | null {
    // 東京23区のコードマッピング
    const tokyoWards: Record<string, string> = {
      '千代田区': '13101',
      '中央区': '13102',
      '港区': '13103',
      '新宿区': '13104',
      '文京区': '13105',
      '台東区': '13106',
      '墨田区': '13107',
      '江東区': '13108',
      '品川区': '13109',
      '目黒区': '13110',
      '大田区': '13111',
      '世田谷区': '13112',
      '渋谷区': '13113',
      '中野区': '13114',
      '杉並区': '13115',
      '豊島区': '13116',
      '北区': '13117',
      '荒川区': '13118',
      '板橋区': '13119',
      '練馬区': '13120',
      '足立区': '13121',
      '葛飾区': '13122',
      '江戸川区': '13123',
    };
    
    // 主要都市のコードマッピング
    const majorCities: Record<string, string> = {
      '横浜市': '14100',
      '川崎市': '14130',
      '大阪市': '27100',
      '名古屋市': '23100',
      '札幌市': '01100',
      '福岡市': '40130',
    };
    
    // 市区町村名からコードを検索
    return tokyoWards[cityName] || majorCities[cityName] || null;
  }

  /**
   * 周辺相場を取得
   * 指定した地域の最近の取引事例を取得
   */
  async getNearbyComparables(params: {
    city: string;
    propertyType?: string;
    minArea?: number;
    maxArea?: number;
    limit?: number;
  }): Promise<TradePrice[]> {
    const currentYear = new Date().getFullYear();
    
    // 市区町村名からコードに変換（5桁コードの場合はそのまま使用）
    let cityCode = params.city;
    if (params.city.length !== 5) {
      const code = this.getCityCode(params.city);
      if (!code) {
        console.warn(`City code not found for: ${params.city}, trying as-is`);
      } else {
        cityCode = code;
      }
    }
    
    const result = await this.getTradePrices({
      year: currentYear,
      city: cityCode,
    });

    let filtered = result.data;

    // 物件タイプでフィルタ
    if (params.propertyType) {
      filtered = filtered.filter(item => item.Type === params.propertyType);
    }

    // 面積でフィルタ
    if (params.minArea || params.maxArea) {
      filtered = filtered.filter(item => {
        const area = parseFloat(item.Area);
        if (isNaN(area)) return false;
        if (params.minArea && area < params.minArea) return false;
        if (params.maxArea && area > params.maxArea) return false;
        return true;
      });
    }

    // 最新順にソート
    filtered.sort((a, b) => b.Period.localeCompare(a.Period));

    // 件数制限
    const limit = params.limit || 10;
    return filtered.slice(0, limit);
  }

  /**
   * 価格推定
   * 周辺相場から物件価格を推定
   */
  async estimatePrice(params: {
    city: string;
    area: number; // 面積（㎡）
    propertyType: string;
    buildingYear?: string;
  }): Promise<{
    estimatedPrice: number;
    pricePerSquareMeter: number;
    confidence: 'low' | 'medium' | 'high';
    comparableCount: number;
    priceRange: { min: number; max: number };
  }> {
    // 類似物件を取得
    const comparables = await this.getNearbyComparables({
      city: params.city,
      propertyType: params.propertyType,
      minArea: params.area * 0.7, // ±30%の面積範囲
      maxArea: params.area * 1.3,
      limit: 20,
    });

    if (comparables.length === 0) {
      return {
        estimatedPrice: 0,
        pricePerSquareMeter: 0,
        confidence: 'low',
        comparableCount: 0,
        priceRange: { min: 0, max: 0 },
      };
    }

    // ㎡単価を計算
    const unitPrices = comparables
      .map(item => {
        const price = parseFloat(item.TradePrice);
        const area = parseFloat(item.Area);
        return !isNaN(price) && !isNaN(area) && area > 0 ? price / area : 0;
      })
      .filter(price => price > 0);

    // 平均㎡単価を計算
    const avgUnitPrice = unitPrices.reduce((sum, p) => sum + p, 0) / unitPrices.length;

    // 推定価格を計算
    const estimatedPrice = Math.round(avgUnitPrice * params.area);

    // 価格範囲を計算
    const sortedPrices = unitPrices.sort((a, b) => a - b);
    const minPrice = Math.round(sortedPrices[0] * params.area);
    const maxPrice = Math.round(sortedPrices[sortedPrices.length - 1] * params.area);

    // 信頼度を判定
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (comparables.length >= 10) confidence = 'high';
    else if (comparables.length >= 5) confidence = 'medium';

    return {
      estimatedPrice,
      pricePerSquareMeter: Math.round(avgUnitPrice),
      confidence,
      comparableCount: comparables.length,
      priceRange: { min: minPrice, max: maxPrice },
    };
  }
}

/**
 * 都道府県コード一覧
 */
export const PREFECTURE_CODES: Record<string, string> = {
  '01': '北海道',
  '02': '青森県',
  '03': '岩手県',
  '04': '宮城県',
  '05': '秋田県',
  '06': '山形県',
  '07': '福島県',
  '08': '茨城県',
  '09': '栃木県',
  '10': '群馬県',
  '11': '埼玉県',
  '12': '千葉県',
  '13': '東京都',
  '14': '神奈川県',
  '15': '新潟県',
  '16': '富山県',
  '17': '石川県',
  '18': '福井県',
  '19': '山梨県',
  '20': '長野県',
  '21': '岐阜県',
  '22': '静岡県',
  '23': '愛知県',
  '24': '三重県',
  '25': '滋賀県',
  '26': '京都府',
  '27': '大阪府',
  '28': '兵庫県',
  '29': '奈良県',
  '30': '和歌山県',
  '31': '鳥取県',
  '32': '島根県',
  '33': '岡山県',
  '34': '広島県',
  '35': '山口県',
  '36': '徳島県',
  '37': '香川県',
  '38': '愛媛県',
  '39': '高知県',
  '40': '福岡県',
  '41': '佐賀県',
  '42': '長崎県',
  '43': '熊本県',
  '44': '大分県',
  '45': '宮崎県',
  '46': '鹿児島県',
  '47': '沖縄県',
};

/**
 * 用途区分コード
 */
export const USE_DISTRICT_CODES: Record<string, string> = {
  '00': '住宅地',
  '03': '宅地見込地',
  '05': '商業地',
  '07': '準工業地',
  '09': '工業地',
  '10': '調整区域内宅地',
  '13': '現況林地',
  '20': '林地（都道府県地価調査）',
};
