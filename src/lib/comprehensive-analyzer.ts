/**
 * Comprehensive Property Analyzer
 * 実需用・収益用物件の統合分析エンジン
 * 
 * すべてのデータソースを統合し、質の高い分析結果を提供
 * - 国土交通省 不動産情報ライブラリ API
 * - e-Stat API (政府統計データ)
 * - 地価公示データ
 * - OpenAI GPT-4 AI分析
 * - 財務計算エンジン
 */

import { ReinfolibClient } from './reinfolib';
import { EStatClient } from './estat';
import { AIMarketAnalyzer } from './ai-analyzer';
import { analyzeProperty } from './calculator';
import {
  estimatePriceByComparison,
  evaluateByCostApproach,
  analyzeLandPriceTrend,
  calculateAssetScore,
  type ComparableProperty,
  type BuildingSpecification,
  type LandPriceData,
  type AssetEvaluationFactors,
} from './residential-evaluator';
import { InvestmentSimulator } from './simulator';

// ==================== Type Definitions ====================

export interface PropertyInput {
  // 基本情報
  id?: string;
  name: string;
  propertyType: 'residential' | 'investment'; // 実需用 or 収益用
  price: number;
  location: string;
  area: number; // 専有面積
  age: number;
  distanceFromStation: number;
  
  // 建物情報（任意）
  structure?: 'RC' | 'SRC' | 'Steel' | 'Wood';
  totalFloorArea?: number;
  landArea?: number;
  
  // 収益情報（収益用物件の場合）
  monthlyRent?: number;
  occupancyRate?: number;
  grossIncome?: number;
  effectiveIncome?: number;
  operatingExpenses?: number;
  
  // 投資条件（収益用物件の場合）
  loanAmount?: number;
  interestRate?: number;
  loanTermYears?: number;
  downPayment?: number;
  
  // 地域情報
  prefCode: string;
  cityCode?: string;
}

export interface MarketContext {
  // 市場データ
  averagePrice: number;
  averagePricePerSqm: number;
  transactionCount: number;
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  priceTrend: {
    currentQuarter: number;
    previousQuarter: number;
    changeRate: number;
  };
  popularPropertyTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  
  // 取引事例
  comparables: ComparableProperty[];
  
  // 地価データ
  landPrices: LandPriceData[];
  currentLandPrice: number;
  landPriceTrend: 'rising' | 'stable' | 'falling';
}

export interface DemographicContext {
  // 人口統計
  totalPopulation: number;
  populationChange: number;
  households: number;
  averageHouseholdSize: number;
  ageDistribution: {
    '0-14': number;
    '15-64': number;
    '65+': number;
  };
  populationDensity: number;
  
  // 経済指標
  economicStrength?: number;
  employmentRate?: number;
  averageIncome?: number;
}

export interface MarketPositionAnalysis {
  pricePosition: 'high' | 'average' | 'low';
  pricePercentile: number; // 0-100
  priceVsMarketAverage: number; // ±%
  priceVsMedian: number; // ±%
  
  yieldPosition?: 'high' | 'average' | 'low';
  yieldVsMarketAverage?: number; // ±%
  
  competitiveness: 'strong' | 'moderate' | 'weak';
  reasoning: string[];
}

export interface DemandForecast {
  rentalDemand: 'strong' | 'moderate' | 'weak';
  rentalDemandScore: number; // 0-100
  
  buyerDemand: 'strong' | 'moderate' | 'weak';
  buyerDemandScore: number; // 0-100
  
  futureOutlook: 'positive' | 'neutral' | 'negative';
  futureOutlookScore: number; // 0-100
  
  factors: {
    positive: string[];
    negative: string[];
  };
}

export interface InvestmentQualityScore {
  // 総合スコア
  totalScore: number; // 0-100
  rating: 'S' | 'A' | 'B' | 'C' | 'D';
  
  // カテゴリ別スコア
  financialScore: number; // 財務指標 (NOI, 利回り, DSCR等)
  marketScore: number; // 市場ポジション
  locationScore: number; // 立地・資産性
  demandScore: number; // 需要予測
  riskScore: number; // リスク評価（低いほど良い）
  
