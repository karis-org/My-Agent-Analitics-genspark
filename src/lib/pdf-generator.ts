/**
 * PDF Report Generator for My Agent Analytics
 * 
 * Generates professional PDF reports for property investigations, analysis, and comparisons
 * Uses pdfmake library which works in browser/Cloudflare Workers environment
 */

export interface PropertyReportData {
  id: string;
  address: string;
  price: number;
  area: number;
  buildingArea?: number;
  landArea?: number;
  yearBuilt?: number;
  propertyType: '戸建て' | 'マンション' | '土地' | 'アパート';
  createdAt: string;
}

export interface InvestigationReportData {
  address: string;
  urbanPlanning: {
    useDistrict: string;
    buildingCoverageRatio: number;
    floorAreaRatio: number;
    firePreventionDistrict: string;
  };
  hazards: {
    floodRisk: string;
    landslideRisk: string;
    liquefactionRisk: string;
  };
  accident: {
    hasAccident: boolean;
    accidentType?: string;
    disclosureRequired: boolean;
    priceImpact: string;
  };
  investigationDate: string;
  investigator: string;
  overallRisk: string;
}

export interface ComparisonReportData {
  properties: PropertyReportData[];
  comparisonDate: string;
  criteria: string[];
}

/**
 * Generate HTML for PDF rendering (using browser print API)
 * This approach works better in Cloudflare Workers environment
 */
