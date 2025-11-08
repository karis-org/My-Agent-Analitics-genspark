/**
 * e-Stat API Client
 * 日本政府の統計データ API
 * https://www.e-stat.go.jp/api/
 */

interface EStatConfig {
  apiKey: string;
  baseUrl?: string;
}

interface PopulationData {
  prefCode: string;
  prefName: string;
  cityCode?: string;
  cityName?: string;
  year: number;
  population: number;
  households?: number;
  populationDensity?: number;
}

interface EconomicIndicator {
  area: string;
  areaName: string;
  year: number;
  indicator: string;
  value: number;
  unit: string;
}

interface LandPriceData {
  prefCode: string;
  prefName: string;
  cityCode: string;
  cityName: string;
  year: number;
  averagePrice: number;
  pricePerSquareMeter: number;
  changeRate?: number;
}

export class EStatClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: EStatConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.e-stat.go.jp/rest/3.0/app/json';
  }

  /**
   * 人口統計データ取得
   * Stats ID: 0003410379 (国勢調査)
   */
  async getPopulationData(prefCode: string, cityCode?: string): Promise<PopulationData[]> {
    try {
      const statsId = '0003410379'; // 国勢調査の統計ID
      
      const params = new URLSearchParams({
        appId: this.apiKey,
        statsDataId: statsId,
        cdCat01: prefCode, // 都道府県コード
      });

      if (cityCode) {
        params.append('cdCat02', cityCode); // 市区町村コード
      }

      const response = await fetch(`${this.baseUrl}/getStatsData?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`e-Stat API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      return this.parsePopulationData(data);
    } catch (error) {
      console.error('Failed to fetch population data:', error);
      throw error;
    }
  }

  /**
   * 経済指標データ取得
   * Stats ID: 0003109963 (都道府県・市区町村のすがた)
   */
  async getEconomicIndicators(prefCode: string, cityCode?: string): Promise<EconomicIndicator[]> {
    try {
      const statsId = '0003109963'; // 都道府県・市区町村のすがた
      
      const params = new URLSearchParams({
        appId: this.apiKey,
        statsDataId: statsId,
        cdCat01: prefCode,
      });

      if (cityCode) {
        params.append('cdArea', cityCode);
      }

      const response = await fetch(`${this.baseUrl}/getStatsData?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`e-Stat API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      return this.parseEconomicData(data);
    } catch (error) {
      console.error('Failed to fetch economic indicators:', error);
      throw error;
    }
  }

  /**
   * 地価データ取得
   * Stats ID: 0003411368 (地価公示)
   */
  async getLandPriceData(prefCode: string, year?: number): Promise<LandPriceData[]> {
    try {
      const statsId = '0003411368'; // 地価公示
      
      const params = new URLSearchParams({
        appId: this.apiKey,
        statsDataId: statsId,
        cdCat01: prefCode,
      });

      if (year) {
        params.append('cdTime', year.toString());
      }

      const response = await fetch(`${this.baseUrl}/getStatsData?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`e-Stat API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      return this.parseLandPriceData(data);
    } catch (error) {
      console.error('Failed to fetch land price data:', error);
      throw error;
    }
  }

  /**
   * 統計データリスト取得
   */
  async getStatsList(searchWord?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        appId: this.apiKey,
        limit: '100',
      });

      if (searchWord) {
        params.append('searchWord', searchWord);
      }

      const response = await fetch(`${this.baseUrl}/getStatsList?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`e-Stat API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      return data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
    } catch (error) {
      console.error('Failed to fetch stats list:', error);
      throw error;
    }
  }

  /**
   * 市区町村マスターデータ取得
   */
  async getMunicipalityList(prefCode?: string): Promise<any[]> {
    try {
      const statsId = '0003109963'; // 市区町村マスター
      
      const params = new URLSearchParams({
        appId: this.apiKey,
        statsDataId: statsId,
      });

      if (prefCode) {
        params.append('cdCat01', prefCode);
      }

      const response = await fetch(`${this.baseUrl}/getMetaInfo?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`e-Stat API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      return data.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ || [];
    } catch (error) {
      console.error('Failed to fetch municipality list:', error);
      throw error;
    }
  }

  /**
   * Parse population data from e-Stat response
   */
  private parsePopulationData(data: any): PopulationData[] {
    const results: PopulationData[] = [];
    
    try {
      const values = data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
      
      for (const item of values) {
        results.push({
          prefCode: item['@cat01'] || '',
          prefName: this.getPrefName(item['@cat01']),
          cityCode: item['@cat02'],
          cityName: item['@area'],
          year: parseInt(item['@time']) || new Date().getFullYear(),
          population: parseInt(item['$']) || 0,
        });
      }
    } catch (error) {
      console.error('Failed to parse population data:', error);
    }
    
    return results;
  }

  /**
   * Parse economic data from e-Stat response
   */
  private parseEconomicData(data: any): EconomicIndicator[] {
    const results: EconomicIndicator[] = [];
    
    try {
      const values = data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
      
      for (const item of values) {
        results.push({
          area: item['@area'] || '',
          areaName: item['@areaName'] || '',
          year: parseInt(item['@time']) || new Date().getFullYear(),
          indicator: item['@cat01'] || '',
          value: parseFloat(item['$']) || 0,
          unit: item['@unit'] || '',
        });
      }
    } catch (error) {
      console.error('Failed to parse economic data:', error);
    }
    
    return results;
  }

  /**
   * Parse land price data from e-Stat response
   */
  private parseLandPriceData(data: any): LandPriceData[] {
    const results: LandPriceData[] = [];
    
    try {
      const values = data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
      
      for (const item of values) {
        results.push({
          prefCode: item['@cat01'] || '',
          prefName: this.getPrefName(item['@cat01']),
          cityCode: item['@cat02'] || '',
          cityName: item['@area'] || '',
          year: parseInt(item['@time']) || new Date().getFullYear(),
          averagePrice: parseFloat(item['$']) || 0,
          pricePerSquareMeter: parseFloat(item['$']) || 0,
        });
      }
    } catch (error) {
      console.error('Failed to parse land price data:', error);
    }
    
    return results;
  }

  /**
   * Get prefecture name from code
   */
  private getPrefName(code: string): string {
    const prefectures: { [key: string]: string } = {
      '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県', '05': '秋田県',
      '06': '山形県', '07': '福島県', '08': '茨城県', '09': '栃木県', '10': '群馬県',
      '11': '埼玉県', '12': '千葉県', '13': '東京都', '14': '神奈川県', '15': '新潟県',
      '16': '富山県', '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
      '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県', '25': '滋賀県',
      '26': '京都府', '27': '大阪府', '28': '兵庫県', '29': '奈良県', '30': '和歌山県',
      '31': '鳥取県', '32': '島根県', '33': '岡山県', '34': '広島県', '35': '山口県',
      '36': '徳島県', '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
      '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県', '45': '宮崎県',
      '46': '鹿児島県', '47': '沖縄県',
    };
    
    return prefectures[code] || '';
  }
}

/**
 * Area demographic analysis helper
 */
export async function analyzeDemographics(
  eStatClient: EStatClient,
  prefCode: string,
  cityCode?: string
): Promise<{
  population: PopulationData[];
  economics: EconomicIndicator[];
  landPrices: LandPriceData[];
  summary: {
    totalPopulation: number;
    populationGrowthRate: number;
    averageLandPrice: number;
    economicStrength: string;
  };
}> {
  const [population, economics, landPrices] = await Promise.all([
    eStatClient.getPopulationData(prefCode, cityCode),
    eStatClient.getEconomicIndicators(prefCode, cityCode),
    eStatClient.getLandPriceData(prefCode),
  ]);

  // Calculate summary metrics
  const totalPopulation = population.reduce((sum, p) => sum + p.population, 0);
  const populationGrowthRate = calculateGrowthRate(population);
  const averageLandPrice = landPrices.length > 0
    ? landPrices.reduce((sum, p) => sum + p.averagePrice, 0) / landPrices.length
    : 0;

  // Determine economic strength based on indicators
  const economicStrength = assessEconomicStrength(economics, landPrices);

  return {
    population,
    economics,
    landPrices,
    summary: {
      totalPopulation,
      populationGrowthRate,
      averageLandPrice,
      economicStrength,
    },
  };
}

function calculateGrowthRate(population: PopulationData[]): number {
  if (population.length < 2) return 0;
  
  const sorted = population.sort((a, b) => a.year - b.year);
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];
  
  const years = newest.year - oldest.year;
  if (years === 0) return 0;
  
  return ((newest.population - oldest.population) / oldest.population) * 100 / years;
}

function assessEconomicStrength(
  economics: EconomicIndicator[],
  landPrices: LandPriceData[]
): string {
  // Simple heuristic based on available data
  const avgLandPrice = landPrices.length > 0
    ? landPrices.reduce((sum, p) => sum + p.averagePrice, 0) / landPrices.length
    : 0;

  if (avgLandPrice > 100000) return '強い';
  if (avgLandPrice > 50000) return '中程度';
  return '弱い';
}