  // スコア内訳の詳細
  breakdown: {
    category: string;
    score: number;
    weight: number;
    factors: string[];
  }[];
}

export interface ComprehensiveAnalysisResult {
  // メタ情報
  analyzedAt: string;
  propertyId?: string;
  propertyName: string;
  propertyType: 'residential' | 'investment';
  
  // 市場コンテキスト
  marketContext: MarketContext;
  
  // 人口統計コンテキスト
  demographicContext: DemographicContext;
  
  // 財務分析（収益用物件の場合）
  financialAnalysis?: {
    noi: number;
    grossYield: number;
    netYield: number;
    dscr: number;
    ltv: number;
    ccr: number;
    ber: number;
    monthlyCashFlow: number;
    annualCashFlow: number;
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  };
  
  // 価格評価（実需用物件の場合）
  priceEvaluation?: {
    estimatedPrice: number;
    pricePerSquareMeter: number;
    confidence: 'high' | 'medium' | 'low';
    comparableCount: number;
    priceRange: { min: number; max: number };
    
    costApproach?: {
      landValue: number;
      buildingValue: number;
      totalValue: number;
      depreciationRate: number;
    };
    
    assetScore?: {
      totalScore: number;
      rating: 'S' | 'A' | 'B' | 'C' | 'D';
      strengths: string[];
      weaknesses: string[];
    };
  };
  
  // 市場ポジション分析
  marketPosition: MarketPositionAnalysis;
  
  // 需要予測
  demandForecast: DemandForecast;
  
  // 統合品質スコア
  investmentQuality: InvestmentQualityScore;
  
  // AI分析結果
  aiAnalysis: {
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
  };
  
  // 投資シミュレーション（収益用物件の場合）
  investmentSimulation?: {
    projections: Array<{
      year: number;
      grossIncome: number;
      totalExpenses: number;
      noi: number;
      cashFlow: number;
      cumulativeCashFlow: number;
      propertyValue: number;
      equity: number;
      roi: number;
    }>;
    summary: {
      totalCashFlow: number;
      averageAnnualCashFlow: number;
      totalROI: number;
      irr: number;
    };
  };
  
  // 総合推奨
  finalRecommendation: {
    action: 'buy' | 'consider' | 'avoid';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string[];
    targetPrice?: number;
    expectedReturn?: number;
    keyRisks: string[];
    keyOpportunities: string[];
  };
}

// ==================== Main Analyzer Class ====================

export class ComprehensivePropertyAnalyzer {
  private reinfolibClient: ReinfolibClient;
  private estatClient: EStatClient;
  private aiAnalyzer: AIMarketAnalyzer;
  
  constructor(
    reinfolibApiKey: string,
    estatApiKey: string,
    openaiApiKey: string
  ) {
    this.reinfolibClient = new ReinfolibClient(reinfolibApiKey);
    this.estatClient = new EStatClient({ apiKey: estatApiKey });
    this.aiAnalyzer = new AIMarketAnalyzer(openaiApiKey);
  }
  
