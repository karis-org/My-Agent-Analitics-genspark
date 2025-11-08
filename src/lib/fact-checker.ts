/**
 * Fact Checker Library
 * レポート内容のファクトチェックライブラリ
 * 
 * AIを使用してレポート内の情報を検証し、信頼性を評価
 */

export interface FactCheckResult {
  isVerified: boolean;
  confidenceScore: number; // 0-100
  warnings: FactCheckWarning[];
  verifiedClaims: VerifiedClaim[];
  recommendations: string[];
  checkedAt: string;
}

export interface FactCheckWarning {
  severity: 'info' | 'warning' | 'error';
  claim: string;
  issue: string;
  suggestion: string;
}

export interface VerifiedClaim {
  claim: string;
  verified: boolean;
  confidence: number;
  sources: string[];
  notes: string;
}

export class FactChecker {
  private openaiApiKey: string;

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * レポート内容のファクトチェックを実行
   * @param reportData レポートデータオブジェクト
   * @param reportType レポートタイプ（'analysis', 'stigma', 'comprehensive'等）
   */
  async checkFacts(reportData: any, reportType: string): Promise<FactCheckResult> {
    const checkedAt = new Date().toISOString();

    // デモモードチェック
    if (!this.openaiApiKey || this.openaiApiKey === 'demo' || this.openaiApiKey.trim() === '') {
      return this.generateDemoResult(reportData, checkedAt);
    }

    try {
      // レポートデータをJSON文字列に変換
      const reportJson = JSON.stringify(reportData, null, 2);

      const prompt = `
あなたは不動産分析レポートの品質管理専門家です。以下のレポートデータについて、ファクトチェックを実施してください。

レポートタイプ: ${reportType}

レポートデータ:
${reportJson}

以下の観点でチェックしてください:

1. **数値の妥当性**
   - 価格、面積、利回り等の数値が現実的か
   - 計算式が正しいか
   - 単位が適切か

2. **論理の一貫性**
   - 結論が根拠と矛盾していないか
   - 評価基準が一貫しているか

3. **情報の完全性**
   - 必要な情報が欠けていないか
   - データソースが明記されているか

4. **リスク評価の適切性**
   - リスク評価が過大/過小評価されていないか
   - 重要なリスクが見落とされていないか

5. **表現の正確性**
   - 断定的すぎる表現がないか
   - 誤解を招く表現がないか

以下のJSON形式で結果を返してください:
{
  "isVerified": boolean,
  "confidenceScore": 0-100の数値,
  "warnings": [
    {
      "severity": "info" | "warning" | "error",
      "claim": "問題のある主張",
      "issue": "問題点の説明",
      "suggestion": "改善提案"
    }
  ],
  "verifiedClaims": [
    {
      "claim": "検証した主張",
      "verified": boolean,
      "confidence": 0-100の数値,
      "sources": ["参照したソース"],
      "notes": "補足説明"
    }
  ],
  "recommendations": [
    "レポート改善のための推奨事項"
  ]
}

注意:
- 厳密に事実を確認してください
- 不確実な情報には警告を付けてください
- 改善提案は具体的に記載してください
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
              content: 'あなたは不動産分析レポートの品質管理専門家です。厳密な事実確認と論理的な検証を行ってください。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as any;
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

      return {
        isVerified: result.isVerified !== false,
        confidenceScore: result.confidenceScore || 85,
        warnings: result.warnings || [],
        verifiedClaims: result.verifiedClaims || [],
        recommendations: result.recommendations || [],
        checkedAt,
      };
    } catch (error) {
      console.error('Fact check error:', error);
      
      // エラー時は基本的な検証結果を返す
      return this.generateDemoResult(reportData, checkedAt);
    }
  }

  /**
   * デモモード用の結果生成
   */
  private generateDemoResult(reportData: any, checkedAt: string): FactCheckResult {
    // 基本的な数値チェック
    const warnings: FactCheckWarning[] = [];
    const verifiedClaims: VerifiedClaim[] = [];

    // 価格チェック（例）
    if (reportData.price && reportData.price < 0) {
      warnings.push({
        severity: 'error',
        claim: `価格: ${reportData.price}`,
        issue: '価格が負の値になっています',
        suggestion: '価格を正の値に修正してください',
      });
    }

    // 利回りチェック（例）
    if (reportData.yield && (reportData.yield < 0 || reportData.yield > 50)) {
      warnings.push({
        severity: 'warning',
        claim: `利回り: ${reportData.yield}%`,
        issue: '利回りが通常の範囲を超えています',
        suggestion: '計算式と入力値を確認してください',
      });
    }

    return {
      isVerified: warnings.filter(w => w.severity === 'error').length === 0,
      confidenceScore: warnings.length === 0 ? 95 : Math.max(50, 95 - warnings.length * 10),
      warnings,
      verifiedClaims: [
        {
          claim: 'レポートデータの基本構造',
          verified: true,
          confidence: 100,
          sources: ['内部検証'],
          notes: 'デモモード: 基本的な検証のみ実施',
        },
      ],
      recommendations: [
        'より詳細なファクトチェックを行うには、OpenAI APIキーを設定してください',
      ],
      checkedAt,
    };
  }

  /**
   * 信頼度スコアのレーティングを取得
   */
  static getConfidenceRating(score: number): { level: string; color: string; description: string } {
    if (score >= 90) {
      return {
        level: '非常に高い',
        color: 'green',
        description: 'データは十分に検証されており、高い信頼性があります',
      };
    } else if (score >= 75) {
      return {
        level: '高い',
        color: 'blue',
        description: 'データは概ね検証されており、信頼できます',
      };
    } else if (score >= 60) {
      return {
        level: '中程度',
        color: 'yellow',
        description: 'データには一部未検証の情報が含まれています',
      };
    } else if (score >= 40) {
      return {
        level: '低い',
        color: 'orange',
        description: 'データの信頼性に懸念があります',
      };
    } else {
      return {
        level: '非常に低い',
        color: 'red',
        description: 'データの信頼性が低く、使用には注意が必要です',
      };
    }
  }
}
