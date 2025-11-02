/**
 * Excel Export Utility (Lightweight)
 * Cloudflare Workers compatible Excel generation using XML
 * Generates XLSX files compatible with Excel, LibreOffice, Google Sheets
 */

interface ExcelCell {
  value: string | number | null;
  type?: 'string' | 'number' | 'date';
  style?: string;
}

interface ExcelSheet {
  name: string;
  data: ExcelCell[][];
  columnWidths?: number[];
}

/**
 * Generate Excel XLSX file from sheets data
 */
export function generateExcel(sheets: ExcelSheet[]): Uint8Array {
  // Create XLSX structure
  const files: { [path: string]: string } = {};

  // [Content_Types].xml
  files['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n  ')}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;

  // _rels/.rels
  files['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // xl/_rels/workbook.xml.rels
  files['xl/_rels/workbook.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n  ')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId${sheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;

  // xl/workbook.xml
  files['xl/workbook.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((sheet, i) => `<sheet name="${escapeXML(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('\n    ')}
  </sheets>
</workbook>`;

  // xl/styles.xml
  files['xl/styles.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="#,##0"/>
  </numFmts>
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  </cellXfs>
</styleSheet>`;

  // Build shared strings
  const sharedStrings: string[] = [];
  const sharedStringMap = new Map<string, number>();

  // Collect all unique strings
  for (const sheet of sheets) {
    for (const row of sheet.data) {
      for (const cell of row) {
        if (cell.type === 'string' && cell.value !== null) {
          const str = String(cell.value);
          if (!sharedStringMap.has(str)) {
            sharedStringMap.set(str, sharedStrings.length);
            sharedStrings.push(str);
          }
        }
      }
    }
  }

  // xl/sharedStrings.xml
  files['xl/sharedStrings.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">
  ${sharedStrings.map(str => `<si><t>${escapeXML(str)}</t></si>`).join('\n  ')}
</sst>`;

  // Generate worksheets
  for (let sheetIndex = 0; sheetIndex < sheets.length; sheetIndex++) {
    const sheet = sheets[sheetIndex];
    const rows: string[] = [];

    for (let rowIndex = 0; rowIndex < sheet.data.length; rowIndex++) {
      const row = sheet.data[rowIndex];
      const cells: string[] = [];

      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cell = row[colIndex];
        const cellRef = columnToLetter(colIndex) + (rowIndex + 1);

        if (cell.value === null || cell.value === undefined || cell.value === '') {
          cells.push(`<c r="${cellRef}"/>`);
        } else if (cell.type === 'number') {
          const styleId = cell.style === 'number' ? '2' : '0';
          cells.push(`<c r="${cellRef}" s="${styleId}" t="n"><v>${cell.value}</v></c>`);
        } else {
          const stringIndex = sharedStringMap.get(String(cell.value));
          const styleId = cell.style === 'bold' ? '1' : '0';
          cells.push(`<c r="${cellRef}" s="${styleId}" t="s"><v>${stringIndex}</v></c>`);
        }
      }

      rows.push(`<row r="${rowIndex + 1}">${cells.join('')}</row>`);
    }

    files[`xl/worksheets/sheet${sheetIndex + 1}.xml`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${rows.join('\n    ')}
  </sheetData>
</worksheet>`;
  }

  // Create ZIP file
  return createZip(files);
}

/**
 * Convert column index to Excel column letter (0 -> A, 25 -> Z, 26 -> AA)
 */
function columnToLetter(col: number): string {
  let letter = '';
  while (col >= 0) {
    letter = String.fromCharCode((col % 26) + 65) + letter;
    col = Math.floor(col / 26) - 1;
  }
  return letter;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Create a simple ZIP file (XLSX is a ZIP archive)
 */
function createZip(files: { [path: string]: string }): Uint8Array {
  // This is a simplified ZIP implementation
  // For production, consider using a proper ZIP library compatible with Workers
  
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const [path, content] of Object.entries(files)) {
    const pathBytes = encoder.encode(path);
    const contentBytes = encoder.encode(content);

    // Local file header
    const header = new Uint8Array(30 + pathBytes.length);
    new DataView(header.buffer).setUint32(0, 0x04034b50, true); // Signature
    new DataView(header.buffer).setUint16(4, 20, true); // Version
    new DataView(header.buffer).setUint16(8, 0, true); // Compression (none)
    new DataView(header.buffer).setUint32(18, contentBytes.length, true); // Uncompressed size
    new DataView(header.buffer).setUint32(22, contentBytes.length, true); // Compressed size
    new DataView(header.buffer).setUint16(26, pathBytes.length, true); // File name length
    header.set(pathBytes, 30);

    parts.push(header, contentBytes);

    // Central directory entry
    const cdEntry = new Uint8Array(46 + pathBytes.length);
    new DataView(cdEntry.buffer).setUint32(0, 0x02014b50, true); // Signature
    new DataView(cdEntry.buffer).setUint16(10, 20, true); // Version needed
    new DataView(cdEntry.buffer).setUint16(16, 0, true); // Compression
    new DataView(cdEntry.buffer).setUint32(24, contentBytes.length, true); // Uncompressed size
    new DataView(cdEntry.buffer).setUint32(28, contentBytes.length, true); // Compressed size
    new DataView(cdEntry.buffer).setUint16(32, pathBytes.length, true); // File name length
    new DataView(cdEntry.buffer).setUint32(42, offset, true); // Relative offset
    cdEntry.set(pathBytes, 46);

    centralDirectory.push(cdEntry);
    offset += header.length + contentBytes.length;
  }

  // End of central directory
  const cdData = new Uint8Array(centralDirectory.reduce((sum, cd) => sum + cd.length, 0));
  let cdOffset = 0;
  for (const cd of centralDirectory) {
    cdData.set(cd, cdOffset);
    cdOffset += cd.length;
  }

  const eocd = new Uint8Array(22);
  new DataView(eocd.buffer).setUint32(0, 0x06054b50, true); // Signature
  new DataView(eocd.buffer).setUint16(8, centralDirectory.length, true); // Total entries (disk)
  new DataView(eocd.buffer).setUint16(10, centralDirectory.length, true); // Total entries
  new DataView(eocd.buffer).setUint32(12, cdData.length, true); // Central directory size
  new DataView(eocd.buffer).setUint32(16, offset, true); // Central directory offset

  // Combine all parts
  const totalSize = parts.reduce((sum, p) => sum + p.length, 0) + cdData.length + eocd.length;
  const result = new Uint8Array(totalSize);
  let resultOffset = 0;

  for (const part of parts) {
    result.set(part, resultOffset);
    resultOffset += part.length;
  }
  result.set(cdData, resultOffset);
  resultOffset += cdData.length;
  result.set(eocd, resultOffset);

  return result;
}

/**
 * Export properties to Excel
 */
export function exportPropertiesToExcel(properties: any[]): Uint8Array {
  const data: ExcelCell[][] = [];

  // Header row
  data.push([
    { value: 'ID', type: 'string', style: 'bold' },
    { value: '物件名', type: 'string', style: 'bold' },
    { value: '所在地', type: 'string', style: 'bold' },
    { value: '価格', type: 'string', style: 'bold' },
    { value: '物件種別', type: 'string', style: 'bold' },
    { value: '構造', type: 'string', style: 'bold' },
    { value: '延床面積', type: 'string', style: 'bold' },
    { value: '築年数', type: 'string', style: 'bold' },
    { value: '作成日', type: 'string', style: 'bold' },
  ]);

  // Data rows
  for (const property of properties) {
    data.push([
      { value: property.id, type: 'string' },
      { value: property.name, type: 'string' },
      { value: property.address || '', type: 'string' },
      { value: property.price || 0, type: 'number', style: 'number' },
      { value: property.property_type || '', type: 'string' },
      { value: property.structure || '', type: 'string' },
      { value: property.total_floor_area || 0, type: 'number' },
      { value: property.building_age || 0, type: 'number' },
      { value: property.created_at || '', type: 'string' },
    ]);
  }

  return generateExcel([{ name: '物件一覧', data }]);
}

/**
 * Export simulation results to Excel
 */
export function exportSimulationToExcel(simulation: any): Uint8Array {
  const data: ExcelCell[][] = [];

  // Header row
  data.push([
    { value: '年', type: 'string', style: 'bold' },
    { value: '総収入', type: 'string', style: 'bold' },
    { value: '総経費', type: 'string', style: 'bold' },
    { value: 'NOI', type: 'string', style: 'bold' },
    { value: 'デットサービス', type: 'string', style: 'bold' },
    { value: 'キャッシュフロー', type: 'string', style: 'bold' },
    { value: '累積CF', type: 'string', style: 'bold' },
    { value: '物件価値', type: 'string', style: 'bold' },
    { value: 'ローン残高', type: 'string', style: 'bold' },
    { value: 'ROI (%)', type: 'string', style: 'bold' },
  ]);

  // Data rows
  for (const projection of simulation.projections) {
    data.push([
      { value: projection.year, type: 'number' },
      { value: Math.round(projection.grossIncome), type: 'number', style: 'number' },
      { value: Math.round(projection.totalExpenses), type: 'number', style: 'number' },
      { value: Math.round(projection.noi), type: 'number', style: 'number' },
      { value: Math.round(projection.debtService), type: 'number', style: 'number' },
      { value: Math.round(projection.cashFlow), type: 'number', style: 'number' },
      { value: Math.round(projection.cumulativeCashFlow), type: 'number', style: 'number' },
      { value: Math.round(projection.propertyValue), type: 'number', style: 'number' },
      { value: Math.round(projection.loanBalance), type: 'number', style: 'number' },
      { value: projection.roi.toFixed(2), type: 'number' },
    ]);
  }

  return generateExcel([{ name: 'シミュレーション結果', data }]);
}

/**
 * Create Excel download response
 */
export function createExcelDownloadResponse(
  excelData: Uint8Array,
  filename: string
): Response {
  return new Response(excelData, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
