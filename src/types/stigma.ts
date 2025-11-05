// 事故物件調査 型定義

export interface StigmaIncident {
  type: '自殺' | '他殺' | '孤独死' | '火災' | 'その他';
  date: string; // YYYY年MM月 or "不明"
  description: string;
  source: string; // URL
}

export interface StigmaCheckResult {
  hasStigma: boolean;
  confidence: 'high' | 'medium' | 'low';
  incidents?: StigmaIncident[];
  message: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
  searchQuery?: string;
  timestamp?: string;
}

export interface StigmaCheckRequest {
  address: string;
  propertyName?: string;
}
