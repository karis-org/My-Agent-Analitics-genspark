// Residential Property Evaluation Engine
// 実需用不動産の資産性評価エンジン

/**
 * 取引事例比較法による評価
 * Comparative Market Analysis (CMA)
 */
export interface ComparableProperty {
  price: number;              // 成約価格
  area: number;               // 面積（㎡）
  age: number;                // 築年数
  distanceFromStation: number; // 駅距離（分）
  transactionDate: string;    // 取引時期
  location: string;           // 所在地
}

export interface PropertyForEvaluation {
  area: number;
  age: number;
  distanceFromStation: number;
  location: string;
}

/**
 * 取引事例比較法による価格推定
 */
export function estimatePriceByComparison(
  targetProperty: PropertyForEvaluation,
  comparables: ComparableProperty[]
): {
  estimatedPrice: number;
  pricePerSquareMeter: number;
  confidence: 'high' | 'medium' | 'low';
  comparableCount: number;
  priceRange: { min: number; max: number };
} {
  if (comparables.length === 0) {
    return {
      estimatedPrice: 0,
      pricePerSquareMeter: 0,
      confidence: 'low',
      comparableCount: 0,
      priceRange: { min: 0, max: 0 }
    };
  }

  // 各比較事例の単価を計算し、補正を適用
  const adjustedPrices = comparables.map(comp => {
    const baseUnitPrice = comp.price / comp.area;
    
    // 時点補正（簡易版：6ヶ月で2%上昇と仮定）
    const monthsSinceTransaction = calculateMonthsSince(comp.transactionDate);
    const timeAdjustment = 1 + (monthsSinceTransaction / 6) * 0.02;
    
    // 築年数補正（築年差1年につき±1%）
    const ageDiff = comp.age - targetProperty.age;
    const ageAdjustment = 1 - (ageDiff * 0.01);
    
    // 駅距離補正（駅距離差1分につき±0.5%）
    const distanceDiff = comp.distanceFromStation - targetProperty.distanceFromStation;
    const distanceAdjustment = 1 - (distanceDiff * 0.005);
    
    // 補正後の単価
    return baseUnitPrice * timeAdjustment * ageAdjustment * distanceAdjustment;
  });

  // 平均単価を算出（外れ値除去：上下10%カット）
  const sortedPrices = [...adjustedPrices].sort((a, b) => a - b);
  const trimCount = Math.floor(sortedPrices.length * 0.1);
  const trimmedPrices = sortedPrices.slice(trimCount, sortedPrices.length - trimCount);
  
  const averageUnitPrice = trimmedPrices.reduce((a, b) => a + b, 0) / trimmedPrices.length;
  const estimatedPrice = averageUnitPrice * targetProperty.area;

  // 信頼度の判定
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (comparables.length >= 10) {
    confidence = 'high';
  } else if (comparables.length >= 5) {
    confidence = 'medium';
  }

  // 価格レンジの算出
  const minUnitPrice = Math.min(...adjustedPrices);
  const maxUnitPrice = Math.max(...adjustedPrices);

  return {
    estimatedPrice: Math.round(estimatedPrice),
    pricePerSquareMeter: Math.round(averageUnitPrice),
    confidence,
    comparableCount: comparables.length,
    priceRange: {
      min: Math.round(minUnitPrice * targetProperty.area),
      max: Math.round(maxUnitPrice * targetProperty.area)
    }
  };
}

/**
 * 原価法による評価
 * Cost Approach
 */
export interface BuildingSpecification {
  structure: 'RC' | 'SRC' | 'Steel' | 'Wood'; // 構造
  totalFloorArea: number;                      // 延床面積（㎡）
  age: number;                                 // 築年数
  landArea: number;                            // 土地面積（㎡）
  landPricePerSquareMeter: number;            // 土地単価（円/㎡）
}

/**
 * 原価法による評価
 */
export function evaluateByCostApproach(spec: BuildingSpecification): {
  landValue: number;
  buildingValue: number;
  totalValue: number;
  depreciationRate: number;
} {
  // 土地の評価額
  const landValue = spec.landArea * spec.landPricePerSquareMeter;

  // 構造別の再調達原価（円/㎡）
  const reconstructionCosts = {
    'RC': 250000,    // 鉄筋コンクリート造
    'SRC': 280000,   // 鉄骨鉄筋コンクリート造
    'Steel': 220000, // 鉄骨造
    'Wood': 180000   // 木造
  };

  // 構造別の耐用年数
  const usefulLifeYears = {
    'RC': 47,
    'SRC': 47,
    'Steel': 34,
    'Wood': 22
  };

  const reconstructionCost = reconstructionCosts[spec.structure];
  const usefulLife = usefulLifeYears[spec.structure];

  // 減価率の計算（定額法）
  const depreciationRate = Math.min(spec.age / usefulLife, 1);
  
  // 建物の評価額
  const buildingReconstructionValue = spec.totalFloorArea * reconstructionCost;
  const buildingValue = buildingReconstructionValue * (1 - depreciationRate);

  return {
    landValue: Math.round(landValue),
    buildingValue: Math.round(buildingValue),
    totalValue: Math.round(landValue + buildingValue),
    depreciationRate: Math.round(depreciationRate * 100) / 100
  };
}

