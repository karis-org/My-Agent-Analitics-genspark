// API routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter, validateInput } from '../middleware/security';
import { analyzeProperty } from '../lib/calculator';
import { ReinfolibClient } from '../lib/reinfolib';
import { EStatClient, analyzeDemographics } from '../lib/estat';
import { AIMarketAnalyzer } from '../lib/ai-analyzer';
import { InvestmentSimulator } from '../lib/simulator';
import {
  exportPropertiesToCSV,
  exportAnalysisToCSV,
  exportSimulationToCSV,
  exportMarketAnalysisToCSV,
  createCSVDownloadResponse,
} from '../lib/exporter';
import {
  exportPropertiesToExcel,
  exportSimulationToExcel,
  createExcelDownloadResponse,
} from '../lib/excel-exporter';
import {
  createSharedReport,
  getSharedReport,
  verifySharedReportAccess,
  logSharedReportAccess,
  updateSharedReport,
  deleteSharedReport,
  getUserSharedReports,
  getSharedReportAccessLogs,
} from '../lib/sharing';
import {
  createTemplate,
  getTemplate,
  getUserTemplates,
  getTemplatesByCategory,
  updateTemplate,
  deleteTemplate,
  createSection,
  updateSection,
  deleteSection,
  getTemplateSections,
  duplicateTemplate,
  getPublicTemplates,
  setDefaultTemplate,
  getDefaultTemplate,
} from '../lib/templates';

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply rate limiting to all API routes
api.use('/*', rateLimiter('api'));

// Apply auth middleware to all agents and executions endpoints
api.use('/agents*', authMiddleware);
api.use('/agents', authMiddleware);
api.use('/executions*', authMiddleware);
api.use('/executions', authMiddleware);

// Apply stricter rate limiting to AI endpoints
api.use('/ai/*', rateLimiter('ai'));

/**
 * マイソクOCR endpoint
 * 物件概要書の画像から情報を抽出
 */
api.post('/properties/ocr', async (c) => {
  try {
    const { image, filename } = await c.req.json();
    
    if (!image) {
      return c.json({ error: 'Image is required' }, 400);
    }
    
    const { env } = c;
    
    // OpenAI API Keyが設定されていない場合は仮データを返す
    if (!env.OPENAI_API_KEY || 
        env.OPENAI_API_KEY === 'your-openai-api-key-here' || 
        env.OPENAI_API_KEY === 'your-openai-api-key' ||
        env.OPENAI_API_KEY.trim() === '') {
      console.warn('OPENAI_API_KEY not configured, returning mock data');
      return c.json({
        name: 'サンプル物件',
        price: 50000000,
        location: '東京都渋谷区神宮前',
        structure: 'RC造',
        total_floor_area: 120.5,
        age: 10,
        distance_from_station: 5
      });
    }
    
    // OpenAI Vision APIを使用して画像から情報を抽出
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `以下の物件概要書（マイソク）の画像から物件情報を抽出し、JSON形式で返してください。

抽出する情報:
- name: 物件名（文字列）
- price: 価格（数値、単位は円）
- location: 所在地（文字列）
- structure: 構造（RC造、SRC造、鉄骨造、木造など）
- total_floor_area: 延床面積（数値、単位は㎡）
- age: 築年数（数値、単位は年）
- distance_from_station: 駅からの距離（数値、単位は分）

情報が読み取れない場合はnullを返してください。
レスポンスは必ず有効なJSON形式で、コードブロックなどの余計な記号は含めないでください。`
            },
            {
              type: 'image_url',
              image_url: {
                url: image
              }
            }
          ]
        }],
        max_tokens: 1000,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }
    
    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }
    
    // JSONをパース（コードブロックがある場合は除去）
    let extractedData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/```\n([\s\S]*?)\n```/) ||
                       content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content:', content);
      throw new Error('Failed to parse extracted data as JSON');
    }
    
    return c.json(extractedData);
  } catch (error) {
    console.error('OCR error:', error);
    console.warn('Falling back to mock data due to error');
    
    // エラー時はモックデータを返す（APIキー未設定や通信エラーなど）
    return c.json({
      name: 'サンプル物件',
      price: 50000000,
      location: '東京都渋谷区神宮前',
      structure: 'RC造',
      total_floor_area: 120.5,
      age: 10,
      distance_from_station: 5,
      _note: 'OpenAI API未設定のため、サンプルデータを表示しています'
    });
  }
});

/**
 * Health check
 */
api.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

/**
 * Property financial analysis endpoint
 */
api.post('/properties/analyze', async (c) => {
  try {
    const body = await c.req.json();
    
    const {
      propertyPrice,
      grossIncome,
      effectiveIncome,
      operatingExpenses,
      loanAmount,
      interestRate,
      loanTermYears,
      downPayment,
    } = body;
    
    // Validation
    if (!propertyPrice || !grossIncome || !effectiveIncome || !operatingExpenses) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Perform analysis
    const analysis = analyzeProperty({
      propertyPrice: parseFloat(propertyPrice),
      grossIncome: parseFloat(grossIncome),
      effectiveIncome: parseFloat(effectiveIncome),
      operatingExpenses: parseFloat(operatingExpenses),
      loanAmount: parseFloat(loanAmount || 0),
      interestRate: parseFloat(interestRate || 0),
      loanTermYears: parseInt(loanTermYears || 0),
      downPayment: parseFloat(downPayment || 0),
    });
    
    return c.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({ error: 'Analysis failed' }, 500);
  }
});

/**
 * Market analysis endpoint
 * 指定地域の市場動向分析
 */
