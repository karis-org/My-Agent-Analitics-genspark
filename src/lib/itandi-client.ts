/**
 * Itandi BB (Rabbynet BB) API Client
 * イタンジBB（ラビーネットBB）APIクライアント
 * 
 * 賃貸物件の相場データ取得機能
 */

export interface ItandiCredentials {
  username: string; // ラビーネットID
  password: string; // パスワード
}

export interface RentalSearchParams {
  prefecture: string;        // 都道府県
  city: string;              // 市区町村
  town?: string;             // 町名（任意）
  roomType?: string;         // 間取り (1R, 1K, 1DK, 1LDK, etc.)
  minArea?: number;          // 最小面積 (㎡)
  maxArea?: number;          // 最大面積 (㎡)
  minRent?: number;          // 最小賃料 (円)
  maxRent?: number;          // 最大賃料 (円)
}

export interface RentalProperty {
  name: string;              // 物件名
  address: string;           // 住所
  rent: number;              // 賃料 (円/月)
  roomType: string;          // 間取り
  area: number;              // 面積 (㎡)
  age: number;               // 築年数
  walkMinutes: number;       // 駅徒歩 (分)
  structure?: string;        // 構造
  floor?: string;            // 階数
  nearestStation?: string;   // 最寄り駅
}

export interface RentalAnalysisResult {
  averageRent: number;       // 平均賃料
  medianRent: number;        // 中央値
  minRent: number;           // 最小賃料
  maxRent: number;           // 最大賃料
  sampleSize: number;        // サンプル数
  rentDistribution: Array<{
    range: string;
    count: number;
  }>;
  properties: RentalProperty[];
}

export interface RentalTrendData {
  month: string;             // 月 (例: "2024年1月")
  averageRent: number;       // 平均賃料
  medianRent: number;        // 中央値
  sampleSize: number;        // サンプル数
}

export interface RentalTrendResult {
  trendData: RentalTrendData[];
  overallTrend: 'increasing' | 'stable' | 'decreasing';
  changeRate: number;        // 変化率 (%)
}

/**
 * Itandi BB Client
 * 実際のラビーネットBB APIへの接続とデータ取得
 */
export class ItandiClient {
  private credentials: ItandiCredentials;
  private sessionToken?: string;
  private loginUrl = 'https://itandi-accounts.com/login';
  private apiBaseUrl = 'https://api.itandi-bb.com'; // 実際のAPIエンドポイントは要確認

  constructor(credentials: ItandiCredentials) {
    this.credentials = credentials;
  }

  /**
   * ラビーネットにログイン
   */
  async login(): Promise<boolean> {
    try {
      // ステップ1: ログインページにアクセス
      const loginPageResponse = await fetch(this.loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!loginPageResponse.ok) {
        console.error('Failed to access login page');
        return false;
      }

      // ステップ2: ラビーネットログインを実行
      const loginResponse = await fetch(`${this.loginUrl}/rabbynet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: new URLSearchParams({
          username: this.credentials.username,
          password: this.credentials.password
        })
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('[Itandi Client] Login failed:', {
          status: loginResponse.status,
          statusText: loginResponse.statusText,
          body: errorText
        });
        return false;
      }

      // セッショントークンを取得（Cookieまたはレスポンスから）
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        // セッショントークンを抽出
        const tokenMatch = setCookieHeader.match(/session=([^;]+)/);
        if (tokenMatch) {
          this.sessionToken = tokenMatch[1];
          return true;
        }
      }

      // レスポンスボディからトークンを取得する場合
      const loginData = await loginResponse.json();
      if (loginData.token || loginData.sessionId) {
        this.sessionToken = loginData.token || loginData.sessionId;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  /**
   * 賃貸相場分析を実行
   */
  async getRentalAnalysis(params: RentalSearchParams): Promise<RentalAnalysisResult> {
    // ログインしていない場合はログイン
    if (!this.sessionToken) {
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('イタンジBBへのログインに失敗しました。認証情報を確認してください。');
      }
    }

    // 実際のAPI呼び出し
    const response = await fetch(`${this.apiBaseUrl}/rental/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sessionToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Itandi Client] API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`イタンジBB APIリクエストに失敗しました: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Itandi Client] Analysis result received:', data);
    return this.parseAnalysisResult(data);
  }

  /**
   * 賃貸推移データを取得
   */
  async getRentalTrend(params: RentalSearchParams, months: number = 12): Promise<RentalTrendResult> {
    if (!this.sessionToken) {
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('イタンジBBへのログインに失敗しました。認証情報を確認してください。');
      }
    }

    const response = await fetch(`${this.apiBaseUrl}/rental/trend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sessionToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({ ...params, months })
    });

