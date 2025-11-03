/**
 * External API Clients
 * イタンジ、レインズ、Google Maps API統合
 */

/**
 * イタンジAPI Client
 * 賃貸物件情報取得
 */
export class ItandiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.itandi.co.jp/v1'; // 仮のエンドポイント
  }

  /**
   * 物件検索
   */
  async searchProperties(params: {
    prefecture?: string;
    city?: string;
    minRent?: number;
    maxRent?: number;
    propertyType?: string;
    limit?: number;
  }): Promise<any> {
    // 実際のAPI実装はイタンジのAPIドキュメントに基づいて実装
    console.log('Itandi API search:', params);
    
    return {
      success: true,
      properties: [],
      message: 'イタンジAPIキーが必要です。管理者に連絡してください。',
    };
  }

  /**
   * 物件詳細取得
   */
  async getPropertyDetail(propertyId: string): Promise<any> {
    console.log('Itandi API get property:', propertyId);
    
    return {
      success: true,
      property: null,
      message: 'イタンジAPIキーが必要です。',
    };
  }

  /**
   * 周辺賃貸物件相場調査
   * @param location 物件所在地
   * @param propertyType 物件タイプ（マンション、アパート、戸建て等）
   * @param area 専有面積（㎡）
   * @param radius 検索半径（km）
   */
  async getRentalMarketAnalysis(params: {
    location: string;
    propertyType?: string;
    area?: number;
    radius?: number;
  }): Promise<{
    success: boolean;
    averageRent: number;
    medianRent: number;
    minRent: number;
    maxRent: number;
    rentPerSqm: number;
    sampleCount: number;
    properties: any[];
    trend: {
      period: string;
      averageRent: number;
      change: number;
    }[];
    message?: string;
  }> {
    console.log('Itandi BB rental market analysis:', params);
    
    // デモデータ（実際のAPI実装時は実データを返す）
    const mockData = {
      success: true,
      averageRent: 185000,
      medianRent: 180000,
      minRent: 120000,
      maxRent: 280000,
      rentPerSqm: 2800,
      sampleCount: 42,
      properties: [
        {
          id: '1',
          name: 'サンプルマンションA',
          rent: 185000,
          area: 65.5,
          age: 3,
          distanceFromStation: 7,
          address: '東京都渋谷区恵比寿',
        },
        {
          id: '2',
          name: 'サンプルマンションB',
          rent: 175000,
          area: 62.0,
          age: 5,
          distanceFromStation: 9,
          address: '東京都渋谷区恵比寿',
        },
        {
          id: '3',
          name: 'サンプルマンションC',
          rent: 195000,
          area: 68.0,
          age: 2,
          distanceFromStation: 5,
          address: '東京都渋谷区恵比寿',
        },
      ],
      trend: [
        { period: '2024-Q1', averageRent: 175000, change: 2.3 },
        { period: '2024-Q2', averageRent: 178000, change: 1.7 },
        { period: '2024-Q3', averageRent: 182000, change: 2.2 },
        { period: '2024-Q4', averageRent: 185000, change: 1.6 },
      ],
      message: 'デモモード: サンプルデータを表示しています。実際の賃貸相場データを取得するには、イタンジBB APIキーを設定してください。',
    };

    return mockData;
  }

  /**
   * 賃貸相場推移データ取得
   * @param location 物件所在地
   * @param period 期間（月数）
   */
  async getRentalTrend(params: {
    location: string;
    propertyType?: string;
    period?: number; // months
  }): Promise<{
    success: boolean;
    trend: {
      month: string;
      averageRent: number;
      transactionCount: number;
      changeRate: number;
    }[];
    message?: string;
  }> {
    console.log('Itandi BB rental trend:', params);
    
    const period = params.period || 12;
    const currentDate = new Date();
    const trend = [];
    
    // デモデータ生成
    for (let i = period - 1; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const baseRent = 180000;
      const variation = Math.sin(i / 3) * 5000 + (period - i) * 300;
      const averageRent = Math.round(baseRent + variation);
      const prevAverage = i === period - 1 ? baseRent : Math.round(baseRent + Math.sin((i + 1) / 3) * 5000 + (period - i - 1) * 300);
      const changeRate = ((averageRent - prevAverage) / prevAverage) * 100;
      
      trend.push({
        month,
        averageRent,
        transactionCount: Math.round(30 + Math.random() * 20),
        changeRate: Number(changeRate.toFixed(2)),
      });
    }
    
    return {
      success: true,
      trend,
      message: 'デモモード: サンプルデータを表示しています。',
    };
  }
}

/**
 * レインズAPI Client  
 * 不動産流通データ取得
 */
export class ReinsClient {
  private loginId: string;
  private password: string;
  private baseUrl: string;

  constructor(loginId: string, password: string) {
    this.loginId = loginId;
    this.password = password;
    this.baseUrl = 'https://www.reins.or.jp/api'; // 仮のエンドポイント
  }

  /**
   * ログイン・認証
   */
  async authenticate(): Promise<{ token: string } | null> {
    // 実際のAPI実装はレインズのAPIドキュメントに基づいて実装
    console.log('REINS API authenticate');
    
    return null;
  }

  /**
   * 物件検索
   */
  async searchProperties(params: {
    prefecture?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    limit?: number;
  }): Promise<any> {
    console.log('REINS API search:', params);
    
    return {
      success: true,
      properties: [],
      message: 'レインズAPIキーが必要です。管理者に連絡してください。',
    };
  }

