/**
 * Google Maps API Integration
 * Googleマップ統合機能
 * 
 * 物件周辺の地図画像を生成
 * - 1km スケール (A4横向き)
 * - 200m スケール (A4横向き)
 */

export interface MapOptions {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  scale: number; // 1 or 2 (for retina displays)
  size: {
    width: number;  // pixels
    height: number; // pixels
  };
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  markers?: Array<{
    lat: number;
    lng: number;
    label?: string;
    color?: string;
  }>;
}

export interface PropertyMapResult {
  map1km: string;    // Base64 encoded image (1km scale)
  map200m: string;   // Base64 encoded image (200m scale)
  imageUrl1km?: string;  // Optional: public URL
  imageUrl200m?: string; // Optional: public URL
}

/**
 * Google Maps Static API Client
 */
export class GoogleMapsClient {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 物件の地図を2種類のスケールで生成
   * @param address 物件住所（ジオコーディング用）
   * @param lat 緯度（任意、指定した場合はaddressより優先）
   * @param lng 経度（任意、指定した場合はaddressより優先）
   */
  async generatePropertyMaps(
    address?: string,
    lat?: number,
    lng?: number
  ): Promise<PropertyMapResult> {
    // 座標が指定されていない場合はジオコーディング
    let center: { lat: number; lng: number };
    
    if (lat !== undefined && lng !== undefined) {
      center = { lat, lng };
    } else if (address) {
      center = await this.geocodeAddress(address);
    } else {
      throw new Error('Either address or coordinates must be provided');
    }

    // A4横向きサイズ（297mm × 210mm）を96dpiでピクセル換算
    // 297mm ≈ 1122px, 210mm ≈ 794px
    // Google Maps Static API制限: 最大640x640 (無料), 2048x2048 (プレミアム)
    // A4横向きに近いサイズで最大解像度を使用
    const a4LandscapeSize = {
      width: 640,   // API制限内
      height: 454   // 640 * (210/297) ≈ 454
    };

    // 1km スケール（zoom level: 14-15）
    const map1km = await this.generateStaticMap({
      center,
      zoom: 14,
      scale: 2,
      size: a4LandscapeSize,
      mapType: 'roadmap',
      markers: [{
        lat: center.lat,
        lng: center.lng,
        label: 'P',
        color: 'red'
      }]
    });

    // 200m スケール（zoom level: 16-17）
    const map200m = await this.generateStaticMap({
      center,
      zoom: 17,
      scale: 2,
      size: a4LandscapeSize,
      mapType: 'roadmap',
      markers: [{
        lat: center.lat,
        lng: center.lng,
        label: 'P',
        color: 'red'
      }]
    });

    return {
      map1km,
      map200m
    };
  }

  /**
   * Google Maps Static APIで地図画像を生成
   */
  private async generateStaticMap(options: MapOptions): Promise<string> {
    const params = new URLSearchParams({
      center: `${options.center.lat},${options.center.lng}`,
      zoom: options.zoom.toString(),
      scale: options.scale.toString(),
      size: `${options.size.width}x${options.size.height}`,
      maptype: options.mapType || 'roadmap',
      key: this.apiKey
    });

    // マーカーを追加
    if (options.markers && options.markers.length > 0) {
      options.markers.forEach(marker => {
        const markerParams = [
          `color:${marker.color || 'red'}`,
          marker.label ? `label:${marker.label}` : '',
          `${marker.lat},${marker.lng}`
        ].filter(Boolean).join('|');
        
        params.append('markers', markerParams);
      });
    }

    const url = `${this.baseUrl}?${params.toString()}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const base64Image = this.arrayBufferToBase64(imageBuffer);
      
      return `data:image/png;base64,${base64Image}`;
    } catch (error) {
      console.error('Failed to generate map:', error);
      
      // フォールバック: プレースホルダー画像を生成
      return this.generatePlaceholderMap(options);
    }
  }

  /**
   * 住所から座標を取得（Geocoding）
   */
  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = new URLSearchParams({
      address: address,
      key: this.apiKey
    });

    try {
      const response = await fetch(`${geocodeUrl}?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      } else {
        console.error('Geocoding failed:', data.status);
        // デフォルト座標（東京駅）
        return { lat: 35.6812, lng: 139.7671 };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return { lat: 35.6812, lng: 139.7671 };
    }
  }

  /**
   * ArrayBufferをBase64に変換
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * プレースホルダー地図画像を生成（API失敗時）
   */
  private generatePlaceholderMap(options: MapOptions): string {
    // SVGプレースホルダーを生成
    const svg = `
      <svg width="${options.size.width}" height="${options.size.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" 
              font-family="Arial, sans-serif" 
              font-size="24" 
              fill="#9ca3af" 
              text-anchor="middle" 
              dominant-baseline="middle">
          地図を読み込めませんでした
        </text>
        <text x="50%" y="60%" 
              font-family="Arial, sans-serif" 
              font-size="14" 
              fill="#6b7280" 
              text-anchor="middle" 
              dominant-baseline="middle">
          座標: ${options.center.lat.toFixed(4)}, ${options.center.lng.toFixed(4)}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }
}

/**
 * Google Maps APIキーを環境変数から取得
 */
export function getGoogleMapsClient(apiKey?: string): GoogleMapsClient | null {
  // APIキーが明示的に渡されていない場合は警告
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY is not provided. Map generation will use placeholders.');
    return null;
  }

  return new GoogleMapsClient(apiKey);
}

/**
 * 住所文字列から地図を生成（簡易インターフェース）
 */
export async function generateMapsForProperty(
  address: string,
  lat?: number,
  lng?: number,
  apiKey?: string
): Promise<PropertyMapResult | null> {
  const client = getGoogleMapsClient(apiKey);
  
  if (!client) {
    // APIキーが設定されていない場合はnullを返す
    console.warn('Google Maps client not available');
    return null;
  }

  try {
    return await client.generatePropertyMaps(address, lat, lng);
  } catch (error) {
    console.error('Failed to generate property maps:', error);
    return null;
  }
}

/**
 * 地図画像をA4横向きサイズのHTMLタグとして生成
 */
export function generateMapHtml(mapBase64: string, title: string): string {
  return `
    <div class="map-container" style="page-break-inside: avoid; margin: 20px 0;">
      <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">${title}</h3>
      <img 
        src="${mapBase64}" 
        alt="${title}"
        style="width: 100%; max-width: 1122px; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;"
      />
      <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
        ※ この地図は参考用です。正確な位置情報は現地でご確認ください。
      </p>
    </div>
  `;
}

/**
 * レポート用に2つの地図をまとめて生成
 */
export function generateReportMapsHtml(maps: PropertyMapResult): string {
  if (!maps) {
    return '<p class="text-gray-500">地図データを取得できませんでした</p>';
  }

  const html1km = generateMapHtml(maps.map1km, '周辺地図（1kmスケール）');
  const html200m = generateMapHtml(maps.map200m, '周辺地図（200mスケール）');

  return `
    <div class="property-maps">
      ${html1km}
      ${html200m}
    </div>
  `;
}