  /**
   * メイン分析エントリポイント
   */
  async analyze(property: PropertyInput): Promise<ComprehensiveAnalysisResult> {
    console.log(`[ComprehensiveAnalyzer] Starting analysis for: ${property.name}`);
    
    // ステップ1: 市場データ取得
    const marketContext = await this.gatherMarketData(property);
    
    // ステップ2: 人口統計データ取得
    const demographicContext = await this.gatherDemographicData(property);
    
    // ステップ3: 財務分析 or 価格評価
    let financialAnalysis: any = undefined;
    let priceEvaluation: any = undefined;
    
    if (property.propertyType === 'investment') {
      financialAnalysis = this.performFinancialAnalysis(property);
    } else {
      priceEvaluation = this.performPriceEvaluation(property, marketContext);
    }
    
    // ステップ4: 市場ポジション分析
    const marketPosition = this.analyzeMarketPosition(
      property,
      marketContext,
      financialAnalysis
    );
    
    // ステップ5: 需要予測
    const demandForecast = this.forecastDemand(
      marketContext,
      demographicContext
    );
    
    // ステップ6: 統合品質スコア算出
    const investmentQuality = this.calculateInvestmentQuality(
      property,
      financialAnalysis,
      priceEvaluation,
      marketPosition,
      demandForecast
    );
    
    // ステップ7: AI分析
    const aiAnalysis = await this.performAIAnalysis(
      property,
      marketContext,
      demographicContext,
      financialAnalysis,
      priceEvaluation
    );
    
    // ステップ8: 投資シミュレーション（収益用物件の場合）
    let investmentSimulation: any = undefined;
    if (property.propertyType === 'investment' && property.monthlyRent) {
      investmentSimulation = this.runInvestmentSimulation(property);
    }
    
    // ステップ9: 総合推奨の生成
    const finalRecommendation = this.generateFinalRecommendation(
      investmentQuality,
      aiAnalysis,
      marketPosition,
      demandForecast
    );
    
    console.log(`[ComprehensiveAnalyzer] Analysis completed`);
    
    return {
      analyzedAt: new Date().toISOString(),
      propertyId: property.id,
      propertyName: property.name,
      propertyType: property.propertyType,
      marketContext,
      demographicContext,
      financialAnalysis,
      priceEvaluation,
      marketPosition,
      demandForecast,
      investmentQuality,
      aiAnalysis,
      investmentSimulation,
      finalRecommendation,
    };
  }
  
  // ==================== Private Methods ====================
  
