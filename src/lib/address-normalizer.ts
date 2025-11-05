/**
 * Address Normalizer
 * 住所の正規化と複数バリエーションの生成
 */

/**
 * 住所を正規化して複数のバリエーションを生成
 * @param address 元の住所
 * @returns 住所のバリエーション配列
 */
export function normalizeAddress(address: string): string[] {
  const variations = new Set<string>();
  
  // 元の住所を追加
  variations.add(address);
  
  let normalized = address;
  
  // 漢数字 → 算用数字への変換
  const kanjiToNumber: Record<string, string> = {
    '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
    '六': '6', '七': '7', '八': '8', '九': '9', '十': '10'
  };
  
  // 丁目の変換: 「六丁目」→「6丁目」
  Object.entries(kanjiToNumber).forEach(([kanji, num]) => {
    const regex = new RegExp(`${kanji}丁目`, 'g');
    normalized = normalized.replace(regex, `${num}丁目`);
  });
  variations.add(normalized);
  
  // 丁目 → ハイフン形式: 「6丁目」→「6-」
  normalized = normalized.replace(/([0-9]+)丁目/g, '$1-');
  variations.add(normalized);
  
  // 番地の正規化: 「番」「号」の削除
  normalized = normalized.replace(/番/g, '-').replace(/号/g, '');
  variations.add(normalized);
  
  // 全角数字 → 半角数字
  normalized = normalized.replace(/[０-９]/g, (s) => 
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );
  variations.add(normalized);
  
  // スペースの削除
  normalized = normalized.replace(/\s+/g, '');
  variations.add(normalized);
  
  // 「東京都」の有無バリエーション
  if (normalized.startsWith('東京都')) {
    variations.add(normalized.substring(3)); // 「東京都」なし
  }
  
  // 区の後のバリエーション: 「葛飾区東新小岩」→「葛飾区 東新小岩」
  const withSpaceAfterKu = normalized.replace(/区([^区]+)/, '区 $1');
  variations.add(withSpaceAfterKu);
  
  return Array.from(variations).filter(v => v.length > 0);
}

/**
 * 住所から主要な部分を抽出（区+町名）
 * @param address 住所
 * @returns 主要部分
 */
export function extractMainPart(address: string): string {
  // 「○○区△△」の形式を抽出
  const match = address.match(/(.+区)(.+)/);
  if (match) {
    return match[1] + match[2].split(/[0-9-]/)[0];
  }
  return address;
}

/**
 * 住所から番地を抽出
 * @param address 住所
 * @returns 番地部分
 */
export function extractHouseNumber(address: string): string | null {
  // 「○-○-○」形式を抽出
  const match = address.match(/([0-9]+[-ー][0-9]+[-ー][0-9]+)/);
  if (match) {
    return match[1];
  }
  
  // 「○丁目○-○」形式を抽出
  const match2 = address.match(/([0-9]+丁目[0-9]+[-ー][0-9]+)/);
  if (match2) {
    return match2[1];
  }
  
  return null;
}

/**
 * デバッグ用: バリエーションを表示
 */
export function debugAddressVariations(address: string): void {
  console.log('[Address Normalizer] Generating variations for:', address);
  const variations = normalizeAddress(address);
  variations.forEach((v, i) => {
    console.log(`  [${i + 1}] ${v}`);
  });
}
