// Real estate investment calculation engine

/**
 * Calculate NOI (Net Operating Income)
 * NOI = 実収入 - 運営費
 */
export function calculateNOI(effectiveIncome: number, operatingExpenses: number): number {
  return effectiveIncome - operatingExpenses;
}

/**
 * Calculate Gross Yield (表面利回り)
 * 表面利回り = (満室想定年間収入 / 物件価格) × 100
 */
export function calculateGrossYield(grossIncome: number, propertyPrice: number): number {
  if (propertyPrice === 0) return 0;
  return (grossIncome / propertyPrice) * 100;
}

/**
 * Calculate Net Yield (実質利回り)
 * 実質利回り = (NOI / 物件価格) × 100
 */
export function calculateNetYield(noi: number, propertyPrice: number): number {
  if (propertyPrice === 0) return 0;
  return (noi / propertyPrice) * 100;
}

/**
 * Calculate annual debt service (年間返済額)
 * 元利均等返済
 */
export function calculateAnnualDebtService(
  loanAmount: number,
  interestRate: number,
  loanTermYears: number
): number {
  if (loanAmount === 0 || loanTermYears === 0) return 0;
  
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  if (monthlyRate === 0) {
    return (loanAmount / numberOfPayments) * 12;
  }
  
  const monthlyPayment = 
    loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return monthlyPayment * 12;
}

/**
 * Calculate DSCR (Debt Service Coverage Ratio)
 * DSCR = NOI / 年間返済額
 */
export function calculateDSCR(noi: number, annualDebtService: number): number {
  if (annualDebtService === 0) return 0;
  return noi / annualDebtService;
}

/**
 * Calculate LTV (Loan to Value)
 * LTV = (借入額 / 物件価格) × 100
 */
export function calculateLTV(loanAmount: number, propertyPrice: number): number {
  if (propertyPrice === 0) return 0;
  return (loanAmount / propertyPrice) * 100;
}

/**
 * Calculate CCR (Cash on Cash Return)
 * CCR = (年間税引前キャッシュフロー / 自己資金) × 100
 */
export function calculateCCR(
  annualCashFlow: number,
  downPayment: number
): number {
  if (downPayment === 0) return 0;
  return (annualCashFlow / downPayment) * 100;
}

/**
 * Calculate Break Even Ratio (損益分岐点)
 * BER = (運営費 + 年間返済額) / 満室想定収入 × 100
 */
export function calculateBER(
  operatingExpenses: number,
  annualDebtService: number,
  grossIncome: number
): number {
  if (grossIncome === 0) return 0;
  return ((operatingExpenses + annualDebtService) / grossIncome) * 100;
}

/**
 * Calculate monthly cash flow
 * 月次キャッシュフロー = (実収入 - 運営費 - 返済額) / 12
 */
export function calculateMonthlyCashFlow(
  effectiveIncome: number,
  operatingExpenses: number,
  annualDebtService: number
): number {
  return (effectiveIncome - operatingExpenses - annualDebtService) / 12;
}

/**
 * Calculate operating expense ratio
 * 運営費率 = (運営費 / 満室想定収入) × 100
 */
export function calculateOperatingExpenseRatio(
  operatingExpenses: number,
  grossIncome: number
): number {
  if (grossIncome === 0) return 0;
  return (operatingExpenses / grossIncome) * 100;
}

/**
 * Calculate vacancy rate adjusted income
 * 空室率考慮後収入 = 満室想定収入 × (1 - 空室率)
 */
export function calculateVacancyAdjustedIncome(
  grossIncome: number,
  vacancyRate: number
): number {
  return grossIncome * (1 - vacancyRate / 100);
}

/**
 * Comprehensive property analysis
 */
export interface PropertyAnalysis {
  // 基本指標
  noi: number;
  grossYield: number;
  netYield: number;
  dscr: number;
  ltv: number;
  
  // 追加指標
  ccr: number;
  ber: number;
  operatingExpenseRatio: number;
  
  // キャッシュフロー
  annualDebtService: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  
  // リスク評価
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
}

/**
 * Perform comprehensive property analysis
 */
export function analyzeProperty(params: {
  propertyPrice: number;
  grossIncome: number;
  effectiveIncome: number;
  operatingExpenses: number;
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  downPayment: number;
}): PropertyAnalysis {
  const {
    propertyPrice,
    grossIncome,
    effectiveIncome,
    operatingExpenses,
    loanAmount,
    interestRate,
    loanTermYears,
    downPayment,
  } = params;
  
  // 基本計算
  const noi = calculateNOI(effectiveIncome, operatingExpenses);
  const grossYield = calculateGrossYield(grossIncome, propertyPrice);
  const netYield = calculateNetYield(noi, propertyPrice);
  const annualDebtService = calculateAnnualDebtService(loanAmount, interestRate, loanTermYears);
  const dscr = calculateDSCR(noi, annualDebtService);
  const ltv = calculateLTV(loanAmount, propertyPrice);
  
  // 追加計算
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = calculateMonthlyCashFlow(effectiveIncome, operatingExpenses, annualDebtService);
  const ccr = calculateCCR(annualCashFlow, downPayment);
  const ber = calculateBER(operatingExpenses, annualDebtService, grossIncome);
  const operatingExpenseRatio = calculateOperatingExpenseRatio(operatingExpenses, grossIncome);
  
  // リスク評価
  const riskFactors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  if (dscr < 1.2) {
    riskFactors.push('DSCR が低い（1.2未満）- 返済余力が不足');
    riskLevel = 'high';
  } else if (dscr < 1.5) {
    riskFactors.push('DSCR がやや低い（1.5未満）');
    riskLevel = (riskLevel as string) === 'high' ? 'high' : 'medium';
  }
  
  if (ltv > 80) {
    riskFactors.push('LTV が高い（80%超）- レバレッジが高すぎる');
    riskLevel = 'high';
  } else if (ltv > 70) {
    riskFactors.push('LTV がやや高い（70%超）');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }
  
  if (netYield < 4) {
    riskFactors.push('実質利回りが低い（4%未満）');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }
  
  if (ber > 85) {
    riskFactors.push('損益分岐点が高い（85%超）- 空室リスクが高い');
    riskLevel = 'high';
  }
  
  if (operatingExpenseRatio > 50) {
    riskFactors.push('運営費率が高い（50%超）');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }
  
  // 推奨事項
  const recommendations: string[] = [];
  
  if (dscr < 1.5) {
    recommendations.push('借入額を減らすか、収入を増やしてDSCRを改善することを推奨');
  }
  
  if (ltv > 70) {
    recommendations.push('自己資金を増やしてLTVを下げることを検討');
  }
  
  if (netYield < 5) {
    recommendations.push('より高利回りの物件を検討するか、運営費の削減を図る');
  }
  
  if (operatingExpenseRatio > 40) {
    recommendations.push('運営費の見直しと削減策の検討');
  }
  
  if (riskFactors.length === 0) {
    recommendations.push('良好な投資物件です。市場動向に注意しながら運営を続けてください。');
  }
  
  return {
    noi,
    grossYield,
    netYield,
    dscr,
    ltv,
    ccr,
    ber,
    operatingExpenseRatio,
    annualDebtService,
    monthlyCashFlow,
    annualCashFlow,
    riskLevel,
    riskFactors,
    recommendations,
  };
}
