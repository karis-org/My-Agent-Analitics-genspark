/**
 * Security Middleware
 * Rate limiting and input validation
 */

import type { Context, Next } from 'hono';
import type { Bindings, Variables } from '../types';

/**
 * Simple in-memory rate limiter
 * For production, consider using Cloudflare KV or Durable Objects
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.limit - validRequests.length);
  }

  getResetTime(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return Date.now();
    return requests[0] + this.windowMs;
  }
}

// Rate limiters for different endpoints
const apiLimiter = new RateLimiter(100, 60000); // 100 requests per minute
const authLimiter = new RateLimiter(10, 60000); // 10 requests per minute
const aiLimiter = new RateLimiter(20, 60000); // 20 requests per minute

/**
 * Rate limiting middleware
 */
export function rateLimiter(type: 'api' | 'auth' | 'ai' = 'api') {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const limiter = type === 'auth' ? authLimiter : type === 'ai' ? aiLimiter : apiLimiter;
    
    // Use IP address as key (with user ID if authenticated)
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const user = c.get('user');
    const key = user ? `${user.id}` : ip;
    
    if (!limiter.check(key)) {
      const resetTime = new Date(limiter.getResetTime(key)).toISOString();
      return c.json({
        error: 'Too many requests',
        message: 'レート制限に達しました。しばらく待ってから再試行してください。',
        resetAt: resetTime,
      }, 429);
    }
    
    // Add rate limit headers
    c.header('X-RateLimit-Limit', String(limiter.limit));
    c.header('X-RateLimit-Remaining', String(limiter.getRemainingRequests(key)));
    c.header('X-RateLimit-Reset', String(limiter.getResetTime(key)));
    
    await next();
  };
}

/**
 * Input validation middleware
 */
export function validateInput(schema: {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
}) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const errors: string[] = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = body[field];

        // Check required fields
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }

        // Skip validation if field is not required and not provided
        if (!rules.required && (value === undefined || value === null)) {
          continue;
        }

        // Type validation
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }

        // String validations
        if (rules.type === 'string') {
          if (rules.min && value.length < rules.min) {
            errors.push(`${field} must be at least ${rules.min} characters`);
          }
          if (rules.max && value.length > rules.max) {
            errors.push(`${field} must be at most ${rules.max} characters`);
          }
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
          }
        }

        // Number validations
        if (rules.type === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`${field} must be at most ${rules.max}`);
          }
        }

        // Array validations
        if (rules.type === 'array') {
          if (rules.min !== undefined && value.length < rules.min) {
            errors.push(`${field} must have at least ${rules.min} items`);
          }
          if (rules.max !== undefined && value.length > rules.max) {
            errors.push(`${field} must have at most ${rules.max} items`);
          }
        }
      }

      if (errors.length > 0) {
        return c.json({
          error: 'Validation failed',
          details: errors,
        }, 400);
      }

      // Store validated body in context
      c.set('validatedBody' as any, body);
      
      await next();
    } catch (error) {
      return c.json({
        error: 'Invalid request body',
        details: 'Request body must be valid JSON',
      }, 400);
    }
  };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate property data
 */
export function validatePropertyData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('Property name is required');
  }

  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    errors.push('Price must be a positive number');
  }

  if (data.totalFloorArea !== undefined && (typeof data.totalFloorArea !== 'number' || data.totalFloorArea < 0)) {
    errors.push('Total floor area must be a positive number');
  }

  if (data.buildingAge !== undefined && (typeof data.buildingAge !== 'number' || data.buildingAge < 0)) {
    errors.push('Building age must be a positive number');
  }

  if (data.monthlyRent !== undefined && (typeof data.monthlyRent !== 'number' || data.monthlyRent < 0)) {
    errors.push('Monthly rent must be a positive number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate financial data
 */
export function validateFinancialData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const requiredFields = ['propertyPrice', 'grossIncome', 'operatingExpenses'];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`${field} is required`);
    } else if (typeof data[field] !== 'number' || data[field] < 0) {
      errors.push(`${field} must be a positive number`);
    }
  }

  if (data.interestRate !== undefined && (typeof data.interestRate !== 'number' || data.interestRate < 0 || data.interestRate > 100)) {
    errors.push('Interest rate must be between 0 and 100');
  }

  if (data.loanTerm !== undefined && (typeof data.loanTerm !== 'number' || data.loanTerm < 1 || data.loanTerm > 50)) {
    errors.push('Loan term must be between 1 and 50 years');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