api.post('/market/analyze', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { year, area, city } = body;
    
    if (!year) {
      return c.json({ error: 'Year is required' }, 400);
    }
    
    if (!area && !city) {
      return c.json({ error: 'Either area or city is required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const analysis = await client.analyzeMarket({
      year: parseInt(year),
      area,
      city,
    });
    
    return c.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    return c.json({ 
      error: 'Market analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Trade prices endpoint
 * 不動産取引価格情報を取得
 */
api.get('/market/trade-prices', async (c) => {
  try {
    const { env } = c;
    const year = c.req.query('year');
    const quarter = c.req.query('quarter');
    const area = c.req.query('area');
    const city = c.req.query('city');
    
    if (!year) {
      return c.json({ error: 'Year is required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const result = await client.getTradePrices({
      year: parseInt(year),
      quarter: quarter ? parseInt(quarter) : undefined,
      area,
      city,
    });
    
    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Trade prices error:', error);
    return c.json({ 
      error: 'Failed to fetch trade prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Land prices endpoint
 * 地価公示情報を取得
 */
api.get('/market/land-prices', async (c) => {
  try {
    const { env } = c;
    const year = c.req.query('year');
    const area = c.req.query('area');
    const division = c.req.query('division') || '00'; // デフォルト: 住宅地
    
    if (!year || !area) {
      return c.json({ error: 'Year and area are required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const result = await client.getLandPrices({
      year: parseInt(year),
      area,
      division,
    });
    
    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Land prices error:', error);
    return c.json({ 
      error: 'Failed to fetch land prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Municipalities endpoint
 * 都道府県内市区町村一覧を取得
 */
api.get('/market/municipalities', async (c) => {
  try {
    const { env } = c;
    const area = c.req.query('area');
    
    if (!area) {
      return c.json({ error: 'Area (prefecture code) is required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const result = await client.getMunicipalities(area);
    
    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Municipalities error:', error);
    return c.json({ 
      error: 'Failed to fetch municipalities',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Nearby comparables endpoint
 * 周辺取引事例を取得
 */
api.post('/market/comparables', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { city, propertyType, minArea, maxArea, limit } = body;
    
    if (!city) {
      return c.json({ error: 'City is required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const comparables = await client.getNearbyComparables({
      city,
      propertyType,
      minArea: minArea ? parseFloat(minArea) : undefined,
      maxArea: maxArea ? parseFloat(maxArea) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    
    return c.json({
      success: true,
      data: comparables,
      count: comparables.length,
    });
  } catch (error) {
    console.error('Comparables error:', error);
    return c.json({ 
      error: 'Failed to fetch comparables',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Price estimation endpoint
 * 物件価格を推定
 */
api.post('/market/estimate-price', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { city, area, propertyType, buildingYear } = body;
    
    if (!city || !area || !propertyType) {
      return c.json({ error: 'City, area, and propertyType are required' }, 400);
    }
    
    const client = new ReinfolibClient(env.REINFOLIB_API_KEY);
    const estimation = await client.estimatePrice({
      city,
      area: parseFloat(area),
      propertyType,
      buildingYear,
    });
    
    return c.json({
      success: true,
      estimation,
    });
  } catch (error) {
    console.error('Price estimation error:', error);
    return c.json({ 
      error: 'Failed to estimate price',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Properties list endpoint
 * GET /api/properties
 */
api.get('/properties', async (c) => {
  try {
    const { env, var: { user } } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const result = await env.DB.prepare(`
      SELECT * FROM properties 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      properties: result.results || [],
    });
  } catch (error) {
    console.error('Properties list error:', error);
    return c.json({ error: 'Failed to fetch properties' }, 500);
  }
});

/**
 * Property detail endpoint
 * GET /api/properties/:id
 */
api.get('/properties/:id', async (c) => {
  try {
    const { env, var: { user } } = c;
    const propertyId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get property
    const property = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ? AND user_id = ?
    `).bind(propertyId, user.id).first();
    
    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }
    
    // Get related data
    const [income, expenses, investment, analysis] = await Promise.all([
      env.DB.prepare('SELECT * FROM property_income WHERE property_id = ?').bind(propertyId).first(),
      env.DB.prepare('SELECT * FROM property_expenses WHERE property_id = ?').bind(propertyId).first(),
      env.DB.prepare('SELECT * FROM property_investment WHERE property_id = ?').bind(propertyId).first(),
      env.DB.prepare('SELECT * FROM analysis_results WHERE property_id = ? ORDER BY created_at DESC LIMIT 1').bind(propertyId).first(),
    ]);
    
    return c.json({
      success: true,
      property: {
        ...property,
        income,
        expenses,
        investment,
        analysis,
      },
    });
  } catch (error) {
    console.error('Property detail error:', error);
    return c.json({ error: 'Failed to fetch property' }, 500);
  }
});

/**
 * Property investigation endpoint (accident property check)
 * POST /api/properties/investigate
 */
api.post('/properties/investigate', async (c) => {
  try {
    const body = await c.req.json();
    const { address } = body;
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    // Import investigation utilities
    const { 
      searchAccidentProperty, 
      assessOverallRisk,
      generateInvestigationReport,
      
      
      
    } = await import('../lib/property-investigation');
    
    // Search for accident property info
    const accident = await searchAccidentProperty(address);
    
    // Mock data for urban planning (実際はGIS APIから取得)
    const urbanPlanning = {
      useDistrict: '第一種住居地域',
      buildingCoverageRatio: 60,
      floorAreaRatio: 200,
      firePreventionDistrict: '準防火地域',
      heightRestriction: null,
      scenicDistrictRestriction: null,
      districtPlanRestriction: null,
    };
    
    // Mock data for hazards (実際はハザードマップAPIから取得)
    const hazards = {
      floodRisk: 'low',
      floodDepth: null,
      landslideRisk: 'none',
      liquefactionRisk: 'medium',
      earthquakeRisk: 'low',
      tsunamiRisk: 'none',
    };
    
    // Mock data for roads
    const roads = {
      frontRoadType: '公道',
      frontRoadWidth: 6.0,
      roadSetbackRequired: false,
      setbackDistance: null,
    };
    
    const overallRisk = assessOverallRisk(hazards, accident, urbanPlanning);
    
    const result = {
      address,
      urbanPlanning,
      hazards,
      roads,
      accident,
      investigationDate: new Date().toISOString(),
      investigator: 'My Agent Analytics System',
      notes: ['自動調査システムによる結果です'],
      warnings: accident.hasAccident ? ['心理的瑕疵物件です。詳細は告知内容をご確認ください。'] : [],
      overallRisk,
    };
    
    const report = generateInvestigationReport(result);
    
    return c.json({
      success: true,
      investigation: result,
      report,
    });
  } catch (error) {
    console.error('Investigation error:', error);
    return c.json({ 
      error: 'Investigation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Price impact calculation endpoint
 * POST /api/properties/price-impact
 */
api.post('/properties/price-impact', async (c) => {
  try {
    const body = await c.req.json();
    const { basePrice, address } = body;
    
    if (!basePrice) {
      return c.json({ error: 'Base price is required' }, 400);
    }
    
    // Import investigation utilities
    const investigation = await import('../lib/property-investigation');
    const { 
      searchAccidentProperty, 
      calculatePriceImpact,
    } = investigation;
    
    // Get accident info
    const accident = await searchAccidentProperty(address || '');
    
    // Mock hazards
    const hazards = {
      floodRisk: 'low',
      floodDepth: null,
      landslideRisk: 'none',
      liquefactionRisk: 'medium',
      earthquakeRisk: 'low',
      tsunamiRisk: 'none',
    };
    
    const priceImpact = calculatePriceImpact(
      parseFloat(basePrice),
      accident,
      hazards
    );
    
    return c.json({
      success: true,
      priceImpact,
      accident,
      hazards,
    });
  } catch (error) {
    console.error('Price impact calculation error:', error);
    return c.json({ 
      error: 'Price impact calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Generate PDF report for property
 * GET /api/properties/:id/pdf
 */
api.get('/properties/:id/pdf', async (c) => {
  try {
    const { env, var: { user } } = c;
    const propertyId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get property
    const property = await env.DB.prepare(`
      SELECT * FROM properties WHERE id = ? AND user_id = ?
    `).bind(propertyId, user.id).first();
    
    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }
    
    // Import PDF generator
    const { generatePropertyReportHTML } = await import('../lib/pdf-generator');
    
    // Generate PDF HTML
    const html = generatePropertyReportHTML({
      id: property.id as string,
      address: property.address as string,
      price: property.price as number,
      area: property.area as number,
      buildingArea: property.building_area as number | undefined,
      landArea: property.land_area as number | undefined,
      yearBuilt: property.year_built as number | undefined,
      propertyType: property.property_type as '戸建て' | 'マンション' | '土地' | 'アパート',
      createdAt: property.created_at as string,
    });
    
    // Return HTML for browser print API
    return c.html(html);
  } catch (error) {
    console.error('PDF generation error:', error);
    return c.json({ error: 'Failed to generate PDF' }, 500);
  }
});

/**
 * Generate PDF report for investigation
 * POST /api/properties/investigation-pdf
 */
api.post('/properties/investigation-pdf', async (c) => {
  try {
    const body = await c.req.json();
    const { address } = body;
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    // Import utilities
    const { 
      searchAccidentProperty, 
      assessOverallRisk,
    } = await import('../lib/property-investigation');
    
    const { generateInvestigationReportHTML } = await import('../lib/pdf-generator');
    
    // Search for accident property info
    const accident = await searchAccidentProperty(address);
    
    // Mock data
    const urbanPlanning = {
      useDistrict: '第一種住居地域',
      buildingCoverageRatio: 60,
      floorAreaRatio: 200,
      firePreventionDistrict: '準防火地域',
    };
    
    const hazards = {
      floodRisk: 'low',
      landslideRisk: 'none',
      liquefactionRisk: 'medium',
    };
    
    const overallRisk = assessOverallRisk(hazards, accident, urbanPlanning);
    
    // Generate PDF HTML
    const html = generateInvestigationReportHTML({
      address,
      urbanPlanning,
      hazards,
      accident: {
        hasAccident: accident.hasAccident,
        accidentType: accident.accidentType || undefined,
        disclosureRequired: accident.disclosureRequired,
        priceImpact: accident.priceImpact,
      },
      investigationDate: new Date().toISOString(),
      investigator: 'My Agent Analytics System',
      overallRisk,
    });
    
    // Return HTML for browser print API
    return c.html(html);
  } catch (error) {
    console.error('PDF generation error:', error);
    return c.json({ error: 'Failed to generate PDF' }, 500);
  }
});

/**
 * Compare multiple properties
 * POST /api/properties/compare
 */
api.post('/properties/compare', async (c) => {
  try {
    const { env, var: { user } } = c;
    const body = await c.req.json();
    const { propertyIds } = body;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length < 2) {
      return c.json({ error: 'At least 2 property IDs are required' }, 400);
    }
    
    if (propertyIds.length > 5) {
      return c.json({ error: 'Maximum 5 properties can be compared at once' }, 400);
    }
    
    // Get properties
    const placeholders = propertyIds.map(() => '?').join(',');
    const properties = await env.DB.prepare(`
      SELECT * FROM properties 
      WHERE id IN (${placeholders}) AND user_id = ?
      ORDER BY price ASC
    `).bind(...propertyIds, user.id).all();
    
    if (!properties.results || properties.results.length === 0) {
      return c.json({ error: 'No properties found' }, 404);
    }
    
    // Calculate comparison metrics
    const comparison = properties.results.map((p: any) => {
      const pricePerM2 = p.area ? p.price / p.area : 0;
      const pricePerTsubo = p.land_area ? p.price / (p.land_area / 3.3058) : 0;
      const buildingAge = p.year_built ? new Date().getFullYear() - p.year_built : null;
      
      return {
        id: p.id,
        address: p.address,
        propertyType: p.property_type,
        price: p.price,
        area: p.area,
        buildingArea: p.building_area,
        landArea: p.land_area,
        yearBuilt: p.year_built,
        buildingAge,
        pricePerM2: Math.round(pricePerM2),
        pricePerTsubo: Math.round(pricePerTsubo),
        createdAt: p.created_at,
      };
    });
    
    // Find best values
    const bestPrice = Math.min(...comparison.map(p => p.price));
    const bestPricePerM2 = Math.min(...comparison.filter(p => p.pricePerM2 > 0).map(p => p.pricePerM2));
    const largestArea = Math.max(...comparison.map(p => p.area));
    const newestBuilding = Math.min(...comparison.filter(p => p.buildingAge !== null).map(p => p.buildingAge!));
    
    return c.json({
      success: true,
      comparison,
      bestValues: {
        bestPrice,
        bestPricePerM2,
        largestArea,
        newestBuilding,
      },
      summary: {
        totalProperties: comparison.length,
        averagePrice: Math.round(comparison.reduce((sum, p) => sum + p.price, 0) / comparison.length),
        priceRange: {
          min: bestPrice,
          max: Math.max(...comparison.map(p => p.price)),
        },
        averageArea: Math.round(comparison.reduce((sum, p) => sum + p.area, 0) / comparison.length),
      },
    });
  } catch (error) {
    console.error('Property comparison error:', error);
    return c.json({ error: 'Failed to compare properties' }, 500);
  }
});

/**
 * Generate PDF report for property comparison
 * POST /api/properties/comparison-pdf
 */
api.post('/properties/comparison-pdf', async (c) => {
  try {
    const { env, var: { user } } = c;
    const body = await c.req.json();
    const { propertyIds } = body;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return c.json({ error: 'Property IDs array is required' }, 400);
    }
    
    // Get properties
    const placeholders = propertyIds.map(() => '?').join(',');
    const properties = await env.DB.prepare(`
      SELECT * FROM properties 
      WHERE id IN (${placeholders}) AND user_id = ?
      ORDER BY price ASC
    `).bind(...propertyIds, user.id).all();
    
    if (!properties.results || properties.results.length === 0) {
      return c.json({ error: 'No properties found' }, 404);
    }
    
    // Import PDF generator
    const { generateComparisonReportHTML } = await import('../lib/pdf-generator');
    
    // Generate PDF HTML
    const html = generateComparisonReportHTML({
      properties: properties.results.map((p: any) => ({
        id: p.id,
        address: p.address,
        price: p.price,
        area: p.area,
        buildingArea: p.building_area,
        landArea: p.land_area,
        yearBuilt: p.year_built,
        propertyType: p.property_type,
        createdAt: p.created_at,
      })),
      comparisonDate: new Date().toISOString(),
      criteria: ['価格', '面積', '坪単価', '築年'],
    });
    
    // Return HTML for browser print API
    return c.html(html);
  } catch (error) {
    console.error('PDF generation error:', error);
    return c.json({ error: 'Failed to generate PDF' }, 500);
  }
});

/**
 * Agents Management APIs
 * AIエージェントの作成・更新・削除
 */

/**
 * List all agents
 * GET /api/agents
 */
api.get('/agents', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const result = await env.DB.prepare(`
      SELECT * FROM agents 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      agents: result.results || [],
    });
  } catch (error) {
    console.error('Agents list error:', error);
    return c.json({ error: 'Failed to fetch agents' }, 500);
  }
});

/**
 * Create new agent
 * POST /api/agents
 */
api.post('/agents', async (c) => {
  try {
    const { var: { user } } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { name, description, agent_type, config } = body;
    
    if (!name) {
      return c.json({ error: 'Agent name is required' }, 400);
    }
    
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO agents (id, user_id, name, description, agent_type, status, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      agentId,
      user.id,
      name,
      description || null,
      agent_type || 'analysis',
      config ? JSON.stringify(config) : null
    ).run();
    
    const agent = await c.env.DB.prepare(`
      SELECT * FROM agents WHERE id = ?
    `).bind(agentId).first();
    
    return c.json({
      success: true,
      agent,
    }, 201);
  } catch (error) {
    console.error('Agent creation error:', error);
    return c.json({ error: 'Failed to create agent' }, 500);
  }
});

/**
 * Get agent by ID
 * GET /api/agents/:id
 */
api.get('/agents/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const agentId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();
    
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    return c.json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error('Agent fetch error:', error);
    return c.json({ error: 'Failed to fetch agent' }, 500);
  }
});

/**
 * Update agent
 * PUT /api/agents/:id
 */
api.put('/agents/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const agentId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { name, description, agent_type, status, config } = body;
    
    // Check if agent exists and belongs to user
    const existing = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();
    
    if (!existing) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    await env.DB.prepare(`
      UPDATE agents 
      SET name = ?, description = ?, agent_type = ?, status = ?, config = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(
      name || existing.name,
      description !== undefined ? description : existing.description,
      agent_type || existing.agent_type,
      status || existing.status,
      config ? JSON.stringify(config) : existing.config,
      agentId,
      user.id
    ).run();
    
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ?
    `).bind(agentId).first();
    
    return c.json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error('Agent update error:', error);
    return c.json({ error: 'Failed to update agent' }, 500);
  }
});

/**
 * Delete agent
 * DELETE /api/agents/:id
 */
api.delete('/agents/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const agentId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if agent exists and belongs to user
    const existing = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();
    
    if (!existing) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    // Delete agent (CASCADE will delete executions)
    await env.DB.prepare(`
      DELETE FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).run();
    
    return c.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    console.error('Agent deletion error:', error);
    return c.json({ error: 'Failed to delete agent' }, 500);
  }
});

/**
 * Agent Executions Management APIs
 * エージェント実行履歴の管理
 */

/**
 * Get agent execution history
 * GET /api/agents/:id/executions
 */
api.get('/agents/:id/executions', async (c) => {
  try {
    const { var: { user }, env } = c;
    const agentId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify agent ownership
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agentId, user.id).first();
    
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    const executions = await env.DB.prepare(`
      SELECT * FROM agent_executions 
      WHERE agent_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(agentId, user.id).all();
    
    return c.json({
      success: true,
      executions: executions.results || [],
    });
  } catch (error) {
    console.error('Executions fetch error:', error);
    return c.json({ error: 'Failed to fetch executions' }, 500);
  }
});

/**
 * Get all agent executions for user
 * GET /api/executions
 */
api.get('/executions', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const executions = await env.DB.prepare(`
      SELECT e.*, a.name as agent_name 
      FROM agent_executions e
      LEFT JOIN agents a ON e.agent_id = a.id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();
    
    return c.json({
      success: true,
      executions: executions.results || [],
      limit,
      offset,
    });
  } catch (error) {
    console.error('Executions fetch error:', error);
    return c.json({ error: 'Failed to fetch executions' }, 500);
  }
});

/**
 * Create agent execution
 * POST /api/executions
 */
api.post('/executions', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { agent_id, property_id, execution_type, input_data } = body;
    
    if (!agent_id || !execution_type) {
      return c.json({ error: 'agent_id and execution_type are required' }, 400);
    }
    
    // Verify agent ownership
    const agent = await env.DB.prepare(`
      SELECT * FROM agents WHERE id = ? AND user_id = ?
    `).bind(agent_id, user.id).first();
    
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await env.DB.prepare(`
      INSERT INTO agent_executions (
        id, agent_id, user_id, property_id, execution_type, 
        input_data, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).bind(
      executionId,
      agent_id,
      user.id,
      property_id || null,
      execution_type,
      input_data ? JSON.stringify(input_data) : null
    ).run();
    
    const execution = await env.DB.prepare(`
      SELECT * FROM agent_executions WHERE id = ?
    `).bind(executionId).first();
    
    // Update agent last_used_at
    await env.DB.prepare(`
      UPDATE agents SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(agent_id).run();
    
    return c.json({
      success: true,
      execution,
    }, 201);
  } catch (error) {
    console.error('Execution creation error:', error);
    return c.json({ error: 'Failed to create execution' }, 500);
  }
});

/**
 * Update execution status
 * PUT /api/executions/:id
 */
api.put('/executions/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const executionId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { status, result_data, error_message, execution_time_ms } = body;
    
    // Verify execution ownership
    const existing = await env.DB.prepare(`
      SELECT * FROM agent_executions WHERE id = ? AND user_id = ?
    `).bind(executionId, user.id).first();
    
    if (!existing) {
      return c.json({ error: 'Execution not found' }, 404);
    }
    
    const completedAt = status === 'completed' || status === 'failed' 
      ? new Date().toISOString() 
      : null;
    
    await env.DB.prepare(`
      UPDATE agent_executions 
      SET status = ?, result_data = ?, error_message = ?, execution_time_ms = ?, completed_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      status || existing.status,
      result_data ? JSON.stringify(result_data) : existing.result_data,
      error_message || existing.error_message,
      execution_time_ms || existing.execution_time_ms,
      completedAt,
      executionId,
      user.id
    ).run();
    
    const execution = await env.DB.prepare(`
      SELECT * FROM agent_executions WHERE id = ?
    `).bind(executionId).first();
    
    return c.json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error('Execution update error:', error);
    return c.json({ error: 'Failed to update execution' }, 500);
  }
});

/**
 * Get execution by ID
 * GET /api/executions/:id
 */
api.get('/executions/:id', async (c) => {
  try {
    const { var: { user }, env } = c;
    const executionId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const execution = await env.DB.prepare(`
      SELECT e.*, a.name as agent_name 
      FROM agent_executions e
      LEFT JOIN agents a ON e.agent_id = a.id
      WHERE e.id = ? AND e.user_id = ?
    `).bind(executionId, user.id).first();
    
    if (!execution) {
      return c.json({ error: 'Execution not found' }, 404);
    }
    
    return c.json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error('Execution fetch error:', error);
    return c.json({ error: 'Failed to fetch execution' }, 500);
  }
});

/**
 * e-Stat API Endpoints
 * 政府統計データの取得
 */

/**
 * Get population data
 * POST /api/estat/population
 */
api.post('/estat/population', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { prefCode, cityCode } = body;

    if (!prefCode) {
      return c.json({ error: 'Prefecture code is required' }, 400);
    }

    // Check if e-Stat API key is configured
    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const data = await eStatClient.getPopulationData(prefCode, cityCode);

    return c.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Population data fetch error:', error);
    return c.json({
      error: 'Failed to fetch population data',
      details: error.message,
    }, 500);
  }
});

/**
 * Get economic indicators
 * POST /api/estat/economics
 */
api.post('/estat/economics', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { prefCode, cityCode } = body;

    if (!prefCode) {
      return c.json({ error: 'Prefecture code is required' }, 400);
    }

    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const data = await eStatClient.getEconomicIndicators(prefCode, cityCode);

    return c.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Economic indicators fetch error:', error);
    return c.json({
      error: 'Failed to fetch economic indicators',
      details: error.message,
    }, 500);
  }
});

/**
 * Get land price data
 * POST /api/estat/land-prices
 */
api.post('/estat/land-prices', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { prefCode, year } = body;

    if (!prefCode) {
      return c.json({ error: 'Prefecture code is required' }, 400);
    }

    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const data = await eStatClient.getLandPriceData(prefCode, year);

    return c.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Land price data fetch error:', error);
    return c.json({
      error: 'Failed to fetch land price data',
      details: error.message,
    }, 500);
  }
});

/**
 * Get comprehensive demographic analysis
 * POST /api/estat/demographics
 */
api.post('/estat/demographics', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { prefCode, cityCode } = body;

    if (!prefCode) {
      return c.json({ error: 'Prefecture code is required' }, 400);
    }

    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const analysis = await analyzeDemographics(eStatClient, prefCode, cityCode);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Demographics analysis error:', error);
    return c.json({
      error: 'Failed to analyze demographics',
      details: error.message,
    }, 500);
  }
});

/**
 * Get municipality list
 * GET /api/estat/municipalities?prefCode=13
 */
api.get('/estat/municipalities', async (c) => {
  try {
    const { env } = c;
    const prefCode = c.req.query('prefCode');

    if (!env.ESTAT_API_KEY || env.ESTAT_API_KEY.trim() === '') {
      return c.json({
        error: 'e-Stat API key not configured',
        message: 'e-Stat APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const eStatClient = new EStatClient({ apiKey: env.ESTAT_API_KEY });
    const data = await eStatClient.getMunicipalityList(prefCode);

    return c.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Municipality list fetch error:', error);
    return c.json({
      error: 'Failed to fetch municipality list',
      details: error.message,
    }, 500);
  }
});

/**
 * AI Market Analysis Endpoints
 * OpenAI GPT-4による市場分析
 */

/**
 * Analyze market with AI
 * POST /api/ai/analyze-market
 */
api.post('/ai/analyze-market', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { marketData, propertyData } = body;

    if (!marketData) {
      return c.json({ error: 'Market data is required' }, 400);
    }

    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
      return c.json({
        error: 'OpenAI API key not configured',
        message: 'OpenAI APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const analyzer = new AIMarketAnalyzer(env.OPENAI_API_KEY);
    const analysis = await analyzer.analyzeMarket(marketData, propertyData);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('AI market analysis error:', error);
    return c.json({
      error: 'Failed to analyze market',
      details: error.message,
    }, 500);
  }
});

/**
 * Analyze property with AI
 * POST /api/ai/analyze-property
 */
api.post('/ai/analyze-property', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { propertyData, marketData } = body;

    if (!propertyData) {
      return c.json({ error: 'Property data is required' }, 400);
    }

    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
      return c.json({
        error: 'OpenAI API key not configured',
        message: 'OpenAI APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const analyzer = new AIMarketAnalyzer(env.OPENAI_API_KEY);
    const analysis = await analyzer.analyzeProperty(propertyData, marketData);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('AI property analysis error:', error);
    return c.json({
      error: 'Failed to analyze property',
      details: error.message,
    }, 500);
  }
});

/**
 * Compare multiple properties with AI
 * POST /api/ai/compare-properties
 */
api.post('/ai/compare-properties', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const { properties } = body;

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return c.json({ error: 'Properties array is required' }, 400);
    }

    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
      return c.json({
        error: 'OpenAI API key not configured',
        message: 'OpenAI APIキーが設定されていません。管理者に連絡してください。',
      }, 503);
    }

    const analyzer = new AIMarketAnalyzer(env.OPENAI_API_KEY);
    const comparison = await analyzer.compareProperties(properties);

    return c.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    console.error('AI property comparison error:', error);
    return c.json({
      error: 'Failed to compare properties',
      details: error.message,
    }, 500);
  }
});

/**
 * Investment Simulation Endpoints
 * 投資シミュレーション機能
 */

/**
 * Run investment simulation
 * POST /api/simulate/investment
 */
api.post('/simulate/investment', async (c) => {
  try {
    const params = await c.req.json();

    // Validate required parameters
    const required = ['propertyPrice', 'downPayment', 'loanAmount', 'interestRate', 'loanTerm', 'monthlyRent'];
    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        return c.json({ error: `${field} is required` }, 400);
      }
    }

    const simulator = new InvestmentSimulator();
    const result = simulator.simulate(params);

    return c.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Investment simulation error:', error);
    return c.json({
      error: 'Failed to run simulation',
      details: error.message,
    }, 500);
  }
});

/**
 * Run scenario comparison
 * POST /api/simulate/scenarios
 */
api.post('/simulate/scenarios', async (c) => {
  try {
    const params = await c.req.json();

    const simulator = new InvestmentSimulator();
    const comparison = simulator.compareScenarios(params);

    return c.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    console.error('Scenario comparison error:', error);
    return c.json({
      error: 'Failed to compare scenarios',
      details: error.message,
    }, 500);
  }
});

/**
 * Run Monte Carlo risk analysis
 * POST /api/simulate/monte-carlo
 */
api.post('/simulate/monte-carlo', async (c) => {
  try {
    const body = await c.req.json();
    const { params, iterations = 1000 } = body;

    const simulator = new InvestmentSimulator();
    const analysis = simulator.runMonteCarloSimulation(params, iterations);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Monte Carlo simulation error:', error);
    return c.json({
      error: 'Failed to run Monte Carlo simulation',
      details: error.message,
    }, 500);
  }
});

/**
 * Data Export Endpoints
 * CSVデータエクスポート機能
 */

/**
 * Export properties to CSV
 * GET /api/export/properties
 */
api.get('/export/properties', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const properties = await env.DB.prepare(`
      SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC
    `).bind(user.id).all();
    
    const csv = exportPropertiesToCSV(properties.results || []);
    
    return createCSVDownloadResponse(csv, `properties_${Date.now()}.csv`);
  } catch (error: any) {
    console.error('Properties export error:', error);
    return c.json({
      error: 'Failed to export properties',
      details: error.message,
    }, 500);
  }
});

/**
 * Export analysis results to CSV
 * POST /api/export/analysis
 */
api.post('/export/analysis', async (c) => {
  try {
    const analysis = await c.req.json();
    const csv = exportAnalysisToCSV(analysis);
    
    return createCSVDownloadResponse(csv, `analysis_${Date.now()}.csv`);
  } catch (error: any) {
    console.error('Analysis export error:', error);
    return c.json({
      error: 'Failed to export analysis',
      details: error.message,
    }, 500);
  }
});

/**
 * Export simulation results to CSV
 * POST /api/export/simulation
 */
api.post('/export/simulation', async (c) => {
  try {
    const simulation = await c.req.json();
    const csv = exportSimulationToCSV(simulation);
    
    return createCSVDownloadResponse(csv, `simulation_${Date.now()}.csv`);
  } catch (error: any) {
    console.error('Simulation export error:', error);
    return c.json({
      error: 'Failed to export simulation',
      details: error.message,
    }, 500);
  }
});

/**
 * Export market analysis to CSV
 * POST /api/export/market
 */
api.post('/export/market', async (c) => {
  try {
    const { data } = await c.req.json();
    const csv = exportMarketAnalysisToCSV(data);
    
    return createCSVDownloadResponse(csv, `market_analysis_${Date.now()}.csv`);
  } catch (error: any) {
    console.error('Market export error:', error);
    return c.json({
      error: 'Failed to export market data',
      details: error.message,
    }, 500);
  }
});

/**
 * Export properties to Excel
 * GET /api/export/properties-excel
 */
api.get('/export/properties-excel', async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const properties = await env.DB.prepare(`
      SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC
    `).bind(user.id).all();
    
    const excel = exportPropertiesToExcel(properties.results || []);
    
    return createExcelDownloadResponse(excel, `properties_${Date.now()}.xlsx`);
  } catch (error: any) {
    console.error('Properties Excel export error:', error);
    return c.json({
      error: 'Failed to export properties to Excel',
      details: error.message,
    }, 500);
  }
});

/**
 * Export simulation results to Excel
 * POST /api/export/simulation-excel
 */
api.post('/export/simulation-excel', async (c) => {
  try {
    const simulation = await c.req.json();
    const excel = exportSimulationToExcel(simulation);
    
    return createExcelDownloadResponse(excel, `simulation_${Date.now()}.xlsx`);
  } catch (error: any) {
    console.error('Simulation Excel export error:', error);
    return c.json({
      error: 'Failed to export simulation to Excel',
      details: error.message,
    }, 500);
  }
});

/**
 * Report Sharing Endpoints
 * レポート共有機能
 */

/**
 * Create shared report link
 * POST /api/sharing/create
 */
api.post('/sharing/create', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { reportType, reportId, title, description, permission, password, expiresIn, maxAccessCount } = body;

    if (!reportType || !reportId) {
      return c.json({ error: 'reportType and reportId are required' }, 400);
    }

    // Calculate expiration date if expiresIn is provided (in hours)
    let expiresAt: Date | undefined;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
    }

    const result = await createSharedReport(env.DB, {
      userId: user.id,
      reportType,
      reportId,
      title,
      description,
      permission: permission || 'view',
      password,
      expiresAt,
      maxAccessCount,
    });

    // Generate full share URL
    const baseUrl = c.req.url.split('/api')[0];
    const fullShareUrl = `${baseUrl}${result.shareUrl}`;

    return c.json({
      success: true,
      shareToken: result.shareToken,
      shareUrl: fullShareUrl,
      sharedReport: result.sharedReport,
    }, 201);
  } catch (error: any) {
    console.error('Share creation error:', error);
    return c.json({
      error: 'Failed to create shared report',
      details: error.message,
    }, 500);
  }
});

/**
 * Get shared report
 * GET /api/sharing/:token
 */
api.get('/sharing/:token', async (c) => {
  try {
    const { env } = c;
    const token = c.req.param('token');
    const password = c.req.query('password');

    const verification = await verifySharedReportAccess(env.DB, token, password);

    if (!verification.valid) {
      return c.json({
        error: verification.reason,
        requiresPassword: verification.reason === 'Password required',
      }, verification.reason === 'Password required' ? 401 : 403);
    }

    // Log access
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent');
    await logSharedReportAccess(env.DB, token, ip, userAgent);

    return c.json({
      success: true,
      sharedReport: verification.report,
    });
  } catch (error: any) {
    console.error('Shared report access error:', error);
    return c.json({
      error: 'Failed to access shared report',
      details: error.message,
    }, 500);
  }
});

/**
 * Get user's shared reports
 * GET /api/sharing/my-shares
 */
api.get('/sharing/my-shares', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sharedReports = await getUserSharedReports(env.DB, user.id);

    return c.json({
      success: true,
      sharedReports,
    });
  } catch (error: any) {
    console.error('Get shared reports error:', error);
    return c.json({
      error: 'Failed to fetch shared reports',
      details: error.message,
    }, 500);
  }
});

/**
 * Update shared report
 * PUT /api/sharing/:token
 */
api.put('/sharing/:token', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const token = c.req.param('token');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingReport = await getSharedReport(env.DB, token);
    if (!existingReport || existingReport.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const body = await c.req.json();
    const { title, description, permission, isActive, expiresIn, maxAccessCount } = body;

    let expiresAt: Date | null | undefined;
    if (expiresIn !== undefined) {
      if (expiresIn === null) {
        expiresAt = null;
      } else {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresIn);
      }
    }

    const updatedReport = await updateSharedReport(env.DB, token, {
      title,
      description,
      permission,
      isActive,
      expiresAt,
      maxAccessCount,
    });

    return c.json({
      success: true,
      sharedReport: updatedReport,
    });
  } catch (error: any) {
    console.error('Update shared report error:', error);
    return c.json({
      error: 'Failed to update shared report',
      details: error.message,
    }, 500);
  }
});

/**
 * Delete shared report
 * DELETE /api/sharing/:token
 */
api.delete('/sharing/:token', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const token = c.req.param('token');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingReport = await getSharedReport(env.DB, token);
    if (!existingReport || existingReport.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    await deleteSharedReport(env.DB, token);

    return c.json({
      success: true,
      message: 'Shared report deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete shared report error:', error);
    return c.json({
      error: 'Failed to delete shared report',
      details: error.message,
    }, 500);
  }
});

/**
 * Get report by ID (for shared report display)
 * GET /api/reports/:reportId
 * This endpoint allows fetching report data without authentication
 * for use with shared report links
 */
api.get('/reports/:reportId', async (c) => {
  try {
    const { env } = c;
    const reportId = c.req.param('reportId');
    
    // Try to find the report in various tables
    // This is a simplified implementation - in production you would
    // determine the report type from the shared_reports table
    
    // Try properties table first
    const property = await env.DB.prepare(`
      SELECT 
        id,
        user_id,
        name,
        address,
        property_type,
        price,
        area,
        building_area,
        land_area,
        year_built,
        structure,
        distance_from_station,
        monthly_rent,
        occupancy_rate,
        annual_expenses,
        created_at,
        updated_at
      FROM properties 
      WHERE id = ?
    `).bind(reportId).first();
    
    if (property) {
      // Calculate analysis data
      const analysis = analyzeProperty({
        price: property.price || 0,
        monthlyRent: property.monthly_rent || 0,
        occupancyRate: property.occupancy_rate || 95,
        annualExpenses: property.annual_expenses || 0,
        loanAmount: property.price ? property.price * 0.8 : 0,
        interestRate: 2.0,
        loanYears: 30,
      });
      
      return c.json({
        id: property.id,
        reportId: property.id,
        reportType: 'property_analysis',
        name: property.name,
        address: property.address,
        propertyType: property.property_type,
        price: property.price,
        area: property.area,
        age: property.year_built ? new Date().getFullYear() - property.year_built : null,
        overallScore: Math.round((analysis.roi || 0) * 10),
        analysis: `
          <h3>物件分析結果</h3>
          <p><strong>想定利回り:</strong> ${analysis.grossYield?.toFixed(2)}%</p>
          <p><strong>実質利回り:</strong> ${analysis.netYield?.toFixed(2)}%</p>
          <p><strong>年間収支:</strong> ${(analysis.annualCashFlow || 0).toLocaleString()}円</p>
          <p><strong>ROI:</strong> ${analysis.roi?.toFixed(2)}%</p>
        `,
        createdAt: property.created_at,
      });
    }
    
    // If not found, return a generic not found response
    return c.json({ error: 'Report not found' }, 404);
    
  } catch (error: any) {
    console.error('Get report error:', error);
    return c.json({
      error: 'Failed to fetch report',
      details: error.message,
    }, 500);
  }
});

/**
 * Get access logs for shared report
 * GET /api/sharing/:token/logs
 */
api.get('/sharing/:token/logs', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const token = c.req.param('token');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingReport = await getSharedReport(env.DB, token);
    if (!existingReport || existingReport.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const logs = await getSharedReportAccessLogs(env.DB, token);

    return c.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Get access logs error:', error);
    return c.json({
      error: 'Failed to fetch access logs',
      details: error.message,
    }, 500);
  }
});

// ============================================================
// TEMPLATE MANAGEMENT ENDPOINTS
// ============================================================

/**
 * Create a new report template
 * POST /api/templates
 */
api.post('/templates', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name, description, category, isDefault, isPublic } = body;

    if (!name || !category) {
      return c.json({ error: 'Name and category are required' }, 400);
    }

    const template = await createTemplate(env.DB, {
      userId: user.id,
      name,
      description,
      category,
      isDefault,
      isPublic,
    });

    return c.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Create template error:', error);
    return c.json({
      error: 'Failed to create template',
      details: error.message,
    }, 500);
  }
});

/**
 * Get all templates for current user
 * GET /api/templates
 */
api.get('/templates', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');

    let templates;
    if (category) {
      templates = await getTemplatesByCategory(env.DB, user.id, category as any);
    } else {
      templates = await getUserTemplates(env.DB, user.id);
    }

    return c.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return c.json({
      error: 'Failed to fetch templates',
      details: error.message,
    }, 500);
  }
});

/**
 * Get public templates
 * GET /api/templates/public
 */
api.get('/templates/public', async (c) => {
  try {
    const { env } = c;

    const templates = await getPublicTemplates(env.DB);

    return c.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Get public templates error:', error);
    return c.json({
      error: 'Failed to fetch public templates',
      details: error.message,
    }, 500);
  }
});

/**
 * Get template by ID
 * GET /api/templates/:id
 */
api.get('/templates/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const template = await getTemplate(env.DB, templateId);

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Check if user has access (owner or public template)
    if (template.userId !== user.id && !template.isPublic) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Get template error:', error);
    return c.json({
      error: 'Failed to fetch template',
      details: error.message,
    }, 500);
  }
});

/**
 * Update template
 * PUT /api/templates/:id
 */
api.put('/templates/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingTemplate = await getTemplate(env.DB, templateId);
    if (!existingTemplate || existingTemplate.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const body = await c.req.json();
    const { name, description, category, isDefault, isPublic } = body;

    const updatedTemplate = await updateTemplate(env.DB, templateId, {
      name,
      description,
      category,
      isDefault,
      isPublic,
    });

    return c.json({
      success: true,
      template: updatedTemplate,
    });
  } catch (error: any) {
    console.error('Update template error:', error);
    return c.json({
      error: 'Failed to update template',
      details: error.message,
    }, 500);
  }
});

/**
 * Delete template
 * DELETE /api/templates/:id
 */
api.delete('/templates/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const existingTemplate = await getTemplate(env.DB, templateId);
    if (!existingTemplate || existingTemplate.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    await deleteTemplate(env.DB, templateId);

    return c.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete template error:', error);
    return c.json({
      error: 'Failed to delete template',
      details: error.message,
    }, 500);
  }
});

/**
 * Duplicate template
 * POST /api/templates/:id/duplicate
 */
api.post('/templates/:id/duplicate', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    // Check if template exists and is accessible
    const originalTemplate = await getTemplate(env.DB, templateId);
    if (!originalTemplate) {
      return c.json({ error: 'Template not found' }, 404);
    }

    if (originalTemplate.userId !== user.id && !originalTemplate.isPublic) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const newTemplate = await duplicateTemplate(env.DB, templateId, user.id, name);

    return c.json({
      success: true,
      template: newTemplate,
    });
  } catch (error: any) {
    console.error('Duplicate template error:', error);
    return c.json({
      error: 'Failed to duplicate template',
      details: error.message,
    }, 500);
  }
});

/**
 * Set template as default
 * POST /api/templates/:id/set-default
 */
api.post('/templates/:id/set-default', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await setDefaultTemplate(env.DB, templateId, user.id);

    return c.json({
      success: true,
      message: 'Template set as default',
    });
  } catch (error: any) {
    console.error('Set default template error:', error);
    return c.json({
      error: 'Failed to set default template',
      details: error.message,
    }, 500);
  }
});

/**
 * Get default template for category
 * GET /api/templates/default/:category
 */
api.get('/templates/default/:category', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const category = c.req.param('category');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const template = await getDefaultTemplate(env.DB, user.id, category as any);

    if (!template) {
      return c.json({ error: 'No default template found' }, 404);
    }

    return c.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Get default template error:', error);
    return c.json({
      error: 'Failed to fetch default template',
      details: error.message,
    }, 500);
  }
});

/**
 * Create a template section
 * POST /api/templates/:id/sections
 */
api.post('/templates/:id/sections', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const template = await getTemplate(env.DB, templateId);
    if (!template || template.userId !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const body = await c.req.json();
    const { title, contentType, content, displayOrder, isVisible, config } = body;

    if (!title || !contentType || !content || displayOrder === undefined) {
      return c.json({ error: 'Title, contentType, content, and displayOrder are required' }, 400);
    }

    const section = await createSection(env.DB, {
      templateId,
      title,
      contentType,
      content,
      displayOrder,
      isVisible,
      config,
    });

    return c.json({
      success: true,
      section,
    });
  } catch (error: any) {
    console.error('Create section error:', error);
    return c.json({
      error: 'Failed to create section',
      details: error.message,
    }, 500);
  }
});

/**
 * Get template sections
 * GET /api/templates/:id/sections
 */
api.get('/templates/:id/sections', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const templateId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify access
    const template = await getTemplate(env.DB, templateId);
    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    if (template.userId !== user.id && !template.isPublic) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const sections = await getTemplateSections(env.DB, templateId);

    return c.json({
      success: true,
      sections,
    });
  } catch (error: any) {
    console.error('Get sections error:', error);
    return c.json({
      error: 'Failed to fetch sections',
      details: error.message,
    }, 500);
  }
});

/**
 * Update template section
 * PUT /api/sections/:id
 */
api.put('/sections/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const sectionId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get section and verify template ownership
    const section = await env.DB.prepare(`
      SELECT ts.*, rt.user_id 
      FROM template_sections ts
      JOIN report_templates rt ON ts.template_id = rt.id
      WHERE ts.id = ?
    `).bind(sectionId).first();

    if (!section || section.user_id !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    const body = await c.req.json();
    const { title, contentType, content, displayOrder, isVisible, config } = body;

    const updatedSection = await updateSection(env.DB, sectionId, {
      title,
      contentType,
      content,
      displayOrder,
      isVisible,
      config,
    });

    return c.json({
      success: true,
      section: updatedSection,
    });
  } catch (error: any) {
    console.error('Update section error:', error);
    return c.json({
      error: 'Failed to update section',
      details: error.message,
    }, 500);
  }
});

/**
 * Delete template section
 * DELETE /api/sections/:id
 */
api.delete('/sections/:id', authMiddleware, async (c) => {
  try {
    const { var: { user }, env } = c;
    const sectionId = c.req.param('id');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get section and verify template ownership
    const section = await env.DB.prepare(`
      SELECT ts.*, rt.user_id 
      FROM template_sections ts
      JOIN report_templates rt ON ts.template_id = rt.id
      WHERE ts.id = ?
    `).bind(sectionId).first();

    if (!section || section.user_id !== user.id) {
      return c.json({ error: 'Not found or unauthorized' }, 404);
    }

    await deleteSection(env.DB, sectionId);

    return c.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete section error:', error);
    return c.json({
      error: 'Failed to delete section',
      details: error.message,
    }, 500);
  }
});

export default api;
