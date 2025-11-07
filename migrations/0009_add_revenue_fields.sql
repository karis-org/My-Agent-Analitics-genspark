-- Migration: Add revenue-related fields to properties table
-- Created: 2025-11-07
-- Purpose: Support investment property analysis with Chart.js visualizations
-- Phase 2 Feature: Comprehensive report charts

-- Add annual_income field (年間収入)
ALTER TABLE properties ADD COLUMN annual_income REAL DEFAULT 0;

-- Add monthly_rent field (月額賃料)
ALTER TABLE properties ADD COLUMN monthly_rent REAL DEFAULT 0;

-- Add annual_expense field (年間経費)
ALTER TABLE properties ADD COLUMN annual_expense REAL DEFAULT 0;

-- Add gross_yield field (表面利回り)
ALTER TABLE properties ADD COLUMN gross_yield REAL DEFAULT 0;

-- Add net_yield field (実質利回り)
ALTER TABLE properties ADD COLUMN net_yield REAL DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_annual_income ON properties(annual_income);
CREATE INDEX IF NOT EXISTS idx_properties_gross_yield ON properties(gross_yield);

-- Comments:
-- annual_income: 年間収入（円） - Used for yield calculations and charts
-- monthly_rent: 月額賃料（円） - Used for OCR auto-population and trend analysis
-- annual_expense: 年間経費（円） - Used for expense breakdown charts
-- gross_yield: 表面利回り（%） - Cached value for performance
-- net_yield: 実質利回り（%） - Cached value for performance