  /**
   * 成約事例取得
   */
  async getTransactionData(area: string, period: string): Promise<any> {
    console.log('REINS API transaction data:', area, period);
    
    return {
      success: true,
      transactions: [],
      message: 'レインズAPIキーが必要です。',
    };
  }
}

/**
 * Google Maps API Client
 * 地図表示、周辺施設検索
 */
export class GoogleMapsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  /**
   * 住所から緯度経度取得(Geocoding)
   */
  async geocode(address: string): Promise<{
    lat: number;
    lng: number;
    formattedAddress: string;
  } | null> {
    try {
      const url = `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * 周辺施設検索(Places API)
   */
  async searchNearbyPlaces(params: {
    lat: number;
    lng: number;
    radius?: number;
    type?: string; // 'school', 'hospital', 'supermarket', 'station', etc.
    keyword?: string;
  }): Promise<any[]> {
    try {
      const radius = params.radius || 1000; // Default 1km
      const url = `${this.baseUrl}/place/nearbysearch/json?location=${params.lat},${params.lng}&radius=${radius}&type=${params.type || ''}&keyword=${params.keyword || ''}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.results.map((place: any) => ({
          name: place.name,
          address: place.vicinity,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          rating: place.rating,
          types: place.types,
        }));
      }

      return [];
    } catch (error) {
      console.error('Places search error:', error);
      return [];
    }
  }

  /**
   * ルート検索(Directions API)
   */
  async getDirections(params: {
    origin: string;
    destination: string;
    mode?: 'driving' | 'walking' | 'transit' | 'bicycling';
  }): Promise<any> {
    try {
      const mode = params.mode || 'walking';
      const url = `${this.baseUrl}/directions/json?origin=${encodeURIComponent(params.origin)}&destination=${encodeURIComponent(params.destination)}&mode=${mode}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: leg.steps.map((step: any) => ({
            instruction: step.html_instructions,
            distance: step.distance.text,
            duration: step.duration.text,
          })),
        };
      }

      return null;
    } catch (error) {
      console.error('Directions error:', error);
      return null;
    }
  }

  /**
   * 最寄り駅検索
   */
  async findNearestStation(lat: number, lng: number): Promise<any> {
    const stations = await this.searchNearbyPlaces({
      lat,
      lng,
      radius: 2000,
      type: 'transit_station',
    });

    if (stations.length === 0) return null;

    // Calculate distance for each station
    const stationsWithDistance = await Promise.all(
      stations.map(async (station) => {
        const directions = await this.getDirections({
          origin: `${lat},${lng}`,
          destination: `${station.lat},${station.lng}`,
          mode: 'walking',
        });

        return {
          ...station,
          walkingDistance: directions?.distance,
          walkingTime: directions?.duration,
        };
      })
    );

    // Sort by walking time
    stationsWithDistance.sort((a, b) => {
      const timeA = a.walkingTime ? parseInt(a.walkingTime.split(' ')[0]) : 999;
      const timeB = b.walkingTime ? parseInt(b.walkingTime.split(' ')[0]) : 999;
      return timeA - timeB;
    });

    return stationsWithDistance[0];
  }

  /**
   * 周辺環境分析
   */
  async analyzeArea(address: string): Promise<{
    schools: any[];
    hospitals: any[];
    supermarkets: any[];
    stations: any[];
    parks: any[];
    conveniences: any[];
  }> {
    const location = await this.geocode(address);
    if (!location) {
      return {
        schools: [],
        hospitals: [],
        supermarkets: [],
        stations: [],
        parks: [],
        conveniences: [],
      };
    }

    const [schools, hospitals, supermarkets, stations, parks, conveniences] = await Promise.all([
      this.searchNearbyPlaces({ ...location, type: 'school', radius: 1500 }),
      this.searchNearbyPlaces({ ...location, type: 'hospital', radius: 2000 }),
      this.searchNearbyPlaces({ ...location, type: 'supermarket', radius: 1000 }),
      this.searchNearbyPlaces({ ...location, type: 'transit_station', radius: 2000 }),
      this.searchNearbyPlaces({ ...location, type: 'park', radius: 1500 }),
      this.searchNearbyPlaces({ ...location, type: 'convenience_store', radius: 500 }),
    ]);

    return {
      schools,
      hospitals,
      supermarkets,
      stations,
      parks,
      conveniences,
    };
  }
}

/**
 * 周辺環境スコア計算
 */
export function calculateAreaScore(areaData: {
  schools: any[];
  hospitals: any[];
  supermarkets: any[];
  stations: any[];
  parks: any[];
  conveniences: any[];
}): {
  totalScore: number;
  scores: {
    education: number;
    medical: number;
    shopping: number;
    transport: number;
    environment: number;
    convenience: number;
  };
} {
  const scores = {
    education: Math.min(100, areaData.schools.length * 20),
    medical: Math.min(100, areaData.hospitals.length * 25),
    shopping: Math.min(100, areaData.supermarkets.length * 15),
    transport: Math.min(100, areaData.stations.length * 30),
    environment: Math.min(100, areaData.parks.length * 20),
    convenience: Math.min(100, areaData.conveniences.length * 10),
  };

  const totalScore = Math.round(
    (scores.education + scores.medical + scores.shopping + 
     scores.transport + scores.environment + scores.convenience) / 6
  );

  return {
    totalScore,
    scores,
  };
}
