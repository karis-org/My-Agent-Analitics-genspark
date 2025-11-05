/**
 * Stigmatized Property Checker
 * 事故物件（心理的瑕疵）調査ライブラリ
 * 
 * Google Custom Search API + OpenAI GPT-4 の2段階検索で実際のウェブ検索を実施
 */

import { GoogleSearchClient, SearchResult } from './google-search-client';

export interface StigmaCheckResult {
  hasStigma: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  findings: StigmaFinding[];
  sourcesChecked: SourceChecked[];
  summary: string;
  checkedAt: string;
  mode?: 'full' | 'demo';  // 実行モード
}

export interface StigmaFinding {
  source: string;
  sourceUrl: string;
  title: string;
  content: string;
  date: string;
  category: 'death' | 'crime' | 'fire' | 'disaster' | 'other';
  relevance: number; // 0-100
}

export interface SourceChecked {
  name: string;
  url: string;
  checked: boolean;
  foundIssues: number;
}

export class StigmatizedPropertyChecker {
  private openaiApiKey: string;
  private googleSearchClient?: GoogleSearchClient;

  constructor(openaiApiKey: string, googleApiKey?: string, searchEngineId?: string) {
    this.openaiApiKey = openaiApiKey;
    
    // Google Custom Search API が設定されている場合のみクライアントを初期化
    if (googleApiKey && searchEngineId && 
        googleApiKey !== 'demo' && searchEngineId !== 'demo' &&
        googleApiKey.trim() !== '' && searchEngineId.trim() !== '') {
      this.googleSearchClient = new GoogleSearchClient(googleApiKey, searchEngineId);
      console.log('[Stigma Checker] Google Custom Search API enabled');
    } else {
      console.warn('[Stigma Checker] Google Custom Search API not configured, using demo mode');
    }
  }

  /**
   * 事故物件調査を実行（Google検索 + AI分析の2段階処理）
   * @param address 調査対象物件の住所
   * @param propertyName 物件名（任意）
   */
  async checkProperty(address: string, propertyName?: string): Promise<StigmaCheckResult> {
    const checkedAt = new Date().toISOString();

    // APIキーチェック
    const hasOpenAI = this.openaiApiKey && 
                      this.openaiApiKey !== 'demo' && 
                      this.openaiApiKey.trim() !== '';
    
    const hasGoogleSearch = !!this.googleSearchClient;

    console.log('[Stigma Checker] API status:', {
      openai: hasOpenAI,
      googleSearch: hasGoogleSearch
    });

    // 両方のAPIが必要
    if (!hasOpenAI || !hasGoogleSearch) {
      console.warn('[Stigma Checker] Running in demo mode');
      return this.generateDemoResult(address, propertyName, checkedAt);
    }

    try {
      // Step 1: Google Custom Search APIで実際にウェブ検索
      console.log('[Stigma Checker] Step 1: Performing web search...');
      const searchResults = await this.googleSearchClient!.searchStigmatizedProperty(address, propertyName);
      
      console.log(`[Stigma Checker] Found ${searchResults.length} search results`);

      // 検索結果がない場合
      if (searchResults.length === 0) {
        return {
          hasStigma: false,
          riskLevel: 'none',
          findings: [],
          sourcesChecked: this.createSourceList(searchResults),
          summary: `調査対象: ${address}${propertyName ? ` (${propertyName})` : ''}\n\nGoogle検索、ニュースサイト、事故物件公示サイト（大島てる等）を実際に検索しましたが、心理的瑕疵に該当する事件・事故の情報は確認されませんでした。`,
          checkedAt,
          mode: 'full'
        };
      }

      // Step 2: 検索結果をOpenAI GPT-4で分析
      console.log('[Stigma Checker] Step 2: Analyzing search results with AI...');
      const analysis = await this.analyzeSearchResults(address, propertyName, searchResults);

      return {
        ...analysis,
        sourcesChecked: this.createSourceList(searchResults, analysis.findings),
        checkedAt,
        mode: 'full'
      };

    } catch (error: any) {
      console.error('[Stigma Checker] Error during check:', error);
      
      // エラー時はデモ結果を返す
      return this.generateDemoResult(address, propertyName, checkedAt, error.message);
    }
  }

