// API routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { analyzeProperty } from '../lib/calculator';
import { ReinfolibClient } from '../lib/reinfolib';

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

export default api;
