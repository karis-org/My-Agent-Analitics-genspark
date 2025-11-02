/**
 * Data Export Utility
 * CSV/Excel data export functionality
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Escape and quote CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV string
  const csvRows = [
    csvHeaders.map(escapeCSV).join(','),
    ...data.map(row =>
      csvHeaders.map(header => escapeCSV(row[header])).join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Export properties to CSV
 */
export function exportPropertiesToCSV(properties: any[]): string {
  const headers = [
    'id',
    'name',
    'address',
    'price',
    'propertyType',
    'structure',
    'totalFloorArea',
    'buildingAge',
    'distanceFromStation',
    'monthlyRent',
    'managementFee',
    'grossYield',
    'netYield',
    'noi',
    'dscr',
    'ltv',
    'ccr',
    'ber',
    'createdAt',
    'updatedAt',
  ];

  const japaneseHeaders = [
    'ID',
    '物件名',
    '所在地',
    '価格',
    '物件種別',
    '構造',
    '延床面積',
    '築年数',
    '駅距離',
    '月額賃料',
    '管理費',
    '表面利回り',
    '実質利回り',
    'NOI',
    'DSCR',
    'LTV',
    'CCR',
    'BER',
    '作成日',
    '更新日',
  ];

  // Add BOM for Excel UTF-8 support
  const bom = '\uFEFF';
  return bom + japaneseHeaders.join(',') + '\n' + arrayToCSV(properties, headers);
}

/**
 * Export analysis results to CSV
 */
export function exportAnalysisToCSV(analysis: any): string {
  const data = [
    { item: 'NOI (純営業利益)', value: analysis.noi },
    { item: '表面利回り', value: analysis.grossYield },
    { item: '実質利回り', value: analysis.netYield },
    { item: 'DSCR', value: analysis.dscr },
    { item: 'LTV', value: analysis.ltv },
    { item: 'CCR', value: analysis.ccr },
    { item: 'BER', value: analysis.ber },
    { item: '年間デットサービス', value: analysis.annualDebtService },
    { item: '月間キャッシュフロー', value: analysis.monthlyCashFlow },
    { item: '年間キャッシュフロー', value: analysis.annualCashFlow },
    { item: 'リスクレベル', value: analysis.riskLevel },
  ];

  const bom = '\uFEFF';
  return bom + '項目,値\n' + arrayToCSV(data, ['item', 'value']);
}

/**
 * Export simulation results to CSV
 */
export function exportSimulationToCSV(simulation: any): string {
  const projections = simulation.projections.map((p: any) => ({
    year: p.year,
    grossIncome: Math.round(p.grossIncome),
    totalExpenses: Math.round(p.totalExpenses),
    noi: Math.round(p.noi),
    debtService: Math.round(p.debtService),
    cashFlow: Math.round(p.cashFlow),
    cumulativeCashFlow: Math.round(p.cumulativeCashFlow),
    propertyValue: Math.round(p.propertyValue),
    loanBalance: Math.round(p.loanBalance),
    equity: Math.round(p.equity),
    roi: p.roi.toFixed(2),
  }));

  const headers = [
    'year',
    'grossIncome',
    'totalExpenses',
    'noi',
    'debtService',
    'cashFlow',
    'cumulativeCashFlow',
    'propertyValue',
    'loanBalance',
    'equity',
    'roi',
  ];

  const japaneseHeaders = [
    '年',
    '総収入',
    '総経費',
    'NOI',
    'デットサービス',
    'キャッシュフロー',
    '累積CF',
    '物件価値',
    'ローン残高',
    '自己資本',
    'ROI (%)',
  ];

  const bom = '\uFEFF';
  return bom + japaneseHeaders.join(',') + '\n' + arrayToCSV(projections, headers);
}

/**
 * Export market analysis to CSV
 */
export function exportMarketAnalysisToCSV(marketData: any[]): string {
  const headers = [
    'Type',
    'TradePrice',
    'Area',
    'UnitPrice',
    'Period',
    'Municipality',
    'District',
    'NearestStation',
    'BuildingYear',
  ];

  const japaneseHeaders = [
    '物件種別',
    '取引価格',
    '面積',
    '坪単価',
    '取引時期',
    '市区町村',
    '地区',
    '最寄駅',
    '建築年',
  ];

  const bom = '\uFEFF';
  return bom + japaneseHeaders.join(',') + '\n' + arrayToCSV(marketData, headers);
}

/**
 * Create download response for CSV
 */
export function createCSVDownloadResponse(
  csv: string,
  filename: string
): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Convert CSV to TSV (Tab-Separated Values) for Excel compatibility
 */
export function csvToTSV(csv: string): string {
  return csv.replace(/,/g, '\t');
}
