// Type definitions for My Agent Analytics

export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  name: string;
  price: number;
  location: string | null;
  structure: string | null;
  total_floor_area: number | null;
  age: number | null;
  distance_from_station: number | null;
  has_elevator: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyIncome {
  id: string;
  property_id: string;
  average_rent: number | null;
  units: number | null;
  occupancy_rate: number | null;
  gross_income: number | null;
  effective_income: number | null;
  created_at: string;
}

export interface PropertyExpenses {
  id: string;
  property_id: string;
  management_fee: number | null;
  repair_cost: number | null;
  property_tax: number | null;
  insurance: number | null;
  other_expenses: number | null;
  created_at: string;
}

export interface PropertyInvestment {
  id: string;
  property_id: string;
  use_loan: boolean;
  loan_amount: number | null;
  interest_rate: number | null;
  loan_term: number | null;
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  property_id: string;
  noi: number | null;
  gross_yield: number | null;
  net_yield: number | null;
  dscr: number | null;
  ltv: number | null;
  monthly_cash_flow: string | null; // JSON array
  analysis_data: string | null; // JSON object
  created_at: string;
}

// Cloudflare Bindings
export interface Bindings {
  DB: D1Database;
  // KV: KVNamespace;
  // R2: R2Bucket;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  OPENAI_API_KEY: string;
  ESTAT_API_KEY: string;
  SESSION_SECRET: string;
}

// Context Variables
export interface Variables {
  user?: User;
  session?: Session;
}

// OAuth Response
export interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}
