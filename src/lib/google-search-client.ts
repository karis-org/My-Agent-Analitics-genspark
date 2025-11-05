// Google Custom Search API クライアント

import type { GoogleSearchResponse, SearchResult } from '../types/google-search';

export class GoogleSearchClient {
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  /**
   * Google Custom Search APIで検索を実行
   * @param query 検索クエリ
   * @param numResults 取得する結果数（デフォルト: 10、最大: 10）
   * @returns 検索結果の配列
   */
  async search(query: string, numResults: number = 10): Promise<SearchResult[]> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('cx', this.searchEngineId);
      url.searchParams.append('q', query);
      url.searchParams.append('num', Math.min(numResults, 10).toString());
      url.searchParams.append('lr', 'lang_ja'); // 日本語の結果を優先
      url.searchParams.append('gl', 'jp'); // 日本の結果を優先

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Search API error: ${response.status} - ${errorText}`);
      }

      const data: GoogleSearchResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        return [];
      }

      return data.items.map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet
      }));
    } catch (error) {
      console.error('Google Search API error:', error);
      throw error;
    }
  }

  /**
   * 複数のキーワードで検索を実行し、結果を統合
   * @param queries 検索クエリの配列
   * @returns 統合された検索結果
   */
  async searchMultiple(queries: string[]): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const query of queries) {
      try {
        const results = await this.search(query, 5);
        
        // 重複URLを除外して追加
        for (const result of results) {
          if (!seenUrls.has(result.url)) {
            seenUrls.add(result.url);
            allResults.push(result);
          }
        }
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
        // 1つのクエリが失敗しても続行
      }
    }

    return allResults;
  }
}
