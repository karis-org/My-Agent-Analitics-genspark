/**
 * Google Custom Search API Client
 * Googleカスタム検索APIを使用して、事故物件情報を実際にウェブ検索
 */

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

export interface GoogleSearchResponse {
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink?: string;
  }>;
  searchInformation?: {
    totalResults: string;
  };
}

export class GoogleSearchClient {
  private apiKey: string;
  private searchEngineId: string;

  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  /**
   * Google Custom Search APIで検索を実行
   * @param query 検索クエリ
   * @param options 検索オプション
   * @returns 検索結果の配列
   */
  async search(query: string, options?: {
    num?: number;  // 結果数（デフォルト: 10、最大: 10）
    start?: number; // 開始位置（ページネーション用）
  }): Promise<SearchResult[]> {
    const num = options?.num || 10;
    const start = options?.start || 1;

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('cx', this.searchEngineId);
    url.searchParams.append('q', query);
    url.searchParams.append('num', num.toString());
    url.searchParams.append('start', start.toString());

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Search API error:', response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Google Search API: 利用制限に達しました。しばらく待ってから再試行してください。');
        } else if (response.status === 400) {
          throw new Error('Google Search API: 検索クエリが無効です。');
        } else if (response.status === 403) {
          throw new Error('Google Search API: APIキーが無効、または権限がありません。');
        }
        
        throw new Error(`Google Search API error: ${response.status}`);
      }

      const data: GoogleSearchResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }

      return data.items.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink
      }));
    } catch (error: any) {
      console.error('Google Search error:', error);
      throw error;
    }
  }

  /**
   * 事故物件専用の検索（複数のキーワードで検索）
   * @param address 住所
   * @param propertyName 物件名（任意）
   * @returns すべての検索結果
   */
  async searchStigmatizedProperty(address: string, propertyName?: string): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    
    // 住所の正規化と複数バリエーション生成
    const { normalizeAddress } = await import('./address-normalizer');
    const addressVariations = normalizeAddress(address);
    
    console.log('[Google Search] Address variations:', addressVariations);
    
    const queries: string[] = [];
    
    // 区と町名を抽出（例: 葛飾区新小岩）
    const kuMatch = address.match(/(.+区)(.+?)([0-9０-９一二三四五六七八九十]+|$)/);
    const ku = kuMatch ? kuMatch[1] : '';
    const town = kuMatch ? kuMatch[2] : '';
    
    // 各住所バリエーションで検索クエリを生成
    for (const addr of addressVariations.slice(0, 3)) {  // 最大3バリエーション
      queries.push(
        // 大島てるサイト直接検索
        `site:oshimaland.co.jp ${addr}`,
        // 区と町名での広範囲検索
        `site:oshimaland.co.jp ${ku} ${town}`,
        // 一般的な事故物件検索
        `${addr} 事故物件 大島てる`,
        `${addr} 事件 事故`,
        // 心理的瑕疵関連キーワード
        `${addr} 自殺 他殺`,
        `${addr} 火災 死亡`
      );
    }
    
    // 物件名がある場合は追加の検索
    if (propertyName) {
      queries.push(
        `${propertyName} ${address} 事故`,
        `site:oshimaland.co.jp ${propertyName}`,
        `${propertyName} 事故物件`
      );
    }
    
    // 重複を削除
    const uniqueQueries = Array.from(new Set(queries));
    
    console.log(`[Google Search] Total queries: ${uniqueQueries.length}`);
    
    // 各クエリで検索（最大15クエリまで）
    for (const query of uniqueQueries.slice(0, 15)) {
      try {
        console.log(`[Google Search] Searching: ${query}`);
        const results = await this.search(query, { num: 10 });
        console.log(`[Google Search] Found ${results.length} results`);
        allResults.push(...results);
        
        // API制限を避けるため、少し待機
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.warn(`[Google Search] Failed for query: ${query}`, error);
        // エラーが発生しても次の検索を続行
      }
    }

    // 重複を削除（URLベース）
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.link === result.link)
    );
    
    console.log(`[Google Search] Total unique results: ${uniqueResults.length}`);

    return uniqueResults;
  }
}
