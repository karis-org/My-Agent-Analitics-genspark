/**
 * OCR Parser Library
 * Safely parses OCR-extracted text into numeric values
 * 
 * Common issues fixed:
 * - "900,000" → 900000 (not 900000000)
 * - "¥31,728円" → 31728
 * - "９００,０００" (full-width) → 900000
 * - Invalid ranges and data types
 */

/**
 * Parse OCR-extracted number with validation
 * @param text - OCR extracted text
 * @param fieldName - Field name for error messages
 * @returns Parsed number
 * @throws Error if parsing fails or value is out of range
 */
export function parseOCRNumber(text: string | number | null | undefined, fieldName: string): number {
  // Handle null/undefined
  if (text === null || text === undefined || text === '') {
    throw new Error(`[OCR Parser] ${fieldName}: 空の値です`);
  }

  // If already a number, validate and return
  if (typeof text === 'number') {
    if (isNaN(text)) {
      throw new Error(`[OCR Parser] ${fieldName}: NaNです`);
    }
    return validateRange(text, fieldName);
  }

  // Convert to string
  const textStr = String(text);

  // 1. Convert full-width numbers to half-width
  let normalized = textStr.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );

  // 2. Remove commas, spaces, currency symbols
  normalized = normalized
    .replace(/[,、]/g, '')           // Commas
    .replace(/\s+/g, '')             // Spaces
    .replace(/[円¥$€£]/g, '')       // Currency symbols
    .replace(/[兆億万千百十]/g, ''); // Japanese number units (basic removal)

  // 3. Handle decimal points
  normalized = normalized.replace(/[。]/g, '.');

  // 4. Check for valid numeric format
  if (!/^-?\d+\.?\d*$/.test(normalized)) {
    throw new Error(
      `[OCR Parser] ${fieldName}: 不正な形式です (入力: "${textStr}", 正規化後: "${normalized}")`
    );
  }

  // 5. Parse to number
  const parsed = parseFloat(normalized);

  // 6. Validate not NaN
  if (isNaN(parsed)) {
    throw new Error(
      `[OCR Parser] ${fieldName}: 数値に変換できません (入力: "${textStr}")`
    );
  }

  // 7. Validate range
  return validateRange(parsed, fieldName);
}

/**
 * Validate number is within acceptable range for field type
 */
function validateRange(value: number, fieldName: string): number {
  const rules: Record<string, { min: number; max: number }> = {
    price: { min: 10_000, max: 100_000_000_000 },        // 1万〜1000億円
    propertyPrice: { min: 10_000, max: 100_000_000_000 }, // Same as price
    monthlyRent: { min: 0, max: 100_000_000 },            // 0〜1億円/月
    annual_income: { min: 0, max: 10_000_000_000 },       // 0〜100億円/年
    annual_expense: { min: 0, max: 10_000_000_000 },      // 0〜100億円/年
    landArea: { min: 0.01, max: 1_000_000 },              // 0.01〜100万㎡
    land_area: { min: 0.01, max: 1_000_000 },             // Same as landArea
    total_floor_area: { min: 0.01, max: 1_000_000 },      // 0.01〜100万㎡
    buildingArea: { min: 0.01, max: 1_000_000 },          // 0.01〜100万㎡
    age: { min: -5, max: 150 },                           // -5〜150年（新築予定物件: -1〜-5、既存物件: 0〜150）
    buildingAge: { min: -5, max: 150 },                   // -5〜150年
    occupancyRate: { min: 0, max: 100 },                  // 0〜100%
    distance_from_station: { min: 0, max: 300 },          // 0〜300分
    distanceFromStation: { min: 0, max: 300 },            // Same
    interestRate: { min: 0, max: 30 },                    // 0〜30%
    loanTerm: { min: 1, max: 100 },                       // 1〜100年
    gross_yield: { min: 0, max: 100 },                    // 0〜100%
    net_yield: { min: 0, max: 100 },                      // 0〜100%
  };

  const rule = rules[fieldName];
  if (!rule) {
    // No specific rule, apply general sanity check
    if (value < 0 || value > 1e15) {
      throw new Error(
        `[OCR Parser] ${fieldName}: 範囲外の値です (値: ${value})`
      );
    }
    return value;
  }

  if (value < rule.min || value > rule.max) {
    throw new Error(
      `[OCR Parser] ${fieldName}: 範囲外の値です (値: ${value}, 許容範囲: ${rule.min}〜${rule.max})`
    );
  }

  return value;
}

/**
 * Parse OCR-extracted date
 * @param text - OCR extracted date text
 * @returns Date object or null
 */
export function parseOCRDate(text: string | null | undefined): Date | null {
  if (!text) return null;

  // Japanese format: 2023年11月7日, 令和5年11月7日
  const jpPattern = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
  const match = text.match(jpPattern);

  if (match) {
    const [, year, month, day] = match;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );

    if (isNaN(date.getTime())) {
      console.warn(`[OCR Parser] 不正な日付: ${text}`);
      return null;
    }

    return date;
  }

  // ISO format fallback
  const isoDate = new Date(text);
  return isNaN(isoDate.getTime()) ? null : isoDate;
}

/**
 * Parse building structure type
 * @param text - OCR extracted text
 * @returns Standardized structure type ("RC造", "SRC造", "鉄骨造", "木造")
 */
export function parseStructureType(text: string | null | undefined): string | null {
  if (!text) return null;

  const normalized = String(text).toUpperCase().replace(/\s+/g, '').replace(/[　]/g, '');

  // RC造パターン
  if (normalized.includes('鉄筋コンクリート') || normalized.includes('RC') || normalized.includes('ＲＣ')) {
    // SRC造を除外
    if (normalized.includes('鉄骨鉄筋') || normalized.includes('SRC') || normalized.includes('ＳＲＣ')) {
      return 'SRC造';
    }
    return 'RC造';
  }

  // SRC造パターン
  if (normalized.includes('鉄骨鉄筋コンクリート') || normalized.includes('SRC') || normalized.includes('ＳＲＣ')) {
    return 'SRC造';
  }

  // 鉄骨造パターン
  if (
    normalized.includes('鉄骨') ||
    normalized.includes('S造') ||
    normalized.includes('Ｓ造') ||
    normalized.includes('軽量鉄骨') ||
    normalized.includes('重量鉄骨')
  ) {
    return '鉄骨造';
  }

  // 木造パターン
  if (normalized.includes('木造') || normalized.includes('W造') || normalized.includes('Ｗ造')) {
    return '木造';
  }

  return null;
}

/**
 * Safe parse with error handling
 * Returns null on error instead of throwing
 */
export function safeParseOCRNumber(
  text: string | number | null | undefined,
  fieldName: string
): number | null {
  try {
    return parseOCRNumber(text, fieldName);
  } catch (error) {
    console.warn(`[OCR Parser] ${(error as any).message}`);
    return null;
  }
}
