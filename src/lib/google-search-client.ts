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
    
    // 検索クエリのバリエーション
    const queries = [
      // メイン検索
      `${address}${propertyName ? ' ' + propertyName : ''} 事故 事件 大島てる`,
      // 具体的なキーワードで検索
      `${address}${propertyName ? ' ' + propertyName : ''} 自殺 他殺 火災`,
      // 大島てる専用検索
      `site:oshimaland.co.jp ${address}${propertyName ? ' ' + propertyName : ''}`,
    ];

    // 各クエリで検索（エラーが発生しても続行）
    for (const query of queries) {
      try {
        const results = await this.search(query, { num: 10 });
        allResults.push(...results);
        
        // API制限を避けるため、少し待機
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Search failed for query: ${query}`, error);
        // エラーが発生しても次の検索を続行
      }
    }

    // 重複を削除（URLベース）
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.link === result.link)
    );

    return uniqueResults;
  }
}
