// API routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { analyzeProperty } from '../lib/calculator';
import { 
  searchAccidentProperty, 
  assessOverallRisk,
  calculatePriceImpact,
  generateInvestigationReport,
  type PropertyInvestigationResult,
  type UrbanPlanningInfo,
  type HazardInfo,
  type RoadInfo
} from '../lib/property-investigation';

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Health check
 */
api.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * Property analysis endpoint
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
 * Property investigation endpoint
 */
api.post('/properties/investigate', async (c) => {
  try {
    const body = await c.req.json();
    const { address } = body;
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    // Search for accident property info
    const accident = await searchAccidentProperty(address);
    
    // Mock data for urban planning (実際はGIS APIから取得)
    const urbanPlanning: UrbanPlanningInfo = {
      useDistrict: '第一種住居地域',
      buildingCoverageRatio: 60,
      floorAreaRatio: 200,
      firePreventionDistrict: '準防火地域',
      heightRestriction: null,
      scenicDistrictRestriction: null,
      districtPlanRestriction: null,
    };
    
    // Mock data for hazards (実際はハザードマップAPIから取得)
    const hazards: HazardInfo = {
      floodRisk: 'low',
      floodDepth: null,
      landslideRisk: 'none',
      liquefactionRisk: 'medium',
      earthquakeRisk: 'low',
      tsunamiRisk: 'none',
    };
    
    // Mock data for roads
    const roads: RoadInfo = {
      frontRoadType: '公道',
      frontRoadWidth: 6.0,
      roadSetbackRequired: false,
      setbackDistance: null,
    };
    
    // Assess overall risk
    const overallRisk = assessOverallRisk(hazards, accident, urbanPlanning);
    
    // Generate warnings
    const warnings: string[] = [];
    if (accident.hasAccident) {
      warnings.push('心理的瑕疵があります。告知義務の確認が必要です。');
    }
    if (hazards.liquefactionRisk === 'high' || hazards.liquefactionRisk === 'medium') {
      warnings.push('液状化リスクがあります。地盤調査を推奨します。');
    }
    if (roads.frontRoadWidth < 4) {
      warnings.push('前面道路が4m未満です。再建築に制限がある可能性があります。');
    }
    
    const result: PropertyInvestigationResult = {
      address,
      urbanPlanning,
      hazards,
      roads,
      accident,
      investigationDate: new Date().toISOString().split('T')[0],
      investigator: 'システム自動調査',
      notes: [],
      warnings,
      overallRisk,
    };
    
    // Generate report
    const report = generateInvestigationReport(result);
    
    return c.json({
      success: true,
      result,
      report,
    });
  } catch (error) {
    console.error('Investigation error:', error);
    return c.json({ error: 'Investigation failed' }, 500);
  }
});

/**
 * Price impact calculation endpoint
 */
api.post('/properties/price-impact', async (c) => {
  try {
    const body = await c.req.json();
    const { basePrice, address } = body;
    
    if (!basePrice) {
      return c.json({ error: 'Base price is required' }, 400);
    }
    
    // Get accident info
    const accident = await searchAccidentProperty(address || '');
    
    // Mock hazards
    const hazards: HazardInfo = {
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
    });
  } catch (error) {
    console.error('Price impact calculation error:', error);
    return c.json({ error: 'Calculation failed' }, 500);
  }
});

/**
 * Get user's properties
 */
api.get('/properties', async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const properties = await c.env.DB
      .prepare('SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC')
      .bind(user.id)
      .all();
    
    return c.json({
      success: true,
      properties: properties.results || [],
    });
  } catch (error) {
    console.error('Get properties error:', error);
    return c.json({ error: 'Failed to fetch properties' }, 500);
  }
});

/**
 * Get property by ID
 */
api.get('/properties/:id', async (c) => {
  const user = c.get('user');
  const propertyId = c.req.param('id');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const property = await c.env.DB
      .prepare('SELECT * FROM properties WHERE id = ? AND user_id = ?')
      .bind(propertyId, user.id)
      .first();
    
    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }
    
    // Get related data
    const [income, expenses, investment, analysis] = await Promise.all([
      c.env.DB.prepare('SELECT * FROM property_income WHERE property_id = ?').bind(propertyId).first(),
      c.env.DB.prepare('SELECT * FROM property_expenses WHERE property_id = ?').bind(propertyId).first(),
      c.env.DB.prepare('SELECT * FROM property_investment WHERE property_id = ?').bind(propertyId).first(),
      c.env.DB.prepare('SELECT * FROM analysis_results WHERE property_id = ? ORDER BY created_at DESC LIMIT 1').bind(propertyId).first(),
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
    console.error('Get property error:', error);
    return c.json({ error: 'Failed to fetch property' }, 500);
  }
});

export default api;