    if (!response.ok) {
      throw new Error(`イタンジBB APIリクエストに失敗しました: ${response.status}`);
    }

    const data = await response.json();
    return this.parseTrendResult(data);
  }

  /**
   * APIレスポンスを解析
   */
  private parseAnalysisResult(data: any): RentalAnalysisResult {
    return {
      averageRent: data.average_rent || data.averageRent || 0,
      medianRent: data.median_rent || data.medianRent || 0,
      minRent: data.min_rent || data.minRent || 0,
      maxRent: data.max_rent || data.maxRent || 0,
      sampleSize: data.sample_size || data.sampleSize || 0,
      rentDistribution: data.rent_distribution || data.rentDistribution || [],
      properties: (data.properties || []).map((p: any) => ({
        name: p.name || p.property_name || '物件名未設定',
        address: p.address || p.location || '',
        rent: p.rent || p.monthly_rent || 0,
        roomType: p.room_type || p.roomType || '',
        area: p.area || p.floor_area || 0,
        age: p.age || p.building_age || 0,
        walkMinutes: p.walk_minutes || p.walkMinutes || 0,
        structure: p.structure || p.building_structure,
        floor: p.floor,
        nearestStation: p.nearest_station || p.nearestStation
      }))
    };
  }

  /**
   * トレンドデータを解析
   */
  private parseTrendResult(data: any): RentalTrendResult {
    const trendData = data.trend_data || data.trendData || [];
    
    // トレンド方向を計算
    let overallTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    let changeRate = 0;
    
    if (trendData.length >= 2) {
      const firstRent = trendData[0].averageRent || trendData[0].average_rent || 0;
      const lastRent = trendData[trendData.length - 1].averageRent || trendData[trendData.length - 1].average_rent || 0;
      
      if (firstRent > 0) {
        changeRate = ((lastRent - firstRent) / firstRent) * 100;
        
        if (changeRate > 2) {
          overallTrend = 'increasing';
        } else if (changeRate < -2) {
          overallTrend = 'decreasing';
        }
      }
    }

    return {
      trendData: trendData.map((t: any) => ({
        month: t.month || t.date || '',
        averageRent: t.average_rent || t.averageRent || 0,
        medianRent: t.median_rent || t.medianRent || 0,
        sampleSize: t.sample_size || t.sampleSize || 0
      })),
      overallTrend,
      changeRate
    };
  }


}

/**
 * ItandiClientのシングルトンインスタンスを取得
 */
let itandiClientInstance: ItandiClient | null = null;

export function getItandiClient(env?: any): ItandiClient {
  if (!itandiClientInstance) {
    // 環境変数を優先的に使用、なければデフォルト値
    const credentials: ItandiCredentials = {
      username: env?.ITANDI_EMAIL || '1340792731', // 環境変数優先
      password: env?.ITANDI_PASSWORD || 'gthome1120'  // 環境変数優先
    };
    itandiClientInstance = new ItandiClient(credentials);
    console.log('[Itandi Client] Initialized with username:', credentials.username);
  }
  return itandiClientInstance;
}
