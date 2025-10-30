// Property investigation utilities
// 役所調査・事故物件調査機能

/**
 * 都市計画情報
 */
export interface UrbanPlanningInfo {
  useDistrict: string; // 用途地域
  buildingCoverageRatio: number; // 建ぺい率
  floorAreaRatio: number; // 容積率
  firePreventionDistrict: string; // 防火地域
  heightRestriction: string | null; // 高さ制限
  scenicDistrictRestriction: string | null; // 景観地区制限
  districtPlanRestriction: string | null; // 地区計画制限
}

/**
 * ハザード情報
 */
export interface HazardInfo {
  floodRisk: 'none' | 'low' | 'medium' | 'high'; // 洪水リスク
  floodDepth: number | null; // 想定浸水深（m）
  landslideRisk: 'none' | 'low' | 'medium' | 'high'; // 土砂災害リスク
  liquefactionRisk: 'none' | 'low' | 'medium' | 'high'; // 液状化リスク
  earthquakeRisk: 'none' | 'low' | 'medium' | 'high'; // 地震リスク
  tsunamiRisk: 'none' | 'low' | 'medium' | 'high'; // 津波リスク
}

/**
 * 道路情報
 */
export interface RoadInfo {
  frontRoadType: '公道' | '私道' | '位置指定道路' | '建築基準法道路'; // 前面道路種別
  frontRoadWidth: number; // 前面道路幅員（m）
  roadSetbackRequired: boolean; // セットバック要否
  setbackDistance: number | null; // セットバック距離（m）
}

/**
 * 事故物件情報（心理的瑕疵）
 */
export interface AccidentPropertyInfo {
  hasAccident: boolean; // 事故物件か
  accidentType: '自殺' | '他殺' | '孤独死' | '火災' | 'その他' | null;
  accidentDate: string | null; // 事故発生日
  disclosureRequired: boolean; // 告知義務あり
  disclosureDetails: string | null; // 告知内容
  priceImpact: 'none' | 'low' | 'medium' | 'high'; // 価格への影響度
}

/**
 * 総合調査結果
 */
export interface PropertyInvestigationResult {
  address: string;
  urbanPlanning: UrbanPlanningInfo;
  hazards: HazardInfo;
  roads: RoadInfo;
  accident: AccidentPropertyInfo;
  investigationDate: string;
  investigator: string;
  notes: string[];
  warnings: string[];
  overallRisk: 'low' | 'medium' | 'high';
}

/**
 * 役所調査チェックリスト
 */
export const officialInvestigationChecklist = [
  {
    category: '都市計画',
    items: [
      { name: '都市計画区域/都市計画', status: 'pending', value: null, notes: '' },
      { name: '用途地域・建ぺい率・容積率', status: 'pending', value: null, notes: '' },
      { name: '防火・準防火地域', status: 'pending', value: null, notes: '' },
      { name: '高さ制限/日影規制', status: 'pending', value: null, notes: '' },
      { name: '地区計画の有無', status: 'pending', value: null, notes: '' },
      { name: '都市計画道路/事業', status: 'pending', value: null, notes: '' },
    ]
  },
  {
    category: '道路',
    items: [
      { name: '前面道路の認定状況/種別', status: 'pending', value: null, notes: '' },
      { name: '前面道路の幅員（最小）', status: 'pending', value: null, notes: '' },
      { name: '道路後退（セットバック）', status: 'pending', value: null, notes: '' },
    ]
  },
  {
    category: '災害',
    items: [
      { name: '洪水ハザード', status: 'pending', value: null, notes: '' },
      { name: '土砂ハザード', status: 'pending', value: null, notes: '' },
      { name: '液状化ハザード', status: 'pending', value: null, notes: '' },
    ]
  },
  {
    category: '法令',
    items: [
      { name: '建築確認/検査済証', status: 'pending', value: null, notes: '' },
      { name: '埋蔵文化財包蔵地', status: 'pending', value: null, notes: '' },
    ]
  },
];

/**
 * リスクレベルの評価
 */
export function assessOverallRisk(
  hazards: HazardInfo,
  accident: AccidentPropertyInfo,
  urbanPlanning: UrbanPlanningInfo
): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // ハザードリスク評価
  const hazardRisks = [
    hazards.floodRisk,
    hazards.landslideRisk,
    hazards.liquefactionRisk,
    hazards.earthquakeRisk,
    hazards.tsunamiRisk,
  ];
  
  hazardRisks.forEach(risk => {
    if (risk === 'high') riskScore += 3;
    else if (risk === 'medium') riskScore += 2;
    else if (risk === 'low') riskScore += 1;
  });
  
  // 事故物件リスク評価
  if (accident.hasAccident) {
    if (accident.priceImpact === 'high') riskScore += 5;
    else if (accident.priceImpact === 'medium') riskScore += 3;
    else if (accident.priceImpact === 'low') riskScore += 1;
  }
  
  // 建築制限リスク
  if (urbanPlanning.buildingCoverageRatio < 30) riskScore += 2;
  if (urbanPlanning.floorAreaRatio < 100) riskScore += 2;
  
  // 総合判定
  if (riskScore >= 10) return 'high';
  if (riskScore >= 5) return 'medium';
  return 'low';
}

