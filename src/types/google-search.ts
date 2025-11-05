// Google Custom Search API 型定義

export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  formattedUrl?: string;
}

export interface GoogleSearchResponse {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    request: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
  };
  items?: GoogleSearchResult[];
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}
