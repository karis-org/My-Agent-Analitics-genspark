/**
 * Stigmatized Property Checker with Google Custom Search API
 * 事故物件（心理的瑕疵）調査ライブラリ
 * 
 * Google Custom Search APIで実際にウェブ検索を行い、
 * 結果をOpenAI GPT-4で分析して心理的瑕疵を判定
 */

import { GoogleSearchClient } from './google-search-client';
import type { SearchResult } from '../types/google-search';

export interface StigmaCheckResult {
  hasStigma: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  findings: StigmaFinding[];
  sourcesChecked: SourceChecked[];
  summary: string;
  checkedAt: string;
  searchResults?: SearchResult[]; // 実際の検索結果を保存
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
  private googleSearchClient: GoogleSearchClient | null;

  constructor(openaiApiKey: string, googleApiKey: string, searchEngineId: string) {
    // APIキーの検証
    if (!openaiApiKey || openaiApiKey.trim() === '') {
      throw new Error('OpenAI APIキーが設定されていません。');
    }
    if (!googleApiKey || googleApiKey.trim() === '') {
      throw new Error('Google Custom Search APIキーが設定されていません。');
    }
    if (!searchEngineId || searchEngineId.trim() === '') {
      throw new Error('Google Search Engine IDが設定されていません。');
    }

    this.openaiApiKey = openaiApiKey;
    this.googleSearchClient = new GoogleSearchClient(googleApiKey, searchEngineId);
  }

