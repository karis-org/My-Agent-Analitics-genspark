// Authentication middleware for My Agent Analytics

import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Bindings, Variables } from '../types';
import { getSessionWithUser } from '../lib/db';

/**
 * Authentication middleware
 * Requires a valid session
 */
export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const sessionId = getCookie(c, 'session_id');
  
  if (!sessionId) {
    return c.redirect('/auth/login');
  }
  
  const result = await getSessionWithUser(c.env.DB, sessionId);
  
  if (!result) {
    return c.redirect('/auth/login');
  }
  
  // Set user and session in context
  c.set('user', result.user);
  c.set('session', result.session);
  
  await next();
}

/**
 * Optional authentication middleware
 * Loads user if session exists, but doesn't require it
 */
export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const sessionId = getCookie(c, 'session_id');
  
  if (sessionId) {
    const result = await getSessionWithUser(c.env.DB, sessionId);
    
    if (result) {
      c.set('user', result.user);
      c.set('session', result.session);
    }
  }
  
  await next();
}