export function generatePropertyReportHTML(data: PropertyReportData): string {
  const pricePerTsubo = data.landArea ? Math.round(data.price / (data.landArea / 3.3058)) : 0;
  
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>物件詳細レポート - ${data.address}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 12pt;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10mm;
            margin-bottom: 10mm;
        }
        .header h1 {
            color: #2563eb;
            font-size: 24pt;
            margin: 0 0 5mm 0;
        }
        .header .subtitle {
            color: #666;
            font-size: 10pt;
        }
        .section {
            margin-bottom: 8mm;
        }
        .section-title {
            background-color: #2563eb;
            color: white;
            padding: 3mm 5mm;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 3mm;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3mm;
        }
        .info-item {
            border: 1px solid #ddd;
            padding: 3mm;
            border-radius: 2mm;
        }
        .info-label {
            font-weight: bold;
            color: #2563eb;
            font-size: 10pt;
            margin-bottom: 1mm;
        }
        .info-value {
            font-size: 14pt;
            color: #333;
        }
        .footer {
            position: fixed;
            bottom: 10mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 9pt;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 3mm;
        }
        .timestamp {
            text-align: right;
            color: #999;
            font-size: 9pt;
            margin-top: 10mm;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>物件詳細レポート</h1>
        <div class="subtitle">My Agent Analytics - Property Investigation Report</div>
    </div>

    <div class="section">
        <div class="section-title">基本情報</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">物件ID</div>
                <div class="info-value">${data.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">物件種別</div>
                <div class="info-value">${data.propertyType}</div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">所在地</div>
                <div class="info-value">${data.address}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">価格情報</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">販売価格</div>
                <div class="info-value">${data.price.toLocaleString('ja-JP')} 円</div>
            </div>
            <div class="info-item">
                <div class="info-label">坪単価</div>
                <div class="info-value">${pricePerTsubo > 0 ? pricePerTsubo.toLocaleString('ja-JP') : 'N/A'} 円/坪</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">面積情報</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">延床面積</div>
                <div class="info-value">${data.area.toFixed(2)} m²</div>
            </div>
            ${data.buildingArea ? `
            <div class="info-item">
                <div class="info-label">建物面積</div>
                <div class="info-value">${data.buildingArea.toFixed(2)} m²</div>
            </div>
            ` : ''}
            ${data.landArea ? `
            <div class="info-item">
                <div class="info-label">土地面積</div>
                <div class="info-value">${data.landArea.toFixed(2)} m²</div>
            </div>
            ` : ''}
            ${data.yearBuilt ? `
            <div class="info-item">
                <div class="info-label">築年</div>
                <div class="info-value">${data.yearBuilt}年</div>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="timestamp">
        レポート作成日時: ${new Date(data.createdAt).toLocaleString('ja-JP')}
    </div>

    <div class="footer">
        My Agent Analytics - 不動産分析システム<br>
        このレポートは自動生成されたものです。
    </div>
</body>
</html>
  `;
}

/**
 * Generate Investigation Report HTML
 */
export function generateInvestigationReportHTML(data: InvestigationReportData): string {
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return '高リスク';
      case 'medium': return '中リスク';
      case 'low': return '低リスク';
      default: return '不明';
    }
  };

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>物件調査レポート - ${data.address}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 12pt;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 10mm;
            margin-bottom: 10mm;
        }
        .header h1 {
            color: #dc2626;
            font-size: 24pt;
            margin: 0 0 5mm 0;
        }
        .overall-risk {
            text-align: center;
            padding: 5mm;
            margin: 5mm 0;
            border-radius: 3mm;
            font-size: 18pt;
            font-weight: bold;
            background-color: ${getRiskColor(data.overallRisk)};
            color: white;
        }
        .section {
            margin-bottom: 8mm;
        }
        .section-title {
            background-color: #4b5563;
            color: white;
            padding: 3mm 5mm;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 3mm;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3mm;
        }
        .info-item {
            border: 1px solid #ddd;
            padding: 3mm;
            border-radius: 2mm;
        }
        .info-label {
            font-weight: bold;
            color: #4b5563;
            font-size: 10pt;
            margin-bottom: 1mm;
        }
        .info-value {
            font-size: 12pt;
            color: #333;
        }
        .risk-badge {
            display: inline-block;
            padding: 2mm 4mm;
            border-radius: 2mm;
            color: white;
            font-weight: bold;
            font-size: 11pt;
        }
        .accident-warning {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 5mm;
            margin: 5mm 0;
        }
        .accident-warning h3 {
            color: #dc2626;
            margin-top: 0;
        }
        .footer {
            position: fixed;
            bottom: 10mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 9pt;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 3mm;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>物件調査レポート</h1>
        <div class="subtitle">Property Investigation Report</div>
    </div>

    <div class="overall-risk">
        総合リスク評価: ${getRiskLabel(data.overallRisk)}
    </div>

    <div class="section">
        <div class="section-title">調査対象物件</div>
        <div class="info-item">
            <div class="info-label">所在地</div>
            <div class="info-value">${data.address}</div>
        </div>
    </div>

    ${data.accident.hasAccident ? `
    <div class="accident-warning">
        <h3>⚠️ 心理的瑕疵物件</h3>
        <p><strong>事故種別:</strong> ${data.accident.accidentType || '不明'}</p>
        <p><strong>告知義務:</strong> ${data.accident.disclosureRequired ? 'あり' : 'なし'}</p>
        <p><strong>価格影響度:</strong> ${getRiskLabel(data.accident.priceImpact)}</p>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">都市計画情報</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">用途地域</div>
                <div class="info-value">${data.urbanPlanning.useDistrict}</div>
            </div>
            <div class="info-item">
                <div class="info-label">防火地域</div>
                <div class="info-value">${data.urbanPlanning.firePreventionDistrict}</div>
            </div>
            <div class="info-item">
                <div class="info-label">建ぺい率</div>
                <div class="info-value">${data.urbanPlanning.buildingCoverageRatio}%</div>
            </div>
            <div class="info-item">
                <div class="info-label">容積率</div>
                <div class="info-value">${data.urbanPlanning.floorAreaRatio}%</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">ハザード情報</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">洪水リスク</div>
                <div class="info-value">
                    <span class="risk-badge" style="background-color: ${getRiskColor(data.hazards.floodRisk)}">
                        ${getRiskLabel(data.hazards.floodRisk)}
                    </span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">土砂災害リスク</div>
                <div class="info-value">
                    <span class="risk-badge" style="background-color: ${getRiskColor(data.hazards.landslideRisk)}">
                        ${getRiskLabel(data.hazards.landslideRisk)}
                    </span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">液状化リスク</div>
                <div class="info-value">
                    <span class="risk-badge" style="background-color: ${getRiskColor(data.hazards.liquefactionRisk)}">
                        ${getRiskLabel(data.hazards.liquefactionRisk)}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">調査情報</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">調査日時</div>
                <div class="info-value">${new Date(data.investigationDate).toLocaleString('ja-JP')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">調査者</div>
                <div class="info-value">${data.investigator}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        My Agent Analytics - 不動産分析システム<br>
        このレポートは自動生成されたものです。実際の取引の際は必ず現地調査を行ってください。
    </div>
</body>
</html>
  `;
}

/**
 * Generate Property Comparison Report HTML
 */
export function generateComparisonReportHTML(data: ComparisonReportData): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>物件比較レポート</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 15mm;
        }
        body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 10pt;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #059669;
            padding-bottom: 5mm;
            margin-bottom: 5mm;
        }
        .header h1 {
            color: #059669;
            font-size: 20pt;
            margin: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5mm;
        }
        th {
            background-color: #059669;
            color: white;
            padding: 3mm;
            text-align: left;
            font-size: 11pt;
        }
        td {
            border: 1px solid #ddd;
            padding: 3mm;
            font-size: 10pt;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .best-value {
            background-color: #d1fae5;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            font-size: 9pt;
            color: #666;
            margin-top: 10mm;
            padding-top: 3mm;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>物件比較レポート</h1>
        <div>比較物件数: ${data.properties.length}件</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>項目</th>
                ${data.properties.map((_, idx) => `<th>物件 ${idx + 1}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>所在地</strong></td>
                ${data.properties.map(p => `<td>${p.address}</td>`).join('')}
            </tr>
            <tr>
                <td><strong>物件種別</strong></td>
                ${data.properties.map(p => `<td>${p.propertyType}</td>`).join('')}
            </tr>
            <tr>
                <td><strong>価格</strong></td>
                ${data.properties.map(p => `<td>${p.price.toLocaleString('ja-JP')} 円</td>`).join('')}
            </tr>
            <tr>
                <td><strong>延床面積</strong></td>
                ${data.properties.map(p => `<td>${p.area.toFixed(2)} m²</td>`).join('')}
            </tr>
            ${data.properties.some(p => p.landArea) ? `
            <tr>
                <td><strong>土地面積</strong></td>
                ${data.properties.map(p => `<td>${p.landArea ? p.landArea.toFixed(2) + ' m²' : 'N/A'}</td>`).join('')}
            </tr>
            ` : ''}
            ${data.properties.some(p => p.yearBuilt) ? `
            <tr>
                <td><strong>築年</strong></td>
                ${data.properties.map(p => `<td>${p.yearBuilt ? p.yearBuilt + '年' : 'N/A'}</td>`).join('')}
            </tr>
            ` : ''}
            <tr>
                <td><strong>坪単価</strong></td>
                ${data.properties.map(p => {
                    const pricePerTsubo = p.landArea ? Math.round(p.price / (p.landArea / 3.3058)) : 0;
                    return `<td>${pricePerTsubo > 0 ? pricePerTsubo.toLocaleString('ja-JP') + ' 円/坪' : 'N/A'}</td>`;
                }).join('')}
            </tr>
        </tbody>
    </table>

    <div class="footer">
        レポート作成日時: ${new Date(data.comparisonDate).toLocaleString('ja-JP')}<br>
        My Agent Analytics - 不動産分析システム
    </div>
</body>
</html>
  `;
}

/**
 * Convert HTML to PDF-ready format
 * Returns HTML string that can be used with browser's print API
 */
export function generatePDFDocument(html: string): string {
  return html;
}
