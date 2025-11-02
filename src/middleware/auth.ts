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

/**
 * Admin-only middleware
 * Requires a valid session with admin privileges (is_admin = 1)
 */
export async function adminMiddleware(
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
  
  // Check if user has admin privileges
  if (!result.user.is_admin) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>アクセス拒否 - My Agent Analytics</title>
          <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen">
          <div class="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
              <div class="text-red-500 text-6xl mb-4">
                  <i class="fas fa-ban"></i>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 mb-4">アクセスが拒否されました</h1>
              <p class="text-gray-600 mb-6">
                  このページは管理者専用です。<br>
                  アクセス権限がありません。
              </p>
              <a href="/dashboard" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                  ダッシュボードに戻る
              </a>
          </div>
      </body>
      </html>
    `, 403);
  }
  
  // Set user and session in context
  c.set('user', result.user);
  c.set('session', result.session);
  
  await next();
}