  /**
   * 市場データの収集
   */
  private async gatherMarketData(property: PropertyInput): Promise<MarketContext> {
    console.log('[ComprehensiveAnalyzer] Gathering market data...');
    
    try {
      // 市場動向分析
      const marketAnalysis = await this.reinfolibClient.analyzeMarket({
        year: new Date().getFullYear(),
        area: property.prefCode,
        city: property.cityCode,
      });
      
      // 類似物件取引事例
      const comparables = await this.reinfolibClient.getNearbyComparables({
        city: property.cityCode || property.prefCode,
        propertyType: this.mapPropertyType(property.propertyType),
        minArea: property.area * 0.8,
        maxArea: property.area * 1.2,
        limit: 20,
      });
      
      // 地価公示データ
      const landPriceData = await this.reinfolibClient.getLandPrices({
        year: new Date().getFullYear(),
        area: property.prefCode,
        division: '00',
      });
      
      // 過去3年分の地価データを取得
      const currentYear = new Date().getFullYear();
      const landPrices: LandPriceData[] = [];
      for (let year = currentYear - 2; year <= currentYear; year++) {
        try {
          const data = await this.reinfolibClient.getLandPrices({
            year,
            area: property.prefCode,
            division: '00',
          });
          if (data.data && data.data.length > 0) {
            const avgPrice = data.data.reduce((sum: number, item: any) => 
              sum + (parseInt(item.L01_022) || 0), 0) / data.data.length;
            landPrices.push({
              year,
              pricePerSquareMeter: avgPrice,
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch land price for year ${year}:`, error);
        }
      }
      
      const landPriceTrend = analyzeLandPriceTrend(landPrices);
      
      return {
        averagePrice: marketAnalysis.averagePrice,
        averagePricePerSqm: marketAnalysis.averagePricePerSquareMeter,
        transactionCount: marketAnalysis.transactionCount,
        priceRange: marketAnalysis.priceRange,
        priceTrend: (marketAnalysis as any).pricetrend || marketAnalysis.pricetrend,
        popularPropertyTypes: marketAnalysis.popularPropertyTypes,
        comparables: this.convertToComparableProperties(comparables),
        landPrices,
        currentLandPrice: landPriceTrend.currentPrice,
        landPriceTrend: landPriceTrend.trend,
      };
    } catch (error) {
      console.error('[ComprehensiveAnalyzer] Error gathering market data:', error);
      throw new Error('市場データの取得に失敗しました');
    }
  }
  
  /**
   * 人口統計データの収集
   */
  private async gatherDemographicData(property: PropertyInput): Promise<DemographicContext> {
    console.log('[ComprehensiveAnalyzer] Gathering demographic data...');
    
    try {
      const populationData = await this.estatClient.getPopulationData(
        property.prefCode,
        property.cityCode
      );
      
      return {
        totalPopulation: (populationData as any).totalPopulation || 0,
        populationChange: (populationData as any).populationChangeRate || 0,
        households: (populationData as any).households || 0,
        averageHouseholdSize: (populationData as any).averageHouseholdSize || 2.5,
        ageDistribution: (populationData as any).ageDistribution || {
          '0-14': 12,
          '15-64': 65,
          '65+': 23,
        },
        populationDensity: (populationData as any).populationDensity || 0,
      };
    } catch (error) {
      console.error('[ComprehensiveAnalyzer] Error gathering demographic data:', error);
      // デフォルト値を返す
      return {
        totalPopulation: 100000,
        populationChange: 0,
        households: 45000,
        averageHouseholdSize: 2.5,
        ageDistribution: {
          '0-14': 12,
          '15-64': 65,
          '65+': 23,
        },
        populationDensity: 5000,
      };
    }
  }
  
  /**
   * 財務分析（収益用物件）
   */
  private performFinancialAnalysis(property: PropertyInput) {
    if (!property.grossIncome || !property.effectiveIncome || !property.operatingExpenses) {
      return undefined;
    }
    
    return analyzeProperty({
      propertyPrice: property.price,
      grossIncome: property.grossIncome,
      effectiveIncome: property.effectiveIncome,
      operatingExpenses: property.operatingExpenses,
      loanAmount: property.loanAmount || 0,
      interestRate: property.interestRate || 0,
      loanTermYears: property.loanTermYears || 0,
      downPayment: property.downPayment || property.price,
    });
  }
  
  /**
   * 価格評価（実需用物件）
   */
  private performPriceEvaluation(property: PropertyInput, marketContext: MarketContext) {
    const targetProperty = {
      area: property.area,
      age: property.age,
      distanceFromStation: property.distanceFromStation,
      location: property.location,
    };
    
    const comparisonAnalysis = estimatePriceByComparison(
      targetProperty,
      marketContext.comparables
    );
    
    let costApproach: any = undefined;
    if (property.structure && property.totalFloorArea && property.landArea) {
      const buildingSpec: BuildingSpecification = {
        structure: property.structure,
        totalFloorArea: property.totalFloorArea,
        age: property.age,
        landArea: property.landArea,
        landPricePerSquareMeter: marketContext.currentLandPrice,
      };
      costApproach = evaluateByCostApproach(buildingSpec);
    }
    
    // 資産性スコア（簡易版）
    const assetFactors: AssetEvaluationFactors = {
      locationScore: 75, // デフォルト値（後で改善可能）
      accessibilityScore: Math.max(0, 100 - property.distanceFromStation * 5),
      neighborhoodScore: 70,
      buildingQualityScore: Math.max(0, 100 - property.age * 2),
      futureProspectScore: marketContext.landPriceTrend === 'rising' ? 80 : 60,
      liquidityScore: 70,
    };
    const assetScore = calculateAssetScore(assetFactors);
    
    return {
      ...comparisonAnalysis,
      costApproach,
      assetScore,
    };
  }
  
  /**
   * 市場ポジション分析
   */
  private analyzeMarketPosition(
    property: PropertyInput,
    marketContext: MarketContext,
    financialAnalysis: any
  ): MarketPositionAnalysis {
    const pricePerSqm = property.price / property.area;
    const marketAvgPerSqm = marketContext.averagePricePerSqm;
    
    // 価格ポジション
    const priceVsMarketAverage = ((pricePerSqm - marketAvgPerSqm) / marketAvgPerSqm) * 100;
    const priceVsMedian = ((property.price - marketContext.priceRange.median) / 
                           marketContext.priceRange.median) * 100;
    
    let pricePosition: 'high' | 'average' | 'low';
    if (priceVsMarketAverage > 10) {
      pricePosition = 'high';
    } else if (priceVsMarketAverage < -10) {
      pricePosition = 'low';
    } else {
      pricePosition = 'average';
    }
    
    // 価格パーセンタイル（簡易計算）
    const pricePercentile = Math.min(100, Math.max(0, 
      50 + (priceVsMarketAverage / 2)
    ));
    
    // 利回りポジション（収益物件の場合）
    let yieldPosition: 'high' | 'average' | 'low' | undefined;
    let yieldVsMarketAverage: number | undefined;
    
    if (financialAnalysis && financialAnalysis.netYield) {
      const marketAvgYield = 5.0; // 市場平均利回り（仮）
      yieldVsMarketAverage = financialAnalysis.netYield - marketAvgYield;
      
      if (yieldVsMarketAverage > 1) {
        yieldPosition = 'high';
      } else if (yieldVsMarketAverage < -1) {
        yieldPosition = 'low';
      } else {
        yieldPosition = 'average';
      }
    }
    
    // 競争力評価
    const competitiveness: 'strong' | 'moderate' | 'weak' = 
      (pricePosition === 'low' || yieldPosition === 'high') ? 'strong' :
      (pricePosition === 'high' || yieldPosition === 'low') ? 'weak' :
      'moderate';
    
    // 理由
    const reasoning: string[] = [];
    if (pricePosition === 'low') {
      reasoning.push(`市場平均より${Math.abs(priceVsMarketAverage).toFixed(1)}%安い価格設定`);
    } else if (pricePosition === 'high') {
      reasoning.push(`市場平均より${priceVsMarketAverage.toFixed(1)}%高い価格設定`);
    }
    
    if (yieldPosition === 'high') {
      reasoning.push(`市場平均より${yieldVsMarketAverage?.toFixed(1)}%高い利回り`);
    } else if (yieldPosition === 'low') {
      reasoning.push(`市場平均より利回りが低い`);
    }
    
    if (property.distanceFromStation <= 5) {
      reasoning.push('駅近で立地条件が良好');
    }
    
    if (property.age <= 5) {
      reasoning.push('築浅で建物状態が良好');
    }
    
    return {
      pricePosition,
      pricePercentile,
      priceVsMarketAverage,
      priceVsMedian,
      yieldPosition,
      yieldVsMarketAverage,
      competitiveness,
      reasoning,
    };
  }
  
  /**
   * 需要予測
   */
  private forecastDemand(
    marketContext: MarketContext,
    demographicContext: DemographicContext
  ): DemandForecast {
    // 賃貸需要スコア
    let rentalDemandScore = 50;
    
    // 人口増加率
    if (demographicContext.populationChange > 1) {
      rentalDemandScore += 15;
    } else if (demographicContext.populationChange < -1) {
      rentalDemandScore -= 15;
    }
    
    // 生産年齢人口比率
    if (demographicContext.ageDistribution['15-64'] > 65) {
      rentalDemandScore += 10;
    } else if (demographicContext.ageDistribution['15-64'] < 60) {
      rentalDemandScore -= 10;
    }
    
    // 取引件数
    if (marketContext.transactionCount > 100) {
      rentalDemandScore += 10;
    } else if (marketContext.transactionCount < 30) {
      rentalDemandScore -= 10;
    }
    
    const rentalDemand: 'strong' | 'moderate' | 'weak' = 
      rentalDemandScore >= 70 ? 'strong' :
      rentalDemandScore >= 50 ? 'moderate' : 'weak';
    
    // 購入需要スコア
    let buyerDemandScore = 50;
    
    // 価格トレンド
    if (marketContext.priceTrend.changeRate > 3) {
      buyerDemandScore += 15;
    } else if (marketContext.priceTrend.changeRate < -3) {
      buyerDemandScore -= 15;
    }
    
    // 地価トレンド
    if (marketContext.landPriceTrend === 'rising') {
      buyerDemandScore += 10;
    } else if (marketContext.landPriceTrend === 'falling') {
      buyerDemandScore -= 10;
    }
    
    const buyerDemand: 'strong' | 'moderate' | 'weak' = 
      buyerDemandScore >= 70 ? 'strong' :
      buyerDemandScore >= 50 ? 'moderate' : 'weak';
    
    // 将来展望スコア
    const futureOutlookScore = Math.round((rentalDemandScore + buyerDemandScore) / 2);
    const futureOutlook: 'positive' | 'neutral' | 'negative' = 
      futureOutlookScore >= 70 ? 'positive' :
      futureOutlookScore >= 50 ? 'neutral' : 'negative';
    
    // 要因
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
    };
    
    if (demographicContext.populationChange > 0) {
      factors.positive.push(`人口増加率 ${demographicContext.populationChange.toFixed(1)}%`);
    } else if (demographicContext.populationChange < -1) {
      factors.negative.push(`人口減少率 ${Math.abs(demographicContext.populationChange).toFixed(1)}%`);
    }
    
    if (marketContext.priceTrend.changeRate > 0) {
      factors.positive.push(`価格上昇トレンド ${marketContext.priceTrend.changeRate.toFixed(1)}%`);
    } else if (marketContext.priceTrend.changeRate < -3) {
      factors.negative.push(`価格下落トレンド ${marketContext.priceTrend.changeRate.toFixed(1)}%`);
    }
    
    if (marketContext.landPriceTrend === 'rising') {
      factors.positive.push('地価上昇傾向');
    } else if (marketContext.landPriceTrend === 'falling') {
      factors.negative.push('地価下落傾向');
    }
    
    if (demographicContext.ageDistribution['15-64'] > 65) {
      factors.positive.push('生産年齢人口比率が高い');
    } else if (demographicContext.ageDistribution['65+'] > 30) {
      factors.negative.push('高齢化率が高い');
    }
    
    return {
      rentalDemand,
      rentalDemandScore,
      buyerDemand,
      buyerDemandScore,
      futureOutlook,
      futureOutlookScore,
      factors,
    };
  }
  
  /**
   * 統合品質スコア算出
   */
  private calculateInvestmentQuality(
    property: PropertyInput,
    financialAnalysis: any,
    priceEvaluation: any,
    marketPosition: MarketPositionAnalysis,
    demandForecast: DemandForecast
  ): InvestmentQualityScore {
    const breakdown = [];
    
    // 財務スコア（収益用物件の場合）
    let financialScore = 50;
    if (financialAnalysis) {
      financialScore = 0;
      
      // 利回り評価（30点満点）
      if (financialAnalysis.netYield >= 8) financialScore += 30;
      else if (financialAnalysis.netYield >= 6) financialScore += 20;
      else if (financialAnalysis.netYield >= 4) financialScore += 10;
      
      // DSCR評価（25点満点）
      if (financialAnalysis.dscr >= 1.5) financialScore += 25;
      else if (financialAnalysis.dscr >= 1.2) financialScore += 15;
      else if (financialAnalysis.dscr >= 1.0) financialScore += 5;
      
      // LTV評価（20点満点）
      if (financialAnalysis.ltv <= 60) financialScore += 20;
      else if (financialAnalysis.ltv <= 75) financialScore += 10;
      
      // キャッシュフロー評価（25点満点）
      if (financialAnalysis.monthlyCashFlow > 100000) financialScore += 25;
      else if (financialAnalysis.monthlyCashFlow > 50000) financialScore += 15;
      else if (financialAnalysis.monthlyCashFlow > 0) financialScore += 5;
      
      breakdown.push({
        category: '財務指標',
        score: financialScore,
        weight: 0.35,
        factors: [
          `実質利回り: ${financialAnalysis.netYield.toFixed(2)}%`,
          `DSCR: ${financialAnalysis.dscr.toFixed(2)}`,
          `LTV: ${financialAnalysis.ltv.toFixed(1)}%`,
          `月次CF: ${Math.round(financialAnalysis.monthlyCashFlow).toLocaleString()}円`,
        ],
      });
    } else if (priceEvaluation && priceEvaluation.assetScore) {
      // 実需用物件の場合は資産性スコアを使用
      financialScore = priceEvaluation.assetScore.totalScore;
      breakdown.push({
        category: '資産性評価',
        score: financialScore,
        weight: 0.35,
        factors: [
          `総合評価: ${priceEvaluation.assetScore.rating}ランク`,
          ...priceEvaluation.assetScore.strengths.map((s: string) => `強み: ${s}`),
        ],
      });
    }
    
    // 市場スコア
    let marketScore = 50;
    if (marketPosition.competitiveness === 'strong') marketScore = 80;
    else if (marketPosition.competitiveness === 'weak') marketScore = 30;
    
    // 価格ポジションボーナス
    if (marketPosition.pricePosition === 'low') marketScore += 10;
    else if (marketPosition.pricePosition === 'high') marketScore -= 10;
    
    marketScore = Math.min(100, Math.max(0, marketScore));
    
    breakdown.push({
      category: '市場ポジション',
      score: marketScore,
      weight: 0.25,
      factors: marketPosition.reasoning,
    });
    
    // 立地スコア（簡易）
    let locationScore = 50;
    if (property.distanceFromStation <= 5) locationScore += 30;
    else if (property.distanceFromStation <= 10) locationScore += 15;
    
    if (property.age <= 5) locationScore += 10;
    else if (property.age >= 20) locationScore -= 10;
    
    locationScore = Math.min(100, Math.max(0, locationScore));
    
    breakdown.push({
      category: '立地・物件品質',
      score: locationScore,
      weight: 0.20,
      factors: [
        `駅距離: 徒歩${property.distanceFromStation}分`,
        `築年数: ${property.age}年`,
      ],
    });
    
    // 需要スコア
    const demandScore = demandForecast.futureOutlookScore;
    breakdown.push({
      category: '需要予測',
      score: demandScore,
      weight: 0.15,
      factors: [
        ...demandForecast.factors.positive.map(f => `✓ ${f}`),
        ...demandForecast.factors.negative.map(f => `⚠ ${f}`),
      ],
    });
    
    // リスクスコア
    let riskScore = 50;
    if (financialAnalysis) {
      if (financialAnalysis.riskLevel === 'low') riskScore = 80;
      else if (financialAnalysis.riskLevel === 'high') riskScore = 20;
    }
    
    breakdown.push({
      category: 'リスク評価',
      score: riskScore,
      weight: 0.05,
      factors: financialAnalysis?.riskFactors || ['通常範囲'],
    });
    
    // 総合スコア計算（重み付き平均）
    const totalScore = Math.round(
      financialScore * 0.35 +
      marketScore * 0.25 +
      locationScore * 0.20 +
      demandScore * 0.15 +
      riskScore * 0.05
    );
    
    // レーティング
    let rating: 'S' | 'A' | 'B' | 'C' | 'D';
    if (totalScore >= 90) rating = 'S';
    else if (totalScore >= 75) rating = 'A';
    else if (totalScore >= 60) rating = 'B';
    else if (totalScore >= 45) rating = 'C';
    else rating = 'D';
    
    return {
      totalScore,
      rating,
      financialScore,
      marketScore,
      locationScore,
      demandScore,
      riskScore,
      breakdown,
    };
  }
  
  /**
   * AI分析の実行
   */
  private async performAIAnalysis(
    property: PropertyInput,
    marketContext: MarketContext,
    demographicContext: DemographicContext,
    financialAnalysis: any,
    priceEvaluation: any
  ) {
    const marketData = {
      area: property.location,
      areaName: property.location,
      population: demographicContext.totalPopulation,
      averagePrice: marketContext.averagePrice,
      transactionCount: marketContext.transactionCount,
      pricePerSqm: marketContext.averagePricePerSqm,
      popularPropertyTypes: marketContext.popularPropertyTypes,
      priceTrend: marketContext.priceTrend,
      demographics: demographicContext,
    };
    
    const propertyData = {
      name: property.name,
      price: property.price,
      location: property.location,
      propertyType: property.propertyType === 'investment' ? '収益物件' : '実需物件',
      area: property.area,
      buildingYear: `築${property.age}年`,
      noi: financialAnalysis?.noi,
      yield: financialAnalysis?.netYield || priceEvaluation?.pricePerSquareMeter / property.price * 100,
    };
    
    return await this.aiAnalyzer.analyzeProperty(propertyData, marketData);
  }
  
  /**
   * 投資シミュレーション実行
   */
  private runInvestmentSimulation(property: PropertyInput) {
    if (!property.monthlyRent) return undefined;
    
    const simulator = new InvestmentSimulator();
    
    const result = simulator.simulate({
      propertyPrice: property.price,
      downPayment: property.downPayment || property.price * 0.2,
      loanAmount: property.loanAmount || property.price * 0.8,
      interestRate: property.interestRate || 2.5,
      loanTerm: property.loanTermYears || 30,
      monthlyRent: property.monthlyRent,
      occupancyRate: property.occupancyRate || 95,
      annualIncreaseRate: 1.0,
      managementFeeRate: 5.0,
      repairReserveRate: 3.0,
      propertyTaxRate: 1.4,
      insuranceCost: 50000,
      otherExpenses: 100000,
      simulationYears: 10,
    });
    
    return result;
  }
  
  /**
   * 最終推奨の生成
   */
  private generateFinalRecommendation(
    investmentQuality: InvestmentQualityScore,
    aiAnalysis: any,
    marketPosition: MarketPositionAnalysis,
    demandForecast: DemandForecast
  ) {
    let action: 'buy' | 'consider' | 'avoid';
    let confidence: 'high' | 'medium' | 'low';
    
    // スコアベースの判定
    if (investmentQuality.totalScore >= 75) {
      action = 'buy';
      confidence = investmentQuality.totalScore >= 85 ? 'high' : 'medium';
    } else if (investmentQuality.totalScore >= 60) {
      action = 'consider';
      confidence = 'medium';
    } else {
      action = 'avoid';
      confidence = investmentQuality.totalScore <= 45 ? 'high' : 'medium';
    }
    
    // 理由の収集
    const reasoning: string[] = [];
    
    if (investmentQuality.totalScore >= 75) {
      reasoning.push(`総合スコア${investmentQuality.rating}ランク（${investmentQuality.totalScore}点）で優良物件`);
    } else if (investmentQuality.totalScore <= 50) {
      reasoning.push(`総合スコア${investmentQuality.rating}ランク（${investmentQuality.totalScore}点）でリスクが高い`);
    }
    
    if (marketPosition.competitiveness === 'strong') {
      reasoning.push('市場競争力が高く、相対的に割安');
    } else if (marketPosition.competitiveness === 'weak') {
      reasoning.push('市場競争力が低く、相対的に割高');
    }
    
    if (demandForecast.futureOutlook === 'positive') {
      reasoning.push('将来の需要見通しが良好');
    } else if (demandForecast.futureOutlook === 'negative') {
      reasoning.push('将来の需要見通しに懸念');
    }
    
    // AIの推奨も考慮
    if (aiAnalysis.scorecard.overallScore >= 75 && investmentQuality.totalScore >= 75) {
      confidence = 'high';
    }
    
    // キーリスクとキーオポチュニティ
    const keyRisks = [
      ...investmentQuality.breakdown
        .filter(b => b.score < 50)
        .map(b => `${b.category}のスコアが低い`),
      ...aiAnalysis.concerns.slice(0, 3),
    ];
    
    const keyOpportunities = [
      ...investmentQuality.breakdown
        .filter(b => b.score >= 75)
        .map(b => `${b.category}のスコアが高い`),
      ...aiAnalysis.opportunities.slice(0, 3),
    ];
    
    return {
      action,
      confidence,
      reasoning,
      keyRisks,
      keyOpportunities,
    };
  }
  
  // ==================== Helper Methods ====================
  
  private mapPropertyType(propertyType: string): string {
    if (propertyType === 'investment') return '中古マンション等';
    return '中古マンション等';
  }
  
  private convertToComparableProperties(comparablesData: any[]): ComparableProperty[] {
    return comparablesData.map((item: any) => ({
      price: parseFloat(item.TradePrice) || 0,
      area: parseFloat(item.Area) || 0,
      age: this.calculateAge(item.BuildingYear || ''),
      distanceFromStation: parseFloat(item.TimeToNearestStation) || 10,
      transactionDate: `${item.Year}-${item.Quarter}`,
      location: item.Municipality || '',
    }));
  }
  
  private calculateAge(buildingYear: string): number {
    const match = buildingYear.match(/(\d{4})/);
    if (match) {
      const year = parseInt(match[1]);
      // 和暦を西暦に変換（簡易）
      if (buildingYear.includes('令和')) {
        return new Date().getFullYear() - (2018 + year);
      } else if (buildingYear.includes('平成')) {
        return new Date().getFullYear() - (1988 + year);
      } else if (buildingYear.includes('昭和')) {
        return new Date().getFullYear() - (1925 + year);
      }
      return new Date().getFullYear() - year;
    }
    return 10; // デフォルト
  }
}