/**
 * 事故物件データベース検索（モック実装）
 * 実際にはAPI連携が必要
 */
export async function searchAccidentProperty(address: string): Promise<AccidentPropertyInfo> {
  // モック実装 - 実際はAPI呼び出し
  // 例: 大島てる API、LIFULL HOME'S API など
  
  // ここでは仮のデータを返す
  return {
    hasAccident: false,
    accidentType: null,
    accidentDate: null,
    disclosureRequired: false,
    disclosureDetails: null,
    priceImpact: 'none',
  };
}

/**
 * e-Stat API を使った地域統計データ取得（モック実装）
 */
export async function fetchAreaStatistics(areaCode: string) {
  // モック実装 - 実際はe-Stat API呼び出し
  return {
    population: 0,
    households: 0,
    averageAge: 0,
    populationTrend: 'stable' as 'increasing' | 'stable' | 'decreasing',
  };
}

/**
 * 価格への影響を計算
 */
export function calculatePriceImpact(
  basePrice: number,
  accident: AccidentPropertyInfo,
  hazards: HazardInfo
): {
  adjustedPrice: number;
  discount: number;
  discountRate: number;
} {
  let totalDiscount = 0;
  
  // 事故物件による価格影響
  if (accident.hasAccident) {
    switch (accident.priceImpact) {
      case 'high':
        totalDiscount += basePrice * 0.30; // 30%割引
        break;
      case 'medium':
        totalDiscount += basePrice * 0.15; // 15%割引
        break;
      case 'low':
        totalDiscount += basePrice * 0.05; // 5%割引
        break;
    }
  }
  
  // ハザードリスクによる価格影響
  if (hazards.floodRisk === 'high') totalDiscount += basePrice * 0.10;
  else if (hazards.floodRisk === 'medium') totalDiscount += basePrice * 0.05;
  
  if (hazards.liquefactionRisk === 'high') totalDiscount += basePrice * 0.08;
  else if (hazards.liquefactionRisk === 'medium') totalDiscount += basePrice * 0.03;
  
  const adjustedPrice = basePrice - totalDiscount;
  const discountRate = (totalDiscount / basePrice) * 100;
  
  return {
    adjustedPrice,
    discount: totalDiscount,
    discountRate,
  };
}

/**
 * 役所調査レポート生成
 */
export function generateInvestigationReport(
  result: PropertyInvestigationResult
): string {
  const sections: string[] = [];
  
  sections.push('# 物件調査レポート\n');
  sections.push(`**調査日**: ${result.investigationDate}`);
  sections.push(`**調査者**: ${result.investigator}`);
  sections.push(`**所在地**: ${result.address}\n`);
  
  sections.push('## 都市計画情報');
  sections.push(`- 用途地域: ${result.urbanPlanning.useDistrict}`);
  sections.push(`- 建ぺい率: ${result.urbanPlanning.buildingCoverageRatio}%`);
  sections.push(`- 容積率: ${result.urbanPlanning.floorAreaRatio}%`);
  sections.push(`- 防火地域: ${result.urbanPlanning.firePreventionDistrict}\n`);
  
  sections.push('## ハザード情報');
  sections.push(`- 洪水リスク: ${result.hazards.floodRisk}`);
  sections.push(`- 土砂災害リスク: ${result.hazards.landslideRisk}`);
  sections.push(`- 液状化リスク: ${result.hazards.liquefactionRisk}\n`);
  
  sections.push('## 道路情報');
  sections.push(`- 前面道路種別: ${result.roads.frontRoadType}`);
  sections.push(`- 前面道路幅員: ${result.roads.frontRoadWidth}m\n`);
  
  if (result.accident.hasAccident) {
    sections.push('## ⚠️ 心理的瑕疵情報');
    sections.push(`- 事故種別: ${result.accident.accidentType}`);
    sections.push(`- 告知義務: ${result.accident.disclosureRequired ? 'あり' : 'なし'}\n`);
  }
  
  if (result.warnings.length > 0) {
    sections.push('## ⚠️ 注意事項');
    result.warnings.forEach(warning => {
      sections.push(`- ${warning}`);
    });
    sections.push('');
  }
  
  sections.push(`## 総合リスク評価: ${result.overallRisk.toUpperCase()}`);
  
  return sections.join('\n');
}