/**
 * 地価推移分析
 * Land Price Trend Analysis
 */
export interface LandPriceData {
  year: number;
  pricePerSquareMeter: number;
}

/**
 * 地価推移の分析
 */
export function analyzeLandPriceTrend(priceHistory: LandPriceData[]): {
  currentPrice: number;
  averageAnnualGrowthRate: number;
  trend: 'rising' | 'stable' | 'falling';
  projectedPrice5Years: number;
} {
  if (priceHistory.length < 2) {
    return {
      currentPrice: priceHistory[0]?.pricePerSquareMeter || 0,
      averageAnnualGrowthRate: 0,
      trend: 'stable',
      projectedPrice5Years: priceHistory[0]?.pricePerSquareMeter || 0
    };
  }

  const sortedData = [...priceHistory].sort((a, b) => a.year - b.year);
  const oldestPrice = sortedData[0].pricePerSquareMeter;
  const latestPrice = sortedData[sortedData.length - 1].pricePerSquareMeter;
  const years = sortedData[sortedData.length - 1].year - sortedData[0].year;

  // 平均年間成長率（CAGR）
  const cagr = Math.pow(latestPrice / oldestPrice, 1 / years) - 1;

  // トレンドの判定
  let trend: 'rising' | 'stable' | 'falling' = 'stable';
  if (cagr > 0.02) {
    trend = 'rising';
  } else if (cagr < -0.02) {
    trend = 'falling';
  }

  // 5年後の予測価格
  const projectedPrice5Years = latestPrice * Math.pow(1 + cagr, 5);

  return {
    currentPrice: latestPrice,
    averageAnnualGrowthRate: Math.round(cagr * 10000) / 100,
    trend,
    projectedPrice5Years: Math.round(projectedPrice5Years)
  };
}

/**
 * 総合資産性スコアの算出
 * Overall Asset Value Score
 */
export interface AssetEvaluationFactors {
  locationScore: number;          // 立地スコア (0-100)
  accessibilityScore: number;     // アクセススコア (0-100)
  neighborhoodScore: number;      // 周辺環境スコア (0-100)
  buildingQualityScore: number;   // 建物品質スコア (0-100)
  futureProspectScore: number;    // 将来性スコア (0-100)
  liquidityScore: number;         // 流動性スコア (0-100)
}

/**
 * 総合資産性スコアの計算
 */
export function calculateAssetScore(factors: AssetEvaluationFactors): {
  totalScore: number;
  rating: 'S' | 'A' | 'B' | 'C' | 'D';
  strengths: string[];
  weaknesses: string[];
} {
  // 重み付き平均
  const weights = {
    locationScore: 0.25,
    accessibilityScore: 0.20,
    neighborhoodScore: 0.15,
    buildingQualityScore: 0.15,
    futureProspectScore: 0.15,
    liquidityScore: 0.10
  };

  const totalScore = 
    factors.locationScore * weights.locationScore +
    factors.accessibilityScore * weights.accessibilityScore +
    factors.neighborhoodScore * weights.neighborhoodScore +
    factors.buildingQualityScore * weights.buildingQualityScore +
    factors.futureProspectScore * weights.futureProspectScore +
    factors.liquidityScore * weights.liquidityScore;

  // レーティングの判定
  let rating: 'S' | 'A' | 'B' | 'C' | 'D';
  if (totalScore >= 90) rating = 'S';
  else if (totalScore >= 75) rating = 'A';
  else if (totalScore >= 60) rating = 'B';
  else if (totalScore >= 45) rating = 'C';
  else rating = 'D';

  // 強み・弱みの分析
  const scores = [
    { name: '立地', value: factors.locationScore },
    { name: 'アクセス', value: factors.accessibilityScore },
    { name: '周辺環境', value: factors.neighborhoodScore },
    { name: '建物品質', value: factors.buildingQualityScore },
    { name: '将来性', value: factors.futureProspectScore },
    { name: '流動性', value: factors.liquidityScore }
  ];

  const strengths = scores
    .filter(s => s.value >= 80)
    .map(s => s.name);

  const weaknesses = scores
    .filter(s => s.value < 50)
    .map(s => s.name);

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    rating,
    strengths,
    weaknesses
  };
}

/**
 * Helper function: Calculate months since a date
 */
function calculateMonthsSince(dateString: string): number {
  const transactionDate = new Date(dateString);
  const now = new Date();
  const months = 
    (now.getFullYear() - transactionDate.getFullYear()) * 12 +
    (now.getMonth() - transactionDate.getMonth());
  return months;
}
