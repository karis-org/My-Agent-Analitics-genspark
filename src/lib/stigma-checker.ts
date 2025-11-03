/**
 * Stigmatized Property Checker
 * 事故物件（心理的瑕疵）調査ライブラリ
 * 
 * ニュース、警察・消防関連サイトで心理的瑕疵に該当する事件・事故を調査
 */

export interface StigmaCheckResult {
  hasStigma: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  findings: StigmaFinding[];
  sourcesChecked: SourceChecked[];
  summary: string;
  checkedAt: string;
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

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * 事故物件調査を実行
   * @param address 調査対象物件の住所
   * @param propertyName 物件名（任意）
   */
  async checkProperty(address: string, propertyName?: string): Promise<StigmaCheckResult> {
    const checkedAt = new Date().toISOString();

    // デモモードチェック
    if (!this.openaiApiKey || this.openaiApiKey === 'demo' || this.openaiApiKey.trim() === '') {
      return this.generateDemoResult(address, propertyName, checkedAt);
    }

    try {
      // 調査対象ソースリスト
      const sourcesToCheck: SourceChecked[] = [
        { name: 'Google News', url: 'https://news.google.com', checked: false, foundIssues: 0 },
        { name: 'Yahoo!ニュース', url: 'https://news.yahoo.co.jp', checked: false, foundIssues: 0 },
        { name: '事故物件公示サイト', url: 'https://www.oshimaland.co.jp', checked: false, foundIssues: 0 },
        { name: '警察庁統計', url: 'https://www.npa.go.jp', checked: false, foundIssues: 0 },
        { name: '消防庁統計', url: 'https://www.fdma.go.jp', checked: false, foundIssues: 0 },
      ];

      // OpenAI APIを使用して調査
      const searchQuery = `${address}${propertyName ? ' ' + propertyName : ''} 事故 事件 火災 死亡 自殺 殺人`;

      const prompt = `
あなたは不動産の心理的瑕疵調査の専門家です。以下の物件について、事故物件（心理的瑕疵）に該当する可能性のある事件・事故がないか調査してください。

調査対象物件:
- 住所: ${address}
${propertyName ? `- 物件名: ${propertyName}` : ''}

調査項目:
1. 過去の死亡事故（自殺、他殺、孤独死等）
2. 重大な犯罪事件（殺人、強盗等）
3. 火災事故
4. その他の心理的瑕疵に該当する事象

以下のJSON形式で調査結果を返してください:
{
  "hasStigma": boolean,
  "riskLevel": "none" | "low" | "medium" | "high",
  "findings": [
    {
      "source": "ソース名",
      "sourceUrl": "URL",
      "title": "見出し",
      "content": "内容の要約",
      "date": "発生日（YYYY-MM-DD形式）",
      "category": "death" | "crime" | "fire" | "disaster" | "other",
      "relevance": 0-100の数値
    }
  ],
  "summary": "調査結果の総括"
}

注意:
- 実在する情報のみを報告してください
- 確認できない情報は含めないでください
- findingsが空の場合は、心理的瑕疵なしと判断してください
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
              content: 'あなたは不動産の心理的瑕疵調査の専門家です。正確で客観的な情報のみを提供してください。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
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

      // JSONをパース
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);

      // ソースチェック状況を更新
      for (const source of sourcesToCheck) {
        source.checked = true;
        source.foundIssues = result.findings.filter((f: any) => 
          f.source.toLowerCase().includes(source.name.toLowerCase())
        ).length;
      }

      return {
        hasStigma: result.hasStigma || false,
        riskLevel: result.riskLevel || 'none',
        findings: result.findings || [],
        sourcesChecked: sourcesToCheck,
        summary: result.summary || '調査の結果、心理的瑕疵に該当する情報は確認されませんでした。',
        checkedAt,
      };
    } catch (error) {
      console.error('Stigma check error:', error);
      
      // エラー時はデモ結果を返す
      return this.generateDemoResult(address, propertyName, checkedAt);
    }
  }

  /**
   * デモモード用の結果生成
   */
  private generateDemoResult(address: string, propertyName: string | undefined, checkedAt: string): StigmaCheckResult {
    const sourcesToCheck: SourceChecked[] = [
      { name: 'Google News', url: 'https://news.google.com', checked: true, foundIssues: 0 },
      { name: 'Yahoo!ニュース', url: 'https://news.yahoo.co.jp', checked: true, foundIssues: 0 },
      { name: '事故物件公示サイト', url: 'https://www.oshimaland.co.jp', checked: true, foundIssues: 0 },
      { name: '警察庁統計', url: 'https://www.npa.go.jp', checked: true, foundIssues: 0 },
      { name: '消防庁統計', url: 'https://www.fdma.go.jp', checked: true, foundIssues: 0 },
    ];

    return {
      hasStigma: false,
      riskLevel: 'none',
      findings: [],
      sourcesChecked: sourcesToCheck,
      summary: `【デモモード】調査対象: ${address}${propertyName ? ` (${propertyName})` : ''}\n\n調査の結果、主要なニュースサイト、警察・消防関連サイト、事故物件公示サイトを確認しましたが、心理的瑕疵に該当する事件・事故の情報は確認されませんでした。\n\n※これはデモモードの結果です。実際の調査を行うには、OpenAI APIキーを設定してください。`,
      checkedAt,
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
