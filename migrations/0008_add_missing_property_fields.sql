-- Migration: Add missing fields to properties table
-- Created: 2024-11-06
-- Purpose: Fix comprehensive report functionality
-- Issue: #001 in CRITICAL_ERRORS.md

-- Add property_type field (investment or residential)
ALTER TABLE properties ADD COLUMN property_type TEXT DEFAULT 'residential';

-- Add land_area field (square meters)
ALTER TABLE properties ADD COLUMN land_area REAL;

-- Add registration_date field
ALTER TABLE properties ADD COLUMN registration_date TEXT;

-- Create index for property_type (for filtering)
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);

-- Comments:
-- property_type: 'investment' (収益用) or 'residential' (実需用)
-- land_area: 土地面積（㎡）- used for price per tsubo calculation
-- registration_date: 登記日 - used in comprehensive report detail section
