/**
 * AI Market Analyzer using OpenAI GPT-4
 * 不動産市場のAI分析エンジン
 */

interface MarketData {
  area: string;
  areaName?: string;
  population?: number;
  averagePrice?: number;
  transactionCount?: number;
  pricePerSqm?: number;
  popularPropertyTypes?: Array<{ type: string; count: number }>;
  priceTrend?: {
    currentQuarter: number;
    previousQuarter: number;
    changeRate: number;
  };
  demographics?: any;
  landPrices?: any[];
}

interface PropertyData {
  name?: string;
  price?: number;
  location?: string;
  propertyType?: string;
  area?: number;
  buildingYear?: string;
  noi?: number;
  yield?: number;
}

interface AIAnalysisResult {
  summary: string;
  marketInsights: string[];
  investmentRecommendation: string;
  riskAssessment: string;
  opportunities: string[];
  concerns: string[];
  scorecard: {
    marketStrength: number;
    growthPotential: number;
    riskLevel: number;
    investmentTiming: number;
    overallScore: number;
  };
}

export class AIMarketAnalyzer {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Analyze market data using GPT-4
   */
  async analyzeMarket(
    marketData: MarketData,
    propertyData?: PropertyData
  ): Promise<AIAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(marketData, propertyData);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'あなたは日本の不動産市場に精通したプロフェッショナルなアナリストです。提供されたデータを分析し、投資家向けに詳細で実践的な分析レポートを作成してください。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No analysis generated');
      }

      const analysis = JSON.parse(content);
      
      return this.normalizeAnalysisResult(analysis);
    } catch (error) {
      console.error('AI analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze property investment potential
   */
  async analyzeProperty(
    propertyData: PropertyData,
    marketData?: MarketData
  ): Promise<AIAnalysisResult> {
    try {
      const prompt = this.buildPropertyAnalysisPrompt(propertyData, marketData);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'あなたは不動産投資のエキスパートです。物件データと市場データを分析し、投資判断に役立つ詳細なレポートを作成してください。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No analysis generated');
      }

      const analysis = JSON.parse(content);
      
      return this.normalizeAnalysisResult(analysis);
    } catch (error) {
      console.error('AI property analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate investment comparison analysis
   */
  async compareProperties(properties: PropertyData[]): Promise<{
    summary: string;
    rankings: Array<{ property: string; score: number; reasoning: string }>;
    recommendation: string;
  }> {
    try {
      const prompt = `
以下の複数の物件を比較分析し、投資優先順位を決定してください:

${properties.map((p, i) => `
物件${i + 1}: ${p.name || '名称未設定'}
- 価格: ${p.price?.toLocaleString()}円
- 所在地: ${p.location || '未設定'}
- 物件種別: ${p.propertyType || '未設定'}
- 面積: ${p.area || 0}㎡
- 築年: ${p.buildingYear || '未設定'}
- 利回り: ${p.yield || 0}%
`).join('\n')}

以下のJSON形式で回答してください:
{
  "summary": "全体的な比較サマリー",
  "rankings": [
    {
      "property": "物件名",
      "score": 85,
      "reasoning": "ランキング理由"
    }
  ],
  "recommendation": "最終的な投資推奨"
}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '投資物件の比較分析を行い、優先順位をつけてください。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No comparison generated');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('AI comparison error:', error);
      throw error;
    }
  }

  /**
   * Build market analysis prompt
   */
  private buildAnalysisPrompt(
    marketData: MarketData,
    propertyData?: PropertyData
  ): string {
    let prompt = `
以下の市場データを分析し、不動産投資の観点から詳細なレポートを作成してください:

## 市場データ
- エリア: ${marketData.areaName || marketData.area}
- 人口: ${marketData.population?.toLocaleString() || '不明'}
- 平均価格: ${marketData.averagePrice?.toLocaleString() || '不明'}円
- 取引件数: ${marketData.transactionCount || '不明'}件
- 平米単価: ${marketData.pricePerSqm?.toLocaleString() || '不明'}円/㎡
`;

    if (marketData.priceTrend) {
      prompt += `
- 価格トレンド:
  - 当四半期: ${marketData.priceTrend.currentQuarter.toLocaleString()}円
  - 前四半期: ${marketData.priceTrend.previousQuarter.toLocaleString()}円
  - 変化率: ${marketData.priceTrend.changeRate.toFixed(2)}%
`;
    }

    if (marketData.popularPropertyTypes && marketData.popularPropertyTypes.length > 0) {
      prompt += `\n- 人気物件タイプ:\n`;
      marketData.popularPropertyTypes.forEach(type => {
        prompt += `  - ${type.type}: ${type.count}件\n`;
      });
    }

    if (propertyData) {
      prompt += `\n## 検討物件データ
- 物件名: ${propertyData.name || '未設定'}
- 価格: ${propertyData.price?.toLocaleString() || '未設定'}円
- 所在地: ${propertyData.location || '未設定'}
- 物件種別: ${propertyData.propertyType || '未設定'}
- 面積: ${propertyData.area || '未設定'}㎡
- 築年: ${propertyData.buildingYear || '未設定'}
- 利回り: ${propertyData.yield || '未設定'}%
`;
    }

    prompt += `\n以下のJSON形式で分析結果を返してください:
{
  "summary": "市場全体のサマリー(150文字程度)",
  "marketInsights": ["洞察1", "洞察2", "洞察3"],
  "investmentRecommendation": "投資推奨(200文字程度)",
  "riskAssessment": "リスク評価(150文字程度)",
  "opportunities": ["機会1", "機会2", "機会3"],
  "concerns": ["懸念点1", "懸念点2", "懸念点3"],
  "scorecard": {
    "marketStrength": 75,
    "growthPotential": 80,
    "riskLevel": 45,
    "investmentTiming": 70,
    "overallScore": 72
  }
}

※ scorecardの各項目は0-100のスコアで評価してください。
`;

    return prompt;
  }

  /**
   * Build property analysis prompt
   */
  private buildPropertyAnalysisPrompt(
    propertyData: PropertyData,
    marketData?: MarketData
  ): string {
    let prompt = `
以下の物件を投資対象として評価してください:

## 物件情報
- 物件名: ${propertyData.name || '未設定'}
- 価格: ${propertyData.price?.toLocaleString() || '未設定'}円
- 所在地: ${propertyData.location || '未設定'}
- 物件種別: ${propertyData.propertyType || '未設定'}
- 面積: ${propertyData.area || '未設定'}㎡
- 築年: ${propertyData.buildingYear || '未設定'}
- NOI: ${propertyData.noi?.toLocaleString() || '未設定'}円
- 利回り: ${propertyData.yield || '未設定'}%
`;

    if (marketData) {
      prompt += `\n## 周辺市場データ
- エリア: ${marketData.areaName || marketData.area}
- 市場平均価格: ${marketData.averagePrice?.toLocaleString() || '不明'}円
- 市場平米単価: ${marketData.pricePerSqm?.toLocaleString() || '不明'}円/㎡
- 取引件数: ${marketData.transactionCount || '不明'}件
`;
    }

    prompt += `\n以下のJSON形式で分析結果を返してください:
{
  "summary": "物件の総合評価(150文字程度)",
  "marketInsights": ["市場比較の洞察1", "洞察2", "洞察3"],
  "investmentRecommendation": "投資推奨(200文字程度)",
  "riskAssessment": "リスク評価(150文字程度)",
  "opportunities": ["投資機会1", "機会2", "機会3"],
  "concerns": ["懸念点1", "懸念点2", "懸念点3"],
  "scorecard": {
    "marketStrength": 75,
    "growthPotential": 80,
    "riskLevel": 45,
    "investmentTiming": 70,
    "overallScore": 72
  }
}
`;

    return prompt;
  }

  /**
   * Normalize analysis result to consistent format
   */
  private normalizeAnalysisResult(analysis: any): AIAnalysisResult {
    return {
      summary: analysis.summary || '',
      marketInsights: analysis.marketInsights || [],
      investmentRecommendation: analysis.investmentRecommendation || '',
      riskAssessment: analysis.riskAssessment || '',
      opportunities: analysis.opportunities || [],
      concerns: analysis.concerns || [],
      scorecard: {
        marketStrength: analysis.scorecard?.marketStrength || 50,
        growthPotential: analysis.scorecard?.growthPotential || 50,
        riskLevel: analysis.scorecard?.riskLevel || 50,
        investmentTiming: analysis.scorecard?.investmentTiming || 50,
        overallScore: analysis.scorecard?.overallScore || 50,
      },
    };
  }
}