  /**
   * 事故物件調査を実行（Google Custom Search API + OpenAI GPT-4）
   * @param address 調査対象物件の住所
   * @param propertyName 物件名（任意）
   */
  async checkProperty(address: string, propertyName?: string): Promise<StigmaCheckResult> {
    const checkedAt = new Date().toISOString();

    console.log('[Stigma Checker] Starting property check:', {
      address,
      propertyName,
      openaiKeyPrefix: this.openaiApiKey.substring(0, 10) + '...'
    });

    try {
      // Step 1: Google Custom Search APIで実際にウェブ検索
      console.log('[Stigma Checker] Step 1: Performing Google search...');
      
      const baseQuery = `${address}${propertyName ? ' ' + propertyName : ''}`;
      const searchQueries = [
        `${baseQuery} 事故 事件 大島てる`,
        `${baseQuery} 火災 死亡`,
        `${baseQuery} 自殺 殺人`
      ];

      const searchResults = await this.googleSearchClient!.searchMultiple(searchQueries);

      console.log('[Stigma Checker] Google search results:', {
        count: searchResults.length,
        queries: searchQueries
      });

      // 検索結果がない場合
      if (searchResults.length === 0) {
        const sourcesToCheck: SourceChecked[] = this.getDefaultSources();
        sourcesToCheck.forEach(s => s.checked = true);

        return {
          hasStigma: false,
          riskLevel: 'none',
          findings: [],
          sourcesChecked: sourcesToCheck,
          summary: `Google検索を実行しましたが、「${address}」に関する事故物件情報は見つかりませんでした。`,
          checkedAt,
          searchResults: []
        };
      }

      // Step 2: 検索結果をGPT-4で分析
      console.log('[Stigma Checker] Step 2: Analyzing results with GPT-4...');

      const searchResultsText = searchResults.map((r, i) => `
【検索結果 ${i + 1}】
タイトル: ${r.title}
URL: ${r.url}
概要: ${r.snippet}
`).join('\n---\n');

      const prompt = `
あなたは不動産の心理的瑕疵調査の専門家です。
以下のGoogle検索結果から、「${address}」${propertyName ? `（${propertyName}）` : ''}に関する事故物件情報を分析してください。

【Google検索結果】
${searchResultsText}

【調査項目】
1. 過去の死亡事故（自殺、他殺、孤独死等）
2. 重大な犯罪事件（殺人、強盗等）
3. 火災事故
4. その他の心理的瑕疵に該当する事象

【重要な注意点】
- 検索結果に記載されている情報のみを分析してください
- 住所が完全一致または近似している場合のみ該当とみなしてください
- 別の場所の事故を誤って関連付けないでください
- 不確実な情報は含めないでください

以下のJSON形式で分析結果を返してください:
{
  "hasStigma": boolean,
  "riskLevel": "none" | "low" | "medium" | "high",
  "findings": [
    {
      "source": "ソース名（検索結果のサイト名）",
      "sourceUrl": "URL",
      "title": "見出し",
      "content": "内容の要約（200文字以内）",
      "date": "発生日（YYYY-MM-DD形式、不明な場合は\"不明\"）",
      "category": "death" | "crime" | "fire" | "disaster" | "other",
      "relevance": 関連性スコア（0-100）
    }
  ],
  "summary": "調査結果の総括（検索結果の総合評価）"
}`;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: '不動産の心理的瑕疵調査の専門家として、検索結果を正確に分析してください。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 2500,
          response_format: { type: 'json_object' }
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      console.log('[Stigma Checker] GPT-4 analysis result:', content.substring(0, 200) + '...');

      const analysis = JSON.parse(content);

      // ソースチェック状況を更新
      const sourcesToCheck = this.getDefaultSources();
      sourcesToCheck.forEach(source => {
        source.checked = true;
        source.foundIssues = searchResults.filter(r => 
          r.url.includes(source.url.replace('https://', '').replace('www.', ''))
        ).length;
      });

      return {
        hasStigma: analysis.hasStigma || false,
        riskLevel: analysis.riskLevel || 'none',
        findings: analysis.findings || [],
        sourcesChecked: sourcesToCheck,
        summary: analysis.summary || 'Google検索の結果、心理的瑕疵に該当する情報は確認されませんでした。',
        checkedAt,
        searchResults
      };

    } catch (error) {
      console.error('[Stigma Checker] Error during check:', error);
      throw new Error(`事故物件調査に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * デフォルトのチェック対象ソースリストを取得
   */
  private getDefaultSources(): SourceChecked[] {
    return [
      { name: 'Google News', url: 'https://news.google.com', checked: false, foundIssues: 0 },
      { name: 'Yahoo!ニュース', url: 'https://news.yahoo.co.jp', checked: false, foundIssues: 0 },
      { name: '大島てる', url: 'https://www.oshimaland.co.jp', checked: false, foundIssues: 0 },
      { name: '警察庁', url: 'https://www.npa.go.jp', checked: false, foundIssues: 0 },
      { name: '消防庁', url: 'https://www.fdma.go.jp', checked: false, foundIssues: 0 },
    ];
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
   * リスクレベルに応じた推奨アクションを取得
   */
  static getRecommendedActions(riskLevel: string): {
    title: string;
    steps: Array<{
      step: string;
      action: string;
      cost?: string;
      note?: string;
    }>;
  } {
    const actions: Record<string, any> = {
      none: {
        title: '現時点で心理的瑕疵の公知情報は確認されていません。',
        steps: [
          {
            step: '最終確認',
            action: '最終契約前に管理会社への念のための確認を推奨します。',
            note: '口頭確認で十分です。'
          }
        ]
      },
      low: {
        title: '低リスクですが、慎重な確認を推奨します。',
        steps: [
          {
            step: 'Step 1: 管理会社照会',
            action: '過去5年の自殺・事故・火災・特殊清掃の有無について文書照会',
            cost: '17,000〜20,000円/戸',
            note: '管理会社の公式フォームから申請'
          },
          {
            step: 'Step 2: 現地確認',
            action: '管理員または隣接住戸へのヒアリング',
            note: '警察出動、救急搬送、長期封鎖などの事実確認'
          }
        ]
      },
      medium: {
        title: '中リスク。管理会社照会と現地調査を強く推奨します。',
        steps: [
          {
            step: 'Step 1: 管理会社照会（必須）',
            action: '過去5年の自殺・事故・火災・特殊清掃の有無について文書照会',
            cost: '17,000〜20,000円/戸',
            note: '東急コミュニティー、ホームズ建物管理等の公式フォームから申請'
          },
          {
            step: 'Step 2: 現地ヒアリング（必須）',
            action: '管理員・隣接住戸・清掃業者への詳細ヒアリング',
            note: '発言者・日時を記録。警察出動・救急搬送・長期封鎖の確認'
          },
          {
            step: 'Step 3: 公的照会（推奨）',
            action: '所轄警察署・消防署への出動記録確認',
            note: '口頭照会。個人情報制限あり'
          }
        ]
      },
      high: {
        title: '高リスク。管理会社照会および公的照会を必須とします。',
        steps: [
          {
            step: 'Step 1: 管理会社照会（必須）',
            action: '過去5年の自殺・事故・火災・特殊清掃の有無について文書照会',
            cost: '17,000〜20,000円/戸',
            note: '東急コミュニティー、ホームズ建物管理等の公式フォームから申請'
          },
          {
            step: 'Step 2: 現地ヒアリング（必須）',
            action: '管理員・隣接住戸・清掃業者への詳細ヒアリング',
            note: '発言者・日時を記録。警察出動・救急搬送・長期封鎖の確認'
          },
          {
            step: 'Step 3: 公的照会（必須）',
            action: '所轄警察署・消防署への出動・通報記録確認',
            note: '出動記録の有無を確認（口頭照会）。個人情報制限あり'
          },
          {
            step: 'Step 4: 報告・告知判断',
            action: '調査結果を要約し、宅建業法第47条に基づく告知判断を記録',
            note: '社内・買主向け資料を作成。国交省ガイドライン（2021）に準拠'
          }
        ]
      }
    };

    return actions[riskLevel] || actions.none;
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