  /**
   * Google検索結果をAIで分析
   */
  private async analyzeSearchResults(
    address: string,
    propertyName: string | undefined,
    searchResults: SearchResult[]
  ): Promise<Omit<StigmaCheckResult, 'sourcesChecked' | 'checkedAt' | 'mode'>> {
    
    // 検索結果をテキストにまとめる
    const searchResultsText = searchResults.map((result, index) => `
【検索結果 ${index + 1}】
タイトル: ${result.title}
URL: ${result.link}
概要: ${result.snippet}
---`).join('\n');

    const prompt = `
あなたは不動産の心理的瑕疵調査の専門家です。
以下のGoogle検索結果から、「${address}${propertyName ? ` (${propertyName})` : ''}」に関する事故物件情報（心理的瑕疵）を分析してください。

【Google検索結果】
${searchResultsText}

【分析指示】
1. 各検索結果が調査対象物件に関連しているか確認
2. 心理的瑕疵に該当する情報があるか判定:
   - 過去の死亡事故（自殺、他殺、孤独死等）
   - 重大な犯罪事件（殺人、強盗等）
   - 火災事故
   - その他の心理的瑕疵に該当する事象
3. 住所や物件名が完全一致または近似しているもののみ判定対象とする
4. 単なる地域の一般的なニュースは除外する

【重要】
- 検索結果に事故物件情報がある場合は必ず findings に含める
- 検索結果がない、または関連性がない場合は findings を空配列にする
- 憶測や推測は含めず、検索結果から確認できる事実のみを報告

以下のJSON形式で分析結果を返してください:
{
  "hasStigma": boolean,
  "riskLevel": "none" | "low" | "medium" | "high",
  "findings": [
    {
      "source": "検索結果のサイト名",
      "sourceUrl": "検索結果のURL",
      "title": "検索結果のタイトル",
      "content": "事故・事件の内容（検索結果から抽出）",
      "date": "発生日（YYYY-MM-DD形式、不明の場合は'不明'）",
      "category": "death" | "crime" | "fire" | "disaster" | "other",
      "relevance": 検索結果と物件の関連性（0-100）
    }
  ],
  "summary": "調査結果の総括（200文字程度）"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'あなたは不動産の心理的瑕疵調査の専門家です。Google検索結果から正確で客観的な情報のみを抽出してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const result = JSON.parse(content);

    return {
      hasStigma: result.hasStigma || false,
      riskLevel: result.riskLevel || 'none',
      findings: result.findings || [],
      summary: result.summary || `調査の結果、${searchResults.length}件の検索結果を分析しましたが、心理的瑕疵に該当する明確な情報は確認されませんでした。`,
    };
  }

  /**
   * ソースチェックリストを作成
   */
  private createSourceList(searchResults: SearchResult[], findings: StigmaFinding[] = []): SourceChecked[] {
    const sources: SourceChecked[] = [
      { name: 'Google検索', url: 'https://www.google.com', checked: true, foundIssues: searchResults.length },
      { name: '事故物件公示サイト（大島てる等）', url: 'https://www.oshimaland.co.jp', checked: true, foundIssues: 0 },
      { name: 'ニュースサイト', url: 'https://news.google.com', checked: true, foundIssues: 0 },
    ];

    // findingsから発見された件数をカウント
    const oshimalandFindings = findings.filter(f => 
      f.sourceUrl.includes('oshimaland') || f.source.includes('大島てる')
    ).length;
    
    const newsFindings = findings.filter(f => 
      f.sourceUrl.includes('news') || f.source.includes('ニュース')
    ).length;

    sources[1].foundIssues = oshimalandFindings;
    sources[2].foundIssues = newsFindings;

    return sources;
  }

  /**
   * デモモード用の結果生成
   */
  private generateDemoResult(
    address: string, 
    propertyName: string | undefined, 
    checkedAt: string,
    errorMessage?: string
  ): StigmaCheckResult {
    const sourcesToCheck: SourceChecked[] = [
      { name: 'Google検索', url: 'https://www.google.com', checked: false, foundIssues: 0 },
      { name: '事故物件公示サイト（大島てる等）', url: 'https://www.oshimaland.co.jp', checked: false, foundIssues: 0 },
      { name: 'ニュースサイト', url: 'https://news.google.com', checked: false, foundIssues: 0 },
    ];

    let demoMessage = `【デモモード】調査対象: ${address}${propertyName ? ` (${propertyName})` : ''}\n\n`;
    
    if (errorMessage) {
      demoMessage += `エラーが発生しました: ${errorMessage}\n\n`;
    }
    
    demoMessage += `実際のウェブ検索を行うには、以下のAPIキーが必要です:\n`;
    demoMessage += `- Google Custom Search API キー\n`;
    demoMessage += `- OpenAI API キー\n\n`;
    demoMessage += `APIキーを設定することで、Google検索、大島てる、ニュースサイトなどから実際の事故物件情報を検索・分析できます。`;

    return {
      hasStigma: false,
      riskLevel: 'none',
      findings: [],
      sourcesChecked: sourcesToCheck,
      summary: demoMessage,
      checkedAt,
      mode: 'demo'
    };
  }

  /**
   * リスクレベルの日本語説明を取得
   */
  static getRiskLevelDescription(riskLevel: string): string {
    const descriptions: Record<string, string> = {
      none: '心理的瑕疵なし',
      low: '軽微な懸念事項あり',
      medium: '要注意事項あり',
      high: '重大な心理的瑕疵の可能性あり',
    };
    return descriptions[riskLevel] || '不明';
  }

  /**
   * カテゴリーの日本語説明を取得
   */
  static getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      death: '死亡事故',
      crime: '犯罪事件',
      fire: '火災事故',
      disaster: '災害',
      other: 'その他',
    };
    return descriptions[category] || '不明';
  }
}
