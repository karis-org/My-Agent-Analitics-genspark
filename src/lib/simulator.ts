/**
 * Investment Simulation Engine
 * 不動産投資シミュレーションエンジン
 */

interface SimulationParams {
  // 物件情報
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;

  // 収益情報
  monthlyRent: number;
  occupancyRate: number;
  annualIncreaseRate: number;

  // 経費情報
  managementFeeRate: number;
  repairReserveRate: number;
  propertyTaxRate: number;
  insuranceCost: number;
  otherExpenses: number;

  // シミュレーション設定
  simulationYears: number;
  capitalGainsRate?: number; // 物件価格上昇率
  exitYear?: number; // 売却年
}

interface YearlyProjection {
  year: number;
  grossIncome: number;
  totalExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  roi: number;
}

interface SimulationResult {
  projections: YearlyProjection[];
  summary: {
    totalCashFlow: number;
    averageAnnualCashFlow: number;
    totalROI: number;
    averageROI: number;
    breakEvenYear: number;
    maxDrawdown: number;
    finalPropertyValue: number;
    finalEquity: number;
    irr: number;
  };
  exitAnalysis?: {
    exitYear: number;
    salePrice: number;
    remainingLoan: number;
    saleProceeds: number;
    totalReturn: number;
    annualizedReturn: number;
  };
}

interface ScenarioComparison {
  baseCase: SimulationResult;
  bestCase: SimulationResult;
  worstCase: SimulationResult;
  scenarios: Array<{
    name: string;
    description: string;
    result: SimulationResult;
  }>;
}

export class InvestmentSimulator {
  /**
   * Run investment simulation
   */
  simulate(params: SimulationParams): SimulationResult {
    const projections: YearlyProjection[] = [];
    let cumulativeCashFlow = 0;
    let propertyValue = params.propertyPrice;
    let loanBalance = params.loanAmount;

    // Monthly payment calculation
    const monthlyRate = params.interestRate / 100 / 12;
    const numberOfPayments = params.loanTerm * 12;
    const monthlyPayment =
      loanBalance *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    const annualDebtService = monthlyPayment * 12;

    for (let year = 1; year <= params.simulationYears; year++) {
      // Income calculation
      const annualIncreaseMultiplier = Math.pow(
        1 + params.annualIncreaseRate / 100,
        year - 1
      );
      const annualRent = params.monthlyRent * 12 * annualIncreaseMultiplier;
      const grossIncome = annualRent * (params.occupancyRate / 100);

      // Expense calculation
      const managementFee = grossIncome * (params.managementFeeRate / 100);
      const repairReserve = grossIncome * (params.repairReserveRate / 100);
      const propertyTax = propertyValue * (params.propertyTaxRate / 100);
      const totalExpenses =
        managementFee + repairReserve + propertyTax + params.insuranceCost + params.otherExpenses;

      // NOI calculation
      const noi = grossIncome - totalExpenses;

      // Cash flow calculation
      const cashFlow = noi - annualDebtService;
      cumulativeCashFlow += cashFlow;

      // Loan balance calculation (principal paid down)
      const interestPaid = loanBalance * (params.interestRate / 100);
      const principalPaid = annualDebtService - interestPaid;
      loanBalance = Math.max(0, loanBalance - principalPaid);

      // Property value appreciation
      if (params.capitalGainsRate) {
        propertyValue *= 1 + params.capitalGainsRate / 100;
      }

      // Equity calculation
      const equity = propertyValue - loanBalance;

      // ROI calculation
      const roi = (cumulativeCashFlow / params.downPayment) * 100;

      projections.push({
        year,
        grossIncome,
        totalExpenses,
        noi,
        debtService: annualDebtService,
        cashFlow,
        cumulativeCashFlow,
        propertyValue,
        loanBalance,
        equity,
        roi,
      });
    }

    // Calculate summary
    const totalCashFlow = cumulativeCashFlow;
    const averageAnnualCashFlow = totalCashFlow / params.simulationYears;
    const totalROI =
      (cumulativeCashFlow / params.downPayment) * 100;
    const averageROI = totalROI / params.simulationYears;

    // Find break-even year
    let breakEvenYear = 0;
    for (let i = 0; i < projections.length; i++) {
      if (projections[i].cumulativeCashFlow >= 0) {
        breakEvenYear = projections[i].year;
        break;
      }
    }

    // Calculate max drawdown
    let maxDrawdown = 0;
    for (const projection of projections) {
      if (projection.cumulativeCashFlow < maxDrawdown) {
        maxDrawdown = projection.cumulativeCashFlow;
      }
    }

    const finalProjection = projections[projections.length - 1];

    // Calculate IRR
    const irr = this.calculateIRR(projections, params.downPayment);

    const result: SimulationResult = {
      projections,
      summary: {
        totalCashFlow,
        averageAnnualCashFlow,
        totalROI,
        averageROI,
        breakEvenYear,
        maxDrawdown,
        finalPropertyValue: finalProjection.propertyValue,
        finalEquity: finalProjection.equity,
        irr,
      },
    };

    // Exit analysis if specified
    if (params.exitYear && params.exitYear <= params.simulationYears) {
      const exitProjection = projections[params.exitYear - 1];
      const salePrice = exitProjection.propertyValue;
      const remainingLoan = exitProjection.loanBalance;
      const saleProceeds = salePrice - remainingLoan;
      const totalReturn =
        exitProjection.cumulativeCashFlow + saleProceeds - params.downPayment;
      const annualizedReturn = (totalReturn / params.downPayment / params.exitYear) * 100;

      result.exitAnalysis = {
        exitYear: params.exitYear,
        salePrice,
        remainingLoan,
        saleProceeds,
        totalReturn,
        annualizedReturn,
      };
    }

    return result;
  }

