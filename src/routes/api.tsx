// API routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter, validateInput } from '../middleware/security';
import { analyzeProperty } from '../lib/calculator';
import { ReinfolibClient } from '../lib/reinfolib';
import { EStatClient, analyzeDemographics } from '../lib/estat';
import { AIMarketAnalyzer } from '../lib/ai-analyzer';
import { InvestmentSimulator } from '../lib/simulator';
import {
  exportPropertiesToCSV,
  exportAnalysisToCSV,
  exportSimulationToCSV,
  exportMarketAnalysisToCSV,
  createCSVDownloadResponse,
} from '../lib/exporter';
import {
  estimatePriceByComparison,
  evaluateByCostApproach,
  analyzeLandPriceTrend,
  calculateAssetScore,
  type ComparableProperty,
  type PropertyForEvaluation,
  type BuildingSpecification,
  type LandPriceData,
  type AssetEvaluationFactors,
} from '../lib/residential-evaluator';
import { 
  parseOCRNumber, 
  parseOCRDate, 
  parseStructureType,
  safeParseOCRNumber 
} from '../lib/ocr-parser';
import {
  exportPropertiesToExcel,
  exportSimulationToExcel,
  createExcelDownloadResponse,
} from '../lib/excel-exporter';
import {
  createSharedReport,
  getSharedReport,
  verifySharedReportAccess,
  logSharedReportAccess,
  updateSharedReport,
  deleteSharedReport,
  getUserSharedReports,
  getSharedReportAccessLogs,
} from '../lib/sharing';
import {
  createTemplate,
  getTemplate,
  getUserTemplates,
  getTemplatesByCategory,
  updateTemplate,
  deleteTemplate,
  createSection,
  updateSection,
  deleteSection,
  getTemplateSections,
  duplicateTemplate,
  getPublicTemplates,
  setDefaultTemplate,
  getDefaultTemplate,
} from '../lib/templates';

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply rate limiting to all API routes
api.use('/*', rateLimiter('api'));

// Apply auth middleware to all agents and executions endpoints
api.use('/agents*', authMiddleware);
api.use('/agents', authMiddleware);
api.use('/executions*', authMiddleware);
api.use('/executions', authMiddleware);

// Apply stricter rate limiting to AI endpoints
api.use('/ai/*', rateLimiter('ai'));

/**
 * マイソクOCR endpoint
 * 物件概要書の画像から情報を抽出
 */
api.post('/properties/ocr', async (c) => {
  try {
    const { image, filename } = await c.req.json();
    
    if (!image) {
      return c.json({ error: 'Image or PDF file is required' }, 400);
    }
    
    // ファイル形式を判定（data:image/ または data:application/pdf で始まる）
    const isPDF = image.startsWith('data:application/pdf');
    const isImage = image.startsWith('data:image/');
    
    // PDFファイルはフロントエンドで画像に変換されるはずだが、念のためチェック
    if (isPDF) {
      return c.json({ 
        error: 'PDFファイルは直接処理できません',
        errorCode: 'PDF_NOT_CONVERTED',
        suggestions: [
          'PDFは自動的に画像に変換されます。もう一度お試しください。',
          'PDFを画像形式（JPG、PNG）に変換してください',
          'スクリーンショットを撮影してアップロードしてください'
        ],
        available: false,
        canRetry: true
      }, 400);
    }
    
    if (!isImage) {
      return c.json({ 
        error: '対応していないファイル形式です',
        errorCode: 'UNSUPPORTED_FORMAT',
        suggestions: ['JPG、PNG形式の画像ファイルをアップロードしてください'],
        available: false,
        canRetry: false
      }, 400);
    }
    
    const { env } = c;
    
    // OpenAI API Keyの検証
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
      return c.json({
        success: false,
        error: 'OpenAI APIキーが設定されていません。管理者に連絡してください。'
      }, 500);
    }
    
    // OpenAI Vision APIを使用して画像から情報を抽出
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `あなたは不動産物件情報の抽出エキスパートです。以下の物件概要書（マイソク）の画像から正確に情報を抽出し、JSON形式で返してください。

【抽出する情報】

1. **name** (物件名・建物名)
   - 例: "○○マンション"、"○○ハイツ"、"○○ビル"
   - マンション名、アパート名、建物名を優先
   - 見つからない場合は所在地の町名を使用（例: "目黒区鷹番2丁目8番21号"）

2. **price** (販売価格・売買価格)
   - **数値のみ**を抽出（単位を含めない）
   - **千円単位**: "900,000千円" → 900000000 (千円を1,000倍)
   - 「万円」表記: "4,500万円" → 45000000 (万円を10,000倍)
   - 「億円」表記: "3億2000万円" → 320000000
   - カンマは無視: "¥9,000,000" → 9000000
   - 例: "900,000千円" → 900000000
   - 例: "4,500万円" → 45000000
   - 例: "5000万" → 50000000

3. **location** (所在地・住所)
   - 完全な住所を抽出（住居表示または地番）
   - 例: "東京都渋谷区恵比寿1-1-1"
   - 例: "目黒区鷹番二丁目90番1"
   - 都道府県から番地まで可能な限り詳細に

4. **structure** (建物構造)
   - 以下のいずれかに正規化: "RC造", "SRC造", "鉄骨造", "木造"
   - "鉄筋コンクリート造" または "RC造" → "RC造"
   - "鉄骨鉄筋コンクリート造" または "SRC造" → "SRC造"
   - "S造" または "鉄骨造" または "軽量鉄骨造" または "重量鉄骨造" → "鉄骨造"
   - "木造" または "W造" → "木造"

5. **total_floor_area** (延床面積・専有面積・建床面積)
   - **数値のみ**を抽出（単位を含めない）
   - ㎡(平米)単位の数値
   - 例: "65.5㎡" → 65.5
   - 例: "480.33㎡" → 480.33
   - 例: "70.25m²(21.24坪)" → 70.25

6. **age** (築年数)
   - **数値のみ**を抽出（単位を含めない）
   - 築年数が記載されている場合はそのまま
   - 築年月・竣工時期のみの場合は現在(2025年)からの年数を計算
   - **和暦の変換**: 平成→西暦に変換してから計算
     - 平成元年(1989年)～平成31年(2019年): 平成XX年 → 1988+XX年
     - 令和元年(2019年)～: 令和XX年 → 2018+XX年
   - **未完成物件**: "2026年7月竣工" → -1 (新築予定)
   - 例: "築5年" → 5
   - 例: "2020年3月築" → 5
   - 例: "平成26年5月築" → 11 (2014年築 = 2025-2014)
   - 例: "2026年7月竣工" → -1

7. **distance_from_station** (最寄駅からの徒歩分数)
   - **数値のみ**を抽出（単位を含めない）
   - 徒歩○分、駅まで○分
   - 例: "徒歩8分" → 8
   - 例: "徒歩3分" → 3
   - 例: "駅5分" → 5

8. **monthly_rent** (想定賃料・月額賃料・サブリース賃料)
   - **数値のみ**を抽出（単位を含めない）
   - 様々な表記パターンに対応:
     a) 直接の月額表記: "想定賃料 ¥317,280/月" → 317280
     b) 万円表記: "賃料10万円" → 100000
     c) **年間賃料から計算**: "年間31,728千円" → 2644000 (31728000 ÷ 12)
     d) **年間賃料(千円単位)**: "年間:31,728千円" → 2644000
     e) M社賃料査定、満室想定、サブリース賃料なども含む
   - 千円単位の場合は1,000倍してから月額に変換
   - 例: "想定賃料 ¥317,280/月" → 317280
   - 例: "月額:2,644千円" → 2644000
   - 例: "年間賃料:31,728千円" → 2644000 (31,728,000 ÷ 12)
   - 例: "サブリース賃料 8.5万円/月" → 85000
   - 収益物件でない場合や記載がない場合はnull

【重要な注意事項】
- すべての数値フィールド(price, total_floor_area, age, distance_from_station, monthly_rent)は**必ず数値型**で返す
- 文字列の数値（例: "45000000"）ではなく、数値（例: 45000000）で返す
- **千円単位の変換を忘れない**: 千円 = ×1,000、万円 = ×10,000、億円 = ×100,000,000
- **年間賃料は月額に変換**: 年間賃料 ÷ 12 = 月額賃料
- 情報が読み取れない場合のみnullを返す
- レスポンスは**必ず有効なJSON形式のみ**で、コードブロック記号や説明文は一切含めない

【出力例】
{
  "name": "目黒区鷹番2丁目8番21号",
  "price": 900000000,
  "location": "目黒区鷹番二丁目90番1・89番4他",
  "structure": "RC造",
  "total_floor_area": 480.33,
  "age": -1,
  "distance_from_station": 3,
  "monthly_rent": 2644000
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: image
              }
            }
          ]
        }],
        max_tokens: 1000,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      
      // 詳細なエラーメッセージを作成
      let userFriendlyError = '画像の解析中にエラーが発生しました';
      let errorCode = 'OCR_PROCESSING_ERROR';
      let suggestions: string[] = [];
      
      if (response.status === 401) {
        userFriendlyError = 'OpenAI APIキーが無効です';
        errorCode = 'INVALID_API_KEY';
        suggestions = ['管理者に連絡して、有効なAPIキーが設定されているか確認してください'];
      } else if (response.status === 429) {
        userFriendlyError = 'APIの利用制限に達しました';
        errorCode = 'RATE_LIMIT_EXCEEDED';
        suggestions = ['しばらく時間をおいてから再度お試しください', '管理者に連絡してAPI利用プランをアップグレードしてください'];
      } else if (response.status === 400) {
        userFriendlyError = '画像またはPDF形式が正しくありません';
        errorCode = 'INVALID_FILE_FORMAT';
        suggestions = ['ファイルがBase64形式でエンコードされているか確認してください', 'サポートされている形式（JPEG、PNG、PDF）を使用してください'];
      } else if (response.status >= 500) {
        userFriendlyError = 'OpenAI APIサーバーでエラーが発生しました';
        errorCode = 'API_SERVER_ERROR';
        suggestions = ['しばらく時間をおいてから再度お試しください', 'エラーが続く場合は管理者に連絡してください'];
      }
      
      return c.json({
        error: userFriendlyError,
        errorCode,
        available: false,
        details: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
        suggestions,
        canRetry: response.status === 429 || response.status >= 500
      }, response.status);
    }
    
    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      return c.json({
        error: 'OpenAI APIからレスポンスが返されませんでした',
        errorCode: 'EMPTY_RESPONSE',
        available: false,
        suggestions: ['画像を変更して再度お試しください', '画像が明確で読み取り可能か確認してください'],
        canRetry: true
      }, 500);
    }
    
    // JSONをパース（コードブロックがある場合は除去）
    let extractedData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/```\n([\s\S]*?)\n```/) ||
                       content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content:', content);
      
      return c.json({
        error: 'AI応答の解析に失敗しました',
        errorCode: 'JSON_PARSE_ERROR',
        available: false,
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        suggestions: [
          '画像の品質を確認してください（ぼやけていない、文字が明確）',
          '別の角度やズームレベルで撮影した画像を試してください',
          'マイソク（物件概要書）の画像であることを確認してください'
        ],
        canRetry: true,
        rawContent: content.substring(0, 500) // デバッグ用に最初の500文字を含める
      }, 500);
    }
    
    // 抽出されたデータの検証
    const hasValidData = extractedData && (
      extractedData.name || 
      extractedData.price || 
      extractedData.location
    );
    
    if (!hasValidData) {
      return c.json({
        error: '画像から物件情報を抽出できませんでした',
        errorCode: 'NO_DATA_EXTRACTED',
        available: false,
        suggestions: [
          '画像が物件概要書（マイソク）であることを確認してください',
          '画像の品質を向上させてください（高解像度、明るい場所で撮影）',
          '文字がはっきりと読める画像を使用してください'
        ],
        canRetry: true,
        extractedData // 空のデータも返してユーザーが確認できるようにする
      }, 422);
    }
    
    // OCRパーサーを適用して数値データを正規化
    const parseErrors: string[] = [];
    const parsedData: any = { ...extractedData };
    
    // price (販売価格) - 必須フィールド
    if (extractedData.price !== null && extractedData.price !== undefined) {
      try {
        parsedData.price = parseOCRNumber(extractedData.price, 'price');
      } catch (error) {
        parseErrors.push(`price: ${error instanceof Error ? error.message : 'パースエラー'}`);
        parsedData.price = null;
      }
    }
    
    // total_floor_area (延床面積) - 必須フィールド
    if (extractedData.total_floor_area !== null && extractedData.total_floor_area !== undefined) {
      try {
        parsedData.total_floor_area = parseOCRNumber(extractedData.total_floor_area, 'total_floor_area');
      } catch (error) {
        parseErrors.push(`total_floor_area: ${error instanceof Error ? error.message : 'パースエラー'}`);
        parsedData.total_floor_area = null;
      }
    }
    
    // age (築年数) - 必須フィールド
    if (extractedData.age !== null && extractedData.age !== undefined) {
      try {
        parsedData.age = parseOCRNumber(extractedData.age, 'age');
      } catch (error) {
        parseErrors.push(`age: ${error instanceof Error ? error.message : 'パースエラー'}`);
        parsedData.age = null;
      }
    }
    
    // distance_from_station (駅距離) - 必須フィールド
    if (extractedData.distance_from_station !== null && extractedData.distance_from_station !== undefined) {
      try {
        parsedData.distance_from_station = parseOCRNumber(extractedData.distance_from_station, 'distanceFromStation');
      } catch (error) {
        parseErrors.push(`distance_from_station: ${error instanceof Error ? error.message : 'パースエラー'}`);
        parsedData.distance_from_station = null;
      }
    }
    
    // monthly_rent (月額賃料) - オプショナルフィールド
    if (extractedData.monthly_rent !== null && extractedData.monthly_rent !== undefined) {
      try {
        parsedData.monthly_rent = parseOCRNumber(extractedData.monthly_rent, 'monthlyRent');
      } catch (error) {
        parseErrors.push(`monthly_rent: ${error instanceof Error ? error.message : 'パースエラー'}`);
        parsedData.monthly_rent = null;
      }
    }
    
    // structure (建物構造) - 正規化
    if (extractedData.structure) {
      parsedData.structure = parseStructureType(extractedData.structure);
    }
    
    // パースエラーがあればログに記録（エラーとしては返さず警告として）
    if (parseErrors.length > 0) {
      console.warn('[OCR Parser] 以下のフィールドでパースエラーが発生しました:', parseErrors);
      parsedData._parseWarnings = parseErrors; // 警告情報を含める
    }
    
    return c.json({
      success: true,
      ...parsedData,
      confidence: 'high' // 将来的に信頼度スコアを追加できる
    });
  } catch (error) {
    console.error('OCR error:', error);
    
    // 予期しないエラーの詳細を返す
    return c.json({
      error: '予期しないエラーが発生しました',
      errorCode: 'UNEXPECTED_ERROR',
      available: false,
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestions: [
        'ページを再読み込みして再度お試しください',
        'ブラウザのコンソールでエラー詳細を確認してください',
        'エラーが続く場合は管理者に連絡してください'
      ],
      canRetry: true
    }, 500);
  }
});

/**
 * Residential Property Evaluation endpoint
 * 実需用不動産の資産性評価
 * POST /api/properties/residential/evaluate
 */
api.post('/properties/residential/evaluate', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      targetProperty,
      comparables,
      buildingSpec,
      landPriceHistory,
      assetFactors,
      evaluationMethods = ['comparison', 'cost', 'trend', 'asset']
    } = body;

    const results: any = {};

    // 取引事例比較法による評価
    if (evaluationMethods.includes('comparison') && comparables && comparables.length > 0) {
      try {
        results.comparisonAnalysis = estimatePriceByComparison(
          targetProperty as PropertyForEvaluation,
          comparables as ComparableProperty[]
        );
      } catch (error) {
        console.error('Comparison analysis error:', error);
        results.comparisonAnalysis = { error: 'Failed to perform comparison analysis' };
      }
    }

    // 原価法による評価
    if (evaluationMethods.includes('cost') && buildingSpec) {
      try {
        results.costApproach = evaluateByCostApproach(buildingSpec as BuildingSpecification);
      } catch (error) {
        console.error('Cost approach error:', error);
        results.costApproach = { error: 'Failed to perform cost approach' };
      }
    }

    // 地価推移分析
    if (evaluationMethods.includes('trend') && landPriceHistory && landPriceHistory.length > 0) {
      try {
        results.landPriceTrend = analyzeLandPriceTrend(landPriceHistory as LandPriceData[]);
      } catch (error) {
        console.error('Land price trend analysis error:', error);
        results.landPriceTrend = { error: 'Failed to analyze land price trend' };
      }
    }

    // 総合資産性スコア
    if (evaluationMethods.includes('asset') && assetFactors) {
      try {
        results.assetScore = calculateAssetScore(assetFactors as AssetEvaluationFactors);
      } catch (error) {
        console.error('Asset score calculation error:', error);
        results.assetScore = { error: 'Failed to calculate asset score' };
      }
    }

    // 総合評価レポート
    const summary = {
      evaluatedAt: new Date().toISOString(),
      propertyName: targetProperty?.name || '評価対象物件',
      evaluationMethods: evaluationMethods,
      hasComparison: !!results.comparisonAnalysis,
      hasCostApproach: !!results.costApproach,
      hasTrendAnalysis: !!results.landPriceTrend,
      hasAssetScore: !!results.assetScore,
    };

    return c.json({
      success: true,
      summary,
      results,
    });
  } catch (error) {
    console.error('Residential property evaluation error:', error);
    return c.json({
      error: '実需用不動産の評価に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Health check
 */
api.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

/**
 * Property financial analysis endpoint
 */
api.post('/properties/analyze', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    const body = await c.req.json();
    
    const {
      propertyId,
      propertyPrice,
      grossIncome,
      effectiveIncome,
      operatingExpenses,
      loanAmount,
      interestRate,
      loanTermYears,
      downPayment,
    } = body;
    
    // Validation
    if (!propertyPrice || !grossIncome || !effectiveIncome || !operatingExpenses) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Perform analysis
    const analysis = analyzeProperty({
      propertyPrice: parseFloat(propertyPrice),
      grossIncome: parseFloat(grossIncome),
      effectiveIncome: parseFloat(effectiveIncome),
      operatingExpenses: parseFloat(operatingExpenses),
      loanAmount: parseFloat(loanAmount || 0),
      interestRate: parseFloat(interestRate || 0),
      loanTermYears: parseInt(loanTermYears || 0),
      downPayment: parseFloat(downPayment || 0),
    });
    
    // Add input parameters to analysis result for display
    const enhancedAnalysis = {
      ...analysis,
      grossIncome: parseFloat(grossIncome),
      effectiveIncome: parseFloat(effectiveIncome),
      operatingExpenses: parseFloat(operatingExpenses),
      loanAmount: parseFloat(loanAmount || 0),
      propertyPrice: parseFloat(propertyPrice),
      interestRate: parseFloat(interestRate || 0),
      loanTermYears: parseInt(loanTermYears || 0),
      downPayment: parseFloat(downPayment || 0),
      // Calculate monthly loan payment
      monthlyPayment: analysis.annualDebtService / 12,
    };
    
    // Save analysis result if propertyId is provided
    if (propertyId && user) {
      const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const now = new Date().toISOString();
      
      await env.DB.prepare(`
        INSERT INTO analysis_results (
          id, property_id, noi, gross_yield, net_yield, 
          dscr, ltv, monthly_cash_flow, analysis_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        analysisId,
        propertyId,
        analysis.noi || null,
        analysis.grossYield || null,
        analysis.netYield || null,
        analysis.dscr || null,
        analysis.ltv || null,
        analysis.monthlyCashFlow ? JSON.stringify(analysis.monthlyCashFlow) : null,
        JSON.stringify(enhancedAnalysis),
        now
      ).run();
      
      enhancedAnalysis.id = analysisId;
    }
    
    return c.json({
      success: true,
      analysis: enhancedAnalysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({ error: 'Analysis failed' }, 500);
  }
});