  /**
   * Run scenario comparison
   */
  compareScenarios(baseParams: SimulationParams): ScenarioComparison {
    // Base case
    const baseCase = this.simulate(baseParams);

    // Best case scenario (optimistic)
    const bestCaseParams = { ...baseParams };
    bestCaseParams.occupancyRate = Math.min(100, baseParams.occupancyRate + 5);
    bestCaseParams.annualIncreaseRate = baseParams.annualIncreaseRate + 1;
    bestCaseParams.capitalGainsRate = (baseParams.capitalGainsRate || 0) + 2;
    const bestCase = this.simulate(bestCaseParams);

    // Worst case scenario (pessimistic)
    const worstCaseParams = { ...baseParams };
    worstCaseParams.occupancyRate = Math.max(0, baseParams.occupancyRate - 10);
    worstCaseParams.annualIncreaseRate = Math.max(
      -5,
      baseParams.annualIncreaseRate - 2
    );
    worstCaseParams.capitalGainsRate = (baseParams.capitalGainsRate || 0) - 2;
    worstCaseParams.managementFeeRate = baseParams.managementFeeRate + 1;
    worstCaseParams.repairReserveRate = baseParams.repairReserveRate + 1;
    const worstCase = this.simulate(worstCaseParams);

    // Additional scenarios
    const scenarios = [];

    // Interest rate increase scenario
    const rateIncreaseParams = { ...baseParams };
    rateIncreaseParams.interestRate = baseParams.interestRate + 1;
    scenarios.push({
      name: '金利上昇シナリオ',
      description: '金利が1%上昇した場合',
      result: this.simulate(rateIncreaseParams),
    });

    // High vacancy scenario
    const vacancyParams = { ...baseParams };
    vacancyParams.occupancyRate = Math.max(0, baseParams.occupancyRate - 15);
    scenarios.push({
      name: '高空室率シナリオ',
      description: '空室率が15%増加した場合',
      result: this.simulate(vacancyParams),
    });

    // Rapid depreciation scenario
    const depreciationParams = { ...baseParams };
    depreciationParams.capitalGainsRate = (baseParams.capitalGainsRate || 0) - 3;
    scenarios.push({
      name: '物件価格下落シナリオ',
      description: '物件価格が年3%下落した場合',
      result: this.simulate(depreciationParams),
    });

    return {
      baseCase,
      bestCase,
      worstCase,
      scenarios,
    };
  }

  /**
   * Calculate Internal Rate of Return (IRR)
   * Simple IRR approximation using Newton's method
   */
  private calculateIRR(
    projections: YearlyProjection[],
    initialInvestment: number
  ): number {
    const cashFlows = [-initialInvestment, ...projections.map((p) => p.cashFlow)];

    // Newton's method for IRR calculation
    let irr = 0.1; // Initial guess
    const maxIterations = 100;
    const tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let npvDerivative = 0;

      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + irr, t);
        npvDerivative -= (t * cashFlows[t]) / Math.pow(1 + irr, t + 1);
      }

      const newIrr = irr - npv / npvDerivative;

      if (Math.abs(newIrr - irr) < tolerance) {
        return newIrr * 100;
      }

      irr = newIrr;
    }

    return irr * 100;
  }

  /**
   * Monte Carlo simulation for risk analysis
   */
  runMonteCarloSimulation(
    baseParams: SimulationParams,
    iterations: number = 1000
  ): {
    meanROI: number;
    medianROI: number;
    standardDeviation: number;
    percentile5: number;
    percentile95: number;
    probabilityOfLoss: number;
    results: Array<{ roi: number; totalCashFlow: number }>;
  } {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      // Randomize parameters
      const params = { ...baseParams };
      params.occupancyRate = this.randomNormal(baseParams.occupancyRate, 5);
      params.annualIncreaseRate = this.randomNormal(baseParams.annualIncreaseRate, 1);
      params.capitalGainsRate = this.randomNormal(baseParams.capitalGainsRate || 2, 2);

      const simulation = this.simulate(params);
      results.push({
        roi: simulation.summary.totalROI,
        totalCashFlow: simulation.summary.totalCashFlow,
      });
    }

    // Sort results by ROI
    results.sort((a, b) => a.roi - b.roi);

    // Calculate statistics
    const rois = results.map((r) => r.roi);
    const meanROI = rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
    const medianROI = rois[Math.floor(rois.length / 2)];
    const variance =
      rois.reduce((sum, roi) => sum + Math.pow(roi - meanROI, 2), 0) / rois.length;
    const standardDeviation = Math.sqrt(variance);
    const percentile5 = rois[Math.floor(rois.length * 0.05)];
    const percentile95 = rois[Math.floor(rois.length * 0.95)];
    const probabilityOfLoss = rois.filter((roi) => roi < 0).length / rois.length;

    return {
      meanROI,
      medianROI,
      standardDeviation,
      percentile5,
      percentile95,
      probabilityOfLoss,
      results,
    };
  }

  /**
   * Generate normally distributed random number
   */
  private randomNormal(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}