/**
 * Market analysis endpoint
 * 指定地域の市場動向分析
 */
api.post('/market/analyze', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { year, area, city } = body;
    
    if (!year) {
      return c.json({ error: 'Year is required' }, 400);
    }
    
    if (!area && !city) {
      return c.json({ error: 'Either area or city is required' }, 400);
    }
    
    // REINFOLIB API Keyの検証
    if (!env.REINFOLIB_API_KEY || env.REINFOLIB_API_KEY.trim() === '') {
      return c.json({
        success: false,
        error: 'REINFOLIB APIキーが設定されていません。管理者に連絡してください。'
      }, 500);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const analysis = await client.analyzeMarket({
      year: parseInt(year),
      area,
      city,
    });
    
    return c.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    return c.json({ 
      error: 'Market analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Trade prices endpoint
 * 不動産取引価格情報を取得
 */
api.get('/market/trade-prices', async (c) => {
  try {
    const { env } = c;
    const year = c.req.query('year');
    const quarter = c.req.query('quarter');
    const area = c.req.query('area');
    const city = c.req.query('city');
    
    if (!year) {
      return c.json({ error: 'Year is required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const result = await client.getTradePrices({
      year: parseInt(year),
      quarter: quarter ? parseInt(quarter) : undefined,
      area,
      city,
    });
    
    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Trade prices error:', error);
    return c.json({ 
      error: 'Failed to fetch trade prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Land prices endpoint
 * 地価公示情報を取得
 */
api.get('/market/land-prices', async (c) => {
  try {
    const { env } = c;
    const year = c.req.query('year');
    const area = c.req.query('area');
    const division = c.req.query('division') || '00'; // デフォルト: 住宅地
    
    if (!year || !area) {
      return c.json({ error: 'Year and area are required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const result = await client.getLandPrices({
      year: parseInt(year),
      area,
      division,
    });
    
    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Land prices error:', error);
    return c.json({ 
      error: 'Failed to fetch land prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Municipalities endpoint
 * 都道府県内市区町村一覧を取得
 */
api.get('/market/municipalities', async (c) => {
  try {
    const { env } = c;
    const area = c.req.query('area');
    
    if (!area) {
      return c.json({ error: 'Area (prefecture code) is required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const result = await client.getMunicipalities(area);
    
    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Municipalities error:', error);
    return c.json({ 
      error: 'Failed to fetch municipalities',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Nearby comparables endpoint
 * 周辺取引事例を取得
 */
api.post('/market/comparables', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { city, propertyType, minArea, maxArea, limit } = body;
    
    if (!city) {
      return c.json({ error: 'City is required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const comparables = await client.getNearbyComparables({
      city,
      propertyType,
      minArea: minArea ? parseFloat(minArea) : undefined,
      maxArea: maxArea ? parseFloat(maxArea) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    
    return c.json({
      success: true,
      data: comparables,
      count: comparables.length,
    });
  } catch (error) {
    console.error('Comparables error:', error);
    return c.json({ 
      error: 'Failed to fetch comparables',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Price estimation endpoint
 * 物件価格を推定
 */
api.post('/market/estimate-price', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { city, area, propertyType, buildingYear } = body;
    
    if (!city || !area || !propertyType) {
      return c.json({ error: 'City, area, and propertyType are required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const estimation = await client.estimatePrice({
      city,
      area: parseFloat(area),
      propertyType,
      buildingYear,
    });
    
    return c.json({
      success: true,
      estimation,
    });
  } catch (error) {
    console.error('Price estimation error:', error);
    return c.json({ 
      error: 'Failed to estimate price',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Properties list endpoint
 * GET /api/properties
 */
api.get('/properties', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const result = await env.DB.prepare(`
      SELECT * FROM properties 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      properties: result.results || [],
    });
  } catch (error) {
    console.error('Properties list error:', error);
    return c.json({ error: 'Failed to fetch properties' }, 500);
  }
});

/**
 * Create new property
 * POST /api/properties
 */
api.post('/properties', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { 
      name, 
      price, 
      location, 
      structure, 
      total_floor_area, 
      age, 
      distance_from_station,
      has_elevator,
      // Migration 0008 fields
      property_type,
      land_area,
      registration_date,
      // Migration 0009 fields
      monthly_rent,
      annual_income,
      annual_expense,
      gross_yield,
      net_yield
    } = body;
    
    if (!name || !price) {
      return c.json({ error: 'Name and price are required' }, 400);
    }
    
    const propertyId = `prop-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    
    await env.DB.prepare(`
      INSERT INTO properties (
        id, user_id, name, price, location, structure, 
        total_floor_area, age, distance_from_station, has_elevator,
        property_type, land_area, registration_date,
        monthly_rent, annual_income, annual_expense, gross_yield, net_yield,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      propertyId,
      user.id,
      name,
      parseFloat(price),
      location || null,
      structure || null,
      total_floor_area ? parseFloat(total_floor_area) : null,
      age ? parseInt(age) : null,
      distance_from_station ? parseFloat(distance_from_station) : null,
      has_elevator ? 1 : 0,
      property_type || 'residential',
      land_area ? parseFloat(land_area) : null,
      registration_date || null,
      monthly_rent ? parseFloat(monthly_rent) : 0,
      annual_income ? parseFloat(annual_income) : 0,
      annual_expense ? parseFloat(annual_expense) : 0,
      gross_yield ? parseFloat(gross_yield) : 0,
      net_yield ? parseFloat(net_yield) : 0,
      now,
      now
    ).run();
    
    const property = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ?
    `).bind(propertyId).first();
    
    return c.json({
      success: true,
      property,
    }, 201);
  } catch (error) {
    console.error('Property creation error:', error);
    return c.json({ error: 'Failed to create property' }, 500);
  }
});

/**
 * Update property
 * PUT /api/properties/:id
 */
api.put('/properties/:id', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    const propertyId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check ownership
    const existing = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ? AND user_id = ?
    `).bind(propertyId, user.id).first();
    
    if (!existing) {
      return c.json({ error: 'Property not found' }, 404);
    }
    
    const body = await c.req.json();
    const { 
      name, 
      price, 
      location, 
      structure, 
      total_floor_area, 
      age, 
      distance_from_station,
      has_elevator,
      // Migration 0008 fields
      property_type,
      land_area,
      registration_date,
      // Migration 0009 fields
      monthly_rent,
      annual_income,
      annual_expense,
      gross_yield,
      net_yield
    } = body;
    
    await env.DB.prepare(`
      UPDATE properties 
      SET name = ?, price = ?, location = ?, structure = ?, 
          total_floor_area = ?, age = ?, distance_from_station = ?, 
          has_elevator = ?, 
          property_type = ?, land_area = ?, registration_date = ?,
          monthly_rent = ?, annual_income = ?, annual_expense = ?, 
          gross_yield = ?, net_yield = ?,
          updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      name || existing.name,
      price !== undefined ? parseFloat(price) : existing.price,
      location !== undefined ? location : existing.location,
      structure !== undefined ? structure : existing.structure,
      total_floor_area !== undefined ? (total_floor_area ? parseFloat(total_floor_area) : null) : existing.total_floor_area,
      age !== undefined ? (age ? parseInt(age) : null) : existing.age,
      distance_from_station !== undefined ? (distance_from_station ? parseFloat(distance_from_station) : null) : existing.distance_from_station,
      has_elevator !== undefined ? (has_elevator ? 1 : 0) : existing.has_elevator,
      property_type !== undefined ? property_type : (existing.property_type || 'residential'),
      land_area !== undefined ? (land_area ? parseFloat(land_area) : null) : existing.land_area,
      registration_date !== undefined ? registration_date : existing.registration_date,
      monthly_rent !== undefined ? (monthly_rent ? parseFloat(monthly_rent) : 0) : (existing.monthly_rent || 0),
      annual_income !== undefined ? (annual_income ? parseFloat(annual_income) : 0) : (existing.annual_income || 0),
      annual_expense !== undefined ? (annual_expense ? parseFloat(annual_expense) : 0) : (existing.annual_expense || 0),
      gross_yield !== undefined ? (gross_yield ? parseFloat(gross_yield) : 0) : (existing.gross_yield || 0),
      net_yield !== undefined ? (net_yield ? parseFloat(net_yield) : 0) : (existing.net_yield || 0),
      new Date().toISOString(),
      propertyId,
      user.id
    ).run();
    
    const property = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ?
    `).bind(propertyId).first();
    
    return c.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error('Property update error:', error);
    return c.json({ error: 'Failed to update property' }, 500);
  }
});

/**
 * Delete property
 * DELETE /api/properties/:id
 */
api.delete('/properties/:id', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    const propertyId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check ownership
    const existing = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ? AND user_id = ?
    `).bind(propertyId, user.id).first();
    
    if (!existing) {
      return c.json({ error: 'Property not found' }, 404);
    }
    
    // Delete property (CASCADE will delete related data)
    await env.DB.prepare(`
      DELETE FROM properties WHERE id = ? AND user_id = ?
    `).bind(propertyId, user.id).run();
    
    return c.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Property deletion error:', error);
    return c.json({ error: 'Failed to delete property' }, 500);
  }
});

/**
 * Property detail endpoint
 * GET /api/properties/:id
 */
api.get('/properties/:id', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    const propertyId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get property
    const property = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ? AND user_id = ?
    `).bind(propertyId, user.id).first();
    
    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }
    
    // Get related data
    const [income, expenses, investment, analysis] = await Promise.all([
      env.DB.prepare('SELECT * FROM property_income WHERE property_id = ?').bind(propertyId).first(),
      env.DB.prepare('SELECT * FROM property_expenses WHERE property_id = ?').bind(propertyId).first(),
      env.DB.prepare('SELECT * FROM property_investment WHERE property_id = ?').bind(propertyId).first(),
      env.DB.prepare('SELECT * FROM analysis_results WHERE property_id = ? ORDER BY created_at DESC LIMIT 1').bind(propertyId).first(),
    ]);
    
    return c.json({
      success: true,
      property: {
        ...property,
        income,
        expenses,
        investment,
        analysis,
      },
    });
  } catch (error) {
    console.error('Property detail error:', error);
    return c.json({ error: 'Failed to fetch property' }, 500);
  }
});

/**
 * Property investigation endpoint (accident property check)
 * POST /api/properties/investigate
 */
api.post('/properties/investigate', async (c) => {
  try {
    const body = await c.req.json();
    const { address } = body;
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    // Import investigation utilities
    const { 
      searchAccidentProperty, 
      assessOverallRisk,
      generateInvestigationReport,
      
      
      
    } = await import('../lib/property-investigation');
    
    // Search for accident property info
    const accident = await searchAccidentProperty(address);
    
    // Mock data for urban planning (実際はGIS APIから取得)
    const urbanPlanning = {
      useDistrict: '第一種住居地域',
      buildingCoverageRatio: 60,
      floorAreaRatio: 200,
      firePreventionDistrict: '準防火地域',
      heightRestriction: null,
      scenicDistrictRestriction: null,
      districtPlanRestriction: null,
    };
    
    // Mock data for hazards (実際はハザードマップAPIから取得)
    const hazards = {
      floodRisk: 'low',
      floodDepth: null,
      landslideRisk: 'none',
      liquefactionRisk: 'medium',
      earthquakeRisk: 'low',
      tsunamiRisk: 'none',
    };
    
    // Mock data for roads
    const roads = {
      frontRoadType: '公道',
      frontRoadWidth: 6.0,
      roadSetbackRequired: false,
      setbackDistance: null,
    };
    
    const overallRisk = assessOverallRisk(hazards, accident, urbanPlanning);
    
    const result = {
      address,
      urbanPlanning,
      hazards,
      roads,
      accident,
      investigationDate: new Date().toISOString(),
      investigator: 'My Agent Analytics System',
      notes: ['自動調査システムによる結果です'],
      warnings: accident.hasAccident ? ['心理的瑕疵物件です。詳細は告知内容をご確認ください。'] : [],
      overallRisk,
    };
    
    const report = generateInvestigationReport(result);
    
    return c.json({
      success: true,
      investigation: result,
      report,
    });
  } catch (error) {
    console.error('Investigation error:', error);
    return c.json({ 
      error: 'Investigation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Price impact calculation endpoint
 * POST /api/properties/price-impact
 */
api.post('/properties/price-impact', async (c) => {
  try {
    const body = await c.req.json();
    const { basePrice, address } = body;
    
    if (!basePrice) {
      return c.json({ error: 'Base price is required' }, 400);
    }
    
    // Import investigation utilities
    const investigation = await import('../lib/property-investigation');
    const { 
      searchAccidentProperty, 
      calculatePriceImpact,
    } = investigation;
    
    // Get accident info
    const accident = await searchAccidentProperty(address || '');
    
    // Mock hazards
    const hazards = {
      floodRisk: 'low',
      floodDepth: null,
      landslideRisk: 'none',
      liquefactionRisk: 'medium',
      earthquakeRisk: 'low',
      tsunamiRisk: 'none',
    };
    
    const priceImpact = calculatePriceImpact(
      parseFloat(basePrice),
      accident,
      hazards
    );
    
    return c.json({
      success: true,
      priceImpact,
      accident,
      hazards,
    });
  } catch (error) {
    console.error('Price impact calculation error:', error);
    return c.json({ 
      error: 'Price impact calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Generate PDF report for property
 * GET /api/properties/:id/pdf
 */
api.get('/properties/:id/pdf', async (c) => {
  try {
    const { env, var: { user } } = c;
    const propertyId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get property
    const property = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ? AND user_id = ?
    `).bind(propertyId, user.id).first();
    
    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }
    
    // Import PDF generator
    const { generatePropertyReportHTML } = await import('../lib/pdf-generator');
    
    // Generate PDF HTML
    const html = generatePropertyReportHTML({
      id: property.id as string,
      address: property.address as string,
      price: property.price as number,
      area: property.area as number,
      buildingArea: property.building_area as number | undefined,
      landArea: property.land_area as number | undefined,
      yearBuilt: property.year_built as number | undefined,
      propertyType: property.property_type as '戸建て' | 'マンション' | '土地' | 'アパート',
      createdAt: property.created_at as string,
    });
    
    // Return HTML for browser print API
    return c.html(html);
  } catch (error) {
    console.error('PDF generation error:', error);
    return c.json({ error: 'Failed to generate PDF' }, 500);
  }
});

/**
 * Generate PDF report for investigation
 * POST /api/properties/investigation-pdf
 */
api.post('/properties/investigation-pdf', async (c) => {
  try {
    const body = await c.req.json();
    const { address } = body;
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    // Import utilities
    const { 
      searchAccidentProperty, 
      assessOverallRisk,
    } = await import('../lib/property-investigation');
    
    const { generateInvestigationReportHTML } = await import('../lib/pdf-generator');
    
    // Search for accident property info
    const accident = await searchAccidentProperty(address);
    
    // Mock data
    const urbanPlanning = {
      useDistrict: '第一種住居地域',
      buildingCoverageRatio: 60,
      floorAreaRatio: 200,
      firePreventionDistrict: '準防火地域',
    };
    
    const hazards = {
      floodRisk: 'low',
      landslideRisk: 'none',
      liquefactionRisk: 'medium',
    };
    
    const overallRisk = assessOverallRisk(hazards, accident, urbanPlanning);
    
    // Generate PDF HTML
    const html = generateInvestigationReportHTML({
      address,
      urbanPlanning,
      hazards,
      accident: {
        hasAccident: accident.hasAccident,
        accidentType: accident.accidentType || undefined,
        disclosureRequired: accident.disclosureRequired,
        priceImpact: accident.priceImpact,
      },
      investigationDate: new Date().toISOString(),
      investigator: 'My Agent Analytics System',
      overallRisk,
    });
    
    // Return HTML for browser print API
    return c.html(html);
  } catch (error) {
    console.error('PDF generation error:', error);
    return c.json({ error: 'Failed to generate PDF' }, 500);
  }
});

/**
 * Compare multiple properties
 * POST /api/properties/compare
 */
api.post('/properties/compare', async (c) => {
  try {
    const { env, var: { user } } = c;
    const body = await c.req.json();
    const { propertyIds } = body;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length < 2) {
      return c.json({ error: 'At least 2 property IDs are required' }, 400);
    }
    
    if (propertyIds.length > 5) {
      return c.json({ error: 'Maximum 5 properties can be compared at once' }, 400);
    }
    
    // Get properties
    const placeholders = propertyIds.map(() => '?').join(',');
    const properties = await env.DB.prepare(`
      SELECT * FROM properties 
      WHERE id IN (${placeholders}) AND user_id = ?
      ORDER BY price ASC
    `).bind(...propertyIds, user.id).all();
    
    if (!properties.results || properties.results.length === 0) {
      return c.json({ error: 'No properties found' }, 404);
    }
    
    // Calculate comparison metrics
    const comparison = properties.results.map((p: any) => {
      const pricePerM2 = p.area ? p.price / p.area : 0;
      const pricePerTsubo = p.land_area ? p.price / (p.land_area / 3.3058) : 0;
      const buildingAge = p.year_built ? new Date().getFullYear() - p.year_built : null;
      
      return {
        id: p.id,
        address: p.address,
        propertyType: p.property_type,
        price: p.price,
        area: p.area,
        buildingArea: p.building_area,
        landArea: p.land_area,
        yearBuilt: p.year_built,
        buildingAge,
        pricePerM2: Math.round(pricePerM2),
        pricePerTsubo: Math.round(pricePerTsubo),
        createdAt: p.created_at,
      };
    });
    
    // Find best values
    const bestPrice = Math.min(...comparison.map(p => p.price));
    const bestPricePerM2 = Math.min(...comparison.filter(p => p.pricePerM2 > 0).map(p => p.pricePerM2));
    const largestArea = Math.max(...comparison.map(p => p.area));
    const newestBuilding = Math.min(...comparison.filter(p => p.buildingAge !== null).map(p => p.buildingAge!));
    
    return c.json({
      success: true,
      comparison,
      bestValues: {
        bestPrice,
        bestPricePerM2,
        largestArea,
        newestBuilding,
      },
      summary: {
        totalProperties: comparison.length,
        averagePrice: Math.round(comparison.reduce((sum, p) => sum + p.price, 0) / comparison.length),
        priceRange: {
          min: bestPrice,
          max: Math.max(...comparison.map(p => p.price)),
        },
        averageArea: Math.round(comparison.reduce((sum, p) => sum + p.area, 0) / comparison.length),
      },
    });
  } catch (error) {
    console.error('Property comparison error:', error);
    return c.json({ error: 'Failed to compare properties' }, 500);
  }
});

/**
 * Generate PDF report for property comparison
 * POST /api/properties/comparison-pdf
 */
api.post('/properties/comparison-pdf', async (c) => {
  try {
    const { env, var: { user } } = c;
    const body = await c.req.json();
    const { propertyIds } = body;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return c.json({ error: 'Property IDs array is required' }, 400);
    }
    
    // Get properties
    const placeholders = propertyIds.map(() => '?').join(',');
    const properties = await env.DB.prepare(`
      SELECT * FROM properties 
      WHERE id IN (${placeholders}) AND user_id = ?
      ORDER BY price ASC
    `).bind(...propertyIds, user.id).all();
    
    if (!properties.results || properties.results.length === 0) {
      return c.json({ error: 'No properties found' }, 404);
    }
    
    // Import PDF generator
    const { generateComparisonReportHTML } = await import('../lib/pdf-generator');
    
    // Generate PDF HTML
    const html = generateComparisonReportHTML({
      properties: properties.results.map((p: any) => ({
        id: p.id,
        address: p.address,
        price: p.price,
        area: p.area,
        buildingArea: p.building_area,
        landArea: p.land_area,
        yearBuilt: p.year_built,
        propertyType: p.property_type,
        createdAt: p.created_at,
      })),
      comparisonDate: new Date().toISOString(),
      criteria: ['価格', '面積', '坪単価', '築年'],
    });
    
    // Return HTML for browser print API
    return c.html(html);
  } catch (error) {
    console.error('PDF generation error:', error);
    return c.json({ error: 'Failed to generate PDF' }, 500);
  }
});

/**
 * Agents Management APIs
 * AIエージェントの作成・更新・削除
 */

/**
 * List all agents
 * GET /api/agents
 */
api.get('/agents', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const result = await env.DB.prepare(`
      SELECT * FROM agents 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      agents: result.results || [],
    });
  } catch (error) {
    console.error('Agents list error:', error);
    return c.json({ error: 'Failed to fetch agents' }, 500);
  }
});

/**
 * Create new agent
 * POST /api/agents
 */
api.post('/agents', async (c) => {
  try {
    const { var: { user } } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { name, description, agent_type, config } = body;
    
    if (!name) {
      return c.json({ error: 'Agent name is required' }, 400);
    }
    
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO agents (id, user_id, name, description, agent_type, status, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      agentId,
      user.id,
      name,
      description || null,
      agent_type || 'analysis',
      config ? JSON.stringify(config) : null
    ).run();
    
    const agent = await c.env.DB.prepare(`
      SELECT * FROM agents WHERE id = ?
    `).bind(agentId).first();
    
    return c.json({
      success: true,
      agent,
    }, 201);
  } catch (error) {
    console.error('Agent creation error:', error);
    return c.json({ error: 'Failed to create agent' }, 500);
  }
});

/**
 * Get agent by ID
 * GET /api/agents/:id
 */
api.get('/agents/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const agentId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();
    
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    return c.json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error('Agent fetch error:', error);
    return c.json({ error: 'Failed to fetch agent' }, 500);
  }
});

/**
 * Update agent
 * PUT /api/agents/:id
 */
api.put('/agents/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const agentId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { name, description, agent_type, status, config } = body;
    
    // Check if agent exists and belongs to user
    const existing = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();
    
    if (!existing) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    await env.DB.prepare(`
      UPDATE agents 
      SET name = ?, description = ?, agent_type = ?, status = ?, config = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(
      name || existing.name,
      description !== undefined ? description : existing.description,
      agent_type || existing.agent_type,
      status || existing.status,
      config ? JSON.stringify(config) : existing.config,
      agentId,
      user.id
    ).run();
    
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ?
    `).bind(agentId).first();
    
    return c.json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error('Agent update error:', error);
    return c.json({ error: 'Failed to update agent' }, 500);
  }
});

/**
 * Delete agent
 * DELETE /api/agents/:id
 */
api.delete('/agents/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const agentId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if agent exists and belongs to user
    const existing = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();
    
    if (!existing) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    // Delete agent (CASCADE will delete executions)
    await env.DB.prepare(`
      DELETE FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).run();
    
    return c.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    console.error('Agent deletion error:', error);
    return c.json({ error: 'Failed to delete agent' }, 500);
  }
});

/**
 * Agent Executions Management APIs
 * エージェント実行履歴の管理
 */

/**
 * Get agent execution history
 * GET /api/agents/:id/executions
 */
api.get('/agents/:id/executions', async (c) => {
  try {
    const { var: { user }, env } = c;
    const agentId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify agent ownership
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();
    
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    const executions = await env.DB.prepare(`
      SELECT * FROM agent_executions 
      WHERE agent_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(agentId, user.id).all();
    
    return c.json({
      success: true,
      executions: executions.results || [],
    });
  } catch (error) {
    console.error('Executions fetch error:', error);
    return c.json({ error: 'Failed to fetch executions' }, 500);
  }
});

/**
 * Get all agent executions for user
 * GET /api/executions
 */
api.get('/executions', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const executions = await env.DB.prepare(`
      SELECT e.*, a.name as agent_name 
      FROM agent_executions e
      LEFT JOIN agents a ON e.agent_id = a.id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();
    
    return c.json({
      success: true,
      executions: executions.results || [],
      limit,
      offset,
    });
  } catch (error) {
    console.error('Executions fetch error:', error);
    return c.json({ error: 'Failed to fetch executions' }, 500);
  }
});

/**
 * Create agent execution
 * POST /api/executions
 */
api.post('/executions', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { agent_id, property_id, execution_type, input_data } = body;
    
    if (!agent_id || !execution_type) {
      return c.json({ error: 'agent_id and execution_type are required' }, 400);
    }
    
    // Verify agent ownership
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agent_id, user.id).first();
    
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await env.DB.prepare(`
      INSERT INTO agent_executions (
        id, agent_id, user_id, property_id, execution_type, 
        input_data, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).bind(
      executionId,
      agent_id,
      user.id,
      property_id || null,
      execution_type,
      input_data ? JSON.stringify(input_data) : null
    ).run();
    
    const execution = await env.DB.prepare(`
      SELECT * FROM agent_executions WHERE id = ?
    `).bind(executionId).first();
    
    // Update agent last_used_at
    await env.DB.prepare(`
      UPDATE agents SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(agent_id).run();
    
    return c.json({
      success: true,
      execution,
    }, 201);
  } catch (error) {
    console.error('Execution creation error:', error);
    return c.json({ error: 'Failed to create execution' }, 500);
  }
});

/**
 * Update execution status
 * PUT /api/executions/:id
 */
api.put('/executions/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const executionId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { status, result_data, error_message, execution_time_ms } = body;
    
    // Verify execution ownership
    const existing = await env.DB.prepare(`
      SELECT * FROM agent_executions WHERE id = ? AND user_id = ?
    `).bind(executionId, user.id).first();
    
    if (!existing) {
      return c.json({ error: 'Execution not found' }, 404);
    }
    
    const completedAt = status === 'completed' || status === 'failed' 
      ? new Date().toISOString() 
      : null;
    
    await env.DB.prepare(`
      UPDATE agent_executions 
      SET status = ?, result_data = ?, error_message = ?, execution_time_ms = ?, completed_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      status || existing.status,
      result_data ? JSON.stringify(result_data) : existing.result_data,
      error_message || existing.error_message,
      execution_time_ms || existing.execution_time_ms,
      completedAt,
      executionId,
      user.id
    ).run();
    
    const execution = await env.DB.prepare(`
      SELECT * FROM agent_executions WHERE id = ?
    `).bind(executionId).first();
    
    return c.json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error('Execution update error:', error);
    return c.json({ error: 'Failed to update execution' }, 500);
  }
});

/**
 * Get execution by ID
 * GET /api/executions/:id
 */
api.get('/executions/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const executionId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const execution = await env.DB.prepare(`
      SELECT e.*, a.name as agent_name 
      FROM agent_executions e
      LEFT JOIN agents a ON e.agent_id = a.id
      WHERE e.id = ? AND e.user_id = ?
    `).bind(executionId, user.id).first();
    
    if (!execution) {
      return c.json({ error: 'Execution not found' }, 404);
    }
    
    return c.json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error('Execution fetch error:', error);
    return c.json({ error: 'Failed to fetch execution' }, 500);
  }
});

/**
 * e-Stat API Endpoints
 * 政府統計データの取得
 */

/**
 * Get population data
 * POST /api/estat/population
 */
api.post('/estat/population', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { prefCode, cityCode } = body;

    if (!prefCode) {
      return c.json({ error: 'Prefecture code is required' }, 400);
    }

    // v5.1.0: Check if e-Stat API key is configured, use mock data if not
    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      console.warn('ESTAT_API_KEY not configured, using mock data');
      return c.json({
        success: true,
        mode: 'demonstration',
        data: {
          prefCode,
          cityCode: cityCode || null,
          totalPopulation: 350000,
          populationChange: 2.3,
          households: 145000,
          averageHouseholdSize: 2.4,
          ageDistribution: {
            '0-14': 12.5,
            '15-64': 62.8,
            '65+': 24.7
          },
          populationDensity: 8500,
          message: 'デモンストレーションモードで動作しています。実際の政府統計データを利用するには、e-Stat APIキーを設定してください。'
        }
      });
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const data = await eStatClient.getPopulationData(prefCode, cityCode);

    return c.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Population data fetch error:', error);
    return c.json({
      error: 'Failed to fetch population data',
      details: error.message,
    }, 500);
  }
});

/**
 * Get economic indicators
 * POST /api/estat/economics
 */
api.post('/estat/economics', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { prefCode, cityCode } = body;

    if (!prefCode) {
      return c.json({ error: 'Prefecture code is required' }, 400);
    }

    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const data = await eStatClient.getEconomicIndicators(prefCode, cityCode);

    return c.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Economic indicators fetch error:', error);
    return c.json({
      error: 'Failed to fetch economic indicators',
      details: error.message,
    }, 500);
  }
});

/**
 * Get land price data
 * POST /api/estat/land-prices
 */
api.post('/estat/land-prices', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { prefCode, year } = body;

    if (!prefCode) {
      return c.json({ error: 'Prefecture code is required' }, 400);
    }

    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const data = await eStatClient.getLandPriceData(prefCode, year);

    return c.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Land price data fetch error:', error);
    return c.json({
      error: 'Failed to fetch land price data',
      details: error.message,
    }, 500);
  }
});

/**
 * Get comprehensive demographic analysis
 * POST /api/estat/demographics
 */
api.post('/estat/demographics', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { prefCode, cityCode } = body;

    if (!prefCode) {
      return c.json({ error: 'Prefecture code is required' }, 400);
    }

    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const analysis = await analyzeDemographics(eStatClient, prefCode, cityCode);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Demographics analysis error:', error);
    return c.json({
      error: 'Failed to analyze demographics',
      details: error.message,
    }, 500);
  }
});

/**
 * Get municipality list
 * GET /api/estat/municipalities?prefCode=13
 */
api.get('/estat/municipalities', async (c) => {
  try {
    const { env } = c;
    const prefCode = c.req.query('prefCode');

    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const data = await eStatClient.getMunicipalityList(prefCode);

    return c.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Municipality list fetch error:', error);
    return c.json({
      error: 'Failed to fetch municipality list',
      details: error.message,
    }, 500);
  }
});

/**
 * AI Market Analysis Endpoints
 * OpenAI GPT-4による市場分析
 */

/**
 * Analyze market with AI
 * POST /api/ai/analyze-market
 */
api.post('/ai/analyze-market', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { marketData, propertyData } = body;

    if (!marketData) {
      return c.json({ error: 'Market data is required' }, 400);
    }

    // v5.1.0: モックデータフォールバック
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
      console.warn('OPENAI_API_KEY not configured, using mock analysis');
      return c.json({
        success: true,
        mode: 'demonstration',
        analysis: {
          summary: 'この地域は安定した需要があり、中長期的な投資に適しています。',
          marketTrends: '過去3年間で価格が平均8%上昇しており、今後も緩やかな上昇が見込まれます。',
          opportunities: [
            '駅近物件の需要が高く、賃貸需要も安定している',
            '再開発計画により将来的な資産価値向上が期待できる',
            '周辺施設が充実しており、居住環境が良好'
          ],
          risks: [
            '供給過多のリスクがある地域も一部存在',
            '金利上昇局面での影響に注意が必要'
          ],
          recommendation: '総合的に見て、この地域への投資は「推奨」と判断されます。',
          investmentScore: 78,
          message: 'デモンストレーションモードで動作しています。実際のAI分析を利用するには、OpenAI APIキーを設定してください。'
        }
      });
    }

    const analyzer = new AIMarketAnalyzer(env.OPENAI_API_KEY);
    const analysis = await analyzer.analyzeMarket(marketData, propertyData);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('AI market analysis error:', error);
    return c.json({
      error: 'Failed to analyze market',
      details: error.message,
    }, 500);
  }
});

/**
 * Analyze property with AI
 * POST /api/ai/analyze-property
 */
api.post('/ai/analyze-property', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { propertyData, marketData } = body;

    if (!propertyData) {
      return c.json({ error: 'Property data is required' }, 400);
    }

    // OpenAI API Keyの検証
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
      return c.json({
        success: false,
        error: 'OpenAI APIキーが設定されていません。管理者に連絡してください。'
      }, 500);
    }

    const analyzer = new AIMarketAnalyzer(env.OPENAI_API_KEY);
    const analysis = await analyzer.analyzeProperty(propertyData, marketData);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('AI property analysis error:', error);
    return c.json({
      error: 'Failed to analyze property',
      details: error.message,
    }, 500);
  }
});

/**
 * Compare multiple properties with AI
 * POST /api/ai/compare-properties
 */
api.post('/ai/compare-properties', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { properties } = body;

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return c.json({ error: 'Properties array is required' }, 400);
    }

    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
      return c.json({
        error: 'OpenAI API key not configured',
        message: 'OpenAI APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const analyzer = new AIMarketAnalyzer(env.OPENAI_API_KEY);
    const comparison = await analyzer.compareProperties(properties);

    return c.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    console.error('AI property comparison error:', error);
    return c.json({
      error: 'Failed to compare properties',
      details: error.message,
    }, 500);
  }
});

/**
 * Investment Simulation Endpoints
 * 投資シミュレーション機能
 */

/**
 * Run investment simulation
 * POST /api/simulate/investment
 */
api.post('/simulate/investment', async (c) => {
  try {
    const params = await c.req.json();

    // Validate required parameters
    const required = ['propertyPrice', 'downPayment', 'loanAmount', 'interestRate', 'loanTerm', 'monthlyRent'];
    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        return c.json({ error: `${field} is required` }, 400);
      }
    }

    const simulator = new InvestmentSimulator();
    const result = simulator.simulate(params);

    return c.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Investment simulation error:', error);
    return c.json({
      error: 'Failed to run simulation',
      details: error.message,
    }, 500);
  }
});

/**
 * Run scenario comparison
 * POST /api/simulate/scenarios
 */
api.post('/simulate/scenarios', async (c) => {
  try {
    const params = await c.req.json();

    const simulator = new InvestmentSimulator();
    const comparison = simulator.compareScenarios(params);

    return c.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    console.error('Scenario comparison error:', error);
    return c.json({
      error: 'Failed to compare scenarios',
      details: error.message,
    }, 500);
  }
});

/**
 * Run Monte Carlo risk analysis
 * POST /api/simulate/monte-carlo
 */
api.post('/simulate/monte-carlo', async (c) => {
  try {
    const body = await c.req.json();
    const { params, iterations = 1000 } = body;

    const simulator = new InvestmentSimulator();
    const analysis = simulator.runMonteCarloSimulation(params, iterations);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Monte Carlo simulation error:', error);
    return c.json({
      error: 'Failed to run Monte Carlo simulation',
      details: error.message,
    }, 500);
  }
});

/**
 * Data Export Endpoints
 * CSVデータエクスポート機能
 */

/**
 * Export properties to CSV
 * GET /api/export/properties
 */
api.get('/export/properties', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const properties = await env.DB.prepare(`
      SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC
    `).bind(user.id).all();
    
    const csv = exportPropertiesToCSV(properties.results || []);
    
    return createCSVDownloadResponse(csv, `properties_${Date.now()}.csv`);
  } catch (error: any) {
    console.error('Properties export error:', error);
    return c.json({
      error: 'Failed to export properties',
      details: error.message,
    }, 500);
  }
});

/**
 * Export analysis results to CSV
 * POST /api/export/analysis
 */
api.post('/export/analysis', async (c) => {
  try {
    const analysis = await c.req.json();
    const csv = exportAnalysisToCSV(analysis);
    
    return createCSVDownloadResponse(csv, `analysis_${Date.now()}.csv`);
  } catch (error: any) {
    console.error('Analysis export error:', error);
    return c.json({
      error: 'Failed to export analysis',
      details: error.message,
    }, 500);
  }
});

/**
 * Export simulation results to CSV
 * POST /api/export/simulation
 */
api.post('/export/simulation', async (c) => {
  try {
    const simulation = await c.req.json();
    const csv = exportSimulationToCSV(simulation);
    
    return createCSVDownloadResponse(csv, `simulation_${Date.now()}.csv`);
  } catch (error: any) {
    console.error('Simulation export error:', error);
    return c.json({
      error: 'Failed to export simulation',
      details: error.message,
    }, 500);
  }
});

/**
 * Export market analysis to CSV
 * POST /api/export/market
 */
api.post('/export/market', async (c) => {
  try {
    const { data } = await c.req.json();
    const csv = exportMarketAnalysisToCSV(data);
    
    return createCSVDownloadResponse(csv, `market_analysis_${Date.now()}.csv`);
  } catch (error: any) {
    console.error('Market export error:', error);
    return c.json({
      error: 'Failed to export market data',
      details: error.message,
    }, 500);
  }
});

/**
 * Export properties to Excel
 * GET /api/export/properties-excel
 */
api.get('/export/properties-excel', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const properties = await env.DB.prepare(`
      SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC
    `).bind(user.id).all();
    
    const excel = exportPropertiesToExcel(properties.results || []);
    
    return createExcelDownloadResponse(excel, `properties_${Date.now()}.xlsx`);
  } catch (error: any) {
    console.error('Properties Excel export error:', error);
    return c.json({
      error: 'Failed to export properties to Excel',
      details: error.message,
    }, 500);
  }
});

/**
 * Export simulation results to Excel
 * POST /api/export/simulation-excel
 */
api.post('/export/simulation-excel', async (c) => {
  try {
    const simulation = await c.req.json();
    const excel = exportSimulationToExcel(simulation);
    
    return createExcelDownloadResponse(excel, `simulation_${Date.now()}.xlsx`);
  } catch (error: any) {
    console.error('Simulation Excel export error:', error);
    return c.json({
      error: 'Failed to export simulation to Excel',
      details: error.message,
    }, 500);
  }
});

/**
 * Report Sharing Endpoints
 * レポート共有機能
 */

/**
 * Create shared report link
 * POST /api/sharing/create
 */
api.post('/sharing/create', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { reportType, reportId, title, description, permission, password, expiresIn, maxAccessCount } = body;

    if (!reportType || !reportId) {
      return c.json({ error: 'reportType and reportId are required' }, 400);
    }

    // Calculate expiration date if expiresIn is provided (in hours)
    let expiresAt: Date | undefined;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
    }

    const result = await createSharedReport(env.DB, {
      userId: user.id,
      reportType,
      reportId,
      title,
      description,
      permission: permission || 'view',
      password,
      expiresAt,
      maxAccessCount,
    });

    // Generate full share URL
    const baseUrl = c.req.url.split('/api')[0];
    const fullShareUrl = `${baseUrl}${result.shareUrl}`;

    return c.json({
      success: true,
      shareToken: result.shareToken,
      shareUrl: fullShareUrl,
      sharedReport: result.sharedReport,
    }, 201);
  } catch (error: any) {
    console.error('Share creation error:', error);
    return c.json({
      error: 'Failed to create shared report',
      details: error.message,
    }, 500);
  }
});

/**
 * Get shared report
 * GET /api/sharing/:token
 */
api.get('/sharing/:token', async (c) => {
  try {
    const { env } = c;
    const token = c.req.param('token');
    const password = c.req.query('password');

    const verification = await verifySharedReportAccess(env.DB, token, password);

    if (!verification.valid) {
      return c.json({
        error: verification.reason,
        requiresPassword: verification.reason === 'Password required',
      }, verification.reason === 'Password required' ? 401 : 403);
    }

    // Log access
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent');
    await logSharedReportAccess(env.DB, token, ip, userAgent);

    return c.json({
      success: true,
      sharedReport: verification.report,
    });
  } catch (error: any) {
    console.error('Shared report access error:', error);
    return c.json({
      error: 'Failed to access shared report',
      details: error.message,
    }, 500);
  }
});

/**
 * Get user's shared reports
 * GET /api/sharing/my-shares
 */
api.get('/sharing/my-shares', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sharedReports = await getUserSharedReports(env.DB, user.id);

    return c.json({
      success: true,
      sharedReports,
    });
  } catch (error: any) {
    console.error('Get shared reports error:', error);
    return c.json({
      error: 'Failed to fetch shared reports',
      details: error.message,
    }, 500);
  }
});

/**
 * Update shared report
 * PUT /api/sharing/:token
 */
api.put('/sharing/:token', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const token = c.req.param('token');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingReport = await getSharedReport(env.DB, token);
    if (!existingReport || existingReport.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const body = await c.req.json();
    const { title, description, permission, isActive, expiresIn, maxAccessCount } = body;

    let expiresAt: Date | null | undefined;
    if (expiresIn !== undefined) {
      if (expiresIn === null) {
        expiresAt = null;
      } else {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresIn);
      }
    }

    const updatedReport = await updateSharedReport(env.DB, token, {
      title,
      description,
      permission,
      isActive,
      expiresAt,
      maxAccessCount,
    });

    return c.json({
      success: true,
      sharedReport: updatedReport,
    });
  } catch (error: any) {
    console.error('Update shared report error:', error);
    return c.json({
      error: 'Failed to update shared report',
      details: error.message,
    }, 500);
  }
});

/**
 * Delete shared report
 * DELETE /api/sharing/:token
 */
api.delete('/sharing/:token', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const token = c.req.param('token');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingReport = await getSharedReport(env.DB, token);
    if (!existingReport || existingReport.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    await deleteSharedReport(env.DB, token);

    return c.json({
      success: true,
      message: 'Shared report deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete shared report error:', error);
    return c.json({
      error: 'Failed to delete shared report',
      details: error.message,
    }, 500);
  }
});

/**
 * Get report by ID (for shared report display)
 * GET /api/reports/:reportId
 * This endpoint allows fetching report data without authentication
 * for use with shared report links
 */
api.get('/reports/:reportId', async (c) => {
  try {
    const { env } = c;
    const reportId = c.req.param('reportId');
    
    // Try to find the report in various tables
    // This is a simplified implementation - in production you would
    // determine the report type from the shared_reports table
    
    // Try properties table first
    const property = await env.DB.prepare(`
      SELECT 
        id,
        user_id,
        name,
        address,
        property_type,
        price,
        area,
        building_area,
        land_area,
        year_built,
        structure,
        distance_from_station,
        monthly_rent,
        occupancy_rate,
        annual_expenses,
        created_at,
        updated_at
      FROM properties 
      WHERE id = ?
    `).bind(reportId).first();
    
    if (property) {
      // Calculate analysis data
      const analysis = analyzeProperty({
        price: property.price || 0,
        monthlyRent: property.monthly_rent || 0,
        occupancyRate: property.occupancy_rate || 95,
        annualExpenses: property.annual_expenses || 0,
        loanAmount: property.price ? property.price * 0.8 : 0,
        interestRate: 2.0,
        loanYears: 30,
      });
      
      return c.json({
        id: property.id,
        reportId: property.id,
        reportType: 'property_analysis',
        name: property.name,
        address: property.address,
        propertyType: property.property_type,
        price: property.price,
        area: property.area,
        age: property.year_built ? new Date().getFullYear() - property.year_built : null,
        overallScore: Math.round((analysis.roi || 0) * 10),
        analysis: `
          <h3>物件分析結果</h3>
          <p><strong>想定利回り:</strong> ${analysis.grossYield?.toFixed(2)}%</p>
          <p><strong>実質利回り:</strong> ${analysis.netYield?.toFixed(2)}%</p>
          <p><strong>年間収支:</strong> ${(analysis.annualCashFlow || 0).toLocaleString()}円</p>
          <p><strong>ROI:</strong> ${analysis.roi?.toFixed(2)}%</p>
        `,
        createdAt: property.created_at,
      });
    }
    
    // If not found, return a generic not found response
    return c.json({ error: 'Report not found' }, 404);
    
  } catch (error: any) {
    console.error('Get report error:', error);
    return c.json({
      error: 'Failed to fetch report',
      details: error.message,
    }, 500);
  }
});

/**
 * Get access logs for shared report
 * GET /api/sharing/:token/logs
 */
api.get('/sharing/:token/logs', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const token = c.req.param('token');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingReport = await getSharedReport(env.DB, token);
    if (!existingReport || existingReport.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const logs = await getSharedReportAccessLogs(env.DB, token);

    return c.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Get access logs error:', error);
    return c.json({
      error: 'Failed to fetch access logs',
      details: error.message,
    }, 500);
  }
});

// ============================================================
// TEMPLATE MANAGEMENT ENDPOINTS
// ============================================================

/**
 * Create a new report template
 * POST /api/templates
 */
api.post('/templates', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name, description, category, isDefault, isPublic } = body;

    if (!name || !category) {
      return c.json({ error: 'Name and category are required' }, 400);
    }

    const template = await createTemplate(env.DB, {
      userId: user.id,
      name,
      description,
      category,
      isDefault,
      isPublic,
    });

    return c.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Create template error:', error);
    return c.json({
      error: 'Failed to create template',
      details: error.message,
    }, 500);
  }
});

/**
 * Get all templates for current user
 * GET /api/templates
 */
api.get('/templates', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');

    let templates;
    if (category) {
      templates = await getTemplatesByCategory(env.DB, user.id, category as any);
    } else {
      templates = await getUserTemplates(env.DB, user.id);
    }

    return c.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return c.json({
      error: 'Failed to fetch templates',
      details: error.message,
    }, 500);
  }
});

/**
 * Get public templates
 * GET /api/templates/public
 */
api.get('/templates/public', async (c) => {
  try {
    const { env } = c;

    const templates = await getPublicTemplates(env.DB);

    return c.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Get public templates error:', error);
    return c.json({
      error: 'Failed to fetch public templates',
      details: error.message,
    }, 500);
  }
});

/**
 * Get template by ID
 * GET /api/templates/:id
 */
api.get('/templates/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const template = await getTemplate(env.DB, templateId);

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Check if user has access (owner or public template)
    if (template.userId !== user.id && !template.isPublic) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Get template error:', error);
    return c.json({
      error: 'Failed to fetch template',
      details: error.message,
    }, 500);
  }
});

/**
 * Update template
 * PUT /api/templates/:id
 */
api.put('/templates/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingTemplate = await getTemplate(env.DB, templateId);
    if (!existingTemplate || existingTemplate.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const body = await c.req.json();
    const { name, description, category, isDefault, isPublic } = body;

    const updatedTemplate = await updateTemplate(env.DB, templateId, {
      name,
      description,
      category,
      isDefault,
      isPublic,
    });

    return c.json({
      success: true,
      template: updatedTemplate,
    });
  } catch (error: any) {
    console.error('Update template error:', error);
    return c.json({
      error: 'Failed to update template',
      details: error.message,
    }, 500);
  }
});

/**
 * Delete template
 * DELETE /api/templates/:id
 */
api.delete('/templates/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingTemplate = await getTemplate(env.DB, templateId);
    if (!existingTemplate || existingTemplate.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    await deleteTemplate(env.DB, templateId);

    return c.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete template error:', error);
    return c.json({
      error: 'Failed to delete template',
      details: error.message,
    }, 500);
  }
});

/**
 * Duplicate template
 * POST /api/templates/:id/duplicate
 */
api.post('/templates/:id/duplicate', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    // Check if template exists and is accessible
    const originalTemplate = await getTemplate(env.DB, templateId);
    if (!originalTemplate) {
      return c.json({ error: 'Template not found' }, 404);
    }

    if (originalTemplate.userId !== user.id && !originalTemplate.isPublic) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const newTemplate = await duplicateTemplate(env.DB, templateId, user.id, name);

    return c.json({
      success: true,
      template: newTemplate,
    });
  } catch (error: any) {
    console.error('Duplicate template error:', error);
    return c.json({
      error: 'Failed to duplicate template',
      details: error.message,
    }, 500);
  }
});

/**
 * Set template as default
 * POST /api/templates/:id/set-default
 */
api.post('/templates/:id/set-default', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await setDefaultTemplate(env.DB, templateId, user.id);

    return c.json({
      success: true,
      message: 'Template set as default',
    });
  } catch (error: any) {
    console.error('Set default template error:', error);
    return c.json({
      error: 'Failed to set default template',
      details: error.message,
    }, 500);
  }
});

/**
 * Get default template for category
 * GET /api/templates/default/:category
 */
api.get('/templates/default/:category', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const category = c.req.param('category');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const template = await getDefaultTemplate(env.DB, user.id, category as any);

    if (!template) {
      return c.json({ error: 'No default template found' }, 404);
    }

    return c.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Get default template error:', error);
    return c.json({
      error: 'Failed to fetch default template',
      details: error.message,
    }, 500);
  }
});

/**
 * Create a template section
 * POST /api/templates/:id/sections
 */
api.post('/templates/:id/sections', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const template = await getTemplate(env.DB, templateId);
    if (!template || template.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const body = await c.req.json();
    const { title, contentType, content, displayOrder, isVisible, config } = body;

    if (!title || !contentType || !content || displayOrder === undefined) {
      return c.json({ error: 'Title, contentType, content, and displayOrder are required' }, 400);
    }

    const section = await createSection(env.DB, {
      templateId,
      title,
      contentType,
      content,
      displayOrder,
      isVisible,
      config,
    });

    return c.json({
      success: true,
      section,
    });
  } catch (error: any) {
    console.error('Create section error:', error);
    return c.json({
      error: 'Failed to create section',
      details: error.message,
    }, 500);
  }
});

/**
 * Get template sections
 * GET /api/templates/:id/sections
 */
api.get('/templates/:id/sections', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify access
    const template = await getTemplate(env.DB, templateId);
    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    if (template.userId !== user.id && !template.isPublic) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const sections = await getTemplateSections(env.DB, templateId);

    return c.json({
      success: true,
      sections,
    });
  } catch (error: any) {
    console.error('Get sections error:', error);
    return c.json({
      error: 'Failed to fetch sections',
      details: error.message,
    }, 500);
  }
});

/**
 * Update template section
 * PUT /api/sections/:id
 */
api.put('/sections/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const sectionId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get section and verify template ownership
    const section = await env.DB.prepare(`
      SELECT ts.*, rt.user_id 
      FROM template_sections ts
      JOIN report_templates rt ON ts.template_id = rt.id
      WHERE ts.id = ?
    `).bind(sectionId).first();

    if (!section || section.user_id !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const body = await c.req.json();
    const { title, contentType, content, displayOrder, isVisible, config } = body;

    const updatedSection = await updateSection(env.DB, sectionId, {
      title,
      contentType,
      content,
      displayOrder,
      isVisible,
      config,
    });

    return c.json({
      success: true,
      section: updatedSection,
    });
  } catch (error: any) {
    console.error('Update section error:', error);
    return c.json({
      error: 'Failed to update section',
      details: error.message,
    }, 500);
  }
});

/**
 * Delete template section
 * DELETE /api/sections/:id
 */
api.delete('/sections/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const sectionId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get section and verify template ownership
    const section = await env.DB.prepare(`
      SELECT ts.*, rt.user_id 
      FROM template_sections ts
      JOIN report_templates rt ON ts.template_id = rt.id
      WHERE ts.id = ?
    `).bind(sectionId).first();

    if (!section || section.user_id !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    await deleteSection(env.DB, sectionId);

    return c.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete section error:', error);
    return c.json({
      error: 'Failed to delete section',
      details: error.message,
    }, 500);
  }
});

/**
 * Comprehensive Property Analysis Endpoint
 * 統合分析エンドポイント - すべてのデータソースを統合した質の高い分析
 * POST /api/properties/comprehensive-analysis
 */
api.post('/properties/comprehensive-analysis', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    
    // 必須フィールドの検証
    const {
      name,
      propertyType,
      price,
      location,
      area,
      age,
      distanceFromStation,
      prefCode,
      cityCode,
      // 収益物件用の任意フィールド
      monthlyRent,
      occupancyRate,
      grossIncome,
      effectiveIncome,
      operatingExpenses,
      loanAmount,
      interestRate,
      loanTermYears,
      downPayment,
      // 建物情報の任意フィールド
      structure,
      totalFloorArea,
      landArea,
    } = body;
    
    if (!name || !propertyType || !price || !location || !area || age === undefined || 
        distanceFromStation === undefined || !prefCode) {
      return c.json({ 
        error: 'Missing required fields',
        required: ['name', 'propertyType', 'price', 'location', 'area', 'age', 'distanceFromStation', 'prefCode']
      }, 400);
    }
    
    // APIキーの検証
    if (!env.REINFOLIB_API_KEY || env.REINFOLIB_API_KEY.trim() === '') {
      return c.json({
        success: false,
        error: 'REINFOLIB APIキーが設定されていません。管理者に連絡してください。'
      }, 500);
    }
    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        success: false,
        error: 'e-Stat APIキーが設定されていません。管理者に連絡してください。'
      }, 500);
    }
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
      return c.json({
        success: false,
        error: 'OpenAI APIキーが設定されていません。管理者に連絡してください。'
      }, 500);
    }
    
    console.log('[ComprehensiveAnalysis] All API keys validated');
    
    // ComprehensivePropertyAnalyzerのインポート
    const { ComprehensivePropertyAnalyzer } = await import('../lib/comprehensive-analyzer');
    
    // アナライザーの初期化
    const analyzer = new ComprehensivePropertyAnalyzer(
      env.REINFOLIB_API_KEY,
      env.ESTAT_API_KEY,
      env.OPENAI_API_KEY
    );
    
    // 分析の実行
    const propertyInput = {
      name,
      propertyType,
      price: parseFloat(price),
      location,
      area: parseFloat(area),
      age: parseInt(age),
      distanceFromStation: parseFloat(distanceFromStation),
      prefCode,
      cityCode,
      monthlyRent: monthlyRent ? parseFloat(monthlyRent) : undefined,
      occupancyRate: occupancyRate ? parseFloat(occupancyRate) : undefined,
      grossIncome: grossIncome ? parseFloat(grossIncome) : undefined,
      effectiveIncome: effectiveIncome ? parseFloat(effectiveIncome) : undefined,
      operatingExpenses: operatingExpenses ? parseFloat(operatingExpenses) : undefined,
      loanAmount: loanAmount ? parseFloat(loanAmount) : undefined,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      loanTermYears: loanTermYears ? parseInt(loanTermYears) : undefined,
      downPayment: downPayment ? parseFloat(downPayment) : undefined,
      structure,
      totalFloorArea: totalFloorArea ? parseFloat(totalFloorArea) : undefined,
      landArea: landArea ? parseFloat(landArea) : undefined,
    };
    
    console.log('[ComprehensiveAnalysis] Starting analysis:', propertyInput.name);
    
    const result = await analyzer.analyze(propertyInput);
    
    console.log('[ComprehensiveAnalysis] Analysis completed');
    
    return c.json({
      success: true,
      analysis: result,
      message: '統合分析が完了しました。',
    });
  } catch (error: any) {
    console.error('[ComprehensiveAnalysis] Error:', error);
    return c.json({
      error: '統合分析に失敗しました',
      details: error.message,
      stack: error.stack,
    }, 500);
  }
});

/**
 * Itandi BB Rental Analysis Endpoint
 * イタンジBB 賃貸相場分析エンドポイント
 * POST /api/itandi/rental-analysis
 */
api.post('/itandi/rental-analysis', authMiddleware, async (c) => {
  try {
    const { prefecture, city, town, roomType, minArea, maxArea, minRent, maxRent } = await c.req.json();

    if (!prefecture || !city) {
      return c.json({ 
        error: '都道府県と市区町村は必須です',
        errorCode: 'MISSING_REQUIRED_PARAMS'
      }, 400);
    }

    // Import Itandi Client
    const { getItandiClient } = await import('../lib/itandi-client');
    const itandiClient = getItandiClient(c.env);

    // Execute rental analysis
    const result = await itandiClient.getRentalAnalysis({
      prefecture,
      city,
      town,
      roomType,
      minArea,
      maxArea,
      minRent,
      maxRent
    });

    // Check if using demo mode
    const isDemoMode = !c.env?.ITANDI_EMAIL || c.env.ITANDI_EMAIL === 'YOUR_ITANDI_EMAIL_HERE';

    return c.json({
      success: true,
      isDemoMode,
      ...result
    });
  } catch (error: any) {
    console.error('Itandi rental analysis error:', error);
    return c.json({
      error: '賃貸相場の取得に失敗しました',
      details: error.message,
      errorCode: 'RENTAL_ANALYSIS_FAILED'
    }, 500);
  }
});

/**
 * Itandi BB Rental Trend Endpoint
 * イタンジBB 賃貸推移エンドポイント
 * POST /api/itandi/rental-trend
 */
api.post('/itandi/rental-trend', authMiddleware, async (c) => {
  try {
    const { prefecture, city, town, roomType, minArea, maxArea, months } = await c.req.json();

    if (!prefecture || !city) {
      return c.json({ 
        error: '都道府県と市区町村は必須です',
        errorCode: 'MISSING_REQUIRED_PARAMS'
      }, 400);
    }

    // Import Itandi Client
    const { getItandiClient } = await import('../lib/itandi-client');
    const itandiClient = getItandiClient(c.env);

    // Execute rental trend analysis
    const result = await itandiClient.getRentalTrend({
      prefecture,
      city,
      town,
      roomType,
      minArea,
      maxArea
    }, months || 12);

    // Check if using demo mode
    const isDemoMode = !c.env?.ITANDI_EMAIL || c.env.ITANDI_EMAIL === 'YOUR_ITANDI_EMAIL_HERE';

    return c.json({
      success: true,
      isDemoMode,
      ...result
    });
  } catch (error: any) {
    console.error('Itandi rental trend error:', error);
    return c.json({
      error: '賃貸推移の取得に失敗しました',
      details: error.message,
      errorCode: 'RENTAL_TREND_FAILED'
    }, 500);
  }
});

/**
 * Generate Property Maps Endpoint
 * 物件地図生成エンドポイント
 * POST /api/maps/generate
 */
api.post('/maps/generate', authMiddleware, async (c) => {
  try {
    const { env } = c;
    const { address, lat, lng } = await c.req.json();

    if (!address && (!lat || !lng)) {
      return c.json({
        error: '住所または座標が必要です',
        errorCode: 'MISSING_LOCATION_DATA'
      }, 400);
    }
    
    // Google Maps APIキーの検証
    if (!env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY.trim() === '') {
      return c.json({
        error: 'Google Maps APIキーが設定されていません',
        errorCode: 'MAPS_API_KEY_NOT_SET',
        suggestion: '環境変数 GOOGLE_MAPS_API_KEY を設定してください'
      }, 503);
    }

    // Import Google Maps Client
    const { generateMapsForProperty } = await import('../lib/google-maps');

    // Generate maps with API key from environment
    const maps = await generateMapsForProperty(address, lat, lng, env.GOOGLE_MAPS_API_KEY);

    if (!maps) {
      return c.json({
        error: '地図の生成に失敗しました',
        errorCode: 'MAP_GENERATION_FAILED',
        suggestion: 'APIキーの権限を確認してください'
      }, 500);
    }

    return c.json({
      success: true,
      maps
    });
  } catch (error: any) {
    console.error('Map generation error:', error);
    return c.json({
      error: '地図の生成に失敗しました',
      details: error.message,
      errorCode: 'MAP_GENERATION_FAILED'
    }, 500);
  }
});

/**
 * Batch Analysis Results Save Endpoint
 * 一括分析結果保存エンドポイント
 * POST /api/properties/:id/analysis-batch
 */
api.post('/properties/:id/analysis-batch', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    const propertyId = c.req.param('id');
    const { analyses } = await c.req.json();

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!analyses || !Array.isArray(analyses)) {
      return c.json({ 
        error: '分析結果が不正です',
        errorCode: 'INVALID_ANALYSES_DATA'
      }, 400);
    }

    // 各分析結果をデータベースに保存
    const savedResults = [];
    
    for (const analysis of analyses) {
      try {
        const analysisId = crypto.randomUUID();
        
        // 分析タイプに応じて適切なテーブルに保存
        switch (analysis.type) {
          case 'stigma':
            // 事故物件調査結果を保存
            await env.DB.prepare(`
              INSERT INTO accident_investigations (
                id, property_id, user_id, risk_level, summary, 
                incidents_found, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
              analysisId,
              propertyId,
              user.id,
              analysis.data?.riskLevel || 'unknown',
              analysis.data?.summary || '',
              JSON.stringify(analysis.data?.incidentsFound || [])
            ).run();
            break;
            
          case 'rental':
            // 賃貸相場データを保存
            await env.DB.prepare(`
              INSERT INTO rental_market_data (
                id, property_id, user_id, average_rent, median_rent,
                min_rent, max_rent, sample_size, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
              analysisId,
              propertyId,
              user.id,
              analysis.data?.averageRent || 0,
              analysis.data?.medianRent || 0,
              analysis.data?.minRent || 0,
              analysis.data?.maxRent || 0,
              analysis.data?.sampleSize || 0
            ).run();
            break;
            
          case 'demographics':
          case 'aiMarket':
          case 'maps':
            // その他の分析結果は汎用テーブルに保存
            await env.DB.prepare(`
              INSERT INTO analysis_results (
                id, property_id, user_id, analysis_type, result_data, created_at
              ) VALUES (?, ?, ?, ?, ?, datetime('now'))
            `).bind(
              analysisId,
              propertyId,
              user.id,
              analysis.type,
              JSON.stringify(analysis.data || {})
            ).run();
            break;
        }
        
        savedResults.push({
          type: analysis.type,
          id: analysisId,
          success: true
        });
      } catch (error: any) {
        console.error(`Failed to save ${analysis.type} analysis:`, error);
        savedResults.push({
          type: analysis.type,
          success: false,
          error: error.message
        });
      }
    }

    return c.json({
      success: true,
      saved: savedResults.filter(r => r.success).length,
      total: analyses.length,
      results: savedResults
    });
  } catch (error: any) {
    console.error('Batch analysis save error:', error);
    return c.json({
      error: '分析結果の保存に失敗しました',
      details: error.message,
      errorCode: 'BATCH_SAVE_FAILED'
    }, 500);
  }
});

/**
 * Comprehensive Report Data Endpoint
 * 統合レポートデータ取得エンドポイント
 * GET /api/properties/:id/comprehensive-data
 */
api.get('/properties/:id/comprehensive-data', authMiddleware, async (c) => {
  try {
    const { env, var: { user } } = c;
    const propertyId = c.req.param('id');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 1. 物件基本情報取得
    const propertyResult = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ? AND user_id = ?
    `).bind(propertyId, user.id).first();

    if (!propertyResult) {
      return c.json({ 
        error: '物件が見つかりません',
        errorCode: 'PROPERTY_NOT_FOUND'
      }, 404);
    }

    // 2. 事故物件調査結果取得
    const stigmaResult = await env.DB.prepare(`
      SELECT * FROM accident_investigations 
      WHERE property_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(propertyId).first();

    // 3. 賃貸相場データ取得
    const rentalResult = await env.DB.prepare(`
      SELECT * FROM rental_market_data 
      WHERE property_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(propertyId).first();

    // 4. 人口動態分析結果取得（demographics_data テーブルまたは analysis_results テーブルから）
    let demographicsResult = await env.DB.prepare(`
      SELECT * FROM demographics_data 
      WHERE property_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(propertyId).first();
    
    // Fallback to analysis_results table if not found in demographics_data
    if (!demographicsResult) {
      demographicsResult = await env.DB.prepare(`
        SELECT * FROM analysis_results 
        WHERE property_id = ? AND analysis_type = 'demographics'
        ORDER BY created_at DESC 
        LIMIT 1
      `).bind(propertyId).first();
    }

    // 5. AI市場分析結果取得（ai_analysis_results テーブルまたは analysis_results テーブルから）
    let aiMarketResult = await env.DB.prepare(`
      SELECT * FROM ai_analysis_results 
      WHERE property_id = ? AND analysis_type = 'market'
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(propertyId).first();
    
    // Fallback to analysis_results table if not found in ai_analysis_results
    if (!aiMarketResult) {
      aiMarketResult = await env.DB.prepare(`
        SELECT * FROM analysis_results 
        WHERE property_id = ? AND analysis_type = 'aiMarket'
        ORDER BY created_at DESC 
        LIMIT 1
      `).bind(propertyId).first();
    }

    // 6. 地図データ取得（property_maps テーブルまたは analysis_results テーブルから）
    let mapsResult = await env.DB.prepare(`
      SELECT * FROM property_maps 
      WHERE property_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(propertyId).first();
    
    // Fallback to analysis_results table if not found in property_maps
    if (!mapsResult) {
      mapsResult = await env.DB.prepare(`
        SELECT * FROM analysis_results 
        WHERE property_id = ? AND analysis_type = 'maps'
        ORDER BY created_at DESC 
        LIMIT 1
      `).bind(propertyId).first();
    }

    // 安全なJSON解析ヘルパー関数
    const safeJSONParse = (data: any, fieldName: string): any => {
      if (!data) return null;
      
      // すでにオブジェクトの場合はそのまま返す
      if (typeof data === 'object' && data !== null) return data;
      
      // 文字列の場合は解析を試みる
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error(`JSON parse error for ${fieldName}:`, e, 'Data:', data.substring(0, 100));
          return null;
        }
      }
      
      return data;
    };

    // JSON文字列を安全にパース
    const parsedData = {
      property: propertyResult,
      stigma: stigmaResult ? {
        ...stigmaResult,
        incidents_found: safeJSONParse(stigmaResult.incidents_found, 'stigma.incidents_found') || []
      } : null,
      rental: rentalResult,
      // demographics: 専用テーブルの場合はdemographics_detailをパース、analysis_resultsの場合はresult_dataをパース
      demographics: demographicsResult ? (
        safeJSONParse(demographicsResult.demographics_detail, 'demographics.demographics_detail') ||
        safeJSONParse(demographicsResult.result_data, 'demographics.result_data') ||
        demographicsResult
      ) : null,
      // aiMarket: 専用テーブルの場合はanalysis_detailをパース、analysis_resultsの場合はresult_dataをパース
      aiMarket: aiMarketResult ? (
        safeJSONParse(aiMarketResult.analysis_detail, 'aiMarket.analysis_detail') ||
        safeJSONParse(aiMarketResult.result_data, 'aiMarket.result_data') ||
        aiMarketResult
      ) : null,
      // maps: 専用テーブルの場合はそのまま使用、analysis_resultsの場合はresult_dataをパース
      maps: mapsResult ? (
        mapsResult.map_1km_url 
          ? mapsResult // 専用テーブルの場合はそのまま
          : safeJSONParse(mapsResult.result_data, 'maps.result_data') || mapsResult
      ) : null
    };

    return c.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Comprehensive report data fetch error:', error);
    console.error('Error stack:', error.stack);
    
    // より詳細なエラー情報を返す（デバッグ用）
    return c.json({
      error: '統合レポートデータの取得に失敗しました',
      details: error.message,
      errorCode: 'COMPREHENSIVE_DATA_FETCH_FAILED',
      errorType: error.name,
      // エラーの発生箇所を特定しやすくする
      hint: 'データベース接続またはJSON解析エラーの可能性があります。物件データと分析結果が正しく保存されているか確認してください。'
    }, 500);
  }
});

/**
 * Stigmatized Property Check Endpoint
 * 事故物件（心理的瑕疵）調査エンドポイント
 * POST /api/properties/stigma-check
 */
api.post('/properties/stigma-check', authMiddleware, async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { address, propertyName } = body;

    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }

    // Initialize Stigma Checker with Google Custom Search API
    const { StigmatizedPropertyChecker } = await import('../lib/stigma-checker');
    
    const checker = new StigmatizedPropertyChecker(
      env.OPENAI_API_KEY || 'demo',
      env.GOOGLE_CUSTOM_SEARCH_API_KEY || undefined,
      env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || undefined
    );

    // Execute stigma check (with real web search if APIs are configured)
    const result = await checker.checkProperty(address, propertyName);

    return c.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Stigma check error:', error);
    return c.json({
      success: false,
      error: '事故物件調査に失敗しました',
      details: error.message,
    }, 500);
  }
});

/**
 * TEST ENDPOINT: API Configuration Check
 * Google Custom Search API設定確認エンドポイント
 * GET /api/test/google-search-config
 */
api.get('/test/google-search-config', async (c) => {
  const { env } = c;
  
  const hasApiKey = !!(env.GOOGLE_CUSTOM_SEARCH_API_KEY && 
                       env.GOOGLE_CUSTOM_SEARCH_API_KEY !== 'demo' && 
                       env.GOOGLE_CUSTOM_SEARCH_API_KEY.trim() !== '');
  
  const hasEngineId = !!(env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID && 
                        env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID !== 'demo' && 
                        env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID.trim() !== '' &&
                        !env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID.startsWith('YOUR_'));
  
  const apiKeyPrefix = env.GOOGLE_CUSTOM_SEARCH_API_KEY ? 
    env.GOOGLE_CUSTOM_SEARCH_API_KEY.substring(0, 8) + '...' : 'NOT_SET';
  
  const engineIdPrefix = env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID ? 
    env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID.substring(0, 10) + '...' : 'NOT_SET';
  
  return c.json({
    configured: hasApiKey && hasEngineId,
    apiKey: {
      set: hasApiKey,
      prefix: apiKeyPrefix,
      length: env.GOOGLE_CUSTOM_SEARCH_API_KEY?.length || 0
    },
    engineId: {
      set: hasEngineId,
      prefix: engineIdPrefix,
      length: env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID?.length || 0,
      isPlaceholder: env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID?.startsWith('YOUR_') || false
    },
    openai: {
      set: !!(env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'demo')
    }
  });
});

/**
 * TEST ENDPOINT: Stigmatized Property Check (No Auth)
 * テスト用事故物件調査エンドポイント（認証不要）
 * POST /api/test/stigma-check
 */
api.post('/test/stigma-check', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { address, propertyName } = body;

    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }

    // Initialize Stigma Checker with Google Custom Search API
    const { StigmatizedPropertyChecker } = await import('../lib/stigma-checker');
    
    const checker = new StigmatizedPropertyChecker(
      env.OPENAI_API_KEY || 'demo',
      env.GOOGLE_CUSTOM_SEARCH_API_KEY || undefined,
      env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || undefined
    );

    // Execute stigma check (with real web search if APIs are configured)
    const result = await checker.checkProperty(address, propertyName);

    return c.json({
      success: true,
      testMode: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Stigma check error:', error);
    return c.json({
      success: false,
      error: '事故物件調査に失敗しました',
      details: error.message,
    }, 500);
  }
});

/**
 * Agents Management API Endpoints
 * AIエージェント管理APIエンドポイント
 */

/**
 * Get all agents for current user
 * GET /api/agents
 */
api.get('/agents', authMiddleware, async (c) => {
  try {
    const { env } = c;
    const user = c.get('user');

    const agents = await env.DB.prepare(`
      SELECT * FROM agents
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    return c.json({
      success: true,
      agents: agents.results || []
    });
  } catch (error: any) {
    console.error('Get agents error:', error);
    return c.json({
      error: 'エージェント一覧の取得に失敗しました',
      details: error.message,
    }, 500);
  }
});

/**
 * Get agent by ID
 * GET /api/agents/:id
 */
api.get('/agents/:id', authMiddleware, async (c) => {
  try {
    const { env } = c;
    const user = c.get('user');
    const agentId = c.req.param('id');

    const agent = await env.DB.prepare(`
      SELECT * FROM agents
      WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();

    if (!agent) {
      return c.json({ error: 'エージェントが見つかりません' }, 404);
    }

    return c.json({
      success: true,
      agent
    });
  } catch (error: any) {
    console.error('Get agent error:', error);
    return c.json({
      error: 'エージェント情報の取得に失敗しました',
      details: error.message,
    }, 500);
  }
});

/**
 * Create new agent
 * POST /api/agents
 */
api.post('/agents', authMiddleware, async (c) => {
  try {
    const { env } = c;
    const user = c.get('user');
    const { name, description, agent_type, status, config } = await c.req.json();

    if (!name) {
      return c.json({ error: 'エージェント名は必須です' }, 400);
    }

    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO agents (id, user_id, name, description, agent_type, status, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      agentId,
      user.id,
      name,
      description || null,
      agent_type || 'analysis',
      status || 'active',
      config ? JSON.stringify(config) : null,
      now,
      now
    ).run();

    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ?
    `).bind(agentId).first();

    return c.json({
      success: true,
      agent
    });
  } catch (error: any) {
    console.error('Create agent error:', error);
    return c.json({
      error: 'エージェントの作成に失敗しました',
      details: error.message,
    }, 500);
  }
});

/**
 * Update agent
 * PUT /api/agents/:id
 */
api.put('/agents/:id', authMiddleware, async (c) => {
  try {
    const { env } = c;
    const user = c.get('user');
    const agentId = c.req.param('id');
    const { name, description, agent_type, status, config } = await c.req.json();

    // Verify agent exists and belongs to user
    const existingAgent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();

    if (!existingAgent) {
      return c.json({ error: 'エージェントが見つかりません' }, 404);
    }

    const now = new Date().toISOString();

    await env.DB.prepare(`
      UPDATE agents
      SET name = ?, description = ?, agent_type = ?, status = ?, config = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      name || existingAgent.name,
      description !== undefined ? description : existingAgent.description,
      agent_type || existingAgent.agent_type,
      status || existingAgent.status,
      config ? JSON.stringify(config) : existingAgent.config,
      now,
      agentId,
      user.id
    ).run();

    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ?
    `).bind(agentId).first();

    return c.json({
      success: true,
      agent
    });
  } catch (error: any) {
    console.error('Update agent error:', error);
    return c.json({
      error: 'エージェントの更新に失敗しました',
      details: error.message,
    }, 500);
  }
});

/**
 * Delete agent
 * DELETE /api/agents/:id
 */
api.delete('/agents/:id', authMiddleware, async (c) => {
  try {
    const { env } = c;
    const user = c.get('user');
    const agentId = c.req.param('id');

    // Verify agent exists and belongs to user
    const existingAgent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();

    if (!existingAgent) {
      return c.json({ error: 'エージェントが見つかりません' }, 404);
    }

    // Delete agent (executions will be cascade deleted)
    await env.DB.prepare(`
      DELETE FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).run();

    return c.json({
      success: true,
      message: 'エージェントを削除しました'
    });
  } catch (error: any) {
    console.error('Delete agent error:', error);
    return c.json({
      error: 'エージェントの削除に失敗しました',
      details: error.message,
    }, 500);
  }
});

/**
 * Get agent executions
 * GET /api/agents/:id/executions
 */
api.get('/agents/:id/executions', authMiddleware, async (c) => {
  try {
    const { env } = c;
    const user = c.get('user');
    const agentId = c.req.param('id');

    // Verify agent exists and belongs to user
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();

    if (!agent) {
      return c.json({ error: 'エージェントが見つかりません' }, 404);
    }

    const executions = await env.DB.prepare(`
      SELECT * FROM agent_executions
      WHERE agent_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(agentId).all();

    return c.json({
      success: true,
      executions: executions.results || []
    });
  } catch (error: any) {
    console.error('Get executions error:', error);
    return c.json({
      error: '実行履歴の取得に失敗しました',
      details: error.message,
    }, 500);
  }
});

export default api;
